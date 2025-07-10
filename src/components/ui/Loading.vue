<template>
  <div v-if="visible" :class="containerClasses">
    <!-- 遮罩层 -->
    <div v-if="overlay" class="absolute inset-0 bg-white bg-opacity-75 rounded-lg" />
    
    <!-- 加载内容 -->
    <div :class="contentClasses">
      <!-- 加载图标 -->
      <div :class="spinnerClasses">
        <component :is="spinnerComponent" />
      </div>
      
      <!-- 加载文本 -->
      <div v-if="text" :class="textClasses">
        {{ text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

interface LoadingProps {
  visible?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  type?: 'spinner' | 'dots' | 'bars' | 'pulse'
  text?: string
  overlay?: boolean
  color?: 'primary' | 'secondary' | 'white'
}

const props = withDefaults(defineProps<LoadingProps>(), {
  visible: true,
  size: 'md',
  type: 'spinner',
  overlay: false,
  color: 'primary'
})

// 尺寸配置
const sizeConfig = {
  xs: { spinner: 'h-4 w-4', text: 'text-xs mt-1' },
  sm: { spinner: 'h-5 w-5', text: 'text-sm mt-1' },
  md: { spinner: 'h-6 w-6', text: 'text-sm mt-2' },
  lg: { spinner: 'h-8 w-8', text: 'text-base mt-2' },
  xl: { spinner: 'h-10 w-10', text: 'text-lg mt-3' }
}

// 颜色配置
const colorConfig = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white'
}

const containerClasses = computed(() => {
  const baseClasses = ['flex items-center justify-center']
  
  if (props.overlay) {
    baseClasses.push('relative min-h-24')
  }
  
  return baseClasses
})

const contentClasses = computed(() => [
  'flex flex-col items-center justify-center',
  props.overlay ? 'relative z-10' : ''
])

const spinnerClasses = computed(() => [
  sizeConfig[props.size].spinner,
  colorConfig[props.color],
  'animate-spin'
])

const textClasses = computed(() => [
  sizeConfig[props.size].text,
  colorConfig[props.color],
  'font-medium'
])

// 旋转器组件
const SpinnerIcon = defineComponent({
  name: 'SpinnerIcon',
  render: () => h('svg', {
    class: 'animate-spin',
    fill: 'none',
    viewBox: '0 0 24 24'
  }, [
    h('circle', {
      class: 'opacity-25',
      cx: '12',
      cy: '12',
      r: '10',
      stroke: 'currentColor',
      'stroke-width': '4'
    }),
    h('path', {
      class: 'opacity-75',
      fill: 'currentColor',
      d: 'm4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
    })
  ])
})

// 点状加载器
const DotsIcon = defineComponent({
  name: 'DotsIcon',
  render: () => h('div', { class: 'flex space-x-1' }, [
    h('div', { class: 'w-2 h-2 bg-current rounded-full animate-pulse' }),
    h('div', { class: 'w-2 h-2 bg-current rounded-full animate-pulse', style: 'animation-delay: 0.1s' }),
    h('div', { class: 'w-2 h-2 bg-current rounded-full animate-pulse', style: 'animation-delay: 0.2s' })
  ])
})

// 条状加载器
const BarsIcon = defineComponent({
  name: 'BarsIcon',
  render: () => h('div', { class: 'flex space-x-1 items-end' }, [
    h('div', { class: 'w-1 h-4 bg-current animate-pulse' }),
    h('div', { class: 'w-1 h-6 bg-current animate-pulse', style: 'animation-delay: 0.1s' }),
    h('div', { class: 'w-1 h-4 bg-current animate-pulse', style: 'animation-delay: 0.2s' }),
    h('div', { class: 'w-1 h-6 bg-current animate-pulse', style: 'animation-delay: 0.3s' }),
    h('div', { class: 'w-1 h-4 bg-current animate-pulse', style: 'animation-delay: 0.4s' })
  ])
})

// 脉冲加载器
const PulseIcon = defineComponent({
  name: 'PulseIcon',
  render: () => h('div', { class: 'relative' }, [
    h('div', { class: 'w-4 h-4 bg-current rounded-full animate-ping absolute' }),
    h('div', { class: 'w-4 h-4 bg-current rounded-full' })
  ])
})

const spinnerComponent = computed(() => {
  switch (props.type) {
    case 'dots':
      return DotsIcon
    case 'bars':
      return BarsIcon
    case 'pulse':
      return PulseIcon
    default:
      return SpinnerIcon
  }
})
</script>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style> 