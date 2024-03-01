import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

import { createPinia } from 'pinia'

// import 'primevue/resources/themes/aura-light-green/theme.css'
import PrimeVue from 'primevue/config'
import { usePassThrough } from 'primevue/passthrough'
// import Lara from '@/presets/lara';
import Wind from '@/presets/wind';

const pinia = createPinia()

const app = createApp(App)

app.use(pinia)
app.use(router)

const CustomPreset = usePassThrough(
  Wind,
  {},
  {
    mergeSections: true,
    mergeProps: true
  }
);

app.use(PrimeVue, {
  unstyled: true,
  pt: CustomPreset,
})

import Button from 'primevue/button'
app.component('Button', Button)

// import InputText from 'primevue/inputtext'
// app.component('InputText', InputText)

import TabMenu from 'primevue/tabmenu'
app.component('TabMenu', TabMenu)

import TabView from 'primevue/tabview'
app.component('TabView', TabView)

import TabPanel from 'primevue/tabpanel'
app.component('TabPanel', TabPanel)

// import Menu from 'primevue/menu'
// app.component('Menu', Menu)

import Tree from 'primevue/tree'
app.component('Tree', Tree)

import DataTable from 'primevue/datatable';
app.component('DataTable', DataTable);
import Column from 'primevue/column';
app.component('Column', Column);
import ColumnGroup from 'primevue/columngroup';   // optional
app.component('ColumnGroup', ColumnGroup);
import Row from 'primevue/row';                   // optional
app.component('Row', Row);

// import Card from 'primevue/card'
// app.component('Card', Card)

// import { useToast } from 'primevue/useToast'
// app.component('useToast', useToast)

import ToastService from 'primevue/toastservice';
app.use(ToastService);

app.mount('#app')
// .$nextTick(() => {
  // Remove Preload scripts loading
  // postMessage({ payload: 'removeLoading' }, '*')

  // Use contextBridge
  // ipcRenderer.on('main-process-message', (_event, message) => {
  //   console.log(message)
  // })

  // setInterval(() => {
    // console.log('scanning');
    // ipcRenderer.send('scan-missions');
    // const matchingDirs = listMatchingDirectories(baseDir);
    // Process the matching directories as needed
  // }, 1000); // Check every 10000 milliseconds (10 seconds)
// })
