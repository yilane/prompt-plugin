<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { storage } from '../utils/storage';
import type { Prompt } from '../types';
import { Bar, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const prompts = ref<Prompt[]>([]);
const isLoading = ref(true);

const totalPrompts = computed(() => prompts.value.length);
const totalFavorites = computed(() => prompts.value.filter(p => p.isFavorite).length);
const totalUsage = computed(() => prompts.value.reduce((sum, p) => sum + (p.useCount || 0), 0));

const topUsedPrompts = computed(() => {
  const sorted = [...prompts.value].sort((a, b) => (b.useCount || 0) - (a.useCount || 0));
  return sorted.slice(0, 5);
});

const categoryDistribution = computed(() => {
  const distribution: Record<string, number> = {};
  prompts.value.forEach(p => {
    const category = p.category || '未分类';
    distribution[category] = (distribution[category] || 0) + 1;
  });
  return distribution;
});

const topUsedChartData = computed(() => ({
  labels: topUsedPrompts.value.map(p => p.title),
  datasets: [{
    label: '使用次数',
    backgroundColor: '#3498db',
    data: topUsedPrompts.value.map(p => p.useCount || 0)
  }]
}));

const categoryChartData = computed(() => {
  const labels = Object.keys(categoryDistribution.value);
  const data = Object.values(categoryDistribution.value);
  return {
    labels,
    datasets: [{
      backgroundColor: ['#3498db', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6', '#1abc9c', '#bdc3c7'],
      data
    }]
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
};

onMounted(async () => {
  try {
    prompts.value = await storage.getAllPrompts();
  } catch (error) {
    console.error('Failed to load prompts for stats:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="mb-5 pb-4 border-b border-light-border dark:border-dark-border">
      <h3 class="text-lg font-semibold text-text-main dark:text-dark-text-main">使用统计</h3>
      <p class="text-sm text-text-muted dark:text-dark-text-muted mt-1">在这里查看您的提示词使用情况的分析报告。</p>
    </div>

    <div v-if="isLoading" class="text-center py-10">正在加载统计数据...</div>

    <div v-else class="space-y-8">
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-5 text-center">
          <h4 class="text-sm font-medium text-text-muted dark:text-dark-text-muted mb-1">总提示词数</h4>
          <p class="text-3xl font-bold text-primary">{{ totalPrompts }}</p>
        </div>
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-5 text-center">
          <h4 class="text-sm font-medium text-text-muted dark:text-dark-text-muted mb-1">收藏总数</h4>
          <p class="text-3xl font-bold text-primary">{{ totalFavorites }}</p>
        </div>
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-5 text-center">
          <h4 class="text-sm font-medium text-text-muted dark:text-dark-text-muted mb-1">累计使用次数</h4>
          <p class="text-3xl font-bold text-primary">{{ totalUsage }}</p>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-5">
          <h4 class="text-base font-semibold text-center mb-4 text-text-main dark:text-dark-text-main">Top 5 最常用提示词</h4>
          <div class="h-72">
            <Bar :data="topUsedChartData" :options="chartOptions" />
          </div>
        </div>
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-5">
          <h4 class="text-base font-semibold text-center mb-4 text-text-main dark:text-dark-text-main">分类占比</h4>
           <div class="h-72">
            <Doughnut :data="categoryChartData" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
