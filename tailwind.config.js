import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    "./entrypoints/**/*.{vue,js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        // 根据UI原型重新定义颜色系统
        'primary': '#3498db',
        'primary-hover': '#2980b9',
        'primary-foreground': '#ffffff',
        'secondary': '#6c757d',
        'secondary-hover': '#5a6268',
        'secondary-foreground': '#ffffff',
        'success': '#27ae60',
        'success-hover': '#219653',
        'success-foreground': '#ffffff',
        'danger': '#e74c3c',
        'danger-foreground': '#ffffff',

        // 亮色模式
        'light-bg': '#f5f7fa',
        'light-surface': '#ffffff',
        'light-border': '#e9ecef',
        'text-main': '#2c3e50',
        'text-content': '#495057',
        'text-muted': '#6c757d',

        // 暗色模式
        'dark-bg': '#2c3e50',
        'dark-surface': '#34495e',
        'dark-border': '#495057',
        'dark-text-main': '#f5f7fa',
        'dark-text-content': '#e9ecef',
        'dark-text-muted': '#adb5bd',
      }
    },
  },
  plugins: [
    forms,
  ],
}
