/**
 * 浏览器兼容性处理
 * 处理不同浏览器之间的API差异和特性支持
 */

export interface BrowserInfo {
  name: 'chrome' | 'firefox' | 'edge' | 'safari' | 'opera' | 'unknown';
  version: string;
  isChromium: boolean;
  supportsManifestV3: boolean;
  supportsServiceWorker: boolean;
  supportsSidePanel: boolean;
  supportsOffscreenDocument: boolean;
}

export class BrowserCompatibility {
  private browserInfo: BrowserInfo | null = null;

  /**
   * 检测浏览器信息
   */
  detectBrowser(): BrowserInfo {
    if (this.browserInfo) return this.browserInfo;

    const userAgent = navigator.userAgent.toLowerCase();
    const vendor = navigator.vendor?.toLowerCase() || '';
    
    let name: BrowserInfo['name'] = 'unknown';
    let version = '';
    let isChromium = false;

    // 检测浏览器类型
    if (userAgent.includes('firefox') && !userAgent.includes('seamonkey')) {
      name = 'firefox';
      const match = userAgent.match(/firefox\/([0-9.]+)/);
      version = match ? match[1] : '';
    } else if (userAgent.includes('edg/')) {
      name = 'edge';
      isChromium = true;
      const match = userAgent.match(/edg\/([0-9.]+)/);
      version = match ? match[1] : '';
    } else if (userAgent.includes('opr/') || userAgent.includes('opera/')) {
      name = 'opera';
      isChromium = userAgent.includes('opr/');
      const match = userAgent.match(/(opr|opera)\/([0-9.]+)/);
      version = match ? match[2] : '';
    } else if (userAgent.includes('safari') && !userAgent.includes('chrome') && vendor.includes('apple')) {
      name = 'safari';
      const match = userAgent.match(/version\/([0-9.]+)/);
      version = match ? match[1] : '';
    } else if (userAgent.includes('chrome') || vendor.includes('google')) {
      name = 'chrome';
      isChromium = true;
      const match = userAgent.match(/chrome\/([0-9.]+)/);
      version = match ? match[1] : '';
    }

    // 检测功能支持
    const majorVersion = parseInt(version.split('.')[0], 10) || 0;
    
    const supportsManifestV3 = this.checkManifestV3Support(name, majorVersion);
    const supportsServiceWorker = this.checkServiceWorkerSupport(name, majorVersion);
    const supportsSidePanel = this.checkSidePanelSupport(name, majorVersion);
    const supportsOffscreenDocument = this.checkOffscreenDocumentSupport(name, majorVersion);

    this.browserInfo = {
      name,
      version,
      isChromium,
      supportsManifestV3,
      supportsServiceWorker,
      supportsSidePanel,
      supportsOffscreenDocument
    };

    console.log('BrowserCompatibility: Detected browser:', this.browserInfo);
    return this.browserInfo;
  }

  /**
   * 检查Manifest V3支持
   */
  private checkManifestV3Support(name: BrowserInfo['name'], version: number): boolean {
    switch (name) {
      case 'chrome':
        return version >= 88;
      case 'edge':
        return version >= 88;
      case 'firefox':
        return version >= 109; // Firefox开始支持MV3
      case 'opera':
        return version >= 74;
      default:
        return false;
    }
  }

  /**
   * 检查Service Worker支持
   */
  private checkServiceWorkerSupport(name: BrowserInfo['name'], version: number): boolean {
    switch (name) {
      case 'chrome':
        return version >= 40;
      case 'edge':
        return version >= 17;
      case 'firefox':
        return version >= 44;
      case 'safari':
        return version >= 11.1;
      case 'opera':
        return version >= 27;
      default:
        return 'serviceWorker' in navigator;
    }
  }

  /**
   * 检查Side Panel支持
   */
  private checkSidePanelSupport(name: BrowserInfo['name'], version: number): boolean {
    // Side Panel目前主要是Chrome特性
    switch (name) {
      case 'chrome':
        return version >= 114;
      case 'edge':
        return version >= 114;
      default:
        return false;
    }
  }

  /**
   * 检查Offscreen Document支持
   */
  private checkOffscreenDocumentSupport(name: BrowserInfo['name'], version: number): boolean {
    switch (name) {
      case 'chrome':
        return version >= 109;
      case 'edge':
        return version >= 109;
      default:
        return false;
    }
  }

  /**
   * 获取兼容的browser API
   */
  getBrowserAPI(): any {
    // 优先使用chrome API，然后fallback到browser API
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      return chrome;
    }
    
    if (typeof browser !== 'undefined') {
      return browser;
    }

    // 创建mock API以防止错误
    return this.createMockBrowserAPI();
  }

  /**
   * 创建模拟的browser API
   */
  private createMockBrowserAPI(): any {
    return {
      runtime: {
        id: 'mock-extension-id',
        getURL: (path: string) => `chrome-extension://mock/${path}`,
        sendMessage: () => Promise.resolve(),
        onMessage: {
          addListener: () => {},
          removeListener: () => {}
        }
      },
      storage: {
        local: {
          get: () => Promise.resolve({}),
          set: () => Promise.resolve(),
          remove: () => Promise.resolve(),
          clear: () => Promise.resolve()
        }
      },
      tabs: {
        query: () => Promise.resolve([]),
        create: () => Promise.resolve(),
        sendMessage: () => Promise.resolve()
      },
      action: {
        onClicked: {
          addListener: () => {}
        }
      }
    };
  }

  /**
   * 检查API是否可用
   */
  isAPIAvailable(apiPath: string): boolean {
    const api = this.getBrowserAPI();
    const parts = apiPath.split('.');
    let current = api;
    
    for (const part of parts) {
      if (!current || typeof current[part] === 'undefined') {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }

  /**
   * 获取兼容的存储API
   */
  getStorageAPI(): any {
    const api = this.getBrowserAPI();
    
    if (this.isAPIAvailable('storage.local')) {
      return api.storage.local;
    }
    
    // Fallback to localStorage
    return {
      get: (keys: string | string[]) => {
        const result: any = {};
        const keyArray = Array.isArray(keys) ? keys : [keys];
        
        keyArray.forEach(key => {
          const value = localStorage.getItem(key);
          if (value !== null) {
            try {
              result[key] = JSON.parse(value);
            } catch {
              result[key] = value;
            }
          }
        });
        
        return Promise.resolve(result);
      },
      
      set: (items: Record<string, any>) => {
        Object.entries(items).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        return Promise.resolve();
      },
      
      remove: (keys: string | string[]) => {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        keyArray.forEach(key => localStorage.removeItem(key));
        return Promise.resolve();
      },
      
      clear: () => {
        localStorage.clear();
        return Promise.resolve();
      }
    };
  }

  /**
   * 获取兼容的标签页API
   */
  getTabsAPI(): any {
    const api = this.getBrowserAPI();
    
    if (this.isAPIAvailable('tabs')) {
      return api.tabs;
    }
    
    // Mock tabs API
    return {
      query: () => Promise.resolve([]),
      create: (options: any) => {
        if (options.url) {
          window.open(options.url, '_blank');
        }
        return Promise.resolve();
      },
      sendMessage: () => Promise.resolve()
    };
  }

  /**
   * 获取兼容的运行时API
   */
  getRuntimeAPI(): any {
    const api = this.getBrowserAPI();
    
    if (this.isAPIAvailable('runtime')) {
      return api.runtime;
    }
    
    // Mock runtime API
    return {
      id: 'mock-extension-id',
      getURL: (path: string) => `${window.location.origin}/${path}`,
      sendMessage: () => Promise.resolve(),
      onMessage: {
        addListener: () => {},
        removeListener: () => {}
      }
    };
  }

  /**
   * 处理键盘事件的浏览器差异
   */
  normalizeKeyboardEvent(event: KeyboardEvent): {
    key: string;
    code: string;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
  } {
    return {
      key: event.key || event.keyCode?.toString() || '',
      code: event.code || '',
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey
    };
  }

  /**
   * 创建兼容的剪贴板API
   */
  async writeToClipboard(text: string): Promise<boolean> {
    try {
      // 优先使用现代API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Fallback到旧方法
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch (error) {
      console.error('BrowserCompatibility: Clipboard write failed:', error);
      return false;
    }
  }

  /**
   * 检查是否在扩展环境中运行
   */
  isExtensionEnvironment(): boolean {
    return (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) ||
           (typeof browser !== 'undefined' && browser.runtime && browser.runtime.id);
  }

  /**
   * 获取浏览器特定的CSS前缀
   */
  getCSSPrefix(): string {
    const browser = this.detectBrowser();
    switch (browser.name) {
      case 'firefox':
        return '-moz-';
      case 'safari':
        return '-webkit-';
      case 'chrome':
      case 'edge':
      case 'opera':
      default:
        return '-webkit-';
    }
  }

  /**
   * 创建兼容的观察器
   */
  createMutationObserver(callback: MutationCallback, options?: MutationObserverInit): MutationObserver | null {
    if ('MutationObserver' in window) {
      return new MutationObserver(callback);
    }
    
    // Fallback for very old browsers
    console.warn('BrowserCompatibility: MutationObserver not supported');
    return null;
  }

  /**
   * 获取兼容的全屏API
   */
  getFullscreenAPI(): {
    requestFullscreen: (element: Element) => Promise<void>;
    exitFullscreen: () => Promise<void>;
    fullscreenElement: Element | null;
  } {
    const element = document.documentElement as any;
    const doc = document as any;
    
    return {
      requestFullscreen: (el: Element) => {
        const elem = el as any;
        if (elem.requestFullscreen) {
          return elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          return elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          return elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          return elem.msRequestFullscreen();
        }
        return Promise.reject('Fullscreen not supported');
      },
      
      exitFullscreen: () => {
        if (doc.exitFullscreen) {
          return doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          return doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          return doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          return doc.msExitFullscreen();
        }
        return Promise.reject('Exit fullscreen not supported');
      },
      
      get fullscreenElement() {
        return doc.fullscreenElement || 
               doc.webkitFullscreenElement || 
               doc.mozFullScreenElement || 
               doc.msFullscreenElement || 
               null;
      }
    };
  }

  /**
   * 日志浏览器兼容性信息
   */
  logCompatibilityInfo(): void {
    const browser = this.detectBrowser();
    const features = [
      { name: 'Manifest V3', supported: browser.supportsManifestV3 },
      { name: 'Service Worker', supported: browser.supportsServiceWorker },
      { name: 'Side Panel', supported: browser.supportsSidePanel },
      { name: 'Offscreen Document', supported: browser.supportsOffscreenDocument },
      { name: 'Extension APIs', supported: this.isExtensionEnvironment() },
      { name: 'Clipboard API', supported: !!navigator.clipboard },
      { name: 'MutationObserver', supported: 'MutationObserver' in window }
    ];

    console.group('Browser Compatibility Report');
    console.log('Browser:', `${browser.name} ${browser.version}`);
    console.log('Chromium-based:', browser.isChromium);
    console.table(features);
    console.groupEnd();
  }
}

// 导出单例实例
export const browserCompatibility = new BrowserCompatibility();