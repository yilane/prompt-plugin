<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storage } from '@/utils/storage'
import type { Prompt } from '@/types'
import PromptCard from '@/components/business/PromptCard.vue'
import Modal from '@/components/ui/Modal.vue'
import PromptEditor from '@/components/business/PromptEditor.vue'

const prompts = ref<Prompt[]>([])
const isLoading = ref(true)
const isEditorOpen = ref(false)
const editingPrompt = ref<Prompt | null>(null)

const modalTitle = computed(() => editingPrompt.value ? '编辑提示词' : '新增提示词')

onMounted(async () => {
  try {
    await storage.init()
    prompts.value = await storage.getAllPrompts()
    if (prompts.value.length === 0) {
      const dummyPrompt: Prompt = { id: '1', title: '产品需求文档模板', content: '请帮我编写一份产品需求文档...', description: '一个用于快速生成PRD的模板', category: '文档', tags: ['产品', '文档', '模板'], isCustom: false, createTime: new Date().toISOString(), updateTime: new Date().toISOString(), useCount: 15, rating: 5 };
      await storage.savePrompt(dummyPrompt);
      prompts.value.push(dummyPrompt);
    }
  } catch (error) {
    console.error('Failed to load prompts:', error)
  } finally {
    isLoading.value = false
  }
})

const openCreateEditor = () => {
  editingPrompt.value = null
  isEditorOpen.value = true
}

const openEditEditor = (prompt: Prompt) => {
  editingPrompt.value = prompt
  isEditorOpen.value = true
}

const handleCancel = () => {
  isEditorOpen.value = false
  editingPrompt.value = null
}

const handleSavePrompt = async (promptData: Partial<Prompt>) => {
  try {
    if (editingPrompt.value) {
      const updatedPrompt = { ...editingPrompt.value, ...promptData, updateTime: new Date().toISOString() }
      await storage.savePrompt(updatedPrompt)
      const index = prompts.value.findIndex(p => p.id === updatedPrompt.id)
      if (index !== -1) {
        prompts.value[index] = updatedPrompt
      }
    } else {
      const newPrompt: Prompt = {
        id: `prompt_${Date.now()}`,
        isCustom: true,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        useCount: 0,
        rating: 0,
        ...promptData
      } as Prompt
      await storage.savePrompt(newPrompt)
      prompts.value.unshift(newPrompt)
    }
  } catch (error) {
    console.error('Failed to save prompt:', error)
  } finally {
    handleCancel()
  }
}

const handleDeletePrompt = async (promptId: string) => {
  if (window.confirm('您确定要删除这个提示词吗？此操作无法撤销。')) {
    try {
      await storage.deletePrompt(promptId)
      prompts.value = prompts.value.filter(p => p.id !== promptId)
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }
}

const handleToggleFavorite = async (prompt: Prompt) => {
  const updatedPrompt = { ...prompt, isFavorite: !prompt.isFavorite }
  try {
    await storage.savePrompt(updatedPrompt)
    const index = prompts.value.findIndex(p => p.id === prompt.id)
    if (index !== -1) {
      prompts.value[index] = updatedPrompt
    }
  } catch (error) {
    console.error('Failed to update favorite status:', error)
  }
}
</script>

<template>
  <div>
    <div class="content-header">
      <h3 class="content-title">我的提示词</h3>
      <button class="add-btn" @click="openCreateEditor">+ 新增提示词</button>
    </div>

    <div v-if="isLoading" class="text-center py-10">
      <p>正在加载...</p>
    </div>
    
    <div v-else-if="prompts.length > 0" class="prompts-grid">
      <PromptCard 
        v-for="prompt in prompts" 
        :key="prompt.id" 
        :prompt="prompt"
        @edit="openEditEditor"
        @delete="handleDeletePrompt"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>

    <div v-else class="text-center py-10 px-4 rounded-lg bg-gray-100">
      <h3 class="text-lg font-semibold">暂无提示词</h3>
      <p class="text-gray-500 mt-1">您还没有创建任何提示词。</p>
    </div>
    
    <Modal :is-open="isEditorOpen" :title="modalTitle" @close="handleCancel">
      <PromptEditor :prompt="editingPrompt" @save="handleSavePrompt" @cancel="handleCancel" />
    </Modal>
  </div>
</template>

<style scoped>
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.content-title {
  font-size: 18px;
  color: #2c3e50;
  font-weight: 600;
}

.add-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #219d52;
}

.prompts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
</style>
