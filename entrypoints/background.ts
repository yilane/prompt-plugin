import { initializeDatabase } from '../src/utils/storage';

console.log('AI-Prompts: Background script loaded. Initializing database...');
initializeDatabase().then(() => {
  console.log('AI-Prompts: Database initialized successfully.');
}).catch((error: any) => {
  console.error('AI-Prompts: Database initialization failed:', error);
});

export default defineBackground(() => {
  browser.action.onClicked.addListener(() => {
    browser.tabs.create({
      url: '/dashboard.html'
    });
  });
});
