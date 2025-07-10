<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-light-bg dark:bg-dark-bg min-h-screen">
    <div class="max-w-7xl mx-auto">
      <!-- 页面头部 -->
      <div class="md:flex md:items-center md:justify-between pb-4 border-b border-light-border dark:border-dark-border mb-6">
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold leading-7 text-text-main dark:text-dark-text-main sm:truncate">
            提示词管理中心
          </h1>
          <p class="mt-1 text-sm text-text-muted dark:text-dark-text-muted">
            在这里管理、创建和发现强大的AI提示词。
          </p>
        </div>
        <div class="mt-4 flex md:mt-0 md:ml-4 gap-2">
          <ThemeSwitcher />
          <Button variant="secondary" @click="handleExport">
            导出数据
          </Button>
          <Button variant="primary" @click="openPromptEditor(null)">
            <svg class="h-5 w-5 mr-2 -ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            新增提示词
          </Button>
        </div>
      </div>

      <!-- 分类与筛选 -->
      <div class="mb-6">
        <CategorySelector 
          :categories="categories" 
          v-model:selected-category-id="selectedCategoryId"
        />
      </div>

      <!-- 提示词网格 -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <PromptCard
          v-for="prompt in filteredPrompts"
          :key="prompt.id"
          :prompt="prompt"
          :categories="categories"
          @edit="openPromptEditor"
          @delete="handleDelete"
        />
      </div>
      
      <div v-if="filteredPrompts.length === 0" class="text-center py-12">
        <p class="text-text-muted dark:text-dark-text-muted">
          没有找到匹配的提示词。
        </p>
      </div>
    </div>
    
    <!-- 编辑器弹窗 -->
    <PromptEditor
      :is-open="isEditorOpen"
      :prompt-data="editingPrompt"
      :categories="categories"
      @close="closePromptEditor"
      @save="handleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { Prompt, Category } from '@/types'
import { StorageManager } from '@/utils/storage'
import { presetCategories, presetPrompts } from '@/utils/presets'

import Button from '@/components/ui/Button.vue'
import PromptCard from '@/components/business/PromptCard.vue'
import CategorySelector from '@/components/business/CategorySelector.vue'
import PromptEditor from '@/components/business/PromptEditor.vue'
import ThemeSwitcher from '@/components/common/ThemeSwitcher.vue'

const storage = new StorageManager()

const prompts = ref<Prompt[]>([])
const categories = ref<Category[]>([])
const selectedCategoryId = ref<string>('all')

const isEditorOpen = ref(false)
const editingPrompt = ref<Prompt | null>(null)

// 数据加载
async function loadData() {
  await storage.init()
  let cats = await storage.getAllCategories()
  if (cats.length === 0) {
    for (const cat of presetCategories) {
      await storage.addCategory(cat)
    }
    cats = await storage.getAllCategories()
  }
  categories.value = cats

  // 关联预设的 prompts 到数据库里的 categories
  const promptsWithCategoryIds = presetPrompts.map(p => {
    const category = cats.find(c => c.name === p.tags[0])
    return { ...p, category: category?.id || '' }
  })

  let proms = await storage.getAllPrompts()
  if (proms.length === 0) {
    for (const prom of promptsWithCategoryIds) {
      await storage.addPrompt(prom)
    }
    proms = await storage.getAllPrompts()
  }
  prompts.value = proms
}

onMounted(loadData)

// 筛选逻辑
const filteredPrompts = computed(() => {
  if (!selectedCategoryId.value || selectedCategoryId.value === 'all') {
    return prompts.value
  }
  return prompts.value.filter(p => p.category === selectedCategoryId.value)
})

// 编辑器逻辑
const openPromptEditor = (prompt: Prompt | null) => {
  editingPrompt.value = prompt ? { ...prompt } : null
  isEditorOpen.value = true
}

const closePromptEditor = () => {
  isEditorOpen.value = false
  editingPrompt.value = null
}

const handleSave = async (promptData: Partial<Omit<Prompt, 'id' | 'createTime' | 'updateTime'>>) => {
  if (editingPrompt.value?.id) {
    // 更新
    const updatedPrompt = await storage.updatePrompt(editingPrompt.value.id, promptData)
    const index = prompts.value.findIndex(p => p.id === updatedPrompt.id)
    if (index !== -1) {
      prompts.value[index] = updatedPrompt
    }
  } else {
    // 新增
    const newPrompt = await storage.addPrompt(promptData as any) // `as any` to bypass strict checks for new prompts
    prompts.value.push(newPrompt)
  }
  closePromptEditor()
}

const handleDelete = async (prompt: Prompt) => {
  if (window.confirm(`确定要删除提示词 "${prompt.title}" 吗？`)) {
    await storage.deletePrompt(prompt.id)
    prompts.value = prompts.value.filter(p => p.id !== prompt.id)
  }
}

const handleExport = async () => {
  try {
    const data = await storage.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-plugin-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    alert('数据导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    alert('数据导出失败。')
  }
}
</script> 