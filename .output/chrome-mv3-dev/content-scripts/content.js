var content = function() {
  "use strict";var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  var _a, _b;
  function defineContentScript(definition2) {
    return definition2;
  }
  const definition = defineContentScript({
    matches: [
      "https://chat.openai.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*",
      "https://chat.deepseek.com/*",
      "https://www.doubao.com/*"
    ],
    main() {
      console.log("AI-Prompts content script loaded. Ready to assist.");
      function findAndAttachListener() {
        const targetSelector = 'textarea[id*="prompt"], textarea[placeholder*="Message"], textarea[placeholder*="Send a message"]';
        const textarea = document.querySelector(targetSelector);
        if (textarea && !textarea.dataset.promptListenerAttached) {
          console.log("Input area found, attaching listener:", textarea);
          textarea.dataset.promptListenerAttached = "true";
          textarea.addEventListener("input", handleInput);
          return true;
        }
        return false;
      }
      function handleInput(event) {
        const target = event.target;
        if (target.value.includes("@@")) {
          console.log('Trigger "@@" detected! Value:', target.value);
        }
      }
      const intervalId = setInterval(() => {
        if (findAndAttachListener()) {
          console.log("Listener attached. Polling will stop for now.");
          clearInterval(intervalId);
        }
      }, 1e3);
    }
  });
  content;
  const browser$1 = ((_b = (_a = globalThis.browser) == null ? void 0 : _a.runtime) == null ? void 0 : _b.id) ? globalThis.browser : globalThis.chrome;
  const browser = browser$1;
  function print$1(method, ...args) {
    if (typeof args[0] === "string") {
      const message = args.shift();
      method(`[wxt] ${message}`, ...args);
    } else {
      method("[wxt]", ...args);
    }
  }
  const logger$1 = {
    debug: (...args) => print$1(console.debug, ...args),
    log: (...args) => print$1(console.log, ...args),
    warn: (...args) => print$1(console.warn, ...args),
    error: (...args) => print$1(console.error, ...args)
  };
  const _WxtLocationChangeEvent = class _WxtLocationChangeEvent extends Event {
    constructor(newUrl, oldUrl) {
      super(_WxtLocationChangeEvent.EVENT_NAME, {});
      this.newUrl = newUrl;
      this.oldUrl = oldUrl;
    }
  };
  __publicField(_WxtLocationChangeEvent, "EVENT_NAME", getUniqueEventName("wxt:locationchange"));
  let WxtLocationChangeEvent = _WxtLocationChangeEvent;
  function getUniqueEventName(eventName) {
    var _a2;
    return `${(_a2 = browser == null ? void 0 : browser.runtime) == null ? void 0 : _a2.id}:${"content"}:${eventName}`;
  }
  function createLocationWatcher(ctx) {
    let interval;
    let oldUrl;
    return {
      /**
       * Ensure the location watcher is actively looking for URL changes. If it's already watching,
       * this is a noop.
       */
      run() {
        if (interval != null) return;
        oldUrl = new URL(location.href);
        interval = ctx.setInterval(() => {
          let newUrl = new URL(location.href);
          if (newUrl.href !== oldUrl.href) {
            window.dispatchEvent(new WxtLocationChangeEvent(newUrl, oldUrl));
            oldUrl = newUrl;
          }
        }, 1e3);
      }
    };
  }
  const _ContentScriptContext = class _ContentScriptContext {
    constructor(contentScriptName, options) {
      __publicField(this, "isTopFrame", window.self === window.top);
      __publicField(this, "abortController");
      __publicField(this, "locationWatcher", createLocationWatcher(this));
      __publicField(this, "receivedMessageIds", /* @__PURE__ */ new Set());
      this.contentScriptName = contentScriptName;
      this.options = options;
      this.abortController = new AbortController();
      if (this.isTopFrame) {
        this.listenForNewerScripts({ ignoreFirstEvent: true });
        this.stopOldScripts();
      } else {
        this.listenForNewerScripts();
      }
    }
    get signal() {
      return this.abortController.signal;
    }
    abort(reason) {
      return this.abortController.abort(reason);
    }
    get isInvalid() {
      if (browser.runtime.id == null) {
        this.notifyInvalidated();
      }
      return this.signal.aborted;
    }
    get isValid() {
      return !this.isInvalid;
    }
    /**
     * Add a listener that is called when the content script's context is invalidated.
     *
     * @returns A function to remove the listener.
     *
     * @example
     * browser.runtime.onMessage.addListener(cb);
     * const removeInvalidatedListener = ctx.onInvalidated(() => {
     *   browser.runtime.onMessage.removeListener(cb);
     * })
     * // ...
     * removeInvalidatedListener();
     */
    onInvalidated(cb) {
      this.signal.addEventListener("abort", cb);
      return () => this.signal.removeEventListener("abort", cb);
    }
    /**
     * Return a promise that never resolves. Useful if you have an async function that shouldn't run
     * after the context is expired.
     *
     * @example
     * const getValueFromStorage = async () => {
     *   if (ctx.isInvalid) return ctx.block();
     *
     *   // ...
     * }
     */
    block() {
      return new Promise(() => {
      });
    }
    /**
     * Wrapper around `window.setInterval` that automatically clears the interval when invalidated.
     */
    setInterval(handler, timeout) {
      const id = setInterval(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearInterval(id));
      return id;
    }
    /**
     * Wrapper around `window.setTimeout` that automatically clears the interval when invalidated.
     */
    setTimeout(handler, timeout) {
      const id = setTimeout(() => {
        if (this.isValid) handler();
      }, timeout);
      this.onInvalidated(() => clearTimeout(id));
      return id;
    }
    /**
     * Wrapper around `window.requestAnimationFrame` that automatically cancels the request when
     * invalidated.
     */
    requestAnimationFrame(callback) {
      const id = requestAnimationFrame((...args) => {
        if (this.isValid) callback(...args);
      });
      this.onInvalidated(() => cancelAnimationFrame(id));
      return id;
    }
    /**
     * Wrapper around `window.requestIdleCallback` that automatically cancels the request when
     * invalidated.
     */
    requestIdleCallback(callback, options) {
      const id = requestIdleCallback((...args) => {
        if (!this.signal.aborted) callback(...args);
      }, options);
      this.onInvalidated(() => cancelIdleCallback(id));
      return id;
    }
    addEventListener(target, type, handler, options) {
      var _a2;
      if (type === "wxt:locationchange") {
        if (this.isValid) this.locationWatcher.run();
      }
      (_a2 = target.addEventListener) == null ? void 0 : _a2.call(
        target,
        type.startsWith("wxt:") ? getUniqueEventName(type) : type,
        handler,
        {
          ...options,
          signal: this.signal
        }
      );
    }
    /**
     * @internal
     * Abort the abort controller and execute all `onInvalidated` listeners.
     */
    notifyInvalidated() {
      this.abort("Content script context invalidated");
      logger$1.debug(
        `Content script "${this.contentScriptName}" context invalidated`
      );
    }
    stopOldScripts() {
      window.postMessage(
        {
          type: _ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
          contentScriptName: this.contentScriptName,
          messageId: Math.random().toString(36).slice(2)
        },
        "*"
      );
    }
    verifyScriptStartedEvent(event) {
      var _a2, _b2, _c;
      const isScriptStartedEvent = ((_a2 = event.data) == null ? void 0 : _a2.type) === _ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE;
      const isSameContentScript = ((_b2 = event.data) == null ? void 0 : _b2.contentScriptName) === this.contentScriptName;
      const isNotDuplicate = !this.receivedMessageIds.has((_c = event.data) == null ? void 0 : _c.messageId);
      return isScriptStartedEvent && isSameContentScript && isNotDuplicate;
    }
    listenForNewerScripts(options) {
      let isFirst = true;
      const cb = (event) => {
        if (this.verifyScriptStartedEvent(event)) {
          this.receivedMessageIds.add(event.data.messageId);
          const wasFirst = isFirst;
          isFirst = false;
          if (wasFirst && (options == null ? void 0 : options.ignoreFirstEvent)) return;
          this.notifyInvalidated();
        }
      };
      addEventListener("message", cb);
      this.onInvalidated(() => removeEventListener("message", cb));
    }
  };
  __publicField(_ContentScriptContext, "SCRIPT_STARTED_MESSAGE_TYPE", getUniqueEventName(
    "wxt:content-script-started"
  ));
  let ContentScriptContext = _ContentScriptContext;
  function initPlugins() {
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
  const result = (async () => {
    try {
      initPlugins();
      const { main, ...options } = definition;
      const ctx = new ContentScriptContext("content", options);
      return await main(ctx);
    } catch (err) {
      logger.error(
        `The content script "${"content"}" crashed on startup!`,
        err
      );
      throw err;
    }
  })();
  return result;
}();
content;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1jb250ZW50LXNjcmlwdC5tanMiLCIuLi8uLi8uLi9lbnRyeXBvaW50cy9jb250ZW50LnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3eHQtZGV2L2Jyb3dzZXIvc3JjL2luZGV4Lm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9sb2dnZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2N1c3RvbS1ldmVudHMubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2NvbnRlbnQtc2NyaXB0LWNvbnRleHQubWpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBmdW5jdGlvbiBkZWZpbmVDb250ZW50U2NyaXB0KGRlZmluaXRpb24pIHtcbiAgcmV0dXJuIGRlZmluaXRpb247XG59XG4iLCJleHBvcnQgZGVmYXVsdCBkZWZpbmVDb250ZW50U2NyaXB0KHtcclxuICBtYXRjaGVzOiBbXHJcbiAgICAnaHR0cHM6Ly9jaGF0Lm9wZW5haS5jb20vKicsXHJcbiAgICAnaHR0cHM6Ly9jbGF1ZGUuYWkvKicsXHJcbiAgICAnaHR0cHM6Ly9nZW1pbmkuZ29vZ2xlLmNvbS8qJyxcclxuICAgICdodHRwczovL2NoYXQuZGVlcHNlZWsuY29tLyonLFxyXG4gICAgJ2h0dHBzOi8vd3d3LmRvdWJhby5jb20vKicsXHJcbiAgXSxcclxuICBtYWluKCkge1xyXG4gICAgY29uc29sZS5sb2coJ0FJLVByb21wdHMgY29udGVudCBzY3JpcHQgbG9hZGVkLiBSZWFkeSB0byBhc3Npc3QuJyk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaW5kcyB0aGUgdGFyZ2V0IHRleHQgYXJlYSBvbiB0aGUgcGFnZSBhbmQgYXR0YWNoZXMgYW4gaW5wdXQgbGlzdGVuZXIuXHJcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGlzIGRlc2lnbmVkIHRvIHdvcmsgd2l0aCBTUEFzIHdoZXJlIHRoZSBlbGVtZW50IG1pZ2h0IG5vdCBiZVxyXG4gICAgICogYXZhaWxhYmxlIG9uIGluaXRpYWwgbG9hZC5cclxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSAtIFRydWUgaWYgdGhlIGxpc3RlbmVyIHdhcyBhdHRhY2hlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBmaW5kQW5kQXR0YWNoTGlzdGVuZXIoKTogYm9vbGVhbiB7XHJcbiAgICAgIC8vIEEgbW9yZSByb2J1c3Qgc2VsZWN0b3IgdG8gdGFyZ2V0IHZhcmlvdXMgQUkgY2hhdCBwbGF0Zm9ybXMnIG1haW4gaW5wdXQuXHJcbiAgICAgIGNvbnN0IHRhcmdldFNlbGVjdG9yID1cclxuICAgICAgICAndGV4dGFyZWFbaWQqPVwicHJvbXB0XCJdLCB0ZXh0YXJlYVtwbGFjZWhvbGRlcio9XCJNZXNzYWdlXCJdLCB0ZXh0YXJlYVtwbGFjZWhvbGRlcio9XCJTZW5kIGEgbWVzc2FnZVwiXSc7XHJcbiAgICAgIGNvbnN0IHRleHRhcmVhID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcjxIVE1MVGV4dEFyZWFFbGVtZW50Pih0YXJnZXRTZWxlY3Rvcik7XHJcblxyXG4gICAgICBpZiAodGV4dGFyZWEgJiYgIXRleHRhcmVhLmRhdGFzZXQucHJvbXB0TGlzdGVuZXJBdHRhY2hlZCkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdJbnB1dCBhcmVhIGZvdW5kLCBhdHRhY2hpbmcgbGlzdGVuZXI6JywgdGV4dGFyZWEpO1xyXG4gICAgICAgIHRleHRhcmVhLmRhdGFzZXQucHJvbXB0TGlzdGVuZXJBdHRhY2hlZCA9ICd0cnVlJzsgLy8gTWFyayBhcyBhdHRhY2hlZCB0byBwcmV2ZW50IGR1cGxpY2F0ZXNcclxuICAgICAgICB0ZXh0YXJlYS5hZGRFdmVudExpc3RlbmVyKCdpbnB1dCcsIGhhbmRsZUlucHV0KTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGFuZGxlcyB0aGUgaW5wdXQgZXZlbnQgb24gdGhlIHRleHRhcmVhLlxyXG4gICAgICogQ2hlY2tzIGZvciB0aGUgJ0BAJyB0cmlnZ2VyLlxyXG4gICAgICogQHBhcmFtIHtFdmVudH0gZXZlbnQgLSBUaGUgaW5wdXQgZXZlbnQuXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGhhbmRsZUlucHV0KGV2ZW50OiBFdmVudCk6IHZvaWQge1xyXG4gICAgICBjb25zdCB0YXJnZXQgPSBldmVudC50YXJnZXQgYXMgSFRNTFRleHRBcmVhRWxlbWVudDtcclxuICAgICAgaWYgKHRhcmdldC52YWx1ZS5pbmNsdWRlcygnQEAnKSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdUcmlnZ2VyIFwiQEBcIiBkZXRlY3RlZCEgVmFsdWU6JywgdGFyZ2V0LnZhbHVlKTtcclxuICAgICAgICAvLyBGdXR1cmUgaW1wbGVtZW50YXRpb246XHJcbiAgICAgICAgLy8gMS4gU2hvdyBhIHByb21wdCBzZWxlY3Rpb24gVUkgbmVhciB0aGUgdGV4dGFyZWEuXHJcbiAgICAgICAgLy8gMi4gRmlsdGVyIHByb21wdHMgYmFzZWQgb24gdGV4dCBhZnRlciAnQEAnLlxyXG4gICAgICAgIC8vIDMuIE9uIHNlbGVjdGlvbiwgcmVwbGFjZSAnQEAuLi4nIHdpdGggdGhlIHByb21wdCBjb250ZW50LlxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU3RhcnQgcG9sbGluZyB0byBmaW5kIHRoZSB0ZXh0YXJlYS5cclxuICAgIC8vIFVzaW5nIGEgTXV0YXRpb25PYnNlcnZlciBpcyBtb3JlIGVmZmljaWVudCwgYnV0IHNldEludGVydmFsIGlzIHNpbXBsZXIgZm9yIHRoaXMgZmlyc3Qgc3RlcC5cclxuICAgIGNvbnN0IGludGVydmFsSWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgIGlmIChmaW5kQW5kQXR0YWNoTGlzdGVuZXIoKSkge1xyXG4gICAgICAgIC8vIE9uY2UgZm91bmQsIHdlIGNhbiBzdG9wIHBvbGxpbmcuXHJcbiAgICAgICAgLy8gSG93ZXZlciwgZm9yIFNQQXMsIHRoZSBlbGVtZW50IG1pZ2h0IGJlIHJlbW92ZWQgYW5kIHJlLWFkZGVkLlxyXG4gICAgICAgIC8vIEEgbW9yZSByb2J1c3Qgc29sdXRpb24gd2l0aCBNdXRhdGlvbk9ic2VydmVyIHdpbGwgYmUgbmVlZGVkIGxhdGVyLlxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdMaXN0ZW5lciBhdHRhY2hlZC4gUG9sbGluZyB3aWxsIHN0b3AgZm9yIG5vdy4nKTtcclxuICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsSWQpO1xyXG4gICAgICB9XHJcbiAgICB9LCAxMDAwKTsgLy8gUG9sbCBldmVyeSBzZWNvbmQuXHJcbiAgfSxcclxufSk7ICIsIi8vICNyZWdpb24gc25pcHBldFxuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBnbG9iYWxUaGlzLmJyb3dzZXI/LnJ1bnRpbWU/LmlkXG4gID8gZ2xvYmFsVGhpcy5icm93c2VyXG4gIDogZ2xvYmFsVGhpcy5jaHJvbWU7XG4vLyAjZW5kcmVnaW9uIHNuaXBwZXRcbiIsImltcG9ydCB7IGJyb3dzZXIgYXMgX2Jyb3dzZXIgfSBmcm9tIFwiQHd4dC1kZXYvYnJvd3NlclwiO1xuZXhwb3J0IGNvbnN0IGJyb3dzZXIgPSBfYnJvd3NlcjtcbmV4cG9ydCB7fTtcbiIsImZ1bmN0aW9uIHByaW50KG1ldGhvZCwgLi4uYXJncykge1xuICBpZiAoaW1wb3J0Lm1ldGEuZW52Lk1PREUgPT09IFwicHJvZHVjdGlvblwiKSByZXR1cm47XG4gIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBhcmdzLnNoaWZ0KCk7XG4gICAgbWV0aG9kKGBbd3h0XSAke21lc3NhZ2V9YCwgLi4uYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgbWV0aG9kKFwiW3d4dF1cIiwgLi4uYXJncyk7XG4gIH1cbn1cbmV4cG9ydCBjb25zdCBsb2dnZXIgPSB7XG4gIGRlYnVnOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5kZWJ1ZywgLi4uYXJncyksXG4gIGxvZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUubG9nLCAuLi5hcmdzKSxcbiAgd2FybjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUud2FybiwgLi4uYXJncyksXG4gIGVycm9yOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5lcnJvciwgLi4uYXJncylcbn07XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG5leHBvcnQgY2xhc3MgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcbiAgY29uc3RydWN0b3IobmV3VXJsLCBvbGRVcmwpIHtcbiAgICBzdXBlcihXeHRMb2NhdGlvbkNoYW5nZUV2ZW50LkVWRU5UX05BTUUsIHt9KTtcbiAgICB0aGlzLm5ld1VybCA9IG5ld1VybDtcbiAgICB0aGlzLm9sZFVybCA9IG9sZFVybDtcbiAgfVxuICBzdGF0aWMgRVZFTlRfTkFNRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcInd4dDpsb2NhdGlvbmNoYW5nZVwiKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRVbmlxdWVFdmVudE5hbWUoZXZlbnROYW1lKSB7XG4gIHJldHVybiBgJHticm93c2VyPy5ydW50aW1lPy5pZH06JHtpbXBvcnQubWV0YS5lbnYuRU5UUllQT0lOVH06JHtldmVudE5hbWV9YDtcbn1cbiIsImltcG9ydCB7IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQgfSBmcm9tIFwiLi9jdXN0b20tZXZlbnRzLm1qc1wiO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcihjdHgpIHtcbiAgbGV0IGludGVydmFsO1xuICBsZXQgb2xkVXJsO1xuICByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIEVuc3VyZSB0aGUgbG9jYXRpb24gd2F0Y2hlciBpcyBhY3RpdmVseSBsb29raW5nIGZvciBVUkwgY2hhbmdlcy4gSWYgaXQncyBhbHJlYWR5IHdhdGNoaW5nLFxuICAgICAqIHRoaXMgaXMgYSBub29wLlxuICAgICAqL1xuICAgIHJ1bigpIHtcbiAgICAgIGlmIChpbnRlcnZhbCAhPSBudWxsKSByZXR1cm47XG4gICAgICBvbGRVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuICAgICAgaW50ZXJ2YWwgPSBjdHguc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgICBsZXQgbmV3VXJsID0gbmV3IFVSTChsb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgaWYgKG5ld1VybC5ocmVmICE9PSBvbGRVcmwuaHJlZikge1xuICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50KG5ld1VybCwgb2xkVXJsKSk7XG4gICAgICAgICAgb2xkVXJsID0gbmV3VXJsO1xuICAgICAgICB9XG4gICAgICB9LCAxZTMpO1xuICAgIH1cbiAgfTtcbn1cbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tIFwid3h0L2Jyb3dzZXJcIjtcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuLi91dGlscy9pbnRlcm5hbC9sb2dnZXIubWpzXCI7XG5pbXBvcnQge1xuICBnZXRVbmlxdWVFdmVudE5hbWVcbn0gZnJvbSBcIi4vaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanNcIjtcbmltcG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9IGZyb20gXCIuL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzXCI7XG5leHBvcnQgY2xhc3MgQ29udGVudFNjcmlwdENvbnRleHQge1xuICBjb25zdHJ1Y3Rvcihjb250ZW50U2NyaXB0TmFtZSwgb3B0aW9ucykge1xuICAgIHRoaXMuY29udGVudFNjcmlwdE5hbWUgPSBjb250ZW50U2NyaXB0TmFtZTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuYWJvcnRDb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGlmICh0aGlzLmlzVG9wRnJhbWUpIHtcbiAgICAgIHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKHsgaWdub3JlRmlyc3RFdmVudDogdHJ1ZSB9KTtcbiAgICAgIHRoaXMuc3RvcE9sZFNjcmlwdHMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5saXN0ZW5Gb3JOZXdlclNjcmlwdHMoKTtcbiAgICB9XG4gIH1cbiAgc3RhdGljIFNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSA9IGdldFVuaXF1ZUV2ZW50TmFtZShcbiAgICBcInd4dDpjb250ZW50LXNjcmlwdC1zdGFydGVkXCJcbiAgKTtcbiAgaXNUb3BGcmFtZSA9IHdpbmRvdy5zZWxmID09PSB3aW5kb3cudG9wO1xuICBhYm9ydENvbnRyb2xsZXI7XG4gIGxvY2F0aW9uV2F0Y2hlciA9IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcih0aGlzKTtcbiAgcmVjZWl2ZWRNZXNzYWdlSWRzID0gLyogQF9fUFVSRV9fICovIG5ldyBTZXQoKTtcbiAgZ2V0IHNpZ25hbCgpIHtcbiAgICByZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuc2lnbmFsO1xuICB9XG4gIGFib3J0KHJlYXNvbikge1xuICAgIHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5hYm9ydChyZWFzb24pO1xuICB9XG4gIGdldCBpc0ludmFsaWQoKSB7XG4gICAgaWYgKGJyb3dzZXIucnVudGltZS5pZCA9PSBudWxsKSB7XG4gICAgICB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnNpZ25hbC5hYm9ydGVkO1xuICB9XG4gIGdldCBpc1ZhbGlkKCkge1xuICAgIHJldHVybiAhdGhpcy5pc0ludmFsaWQ7XG4gIH1cbiAgLyoqXG4gICAqIEFkZCBhIGxpc3RlbmVyIHRoYXQgaXMgY2FsbGVkIHdoZW4gdGhlIGNvbnRlbnQgc2NyaXB0J3MgY29udGV4dCBpcyBpbnZhbGlkYXRlZC5cbiAgICpcbiAgICogQHJldHVybnMgQSBmdW5jdGlvbiB0byByZW1vdmUgdGhlIGxpc3RlbmVyLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKGNiKTtcbiAgICogY29uc3QgcmVtb3ZlSW52YWxpZGF0ZWRMaXN0ZW5lciA9IGN0eC5vbkludmFsaWRhdGVkKCgpID0+IHtcbiAgICogICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLnJlbW92ZUxpc3RlbmVyKGNiKTtcbiAgICogfSlcbiAgICogLy8gLi4uXG4gICAqIHJlbW92ZUludmFsaWRhdGVkTGlzdGVuZXIoKTtcbiAgICovXG4gIG9uSW52YWxpZGF0ZWQoY2IpIHtcbiAgICB0aGlzLnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuICAgIHJldHVybiAoKSA9PiB0aGlzLnNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuICB9XG4gIC8qKlxuICAgKiBSZXR1cm4gYSBwcm9taXNlIHRoYXQgbmV2ZXIgcmVzb2x2ZXMuIFVzZWZ1bCBpZiB5b3UgaGF2ZSBhbiBhc3luYyBmdW5jdGlvbiB0aGF0IHNob3VsZG4ndCBydW5cbiAgICogYWZ0ZXIgdGhlIGNvbnRleHQgaXMgZXhwaXJlZC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogY29uc3QgZ2V0VmFsdWVGcm9tU3RvcmFnZSA9IGFzeW5jICgpID0+IHtcbiAgICogICBpZiAoY3R4LmlzSW52YWxpZCkgcmV0dXJuIGN0eC5ibG9jaygpO1xuICAgKlxuICAgKiAgIC8vIC4uLlxuICAgKiB9XG4gICAqL1xuICBibG9jaygpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKCkgPT4ge1xuICAgIH0pO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldEludGVydmFsYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2xlYXJzIHRoZSBpbnRlcnZhbCB3aGVuIGludmFsaWRhdGVkLlxuICAgKi9cbiAgc2V0SW50ZXJ2YWwoaGFuZGxlciwgdGltZW91dCkge1xuICAgIGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuICAgIH0sIHRpbWVvdXQpO1xuICAgIHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhckludGVydmFsKGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIC8qKlxuICAgKiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldFRpbWVvdXRgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsIHdoZW4gaW52YWxpZGF0ZWQuXG4gICAqL1xuICBzZXRUaW1lb3V0KGhhbmRsZXIsIHRpbWVvdXQpIHtcbiAgICBjb25zdCBpZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuaXNWYWxpZCkgaGFuZGxlcigpO1xuICAgIH0sIHRpbWVvdXQpO1xuICAgIHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjbGVhclRpbWVvdXQoaWQpKTtcbiAgICByZXR1cm4gaWQ7XG4gIH1cbiAgLyoqXG4gICAqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2VscyB0aGUgcmVxdWVzdCB3aGVuXG4gICAqIGludmFsaWRhdGVkLlxuICAgKi9cbiAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKSB7XG4gICAgY29uc3QgaWQgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKC4uLmFyZ3MpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIGNhbGxiYWNrKC4uLmFyZ3MpO1xuICAgIH0pO1xuICAgIHRoaXMub25JbnZhbGlkYXRlZCgoKSA9PiBjYW5jZWxBbmltYXRpb25GcmFtZShpZCkpO1xuICAgIHJldHVybiBpZDtcbiAgfVxuICAvKipcbiAgICogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5yZXF1ZXN0SWRsZUNhbGxiYWNrYCB0aGF0IGF1dG9tYXRpY2FsbHkgY2FuY2VscyB0aGUgcmVxdWVzdCB3aGVuXG4gICAqIGludmFsaWRhdGVkLlxuICAgKi9cbiAgcmVxdWVzdElkbGVDYWxsYmFjayhjYWxsYmFjaywgb3B0aW9ucykge1xuICAgIGNvbnN0IGlkID0gcmVxdWVzdElkbGVDYWxsYmFjaygoLi4uYXJncykgPT4ge1xuICAgICAgaWYgKCF0aGlzLnNpZ25hbC5hYm9ydGVkKSBjYWxsYmFjayguLi5hcmdzKTtcbiAgICB9LCBvcHRpb25zKTtcbiAgICB0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsSWRsZUNhbGxiYWNrKGlkKSk7XG4gICAgcmV0dXJuIGlkO1xuICB9XG4gIGFkZEV2ZW50TGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBoYW5kbGVyLCBvcHRpb25zKSB7XG4gICAgaWYgKHR5cGUgPT09IFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpIHtcbiAgICAgIGlmICh0aGlzLmlzVmFsaWQpIHRoaXMubG9jYXRpb25XYXRjaGVyLnJ1bigpO1xuICAgIH1cbiAgICB0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcj8uKFxuICAgICAgdHlwZS5zdGFydHNXaXRoKFwid3h0OlwiKSA/IGdldFVuaXF1ZUV2ZW50TmFtZSh0eXBlKSA6IHR5cGUsXG4gICAgICBoYW5kbGVyLFxuICAgICAge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBzaWduYWw6IHRoaXMuc2lnbmFsXG4gICAgICB9XG4gICAgKTtcbiAgfVxuICAvKipcbiAgICogQGludGVybmFsXG4gICAqIEFib3J0IHRoZSBhYm9ydCBjb250cm9sbGVyIGFuZCBleGVjdXRlIGFsbCBgb25JbnZhbGlkYXRlZGAgbGlzdGVuZXJzLlxuICAgKi9cbiAgbm90aWZ5SW52YWxpZGF0ZWQoKSB7XG4gICAgdGhpcy5hYm9ydChcIkNvbnRlbnQgc2NyaXB0IGNvbnRleHQgaW52YWxpZGF0ZWRcIik7XG4gICAgbG9nZ2VyLmRlYnVnKFxuICAgICAgYENvbnRlbnQgc2NyaXB0IFwiJHt0aGlzLmNvbnRlbnRTY3JpcHROYW1lfVwiIGNvbnRleHQgaW52YWxpZGF0ZWRgXG4gICAgKTtcbiAgfVxuICBzdG9wT2xkU2NyaXB0cygpIHtcbiAgICB3aW5kb3cucG9zdE1lc3NhZ2UoXG4gICAgICB7XG4gICAgICAgIHR5cGU6IENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSxcbiAgICAgICAgY29udGVudFNjcmlwdE5hbWU6IHRoaXMuY29udGVudFNjcmlwdE5hbWUsXG4gICAgICAgIG1lc3NhZ2VJZDogTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMilcbiAgICAgIH0sXG4gICAgICBcIipcIlxuICAgICk7XG4gIH1cbiAgdmVyaWZ5U2NyaXB0U3RhcnRlZEV2ZW50KGV2ZW50KSB7XG4gICAgY29uc3QgaXNTY3JpcHRTdGFydGVkRXZlbnQgPSBldmVudC5kYXRhPy50eXBlID09PSBDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEU7XG4gICAgY29uc3QgaXNTYW1lQ29udGVudFNjcmlwdCA9IGV2ZW50LmRhdGE/LmNvbnRlbnRTY3JpcHROYW1lID09PSB0aGlzLmNvbnRlbnRTY3JpcHROYW1lO1xuICAgIGNvbnN0IGlzTm90RHVwbGljYXRlID0gIXRoaXMucmVjZWl2ZWRNZXNzYWdlSWRzLmhhcyhldmVudC5kYXRhPy5tZXNzYWdlSWQpO1xuICAgIHJldHVybiBpc1NjcmlwdFN0YXJ0ZWRFdmVudCAmJiBpc1NhbWVDb250ZW50U2NyaXB0ICYmIGlzTm90RHVwbGljYXRlO1xuICB9XG4gIGxpc3RlbkZvck5ld2VyU2NyaXB0cyhvcHRpb25zKSB7XG4gICAgbGV0IGlzRmlyc3QgPSB0cnVlO1xuICAgIGNvbnN0IGNiID0gKGV2ZW50KSA9PiB7XG4gICAgICBpZiAodGhpcy52ZXJpZnlTY3JpcHRTdGFydGVkRXZlbnQoZXZlbnQpKSB7XG4gICAgICAgIHRoaXMucmVjZWl2ZWRNZXNzYWdlSWRzLmFkZChldmVudC5kYXRhLm1lc3NhZ2VJZCk7XG4gICAgICAgIGNvbnN0IHdhc0ZpcnN0ID0gaXNGaXJzdDtcbiAgICAgICAgaXNGaXJzdCA9IGZhbHNlO1xuICAgICAgICBpZiAod2FzRmlyc3QgJiYgb3B0aW9ucz8uaWdub3JlRmlyc3RFdmVudCkgcmV0dXJuO1xuICAgICAgICB0aGlzLm5vdGlmeUludmFsaWRhdGVkKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICBhZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBjYik7XG4gICAgdGhpcy5vbkludmFsaWRhdGVkKCgpID0+IHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIGNiKSk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJkZWZpbml0aW9uIiwiYnJvd3NlciIsIl9icm93c2VyIiwicHJpbnQiLCJsb2dnZXIiLCJfYSIsIl9iIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBTyxXQUFTLG9CQUFvQkEsYUFBWTtBQUM5QyxXQUFPQTtBQUFBLEVBQ1Q7QUNGQSxRQUFBLGFBQUEsb0JBQUE7QUFBQSxJQUFtQyxTQUFBO0FBQUEsTUFDeEI7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0YsT0FBQTtBQUVFLGNBQUEsSUFBQSxvREFBQTtBQVFBLGVBQUEsd0JBQUE7QUFFRSxjQUFBLGlCQUFBO0FBRUEsY0FBQSxXQUFBLFNBQUEsY0FBQSxjQUFBO0FBRUEsWUFBQSxZQUFBLENBQUEsU0FBQSxRQUFBLHdCQUFBO0FBQ0Usa0JBQUEsSUFBQSx5Q0FBQSxRQUFBO0FB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
