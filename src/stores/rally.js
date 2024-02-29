import { defineStore } from 'pinia';

export const useRallyStore = defineStore('rally', {
  state: () => ({
    recordingSetup: false,
    isRecording: false,
    recorder: null,
    lastTranscriptResp: {error: false, text: "<none>"},
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
    setIsRecording(isRecording) {
      this.isRecording = isRecording
    },
    setLastTranscriptResp(resp) {
      this.lastTranscriptResp = resp
    },
  },
})
