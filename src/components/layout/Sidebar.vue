<template>
  <div class="sidebar bg-white rounded-lg p-5 border border-gray-200">
    <ul class="sidebar-menu space-y-2">
      <li>
        <router-link to="/" class="sidebar-link">
          <span class="icon">📋</span>
          <span>我的提示词</span>
        </router-link>
      </li>
      <li>
        <router-link to="/categories" class="sidebar-link">
          <span class="icon">📁</span>
          <span>分类管理</span>
        </router-link>
      </li>
      <li>
        <router-link to="/prompt-lib" class="sidebar-link">
          <span class="icon">🏪</span>
          <span>提示词库</span>
        </router-link>
      </li>
      <li>
        <router-link to="/favorites" class="sidebar-link">
          <span class="icon">⭐</span>
          <span>收藏夹</span>
        </router-link>
      </li>
      <li>
        <router-link to="/stats" class="sidebar-link">
          <span class="icon">📊</span>
          <span>使用统计</span>
        </router-link>
      </li>
      <li>
        <router-link to="/settings" class="sidebar-link">
          <span class="icon">⚙️</span>
          <span>设置</span>
        </router-link>
      </li>
      <li>
        <router-link to="/import-export" class="sidebar-link">
          <span class="icon">📤</span>
          <span>导入导出</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<style scoped>
.sidebar-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  text-decoration: none;
  color: #495057;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
}

.sidebar-link:hover {
  background-color: #f1f3f5;
  color: #2c3e50;
}

.sidebar-link.router-link-active {
  background-color: #e3f2fd;
  color: #3498db;
  font-weight: 600;
}

.sidebar-link .icon {
  font-size: 1.25rem;
}
</style> 