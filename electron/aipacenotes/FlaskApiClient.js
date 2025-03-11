const axios = require('axios');
const FormData = require('form-data')
import fs from 'node:fs'

// const settings = require('./aipacenotes/settings'); // Adjust the import path as necessary

const timeoutVoicesListMs = 20 * 1000;
const timeoutTranscribeMs = 20 * 1000
const timeoutGenerateMs = 20 * 1000

const VOCALIZER_URL = process.env.VOCALIZER_URL || "https://racel.ink/api2"

export default class FlaskApiClient {
  constructor(apiKey, uuid) {
    this.baseURL = VOCALIZER_URL
    console.log(`vocalizer url: ${this.baseURL}`)
    this.headerUUID = 'X-Client-UUID'
    this.userUUID = uuid
    this.headerApiKey = 'Authorization'
    this.apiKey = apiKey
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
      return `error ${error.response.status}: ${error.response.data.message || error.response.statusText}`;
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      // console.error('Error', error.request);
      return 'the request was made but no response was received';
    } else {
      // Something happened in setting up the request that triggered an Error
      // console.error('Error', error.message);
      return 'error setting up request: ' + error.message;
    }
  }

  async getHealthcheck() {
    const url = this.mkurl('/healthcheck')
    // const headers = {
    //   [this.headerUUID]: this.userUUID,
    // }

    try {
      const response = await axios.get(url)
      return [response.data, null]
    } catch (error) {
      console.error('error doing healthcheck')
      return [null, this.parseAxiosError(error)]
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

  async postCreatePacenoteAudioB64(noteName, noteParams, noteText, voiceConfig) {
    // console.log(JSON.stringify(voiceConfig, null, 2))
    const url = this.mkurl('/pacenotes/audio/createB64')
    const data = {
      note_name: noteName,
      note_params: noteParams || {},
      note_text: noteText,
      voice_config: voiceConfig,
      effects_mode: 'lufs',
      // effects_mode: 'plain',
    }
    const headers = {
      "Content-Type": "application/json",
      [this.headerUUID]: this.userUUID,
      [this.headerApiKey]: `Bearer ${this.apiKey}`,
    }

    const config = {
      headers,
      timeout: timeoutGenerateMs,
      signal: AbortSignal.timeout(timeoutGenerateMs),
    }

    try {
      const response = await axios.post(url, data, config)
      return [response.data, null]
    } catch (error) {
      console.error('error creating pacenote audio');
      console.error(error.response.data)
      return [null, this.parseAxiosError(error)];
    }
  }

  async postTranscribe(fname, noiseLevel, minSilenceDuration) {
    const url = this.mkurl('/transcribe');
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(fname));
    const headers = {
      [this.headerUUID]: this.userUUID,
      [this.headerApiKey]: `Bearer ${this.apiKey}`,
      ...formData.getHeaders(), // This line is necessary for setting multipart/form-data headers
    };

    const params = { noiseLevel, minSilenceDuration }

    const config = {
      headers,
      params,
      timeout: timeoutTranscribeMs,
      signal: AbortSignal.timeout(timeoutTranscribeMs),
    }

    try {
      const response = await axios.post(url, formData, config);
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
      [this.headerApiKey]: `Bearer ${this.apiKey}`,
    }

    const config = {
      headers
    }

    try {
      const response = await axios.post(url, body, config);
      return [response.data, null];
    } catch (error) {
      console.error('error translating' );
      return [null, this.parseAxiosError(error)];
    }
  }

  async getVoicesList() {
    const url = this.mkurl('/voices/list')
    const headers = {
      [this.headerUUID]: this.userUUID,
      [this.headerApiKey]: `Bearer ${this.apiKey}`,
    }

    const config = {
      headers,
      timeout: timeoutVoicesListMs,
      signal: AbortSignal.timeout(timeoutVoicesListMs),
    }

    try {
      const response = await axios.get(url, config)
      return [response.data, null]
    } catch (error) {
      console.error('error getting voices')
      console.error(error)
      const errMsg = this.parseAxiosError(error)
      console.error(errMsg)
      return [null, errMsg]
    }
  }
}
