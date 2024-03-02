import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { MissionScanner } from './aipacenotes/MissionScanner'
import NotebookScanner from './aipacenotes/NotebookScanner'
import Notebook from './aipacenotes/Notebook'
import FlaskApiClient from './aipacenotes/FlaskApiClient'
import BeamUserDir from './aipacenotes/BeamUserDir'
import readFileFromZip from './aipacenotes/Zip'
import startServer from './server'
import Settings from './Settings'

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

let win = null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

const isDevelopment = !app.isPackaged
const defaultSettings = {
  beamUserDir: path.join(app.getPath('appData'), 'Local', 'BeamNG.drive', '0.31'),
  autostopThreshold: isDevelopment ? 5 : 30,
  // windowSize: { width: 800, height: 600 },
  // notificationsEnabled: true
}

const appSettings = new Settings('settings.json', defaultSettings)
const beamUserDir = new BeamUserDir(appSettings)
const scanner = new MissionScanner()
const flaskClient = new FlaskApiClient()
const inFlightMissions = new Set()
let audioFileStream = null
let audioFileFname = null

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
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  setupIPC()

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

      fs.existsSync(this.audioFname())

      if (count === -1) {
        tscHist.pop()
        tscHist.pop()
      }

      // const transcripts = [{error: false, text: 'foo'}]
      return tscHist.toReversed()
    }
  })
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
    testNetwork()
  }
})

async function handleScannerConfigure(_event, config) {
  scanner.configure(config)
}

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

async function handleMissionGeneratePacenotes(_event, selectedMission) {
  if (!selectedMission) {
    return
  }

  if (inFlightMissions.has(selectedMission.mission.fname)) {
    console.log(`mission already being updated: ${selectedMission.mission.fname}`)
    return
  }

  inFlightMissions.add(selectedMission.mission.fname)

  const nb = new NotebookScanner(selectedMission.mission.fname)
  const files = nb.scan()

  if (files) {
    const notebooks = files.map((file) => {
      return new Notebook(file, beamUserDir.voices(), beamUserDir.staticPacenotes())
    })

    const updates = notebooks.map(notebook => {
      return notebook.updatePacenotes()
    }).flat()

    const ipcNotebooks = notebooks.map((nb) => nb.toIpcData())
    if (win)
      win.webContents.send('notebooks-updated', ipcNotebooks);

    const promises = updates.map(pn => {
      console.log('------------------------------------------------------')
      const audioFname = pn.audioFname()
      console.log(pn.joinedNote())
      console.log(audioFname)

      const voiceConfig = beamUserDir.voices()[pn.voice()]

      return flaskClient.postCreatePacenoteAudio(pn.name(), pn.joinedNote(), voiceConfig)
        .then((resp) => {
          fs.mkdirSync(path.dirname(audioFname), { recursive: true });

          try {
            resp = Buffer.from(resp)
            fs.writeFileSync(audioFname, resp);
            console.log(`File written successfully: ${audioFname}`);

            const ipcNotebooks = notebooks.map((nb) => nb.toIpcData())
            if (win)
              win.webContents.send('notebooks-updated', ipcNotebooks);
          } catch (error) {
            console.error('Error writing file:', error);
          }
        })
        .catch(error => {
          console.error('error creating parent dirs for pacenote file', error)
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
}

function openAudioFile() {
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

function closeAudioFile() {
  if (audioFileStream) {
    audioFileStream.end(() => {
      console.log('File stream closed successfully.');
    });
    audioFileStream = null; // Reset the variable for future use
  } else {
    console.log('No open file stream to close.');
  }
}

const tscHist = []
const UNKNOWN_PLACEHOLDER = '[unknown]';

function transcribeAudio(fname, cutId, selectedMission) {
  flaskClient.postTranscribe(fname).then((resp) => {
    if (resp.text === null) {
      resp.text = UNKNOWN_PLACEHOLDER
    }

    const filePath = path.join(selectedMission.mission.fname, 'aipacenotes', 'transcripts', 'primary', 'transcripts.json');

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

    // console.log(selectedMission);
    // console.log(cutId);
    // console.log(resp);

    win.webContents.send('transcribe-done', resp);

    // try {
    //   fs.unlinkSync(fname);
    //   console.log('File deleted successfully');
    // } catch (err) {
    //   console.error('Error deleting the file:', err);
    // }
  });
}

function discardAudio(fname) {
  // try {
  //   fs.unlinkSync(fname)
  //   console.log('File deleted successfully');
  // } catch (err) {
  //   console.error('Error deleting the file:', err);
  // }
}

function setupIPC() {
  ipcMain.handle('settings:getAll', (_event) => {
    return appSettings.settings
  });

  ipcMain.handle('settings:set', (_event, key, value) => {
    console.log(`setting ${key} to ${value}`)
    appSettings.set(key, value)
    return appSettings.settings
  });

  ipcMain.handle('scanner:scan', handleScannerScan)
  ipcMain.on('mission:generate-pacenotes', handleMissionGeneratePacenotes)

  ipcMain.handle('open-audio-file', (_event) => {
    openAudioFile()
    return true
  });

  ipcMain.on('write-audio-chunk', (event, audioChunk) => {
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
  });

  ipcMain.handle('close-audio-file', () => {
    closeAudioFile()
    return
  });

  ipcMain.on('transcribe-audio-file', (_event, cutId, selectedMission) => {
    transcribeAudio(audioFileFname, cutId, selectedMission)
  });

  ipcMain.on('discard-audio-file', (_event) => {
    discardAudio(audioFileFname)
  });

  ipcMain.on('open-file-picker', async (event) => {
    const lastPath = appSettings.get('beamUserDir');

    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      defaultPath: lastPath,
    });

    if (!result.canceled && result.filePaths.length > 0) {
      event.sender.send('directory-selected', result.filePaths[0]);
    }
  });

  ipcMain.handle('load-mod-configs', async (_event) => {
    await beamUserDir.load()
    return
  });
}

function testNetwork() {
  flaskClient.getHealthcheck().then((resp) => {
    console.log(resp)
  })
}

app.whenReady().then(() => {
  createWindow()

  // const zipFilePath = 'test/data/aipacenotes.zip';
  // const targetFileName = 'gitsha.txt';
  // readFileFromZip(zipFilePath, targetFileName);
})
