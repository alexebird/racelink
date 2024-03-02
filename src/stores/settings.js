import { reactive } from 'vue'
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {}
  }),
  getters: {
    autostopThreshold: (state) => state.settings.autostopThreshold,
  },
  actions: {
    setSetting(key, value) {
      window.electronAPI.setSetting(key, value).then((settings) => {
        console.log(settings)
        this.settings = settings
      })
    }
  },
})
