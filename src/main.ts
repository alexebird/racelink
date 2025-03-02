import { createApp } from 'vue'
import './style.css'
import './flags.css'
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

import Tooltip from 'primevue/tooltip'
app.directive('tooltip', Tooltip)

import ProgressSpinner from 'primevue/progressspinner'
app.component('ProgressSpinner', ProgressSpinner)

import ProgressBar from 'primevue/progressbar'
app.component('ProgressBar', ProgressBar)

import Button from 'primevue/button'
app.component('Button', Button)

import ConfirmPopup from 'primevue/confirmpopup'
app.component('ConfirmPopup', ConfirmPopup)

import InputText from 'primevue/inputtext'
app.component('InputText', InputText)

import Password from 'primevue/password'
app.component('Password', Password)

import Dropdown from 'primevue/dropdown'
app.component('Dropdown', Dropdown)

import TabMenu from 'primevue/tabmenu'
app.component('TabMenu', TabMenu)

import TabView from 'primevue/tabview'
app.component('TabView', TabView)

import TabPanel from 'primevue/tabpanel'
app.component('TabPanel', TabPanel)

import Listbox from 'primevue/listbox';
app.component('Listbox', Listbox)

// import Menu from 'primevue/menu'
// app.component('Menu', Menu)

import Tree from 'primevue/tree'
app.component('Tree', Tree)

import DataTable from 'primevue/datatable';
app.component('DataTable', DataTable);
import TreeTable from 'primevue/treetable';
app.component('TreeTable', TreeTable);
import Column from 'primevue/column';
app.component('Column', Column);
import ColumnGroup from 'primevue/columngroup';   // optional
app.component('ColumnGroup', ColumnGroup);
import Row from 'primevue/row';                   // optional
app.component('Row', Row);
import InlineMessage from 'primevue/inlinemessage'
app.component('InlineMessage', InlineMessage)
import Badge from 'primevue/badge'
app.component('Badge', Badge)
import Slider from 'primevue/slider';
app.component('Slider', Slider);
import ScrollPanel from 'primevue/scrollpanel'
app.component('ScrollPanel', ScrollPanel);

import Card from 'primevue/card'
app.component('Card', Card)

// import { useToast } from 'primevue/useToast'
// app.component('useToast', useToast)

import ToastService from 'primevue/toastservice';
app.use(ToastService);

import ConfirmationService from 'primevue/confirmationservice'
app.use(ConfirmationService)

app.mount('#app')
