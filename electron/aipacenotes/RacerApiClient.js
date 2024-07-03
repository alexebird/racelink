const axios = require('axios');
const FormData = require('form-data')
import fs from 'node:fs'

const timeoutMs = 1000;
const timeoutTranscribeMs = 20 * 1000
const timeoutGenerateMs = 20 * 1000

export default class RacerApiClient {
  constructor(apiKey, uuid) {
    // this.baseURL = "https://aipacenotes.alxb.us/api"
    this.baseURL = "http://127.0.0.1:3000/api" // cant be localhost
    console.log(`racer url: ${this.baseURL}`)
    this.headerUUID = 'X-Aip-Client-UUID'
    this.headerApiKey = 'X-Api-Key'
    this.userUUID = uuid
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
    const headers = {
      [this.headerApiKey]: this.apiKey,
      [this.headerUUID]: this.userUUID,
    }

    try {
      const response = await axios.get(url, { headers: headers })
      return response
    } catch (error) {
      console.error('error doing healthcheck')
      return [null, this.parseAxiosError(error)]
    }
  }

  async postCreateResult(fname, resultsData) {
    const url = this.mkurl('/v1/results')
    const body = {
      result: {
        fname: fname,
        raw: resultsData,
      }
    }
    const headers = {
      "Content-Type": "application/json",
      [this.headerUUID]: this.userUUID,
      [this.headerApiKey]: this.apiKey,
    }

    const config = {
      headers,
      timeout: timeoutGenerateMs,
      signal: AbortSignal.timeout(timeoutGenerateMs),
    }

    try {
      const response = await axios.post(url, body, config)
      return response
    } catch (error) {
      console.error('error creating result');
      return [null, this.parseAxiosError(error)];
    }
  }
  //
  // async postTranscribe(fname, noiseLevel, minSilenceDuration) {
  //   const url = this.mkurl('/transcribe');
  //   const formData = new FormData();
  //   formData.append('audio', fs.createReadStream(fname));
  //   const headers = {
  //     [this.headerUUID]: this.userUUID,
  //     ...formData.getHeaders(), // This line is necessary for setting multipart/form-data headers
  //   };
  //
  //   const params = { noiseLevel, minSilenceDuration }
  //
  //   const config = {
  //     headers,
  //     params,
  //     timeout: timeoutTranscribeMs,
  //     signal: AbortSignal.timeout(timeoutTranscribeMs),
  //   }
  //
  //   try {
  //     const response = await axios.post(url, formData, config);
  //     return [response.data, null];
  //   } catch (error) {
  //     console.error('error transcribing audio');
  //     return [null, this.parseAxiosError(error)];
  //   }
  // }
  //
  // async postTranslateAll(body) {
  //   const url = this.mkurl('/translate_all');
  //   const headers = {
  //     "Content-Type": "application/json",
  //     [this.headerUUID]: this.userUUID,
  //   }
  //
  //   const config = {
  //     headers
  //   }
  //
  //   try {
  //     const response = await axios.post(url, body, config);
  //     return [response.data, null];
  //   } catch (error) {
  //     console.error('error translating' );
  //     return [null, this.parseAxiosError(error)];
  //   }
  // }
  //
  // async getVoicesList() {
  //   const url = this.mkurl('/voices/list')
  //   const headers = {
  //     [this.headerUUID]: this.userUUID,
  //   }
  //
  //   const config = {
  //     headers,
  //     timeout: timeoutMs,
  //     signal: AbortSignal.timeout(timeoutMs),
  //   }
  //
  //   try {
  //     const response = await axios.get(url, config)
  //     return [response.data, null]
  //   } catch (error) {
  //     console.error('error getting voices')
  //     return [null, this.parseAxiosError(error)]
  //   }
  // }
}
