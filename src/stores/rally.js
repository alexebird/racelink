import { defineStore } from 'pinia';

export const useRallyStore = defineStore('rally', {
  state: () => ({
    recordingSetup: false,
    recorder: null,
  }),
  getters: {
    // foo: (state) => {}
  },
  actions: {
    setRecorder(recorder) {
      this.recorder = recorder
    },
    recordingSetupDone() {
      this.recordingSetup = true
    },
  },
})
