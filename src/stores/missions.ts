import { defineStore } from 'pinia';

function toTreeData(missionScanResults) {
  const data = [];

  missionScanResults.forEach((mission, index) => {
    const levelIndex = data.findIndex(item => item.label === mission.levelId);
    let levelNode;
    if (levelIndex === -1) {
      levelNode = {
        key: `${data.length}`,
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
        key: `${levelNode.key}-${levelNode.children.length}`,
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
      key: `${typeNode.key}-${typeNode.children.length}`,
      label: mission.missionId,
      data: mission,
      selectable: true,
      icon: 'pi pi-fw pi-flag-fill'
    }
    typeNode.children.push(missionNode);
  })

  return data
}

export const useMissionsStore = defineStore('missions', {
  state: () => ({
    missionsTree: [],
    selectedMission: null,
  }),
  getters: {
    serializedSelectedMission: (state) => {
      return {
        mission: {
          fname: state.selectedMission.fname
        }
      }
    }
  },
  actions: {
    setMissionsTree(data) {
      data = toTreeData(data)
      this.missionsTree = data
    },
    setSelectedMission(data) {
      this.selectedMission = data
    },
  },
})
