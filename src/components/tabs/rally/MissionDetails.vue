<script setup lang='js'>
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue"
import { useRallyStore } from "@/stores/rally"
const rallyStore = useRallyStore()
import { useSettingsStore } from "@/stores/settings"
const settingsStore = useSettingsStore()
import { useAudioPlayerStore } from "@/stores/audioPlayer"
const audioPlayerStore = useAudioPlayerStore()
import SelectButton from 'primevue/selectbutton'

const activeTab = ref(0)
const expandedRows = ref({})
const currentIndex = ref(-1);
const selectedLanguage = ref(null)
const selectedType = ref(null)
const paginationState = ref({}) // Track pagination state for each notebook

onMounted(() => {
  rallyStore.resetRecording()

  window.electronAPI.onNotebooksUpdated((event, notebooks) => {
    // Preserve pagination state when notebooks are updated
    const updatedNotebooks = notebooks.map(notebook => {
      // Initialize pagination state for this notebook if it doesn't exist
      if (!paginationState.value[notebook.basename]) {
        paginationState.value[notebook.basename] = { 
          page: 0,
          rows: 10
        }
      }
      return notebook
    })
    
    rallyStore.$patch({ notebooks: updatedNotebooks });
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

const getUniqueLanguages = (pacenotes) => {
  if (!pacenotes || pacenotes.length === 0) return []
  
  // Extract unique language values
  const uniqueLanguages = [...new Set(pacenotes.map(note => note.language))]
    .filter(lang => lang) // Filter out any undefined/null values
  
  return uniqueLanguages.map(lang => ({ name: lang, value: lang }))
}

// Memoize language options to prevent recreation on every polling update
const getLanguageOptions = (pacenotes) => {
  // Only compute once for the same set of pacenotes
  if (!pacenotes || pacenotes.length === 0) return []
  
  // Use the first pacenote's language as a sample since all should have the same options
  const firstPacenote = pacenotes[0]
  if (!firstPacenote || !firstPacenote.language) return []
  
  // Get all unique languages from the pacenotes
  return getUniqueLanguages(pacenotes)
}

// Get type options (Freeform/Structured)
const getTypeOptions = () => {
  return [
    { name: 'Freeform', value: 'freeform' },
    { name: 'Structured', value: 'structured' },
    { name: 'System', value: 'system' }
  ]
}

// Get the base pacenote name (e.g., "Pacenote 1" from "Pacenote 1 [0]")
const getBasePacenoteName = (name) => {
  if (!name) return '';
  // Extract the base name (e.g., "Pacenote 1" from "Pacenote 1 [0]")
  const match = name.match(/^(Pacenote \d+)/);
  return match ? match[1] : name;
}

// Get the pacenote number from the base name
const getPacenoteNumber = (name) => {
  if (!name) return -1;
  const baseName = getBasePacenoteName(name);
  const match = baseName.match(/Pacenote (\d+)/);
  return match ? parseInt(match[1], 10) : -1;
}

// Determine row class based on the pacenote number
const getRowClass = (data) => {
  if (!data || !data.name) return '';
  
  const number = getPacenoteNumber(data.name);
  if (number === -1) return '';
  
  // Apply different class based on whether the pacenote number is even or odd
  return number % 2 === 0 ? 'even-pacenote-group' : 'odd-pacenote-group';
}

// Process pacenotes to add a type field
const processPacenotes = (pacenotes) => {
  if (!pacenotes) return []
  
  return pacenotes.map(note => {
    // Create a new object with all the original properties
    const processedNote = { ...note }
    
    // Add a type field based on the name pattern
    if (!note.name) {
      processedNote.type = 'freeform'
    } else if (!note.name.startsWith('Pacenote ')) {
      processedNote.type = 'system'
    } else if (note.name.match(/\[\d+\]/)) {
      processedNote.type = 'structured'
    } else {
      processedNote.type = 'freeform'
    }
    
    return processedNote
  })
}

// Filter pacenotes based on selected language and type
const filterPacenotes = (pacenotes) => {
  if (!pacenotes) return []
  
  // First process the pacenotes to add the type field
  const processedPacenotes = processPacenotes(pacenotes)
  
  // Then filter based on the selected criteria
  return processedPacenotes.filter(note => {
    // Apply language filter if selected
    const languageMatch = !selectedLanguage.value || note.language === selectedLanguage.value
    
    // Apply type filter if selected
    const typeMatch = !selectedType.value || note.type === selectedType.value
    
    return languageMatch && typeMatch
  })
}

// Method to handle pagination state changes
const onPageChange = (event, notebookId) => {
  if (!paginationState.value[notebookId]) {
    paginationState.value[notebookId] = {}
  }
  
  // Update pagination state with new values
  paginationState.value[notebookId] = {
    page: event.page,
    rows: event.rows
  }
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
            <Button class="mr-4" @click="openFileExplorer"
              icon="pi pi-folder-open" label="Open Mission"
              v-tooltip="'Open an Explorer window for this mission'"
            ></Button>
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
              <Column field="updatedAgo" header="Last Saved"></Column>
              <Column header="" style="width: 3rem">
                <template #body="slotProps">
                  <Button @click="() => onOpenNotebookClick(slotProps.data.pacenotesDir)"
                    v-tooltip.top="'Open an Explorer window for this notebook'"
                    icon="pi pi-folder-open"></Button>
                </template>
              </Column>
              <Column field="basename" header="ID"></Column>
              <template #expansion="slotProps">
                <div class="p-3">
                  <h5 class="text-xl">Pacenotes</h5>
                  
                  <div class="mb-3 flex flex-wrap items-center gap-4">
                    <div class="flex items-center">
                      <label class="mr-2">Filter by language:</label>
                      <SelectButton v-model="selectedLanguage" 
                        :options="getLanguageOptions(slotProps.data.pacenotes)" 
                        optionLabel="name" 
                        optionValue="value"
                        :allowEmpty="true" />
                    </div>
                    
                    <div class="flex items-center">
                      <label class="mr-2">Filter by type:</label>
                      <SelectButton v-model="selectedType" 
                        :options="getTypeOptions()" 
                        optionLabel="name" 
                        optionValue="value"
                        :allowEmpty="true" />
                    </div>
                  </div>
                  
                  <DataTable
                    :value="filterPacenotes(slotProps.data.pacenotes)"
                    :paginator="true"
                    :rows="paginationState[slotProps.data.basename]?.rows || 10"
                    :rowsPerPageOptions="[5, 10, 20, 50]"
                    rowHover
                    :rowClass="(data) => getRowClass(data)"
                    class="pacenotes-table"
                    :first="paginationState[slotProps.data.basename]?.page * (paginationState[slotProps.data.basename]?.rows || 10)"
                    @page="onPageChange($event, slotProps.data.basename)"
                  >
                    <Column field="name" header="Name" style="width: 120px" class="fixed-width-column"></Column>
                    <Column header="" style="width: 80px" class="fixed-width-column">
                      <template #body="slotProps">
                        <div class="flex">
                          <Button @click="() => onPlayClick(slotProps.data.audioFname)"
                            class="p-button-sm p-button-icon-only mini-button">
                            <span class="pi pi-play text-xs"></span>
                          </Button>
                          <Button class="ml-1 p-button-sm p-button-icon-only mini-button" @click="() => onRegenOneClick(slotProps.data.audioFname)">
                            <span class="pi pi-refresh text-xs"></span>
                          </Button>
                          <Button class="ml-1 p-button-sm p-button-icon-only mini-button" 
                            v-tooltip.top="'Voice: ' + slotProps.data.voice + '\nType: ' + slotProps.data.type + '\nLanguage: ' + slotProps.data.language + '\nFile: ' + slotProps.data.audioFname">
                            <span class="pi pi-info-circle text-xs"></span>
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
                    <!-- <Column field="language" header="Language"></Column> -->
                    
                    <!-- Add a row template to apply the tooltip to the entire row -->
                    <template #row="slotProps">
                      <tr v-tooltip.top="'Voice: ' + slotProps.data.voice + ' | Type: ' + slotProps.data.type" 
                          :class="getRowClass(slotProps.data)">
                        <td style="width: 120px" class="fixed-width-column">{{ slotProps.data.name }}</td>
                        <td style="width: 80px" class="fixed-width-column">
                          <div class="flex">
                            <Button @click="() => onPlayClick(slotProps.data.audioFname)"
                              class="p-button-sm p-button-icon-only mini-button">
                              <span class="pi pi-play text-xs"></span>
                            </Button>
                            <Button class="ml-1 p-button-sm p-button-icon-only mini-button" @click="() => onRegenOneClick(slotProps.data.audioFname)">
                              <span class="pi pi-refresh text-xs"></span>
                            </Button>
                            <Button class="ml-1 p-button-sm p-button-icon-only mini-button" 
                              v-tooltip.top="'Voice: ' + slotProps.data.voice + ' | Type: ' + slotProps.data.type + ' | Language: ' + slotProps.data.language">
                              <span class="pi pi-info-circle text-xs"></span>
                            </Button>
                          </div>
                        </td>
                        <td>
                          <span class="font-mono">
                            {{ slotProps.data.note}}
                          </span>
                        </td>
                        <td>{{ slotProps.data.language }}</td>
                      </tr>
                    </template>
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
/* Apply colors based on pacenote group */
:deep(.even-pacenote-group) {
  background-color: rgb(var(--surface-700));
}

:deep(.odd-pacenote-group) {
  background-color: transparent;
}

/* Custom mini button styling */
:deep(.mini-button) {
  width: 1.5rem !important;
  height: 1.5rem !important;
  padding: 0 !important;
}

:deep(.mini-button .p-button-icon) {
  font-size: 0.75rem;
}

/* Fixed width column styling */
:deep(.fixed-width-column) {
  max-width: none !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Scrollable table styling */
:deep(.pacenotes-table) {
  /* No special styling needed for paginated table */
}

:deep(.pacenotes-table .p-datatable-wrapper) {
  /* No special styling needed for paginated table */
}
</style>
