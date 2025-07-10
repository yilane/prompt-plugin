<script setup lang="ts">
import { ref } from 'vue';
import { storage } from '../utils/storage';
import Button from '../components/ui/Button.vue';

const fileToImport = ref<File | null>(null);
const importStatus = ref<'idle' | 'success' | 'error'>('idle');
const importError = ref('');

const handleExport = async () => {
  try {
    const dataStr = await storage.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `prompt-plugin-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data:', error);
    alert('导出数据失败！');
  }
};

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    fileToImport.value = target.files[0];
    importStatus.value = 'idle';
  }
};

const handleImport = async () => {
  if (!fileToImport.value) {
    alert('请先选择一个文件！');
    return;
  }

  if (!window.confirm('警告：导入数据将覆盖现有数据，此操作不可撤销。您确定要继续吗？')) {
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      await storage.importData(content);
      importStatus.value = 'success';
      fileToImport.value = null; // Reset file input
    } catch (err) {
      importStatus.value = 'error';
      importError.value = '导入失败，请确保文件格式正确。';
      console.error('Failed to import data:', err);
    }
  };
  reader.onerror = () => {
    importStatus.value = 'error';
    importError.value = '读取文件时发生错误。';
    console.error('File reading error');
  };
  reader.readAsText(fileToImport.value);
};
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="mb-5 pb-4 border-b border-light-border dark:border-dark-border">
      <h3 class="text-lg font-semibold text-text-main dark:text-dark-text-main">导入和导出数据</h3>
    </div>

    <div class="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
      <!-- Export Card -->
      <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-6">
        <h4 class="text-base font-semibold text-text-main dark:text-dark-text-main mb-2">导出数据</h4>
        <p class="text-sm text-text-content dark:text-dark-text-content mb-4">
          将您的所有提示词、分类和设置导出为一个JSON文件。您可以将此文件作为备份，或用于在其他浏览器中恢复您的数据。
        </p>
        <Button variant="primary" @click="handleExport">导出为 JSON 文件</Button>
      </div>

      <!-- Import Card -->
      <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-6">
        <h4 class="text-base font-semibold text-text-main dark:text-dark-text-main mb-2">导入数据</h4>
        <p class="text-sm text-text-content dark:text-dark-text-content mb-4">
          从一个之前导出的JSON文件中恢复您的数据。
          <strong class="text-danger font-semibold">警告：这将覆盖您当前的所有数据。</strong>
        </p>
        <div class="space-y-4">
          <label class="block">
            <span class="sr-only">选择文件</span>
            <input
              type="file"
              @change="handleFileChange"
              accept=".json"
              class="block w-full text-sm text-text-muted dark:text-dark-text-muted
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-primary/10 file:text-primary
                     hover:file:bg-primary/20"
            />
          </label>
          <Button @click="handleImport" :disabled="!fileToImport" variant="danger" block>导入数据</Button>
        </div>
        <div v-if="importStatus === 'success'" class="mt-4 p-3 rounded-md bg-success/10 text-success text-sm font-medium">导入成功！您的数据已恢复。</div>
        <div v-if="importStatus === 'error'" class="mt-4 p-3 rounded-md bg-danger/10 text-danger text-sm font-medium">{{ importError }}</div>
      </div>
    </div>
  </div>
</template>
