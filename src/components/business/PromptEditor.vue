<script setup lang="ts">
import type { Prompt, Category } from '../../types'
import { storage } from '../../utils/storage'
import Input from '../ui/Input.vue'
import Textarea from '../ui/Textarea.vue'
import Button from '../ui/Button.vue'
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  prompt?: Prompt | null
}>()

const emit = defineEmits<{
  (e: 'save', prompt: Partial<Prompt>): void
  (e: 'cancel'): void
}>()

const categories = ref<Category[]>([]);
const isLoadingCategories = ref(true);

// Use a well-defined local state for the form
const form = ref({
  title: '',
  content: '',
  category: '',
  description: ''
})
const tagsInput = ref('')

watch(() => props.prompt, (newPrompt) => {
  if (newPrompt) {
    form.value.title = newPrompt.title || ''
    form.value.content = newPrompt.content || ''
    form.value.category = newPrompt.category || ''
    form.value.description = newPrompt.description || ''
    tagsInput.value = Array.isArray(newPrompt.tags) ? newPrompt.tags.join(', ') : ''
  } else {
    // Reset for creation
    form.value = { title: '', content: '', category: '', description: '' }
    tagsInput.value = ''
  }
}, { immediate: true, deep: true })

onMounted(async () => {
  try {
    const loadedCategories = await storage.getAllCategories();
    categories.value = loadedCategories.sort((a, b) => a.sort - b.sort);
  } catch (error) {
    console.error("Failed to load categories:", error);
    // Optionally handle error in UI
  } finally {
    isLoadingCategories.value = false;
  }
});

const handleSave = () => {
  const tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
  const promptData = { ...form.value, tags };
  if (props.prompt) {
    // Pass the original ID in edit mode
    emit('save', { ...promptData, id: props.prompt.id });
  } else {
    emit('save', promptData);
  }
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="p-2 space-y-4">
    <Input v-model="form.title" label="标题" placeholder="给你的提示词起个名字" />
    <Textarea v-model="form.content" label="提示词内容" placeholder="在这里输入你的提示词模板..." :rows="6" />

    <div>
      <label for="category-select" class="block text-sm font-medium text-gray-700 mb-1">分类</label>
      <select
        id="category-select"
        v-model="form.category"
        :disabled="isLoadingCategories"
        class="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        <option value="" disabled>{{ isLoadingCategories ? '加载中...' : '请选择一个分类' }}</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </option>
      </select>
    </div>

    <Input v-model="tagsInput" label="标签 (用逗号分隔)" placeholder="例如：JavaScript, Vue, TailwindCSS" />
    <Textarea v-model="form.description" label="描述" placeholder="简单描述这个提示词的作用" :rows="2" />
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
      <Button variant="secondary" @click="handleCancel">取消</Button>
      <Button @click="handleSave">保存</Button>
    </div>
  </div>
</template>
