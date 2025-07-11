<script setup lang="ts">
import { ref } from 'vue'
import type { Prompt } from '../../types'
import Button from '../ui/Button.vue'
import Tag from '../ui/Tag.vue'

defineProps<{
  prompt: Prompt
}>()

const emit = defineEmits(['edit', 'delete'])

const isCopied = ref(false)

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy: ', err)
    // You could add a user-facing error message here
  }
}
</script>

<template>
  <div
    class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-4 flex flex-col h-full transition-shadow hover:shadow-lg"
  >
    <div class="flex justify-between items-start mb-2">
      <h3 class="text-base font-semibold text-text-main dark:text-dark-text-main flex-1 pr-2">{{ prompt.title }}</h3>
      <div class="flex items-center gap-0 text-gray-500 dark:text-gray-400">
        <Button variant="ghost" size="xs" @click.stop="copyToClipboard(prompt.content)" title="复制">
          <svg v-if="isCopied" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-green-500"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
        </Button>
        <Button variant="ghost" size="xs" @click.stop="emit('edit', prompt)" title="编辑">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83l3.75 3.75l1.83-1.83z"/></svg>
        </Button>
        <Button variant="ghost" size="xs" @click.stop="emit('delete', prompt.id)" title="删除">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </Button>
      </div>
    </div>

    <div class="flex-grow">
      <p
        class="text-sm text-text-content dark:text-dark-text-content mb-3"
        style="display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; text-overflow: ellipsis;"
      >
        {{ prompt.content }}
      </p>
      <div class="flex flex-wrap items-center gap-2 mb-3">
        <Tag
          v-if="prompt.categoryDetails"
          :content="prompt.categoryDetails.name"
          size="xs"
          class="!bg-blue-100 !text-blue-800 dark:!bg-blue-900 dark:!text-blue-200"
        />
        <Tag v-for="tag in prompt.tags" :key="tag" :content="tag" size="xs" />
      </div>
    </div>

    <div class="flex items-center justify-between mt-auto pt-2 border-t border-light-border dark:border-dark-border text-sm text-text-muted dark:text-dark-text-muted">
      <span>使用次数: {{ prompt.useCount }}</span>
    </div>
  </div>
</template>
