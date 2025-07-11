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
    let targetTextarea: HTMLTextAreaElement | HTMLDivElement | null = null
    let vueInstance: any = null
    let TRIGGERS: string[] = []
    let activeTrigger: string | null = null
    let isPopupVisible = false

    const updateTriggers = async () => {
      const settings = await storage.getSettings()
      console.log('AI-Prompts: Full settings object:', settings)
      console.log('AI-Prompts: TriggerSequences array:', settings.triggerSequences)
      TRIGGERS = settings.triggerSequences.filter(s => s.enabled).map(s => s.value)
      console.log('AI-Prompts: Loaded triggers:', TRIGGERS)
    }

    await updateTriggers()

    // Enhanced prompt insertion with cursor handling and template variable support
    const insertPromptWithCursorHandling = (element: HTMLTextAreaElement | HTMLDivElement, content: string, trigger: string) => {
      console.log('AI-Prompts: Inserting prompt:', { content, trigger, elementType: element.tagName })
      
      if (element.tagName === 'TEXTAREA') {
        // 处理 textarea 元素
        const textarea = element as HTMLTextAreaElement
        const currentValue = textarea.value
        const triggerIndex = currentValue.lastIndexOf(trigger)
        
        if (triggerIndex === -1) {
          console.log('AI-Prompts: Trigger not found in textarea value')
          return
        }
        
        // Replace trigger with content
        const beforeTrigger = currentValue.substring(0, triggerIndex)
        const afterTrigger = currentValue.substring(triggerIndex + trigger.length)
        const newValue = beforeTrigger + content + afterTrigger
        
        textarea.value = newValue
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        textarea.dispatchEvent(new Event('change', { bubbles: true }))
        
        // Handle cursor positioning for template variables
        const templateVariables = findTemplateVariables(content)
        if (templateVariables.length > 0) {
          // Position cursor at the first template variable
          const firstVariable = templateVariables[0]
          const variablePosition = beforeTrigger.length + content.indexOf(firstVariable.full)
          
          // Select the content inside the brackets
          textarea.focus()
          textarea.setSelectionRange(
            variablePosition + firstVariable.full.indexOf(firstVariable.content),
            variablePosition + firstVariable.full.indexOf(firstVariable.content) + firstVariable.content.length
          )
          
          // Store template variables for post-insertion editing
          if (templateVariables.length > 1) {
            enableTemplateVariableNavigation(textarea, templateVariables, beforeTrigger.length)
          }
        } else {
          // No template variables, position cursor at the end of inserted content
          const cursorPosition = beforeTrigger.length + content.length
          textarea.focus()
          textarea.setSelectionRange(cursorPosition, cursorPosition)
        }
        
      } else if (element.tagName === 'DIV' && element.getAttribute('contenteditable') === 'true') {
        // 处理 contenteditable div 元素
        const div = element as HTMLDivElement
        const currentText = div.textContent || ''
        const triggerIndex = currentText.lastIndexOf(trigger)
        
        if (triggerIndex === -1) {
          console.log('AI-Prompts: Trigger not found in div textContent')
          return
        }
        
        // Replace trigger with content
        const beforeTrigger = currentText.substring(0, triggerIndex)
        const afterTrigger = currentText.substring(triggerIndex + trigger.length)
        const newText = beforeTrigger + content + afterTrigger
        
        div.textContent = newText
        
        // 触发输入事件
        div.dispatchEvent(new Event('input', { bubbles: true }))
        div.dispatchEvent(new Event('change', { bubbles: true }))
        
        // 设置光标位置到内容末尾
        div.focus()
        const range = document.createRange()
        const sel = window.getSelection()
        
        if (div.childNodes.length > 0) {
          const textNode = div.childNodes[0]
          const cursorPosition = beforeTrigger.length + content.length
          range.setStart(textNode, Math.min(cursorPosition, textNode.textContent?.length || 0))
          range.setEnd(textNode, Math.min(cursorPosition, textNode.textContent?.length || 0))
        } else {
          range.setStart(div, 0)
          range.setEnd(div, 0)
        }
        
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
      
      console.log('AI-Prompts: Prompt inserted successfully')
    }

    // Find template variables in content like [keyword], [context], etc.
    const findTemplateVariables = (content: string) => {
      const regex = /\[([^\]]+)\]/g
      const variables: { full: string; content: string; index: number }[] = []
      let match
      
      while ((match = regex.exec(content)) !== null) {
        variables.push({
          full: match[0],
          content: match[1],
          index: match.index
        })
      }
      
      return variables
    }

    // Enable navigation between template variables using Tab key
    const enableTemplateVariableNavigation = (element: HTMLTextAreaElement | HTMLDivElement, variables: any[], contentStartIndex: number) => {
      if (element.tagName !== 'TEXTAREA') return // 只支持 textarea 的模板变量导航
      
      const textarea = element as HTMLTextAreaElement
      let currentVariableIndex = 0
      
      const navigateToVariable = (index: number) => {
        if (index >= 0 && index < variables.length) {
          const variable = variables[index]
          const variablePosition = contentStartIndex + variable.index
          
          textarea.focus()
          textarea.setSelectionRange(
            variablePosition + variable.full.indexOf(variable.content),
            variablePosition + variable.full.indexOf(variable.content) + variable.content.length
          )
          
          currentVariableIndex = index
        }
      }
      
      const handleTemplateNavigation = (event: KeyboardEvent) => {
        if (event.key === 'Tab' && !event.shiftKey) {
          event.preventDefault()
          navigateToVariable(currentVariableIndex + 1)
        } else if (event.key === 'Tab' && event.shiftKey) {
          event.preventDefault()
          navigateToVariable(currentVariableIndex - 1)
        } else if (event.key === 'Escape') {
          textarea.removeEventListener('keydown', handleTemplateNavigation)
          const endPosition = contentStartIndex + variables[variables.length - 1].index + variables[variables.length - 1].full.length
          textarea.setSelectionRange(endPosition, endPosition)
        }
      }
      
      textarea.addEventListener('keydown', handleTemplateNavigation)
      
      // Remove listener after a timeout to prevent interference
      setTimeout(() => {
        textarea.removeEventListener('keydown', handleTemplateNavigation)
      }, 30000)
    }

    browser.runtime.onMessage.addListener(async (message) => {
      console.log('AI-Prompts: Received message in content script:', message)
      if (message.type === 'UPDATE_SETTINGS') {
        console.log('AI-Prompts: Settings updated, reloading triggers.')
        await updateTriggers()
        console.log('AI-Prompts: Triggers reloaded, new TRIGGERS array:', TRIGGERS)
      }
    })

    const ui = createIntegratedUi(ctx, {
      position: 'inline',
      onMount: (container) => {
        const app = createApp(PromptInjector, {
          onSelect: (content: string) => {
            console.log('AI-Prompts: onSelect callback received content:', content)
            console.log('AI-Prompts: targetTextarea:', !!targetTextarea)
            console.log('AI-Prompts: activeTrigger:', activeTrigger)
            
            if (targetTextarea && activeTrigger) {
              console.log('AI-Prompts: Calling insertPromptWithCursorHandling')
              insertPromptWithCursorHandling(targetTextarea, content, activeTrigger)
            } else {
              console.error('AI-Prompts: Missing targetTextarea or activeTrigger', {
                targetTextarea: !!targetTextarea,
                activeTrigger
              })
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
      console.log('AI-Prompts: showUi() called')
      if (!vueInstance || !targetTextarea) {
        console.log('AI-Prompts: Missing vueInstance or targetTextarea')
        return
      }
      
      const rect = targetTextarea.getBoundingClientRect()
      console.log('AI-Prompts: targetTextarea rect:', rect)
      
      // 确保弹窗显示在可见区域
      const adjustedRect = {
        bottom: Math.max(100, rect.bottom),
        left: Math.max(50, Math.min(rect.left, window.innerWidth - 650)), // 确保不超出屏幕
        top: rect.top,
        right: rect.right,
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
        toJSON: rect.toJSON
      } as DOMRect
      
      console.log('AI-Prompts: Adjusted rect:', adjustedRect)
      isPopupVisible = true
      vueInstance.show(adjustedRect)
    }

    const hideUi = () => {
      if (vueInstance) vueInstance.hide()
      isPopupVisible = false
      activeTrigger = null
    }

    const handleInput = (event: Event) => {
      const target = event.target as HTMLTextAreaElement
      console.log('AI-Prompts: Input event detected, current value:', target.value)
      console.log('AI-Prompts: Available triggers:', TRIGGERS)
      
      const currentTrigger = TRIGGERS.find((t) => target.value.endsWith(t))
      console.log('AI-Prompts: Found trigger:', currentTrigger)

      if (currentTrigger) {
        console.log('AI-Prompts: Trigger matched, showing UI')
        activeTrigger = currentTrigger
        showUi()
      } else {
        hideUi()
      }
    }

    const handleInputContentEditable = (event: Event) => {
      const target = event.target as HTMLDivElement
      const textContent = target.textContent || ''
      console.log('AI-Prompts: ContentEditable input event detected, current value:', textContent)
      console.log('AI-Prompts: Available triggers:', TRIGGERS)
      
      const currentTrigger = TRIGGERS.find((t) => textContent.endsWith(t))
      console.log('AI-Prompts: Found trigger:', currentTrigger)

      if (currentTrigger) {
        console.log('AI-Prompts: Trigger matched, showing UI')
        activeTrigger = currentTrigger
        // 对于contenteditable，需要特殊处理获取位置
        showUiForContentEditable(target)
      } else {
        hideUi()
      }
    }

    const showUiForContentEditable = (element: HTMLDivElement) => {
      if (!vueInstance) return
      const rect = element.getBoundingClientRect()
      vueInstance.show(rect)
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('AI-Prompts: Escape key pressed, hiding UI')
        hideUi()
      }
    }

    // 添加全局点击监听器来处理点击外部关闭
    const handleGlobalClick = (event: Event) => {
      if (!vueInstance || !isPopupVisible) return
      
      const target = event.target as HTMLElement
      const popup = document.querySelector('.ai-prompts-popup-container')
      
      // 如果点击的不是弹窗内部，则关闭弹窗
      if (popup && !popup.contains(target)) {
        console.log('AI-Prompts: Clicked outside popup, hiding UI')
        hideUi()
      }
    }

    // 暂时禁用全局监听器来测试内部点击
    // document.addEventListener('click', handleGlobalClick, true)

    const findAndSetupTextarea = () => {
      // 多种选择器策略
      const selectors = [
        'textarea[id*="prompt"]',
        'textarea[placeholder*="Message"]', 
        'textarea[placeholder*="Send a message"]',
        'textarea[placeholder*="Type a message"]',
        'textarea[placeholder*="Enter your prompt"]',
        'textarea[data-id*="prompt"]',
        'textarea[name*="prompt"]',
        'textarea[name*="message"]',
        // 更通用的选择器
        'textarea:not([readonly]):not([disabled])',
        'div[contenteditable="true"]' // 也检查contenteditable div
      ]
      
      console.log('AI-Prompts: Looking for textarea/input elements...')
      
      // 首先列出页面上所有的textarea
      const allTextareas = document.querySelectorAll('textarea')
      console.log('AI-Prompts: Found textareas on page:', allTextareas.length)
      allTextareas.forEach((ta, index) => {
        console.log(`Textarea ${index}:`, {
          id: ta.id,
          placeholder: ta.placeholder,
          name: ta.name,
          className: ta.className,
          readonly: ta.readOnly,
          disabled: ta.disabled
        })
      })
      
      // 也检查contenteditable元素
      const contentEditables = document.querySelectorAll('div[contenteditable="true"]')
      console.log('AI-Prompts: Found contenteditable divs:', contentEditables.length)
      contentEditables.forEach((div, index) => {
        console.log(`ContentEditable ${index}:`, {
          id: div.id,
          className: div.className,
          role: div.getAttribute('role'),
          ariaLabel: div.getAttribute('aria-label')
        })
      })
      
      let textarea: HTMLTextAreaElement | HTMLDivElement | null = null
      
      // 尝试各种选择器
      for (const selector of selectors) {
        console.log('AI-Prompts: Trying selector:', selector)
        const element = document.querySelector(selector) as HTMLTextAreaElement | HTMLDivElement
        if (element) {
          console.log('AI-Prompts: Found element with selector:', selector)
          textarea = element
          break
        }
      }
      
      // 如果还是没找到，就使用第一个可编辑的textarea
      if (!textarea && allTextareas.length > 0) {
        const editableTextarea = Array.from(allTextareas).find(ta => !ta.readOnly && !ta.disabled)
        if (editableTextarea) {
          console.log('AI-Prompts: Using first editable textarea as fallback')
          textarea = editableTextarea
        }
      }
      
      if (textarea && !textarea.dataset.promptListenerAttached) {
        console.log('AI-Prompts: Textarea found, attaching listener.')
        console.log('AI-Prompts: Element details:', {
          tagName: textarea.tagName,
          id: textarea.id,
          placeholder: (textarea as HTMLTextAreaElement).placeholder,
          className: textarea.className
        })
        
        targetTextarea = textarea as HTMLTextAreaElement | HTMLDivElement
        textarea.dataset.promptListenerAttached = 'true'
        
        // 根据元素类型添加不同的事件监听器
        if (textarea.tagName === 'TEXTAREA') {
          textarea.addEventListener('input', handleInput)
        } else if (textarea.tagName === 'DIV') {
          // 对于contenteditable div，监听input事件
          textarea.addEventListener('input', handleInputContentEditable)
        }
        
        textarea.addEventListener('keydown', handleKeydown)
        // 暂时移除blur事件监听，因为它可能导致弹窗意外关闭
        // textarea.addEventListener('blur', hideUi)

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
      } else if (!textarea) {
        console.log('AI-Prompts: No suitable textarea found')
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
