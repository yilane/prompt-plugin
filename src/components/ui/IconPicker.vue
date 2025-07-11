<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分类图标</label>
    <div class="grid grid-cols-8 gap-2">
      <button
        v-for="icon in presetIcons"
        :key="icon"
        type="button"
        class="flex items-center justify-center p-2 rounded-lg text-xl transition-colors duration-200"
        :class="[
          modelValue === icon
            ? 'bg-blue-500 text-white ring-2 ring-blue-300'
            : 'bg-gray-100 dark:bg-dark-surface hover:bg-gray-200 dark:hover:bg-gray-700'
        ]"
        @click="selectIcon(icon)"
      >
        {{ icon }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  modelValue?: string
}>()

const emit = defineEmits(['update:modelValue'])

const presetIcons = ref([
  '💻', '✍️', '🌐', '📊', '🎨', '📋', '📁',
  '💡', '🚀', '💬', '🎉', '📌', '⚙️', '❤️',
  '⭐️', '🔥', '📚', '🛠️', '⚖️', '🔑', '🧠',
  '⚡️', '📈', '🎵'
])

const selectIcon = (icon: string) => {
  emit('update:modelValue', icon)
}
</script>
