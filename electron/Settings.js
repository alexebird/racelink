import { app } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

export default class Settings {
  constructor(fileName, defaultSettings = {}) {
    // Store the default settings
    this.defaultSettings = defaultSettings;

    const isDevelopment = !app.isPackaged;
    const basePath = isDevelopment ? '.' : app.getPath('userData');
    this.filePath = path.join(basePath, fileName);
    this.settings = {};

    this.load();
  }

  load() {
    if (fs.existsSync(this.filePath)) {
      try {
        const fileContent = fs.readFileSync(this.filePath, 'utf8');
        const userSettings = JSON.parse(fileContent);
        // Merge user settings with the default settings
        this.settings = { ...this.defaultSettings, ...userSettings };
      } catch (error) {
        console.error('Failed to load settings:', error);
        this.settings = this.defaultSettings;
      }
    } else {
      // If the settings file doesn't exist, use the default settings
      this.settings = this.defaultSettings;
    }
  }

  save() {
    try {
      const fileContent = JSON.stringify(this.settings, null, 2);
      fs.writeFileSync(this.filePath, fileContent, 'utf8');
      console.log(`wrote settings to ${this.filePath}`)
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  get(key, defaultValue = null) {
    return this.settings.hasOwnProperty(key) ? this.settings[key] : defaultValue;
  }

  set(key, value) {
    this.settings[key] = value;
    this.save();
  }
}
