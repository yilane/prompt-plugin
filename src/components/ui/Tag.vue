<template>
  <span :class="tagClasses" @click="handleClick">
    <!-- 图标 -->
    <slot name="icon" />

    <!-- 内容 -->
    <span class="truncate">
      <slot>{{ content }}</slot>
    </span>

    <!-- 关闭按钮 -->
    <button
      v-if="closable"
      type="button"
      class="ml-1 -mr-1 flex-shrink-0 rounded-full p-0.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:bg-black focus:bg-opacity-10 transition-colors"
      @click="handleClose"
    >
      <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'UiTag'
})

interface TagProps {
  content?: string
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
  variant?: 'filled' | 'outlined' | 'light'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  closable?: boolean
  disabled?: boolean
  round?: boolean
}

const props = withDefaults(defineProps<TagProps>(), {
  color: 'default',
  variant: 'filled',
  size: 'sm',
  closable: false,
  disabled: false,
  round: false
})

const emit = defineEmits<{
  close: [event: MouseEvent]
  click: [event: MouseEvent]
}>()

const tagClasses = computed(() => {
  const baseClasses = [
    'inline-flex items-center font-medium transition-colors duration-200',
    'focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2'
  ]

  // 尺寸样式
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  // 圆角样式
  const roundClasses = props.round
    ? sizeClasses[props.size].includes('px-2 ') ? 'rounded-full' : 'rounded-full'
    : 'rounded-md'

  // 颜色和变体样式
  const colorVariantClasses = {
    default: {
      filled: [
        'bg-gray-100 text-gray-800 border border-gray-200',
        'hover:bg-gray-200',
        'focus-within:ring-gray-500'
      ],
      outlined: [
        'bg-transparent text-gray-700 border border-gray-300',
        'hover:bg-gray-50',
        'focus-within:ring-gray-500'
      ],
      light: [
        'bg-gray-100 text-gray-800 border border-transparent',
        'hover:bg-gray-200',
        'focus-within:ring-gray-500'
      ]
    },
    primary: {
      filled: [
        'bg-primary text-primary-foreground border border-primary',
        'hover:bg-primary-hover',
        'focus-within:ring-primary'
      ],
      outlined: [
        'bg-transparent text-primary border border-primary',
        'hover:bg-primary/10',
        'focus-within:ring-primary'
      ],
      light: [
        'bg-primary/10 text-primary border border-transparent',
        'hover:bg-primary/20',
        'focus-within:ring-primary'
      ]
    },
    success: {
      filled: [
        'bg-success text-success-foreground border border-success',
        'hover:bg-success-hover',
        'focus-within:ring-success'
      ],
      outlined: [
        'bg-transparent text-success border border-success',
        'hover:bg-success/10',
        'focus-within:ring-success'
      ],
      light: [
        'bg-success/10 text-success border border-transparent',
        'hover:bg-success/20',
        'focus-within:ring-success'
      ]
    },
    warning: {
      filled: [
        'bg-yellow-500 text-white border border-yellow-500',
        'hover:bg-yellow-600',
        'focus-within:ring-yellow-500'
      ],
      outlined: [
        'bg-transparent text-yellow-600 border border-yellow-500',
        'hover:bg-yellow-50',
        'focus-within:ring-yellow-500'
      ],
      light: [
        'bg-yellow-50 text-yellow-800 border border-transparent',
        'hover:bg-yellow-100',
        'focus-within:ring-yellow-500'
      ]
    },
    danger: {
      filled: [
        'bg-danger text-danger-foreground border border-danger',
        'hover:bg-danger/90',
        'focus-within:ring-danger'
      ],
      outlined: [
        'bg-transparent text-danger border border-danger',
        'hover:bg-danger/10',
        'focus-within:ring-danger'
      ],
      light: [
        'bg-danger/10 text-danger border border-transparent',
        'hover:bg-danger/20',
        'focus-within:ring-danger'
      ]
    },
    info: {
      filled: [
        'bg-cyan-600 text-white border border-cyan-600',
        'hover:bg-cyan-700',
        'focus-within:ring-cyan-500'
      ],
      outlined: [
        'bg-transparent text-cyan-600 border border-cyan-600',
        'hover:bg-cyan-50',
        'focus-within:ring-cyan-500'
      ],
      light: [
        'bg-cyan-50 text-cyan-700 border border-transparent',
        'hover:bg-cyan-100',
        'focus-within:ring-cyan-500'
      ]
    }
  }

  const classes = [
    ...baseClasses,
    sizeClasses[props.size],
    roundClasses,
    ...colorVariantClasses[props.color][props.variant]
  ]

  if (props.disabled) {
    classes.push('opacity-50 cursor-not-allowed pointer-events-none')
  } else if (!props.closable) {
    classes.push('cursor-default')
  }

  return classes
})

const handleClose = (event: MouseEvent) => {
  if (!props.disabled) {
    event.stopPropagation()
    emit('close', event)
  }
}

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.closable) {
    emit('click', event)
  }
}
</script>
