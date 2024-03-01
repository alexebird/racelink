import path from 'node:path'
import fs from 'node:fs'

class Mission {
  constructor(fname, levelId, missionType, missionId) {
    this.fname = fname
    this.levelId = levelId
    this.missionType = missionType
    this.missionId = missionId
  }

  asIpcData() {
    return {
      fname: this.fname,
      levelId: this.levelId,
      missionType: this.missionType,
      missionId: this.missionId,
    }
  }

  fullId() {
    return `${this.levelId}/${this.missionType}/${this.missionId}`
  }
}

class MissionScanner {
  constructor() {
    this.basePath = null
  }

  configure(conf) {
    // console.log(`configuring scanner with ${JSON.stringify(conf)}`)
    this.basePath = conf.basePath
  }

  scan() {
    if (!this.basePath) return null
    return this._listFilesRecursively(this.basePath)
  }

  _listFilesRecursively(dir, fileList = []) {
    const pattern = /gameplay[\/\\]missions[\/\\]([^/\\]+)[\/\\]([^/\\]+)[\/\\]([^/\\]+)$/;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      // console.log(filePath)

      if (fs.statSync(filePath).isDirectory()) {
        this._listFilesRecursively(filePath, fileList);
        const match = filePath.match(pattern);

        if (match) {
          let mission = new Mission(filePath, match[1], match[2], match[3])
          fileList.push(mission.asIpcData())
        }
      }
    });

    return fileList;
  }
}

export {
  MissionScanner,
  Mission
}
