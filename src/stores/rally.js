import { reactive } from 'vue'
import { defineStore } from 'pinia';
import Recorder from '@/voice/recorder'

export const useRallyStore = defineStore('rally', {
  state: () => ({
    selectedMissionDetailsTab: 1,
    selectedMission: null,
    transcriptionHistory: [],
    missionsTree: [],
    notebooks: [],

    recorder: new Recorder(),
    recordingStatus: 'not_recording',
    recordingAutostop: 0,
  }),
  getters: {
    serializedSelectedMission: (state) => {
      if (state.selectedMission) {
        return { mission: { fname: state.selectedMission.fname } }
      } else  {
        return null
      }
    }
  },
  actions: {
    addTranscription(newItem) {
      this.transcriptionHistory.push(newItem)
    },
    clearTranscriptionHistory() {
      this.transcriptionHistory = []
    },
    selectMission(nodeData) {
      this.selectedMission = nodeData
      this.clearTranscriptionHistory()

      // if (this.selectedMission) {
      //   this.resetRecorder()
      // } else {
      //   this.recorder.teardown()
      // }
    },
    // resetRecorder() {
    //   this.recorder.setup()
    //   this.recordingStatus = 'not_recording'
    // }
  },
})
