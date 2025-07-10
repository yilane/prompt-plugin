// 提示词数据结构
export interface Prompt {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  description: string
  isCustom: boolean
  createTime: string
  updateTime: string
  useCount: number
  rating: number
  isFavorite?: boolean
}

// 分类数据结构
export interface Category {
  id: string
  name: string
  description: string
  icon: string
  sort: number
  isCustom: boolean
}

// 用户设置
export interface Settings {
  theme: 'light' | 'dark' | 'system'
  language: 'zh' | 'en'
  triggerKey: string  // 触发快捷键，如 '@@' 或 '/prompt'
  enableQuickInsert: boolean
  enableKeyboardShortcuts: boolean
  enableNotifications: boolean
  autoBackup: boolean
  maxRecentPrompts: number
}

export interface DropdownOption {
  label: string
  value: string | number
  icon?: string
}

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'link'

// 搜索筛选条件
export interface SearchFilters {
  keyword: string
  category?: string
  tags?: string[]
  onlyFavorites?: boolean
  onlyCustom?: boolean
  sortBy: 'createTime' | 'updateTime' | 'useCount' | 'rating' | 'title'
  sortOrder: 'asc' | 'desc'
}

// 使用统计
export interface UsageStats {
  promptId: string
  count: number
  lastUsed: string
}

// AI平台检测
export interface PlatformConfig {
  name: string
  domain: string
  inputSelector: string
  submitSelector?: string
  isActive: boolean
}

// 扩展消息类型
export interface ExtensionMessage {
  type: 'GET_PROMPTS' | 'INSERT_PROMPT' | 'OPEN_MANAGER' | 'UPDATE_SETTINGS'
  data?: any
}

// 响应类型
export interface ExtensionResponse {
  success: boolean
  data?: any
  error?: string
} 