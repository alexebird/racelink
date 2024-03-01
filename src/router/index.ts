import { createRouter, createWebHashHistory } from 'vue-router';
import Rally from '@/components/tabs/Rally.vue';
import Settings from '@/components/tabs/Settings.vue';

const routes = [
  { path: '/', redirect: '/rally' },
  { path: '/rally', component: Rally },
  { path: '/settings', component: Settings },
];

const router = createRouter({
  history: createWebHashHistory(), // Use hash mode for Electron apps
  routes,
});

export default router;
