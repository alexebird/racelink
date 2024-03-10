import { createRouter, createWebHashHistory } from 'vue-router';
import Rally from '@/components/tabs/Rally.vue';
import Voices from '@/components/tabs/Voices.vue';
import Settings from '@/components/tabs/Settings.vue';

const routes = [
  { path: '/', redirect: '/voices' },
  { path: '/rally', component: Rally },
  { path: '/voices', component: Voices },
  { path: '/settings', component: Settings },
];

const router = createRouter({
  history: createWebHashHistory(), // Use hash mode for Electron apps
  routes,
});

export default router;
