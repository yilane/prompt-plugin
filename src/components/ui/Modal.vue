<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" @close="maskClosable ? handleClose() : () => {}" class="relative z-50">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/30" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full transform rounded-2xl bg-light-surface dark:bg-dark-surface text-left align-middle shadow-xl transition-all flex flex-col"
              :class="sizeClasses[size]"
            >
              <DialogTitle
                as="h3"
                class="text-lg font-medium leading-6 text-text-main dark:text-dark-text-main p-6 border-b border-light-border dark:border-dark-border"
              >
                {{ title }}
              </DialogTitle>
              <div class="flex-grow overflow-y-auto">
                <slot />
              </div>

              <div v-if="$slots.footer" class="flex-shrink-0">
                <slot name="footer" />
              </div>

              <button
                v-if="closable"
                @click="handleClose"
                class="absolute top-4 right-4 text-text-muted dark:text-dark-text-muted hover:text-text-main dark:hover:text-dark-text-main transition-colors"
              >
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/vue'

const props = withDefaults(defineProps<{
  isOpen: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  maskClosable?: boolean
}>(), {
  size: 'md',
  closable: true,
  maskClosable: true,
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full h-full',
}
</script> 