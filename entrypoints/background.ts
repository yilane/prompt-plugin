import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import { initializeDatabase } from '../src/utils/storage';

export default defineBackground({
  main() {
    console.log('AI-Prompts: Background script executing.');

    // Set up side panel behavior first
    try {
      browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    } catch (error) {
      console.warn('AI-Prompts: Side panel API not available:', error);
    }

    // Set up action click handler
    browser.action.onClicked.addListener(async (tab) => {
      if (tab.id) {
        try {
          await browser.sidePanel.open({ tabId: tab.id });
        } catch (error) {
          console.error('AI-Prompts: Failed to open side panel:', error);
        }
      }
    });

    // Initialize database
    (async () => {
      try {
        await initializeDatabase();
        console.log('AI-Prompts: Database initialized successfully.');
      } catch (error) {
        console.error('AI-Prompts: Database initialization failed:', error);
        // Retry once after a delay
        setTimeout(async () => {
          try {
            await initializeDatabase();
            console.log('AI-Prompts: Database initialized successfully on retry.');
          } catch (retryError) {
            console.error('AI-Prompts: Database initialization failed on retry:', retryError);
          }
        }, 2000);
      }
    })();

    // Handle messages from content scripts and other parts of the extension
    browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      console.log('AI-Prompts: Received message in background:', message);
      
      // Handle other extension messages as needed
      return true;
    });
  }
});
