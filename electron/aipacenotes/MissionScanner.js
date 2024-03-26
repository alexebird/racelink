import path from 'node:path'
import fs from 'node:fs'

class Mission {
  constructor(fname) {
    const pattern = /gameplay[\/\\]missions[\/\\]([^/\\]+)[\/\\]([^/\\]+)[\/\\]([^/\\]+)$/;
    const match = fname.match(pattern);

    if (match) {
      this.levelId = match[1]
      this.missionType = match[2]
      this.missionId = match[3]
    } else {
      console.error(`mission path ${fname} didnt match gameplay/missions/*`)
    }
    this.fname = fname
  }

  asIpcData() {
    return {
      fname: this.fname,
      levelId: this.levelId,
      missionType: this.missionType,
      missionId: this.missionId,
      fullId: this.fullId(),
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
    const searchPath = path.join(this.basePath, 'gameplay/missions')
    let fileList = []
    this._listFilesRecursively(searchPath, fileList, 1, 2)
    return fileList
  }

  _listFilesRecursively(dir, fileList, depth, maxDepth) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {

        if (depth <= maxDepth) {
          this._listFilesRecursively(filePath, fileList, depth+1, maxDepth);
        } else {
          // console.log(filePath)
          let mission = new Mission(filePath)
          fileList.push(mission)
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
