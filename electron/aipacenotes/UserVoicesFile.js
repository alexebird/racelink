import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import _ from 'lodash'

// {
//   "german_female": {
//     "text_to_speech": {
//       "type": "gcp",
//       "language_code": "de-DE",
//       "voice_name": "de-DE-Neural2-A",
//       "dynamic_rate": {}
//     }
//   }
// }

export default class UserVoicesFile {
  constructor(filePath) {
    this.filePath = filePath
    this.data = {}
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
        console.error('Failed to load user.voices.json:', error);
        this.data = {}
      }
    } else {
      this.data = {}
    }
  }

  save() {
    try {
      const fileContent = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(this.filePath, fileContent, 'utf8');
      console.log(`wrote user.voices.json to ${this.filePath}`)
    } catch (error) {
      console.error('Failed to save user.voices.json:', error);
    }
  }

  update(newData) {
    this.data = newData
    this.save()
  }
}
