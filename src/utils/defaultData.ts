import type { StorageManager } from './storage';
import { presetCategories, presetPrompts } from './presets';

/**
 * Idempotent function to initialize default data.
 * It ensures that preset categories and prompts are present in the database
 * without affecting existing user data.
 * @param storage The storage manager instance.
 */
export async function initDefaultData(storage: StorageManager) {
  try {
    // --- Initialize Categories ---
    const existingCategories = await storage.getAllCategories()
    const existingCategoryIds = new Set(existingCategories.map(c => c.id))
    const categoriesToAdd = presetCategories.filter(pc => !existingCategoryIds.has(pc.id))

    if (categoriesToAdd.length > 0) {
      console.log(`Adding ${categoriesToAdd.length} missing preset categories...`)
      await Promise.all(categoriesToAdd.map(cat => storage.saveCategory(cat)))
    }

    // --- Initialize Prompts ---
    const existingPrompts = await storage.getAllPrompts()
    const existingPromptIds = new Set(existingPrompts.map(p => p.id))
    const promptsToAdd = presetPrompts.filter(pp => !existingPromptIds.has(pp.id))

    if (promptsToAdd.length > 0) {
      console.log(`Adding ${promptsToAdd.length} missing preset prompts...`)
      await Promise.all(promptsToAdd.map(p => storage.savePrompt(p)))
    }

  } catch (error) {
    console.error('Failed to initialize default data:', error)
  }
}
