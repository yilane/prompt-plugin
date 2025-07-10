<template>
  <div class="flex items-center space-x-1 rounded-lg bg-gray-200 dark:bg-dark-card p-1">
    <button
      v-for="item in themes"
      :key="item.value"
      @click="setTheme(item.value)"
      class="w-full px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none"
      :class="[
        theme === item.value
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
import { useTheme } from '../../composables/useTheme'
import type { Settings } from '../../types'
import { computed } from 'vue';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'

const { theme, setTheme } = useTheme()

type ThemeValue = Settings['theme']

const themes: { value: ThemeValue; label: string; icon: any }[] = [
  { value: 'light', label: '浅色', icon: SunIcon },
  { value: 'dark', label: '深色', icon: MoonIcon },
  { value: 'system', label: '跟随系统', icon: ComputerDesktopIcon },
]

const currentIcon = computed(() => {
  return themes.find(t => t.value === theme.value)?.icon || ComputerDesktopIcon
})
</script> 