import { reactive } from 'vue'
import { defineStore } from 'pinia';
import Recorder from '@/voice/recorder'

export const useRallyStore = defineStore('rally', {
  state: () => ({
    selectedMissionDetailsTab: 1,
    recorder: new Recorder(),
    recordingStatus: 'not_recording',
    lastTranscriptResp: {error: false, text: "<none>"},
    missionsTree: [],
    selectedMission: null,
  }),
  getters: {
    serializedSelectedMission: (state) => {
      return { mission: { fname: state.selectedMission.fname } }
    }
  },
  actions: {
  },
})
