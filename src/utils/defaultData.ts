import type { StorageManager } from './storage';
import { presetCategories } from './presets';

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

  } catch (error) {
    console.error('Failed to initialize default data:', error)
  }
}
