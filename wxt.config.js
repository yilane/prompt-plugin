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
    permissions: ['storage', 'activeTab', 'scripting', 'tabs', 'sidePanel'],
    host_permissions: [
      'https://*/*',
      'http://*/*',
      'https://chat.openai.com/*',
      'https://claude.ai/*',
      'https://gemini.google.com/*',
      'https://chat.deepseek.com/*',
      'https://www.doubao.com/*',
      'http://localhost/*',
    ],
    action: {
      default_title: 'AI提示词管理',
    },
    commands: {
      'wxt:reload-extension': {
        description: 'Reload the extension during development',
        suggested_key: {
          default: 'Alt+R',
        },
      },
    },
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval' http://localhost:5699; object-src 'self';",
      sandbox:
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5699; sandbox allow-scripts allow-forms allow-popups allow-modals; child-src 'self';",
    },
  },
});
