import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { initializeDatabase } from '../src/utils/storage';

export default defineBackground(() => {
  console.log('AI-Prompts: Background script executing.');

  // Move database initialization inside the background definition
  // to ensure the service worker is ready.
  initializeDatabase().then(() => {
    console.log('AI-Prompts: Database initialized successfully from background.');
  }).catch((error) => {
    console.error('AI-Prompts: Database initialization failed from background:', error);
  });

  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });
});
