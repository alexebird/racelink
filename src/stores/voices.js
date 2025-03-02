import { toRaw } from 'vue'
import { defineStore } from 'pinia'
import _ from 'lodash'

export const useVoicesStore = defineStore('voices', {
  state: () => ({
    voiceData: null,
    voiceDataError: null,
    testText: "into three right opens over crest? fifty.",
  }),
  getters: {
  },
  actions: {
    refreshVoices() {
      return window.electronAPI.refreshVoices().then((data) => {
        const [voiceData, err] = data
        console.log(voiceData)
        this.setVoicesData(voiceData, err)
        return data
      })
    },

    setVoicesData(voiceData, err) {
      this.voiceData = voiceData
      this.voiceDataError = err
    },

    testVoice(voiceConfig) {
      return window.electronAPI.testVoice(voiceConfig, this.testText)
    },
  },
})
