<script setup lang="ts">
import { ref, onMounted, computed, toRaw } from 'vue';
import { storage } from '../utils/storage';
import type { Settings, TriggerSequence, KeyboardShortcut } from '../types';
import Input from '../components/ui/Input.vue';
import Button from '../components/ui/Button.vue';
import Dropdown from '../components/ui/Dropdown.vue';
import { browser } from 'wxt/browser';
import { KeyboardShortcutsManager } from '../utils/keyboardShortcuts';

const settingsForm = ref<Settings | null>(null);
const isLoading = ref(true);
const showSuccessMessage = ref(false);
const isRecordingShortcut = ref<string | null>(null);

const themeOptions = [
  { label: '亮色', value: 'light' },
  { label: '暗色', value: 'dark' },
  { label: '跟随系统', value: 'system' },
];

const languageOptions = [
  { label: '中文', value: 'zh' },
  { label: 'English', value: 'en' },
];

const hasDuplicates = computed(() => {
  if (!settingsForm.value) return false;
  const values = settingsForm.value.triggerSequences.map(s => s.value);
  return new Set(values).size !== values.length;
});

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
    console.log('AI-Prompts: About to save settings:', JSON.stringify(settingsForm.value, null, 2));
    console.log('AI-Prompts: triggerSequences before save:', settingsForm.value.triggerSequences);
    
    await storage.saveSettings(toRaw(settingsForm.value));
    
    const newSettings = await storage.getSettings();
    console.log('AI-Prompts: Re-retrieved settings immediately after save:', newSettings);
    console.log('AI-Prompts: triggerSequences after save:', newSettings.triggerSequences);
    
    // 发送消息给所有content scripts
    console.log('AI-Prompts: Sending UPDATE_SETTINGS message to all tabs');
    try {
      const tabs = await browser.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          try {
            await browser.tabs.sendMessage(tab.id, { type: 'UPDATE_SETTINGS' });
            console.log(`AI-Prompts: Sent UPDATE_SETTINGS to tab ${tab.id}`);
          } catch (error) {
            console.log(`AI-Prompts: Failed to send message to tab ${tab.id}:`, error);
          }
        }
      }
      
      // 同时发送消息给background script更新键盘快捷键
      // 注意：键盘快捷键现在在content script中处理，不需要在background中更新
      console.log('AI-Prompts: Settings saved, keyboard shortcuts will be updated on next page load');
    } catch (error) {
      console.error('AI-Prompts: Failed to query tabs:', error);
    }
    
    showSuccessMessage.value = true;
    setTimeout(() => {
      showSuccessMessage.value = false;
    }, 3000);
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

const addSequence = () => {
  if (!settingsForm.value) return;
  settingsForm.value.triggerSequences.push({
    id: `seq-${Date.now()}`,
    value: '',
    enabled: true,
  });
};

const removeSequence = (id: string) => {
  if (!settingsForm.value) return;
  const index = settingsForm.value.triggerSequences.findIndex(s => s.id === id);
  if (index > -1) {
    settingsForm.value.triggerSequences.splice(index, 1);
  }
};

// 键盘快捷键管理
const startRecordingShortcut = (shortcutId: string) => {
  isRecordingShortcut.value = shortcutId;
  document.addEventListener('keydown', handleShortcutKeydown);
};

const stopRecordingShortcut = () => {
  isRecordingShortcut.value = null;
  document.removeEventListener('keydown', handleShortcutKeydown);
};

const handleShortcutKeydown = (event: KeyboardEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  if (!isRecordingShortcut.value || !settingsForm.value) return;
  
  const keys: string[] = [];
  if (event.ctrlKey) keys.push('Ctrl');
  if (event.altKey) keys.push('Alt');
  if (event.shiftKey) keys.push('Shift');
  if (event.metaKey) keys.push('Meta');
  
  const key = event.key;
  if (key && !['Control', 'Alt', 'Shift', 'Meta'].includes(key)) {
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right'
    };
    keys.push(keyMap[key] || key.toUpperCase());
  }
  
  const keyString = keys.join('+');
  
  // 验证快捷键
  if (KeyboardShortcutsManager.isValidShortcut(keyString)) {
    const shortcut = settingsForm.value.keyboardShortcuts.find(s => s.id === isRecordingShortcut.value);
    if (shortcut) {
      shortcut.keys = KeyboardShortcutsManager.formatShortcut(keyString);
    }
  }
  
  stopRecordingShortcut();
};

const resetShortcutToDefault = (shortcutId: string) => {
  if (!settingsForm.value) return;
  
  const defaultShortcuts: Record<string, string> = {
    'shortcut-open-dashboard': 'Ctrl+Shift+P',
    'shortcut-open-sidepanel': 'Ctrl+Shift+S',
    'shortcut-toggle-prompts': 'Ctrl+Shift+I',
    'shortcut-search-prompts': 'Ctrl+Shift+F'
  };
  
  const shortcut = settingsForm.value.keyboardShortcuts.find(s => s.id === shortcutId);
  if (shortcut && defaultShortcuts[shortcutId]) {
    shortcut.keys = defaultShortcuts[shortcutId];
  }
};

const hasShortcutConflicts = computed(() => {
  if (!settingsForm.value) return false;
  const enabledShortcuts = settingsForm.value.keyboardShortcuts.filter(s => s.enabled);
  const keys = enabledShortcuts.map(s => s.keys);
  return new Set(keys).size !== keys.length;
});
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

      <div class="space-y-4 py-4 border-t border-b border-light-border dark:border-dark-border">
        <div class="flex justify-between items-center">
          <label class="setting-label">快捷触发序列</label>
          <Button type="button" variant="secondary" @click="addSequence">添加序列</Button>
        </div>
        <p v-if="hasDuplicates" class="text-danger text-sm">检测到重复的触发序列，请修正。</p>
        <div v-for="(sequence, index) in settingsForm.triggerSequences" :key="sequence.id" class="flex items-center space-x-3">
          <Input v-model="sequence.value" :placeholder="`序列 ${index + 1}`" class="flex-grow" />
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="sequence.enabled" class="sr-only peer">
            <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
          <Button type="button" variant="danger" @click="removeSequence(sequence.id)">删除</Button>
        </div>
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

      <!-- 键盘快捷键配置 -->
      <div v-if="settingsForm.enableKeyboardShortcuts" class="space-y-4 py-4 border-t border-b border-light-border dark:border-dark-border">
        <div class="flex justify-between items-center">
          <label class="setting-label">全局键盘快捷键</label>
        </div>
        <p v-if="hasShortcutConflicts" class="text-danger text-sm">检测到快捷键冲突，请修正。</p>
        <div class="space-y-3">
          <div v-for="shortcut in settingsForm.keyboardShortcuts" :key="shortcut.id" 
               class="flex items-center space-x-3 p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
            <div class="flex-grow">
              <div class="font-medium text-text-main dark:text-dark-text-main">{{ shortcut.name }}</div>
              <div class="text-sm text-text-content dark:text-dark-text-content">{{ shortcut.description }}</div>
            </div>
            <div class="flex items-center space-x-2">
              <div class="relative">
                <input
                  :value="shortcut.keys"
                  readonly
                  :class="[
                    'px-3 py-1.5 text-sm rounded border border-gray-300 bg-gray-50',
                    'min-w-[120px] text-center font-mono',
                    isRecordingShortcut === shortcut.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
                  ]"
                  :placeholder="isRecordingShortcut === shortcut.id ? '按下快捷键...' : ''"
                />
              </div>
              <Button 
                v-if="isRecordingShortcut !== shortcut.id"
                type="button" 
                variant="secondary" 
                size="sm"
                @click="startRecordingShortcut(shortcut.id)"
              >
                设置
              </Button>
              <Button 
                v-else
                type="button" 
                variant="danger" 
                size="sm"
                @click="stopRecordingShortcut"
              >
                取消
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                @click="resetShortcutToDefault(shortcut.id)"
                title="重置为默认"
              >
                重置
              </Button>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="shortcut.enabled" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/50 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
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
