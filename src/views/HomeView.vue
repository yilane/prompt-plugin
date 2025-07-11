<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, toRaw } from 'vue'
import { storage } from '../utils/storage'
import type { Prompt, Category } from '../types'
import PromptCard from '../components/business/PromptCard.vue'
import Modal from '../components/ui/Modal.vue'
import PromptEditor from '../components/business/PromptEditor.vue'
import Button from '../components/ui/Button.vue';
import SearchBox from '../components/ui/SearchBox.vue';
import CategorySelector from '../components/business/CategorySelector.vue'
import Grid from 'vue-virtual-scroll-grid'

const prompts = ref<Prompt[]>([])
const categories = ref<Category[]>([])
const isLoading = ref(true)
const isModalOpen = ref(false)
const editingPrompt = ref<Prompt | null>(null)
const searchQuery = ref('')
const selectedCategoryId = ref('all')
const gridKey = ref(0)

const promptsWithCategoryDetails = computed(() => {
  const categoryMap = new Map(categories.value.map(c => [c.id, c]))
  return prompts.value.map(p => {
    return {
      ...p,
      categoryDetails: categoryMap.get(p.category)
    }
  })
})

const filteredPrompts = computed(() => {
  let promptsToFilter = promptsWithCategoryDetails.value

  // 1. Filter by category
  if (selectedCategoryId.value && selectedCategoryId.value !== 'all') {
    promptsToFilter = promptsToFilter.filter(prompt => prompt.category === selectedCategoryId.value)
  }

  // 2. Filter by search query
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase()
    promptsToFilter = promptsToFilter.filter(prompt => {
      const inTitle = prompt.title.toLowerCase().includes(lowerCaseQuery)
      const inDescription = prompt.description.toLowerCase().includes(lowerCaseQuery)
      const inTags = prompt.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
      return inTitle || inDescription || inTags
    })
  }

  return promptsToFilter
})

const pageProvider = async (pageNumber: number, pageSize: number) => {
  console.log('loading page', pageNumber)
  const start = pageNumber * pageSize
  const end = start + pageSize
  // 使用 toRaw 获取原始数组，避免响应式代理带来的额外开销
  return toRaw(filteredPrompts.value).slice(start, end)
}

onMounted(async () => {
  try {
    isLoading.value = true
    await storage.init()
    await storage.getSettings() // Ensures data is initialized

    // Load prompts and categories in parallel
    const [loadedPrompts, loadedCategories] = await Promise.all([
      storage.getAllPrompts(),
      storage.getAllCategories()
    ]);

    prompts.value = loadedPrompts
    categories.value = [
      { id: 'all', name: '全部', description: '', icon: '📚', sort: -1, isCustom: false },
      ...loadedCategories.sort((a, b) => a.sort - b.sort)
    ];
  } catch (error) {
    console.error('Failed to load initial data:', error)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  // eventBus.off('favorite:toggle', handleFavoriteUpdate); // This line is removed
});

const openAddModal = () => {
  editingPrompt.value = null
  isModalOpen.value = true
}

const openEditModal = (prompt: Prompt) => {
  editingPrompt.value = prompt
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
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
        ...promptData
      } as Prompt
      await storage.savePrompt(newPrompt)
      prompts.value.unshift(newPrompt)
    }
  } catch (error) {
    console.error('Failed to save prompt:', error)
  } finally {
    closeModal()
    gridKey.value++ // Force grid re-render
  }
}

const handleDeletePrompt = async (promptId: string) => {
  if (window.confirm('您确定要删除这个提示词吗？此操作无法撤销。')) {
    try {
      await storage.deletePrompt(promptId)
      prompts.value = prompts.value.filter(p => p.id !== promptId)
      gridKey.value++ // Force grid re-render
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="flex justify-between items-center mb-5">
      <div class="flex-1">
        <h3 class="text-lg font-semibold text-text-main dark:text-dark-text-main">我的提示词</h3>
        <p class="text-sm text-text-muted dark:text-dark-text-muted mt-1">在这里管理您的所有个人提示词。</p>
      </div>
      <div class="ml-5">
        <Button variant="primary" @click="openAddModal">添加新提示词</Button>
      </div>
    </div>

    <div class="space-y-5 mb-5">
      <SearchBox v-model="searchQuery" placeholder="搜索标题、描述或标签..." />
      <CategorySelector
        v-if="categories.length > 1"
        :categories="categories"
        v-model:selectedCategoryId="selectedCategoryId"
      />
    </div>

    <div v-if="isLoading" class="text-center py-10">
      正在加载...
    </div>
    <Grid
      v-else-if="filteredPrompts.length > 0"
      :key="`${selectedCategoryId}-${searchQuery}-${gridKey}`"
      class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4"
      :length="filteredPrompts.length"
      :page-size="20"
      :page-provider="pageProvider"
    >
      <template #default="{ item, style }">
        <div :style="style">
          <PromptCard
            :prompt="item"
            @edit="openEditModal"
            @delete="handleDeletePrompt"
          />
        </div>
      </template>
    </Grid>
    <div v-else class="text-center py-10 text-gray-500">
      <p v-if="searchQuery">未找到匹配的提示词。</p>
      <p v-else>您还没有任何提示词。点击“添加新提示词”来创建一个吧！</p>
    </div>

    <Modal :is-open="isModalOpen" @close="closeModal">
      <PromptEditor :prompt="editingPrompt" @save="handleSavePrompt" @cancel="closeModal" />
    </Modal>
  </div>
</template>
