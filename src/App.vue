<script setup lang="ts">
import TopLevelNav from './components/TopLevelNav.vue'
import AudioPlayer from './components/AudioPlayer.vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

window.electronAPI.onToast((data) => {
  toast.add(data)
  console.log('toast', data)
})

</script>

<template>
  <Toast />
  <TopLevelNav />
  <router-view />
  <AudioPlayer />
</template>
