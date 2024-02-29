const axios = require('axios');
const { v4: uuidv4 } = require('uuid')
const FormData = require('form-data')
import fs from 'node:fs'

// const settings = require('./aipacenotes/settings'); // Adjust the import path as necessary

export default class FlaskApiClient {
  constructor() {
    // this.baseURL = settings.get_local_vocalizer() ? "http://localhost:8080" : "https://aipacenotes.alxb.us/f";
    this.baseURL = "https://aipacenotes.alxb.us/f"
    // this.baseURL = "http://127.0.0.1:8080"
    this.headerUUID = 'X-Aip-Client-UUID'
    this.userUUID = uuidv4()
  }

  mkurl(suffix) {
    return `${this.baseURL}${suffix}`;
  }

  async getHealthcheck() {
    const url = this.mkurl('/healthcheck');
    const headers = {
      // "Content-Type": "application/json",
      [this.headerUUID]: this.userUUID,
    };

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error translating:', error);
      return null;
    }
  }

  async postCreatePacenoteAudio(noteName, noteText, voiceConfig) {
    const url = this.mkurl('/pacenotes/audio/create');
    const data = {
      note_name: noteName,
      note_text: noteText,
      voice_config: voiceConfig,
    };
    const headers = {
      "Content-Type": "application/json",
      [this.headerUUID]: this.userUUID,
    };

    try {
      const response = await axios.post(url, data, { headers });
      return response.data;
    } catch (error) {
      console.error('Error creating pacenote audio:', error);
      return null;
    }
  }

  async postTranscribe(fname) {
    const url = this.mkurl('/transcribe');
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(fname));
    const headers = {
      [this.headerUUID]: this.userUUID,
      ...formData.getHeaders(), // This line is necessary for setting multipart/form-data headers
    };

    try {
      const response = await axios.post(url, formData, { headers });
      return response.data;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return null;
    }
  }

  async postTranslateAll(body) {
    const url = this.mkurl('/translate_all');
    const headers = {
      "Content-Type": "application/json",
      [this.headerUUID]: this.userUUID,
    };

    try {
      const response = await axios.post(url, body, { headers });
      return response.data;
    } catch (error) {
      console.error('Error translating:', error);
      return null;
    }
  }
}
