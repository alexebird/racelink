<script setup lang="js">
import { ref, onMounted, onUnmounted } from "vue"
// import { useSettingsStore } from "@/stores/settings"
// import { useRallyStore } from "@/stores/rally"
import { useVoicesStore } from "@/stores/voices"

import { useConfirm } from "primevue/useconfirm";
const confirm = useConfirm();

// const settingsStore = useSettingsStore()
// const rallyStore = useRallyStore()
const voicesStore = useVoicesStore()

const audioElement = ref(null)
const audioSource = ref('')
const spinnerClass = ref('hidden')

onMounted(() => {
  voicesStore.loadVoiceData()
  voicesStore.loadUserVoiceData()
  refreshVoices()
})

onUnmounted(() => {
  voicesStore.$reset()
})

window.electronAPI.onVoiceStoreDataUpdated((event) => {
  console.log('voice data updated')
  voicesStore.loadVoiceData()
})

function fileProtoAudioFname(audioFname) {
  const url = new URL(`file://${audioFname}`)
  url.searchParams.set('t', Date.now());
  return url.href
}

window.electronAPI.onVoiceTestFileReady((event, fname) => {
  const url = fileProtoAudioFname(fname)
  console.log('voice test file ready', url)

  audioElement.value.src = url
  audioElement.value.volume = 0.3
  audioElement.value.play().catch(error => console.error("Error playing audio:", error));

  spinnerClass.value = 'hidden'
})

const refreshVoices = () => {
  window.electronAPI.updateVoicesStore()
}

const saveVoice = () => {
  const formVoice = voicesStore.formVoice
  if (formVoice) {
    // console.log(formVoice)
    const [name, voiceData] = formVoice
    voicesStore.updateUserVoices(name, voiceData)
  }
}

const newVoice = () => {
  voicesStore.newVoice()
}

const testVoice = () => {
  spinnerClass.value = ''
  const text = "into three right opens over crest? fifty."
  voicesStore.testVoice(text)
}

const onListSelectionChange = () => {
  // const selected = voicesStore.selectedUserVoice
  // if (selected) {
    voicesStore.setFormToSelectedVoice()
  // }
}

const confirmDelete = (event) => {
  confirm.require({
    target: event.currentTarget,
    message: 'Do you want to delete this voice?',
    icon: 'pi pi-info-circle',
    rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
    acceptClass: 'p-button-danger p-button-sm',
    rejectLabel: 'Cancel',
    acceptLabel: 'Delete',
    accept: () => {
      voicesStore.deleteSelectedUserVoice()
    },
    reject: () => {
    }
  });
};

</script>

<template>
  <audio ref="audioElement">
    <source type="audio/ogg">
  </audio>
  <div class='flex flex-col w-full h-screen text-surface-0 bg-surface-800'>
    <div class="text-lg m-2">
      Voices
    </div>
        <!-- <div> -->
        <!--   <Button @click="refreshVoices"> -->
        <!--     Refresh Voices -->
        <!--   </Button> -->
        <!-- </div> -->

    <div class="flex">

      <div class="flex flex-col gap-2">

        <Button @click="newVoice" class="w-24">New Voice</Button>

        <Listbox
          @change="onListSelectionChange"
          v-model="voicesStore.selectedUserVoice"
          :options="voicesStore.listboxUserVoices"
          optionLabel="name"
          class="min-h-96"
        >
        </Listbox>
      </div>

      <div class="ml-4">

        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-2 w-64 ">
            <label for="user_voice_name">Name</label>
            <!-- <InputText type="text" v-model="value" /> -->
            <InputText id="user_voice_name" v-model="voicesStore.form.user_voice_name" aria-describedby="user_voice_name-help" />
            <small id="user_voice_name-help">Your own name for this voice.</small>
          </div>

          <div class="flex flex-col gap-2">
            <label for="tts_language_code">Voice</label>
            <!-- <InputText type="text" v-model="value" /> -->
            <!-- <InputText id="tts_language_code" v-model="voicesStore.form.text_to_speech.language_code" aria-describedby="tts_language_code-help" /> -->
            <!-- <small id="tts_language_code-help">Give a name for this voice.</small> -->

            <Dropdown v-model="voicesStore.form.dropdownVoice" :options="voicesStore.dropdownVoices" filter optionLabel="dropdown_display_name" placeholder="Select a Voice" class="min-w-96 w-[32rem]">
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex align-items-center">
                  <img :alt="slotProps.value.dropdown_display_name" src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png" :class="`mr-2 flag flag-${slotProps.value.country_code.toLowerCase()}`" />
                  <div>{{ slotProps.value.dropdown_display_name }}</div>
                </div>
                <span v-else>
                  {{ slotProps.placeholder }}
                </span>
              </template>
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <img :alt="slotProps.option.dropdown_display_name" src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png" :class="`mr-2 flag flag-${slotProps.option.country_code.toLowerCase()}`"  />
                  <div>{{ slotProps.option.dropdown_display_name }}</div>
                </div>
              </template>
            </Dropdown>
            <small>
              <div class="font-bold">Recommended voice type is Neural2, then Wavenet, then Standard.</div>
              Voice types:
              <ul class="ml-8 list-disc">
                <!-- <li>Journey - latest tech</li> -->
                <!-- <li>Casual - casual speech patterns</li> -->
                <li>Neural2 - best general purpose, supports most languages</li>
                <!-- <li>News - sounds like the news</li> -->
                <!-- <li>Studio - sounds like an audiobook</li> -->
                <li>Wavenet - general purpose, older tech than Neural2</li>
                <!-- <li>Polyglot - can speak multiple languages</li> -->
                <li>Standard - general purpose, older tech than Wavenet</li>
              </ul>
            </small>
          </div>

          <ConfirmPopup></ConfirmPopup>
          <div class="flex gap-2">
            <Button @click="saveVoice" class="w-16" label="Save"></Button>
            <Button @click="confirmDelete($event)" class="w-16" label="Delete" severity="danger"></Button>
            <div class="flex w-32">
              <Button @click="testVoice" class="w-16" label="Test" severity="secondary"></Button>
              <ProgressSpinner :class='spinnerClass' style="width: 30px; height: 30px" strokeWidth="4" animationDuration=".5s" />
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
