import { createRouter, createWebHashHistory } from 'vue-router';
import Rally from '@/components/topLevel/Rally.vue';

const routes = [
  { path: '/', redirect: '/rally' },
  { path: '/rally', component: Rally },
];

const router = createRouter({
  history: createWebHashHistory(), // Use hash mode for Electron apps
  routes,
});

export default router;
