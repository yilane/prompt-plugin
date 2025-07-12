<script setup lang="ts">
import { ref } from 'vue';
import { storage } from '../utils/storage';
import Button from '../components/ui/Button.vue';
import Input from '../components/ui/Input.vue';

const fileToImport = ref<File | null>(null);
const importStatus = ref<'idle' | 'success' | 'error'>('idle');
const importError = ref('');

// CSV相关状态
const csvFileToImport = ref<File | null>(null);
const csvImportType = ref<'prompts' | 'categories'>('prompts');
const csvImportStatus = ref<'idle' | 'success' | 'error'>('idle');
const csvImportResult = ref<{ success: boolean; errors: string[]; warnings: string[]; imported: number } | null>(null);
const csvDelimiter = ref(',');

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

// CSV导出功能
const handleCSVExport = async (type: 'prompts' | 'categories' | 'both') => {
  try {
    const result = await storage.exportDataAsCSV(type, { delimiter: csvDelimiter.value });
    
    if (type === 'both') {
      // 导出两个文件
      if (result.prompts) {
        downloadCSV(result.prompts, 'prompts');
      }
      if (result.categories) {
        downloadCSV(result.categories, 'categories');
      }
    } else {
      const csvContent = result[type];
      if (csvContent) {
        downloadCSV(csvContent, type);
      }
    }
  } catch (error) {
    console.error('Failed to export CSV:', error);
    alert('导出CSV失败！');
  }
};

const downloadCSV = (csvContent: string, type: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const date = new Date().toISOString().split('T')[0];
  link.download = `prompt-plugin-${type}-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// CSV文件选择
const handleCSVFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    csvFileToImport.value = target.files[0];
    csvImportStatus.value = 'idle';
    csvImportResult.value = null;
  }
};

// CSV导入功能
const handleCSVImport = async () => {
  if (!csvFileToImport.value) {
    alert('请先选择一个CSV文件！');
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const content = e.target?.result as string;
      const result = await storage.importDataFromCSV(content, csvImportType.value);
      
      csvImportResult.value = result;
      csvImportStatus.value = result.success ? 'success' : 'error';
      
      if (result.success) {
        csvFileToImport.value = null;
        // 重置文件输入
        const fileInput = document.querySelector('input[type="file"][accept=".csv"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      csvImportStatus.value = 'error';
      csvImportResult.value = {
        success: false,
        errors: ['读取文件时发生错误'],
        warnings: [],
        imported: 0
      };
      console.error('Failed to import CSV:', err);
    }
  };
  reader.onerror = () => {
    csvImportStatus.value = 'error';
    csvImportResult.value = {
      success: false,
      errors: ['读取文件时发生错误'],
      warnings: [],
      imported: 0
    };
    console.error('File reading error');
  };
  reader.readAsText(csvFileToImport.value);
};
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="mb-5 pb-4 border-b border-light-border dark:border-dark-border">
      <h3 class="text-lg font-semibold text-text-main dark:text-dark-text-main">导入和导出数据</h3>
    </div>

    <div class="max-w-6xl mx-auto space-y-8">
      <!-- JSON 导入导出 -->
      <div class="grid md:grid-cols-2 gap-8">
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

    <!-- CSV 导入导出 -->
    <div class="border-t border-light-border dark:border-dark-border pt-8">
      <h3 class="text-lg font-semibold text-text-main dark:text-dark-text-main mb-6">CSV 格式导入导出</h3>
      
      <div class="grid lg:grid-cols-2 gap-8">
        <!-- CSV Export Card -->
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-6">
          <h4 class="text-base font-semibold text-text-main dark:text-dark-text-main mb-2">导出为 CSV</h4>
          <p class="text-sm text-text-content dark:text-dark-text-content mb-4">
            将您的提示词或分类导出为CSV格式，便于在Excel等工具中编辑和管理。
          </p>
          
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-text-main dark:text-dark-text-main mb-2 block">分隔符</label>
              <Input 
                v-model="csvDelimiter" 
                placeholder="CSV分隔符" 
                maxlength="1"
                class="w-20"
              />
            </div>
            
            <div class="space-y-2">
              <Button variant="primary" @click="handleCSVExport('prompts')" class="w-full">
                导出提示词 (.csv)
              </Button>
              <Button variant="secondary" @click="handleCSVExport('categories')" class="w-full">
                导出分类 (.csv)
              </Button>
              <Button variant="outline" @click="handleCSVExport('both')" class="w-full">
                导出全部 (两个文件)
              </Button>
            </div>
          </div>
        </div>

        <!-- CSV Import Card -->
        <div class="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-6">
          <h4 class="text-base font-semibold text-text-main dark:text-dark-text-main mb-2">从 CSV 导入</h4>
          <p class="text-sm text-text-content dark:text-dark-text-content mb-4">
            从CSV文件导入提示词或分类。CSV文件必须包含正确的列格式。
          </p>
          
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-text-main dark:text-dark-text-main mb-2 block">导入类型</label>
              <select 
                v-model="csvImportType"
                class="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                       dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-main"
              >
                <option value="prompts">提示词</option>
                <option value="categories">分类</option>
              </select>
            </div>
            
            <div>
              <label class="block">
                <span class="sr-only">选择CSV文件</span>
                <input
                  type="file"
                  @change="handleCSVFileChange"
                  accept=".csv"
                  class="block w-full text-sm text-text-muted dark:text-dark-text-muted
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-primary/10 file:text-primary
                         hover:file:bg-primary/20"
                />
              </label>
            </div>
            
            <Button 
              @click="handleCSVImport" 
              :disabled="!csvFileToImport" 
              variant="primary" 
              class="w-full"
            >
              导入 CSV 数据
            </Button>
          </div>
          
          <!-- CSV导入结果显示 -->
          <div v-if="csvImportResult" class="mt-4 space-y-2">
            <div v-if="csvImportStatus === 'success'" class="p-3 rounded-md bg-success/10 text-success text-sm">
              <div class="font-medium">导入成功！</div>
              <div>成功导入 {{ csvImportResult.imported }} 条记录</div>
              <div v-if="csvImportResult.warnings.length > 0" class="mt-2">
                <div class="font-medium">警告：</div>
                <ul class="list-disc list-inside">
                  <li v-for="warning in csvImportResult.warnings" :key="warning" class="text-xs">
                    {{ warning }}
                  </li>
                </ul>
              </div>
            </div>
            
            <div v-if="csvImportStatus === 'error'" class="p-3 rounded-md bg-danger/10 text-danger text-sm">
              <div class="font-medium">导入失败</div>
              <ul class="list-disc list-inside mt-1">
                <li v-for="error in csvImportResult.errors" :key="error" class="text-xs">
                  {{ error }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
