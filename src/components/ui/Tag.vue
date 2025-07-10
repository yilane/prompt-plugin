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
        'bg-gray-50 text-gray-600 border border-transparent',
        'hover:bg-gray-100',
        'focus-within:ring-gray-500'
      ]
    },
    primary: {
      filled: [
        'bg-blue-600 text-white border border-blue-600',
        'hover:bg-blue-700',
        'focus-within:ring-blue-500'
      ],
      outlined: [
        'bg-transparent text-blue-600 border border-blue-600',
        'hover:bg-blue-50',
        'focus-within:ring-blue-500'
      ],
      light: [
        'bg-blue-50 text-blue-700 border border-transparent',
        'hover:bg-blue-100',
        'focus-within:ring-blue-500'
      ]
    },
    success: {
      filled: [
        'bg-green-600 text-white border border-green-600',
        'hover:bg-green-700',
        'focus-within:ring-green-500'
      ],
      outlined: [
        'bg-transparent text-green-600 border border-green-600',
        'hover:bg-green-50',
        'focus-within:ring-green-500'
      ],
      light: [
        'bg-green-50 text-green-700 border border-transparent',
        'hover:bg-green-100',
        'focus-within:ring-green-500'
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
        'bg-red-600 text-white border border-red-600',
        'hover:bg-red-700',
        'focus-within:ring-red-500'
      ],
      outlined: [
        'bg-transparent text-red-600 border border-red-600',
        'hover:bg-red-50',
        'focus-within:ring-red-500'
      ],
      light: [
        'bg-red-50 text-red-700 border border-transparent',
        'hover:bg-red-100',
        'focus-within:ring-red-500'
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