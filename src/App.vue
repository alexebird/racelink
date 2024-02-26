<script setup lang="ts">
import TopLevelNav from './components/TopLevelNav.vue';
</script>

<template>
  <TopLevelNav />
  <router-view />
</template>

<style>
#app {
  display: flex;
}
</style>
