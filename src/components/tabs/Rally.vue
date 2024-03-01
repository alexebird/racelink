<script setup lang="js">
import { ref, onMounted, onUnmounted } from "vue"
import { useRallyStore } from "@/stores/rally"
import MissionDetails from "@/components/tabs/rally/MissionDetails.vue";

// import { useToast } from "primevue/usetoast"
// import Toast from 'primevue/toast'

// const toast = useToast();
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
    console.log(missionNode.key)
    typeNode.children.push(missionNode);
  })

  return data
}

const onNodeSelect = (node) => {
  // console.log(selectedKey)
  if (node.selectable) {
    // toast.add({ severity: 'success', summary: 'Node Selected', detail: node.data.fname, life: 1000 });
    rallyStore.$patch({selectedMission: node.data})
    window.electronAPI.missionGeneratePacenotes(rallyStore.serializedSelectedMission)
  } else {

  }
}

const onNodeUnselect = (node) => {
  if (node.selectable) {
    // toast.add({ severity: 'warn', summary: 'Node Unselected', detail: node.data.fname, life: 1000 });
    rallyStore.$patch({selectedMission: null})
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
    results = toTreeData(results)
    rallyStore.$patch({missionsTree: results})
    const node = rallyStore.missionsTree[0].children[0].children[0]
    onNodeSelect(node)
  })

  rallyStore.recorder.setup()
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
    :value="rallyStore.missionsTree"
    v-model:selectionKeys="selectedKey"
    v-model:expandedKeys="expandedKeys"
    selectionMode="single"
    @nodeSelect="onNodeSelect"
    @nodeUnselect="onNodeUnselect" ></Tree>
  <MissionDetails />
</template>

<style scoped>
</style>
