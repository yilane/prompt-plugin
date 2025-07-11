<script setup lang="ts">
import Sidebar from './components/layout/Sidebar.vue'
import { useTheme } from './composables/useTheme'

useTheme()
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
#app {
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-layout {
  display: flex;
  height: 100vh;
  background-color: #f3f4f6;
  min-width: 1024px; /* 确保最小宽度 */
  overflow-x: auto; /* 处理水平溢出 */
}

:root.dark .app-layout {
  background-color: #111827;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  min-width: 400px; /* 为主内容区域设置最小宽度 */
  display: flex;
  flex-direction: column;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .app-layout {
    min-width: 900px;
  }

  .main-content {
    min-width: 300px;
  }
}

@media (max-width: 768px) {
  .app-layout {
    min-width: 600px;
    flex-direction: column;
  }

  .main-content {
    min-width: unset;
    height: calc(100vh - 80px); /* 为折叠的侧边栏留出空间 */
  }
}
</style>
