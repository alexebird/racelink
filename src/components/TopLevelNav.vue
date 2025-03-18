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
  {
    label: 'Help',
    icon: 'pi pi-question-circle',
    route: '/help'
  }
])

const activeIndex = ref(0)

onMounted(() => {
  window.electronAPI.getSettings().then((resp) => {
    settingsStore.$patch({settings: resp.settings, defaults: resp.defaults})
    // console.log(toRaw(settingsStore.settings.lastSelectedMission))

    document.title = `RaceLink ${settingsStore.settings.versionString}`
  })
})
</script>

<template>
  <div class="grid grid-cols-1 grid-rows-[1fr_1.5em] h-screen w-full">
    <!-- <Tabs :model="items"
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
    </Tabs> -->
    <Tabs value="0" class="h-full w-full">
      <TabList>
        <Tab value="0">
          <span class="pi pi-car" />
          <span>Rally</span>
        </Tab>
        <Tab value="1">
          <span class="pi pi-comment" />
          <span>Voices</span>
        </Tab>
        <Tab value="2">
          <span class="pi pi-sliders-h" />
          <span>Settings</span>
        </Tab>
        <Tab value="3">
          <span class="pi pi-question-circle" />
          <span>Help</span>
        </Tab>
      </TabList>
      <TabPanels class="h-full">
        <TabPanel value="0" class="h-full">
          <Rally />
        </TabPanel>
        <TabPanel value="1" class="h-full">
          <Voices />
        </TabPanel>
        <TabPanel value="2" class="h-full">
          <Settings />
        </TabPanel>
        <TabPanel value="3" class="h-full">
          <Help />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <div class="font-mono text-sm pl-2 pr-2 align-middle">
      {{settingsStore.settings.versionString}}
    </div>

  </div>
</template>

<style scoped>
/* [data-pc-section="menuitem"][data-p-disabled="false"][data-p-highlight="true"] [data-pc-section="action"] {
  background-color: theme(colors.stone.700);
  color: rgb(var(--surface-0));
}

[data-pc-section="action"]:hover, .version-info {
  background-color: theme(colors.stone.800);
} */

.pi + span {
  @apply ml-2;
}
</style>
