import { createApp } from 'vue'
import App from '../../src/App.vue'
import '../../src/assets/main.css'
import router from '../../src/router'
import { createPinia } from 'pinia'

// 导入所有初始化需要的模块
import { storage, initializeDatabase } from '../../src/utils/storage'
import { runCategoryMigration } from '../../src/utils/migration'

// 使用异步IIFE确保浏览器兼容性
(async () => {
  try {
    // 1. 确保数据库初始化完成
    await initializeDatabase()

    // 2. 运行一次性数据迁移脚本
    await runCategoryMigration(storage)

    // 3. 初始化默认数据 - 禁用，以使用 storage.ts 中的统一初始化逻辑
    // await initDefaultData(storage)

    // 4. 在所有异步操作完成后，安全地创建和挂载 Vue 应用
    const app = createApp(App)

    app.use(createPinia())
    app.use(router)

    app.mount('#app')

    console.log('AI-Prompts Dashboard: 应用初始化成功')
  } catch (error) {
    console.error('AI-Prompts Dashboard: 应用初始化失败:', error)
    // 创建错误提示界面
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: system-ui;">
        <h2 style="color: #dc2626;">应用初始化失败</h2>
        <p style="color: #6b7280;">请刷新页面重试，如问题持续存在请检查控制台错误信息。</p>
        <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">
          刷新页面
        </button>
      </div>
    `
  }
})()
