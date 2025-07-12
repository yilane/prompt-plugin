<template>
  <div v-if="recommendations.length > 0" class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-medium text-gray-900 flex items-center">
        <svg class="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {{ title }}
      </h3>
      <button 
        v-if="showRefresh"
        @click="$emit('refresh')"
        class="text-gray-400 hover:text-gray-600 transition-colors"
        title="刷新推荐"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    
    <div class="space-y-2">
      <div 
        v-for="item in recommendations" 
        :key="item.prompt.id"
        class="group relative flex items-start p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-pointer"
        @click="$emit('select', item.prompt)"
      >
        <!-- 推荐分数指示器 -->
        <div class="flex-shrink-0 mr-3">
          <div 
            class="w-2 h-2 rounded-full"
            :class="getScoreColor(item.score)"
          ></div>
        </div>
        
        <!-- 内容区域 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-gray-900 truncate">
                {{ item.prompt.title }}
              </h4>
              <p class="text-xs text-gray-500 mt-1 line-clamp-2">
                {{ item.prompt.description }}
              </p>
            </div>
            
            <!-- 推荐原因 -->
            <div class="flex-shrink-0 ml-2">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {{ item.reason }}
              </span>
            </div>
          </div>
          
          <!-- 标签和统计信息 -->
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-center space-x-2">
              <!-- 分类标签 -->
              <span 
                v-if="item.prompt.categoryDetails"
                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
              >
                {{ item.prompt.categoryDetails.icon }} {{ item.prompt.categoryDetails.name }}
              </span>
              
              <!-- 使用次数 -->
              <span 
                v-if="item.prompt.useCount > 0"
                class="text-xs text-gray-400"
              >
                使用 {{ item.prompt.useCount }} 次
              </span>
            </div>
            
            <!-- 操作按钮 -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click.stop="$emit('preview', item.prompt)"
                class="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="预览"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div 
      v-if="recommendations.length === 0 && !loading"
      class="text-center py-6 text-gray-500"
    >
      <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <p class="text-sm">暂无推荐内容</p>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-6">
      <div class="inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-gray-600">加载推荐中...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { RecommendationResult } from '../utils/recommendationService'

interface Props {
  recommendations: RecommendationResult[]
  title?: string
  loading?: boolean
  showRefresh?: boolean
}

withDefaults(defineProps<Props>(), {
  title: '推荐提示词',
  loading: false,
  showRefresh: true
})

defineEmits<{
  select: [prompt: any]
  preview: [prompt: any]
  refresh: []
}>()

/**
 * 根据推荐分数返回颜色类
 */
function getScoreColor(score: number): string {
  if (score >= 80) {
    return 'bg-green-500' // 高分推荐
  } else if (score >= 50) {
    return 'bg-blue-500'  // 中等推荐
  } else if (score >= 20) {
    return 'bg-yellow-500' // 低分推荐
  } else {
    return 'bg-gray-400'   // 很低分
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>