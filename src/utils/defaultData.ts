import type { Prompt, Category } from '@/types'

// 预置分类数据
export const defaultCategories: Category[] = [
  {
    id: 'programming',
    name: '编程开发',
    description: '代码编写、调试、优化相关提示词',
    icon: '💻',
    sort: 1,
    isCustom: false
  },
  {
    id: 'writing',
    name: '文案写作',
    description: '文档、文章、创意写作相关提示词',
    icon: '✍️',
    sort: 2,
    isCustom: false
  },
  {
    id: 'analysis',
    name: '数据分析',
    description: '数据分析、报告生成相关提示词',
    icon: '📊',
    sort: 3,
    isCustom: false
  },
  {
    id: 'design',
    name: '设计评估',
    description: 'UI/UX设计、产品设计相关提示词',
    icon: '🎨',
    sort: 4,
    isCustom: false
  },
  {
    id: 'business',
    name: '商业策划',
    description: '商业计划、市场分析、策划方案相关提示词',
    icon: '💼',
    sort: 5,
    isCustom: false
  },
  {
    id: 'translation',
    name: '翻译润色',
    description: '多语言翻译、文本润色相关提示词',
    icon: '🌍',
    sort: 6,
    isCustom: false
  },
  {
    id: 'education',
    name: '教育学习',
    description: '教学、学习、知识解答相关提示词',
    icon: '📚',
    sort: 7,
    isCustom: false
  },
  {
    id: 'creative',
    name: '创意思维',
    description: '创意构思、头脑风暴相关提示词',
    icon: '💡',
    sort: 8,
    isCustom: false
  }
]

// 预置提示词数据
export const defaultPrompts: Prompt[] = [
  // 编程开发类
  {
    id: 'code-review',
    title: '代码审查助手',
    content: '请作为高级开发工程师，审查以下代码，从性能、安全性、可维护性、最佳实践等角度提供改进建议：\n\n[请在此处粘贴代码]',
    category: 'programming',
    tags: ['代码审查', '性能优化', '最佳实践'],
    description: '专业的代码审查，提供性能和安全性改进建议',
    isCustom: false,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 5
  },
  {
    id: 'debug-helper',
    title: '调试问题解决',
    content: '我遇到了一个编程问题，请帮我分析问题原因并提供解决方案：\n\n问题描述：[请描述具体问题]\n错误信息：[请提供错误信息]\n相关代码：[请提供相关代码片段]\n\n请提供详细的分析和解决步骤。',
    category: 'programming',
    tags: ['调试', '问题解决', '错误分析'],
    description: '系统化分析和解决编程问题',
    isCustom: false,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 5
  },
  {
    id: 'api-design',
    title: 'API设计助手',
    content: '请帮我设计一个RESTful API，要求如下：\n\n功能需求：[请描述API功能]\n数据结构：[请描述数据模型]\n\n请提供：\n1. API端点设计\n2. 请求/响应格式\n3. 错误处理方案\n4. 安全性考虑\n5. 文档示例',
    category: 'programming',
    tags: ['API设计', 'RESTful', '接口文档'],
    description: '设计标准的RESTful API接口',
    isCustom: false,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 5
  },

  // 文案写作类
  {
    id: 'prd-template',
    title: '产品需求文档模板',
    content: '请帮我编写一份产品需求文档，包含以下结构：\n\n产品名称：[请填写产品名称]\n\n请按以下结构展开：\n1. 项目背景与目标\n2. 用户分析与使用场景\n3. 功能需求详述\n4. 技术要求与限制\n5. 用户体验要求\n6. 性能指标\n7. 时间规划\n8. 风险评估',
    category: 'writing',
    tags: ['产品文档', 'PRD', '需求分析'],
    description: '结构化的产品需求文档编写模板',
    isCustom: false,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 5
  },
  {
    id: 'blog-writing',
    title: '博客文章写作',
    content: '请帮我写一篇关于「[主题]」的博客文章，要求：\n\n目标读者：[请描述目标读者]\n文章风格：[专业/轻松/教程/观点等]\n字数要求：[约X字]\n\n请包含：\n1. 吸引人的标题\n2. 清晰的文章结构\n3. 具体的案例或例子\n4. 实用的建议或总结\n5. 适当的SEO关键词',
    category: 'writing',
    tags: ['博客写作', 'SEO', '内容创作'],
    description: '专业的博客文章写作助手',
    isCustom: false,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 5
  },

  // 设计评估类
  {
    id: 'ui-evaluation',
    title: 'UI设计评估',
    content: '作为UI/UX专家，请评估以下界面设计，从以下维度提供专业建议：\n\n设计描述：[请描述设计或上传设计图]\n\n评估维度：\n1. 用户体验流程\n2. 视觉层次与布局\n3. 色彩搭配与品牌一致性\n4. 交互逻辑与易用性\n5. 响应式设计考虑\n6. 无障碍设计\n7. 改进建议与优先级',
    category: 'design',
    tags: ['UI设计', 'UX评估', '用户体验'],
    description: '专业的UI/UX设计评估和改进建议',
    isCustom: false,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 5
  },

  // 数据分析类
  {
    id: 'data-analysis-report',
    title: '数据分析报告',
    content: '基于以下数据，生成专业的数据分析报告：\n\n数据描述：[请描述数据来源和内容]\n分析目标：[请说明分析目的]\n\n请提供：\n1. 数据概览与质量评估\n2. 关键指标分析\n3. 趋势分析与模式识别\n4. 异常值检测\n5. 相关性分析\n6. 关键洞察与发现\n7. 业务建议与行动计划\n8. 可视化建议',
    category: 'analysis',
    tags: ['数据分析', '报告生成', '业务洞察'],
    description: '生成专业的数据分析报告和洞察',
    isCustom: false,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 5
  },

  // 商业策划类
  {
    id: 'business-plan',
    title: '商业计划书',
    content: '请帮我制定一份商业计划书，项目信息如下：\n\n项目名称：[请填写]\n行业领域：[请填写]\n目标市场：[请填写]\n\n请按以下结构展开：\n1. 执行摘要\n2. 公司概述\n3. 市场分析\n4. 产品/服务介绍\n5. 营销策略\n6. 运营计划\n7. 管理团队\n8. 财务预测\n9. 风险分析\n10. 融资需求',
    category: 'business',
    tags: ['商业计划', '创业', '融资'],
    description: '完整的商业计划书制定模板',
    isCustom: false,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 5
  },

  // 翻译润色类
  {
    id: 'professional-translation',
    title: '专业翻译润色',
    content: '请将以下内容进行专业翻译，要求：\n\n原文语言：[请选择]\n目标语言：[请选择]\n文本类型：[技术文档/商务邮件/学术论文/营销文案/其他]\n\n原文：\n[请在此处粘贴原文]\n\n请提供：\n1. 准确的翻译\n2. 语言风格适配\n3. 专业术语处理\n4. 文化背景考虑\n5. 必要的注释说明',
    category: 'translation',
    tags: ['专业翻译', '多语言', '本地化'],
    description: '高质量的专业翻译和本地化服务',
    isCustom: false,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 5
  },

  // 创意思维类
  {
    id: 'brainstorming',
    title: '创意头脑风暴',
    content: '请帮我进行创意头脑风暴，挑战如下：\n\n主题/问题：[请描述具体主题]\n目标受众：[请描述目标群体]\n限制条件：[预算/时间/技术等限制]\n\n请提供：\n1. 5-10个创新思路\n2. 每个思路的核心优势\n3. 可行性分析\n4. 实施难度评估\n5. 潜在风险与机会\n6. 推荐的优先级排序\n7. 下一步行动建议',
    category: 'creative',
    tags: ['头脑风暴', '创新思维', '问题解决'],
    description: '系统性的创意思维和解决方案生成',
    isCustom: false,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    useCount: 0,
    rating: 5
  }
]

// 初始化默认数据
export async function initDefaultData() {
  const { storage } = await import('./storage')
  
  try {
    // 检查是否已有数据
    const existingCategories = await storage.getCategories()
    const existingPrompts = await storage.getPrompts()
    
    // 如果没有分类数据，则初始化默认分类
    if (existingCategories.length === 0) {
      for (const category of defaultCategories) {
        await storage.saveCategory(category)
      }
      console.log('默认分类数据初始化完成')
    }
    
    // 如果没有提示词数据，则初始化默认提示词
    if (existingPrompts.length === 0) {
      for (const prompt of defaultPrompts) {
        await storage.savePrompt(prompt)
      }
      console.log('默认提示词数据初始化完成')
    }
    
  } catch (error) {
    console.error('初始化默认数据失败:', error)
  }
} 