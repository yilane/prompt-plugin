console.log('Background script loaded.');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Prompt Plugin installed.');
  // 在这里可以添加一些初始化逻辑，例如创建默认分类或加载预设数据
}); 