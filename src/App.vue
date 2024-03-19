<script setup lang="ts">
import { ref, provide } from 'vue'
import TopLevelNav from './components/TopLevelNav.vue'
import AudioPlayer from './components/AudioPlayer.vue'
</script>

<template>
  <TopLevelNav />
  <router-view />
  <AudioPlayer />
</template>
