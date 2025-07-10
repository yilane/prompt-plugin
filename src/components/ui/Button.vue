<template>
  <button :class="classes" :disabled="disabled || loading" @click="handleClick">
    <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonVariant } from '../../types'

defineOptions({
  name: 'Button'
})

interface ButtonProps {
  variant?: ButtonVariant
  loading?: boolean
  disabled?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'secondary',
  loading: false,
  disabled: false,
  block: false
})

const emit = defineEmits(['click'])

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary',
    success: 'bg-success text-success-foreground hover:bg-success/90 focus:ring-success',
    danger: 'bg-danger text-danger-foreground hover:bg-danger/90 focus:ring-danger',
    ghost: 'hover:bg-accent hover:text-accent-foreground focus:ring-accent',
    link: 'text-primary underline-offset-4 hover:underline focus:ring-primary'
  }

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  }

  // Since size prop is removed, we default to 'md'
  return [
    base,
    variantClasses[props.variant || 'secondary'],
    sizeClasses['md'],
    props.block ? 'w-full' : ''
  ]
})

function handleClick(event: MouseEvent) {
  if (!props.loading && !props.disabled) {
    emit('click', event)
  }
}
</script> 