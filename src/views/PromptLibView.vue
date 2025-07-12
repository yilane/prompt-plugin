<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storage } from '../utils/storage';
import { recommendationService } from '../utils/recommendationService';
import { presetPrompts, presetCategories } from '../utils/presets';
import type { Prompt, Category } from '../types';
import Button from '../components/ui/Button.vue';
import CategorySelector from '../components/business/CategorySelector.vue';
import SearchBox from '../components/ui/SearchBox.vue';
import Tag from '../components/ui/Tag.vue';

const statusMap = ref<Record<string, 'added' | 'adding'>>({});
const selectedCategoryId = ref('all');
const searchQuery = ref('');
const copiedMap = ref<Record<string, boolean>>({});
const userCategories = ref<Category[]>([]);

onMounted(async () => {
  const [userPrompts, loadedUserCategories] = await Promise.all([
    storage.getAllPrompts(),
    storage.getAllCategories()
  ]);
  userCategories.value = loadedUserCategories;

  const userPromptTitles = new Set(userPrompts.map(p => p.title));
  presetPrompts.forEach(preset => {
    if (userPromptTitles.has(preset.title)) {
      statusMap.value[preset.title] = 'added';
    }
  });
});

const allCategories = computed<Category[]>(() => {
  const allCategory: Category = { id: 'all', name: '全部', description: '', icon: '📚', sort: -1, isCustom: false }
  return [allCategory, ...presetCategories.sort((a, b) => a.sort - b.sort)];
});

const promptsWithCategoryDetails = computed(() => {
  const categoryMap = new Map(presetCategories.map(c => [c.id, c]));
  return presetPrompts.map(p => {
    return {
      ...p,
      categoryDetails: categoryMap.get(p.category)
    }
  });
});

const filteredPrompts = computed(() => {
  let promptsToFilter = promptsWithCategoryDetails.value;

  // 1. Filter by category
  if (selectedCategoryId.value !== 'all') {
    promptsToFilter = promptsToFilter.filter(p => p.category === selectedCategoryId.value);
  }

  // 2. Filter by search query
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    promptsToFilter = promptsToFilter.filter(prompt => {
      const inTitle = prompt.title.toLowerCase().includes(lowerCaseQuery);
      const inContent = prompt.content.toLowerCase().includes(lowerCaseQuery);
      const inTags = prompt.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery));
      return inTitle || inContent || inTags;
    });
  }

  // 3. Sort by smart algorithm (similar to HomeView)
  return promptsToFilter.sort((a, b) => {
    // For preset prompts, we can score based on keyword relevance
    const scoreA = calculatePresetPromptScore(a)
    const scoreB = calculatePresetPromptScore(b)
    
    if (scoreA !== scoreB) return scoreB - scoreA
    
    // Fallback to alphabetical order
    return a.title.localeCompare(b.title)
  })
});

/**
 * Calculate score for preset prompt based on search relevance
 */
function calculatePresetPromptScore(prompt: Prompt): number {
  let score = 0
  
  // Base score for all prompts
  score += 10
  
  // Boost score if search query matches
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    if (prompt.title.toLowerCase().includes(query)) score += 50
    if (prompt.content.toLowerCase().includes(query)) score += 30
    if (prompt.tags.some(tag => tag.toLowerCase().includes(query))) score += 40
  }
  
  return score
}

async function copyToClipboard(content: string, id: string) {
  if (copiedMap.value[id]) return;
  try {
    await navigator.clipboard.writeText(content);
    copiedMap.value[id] = true;
    setTimeout(() => {
      copiedMap.value[id] = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}

const handleAddPrompt = async (preset: Prompt) => {
  const title = preset.title;
  if (statusMap.value[title] === 'adding' || statusMap.value[title] === 'added') return;

  statusMap.value[title] = 'adding';

  try {
    let finalCategoryId = preset.category;

    // Sync category logic
    if (preset.category) {
      const categoryToSave = presetCategories.find(c => c.id === preset.category);
      if (categoryToSave) {
        const savedCategory = await storage.addCategory(categoryToSave);
        finalCategoryId = savedCategory.id; // Use the authoritative ID

        const localCategoryIndex = userCategories.value.findIndex(c => c.name === savedCategory.name);

        if (localCategoryIndex !== -1) {
          userCategories.value[localCategoryIndex] = savedCategory;
        } else {
          userCategories.value.push(savedCategory);
        }
      }
    }

    const newPrompt: Prompt = {
      ...preset,
      id: `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      category: finalCategoryId,
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

    <div class="space-y-5 mb-5">
      <SearchBox v-model="searchQuery" placeholder="搜索标题、内容或标签..." />
      <CategorySelector
        :categories="allCategories"
        v-model:selectedCategoryId="selectedCategoryId"
      />
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      <div
        v-for="prompt in filteredPrompts"
        :key="prompt.id"
        class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-6 flex flex-col h-full"
      >
        <div class="flex justify-between items-start mb-2">
          <h4 class="text-base font-semibold text-text-main dark:text-dark-text-main flex-1 pr-2">{{ prompt.title }}</h4>
          <div class="flex items-center">
            <Button variant="ghost" size="xs" @click.stop="copyToClipboard(prompt.content, prompt.id)" title="复制">
              <svg v-if="copiedMap[prompt.id]" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-green-500"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-gray-500 dark:text-gray-400"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </Button>
          </div>
        </div>
        <p class="text-sm text-text-content dark:text-dark-text-content mb-4 flex-grow">{{ prompt.content }}</p>
        <div class="flex flex-wrap items-center gap-2 mb-6">
          <Tag
            v-if="prompt.categoryDetails"
            :content="prompt.categoryDetails.name"
            size="sm"
            class="!bg-blue-100 !text-blue-800 dark:!bg-blue-900 dark:!text-blue-200"
          />
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
