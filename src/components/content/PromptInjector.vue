<script setup lang="ts">
import { ref, onMounted, computed, defineExpose } from 'vue'
import { storage } from '../../utils/storage'
import { recommendationService } from '../../utils/recommendationService'
import type { Prompt, Category } from '../../types'

const emit = defineEmits<{
  (e: 'select', content: string, promptId: string): void
}>()

const prompts = ref<Prompt[]>([])
const categories = ref<Category[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const selectedCategoryId = ref('all') // 重命名并设置默认值为 'all'
const isVisible = ref(false)
const styleObject = ref({})
const previewPrompt = ref<Prompt | null>(null)
const showPreview = ref(false)

// 计算所有可用的分类
const availableCategories = computed(() => {
  const allCategory: Category = { id: 'all', name: '全部', description: '', icon: '📚', sort: -1, isCustom: false }
  // 直接使用从storage加载的分类，并进行排序
  const sortedCategories = [...categories.value].sort((a, b) => a.sort - b.sort)
  return [allCategory, ...sortedCategories]
})

const filteredPrompts = computed(() => {
  let filtered = prompts.value

  // 按分类筛选
  if (selectedCategoryId.value !== 'all') {
    filtered = filtered.filter(p => p.category === selectedCategoryId.value)
  }

  // 按搜索词筛选
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(lowerCaseQuery) ||
      p.description.toLowerCase().includes(lowerCaseQuery)
    )
  }

  return filtered
})

onMounted(async () => {
  try {
    // 同时加载分类数据
    const [allCategories] = await Promise.all([
      storage.getAllCategories()
    ])

    // 使用推荐算法获取排序后的提示词
    const recommendations = await recommendationService.getHybridRecommendations('', 100)
    prompts.value = recommendations.map(rec => rec.prompt)
    categories.value = allCategories
  } catch (error) {
    console.error('Failed to load prompts or categories in content script:', error)
  } finally {
    isLoading.value = false
  }
})

const handleSelect = (prompt: Prompt) => {
  console.log('AI-Prompts: handleSelect called with prompt:', prompt.title)
  console.log('AI-Prompts: Emitting select event with content:', prompt.content)
  emit('select', prompt.content, prompt.id)
  hide()
}

const handlePreview = (prompt: Prompt, event: MouseEvent) => {
  event.stopPropagation()
  previewPrompt.value = prompt
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
  previewPrompt.value = null
}

const selectCategory = (categoryId: string) => {
  selectedCategoryId.value = categoryId
}

const show = (rect: DOMRect) => {
  console.log('AI-Prompts: show() called with rect:', rect)
  console.log('AI-Prompts: prompts.value.length:', prompts.value.length)
  console.log('AI-Prompts: isLoading.value:', isLoading.value)

  styleObject.value = {
    position: 'fixed',
    top: `${rect.bottom + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
  }
  isVisible.value = true
  console.log('AI-Prompts: isVisible set to true, styleObject:', styleObject.value)
}

const hide = () => {
  isVisible.value = false
  showPreview.value = false
  previewPrompt.value = null
}

defineExpose({ show, hide })
</script>

<template>
  <!-- 主弹窗容器 -->
  <div
    v-if="isVisible"
    :style="styleObject"
    class="ai-prompts-popup-container"
  >
    <!-- 弹窗主体 -->
    <div class="ai-prompts-popup-content">
      <!-- 弹窗头部 -->
      <div class="ai-prompts-popup-header">
        <div class="ai-prompts-popup-title">🎯 选择提示词</div>
        <button class="ai-prompts-close-btn" @click="hide">×</button>
      </div>

      <!-- 搜索栏 -->
      <div class="ai-prompts-search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索提示词..."
          class="ai-prompts-search-input"
        />
      </div>

      <!-- 分类标签页 -->
      <div class="ai-prompts-categories-tabs">
        <button
          v-for="category in availableCategories"
          :key="category.id"
          :class="['ai-prompts-category-tab', { active: selectedCategoryId === category.id }]"
          @click="selectCategory(category.id)"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- 提示词列表 -->
      <div v-if="isLoading" class="ai-prompts-loading">加载中...</div>
      <div v-else-if="filteredPrompts.length > 0" class="ai-prompts-list">
        <div
          v-for="prompt in filteredPrompts"
          :key="prompt.id"
          class="ai-prompts-item"
          @click="(event) => {
            console.log('AI-Prompts: Item clicked:', prompt.title);
            event.stopPropagation();
            handleSelect(prompt);
          }"
        >
          <div class="ai-prompts-item-header">
            <div class="ai-prompts-item-title">{{ prompt.title }}</div>
            <button
              @click="(event) => {
                console.log('AI-Prompts: Preview button clicked for:', prompt.title);
                event.stopPropagation();
                handlePreview(prompt, event);
              }"
              class="ai-prompts-preview-btn"
            >
              预览
            </button>
          </div>
          <div class="ai-prompts-item-description">{{ prompt.description }}</div>
        </div>
      </div>
      <div v-else class="ai-prompts-empty">未找到匹配的提示词</div>

      <!-- 底部快捷键提示 -->
      <div class="ai-prompts-footer">
        <div class="ai-prompts-shortcut-hint">
          ⌨️ 快捷键：↑↓ 选择，Enter 确认，Esc 取消
        </div>
      </div>
    </div>
  </div>

  <!-- 预览弹窗 -->
  <div
    v-if="showPreview && previewPrompt"
    class="ai-prompts-preview-overlay"
    @click="closePreview"
  >
    <div
      class="ai-prompts-preview-content"
      @click.stop
    >
      <div class="ai-prompts-preview-header">
        <div class="ai-prompts-preview-title">{{ previewPrompt.title }}</div>
        <button class="ai-prompts-close-btn" @click="closePreview">×</button>
      </div>
      <div class="ai-prompts-preview-description">{{ previewPrompt.description }}</div>
      <div class="ai-prompts-preview-body">{{ previewPrompt.content }}</div>
      <div class="ai-prompts-preview-footer">
        <button class="ai-prompts-btn ai-prompts-btn-secondary" @click="closePreview">
          关闭
        </button>
        <button class="ai-prompts-btn ai-prompts-btn-primary" @click="(event) => {
          event.stopPropagation();
          if (previewPrompt) {
            console.log('AI-Prompts: Using prompt from preview:', previewPrompt.title);
            handleSelect(previewPrompt);
          }
        }">
          使用此提示词
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 主弹窗容器样式 */
.ai-prompts-popup-container {
  position: fixed;
  z-index: 999999 !important;
  width: 600px;
  max-height: 500px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.ai-prompts-popup-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ai-prompts-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.ai-prompts-popup-title {
  font-weight: 600;
  font-size: 16px;
}

.ai-prompts-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.ai-prompts-close-btn:hover {
  opacity: 0.8;
}

/* 搜索栏 */
.ai-prompts-search-bar {
  padding: 12px 16px;
}

.ai-prompts-search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 14px;
}

.ai-prompts-search-input:focus {
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* 分类标签页 */
.ai-prompts-categories-tabs {
  display: flex;
  gap: 8px;
  padding: 0 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  overflow-x: auto;
  white-space: nowrap;
}

/* 美化滚动条 (仅在webkit内核浏览器生效) */
.ai-prompts-categories-tabs::-webkit-scrollbar {
  height: 4px;
}

.ai-prompts-categories-tabs::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 4px;
}

.ai-prompts-category-tab {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  background-color: #f8f8f8;
}

.ai-prompts-category-tab:hover {
  color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.ai-prompts-category-tab.active {
  background-color: #007aff;
  color: white;
  border-color: #007aff;
}

/* 提示词列表 */
.ai-prompts-list {
  max-height: 300px;
  overflow-y: auto;
}

.ai-prompts-item {
  padding: 12px 20px;
  border-bottom: 1px solid #f1f3f5;
  cursor: pointer;
  transition: background-color 0.2s ease;
  pointer-events: auto;
  user-select: none;
}

.ai-prompts-item:hover {
  background: #f8f9fa;
}

.ai-prompts-item:last-child {
  border-bottom: none;
}

.ai-prompts-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.ai-prompts-item-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
  flex: 1;
}

.ai-prompts-item-description {
  font-size: 12px;
  color: #6c757d;
  line-height: 1.4;
}

.ai-prompts-preview-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.ai-prompts-item:hover .ai-prompts-preview-btn {
  opacity: 1;
}

.ai-prompts-preview-btn:hover {
  background: #2980b9;
}

/* 加载和空状态 */
.ai-prompts-loading,
.ai-prompts-empty {
  padding: 20px;
  text-align: center;
  color: #6c757d;
}

/* 底部 */
.ai-prompts-footer {
  padding: 12px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.ai-prompts-shortcut-hint {
  font-size: 12px;
  color: #6c757d;
}

/* 预览弹窗覆盖层 */
.ai-prompts-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999999 !important;
}

/* 预览弹窗内容 */
.ai-prompts-preview-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  z-index: 9999999 !important;
  position: relative;
}

.ai-prompts-preview-header {
  background: #3498db;
  color: white;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-prompts-preview-title {
  font-size: 18px;
  font-weight: 600;
}

.ai-prompts-preview-description {
  padding: 12px 20px;
  font-size: 14px;
  color: #6c757d;
  border-bottom: 1px solid #e9ecef;
}

.ai-prompts-preview-body {
  padding: 20px;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
  color: #2c3e50;
}

.ai-prompts-preview-footer {
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 按钮样式 */
.ai-prompts-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.ai-prompts-btn-primary {
  background: #3498db;
  color: white;
}

.ai-prompts-btn-primary:hover {
  background: #2980b9;
}

.ai-prompts-btn-secondary {
  background: #6c757d;
  color: white;
}

.ai-prompts-btn-secondary:hover {
  background: #5a6268;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-prompts-popup-container {
    width: 90%;
    max-width: 400px;
  }

  .ai-prompts-preview-content {
    width: 95%;
    max-width: 400px;
  }
}

/* 滚动条样式 */
.ai-prompts-list::-webkit-scrollbar,
.ai-prompts-preview-body::-webkit-scrollbar {
  width: 6px;
}

.ai-prompts-list::-webkit-scrollbar-track,
.ai-prompts-preview-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.ai-prompts-list::-webkit-scrollbar-thumb,
.ai-prompts-preview-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.ai-prompts-list::-webkit-scrollbar-thumb:hover,
.ai-prompts-preview-body::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
