const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

export default class BeamUserDir {
  constructor(beamDir) {
    this.beamDir = beamDir;
    this.searchPaths = [
      `${beamDir}/mods/repo/aipacenotes.zip/settings/aipacenotes/default.voices.json`,
      `${beamDir}/mods/aipacenotes.zip/settings/aipacenotes/default.voices.json`,
      `${beamDir}/mods/unpacked/aipacenotes/settings/aipacenotes/default.voices.json`,
      `${beamDir}/mods/unpacked/beamng-aipacenotes-mod/settings/aipacenotes/default.voices.json`,
      `${beamDir}/settings/aipacenotes/user.voices.json`,
    ];
  }

  readFileFromZip(zipFilePath, internalPath) {
    zipFilePath = path.normalize(zipFilePath)
    console.log(`reading zip file: ${zipFilePath}`)

    if (!fs.existsSync(zipFilePath)) {
      console.error('File does not exist:', zipFilePath);
      return null;
    }

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
    filePath = path.normalize(filePath)
    console.log(`reading normal file: ${filePath}`)

    if (!fs.existsSync(filePath)) {
      console.error('File does not exist:', filePath);
      return null;
    }

    try {
      return fs.readFileSync(filePath, { encoding: 'utf8' });
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
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

  async loadAndMergeVoices() {
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
