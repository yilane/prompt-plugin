import type { Prompt, Category } from '../types'

export interface CSVExportOptions {
  includeCategories?: boolean
  includeUsageStats?: boolean
  delimiter?: string
  encoding?: string
}

export interface CSVImportResult {
  prompts: Prompt[]
  categories: Category[]
  errors: string[]
  warnings: string[]
}

export class CSVProcessor {
  private delimiter: string
  
  constructor(delimiter: string = ',') {
    this.delimiter = delimiter
  }

  /**
   * 导出提示词为CSV格式
   */
  exportPromptsToCSV(
    prompts: Prompt[], 
    categories: Category[], 
    options: CSVExportOptions = {}
  ): string {
    const { includeCategories = true, includeUsageStats = true, delimiter = ',' } = options
    
    // 创建CSV头部
    const headers = [
      'ID',
      'Title',
      'Content', 
      'Description',
      'Category',
      'CategoryName',
      'Tags',
      'IsCustom',
      'CreateTime',
      'UpdateTime'
    ]
    
    if (includeUsageStats) {
      headers.push('UseCount', 'IsFavorite')
    }
    
    // 创建分类映射
    const categoryMap = new Map(categories.map(c => [c.id, c.name]))
    
    // 转换数据行
    const rows = prompts.map(prompt => {
      const row = [
        this.escapeCSVField(prompt.id),
        this.escapeCSVField(prompt.title),
        this.escapeCSVField(prompt.content),
        this.escapeCSVField(prompt.description),
        this.escapeCSVField(prompt.category),
        this.escapeCSVField(categoryMap.get(prompt.category) || ''),
        this.escapeCSVField(prompt.tags.join(';')),
        prompt.isCustom ? 'true' : 'false',
        this.escapeCSVField(prompt.createTime),
        this.escapeCSVField(prompt.updateTime)
      ]
      
      if (includeUsageStats) {
        row.push(
          String(prompt.useCount || 0),
          prompt.isFavorite ? 'true' : 'false'
        )
      }
      
      return row
    })
    
    // 组合CSV内容
    const csvLines = [
      headers.join(delimiter),
      ...rows.map(row => row.join(delimiter))
    ]
    
    return csvLines.join('\n')
  }

  /**
   * 导出分类为CSV格式
   */
  exportCategoriesToCSV(categories: Category[], delimiter: string = ','): string {
    const headers = ['ID', 'Name', 'Description', 'Icon', 'Sort', 'IsCustom']
    
    const rows = categories.map(category => [
      this.escapeCSVField(category.id),
      this.escapeCSVField(category.name),
      this.escapeCSVField(category.description),
      this.escapeCSVField(category.icon),
      String(category.sort),
      category.isCustom ? 'true' : 'false'
    ])
    
    const csvLines = [
      headers.join(delimiter),
      ...rows.map(row => row.join(delimiter))
    ]
    
    return csvLines.join('\n')
  }

  /**
   * 从CSV导入提示词
   */
  importPromptsFromCSV(csvContent: string, delimiter: string = ','): CSVImportResult {
    const result: CSVImportResult = {
      prompts: [],
      categories: [],
      errors: [],
      warnings: []
    }
    
    try {
      const lines = csvContent.trim().split('\n')
      if (lines.length < 2) {
        result.errors.push('CSV文件格式错误：至少需要标题行和一行数据')
        return result
      }
      
      // 解析头部
      const headers = this.parseCSVLine(lines[0], delimiter)
      const requiredHeaders = ['ID', 'Title', 'Content', 'Category']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        result.errors.push(`CSV文件缺少必需的列：${missingHeaders.join(', ')}`)
        return result
      }
      
      // 解析数据行
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i], delimiter)
          if (values.length !== headers.length) {
            result.warnings.push(`第${i + 1}行列数不匹配，跳过该行`)
            continue
          }
          
          const rowData = this.createRowObject(headers, values)
          const prompt = this.convertRowToPrompt(rowData, i + 1)
          
          if (prompt) {
            result.prompts.push(prompt)
          }
        } catch (error) {
          result.errors.push(`第${i + 1}行解析错误：${error}`)
        }
      }
      
    } catch (error) {
      result.errors.push(`CSV解析失败：${error}`)
    }
    
    return result
  }

  /**
   * 从CSV导入分类
   */
  importCategoriesFromCSV(csvContent: string, delimiter: string = ','): CSVImportResult {
    const result: CSVImportResult = {
      prompts: [],
      categories: [],
      errors: [],
      warnings: []
    }
    
    try {
      const lines = csvContent.trim().split('\n')
      if (lines.length < 2) {
        result.errors.push('CSV文件格式错误：至少需要标题行和一行数据')
        return result
      }
      
      const headers = this.parseCSVLine(lines[0], delimiter)
      const requiredHeaders = ['ID', 'Name']
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
      
      if (missingHeaders.length > 0) {
        result.errors.push(`CSV文件缺少必需的列：${missingHeaders.join(', ')}`)
        return result
      }
      
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i], delimiter)
          const rowData = this.createRowObject(headers, values)
          const category = this.convertRowToCategory(rowData, i + 1)
          
          if (category) {
            result.categories.push(category)
          }
        } catch (error) {
          result.errors.push(`第${i + 1}行解析错误：${error}`)
        }
      }
      
    } catch (error) {
      result.errors.push(`CSV解析失败：${error}`)
    }
    
    return result
  }

  /**
   * 解析CSV行
   */
  private parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0
    
    while (i < line.length) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // 转义的引号
          current += '"'
          i += 2
        } else {
          // 切换引号状态
          inQuotes = !inQuotes
          i++
        }
      } else if (char === delimiter && !inQuotes) {
        // 字段分隔符
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }
    
    result.push(current.trim())
    return result
  }

  /**
   * 转义CSV字段
   */
  private escapeCSVField(field: string): string {
    if (!field) return ''
    
    // 如果包含逗号、引号或换行符，需要用引号包围
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      // 转义内部的引号
      const escaped = field.replace(/"/g, '""')
      return `"${escaped}"`
    }
    
    return field
  }

  /**
   * 创建行对象
   */
  private createRowObject(headers: string[], values: string[]): Record<string, string> {
    const obj: Record<string, string> = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  }

  /**
   * 转换行数据为Prompt对象
   */
  private convertRowToPrompt(rowData: Record<string, string>, lineNumber: number): Prompt | null {
    try {
      const prompt: Prompt = {
        id: rowData.ID || `imported_${Date.now()}_${lineNumber}`,
        title: rowData.Title || '',
        content: rowData.Content || '',
        description: rowData.Description || '',
        category: rowData.Category || '',
        tags: rowData.Tags ? rowData.Tags.split(';').filter(tag => tag.trim()) : [],
        isCustom: rowData.IsCustom === 'true',
        createTime: rowData.CreateTime || new Date().toISOString(),
        updateTime: rowData.UpdateTime || new Date().toISOString(),
        useCount: parseInt(rowData.UseCount || '0') || 0,
        isFavorite: rowData.IsFavorite === 'true'
      }
      
      // 验证必需字段
      if (!prompt.title.trim()) {
        throw new Error('标题不能为空')
      }
      if (!prompt.content.trim()) {
        throw new Error('内容不能为空')
      }
      
      return prompt
    } catch (error) {
      throw new Error(`转换提示词失败：${error}`)
    }
  }

  /**
   * 转换行数据为Category对象
   */
  private convertRowToCategory(rowData: Record<string, string>, lineNumber: number): Category | null {
    try {
      const category: Category = {
        id: rowData.ID || `imported_cat_${Date.now()}_${lineNumber}`,
        name: rowData.Name || '',
        description: rowData.Description || '',
        icon: rowData.Icon || '📁',
        sort: parseInt(rowData.Sort || '0') || 0,
        isCustom: rowData.IsCustom === 'true'
      }
      
      if (!category.name.trim()) {
        throw new Error('分类名称不能为空')
      }
      
      return category
    } catch (error) {
      throw new Error(`转换分类失败：${error}`)
    }
  }
}

export const csvProcessor = new CSVProcessor()