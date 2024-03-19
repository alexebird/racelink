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
    // console.log('onNotebooksUpdated', notebooks)
    rallyStore.$patch({ notebooks: notebooks })
  })

  // window.electronAPI.onTranscribeDone((resp) => {
    // rallyStore.addTranscription(resp)
  // })
  window.electronAPI.onServerRecordingCut((cutReq) => {
    doCut(cutReq)
  })
})

onUnmounted(() => {
  window.electronAPI.rmServerRecordingCut()
  window.electronAPI.rmNotebooksUpdated()
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

const onPlayClick = (audioFname) => {
  if (audioFname) {
    audioPlayerStore.play(audioFname)
  }
}

const onRegenOneClick = (fname) => {
  window.electronAPI.regeneratePacenote(rallyStore.serializedSelectedMission, fname)
}

const openFileExplorer = () => {
  window.electronAPI.openFileExplorer(rallyStore.selectedMission.fname)
}

const onOpenNotebookClick = (fname) => {
  window.electronAPI.openFileExplorer(fname)
}

const progressBadgeStr = (slotProps) => {
  const total = slotProps.data.pacenotesCount
  return `${total - slotProps.data.updatesCount} / ${total}`
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
          <div class="flex flex-col">
            <ProgressBar :value="rallyStore.progressValue" :showValue="false"></ProgressBar>
            <DataTable
              :value="rallyStore.notebooks"
              dataKey="basename"
              tableStyle="min-width: 10rem"
              v-model:expandedRows="expandedRows"
            >
              <Column expander style="width: 3rem" />
              <Column header="Notes" style="width: 6rem" >
                <template #body="slotProps">
                  <Badge :value="progressBadgeStr(slotProps)" :severity="slotProps.data.updatesCount === 0 ? 'success' : 'danger'"></Badge>
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
                  <h5 class="text-xl">Pacenotes</h5>
                  <DataTable
                    :value="slotProps.data.pacenotes"
                    scrollable scrollHeight="600px"
                    paginator :rows="8"
                  >
                    <Column field="name" header="Name" style="width: 7rem"></Column>
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
                  </DataTable>
                </div>
              </template>
            </DataTable>
          </div>
        </TabPanel>

        <TabPanel header="Voice Recording">
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
