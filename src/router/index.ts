import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../views/CategoryView.vue')
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('../views/FavoritesView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    },
    {
      path: '/import-export',
      name: 'import-export',
      component: () => import('../views/ImportExportView.vue')
    },
    {
      path: '/prompt-lib',
      name: 'prompt-lib',
      component: () => import('../views/PromptLibView.vue')
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('../views/StatsView.vue')
    }
  ]
})

export default router
