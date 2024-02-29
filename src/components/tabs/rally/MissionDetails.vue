<script setup lang='js'>
import { ref, onMounted, onUnmounted } from "vue"
import { useMissionsStore } from '@/stores/missions'
import { useRallyStore } from "@/stores/rally"
const missionsStore = useMissionsStore()
const rallyStore = useRallyStore()

onMounted(() => {
  console.log('mounted MissionDetails')
})

const activeTab = ref(1)

</script>

<template>
  <div class='flex flex-col w-full h-screen bg-surface-800'>
    <div v-if="missionsStore.selectedMission">
      <div class="text-surface-0 text-lg m-2">
        {{missionsStore.selectedMission.missionId}}
      </div>

      <TabView v-model:activeIndex="activeTab"
        class="w-full"
        pt:navcontainer:class="ml-1"
        pt:content:class="!rounded-none"
      >
        <TabPanel header="Notebooks">
          <p class="m-0">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
            consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </TabPanel>
        <TabPanel header="Transcripts">
          <Button :disabled="!rallyStore.recordingSetup">Start</Button>
          <Button :disabled="!rallyStore.recordingSetup">Stop</Button>
          <Button :disabled="!rallyStore.recordingSetup">Cut</Button>
        </TabPanel>
      </TabView>
    </div>
    <div v-else>
      Select a mission.
    </div>
  </div>
</template>

<style scoped>
</style>
