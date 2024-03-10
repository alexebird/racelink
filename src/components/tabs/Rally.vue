<script setup lang="js">
import { ref, onMounted, onUnmounted } from "vue"
import { useRallyStore } from "@/stores/rally"
import { useSettingsStore } from "@/stores/settings"
import MissionDetails from "@/components/tabs/rally/MissionDetails.vue";

// import { useToast } from "primevue/usetoast"
// import Toast from 'primevue/toast'
// const toast = useToast();

const settingsStore = useSettingsStore()
const rallyStore = useRallyStore()

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

const onNodeSelect = (node) => {
  if (node.selectable) {
    // toast.add({ severity: 'success', summary: 'Node Selected', detail: node.data.fname, life: 1000 });
    // rallyStore.$patch({selectedMission: node.data})
    rallyStore.selectMission(node.data)
  }
}

const onNodeUnselect = (node) => {
  if (node.selectable) {
    // toast.add({ severity: 'warn', summary: 'Node Unselected', detail: node.data.fname, life: 1000 });
    // rallyStore.$patch({selectedMission: null})
    rallyStore.selectMission(null)
  }
}

function getMissionWithKey(missionId) {
  for (let i = 0; i < rallyStore.missionsTree.length; i++) {
    const levelNode = rallyStore.missionsTree[i];

    for (let j = 0; j < levelNode.children.length; j++) {
      const missionTypeNode = levelNode.children[j];

      for (let k = 0; k < missionTypeNode.children.length; k++) {
        const missionNode = missionTypeNode.children[k];

        if (missionNode.key === missionId) {
          return missionNode;
        }
      }
    }
  }

  return null;
}

const selectedKey = ref({})
const expandedKeys = ref({})

let timer = null

function setDevDefaultMission() {
  if (!settingsStore.settings.isDevelopment) return

  // const selectedMissionId = "driver_training/rallyStage/aip-test3"
  const selectedMissionId = "utah/rallyStage/aip-echo-canyon"
  const node = getMissionWithKey(selectedMissionId)

  if (node) {
    let [levelId, missionType, missionId] = selectedMissionId.split('/')
    missionType = `${levelId}/${missionType}`
    selectedKey.value = {[selectedMissionId]: true}
    expandedKeys.value = {[levelId]: true, [missionType]: true}
    onNodeSelect(node)
    // window.electronAPI.missionGeneratePacenotes(rallyStore.serializedSelectedMission)
  }
}

onMounted(() => {
  window.electronAPI.loadModConfigFiles().then(() =>{
    window.electronAPI.scan().then((results) => {
      results = toTreeData(results)
      rallyStore.$patch({missionsTree: results})
      setDevDefaultMission()
    })

    timer = setInterval(() => {
      window.electronAPI.missionGeneratePacenotes(rallyStore.serializedSelectedMission)
    }, 1000)
  })

  // rallyStore.recorder.setup()
})

onUnmounted(() => {
  rallyStore.recorder.teardown()
  if (timer) {
    clearInterval(timer)
  }
})

</script>

<template>
  <!-- <Toast /> -->
  <Tree class="min-w-72 max-w-72 rounded-none h-screen overflow-auto"
    :value="rallyStore.missionsTree"
    v-model:selectionKeys="selectedKey"
    v-model:expandedKeys="expandedKeys"
    selectionMode="single"
    @nodeSelect="onNodeSelect"
    @nodeUnselect="onNodeUnselect" >
  </Tree>
  <MissionDetails />
</template>

<style scoped>
</style>
