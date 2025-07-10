<script setup lang="ts">
import Sidebar from './components/layout/Sidebar.vue'
import { useTheme } from './composables/useTheme'

useTheme()
</script>

<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
    <Sidebar />
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>

<style>
#app {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
