<script setup lang="js">
import { ref, inject, onMounted, onUnmounted, computed } from "vue"
// import { useSettingsStore } from "@/stores/settings"
// const settingsStore = useSettingsStore()
// import { useRallyStore } from "@/stores/rally"
// const rallyStore = useRallyStore()
import { useVoicesStore } from "@/stores/voices"
const voicesStore = useVoicesStore()
import { useAudioPlayerStore } from "@/stores/audioPlayer"
const audioPlayerStore = useAudioPlayerStore()

// import { useConfirm } from "primevue/useconfirm";
// const confirm = useConfirm();

// Add these imports for the DataTable component
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';

const spinnerClass = ref('hidden')
const searchQuery = ref('')

// Custom search function that ANDs search components together
const filteredVoices = computed(() => {
  if (!voicesStore.voiceData || !voicesStore.voiceData.voices) {
    return []
  }

  const voices = Object.entries(voicesStore.voiceData.voices).map(([key, value]) => ({
    id: key,
    data: value,
    json: JSON.stringify(value, null, 2),
    type: value.text_to_speech?.type || 'unknown',
    name: value.text_to_speech?.info?.name || key
  }))

  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return voices
  }

  // Split search query by spaces and filter out empty strings
  const searchTerms = searchQuery.value.trim().toLowerCase().split(/\s+/).filter(term => term.length > 0)
  
  if (searchTerms.length === 0) {
    return voices
  }

  return voices.filter(voice => {
    // Create a combined search string from all searchable fields
    const searchableText = [
      voice.id,
      voice.name,
      voice.type,
      voice.json
    ].join(' ').toLowerCase()

    // Check if ALL search terms are present (AND logic)
    return searchTerms.every(term => searchableText.includes(term))
  })
})

onMounted(() => {
  refreshVoices()
})

onUnmounted(() => {
  voicesStore.$reset()
})

function showSpinner() {
  spinnerClass.value = ''
}

function hideSpinner() {
  spinnerClass.value = '!invisible'
}

const refreshVoices = () => {
  showSpinner()
  voicesStore.refreshVoices().then(([voiceData, err]) => {
    hideSpinner()
    if (err) {
      console.error(err)
    }
  })
}

const testSpecificVoice = (voiceId, voiceData) => {
  showSpinner()
  
  // Create a plain serializable object by removing any proxy/reactive wrappers
  const voiceConfig = {
    text_to_speech: JSON.parse(JSON.stringify(voiceData.text_to_speech))
  }
  
  console.log("Testing voice with config:", voiceConfig);
  console.log("Test text:", voicesStore.testText);
  
  voicesStore.testVoice(voiceConfig)
    .then((audioFname) => {
      console.log("Received audio filename:", audioFname);
      hideSpinner()
      if (audioFname) {
        console.log("Attempting to play:", audioFname);
        audioPlayerStore.play(audioFname)
      } else {
        console.warn("No audio filename returned from voice test");
      }
    })
    .catch((error) => {
      hideSpinner()
      console.error("Error testing voice:", error)
    })
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log(`Voice ID '${text}' copied to clipboard`);
    })
    .catch(err => {
      console.error('Failed to copy: ', err);
    });
}
</script>

<template>
  <div class='flex flex-col w-full h-full'>
    <div class="flex ml-2">
      <div class="flex flex-row items-center gap-2">
        <Button @click="refreshVoices" label="refresh voices" class="!pt-px !pb-px !pl-2 !pr-2" icon="pi pi-refresh" size="small" />
        <ProgressSpinner :class="spinnerClass" style="width: 30px; height: 30px" strokeWidth="4" animationDuration=".5s" />
      </div>
    </div>

    <div class="m-2">
      <!-- Debug section -->
      <div v-if="voicesStore.voiceData" class="mb-4 p-2">
        <div>Voice count: {{ voicesStore.voiceData.voices ? Object.keys(voicesStore.voiceData.voices).length : 0 }}</div>
      </div>

      <div class="overflow-auto" style="max-height: calc(100vh - 200px);">
        <DataTable v-if="voicesStore.voiceData && voicesStore.voiceData.voices" 
                  :value="filteredVoices" 
                  stripedRows 
                  paginator 
                  :rows="10"
                  tableStyle="min-width: 50rem">
          <template #header>
            <div class="flex justify-between">
              <span class="p-input-icon-left">
                <i class="pi pi-search mr-2" />
                <InputText v-model="searchQuery" placeholder="Search voices (space-separated terms, all must match)..." />
              </span>
              <div class="text-sm text-gray-600 self-center">
                Showing {{ filteredVoices.length }} of {{ Object.keys(voicesStore.voiceData.voices).length }} voices
              </div>
            </div>
          </template>
          <Column field="id" header="BeamNG Voice ID" sortable></Column>
          <Column field="name" header="Name" sortable></Column>
          <Column field="type" header="Provider" sortable></Column>
          <Column header="Details">
            <template #body="slotProps">
              <Button icon="pi pi-info-circle" 
                      class="p-button-sm p-button-rounded p-button-text" 
                      v-tooltip.top="{ 
                        value: `<pre>${slotProps.data.json}</pre>`, 
                        escape: false,
                        class: 'monospace-tooltip' 
                      }"/>
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button icon="pi pi-play" 
                        class="p-button-sm p-button-rounded" 
                        @click="testSpecificVoice(slotProps.data.id, slotProps.data.data)"
                        title="Test Voice"/>
                <Button icon="pi pi-copy" 
                        class="p-button-sm p-button-rounded p-button-secondary" 
                        @click="copyToClipboard(slotProps.data.id)"
                        v-tooltip.top="'Copy Voice ID to clipboard'"/>
              </div>
            </template>
          </Column>
        </DataTable>
        <div v-else-if="voicesStore.voiceDataError" class="text-red-500 p-3">
          Error loading voices: {{ voicesStore.voiceDataError }}
        </div>
        <div v-else class="p-3">
          No voice data available. Click "Refresh Voices" to load voices.
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* More specific selector for tooltip styling */
.monospace-tooltip {
  font-family: monospace !important;
  max-width: 600px !important;
  font-size: 12px !important;
  overflow: auto !important;
  max-height: 400px !important;
  text-align: left !important;
}
</style>
