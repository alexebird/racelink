<script setup lang='js'>
import { ref, onMounted, onUnmounted, nextTick } from "vue"

import { useRallyStore } from "@/stores/rally"
const rallyStore = useRallyStore()

import { useSettingsStore } from "@/stores/settings"
const settingsStore = useSettingsStore()

let checkQueueInterval

onMounted(() => {
  window.electronAPI.onNotebooksUpdated((event, notebooks) => {
    rallyStore.$patch({ notebooks: notebooks })
  })

  // setupAudioListeners()
  checkQueueInterval = setInterval(() => {
    playCurrentItem();
  }, 10); // Check every 1000 milliseconds (1 second)
})

onUnmounted(() => {
  clearInterval(checkQueueInterval)
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


function fileProtoAudioFname(audioFname) {
  return new URL(`file://${audioFname}`).href
}

window.electronAPI.onServerRecordingCut((cutReq) => {
  doCut(cutReq)
})

window.electronAPI.onServerRemoteAudioPlay((audioFname) => {
  const beamDir = settingsStore.settings.beamUserDir
  audioFname = `${beamDir}/${audioFname}`
  console.log('onServerRemoteAudioPlay', audioFname)
  audioQueue.value.push(audioFname)
})

window.electronAPI.onServerRemoteAudioReset(() => {
  console.log('onServerRemoteAudioReset')
  audioQueue.value = []
  if (audioElement.value) {
    audioElement.value.pause()
    audioElement.value.currentTime = 0
  }
})

// works
// const onPlayClick = async (url) => {
//   // source.value = url
//   // await nextTick()
//   // audioElement.value.load()
//   // console.log(url)
//   // await audioElement.value.play();
// }

// const isAudioPlaying = () => {
//   return audioElement.value && !audioElement.value.paused && audioElement.value.currentTime > 0;
// };

const onPlayClick = (url) => {
  url = fileProtoAudioFname(url)
  audioQueue.value.push(url)

  // if (!isAudioPlaying()) {
  //   playCurrentItem();
  // }
};

const playCurrentItem = () => {
  if (audioQueue.value.length > 0 && audioElement.value && audioElement.value.paused) {
    const currentItem = audioQueue.value.shift(); // Get and remove the first item from the queue
    audioElement.value.src = currentItem; // Set the source of the audio element
    audioElement.value.play().catch(error => console.error("Error playing audio:", error));
  }
};

// const addToQueue = (url) => {
//   audioQueue.value.push(url);
// };

const audioElement = ref(null)
const expandedRows = ref({})
const source = ref('')

const audioQueue = ref([]);
const currentIndex = ref(-1);

</script>

<template>
  <div class='flex flex-col w-full h-screen text-surface-0 bg-surface-800'>
    <audio ref="audioElement" :key="source">
      <source :src="source" type="audio/ogg">
    </audio>

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
          <DataTable
            :value="rallyStore.notebooks"
            dataKey="basename"
            tableStyle="min-width: 10rem"
            v-model:expandedRows="expandedRows"
          >
            <Column expander style="width: 3rem" />
            <Column header="#notes" style="width:6rem">
              <template #body="slotProps">
                {{ slotProps.data.pacenotesCount }}
                <!-- <Badge :value="slotProps.data.updatesCount" :severity="slotProps.data.updatesCount === 0 ? 'success' : 'danger'"></Badge> -->
              </template>
            </Column>
            <Column field="name" header="Name"></Column>
            <Column field="basename" header="ID"></Column>
            <template #expansion="slotProps">
              <div class="p-3">
                <h5>Pacenotes for {{ slotProps.data.name }}</h5>
                <DataTable :value="slotProps.data.pacenotes">
                  <Column field="name" header="Name"></Column>
                  <Column header="">
                    <template #body="slotProps">
                      <Button @click="() => onPlayClick(slotProps.data.audioFname)">
                        <span class="pi pi-play"></span>
                      </Button>
                    </template>
                  </Column>
                  <Column field="note" header="Note">
                    <template #body="slotProps">
                      <span class="font-mono">
                        {{ slotProps.data.note}}
                      </span>
                    </template>
                  </Column>
                  <Column field="language" header="Language"></Column>
                  <Column field="voice" header="Voice"></Column>
                  <!-- <Column field="amount" header="Amount" sortable> -->
                  <!--   <template #body="slotProps"> -->
                  <!--     {{ formatCurrency(slotProps.data.amount) }} -->
                  <!--   </template> -->
                  <!-- </Column> -->
                  <!-- <Column field="status" header="Status" sortable> -->
                  <!--   <template #body="slotProps"> -->
                  <!--     <Tag :value="slotProps.data.status.toLowerCase()" :severity="getOrderSeverity(slotProps.data)" /> -->
                  <!--   </template> -->
                  <!-- </Column> -->
                  <!-- <Column headerStyle="width:4rem"> -->
                  <!--   <template #body> -->
                  <!--     <Button icon="pi pi-search" /> -->
                  <!--   </template> -->
                  <!-- </Column> -->
                </DataTable>
              </div>
            </template>
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
