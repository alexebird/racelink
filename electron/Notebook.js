import fs from 'node:fs'
import path from 'node:path'

class Notebook {
  constructor(notebookPath) {
    this.notebookPath = notebookPath
    this.content = this._readNotebookFile()
  }

  _readNotebookFile() {
    try {
      const data = fs.readFileSync(this.notebookPath, 'utf8')
      return JSON.parse(data)
    } catch (err) {
      console.error('Error reading notebook file:', err)
      return null
    }
  }
}

export default Notebook
