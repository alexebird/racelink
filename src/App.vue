<script setup lang="ts">
import { ref, provide } from 'vue'
import TopLevelNav from './components/TopLevelNav.vue'
import AudioPlayer from './components/AudioPlayer.vue'

// const audioPlayerRef = ref(null)
//
// const playAudio = (fname) => {
//   if (audioPlayerRef.value) {
//     audioPlayerRef.value.play(fname)
//   }
// };

// provide('playAudio', playAudio)

</script>

<template>
  <TopLevelNav />
  <router-view />
  <AudioPlayer />
</template>

<style>
/* #app { */
/*   display: flex; */
/* } */
</style>
