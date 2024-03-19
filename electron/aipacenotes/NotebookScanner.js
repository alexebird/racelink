import path from 'node:path'
import fs from 'node:fs'
import Notebook from './Notebook'

export default class NotebookScanner {
  constructor(beamUserDir, missionDir) {
    this.beamUserDir = beamUserDir
    this.missionDir = missionDir
    // this.allNotebooks = null
    this.notebooks = null
  }

  // getAllNotebooksAsIpcData() {
  //   if (!this.allNotebooks) {
  //     return null
  //   }
  //
  //   return this.allNotebooks.map((nb) => nb.toIpcData())
  // }

  getNotebooksAsIpcData() {
    if (!this.notebooks) {
      return null
    }

    const ipcNotebooks = this.notebooks.map((nb) => nb.toIpcData())
    return ipcNotebooks
  }

  cleanup() {
    if (!this.notebooks) {
      return
    }

    this.notebooks.forEach(notebook => {
      notebook.cleanUpAudioFiles()
    })
  }

  getUpdatesToDo() {
    this.readNotebooks()

    const pacenotesToUpdate = this.notebooks.map(notebook => {
      return notebook.updatePacenotes()
    }).flat()

    return pacenotesToUpdate
  }

  readNotebooks() {
    const files = this.findNotebookFiles()
    // console.log(files)

    if (!files) {
      // no notebooks found
      console.log(`no notebook files found for ${selectedMission.mission.fullId}`)
      return []
    }

    // read all notebook files
    this.notebooks = files.map((file) => {
      return new Notebook(file, this.beamUserDir.voices(), this.beamUserDir.staticPacenotes())
    })
  }

  findNotebookFiles() {
    const notebookPath = path.join(this.missionDir, 'aipacenotes', 'notebooks')
    // console.log(notebookPath)
    return this._listFiles(notebookPath)
  }

  _listFiles(dir) {
    const fileList = []

    if (!fs.existsSync(dir)) {
      console.error(`file doesnt exist: ${dir}`)
      return fileList
    }

    try {
      const files = fs.readdirSync(dir)

      files.forEach(file => {
        if (file.endsWith('.notebook.json')) {
          const filePath = path.join(dir, file)
          fileList.push(filePath)
        }
      });
    } catch (err) {
      console.error(`error scanning directory: `, err)
    }

    return fileList
  }
}
