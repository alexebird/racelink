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
    if (!this.notebooks || !this.notebooks.length) {
      return
    }

    try {
      this.notebooks.forEach(notebook => {
        if (!notebook) return;
        
        try {
          notebook.cleanUpAudioFiles()
        } catch (err) {
          console.error('Error cleaning up audio files:', err)
        }
      })
    } catch (err) {
      console.error('Error in cleanup:', err)
    }
  }

  getUpdatesToDo() {
    this.readNotebooks()
    
    // Make sure notebooks exists before trying to map over it
    if (!this.notebooks || !this.notebooks.length) {
      return []
    }

    try {
      const pacenotesToUpdate = this.notebooks.map(notebook => {
        if (!notebook) return []
        // Ensure updatePacenotes returns an array, even if there's an error
        try {
          const updates = notebook.updatePacenotes()
          return updates || []
        } catch (err) {
          console.error('Error updating pacenotes:', err)
          return []
        }
      }).flat()

      return pacenotesToUpdate
    } catch (err) {
      console.error('Error in getUpdatesToDo:', err)
      return []
    }
  }

  readNotebooks() {
    const files = this.findNotebookFiles()
    // console.log(files)

    if (!files || !files.length) {
      // no notebooks found
      console.log(`no notebook files found for ${this.missionDir}`)
      this.notebooks = []
      return
    }

    // read all notebook files
    this.notebooks = files.map((file) => {
      return new Notebook(file, this.beamUserDir.voices())
    })
  }

  findNotebookFiles() {
    const notebookPath = path.join(this.missionDir, 'rally', 'notebooks')
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
