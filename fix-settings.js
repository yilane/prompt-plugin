// 直接保存用户自定义设置到数据库
async function saveCustomSettings() {
  const customSettings = {
    theme: "system",
    language: "zh", 
    triggerSequences: [
      {
        id: "default-1",
        value: "@@",
        enabled: true
      }
    ],
    enableQuickInsert: true,
    enableKeyboardShortcuts: true,
    enableNotifications: true,
    autoBackup: false,
    maxRecentPrompts: 10
  };

  try {
    // 打开数据库
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('AI-Prompts-DB', 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    // 保存设置
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key: 'main', ...customSettings });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    console.log('✅ 自定义设置保存成功!');
    console.log('保存的设置:', customSettings);
    
    // 验证保存是否成功
    const savedSettings = await new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('main');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    console.log('✅ 验证保存的设置:', savedSettings);
    
  } catch (error) {
    console.error('❌ 保存设置失败:', error);
  }
}

// 立即执行
saveCustomSettings();