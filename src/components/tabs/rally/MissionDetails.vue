<script setup lang='js'>
import { ref, onMounted, onUnmounted } from "vue"
import { useRallyStore } from "@/stores/rally"
const rallyStore = useRallyStore()

onMounted(() => {
  window.electronAPI.onNotebooksUpdated((event, notebooks) => {
    rallyStore.$patch({ notebooks: notebooks })
  })
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
  // rallyStore.$patch({ lastTranscriptResp: resp })
  rallyStore.addTranscription(resp)
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
          <DataTable :value="rallyStore.notebooks" tableStyle="min-width: 10rem">
            <Column field="updates" header="# Updates Needed"></Column>
            <Column field="pacenotes" header="# Notes"></Column>
            <Column field="basename" header="ID"></Column>
            <Column field="name" header="Name"></Column>
          </DataTable>
        </TabPanel>
        <TabPanel header="Transcripts">
          <!-- <Button :disabled="!rallyStore.recordingSetup || rallyStore.isRecording" class='mr-2' @click="onRecordingStart"> -->
          <!--   Start -->
          <!-- </Button> -->
          <!-- <Button :disabled="!rallyStore.recordingSetup || !rallyStore.isRecording" class='mr-2' @click="onRecordingStop"> -->
          <!--   Stop -->
          <!-- </Button> -->
          <div class='flex pb-2'>
            <Button :disabled="!rallyStore.recorder" @click="onRecordingCut">Cut</Button>
            <div class='ml-5'>
              <span v-if="rallyStore.recordingStatus === 'recording'" class="pi pi-circle-fill text-red-600 align-middle"></span>
              <span v-else="rallyStore.recordingStatus !== 'recording'" class="pi pi-circle-fill align-middle"></span>
              <span class="m-1 align-baseline">
                recording
                <span v-if="rallyStore.recordingStatus === 'recording' && rallyStore.recordingAutostop >= 0"> ({{ rallyStore.recordingAutostop }}s)</span>
              </span>
            </div>
          </div>

          <DataTable :value="rallyStore.transcriptionHistory" tableStyle="min-width: 10rem">
            <Column field="error" header="Status">
              <template #body="slotProps">
                <InlineMessage v-if="!slotProps.data.error" severity="success">ok</InlineMessage>
                <InlineMessage v-else severity="error">fail</InlineMessage>
              </template>
            </Column>
            <Column field="text" header="Text"></Column>
          </DataTable>

          <!-- <div v-if="!rallyStore.lastTranscriptResp.error"> -->
          <!--   Last Transcript: "{{rallyStore.lastTranscriptResp.text}}" -->
          <!-- </div> -->
          <!-- <div v-if="rallyStore.lastTranscriptResp.error" class='text-red-400'> -->
          <!--   Last Transcript: ERROR!!! -->
          <!-- </div> -->
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
