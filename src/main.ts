import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

import { createPinia } from 'pinia'

// import 'primevue/resources/themes/aura-light-green/theme.css'
import PrimeVue from 'primevue/config'

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

// import Button from 'primevue/button'
// app.component('Button', Button)

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


const conf = {
  audio: {
    autoGainControl: false,
    noiseSuppression: false,
    echoCancellation: false
  }
}
// const conf = { audio: true }
navigator.mediaDevices.getUserMedia(conf)
.then(stream => {
  const mediaRecorder = new MediaRecorder(stream);
  let audioChunks = [];

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.onloadend = () => {
      window.electronAPI.saveAudio(reader.result, 'output.webm');
    };
    reader.readAsArrayBuffer(audioBlob);
  };

  // Start recording
  mediaRecorder.start();

  // Example: Stop recording after 5 seconds
  setTimeout(() => {
    mediaRecorder.stop();
  }, 5000);
})
.catch(error => {
  console.error('Error accessing the microphone:', error);
});

// Listen for save response
// ipcRenderer.on('save-audio-response', (event, status) => {
  // console.log('Save audio response:', status);
// });
