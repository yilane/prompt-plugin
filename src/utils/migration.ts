import type { StorageManager } from './storage'

/**
 * One-time migration script to update prompt categories from names to IDs.
 * This script checks for a flag in storage to prevent re-running.
 * It fetches all categories and prompts, creates a name-to-ID map for categories,
 * and then iterates through prompts, updating any that use a name for the category field.
 * @param storage The storage manager instance.
 */
export async function runCategoryMigration(storage: StorageManager) {
  try {
    const settings = await storage.getSettings()
    if (settings.categoryMigrationV1Done) {
      // console.log('Category migration has already been completed. Skipping.')
      return
    }

    console.log('Running category migration...')

    const [allCategories, allPrompts] = await Promise.all([
      storage.getAllCategories(),
      storage.getAllPrompts()
    ])

    if (allCategories.length === 0 || allPrompts.length === 0) {
      console.log('No categories or prompts to migrate. Marking as complete.')
      await storage.saveSettings({ ...settings, categoryMigrationV1Done: true })
      return
    }

    const categoryNameToIdMap = new Map<string, string>()
    allCategories.forEach(cat => {
      categoryNameToIdMap.set(cat.name, cat.id)
    })

    const promptsToUpdate = []

    for (const prompt of allPrompts) {
      // Check if the category is a name that exists in our map
      if (categoryNameToIdMap.has(prompt.category)) {
        const correctId = categoryNameToIdMap.get(prompt.category)
        if (correctId && prompt.category !== correctId) {
          console.log(`Migrating prompt "${prompt.title}": category "${prompt.category}" -> "${correctId}"`)
          prompt.category = correctId
          promptsToUpdate.push(storage.savePrompt(prompt))
        }
      }
    }

    if (promptsToUpdate.length > 0) {
      await Promise.all(promptsToUpdate)
      console.log(`Successfully migrated ${promptsToUpdate.length} prompts.`)
    } else {
      console.log('No prompts needed migration.')
    }

    // Mark migration as complete
    await storage.saveSettings({ ...settings, categoryMigrationV1Done: true })
    console.log('Category migration finished and marked as complete.')

  } catch (error) {
    console.error('An error occurred during category migration:', error)
  }
}
