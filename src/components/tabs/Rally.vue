<script setup lang="js">
import { ref, onMounted, onUnmounted } from "vue"
import { useMissionsStore } from "@/stores/missions"
import { useRallyStore } from "@/stores/rally"
import MissionDetails from "@/components/tabs/rally/MissionDetails.vue";

// import { useToast } from "primevue/usetoast"
// import Toast from 'primevue/toast'

// const toast = useToast();
const missionsStore = useMissionsStore()
const rallyStore = useRallyStore()

const onNodeSelect = (node) => {
  // console.log(selectedKey)
  if (node.selectable) {
    // toast.add({ severity: 'success', summary: 'Node Selected', detail: node.data.fname, life: 1000 });
    missionsStore.setSelectedMission(node.data)
    // console.log(missionsStore.serializedSelectedMission)
    window.electronAPI.missionGeneratePacenotes(missionsStore.serializedSelectedMission)
  } else {

  }
}

const onNodeUnselect = (node) => {
  if (node.selectable) {
    // toast.add({ severity: 'warn', summary: 'Node Unselected', detail: node.data.fname, life: 1000 });
    missionsStore.setSelectedMission(null)
  } else {

  }
}

// async function doScan() {
//   return await window.electronAPI.scan()
// }

onMounted(() => {
  window.electronAPI.configureScanner({
    basePath: 'test/data',
  })

  window.electronAPI.scan().then((results) => {
    // doScan().then((results) => {
    missionsStore.setMissionsTree(results)
    // console.log(missionsStore.missionsTree)
    const node = missionsStore.missionsTree[0].children[0].children[0]
    onNodeSelect(node)
  })

  rallyStore.recorder.setup()

  // const recorder = new Recorder()
  // recorder.setup(() => {
  //   // rallyStore.setRecorder(recorder)
  //   // rallyStore.recordingSetupDone()
  //   rallyStore.$patch({
  //     recorder: recorder,
  //   })
  // })
})

onUnmounted(() => {
  rallyStore.recorder.teardown()
})

// const selectedNode = ref({key:'lvl/rallyStage/aip-test', label: 'aip-test'})
const selectedKey = ref({'lvl/rallyStage/aip-test': true})
const expandedKeys = ref({"lvl": true, "lvl/rallyStage": true})
</script>

<template>
  <!-- <Toast /> -->
  <Tree class="min-w-72 max-w-72 rounded-none"
    :value="missionsStore.missionsTree"
    v-model:selectionKeys="selectedKey"
    v-model:expandedKeys="expandedKeys"
    selectionMode="single"
    @nodeSelect="onNodeSelect"
    @nodeUnselect="onNodeUnselect" ></Tree>
  <MissionDetails />
</template>

<style scoped>
</style>
