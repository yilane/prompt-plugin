<script setup lang="ts">
import type { Prompt } from '@/types'
import { defineProps } from 'vue'

defineProps<{
  prompt: Prompt
}>()
</script>

<template>
  <div class="prompt-card">
    <div class="prompt-card-header">
      <div class="prompt-card-title">{{ prompt.title }}</div>
      <div class="prompt-card-actions">
        <button class="action-btn">✏️</button>
        <button class="action-btn">🗑️</button>
        <button class="action-btn">⭐</button>
      </div>
    </div>
    <div class="prompt-card-content">
      {{ prompt.content }}
    </div>
    <div class="prompt-tags">
      <span v-for="tag in prompt.tags" :key="tag" class="tag">{{ tag }}</span>
      <span class="tag">使用次数: {{ prompt.useCount }}</span>
    </div>
  </div>
</template>

<style scoped>
.prompt-card {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.prompt-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.prompt-card-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.prompt-card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6c757d;
  font-size: 14px;
}

.action-btn:hover {
  color: #3498db;
}

.prompt-card-content {
  color: #495057;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
  flex-grow: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prompt-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}
</style> 