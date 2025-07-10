<template>
  <div class="flex items-center space-x-1 rounded-lg bg-gray-200 dark:bg-dark-card p-1">
    <button
      v-for="item in themes"
      :key="item.name"
      @click="setTheme(item.name)"
      class="w-full px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none"
      :class="[
        theme === item.name
          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-gray-600/50',
      ]"
    >
      <div class="flex items-center justify-center">
        <component :is="item.icon" class="w-5 h-5 mr-2" />
        <span>{{ item.label }}</span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'
import { useTheme } from '@/composables/useTheme'
import type { Settings } from '@/types'

const { theme, setTheme } = useTheme()

const themes: { name: Settings['theme'], label: string, icon: any }[] = [
  { name: 'light', label: '亮色', icon: SunIcon },
  { name: 'dark', label: '暗色', icon: MoonIcon },
  { name: 'auto', label: '自动', icon: ComputerDesktopIcon },
]
</script> 