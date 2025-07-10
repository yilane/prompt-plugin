<script setup lang="ts">
import { ref, onMounted, computed, defineExpose } from 'vue'
import { storage } from '../../utils/storage'
import type { Prompt } from '../../types'

const emit = defineEmits<{
  (e: 'select', content: string): void
}>()

const prompts = ref<Prompt[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const isVisible = ref(false)
const styleObject = ref({})

const filteredPrompts = computed(() => {
  if (!searchQuery.value) {
    return prompts.value
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase()
  return prompts.value.filter(p =>
    p.title.toLowerCase().includes(lowerCaseQuery) ||
    p.description.toLowerCase().includes(lowerCaseQuery)
  )
})

onMounted(async () => {
  try {
    const allPrompts = await storage.getAllPrompts()
    prompts.value = allPrompts.sort((a, b) => b.useCount - a.useCount)
  } catch (error) {
    console.error('Failed to load prompts in content script:', error)
  } finally {
    isLoading.value = false
  }
})

const handleSelect = (prompt: Prompt) => {
  emit('select', prompt.content)
  hide()
}

const show = (rect: DOMRect) => {
  styleObject.value = {
    position: 'fixed',
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
  }
  isVisible.value = true
}

const hide = () => {
  isVisible.value = false
}

defineExpose({ show, hide })
</script>

<template>
  <div
    v-if="isVisible"
    :style="styleObject"
    class="z-[9999] w-96 max-h-80 overflow-y-auto bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg shadow-2xl flex flex-col"
  >
    <div class="p-2 border-b border-light-border dark:border-dark-border sticky top-0 bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-sm">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索提示词..."
        class="w-full px-2 py-1 text-sm bg-light-background dark:bg-dark-background rounded-md border-light-border dark:border-dark-border focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
    <div v-if="isLoading" class="p-4 text-center text-text-muted dark:text-dark-text-muted">加载中...</div>
    <ul v-else-if="filteredPrompts.length > 0" class="divide-y divide-light-border dark:divide-dark-border">
      <li
        v-for="prompt in filteredPrompts"
        :key="prompt.id"
        class="p-3 hover:bg-light-hover dark:hover:bg-dark-hover cursor-pointer"
        @click="handleSelect(prompt)"
      >
        <div class="font-semibold text-text-main dark:text-dark-text-main text-sm">{{ prompt.title }}</div>
        <p class="text-xs text-text-muted dark:text-dark-text-muted truncate">{{ prompt.description }}</p>
      </li>
    </ul>
    <div v-else class="p-4 text-center text-text-muted dark:text-dark-text-muted">未找到匹配的提示词</div>
  </div>
</template>
