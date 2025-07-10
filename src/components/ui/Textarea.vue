<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  rows?: number
  required?: boolean
  disabled?: boolean
  error?: string
}>(), {
  rows: 4,
})

const emit = defineEmits(['update:modelValue'])

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2'
const themeClasses = 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border placeholder-text-muted/70 dark:placeholder-text-muted/70 text-text-content dark:text-dark-text-content focus:ring-primary focus:border-primary'
const errorClasses = 'border-red-500 text-red-600 focus:ring-red-500 focus:border-red-500'

const textareaClasses = computed(() => [
  baseClasses,
  props.error ? errorClasses : themeClasses,
  { 'cursor-not-allowed opacity-60': props.disabled }
])
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium text-text-content dark:text-dark-text-content mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <textarea
        :value="modelValue"
        @input="onInput"
        :placeholder="placeholder"
        :rows="rows"
        :required="required"
        :disabled="disabled"
        :class="textareaClasses"
      ></textarea>
    </div>
    <p v-if="error" class="mt-1 text-sm text-red-600">
      {{ error }}
    </p>
  </div>
</template> 