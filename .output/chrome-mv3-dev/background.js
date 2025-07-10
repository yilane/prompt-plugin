var background = function() {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  var _a, _b;
  function defineBackground(arg) {
    if (arg == null || typeof arg === "function") return { main: arg };
    return arg;
  }
  const browser$1 = ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) ? globalThis.browser : globalThis.chrome;
  const browser = browser$1;
  const DB_NAME = "AI-Prompts-DB";
  const DB_VERSION = 2;
  const STORES = {
    PROMPTS: "prompts",
    CATEGORIES: "categories",
    SETTINGS: "settings",
    USAGE_STATS: "usageStats"
  };
  class StorageManager {
    constructor() {
      __publicField(this, "db", null);
      __publicField(this, "initPromise", null);
    }
    // 初始化数据库
    init() {
      if (this.initPromise) {
        return this.initPromise;
      }
      this.initPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORES.PROMPTS)) {
            const promptStore = db.createObjectStore(STORES.PROMPTS, { keyPath: "id" });
            promptStore.createIndex("category", "category", { unique: false });
            promptStore.createIndex("createTime", "createTime", { unique: false });
            promptStore.createIndex("useCount", "useCount", { unique: false });
          }
          if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
            const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: "id" });
            categoryStore.createIndex("sort", "sort", { unique: false });
          }
          if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
            db.createObjectStore(STORES.SETTINGS, { keyPath: "key" });
          }
          if (!db.objectStoreNames.contains(STORES.USAGE_STATS)) {
            const statsStore = db.createObjectStore(STORES.USAGE_STATS, { keyPath: "promptId" });
            statsStore.createIndex("lastUsed", "lastUsed", { unique: false });
          }
        };
      });
      return this.initPromise;
    }
    // 通用的事务操作方法
    async transaction(storeName, mode, operation) {
      await this.init();
      if (!this.db) throw new Error("Database not initialized");
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = operation(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    // 提示词相关操作
    async getAllPrompts() {
      return this.transaction(STORES.PROMPTS, "readonly", (store) => store.getAll());
    }
    async getPrompt(id) {
      return this.transaction(STORES.PROMPTS, "readonly", (store) => store.get(id));
    }
    async savePrompt(prompt) {
      await this.transaction(STORES.PROMPTS, "readwrite", (store) => store.put(prompt));
    }
    async deletePrompt(id) {
      await this.transaction(STORES.PROMPTS, "readwrite", (store) => store.delete(id));
    }
    async getPromptsByCategory(category) {
      return this.transaction(STORES.PROMPTS, "readonly", (store) => {
        const index = store.index("category");
        return index.getAll(category);
      });
    }
    // 分类相关操作
    async getAllCategories() {
      return this.transaction(STORES.CATEGORIES, "readonly", (store) => store.getAll());
    }
    async getCategory(id) {
      return this.transaction(STORES.CATEGORIES, "readonly", (store) => store.get(id));
    }
    async addCategory(category) {
      const id = this.generateId();
      const newCategory = { ...category, id };
      await this.transaction(STORES.CATEGORIES, "readwrite", (store) => store.put(newCategory));
      return newCategory;
    }
    async updateCategory(id, updates) {
      const existing = await this.transaction(STORES.CATEGORIES, "readonly", (store) => store.get(id));
      if (!existing) throw new Error(`Category with id ${id} not found`);
      const updatedCategory = { ...existing, ...updates };
      await this.transaction(STORES.CATEGORIES, "readwrite", (store) => store.put(updatedCategory));
      return updatedCategory;
    }
    async deleteCategory(id) {
      await this.transaction(STORES.CATEGORIES, "readwrite", (store) => store.delete(id));
    }
    async updateCategoriesOrder(categories) {
      if (!this.db) throw new Error("Database not initialized");
      const transaction = this.db.transaction(STORES.CATEGORIES, "readwrite");
      const store = transaction.objectStore(STORES.CATEGORIES);
      for (const category of categories) {
        store.put(category);
      }
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
    async saveCategory(category) {
      await this.transaction(STORES.CATEGORIES, "readwrite", (store) => store.put(category));
    }
    // 设置相关操作
    async getSettings() {
      const settings = await this.transaction(STORES.SETTINGS, "readonly", (store) => store.get("main"));
      const defaultSettings = this.getDefaultSettings();
      if (settings && settings.triggerKey && !settings.triggerSequences) {
        settings.triggerSequences = [{ id: "default-1", value: settings.triggerKey, enabled: true }];
        delete settings.triggerKey;
        await this.saveSettings(settings);
      }
      return { ...defaultSettings, ...settings };
    }
    async saveSettings(settings) {
      console.log("AI-Prompts: Saving settings object:", settings);
      await this.transaction(
        STORES.SETTINGS,
        "readwrite",
        (store) => store.put({ key: "main", ...settings })
      );
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
      return this.transaction(STORES.USAGE_STATS, "readonly", (store) => store.getAll());
    }
    async updateUsageStats(promptId) {
      const existing = await this.transaction(STORES.USAGE_STATS, "readonly", (store) => store.get(promptId));
      const stats = {
        promptId,
        count: existing ? existing.count + 1 : 1,
        lastUsed: (/* @__PURE__ */ new Date()).toISOString()
      };
      await this.transaction(STORES.USAGE_STATS, "readwrite", (store) => store.put(stats));
    }
    // 数据导入导出
    async exportData() {
      const [prompts, categories, settings] = await Promise.all([
        this.getAllPrompts(),
        this.getAllCategories(),
        this.getSettings()
      ]);
      return JSON.stringify({
        version: DB_VERSION,
        exportTime: (/* @__PURE__ */ new Date()).toISOString(),
        data: { prompts, categories, settings }
      });
    }
    async importData(jsonData) {
      const data = JSON.parse(jsonData);
      if (data.data.prompts) {
        for (const prompt of data.data.prompts) {
          await this.savePrompt(prompt);
        }
      }
      if (data.data.categories) {
        for (const category of data.data.categories) {
          await this.addCategory(category);
        }
      }
      if (data.data.settings) {
        await this.saveSettings(data.data.settings);
      }
    }
    // 清空所有数据
    async clearAllData() {
      if (!this.db) return;
      const transaction = this.db.transaction(Object.values(STORES), "readwrite");
      for (const storeName of Object.values(STORES)) {
        transaction.objectStore(storeName).clear();
      }
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
    generateId() {
      return `id-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
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
      const serverUrl = "http://localhost:14805";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9Ad3h0LWRldi9icm93c2VyL3NyYy9pbmRleC5tanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvYnJvd3Nlci5tanMiLCIuLi8uLi9zcmMvdXRpbHMvc3RvcmFnZS50cyIsIi4uLy4uL2VudHJ5cG9pbnRzL2JhY2tncm91bmQudHMiLCIuLi8uLi9ub2RlX21vZHVsZXMvQHdlYmV4dC1jb3JlL21hdGNoLXBhdHRlcm5zL2xpYi9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZnVuY3Rpb24gZGVmaW5lQmFja2dyb3VuZChhcmcpIHtcbiAgaWYgKGFyZyA9PSBudWxsIHx8IHR5cGVvZiBhcmcgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHsgbWFpbjogYXJnIH07XG4gIHJldHVybiBhcmc7XG59XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIF9icm93c2VyIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbmV4cG9ydCBjb25zdCBicm93c2VyID0gX2Jyb3dzZXI7XG5leHBvcnQge307XG4iLCJpbXBvcnQgdHlwZSB7IFByb21wdCwgQ2F0ZWdvcnksIFNldHRpbmdzLCBVc2FnZVN0YXRzIH0gZnJvbSAnLi4vdHlwZXMnXG5cbmNvbnN0IERCX05BTUUgPSAnQUktUHJvbXB0cy1EQidcbmNvbnN0IERCX1ZFUlNJT04gPSAyXG5cbi8vIOaVsOaNruihqOWQjVxuY29uc3QgU1RPUkVTID0ge1xuICBQUk9NUFRTOiAncHJvbXB0cycsXG4gIENBVEVHT1JJRVM6ICdjYXRlZ29yaWVzJyxcbiAgU0VUVElOR1M6ICdzZXR0aW5ncycsXG4gIFVTQUdFX1NUQVRTOiAndXNhZ2VTdGF0cydcbn0gYXMgY29uc3RcblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2VNYW5hZ2VyIHtcbiAgcHJpdmF0ZSBkYjogSURCRGF0YWJhc2UgfCBudWxsID0gbnVsbFxuICBwcml2YXRlIGluaXRQcm9taXNlOiBQcm9taXNlPHZvaWQ+IHwgbnVsbCA9IG51bGxcblxuICAvLyDliJ3lp4vljJbmlbDmja7lupNcbiAgaW5pdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5pbml0UHJvbWlzZSkge1xuICAgICAgcmV0dXJuIHRoaXMuaW5pdFByb21pc2VcbiAgICB9XG5cbiAgICB0aGlzLmluaXRQcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWVzdCA9IGluZGV4ZWREQi5vcGVuKERCX05BTUUsIERCX1ZFUlNJT04pXG5cbiAgICAgIHJlcXVlc3Qub25lcnJvciA9ICgpID0+IHJlamVjdChyZXF1ZXN0LmVycm9yKVxuICAgICAgcmVxdWVzdC5vbnN1Y2Nlc3MgPSAoKSA9PiB7XG4gICAgICAgIHRoaXMuZGIgPSByZXF1ZXN0LnJlc3VsdFxuICAgICAgICByZXNvbHZlKClcbiAgICAgIH1cblxuICAgICAgcmVxdWVzdC5vbnVwZ3JhZGVuZWVkZWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgZGIgPSAoZXZlbnQudGFyZ2V0IGFzIElEQk9wZW5EQlJlcXVlc3QpLnJlc3VsdFxuXG4gICAgICAgIC8vIOWIm+W7uuaPkOekuuivjeihqFxuICAgICAgICBpZiAoIWRiLm9iamVjdFN0b3JlTmFtZXMuY29udGFpbnMoU1RPUkVTLlBST01QVFMpKSB7XG4gICAgICAgICAgY29uc3QgcHJvbXB0U3RvcmUgPSBkYi5jcmVhdGVPYmplY3RTdG9yZShTVE9SRVMuUFJPTVBUUywgeyBrZXlQYXRoOiAnaWQnIH0pXG4gICAgICAgICAgcHJvbXB0U3RvcmUuY3JlYXRlSW5kZXgoJ2NhdGVnb3J5JywgJ2NhdGVnb3J5JywgeyB1bmlxdWU6IGZhbHNlIH0pXG4gICAgICAgICAgcHJvbXB0U3RvcmUuY3JlYXRlSW5kZXgoJ2NyZWF0ZVRpbWUnLCAnY3JlYXRlVGltZScsIHsgdW5pcXVlOiBmYWxzZSB9KVxuICAgICAgICAgIHByb21wdFN0b3JlLmNyZWF0ZUluZGV4KCd1c2VDb3VudCcsICd1c2VDb3VudCcsIHsgdW5pcXVlOiBmYWxzZSB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Yib5bu65YiG57G76KGoXG4gICAgICAgIGlmICghZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhTVE9SRVMuQ0FURUdPUklFUykpIHtcbiAgICAgICAgICBjb25zdCBjYXRlZ29yeVN0b3JlID0gZGIuY3JlYXRlT2JqZWN0U3RvcmUoU1RPUkVTLkNBVEVHT1JJRVMsIHsga2V5UGF0aDogJ2lkJyB9KVxuICAgICAgICAgIGNhdGVnb3J5U3RvcmUuY3JlYXRlSW5kZXgoJ3NvcnQnLCAnc29ydCcsIHsgdW5pcXVlOiBmYWxzZSB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5Yib5bu66K6+572u6KGoXG4gICAgICAgIGlmICghZGIub2JqZWN0U3RvcmVOYW1lcy5jb250YWlucyhTVE9SRVMuU0VUVElOR1MpKSB7XG4gICAgICAgICAgZGIuY3JlYXRlT2JqZWN0U3RvcmUoU1RPUkVTLlNFVFRJTkdTLCB7IGtleVBhdGg6ICdrZXknIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyDliJvlu7rkvb/nlKjnu5/orqHooahcbiAgICAgICAgaWYgKCFkYi5vYmplY3RTdG9yZU5hbWVzLmNvbnRhaW5zKFNUT1JFUy5VU0FHRV9TVEFUUykpIHtcbiAgICAgICAgICBjb25zdCBzdGF0c1N0b3JlID0gZGIuY3JlYXRlT2JqZWN0U3RvcmUoU1RPUkVTLlVTQUdFX1NUQVRTLCB7IGtleVBhdGg6ICdwcm9tcHRJZCcgfSlcbiAgICAgICAgICBzdGF0c1N0b3JlLmNyZWF0ZUluZGV4KCdsYXN0VXNlZCcsICdsYXN0VXNlZCcsIHsgdW5pcXVlOiBmYWxzZSB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gdGhpcy5pbml0UHJvbWlzZVxuICB9XG5cbiAgLy8g6YCa55So55qE5LqL5Yqh5pON5L2c5pa55rOVXG4gIHByaXZhdGUgYXN5bmMgdHJhbnNhY3Rpb248VD4oXG4gICAgc3RvcmVOYW1lOiBzdHJpbmcsXG4gICAgbW9kZTogSURCVHJhbnNhY3Rpb25Nb2RlLFxuICAgIG9wZXJhdGlvbjogKHN0b3JlOiBJREJPYmplY3RTdG9yZSkgPT4gSURCUmVxdWVzdDxUPlxuICApOiBQcm9taXNlPFQ+IHtcbiAgICBhd2FpdCB0aGlzLmluaXQoKVxuICAgIGlmICghdGhpcy5kYikgdGhyb3cgbmV3IEVycm9yKCdEYXRhYmFzZSBub3QgaW5pdGlhbGl6ZWQnKVxuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYiEudHJhbnNhY3Rpb24oc3RvcmVOYW1lLCBtb2RlKVxuICAgICAgY29uc3Qgc3RvcmUgPSB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpXG4gICAgICBjb25zdCByZXF1ZXN0ID0gb3BlcmF0aW9uKHN0b3JlKVxuXG4gICAgICByZXF1ZXN0Lm9uc3VjY2VzcyA9ICgpID0+IHJlc29sdmUocmVxdWVzdC5yZXN1bHQpXG4gICAgICByZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiByZWplY3QocmVxdWVzdC5lcnJvcilcbiAgICB9KVxuICB9XG5cbiAgLy8g5o+Q56S66K+N55u45YWz5pON5L2cXG4gIGFzeW5jIGdldEFsbFByb21wdHMoKTogUHJvbWlzZTxQcm9tcHRbXT4ge1xuICAgIHJldHVybiB0aGlzLnRyYW5zYWN0aW9uKFNUT1JFUy5QUk9NUFRTLCAncmVhZG9ubHknLCBzdG9yZSA9PiBzdG9yZS5nZXRBbGwoKSlcbiAgfVxuXG4gIGFzeW5jIGdldFByb21wdChpZDogc3RyaW5nKTogUHJvbWlzZTxQcm9tcHQgfCB1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2FjdGlvbihTVE9SRVMuUFJPTVBUUywgJ3JlYWRvbmx5Jywgc3RvcmUgPT4gc3RvcmUuZ2V0KGlkKSlcbiAgfVxuXG4gIGFzeW5jIHNhdmVQcm9tcHQocHJvbXB0OiBQcm9tcHQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnRyYW5zYWN0aW9uKFNUT1JFUy5QUk9NUFRTLCAncmVhZHdyaXRlJywgc3RvcmUgPT4gc3RvcmUucHV0KHByb21wdCkpXG4gIH1cblxuICBhc3luYyBkZWxldGVQcm9tcHQoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMudHJhbnNhY3Rpb24oU1RPUkVTLlBST01QVFMsICdyZWFkd3JpdGUnLCBzdG9yZSA9PiBzdG9yZS5kZWxldGUoaWQpKVxuICB9XG5cbiAgYXN5bmMgZ2V0UHJvbXB0c0J5Q2F0ZWdvcnkoY2F0ZWdvcnk6IHN0cmluZyk6IFByb21pc2U8UHJvbXB0W10+IHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2FjdGlvbihTVE9SRVMuUFJPTVBUUywgJ3JlYWRvbmx5Jywgc3RvcmUgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBzdG9yZS5pbmRleCgnY2F0ZWdvcnknKVxuICAgICAgcmV0dXJuIGluZGV4LmdldEFsbChjYXRlZ29yeSlcbiAgICB9KVxuICB9XG5cbiAgLy8g5YiG57G755u45YWz5pON5L2cXG4gIGFzeW5jIGdldEFsbENhdGVnb3JpZXMoKTogUHJvbWlzZTxDYXRlZ29yeVtdPiB7XG4gICAgcmV0dXJuIHRoaXMudHJhbnNhY3Rpb24oU1RPUkVTLkNBVEVHT1JJRVMsICdyZWFkb25seScsIHN0b3JlID0+IHN0b3JlLmdldEFsbCgpKVxuICB9XG5cbiAgYXN5bmMgZ2V0Q2F0ZWdvcnkoaWQ6IHN0cmluZyk6IFByb21pc2U8Q2F0ZWdvcnkgfCB1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2FjdGlvbihTVE9SRVMuQ0FURUdPUklFUywgJ3JlYWRvbmx5Jywgc3RvcmUgPT4gc3RvcmUuZ2V0KGlkKSlcbiAgfVxuXG4gIGFzeW5jIGFkZENhdGVnb3J5KGNhdGVnb3J5OiBPbWl0PENhdGVnb3J5LCAnaWQnPik6IFByb21pc2U8Q2F0ZWdvcnk+IHtcbiAgICBjb25zdCBpZCA9IHRoaXMuZ2VuZXJhdGVJZCgpO1xuICAgIGNvbnN0IG5ld0NhdGVnb3J5ID0geyAuLi5jYXRlZ29yeSwgaWQgfTtcbiAgICBhd2FpdCB0aGlzLnRyYW5zYWN0aW9uKFNUT1JFUy5DQVRFR09SSUVTLCAncmVhZHdyaXRlJywgc3RvcmUgPT4gc3RvcmUucHV0KG5ld0NhdGVnb3J5KSk7XG4gICAgcmV0dXJuIG5ld0NhdGVnb3J5O1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlQ2F0ZWdvcnkoaWQ6IHN0cmluZywgdXBkYXRlczogUGFydGlhbDxDYXRlZ29yeT4pOiBQcm9taXNlPENhdGVnb3J5PiB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnRyYW5zYWN0aW9uKFNUT1JFUy5DQVRFR09SSUVTLCAncmVhZG9ubHknLCBzdG9yZSA9PiBzdG9yZS5nZXQoaWQpKTtcbiAgICBpZiAoIWV4aXN0aW5nKSB0aHJvdyBuZXcgRXJyb3IoYENhdGVnb3J5IHdpdGggaWQgJHtpZH0gbm90IGZvdW5kYCk7XG4gICAgY29uc3QgdXBkYXRlZENhdGVnb3J5ID0geyAuLi5leGlzdGluZywgLi4udXBkYXRlcyB9O1xuICAgIGF3YWl0IHRoaXMudHJhbnNhY3Rpb24oU1RPUkVTLkNBVEVHT1JJRVMsICdyZWFkd3JpdGUnLCBzdG9yZSA9PiBzdG9yZS5wdXQodXBkYXRlZENhdGVnb3J5KSk7XG4gICAgcmV0dXJuIHVwZGF0ZWRDYXRlZ29yeTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZUNhdGVnb3J5KGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnRyYW5zYWN0aW9uKFNUT1JFUy5DQVRFR09SSUVTLCAncmVhZHdyaXRlJywgc3RvcmUgPT4gc3RvcmUuZGVsZXRlKGlkKSlcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZUNhdGVnb3JpZXNPcmRlcihjYXRlZ29yaWVzOiBDYXRlZ29yeVtdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmRiKSB0aHJvdyBuZXcgRXJyb3IoJ0RhdGFiYXNlIG5vdCBpbml0aWFsaXplZCcpO1xuICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYi50cmFuc2FjdGlvbihTVE9SRVMuQ0FURUdPUklFUywgJ3JlYWR3cml0ZScpO1xuICAgIGNvbnN0IHN0b3JlID0gdHJhbnNhY3Rpb24ub2JqZWN0U3RvcmUoU1RPUkVTLkNBVEVHT1JJRVMpO1xuICAgIGZvciAoY29uc3QgY2F0ZWdvcnkgb2YgY2F0ZWdvcmllcykge1xuICAgICAgc3RvcmUucHV0KGNhdGVnb3J5KTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHRyYW5zYWN0aW9uLm9uY29tcGxldGUgPSAoKSA9PiByZXNvbHZlKCk7XG4gICAgICB0cmFuc2FjdGlvbi5vbmVycm9yID0gKCkgPT4gcmVqZWN0KHRyYW5zYWN0aW9uLmVycm9yKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVDYXRlZ29yeShjYXRlZ29yeTogQ2F0ZWdvcnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnRyYW5zYWN0aW9uKFNUT1JFUy5DQVRFR09SSUVTLCAncmVhZHdyaXRlJywgc3RvcmUgPT4gc3RvcmUucHV0KGNhdGVnb3J5KSk7XG4gIH1cblxuICAvLyDorr7nva7nm7jlhbPmk43kvZxcbiAgYXN5bmMgZ2V0U2V0dGluZ3MoKTogUHJvbWlzZTxTZXR0aW5ncz4ge1xuICAgIGNvbnN0IHNldHRpbmdzID0gYXdhaXQgdGhpcy50cmFuc2FjdGlvbihTVE9SRVMuU0VUVElOR1MsICdyZWFkb25seScsIHN0b3JlID0+IHN0b3JlLmdldCgnbWFpbicpKSBhcyBhbnlcbiAgICBjb25zdCBkZWZhdWx0U2V0dGluZ3MgPSB0aGlzLmdldERlZmF1bHRTZXR0aW5ncygpO1xuXG4gICAgLy8g5ZCR5LiK5YW85a6577ya5aSE55CG5pen5pWw5o2u57uT5p6E6L+B56e7XG4gICAgaWYgKHNldHRpbmdzICYmIHNldHRpbmdzLnRyaWdnZXJLZXkgJiYgIXNldHRpbmdzLnRyaWdnZXJTZXF1ZW5jZXMpIHtcbiAgICAgICAgc2V0dGluZ3MudHJpZ2dlclNlcXVlbmNlcyA9IFt7IGlkOiAnZGVmYXVsdC0xJywgdmFsdWU6IHNldHRpbmdzLnRyaWdnZXJLZXksIGVuYWJsZWQ6IHRydWUgfV07XG4gICAgICAgIGRlbGV0ZSBzZXR0aW5ncy50cmlnZ2VyS2V5O1xuICAgICAgICAvLyDnq4vljbPkv53lrZjov4Hnp7vlkI7nmoTorr7nva5cbiAgICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3Moc2V0dGluZ3MpO1xuICAgIH1cblxuICAgIHJldHVybiB7IC4uLmRlZmF1bHRTZXR0aW5ncywgLi4uc2V0dGluZ3MgfVxuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKHNldHRpbmdzOiBTZXR0aW5ncyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnNvbGUubG9nKCdBSS1Qcm9tcHRzOiBTYXZpbmcgc2V0dGluZ3Mgb2JqZWN0OicsIHNldHRpbmdzKVxuICAgIGF3YWl0IHRoaXMudHJhbnNhY3Rpb24oU1RPUkVTLlNFVFRJTkdTLCAncmVhZHdyaXRlJywgc3RvcmUgPT5cbiAgICAgIHN0b3JlLnB1dCh7IGtleTogJ21haW4nLCAuLi5zZXR0aW5ncyB9KVxuICAgIClcbiAgfVxuXG4gIHByaXZhdGUgZ2V0RGVmYXVsdFNldHRpbmdzKCk6IFNldHRpbmdzIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGhlbWU6ICdzeXN0ZW0nLFxuICAgICAgbGFuZ3VhZ2U6ICd6aCcsXG4gICAgICB0cmlnZ2VyU2VxdWVuY2VzOiBbeyBpZDogJ2RlZmF1bHQtMScsIHZhbHVlOiAnQEAnLCBlbmFibGVkOiB0cnVlIH1dLFxuICAgICAgZW5hYmxlUXVpY2tJbnNlcnQ6IHRydWUsXG4gICAgICBlbmFibGVLZXlib2FyZFNob3J0Y3V0czogdHJ1ZSxcbiAgICAgIGVuYWJsZU5vdGlmaWNhdGlvbnM6IHRydWUsXG4gICAgICBhdXRvQmFja3VwOiBmYWxzZSxcbiAgICAgIG1heFJlY2VudFByb21wdHM6IDEwXG4gICAgfVxuICB9XG5cbiAgLy8g5L2/55So57uf6K6h55u45YWz5pON5L2cXG4gIGFzeW5jIGdldFVzYWdlU3RhdHMoKTogUHJvbWlzZTxVc2FnZVN0YXRzW10+IHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2FjdGlvbihTVE9SRVMuVVNBR0VfU1RBVFMsICdyZWFkb25seScsIHN0b3JlID0+IHN0b3JlLmdldEFsbCgpKVxuICB9XG5cbiAgYXN5bmMgdXBkYXRlVXNhZ2VTdGF0cyhwcm9tcHRJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZXhpc3RpbmcgPSBhd2FpdCB0aGlzLnRyYW5zYWN0aW9uKFNUT1JFUy5VU0FHRV9TVEFUUywgJ3JlYWRvbmx5Jywgc3RvcmUgPT4gc3RvcmUuZ2V0KHByb21wdElkKSlcblxuICAgIGNvbnN0IHN0YXRzOiBVc2FnZVN0YXRzID0ge1xuICAgICAgcHJvbXB0SWQsXG4gICAgICBjb3VudDogZXhpc3RpbmcgPyBleGlzdGluZy5jb3VudCArIDEgOiAxLFxuICAgICAgbGFzdFVzZWQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIH1cblxuICAgIGF3YWl0IHRoaXMudHJhbnNhY3Rpb24oU1RPUkVTLlVTQUdFX1NUQVRTLCAncmVhZHdyaXRlJywgc3RvcmUgPT4gc3RvcmUucHV0KHN0YXRzKSlcbiAgfVxuXG4gIC8vIOaVsOaNruWvvOWFpeWvvOWHulxuICBhc3luYyBleHBvcnREYXRhKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgW3Byb21wdHMsIGNhdGVnb3JpZXMsIHNldHRpbmdzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgIHRoaXMuZ2V0QWxsUHJvbXB0cygpLFxuICAgICAgdGhpcy5nZXRBbGxDYXRlZ29yaWVzKCksXG4gICAgICB0aGlzLmdldFNldHRpbmdzKClcbiAgICBdKVxuXG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIHZlcnNpb246IERCX1ZFUlNJT04sXG4gICAgICBleHBvcnRUaW1lOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBkYXRhOiB7IHByb21wdHMsIGNhdGVnb3JpZXMsIHNldHRpbmdzIH1cbiAgICB9KVxuICB9XG5cbiAgYXN5bmMgaW1wb3J0RGF0YShqc29uRGF0YTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZGF0YSA9IEpTT04ucGFyc2UoanNvbkRhdGEpXG5cbiAgICBpZiAoZGF0YS5kYXRhLnByb21wdHMpIHtcbiAgICAgIGZvciAoY29uc3QgcHJvbXB0IG9mIGRhdGEuZGF0YS5wcm9tcHRzKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc2F2ZVByb21wdChwcm9tcHQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuZGF0YS5jYXRlZ29yaWVzKSB7XG4gICAgICBmb3IgKGNvbnN0IGNhdGVnb3J5IG9mIGRhdGEuZGF0YS5jYXRlZ29yaWVzKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYWRkQ2F0ZWdvcnkoY2F0ZWdvcnkpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGRhdGEuZGF0YS5zZXR0aW5ncykge1xuICAgICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoZGF0YS5kYXRhLnNldHRpbmdzKVxuICAgIH1cbiAgfVxuXG4gIC8vIOa4heepuuaJgOacieaVsOaNrlxuICBhc3luYyBjbGVhckFsbERhdGEoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKCF0aGlzLmRiKSByZXR1cm5cblxuICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gdGhpcy5kYi50cmFuc2FjdGlvbihPYmplY3QudmFsdWVzKFNUT1JFUyksICdyZWFkd3JpdGUnKVxuXG4gICAgZm9yIChjb25zdCBzdG9yZU5hbWUgb2YgT2JqZWN0LnZhbHVlcyhTVE9SRVMpKSB7XG4gICAgICB0cmFuc2FjdGlvbi5vYmplY3RTdG9yZShzdG9yZU5hbWUpLmNsZWFyKClcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdHJhbnNhY3Rpb24ub25jb21wbGV0ZSA9ICgpID0+IHJlc29sdmUoKVxuICAgICAgdHJhbnNhY3Rpb24ub25lcnJvciA9ICgpID0+IHJlamVjdCh0cmFuc2FjdGlvbi5lcnJvcilcbiAgICB9KVxuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBpZC0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDE1KX1gXG4gIH1cbn1cblxuLy8g5a+85Ye65Y2V5L6L5a6e5L6LXG5leHBvcnQgY29uc3Qgc3RvcmFnZSA9IG5ldyBTdG9yYWdlTWFuYWdlcigpXG5cbi8vIOWIneWni+WMluaVsOaNruW6k+eahOS+v+aNt+WHveaVsFxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluaXRpYWxpemVEYXRhYmFzZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgYXdhaXQgc3RvcmFnZS5pbml0KClcbn1cbiIsImltcG9ydCB7IGluaXRpYWxpemVEYXRhYmFzZSB9IGZyb20gJy4uL3NyYy91dGlscy9zdG9yYWdlJztcblxuY29uc29sZS5sb2coJ0FJLVByb21wdHM6IEJhY2tncm91bmQgc2NyaXB0IGxvYWRlZC4gSW5pdGlhbGl6aW5nIGRhdGFiYXNlLi4uJyk7XG5pbml0aWFsaXplRGF0YWJhc2UoKS50aGVuKCgpID0+IHtcbiAgY29uc29sZS5sb2coJ0FJLVByb21wdHM6IERhdGFiYXNlIGluaXRpYWxpemVkIHN1Y2Nlc3NmdWxseS4nKTtcbn0pLmNhdGNoKChlcnJvcjogYW55KSA9PiB7XG4gIGNvbnNvbGUuZXJyb3IoJ0FJLVByb21wdHM6IERhdGFiYXNlIGluaXRpYWxpemF0aW9uIGZhaWxlZDonLCBlcnJvcik7XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQmFja2dyb3VuZCgoKSA9PiB7XG4gIGJyb3dzZXIuYWN0aW9uLm9uQ2xpY2tlZC5hZGRMaXN0ZW5lcigoKSA9PiB7XG4gICAgYnJvd3Nlci50YWJzLmNyZWF0ZSh7XG4gICAgICB1cmw6ICcvZGFzaGJvYXJkLmh0bWwnXG4gICAgfSk7XG4gIH0pO1xufSk7XG4iLCIvLyBzcmMvaW5kZXgudHNcbnZhciBfTWF0Y2hQYXR0ZXJuID0gY2xhc3Mge1xuICBjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4pIHtcbiAgICBpZiAobWF0Y2hQYXR0ZXJuID09PSBcIjxhbGxfdXJscz5cIikge1xuICAgICAgdGhpcy5pc0FsbFVybHMgPSB0cnVlO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBbLi4uX01hdGNoUGF0dGVybi5QUk9UT0NPTFNdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gXCIqXCI7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBcIipcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgZ3JvdXBzID0gLyguKik6XFwvXFwvKC4qPykoXFwvLiopLy5leGVjKG1hdGNoUGF0dGVybik7XG4gICAgICBpZiAoZ3JvdXBzID09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgXCJJbmNvcnJlY3QgZm9ybWF0XCIpO1xuICAgICAgY29uc3QgW18sIHByb3RvY29sLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gZ3JvdXBzO1xuICAgICAgdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKTtcbiAgICAgIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSk7XG4gICAgICB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpO1xuICAgICAgdGhpcy5wcm90b2NvbE1hdGNoZXMgPSBwcm90b2NvbCA9PT0gXCIqXCIgPyBbXCJodHRwXCIsIFwiaHR0cHNcIl0gOiBbcHJvdG9jb2xdO1xuICAgICAgdGhpcy5ob3N0bmFtZU1hdGNoID0gaG9zdG5hbWU7XG4gICAgICB0aGlzLnBhdGhuYW1lTWF0Y2ggPSBwYXRobmFtZTtcbiAgICB9XG4gIH1cbiAgaW5jbHVkZXModXJsKSB7XG4gICAgaWYgKHRoaXMuaXNBbGxVcmxzKVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgY29uc3QgdSA9IHR5cGVvZiB1cmwgPT09IFwic3RyaW5nXCIgPyBuZXcgVVJMKHVybCkgOiB1cmwgaW5zdGFuY2VvZiBMb2NhdGlvbiA/IG5ldyBVUkwodXJsLmhyZWYpIDogdXJsO1xuICAgIHJldHVybiAhIXRoaXMucHJvdG9jb2xNYXRjaGVzLmZpbmQoKHByb3RvY29sKSA9PiB7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiaHR0cFwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJodHRwc1wiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0h0dHBzTWF0Y2godSk7XG4gICAgICBpZiAocHJvdG9jb2wgPT09IFwiZmlsZVwiKVxuICAgICAgICByZXR1cm4gdGhpcy5pc0ZpbGVNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJmdHBcIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNGdHBNYXRjaCh1KTtcbiAgICAgIGlmIChwcm90b2NvbCA9PT0gXCJ1cm5cIilcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNVcm5NYXRjaCh1KTtcbiAgICB9KTtcbiAgfVxuICBpc0h0dHBNYXRjaCh1cmwpIHtcbiAgICByZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHA6XCIgJiYgdGhpcy5pc0hvc3RQYXRoTWF0Y2godXJsKTtcbiAgfVxuICBpc0h0dHBzTWF0Y2godXJsKSB7XG4gICAgcmV0dXJuIHVybC5wcm90b2NvbCA9PT0gXCJodHRwczpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuICB9XG4gIGlzSG9zdFBhdGhNYXRjaCh1cmwpIHtcbiAgICBpZiAoIXRoaXMuaG9zdG5hbWVNYXRjaCB8fCAhdGhpcy5wYXRobmFtZU1hdGNoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGNvbnN0IGhvc3RuYW1lTWF0Y2hSZWdleHMgPSBbXG4gICAgICB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLmhvc3RuYW1lTWF0Y2gpLFxuICAgICAgdGhpcy5jb252ZXJ0UGF0dGVyblRvUmVnZXgodGhpcy5ob3N0bmFtZU1hdGNoLnJlcGxhY2UoL15cXCpcXC4vLCBcIlwiKSlcbiAgICBdO1xuICAgIGNvbnN0IHBhdGhuYW1lTWF0Y2hSZWdleCA9IHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMucGF0aG5hbWVNYXRjaCk7XG4gICAgcmV0dXJuICEhaG9zdG5hbWVNYXRjaFJlZ2V4cy5maW5kKChyZWdleCkgPT4gcmVnZXgudGVzdCh1cmwuaG9zdG5hbWUpKSAmJiBwYXRobmFtZU1hdGNoUmVnZXgudGVzdCh1cmwucGF0aG5hbWUpO1xuICB9XG4gIGlzRmlsZU1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmaWxlOi8vIHBhdHRlcm4gbWF0Y2hpbmcuIE9wZW4gYSBQUiB0byBhZGQgc3VwcG9ydFwiKTtcbiAgfVxuICBpc0Z0cE1hdGNoKHVybCkge1xuICAgIHRocm93IEVycm9yKFwiTm90IGltcGxlbWVudGVkOiBmdHA6Ly8gcGF0dGVybiBtYXRjaGluZy4gT3BlbiBhIFBSIHRvIGFkZCBzdXBwb3J0XCIpO1xuICB9XG4gIGlzVXJuTWF0Y2godXJsKSB7XG4gICAgdGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IHVybjovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG4gIH1cbiAgY29udmVydFBhdHRlcm5Ub1JlZ2V4KHBhdHRlcm4pIHtcbiAgICBjb25zdCBlc2NhcGVkID0gdGhpcy5lc2NhcGVGb3JSZWdleChwYXR0ZXJuKTtcbiAgICBjb25zdCBzdGFyc1JlcGxhY2VkID0gZXNjYXBlZC5yZXBsYWNlKC9cXFxcXFwqL2csIFwiLipcIik7XG4gICAgcmV0dXJuIFJlZ0V4cChgXiR7c3RhcnNSZXBsYWNlZH0kYCk7XG4gIH1cbiAgZXNjYXBlRm9yUmVnZXgoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gIH1cbn07XG52YXIgTWF0Y2hQYXR0ZXJuID0gX01hdGNoUGF0dGVybjtcbk1hdGNoUGF0dGVybi5QUk9UT0NPTFMgPSBbXCJodHRwXCIsIFwiaHR0cHNcIiwgXCJmaWxlXCIsIFwiZnRwXCIsIFwidXJuXCJdO1xudmFyIEludmFsaWRNYXRjaFBhdHRlcm4gPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuLCByZWFzb24pIHtcbiAgICBzdXBlcihgSW52YWxpZCBtYXRjaCBwYXR0ZXJuIFwiJHttYXRjaFBhdHRlcm59XCI6ICR7cmVhc29ufWApO1xuICB9XG59O1xuZnVuY3Rpb24gdmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKSB7XG4gIGlmICghTWF0Y2hQYXR0ZXJuLlBST1RPQ09MUy5pbmNsdWRlcyhwcm90b2NvbCkgJiYgcHJvdG9jb2wgIT09IFwiKlwiKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKFxuICAgICAgbWF0Y2hQYXR0ZXJuLFxuICAgICAgYCR7cHJvdG9jb2x9IG5vdCBhIHZhbGlkIHByb3RvY29sICgke01hdGNoUGF0dGVybi5QUk9UT0NPTFMuam9pbihcIiwgXCIpfSlgXG4gICAgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSkge1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCI6XCIpKVxuICAgIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgYEhvc3RuYW1lIGNhbm5vdCBpbmNsdWRlIGEgcG9ydGApO1xuICBpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCIqXCIpICYmIGhvc3RuYW1lLmxlbmd0aCA+IDEgJiYgIWhvc3RuYW1lLnN0YXJ0c1dpdGgoXCIqLlwiKSlcbiAgICB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihcbiAgICAgIG1hdGNoUGF0dGVybixcbiAgICAgIGBJZiB1c2luZyBhIHdpbGRjYXJkICgqKSwgaXQgbXVzdCBnbyBhdCB0aGUgc3RhcnQgb2YgdGhlIGhvc3RuYW1lYFxuICAgICk7XG59XG5mdW5jdGlvbiB2YWxpZGF0ZVBhdGhuYW1lKG1hdGNoUGF0dGVybiwgcGF0aG5hbWUpIHtcbiAgcmV0dXJuO1xufVxuZXhwb3J0IHtcbiAgSW52YWxpZE1hdGNoUGF0dGVybixcbiAgTWF0Y2hQYXR0ZXJuXG59O1xuIl0sIm5hbWVzIjpbImJyb3dzZXIiLCJfYnJvd3NlciJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQU8sV0FBUyxpQkFBaUIsS0FBSztBQUNwQyxRQUFJLE9BQU8sUUFBUSxPQUFPLFFBQVEsV0FBWSxRQUFPLEVBQUUsTUFBTSxJQUFHO0FBQ2hFLFdBQU87QUFBQSxFQUNUO0FDRk8sUUFBTUEsY0FBVSxzQkFBVyxZQUFYLG1CQUFvQixZQUFwQixtQkFBNkIsTUFDaEQsV0FBVyxVQUNYLFdBQVc7QUNGUixRQUFNLFVBQVVDO0FDQ3ZCLFFBQU0sVUFBVTtBQUNoQixRQUFNLGFBQWE7QUFHbkIsUUFBTSxTQUFTO0FBQUEsSUFDYixTQUFTO0FBQUEsSUFDVCxZQUFZO0FBQUEsSUFDWixVQUFVO0FBQUEsSUFD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
