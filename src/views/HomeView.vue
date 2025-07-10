<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storage } from '@/utils/storage'
import type { Prompt } from '@/types'
import PromptCard from '@/components/business/PromptCard.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Modal from '@/components/ui/Modal.vue'
import PromptEditor from '@/components/business/PromptEditor.vue'

const prompts = ref<Prompt[]>([])
const isLoading = ref(true)
const isEditorOpen = ref(false)

onMounted(async () => {
  try {
    await storage.init()
    prompts.value = await storage.getAllPrompts()
    if (prompts.value.length === 0) {
      const dummyPrompt: Prompt = {
        id: '1',
        title: '产品需求文档模板',
        content: '请帮我编写一份产品需求文档...',
        description: '一个用于快速生成PRD的模板',
        category: '文档',
        tags: ['产品', '文档', '模板'],
        isCustom: false,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        useCount: 15,
        rating: 5,
      };
      await storage.savePrompt(dummyPrompt);
      prompts.value.push(dummyPrompt);
    }
  } catch (error) {
    console.error('Failed to load prompts:', error)
  } finally {
    isLoading.value = false
  }
})

const openEditor = () => {
  isEditorOpen.value = true
}

const handleCancel = () => {
  isEditorOpen.value = false
}

const handleSavePrompt = async (promptData: Partial<Prompt>) => {
  const newPrompt: Prompt = {
    id: `prompt_${Date.now()}`,
    isCustom: true,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 0,
    ...promptData
  } as Prompt

  try {
    await storage.savePrompt(newPrompt)
    prompts.value.unshift(newPrompt)
    isEditorOpen.value = false
  } catch (error) {
    console.error('Failed to save prompt:', error)
  }
}
</script>

<template>
  <div class="management-interface">
    <Sidebar />
    <main class="main-content">
      <div class="content-header">
        <h3 class="content-title">我的提示词</h3>
        <button class="add-btn" @click="openEditor">+ 新增提示词</button>
      </div>

      <div v-if="isLoading" class="text-center py-10">
        <p>正在加载...</p>
      </div>
      
      <div v-else-if="prompts.length > 0" class="prompts-grid">
        <PromptCard 
          v-for="prompt in prompts" 
          :key="prompt.id" 
          :prompt="prompt"
        />
      </div>

      <div v-else class="text-center py-10 px-4 rounded-lg bg-gray-100">
        <h3 class="text-lg font-semibold">暂无提示词</h3>
        <p class="text-gray-500 mt-1">您还没有创建任何提示词。</p>
      </div>
    </main>

    <Modal :is-open="isEditorOpen" title="新增提示词" @close="handleCancel">
      <PromptEditor @save="handleSavePrompt" @cancel="handleCancel" />
    </Modal>
  </div>
</template>

<style scoped>
.management-interface {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 20px;
  height: calc(100vh - 40px); /* Full height minus padding */
  padding: 20px;
}

.main-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
  overflow-y: auto;
}

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
