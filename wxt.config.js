import { defineConfig } from 'wxt';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: {
    addons: {
      vueTemplate: true,
    },
  },
  vite: () => ({
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }),
  manifest: {
    name: 'AI提示词管理插件',
    version: '1.0.0',
    description: '智能管理和快捷使用AI提示词的浏览器扩展',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: [
      'https://chat.openai.com/*',
      'https://claude.ai/*',
      'https://gemini.google.com/*',
      'https://chat.deepseek.com/*',
      'https://www.doubao.com/*',
    ],
    action: {
      default_title: 'AI提示词管理'
    },
  },
});
