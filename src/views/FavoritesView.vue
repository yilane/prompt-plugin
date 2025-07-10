<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, toRaw } from 'vue'
import { storage } from '../utils/storage'
import type { Prompt } from '../types'
import eventBus from '../utils/eventBus'
import PromptCard from '../components/business/PromptCard.vue'
import Modal from '../components/ui/Modal.vue'
import PromptEditor from '../components/business/PromptEditor.vue'

const allPrompts = ref<Prompt[]>([])
const isLoading = ref(true)
const isEditorOpen = ref(false)
const editingPrompt = ref<Prompt | null>(null)

// Filtered list for favorites
const favoritePrompts = computed(() => allPrompts.value.filter(p => p.isFavorite))

const handleFavoriteUpdate = ({ id, isFavorite }: { id: string, isFavorite: boolean }) => {
  allPrompts.value = allPrompts.value.map(p => {
    if (p.id === id) {
      return { ...p, isFavorite };
    }
    return p;
  });
};

onMounted(async () => {
  try {
    await storage.init()
    allPrompts.value = await storage.getAllPrompts()
  } catch (error) {
    console.error('Failed to load prompts:', error)
  } finally {
    isLoading.value = false
  }
  eventBus.on('favorite:toggle', handleFavoriteUpdate);
})

onUnmounted(() => {
  eventBus.off('favorite:toggle', handleFavoriteUpdate);
});

// --- Logic copied and adapted from HomeView ---

const openEditEditor = (prompt: Prompt) => {
  editingPrompt.value = prompt
  isEditorOpen.value = true
}

const handleCancel = () => {
  isEditorOpen.value = false
  editingPrompt.value = null
}

const handleSavePrompt = async (promptData: Partial<Prompt>) => {
  try {
    const promptToSave = { ...editingPrompt.value, ...promptData, updateTime: new Date().toISOString() } as Prompt
    await storage.savePrompt(promptToSave)
    const index = allPrompts.value.findIndex(p => p.id === promptToSave.id)
    if (index !== -1) {
      allPrompts.value[index] = promptToSave
    }
  } catch (error) {
    console.error('Failed to save prompt:', error)
  } finally {
    handleCancel()
  }
}

const handleDeletePrompt = async (promptId: string) => {
  if (window.confirm('您确定要删除这个提示词吗？此操作无法撤销。')) {
    try {
      await storage.deletePrompt(promptId)
      allPrompts.value = allPrompts.value.filter(p => p.id !== promptId)
    } catch (error) {
      console.error('Failed to delete prompt:', error)
    }
  }
}

const handleToggleFavorite = async (prompt: Prompt) => {
  const newIsFavorite = !prompt.isFavorite;

  // Step 1: Immediately update the local state.
  // This will instantly remove the item from the favorites view.
  allPrompts.value = allPrompts.value.map(p =>
    p.id === prompt.id ? { ...p, isFavorite: newIsFavorite } : p
  );

  try {
    // Step 2 & 3: Persist the change and then notify other components.
    const rawPrompt = toRaw(prompt);
    const updatedPromptForStorage = { ...rawPrompt, isFavorite: newIsFavorite };

    await storage.savePrompt(updatedPromptForStorage);
    eventBus.emit('favorite:toggle', { id: updatedPromptForStorage.id, isFavorite: updatedPromptForStorage.isFavorite });

  } catch (error) {
    console.error('Failed to update favorite status:', error);
    // On error, revert the UI change to maintain consistency.
    allPrompts.value = allPrompts.value.map(p =>
      p.id === prompt.id ? { ...p, isFavorite: !newIsFavorite } : p
    );
  }
}
</script>

<template>
  <div class="p-4 sm:p-6">
    <div class="mb-5 pb-4 border-b border-light-border dark:border-dark-border">
      <h3 class="text-lg font-semibold text-text-main dark:text-dark-text-main">我的收藏</h3>
      <p class="text-sm text-text-muted dark:text-dark-text-muted mt-1">您收藏的所有提示词都会显示在这里。</p>
    </div>

    <div v-if="isLoading" class="text-center py-10">
      <p>正在加载...</p>
    </div>

    <div v-else-if="favoritePrompts.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      <PromptCard
        v-for="prompt in favoritePrompts"
        :key="prompt.id"
        :prompt="prompt"
        @edit="openEditEditor"
        @delete="handleDeletePrompt"
        @toggle-favorite="handleToggleFavorite"
      />
    </div>

    <div v-else class="text-center py-16 px-4 rounded-lg bg-light-bg dark:bg-dark-surface">
      <h3 class="text-lg font-semibold text-text-main dark:text-dark-text-main">暂无收藏</h3>
      <p class="text-text-muted dark:text-dark-text-muted mt-2">您还没有收藏任何提示词。</p>
    </div>

    <Modal :is-open="isEditorOpen" @close="handleCancel">
      <PromptEditor :prompt="editingPrompt" @save="handleSavePrompt" @cancel="handleCancel" />
    </Modal>
  </div>
</template>
