import type { Settings } from '../types'
import { storage } from '../utils/storage'
import { ref, onMounted, watch } from 'vue'

type Theme = Settings['theme']

const currentTheme = ref<Theme>('system')

// This function now only reads from localStorage, which is synchronous and safe.
const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system'
  const savedTheme = localStorage.getItem('theme') as Theme | null
  return savedTheme || 'system'
}

const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return

  const newTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme

  document.documentElement.classList.remove('dark', 'light')
  document.documentElement.classList.add(newTheme)
}

// This function is now synchronous and only handles UI/localStorage changes.
const setTheme = (theme: Theme) => {
  currentTheme.value = theme
  localStorage.setItem('theme', theme)
  applyTheme(theme)
}

// New function to handle asynchronous database persistence.
const persistThemeSetting = async (theme: Theme) => {
  try {
    const settings = await storage.getSettings()
    await storage.saveSettings({ ...settings, theme })
  } catch (error) {
    console.error('Failed to persist theme setting:', error)
  }
}

export function useTheme() {
  // Set the theme immediately on mount from localStorage for fast UI response.
  onMounted(() => {
    const initialTheme = getInitialTheme()
    setTheme(initialTheme)
    // Asynchronously persist the setting to the database after mounting.
    persistThemeSetting(initialTheme)
  })

  watch(currentTheme, (newTheme) => {
    if (newTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const changeHandler = () => applyTheme('system')
      mediaQuery.addEventListener('change', changeHandler)

      // Clean up
      return () => mediaQuery.removeEventListener('change', changeHandler)
    }
  })

  return {
    theme: currentTheme,
    setTheme,
    persistThemeSetting
  }
}
