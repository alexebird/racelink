import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import _ from 'lodash'

function blankData() {
  return { voices: [] }
}

export default class VoiceManager {
  constructor(flaskClient) {
    const basePath = !app.isPackaged ? '.' : app.getPath('userData')
    this.flaskClient = flaskClient
    this.filePath = path.join(basePath, 'voice-db.json')
    this.data = blankData()
    this.load()
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
        this.data = blankData()
      }
    } else {
      this.data = blankData()
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
    this.data = newData || blankData()
    this.save()
  }

  async refreshVoices() {
    const [resp, err] = await this.flaskClient.getVoicesList()
    const newData = resp
    this.update(newData)
    return [newData, err]
  }
}
