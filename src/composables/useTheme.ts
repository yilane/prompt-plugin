import { ref, onMounted, watch } from 'vue'
import type { Settings } from '@/types'
import { storage } from '@/utils/storage'

type Theme = Settings['theme']

const theme = ref<Theme>('auto')

export function useTheme() {
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement
    
    if (newTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', prefersDark)
    } else {
      root.classList.toggle('dark', newTheme === 'dark')
    }
    theme.value = newTheme
  }

  const setTheme = async (newTheme: Theme) => {
    applyTheme(newTheme)
    try {
      const currentSettings = await storage.getSettings()
      await storage.saveSettings({ ...currentSettings, theme: newTheme })
    } catch (error) {
      console.error('Failed to save theme setting:', error)
    }
  }

  onMounted(async () => {
    try {
      await storage.init()
      const settings = await storage.getSettings()
      applyTheme(settings.theme)
    } catch (error) {
      console.error('Failed to load theme setting:', error)
      applyTheme('auto')
    }

    // 监听系统颜色方案变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme.value === 'auto') {
        applyTheme('auto')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    
    // 组件卸载时移除监听器
    watch(() => theme, (newTheme, oldTheme, onInvalidate) => {
      onInvalidate(() => {
        mediaQuery.removeEventListener('change', handleChange)
      })
    })
  })

  return {
    theme,
    setTheme,
  }
} 