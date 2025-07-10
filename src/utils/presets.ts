import type { Category, Prompt } from '@/types';

export const presetCategories: Omit<Category, 'id'>[] = [
  { name: '编程', description: '代码生成、调试、优化等', icon: '💻', sort: 1, isCustom: false },
  { name: '写作', description: '内容创作、润色、摘要等', icon: '✍️', sort: 2, isCustom: false },
  { name: '翻译', description: '多语言互译、术语解释', icon: '🌐', sort: 3, isCustom: false },
  { name: '分析', description: '数据分析、市场研究、竞品分析', icon: '📊', sort: 4, isCustom: false },
  { name: '创意', description: '头脑风暴、广告文案、故事创作', icon: '💡', sort: 5, isCustom: false },
  { name: '生活', description: '邮件回复、旅游规划、健身计划', icon: '🏖️', sort: 6, isCustom: false },
  { name: '学习', description: '知识问答、学习计划、内容总结', icon: '🎓', sort: 7, isCustom: false },
  { name: '自定义', description: '用户自定义的提示词分类', icon: '⭐', sort: 99, isCustom: false },
];

export const presetPrompts: Omit<Prompt, 'id' | 'createTime' | 'updateTime' | 'category'>[] = [
  {
    title: '代码审查助手',
    description: '作为高级开发工程师，审查代码，从性能、安全、可维护性等角度提供改进建议。',
    content: '请作为一位拥有10年经验的高级软件架构师，仔细审查以下代码。我希望你能从以下几个方面给出具体的、可操作的改进建议：\n\n1.  **性能优化**: 是否存在潜在的性能瓶颈？例如，不高效的算法、过多的数据库查询、内存泄漏风险等。\n2.  **安全性**: 是否有任何安全漏洞？例如，SQL注入、跨站脚本（XSS）、不安全的数据存储等。\n3.  **可维护性与代码整洁度**: 代码是否遵循SOLID原则？命名是否清晰？模块划分是否合理？是否存在过多的“魔法数字”或硬编码？\n4.  **最佳实践**: 是否遵循了该语言或框架的最新最佳实践？\n5.  **错误处理**: 错误和异常处理是否健壮？\n\n请在报告的最后，给出一个总体的代码质量评分（1-10分），并总结最重要的三个改进点。\n\n```[语言]\n[粘贴你的代码在这里]\n```',
    tags: ['编程', '代码审查', '重构'],
    isCustom: false,
    useCount: 23,
    rating: 5,
    isFavorite: true,
  },
  {
    title: '产品需求文档模板',
    description: '帮助编写结构化的产品需求文档（PRD），包含背景、目标、功能等要素。',
    content: '请帮我编写一份产品需求文档（PRD），我将提供产品的核心思想，你需要帮我填充和组织成一个完整的文档。文档应至少包含以下部分：\n\n1.  **背景与目标**: 为什么要做这个产品？要解决什么问题？\n2.  **用户故事与范围**: 目标用户是谁？他们有哪些痛点？本次迭代的核心功能范围是什么？\n3.  **功能详述**: 详细描述每个功能点，可以使用表格或列表。\n4.  **非功能性需求**: 如性能、安全性、兼容性等要求。\n5.  **数据指标**: 我们如何衡量产品的成功？\n\n我的产品核心思想是：[在此处描述你的产品想法]',
    tags: ['产品', '文档', 'PRD'],
    isCustom: false,
    useCount: 15,
    rating: 5,
  },
  {
    title: 'UI设计评估专家',
    description: '从用户体验角度评估界面设计，提供改进建议。',
    content: '请扮演一位资深的UI/UX设计专家，对以下提供的界面设计进行评估。请从以下几个维度提供详细的分析和改进建议：\n\n1.  **视觉层次**: 界面元素的主次关系是否清晰？用户第一眼会注意到什么？\n2.  **信息架构**: 信息的组织和分类是否合理？导航是否清晰？\n3.  **交互逻辑**: 用户的操作流程是否顺畅？是否存在不明确或令人困惑的交互？\n4.  **可用性**: 对于新手用户是否友好？是否有足够的引导和反馈？\n5.  **一致性**: 整体设计风格、颜色、字体、控件是否保持一致？\n\n[请在这里粘贴你的界面截图链接或详细描述你的设计]',
    tags: ['设计', 'UI/UX', '用户体验'],
    isCustom: false,
    useCount: 8,
    rating: 4,
  },
  {
    title: '创意营销文案',
    description: '为产品或活动生成吸引人的社交媒体营销文案。',
    content: '请为我即将推出的 [产品名称或活动] 生成5条适用于社交媒体（如微博、小红书）的创意营销文案。要求：\n\n1.  **目标用户**: [描述你的目标用户，如Z世代、年轻母亲等]\n2.  **产品特点**: [列出产品的1-3个核心卖点]\n3.  **文案风格**: [描述你想要的风格，如幽默、感性、科技感等]\n4.  **要求**: 每条文案需要包含引人注目的标题、emoji表情，并至少包含一个互动性问题或呼吁行动（CTA）。',
    tags: ['营销', '文案', '创意'],
    isCustom: false,
    useCount: 18,
    rating: 4,
  },
  {
    title: '英文邮件润色',
    description: '将中式英语或不地道的表达润色为专业、自然的商务英语。',
    content: '请将以下英文邮件内容进行润色，使其更符合英语母语者的商务沟通习惯。请注意修正语法错误、不自然的表达和过于生硬的语气。\n\n原始邮件内容：\n```\n[在此处粘贴你的英文邮件内容]\n```',
    tags: ['写作', '翻译', '商务英语'],
    isCustom: false,
    useCount: 32,
    rating: 5,
  },
]; 