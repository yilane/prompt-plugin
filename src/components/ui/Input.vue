<template>
  <div class="relative">
    <!-- 标签 -->
    <label v-if="label" :for="inputId" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500 ml-1">*</span>
    </label>

    <!-- 输入框容器 -->
    <div class="relative">
      <!-- 前置图标 -->
      <div v-if="$slots.prefix" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <slot name="prefix" />
      </div>

      <!-- 输入框 -->
      <input
        :id="inputId"
        ref="inputRef"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        :minlength="minlength"
        :min="min"
        :max="max"
        :step="step"
        :required="required"
        :autocomplete="autocomplete"
        :class="inputClasses"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        @keyup="handleKeyup"
        @keypress="handleKeypress"
      />

      <!-- 后置内容 -->
      <div v-if="$slots.suffix || showClearButton" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <!-- 清除按钮 -->
        <button
          v-if="showClearButton"
          type="button"
          class="text-gray-400 hover:text-gray-600 focus:outline-none"
          @click="handleClear"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <!-- 后置图标 -->
        <slot name="suffix" />
      </div>
    </div>

    <!-- 帮助文本 -->
    <div v-if="helpText || error" class="mt-1">
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <p v-else-if="helpText" class="text-sm text-gray-500">{{ helpText }}</p>
    </div>

    <!-- 字数统计 -->
    <div v-if="maxlength && showCount" class="mt-1 text-right">
      <span class="text-xs text-gray-500">
        {{ currentLength }}/{{ maxlength }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, useSlots } from 'vue'

const $slots = useSlots()

interface InputProps {
  modelValue?: string | number
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'search'
  label?: string
  placeholder?: string
  helpText?: string
  error?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  clearable?: boolean
  showCount?: boolean
  maxlength?: number
  minlength?: number
  min?: number
  max?: number
  step?: number
  autocomplete?: string
}

const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  size: 'md',
  disabled: false,
  readonly: false,
  required: false,
  clearable: false,
  showCount: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  input: [value: string | number, event: Event]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
  keyup: [event: KeyboardEvent]
  keypress: [event: KeyboardEvent]
  clear: []
}>()

const inputRef = ref<HTMLInputElement>()
const inputId = `input-${Math.random().toString(36).substring(2, 9)}`

const currentLength = computed(() => {
  return String(props.modelValue || '').length
})

const showClearButton = computed(() => {
  return props.clearable && props.modelValue && !props.disabled && !props.readonly
})

const inputClasses = computed(() => {
  const baseClasses = [
    'block w-full rounded-lg border border-gray-300',
    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'readonly:bg-gray-50 readonly:cursor-default',
    'transition-colors duration-200'
  ]

  // 尺寸样式
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  }

  // 错误状态
  if (props.error) {
    baseClasses.push(
      'border-red-300 text-red-900 placeholder-red-300',
      'focus:ring-red-500 focus:border-red-500'
    )
  }

  // 前置图标间距
  if ($slots.prefix) {
    baseClasses.push('pl-10')
  }

  // 后置图标间距
  if ($slots.suffix || showClearButton.value) {
    baseClasses.push('pr-10')
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ]
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = props.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
  emit('input', value, event)
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const handleKeyup = (event: KeyboardEvent) => {
  emit('keyup', event)
}

const handleKeypress = (event: KeyboardEvent) => {
  emit('keypress', event)
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 暴露方法
const focus = () => {
  inputRef.value?.focus()
}

const blur = () => {
  inputRef.value?.blur()
}

const select = () => {
  inputRef.value?.select()
}

defineExpose({
  focus,
  blur,
  select,
  inputRef
})
</script> 