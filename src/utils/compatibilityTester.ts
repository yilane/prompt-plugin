/**
 * 平台兼容性测试工具
 * 用于测试和验证扩展在不同AI平台上的兼容性
 */

import { platformDetector, PLATFORM_CONFIGS } from './platformDetection'
import { browserCompatibility } from './browserCompatibility'

export interface CompatibilityTestResult {
  platform: string
  tests: {
    platformDetection: boolean
    elementDetection: boolean
    textInsertion: boolean
    eventHandling: boolean
    customHandlers: boolean
  }
  errors: string[]
  warnings: string[]
  score: number
}

export class PlatformCompatibilityTester {
  private testResults: CompatibilityTestResult[] = []

  /**
   * 运行所有平台的兼容性测试
   */
  async runAllTests(): Promise<CompatibilityTestResult[]> {
    this.testResults = []
    
    console.group('Platform Compatibility Tests')
    
    // 测试当前平台
    const currentPlatform = platformDetector.detectPlatform()
    const currentResult = await this.testPlatform(currentPlatform.name)
    this.testResults.push(currentResult)
    
    // 测试浏览器兼容性
    await this.testBrowserCompatibility()
    
    console.groupEnd()
    
    return this.testResults
  }

  /**
   * 测试特定平台的兼容性
   */
  async testPlatform(platformName: string): Promise<CompatibilityTestResult> {
    const platform = Object.values(PLATFORM_CONFIGS).find(p => p.name === platformName)
    
    if (!platform) {
      return {
        platform: platformName,
        tests: {
          platformDetection: false,
          elementDetection: false,
          textInsertion: false,
          eventHandling: false,
          customHandlers: false
        },
        errors: [`Platform ${platformName} not found in configurations`],
        warnings: [],
        score: 0
      }
    }

    console.group(`Testing platform: ${platform.name}`)
    
    const result: CompatibilityTestResult = {
      platform: platformName,
      tests: {
        platformDetection: false,
        elementDetection: false,
        textInsertion: false,
        eventHandling: false,
        customHandlers: false
      },
      errors: [],
      warnings: [],
      score: 0
    }

    try {
      // 测试平台检测
      result.tests.platformDetection = this.testPlatformDetection(platform)
      
      // 测试元素检测
      result.tests.elementDetection = this.testElementDetection(platform)
      
      // 测试文本插入
      result.tests.textInsertion = await this.testTextInsertion(platform)
      
      // 测试事件处理
      result.tests.eventHandling = this.testEventHandling(platform)
      
      // 测试自定义处理器
      result.tests.customHandlers = this.testCustomHandlers(platform)
      
      // 计算分数
      const passedTests = Object.values(result.tests).filter(Boolean).length
      result.score = (passedTests / Object.keys(result.tests).length) * 100
      
      console.log(`Platform ${platform.name} compatibility score: ${result.score}%`)
      
    } catch (error) {
      result.errors.push(`Test execution failed: ${error}`)
      console.error(`Error testing platform ${platform.name}:`, error)
    }

    console.groupEnd()
    return result
  }

  /**
   * 测试平台检测功能
   */
  private testPlatformDetection(platform: any): boolean {
    try {
      const detectedPlatform = platformDetector.getCurrentPlatform()
      
      if (!detectedPlatform) {
        console.warn('Platform detection returned null')
        return false
      }

      console.log('✓ Platform detection working')
      return true
    } catch (error) {
      console.error('✗ Platform detection failed:', error)
      return false
    }
  }

  /**
   * 测试元素检测功能
   */
  private testElementDetection(platform: any): boolean {
    try {
      // 创建测试元素
      const testElements = this.createTestElements(platform)
      
      for (const element of testElements) {
        document.body.appendChild(element)
      }

      // 尝试检测元素
      const detectedElement = platformDetector.findTextInputElement(platform)
      
      // 清理测试元素
      testElements.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el)
        }
      })

      if (detectedElement) {
        console.log('✓ Element detection working')
        return true
      } else {
        console.warn('✗ Element detection failed')
        return false
      }
    } catch (error) {
      console.error('✗ Element detection test failed:', error)
      return false
    }
  }

  /**
   * 测试文本插入功能
   */
  private async testTextInsertion(platform: any): Promise<boolean> {
    try {
      const testElement = this.createTestElements(platform)[0]
      document.body.appendChild(testElement)

      // 设置初始内容
      if (testElement.tagName === 'TEXTAREA') {
        (testElement as HTMLTextAreaElement).value = 'Hello @@'
      } else {
        testElement.textContent = 'Hello @@'
      }

      // 测试插入
      const success = platformDetector.insertContent(testElement, 'World!', '@@', platform)
      
      // 检查结果
      const finalContent = testElement.tagName === 'TEXTAREA' 
        ? (testElement as HTMLTextAreaElement).value
        : testElement.textContent || ''

      // 清理
      if (testElement.parentNode) {
        testElement.parentNode.removeChild(testElement)
      }

      if (success && finalContent.includes('Hello World!')) {
        console.log('✓ Text insertion working')
        return true
      } else {
        console.warn('✗ Text insertion failed')
        return false
      }
    } catch (error) {
      console.error('✗ Text insertion test failed:', error)
      return false
    }
  }

  /**
   * 测试事件处理
   */
  private testEventHandling(platform: any): boolean {
    try {
      const testElement = this.createTestElements(platform)[0]
      document.body.appendChild(testElement)

      let eventFired = false
      
      // 添加事件监听器
      testElement.addEventListener('input', () => {
        eventFired = true
      })

      // 触发事件
      testElement.dispatchEvent(new Event('input', { bubbles: true }))

      // 清理
      if (testElement.parentNode) {
        testElement.parentNode.removeChild(testElement)
      }

      if (eventFired) {
        console.log('✓ Event handling working')
        return true
      } else {
        console.warn('✗ Event handling failed')
        return false
      }
    } catch (error) {
      console.error('✗ Event handling test failed:', error)
      return false
    }
  }

  /**
   * 测试自定义处理器
   */
  private testCustomHandlers(platform: any): boolean {
    try {
      if (!platform.customHandlers) {
        console.log('- No custom handlers to test')
        return true
      }

      const testElement = this.createTestElements(platform)[0]
      document.body.appendChild(testElement)

      // 测试beforeInsert处理器
      if (platform.customHandlers.beforeInsert) {
        platform.customHandlers.beforeInsert(testElement, 'test content')
      }

      // 测试afterInsert处理器
      if (platform.customHandlers.afterInsert) {
        platform.customHandlers.afterInsert(testElement, 'test content')
      }

      // 测试特殊键处理器
      if (platform.customHandlers.specialKeyHandling) {
        const mockEvent = new KeyboardEvent('keydown', { key: 'Enter' })
        platform.customHandlers.specialKeyHandling(mockEvent, testElement)
      }

      // 清理
      if (testElement.parentNode) {
        testElement.parentNode.removeChild(testElement)
      }

      console.log('✓ Custom handlers working')
      return true
    } catch (error) {
      console.error('✗ Custom handlers test failed:', error)
      return false
    }
  }

  /**
   * 创建测试元素
   */
  private createTestElements(platform: any): HTMLElement[] {
    const elements: HTMLElement[] = []

    // 基于平台选择器创建测试元素
    platform.textareaSelectors.forEach((selector: string, index: number) => {
      try {
        if (selector.includes('textarea')) {
          const textarea = document.createElement('textarea')
          textarea.id = `test-textarea-${index}`
          textarea.placeholder = 'Test placeholder'
          elements.push(textarea)
        } else if (selector.includes('div[contenteditable="true"]')) {
          const div = document.createElement('div')
          div.contentEditable = 'true'
          div.id = `test-div-${index}`
          elements.push(div)
        } else if (selector.includes('input')) {
          const input = document.createElement('input')
          input.type = 'text'
          input.id = `test-input-${index}`
          elements.push(input)
        }
      } catch (error) {
        console.warn('Failed to create test element for selector:', selector)
      }
    })

    return elements
  }

  /**
   * 测试浏览器兼容性
   */
  private async testBrowserCompatibility(): Promise<void> {
    console.group('Browser Compatibility Tests')
    
    const browser = browserCompatibility.detectBrowser()
    console.log('Browser:', browser)

    // 测试存储API
    try {
      const storageAPI = browserCompatibility.getStorageAPI()
      await storageAPI.set({ 'test-key': 'test-value' })
      const result = await storageAPI.get('test-key')
      await storageAPI.remove('test-key')
      
      if (result['test-key'] === 'test-value') {
        console.log('✓ Storage API working')
      } else {
        console.warn('✗ Storage API test failed')
      }
    } catch (error) {
      console.error('✗ Storage API test failed:', error)
    }

    // 测试剪贴板API
    try {
      const success = await browserCompatibility.writeToClipboard('test content')
      if (success) {
        console.log('✓ Clipboard API working')
      } else {
        console.warn('✗ Clipboard API test failed')
      }
    } catch (error) {
      console.error('✗ Clipboard API test failed:', error)
    }

    // 测试键盘事件规范化
    try {
      const mockEvent = new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true })
      const normalized = browserCompatibility.normalizeKeyboardEvent(mockEvent)
      
      if (normalized.key && normalized.ctrlKey !== undefined) {
        console.log('✓ Keyboard event normalization working')
      } else {
        console.warn('✗ Keyboard event normalization failed')
      }
    } catch (error) {
      console.error('✗ Keyboard event normalization test failed:', error)
    }

    console.groupEnd()
  }

  /**
   * 生成兼容性报告
   */
  generateReport(): string {
    const report = ['=== Platform Compatibility Report ===', '']

    for (const result of this.testResults) {
      report.push(`Platform: ${result.platform}`)
      report.push(`Score: ${result.score.toFixed(1)}%`)
      report.push('')
      
      report.push('Tests:')
      Object.entries(result.tests).forEach(([test, passed]) => {
        report.push(`  ${passed ? '✓' : '✗'} ${test}`)
      })
      
      if (result.errors.length > 0) {
        report.push('')
        report.push('Errors:')
        result.errors.forEach(error => report.push(`  - ${error}`))
      }
      
      if (result.warnings.length > 0) {
        report.push('')
        report.push('Warnings:')
        result.warnings.forEach(warning => report.push(`  - ${warning}`))
      }
      
      report.push('')
      report.push('---')
      report.push('')
    }

    return report.join('\n')
  }

  /**
   * 获取测试结果
   */
  getResults(): CompatibilityTestResult[] {
    return this.testResults
  }
}

// 导出单例实例
export const compatibilityTester = new PlatformCompatibilityTester()