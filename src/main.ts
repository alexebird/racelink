import "primeicons/primeicons.css";
import "./style.css";
import "./flags.css";

import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)

app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});

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

import Tabs from 'primevue/tabs'
app.component('Tabs', Tabs)

import Tab from 'primevue/tab'
app.component('Tab', Tab)

import TabList from 'primevue/tablist'
app.component('TabList', TabList)

import TabPanel from 'primevue/tabpanel'
app.component('TabPanel', TabPanel)

import Listbox from 'primevue/listbox';
app.component('Listbox', Listbox)

import Tree from 'primevue/tree'
app.component('Tree', Tree)

import DataTable from 'primevue/datatable';
app.component('DataTable', DataTable);

import TreeTable from 'primevue/treetable';
app.component('TreeTable', TreeTable);

import Column from 'primevue/column';
app.component('Column', Column);

import ColumnGroup from 'primevue/columngroup';
app.component('ColumnGroup', ColumnGroup);

import Row from 'primevue/row';
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

import ToastService from 'primevue/toastservice';
app.use(ToastService);

import ConfirmationService from 'primevue/confirmationservice'
app.use(ConfirmationService)

app.mount('#app')
