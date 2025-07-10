<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { storage } from '@/utils/storage'
import type { Category } from '@/types'
import Modal from '@/components/ui/Modal.vue'
import Input from '@/components/ui/Input.vue'
import Button from '@/components/ui/Button.vue'

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
  <div>
    <div class="content-header">
      <h3 class="content-title">分类管理</h3>
      <button class="add-btn" @click="openCreateModal">+ 新增分类</button>
    </div>

    <div v-if="isLoading" class="text-center py-10">
      <p>正在加载...</p>
    </div>

    <div v-else class="category-list">
      <div v-for="category in categories" :key="category.id" class="category-item">
        <div class="category-info">
          <span class="category-icon">{{ category.icon }}</span>
          <div>
            <div class="category-name">{{ category.name }}</div>
            <div class="category-description">{{ category.description }}</div>
          </div>
        </div>
        <div class="category-actions">
          <Button variant="ghost" size="sm" @click="openEditModal(category)">编辑</Button>
          <Button variant="danger" size="sm" outline @click="handleDelete(category.id)">删除</Button>
        </div>
      </div>
    </div>

    <Modal :is-open="isModalOpen" :title="modalTitle" @close="handleCancel">
      <div class="p-4 space-y-4">
        <Input v-model="form.name" label="分类名称" placeholder="例如：编程技巧" />
        <Input v-model="form.icon" label="分类图标" placeholder="例如：💻" />
        <Input v-model="form.description" label="分类描述" placeholder="关于这个分类的简短描述" />
        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button variant="secondary" @click="handleCancel">取消</Button>
          <Button @click="handleSave">保存</Button>
        </div>
      </div>
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
}

.category-list {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #f1f3f5;
}

.category-item:last-child {
  border-bottom: none;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.category-icon {
  font-size: 1.5rem;
}

.category-name {
  font-weight: 600;
  color: #2c3e50;
}

.category-description {
  font-size: 0.875rem;
  color: #6c757d;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}
</style> 