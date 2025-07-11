<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storage } from '../utils/storage'
import type { Category, Prompt } from '../types'
import Modal from '../components/ui/Modal.vue'
import Input from '../components/ui/Input.vue'
import Button from '../components/ui/Button.vue'
import draggable from 'vuedraggable'

const categories = ref<Category[]>([])
const prompts = ref<Prompt[]>([])
const isLoading = ref(true)
const isModalOpen = ref(false)
const editingCategory = ref<Category | null>(null)
const form = ref({ name: '', description: '', icon: '' })

const modalTitle = computed(() => editingCategory.value ? '编辑分类' : '新增分类')

const categoryPromptCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const prompt of prompts.value) {
    if (prompt.category) {
      counts.set(prompt.category, (counts.get(prompt.category) || 0) + 1)
    }
  }
  return counts
})

onMounted(async () => {
  try {
    isLoading.value = true
    const [loadedCategories, loadedPrompts] = await Promise.all([
      storage.getAllCategories(),
      storage.getAllPrompts()
    ])
    categories.value = loadedCategories.sort((a, b) => a.sort - b.sort)
    prompts.value = loadedPrompts
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    isLoading.value = false
  }
})

const openCreateModal = () => {
  editingCategory.value = null
  form.value = { name: '', description: '', icon: '📁' }
  isModalOpen.value = true
}

const openEditModal = (category: Category) => {
  editingCategory.value = category
  form.value = { ...category }
  isModalOpen.value = true
}

const handleCancel = () => {
  isModalOpen.value = false
  editingCategory.value = null
}

const handleSave = async () => {
  try {
    if (editingCategory.value) {
      // Update
      const updatedCategory = await storage.updateCategory(editingCategory.value.id, form.value)
      const index = categories.value.findIndex(c => c.id === updatedCategory.id)
      if (index !== -1) {
        categories.value[index] = updatedCategory
      }
    } else {
      // Create
      const newCategory = await storage.addCategory({ ...form.value, isCustom: true, sort: categories.value.length })
      categories.value.push(newCategory)
    }
  } catch (error) {
    console.error('Failed to save category:', error)
  } finally {
    handleCancel()
  }
}

const handleDelete = async (id: string) => {
  if (window.confirm('确定要删除这个分类吗？')) {
    try {
      await storage.deleteCategory(id)
      categories.value = categories.value.filter(c => c.id !== id)
    } catch (error)      {
      console.error('Failed to delete category:', error)
    }
  }
}

const onDragEnd = async () => {
  try {
    const updatedCategories = categories.value.map((category, index) => {
      return { ...category, sort: index }
    })
    await storage.updateCategoriesOrder(updatedCategories)
    categories.value = updatedCategories
  } catch (error) {
    console.error('Failed to update categories order:', error)
    // 可选择性地将列表恢复到之前的状态
  }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="flex justify-between items-center mb-5">
      <h3 class="text-lg font-semibold text-text-main dark:text-dark-text-main">分类管理</h3>
      <Button variant="primary" @click="openCreateModal">+ 新增分类</Button>
    </div>

    <div v-if="isLoading" class="text-center py-10">
      <p>正在加载...</p>
    </div>

    <draggable
      v-else
      v-model="categories"
      item-key="id"
      handle=".handle"
      class="bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden"
      animation="300"
      @end="onDragEnd"
    >
      <template #item="{ element: category, index }">
        <div
          class="flex justify-between items-center p-4"
          :class="{ 'border-b border-light-border dark:border-dark-border': index < categories.length - 1 }"
        >
          <div class="flex items-center gap-4">
            <div class="handle cursor-move text-text-muted dark:text-dark-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9h18M3 15h18" opacity="0.5"></path></svg>
            </div>
            <span class="text-2xl">{{ category.icon }}</span>
            <div>
              <div class="font-semibold text-text-main dark:text-dark-text-main flex items-center gap-2">
                <span>{{ category.name }}</span>
                <span class="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5">
                  {{ categoryPromptCounts.get(category.id) || 0 }}
                </span>
              </div>
              <div class="text-sm text-text-muted dark:text-dark-text-muted">{{ category.description }}</div>
            </div>
          </div>
          <div class="flex gap-2">
            <Button variant="ghost" size="sm" @click="openEditModal(category)">编辑</Button>
            <Button variant="danger" size="sm" @click="handleDelete(category.id)">删除</Button>
          </div>
        </div>
      </template>
    </draggable>

    <Modal :is-open="isModalOpen" @close="handleCancel">
       <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">{{ modalTitle }}</h3>
        <div class="space-y-4">
          <Input v-model="form.name" label="分类名称" placeholder="例如：编程技巧" />
          <Input v-model="form.icon" label="分类图标" placeholder="例如：💻" />
          <Input v-model="form.description" label="分类描述" placeholder="关于这个分类的简短描述" />
        </div>
        <div class="flex justify-end gap-3 pt-5 mt-5 border-t border-light-border dark:border-dark-border">
          <Button variant="secondary" @click="handleCancel">取消</Button>
          <Button variant="primary" @click="handleSave">保存</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>
