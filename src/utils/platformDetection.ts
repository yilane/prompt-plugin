/**
 * AI平台检测和适配器
 * 支持多个AI聊天平台的自动检测和适配
 */

export interface PlatformConfig {
  name: string;
  domain: string;
  textareaSelectors: string[];
  insertMethod: 'value' | 'textContent' | 'innerHTML';
  triggerPosition: 'end' | 'cursor' | 'selection';
  supportedFeatures: {
    templateVariables: boolean;
    multiline: boolean;
    richText: boolean;
    fileUpload: boolean;
  };
  customHandlers?: {
    beforeInsert?: (element: Element, content: string) => void;
    afterInsert?: (element: Element, content: string) => void;
    specialKeyHandling?: (event: KeyboardEvent, element: Element) => boolean;
  };
}

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  chatgpt: {
    name: 'ChatGPT',
    domain: 'chat.openai.com',
    textareaSelectors: [
      '#prompt-textarea',
      'textarea[id*="prompt"]',
      'textarea[placeholder*="Message ChatGPT"]',
      'textarea[placeholder*="Send a message"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]:not([role]):last-of-type'
    ],
    insertMethod: 'textContent',
    triggerPosition: 'end',
    supportedFeatures: {
      templateVariables: true,
      multiline: true,
      richText: false,
      fileUpload: true
    },
    customHandlers: {
      afterInsert: (element: Element, content: string) => {
        // ChatGPT特殊处理：触发React的onChange事件
        const event = new InputEvent('input', { 
          bubbles: true, 
          cancelable: true,
          inputType: 'insertText',
          data: content
        });
        element.dispatchEvent(event);
        
        // 额外触发composition事件
        element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
        element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      }
    }
  },

  claude: {
    name: 'Claude',
    domain: 'claude.ai',
    textareaSelectors: [
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]:not([role])',
      'textarea[placeholder*="Talk to Claude"]',
      'textarea[placeholder*="Type a message"]',
      '.ProseMirror',
      '[data-testid="chat-input"]'
    ],
    insertMethod: 'textContent',
    triggerPosition: 'end',
    supportedFeatures: {
      templateVariables: true,
      multiline: true,
      richText: true,
      fileUpload: true
    },
    customHandlers: {
      beforeInsert: (element: Element) => {
        // Claude可能有特殊的编辑器状态，需要先focus
        if (element instanceof HTMLElement) {
          element.focus();
        }
      },
      afterInsert: (element: Element, content: string) => {
        // 触发Claude的输入事件
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: content
        });
        element.dispatchEvent(inputEvent);
        
        // 触发blur再focus来确保状态更新
        if (element instanceof HTMLElement) {
          element.blur();
          setTimeout(() => element.focus(), 10);
        }
      }
    }
  },

  gemini: {
    name: 'Gemini',
    domain: 'gemini.google.com',
    textareaSelectors: [
      'div[contenteditable="true"][role="textbox"]',
      'textarea[placeholder*="Enter a prompt here"]',
      'textarea[aria-label*="Message"]',
      '.ql-editor',
      '[data-testid="input-area"]'
    ],
    insertMethod: 'textContent',
    triggerPosition: 'end',
    supportedFeatures: {
      templateVariables: true,
      multiline: true,
      richText: true,
      fileUpload: true
    },
    customHandlers: {
      afterInsert: (element: Element) => {
        // Google产品通常需要特殊的事件触发
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        element.dispatchEvent(new Event('focus', { bubbles: true }));
      }
    }
  },

  deepseek: {
    name: 'DeepSeek',
    domain: 'chat.deepseek.com',
    textareaSelectors: [
      'textarea[placeholder*="请输入您的问题"]',
      'textarea[placeholder*="Send a message"]',
      'div[contenteditable="true"]',
      'textarea:not([readonly]):not([disabled])'
    ],
    insertMethod: 'value',
    triggerPosition: 'end',
    supportedFeatures: {
      templateVariables: true,
      multiline: true,
      richText: false,
      fileUpload: false
    }
  },

  doubao: {
    name: '豆包',
    domain: 'www.doubao.com',
    textareaSelectors: [
      'textarea[placeholder*="请输入内容"]',
      'textarea[placeholder*="输入消息"]',
      'div[contenteditable="true"]',
      'textarea:not([readonly]):not([disabled])'
    ],
    insertMethod: 'value',
    triggerPosition: 'end',
    supportedFeatures: {
      templateVariables: true,
      multiline: true,
      richText: false,
      fileUpload: false
    },
    customHandlers: {
      beforeInsert: (element: Element) => {
        // 豆包平台特殊处理：确保元素处于正确状态
        if (element instanceof HTMLElement) {
          element.focus();
        }
      },
      afterInsert: (element: Element, content: string) => {
        // 豆包平台的React兼容处理
        console.log('AI-Prompts: Doubao afterInsert handler called', {
          element: element.tagName,
          content: content.substring(0, 50) + '...'
        });
        
        try {
          // 等待一个微任务周期，确保DOM更新完成
          Promise.resolve().then(() => {
            // 强制触发React重新渲染
            const textarea = element as HTMLTextAreaElement;
            
            // 模拟用户输入事件序列
            const events = [
              new Event('focus', { bubbles: true }),
              new CompositionEvent('compositionstart', { bubbles: true }),
              new InputEvent('input', { 
                bubbles: true, 
                cancelable: true,
                inputType: 'insertText',
                data: content
              }),
              new CompositionEvent('compositionend', { bubbles: true }),
              new Event('change', { bubbles: true })
            ];
            
            // 按顺序触发事件
            events.forEach((event, index) => {
              setTimeout(() => {
                console.log(`AI-Prompts: Triggering ${event.type} event`);
                element.dispatchEvent(event);
              }, index * 10);
            });
            
            // 最后确保焦点和光标位置
            setTimeout(() => {
              if (element instanceof HTMLTextAreaElement) {
                element.focus();
                const length = element.value.length;
                element.setSelectionRange(length, length);
                console.log('AI-Prompts: Final focus and cursor positioning completed');
              }
            }, 100);
          });
          
        } catch (error) {
          console.warn('AI-Prompts: Doubao platform event handling error:', error);
          // Fallback到简单事件
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }
  },

  // 通用配置，用于未知平台
  generic: {
    name: 'Generic',
    domain: '*',
    textareaSelectors: [
      'textarea:not([readonly]):not([disabled])',
      'div[contenteditable="true"]',
      'input[type="text"]:not([readonly]):not([disabled])'
    ],
    insertMethod: 'value',
    triggerPosition: 'end',
    supportedFeatures: {
      templateVariables: false,
      multiline: false,
      richText: false,
      fileUpload: false
    }
  }
};

export class PlatformDetector {
  private currentPlatform: PlatformConfig | null = null;
  private detectionCallbacks: Array<(platform: PlatformConfig) => void> = [];

  /**
   * 检测当前平台
   */
  detectPlatform(): PlatformConfig {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const url = window.location.href;

    console.log('PlatformDetector: Detecting platform for URL:', url);

    // 精确匹配已知平台
    for (const [key, config] of Object.entries(PLATFORM_CONFIGS)) {
      if (key === 'generic') continue; // 跳过通用配置
      
      if (hostname.includes(config.domain)) {
        console.log('PlatformDetector: Detected platform:', config.name);
        this.currentPlatform = config;
        this.notifyDetectionCallbacks(config);
        return config;
      }
    }

    // 基于URL模式的二次检测
    const urlPatterns: Record<string, string> = {
      'openai.com': 'chatgpt',
      'claude.ai': 'claude',
      'gemini.google.com': 'gemini',
      'bard.google.com': 'gemini', // Gemini的旧域名
      'deepseek.com': 'deepseek',
      'doubao.com': 'doubao',
      'volcengine.com': 'doubao' // 豆包的备用域名
    };

    for (const [pattern, platformKey] of Object.entries(urlPatterns)) {
      if (hostname.includes(pattern)) {
        const config = PLATFORM_CONFIGS[platformKey];
        console.log('PlatformDetector: Detected platform via pattern:', config.name);
        this.currentPlatform = config;
        this.notifyDetectionCallbacks(config);
        return config;
      }
    }

    // 使用通用配置
    console.log('PlatformDetector: Using generic platform configuration');
    this.currentPlatform = PLATFORM_CONFIGS.generic;
    this.notifyDetectionCallbacks(PLATFORM_CONFIGS.generic);
    return PLATFORM_CONFIGS.generic;
  }

  /**
   * 获取当前平台配置
   */
  getCurrentPlatform(): PlatformConfig | null {
    return this.currentPlatform || this.detectPlatform();
  }

  /**
   * 注册平台检测回调
   */
  onPlatformDetected(callback: (platform: PlatformConfig) => void): void {
    this.detectionCallbacks.push(callback);
  }

  /**
   * 通知检测回调
   */
  private notifyDetectionCallbacks(platform: PlatformConfig): void {
    this.detectionCallbacks.forEach(callback => {
      try {
        callback(platform);
      } catch (error) {
        console.error('PlatformDetector: Error in detection callback:', error);
      }
    });
  }

  /**
   * 查找平台适配的文本输入元素
   */
  findTextInputElement(platform?: PlatformConfig): HTMLElement | null {
    const config = platform || this.getCurrentPlatform();
    if (!config) return null;

    console.log('PlatformDetector: Searching for text input with selectors:', config.textareaSelectors);

    // 按优先级尝试选择器
    for (const selector of config.textareaSelectors) {
      try {
        const element = document.querySelector(selector) as HTMLElement;
        if (element && this.isValidInputElement(element)) {
          console.log('PlatformDetector: Found input element with selector:', selector);
          return element;
        }
      } catch (error) {
        console.warn('PlatformDetector: Invalid selector:', selector, error);
      }
    }

    // 如果没找到，尝试更通用的查找方法
    return this.findGenericInputElement();
  }

  /**
   * 查找通用输入元素
   */
  private findGenericInputElement(): HTMLElement | null {
    // 查找所有可能的输入元素
    const candidates = [
      ...Array.from(document.querySelectorAll('textarea:not([readonly]):not([disabled])')),
      ...Array.from(document.querySelectorAll('div[contenteditable="true"]')),
      ...Array.from(document.querySelectorAll('input[type="text"]:not([readonly]):not([disabled])'))
    ];

    // 按可见性和大小排序
    const validCandidates = candidates
      .filter(el => this.isValidInputElement(el as HTMLElement))
      .sort((a, b) => {
        const rectA = a.getBoundingClientRect();
        const rectB = b.getBoundingClientRect();
        
        // 优先选择更大、更显眼的元素
        const areaA = rectA.width * rectA.height;
        const areaB = rectB.width * rectB.height;
        
        return areaB - areaA;
      });

    return validCandidates[0] as HTMLElement || null;
  }

  /**
   * 验证元素是否为有效的输入元素
   */
  private isValidInputElement(element: HTMLElement): boolean {
    if (!element) return false;

    // 检查元素是否可见
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    // 检查元素是否被隐藏
    const styles = window.getComputedStyle(element);
    if (styles.display === 'none' || styles.visibility === 'hidden') return false;

    // 检查元素类型
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'textarea') {
      const textarea = element as HTMLTextAreaElement;
      return !textarea.readOnly && !textarea.disabled;
    }

    if (tagName === 'input') {
      const input = element as HTMLInputElement;
      return input.type === 'text' && !input.readOnly && !input.disabled;
    }

    if (tagName === 'div') {
      return element.getAttribute('contenteditable') === 'true';
    }

    return false;
  }

  /**
   * 执行平台特定的内容插入
   */
  insertContent(element: HTMLElement, content: string, trigger: string, platform?: PlatformConfig): boolean {
    const config = platform || this.getCurrentPlatform();
    if (!config) return false;

    try {
      // 执行插入前的自定义处理
      if (config.customHandlers?.beforeInsert) {
        config.customHandlers.beforeInsert(element, content);
      }

      // 根据平台配置选择插入方法
      const success = this.performContentInsertion(element, content, trigger, config);

      // 执行插入后的自定义处理
      if (success && config.customHandlers?.afterInsert) {
        config.customHandlers.afterInsert(element, content);
      }

      return success;
    } catch (error) {
      console.error('PlatformDetector: Error inserting content:', error);
      return false;
    }
  }

  /**
   * 执行实际的内容插入
   */
  private performContentInsertion(element: HTMLElement, content: string, trigger: string, config: PlatformConfig): boolean {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'textarea') {
      return this.insertIntoTextarea(element as HTMLTextAreaElement, content, trigger);
    } else if (tagName === 'div' && element.getAttribute('contenteditable') === 'true') {
      return this.insertIntoContentEditable(element, content, trigger, config);
    } else if (tagName === 'input') {
      return this.insertIntoInput(element as HTMLInputElement, content, trigger);
    }

    return false;
  }

  /**
   * 向textarea插入内容
   */
  private insertIntoTextarea(textarea: HTMLTextAreaElement, content: string, trigger: string): boolean {
    const currentValue = textarea.value;
    let triggerIndex = currentValue.lastIndexOf(trigger);
    
    console.log('AI-Prompts: insertIntoTextarea called', {
      currentValue: currentValue,
      trigger: trigger,
      triggerIndex: triggerIndex
    });
    
    // 对于React应用（如豆包），触发序列可能已被清理
    const isReactElement = textarea.hasOwnProperty('_reactInternalFiber') || 
                          textarea.hasOwnProperty('_reactInternalInstance') ||
                          textarea.hasOwnProperty('__reactInternalInstance') ||
                          Object.keys(textarea).some(key => key.startsWith('__react'));
    
    console.log('AI-Prompts: React element detection:', {
      isReactElement: isReactElement,
      reactKeys: Object.keys(textarea).filter(key => key.startsWith('__react'))
    });
    
    let beforeTrigger = '';
    let afterTrigger = '';
    let newValue = '';
    
    if (triggerIndex === -1) {
      if (isReactElement) {
        // React应用中触发序列可能已被清理，直接插入到末尾
        console.log('AI-Prompts: React app detected, trigger not found - inserting at current position');
        beforeTrigger = currentValue;
        afterTrigger = '';
        newValue = beforeTrigger + content + afterTrigger;
      } else {
        // 对于豆包平台，即使React检测失败，我们也应该智能处理
        const hostname = window.location.hostname;
        if (hostname.includes('doubao.com')) {
          console.log('AI-Prompts: Doubao platform detected, inserting content despite missing trigger');
          beforeTrigger = currentValue;
          afterTrigger = '';
          newValue = beforeTrigger + content + afterTrigger;
        } else {
          console.warn('AI-Prompts: Trigger not found in textarea value');
          return false;
        }
      }
    } else {
      beforeTrigger = currentValue.substring(0, triggerIndex);
      afterTrigger = currentValue.substring(triggerIndex + trigger.length);
      newValue = beforeTrigger + content + afterTrigger;
    }
    
    console.log('AI-Prompts: Prepared insertion', {
      beforeTrigger: beforeTrigger,
      content: content.substring(0, 50) + '...',
      afterTrigger: afterTrigger,
      newValue: newValue.substring(0, 100) + '...'
    });
    
    if (isReactElement || window.location.hostname.includes('doubao.com')) {
      console.log('AI-Prompts: Using React-compatible insertion method');
      
      // 获取React的内部属性setter
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
      
      if (nativeInputValueSetter) {
        // 使用原生setter避免React检测
        nativeInputValueSetter.call(textarea, newValue);
        console.log('AI-Prompts: Used native setter');
      } else {
        textarea.value = newValue;
        console.log('AI-Prompts: Used direct assignment');
      }
      
      // 触发React所需的事件
      const inputEvent = new Event('input', { bubbles: true });
      const changeEvent = new Event('change', { bubbles: true });
      
      console.log('AI-Prompts: Dispatching React events');
      // 手动触发React的状态更新
      textarea.dispatchEvent(inputEvent);
      textarea.dispatchEvent(changeEvent);
      
    } else {
      console.log('AI-Prompts: Using standard insertion method');
      textarea.value = newValue;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      textarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // 设置光标位置
    const cursorPosition = beforeTrigger.length + content.length;
    textarea.focus();
    
    try {
      textarea.setSelectionRange(cursorPosition, cursorPosition);
      console.log('AI-Prompts: Set cursor position to', cursorPosition);
    } catch (error) {
      console.warn('AI-Prompts: Could not set cursor position:', error);
    }
    
    console.log('AI-Prompts: Insertion completed, final value:', textarea.value.substring(0, 100) + '...');
    return true;
  }

  /**
   * 向contenteditable元素插入内容
   */
  private insertIntoContentEditable(element: HTMLElement, content: string, trigger: string, config: PlatformConfig): boolean {
    const currentText = element.textContent || '';
    const triggerIndex = currentText.lastIndexOf(trigger);
    
    if (triggerIndex === -1) return false;
    
    const beforeTrigger = currentText.substring(0, triggerIndex);
    const afterTrigger = currentText.substring(triggerIndex + trigger.length);
    const newText = beforeTrigger + content + afterTrigger;
    
    if (config.insertMethod === 'innerHTML') {
      element.innerHTML = newText;
    } else {
      element.textContent = newText;
    }
    
    // 触发事件
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // 设置光标位置
    this.setCursorPosition(element, beforeTrigger.length + content.length);
    
    return true;
  }

  /**
   * 向input元素插入内容
   */
  private insertIntoInput(input: HTMLInputElement, content: string, trigger: string): boolean {
    const currentValue = input.value;
    const triggerIndex = currentValue.lastIndexOf(trigger);
    
    if (triggerIndex === -1) return false;
    
    const beforeTrigger = currentValue.substring(0, triggerIndex);
    const afterTrigger = currentValue.substring(triggerIndex + trigger.length);
    const newValue = beforeTrigger + content + afterTrigger;
    
    input.value = newValue;
    
    // 触发事件
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    
    // 设置光标位置
    const cursorPosition = beforeTrigger.length + content.length;
    input.focus();
    input.setSelectionRange(cursorPosition, cursorPosition);
    
    return true;
  }

  /**
   * 设置contenteditable元素的光标位置
   */
  private setCursorPosition(element: HTMLElement, position: number): void {
    try {
      element.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      
      if (element.childNodes.length > 0) {
        const textNode = element.childNodes[0];
        const maxPosition = textNode.textContent?.length || 0;
        range.setStart(textNode, Math.min(position, maxPosition));
        range.setEnd(textNode, Math.min(position, maxPosition));
      } else {
        range.setStart(element, 0);
        range.setEnd(element, 0);
      }
      
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch (error) {
      console.warn('PlatformDetector: Could not set cursor position:', error);
    }
  }
}

// 导出单例实例
export const platformDetector = new PlatformDetector();