import { reactive } from 'vue'
import { defineStore } from 'pinia';

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {},
    defaults: {},
  }),
  getters: {
    autostopThreshold: (state) => state.settings.autostopThreshold,
    lastSelectedMission: (state) => state.settings.lastSelectedMission,
  },
  actions: {
    setSetting(key, value) {
      window.electronAPI.setSetting(key, value).then((settings) => {
        this.settings = settings
      })
    },
    setLastSelectedMission(missionId) {
      this.setSetting('lastSelectedMission', missionId)
    },
  },
})
