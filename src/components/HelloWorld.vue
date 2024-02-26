<script setup lang="ts">
import { useCounterStore } from '@/stores/count'
const store = useCounterStore()
</script>

<template>
  <!-- <h1>{{ msg }}</h1> -->

  <div class="card">
    <!-- <InputText type="text" v-model="store.count" /> -->
    <Button type="button" @click="store.increment()">count is {{ store.count }}</Button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

</template>

<style scoped>
</style>
