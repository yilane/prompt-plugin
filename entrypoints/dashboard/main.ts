import { createApp } from 'vue'
import App from '../../src/App.vue'
import '../../src/assets/main.css'
import router from '../../src/router'
import { createPinia } from 'pinia'

// 导入所有初始化需要的模块
import { storage, initializeDatabase } from '../../src/utils/storage'
import { initDefaultData } from '../../src/utils/defaultData'
import { runCategoryMigration } from '../../src/utils/migration'

// 1. 使用顶层 await 确保数据库初始化完成
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
