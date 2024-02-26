<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from "primevue/usetoast"
import Toast from 'primevue/toast'
const toast = useToast();

const data = [{
  key: '0',
  label: 'johnson_valley',
  data: 'level id',
  icon: 'pi pi-fw pi-image',
  children: [
    {
      key: '0-0',
      label: 'rallyStage',
      data: 'mission type',
      icon: 'pi pi-fw pi-car',
      children: [
        {
          key: '0-0-0',
          label: 'aip-test',
          data: 'mission id',
          icon: 'pi pi-fw pi-flag-fill',
        }
      ]
    }
  ]
}]

const nodes = ref(data);
const selectedKey = ref({});

//onMounted(() => {
 // nodes.value = data
//});

const onNodeSelect = (node) => {
    toast.add({ severity: 'success', summary: 'Node Selected', detail: node.label, life: 3000 });
};

const onNodeUnselect = (node) => {
    toast.add({ severity: 'warn', summary: 'Node Unselected', detail: node.label, life: 3000 });
};


import { onMounted, onUnmounted } from 'vue';
import { useMissionsStore } from '@/stores/missions'
const missionsStore = useMissionsStore();

//import { useIpcResults } from '@/composables/useIpcResults';
//const { setupIpcListener, cleanupIpcListener } = useIpcResults();

async function doScan() {
  return await window.electronAPI.scan()
}

onMounted(() => {
  // setupIpcListener();
  window.electronAPI.configureScanner({
    basePath: 'test/data',
  })

  doScan().then((results) => {
    console.log(results)
  })
});

onUnmounted(() => {
  // cleanupIpcListener();
});

</script>

<template>
  <Toast />
  <Tree class="w-full md:w-30rem" v-model:selectionKeys="selectedKey" :value="nodes" selectionMode="single" :metaKeySelection="false" @nodeSelect="onNodeSelect" @nodeUnselect="onNodeUnselect" ></Tree>
</template>
