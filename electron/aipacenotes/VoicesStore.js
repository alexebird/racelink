import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import _ from 'lodash'

export default class VoiceStore {
  constructor() {
    const basePath = !app.isPackaged ? '.' : app.getPath('userData');
    this.filePath = path.join(basePath, 'voicesStore.json');
    this.data = { voices: []}
    this.load();
  }

  getData() {
    return this.data
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(fileContent);
      } catch (error) {
        console.error('Failed to load voices:', error);
        this.data = { voices: []}
      }
    } else {
      this.data = { voices: []}
    }
  }

  save() {
    try {
      const fileContent = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(this.filePath, fileContent, 'utf8');
      console.log(`wrote voices to ${this.filePath}`)
    } catch (error) {
      console.error('Failed to save voices:', error);
    }
  }

  update(newData) {
    this.data = newData || { voices: []}
    this.save()
  }
}
