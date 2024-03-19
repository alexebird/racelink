import { createRouter, createWebHashHistory } from 'vue-router';
import Rally from '@/components/tabs/Rally.vue';
import Voices from '@/components/tabs/Voices.vue';
import Settings from '@/components/tabs/Settings.vue';
import Help from '@/components/tabs/Help.vue';

const routes = [
  { path: '/', redirect: '/rally' },
  { path: '/rally', component: Rally },
  { path: '/voices', component: Voices },
  { path: '/settings', component: Settings },
  { path: '/help', component: Help },
];

const router = createRouter({
  history: createWebHashHistory(), // Use hash mode for Electron apps
  routes,
});

export default router;
