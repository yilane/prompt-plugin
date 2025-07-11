// 检查IndexedDB在不同页面中的共享情况
async function checkIndexedDBSharing() {
  console.log('=== IndexedDB 共享检查 ===');
  console.log('当前页面URL:', window.location.href);
  console.log('当前域名:', window.location.origin);
  
  try {
    // 检查数据库是否存在
    const databases = await indexedDB.databases();
    console.log('可用的数据库:', databases);
    
    // 打开AI-Prompts-DB数据库
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('AI-Prompts-DB', 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        console.log('数据库正在升级...');
      };
    });
    
    console.log('数据库打开成功:', db.name, 'version:', db.version);
    console.log('对象存储:', Array.from(db.objectStoreNames));
    
    // 检查settings表
    const settingsData = await new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('main');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    
    if (settingsData) {
      console.log('✅ 找到设置数据');
      console.log('设置内容:', settingsData);
      console.log('触发序列数量:', settingsData.triggerSequences ? settingsData.triggerSequences.length : 0);
      if (settingsData.triggerSequences) {
        settingsData.triggerSequences.forEach((seq, index) => {
          console.log(`序列 ${index + 1}:`, seq);
        });
      }
    } else {
      console.log('❌ 没有找到设置数据');
    }
    
    // 检查是否是扩展环境
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      console.log('✅ 运行在Chrome扩展环境中');
      console.log('扩展ID:', chrome.runtime.id);
    } else {
      console.log('❌ 不在扩展环境中运行');
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ 检查失败:', error);
  }
}

// 立即执行
checkIndexedDBSharing();

// 监听storage事件
window.addEventListener('storage', (e) => {
  console.log('Storage事件:', e);
});

// 每5秒检查一次数据库内容
setInterval(async () => {
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('AI-Prompts-DB', 2);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    
    const settingsData = await new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('main');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    
    const triggerCount = settingsData && settingsData.triggerSequences ? settingsData.triggerSequences.length : 0;
    console.log(`[${new Date().toLocaleTimeString()}] 触发序列数量:`, triggerCount);
    
    db.close();
  } catch (error) {
    console.log(`[${new Date().toLocaleTimeString()}] 检查失败:`, error.message);
  }
}, 5000);