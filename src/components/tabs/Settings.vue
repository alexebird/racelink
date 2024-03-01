<script setup lang="js">
// import { ref, onMounted, onUnmounted } from "vue"
import { useSettingsStore } from "@/stores/settings"
const settingsStore = useSettingsStore()

// import { useRallyStore } from "@/stores/rally"
// const rallyStore = useRallyStore()

// onMounted(() => {
// })
//
// onUnmounted(() => {
// })

const openFilePicker = () => {
  window.electronAPI.openFilePicker()
}

window.electronAPI.onDirectorySelected((event, path) => {
  settingsStore.setSetting('beamUserDir', path)
})
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
        <Button class='!block w-28 mt-2' @click="openFilePicker">Change</Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>

