<script setup lang='js'>
import { ref, onMounted, onUnmounted, nextTick } from "vue"
import { useRallyStore } from "@/stores/rally"
const rallyStore = useRallyStore()
import { useSettingsStore } from "@/stores/settings"
const settingsStore = useSettingsStore()
import { useAudioPlayerStore } from "@/stores/audioPlayer"
const audioPlayerStore = useAudioPlayerStore()

const activeTab = ref(0)
const expandedRows = ref({})
const currentIndex = ref(-1);

onMounted(() => {
  window.electronAPI.onNotebooksUpdated((event, notebooks) => {
    rallyStore.$patch({ notebooks: notebooks })
  })
})

onUnmounted(() => {
})

const onRecordingStart = () => {
  rallyStore.recorder.startRecording()
}

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
  rallyStore.addTranscription(resp)
})

window.electronAPI.onServerRecordingCut((cutReq) => {
  doCut(cutReq)
})

const onPlayClick = (audioFname) => {
  if (audioFname) {
    audioPlayerStore.play(audioFname)
  }
}

const onRegenOneClick = (fname) => {
  window.electronAPI.deleteFile(fname)
}

const openFileExplorer = () => {
  window.electronAPI.openFileExplorer(rallyStore.selectedMission.fname)
}

const onOpenNotebookClick = (fname) => {
  window.electronAPI.openFileExplorer(fname)
}
</script>

<template>
  <div class='flex flex-col w-full h-screen overflow-hidden text-surface-0 bg-surface-800'>
    <div v-if="rallyStore.selectedMission">
      <div class="text-xl m-2">
        {{rallyStore.selectedMission.missionId}}
      </div>
      <div class="text-md m-2">
        <ul>
          <li>
            level: {{rallyStore.selectedMission.levelId}}
          </li>
          <li class="mt-2">
            <Button class="mr-4" @click="openFileExplorer">
              <span class="pi pi-folder-open"></span>
            </Button>
            <span class="font-mono text-xs">
              {{rallyStore.selectedMission.fname}}
            </span>
          </li>
        </ul>
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
            <Column header="Notes" style="width: 6rem" >
              <template #body="slotProps">
                <Badge :value="slotProps.data.updatesCount" :severity="slotProps.data.updatesCount === 0 ? 'success' : 'danger'" class='ml-1'></Badge>
                {{ slotProps.data.pacenotesCount }}
              </template>
            </Column>
            <Column field="name" header="Name"></Column>
            <Column header="" style="width: 3rem">
              <template #body="slotProps">
                <Button @click="() => onOpenNotebookClick(slotProps.data.pacenotesDir)">
                  <span class="pi pi-folder-open"></span>
                </Button>
              </template>
            </Column>
            <Column field="basename" header="ID"></Column>
            <template #expansion="slotProps">
              <div class="p-3">
                <h5 class="text-xl">Pacenotes for {{ slotProps.data.name }}</h5>
                <DataTable :value="slotProps.data.pacenotes" scrollable scrollHeight="600px">
                  <Column field="name" header="Name"></Column>
                  <Column header="">
                    <template #body="slotProps">
                      <div class="flex">
                        <Button @click="() => onPlayClick(slotProps.data.audioFname)">
                          <span class="pi pi-play"></span>
                        </Button>
                        <Button class="ml-2" @click="() => onRegenOneClick(slotProps.data.audioFname)">
                          <span class="pi pi-refresh"></span>
                        </Button>
                      </div>
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
        <TabPanel header="Voice Recording">
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
                <span class="text-red-600" v-if="rallyStore.recordingError">{{rallyStore.recordingError}}</span>
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
