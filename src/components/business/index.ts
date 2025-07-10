export { default as PromptCard } from './PromptCard.vue'
export { default as CategorySelector } from './CategorySelector.vue'
export { default as PromptEditor } from './PromptEditor.vue'

// 组件Props类型
export interface PromptCardProps {
  prompt: import('@/types').Prompt
  categories?: import('@/types').Category[]
}

export interface CategorySelectorProps {
  categories: import('@/types').Category[]
  prompts: import('@/types').Prompt[]
  selectedCategory: string
}

export interface PromptEditorProps {
  visible: boolean
  prompt?: import('@/types').Prompt | null
  categories: import('@/types').Category[]
} 