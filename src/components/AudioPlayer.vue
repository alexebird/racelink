<script setup lang="js">
import { ref, provide, onMounted, onUnmounted } from "vue"
import { useAudioPlayerStore } from "@/stores/audioPlayer"
const audioPlayerStore = useAudioPlayerStore()
const audioElement = ref(null)

onMounted(() => {
  audioPlayerStore.setAudioElement(audioElement.value)
})
</script>

<template>
  <audio ref="audioElement">
    <source type="audio/ogg">
  </audio>
</template>
