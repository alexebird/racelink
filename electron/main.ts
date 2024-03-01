import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { MissionScanner } from './aipacenotes/MissionScanner'
import NotebookScanner from './aipacenotes/NotebookScanner'
import Notebook from './aipacenotes/Notebook'
import FlaskApiClient from './aipacenotes/FlaskApiClient'
import readFileFromZip from './aipacenotes/Zip'
import startServer from './server'

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


let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

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
  win.webContents.openDevTools();
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
      win.webContents.send('server-recording-cut', cutReq)
    },
    onGetTranscripts: (count) => {
      console.log('get transcripts', count)
      const isRecording = false
      const transcripts = [{error: false, text: 'foo'}]
      return [isRecording, transcripts]
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

const scanner = new MissionScanner()

async function handleScannerConfigure(_event, config) {
  scanner.configure(config)
}

async function handleScannerScan(_event, _args) {
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

async function handleMissionGeneratePacenotes(_event, args) {
  const mission = args.mission
  if (mission) {
    // console.log(mission)
    const nb = new NotebookScanner(mission.fname)
    const files = nb.scan()
    if (files) {
      const notebooks = files.map((f) => new Notebook(f))
      // console.log(notebooks)
      // notebooks[0].updatePacenotes()
    }
  }
}

let audioFileStream = null;
let audioFileFname = null;

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

function transcribeAudio(fname, cutId) {
  flaskClient.postTranscribe(fname).then((resp) => {
    // try {
    //   fs.unlinkSync(fname)
    //   console.log('File deleted successfully');
    // } catch (err) {
    //   console.error('Error deleting the file:', err);
    // }

    console.log(resp)
    win.webContents.send('transcribe-done', resp)
  })
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
  ipcMain.on('scanner:configure', handleScannerConfigure)
  ipcMain.handle('scanner:scan', handleScannerScan)
  ipcMain.on('mission:generate-pacenotes', handleMissionGeneratePacenotes)

  // ipcMain.on('save-audio', (event, audioBuffer, filename) => {
  //   fs.mkdirSync('out', { recursive: true })
  //   const filePath = path.join('out', filename)
  //   // const filePath = path.join(app.getPath('desktop'), filename)
  //
  //   fs.writeFile(filePath, Buffer.from(audioBuffer), (err) => {
  //     if (err) {
  //       console.log('Error saving the file: ', err);
  //       event.reply('save-audio-response', 'failure');
  //     } else {
  //       console.log(`wrote file: ${filePath}`);
  //       event.reply('save-audio-response', 'success');
  //     }
  //   });
  // });

  ipcMain.handle('open-audio-file', (event) => {
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

  // ipcMain.on('cut-recording', (event) => {
  //   if (audioFileStream) {
  //     audioFileStream.end(() => {
  //       console.log('cut: File stream closed successfully.');
  //       transcribeAudio(audioFileFname)
  //       openAudioFile()
  //     });
  //     audioFileStream = null; // Reset the variable for future use
  //   } else {
  //     console.log('No open file stream to close.');
  //   }
  //
  // })

  ipcMain.on('transcribe-audio-file', (cutId) => {
    transcribeAudio(audioFileFname, cutId)
  });

  ipcMain.on('discard-audio-file', () => {
    discardAudio(audioFileFname)
  });
}

let flaskClient = new FlaskApiClient()

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
