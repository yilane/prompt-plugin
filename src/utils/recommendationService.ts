import type { Prompt, UsageStats } from '../types'
import { storage } from './storage'

export interface RecommendationResult {
  prompt: Prompt
  score: number
  reason: string
}

export interface ContextAnalysis {
  primaryIntent: string
  techStack: string
  complexity: string
  urgency: string
  keywords: string[]
  originalText: string
}

export interface UserProfile {
  favoriteCategories: string[]
  frequentTags: string[]
  usagePatterns: {
    timeOfDay: number[]  // 0-23
    dayOfWeek: number[]  // 0-6
  }
  averageSessionLength: number
  preferredComplexity: string
  recentSearches: string[]
}

export class RecommendationService {
  /**
   * 基于使用频率的推荐算法
   */
  async getFrequencyBasedRecommendations(limit: number = 5): Promise<RecommendationResult[]> {
    const prompts = await storage.getAllPrompts()
    const usageStats = await storage.getUsageStats()
    
    // 创建使用统计映射
    const statsMap = new Map<string, UsageStats>()
    usageStats.forEach(stat => statsMap.set(stat.promptId, stat))
    
    // 计算推荐分数
    const recommendations: RecommendationResult[] = prompts
      .map(prompt => {
        const stats = statsMap.get(prompt.id)
        const useCount = prompt.useCount || 0
        const recentUsage = stats ? this.calculateRecencyScore(stats.lastUsed) : 0
        
        // 综合分数：使用次数权重70% + 最近使用权重30%
        const score = useCount * 0.7 + recentUsage * 0.3
        
        return {
          prompt,
          score,
          reason: useCount > 0 ? `使用${useCount}次` : '新提示词'
        }
      })
      .filter(item => item.score > 0) // 只推荐有使用记录的
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    return recommendations
  }
  
  /**
   * 基于关键词匹配的智能推荐
   */
  async getKeywordBasedRecommendations(
    query: string, 
    limit: number = 5
  ): Promise<RecommendationResult[]> {
    if (!query.trim()) return []
    
    const prompts = await storage.getAllPrompts()
    const keywords = query.toLowerCase().split(/\s+/)
    
    const recommendations: RecommendationResult[] = prompts
      .map(prompt => {
        const score = this.calculateKeywordScore(prompt, keywords)
        return {
          prompt,
          score,
          reason: score > 0 ? '关键词匹配' : ''
        }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    return recommendations
  }
  
  /**
   * 混合推荐：结合使用频率、关键词匹配和个性化推荐
   */
  async getHybridRecommendations(
    query: string = '', 
    limit: number = 5
  ): Promise<RecommendationResult[]> {
    const [frequencyRecs, keywordRecs, personalizedRecs] = await Promise.all([
      this.getFrequencyBasedRecommendations(limit * 2),
      query ? this.getKeywordBasedRecommendations(query, limit * 2) : [],
      this.getPersonalizedRecommendations(limit * 2, query)
    ])
    
    // 合并并去重
    const recMap = new Map<string, RecommendationResult>()
    
    // 添加个性化推荐（最高优先级）
    personalizedRecs.forEach(rec => {
      recMap.set(rec.prompt.id, {
        ...rec,
        score: rec.score * 0.5,
        reason: `个性化: ${rec.reason}`
      })
    })
    
    // 添加关键词推荐
    keywordRecs.forEach(rec => {
      const existing = recMap.get(rec.prompt.id)
      if (existing) {
        recMap.set(rec.prompt.id, {
          ...rec,
          score: existing.score + rec.score * 0.4,
          reason: `${existing.reason} + 关键词匹配`
        })
      } else {
        recMap.set(rec.prompt.id, {
          ...rec,
          score: rec.score * 0.4,
          reason: '关键词匹配'
        })
      }
    })
    
    // 添加频率推荐（最低优先级）
    frequencyRecs.forEach(rec => {
      const existing = recMap.get(rec.prompt.id)
      if (existing) {
        recMap.set(rec.prompt.id, {
          ...rec,
          score: existing.score + rec.score * 0.3,
          reason: `${existing.reason} + 频率推荐`
        })
      } else {
        recMap.set(rec.prompt.id, {
          ...rec,
          score: rec.score * 0.3,
          reason: `频率推荐：${rec.reason}`
        })
      }
    })
    
    return Array.from(recMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }
  
  /**
   * 获取最近使用的提示词推荐
   */
  async getRecentlyUsedRecommendations(limit: number = 5): Promise<RecommendationResult[]> {
    const usageStats = await storage.getUsageStats()
    const prompts = await storage.getAllPrompts()
    
    // 按最后使用时间排序
    const recentStats = usageStats
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, limit)
    
    const recommendations: RecommendationResult[] = []
    
    for (const stat of recentStats) {
      const prompt = prompts.find(p => p.id === stat.promptId)
      if (prompt) {
        recommendations.push({
          prompt,
          score: this.calculateRecencyScore(stat.lastUsed),
          reason: `最近使用于${this.formatTimeAgo(stat.lastUsed)}`
        })
      }
    }
    
    return recommendations
  }
  
  /**
   * 计算时间衰减分数
   */
  private calculateRecencyScore(lastUsed: string): number {
    const now = Date.now()
    const lastUsedTime = new Date(lastUsed).getTime()
    const hoursPassed = (now - lastUsedTime) / (1000 * 60 * 60)
    
    // 时间衰减函数：24小时内100分，之后按指数衰减
    if (hoursPassed <= 24) {
      return 100 - (hoursPassed / 24) * 20 // 24小时内从100衰减到80
    } else if (hoursPassed <= 168) { // 一周内
      return 80 - ((hoursPassed - 24) / 144) * 60 // 一周内从80衰减到20
    } else {
      return Math.max(1, 20 - (hoursPassed - 168) / 168 * 19) // 超过一周继续衰减到1
    }
  }
  
  /**
   * 计算关键词匹配分数（增强版）
   */
  private calculateKeywordScore(prompt: Prompt, keywords: string[]): number {
    let score = 0
    const { title, content, description, tags } = prompt
    
    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase()
      
      // 1. 标题匹配（最高权重）
      const titleLower = title.toLowerCase()
      if (titleLower === keywordLower) {
        score += 200 // 完全匹配
      } else if (titleLower.includes(keywordLower)) {
        // 根据匹配位置和长度给分
        const matchIndex = titleLower.indexOf(keywordLower)
        const positionScore = matchIndex === 0 ? 150 : 100 // 开头匹配更高分
        const lengthScore = (keyword.length / title.length) * 50 // 匹配长度占比
        score += positionScore + lengthScore
      }
      
      // 2. 标签匹配
      tags.forEach(tag => {
        const tagLower = tag.toLowerCase()
        if (tagLower === keywordLower) {
          score += 120 // 标签完全匹配
        } else if (tagLower.includes(keywordLower)) {
          score += 80  // 标签部分匹配
        }
      })
      
      // 3. 描述匹配
      const descriptionLower = description.toLowerCase()
      if (descriptionLower.includes(keywordLower)) {
        // 多次出现给更高分
        const matches = (descriptionLower.match(new RegExp(keywordLower, 'g')) || []).length
        score += Math.min(matches * 30, 60) // 最多60分
      }
      
      // 4. 内容匹配（权重较低）
      const contentLower = content.toLowerCase()
      if (contentLower.includes(keywordLower)) {
        const matches = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length
        score += Math.min(matches * 10, 30) // 最多30分，避免过长内容干扰
      }
      
      // 5. 语义相似度加分（简单实现）
      score += this.calculateSemanticSimilarity(keyword, prompt)
    })
    
    return score
  }
  
  /**
   * 计算语义相似度（简单实现）
   */
  private calculateSemanticSimilarity(keyword: string, prompt: Prompt): number {
    const semanticMap: Record<string, string[]> = {
      '编程': ['代码', '开发', '程序', '算法', '调试', 'bug', '函数', '变量'],
      '写作': ['文章', '内容', '创作', '文案', '博客', '小说', '剧本'],
      '翻译': ['语言', '英文', '中文', '日文', '转换', '本地化'],
      '分析': ['数据', '统计', '图表', '报告', '趋势', '洞察'],
      '创意': ['想法', '头脑风暴', '灵感', '设计', '艺术', '创新'],
      '产品': ['需求', '功能', '用户', '市场', '迭代', '优化']
    }
    
    let similarity = 0
    const keywordLower = keyword.toLowerCase()
    
    Object.entries(semanticMap).forEach(([category, words]) => {
      if (words.some(word => keywordLower.includes(word) || word.includes(keywordLower))) {
        // 检查提示词是否属于该类别
        const categoryMatch = prompt.title.toLowerCase().includes(category) ||
                            prompt.description.toLowerCase().includes(category) ||
                            prompt.tags.some(tag => tag.toLowerCase().includes(category))
        
        if (categoryMatch) {
          similarity += 20
        }
      }
    })
    
    return similarity
  }
  
  /**
   * 基于上下文分析的推荐
   */
  async getContextBasedRecommendations(
    context: string,
    limit: number = 5
  ): Promise<RecommendationResult[]> {
    if (!context.trim()) return []
    
    const prompts = await storage.getAllPrompts()
    const contextAnalysis = this.analyzeContext(context)
    
    const recommendations: RecommendationResult[] = prompts
      .map(prompt => {
        const score = this.calculateContextScore(prompt, contextAnalysis)
        return {
          prompt,
          score,
          reason: score > 0 ? `上下文匹配: ${contextAnalysis.primaryIntent}` : ''
        }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    return recommendations
  }
  
  /**
   * 分析上下文内容
   */
  private analyzeContext(context: string): ContextAnalysis {
    const text = context.toLowerCase()
    
    // 意图识别模式
    const intentPatterns = {
      'code_review': ['代码审查', '检查代码', 'code review', '代码问题', '优化代码'],
      'writing': ['写文章', '创作', '写作', '文案', '博客', '内容创作'],
      'debugging': ['调试', 'bug', '错误', '问题', '不工作', '修复'],
      'translation': ['翻译', '转换', '英文', '中文', '日文', '多语言'],
      'analysis': ['分析', '数据', '统计', '报告', '趋势', '洞察'],
      'brainstorm': ['头脑风暴', '想法', '创意', '灵感', '方案'],
      'learning': ['学习', '教程', '如何', '怎么', '指南', '入门'],
      'optimization': ['优化', '改进', '提升', '性能', '效率']
    }
    
    // 技术栈识别
    const techPatterns = {
      'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'angular'],
      'python': ['python', 'django', 'flask', 'pandas', 'numpy'],
      'web': ['html', 'css', 'frontend', '前端', 'web', 'ui', 'ux'],
      'backend': ['后端', 'backend', 'api', 'server', '服务器'],
      'database': ['数据库', 'database', 'sql', 'mysql', 'mongodb'],
      'ai': ['ai', '人工智能', 'machine learning', 'deep learning', 'gpt']
    }
    
    // 复杂度识别
    const complexityPatterns = {
      'beginner': ['入门', '基础', '新手', 'beginner', '简单', '初学'],
      'intermediate': ['中级', '进阶', '实用', 'intermediate'],
      'advanced': ['高级', '深入', '复杂', 'advanced', '专业', '优化']
    }
    
    // 紧急程度识别
    const urgencyPatterns = {
      'urgent': ['紧急', '急', '快速', '立即', 'urgent', 'asap'],
      'normal': ['正常', '一般', '常规'],
      'low': ['不急', '慢慢', '有时间']
    }
    
    const primaryIntent = this.findPrimaryMatch(text, intentPatterns)
    const techStack = this.findPrimaryMatch(text, techPatterns)
    const complexity = this.findPrimaryMatch(text, complexityPatterns)
    const urgency = this.findPrimaryMatch(text, urgencyPatterns)
    
    // 提取关键词
    const keywords = this.extractKeywords(text)
    
    return {
      primaryIntent,
      techStack,
      complexity,
      urgency,
      keywords,
      originalText: context
    }
  }
  
  /**
   * 计算上下文匹配分数
   */
  private calculateContextScore(prompt: Prompt, context: ContextAnalysis): number {
    let score = 0
    
    // 1. 意图匹配
    if (context.primaryIntent) {
      score += this.calculateIntentMatch(prompt, context.primaryIntent) * 100
    }
    
    // 2. 技术栈匹配
    if (context.techStack) {
      score += this.calculateTechMatch(prompt, context.techStack) * 80
    }
    
    // 3. 复杂度匹配
    if (context.complexity) {
      score += this.calculateComplexityMatch(prompt, context.complexity) * 60
    }
    
    // 4. 关键词匹配
    score += this.calculateKeywordScore(prompt, context.keywords) * 0.5
    
    // 5. 紧急程度调整
    if (context.urgency === 'urgent') {
      score *= 1.2 // 紧急情况下提升推荐优先级
    }
    
    return score
  }
  
  /**
   * 查找主要匹配项
   */
  private findPrimaryMatch(text: string, patterns: Record<string, string[]>): string {
    let bestMatch = ''
    let bestScore = 0
    
    Object.entries(patterns).forEach(([key, keywords]) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (text.includes(keyword) ? keyword.length : 0)
      }, 0)
      
      if (score > bestScore) {
        bestScore = score
        bestMatch = key
      }
    })
    
    return bestMatch
  }
  
  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    // 简单的关键词提取：去除停用词，提取有意义的词汇
    const stopWords = ['的', '了', '是', '在', '有', '和', '与', '或', '但', '而', '及', '以', '为', '于', '由', '从', '到']
    const words = text.split(/[\s，。！？；：、\.,!?;:\s]+/)
      .filter(word => word.length > 1 && !stopWords.includes(word))
      .slice(0, 10) // 限制关键词数量
    
    return words
  }
  
  /**
   * 计算意图匹配度
   */
  private calculateIntentMatch(prompt: Prompt, intent: string): number {
    const intentMapping: Record<string, string[]> = {
      'code_review': ['审查', '检查', '代码质量', '最佳实践'],
      'writing': ['写作', '创作', '文案', '内容'],
      'debugging': ['调试', '问题', '错误', '修复'],
      'translation': ['翻译', '语言', '转换'],
      'analysis': ['分析', '数据', '报告'],
      'brainstorm': ['创意', '想法', '头脑风暴'],
      'learning': ['学习', '教程', '指南'],
      'optimization': ['优化', '性能', '改进']
    }
    
    const intentKeywords = intentMapping[intent] || []
    return this.calculateTextSimilarity(prompt, intentKeywords)
  }
  
  /**
   * 计算技术栈匹配度
   */
  private calculateTechMatch(prompt: Prompt, tech: string): number {
    const techMapping: Record<string, string[]> = {
      'javascript': ['javascript', 'js', 'node', 'react', 'vue'],
      'python': ['python', 'django', 'flask'],
      'web': ['html', 'css', 'frontend', '前端'],
      'backend': ['后端', 'backend', 'api'],
      'database': ['数据库', 'sql', 'mysql'],
      'ai': ['ai', '人工智能', 'gpt']
    }
    
    const techKeywords = techMapping[tech] || []
    return this.calculateTextSimilarity(prompt, techKeywords)
  }
  
  /**
   * 计算复杂度匹配度
   */
  private calculateComplexityMatch(prompt: Prompt, complexity: string): number {
    const complexityMapping: Record<string, string[]> = {
      'beginner': ['入门', '基础', '简单', '新手'],
      'intermediate': ['中级', '进阶', '实用'],
      'advanced': ['高级', '深入', '复杂', '专业']
    }
    
    const complexityKeywords = complexityMapping[complexity] || []
    return this.calculateTextSimilarity(prompt, complexityKeywords)
  }
  
  /**
   * 计算文本相似度
   */
  private calculateTextSimilarity(prompt: Prompt, keywords: string[]): number {
    if (keywords.length === 0) return 0
    
    const promptText = `${prompt.title} ${prompt.description} ${prompt.tags.join(' ')}`.toLowerCase()
    let matches = 0
    
    keywords.forEach(keyword => {
      if (promptText.includes(keyword.toLowerCase())) {
        matches++
      }
    })
    
    return matches / keywords.length
  }
  
  /**
   * 个性化推荐算法
   */
  async getPersonalizedRecommendations(
    limit: number = 5,
    context?: string
  ): Promise<RecommendationResult[]> {
    const userProfile = await this.generateUserProfile()
    const prompts = await storage.getAllPrompts()
    
    const recommendations: RecommendationResult[] = prompts
      .map(prompt => {
        const score = this.calculatePersonalizedScore(prompt, userProfile, context)
        return {
          prompt,
          score,
          reason: this.generatePersonalizedReason(prompt, userProfile)
        }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
    
    return recommendations
  }
  
  /**
   * 生成用户画像
   */
  async generateUserProfile(): Promise<UserProfile> {
    const [prompts, usageStats] = await Promise.all([
      storage.getAllPrompts(),
      storage.getUsageStats()
    ])
    
    // 分析最喜欢的分类
    const categoryUsage = new Map<string, number>()
    usageStats.forEach(stat => {
      const prompt = prompts.find(p => p.id === stat.promptId)
      if (prompt) {
        categoryUsage.set(prompt.category, (categoryUsage.get(prompt.category) || 0) + stat.count)
      }
    })
    
    const favoriteCategories = Array.from(categoryUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)
    
    // 分析常用标签
    const tagUsage = new Map<string, number>()
    usageStats.forEach(stat => {
      const prompt = prompts.find(p => p.id === stat.promptId)
      if (prompt) {
        prompt.tags.forEach(tag => {
          tagUsage.set(tag, (tagUsage.get(tag) || 0) + stat.count)
        })
      }
    })
    
    const frequentTags = Array.from(tagUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag)
    
    // 分析使用模式（简化版）
    const usagePatterns = this.analyzeUsagePatterns(usageStats)
    
    // 分析偏好复杂度
    const preferredComplexity = this.analyzePreferredComplexity(prompts, usageStats)
    
    return {
      favoriteCategories,
      frequentTags,
      usagePatterns,
      averageSessionLength: 5, // 简化：固定值
      preferredComplexity,
      recentSearches: [] // 简化：暂不实现
    }
  }
  
  /**
   * 计算个性化分数
   */
  private calculatePersonalizedScore(
    prompt: Prompt,
    profile: UserProfile,
    context?: string
  ): number {
    let score = 0
    
    // 1. 分类偏好匹配（40%权重）
    if (profile.favoriteCategories.includes(prompt.category)) {
      const categoryIndex = profile.favoriteCategories.indexOf(prompt.category)
      score += (100 - categoryIndex * 20) * 0.4
    }
    
    // 2. 标签偏好匹配（30%权重）
    const tagMatches = prompt.tags.filter(tag => profile.frequentTags.includes(tag)).length
    score += (tagMatches / Math.max(profile.frequentTags.length, 1)) * 100 * 0.3
    
    // 3. 复杂度匹配（20%权重）
    if (this.matchesComplexity(prompt, profile.preferredComplexity)) {
      score += 100 * 0.2
    }
    
    // 4. 使用频率加权（10%权重）
    score += (prompt.useCount || 0) * 0.1
    
    // 5. 上下文加成
    if (context) {
      const contextScore = this.calculateKeywordScore(prompt, [context])
      score += contextScore * 0.1
    }
    
    // 6. 时间模式调整（简化）
    const currentHour = new Date().getHours()
    if (profile.usagePatterns.timeOfDay.includes(currentHour)) {
      score *= 1.1
    }
    
    return score
  }
  
  /**
   * 生成个性化推荐原因
   */
  private generatePersonalizedReason(prompt: Prompt, profile: UserProfile): string {
    const reasons: string[] = []
    
    if (profile.favoriteCategories.includes(prompt.category)) {
      reasons.push('您常用的分类')
    }
    
    const tagMatches = prompt.tags.filter(tag => profile.frequentTags.includes(tag))
    if (tagMatches.length > 0) {
      reasons.push(`匹配标签: ${tagMatches.slice(0, 2).join(', ')}`)
    }
    
    if (prompt.useCount > 0) {
      reasons.push(`已使用${prompt.useCount}次`)
    }
    
    return reasons.length > 0 ? reasons.join(' · ') : '个性化推荐'
  }
  
  /**
   * 分析使用模式
   */
  private analyzeUsagePatterns(usageStats: UsageStats[]): UserProfile['usagePatterns'] {
    const timeOfDay: number[] = []
    const dayOfWeek: number[] = []
    
    usageStats.forEach(stat => {
      const date = new Date(stat.lastUsed)
      const hour = date.getHours()
      const day = date.getDay()
      
      if (!timeOfDay.includes(hour)) {
        timeOfDay.push(hour)
      }
      if (!dayOfWeek.includes(day)) {
        dayOfWeek.push(day)
      }
    })
    
    return { timeOfDay, dayOfWeek }
  }
  
  /**
   * 分析偏好复杂度
   */
  private analyzePreferredComplexity(prompts: Prompt[], usageStats: UsageStats[]): string {
    const complexityScores = {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    }
    
    usageStats.forEach(stat => {
      const prompt = prompts.find(p => p.id === stat.promptId)
      if (prompt) {
        const complexity = this.inferComplexity(prompt)
        complexityScores[complexity] += stat.count
      }
    })
    
    return Object.entries(complexityScores)
      .sort((a, b) => b[1] - a[1])[0][0]
  }
  
  /**
   * 推断提示词复杂度
   */
  private inferComplexity(prompt: Prompt): 'beginner' | 'intermediate' | 'advanced' {
    const text = `${prompt.title} ${prompt.description}`.toLowerCase()
    
    const beginnerKeywords = ['入门', '基础', '简单', '新手', '初学']
    const advancedKeywords = ['高级', '深入', '复杂', '专业', '优化', '架构']
    
    if (beginnerKeywords.some(keyword => text.includes(keyword))) {
      return 'beginner'
    } else if (advancedKeywords.some(keyword => text.includes(keyword))) {
      return 'advanced'
    } else {
      return 'intermediate'
    }
  }
  
  /**
   * 检查复杂度匹配
   */
  private matchesComplexity(prompt: Prompt, preferredComplexity: string): boolean {
    const promptComplexity = this.inferComplexity(prompt)
    return promptComplexity === preferredComplexity
  }
  private formatTimeAgo(timeString: string): string {
    const now = Date.now()
    const time = new Date(timeString).getTime()
    const diff = now - time
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else {
      return '一周前'
    }
  }
}

export const recommendationService = new RecommendationService()