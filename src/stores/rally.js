import { defineStore } from 'pinia';
import Recorder from '@/voice/recorder'

function toTreeData(missionScanResults) {
  const data = [];

  missionScanResults.forEach((mission, index) => {
    const levelIndex = data.findIndex(item => item.label === mission.levelId);
    let levelNode;
    if (levelIndex === -1) {
      levelNode = {
        key: mission.levelId,
        label: mission.levelId,
        // data: 'level id',
        icon: 'pi pi-fw pi-image',
        selectable: false,
        children: []
      }
      data.push(levelNode)
    } else {
      levelNode = data[levelIndex]
    }

    const typeIndex = levelNode.children.findIndex(item => item.label === mission.missionType);
    let typeNode
    if (typeIndex === -1) {
      typeNode = {
        key: `${levelNode.key}/${mission.missionType}`,
        label: mission.missionType,
        // data: 'mission type',
        selectable: false,
        icon: 'pi pi-fw pi-car',
        children: []
      }
      levelNode.children.push(typeNode);
    } else {
      typeNode = levelNode.children[typeIndex];
    }

    const missionNode = {
      key: `${typeNode.key}/${mission.missionId}`,
      label: mission.missionId,
      data: mission,
      selectable: true,
      icon: 'pi pi-fw pi-flag-fill'
    }
    // console.log(missionNode.key)
    typeNode.children.push(missionNode);
  })

  return data
}


export const useRallyStore = defineStore('rally', {
  state: () => ({
    selectedMissionDetailsTab: 1,
    selectedMission: null,
    transcriptionHistory: [],
    missionsTree: [],
    notebooks: [],

    recorder: new Recorder(),
    recordingStatus: 'not_recording',
    recordingError: null,
    recordingAutostop: 0,
  }),
  getters: {
    serializedSelectedMission: (state) => {
      if (state.selectedMission) {
        return { mission: { fname: state.selectedMission.fname, fullId: state.selectedMission.fullId } }
      } else  {
        return null
      }
    },
    progressValue: (state) => {
      let totalUpdates = state.notebooks.reduce((acc, nb) => acc + nb.updatesCount, 0)
      let totalPacenotes = state.notebooks.reduce((acc, nb) => acc + nb.pacenotesCount, 0)


      return 100 * ((totalPacenotes - totalUpdates) / totalPacenotes)
    },
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

    setMissionScanResults(results) {
      this.missionsTree = toTreeData(results)
    },

    // resetRecorder() {
    //   this.recorder.setup()
    //   this.recordingStatus = 'not_recording'
    // }
  },
})
