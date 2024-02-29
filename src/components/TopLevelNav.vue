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
[data-pc-section="menuitem"][data-p-disabled="false"][data-p-highlight="true"] [data-pc-section="action"] {
  background-color: theme(colors.stone.700);
  color: rgb(var(--surface-0));
}

[data-pc-section="action"]:hover {
  background-color: theme(colors.stone.800);
}
</style>
