import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import PQueue from 'p-queue'
const { v4: uuidv4 } = require('uuid')
import { MissionScanner } from './aipacenotes/MissionScanner'
import NotebookScanner from './aipacenotes/NotebookScanner'
import Notebook from './aipacenotes/Notebook'
import FlaskApiClient from './aipacenotes/FlaskApiClient'
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
    return path.join(app.getPath('home'), 'AppData', 'Local', 'BeamNG.drive', '0.31')
  }
}

const defaultSettings = {
  beamUserDir: defaultBeamUserDir(),
  autostopThreshold: isDevelopment ? 5 : 15,
  trimSilenceNoiseLevel: -40.0,
  trimSilenceMinSilenceDuration: 0.5,
  uuid: uuidv4(),
  versionString: `v${pkg.version}`,
  // windowSize: { width: 800, height: 600 },
  // notificationsEnabled: true
}

const queue = new PQueue({concurrency: 1});

const appSettings = new Settings('settings.json', defaultSettings)
appSettings.save()
const flaskClient = new FlaskApiClient(appSettings.get('uuid'))
const voiceManager = new VoiceManager(flaskClient)
const beamUserDir = new BeamUserDir(appSettings)
const scanner = new MissionScanner()
const inFlightMissions = new Set()
let audioFileStream = null
let audioFileFname = null
const tscHist = []
const UNKNOWN_PLACEHOLDER = '[unknown]';
// let lastQueueSize = 0
// let lastAudioPlayerPausedState = true
let lastNetworkError = null
const networkErrorDebounceSec = 5

function nowTs() {
  return Date.now()/1000
}

function createWindow() {
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
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

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

// function testNetwork() {
//   flaskClient.getHealthcheck().then(([resp, err]) => {
//     console.log(resp)
//   })
// }

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    // testNetwork()
  }
})

app.whenReady().then(() => {
  createWindow()
})

async function handleScannerScan(_event, _args) {
  scanner.configure({
    basePath: appSettings.get('beamUserDir'),
  })
  return scanner.scan()
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

async function missionGeneratePacenotes(_event, selectedMission) {
  if (!selectedMission) {
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

  // get all of the mission's notebooks
  const notebookScanner = new NotebookScanner(selectedMission.mission.fname)
  const files = notebookScanner.scan()

  if (!files) {
    // no notebooks found
    console.log(`no notebooks found for ${selectedMission.mission.fullId}`)
    return
  }

  inFlightMissions.add(selectedMission.mission.fname)

  // read all notebook files
  const notebooks = files.map((file) => {
    return new Notebook(file, beamUserDir.voices(), beamUserDir.staticPacenotes())
  })

  // collect pacenote updates across all notesbooks in the mission.
  const pacenotesToUpdate = notebooks.map(notebook => {
    return notebook.updatePacenotes()
  }).flat()

  const ipcNotebooks = notebooks.map((nb) => nb.toIpcData())

  if (win) {
    win.webContents.send('notebooks-updated', ipcNotebooks);
  }

  const promises = pacenotesToUpdate.map((pn) => {
    console.log('------------------------------------------------------')
    const audioFname = pn.audioFname()
    const noteName = pn.name()
    console.log(`${pn.joinedNote()}`)
    const voiceConfig = beamUserDir.voices()[pn.voice()]
    // const rv = executeCreatePacenoteAudio(notebooks, pn, voiceConfig, audioFname)

    return generateAudioFile(noteName, voiceConfig, audioFname).then((data) => {
      const [ok, audioLen] = data
      if (ok) {
        if (win) {
          win.webContents.send('notebooks-updated', ipcNotebooks);
        }
        storeMetadata(audioFname, audioLen, noteName)
      }
    })
  })

  Promise.allSettled(promises).then(results => {
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        // console.log(`Operation ${index + 1} succeeded.`);
      } else {
        console.error(`Operation ${index + 1} failed:`, result.reason);
      }
    });

    // Cleanup code here
    // console.log('All operations completed. Running cleanup code...');
    notebooks.forEach(nb => {
      nb.cleanUpAudioFiles()
    })

    inFlightMissions.delete(selectedMission.mission.fname)
  });
}

// function executeCreatePacenoteAudio(notebooks, pn, voiceConfig, audioFname) {
//   const req = flaskClient.postCreatePacenoteAudioB64(pn.name(), pn.joinedNote(), voiceConfig)
//     .then(([resp, err]) => {
//       if (err) {
//         console.error('error from postCreatePacenoteAudioB64', err)
//         lastNetworkError = nowTs()
//         return
//       }
//
//       lastNetworkError = null
//
//       // Assuming `resp` is the parsed JSON object from the Flask server
//       const audioContentBase64 = resp.file_content; // The property names should match your Flask response
//       const audioBuffer = Buffer.from(audioContentBase64, 'base64');
//       const noteName = resp.note_name;
//       const audioLen = resp.audio_length_sec;
//       console.log(`noteName: ${noteName}`)
//       console.log(`audioLen: ${audioLen}`)
//
//       fs.mkdirSync(path.dirname(audioFname), { recursive: true });
//       try {
//         fs.writeFileSync(audioFname, audioBuffer);
//         console.log(`File written successfully: ${audioFname}`);
//
//         const ipcNotebooks = notebooks.map((nb) => nb.toIpcData());
//         if (win) {
//           win.webContents.send('notebooks-updated', ipcNotebooks);
//         }
//       } catch (error) {
//         console.error('Error writing file:', error);
//       }
//
//       storeMetadata(audioFname, audioLen, pn.name())
//     })
//     .catch(error => {
//       console.error('error in postCreatePacenoteAudioB64', error);
//     });
//
//   return req
// }

// function onNetworkError(err) {
// }

async function generateAudioFile(text, voiceConfig, audioFname) {
  const [resp, err] = await flaskClient.postCreatePacenoteAudioB64('voice_test', text, voiceConfig)

  if (err) {
    console.error('error from postCreatePacenoteAudioB64', err)
    lastNetworkError = nowTs()
    return [false, null]
  } else {
    lastNetworkError = null
  }

  const audioContentBase64 = resp.file_content;
  const audioBuffer = Buffer.from(audioContentBase64, 'base64');
  const noteName = resp.note_name;
  const audioLen = resp.audio_length_sec;

  fs.mkdirSync(path.dirname(audioFname), { recursive: true });
  try {
    fs.writeFileSync(audioFname, audioBuffer);
    console.log(`generated audio file noteName='${noteName}' len=${audioLen}s fname=${audioFname}`)
    return [true, audioLen]
  } catch (error) {
    console.error('error writing file:', error);
    return [false, null]
  }
}

// function executeVoiceTest(text, voiceConfig, audioFname) {
//   const req = flaskClient.postCreatePacenoteAudioB64('voice_test', text, voiceConfig)
//     .then(([resp, err]) => {
//       const audioContentBase64 = resp.file_content;
//       const audioBuffer = Buffer.from(audioContentBase64, 'base64');
//       const noteName = resp.note_name;
//       // const audioLen = resp.audio_length_sec;
//       console.log(`noteName: ${noteName}`)
//       // console.log(`audioLen: ${audioLen}`)
//
//       fs.mkdirSync(path.dirname(audioFname), { recursive: true });
//       try {
//         fs.writeFileSync(audioFname, audioBuffer);
//         if (win) {
//           win.webContents.send('voiceTestFileReady', audioFname);
//         }
//       } catch (error) {
//         console.error('Error writing file for voice test:', error);
//       }
//     })
//     .catch(error => {
//       console.error('Error in executeVoiceTest postCreatePacenoteAudioB64', error);
//     });
//
//   return req
// }

function openRecordingFile() {
    audioFileFname = recordingFname()

    // Ensure there's no open stream already
    if (audioFileStream) {
      console.log('A file stream is already open. Closing it now without transcribe.');
      audioFileStream.end();
      audioFileStream = null;
    }

    audioFileStream = fs.createWriteStream(audioFileFname);

    audioFileStream.on('open', () => {
      console.log('File stream opened successfully.');
    });

    audioFileStream.on('error', (err) => {
      console.error('Error with file stream:', err);
    });
}

function closeRecordingFile() {
  if (audioFileStream) {
    audioFileStream.end(() => {
      console.log('File stream closed successfully.');
    });
    audioFileStream = null; // Reset the variable for future use
  } else {
    console.log('No open file stream to close.');
  }
}

function transcribeAudioFile(_event, cutId, selectedMission) {
  if (lastNetworkError && nowTs() - lastNetworkError < networkErrorDebounceSec) {
    console.log(`updates slowed due to network error.`)
    return
  }

  const fname = audioFileFname
  let noiseLevel = appSettings.get('trimSilenceNoiseLevel')
  let minSilenceDuration = appSettings.get('trimSilenceMinSilenceDuration')

  flaskClient.postTranscribe(fname, noiseLevel, minSilenceDuration).then(([resp, err]) => {
    if (err) {
      console.error('error from postCreatePacenoteAudioB64', err)
      lastNetworkError = nowTs()
      return
    }

    lastNetworkError = null

    if (resp.text === null) {
      resp.text = UNKNOWN_PLACEHOLDER
    }

    const filePath = path.join(selectedMission.mission.fname, 'aipacenotes', 'recce', 'primary', 'transcripts.json');

    tscHist.push(resp)
    if (tscHist.length > 2) {
      tscHist.shift()
    }
    const jsonLine = JSON.stringify({ cutId, resp }) + '\n';

    try {
      fs.appendFileSync(filePath, jsonLine, 'utf8');
      console.log('JSON line appended successfully');
    } catch (err) {
      console.error('Error appending to the file:', err);
    }

    win.webContents.send('transcribe-done', resp);

    // try {
    //   fs.unlinkSync(fname);
    //   console.log('File deleted successfully');
    // } catch (err) {
    //   console.error('Error deleting the file:', err);
    // }
  })
}

function deleteFileWithName(fname) {
  try {
    fs.unlinkSync(fname)
    console.log(`deleted: ${fname}`);
  } catch (err) {
    console.error('error deleting file:', err);
  }
}

function setupIPC() {
  ipcMain.handle('settingsGetAll', settingsGetAll)
  ipcMain.handle('settingsSet', settingsSet)
  ipcMain.handle('scannerScan', handleScannerScan)
  ipcMain.on('missionGeneratePacenotes', missionGeneratePacenotes)
  ipcMain.handle('openAudioFile', openAudioFile)
  ipcMain.on('writeAudioChunk', writeAudioChunk)
  ipcMain.handle('closeAudioFile', closeAudioFile)
  ipcMain.on('transcribeAudioFile', transcribeAudioFile)
  ipcMain.on('discardCurrentAudioRecordingFile', discardCurrentAudioRecordingFile)
  ipcMain.on('deleteFile', deleteFile)
  ipcMain.on('openFilePicker', openFilePicker)
  ipcMain.on('openFileExplorer', openFileExplorer)
  ipcMain.handle('loadModConfigFiles', loadModConfigFiles)

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

function openAudioFile(_event) {
  openRecordingFile()
  return true
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
}

function closeAudioFile(_event) {
  closeRecordingFile(audioFileFname)
}

function deleteFile(_event, fname) {
  deleteFileWithName(fname)
}

async function openFilePicker(event) {
  const lastPath = appSettings.get('beamUserDir')

  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    defaultPath: lastPath,
  });

  if (!result.canceled && result.filePaths.length > 0) {
    event.sender.send('directory-selected', result.filePaths[0])
  }
}

function openFileExplorer(event, dirname) {
  shell.openPath(dirname)
    .then((error) => {
      if (error) {
        console.error('An error occurred:', error)
      } else {
        console.log(`File Explorer opened at path: ${dirname}`)
      }
    })
}

async function loadModConfigFiles(_event) {
  await beamUserDir.load()
  return
}

async function refreshVoices(_event) {
  return await voiceManager.refreshVoices()
  // voiceManager.refreshVoices().then((data) => {
    // console.log(data)
    // event.sender.send('onVoicesRefreshed', data)
  // })
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
  // await executeVoiceTest(text, voiceConfig, audioFname)
  // win.webContents.send('onVoiceTestFileReady', audioFname)

  if (!voiceConfig) {
    return null
  }

  const [ok, _audioLen] = await generateAudioFile(text, voiceConfig, audioFname)
  if (ok) {
    // if (win) {
    //   win.webContents.send('voiceTestFileReady', audioFname);
    // }
    return audioFname
  } else {
    return null
  }
}

function setupExpressServer() {
  startServer({
    // onRecordingStart: () => {
    //   console.log('start recording from express')
    //   win.webContents.send('server-recording-start')
    // },
    // onRecordingStop: () => {
    //   console.log('stop recording from express')
    //   win.webContents.send('server-recording-stop')
    // },
    onRecordingCut: (cutReq) => {
      console.log('cut recording from express', cutReq)
      if (win)
        win.webContents.send('server-recording-cut', cutReq)
    },
    onGetTranscripts: (count) => {
      console.log('get transcripts', count)

      // fs.existsSync(this.audioFname())

      if (count === -1) {
        tscHist.pop()
        tscHist.pop()
      }

      // const transcripts = [{error: false, text: 'foo'}]
      return tscHist.toReversed()
    },
    // onRemoteAudioPlayFile: (audioFname) => {
    //   console.log('onRemoteAudioPlayFile', audioFname)
    //   if (win)
    //     win.webContents.send('server-remote-audio-play', audioFname)
    // },
    // onRemoteAudioReset: () => {
    //   console.log('onRemoteAudioReset')
    //   if (win)
    //     win.webContents.send('server-remote-audio-reset')
    // },
    // onRemoteAudioQueueSize: () => {
    //   // console.log('onRemoteAudioQueueSize')
    //   return {
    //     queueSize: lastQueueSize,
    //     paused: lastAudioPlayerPausedState,
    //   }
    // },
  })
}
