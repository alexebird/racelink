import path from 'node:path'
import fs from 'node:fs'

export default class NotebookScanner {
  constructor(missionPath) {
    this.basePath = missionPath
  }

  scan() {
    if (!this.basePath) return null
    return this._listFiles(this.basePath)
  }

  _listFiles(dir) {
    const fileList = []
    try {
      const files = fs.readdirSync(dir)

      files.forEach(file => {
        if (file.endsWith('.notebook.json')) {
          const filePath = path.join(dir, file)
          fileList.push(filePath)
        }
      });
    } catch (err) {
      console.error('Error scanning directory:', err)
    }

    return fileList
  }
}
