<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { storage } from '../utils/storage';
import { presetPrompts } from '../utils/presets';
import type { Prompt } from '../types';
import Button from '../components/ui/Button.vue';
import Tag from '../components/ui/Tag.vue';

const userPrompts = ref<Prompt[]>([]);
const isLoading = ref(true);
const statusMap = ref<Record<string, 'added' | 'adding'>>({});

const userPromptTitles = computed(() => {
  return new Set(userPrompts.value.map(p => p.title));
});

onMounted(async () => {
  try {
    userPrompts.value = await storage.getAllPrompts();
  } catch (error) {
    console.error('Failed to load user prompts:', error);
  } finally {
    isLoading.value = false;
  }
});

const handleAddPrompt = async (preset: Omit<Prompt, 'id' | 'createTime' | 'updateTime' | 'category'>) => {
  const title = preset.title;
  if (statusMap.value[title] === 'adding') return;

  statusMap.value[title] = 'adding';

  try {
    const newPrompt: Prompt = {
      ...preset,
      id: `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString(),
      isCustom: false, // Mark as non-custom from preset
      category: preset.tags[0] || '未分类'
    };
    await storage.savePrompt(newPrompt);
    userPrompts.value.push(newPrompt); // Update local state to reflect the addition
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

    <div v-if="isLoading" class="text-center py-10">正在加载...</div>

    <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      <div
        v-for="prompt in presetPrompts"
        :key="prompt.title"
        class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-6 flex flex-col"
      >
        <h4 class="text-base font-semibold text-text-main dark:text-dark-text-main mb-2">{{ prompt.title }}</h4>
        <p class="text-sm text-text-content dark:text-dark-text-content mb-4 flex-grow">{{ prompt.description }}</p>
        <div class="flex flex-wrap gap-2 mb-6">
          <Tag v-for="tag in prompt.tags" :key="tag" :content="tag" size="sm" />
        </div>
        <div class="mt-auto">
          <Button
            @click="handleAddPrompt(prompt)"
            :disabled="userPromptTitles.has(prompt.title) || statusMap[prompt.title] === 'adding'"
            variant="primary"
            block
          >
            <span v-if="userPromptTitles.has(prompt.title)">已添加</span>
            <span v-else-if="statusMap[prompt.title] === 'adding'">添加中...</span>
            <span v-else>添加到我的提示词</span>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
