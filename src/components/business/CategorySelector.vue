<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-for="category in categories"
      :key="category.id"
      class="px-3 py-1 text-sm rounded-full"
      :class="[
        selectedCategoryId === category.id
          ? 'bg-blue-500 text-white'
          : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
      ]"
      @click="emit('update:selectedCategoryId', category.id)"
    >
      {{ category.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Category } from '../../types'

defineProps<{
  categories: Category[]
  selectedCategoryId: string
}>()

const emit = defineEmits(['update:selectedCategoryId'])
</script>

<style scoped>
.category-item:hover .opacity-0 {
  opacity: 1;
}
</style>
