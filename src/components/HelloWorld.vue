<script setup lang="ts">
import { ref } from 'vue'

import { useCounterStore } from '@/stores/count'
const store = useCounterStore()

//defineProps<{ msg: string }>()

//const count = ref(0)
//const value = ref(null)
</script>

<template>
  <!-- <h1>{{ msg }}</h1> -->

  <div class="card">
    <InputText type="text" v-model="store.count" />
    <Button type="button" @click="store.increment()">count is {{ store.count }}</Button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

</template>

<style scoped>
</style>
