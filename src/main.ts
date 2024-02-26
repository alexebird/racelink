import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

import { createPinia } from 'pinia'

// import 'primevue/resources/themes/aura-light-green/theme.css'
import PrimeVue from 'primevue/config'

// import Lara from '@/presets/lara';
import Wind from '@/presets/wind';

// const ipcRenderer = window.ipcRenderer

const pinia = createPinia()

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(PrimeVue, {
  // ripple: true
  unstyled: true,
  // pt: Lara,
  pt: Wind,
})

// import Button from 'primevue/button'
// app.component('Button', Button)

// import InputText from 'primevue/inputtext'
// app.component('InputText', InputText)

import Menu from 'primevue/menu'
app.component('Menu', Menu)

import Tree from 'primevue/tree'
app.component('Tree', Tree)

import ToastService from 'primevue/toastservice';
app.use(ToastService);

// import { useToast } from 'primevue/useToast'
// app.component('useToast', useToast)

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
