import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// 初始化存储和默认数据
import { storage } from '@/utils/storage'
import { initDefaultData } from '@/utils/defaultData'

async function initApp() {
  // 初始化数据库
  await storage.init()
  
  // 初始化默认数据
  await initDefaultData()
  
  // 创建Vue应用
  const app = createApp(App)
  
  app.use(createPinia())
  app.use(router)
  
  app.mount('#app')
}

// 启动应用
initApp().catch(console.error)
