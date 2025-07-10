<template>
  <div class="category-selector">
    <div class="flex items-center space-x-2 border-b border-light-border dark:border-dark-border pb-2 overflow-x-auto">
      <button
        @click="onSelect('all')"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-md transition-colors',
          selectedCategoryId === 'all'
            ? 'bg-primary text-white'
            : 'text-text-content dark:text-dark-text-content hover:bg-gray-200/60 dark:hover:bg-dark-surface'
        ]"
      >
        全部
      </button>
      <button
        v-for="category in categories"
        :key="category.id"
        @click="onSelect(category.id)"
        :class="[
          'px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
          selectedCategoryId === category.id
            ? 'bg-primary text-white'
            : 'text-text-content dark:text-dark-text-content hover:bg-gray-200/60 dark:hover:bg-dark-surface'
        ]"
      >
        {{ category.icon }} {{ category.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '@/types'

const props = defineProps<{
  categories: Category[]
  selectedCategoryId: string
}>()

const emit = defineEmits<{
  (e: 'update:selectedCategoryId', id: string): void
}>()

const onSelect = (id: string) => {
  emit('update:selectedCategoryId', id)
}
</script>

<style scoped>
.category-item:hover .opacity-0 {
  opacity: 1;
}
</style> 