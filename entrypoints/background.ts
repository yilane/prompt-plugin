import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { initializeDatabase } from '../src/utils/storage';

console.log('AI-Prompts: Background script loaded. Initializing database...');
initializeDatabase().then(() => {
  console.log('AI-Prompts: Database initialized successfully.');
}).catch((error) => {
  console.error('AI-Prompts: Database initialization failed:', error);
});

export default defineBackground(() => {
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });
});
