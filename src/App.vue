<script setup lang="ts">
import TopLevelNav from './components/TopLevelNav.vue'
import AudioPlayer from './components/AudioPlayer.vue'
</script>

<template>
  <TopLevelNav />
  <router-view />
  <AudioPlayer />
</template>
