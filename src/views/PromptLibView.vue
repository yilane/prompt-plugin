<script setup lang="ts">
import { ref, computed } from 'vue';
import { storage } from '../utils/storage';
import { presetPrompts, presetCategories } from '../utils/presets';
import type { Prompt, Category } from '../types';
import Button from '../components/ui/Button.vue';
import Tag from '../components/ui/Tag.vue';
import CategorySelector from '../components/business/CategorySelector.vue'

const statusMap = ref<Record<string, 'added' | 'adding'>>({});
const selectedCategoryId = ref('all')

const allCategories = computed<Category[]>(() => {
  const allCategory: Category = { id: 'all', name: '全部', description: '', icon: '📚', sort: -1, isCustom: false }
  return [allCategory, ...presetCategories.sort((a, b) => a.sort - b.sort)];
});

const filteredPrompts = computed(() => {
  if (selectedCategoryId.value === 'all') {
    return presetPrompts;
  }
  return presetPrompts.filter(p => p.category === selectedCategoryId.value);
});

const handleAddPrompt = async (preset: Prompt) => {
  const title = preset.title;
  if (statusMap.value[title] === 'adding' || statusMap.value[title] === 'added') return;

  statusMap.value[title] = 'adding';

  try {
    const newPrompt: Prompt = {
      ...preset,
      id: `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      isCustom: true, // When user adds it, it becomes a "custom" prompt in their list
    };
    await storage.savePrompt(newPrompt);
    statusMap.value[title] = 'added';
  } catch (error) {
    console.error(`Failed to add prompt: ${title}`, error);
    delete statusMap.value[title]; // Reset on error
  }
};
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="mb-5 pb-4 border-b border-light-border dark:border-dark-border">
      <h3 class="text-lg font-semibold text-text-main dark:text-dark-text-main">提示词库</h3>
      <p class="text-sm text-text-muted dark:text-dark-text-muted mt-1">这里是一些高质量的预设提示词，您可以将它们添加到您的个人库中。</p>
    </div>

    <div class="mb-5">
      <CategorySelector
        :categories="allCategories"
        v-model:selectedCategoryId="selectedCategoryId"
      />
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      <div
        v-for="prompt in filteredPrompts"
        :key="prompt.id"
        class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-6 flex flex-col"
      >
        <h4 class="text-base font-semibold text-text-main dark:text-dark-text-main mb-2">{{ prompt.title }}</h4>
        <p class="text-sm text-text-content dark:text-dark-text-content mb-4 flex-grow">{{ prompt.content }}</p>
        <div class="flex flex-wrap gap-2 mb-6">
          <Tag v-for="tag in prompt.tags" :key="tag" :content="tag" size="sm" />
        </div>
        <div class="mt-auto">
          <Button
            @click="handleAddPrompt(prompt)"
            :disabled="statusMap[prompt.title] === 'adding' || statusMap[prompt.title] === 'added'"
            variant="primary"
            block
          >
            <span v-if="statusMap[prompt.title] === 'added'">已添加</span>
            <span v-else-if="statusMap[prompt.title] === 'adding'">添加中...</span>
            <span v-else>添加到我的提示词</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
