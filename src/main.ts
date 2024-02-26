import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

import { createPinia } from 'pinia'

// import 'primevue/resources/themes/aura-light-green/theme.css'
import PrimeVue from 'primevue/config'
import Button from "primevue/button";
import InputText from 'primevue/inputtext';
import Menu from 'primevue/menu';

// import Lara from '@/presets/lara';
import Wind from '@/presets/wind';

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

app.component('Button', Button)
app.component('InputText', InputText)
app.component('Menu', Menu)

app.mount('#app').$nextTick(() => {
  // Remove Preload scripts loading
  postMessage({ payload: 'removeLoading' }, '*')

  // Use contextBridge
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
  })
})
