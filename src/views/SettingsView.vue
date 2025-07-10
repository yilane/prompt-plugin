<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storage } from '../utils/storage';
import type { Settings } from '../types';
import Input from '../components/ui/Input.vue';
import Button from '../components/ui/Button.vue';
import Dropdown from '../components/ui/Dropdown.vue';

const settingsForm = ref<Settings | null>(null);
const isLoading = ref(true);
const showSuccessMessage = ref(false);

const themeOptions = [
  { label: '亮色', value: 'light' },
  { label: '暗色', value: 'dark' },
  { label: '跟随系统', value: 'system' },
];

const languageOptions = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' },
];

onMounted(async () => {
  try {
    settingsForm.value = await storage.getSettings();
  } catch (error) {
    console.error('Failed to load settings:', error);
  } finally {
    isLoading.value = false;
  }
});

const handleSave = async () => {
  if (!settingsForm.value) return;
  try {
    await storage.saveSettings(settingsForm.value);
    showSuccessMessage.value = true;
    setTimeout(() => {
      showSuccessMessage.value = false;
    }, 3000);
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="mb-5 pb-4 border-b border-light-border dark:border-dark-border">
      <h3 class="text-lg font-semibold text-text-main dark:text-dark-text-main">应用设置</h3>
    </div>

    <div v-if="isLoading" class="text-center py-10">加载中...</div>

    <form v-if="settingsForm" @submit.prevent="handleSave" class="max-w-2xl mx-auto space-y-8">
      <div class="setting-item">
        <label for="theme" class="setting-label">应用主题</label>
        <Dropdown v-model="settingsForm.theme" :options="themeOptions" id="theme" class="w-48" />
      </div>

      <div class="setting-item">
        <label for="language" class="setting-label">显示语言</label>
        <Dropdown v-model="settingsForm.language" :options="languageOptions" id="language" class="w-48" />
      </div>

      <div class="setting-item">
        <label for="triggerKey" class="setting-label">快捷触发键</label>
        <Input v-model="settingsForm.triggerKey" id="triggerKey" placeholder="例如：@@" class="w-48" />
      </div>

      <div class="setting-item">
        <label class="setting-label">启用快捷输入</label>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="settingsForm.enableQuickInsert" class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
      </div>

       <div class="setting-item">
        <label class="setting-label">启用键盘快捷键</label>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="settingsForm.enableKeyboardShortcuts" class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
      </div>

      <div class="setting-item">
        <label class="setting-label">启用桌面通知</label>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="settingsForm.enableNotifications" class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
      </div>

      <div class="setting-item">
        <label class="setting-label">自动备份</label>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="settingsForm.autoBackup" class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
      </div>

      <div class="flex justify-between items-center pt-5 mt-5 border-t border-light-border dark:border-dark-border">
        <transition
          enter-active-class="transition-opacity duration-300"
          leave-active-class="transition-opacity duration-300"
          enter-from-class="opacity-0"
          leave-to-class="opacity-0"
        >
          <span v-if="showSuccessMessage" class="text-success font-medium">设置已保存！</span>
        </transition>
        <Button variant="primary" type="submit">保存设置</Button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.setting-label {
  @apply text-base font-medium text-text-main dark:text-dark-text-main;
}
</style>
