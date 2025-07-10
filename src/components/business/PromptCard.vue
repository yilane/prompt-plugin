<script setup lang="ts">
import type { Prompt } from '../../types'
import Button from '../ui/Button.vue'
import Tag from '../ui/Tag.vue'

defineProps<{
  prompt: Prompt
}>()

const emit = defineEmits(['edit', 'delete', 'toggle-favorite', 'copy'])
</script>

<template>
  <div
    class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-4 flex flex-col h-full transition-shadow hover:shadow-lg"
    @click="emit('copy', prompt.content)"
  >
    <div class="flex justify-between items-start mb-2">
      <h3 class="text-base font-semibold text-text-main dark:text-dark-text-main flex-1 pr-2">{{ prompt.title }}</h3>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="xs" @click.stop="emit('edit', prompt)">编辑</Button>
        <Button variant="ghost" size="xs" @click.stop="emit('delete', prompt.id)">删除</Button>
      </div>
    </div>

    <div class="flex-grow">
      <p class="text-sm text-text-content dark:text-dark-text-content mb-3 h-10 overflow-hidden">{{ prompt.description }}</p>
      <div class="flex flex-wrap gap-2 mb-3">
        <Tag v-for="tag in prompt.tags" :key="tag" :content="tag" size="xs" />
      </div>
    </div>

    <div class="flex items-center justify-between mt-auto pt-2 border-t border-light-border dark:border-dark-border text-sm text-text-muted dark:text-dark-text-muted">
      <span>评分: {{ prompt.rating }}/5</span>
      <Button
        variant="ghost"
        size="xs"
        @click.stop="emit('toggle-favorite', prompt)"
        class="flex items-center gap-1"
        :class="prompt.isFavorite ? 'text-yellow-500' : ''"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
        <span>{{ prompt.isFavorite ? '已收藏' : '收藏' }}</span>
      </Button>
    </div>
  </div>
</template>
