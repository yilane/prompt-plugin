<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="search-box-wrapper">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
    <input
      type="text"
      :value="modelValue"
      @input="onInput"
      :placeholder="placeholder || '搜索...'"
      class="search-input"
    />
  </div>
</template>

<style scoped>
.search-box-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 1.5rem;
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: #adb5bd;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  color: #495057;
  background-color: #fff;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.search-input:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
</style> 