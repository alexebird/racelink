import { app, Menu, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import PQueue from 'p-queue'
const { v4: uuidv4 } = require('uuid')
import { MissionScanner } from './aipacenotes/MissionScanner'
import NotebookScanner from './aipacenotes/NotebookScanner'
import ResultsManager from './aipacenotes/ResultsManager'
import FlaskApiClient from './aipacenotes/FlaskApiClient'
import RacerApiClient from './aipacenotes/RacerApiClient'
import BeamUserDir from './aipacenotes/BeamUserDir'
import UserVoicesFile from './aipacenotes/UserVoicesFile'
import startServer from './server'
import Settings from './Settings'
import VoiceManager from './aipacenotes/VoiceManager'
import { storeMetadata } from './aipacenotes/MetadataManager'


// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

const pkg = require(path.join(__dirname, '../package.json'));

let win = null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

const isDevelopment = !app.isPackaged

function defaultBeamUserDir() {
  if (process.platform === 'darwin') {
    return '/Users/bird/beamng/code/racelink/test/data'
  } else {
    return path.join(app.getPath('home'), 'AppData', 'Local', 'BeamNG.drive', '0.34')
  }
}

// console.log(path.join(app.getPath('home'), 'AppData', 'Local', 'BeamNG.drive', '0.32'))

const defaultSettings = {
  beamUserDir: defaultBeamUserDir(),
  racelinkPath: null,
  autostopThreshold: 20,
  trimSilenceNoiseLevel: -40.0,
  trimSilenceMinSilenceDuration: 0.5,
  uuid: uuidv4(),
  versionString: isDevelopment ? `dev` : pkg.version,
  lastSelectedMission: null,
  racerApiKey: null,
  // windowSize: { width: 800, height: 600 },
  // notificationsEnabled: true
}

// if (process.env['RACELINK_PATH'] !== undefined) {
  // defaultSettings['devRoot'] = path.join(app.getPath('home'), 'beamng', 'game')
  // defaultSettings['racelinkPath'] = process.env['RACELINK_PATH']
  // console.log(`found RACELINK_PATH: ${defaultSettings['racelinkPath']}`)
// }

const queue = new PQueue({concurrency: 1});

const appSettings = new Settings('settings.json', defaultSettings)
appSettings.save()
const flaskClient = new FlaskApiClient(appSettings.get('racerApiKey'), appSettings.get('uuid'))
const racerClient = new RacerApiClient(appSettings.get('racerApiKey'), appSettings.get('uuid'))
const beamUserDir = new BeamUserDir(appSettings)
const voiceManager = new VoiceManager(flaskClient, beamUserDir)
const missionScanner = new MissionScanner()
const resultsManager = new ResultsManager(beamUserDir, racerClient, appSettings)
const inFlightMissions = new Set()
let audioFileStream = null
let audioFileFname = null
const tscHist = []
const UNKNOWN_PLACEHOLDER = '[unknown]';
// let lastQueueSize = 0
// let lastAudioPlayerPausedState = true
let lastNetworkError = null
const networkErrorDebounceSec = 5
let cachedFileHashes = null
let lastMissionId = null

function nowTs() {
  return Date.now()/1000
}

function createWindow() {
  if (!isDevelopment) {
    Menu.setApplicationMenu(null)
  }

  // session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  //   callback({
  //     responseHeaders: {
  //       ...details.responseHeaders,
  //       'Content-Security-Policy': ['default-src \'none\'']
  //     }
  //   })
  // })

  win = new BrowserWindow({
    width: 1800,
    height: 1200,
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
    webPreferences: {
      backgroundThrottling: false,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  beamUserDir.load()
  setupIPC()
  setupExpressServer()

  // Test active push message to Renderer-process.
  // win.webContents.on('did-finish-load', () => {
  //   win?.webContents.send('main-process-message', (new Date).toLocaleString())
  // })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
  //   // win.loadFile('dist/index.html')
    win.loadFile(path.join(process.env.DIST, 'index.html'))
  }

  // Open the DevTools.
  if (isDevelopment) {
    win.webContents.openDevTools();
  }

  // the main process drives the polling behavior
  setInterval(() => {
    win.webContents.send('tick')
    // console.log('tick')
    resultsManager.onTick()
  }, 1000)
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
})

function logNote(noteText, msg, fn=console.log) {
  const hash = crypto.createHash('sha1')
  hash.update(noteText)
  const digest = hash.digest('hex')
  const short = digest.substring(0,4)
  msg = `[${short}] ${msg}`
  fn(msg)
}

function scanMissions(_event) {
  beamUserDir.load()
  inFlightMissions.clear()
  missionScanner.configure({
    basePath: appSettings.get('beamUserDir'),
  })
  const missions = missionScanner.scan()
  return missions.map((mission) => mission.asIpcData())
}

function recordingFname() {
  const dname = 'out'
  const randomString = crypto.randomBytes(4).toString('hex')
  const fname = `recording-${randomString}.webm`
  fs.mkdirSync(dname, { recursive: true })
  const outputFile = path.join(dname, fname)
  console.log(`outputFile is ${outputFile}`)
  return outputFile
}

function setsEqual(setA, setB) {
  if (setA.size !== setB.size) return false;
  for (const item of setA) {
    if (!setB.has(item)) return false;
  }
  return true;
}

function sendIpcNotebooks(notebookScanner) {
  if (win) {
    const notebooks = notebookScanner.getNotebooksAsIpcData()

    // Collect all notebook file hashes into a set
    // const fileHashes = new Set();
    // if (notebooks) {
    //   notebooks.forEach(notebook => {
    //     if (notebook.fileHash) {
    //       fileHashes.add(notebook.fileHash);
    //     }
    //   });
    // }
    
    // Only send if the set of hashes is different from the cached one
    // if (!cachedFileHashes || !setsEqual(fileHashes, cachedFileHashes)) {
      // cachedFileHashes = new Set(fileHashes);
      win.webContents.send('notebooksUpdated', notebooks);
    // }
  }
}

function sendToastNotice(severity, summary, detail) {
  const life = 1000
  const notice = {severity, summary, detail, life}  
  win.webContents.send('toastNotice', notice);
}

async function missionGeneratePacenotes(_event, selectedMission) {
  if (selectedMission) {
    if (selectedMission.mission.fullId !== lastMissionId) {
      lastMissionId = selectedMission.mission.fullId
      cachedFileHashes = null
    }
    appSettings.set('lastSelectedMission', selectedMission.mission.fullId)
  } else {
    appSettings.set('lastSelectedMission', null)
    return
  }

  if (inFlightMissions.has(selectedMission.mission.fname)) {
    console.log(`mission already being updated: ${selectedMission.mission.fullId}`)
    return
  }

  if (lastNetworkError && nowTs() - lastNetworkError < networkErrorDebounceSec) {
    console.log(`updates slowed due to network error.`)
    return
  }

  inFlightMissions.add(selectedMission.mission.fname)

  const notebookScanner = new NotebookScanner(beamUserDir, selectedMission.mission.fname)
  const pacenotesToUpdate = notebookScanner.getUpdatesToDo().slice(0, 1); // do N at a time
  sendIpcNotebooks(notebookScanner)

  const promises = pacenotesToUpdate.map((pn) => {
    const audioFname = pn.audioFname()
    const noteName = pn.name()
    const noteText = pn.joinedNote()
    // const voiceConfig = beamUserDir.voices()[pn.voice()]
    const voiceConfig = voiceManager.getVoiceConfig(pn.voice())

    if (!voiceConfig) {
      sendToastNotice("error", "Voice Not Found", `Voice '${pn.voice()}' not found. Make sure you can find it in the Voices tab.`)
      return Promise.resolve("skipped")
    }

    const noteParams = pn.metadata()
    logNote(noteText, `updating note: '${noteText}' noteName='${noteName}'`)

    if (noteText === null || noteText.length === 0) {
      return Promise.resolve("skipped")
    } else {
      return generateAudioFile(noteName, noteParams, noteText, voiceConfig, audioFname).then((data) => {
        const [ok, audioLen] = data
        if (ok) {
          storeMetadata(audioFname, audioLen, noteName)
          sendIpcNotebooks(notebookScanner)
        }
      })
    }
  })

  Promise.allSettled(promises).then(results => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Operation ${index + 1} succeeded.`)
      } else {
        console.error(`pacenote update failed:`, result.reason)
      }
    })

    // Cleanup code here
    notebookScanner.cleanup()
    inFlightMissions.delete(selectedMission.mission.fname)
  })
}

async function generateAudioFile(noteName, noteParams, noteText, voiceConfig, audioFname) {
  const [resp, err] = await flaskClient.postCreatePacenoteAudioB64(noteName, noteParams, noteText, voiceConfig)

  if (err) {
    console.error('error from postCreatePacenoteAudioB64', err)
    lastNetworkError = nowTs()
    return [false, null]
  } else {
    lastNetworkError = null
  }

  const audioContentBase64 = resp.file_content;
  const audioBuffer = Buffer.from(audioContentBase64, 'base64');
  const audioLen = resp.audio_length_sec;

  fs.mkdirSync(path.dirname(audioFname), { recursive: true });
  try {
    fs.writeFileSync(audioFname, audioBuffer);
    logNote(noteText,`generated audio: '${noteText}' noteName='${noteName}' len=${audioLen}s`)// fname=${audioFname}`)
    return [true, audioLen]
  } catch (error) {
    console.error('error writing file:', error);
    return [false, null]
  }
}

async function transcribeAudioFile(_event, cutId, selectedMission) {
  if (lastNetworkError && nowTs() - lastNetworkError < networkErrorDebounceSec) {
    console.log(`updates slowed due to network error.`)
    return null
  }

  const fname = audioFileFname
  let noiseLevel = appSettings.get('trimSilenceNoiseLevel')
  let minSilenceDuration = appSettings.get('trimSilenceMinSilenceDuration')

  tscHist.push({error: false, loading: true, text: "[...]"})
  if (tscHist.length > 2) {
    tscHist.shift()
  }

  const [resp, err] = await flaskClient.postTranscribe(fname, noiseLevel, minSilenceDuration)

  if (err) {
    console.error('error from postCreatePacenoteAudioB64', err)
    lastNetworkError = nowTs()
    return null
  }

  lastNetworkError = null

  if (resp.text === null) {
    resp.text = UNKNOWN_PLACEHOLDER
  }

  const filePath = path.join(selectedMission.mission.fname, 'rally', 'recce', 'primary', 'transcripts.json');

  const last = tscHist.pop()
  tscHist.push(resp)

  const jsonLine = JSON.stringify({ cutId, resp }) + '\n';

  try {
    fs.appendFileSync(filePath, jsonLine, 'utf8');
    console.log('JSON line appended successfully');
  } catch (err) {
    console.error('Error appending to the file:', err);
  }

  deleteFileWithName(fname)

  return resp
}

function deleteFileWithName(fname) {
  try {
    fs.unlinkSync(fname)
    console.log(`deleted file: ${fname}`);
  } catch (err) {
    console.error('error deleting file:', err);
  }
}

function setupIPC() {
  ipcMain.handle('settingsGetAll', settingsGetAll)
  ipcMain.handle('settingsSet', settingsSet)
  ipcMain.handle('scanMissions', scanMissions)
  ipcMain.on('missionGeneratePacenotes', missionGeneratePacenotes)
  ipcMain.handle('openRecordingFile', openRecordingFile)
  ipcMain.on('writeAudioChunk', writeAudioChunk)
  ipcMain.handle('closeAudioFile', closeAudioFile)
  ipcMain.handle('transcribeAudioFile', transcribeAudioFile)
  ipcMain.on('discardCurrentAudioRecordingFile', discardCurrentAudioRecordingFile)
  ipcMain.on('regeneratePacenote', regeneratePacenote)

  ipcMain.handle('selectDirectory', selectDirectory)
  ipcMain.on('openFileExplorer', openFileExplorer)
  ipcMain.on('openExternal', openExternal)
  // ipcMain.handle('loadModConfigFiles', loadModConfigFiles)

  // Voice tab
  ipcMain.handle('refreshVoices', refreshVoices)
  ipcMain.handle('getVoiceManagerData', getVoiceManagerData)
  ipcMain.handle('getUserVoices', getUserVoices)
  ipcMain.handle('setUserVoices', setUserVoices)
  ipcMain.handle('testVoice', testVoice)
}

function settingsGetAll(_event) {
  return { settings: appSettings.settings, defaults: defaultSettings }
}

function settingsSet(_event, key, value) {
  console.log(`setting ${key} to ${value}`)
  appSettings.set(key, value)
  return appSettings.settings
}

function openRecordingFile(_event) {
  // Ensure there's no open stream already
  if (audioFileStream) {
    console.log('A file stream is already open. Closing it now without transcribe.');
    closeAudioFile()
    // audioFileStream.end();
    // audioFileStream = null;
  }

  audioFileFname = recordingFname()
  audioFileStream = fs.createWriteStream(audioFileFname);

  audioFileStream.on('open', () => {
    console.log('File stream opened successfully.');
  });

  audioFileStream.on('error', (err) => {
    console.error('Error with file stream:', err);
  });
}

function writeAudioChunk(event, audioChunk) {
  if (!audioFileStream) {
    console.error('File stream is not open. Cannot write audio chunk.');
    return;
  }

  // Write the chunk to the file
  audioFileStream.write(Buffer.from(audioChunk), (err) => {
    console.log(`wrote audio to ${audioFileFname}: ${audioChunk.byteLength}b`);
    // console.log(audioChunk);
    if (err) {
      console.error('Error writing audio chunk:', err);
    }
  });
}

function discardCurrentAudioRecordingFile(_event) {
  deleteFileWithName(audioFileFname)
  while (tscHist.length > 0) {
    tscHist.pop()
  }
}

function closeAudioFile(_event) {
  if (audioFileStream) {
    audioFileStream.end(() => {
      console.log('File stream closed successfully.');
    });
    audioFileStream = null; // Reset the variable for future use
  } else {
    console.log('No open file stream to close.');
  }
}

function regeneratePacenote(_event, selectedMission, fname) {
  deleteFileWithName(fname)

  if (selectedMission) {
    const notebookScanner = new NotebookScanner(beamUserDir, selectedMission.mission.fname)
    notebookScanner.readNotebooks()
    sendIpcNotebooks(notebookScanner)
  }
}

async function selectDirectory(_event) {
  const lastPath = appSettings.get('beamUserDir')

  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    defaultPath: lastPath,
  })

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0]
  } else {
    return null
  }
}

function openFileExplorer(_event, dirname) {
  shell.openPath(dirname)
    .then((error) => {
      if (error) {
        console.error('An error occurred:', error)
      } else {
        console.log(`File Explorer opened at path: ${dirname}`)
      }
    })
}

function openExternal(_event, url) {
  shell.openExternal(url)
    .then((error) => {
      if (error) {
        console.error('An error occurred:', error)
      } else {
        console.log(`File Explorer opened at path: ${url}`)
      }
    })
}

async function refreshVoices(_event) {
  return await voiceManager.refreshVoices()
}

async function getVoiceManagerData(_event) {
  return voiceManager.getData()
}

async function getUserVoices(_event) {
  const userVoices = new UserVoicesFile(beamUserDir.userVoicesFile())
  return userVoices.getData()
}

async function setUserVoices(_event, data) {
  const userVoices = new UserVoicesFile(beamUserDir.userVoicesFile())
  userVoices.update(data)
}

async function testVoice(_event, voiceConfig, text) {
  const audioFname = beamUserDir.voiceTestAudioFname()

  if (!voiceConfig) {
    return null
  }

  if (text !== null && text.length > 0) {
    const [ok, _audioLen] = await generateAudioFile('voice_test', {}, text, voiceConfig, audioFname)
    if (ok) {
      return audioFname
    } else {
      return null
    }
  }

  return null
}

function setupExpressServer() {
  startServer({
    onRecordingCut: (cutReq) => {
      console.log('cut recording from express', cutReq)
      if (win) {
        win.webContents.send('serverRecordingCut', cutReq)
      }
    },
    onGetTranscripts: (count) => {
      // console.log('get transcripts', count)
      if (count === -1) {
        tscHist.pop()
        tscHist.pop()
      }
      return tscHist.toReversed()
    },
  })
}
