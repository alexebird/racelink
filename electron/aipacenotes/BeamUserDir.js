const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = 'settings/rally'

export default class BeamUserDir {
  constructor(appSettings) {
    this.appSettings = appSettings
    this.cachedVoices = null
    this.cachedStaticPacenotes = null
  }

  voices() {
    return this.cachedVoices
  }

  staticPacenotes() {
    return this.cachedStaticPacenotes
  }

  load() {
    this.cachedVoices = this.loadAndMergeVoices()
    this.cachedStaticPacenotes = this.loadStaticPacenotes()
  }

  userVoicesFile() {
    const beamDir = this.appSettings.get('beamUserDir')
    return `${beamDir}/${SETTINGS_PATH}/user.voices.json`
  }

  voiceTestAudioFname() {
    const beamDir = this.appSettings.get('beamUserDir')
    return `${beamDir}/temp/aipacenotes/voice_test.ogg`
  }

  resultsFiles() {
    const beamDir = this.appSettings.get('beamUserDir')
    const dir = `${beamDir}/${SETTINGS_PATH}/results`

    const fileList = []

    if (!fs.existsSync(dir)) {
      // console.error(`file doesnt exist: ${dir}`)
      return fileList
    }

    try {
      const files = fs.readdirSync(dir)

      files.forEach(file => {
        if (file.endsWith('.txt')) {
          const filePath = path.join(dir, file)
          fileList.push(filePath)
        }
      });
    } catch (err) {
      console.error(`error scanning directory: `, err)
    }

    return fileList
  }

  racelinkDir() {
    const beamDir = this.appSettings.get('beamUserDir')

    const dir = `${beamDir}/${SETTINGS_PATH}/racelink`
    fs.mkdirSync(dir, {recursive: true})

    return dir
  }

  _voiceSearchPaths() {
    const beamDir = this.appSettings.get('beamUserDir')
    const racelinkPath = this.appSettings.get('racelinkPath')

    const paths = [
      `${beamDir}/mods/repo/aipacenotes.zip/${SETTINGS_PATH}/default.voices.json`,
      `${beamDir}/mods/aipacenotes.zip/${SETTINGS_PATH}/default.voices.json`,
      `${beamDir}/mods/unpacked/aipacenotes/${SETTINGS_PATH}/default.voices.json`,
      `${beamDir}/mods/unpacked/beamng-aipacenotes-mod/${SETTINGS_PATH}/default.voices.json`,
      this.userVoicesFile(),
    ]

    if (racelinkPath) {
      paths.push(`${racelinkPath}/${SETTINGS_PATH}/default.voices.json`)
    }

    return paths
  }

  _staticPacenotesSearchPaths() {
    const beamDir = this.appSettings.get('beamUserDir')
    const racelinkPath = this.appSettings.get('racelinkPath')

    const paths = [
      `${beamDir}/mods/unpacked/beamng-aipacenotes-mod/${SETTINGS_PATH}/static_pacenotes.json`,
      `${beamDir}/mods/unpacked/aipacenotes/${SETTINGS_PATH}/static_pacenotes.json`,
      `${beamDir}/mods/aipacenotes.zip/${SETTINGS_PATH}/static_pacenotes.json`,
      `${beamDir}/mods/unpacked/aipacenotes.zip/${SETTINGS_PATH}/static_pacenotes.json`,
      `${beamDir}/mods/repo/aipacenotes.zip/${SETTINGS_PATH}/static_pacenotes.json`,
    ]

    if (racelinkPath) {
      paths.push(`${racelinkPath}/${SETTINGS_PATH}/static_pacenotes.json`)
    }

    return paths
  }

  readFileFromZip(zipFilePath, internalPath) {
    zipFilePath = path.normalize(zipFilePath)
    // console.log(`reading zip file: ${zipFilePath}`)

    if (!fs.existsSync(zipFilePath)) {
      // console.error('file does not exist:', zipFilePath);
      return null;
    }

    try {
      const zip = new AdmZip(zipFilePath);
      const zipEntry = zip.getEntry(internalPath);
      if (zipEntry) {
        return zipEntry.getData().toString('utf8');
      }
    } catch (error) {
      console.error('error reading from zip file:', error);
    }
    return null;
  }

  readFileNormally(filePath) {
    filePath = path.normalize(filePath)
    // console.log(`reading normal file: ${filePath}`)

    if (!fs.existsSync(filePath)) {
      // console.error('file does not exist:', filePath);
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

  loadAndMergeVoices() {
    const contents = this._voiceSearchPaths().map(path => {
      if (path.includes('.zip/')) {
        const [zipPath, internalPath] = path.split('.zip/').map((part, index) => index === 0 ? `${part}.zip` : part);
        return this.readFileFromZip(zipPath, internalPath);
      } else {
        return this.readFileNormally(path);
      }
    })

    const mergedJson = this.mergeJsonContents(contents.filter(content => content !== null));
    return mergedJson;
  }

  loadStaticPacenotes() {
    for (const path of this._staticPacenotesSearchPaths()) {
      try {
        let content;
        if (path.includes('.zip/')) {
          const [zipPath, internalPath] = path.split('.zip/').map((part, index) => index === 0 ? `${part}.zip` : part);
          content = this.readFileFromZip(zipPath, internalPath);
        } else {
          content = this.readFileNormally(path);
        }
        if (content) {
          const json = JSON.parse(content);
          return json; // Return the content of the first file found
        }
      } catch (error) {
        // If there's an error (file not found or read error), continue to the next path
        console.error(`Error reading file at ${path}:`, error);
      }
    }
    // If no files are found or all attempts to read files fail, optionally return null or throw an error
    return null;
  }
}
