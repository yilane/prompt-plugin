import type { Prompt, Category, Settings, UsageStats } from '../types'
import { browser } from 'wxt/browser'

const STORAGE_KEYS = {
  PROMPTS: 'ai-prompts-prompts',
  CATEGORIES: 'ai-prompts-categories',
  SETTINGS: 'ai-prompts-settings',
  USAGE_STATS: 'ai-prompts-usage-stats'
} as const

export class StorageManager {
  // 初始化 - chrome.storage不需要初始化
  async init(): Promise<void> {
    // chrome.storage API 不需要初始化
    return Promise.resolve()
  }

  // 通用的存储操作方法
  private async getFromStorage<T>(key: string): Promise<T | undefined> {
    const result = await browser.storage.local.get(key)
    return result[key]
  }

  private async setToStorage<T>(key: string, value: T): Promise<void> {
    await browser.storage.local.set({ [key]: value })
  }

  // 提示词相关操作
  async getAllPrompts(): Promise<Prompt[]> {
    const prompts = await this.getFromStorage<Prompt[]>(STORAGE_KEYS.PROMPTS)
    return prompts || []
  }

  async getPrompt(id: string): Promise<Prompt | undefined> {
    const prompts = await this.getAllPrompts()
    return prompts.find(p => p.id === id)
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    const prompts = await this.getAllPrompts()
    const index = prompts.findIndex(p => p.id === prompt.id)

    if (index >= 0) {
      prompts[index] = prompt
    } else {
      prompts.push(prompt)
    }

    await this.setToStorage(STORAGE_KEYS.PROMPTS, prompts)
  }

  async deletePrompt(id: string): Promise<void> {
    const prompts = await this.getAllPrompts()
    const filteredPrompts = prompts.filter(p => p.id !== id)
    await this.setToStorage(STORAGE_KEYS.PROMPTS, filteredPrompts)
  }

  async getPromptsByCategory(category: string): Promise<Prompt[]> {
    const prompts = await this.getAllPrompts()
    return prompts.filter(p => p.category === category)
  }

  // 分类相关操作
  async getAllCategories(): Promise<Category[]> {
    const categories = await this.getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES)
    return categories || []
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const categories = await this.getAllCategories()
    return categories.find(c => c.id === id)
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const id = this.generateId();
    const newCategory = { ...category, id };

    const categories = await this.getAllCategories()
    categories.push(newCategory)
    await this.setToStorage(STORAGE_KEYS.CATEGORIES, categories)

    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const categories = await this.getAllCategories()
    const index = categories.findIndex(c => c.id === id)

    if (index === -1) throw new Error(`Category with id ${id} not found`)

    const updatedCategory = { ...categories[index], ...updates }
    categories[index] = updatedCategory
    await this.setToStorage(STORAGE_KEYS.CATEGORIES, categories)

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const categories = await this.getAllCategories()
    const filteredCategories = categories.filter(c => c.id !== id)
    await this.setToStorage(STORAGE_KEYS.CATEGORIES, filteredCategories)
  }

  async updateCategoriesOrder(categories: Category[]): Promise<void> {
    await this.setToStorage(STORAGE_KEYS.CATEGORIES, categories)
  }

  async saveCategory(category: Category): Promise<void> {
    const categories = await this.getAllCategories()
    const index = categories.findIndex(c => c.id === category.id)

    if (index >= 0) {
      categories[index] = category
    } else {
      categories.push(category)
    }

    await this.setToStorage(STORAGE_KEYS.CATEGORIES, categories)
  }

  // 设置相关操作
  async getSettings(): Promise<Settings> {
    const settings = await this.getFromStorage<Settings>(STORAGE_KEYS.SETTINGS)
    const defaultSettings = this.getDefaultSettings();

    console.log('AI-Prompts: Raw settings from Chrome Storage:', settings)
    console.log('AI-Prompts: Default settings:', defaultSettings)

    // 如果没有设置，初始化用户自定义设置
    if (!settings) {
      console.log('AI-Prompts: No settings found in storage, initializing with custom settings')
      const initialSettings: Settings = {
        theme: 'system',
        language: 'zh',
        triggerSequences: [
          { id: 'default-1', value: '@@', enabled: true }
        ],
        enableQuickInsert: true,
        enableKeyboardShortcuts: true,
        enableNotifications: true,
        autoBackup: false,
        maxRecentPrompts: 10
      }

      // 立即保存初始设置
      await this.saveSettings(initialSettings)
      console.log('AI-Prompts: Initial settings saved:', initialSettings)

      // 清除旧的提示词数据，并设置为空列表
      await this.setToStorage(STORAGE_KEYS.PROMPTS, [])
      console.log('AI-Prompts: Initialized prompts list to empty.')

      // 初始化示例分类
      await this.initializeSampleCategories()

      return initialSettings
    }

    // 向上兼容：处理旧数据结构迁移
    if (settings && (settings as any).triggerKey && !settings.triggerSequences) {
        settings.triggerSequences = [{ id: 'default-1', value: (settings as any).triggerKey, enabled: true }];
        delete (settings as any).triggerKey;
        // 立即保存迁移后的设置
        await this.saveSettings(settings);
    }

    // 智能合并设置
    const finalSettings = { ...defaultSettings, ...settings }

    // 检查是否需要重新初始化示例数据
    const existingCategories = await this.getAllCategories()

    if (existingCategories.length === 0) {
      console.log('AI-Prompts: No categories found, initializing sample categories')
      await this.initializeSampleCategories()
    }

    // 详细调试用户设置
    console.log('AI-Prompts: Settings object exists:', !!settings)
    console.log('AI-Prompts: Settings has triggerSequences:', !!(settings && settings.triggerSequences))
    console.log('AI-Prompts: Settings triggerSequences length:', settings && settings.triggerSequences ? settings.triggerSequences.length : 0)
    console.log('AI-Prompts: Settings triggerSequences content:', settings && settings.triggerSequences ? settings.triggerSequences : 'undefined')

    // 特殊处理：如果用户有自定义的triggerSequences，优先使用用户的
    if (settings && settings.triggerSequences && settings.triggerSequences.length > 0) {
      console.log('AI-Prompts: Using user custom triggerSequences')
      finalSettings.triggerSequences = settings.triggerSequences
    } else {
      console.log('AI-Prompts: Using default triggerSequences')
    }

    console.log('AI-Prompts: Final merged settings:', finalSettings)
    console.log('AI-Prompts: Final triggerSequences:', finalSettings.triggerSequences)
    return finalSettings
  }

  async saveSettings(settings: Settings): Promise<void> {
    console.log('AI-Prompts: Saving settings to Chrome Storage:', settings)
    await this.setToStorage(STORAGE_KEYS.SETTINGS, settings)
  }

  private getDefaultSettings(): Settings {
    return {
      theme: 'system',
      language: 'zh',
      triggerSequences: [{ id: 'default-1', value: '@@', enabled: true }],
      enableQuickInsert: true,
      enableKeyboardShortcuts: true,
      enableNotifications: true,
      autoBackup: false,
      maxRecentPrompts: 10
    }
  }

  // 使用统计相关操作
  async getUsageStats(): Promise<UsageStats[]> {
    const stats = await this.getFromStorage<UsageStats[]>(STORAGE_KEYS.USAGE_STATS)
    return stats || []
  }

  async updateUsageStats(promptId: string): Promise<void> {
    const allStats = await this.getUsageStats()
    const existing = allStats.find(s => s.promptId === promptId)

    const stats: UsageStats = {
      promptId,
      count: existing ? existing.count + 1 : 1,
      lastUsed: new Date().toISOString()
    }

    if (existing) {
      const index = allStats.findIndex(s => s.promptId === promptId)
      allStats[index] = stats
    } else {
      allStats.push(stats)
    }

    await this.setToStorage(STORAGE_KEYS.USAGE_STATS, allStats)
  }

  // 数据导入导出
  async exportData(): Promise<string> {
    const [prompts, categories, settings] = await Promise.all([
      this.getAllPrompts(),
      this.getAllCategories(),
      this.getSettings()
    ])

    return JSON.stringify({
      version: 2,
      exportTime: new Date().toISOString(),
      data: { prompts, categories, settings }
    })
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData)

    if (data.data.prompts) {
      await this.setToStorage(STORAGE_KEYS.PROMPTS, data.data.prompts)
    }

    if (data.data.categories) {
      await this.setToStorage(STORAGE_KEYS.CATEGORIES, data.data.categories)
    }

    if (data.data.settings) {
      await this.saveSettings(data.data.settings)
    }
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    await browser.storage.local.remove([
      STORAGE_KEYS.PROMPTS,
      STORAGE_KEYS.CATEGORIES,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.USAGE_STATS
    ])
  }

  private generateId(): string {
    return `id-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  // 初始化示例提示词 - 此函数现在为空，以确保不会意外添加数据
  private async initializeSamplePrompts(): Promise<void> {
    // 逻辑已移除，以确保用户数据不会被覆盖
    return Promise.resolve()
  }

  // 初始化示例分类
  private async initializeSampleCategories(): Promise<void> {
    const sampleCategories: Category[] = [
      {
        id: this.generateId(),
        name: '编程',
        description: '编程相关的提示词',
        icon: '💻',
        sort: 1,
        isCustom: false
      },
      {
        id: this.generateId(),
        name: '写作',
        description: '写作相关的提示词',
        icon: '✍️',
        sort: 2,
        isCustom: false
      },
      {
        id: this.generateId(),
        name: '翻译',
        description: '翻译相关的提示词',
        icon: '🌐',
        sort: 3,
        isCustom: false
      },
      {
        id: this.generateId(),
        name: '分析',
        description: '数据分析相关的提示词',
        icon: '📊',
        sort: 4,
        isCustom: false
      },
      {
        id: this.generateId(),
        name: '创意',
        description: '创意策划相关的提示词',
        icon: '🎨',
        sort: 5,
        isCustom: false
      },
      {
        id: this.generateId(),
        name: '产品',
        description: '产品管理相关的提示词',
        icon: '📋',
        sort: 6,
        isCustom: false
      }
    ]

    // 保存示例分类
    for (const category of sampleCategories) {
      await this.saveCategory(category)
    }

    console.log('AI-Prompts: Sample categories initialized:', sampleCategories.length)
  }
}

// 导出单例实例
export const storage = new StorageManager()

// 初始化数据库的便捷函数
export async function initializeDatabase(): Promise<void> {
  await storage.init()
}
