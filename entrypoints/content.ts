import { defineContentScript } from 'wxt/utils/define-content-script'
// 这是正确的导入路径
import { createIntegratedUi } from 'wxt/utils/content-script-ui/integrated'
import { createApp, type App as VueApp } from 'vue'
import PromptInjector from '../src/components/content/PromptInjector.vue'
import { storage } from '../src/utils/storage'
import { browser } from 'wxt/browser'
import { platformDetector, type PlatformConfig } from '../src/utils/platformDetection'
import { browserCompatibility } from '../src/utils/browserCompatibility'

export default defineContentScript({
  matches: [
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
    'https://bard.google.com/*',
    'https://chat.deepseek.com/*',
    'https://www.doubao.com/*',
    'https://chatgpt.com/*',
    'https://ai.google.dev/*',
    'https://makersuite.google.com/*',
  ],

  async main(ctx) {
    let targetTextarea: HTMLElement | null = null
    let vueInstance: any = null
    let TRIGGERS: string[] = []
    let activeTrigger: string | null = null
    let isPopupVisible = false
    let currentPlatform: PlatformConfig | null = null

    // 初始化兼容性检测
    browserCompatibility.logCompatibilityInfo()
    
    // 检测当前平台
    const initializePlatform = () => {
      currentPlatform = platformDetector.detectPlatform()
      console.log('AI-Prompts: Initialized for platform:', currentPlatform.name)
      
      // 豆包平台特殊处理：避免React冲突
      if (currentPlatform.name === '豆包') {
        console.log('AI-Prompts: Applying React compatibility mode for Doubao platform')
        
        // 延迟初始化，等React应用完全加载
        setTimeout(() => {
          findAndSetupTextarea()
        }, 2000)
        
        // 添加错误处理，防止React错误影响扩展
        window.addEventListener('error', (event) => {
          if (event.message && event.message.includes('Minified React error')) {
            console.warn('AI-Prompts: React error detected, but extension continues to work:', event.message)
            event.stopPropagation()
            // 不阻止默认行为，让React自己处理
          }
        }, true)
      }
      
      // 平台检测回调
      platformDetector.onPlatformDetected((platform) => {
        console.log('AI-Prompts: Platform detected/changed:', platform.name)
        currentPlatform = platform
        // 重新查找输入元素
        if (platform.name !== '豆包') {
          findAndSetupTextarea()
        }
      })
    }

    initializePlatform()

    const updateTriggers = async () => {
      const settings = await storage.getSettings()
      console.log('AI-Prompts: Full settings object:', settings)
      console.log('AI-Prompts: TriggerSequences array:', settings.triggerSequences)
      TRIGGERS = settings.triggerSequences.filter(s => s.enabled).map(s => s.value)
      console.log('AI-Prompts: Loaded triggers:', TRIGGERS)
    }

    await updateTriggers()

    // Enhanced prompt insertion with platform-specific handling
    const insertPromptWithCursorHandling = (element: HTMLElement, content: string, trigger: string) => {
      console.log('AI-Prompts: insertPromptWithCursorHandling called', { 
        content: content.substring(0, 50) + '...', 
        trigger, 
        elementType: element.tagName, 
        platform: currentPlatform?.name,
        elementValue: element.tagName === 'TEXTAREA' ? (element as HTMLTextAreaElement).value.substring(0, 50) + '...' : 'N/A'
      })
      
      if (!currentPlatform) {
        console.error('AI-Prompts: No platform detected for insertion')
        return
      }

      // 豆包平台特殊处理：先验证和准备元素
      if (currentPlatform.name === '豆包') {
        console.log('AI-Prompts: Preparing Doubao platform insertion...')
        
        // 确保元素仍然可用和有效
        if (!document.contains(element)) {
          console.error('AI-Prompts: Target element is no longer in DOM')
          return
        }
        
        // 记录插入前的状态
        const beforeValue = (element as HTMLTextAreaElement).value;
        console.log('AI-Prompts: Before insertion - value:', beforeValue)
        console.log('AI-Prompts: Looking for trigger:', trigger)
        
        // 对于豆包平台，如果触发序列不存在，这是正常的（可能已被React清理）
        // 我们直接使用平台检测器的逻辑，不需要额外的fallback
        if (!beforeValue.includes(trigger)) {
          console.log('AI-Prompts: Trigger not found - this is normal for Doubao platform after React updates')
          // 不执行fallback，让平台检测器处理
        }
      }

      // 使用平台检测器执行插入
      const success = platformDetector.insertContent(element, content, trigger, currentPlatform)
      
      if (success) {
        console.log('AI-Prompts: Platform insertion reported success')
        
        // 验证插入结果
        setTimeout(() => {
          const afterValue = (element as HTMLTextAreaElement).value;
          console.log('AI-Prompts: After insertion - value:', afterValue.substring(0, 100) + '...')
          
          if (afterValue.includes(content)) {
            console.log('AI-Prompts: ✅ Content insertion verified successfully')
          } else {
            console.warn('AI-Prompts: ⚠️ Content not found in textarea after insertion')
          }
        }, 200)
        
        // 处理模板变量（如果平台支持）
        if (currentPlatform.supportedFeatures.templateVariables) {
          const templateVariables = findTemplateVariables(content)
          if (templateVariables.length > 0 && element.tagName === 'TEXTAREA') {
            enableTemplateVariableNavigation(element as HTMLTextAreaElement, templateVariables, 0)
          }
        }
      } else {
        console.error('AI-Prompts: Platform insertion failed, trying fallback')
        // 使用原来的方法作为fallback
        insertPromptFallback(element, content, trigger)
      }
    }

    // Fallback insertion method
    const insertPromptFallback = (element: HTMLElement, content: string, trigger: string) => {
      if (element.tagName === 'TEXTAREA') {
        const textarea = element as HTMLTextAreaElement
        const currentValue = textarea.value
        const triggerIndex = currentValue.lastIndexOf(trigger)
        
        if (triggerIndex === -1) return
        
        const beforeTrigger = currentValue.substring(0, triggerIndex)
        const afterTrigger = currentValue.substring(triggerIndex + trigger.length)
        const newValue = beforeTrigger + content + afterTrigger
        
        textarea.value = newValue
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
        textarea.dispatchEvent(new Event('change', { bubbles: true }))
        
        const cursorPosition = beforeTrigger.length + content.length
        textarea.focus()
        textarea.setSelectionRange(cursorPosition, cursorPosition)
        
      } else if (element.tagName === 'DIV' && element.getAttribute('contenteditable') === 'true') {
        const div = element as HTMLDivElement
        const currentText = div.textContent || ''
        const triggerIndex = currentText.lastIndexOf(trigger)
        
        if (triggerIndex === -1) return
        
        const beforeTrigger = currentText.substring(0, triggerIndex)
        const afterTrigger = currentText.substring(triggerIndex + trigger.length)
        const newText = beforeTrigger + content + afterTrigger
        
        div.textContent = newText
        div.dispatchEvent(new Event('input', { bubbles: true }))
        div.dispatchEvent(new Event('change', { bubbles: true }))
        
        div.focus()
      }
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
        // 为豆包平台添加特殊的容器样式，避免与React冲突
        if (currentPlatform?.name === '豆包') {
          container.style.cssText += `
            z-index: 999999 !important;
            position: fixed !important;
            pointer-events: auto !important;
            isolation: isolate !important;
          `
          // 添加数据属性标识，避免React组件检测
          container.setAttribute('data-ai-prompts-container', 'true')
          container.setAttribute('data-react-ignore', 'true')
        }
        
        const app = createApp(PromptInjector, {
          onSelect: async (content: string, promptId?: string) => {
            console.log('AI-Prompts: onSelect callback received content:', content)
            console.log('AI-Prompts: targetTextarea:', !!targetTextarea)
            console.log('AI-Prompts: activeTrigger:', activeTrigger)
            
            // 更新使用统计
            if (promptId) {
              try {
                await storage.updateUsageStats(promptId)
                console.log('AI-Prompts: Usage stats updated for prompt:', promptId)
              } catch (error) {
                console.error('AI-Prompts: Failed to update usage stats:', error)
              }
            }
            
            if (targetTextarea && activeTrigger) {
              console.log('AI-Prompts: Calling insertPromptWithCursorHandling')
              
              // 豆包平台特殊处理：延迟插入避免React冲突
              if (currentPlatform?.name === '豆包') {
                setTimeout(() => {
                  insertPromptWithCursorHandling(targetTextarea, content, activeTrigger)
                }, 100)
              } else {
                insertPromptWithCursorHandling(targetTextarea, content, activeTrigger)
              }
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
        // 安全卸载，避免React冲突
        try {
          app?.unmount()
        } catch (error) {
          console.warn('AI-Prompts: Error during app unmount:', error)
        }
      },
    })

    const showUi = () => {
      console.log('AI-Prompts: showUi() called')
      console.log('AI-Prompts: vueInstance exists:', !!vueInstance)
      console.log('AI-Prompts: targetTextarea exists:', !!targetTextarea)
      console.log('AI-Prompts: currentPlatform:', currentPlatform?.name)
      
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
      const target = event.target as HTMLElement
      const textContent = getElementText(target)
      console.log('AI-Prompts: Input event detected, current value:', textContent)
      console.log('AI-Prompts: Available triggers:', TRIGGERS)
      
      const currentTrigger = TRIGGERS.find((t) => textContent.endsWith(t))
      console.log('AI-Prompts: Found trigger:', currentTrigger)

      if (currentTrigger) {
        console.log('AI-Prompts: Trigger matched, showing UI')
        activeTrigger = currentTrigger
        showUi()
      } else {
        hideUi()
      }
    }

    // 获取元素文本内容的统一方法
    const getElementText = (element: HTMLElement): string => {
      if (element.tagName === 'TEXTAREA') {
        return (element as HTMLTextAreaElement).value
      } else if (element.getAttribute('contenteditable') === 'true') {
        return element.textContent || ''
      } else if (element.tagName === 'INPUT') {
        return (element as HTMLInputElement).value
      }
      return ''
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
        showUi()
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
      console.log('AI-Prompts: Looking for text input elements with platform detection...')
      
      if (!currentPlatform) {
        console.warn('AI-Prompts: No platform detected, using generic detection')
        currentPlatform = platformDetector.detectPlatform()
      }

      // 使用平台检测器查找输入元素
      const element = platformDetector.findTextInputElement(currentPlatform)
      
      if (element && !element.dataset.promptListenerAttached) {
        console.log('AI-Prompts: Text input element found using platform detection:', {
          tagName: element.tagName,
          id: element.id,
          className: element.className,
          platform: currentPlatform.name
        })
        
        targetTextarea = element
        element.dataset.promptListenerAttached = 'true'
        
        // 豆包平台特殊处理：使用更安全的事件监听
        if (currentPlatform.name === '豆包') {
          console.log('AI-Prompts: Setting up Doubao-compatible event listeners')
          
          // 使用捕获阶段避免React事件冲突
          const safeInputHandler = (event: Event) => {
            try {
              // 防止事件冒泡到React
              event.stopImmediatePropagation()
              handleInput(event)
            } catch (error) {
              console.warn('AI-Prompts: Input handler error:', error)
            }
          }
          
          const safeKeyHandler = (event: KeyboardEvent) => {
            try {
              // 只处理ESC键，避免影响其他按键
              if (event.key === 'Escape') {
                event.stopImmediatePropagation()
                handleKeydown(event)
              }
            } catch (error) {
              console.warn('AI-Prompts: Key handler error:', error)
            }
          }
          
          element.addEventListener('input', safeInputHandler, { capture: true, passive: true })
          element.addEventListener('keydown', safeKeyHandler, { capture: true, passive: true })
        } else {
          // 其他平台使用标准事件监听器
          element.addEventListener('input', handleInput)
          element.addEventListener('keydown', handleKeydown)
        }
        
        // 使用兼容的观察器
        const observer = browserCompatibility.createMutationObserver((mutations) => {
          for (const mutation of mutations) {
            if (Array.from(mutation.removedNodes).includes(element)) {
              console.log('AI-Prompts: Input element removed, cleaning up.')
              targetTextarea = null
              observer?.disconnect()
              break
            }
          }
        })
        
        if (observer && element.parentElement) {
          observer.observe(element.parentElement, { childList: true })
        }
        
        console.log('AI-Prompts: Successfully set up input element for platform:', currentPlatform.name)
      } else if (!element) {
        console.log('AI-Prompts: No suitable input element found for platform:', currentPlatform?.name)
        // 尝试通用检测作为fallback
        findAndSetupTextareaFallback()
      }
    }

    // Fallback方法，使用原来的逻辑
    const findAndSetupTextareaFallback = () => {
      console.log('AI-Prompts: Using fallback element detection...')
      
      const selectors = [
        'textarea[id*="prompt"]',
        'textarea[placeholder*="Message"]', 
        'textarea[placeholder*="Send a message"]',
        'textarea[placeholder*="Type a message"]',
        'textarea[placeholder*="Enter your prompt"]',
        'textarea[data-id*="prompt"]',
        'textarea[name*="prompt"]',
        'textarea[name*="message"]',
        'textarea:not([readonly]):not([disabled])',
        'div[contenteditable="true"]',
        'input[type="text"]:not([readonly]):not([disabled])'
      ]
      
      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector) as HTMLElement
          if (element && !element.dataset.promptListenerAttached) {
            console.log('AI-Prompts: Found element with fallback selector:', selector)
            targetTextarea = element
            element.dataset.promptListenerAttached = 'true'
            element.addEventListener('input', handleInput)
            element.addEventListener('keydown', handleKeydown)
            return
          }
        } catch (error) {
          console.warn('AI-Prompts: Invalid fallback selector:', selector, error)
        }
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
