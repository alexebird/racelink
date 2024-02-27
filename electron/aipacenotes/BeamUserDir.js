const AdmZip = require('adm-zip');
const fs = require('fs');

class BeamUserDir {
  constructor(beamDir) {
    this.beamDir = beamDir;
    this.searchPaths = [
      `${beamDir}/mods/repo/aipacenotes.zip/settings/aipacenotes/default.voices.json`,
      `${beamDir}/mods/aipacenotes.zip/settings/aipacenotes/default.voices.json`,
      `${beamDir}/mods/unpacked/aipacenotes/settings/aipacenotes/default.voices.json`,
      `${beamDir}/settings/aipacenotes/user.voices.json`,
    ];
  }

  readFileFromZip(zipFilePath, internalPath) {
    try {
      const zip = new AdmZip(zipFilePath);
      const zipEntry = zip.getEntry(internalPath);
      if (zipEntry) {
        return zipEntry.getData().toString('utf8');
      }
    } catch (error) {
      console.error('Error reading from zip file:', error);
    }
    return null;
  }

  readFileNormally(filePath) {
    try {
      return fs.readFileSync(filePath, { encoding: 'utf8' });
    } catch (error) {
      console.error('Error reading file:', error);
    }
    return null;
  }

  mergeJsonContents(contents) {
    return contents.reduce((acc, content) => {
      if (content) {
        const json = JSON.parse(content);
        return { ...acc, ...json };
      }
      return acc;
    }, {});
  }

  async loadAndMergeJson() {
    const contents = await Promise.all(this.searchPaths.map(path => {
      if (path.includes('.zip/')) {
        const [zipPath, internalPath] = path.split('.zip/').map((part, index) => index === 0 ? `${part}.zip` : part);
        return this.readFileFromZip(zipPath, internalPath);
      } else {
        return this.readFileNormally(path);
      }
    }));

    const mergedJson = this.mergeJsonContents(contents.filter(content => content !== null));
    return mergedJson;
  }
}

export default BeamUserDir
