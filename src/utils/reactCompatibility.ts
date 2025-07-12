/**
 * React错误解码和处理工具
 * 帮助理解和处理豆包平台的React错误
 */

export const ReactErrorCodes = {
  425: {
    name: 'INVALID_HOOK_CALL',
    description: 'Hook调用无效 - 可能在组件外部调用了Hook',
    causes: [
      '在非React组件中调用Hook',
      '在条件语句中调用Hook',
      '在循环中调用Hook',
      '扩展代码与React应用冲突'
    ],
    solutions: [
      '确保Hook只在React组件内部调用',
      '避免在扩展代码中直接操作React组件',
      '使用事件委托而不是直接绑定事件'
    ]
  },
  418: {
    name: 'COMPONENT_UPDATE_AFTER_UNMOUNT',
    description: '组件卸载后尝试更新状态',
    causes: [
      '异步操作在组件卸载后完成',
      '定时器在组件卸载后触发',
      '扩展代码在组件销毁后仍然持有引用'
    ],
    solutions: [
      '在组件卸载时清理所有异步操作',
      '使用useEffect清理函数',
      '检查组件是否已挂载再更新状态'
    ]
  },
  422: {
    name: 'MEMORY_LEAK_DETECTED',
    description: '检测到内存泄漏',
    causes: [
      '事件监听器未正确移除',
      '订阅未取消',
      '对象引用未释放',
      '扩展创建的DOM节点未清理'
    ],
    solutions: [
      '确保所有事件监听器都被移除',
      '使用WeakMap/WeakSet避免强引用',
      '及时清理扩展创建的DOM元素'
    ]
  }
};

export class ReactCompatibilityHandler {
  private errorCounts: Map<number, number> = new Map();
  private maxErrorsPerCode = 5;

  /**
   * 处理React错误
   */
  handleReactError(error: Error): boolean {
    const message = error.message;
    
    // 检查是否是React错误
    const reactErrorMatch = message.match(/Minified React error #(\d+)/);
    if (!reactErrorMatch) {
      return false;
    }

    const errorCode = parseInt(reactErrorMatch[1], 10);
    const currentCount = this.errorCounts.get(errorCode) || 0;
    
    // 限制错误日志数量
    if (currentCount >= this.maxErrorsPerCode) {
      return true; // 静默处理
    }

    this.errorCounts.set(errorCode, currentCount + 1);

    const errorInfo = ReactErrorCodes[errorCode as keyof typeof ReactErrorCodes];
    
    if (errorInfo) {
      console.group(`🔥 React Error #${errorCode}: ${errorInfo.name}`);
      console.warn('Description:', errorInfo.description);
      console.log('Possible causes:', errorInfo.causes);
      console.log('Solutions:', errorInfo.solutions);
      console.log('Original error:', error);
      console.groupEnd();
    } else {
      console.warn(`Unknown React error #${errorCode}:`, error);
    }

    return true; // 表示已处理
  }

  /**
   * 创建React兼容的事件处理器
   */
  createSafeEventHandler(handler: (event: Event) => void): (event: Event) => void {
    return (event: Event) => {
      try {
        // 阻止事件传播到React应用
        event.stopImmediatePropagation();
        
        // 延迟执行，避免与React的事件处理冲突
        setTimeout(() => {
          try {
            handler(event);
          } catch (error) {
            console.warn('AI-Prompts: Event handler error:', error);
          }
        }, 0);
      } catch (error) {
        console.warn('AI-Prompts: Safe event handler error:', error);
      }
    };
  }

  /**
   * 创建React兼容的DOM操作
   */
  createSafeDOMOperation<T>(operation: () => T): Promise<T> {
    return new Promise((resolve, reject) => {
      // 使用微任务避免与React渲染冲突
      queueMicrotask(() => {
        try {
          const result = operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * 安全地设置元素属性
   */
  safeSetElementProperty(element: HTMLElement, property: string, value: any): void {
    try {
      // 检查元素是否仍在DOM中
      if (!document.contains(element)) {
        console.warn('AI-Prompts: Attempting to modify detached element');
        return;
      }

      // 检查是否是React管理的属性
      const reactProps = Object.keys(element).filter(key => key.startsWith('__react'));
      if (reactProps.length > 0) {
        console.warn('AI-Prompts: Modifying React-managed element, using safe approach');
        
        // 使用原生setter避免React检测
        const descriptor = Object.getOwnPropertyDescriptor(element, property) ||
                          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), property);
        
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, value);
        } else {
          (element as any)[property] = value;
        }
      } else {
        (element as any)[property] = value;
      }
    } catch (error) {
      console.warn(`AI-Prompts: Failed to set ${property}:`, error);
    }
  }

  /**
   * 安全地添加事件监听器
   */
  safeAddEventListener(
    element: HTMLElement, 
    event: string, 
    handler: EventListener,
    options?: AddEventListenerOptions
  ): () => void {
    const safeHandler = this.createSafeEventHandler(handler);
    
    // 使用捕获阶段，优先级更高
    const safeOptions = {
      ...options,
      capture: true,
      passive: true
    };

    element.addEventListener(event, safeHandler, safeOptions);

    // 返回清理函数
    return () => {
      try {
        element.removeEventListener(event, safeHandler, safeOptions);
      } catch (error) {
        console.warn('AI-Prompts: Error removing event listener:', error);
      }
    };
  }

  /**
   * 创建React兼容的容器
   */
  createIsolatedContainer(parent: HTMLElement): HTMLElement {
    const container = document.createElement('div');
    
    // 设置隔离样式
    container.style.cssText = `
      position: fixed !important;
      z-index: 999999 !important;
      pointer-events: auto !important;
      isolation: isolate !important;
      contain: layout style paint !important;
    `;
    
    // 添加标识属性
    container.setAttribute('data-ai-prompts-isolated', 'true');
    container.setAttribute('data-react-ignore', 'true');
    
    // 阻止React事件冒泡
    const stopPropagation = (e: Event) => e.stopImmediatePropagation();
    container.addEventListener('click', stopPropagation, true);
    container.addEventListener('input', stopPropagation, true);
    container.addEventListener('change', stopPropagation, true);
    
    parent.appendChild(container);
    return container;
  }

  /**
   * 重置错误计数
   */
  resetErrorCounts(): void {
    this.errorCounts.clear();
  }

  /**
   * 获取错误统计
   */
  getErrorStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.errorCounts.forEach((count, code) => {
      stats[`error_${code}`] = count;
    });
    return stats;
  }
}

// 导出单例实例
export const reactCompatibilityHandler = new ReactCompatibilityHandler();