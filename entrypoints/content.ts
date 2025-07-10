import { defineContentScript } from 'wxt/utils/define-content-script'
// 这是正确的导入路径
import { createIntegratedUi } from 'wxt/utils/content-script-ui/integrated'
import { createApp, type App as VueApp } from 'vue'
import PromptInjector from '../src/components/content/PromptInjector.vue'
import { storage } from '../src/utils/storage'
import { browser } from 'wxt/browser'

export default defineContentScript({
  matches: [
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
    'https://chat.deepseek.com/*',
    'https://www.doubao.com/*',
  ],

  async main(ctx) {
    let targetTextarea: HTMLTextAreaElement | null = null
    let vueInstance: any = null
    let TRIGGERS: string[] = []
    let activeTrigger: string | null = null

    const updateTriggers = async () => {
      const settings = await storage.getSettings()
      TRIGGERS = settings.triggerSequences.filter(s => s.enabled).map(s => s.value)
      console.log('AI-Prompts: Loaded triggers:', TRIGGERS)
    }

    await updateTriggers()

    browser.runtime.onMessage.addListener(async (message) => {
      if (message.type === 'UPDATE_SETTINGS') {
        console.log('AI-Prompts: Settings updated, reloading triggers.')
        await updateTriggers()

      }
    })

    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      onMount: (container) => {
        const app = createApp(PromptInjector, {
          onSelect: (content: string) => {
            if (targetTextarea && activeTrigger) {
              const currentValue = targetTextarea.value
              const triggerIndex = currentValue.lastIndexOf(activeTrigger)
              if (triggerIndex !== -1) {
                targetTextarea.value =
                  currentValue.substring(0, triggerIndex) + content
                targetTextarea.dispatchEvent(
                  new Event('input', { bubbles: true }),
                )
                targetTextarea.focus()
              }
            }
          },
        })
        vueInstance = app.mount(container)
        return app
      },
      onRemove: (app: VueApp | undefined) => {
        app?.unmount()
      },
    })

    const showUi = () => {
      if (!vueInstance || !targetTextarea) return
      const rect = targetTextarea.getBoundingClientRect()
      vueInstance.show(rect)
    }

    const hideUi = () => {
      if (vueInstance) vueInstance.hide()
      activeTrigger = null
    }

    const handleInput = (event: Event) => {
      const target = event.target as HTMLTextAreaElement
      const currentTrigger = TRIGGERS.find((t) => target.value.endsWith(t))

      if (currentTrigger) {
        activeTrigger = currentTrigger
        showUi()
      } else {
        hideUi()
      }
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideUi()
      }
    }

    const findAndSetupTextarea = () => {
      const selector =
        'textarea[id*="prompt"], textarea[placeholder*="Message"], textarea[placeholder*="Send a message"]'
      const textarea = document.querySelector<HTMLTextAreaElement>(selector)

      if (textarea && !textarea.dataset.promptListenerAttached) {
        console.log('AI-Prompts: Textarea found, attaching listener.')
        targetTextarea = textarea
        textarea.dataset.promptListenerAttached = 'true'
        textarea.addEventListener('input', handleInput)
        textarea.addEventListener('keydown', handleKeydown)
        textarea.addEventListener('blur', hideUi)

        const observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (Array.from(mutation.removedNodes).includes(textarea)) {
              console.log('AI-Prompts: Textarea removed, cleaning up.')
              targetTextarea = null
              observer.disconnect()
              break
            }
          }
        })
        observer.observe(textarea.parentElement!, { childList: true })
      }
    }

    const observer = new MutationObserver(() => {
      if (!targetTextarea) {
        findAndSetupTextarea()
      }
    })

    ui.mount()

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  },
})
