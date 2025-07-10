<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storage } from '../utils/storage'
import type { Category } from '../types'
import Modal from '../components/ui/Modal.vue'
import Input from '../components/ui/Input.vue'
import Button from '../components/ui/Button.vue'

const categories = ref<Category[]>([])
const isLoading = ref(true)
const isModalOpen = ref(false)
const editingCategory = ref<Category | null>(null)
const form = ref({ name: '', description: '', icon: '' })

const modalTitle = computed(() => editingCategory.value ? '编辑分类' : '新增分类')

onMounted(async () => {
  try {
    isLoading.value = true
    categories.value = await storage.getAllCategories()
  } catch (error) {
    console.error('Failed to load categories:', error)
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

    <div v-else class="bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
      <div
        v-for="(category, index) in categories"
        :key="category.id"
        class="flex justify-between items-center p-4"
        :class="{ 'border-b border-light-border dark:border-dark-border': index < categories.length - 1 }"
      >
        <div class="flex items-center gap-4">
          <span class="text-2xl">{{ category.icon }}</span>
          <div>
            <div class="font-semibold text-text-main dark:text-dark-text-main">{{ category.name }}</div>
            <div class="text-sm text-text-muted dark:text-dark-text-muted">{{ category.description }}</div>
          </div>
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" size="sm" @click="openEditModal(category)">编辑</Button>
          <Button variant="danger" size="sm" @click="handleDelete(category.id)">删除</Button>
        </div>
      </div>
    </div>

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
