import { reactive } from 'vue'
import { defineStore } from 'pinia';
import Recorder from '@/voice/recorder'

export const useRallyStore = defineStore('rally', {
  state: () => ({
    // recordingSetup: false,
    // isRecording: false,
    recorder: new Recorder(),
    recordingStatus: 'not_recording',
    lastTranscriptResp: {error: false, text: "<none>"},
  }),
  getters: {
    // recordingStatus: (state) => {
    //   return state.recorder.status
    // }
  },
  actions: {
    // getRecordingStatus: () => {
      // return this.recorder.recordingStatus()
    // }
    // setRecorder(recorder) {
    //   this.recorder = recorder
    // },
    // recordingSetupDone() {
      // this.recordingSetup = true
    // },
    // setIsRecording(isRecording) {
    //   this.isRecording = isRecording
    // },
    // setLastTranscriptResp(resp) {
      // this.lastTranscriptResp = resp
    // },
  },
})
