# AI提示词管理插件 - 快速开始指南

## 立即开始的第一步

基于任务拆解，建议按以下顺序开始开发：

### 🚀 第一周任务重点

#### 第1天：项目脚手架搭建
```bash
# 推荐的项目初始化命令
npm create vue@latest prompt-plugin
cd prompt-plugin
npm install

# 添加必要依赖
npm install -D @types/chrome tailwindcss vite-plugin-web-extension
```

#### 第2-3天：核心架构设计
1. **manifest.json配置** - 浏览器扩展的入口配置
2. **数据结构定义** - TypeScript接口定义
3. **基础UI组件** - 可复用的Vue组件

#### 第4-5天：数据层实现
1. **IndexedDB封装** - 本地数据存储
2. **预置数据准备** - 初始提示词库
3. **CRUD操作** - 数据增删改查

#### 第6-7天：核心功能MVP
1. **提示词管理界面** - 基础的管理功能
2. **快捷键触发** - Content Script开发

### 📋 优先开发清单

#### 立即开始的任务 (本周内完成)
- [ ] 1.1 项目脚手架搭建
- [ ] 1.2 浏览器扩展配置
- [ ] 2.1 数据模型定义
- [ ] 2.2 本地存储管理
- [ ] 3.1 基础UI组件（Button, Input, Modal）

#### 下周计划的任务
- [ ] 3.2 业务组件开发
- [ ] 4.1 提示词展示功能
- [ ] 4.2 提示词管理功能
- [ ] 5.1 Content Script开发

### 🛠 开发环境设置

#### 必需工具
- Node.js 18+
- Chrome浏览器（用于调试）
- VS Code + Vue插件

#### 推荐的VS Code插件
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

### 📁 建议的项目结构
```
prompt-plugin/
├── src/
│   ├── components/        # Vue组件
│   ├── content-scripts/   # 内容脚本
│   ├── background/        # 后台脚本
│   ├── popup/            # 弹窗页面
│   ├── types/            # TypeScript类型定义
│   ├── utils/            # 工具函数
│   ├── stores/           # 状态管理
│   └── assets/           # 静态资源
├── public/
├── dist/                 # 构建输出
├── manifest.json         # 扩展配置
└── package.json
```

### 🎯 MVP版本目标

完成MVP版本的核心功能：
1. ✅ 基础的提示词增删改查
2. ✅ 简单的分类管理
3. ✅ 快捷键触发提示词选择
4. ✅ 提示词插入到AI聊天输入框

### 📞 需要决策的问题

在开始开发前，需要确认：

1. **UI框架选择**：确认使用Vue 3 + Tailwind CSS？
2. **快捷键设计**：使用 `/prompt` 还是 `@@` 触发？
3. **支持平台优先级**：先适配哪个AI平台（ChatGPT/Claude）？
4. **数据存储方案**：确认使用IndexedDB作为主要存储？

### 下一步操作

建议您：
1. 查看 `/task/project_tasks_breakdown.md` 了解完整任务规划
2. 开始执行"项目脚手架搭建"任务
3. 有问题时参考任务文档中的技术选型建议 