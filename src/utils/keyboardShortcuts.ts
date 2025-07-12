// import { storage } from './storage' // 避免循环依赖
import type { KeyboardShortcut } from '../types'
import { browser } from 'wxt/browser'

export class KeyboardShortcutsManager {
  private shortcuts: KeyboardShortcut[] = []
  private enabled = false
  private initialized = false
  private isServiceWorker = false

  async init(): Promise<void> {
    if (this.initialized) return

    // 检测是否在 Service Worker 环境中
    this.isServiceWorker = typeof document === 'undefined'
    
    await this.loadSettings()
    
    // 只在非 Service Worker 环境中注册键盘事件
    if (!this.isServiceWorker) {
      this.registerGlobalShortcuts()
    } else {
      console.log('KeyboardShortcuts: Running in Service Worker, skipping DOM event registration')
    }
    
    this.initialized = true
  }

  async loadSettings(): Promise<void> {
    try {
      const { storage } = await import('./storage')
      const settings = await storage.getSettings()
      this.shortcuts = settings.keyboardShortcuts || []
      this.enabled = settings.enableKeyboardShortcuts
    } catch (error) {
      console.error('Failed to load keyboard shortcuts settings:', error)
    }
  }

  private registerGlobalShortcuts(): void {
    if (!this.enabled || this.isServiceWorker) return

    // 确保 document 存在
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.handleKeydown.bind(this))
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (!this.enabled || this.isServiceWorker) return

    const pressedKeys = this.getKeyString(event)
    
    for (const shortcut of this.shortcuts) {
      if (shortcut.enabled && shortcut.keys === pressedKeys) {
        event.preventDefault()
        event.stopPropagation()
        this.executeShortcut(shortcut)
        break
      }
    }
  }

  private getKeyString(event: KeyboardEvent): string {
    const keys: string[] = []
    
    if (event.ctrlKey) keys.push('Ctrl')
    if (event.altKey) keys.push('Alt')
    if (event.shiftKey) keys.push('Shift')
    if (event.metaKey) keys.push('Meta')
    
    const key = event.key
    if (key && !['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
      // 特殊键名映射
      const keyMap: Record<string, string> = {
        ' ': 'Space',
        'ArrowUp': 'Up',
        'ArrowDown': 'Down',
        'ArrowLeft': 'Left',
        'ArrowRight': 'Right'
      }
      keys.push(keyMap[key] || key.toUpperCase())
    }
    
    return keys.join('+')
  }

  private async executeShortcut(shortcut: KeyboardShortcut): Promise<void> {
    console.log(`Executing keyboard shortcut: ${shortcut.name} (${shortcut.keys})`)

    try {
      switch (shortcut.action) {
        case 'open_dashboard':
          await this.openDashboard()
          break
        case 'open_sidepanel':
          await this.openSidepanel()
          break
        case 'toggle_prompt_selector':
          await this.togglePromptSelector()
          break
        case 'search_prompts':
          await this.searchPrompts()
          break
        default:
          console.warn(`Unknown shortcut action: ${shortcut.action}`)
      }
    } catch (error) {
      console.error(`Failed to execute shortcut ${shortcut.action}:`, error)
    }
  }

  private async openDashboard(): Promise<void> {
    // 打开扩展面板页面
    const url = browser.runtime.getURL('/dashboard.html')
    await browser.tabs.create({ url })
  }

  private async openSidepanel(): Promise<void> {
    // 在支持的浏览器中打开侧边栏
    try {
      if (browser.sidePanel && browser.sidePanel.open) {
        await browser.sidePanel.open({
          windowId: (await browser.windows.getCurrent()).id
        })
      } else {
        // 如果不支持侧边栏，则打开面板页面
        await this.openDashboard()
      }
    } catch (error) {
      console.log('Side panel not supported, opening dashboard instead')
      await this.openDashboard()
    }
  }

  private async togglePromptSelector(): Promise<void> {
    // 发送消息给当前标签页的content script
    try {
      const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (activeTab.id) {
        await browser.tabs.sendMessage(activeTab.id, {
          type: 'TOGGLE_PROMPT_SELECTOR'
        })
      }
    } catch (error) {
      console.error('Failed to toggle prompt selector:', error)
      // 如果当前页面不支持，则打开侧边栏
      await this.openSidepanel()
    }
  }

  private async searchPrompts(): Promise<void> {
    // 发送消息给当前标签页的content script以打开搜索
    try {
      const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (activeTab.id) {
        await browser.tabs.sendMessage(activeTab.id, {
          type: 'OPEN_PROMPT_SEARCH'
        })
      }
    } catch (error) {
      console.error('Failed to open prompt search:', error)
      // 如果当前页面不支持，则打开面板页面
      await this.openDashboard()
    }
  }

  async updateSettings(): Promise<void> {
    await this.loadSettings()
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeydown.bind(this))
    this.initialized = false
  }

  // 验证快捷键组合是否有效
  static isValidShortcut(keys: string): boolean {
    const parts = keys.split('+')
    
    // 必须至少包含一个修饰键（Ctrl、Alt、Shift、Meta）
    const hasModifier = parts.some(part => ['Ctrl', 'Alt', 'Shift', 'Meta'].includes(part))
    
    // 必须包含一个非修饰键
    const hasKey = parts.some(part => !['Ctrl', 'Alt', 'Shift', 'Meta'].includes(part))
    
    return hasModifier && hasKey && parts.length >= 2
  }

  // 格式化快捷键显示
  static formatShortcut(keys: string): string {
    const parts = keys.split('+')
    const modifiers = parts.filter(part => ['Ctrl', 'Alt', 'Shift', 'Meta'].includes(part))
    const key = parts.find(part => !['Ctrl', 'Alt', 'Shift', 'Meta'].includes(part))
    
    // 重新排序：Ctrl -> Alt -> Shift -> Meta -> Key
    const orderedModifiers: string[] = []
    if (modifiers.includes('Ctrl')) orderedModifiers.push('Ctrl')
    if (modifiers.includes('Alt')) orderedModifiers.push('Alt')
    if (modifiers.includes('Shift')) orderedModifiers.push('Shift')
    if (modifiers.includes('Meta')) orderedModifiers.push('Meta')
    
    return [...orderedModifiers, key].join('+')
  }
}

export const keyboardShortcuts = new KeyboardShortcutsManager()