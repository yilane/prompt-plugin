<template>
  <div ref="dropdownRef" class="relative inline-block">
    <!-- 触发器 -->
    <div @click="toggle" @keydown="handleTriggerKeydown">
      <slot name="trigger" :visible="visible" :toggle="toggle">
        <button
          type="button"
          :class="triggerClasses"
          :disabled="disabled"
        >
          <span>{{ placeholder }}</span>
          <svg
            :class="['ml-2 h-4 w-4 transition-transform', visible ? 'rotate-180' : '']"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </slot>
    </div>

    <!-- 下拉菜单 -->
    <teleport to="body">
      <transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-95 translate-y-1"
        enter-to-class="opacity-100 scale-100 translate-y-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 scale-100 translate-y-0"
        leave-to-class="opacity-0 scale-95 translate-y-1"
      >
        <div
          v-if="visible"
          ref="menuRef"
          :style="menuPosition"
          :class="menuClasses"
          @keydown="handleMenuKeydown"
        >
          <slot :close="close" :select="selectOption">
            <div
              v-for="(option, index) in options"
              :key="getOptionKey(option, index)"
              :class="getOptionClasses(option, index)"
              @click="selectOption(option)"
              @mouseenter="highlightedIndex = index"
            >
              <slot name="option" :option="option" :index="index">
                {{ getOptionLabel(option) }}
              </slot>
            </div>
          </slot>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface DropdownOption {
  label: string
  value: any
  disabled?: boolean
  divided?: boolean
  icon?: string
  [key: string]: any
}

interface DropdownProps {
  options?: DropdownOption[]
  modelValue?: any
  placeholder?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'
  maxHeight?: string
  filterable?: boolean
  clearable?: boolean
  multiple?: boolean
}

const props = withDefaults(defineProps<DropdownProps>(), {
  options: () => [],
  placeholder: '请选择',
  disabled: false,
  size: 'md',
  placement: 'bottom-start',
  maxHeight: '200px',
  filterable: false,
  clearable: false,
  multiple: false
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any, option: DropdownOption | null]
  select: [value: any, option: DropdownOption]
  clear: []
  'visible-change': [visible: boolean]
}>()

const dropdownRef = ref<HTMLElement>()
const menuRef = ref<HTMLElement>()
const visible = ref(false)
const highlightedIndex = ref(-1)
const menuPosition = ref({})

const triggerClasses = computed(() => {
  const baseClasses = [
    'inline-flex items-center justify-between w-full rounded-lg border border-gray-300',
    'bg-white px-3 py-2 text-sm text-gray-900',
    'hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
    'transition-colors duration-200'
  ]

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  }

  return [
    ...baseClasses,
    sizeClasses[props.size]
  ]
})

const menuClasses = computed(() => [
  'absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg',
  'py-1 min-w-full overflow-auto',
  'focus:outline-none'
])

const getOptionKey = (option: DropdownOption, index: number) => {
  return option.value !== undefined ? option.value : index
}

const getOptionLabel = (option: DropdownOption) => {
  return option.label || option.value
}

const getOptionClasses = (option: DropdownOption, index: number) => {
  const baseClasses = [
    'px-3 py-2 text-sm cursor-pointer select-none relative',
    'hover:bg-gray-100 focus:bg-gray-100'
  ]

  if (option.disabled) {
    baseClasses.push('text-gray-400 cursor-not-allowed')
  } else {
    baseClasses.push('text-gray-900')
  }

  if (highlightedIndex.value === index) {
    baseClasses.push('bg-gray-100')
  }

  if (isSelected(option)) {
    baseClasses.push('bg-blue-50 text-blue-700')
  }

  if (option.divided) {
    baseClasses.push('border-t border-gray-200')
  }

  return baseClasses
}

const isSelected = (option: DropdownOption) => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(option.value)
  }
  return props.modelValue === option.value
}

const toggle = () => {
  if (props.disabled) return
  
  if (visible.value) {
    close()
  } else {
    open()
  }
}

const open = async () => {
  if (props.disabled) return
  
  visible.value = true
  highlightedIndex.value = -1
  
  await nextTick()
  updateMenuPosition()
  
  // 聚焦到菜单
  if (menuRef.value) {
    menuRef.value.focus()
  }
  
  emit('visible-change', true)
}

const close = () => {
  visible.value = false
  highlightedIndex.value = -1
  emit('visible-change', false)
}

const selectOption = (option: DropdownOption) => {
  if (option.disabled) return

  let newValue
  
  if (props.multiple) {
    const currentValue = Array.isArray(props.modelValue) ? props.modelValue : []
    if (currentValue.includes(option.value)) {
      newValue = currentValue.filter(v => v !== option.value)
    } else {
      newValue = [...currentValue, option.value]
    }
  } else {
    newValue = option.value
    close()
  }

  emit('update:modelValue', newValue)
  emit('change', newValue, option)
  emit('select', option.value, option)
}

const handleTriggerKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return

  switch (event.key) {
    case 'Enter':
    case ' ':
    case 'ArrowDown':
      event.preventDefault()
      open()
      break
    case 'ArrowUp':
      event.preventDefault()
      open()
      break
  }
}

const handleMenuKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'Escape':
      close()
      break
    case 'ArrowDown':
      event.preventDefault()
      highlightNext()
      break
    case 'ArrowUp':
      event.preventDefault()
      highlightPrev()
      break
    case 'Enter':
      event.preventDefault()
      if (highlightedIndex.value >= 0 && highlightedIndex.value < props.options.length) {
        selectOption(props.options[highlightedIndex.value])
      }
      break
  }
}

const highlightNext = () => {
  const nextIndex = highlightedIndex.value + 1
  if (nextIndex < props.options.length) {
    highlightedIndex.value = nextIndex
  } else {
    highlightedIndex.value = 0
  }
}

const highlightPrev = () => {
  const prevIndex = highlightedIndex.value - 1
  if (prevIndex >= 0) {
    highlightedIndex.value = prevIndex
  } else {
    highlightedIndex.value = props.options.length - 1
  }
}

const updateMenuPosition = () => {
  if (!dropdownRef.value || !menuRef.value) return

  const trigger = dropdownRef.value
  const menu = menuRef.value
  const triggerRect = trigger.getBoundingClientRect()
  const menuRect = menu.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  let top = triggerRect.bottom + window.scrollY
  let left = triggerRect.left + window.scrollX

  // 检查是否超出视口底部
  if (triggerRect.bottom + menuRect.height > viewportHeight) {
    if (triggerRect.top - menuRect.height > 0) {
      top = triggerRect.top + window.scrollY - menuRect.height
    }
  }

  // 检查是否超出视口右侧
  if (triggerRect.left + menuRect.width > viewportWidth) {
    left = triggerRect.right + window.scrollX - menuRect.width
  }

  menuPosition.value = {
    position: 'absolute',
    top: `${top}px`,
    left: `${left}px`,
    minWidth: `${triggerRect.width}px`,
    maxHeight: props.maxHeight,
    zIndex: 1000
  }
}

const handleClickOutside = (event: Event) => {
  if (!dropdownRef.value || !menuRef.value) return
  
  const target = event.target as Node
  if (!dropdownRef.value.contains(target) && !menuRef.value.contains(target)) {
    close()
  }
}

watch(visible, (newVisible) => {
  if (newVisible) {
    document.addEventListener('click', handleClickOutside)
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition)
  } else {
    document.removeEventListener('click', handleClickOutside)
    window.removeEventListener('resize', updateMenuPosition)
    window.removeEventListener('scroll', updateMenuPosition)
  }
})

onMounted(() => {
  if (visible.value) {
    updateMenuPosition()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', updateMenuPosition)
  window.removeEventListener('scroll', updateMenuPosition)
})

defineExpose({
  open,
  close,
  toggle
})
</script> 