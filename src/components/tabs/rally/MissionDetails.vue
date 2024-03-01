<script setup lang='js'>
import { ref, onMounted, onUnmounted } from "vue"
import { useRallyStore } from "@/stores/rally"
const rallyStore = useRallyStore()

onMounted(() => {
})

const activeTab = ref(0)

const onRecordingStart = () => {
  rallyStore.recorder.startRecording()
}

// const onRecordingStop = () => {
//   rallyStore.recorder.stopRecordingAfter()
//   rallyStore.setIsRecording(false)
// }

const doCut = (cutReq) => {
  if (!rallyStore.recorder.isRecording()) {
    onRecordingStart()
  } else {
    rallyStore.recorder.cutRecording(cutReq)
  }
}

const onRecordingCut = () => {
  doCut({cut_id: -1})
}

window.electronAPI.onTranscribeDone((resp) => {
  // console.log('onTranscribeDone')
  // console.log(resp)
  // rallyStore.setLastTranscriptResp(resp)
  rallyStore.$patch({
    lastTranscriptResp: resp
  })
})

// window.electronAPI.onServerRecordingStart((resp) => {
//   onRecordingStart()
// })
//
// window.electronAPI.onServerRecordingStop((resp) => {
//   onRecordingStop()
// })

window.electronAPI.onServerRecordingCut((cutReq) => {
  doCut(cutReq)
})

</script>

<template>
  <div class='flex flex-col w-full h-screen text-surface-0 bg-surface-800'>
    <div v-if="rallyStore.selectedMission">
      <div class="text-lg m-2">
        {{rallyStore.selectedMission.missionId}}
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
          <!-- <Button :disabled="!rallyStore.recordingSetup || rallyStore.isRecording" class='mr-2' @click="onRecordingStart"> -->
          <!--   Start -->
          <!-- </Button> -->
          <!-- <Button :disabled="!rallyStore.recordingSetup || !rallyStore.isRecording" class='mr-2' @click="onRecordingStop"> -->
          <!--   Stop -->
          <!-- </Button> -->
          <Button :disabled="!rallyStore.recorder" @click="onRecordingCut">
            Cut
          </Button>
          <div >
            recording: {{rallyStore.recordingStatus}}
          </div>
          <div v-if="!rallyStore.lastTranscriptResp.error">
            Last Transcript: "{{rallyStore.lastTranscriptResp.text}}"
          </div>
          <div v-if="rallyStore.lastTranscriptResp.error" class='text-red-400'>
            Last Transcript: ERROR!!!
          </div>
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
