# 多平台兼容性功能文档

## 概述

AI提示词管理插件现已支持多个AI平台和浏览器的兼容性，通过智能检测和适配机制确保在不同环境下的最佳用户体验。

## 支持的AI平台

### 1. ChatGPT/OpenAI
- **域名**: `chat.openai.com`, `chatgpt.com`
- **元素检测**: 支持新版和旧版界面的输入框
- **特殊功能**: React事件兼容、模板变量支持
- **输入方式**: `textContent` 插入，支持富文本

### 2. Claude
- **域名**: `claude.ai`
- **元素检测**: ContentEditable编辑器和ProseMirror
- **特殊功能**: 编辑器状态管理、focus/blur处理
- **输入方式**: `textContent` 插入，支持富文本

### 3. Gemini/Bard
- **域名**: `gemini.google.com`, `bard.google.com`, `ai.google.dev`, `makersuite.google.com`
- **元素检测**: Google风格的输入组件
- **特殊功能**: Google产品特有的事件处理
- **输入方式**: `textContent` 插入，支持富文本

### 4. DeepSeek
- **域名**: `chat.deepseek.com`
- **元素检测**: 标准textarea和contenteditable
- **特殊功能**: 基础文本处理
- **输入方式**: `value` 插入，支持多行文本

### 5. 豆包(Doubao)
- **域名**: `www.doubao.com`
- **元素检测**: 中文AI平台标准输入框
- **特殊功能**: 中文字符处理优化
- **输入方式**: `value` 插入，支持多行文本

## 支持的浏览器

### Chrome/Chromium
- **版本要求**: Chrome 88+
- **Manifest**: V3
- **特殊功能**: 完整的Side Panel支持
- **API支持**: 全功能支持

### Microsoft Edge
- **版本要求**: Edge 88+
- **Manifest**: V3
- **特殊功能**: 完整的Side Panel支持
- **API支持**: 全功能支持

### Firefox
- **版本要求**: Firefox 109+
- **Manifest**: V2/V3混合支持
- **特殊功能**: Sidebar Action替代Side Panel
- **API支持**: 核心功能支持

### Opera
- **版本要求**: Opera 74+
- **Manifest**: V3
- **特殊功能**: Chromium内核兼容
- **API支持**: 基本功能支持

## 核心技术特性

### 1. 平台自动检测
```typescript
// 自动检测当前AI平台
const platform = platformDetector.detectPlatform()
console.log(platform.name) // 'ChatGPT', 'Claude', etc.
```

### 2. 智能元素查找
```typescript
// 基于平台配置查找最佳输入元素
const element = platformDetector.findTextInputElement(platform)
```

### 3. 平台特化插入
```typescript
// 使用平台优化的内容插入方法
const success = platformDetector.insertContent(element, content, trigger, platform)
```

### 4. 浏览器兼容性处理
```typescript
// 获取兼容的存储API
const storageAPI = browserCompatibility.getStorageAPI()

// 获取兼容的剪贴板API
const success = await browserCompatibility.writeToClipboard(text)
```

## 配置详情

### 平台配置示例
```typescript
const chatgptConfig: PlatformConfig = {
  name: 'ChatGPT',
  domain: 'chat.openai.com',
  textareaSelectors: [
    '#prompt-textarea',
    'textarea[id*="prompt"]',
    'div[contenteditable="true"][role="textbox"]'
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
    afterInsert: (element, content) => {
      // ChatGPT特殊的React事件处理
      element.dispatchEvent(new InputEvent('input', { 
        bubbles: true, 
        inputType: 'insertText'
      }))
    }
  }
}
```

### 浏览器兼容性配置
```typescript
const browserInfo: BrowserInfo = {
  name: 'chrome',
  version: '120.0.0',
  isChromium: true,
  supportsManifestV3: true,
  supportsServiceWorker: true,
  supportsSidePanel: true,
  supportsOffscreenDocument: true
}
```

## 测试和验证

### 兼容性测试
```typescript
import { compatibilityTester } from './utils/compatibilityTester'

// 运行所有平台的兼容性测试
const results = await compatibilityTester.runAllTests()

// 生成测试报告
const report = compatibilityTester.generateReport()
console.log(report)
```

### 测试项目
- ✅ 平台检测准确性
- ✅ 元素查找成功率
- ✅ 文本插入功能
- ✅ 事件处理兼容性
- ✅ 自定义处理器执行
- ✅ 浏览器API兼容性

## 构建和部署

### 多浏览器构建
```bash
# Chrome构建
npm run build

# Firefox构建
npx wxt build --browser firefox

# Edge构建
npx wxt build --browser edge
```

### 文件结构
```
.output/
├── chrome-mv3/          # Chrome扩展包
├── firefox-mv2/         # Firefox扩展包
└── edge-mv3/           # Edge扩展包
```

## 错误处理和Fallback

### 平台检测失败
当无法检测到已知平台时，系统会：
1. 使用通用平台配置
2. 执行基础元素查找
3. 应用标准文本插入方法

### 浏览器API不可用
当特定浏览器API不可用时，系统会：
1. 使用Mock API替代
2. 降级到基础功能
3. 保持核心功能可用

### 元素查找失败
当平台特定选择器失败时，系统会：
1. 尝试通用选择器
2. 执行动态元素搜索
3. 提供用户反馈

## 性能优化

### 延迟加载
- 平台检测模块按需加载
- 兼容性检查缓存结果
- 事件监听器智能绑定

### 内存管理
- 自动清理废弃监听器
- 及时释放DOM引用
- 优化观察器使用

## 已知限制

### 平台限制
- 某些平台的动态加载内容可能需要额外等待
- 新版本界面变化可能需要配置更新
- 移动端界面支持有限

### 浏览器限制
- Safari的扩展API支持有限
- 旧版浏览器部分功能不可用
- 无头浏览器环境兼容性有限

## 维护和更新

### 平台配置更新
当AI平台更新界面时，需要：
1. 更新选择器配置
2. 调整插入方法
3. 测试兼容性
4. 发布更新

### 浏览器支持
定期检查：
1. 新浏览器版本支持
2. API变更影响
3. 性能优化机会
4. 安全更新需求

## 故障排除

### 常见问题
1. **插入失败**: 检查平台检测是否正确
2. **元素未找到**: 验证选择器是否有效
3. **事件不触发**: 确认事件处理器绑定
4. **存储失败**: 检查浏览器权限设置

### 调试工具
```typescript
// 启用详细日志
console.log('Platform detected:', platformDetector.getCurrentPlatform())

// 运行兼容性测试
compatibilityTester.runAllTests().then(console.log)

// 检查浏览器信息
browserCompatibility.logCompatibilityInfo()
```

## 贡献指南

### 添加新平台支持
1. 在 `platformDetection.ts` 中添加平台配置
2. 实现平台特定的处理逻辑
3. 添加相应的测试用例
4. 更新文档和示例

### 浏览器兼容性改进
1. 检测新的浏览器API
2. 实现兼容性处理
3. 更新检测逻辑
4. 添加测试覆盖

---

*本文档会随着新平台和浏览器的支持持续更新。*