import type { Prompt, Category, Settings, UsageStats } from '../types'
import { browser } from 'wxt/browser'

const STORAGE_KEYS = {
  PROMPTS: 'ai-prompts-prompts',
  CATEGORIES: 'ai-prompts-categories',
  SETTINGS: 'ai-prompts-settings',
  USAGE_STATS: 'ai-prompts-usage-stats',
  IS_INITIALIZED: 'ai-prompts-is-initialized'
} as const

export class StorageManager {
  // 初始化 - chrome.storage不需要初始化
  async init(): Promise<void> {
    // chrome.storage API 不需要初始化
    return Promise.resolve()
  }

  // 通用的存储操作方法
  public async getFromStorage<T>(key: string): Promise<T | undefined> {
    const result = await browser.storage.local.get(key)
    if (result && typeof result === 'object' && key in result) {
      return result[key] as T;
    }
    return undefined;
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
    const categories = await this.getAllCategories()
    const existingCategory = categories.find(c => c.name === category.name)
    if (existingCategory) {
      return existingCategory
    }

    const id = this.generateId()
    const newCategory = { ...category, id }

    categories.push(newCategory)
    await this.setToStorage(STORAGE_KEYS.CATEGORIES, categories)

    return newCategory
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const categories = await this.getAllCategories()
    const index = categories.findIndex(c => c.id === id)

    if (index === -1) throw new Error(`Category with id ${id} not found`)

    const updatedCategory = { ...categories[index], ...updates } as Category;
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

    // Smart merge for settings. User settings take precedence.
    const finalSettings = { ...defaultSettings, ...settings };

    // Backward compatibility for old triggerKey setting
    if (settings && (settings as any).triggerKey && !settings.triggerSequences) {
      finalSettings.triggerSequences = [{ id: 'default-1', value: (settings as any).triggerKey as string, enabled: true }];
      delete (finalSettings as any).triggerKey;
    }

    return finalSettings;
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

  // Private method for one-time data initialization
  private async _initializeDataForFirstRun(): Promise<void> {
    console.log('AI-Prompts: First run detected. Initializing database...');

    const initialSettings: Settings = this.getDefaultSettings();
    await this.saveSettings(initialSettings);
    console.log('AI-Prompts: Initial settings saved.');

    await this.setToStorage(STORAGE_KEYS.PROMPTS, []);
    console.log('AI-Prompts: Prompts list initialized.');

    await this.initializeSampleCategories();
    console.log('AI-Prompts: Sample categories initialized.');

    // Set the flag to prevent this from running again
    await this.setToStorage(STORAGE_KEYS.IS_INITIALIZED, true);
    console.log('AI-Prompts: Database initialization complete.');
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
    const importObject = JSON.parse(jsonData)
    const {
      prompts: importedPrompts = [],
      categories: importedCategories = [],
      settings: importedSettings = {},
    } = importObject.data || {}

    // 1. Get existing data
    const existingPrompts = await this.getAllPrompts()
    const existingCategories = await this.getAllCategories()
    const existingSettings = await this.getSettings()

    // 2. Merge Categories
    const categoryMap = new Map<string, Category>()
    existingCategories.forEach(cat => categoryMap.set(cat.name, cat))

    const oldIdToNewCategoryMap = new Map<string, Category>()

    importedCategories.forEach((importedCat: Category) => {
      const existingCat = categoryMap.get(importedCat.name)
      if (existingCat) {
        oldIdToNewCategoryMap.set(importedCat.id, existingCat)
      } else {
        const newCat = { ...importedCat, id: this.generateId() }
        categoryMap.set(newCat.name, newCat)
        oldIdToNewCategoryMap.set(importedCat.id, newCat)
      }
    })

    const mergedCategories = Array.from(categoryMap.values())
    await this.setToStorage(STORAGE_KEYS.CATEGORIES, mergedCategories)

    // 3. Merge Prompts
    const promptTitleSet = new Set(existingPrompts.map(p => p.title))
    const promptsToAdd: Prompt[] = []

    importedPrompts.forEach((importedPrompt: Prompt) => {
      if (!promptTitleSet.has(importedPrompt.title)) {
        const targetCategory = oldIdToNewCategoryMap.get(importedPrompt.category)

        if (targetCategory) {
          const newPrompt = {
            ...importedPrompt,
            id: this.generateId(),
            category: targetCategory.id,
          }
          promptsToAdd.push(newPrompt)
          promptTitleSet.add(newPrompt.title)
        }
      }
    })

    const mergedPrompts = [...existingPrompts, ...promptsToAdd]
    await this.setToStorage(STORAGE_KEYS.PROMPTS, mergedPrompts)

    // 4. Merge Settings
    const finalSettings = { ...existingSettings, ...importedSettings }
    await this.saveSettings(finalSettings)
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
    const sampleCategories: Omit<Category, 'id'>[] = [
      {
        name: '编程',
        description: '编程相关的提示词',
        icon: '💻',
        sort: 1,
        isCustom: false
      },
      {
        name: '写作',
        description: '写作相关的提示词',
        icon: '✍️',
        sort: 2,
        isCustom: false
      },
      {
        name: '翻译',
        description: '翻译相关的提示词',
        icon: '🌐',
        sort: 3,
        isCustom: false
      },
      {
        name: '分析',
        description: '数据分析相关的提示词',
        icon: '📊',
        sort: 4,
        isCustom: false
      },
      {
        name: '创意',
        description: '创意策划相关的提示词',
        icon: '🎨',
        sort: 5,
        isCustom: false
      },
      {
        name: '产品',
        description: '产品管理相关的提示词',
        icon: '📋',
        sort: 6,
        isCustom: false
      }
    ]

    // 保存示例分类
    for (const category of sampleCategories) {
      await this.addCategory(category)
    }

    console.log('AI-Prompts: Sample categories initialized:', sampleCategories.length)
  }
}

const storage = new StorageManager()

export async function initializeDatabase(): Promise<void> {
  const isInitialized = await storage.getFromStorage<boolean>(STORAGE_KEYS.IS_INITIALIZED);
  if (isInitialized) {
    console.log('AI-Prompts: Database already initialized. Skipping setup.');
    return;
  }
  // This will only run once on the very first installation.
  // Accessing a private method this way is a workaround for TS.
  await (storage as any)._initializeDataForFirstRun();
}

export { storage }
