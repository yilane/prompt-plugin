// 调试设置脚本
console.log('开始调试设置...');

// 打开数据库
const request = indexedDB.open('AI-Prompts-DB', 2);

request.onerror = function() {
    console.error('无法打开数据库:', request.error);
};

request.onsuccess = function() {
    const db = request.result;
    console.log('数据库打开成功');
    
    // 读取设置
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');
    const getRequest = store.get('main');
    
    getRequest.onsuccess = function() {
        const settings = getRequest.result;
        console.log('数据库中的设置:', settings);
        
        if (settings) {
            console.log('设置存在');
            console.log('triggerSequences:', settings.triggerSequences);
            if (settings.triggerSequences) {
                console.log('triggerSequences 长度:', settings.triggerSequences.length);
                settings.triggerSequences.forEach((seq, index) => {
                    console.log(`序列 ${index}:`, seq);
                });
            }
        } else {
            console.log('数据库中没有设置，将使用默认设置');
        }
    };
    
    getRequest.onerror = function() {
        console.error('读取设置失败:', getRequest.error);
    };
};

request.onupgradeneeded = function() {
    console.log('数据库需要升级');
};