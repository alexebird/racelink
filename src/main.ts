import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { createPinia } from 'pinia'

import 'primevue/resources/themes/aura-light-green/theme.css'
import PrimeVue from 'primevue/config'
import Button from "primevue/button";
import InputText from 'primevue/inputtext';

const pinia = createPinia()

const app = createApp(App)

app.use(pinia)

app.use(PrimeVue, { ripple: true })

app.component('Button', Button)
app.component('InputText', InputText)

app.mount('#app').$nextTick(() => {
  // Remove Preload scripts loading
  postMessage({ payload: 'removeLoading' }, '*')

  // Use contextBridge
  window.ipcRenderer.on('main-process-message', (_event, message) => {
    console.log(message)
  })
})
