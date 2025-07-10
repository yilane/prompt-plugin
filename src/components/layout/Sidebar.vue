<template>
  <div class="w-64 bg-light-surface dark:bg-dark-surface p-4 flex flex-col">
    <nav class="space-y-2 flex-1">
      <router-link
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        v-slot="{ href, navigate, isActive }"
      >
        <a
          :href="href"
          @click="navigate"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-base font-medium transition-colors"
          :class="[
            isActive
              ? 'bg-primary text-white'
              : 'text-text-content dark:text-dark-text-content hover:bg-light-bg dark:hover:bg-dark-bg'
          ]"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span>{{ item.text }}</span>
        </a>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineOptions({
  name: 'LayoutSidebar'
})

const menuItems = [
  { to: '/', icon: '📋', text: '我的提示词' },
  { to: '/categories', icon: '📁', text: '分类管理' },
  { to: '/prompt-lib', icon: '🏪', text: '提示词库' },
  { to: '/favorites', icon: '⭐', text: '收藏夹' },
  { to: '/stats', icon: '📊', text: '使用统计' },
  { to: '/settings', icon: '⚙️', text: '设置' },
  { to: '/import-export', icon: '📤', text: '导入导出' },
]
</script>
