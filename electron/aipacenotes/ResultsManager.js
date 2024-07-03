import path from 'node:path'
import fs from 'node:fs'
import Notebook from './Notebook'

class ResultsFile {
  constructor(resultsManager, fname) {
    this.resultsManager = resultsManager
    this.fname = fname
  }

  async upload() {
    // const res = await this.resultsManager.racerClient.getHealthcheck()
    // console.log(res.statusText, res.data)

    try {
      const fileContents = fs.readFileSync(this.fname, { encoding: 'utf8' });
      const res = await this.resultsManager.racerClient
        .postCreateResult(this.fname, fileContents)
      console.log(res.status, res.data)
      if (res.status === 201) {
        fs.renameSync(this.fname, `${this.fname}.done`);
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }
}

export default class ResultsManager {
  constructor(beamUserDir, racerClient, settings) {
    this.beamUserDir = beamUserDir
    this.racerClient = racerClient
    this.settings = settings
    this.locked = false // this is not for concurrency, just debouncing.
  }

  lock() {
    this.locked = true
  }

  unlock() {
    this.locked = false
  }

  async onTick() {
    if (this.locked) {
      return
    }
    this.lock()
    await this.uploadResults()
    await this.writeTickStatus()
    this.unlock()
  }

  async uploadResults() {
    const files = this.beamUserDir.resultsFiles()

    files.forEach(async (fname) => {
      const resultsFile = new ResultsFile(this, fname)
      await resultsFile.upload()
    })

  }

  async writeTickStatus() {
    const timestamp = new Date().toISOString()
    const state = {
      last_tick_at: timestamp,
      version: this.settings.get('versionString'),
    }
    const dir = this.beamUserDir.racelinkDir()
    const filePath = `${dir}/tick.json`
    const jsonString = JSON.stringify(state)
    fs.writeFileSync(filePath, jsonString, 'utf8')
  }
}
