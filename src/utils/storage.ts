import type { Prompt, Category, Settings, UsageStats } from '../types'

const DB_NAME = 'AI-Prompts-DB'
const DB_VERSION = 2

// 数据表名
const STORES = {
  PROMPTS: 'prompts',
  CATEGORIES: 'categories',
  SETTINGS: 'settings',
  USAGE_STATS: 'usageStats'
} as const

export class StorageManager {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  // 初始化数据库
  init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建提示词表
        if (!db.objectStoreNames.contains(STORES.PROMPTS)) {
          const promptStore = db.createObjectStore(STORES.PROMPTS, { keyPath: 'id' })
          promptStore.createIndex('category', 'category', { unique: false })
          promptStore.createIndex('createTime', 'createTime', { unique: false })
          promptStore.createIndex('useCount', 'useCount', { unique: false })
        }

        // 创建分类表
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' })
          categoryStore.createIndex('sort', 'sort', { unique: false })
        }

        // 创建设置表
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' })
        }

        // 创建使用统计表
        if (!db.objectStoreNames.contains(STORES.USAGE_STATS)) {
          const statsStore = db.createObjectStore(STORES.USAGE_STATS, { keyPath: 'promptId' })
          statsStore.createIndex('lastUsed', 'lastUsed', { unique: false })
        }
      }
    })
    return this.initPromise
  }

  // 通用的事务操作方法
  private async transaction<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    await this.init()
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode)
      const store = transaction.objectStore(storeName)
      const request = operation(store)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 提示词相关操作
  async getAllPrompts(): Promise<Prompt[]> {
    return this.transaction(STORES.PROMPTS, 'readonly', store => store.getAll())
  }

  async getPrompt(id: string): Promise<Prompt | undefined> {
    return this.transaction(STORES.PROMPTS, 'readonly', store => store.get(id))
  }

  async savePrompt(prompt: Prompt): Promise<void> {
    await this.transaction(STORES.PROMPTS, 'readwrite', store => store.put(prompt))
  }

  async deletePrompt(id: string): Promise<void> {
    await this.transaction(STORES.PROMPTS, 'readwrite', store => store.delete(id))
  }

  async getPromptsByCategory(category: string): Promise<Prompt[]> {
    return this.transaction(STORES.PROMPTS, 'readonly', store => {
      const index = store.index('category')
      return index.getAll(category)
    })
  }

  // 分类相关操作
  async getAllCategories(): Promise<Category[]> {
    return this.transaction(STORES.CATEGORIES, 'readonly', store => store.getAll())
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.transaction(STORES.CATEGORIES, 'readonly', store => store.get(id))
  }

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const id = this.generateId();
    const newCategory = { ...category, id };
    await this.transaction(STORES.CATEGORIES, 'readwrite', store => store.put(newCategory));
    return newCategory;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const existing = await this.transaction(STORES.CATEGORIES, 'readonly', store => store.get(id));
    if (!existing) throw new Error(`Category with id ${id} not found`);
    const updatedCategory = { ...existing, ...updates };
    await this.transaction(STORES.CATEGORIES, 'readwrite', store => store.put(updatedCategory));
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.transaction(STORES.CATEGORIES, 'readwrite', store => store.delete(id))
  }

  async updateCategoriesOrder(categories: Category[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(STORES.CATEGORIES, 'readwrite');
    const store = transaction.objectStore(STORES.CATEGORIES);
    for (const category of categories) {
      store.put(category);
    }
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveCategory(category: Category): Promise<void> {
    await this.transaction(STORES.CATEGORIES, 'readwrite', store => store.put(category));
  }

  // 设置相关操作
  async getSettings(): Promise<Settings> {
    const settings = await this.transaction(STORES.SETTINGS, 'readonly', store => store.get('main')) as any
    const defaultSettings = this.getDefaultSettings();

    // 向上兼容：处理旧数据结构迁移
    if (settings && settings.triggerKey && !settings.triggerSequences) {
        settings.triggerSequences = [{ id: 'default-1', value: settings.triggerKey, enabled: true }];
        delete settings.triggerKey;
        // 立即保存迁移后的设置
        await this.saveSettings(settings);
    }

    return { ...defaultSettings, ...settings }
  }

  async saveSettings(settings: Settings): Promise<void> {
    console.log('AI-Prompts: Saving settings object:', settings)
    await this.transaction(STORES.SETTINGS, 'readwrite', store =>
      store.put({ key: 'main', ...settings })
    )
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
    return this.transaction(STORES.USAGE_STATS, 'readonly', store => store.getAll())
  }

  async updateUsageStats(promptId: string): Promise<void> {
    const existing = await this.transaction(STORES.USAGE_STATS, 'readonly', store => store.get(promptId))

    const stats: UsageStats = {
      promptId,
      count: existing ? existing.count + 1 : 1,
      lastUsed: new Date().toISOString()
    }

    await this.transaction(STORES.USAGE_STATS, 'readwrite', store => store.put(stats))
  }

  // 数据导入导出
  async exportData(): Promise<string> {
    const [prompts, categories, settings] = await Promise.all([
      this.getAllPrompts(),
      this.getAllCategories(),
      this.getSettings()
    ])

    return JSON.stringify({
      version: DB_VERSION,
      exportTime: new Date().toISOString(),
      data: { prompts, categories, settings }
    })
  }

  async importData(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData)

    if (data.data.prompts) {
      for (const prompt of data.data.prompts) {
        await this.savePrompt(prompt)
      }
    }

    if (data.data.categories) {
      for (const category of data.data.categories) {
        await this.addCategory(category)
      }
    }

    if (data.data.settings) {
      await this.saveSettings(data.data.settings)
    }
  }

  // 清空所有数据
  async clearAllData(): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction(Object.values(STORES), 'readwrite')

    for (const storeName of Object.values(STORES)) {
      transaction.objectStore(storeName).clear()
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  private generateId(): string {
    return `id-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }
}

// 导出单例实例
export const storage = new StorageManager()

// 初始化数据库的便捷函数
export async function initializeDatabase(): Promise<void> {
  await storage.init()
}
