const axios = require('axios');
const FormData = require('form-data')
import fs from 'node:fs'

// const settings = require('./aipacenotes/settings'); // Adjust the import path as necessary

export default class FlaskApiClient {
  constructor(uuid) {
    this.baseURL = "https://aipacenotes.alxb.us/f"
    // this.baseURL = "http://127.0.0.1:8080" // cant be localhost
    console.log(`vocalizer url: ${this.baseURL}`)
    this.headerUUID = 'X-Aip-Client-UUID'
    this.userUUID = uuid
  }

  mkurl(suffix) {
    return `${this.baseURL}${suffix}`;
  }

  parseAxiosError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      // console.error('Error', error.response.status);
      // console.error('Data:', error.response.data);
      // console.error('Headers:', error.response.headers);
      // Example of a more human-readable message
      return `Error ${error.response.status}: ${error.response.data.message || error.response.statusText}`;
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.error('Error', error.request);
      return 'The request was made but no response was received';
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.error('Error', error.message);
      return 'Error: ' + error.message;
    }
  }

  async getHealthcheck() {
    const url = this.mkurl('/healthcheck');
    const headers = {
      // "Content-Type": "application/json",
      [this.headerUUID]: this.userUUID,
    };

    try {
      const response = await axios.get(url);
      return [response.data, null];
    } catch (error) {
      console.error('error doing healthcheck');
      return [null, this.parseAxiosError(error)];
    }
  }

  // async postCreatePacenoteAudio(noteName, noteText, voiceConfig) {
  //   const url = this.mkurl('/pacenotes/audio/create');
  //   const data = {
  //     note_name: noteName,
  //     note_text: noteText,
  //     voice_config: voiceConfig,
  //   };
  //   const headers = {
  //     "Content-Type": "application/json",
  //     [this.headerUUID]: this.userUUID,
  //   };
  //
  //   try {
  //     const response = await axios.post(url, data, { headers: headers, responseType: 'arraybuffer' });
  //     return [response.data, null];
  //   } catch (error) {
  //     console.error('error creating pacenote audio');
  //     return [null, this.parseAxiosError(error)];
  //   }
  // }

  async postCreatePacenoteAudioB64(noteName, noteText, voiceConfig) {
    const url = this.mkurl('/pacenotes/audio/createB64');
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
      const response = await axios.post(url, data, { headers: headers });
      return [response.data, null];
    } catch (error) {
      console.error('error creating pacenote audio');
      return [null, this.parseAxiosError(error)];
    }
  }

  async postTranscribe(fname, noiseLevel, minSilenceDuration) {
    const url = this.mkurl('/transcribe');
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(fname));
    const headers = {
      [this.headerUUID]: this.userUUID,
      ...formData.getHeaders(), // This line is necessary for setting multipart/form-data headers
    };

    const params = { noiseLevel, minSilenceDuration }

    try {
      const response = await axios.post(url, formData, { params, headers });
      return [response.data, null];
    } catch (error) {
      console.error('error transcribing audio');
      return [null, this.parseAxiosError(error)];
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
      return [response.data, null];
    } catch (error) {
      console.error('error translating' );
      return [null, this.parseAxiosError(error)];
    }
  }

  async getVoicesList() {
    const url = this.mkurl('/voices/list');
    const headers = {
      [this.headerUUID]: this.userUUID,
    };

    try {
      const response = await axios.get(url, { headers });
      return [response.data, null];
    } catch (error) {
      console.error('error getting voices');
      return [null, this.parseAxiosError(error)];
    }
  }
}
