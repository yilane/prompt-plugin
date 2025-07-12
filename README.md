# AI提示词管理插件 (AI Prompt Management Extension)

一个智能管理和快捷使用AI提示词的浏览器扩展，支持多平台AI网站，提供丰富的提示词库和智能推荐功能。

A browser extension for intelligent management and quick use of AI prompts, supporting multiple AI platforms with rich prompt libraries and smart recommendations.

## ✨ 特性 (Features)

- 🎯 **智能推荐** - 根据用户输入智能推荐相关提示词
- 📚 **丰富提示词库** - 预置行业专业提示词，支持自定义管理
- ⚡ **快捷输入** - 通过快捷键快速调用和插入提示词
- 🌍 **多平台支持** - 支持 ChatGPT、Claude、Gemini、DeepSeek、豆包等主流AI平台
- 🎨 **现代界面** - 支持暗色/亮色主题，响应式设计
- 💾 **数据管理** - 支持导入导出，本地存储

## 🚀 安装 (Installation)

### 开发环境

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 构建压缩包
npm run build:zip
```

### 浏览器安装

1. 克隆项目并构建
2. 打开浏览器扩展管理页面
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist` 文件夹

## 🎯 支持的平台 (Supported Platforms)

- ✅ ChatGPT (chat.openai.com, chatgpt.com)
- ✅ Claude (claude.ai)
- ✅ Gemini (gemini.google.com)
- ✅ DeepSeek (chat.deepseek.com)
- ✅ 豆包 (doubao.com)
- ✅ 更多平台持续添加中...

## 🛠️ 技术栈 (Tech Stack)

- **框架**: Vue 3 + TypeScript
- **构建工具**: WXT (Web Extension Toolkit)
- **UI库**: Tailwind CSS + Headless UI
- **状态管理**: Pinia
- **图表**: Chart.js + Vue-ChartJS
- **工具**: ESLint + Vue TSC

## 📁 项目结构 (Project Structure)

```
prompt-plugin/
├── src/
│   ├── components/          # Vue组件
│   │   ├── business/        # 业务组件
│   │   ├── common/          # 通用组件
│   │   ├── content/         # 内容脚本组件
│   │   ├── layout/          # 布局组件
│   │   └── ui/              # UI基础组件
│   ├── stores/              # Pinia状态管理
│   ├── utils/               # 工具函数
│   ├── views/               # 页面视图
│   └── types/               # TypeScript类型定义
├── entrypoints/             # 扩展入口点
│   ├── background.ts        # 后台脚本
│   ├── content.ts           # 内容脚本
│   ├── dashboard/           # 仪表板页面
│   └── sidepanel/           # 侧边栏页面
├── docs/                    # 项目文档
└── public/                  # 静态资源
```

## 🔧 开发脚本 (Development Scripts)

```bash
# 开发模式 (热重载)
npm run dev

# 类型检查
npm run type-check

# 代码检查和修复
npm run lint

# 构建生产版本
npm run build

# 构建并打包为zip
npm run build:zip

# 预览构建结果
npm run preview
```

## 📖 使用指南 (Usage Guide)

### 基本使用

1. 在支持的AI网站上打开聊天页面
2. 在输入框中使用快捷键触发插件
3. 搜索或浏览提示词库
4. 选择合适的提示词插入

### 自定义提示词

1. 打开扩展的管理面板
2. 进入"提示词库"页面
3. 点击"添加提示词"
4. 填写提示词信息并保存

详细使用说明请查看 [文档目录](./docs/)。

## 🤝 贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 许可证 (License)

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接 (Links)

- [WXT 文档](https://wxt.dev/)
- [Vue 3 文档](https://vuejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [浏览器扩展开发指南](https://developer.chrome.com/docs/extensions/)

## 📞 支持 (Support)

如有问题或建议，请通过以下方式联系：

- 提交 [GitHub Issue](../../issues)
- 查看 [项目文档](./docs/)
- 参考 [故障排除指南](./docs/SIDEPANEL_DEBUG_GUIDE.md)
