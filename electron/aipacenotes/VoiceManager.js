import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import _ from 'lodash'

// import log from 'electron-log/main'

function blankData() {
  return { voices: [] }
}

export default class VoiceManager {
  constructor(flaskClient) {
    // const basePath = !app.isPackaged ? '.' : app.getPath('userData')
    // const basePath = !app.isPackaged ? '.' : 'src/assets'
    // const basePath = 'src/assets'
    const basePath = app.isPackaged ? path.join(path.dirname(__dirname), 'dist/assets') : 'public/assets'
    this.filePath = path.join(basePath, 'voice-db.json')
    // console.log(this.filePath)
    // logging shows -> filePath: C:\Users\bird\AppData\Local\Programs\RaceLink\resources\app.asar\dist-electron\dist\assets\voice-db.json
    // log.info(`filePath: ${this.filePath}`)

    this.flaskClient = flaskClient
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
      console.log(`voice-db.json not found at ${this.filePath}`)
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
    let err = null
    if (!app.isPackaged) {
      console.log('updating voice db')
      const [resp, err2] = await this.flaskClient.getVoicesList()
      if (err2) {
        err = err2
      }
      const newData = resp
      this.update(newData)
    }
    return [this.data, err]
  }
}
