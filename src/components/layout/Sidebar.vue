<template>
  <div class="sidebar bg-white rounded-lg p-5 border border-gray-200">
    <ul class="sidebar-menu space-y-2">
      <li>
        <a href="#" class="sidebar-link active">
          <span class="icon">📋</span>
          <span>我的提示词</span>
        </a>
      </li>
      <li>
        <a href="#" class="sidebar-link">
          <span class="icon">🏪</span>
          <span>提示词库</span>
        </a>
      </li>
      <li>
        <a href="#" class="sidebar-link">
          <span class="icon">📁</span>
          <span>分类管理</span>
        </a>
      </li>
      <li>
        <a href="#" class="sidebar-link">
          <span class="icon">⭐</span>
          <span>收藏夹</span>
        </a>
      </li>
      <li>
        <a href="#" class="sidebar-link">
          <span class="icon">📊</span>
          <span>使用统计</span>
        </a>
      </li>
      <li>
        <a href="#" class="sidebar-link">
          <span class="icon">⚙️</span>
          <span>设置</span>
        </a>
      </li>
      <li>
        <a href="#" class="sidebar-link">
          <span class="icon">📤</span>
          <span>导入导出</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
// No script logic needed for this static component yet.
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

.sidebar-link.active {
  background-color: #e3f2fd;
  color: #3498db;
  font-weight: 600;
}

.sidebar-link .icon {
  font-size: 1.25rem;
}
</style> 