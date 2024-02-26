<script setup lang='ts'>
import { ref } from "vue";

const items = ref([
  {
    label: 'Rally',
    icon: 'pi pi-car',
    route: '/rally'
  },
  {
    label: 'Help',
    icon: 'pi pi-palette',
    route: '/rally2'
  }
])
</script>

<template>
  <TabMenu :model="items" pt:root:class="h-screen !bg-stone-800" pt:menu:class="flex flex-col">
    <template #item="{ item, props }">
      <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
        <a :href="href" v-bind="props.action" @click="navigate">
          <span v-bind="props.icon" />
          <span v-bind="props.label">{{ item.label }}</span>
        </a>
      </router-link>
    </template>
  </TabMenu>
</template>

<style scoped>
/* .top-level-nav { */
  /* display: flex; */
  /* flex-direction: column; */
  /* width: 200px; */
/* } */
</style>
