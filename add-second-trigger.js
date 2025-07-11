// 直接在数据库中添加第二个触发序列进行测试
async function addSecondTriggerSequence() {
  const settingsWithTwoSequences = {
    theme: "system",
    language: "zh", 
    triggerSequences: [
      {
        id: "default-1",
        value: "@@",
        enabled: true
      },
      {
        id: "seq-" + Date.now(),
        value: "//",
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
      const request = store.put({ key: 'main', ...settingsWithTwoSequences });
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    console.log('✅ 已添加第二个触发序列!');
    console.log('保存的设置:', settingsWithTwoSequences);
    
    // 验证保存是否成功
    const savedSettings = await new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('main');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });

    console.log('✅ 验证保存的设置:', savedSettings);
    console.log('✅ 触发序列数量:', savedSettings.triggerSequences.length);
    
  } catch (error) {
    console.error('❌ 添加触发序列失败:', error);
  }
}

// 立即执行
addSecondTriggerSequence();