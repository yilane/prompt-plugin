<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="buttonClasses"
    @click="handleClick"
  >
    <div v-if="loading" class="flex items-center justify-center">
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {{ loadingText }}
    </div>
    <template v-else>
      <slot name="icon" />
      <span v-if="$slots.default">
        <slot />
      </span>
    </template>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonVariant, ButtonSize } from '@/components/ui'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  block?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  loadingText: '加载中...',
  block: false
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClasses = computed(() => {
  const base = 'inline-flex items-center justify-center font-semibold border focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200'

  const variants = {
    primary: 'bg-primary border-transparent text-white hover:bg-primary-hover focus:ring-primary',
    secondary: 'bg-light-surface border-light-border text-text-content hover:bg-gray-100 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-content dark:hover:bg-dark-border',
    success: 'bg-success border-transparent text-white hover:bg-success-hover focus:ring-success',
    danger: 'bg-red-600 border-transparent text-white hover:bg-red-700 focus:ring-red-500', // 保持红色以便区分
    ghost: 'bg-transparent border-transparent text-text-content hover:bg-gray-200/50 dark:text-dark-text-content dark:hover:bg-dark-surface',
    link: 'bg-transparent border-transparent text-primary hover:underline focus:ring-primary'
  }

  // 尺寸样式
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs min-h-[24px]',
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-6 py-2.5 text-base min-h-[44px]',
    xl: 'px-8 py-3 text-lg min-h-[48px]'
  }

  const classes = [
    base,
    variants[props.variant],
    sizeClasses[props.size]
  ]

  if (props.block) {
    classes.push('w-full')
  }

  if (props.variant === 'link') {
    classes.push('hover:no-underline')
  }

  return classes
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script> 