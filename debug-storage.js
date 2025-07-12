// Debug script to check extension storage
// Run this in the browser console when the extension is loaded

(async function debugStorage() {
  console.log('=== AI Prompts Storage Debug ===');
  
  try {
    // Check if chrome.storage is available
    if (typeof chrome === 'undefined' || !chrome.storage) {
      console.error('Chrome storage API not available');
      return;
    }
    
    // Get all storage data
    const result = await chrome.storage.local.get(null);
    console.log('All storage data:', result);
    
    // Check specific keys
    const keys = [
      'ai-prompts-is-initialized',
      'ai-prompts-prompts', 
      'ai-prompts-categories',
      'ai-prompts-settings'
    ];
    
    for (const key of keys) {
      const data = await chrome.storage.local.get(key);
      console.log(`${key}:`, data[key]);
    }
    
    // Check if initialization flag is set
    const isInitialized = await chrome.storage.local.get('ai-prompts-is-initialized');
    console.log('Database initialized?', isInitialized['ai-prompts-is-initialized']);
    
    // Try to trigger manual initialization if needed
    if (!isInitialized['ai-prompts-is-initialized']) {
      console.log('Database not initialized. Manual initialization may be needed.');
      
      // Basic categories for testing
      const testCategories = [
        {
          id: 'cat-test-1',
          name: '编程', 
          description: '编程相关的提示词',
          icon: '💻',
          sort: 1,
          isCustom: false
        },
        {
          id: 'cat-test-2',
          name: '写作',
          description: '写作相关的提示词', 
          icon: '✍️',
          sort: 2,
          isCustom: false
        }
      ];
      
      await chrome.storage.local.set({
        'ai-prompts-categories': testCategories,
        'ai-prompts-prompts': [],
        'ai-prompts-is-initialized': true
      });
      
      console.log('Manual initialization completed with test categories');
    }
    
  } catch (error) {
    console.error('Debug script error:', error);
  }
})();