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
  <TabMenu :model="items"
    class='top-level-tabmenu'
    :ptOptions="{ mergeProps: true }"
    pt:root:class="h-screen !bg-stone-800 min-w-24 max-w-24"
    pt:menu:class="flex-col"
    pt:action:class="bg-stone-800 !rounded-none !border-none"
  >
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
/* .top-level-tabmenu  { */
/*   background-color: red !important; */
/* } */

[data-pc-section="menuitem"][data-p-disabled="false"][data-p-highlight="true"] [data-pc-section="action"] {
  /* background-color: rgb(var(--stone-400)); */
  background-color: theme(colors.stone.700);
  /* color: theme(colors.stone.800); */
  color: rgb(var(--surface-0));
  /* background-color: red; */
}

[data-pc-section="action"]:hover {
  background-color: theme(colors.stone.800);
  /* font-weight: bold; */
}
</style>
