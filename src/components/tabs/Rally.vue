<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"
import { useMissionsStore } from "@/stores/missions"
import MissionDetails from "@/components/tabs/rally/MissionDetails.vue";

// import { useToast } from "primevue/usetoast"
// import Toast from 'primevue/toast'

// const toast = useToast();
const missionsStore = useMissionsStore()
const selectedKey = ref({})

const onNodeSelect = (node) => {
  if (node.selectable) {
    // toast.add({ severity: 'success', summary: 'Node Selected', detail: node.data.fname, life: 1000 });
    missionsStore.setSelectedMission(node.data)
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
  })
});

// onUnmounted(() => {
// });
</script>

<template>
  <!-- <Toast /> -->
  <div class='flex'>
    <Tree class="min-w-72 max-w-72 rounded-none"
      v-model:selectionKeys="selectedKey" :value="missionsStore.missionsTree"
      selectionMode="single" :metaKeySelection="false"
      @nodeSelect="onNodeSelect" @nodeUnselect="onNodeUnselect" ></Tree>
    <MissionDetails />
  </div>
</template>

<style scoped>
</style>
