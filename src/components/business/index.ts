/**
 * @typedef {object} PromptCardProps
 * @property {import('../../types').Prompt} prompt
 */

/**
 * @typedef {object} CategorySelectorProps
 * @property {import('../../types').Category[]} categories
 * @property {string | null} modelValue
 */

/**
 * @typedef {object} PromptListProps
 * @property {import('../../types').Prompt[]} prompts
 * @property {import('../../types').Category[]} categories
 */

/**
 * @typedef {object} PromptEditorProps
 * @property {boolean} visible
 * @property {import('../../types').Prompt | null} prompt
 * @property {import('../../types').Category[]} categories
 */

export { default as PromptCard } from './PromptCard.vue'
export { default as CategorySelector } from './CategorySelector.vue'
export { default as PromptEditor } from './PromptEditor.vue' 