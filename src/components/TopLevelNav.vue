<script setup lang='js'>
import { toRaw, ref, onMounted } from "vue";
import { useSettingsStore } from "@/stores/settings"
const settingsStore = useSettingsStore()

const items = ref([
  {
    label: 'Rally',
    icon: 'pi pi-car',
    route: '/rally'
  },
  {
    label: 'Voices',
    icon: 'pi pi-comment',
    route: '/voices'
  },
  {
    label: 'Settings',
    icon: 'pi pi-sliders-h',
    route: '/settings'
  },
  // {
  //   label: 'Help',
  //   icon: 'pi pi-question-circle',
  //   route: '/help'
  // }
])

const activeIndex = ref(0)

onMounted(() => {
  window.electronAPI.getSettings().then((resp) => {
    settingsStore.$patch({settings: resp.settings, defaults: resp.defaults})
    // console.log(toRaw(settingsStore.settings.lastSelectedMission))
  })
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <TabMenu :model="items"
      :activeIndex="activeIndex"
      :ptOptions="{ mergeProps: true }"
      pt:root:class="h-full !bg-stone-800 min-w-28 max-w-28"
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
    <div class="version-info font-mono text-stone-400 text-center">
      {{settingsStore.settings.versionString}}
    </div>
  </div>
</template>

<style scoped>
[data-pc-section="menuitem"][data-p-disabled="false"][data-p-highlight="true"] [data-pc-section="action"] {
  background-color: theme(colors.stone.700);
  color: rgb(var(--surface-0));
}

[data-pc-section="action"]:hover, .version-info {
  background-color: theme(colors.stone.800);
}
</style>
