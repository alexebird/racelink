<script setup lang="js">
const helpUrl = "https://alexebird.github.io/beamng-aipacenotes-mod/racelink.html"

const openHelp = () => {
  window.electronAPI.openExternal(helpUrl)
}
</script>

<template>
  <!-- <div class='flex flex-col w-full h-screen text-surface-0 bg-surface-800'> -->
  <div class='flex flex-col w-full'>
    <div class='p-4'>
      Help is available: <span @click="openHelp" class="text-primary-400 cursor-pointer underline">{{ helpUrl }}</span>
    </div>
  </div>
</template>
