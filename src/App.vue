<script setup lang="ts">
import { RouterView } from 'vue-router'
import Sidebar from '@/components/layout/Sidebar.vue'
</script>

<template>
  <div class="management-interface">
    <Sidebar />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
@import '@/assets/base.css';

.management-interface {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 20px;
  /* Using padding on the container instead of height */
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.main-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
  overflow-y: auto;
}
</style>
