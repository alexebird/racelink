import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { MissionScanner } from './aipacenotes/MissionScanner'
import NotebookScanner from './aipacenotes/NotebookScanner'
import Notebook from './aipacenotes/Notebook'
import readFileFromZip from './aipacenotes/Zip'

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

// const { session } = require('electron')

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

const scanner = new MissionScanner()

async function handleScannerConfigure(_event, config) {
  scanner.configure(config)
}

async function handleScannerScan(event, _args) {
  return scanner.scan()
}

async function handleMissionGeneratePacenotes(event, args) {
  const mission = args.mission
  if (mission) {
    // console.log(mission)
    const nb = new NotebookScanner(mission.fname)
    const files = nb.scan()
    const notebooks = files.map((f) => new Notebook(f))
    console.log(notebooks)
    notebooks[0].updatePacenotes()
  }
}

function setupIPC() {
  ipcMain.on('scanner:configure', handleScannerConfigure)
  ipcMain.handle('scanner:scan', handleScannerScan)
  ipcMain.on('mission:generate-pacenotes', handleMissionGeneratePacenotes)
}

app.whenReady().then(() => {
  createWindow()

  // Example usage
  const zipFilePath = 'test/data/aipacenotes.zip';
  const targetFileName = 'gitsha.txt';

  // Read and print the content of the specific file
  readFileFromZip(zipFilePath, targetFileName);
})
