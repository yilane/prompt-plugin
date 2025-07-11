var background = function() {
  "use strict";
  var _a, _b;
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  const browser$1 = ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) ? globalThis.browser : globalThis.chrome;
  const browser = browser$1;
  const STORAGE_KEYS = {
    PROMPTS: "ai-prompts-prompts",
    CATEGORIES: "ai-prompts-categories",
    SETTINGS: "ai-prompts-settings",
    USAGE_STATS: "ai-prompts-usage-stats"
  };
  class StorageManager {
    // 初始化 - chrome.storage不需要初始化
    async init() {
      return Promise.resolve();
    }
    // 通用的存储操作方法
    async getFromStorage(key) {
      const result2 = await browser.storage.local.get(key);
      return result2[key];
    }
    async setToStorage(key, value) {
      await browser.storage.local.set({ [key]: value });
    }
    // 提示词相关操作
    async getAllPrompts() {
      const prompts = await this.getFromStorage(STORAGE_KEYS.PROMPTS);
      return prompts || [];
    }
    async getPrompt(id) {
      const prompts = await this.getAllPrompts();
      return prompts.find((p) => p.id === id);
    }
    async savePrompt(prompt) {
      const prompts = await this.getAllPrompts();
      const index = prompts.findIndex((p) => p.id === prompt.id);
      if (index >= 0) {
        prompts[index] = prompt;
      } else {
        prompts.push(prompt);
      }
      await this.setToStorage(STORAGE_KEYS.PROMPTS, prompts);
    }
    async deletePrompt(id) {
      const prompts = await this.getAllPrompts();
      const filteredPrompts = prompts.filter((p) => p.id !== id);
      await this.setToStorage(STORAGE_KEYS.PROMPTS, filteredPrompts);
    }
    async getPromptsByCategory(category) {
      const prompts = await this.getAllPrompts();
      return prompts.filter((p) => p.category === category);
    }
    // 分类相关操作
    async getAllCategories() {
      const categories = await this.getFromStorage(STORAGE_KEYS.CATEGORIES);
      return categories || [];
    }
    async getCategory(id) {
      const categories = await this.getAllCategories();
      return categories.find((c) => c.id === id);
    }
    async addCategory(category) {
      const id = this.generateId();
      const newCategory = { ...category, id };
      const categories = await this.getAllCategories();
      categories.push(newCategory);
      await this.setToStorage(STORAGE_KEYS.CATEGORIES, categories);
      return newCategory;
    }
    async updateCategory(id, updates) {
      const categories = await this.getAllCategories();
      const index = categories.findIndex((c) => c.id === id);
      if (index === -1) throw new Error(`Category with id ${id} not found`);
      const updatedCategory = { ...categories[index], ...updates };
      categories[index] = updatedCategory;
      await this.setToStorage(STORAGE_KEYS.CATEGORIES, categories);
      return updatedCategory;
    }
    async deleteCategory(id) {
      const categories = await this.getAllCategories();
      const filteredCategories = categories.filter((c) => c.id !== id);
      await this.setToStorage(STORAGE_KEYS.CATEGORIES, filteredCategories);
    }
    async updateCategoriesOrder(categories) {
      await this.setToStorage(STORAGE_KEYS.CATEGORIES, categories);
    }
    async saveCategory(category) {
      const categories = await this.getAllCategories();
      const index = categories.findIndex((c) => c.id === category.id);
      if (index >= 0) {
        categories[index] = category;
      } else {
        categories.push(category);
      }
      await this.setToStorage(STORAGE_KEYS.CATEGORIES, categories);
    }
    // 设置相关操作
    async getSettings() {
      const settings = await this.getFromStorage(STORAGE_KEYS.SETTINGS);
      const defaultSettings = this.getDefaultSettings();
      console.log("AI-Prompts: Raw settings from Chrome Storage:", settings);
      console.log("AI-Prompts: Default settings:", defaultSettings);
      if (!settings) {
        console.log("AI-Prompts: No settings found in storage, initializing with custom settings");
        const initialSettings = {
          theme: "system",
          language: "zh",
          triggerSequences: [
            { id: "default-1", value: "@@", enabled: true }
          ],
          enableQuickInsert: true,
          enableKeyboardShortcuts: true,
          enableNotifications: true,
          autoBackup: false,
          maxRecentPrompts: 10
        };
        await this.saveSettings(initialSettings);
        console.log("AI-Prompts: Initial settings saved:", initialSettings);
        await this.setToStorage(STORAGE_KEYS.PROMPTS, []);
        console.log("AI-Prompts: Initialized prompts list to empty.");
        await this.initializeSampleCategories();
        return initialSettings;
      }
      if (settings && settings.triggerKey && !settings.triggerSequences) {
        settings.triggerSequences = [{ id: "default-1", value: settings.triggerKey, enabled: true }];
        delete settings.triggerKey;
        await this.saveSettings(settings);
      }
      const finalSettings = { ...defaultSettings, ...settings };
      const existingCategories = await this.getAllCategories();
      if (existingCategories.length === 0) {
        console.log("AI-Prompts: No categories found, initializing sample categories");
        await this.initializeSampleCategories();
      }
      console.log("AI-Prompts: Settings object exists:", !!settings);
      console.log("AI-Prompts: Settings has triggerSequences:", !!(settings && settings.triggerSequences));
      console.log("AI-Prompts: Settings triggerSequences length:", settings && settings.triggerSequences ? settings.triggerSequences.length : 0);
      console.log("AI-Prompts: Settings triggerSequences content:", settings && settings.triggerSequences ? settings.triggerSequences : "undefined");
      if (settings && settings.triggerSequences && settings.triggerSequences.length > 0) {
        console.log("AI-Prompts: Using user custom triggerSequences");
        finalSettings.triggerSequences = settings.triggerSequences;
      } else {
        console.log("AI-Prompts: Using default triggerSequences");
      }
      console.log("AI-Prompts: Final merged settings:", finalSettings);
      console.log("AI-Prompts: Final triggerSequences:", finalSettings.triggerSequences);
      return finalSettings;
    }
    async saveSettings(settings) {
      console.log("AI-Prompts: Saving settings to Chrome Storage:", settings);
      await this.setToStorage(STORAGE_KEYS.SETTINGS, settings);
    }
    getDefaultSettings() {
      return {
        theme: "system",
        language: "zh",
        triggerSequences: [{ id: "default-1", value: "@@", enabled: true }],
        enableQuickInsert: true,
        enableKeyboardShortcuts: true,
        enableNotifications: true,
        autoBackup: false,
        maxRecentPrompts: 10
      };
    }
    // 使用统计相关操作
    async getUsageStats() {
      const stats = await this.getFromStorage(STORAGE_KEYS.USAGE_STATS);
      return stats || [];
    }
    async updateUsageStats(promptId) {
      const allStats = await this.getUsageStats();
      const existing = allStats.find((s) => s.promptId === promptId);
      const stats = {
        promptId,
        count: existing ? existing.count + 1 : 1,
        lastUsed: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (existing) {
        const index = allStats.findIndex((s) => s.promptId === promptId);
        allStats[index] = stats;
      } else {
        allStats.push(stats);
      }
      await this.setToStorage(STORAGE_KEYS.USAGE_STATS, allStats);
    }
    // 数据导入导出
    async exportData() {
      const [prompts, categories, settings] = await Promise.all([
        this.getAllPrompts(),
        this.getAllCategories(),
        this.getSettings()
      ]);
      return JSON.stringify({
        version: 2,
        exportTime: (/* @__PURE__ */ new Date()).toISOString(),
        data: { prompts, categories, settings }
      });
    }
    async importData(jsonData) {
      const data = JSON.parse(jsonData);
      if (data.data.prompts) {
        await this.setToStorage(STORAGE_KEYS.PROMPTS, data.data.prompts);
      }
      if (data.data.categories) {
        await this.setToStorage(STORAGE_KEYS.CATEGORIES, data.data.categories);
      }
      if (data.data.settings) {
        await this.saveSettings(data.data.settings);
      }
    }
    // 清空所有数据
    async clearAllData() {
      await browser.storage.local.remove([
        STORAGE_KEYS.PROMPTS,
        STORAGE_KEYS.CATEGORIES,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.USAGE_STATS
      ]);
    }
    generateId() {
      return `id-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    // 初始化示例提示词 - 此函数现在为空，以确保不会意外添加数据
    async initializeSamplePrompts() {
      return Promise.resolve();
    }
    // 初始化示例分类
    async initializeSampleCategories() {
      const sampleCategories = [
        {
          id: this.generateId(),
          name: "编程",
          description: "编程相关的提示词",
          icon: "💻",
          sort: 1,
          isCustom: false
        },
        {
          id: this.generateId(),
          name: "写作",
          description: "写作相关的提示词",
          icon: "✍️",
          sort: 2,
          isCustom: false
        },
        {
          id: this.generateId(),
          name: "翻译",
          description: "翻译相关的提示词",
          icon: "🌐",
          sort: 3,
          isCustom: false
        },
        {
          id: this.generateId(),
          name: "分析",
          description: "数据分析相关的提示词",
          icon: "📊",
          sort: 4,
          isCustom: false
        },
        {
          id: this.generateId(),
          name: "创意",
          description: "创意策划相关的提示词",
          icon: "🎨",
          sort: 5,
          isCustom: false
        },
        {
          id: this.generateId(),
          name: "产品",
          description: "产品管理相关的提示词",
          icon: "📋",
          sort: 6,
          isCustom: false
        }
      ];
      for (const category of sampleCategories) {
        await this.saveCategory(category);
      }
      console.log("AI-Prompts: Sample categories initialized:", sampleCategories.length);
    }
  }
  const storage = new StorageManager();
  async function initializeDatabase() {
    await storage.init();
  }
  background;
  console.log("AI-Prompts: Background script loaded. Initializing database...");
  initializeDatabase().then(() => {
    console.log("AI-Prompts: Database initialized successfully.");
  }).catch((error) => {
    console.error("AI-Prompts: Database initialization failed:", error);
  });
  const definition = defineBackground(() => {
    browser.action.onClicked.addListener(() => {
      browser.tabs.create({
        url: "/dashboard.html"
      });
    });
  });
  background;
  function initPlugins() {
  }
  var _MatchPattern = class {
    constructor(matchPattern) {
      if (matchPattern === "<all_urls>") {
        this.isAllUrls = true;
        this.protocolMatches = [..._MatchPattern.PROTOCOLS];
        this.hostnameMatch = "*";
        this.pathnameMatch = "*";
      } else {
        const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
        if (groups == null)
          throw new InvalidMatchPattern(matchPattern, "Incorrect format");
        const [_, protocol, hostname, pathname] = groups;
        validateProtocol(matchPattern, protocol);
        validateHostname(matchPattern, hostname);
        this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
        this.hostnameMatch = hostname;
        this.pathnameMatch = pathname;
      }
    }
    includes(url) {
      if (this.isAllUrls)
        return true;
      const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
      return !!this.protocolMatches.find((protocol) => {
        if (protocol === "http")
          return this.isHttpMatch(u);
        if (protocol === "https")
          return this.isHttpsMatch(u);
        if (protocol === "file")
          return this.isFileMatch(u);
        if (protocol === "ftp")
          return this.isFtpMatch(u);
        if (protocol === "urn")
          return this.isUrnMatch(u);
      });
    }
    isHttpMatch(url) {
      return url.protocol === "http:" && this.isHostPathMatch(url);
    }
    isHttpsMatch(url) {
      return url.protocol === "https:" && this.isHostPathMatch(url);
    }
    isHostPathMatch(url) {
      if (!this.hostnameMatch || !this.pathnameMatch)
        return false;
      const hostnameMatchRegexs = [
        this.convertPatternToRegex(this.hostnameMatch),
        this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))
      ];
      const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
      return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
    }
    isFileMatch(url) {
      throw Error("Not implemented: file:// pattern matching. Open a PR to add support");
    }
    isFtpMatch(url) {
      throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
    }
    isUrnMatch(url) {
      throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
    }
    convertPatternToRegex(pattern) {
      const escaped = this.escapeForRegex(pattern);
      const starsReplaced = escaped.replace(/\\\*/g, ".*");
      return RegExp(`^${starsReplaced}$`);
    }
    escapeForRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  };
  var MatchPattern = _MatchPattern;
  MatchPattern.PROTOCOLS = ["http", "https", "file", "ftp", "urn"];
  var InvalidMatchPattern = class extends Error {
    constructor(matchPattern, reason) {
      super(`Invalid match pattern "${matchPattern}": ${reason}`);
    }
  };
  function validateProtocol(matchPattern, protocol) {
    if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*")
      throw new InvalidMatchPattern(
        matchPattern,
        `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`
      );
  }
  function validateHostname(matchPattern, hostname) {
    if (hostname.includes(":"))
      throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
    if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*."))
      throw new InvalidMatchPattern(
        matchPattern,
        `If using a wildcard (*), it must go at the start of the hostname`
      );
  }
  function print(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger = {
    debug: (...args) => print(console.debug, ...args),
    log: (...args) => print(console.log, ...args),
    warn: (...args) => print(console.warn, ...args),
    error: (...args) => print(console.error, ...args)
  };
  let ws;
  function getDevServerWebSocket() {
    if (ws == null) {
      const serverUrl = "http://localhost:1951";
      logger.debug("Connecting to dev server @", serverUrl);
      ws = new WebSocket(serverUrl, "vite-hmr");
      ws.addWxtEventListener = ws.addEventListener.bind(ws);
      ws.sendCustom = (event, payload) => ws == null ? void 0 : ws.send(JSON.stringify({ type: "custom", event, payload }));
      ws.addEventListener("open", () => {
        logger.debug("Connected to dev server");
      });
      ws.addEventListener("close", () => {
        logger.debug("Disconnected from dev server");
      });
      ws.addEventListener("error", (event) => {
        logger.error("Failed to connect to dev server", event);
      });
      ws.addEventListener("message", (e) => {
        try {
          const message = JSON.parse(e.data);
          if (message.type === "custom") {
            ws == null ? void 0 : ws.dispatchEvent(
              new CustomEvent(message.event, { detail: message.data })
            );
          }
        } catch (err) {
          logger.error("Failed to handle message", err);
        }
      });
    }
    return ws;
  }
  function keepServiceWorkerAlive() {
    setInterval(async () => {
      await browser.runtime.getPlatformInfo();
    }, 5e3);
  }
  function reloadContentScript(payload) {
    const manifest = browser.runtime.getManifest();
    if (manifest.manifest_version == 2) {
      void reloadContentScriptMv2();
    } else {
      void reloadContentScriptMv3(payload);
    }
  }
  async function reloadContentScriptMv3({
    registration,
    contentScript
  }) {
    if (registration === "runtime") {
      await reloadRuntimeContentScriptMv3(contentScript);
    } else {
      await reloadManifestContentScriptMv3(contentScript);
    }
  }
  async function reloadManifestContentScriptMv3(contentScript) {
    const id = `wxt:${contentScript.js[0]}`;
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const existing = registered.find((cs) => cs.id === id);
    if (existing) {
      logger.debug("Updating content script", existing);
      await browser.scripting.updateContentScripts([{ ...contentScript, id }]);
    } else {
      logger.debug("Registering new content script...");
      await browser.scripting.registerContentScripts([{ ...contentScript, id }]);
    }
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadRuntimeContentScriptMv3(contentScript) {
    logger.log("Reloading content script:", contentScript);
    const registered = await browser.scripting.getRegisteredContentScripts();
    logger.debug("Existing scripts:", registered);
    const matches = registered.filter((cs) => {
      var _a2, _b2;
      const hasJs = (_a2 = contentScript.js) == null ? void 0 : _a2.find((js) => {
        var _a3;
        return (_a3 = cs.js) == null ? void 0 : _a3.includes(js);
      });
      const hasCss = (_b2 = contentScript.css) == null ? void 0 : _b2.find((css) => {
        var _a3;
        return (_a3 = cs.css) == null ? void 0 : _a3.includes(css);
      });
      return hasJs || hasCss;
    });
    if (matches.length === 0) {
      logger.log(
        "Content script is not registered yet, nothing to reload",
        contentScript
      );
      return;
    }
    await browser.scripting.updateContentScripts(matches);
    await reloadTabsForContentScript(contentScript);
  }
  async function reloadTabsForContentScript(contentScript) {
    const allTabs = await browser.tabs.query({});
    const matchPatterns = contentScript.matches.map(
      (match) => new MatchPattern(match)
    );
    const matchingTabs = allTabs.filter((tab) => {
      const url = tab.url;
      if (!url) return false;
      return !!matchPatterns.find((pattern) => pattern.includes(url));
    });
    await Promise.all(
      matchingTabs.map(async (tab) => {
        try {
          await browser.tabs.reload(tab.id);
        } catch (err) {
          logger.warn("Failed to reload tab:", err);
        }
      })
    );
  }
  async function reloadContentScriptMv2(_payload) {
    throw Error("TODO: reloadContentScriptMv2");
  }
  {
    try {
      const ws2 = getDevServerWebSocket();
      ws2.addWxtEventListener("wxt:reload-extension", () => {
        browser.runtime.reload();
      });
      ws2.addWxtEventListener("wxt:reload-content-script", (event) => {
        reloadContentScript(event.detail);
      });
      if (true) {
        ws2.addEventListener(
          "open",
          () => ws2.sendCustom("wxt:background-initialized")
        );
        keepServiceWorkerAlive();
      }
    } catch (err) {
      logger.error("Failed to setup web socket connection with dev server", err);
    }
    browser.commands.onCommand.addListener((command) => {
      if (command === "wxt:reload-extension") {
        browser.runtime.reload();
      }
    });
  }
  let result;
  try {
    initPlugins();
    result = definition.main();
    if (result instanceof Promise) {
      console.warn(
        "The background's main() function return a promise, but it must be synchronous"
      );
    }
  } catch (err) {
    logger.error("The background crashed on startup!");
    throw err;
  }
  const result$1 = result;
  return result$1;
}();
background;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9Ad3h0LWRldi9icm93c2VyL3NyYy9pbmRleC5tanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi9zcmMvdXRpbHMvc3RvcmFnZS50cyIsIi4uLy4uL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQHdlYmV4dC1jb3JlL21hdGNoLXBhdHRlcm5zL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gZGVmaW5lQmFja2dyb3VuZChhcmcpIHtcbiAgaWYgKGFyZyA9PSBudWxsIHx8IHR5cGVvZiBhcmcgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHsgbWFpbjogYXJnIH07XG4gIHJldHVybiBhcmc7XG59XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIF9icm93c2VyIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbmV4cG9ydCBjb25zdCBicm93c2VyID0gX2Jyb3dzZXI7XG5leHBvcnQge307XG4iLCJpbXBvcnQgdHlwZSB7IFByb21wdCwgQ2F0ZWdvcnksIFNldHRpbmdzLCBVc2FnZVN0YXRzIH0gZnJvbSAnLi4vdHlwZXMnXG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnd3h0L2Jyb3dzZXInXG5cbmNvbnN0IFNUT1JBR0VfS0VZUyA9IHtcbiAgUFJPTVBUUzogJ2FpLXByb21wdHMtcHJvbXB0cycsXG4gIENBVEVHT1JJRVM6ICdhaS1wcm9tcHRzLWNhdGVnb3JpZXMnLFxuICBTRVRUSU5HUzogJ2FpLXByb21wdHMtc2V0dGluZ3MnLFxuICBVU0FHRV9TVEFUUzogJ2FpLXByb21wdHMtdXNhZ2Utc3RhdHMnXG59IGFzIGNvbnN0XG5cbmV4cG9ydCBjbGFzcyBTdG9yYWdlTWFuYWdlciB7XG4gIC8vIOWIneWni+WMliAtIGNocm9tZS5zdG9yYWdl5LiN6ZyA6KaB5Yid5aeL5YyWXG4gIGFzeW5jIGluaXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gY2hyb21lLnN0b3JhZ2UgQVBJIOS4jemcgOimgeWIneWni+WMllxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICB9XG5cbiAgLy8g6YCa55So55qE5a2Y5YKo5pON5L2c5pa55rOVXG4gIHByaXZhdGUgYXN5bmMgZ2V0RnJvbVN0b3JhZ2U8VD4oa2V5OiBzdHJpbmcpOiBQcm9taXNlPFQgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBicm93c2VyLnN0b3JhZ2UubG9jYWwuZ2V0KGtleSlcbiAgICByZXR1cm4gcmVzdWx0W2tleV1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2V0VG9TdG9yYWdlPFQ+KGtleTogc3RyaW5nLCB2YWx1ZTogVCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IGJyb3dzZXIuc3RvcmFnZS5sb2NhbC5zZXQoeyBba2V5XTogdmFsdWUgfSlcbiAgfVxuXG4gIC8vIOaPkOekuuivjeebuOWFs+aTjeS9nFxuICBhc3luYyBnZXRBbGxQcm9tcHRzKCk6IFByb21pc2U8UHJvbXB0W10+IHtcbiAgICBjb25zdCBwcm9tcHRzID0gYXdhaXQgdGhpcy5nZXRGcm9tU3RvcmFnZTxQcm9tcHRbXT4oU1RPUkFHRV9LRVlTLlBST01QVFMpXG4gICAgcmV0dXJuIHByb21wdHMgfHwgW11cbiAgfVxuXG4gIGFzeW5jIGdldFByb21wdChpZDogc3RyaW5nKTogUHJvbWlzZTxQcm9tcHQgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBwcm9tcHRzID0gYXdhaXQgdGhpcy5nZXRBbGxQcm9tcHRzKClcbiAgICByZXR1cm4gcHJvbXB0cy5maW5kKHAgPT4gcC5pZCA9PT0gaWQpXG4gIH1cblxuICBhc3luYyBzYXZlUHJvbXB0KHByb21wdDogUHJvbXB0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgcHJvbXB0cyA9IGF3YWl0IHRoaXMuZ2V0QWxsUHJvbXB0cygpXG4gICAgY29uc3QgaW5kZXggPSBwcm9tcHRzLmZpbmRJbmRleChwID0+IHAuaWQgPT09IHByb21wdC5pZClcblxuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICBwcm9tcHRzW2luZGV4XSA9IHByb21wdFxuICAgIH0gZWxzZSB7XG4gICAgICBwcm9tcHRzLnB1c2gocHJvbXB0KVxuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuc2V0VG9TdG9yYWdlKFNUT1JBR0VfS0VZUy5QUk9NUFRTLCBwcm9tcHRzKVxuICB9XG5cbiAgYXN5bmMgZGVsZXRlUHJvbXB0KGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwcm9tcHRzID0gYXdhaXQgdGhpcy5nZXRBbGxQcm9tcHRzKClcbiAgICBjb25zdCBmaWx0ZXJlZFByb21wdHMgPSBwcm9tcHRzLmZpbHRlcihwID0+IHAuaWQgIT09IGlkKVxuICAgIGF3YWl0IHRoaXMuc2V0VG9TdG9yYWdlKFNUT1JBR0VfS0VZUy5QUk9NUFRTLCBmaWx0ZXJlZFByb21wdHMpXG4gIH1cblxuICBhc3luYyBnZXRQcm9tcHRzQnlDYXRlZ29yeShjYXRlZ29yeTogc3RyaW5nKTogUHJvbWlzZTxQcm9tcHRbXT4ge1xuICAgIGNvbnN0IHByb21wdHMgPSBhd2FpdCB0aGlzLmdldEFsbFByb21wdHMoKVxuICAgIHJldHVybiBwcm9tcHRzLmZpbHRlcihwID0+IHAuY2F0ZWdvcnkgPT09IGNhdGVnb3J5KVxuICB9XG5cbiAgLy8g5YiG57G755u45YWz5pON5L2cXG4gIGFzeW5jIGdldEFsbENhdGVnb3JpZXMoKTogUHJvbWlzZTxDYXRlZ29yeVtdPiB7XG4gICAgY29uc3QgY2F0ZWdvcmllcyA9IGF3YWl0IHRoaXMuZ2V0RnJvbVN0b3JhZ2U8Q2F0ZWdvcnlbXT4oU1RPUkFHRV9LRVlTLkNBVEVHT1JJRVMpXG4gICAgcmV0dXJuIGNhdGVnb3JpZXMgfHwgW11cbiAgfVxuXG4gIGFzeW5jIGdldENhdGVnb3J5KGlkOiBzdHJpbmcpOiBQcm9taXNlPENhdGVnb3J5IHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgY2F0ZWdvcmllcyA9IGF3YWl0IHRoaXMuZ2V0QWxsQ2F0ZWdvcmllcygpXG4gICAgcmV0dXJuIGNhdGVnb3JpZXMuZmluZChjID0+IGMuaWQgPT09IGlkKVxuICB9XG5cbiAgYXN5bmMgYWRkQ2F0ZWdvcnkoY2F0ZWdvcnk6IE9taXQ8Q2F0ZWdvcnksICdpZCc+KTogUHJvbWlzZTxDYXRlZ29yeT4ge1xuICAgIGNvbnN0IGlkID0gdGhpcy5nZW5lcmF0ZUlkKCk7XG4gICAgY29uc3QgbmV3Q2F0ZWdvcnkgPSB7IC4uLmNhdGVnb3J5LCBpZCB9O1xuXG4gICAgY29uc3QgY2F0ZWdvcmllcyA9IGF3YWl0IHRoaXMuZ2V0QWxsQ2F0ZWdvcmllcygpXG4gICAgY2F0ZWdvcmllcy5wdXNoKG5ld0NhdGVnb3J5KVxuICAgIGF3YWl0IHRoaXMuc2V0VG9TdG9yYWdlKFNUT1JBR0VfS0VZUy5DQVRFR09SSUVTLCBjYXRlZ29yaWVzKVxuXG4gICAgcmV0dXJuIG5ld0NhdGVnb3J5O1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlQ2F0ZWdvcnkoaWQ6IHN0cmluZywgdXBkYXRlczogUGFydGlhbDxDYXRlZ29yeT4pOiBQcm9taXNlPENhdGVnb3J5PiB7XG4gICAgY29uc3QgY2F0ZWdvcmllcyA9IGF3YWl0IHRoaXMuZ2V0QWxsQ2F0ZWdvcmllcygpXG4gICAgY29uc3QgaW5kZXggPSBjYXRlZ29yaWVzLmZpbmRJbmRleChjID0+IGMuaWQgPT09IGlkKVxuXG4gICAgaWYgKGluZGV4ID09PSAtMSkgdGhyb3cgbmV3IEVycm9yKGBDYXRlZ29yeSB3aXRoIGlkICR7aWR9IG5vdCBmb3VuZGApXG5cbiAgICBjb25zdCB1cGRhdGVkQ2F0ZWdvcnkgPSB7IC4uLmNhdGVnb3JpZXNbaW5kZXhdLCAuLi51cGRhdGVzIH1cbiAgICBjYXRlZ29yaWVzW2luZGV4XSA9IHVwZGF0ZWRDYXRlZ29yeVxuICAgIGF3YWl0IHRoaXMuc2V0VG9TdG9yYWdlKFNUT1JBR0VfS0VZUy5DQVRFR09SSUVTLCBjYXRlZ29yaWVzKVxuXG4gICAgcmV0dXJuIHVwZGF0ZWRDYXRlZ29yeTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZUNhdGVnb3J5KGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBjYXRlZ29yaWVzID0gYXdhaXQgdGhpcy5nZXRBbGxDYXRlZ29yaWVzKClcbiAgICBjb25zdCBmaWx0ZXJlZENhdGVnb3JpZXMgPSBjYXRlZ29yaWVzLmZpbHRlcihjID0+IGMuaWQgIT09IGlkKVxuICAgIGF3YWl0IHRoaXMuc2V0VG9TdG9yYWdlKFNUT1JBR0VfS0VZUy5DQVRFR09SSUVTLCBmaWx0ZXJlZENhdGVnb3JpZXMpXG4gIH1cblxuICBhc3luYyB1cGRhdGVDYXRlZ29yaWVzT3JkZXIoY2F0ZWdvcmllczogQ2F0ZWdvcnlbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2V0VG9TdG9yYWdlKFNUT1JBR0VfS0VZUy5DQVRFR09SSUVTLCBjYXRlZ29yaWVzKVxuICB9XG5cbiAgYXN5bmMgc2F2ZUNhdGVnb3J5KGNhdGVnb3J5OiBDYXRlZ29yeSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGNhdGVnb3JpZXMgPSBhd2FpdCB0aGlzLmdldEFsbENhdGVnb3JpZXMoKVxuICAgIGNvbnN0IGluZGV4ID0gY2F0ZWdvcmllcy5maW5kSW5kZXgoYyA9PiBjLmlkID09PSBjYXRlZ29yeS5pZClcblxuICAgIGlmIChpbmRleCA+PSAwKSB7XG4gICAgICBjYXRlZ29yaWVzW2luZGV4XSA9IGNhdGVnb3J5XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhdGVnb3JpZXMucHVzaChjYXRlZ29yeSlcbiAgICB9XG5cbiAgICBhd2FpdCB0aGlzLnNldFRvU3RvcmFnZShTVE9SQUdFX0tFWVMuQ0FURUdPUklFUywgY2F0ZWdvcmllcylcbiAgfVxuXG4gIC8vIOiuvue9ruebuOWFs+aTjeS9nFxuICBhc3luYyBnZXRTZXR0aW5ncygpOiBQcm9taXNlPFNldHRpbmdzPiB7XG4gICAgY29uc3Qgc2V0dGluZ3MgPSBhd2FpdCB0aGlzLmdldEZyb21TdG9yYWdlPFNldHRpbmdzPihTVE9SQUdFX0tFWVMuU0VUVElOR1MpXG4gICAgY29uc3QgZGVmYXVsdFNldHRpbmdzID0gdGhpcy5nZXREZWZhdWx0U2V0dGluZ3MoKTtcblxuICAgIGNvbnNvbGUubG9nKCdBSS1Qcm9tcHRzOiBSYXcgc2V0dGluZ3MgZnJvbSBDaHJvbWUgU3RvcmFnZTonLCBzZXR0aW5ncylcbiAgICBjb25zb2xlLmxvZygnQUktUHJvbXB0czogRGVmYXVsdCBzZXR0aW5nczonLCBkZWZhdWx0U2V0dGluZ3MpXG5cbiAgICAvLyDlpoLmnpzmsqHmnInorr7nva7vvIzliJ3lp4vljJbnlKjmiLfoh6rlrprkuYnorr7nva5cbiAgICBpZiAoIXNldHRpbmdzKSB7XG4gICAgICBjb25zb2xlLmxvZygnQUktUHJvbXB0czogTm8gc2V0dGluZ3MgZm91bmQgaW4gc3RvcmFnZSwgaW5pdGlhbGl6aW5nIHdpdGggY3VzdG9tIHNldHRpbmdzJylcbiAgICAgIGNvbnN0IGluaXRpYWxTZXR0aW5nczogU2V0dGluZ3MgPSB7XG4gICAgICAgIHRoZW1lOiAnc3lzdGVtJyxcbiAgICAgICAgbGFuZ3VhZ2U6ICd6aCcsXG4gICAgICAgIHRyaWdnZXJTZXF1ZW5jZXM6IFtcbiAgICAgICAgICB7IGlkOiAnZGVmYXVsdC0xJywgdmFsdWU6ICdAQCcsIGVuYWJsZWQ6IHRydWUgfVxuICAgICAgICBdLFxuICAgICAgICBlbmFibGVRdWlja0luc2VydDogdHJ1ZSxcbiAgICAgICAgZW5hYmxlS2V5Ym9hcmRTaG9ydGN1dHM6IHRydWUsXG4gICAgICAgIGVuYWJsZU5vdGlmaWNhdGlvbnM6IHRydWUsXG4gICAgICAgIGF1dG9CYWNrdXA6IGZhbHNlLFxuICAgICAgICBtYXhSZWNlbnRQcm9tcHRzOiAxMFxuICAgICAgfVxuXG4gICAgICAvLyDnq4vljbPkv53lrZjliJ3lp4vorr7nva5cbiAgICAgIGF3YWl0IHRoaXMuc2F2ZVNldHRpbmdzKGluaXRpYWxTZXR0aW5ncylcbiAgICAgIGNvbnNvbGUubG9nKCdBSS1Qcm9tcHRzOiBJbml0aWFsIHNldHRpbmdzIHNhdmVkOicsIGluaXRpYWxTZXR0aW5ncylcblxuICAgICAgLy8g5riF6Zmk5pen55qE5o+Q56S66K+N5pWw5o2u77yM5bm26K6+572u5Li656m65YiX6KGoXG4gICAgICBhd2FpdCB0aGlzLnNldFRvU3RvcmFnZShTVE9SQUdFX0tFWVMuUFJPTVBUUywgW10pXG4gICAgICBjb25zb2xlLmxvZygnQUktUHJvbXB0czogSW5pdGlhbGl6ZWQgcHJvbXB0cyBsaXN0IHRvIGVtcHR5LicpXG5cbiAgICAgIC8vIOWIneWni+WMluekuuS+i+WIhuexu1xuICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplU2FtcGxlQ2F0ZWdvcmllcygpXG5cbiAgICAgIHJldHVybiBpbml0aWFsU2V0dGluZ3NcbiAgICB9XG5cbiAgICAvLyDlkJHkuIrlhbzlrrnvvJrlpITnkIbml6fmlbDmja7nu5PmnoTov4Hnp7tcbiAgICBpZiAoc2V0dGluZ3MgJiYgKHNldHRpbmdzIGFzIGFueSkudHJpZ2dlcktleSAmJiAhc2V0dGluZ3MudHJpZ2dlclNlcXVlbmNlcykge1xuICAgICAgICBzZXR0aW5ncy50cmlnZ2VyU2VxdWVuY2VzID0gW3sgaWQ6ICdkZWZhdWx0LTEnLCB2YWx1ZTogKHNldHRpbmdzIGFzIGFueSkudHJpZ2dlcktleSwgZW5hYmxlZDogdHJ1ZSB9XTtcbiAgICAgICAgZGVsZXRlIChzZXR0aW5ncyBhcyBhbnkpLnRyaWdnZXJLZXk7XG4gICAgICAgIC8vIOeri+WNs+S/neWtmOi/geenu+WQjueahOiuvue9rlxuICAgICAgICBhd2FpdCB0aGlzLnNhdmVTZXR0aW5ncyhzZXR0aW5ncyk7XG4gICAgfVxuXG4gICAgLy8g5pm66IO95ZCI5bm26K6+572uXG4gICAgY29uc3QgZmluYWxTZXR0aW5ncyA9IHsgLi4uZGVmYXVsdFNldHRpbmdzLCAuLi5zZXR0aW5ncyB9XG5cbiAgICAvLyDmo4Dmn6XmmK/lkKbpnIDopoHph43mlrDliJ3lp4vljJbnpLrkvovmlbDmja5cbiAgICBjb25zdCBleGlzdGluZ0NhdGVnb3JpZXMgPSBhd2FpdCB0aGlzLmdldEFsbENhdGVnb3JpZXMoKVxuXG4gICAgaWYgKGV4aXN0aW5nQ2F0ZWdvcmllcy5sZW5ndGggPT09IDApIHtcbiAgICAgIGNvbnNvbGUubG9nKCdBSS1Qcm9tcHRzOiBObyBjYXRlZ29yaWVzIGZvdW5kLCBpbml0aWFsaXppbmcgc2FtcGxlIGNhdGVnb3JpZXMnKVxuICAgICAgYXdhaXQgdGhpcy5pbml0aWFsaXplU2FtcGxlQ2F0ZWdvcmllcygpXG4gICAgfVxuXG4gICAgLy8g6K+m57uG6LCD6K+V55So5oi36K6+572uXG4gICAgY29uc29sZS5sb2coJ0FJLVByb21wdHM6IFNldHRpbmdzIG9iamVjdCBleGlzdHM6JywgISFzZXR0aW5ncylcbiAgICBjb25zb2xlLmxvZygnQUktUHJvbXB0czogU2V0dGluZ3MgaGFzIHRyaWdnZXJTZXF1ZW5jZXM6JywgISEoc2V0dGluZ3MgJiYgc2V0dGluZ3MudHJpZ2dlclNlcXVlbmNlcykpXG4gICAgY29uc29sZS5sb2coJ0FJLVByb21wdHM6IFNldHRpbmdzIHRyaWdnZXJTZXF1ZW5jZXMgbGVuZ3RoOicsIHNldHRpbmdzICYmIHNldHRpbmdzLnRyaWdnZXJTZXF1ZW5jZXMgPyBzZXR0aW5ncy50cmlnZ2VyU2VxdWVuY2VzLmxlbmd0aCA6IDApXG4gICAgY29uc29sZS5sb2coJ0FJLVByb21wdHM6IFNldHRpbmdzIHRyaWdnZXJTZXF1ZW5jZXMgY29udGVudDonLCBzZXR0aW5ncyAmJiBzZXR0aW5ncy50cmlnZ2VyU2VxdWVuY2VzID8gc2V0dGluZ3MudHJpZ2dlclNlcXVlbmNlcyA6ICd1bmRlZmluZWQnKVxuXG4gICAgLy8g54m55q6K5aSE55CG77ya5aaC5p6c55So5oi35pyJ6Ieq5a6a5LmJ55qEdHJpZ2dlclNlcXVlbmNlc++8jOS8mOWFiOS9v+eUqOeUqOaIt+eahFxuICAgIGlmIChzZXR0aW5ncyAmJiBzZXR0aW5ncy50cmlnZ2VyU2VxdWVuY2VzICYmIHNldHRpbmdzLnRyaWdnZXJTZXF1ZW5jZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc29sZS5sb2coJ0FJLVByb21wdHM6IFVzaW5nIHVzZXIgY3VzdG9tIHRyaWdnZXJTZXF1ZW5jZXMnKVxuICAgICAgZmluYWxTZXR0aW5ncy50cmlnZ2VyU2VxdWVuY2VzID0gc2V0dGluZ3MudHJpZ2dlclNlcXVlbmNlc1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZygnQUktUHJvbXB0czogVXNpbmcgZGVmYXVsdCB0cmlnZ2VyU2VxdWVuY2VzJylcbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnQUktUHJvbXB0czogRmluYWwgbWVyZ2VkIHNldHRpbmdzOicsIGZpbmFsU2V0dGluZ3MpXG4gICAgY29uc29sZS5sb2coJ0FJLVByb21wdHM6IEZpbmFsIHRyaWdnZXJTZXF1ZW5jZXM6JywgZmluYWxTZXR0aW5ncy50cmlnZ2VyU2VxdWVuY2VzKVxuICAgIHJldHVybiBmaW5hbFNldHRpbmdzXG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3Moc2V0dGluZ3M6IFNldHRpbmdzKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc29sZS5sb2coJ0FJLVByb21wdHM6IFNhdmluZyBzZXR0aW5ncyB0byBDaHJvbWUgU3RvcmFnZTonLCBzZXR0aW5ncylcbiAgICBhd2FpdCB0aGlzLnNldFRvU3RvcmFnZShTVE9SQUdFX0tFWVMuU0VUVElOR1MsIHNldHRpbmdzKVxuICB9XG5cbiAgcHJpdmF0ZSBnZXREZWZhdWx0U2V0dGluZ3MoKTogU2V0dGluZ3Mge1xuICAgIHJldHVybiB7XG4gICAgICB0aGVtZTogJ3N5c3RlbScsXG4gICAgICBsYW5ndWFnZTogJ3poJyxcbiAgICAgIHRyaWdnZXJTZXF1ZW5jZXM6IFt7IGlkOiAnZGVmYXVsdC0xJywgdmFsdWU6ICdAQCcsIGVuYWJsZWQ6IHRydWUgfV0sXG4gICAgICBlbmFibGVRdWlja0luc2VydDogdHJ1ZSxcbiAgICAgIGVuYWJsZUtleWJvYXJkU2hvcnRjdXRzOiB0cnVlLFxuICAgICAgZW5hYmxlTm90aWZpY2F0aW9uczogdHJ1ZSxcbiAgICAgIGF1dG9CYWNrdXA6IGZhbHNlLFxuICAgICAgbWF4UmVjZW50UHJvbXB0czogMTBcbiAgICB9XG4gIH1cblxuICAvLyDkvb/nlKjnu5/orqHnm7jlhbPmk43kvZxcbiAgYXN5bmMgZ2V0VXNhZ2VTdGF0cygpOiBQcm9taXNlPFVzYWdlU3RhdHNbXT4ge1xuICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgdGhpcy5nZXRGcm9tU3RvcmFnZTxVc2FnZVN0YXRzW10+KFNUT1JBR0VfS0VZUy5VU0FHRV9TVEFUUylcbiAgICByZXR1cm4gc3RhdHMgfHwgW11cbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZVVzYWdlU3RhdHMocHJvbXB0SWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGFsbFN0YXRzID0gYXdhaXQgdGhpcy5nZXRVc2FnZVN0YXRzKClcbiAgICBjb25zdCBleGlzdGluZyA9IGFsbFN0YXRzLmZpbmQocyA9PiBzLnByb21wdElkID09PSBwcm9tcHRJZClcblxuICAgIGNvbnN0IHN0YXRzOiBVc2FnZVN0YXRzID0ge1xuICAgICAgcHJvbXB0SWQsXG4gICAgICBjb3VudDogZXhpc3RpbmcgPyBleGlzdGluZy5jb3VudCArIDEgOiAxLFxuICAgICAgbGFzdFVzZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIH1cblxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgY29uc3QgaW5kZXggPSBhbGxTdGF0cy5maW5kSW5kZXgocyA9PiBzLnByb21wdElkID09PSBwcm9tcHRJZClcbiAgICAgIGFsbFN0YXRzW2luZGV4XSA9IHN0YXRzXG4gICAgfSBlbHNlIHtcbiAgICAgIGFsbFN0YXRzLnB1c2goc3RhdHMpXG4gICAgfVxuXG4gICAgYXdhaXQgdGhpcy5zZXRUb1N0b3JhZ2UoU1RPUkFHRV9LRVlTLlVTQUdFX1NUQVRTLCBhbGxTdGF0cylcbiAgfVxuXG4gIC8vIOaVsOaNruWvvOWFpeWvvOWHulxuICBhc3luYyBleHBvcnREYXRhKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgW3Byb21wdHMsIGNhdGVnb3JpZXMsIHNldHRpbmdzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMuZ2V0QWxsUHJvbXB0cygpLFxuICAgICAgdGhpcy5nZXRBbGxDYXRlZ29yaWVzKCksXG4gICAgICB0aGlzLmdldFNldHRpbmdzKClcbiAgICBdKVxuXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHZlcnNpb246IDIsXG4gICAgICBleHBvcnRUaW1lOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBkYXRhOiB7IHByb21wdHMsIGNhdGVnb3JpZXMsIHNldHRpbmdzIH1cbiAgICB9KVxuICB9XG5cbiAgYXN5bmMgaW1wb3J0RGF0YShqc29uRGF0YTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoanNvbkRhdGEpXG5cbiAgICBpZiAoZGF0YS5kYXRhLnByb21wdHMpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0VG9TdG9yYWdlKFNUT1JBR0VfS0VZUy5QUk9NUFRTLCBkYXRhLmRhdGEucHJvbXB0cylcbiAgICB9XG5cbiAgICBpZiAoZGF0YS5kYXRhLmNhdGVnb3JpZXMpIHtcbiAgICAgIGF3YWl0IHRoaXMuc2V0VG9TdG9yYWdlKFNUT1JBR0VfS0VZUy5DQVRFR09SSUVTLCBkYXRhLmRhdGEuY2F0ZWdvcmllcylcbiAgICB9XG5cbiAgICBpZiAoZGF0YS5kYXRhLnNldHRpbmdzKSB7XG4gICAgICBhd2FpdCB0aGlzLnNhdmVTZXR0aW5ncyhkYXRhLmRhdGEuc2V0dGluZ3MpXG4gICAgfVxuICB9XG5cbiAgLy8g5riF56m65omA5pyJ5pWw5o2uXG4gIGFzeW5jIGNsZWFyQWxsRGF0YSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBicm93c2VyLnN0b3JhZ2UubG9jYWwucmVtb3ZlKFtcbiAgICAgIFNUT1JBR0VfS0VZUy5QUk9NUFRTLFxuICAgICAgU1RPUkFHRV9LRVlTLkNBVEVHT1JJRVMsXG4gICAgICBTVE9SQUdFX0tFWVMuU0VUVElOR1MsXG4gICAgICBTVE9SQUdFX0tFWVMuVVNBR0VfU1RBVFNcbiAgICBdKVxuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBpZC0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDE1KX1gXG4gIH1cblxuICAvLyDliJ3lp4vljJbnpLrkvovmj5DnpLror40gLSDmraTlh73mlbDnjrDlnKjkuLrnqbrvvIzku6Xnoa7kv53kuI3kvJrmhI/lpJbmt7vliqDmlbDmja5cbiAgcHJpdmF0ZSBhc3luYyBpbml0aWFsaXplU2FtcGxlUHJvbXB0cygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAvLyDpgLvovpHlt7Lnp7vpmaTvvIzku6Xnoa7kv53nlKjmiLfmlbDmja7kuI3kvJrooqvopobnm5ZcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgfVxuXG4gIC8vIOWIneWni+WMluekuuS+i+WIhuexu1xuICBwcml2YXRlIGFzeW5jIGluaXRpYWxpemVTYW1wbGVDYXRlZ29yaWVzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IHNhbXBsZUNhdGVnb3JpZXM6IENhdGVnb3J5W10gPSBbXG4gICAgICB7XG4gICAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQoKSxcbiAgICAgICAgbmFtZTogJ+e8lueoiycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn57yW56iL55u45YWz55qE5o+Q56S66K+NJyxcbiAgICAgICAgaWNvbjogJ/CfkrsnLFxuICAgICAgICBzb3J0OiAxLFxuICAgICAgICBpc0N1c3RvbTogZmFsc2VcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIGlkOiB0aGlzLmdlbmVyYXRlSWQoKSxcbiAgICAgICAgbmFtZTogJ+WGmeS9nCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAn5YaZ5L2c55u45YWz55qE5o+Q56S66K+NJyxcbiAgICAgICAgaWNvbjogJ+Kcje+4jycsXG4gICAgICAgIHNvcnQ6IDIsXG4gICAgICAgIGlzQ3VzdG9tOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgICBuYW1lOiAn57+76K+RJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICfnv7vor5Hnm7jlhbPnmoTmj5DnpLror40nLFxuICAgICAgICBpY29uOiAn8J+MkCcsXG4gICAgICAgIHNvcnQ6IDMsXG4gICAgICAgIGlzQ3VzdG9tOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgICBuYW1lOiAn5YiG5p6QJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICfmlbDmja7liIbmnpDnm7jlhbPnmoTmj5DnpLror40nLFxuICAgICAgICBpY29uOiAn8J+TiicsXG4gICAgICAgIHNvcnQ6IDQsXG4gICAgICAgIGlzQ3VzdG9tOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgICBuYW1lOiAn5Yib5oSPJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICfliJvmhI/nrZbliJLnm7jlhbPnmoTmj5DnpLror40nLFxuICAgICAgICBpY29uOiAn8J+OqCcsXG4gICAgICAgIHNvcnQ6IDUsXG4gICAgICAgIGlzQ3VzdG9tOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVJZCgpLFxuICAgICAgICBuYW1lOiAn5Lqn5ZOBJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICfkuqflk4HnrqHnkIbnm7jlhbPnmoTmj5DnpLror40nLFxuICAgICAgICBpY29uOiAn8J+TiycsXG4gICAgICAgIHNvcnQ6IDYsXG4gICAgICAgIGlzQ3VzdG9tOiBmYWxzZVxuICAgICAgfVxuICAgIF1cblxuICAgIC8vIOS/neWtmOekuuS+i+WIhuexu1xuICAgIGZvciAoY29uc3QgY2F0ZWdvcnkgb2Ygc2FtcGxlQ2F0ZWdvcmllcykge1xuICAgICAgYXdhaXQgdGhpcy5zYXZlQ2F0ZWdvcnkoY2F0ZWdvcnkpXG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ0FJLVByb21wdHM6IFNhbXBsZSBjYXRlZ29yaWVzIGluaXRpYWxpemVkOicsIHNhbXBsZUNhdGVnb3JpZXMubGVuZ3RoKVxuICB9XG59XG5cbi8vIOWvvOWHuuWNleS+i+WunuS+i1xuZXhwb3J0IGNvbnN0IHN0b3JhZ2UgPSBuZXcgU3RvcmFnZU1hbmFnZXIoKVxuXG4vLyDliJ3lp4vljJbmlbDmja7lupPnmoTkvr/mjbflh73mlbBcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbml0aWFsaXplRGF0YWJhc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGF3YWl0IHN0b3JhZ2UuaW5pdCgpXG59XG4iLCJpbXBvcnQgeyBpbml0aWFsaXplRGF0YWJhc2UgfSBmcm9tICcuLi9zcmMvdXRpbHMvc3RvcmFnZSc7XG5cbmNvbnNvbGUubG9nKCdBSS1Qcm9tcHRzOiBCYWNrZ3JvdW5kIHNjcmlwdCBsb2FkZWQuIEluaXRpYWxpemluZyBkYXRhYmFzZS4uLicpO1xuaW5pdGlhbGl6ZURhdGFiYXNlKCkudGhlbigoKSA9PiB7XG4gIGNvbnNvbGUubG9nKCdBSS1Qcm9tcHRzOiBEYXRhYmFzZSBpbml0aWFsaXplZCBzdWNjZXNzZnVsbHkuJyk7XG59KS5jYXRjaCgoZXJyb3I6IGFueSkgPT4ge1xuICBjb25zb2xlLmVycm9yKCdBSS1Qcm9tcHRzOiBEYXRhYmFzZSBpbml0aWFsaXphdGlvbiBmYWlsZWQ6JywgZXJyb3IpO1xufSk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUJhY2tncm91bmQoKCkgPT4ge1xuICBicm93c2VyLmFjdGlvbi5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgIGJyb3dzZXIudGFicy5jcmVhdGUoe1xuICAgICAgdXJsOiAnL2Rhc2hib2FyZC5odG1sJ1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIiwiLy8gc3JjL2luZGV4LnRzXG52YXIgX01hdGNoUGF0dGVybiA9IGNsYXNzIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuKSB7XG4gICAgaWYgKG1hdGNoUGF0dGVybiA9PT0gXCI8YWxsX3VybHM+XCIpIHtcbiAgICAgIHRoaXMuaXNBbGxVcmxzID0gdHJ1ZTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gWy4uLl9NYXRjaFBhdHRlcm4uUFJPVE9DT0xTXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IFwiKlwiO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gXCIqXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGdyb3VwcyA9IC8oLiopOlxcL1xcLyguKj8pKFxcLy4qKS8uZXhlYyhtYXRjaFBhdHRlcm4pO1xuICAgICAgaWYgKGdyb3VwcyA9PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIFwiSW5jb3JyZWN0IGZvcm1hdFwiKTtcbiAgICAgIGNvbnN0IFtfLCBwcm90b2NvbCwgaG9zdG5hbWUsIHBhdGhuYW1lXSA9IGdyb3VwcztcbiAgICAgIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCk7XG4gICAgICB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpO1xuICAgICAgdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKTtcbiAgICAgIHRoaXMucHJvdG9jb2xNYXRjaGVzID0gcHJvdG9jb2wgPT09IFwiKlwiID8gW1wiaHR0cFwiLCBcImh0dHBzXCJdIDogW3Byb3RvY29sXTtcbiAgICAgIHRoaXMuaG9zdG5hbWVNYXRjaCA9IGhvc3RuYW1lO1xuICAgICAgdGhpcy5wYXRobmFtZU1hdGNoID0gcGF0aG5hbWU7XG4gICAgfVxuICB9XG4gIGluY2x1ZGVzKHVybCkge1xuICAgIGlmICh0aGlzLmlzQWxsVXJscylcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIGNvbnN0IHUgPSB0eXBlb2YgdXJsID09PSBcInN0cmluZ1wiID8gbmV3IFVSTCh1cmwpIDogdXJsIGluc3RhbmNlb2YgTG9jYXRpb24gPyBuZXcgVVJMKHVybC5ocmVmKSA6IHVybDtcbiAgICByZXR1cm4gISF0aGlzLnByb3RvY29sTWF0Y2hlcy5maW5kKChwcm90b2NvbCkgPT4ge1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImh0dHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cHNcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNIdHRwc01hdGNoKHUpO1xuICAgICAgaWYgKHByb3RvY29sID09PSBcImZpbGVcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGaWxlTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZnRwXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzRnRwTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwidXJuXCIpXG4gICAgICAgIHJldHVybiB0aGlzLmlzVXJuTWF0Y2godSk7XG4gICAgfSk7XG4gIH1cbiAgaXNIdHRwTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG4gIH1cbiAgaXNIdHRwc01hdGNoKHVybCkge1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0hvc3RQYXRoTWF0Y2godXJsKSB7XG4gICAgaWYgKCF0aGlzLmhvc3RuYW1lTWF0Y2ggfHwgIXRoaXMucGF0aG5hbWVNYXRjaClcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICBjb25zdCBob3N0bmFtZU1hdGNoUmVnZXhzID0gW1xuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoKSxcbiAgICAgIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaC5yZXBsYWNlKC9eXFwqXFwuLywgXCJcIikpXG4gICAgXTtcbiAgICBjb25zdCBwYXRobmFtZU1hdGNoUmVnZXggPSB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLnBhdGhuYW1lTWF0Y2gpO1xuICAgIHJldHVybiAhIWhvc3RuYW1lTWF0Y2hSZWdleHMuZmluZCgocmVnZXgpID0+IHJlZ2V4LnRlc3QodXJsLmhvc3RuYW1lKSkgJiYgcGF0aG5hbWVNYXRjaFJlZ2V4LnRlc3QodXJsLnBhdGhuYW1lKTtcbiAgfVxuICBpc0ZpbGVNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZmlsZTovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgaXNGdHBNYXRjaCh1cmwpIHtcbiAgICB0aHJvdyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZDogZnRwOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc1Vybk1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiB1cm46Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGNvbnZlcnRQYXR0ZXJuVG9SZWdleChwYXR0ZXJuKSB7XG4gICAgY29uc3QgZXNjYXBlZCA9IHRoaXMuZXNjYXBlRm9yUmVnZXgocGF0dGVybik7XG4gICAgY29uc3Qgc3RhcnNSZXBsYWNlZCA9IGVzY2FwZWQucmVwbGFjZSgvXFxcXFxcKi9nLCBcIi4qXCIpO1xuICAgIHJldHVybiBSZWdFeHAoYF4ke3N0YXJzUmVwbGFjZWR9JGApO1xuICB9XG4gIGVzY2FwZUZvclJlZ2V4KHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvWy4qKz9eJHt9KCl8W1xcXVxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICB9XG59O1xudmFyIE1hdGNoUGF0dGVybiA9IF9NYXRjaFBhdHRlcm47XG5NYXRjaFBhdHRlcm4uUFJPVE9DT0xTID0gW1wiaHR0cFwiLCBcImh0dHBzXCIsIFwiZmlsZVwiLCBcImZ0cFwiLCBcInVyblwiXTtcbnZhciBJbnZhbGlkTWF0Y2hQYXR0ZXJuID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoUGF0dGVybiwgcmVhc29uKSB7XG4gICAgc3VwZXIoYEludmFsaWQgbWF0Y2ggcGF0dGVybiBcIiR7bWF0Y2hQYXR0ZXJufVwiOiAke3JlYXNvbn1gKTtcbiAgfVxufTtcbmZ1bmN0aW9uIHZhbGlkYXRlUHJvdG9jb2wobWF0Y2hQYXR0ZXJuLCBwcm90b2NvbCkge1xuICBpZiAoIU1hdGNoUGF0dGVybi5QUk9UT0NPTFMuaW5jbHVkZXMocHJvdG9jb2wpICYmIHByb3RvY29sICE9PSBcIipcIilcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGAke3Byb3RvY29sfSBub3QgYSB2YWxpZCBwcm90b2NvbCAoJHtNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmpvaW4oXCIsIFwiKX0pYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZUhvc3RuYW1lKG1hdGNoUGF0dGVybiwgaG9zdG5hbWUpIHtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiOlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIGBIb3N0bmFtZSBjYW5ub3QgaW5jbHVkZSBhIHBvcnRgKTtcbiAgaWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiKlwiKSAmJiBob3N0bmFtZS5sZW5ndGggPiAxICYmICFob3N0bmFtZS5zdGFydHNXaXRoKFwiKi5cIikpXG4gICAgdGhyb3cgbmV3IEludmFsaWRNYXRjaFBhdHRlcm4oXG4gICAgICBtYXRjaFBhdHRlcm4sXG4gICAgICBgSWYgdXNpbmcgYSB3aWxkY2FyZCAoKiksIGl0IG11c3QgZ28gYXQgdGhlIHN0YXJ0IG9mIHRoZSBob3N0bmFtZWBcbiAgICApO1xufVxuZnVuY3Rpb24gdmFsaWRhdGVQYXRobmFtZShtYXRjaFBhdHRlcm4sIHBhdGhuYW1lKSB7XG4gIHJldHVybjtcbn1cbmV4cG9ydCB7XG4gIEludmFsaWRNYXRjaFBhdHRlcm4sXG4gIE1hdGNoUGF0dGVyblxufTtcbiJdLCJuYW1lcyI6WyJicm93c2VyIiwiX2Jyb3dzZXIiLCJyZXN1bHQiXSwibWFwcGluZ3MiOiI7OztBQUFPLFdBQVMsaUJBQWlCLEtBQUs7QUFDcEMsUUFBSSxPQUFPLFFBQVEsT0FBTyxRQUFRLFdBQVksUUFBTyxFQUFFLE1BQU0sSUFBRztBQUNoRSxXQUFPO0FBQUEsRUFDVDtBQ0ZPLFFBQU1BLGNBQVUsc0JBQVcsWUFBWCxtQkFBb0IsWUFBcEIsbUJBQTZCLE1BQ2hELFdBQVcsVUFDWCxXQUFXO0FDRlIsUUFBTSxVQUFVQztBQ0V2QixRQUFNLGVBQWU7QUFBQSxJQUNuQixTQUFTO0FBQUEsSUFDVCxZQUFZO0FBQUEsSUFDWixVQUFVO0FBQUEsSUFDVixhQUFhO0FBQUEsRUFDZjtBQUFBLEVBRU8sTUFBTSxlQUFlO0FBQUE7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
