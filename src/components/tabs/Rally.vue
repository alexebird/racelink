<script setup lang="js">
import { toRaw, ref, onMounted, onUnmounted } from "vue"
import { useRallyStore } from "@/stores/rally"
import { useSettingsStore } from "@/stores/settings"
import MissionDetails from "@/components/tabs/rally/MissionDetails.vue";

// import { useToast } from "primevue/usetoast"
// import Toast from 'primevue/toast'
// const toast = useToast();

const settingsStore = useSettingsStore()
const rallyStore = useRallyStore()
const selectedKey = ref({})
const expandedKeys = ref({})
// let timer = null

const missionsRefreshing = ref(false)

const onNodeSelect = (node) => {
  // console.debug('onNodeSelect')
  if (node.selectable) {
    console.debug('onNodeSelect selectable')
    // toast.add({ severity: 'success', summary: 'Node Selected', detail: node.data.fname, life: 1000 });
    rallyStore.selectMission(node.data)
    settingsStore.setLastSelectedMission(rallyStore.selectedMissionId)
    scanNotebooks()
  }
}

const onNodeUnselect = (node) => {
  // console.debug('onNodeUnselect')
  if (node.selectable) {
    console.debug('onNodeUnselect selectable')
    // toast.add({ severity: 'warn', summary: 'Node Unselected', detail: node.data.fname, life: 1000 });
    rallyStore.selectMission(null)
  }
}

function getMissionWithKey(missionId) {
  for (let i = 0; i < rallyStore.missionsTree.length; i++) {
    const levelNode = rallyStore.missionsTree[i]

    for (let j = 0; j < levelNode.children.length; j++) {
      const missionTypeNode = levelNode.children[j]

      for (let k = 0; k < missionTypeNode.children.length; k++) {
        const missionNode = missionTypeNode.children[k]

        if (missionNode.key === missionId) {
          return missionNode
        }
      }
    }
  }

  return null
}

function selectMissionWithFullId(selectedMissionId) {
  // if (!settingsStore.settings.isDevelopment) return

  // const selectedMissionId = "driver_training/rallyStage/aip-test4"
  // const selectedMissionId = "utah/rallyStage/aip-echo-canyon"
  // const selectedMissionId = "lvl/rallyStage/aip-test"

  console.log(`setting selected mission to ${selectedMissionId}`)

  if (!selectedMissionId) {
    return
  }

  const node = getMissionWithKey(selectedMissionId)

  if (node) {
    let [levelId, missionType, missionId] = selectedMissionId.split('/')
    missionType = `${levelId}/${missionType}`
    selectedKey.value = {[selectedMissionId]: true}
    expandedKeys.value = {[levelId]: true, [missionType]: true}
    onNodeSelect(node)
  }
}

onMounted(() => {
  console.debug('onMounted')
  refreshMissions(() => {
    console.log(toRaw(settingsStore.lastSelectedMission))
    selectMissionWithFullId(settingsStore.lastSelectedMission)
    scanNotebooks()
  })

  window.electronAPI.onTick(() => {
    scanNotebooks()
    rallyStore.fireRecorderWatchdog()
  })
})

onUnmounted(() => {
  rallyStore.recorder.teardown()
  window.electronAPI.rmTick()
})

function scanNotebooks() {
  window.electronAPI.missionGeneratePacenotes(rallyStore.serializedSelectedMission)
}

function refreshMissions(cb) {
  missionsRefreshing.value = true
  window.electronAPI.scanMissions().then((results) => {
    rallyStore.setMissionScanResults(results)
    if (cb) {
      cb()
    }
    missionsRefreshing.value = false
  })
}

const btnRefreshMissions = () => {
  refreshMissions()
}
</script>

<template>
  <!-- <Toast /> -->
  <div class="flex flex-col h-screen text-surface-0 bg-surface-700">
    <div class="flex align-left p-2 text-xl">
      <span>
        Missions
      </span>
      <Button @click="btnRefreshMissions" class="ml-2" icon="pi pi-refresh" :loading="missionsRefreshing"></Button>
    </div>
    <Tree class="min-w-72 max-w-72 rounded-none overflow-auto"
      :value="rallyStore.missionsTree"
      v-model:selectionKeys="selectedKey"
      v-model:expandedKeys="expandedKeys"
      selectionMode="single"
      @nodeSelect="onNodeSelect"
      @nodeUnselect="onNodeUnselect"
      pt:root:class="!bg-surface-700"
    >
    </Tree>
  </div>
  <MissionDetails />
</template>

<style scoped>
</style>
