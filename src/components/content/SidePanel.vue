<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { browser } from 'wxt/browser';
import { storage } from '../../utils/storage';
import type { Prompt, Category } from '../../types';
import SearchBox from '../ui/SearchBox.vue';

const prompts = ref<Prompt[]>([]);
const categories = ref<Category[]>([]);
const isLoading = ref(true);
const searchQuery = ref('');
const selectedCategoryId = ref('all');
const copiedMap = ref<Record<string, boolean>>({});

const allCategories = computed(() => {
  return [
    { id: 'all', name: '全部', description: '', icon: '', sort: -1, isCustom: false },
    ...categories.value,
  ];
});

const categoryMap = computed(() => {
  return new Map(categories.value.map(cat => [cat.id, cat]));
});

const filteredPrompts = computed(() => {
  let promptsToFilter = prompts.value;
  if (selectedCategoryId.value !== 'all') {
    promptsToFilter = promptsToFilter.filter(p => p.category === selectedCategoryId.value);
  }
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    promptsToFilter = promptsToFilter.filter(p =>
      p.title.toLowerCase().includes(lowerCaseQuery) ||
      p.content.toLowerCase().includes(lowerCaseQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery))
    );
  }

  return promptsToFilter.map(p => ({
    ...p,
    categoryDetails: categoryMap.value.get(p.category)
  }));
});

const loadData = async () => {
  isLoading.value = true;
  try {
    const [loadedPrompts, loadedCategories] = await Promise.all([
      storage.getAllPrompts(),
      storage.getAllCategories(),
    ]);
    prompts.value = loadedPrompts.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
    categories.value = loadedCategories.sort((a, b) => a.sort - b.sort);
  } catch (error) {
    console.error('Failed to load side panel data:', error);
  } finally {
    isLoading.value = false;
  }
};

async function copyToClipboard(content: string, id: string) {
  if (copiedMap.value[id]) return;
  try {
    await navigator.clipboard.writeText(content);
    copiedMap.value[id] = true;
    setTimeout(() => {
      copiedMap.value[id] = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy from side panel:', err);
  }
}

const openDashboard = () => {
  const url = browser.runtime.getURL('/dashboard.html');
  browser.tabs.create({ url });
};

onMounted(() => {
  console.log('SidePanel.vue: Component has been mounted.');
  loadData();
});
</script>

<template>
  <!-- 左侧面板 -->
  <div :style="{
         height: '100vh',
         width: '380px',
         minWidth: '320px',
         maxWidth: '450px',
         backgroundColor: '#ffffff',
         display: 'flex',
         flexDirection: 'column',
         fontFamily: 'system-ui, -apple-system, sans-serif',
         boxSizing: 'border-box'
       }">
      <!-- 头部 -->
      <div :style="{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        flexShrink: '0'
      }">
        <div :style="{ display: 'flex', alignItems: 'center', gap: '12px' }">
          <div :style="{
            width: '32px',
            height: '32px',
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 :style="{
            fontSize: '18px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0'
          }">AI Prompts</h2>
        </div>
        <div :style="{ display: 'flex', gap: '8px' }">
          <button
            @click="openDashboard"
            title="添加提示词"
            :style="{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              color: '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }"
            @mouseover="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6'"
            @mouseout="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
          </button>
          <button
            @click="openDashboard"
            title="管理中心"
            :style="{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #d1d5db',
              color: '#6b7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }"
            @mouseover="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6'"
            @mouseout="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" fill="currentColor" viewBox="0 0 16 16">
              <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311a1.464 1.464 0 0 1-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l-.34-.1c-1.4-.413-1.4-2.397 0-2.81l.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.858 2.929 2.929 0 0 1 0 5.858z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 搜索和过滤区域 -->
      <div :style="{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        flexShrink: '0'
      }">
        <!-- Search Box -->
        <SearchBox v-model="searchQuery" placeholder="搜索提示词..." />

        <!-- Category Selector -->
        <select
          v-model="selectedCategoryId"
          :style="{
            width: '100%',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            fontSize: '14px',
            outline: 'none',
            marginTop: '12px'
          }"
        >
          <option v-for="cat in allCategories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <!-- 提示词列表 -->
      <div :style="{
        flex: '1',
        overflow: 'auto',
        padding: '16px'
      }">
        <!-- 加载状态 -->
        <div v-if="isLoading" :style="{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 0',
          color: '#6b7280'
        }">
          <div class="loading-spinner" :style="{
            width: '32px',
            height: '32px',
            border: '3px solid #f3f4f6',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%'
          }"></div>
          <span :style="{ marginLeft: '12px' }">加载中...</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredPrompts.length === 0" :style="{
          textAlign: 'center',
          padding: '32px 0',
          color: '#6b7280'
        }">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin: 0 auto 16px; color: #d1d5db;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p>暂无提示词</p>
          <p :style="{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }">试试调整搜索条件</p>
        </div>

        <!-- 提示词卡片列表 -->
        <div v-else :style="{ display: 'flex', flexDirection: 'column', gap: '12px' }">
          <div
            v-for="prompt in filteredPrompts"
            :key="prompt.id"
            :style="{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s',
              position: 'relative'
            }"
            @mouseover="(e: MouseEvent) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6';
            }"
            @mouseout="(e: MouseEvent) => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb';
            }"
          >
            <div :style="{ padding: '16px' }">
               <div :style="{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }">
                <h4 :style="{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: '1',
                  paddingRight: '8px'
                }">{{ prompt.title }}</h4>
                <button
                  @click.stop="copyToClipboard(prompt.content, prompt.id)"
                  :title="copiedMap[prompt.id] ? '已复制' : '复制'"
                  :style="{
                    padding: '4px',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: copiedMap[prompt.id] ? '#10b981' : '#6b7280',
                    cursor: 'pointer',
                    flexShrink: '0',
                    transition: 'all 0.2s'
                  }"
                  @mouseover="(e: MouseEvent) => !copiedMap[prompt.id] && ((e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6')"
                  @mouseout="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'"
                >
                  <svg v-if="copiedMap[prompt.id]" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                </button>
              </div>
              <p :style="{
                fontSize: '14px',
                color: '#4b5563',
                margin: '0 0 12px 0',
                height: '40px',
                overflow: 'hidden',
                display: '-webkit-box',
                '-webkit-line-clamp': '2',
                '-webkit-box-orient': 'vertical'
              }">{{ prompt.content }}</p>

              <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }">
                <span v-if="prompt.categoryDetails" :style="{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af'
                }">
                  {{ prompt.categoryDetails.name }}
                </span>
                <span v-for="tag in prompt.tags" :key="tag" :style="{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: '#e5e7eb',
                  color: '#4b5563'
                }">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<style scoped>
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
