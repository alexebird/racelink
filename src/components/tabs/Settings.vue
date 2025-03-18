<script setup lang="js">

import { ref, toRaw } from 'vue'
import { useSettingsStore } from "@/stores/settings"

const settingsStore = useSettingsStore()

const openFilePickerBeamUserDir = () => {
  window.electronAPI.selectDirectory().then((selectedPath) => {
    if (selectedPath) {
      settingsStore.setSetting('beamUserDir', selectedPath)
    }
  })
}

const openFilePickerRacelinkPath = () => {
  window.electronAPI.selectDirectory().then((selectedPath) => {
    if (selectedPath) {
      settingsStore.setSetting('racelinkPath', selectedPath)
    }
  })
}

const settingChangeMinSilenceDuration = () => {
  settingsStore.setSetting('trimSilenceMinSilenceDuration', settingsStore.settings.trimSilenceMinSilenceDuration)
}

const settingChangeNoiseLevel = () => {
  settingsStore.setSetting('trimSilenceNoiseLevel', settingsStore.settings.trimSilenceNoiseLevel)
}

const onApiKeyValueUpdate = (event) => {
  settingsStore.setSetting('racerApiKey', event.target.value)
}
</script>

<template>
  <div class='flex flex-col w-full h-screen text-surface-0 bg-surface-800'>
    <div class="text-lg m-2">
      Settings
    </div>
    <div class='p-4'>
      <div>
        Beam User Dir
      </div>
      <div class='ml-4'>
        <span class="font-mono">{{settingsStore.settings.beamUserDir}}</span>
        <Button class='!block w-28 mt-2' @click="openFilePickerBeamUserDir">Change</Button>
      </div>
    </div>


    <div class='p-4'>
      <div>
        Beam Game Path
      </div>
      <div class='ml-4'>
        <span class="font-mono">{{settingsStore.settings.racelinkPath}}</span>
        <Button class='!block w-28 mt-2' @click="openFilePickerRacelinkPath">Change</Button>
      </div>
    </div>


    <!-- <div class='p-4'>
      <div>
        Voice Recording
        <div class='ml-4'>
          Trim Silence
          <div class='ml-4'>
            Noise Level (default={{settingsStore.defaults.trimSilenceNoiseLevel}} dB)
            <div>
              <span>{{settingsStore.settings.trimSilenceNoiseLevel}} dB</span>
              <Slider @change="settingChangeNoiseLevel"
                      @slideend="settingChangeNoiseLevel"
                      v-model="settingsStore.settings.trimSilenceNoiseLevel"
                      :min="-60" :max="-10" :step="0.1" class="!w-10 mt-4 mb-8 inline" />
            </div>
          </div>
          <div class='ml-4'>
            Minimum Silence Duration (default={{settingsStore.defaults.trimSilenceMinSilenceDuration}} sec)
            <div>
              <span>{{settingsStore.settings.trimSilenceMinSilenceDuration}} sec</span>
              <Slider @change="settingChangeMinSilenceDuration"
                      @slideend="settingChangeMinSilenceDuration"
                      v-model="settingsStore.settings.trimSilenceMinSilenceDuration"
                      :min="0.1" :max="5" :step="0.1" class="!w-10 mt-4 mb-8 inline" />
            </div>
          </div>
        </div>
      </div>
    </div> -->

    <div class='p-4'>
      <div>
        RaceLink API Key
        <div class='ml-4'>
          <Password
            @input="onApiKeyValueUpdate"
            v-model="settingsStore.settings.racerApiKey"
            placeholder="Enter your API key"
            :feedback="false"
            :inputStyle="{ width: '400px' }" 
            />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
