// 重新保存用户设置
const userSettings = {
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

// 打开数据库
const request = indexedDB.open('AI-Prompts-DB', 2);

request.onsuccess = function() {
    const db = request.result;
    console.log('数据库打开成功');
    
    // 保存设置
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');
    const putRequest = store.put({ key: 'main', ...userSettings });
    
    putRequest.onsuccess = function() {
        console.log('用户设置保存成功');
        console.log('保存的设置:', userSettings);
    };
    
    putRequest.onerror = function() {
        console.error('保存设置失败:', putRequest.error);
    };
};

request.onerror = function() {
    console.error('无法打开数据库:', request.error);
};