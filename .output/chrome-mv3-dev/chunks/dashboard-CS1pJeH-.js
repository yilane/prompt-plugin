(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
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
{
  try {
    const ws2 = getDevServerWebSocket();
    ws2.addWxtEventListener("wxt:reload-page", (event) => {
      if (event.detail === location.pathname.substring(1)) location.reload();
    });
  } catch (err) {
    logger.error("Failed to setup web socket connection with dev server", err);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGFzaGJvYXJkLUNTMXBKZUgtLmpzIiwic291cmNlcyI6WyIuLi8uLi8uLi9ub2RlX21vZHVsZXMvd3h0L2Rpc3QvdmlydHVhbC9yZWxvYWQtaHRtbC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiZnVuY3Rpb24gcHJpbnQobWV0aG9kLCAuLi5hcmdzKSB7XG4gIGlmIChpbXBvcnQubWV0YS5lbnYuTU9ERSA9PT0gXCJwcm9kdWN0aW9uXCIpIHJldHVybjtcbiAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSBcInN0cmluZ1wiKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGFyZ3Muc2hpZnQoKTtcbiAgICBtZXRob2QoYFt3eHRdICR7bWVzc2FnZX1gLCAuLi5hcmdzKTtcbiAgfSBlbHNlIHtcbiAgICBtZXRob2QoXCJbd3h0XVwiLCAuLi5hcmdzKTtcbiAgfVxufVxuY29uc3QgbG9nZ2VyID0ge1xuICBkZWJ1ZzogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZGVidWcsIC4uLmFyZ3MpLFxuICBsb2c6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmxvZywgLi4uYXJncyksXG4gIHdhcm46ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLndhcm4sIC4uLmFyZ3MpLFxuICBlcnJvcjogKC4uLmFyZ3MpID0+IHByaW50KGNvbnNvbGUuZXJyb3IsIC4uLmFyZ3MpXG59O1xuXG5sZXQgd3M7XG5mdW5jdGlvbiBnZXREZXZTZXJ2ZXJXZWJTb2NrZXQoKSB7XG4gIGlmIChpbXBvcnQubWV0YS5lbnYuQ09NTUFORCAhPT0gXCJzZXJ2ZVwiKVxuICAgIHRocm93IEVycm9yKFxuICAgICAgXCJNdXN0IGJlIHJ1bm5pbmcgV1hUIGRldiBjb21tYW5kIHRvIGNvbm5lY3QgdG8gY2FsbCBnZXREZXZTZXJ2ZXJXZWJTb2NrZXQoKVwiXG4gICAgKTtcbiAgaWYgKHdzID09IG51bGwpIHtcbiAgICBjb25zdCBzZXJ2ZXJVcmwgPSBfX0RFVl9TRVJWRVJfT1JJR0lOX187XG4gICAgbG9nZ2VyLmRlYnVnKFwiQ29ubmVjdGluZyB0byBkZXYgc2VydmVyIEBcIiwgc2VydmVyVXJsKTtcbiAgICB3cyA9IG5ldyBXZWJTb2NrZXQoc2VydmVyVXJsLCBcInZpdGUtaG1yXCIpO1xuICAgIHdzLmFkZFd4dEV2ZW50TGlzdGVuZXIgPSB3cy5hZGRFdmVudExpc3RlbmVyLmJpbmQod3MpO1xuICAgIHdzLnNlbmRDdXN0b20gPSAoZXZlbnQsIHBheWxvYWQpID0+IHdzPy5zZW5kKEpTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJjdXN0b21cIiwgZXZlbnQsIHBheWxvYWQgfSkpO1xuICAgIHdzLmFkZEV2ZW50TGlzdGVuZXIoXCJvcGVuXCIsICgpID0+IHtcbiAgICAgIGxvZ2dlci5kZWJ1ZyhcIkNvbm5lY3RlZCB0byBkZXYgc2VydmVyXCIpO1xuICAgIH0pO1xuICAgIHdzLmFkZEV2ZW50TGlzdGVuZXIoXCJjbG9zZVwiLCAoKSA9PiB7XG4gICAgICBsb2dnZXIuZGVidWcoXCJEaXNjb25uZWN0ZWQgZnJvbSBkZXYgc2VydmVyXCIpO1xuICAgIH0pO1xuICAgIHdzLmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGxvZ2dlci5lcnJvcihcIkZhaWxlZCB0byBjb25uZWN0IHRvIGRldiBzZXJ2ZXJcIiwgZXZlbnQpO1xuICAgIH0pO1xuICAgIHdzLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIChlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5wYXJzZShlLmRhdGEpO1xuICAgICAgICBpZiAobWVzc2FnZS50eXBlID09PSBcImN1c3RvbVwiKSB7XG4gICAgICAgICAgd3M/LmRpc3BhdGNoRXZlbnQoXG4gICAgICAgICAgICBuZXcgQ3VzdG9tRXZlbnQobWVzc2FnZS5ldmVudCwgeyBkZXRhaWw6IG1lc3NhZ2UuZGF0YSB9KVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBsb2dnZXIuZXJyb3IoXCJGYWlsZWQgdG8gaGFuZGxlIG1lc3NhZ2VcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4gd3M7XG59XG5cbmlmIChpbXBvcnQubWV0YS5lbnYuQ09NTUFORCA9PT0gXCJzZXJ2ZVwiKSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgd3MgPSBnZXREZXZTZXJ2ZXJXZWJTb2NrZXQoKTtcbiAgICB3cy5hZGRXeHRFdmVudExpc3RlbmVyKFwid3h0OnJlbG9hZC1wYWdlXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LmRldGFpbCA9PT0gbG9jYXRpb24ucGF0aG5hbWUuc3Vic3RyaW5nKDEpKSBsb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nZ2VyLmVycm9yKFwiRmFpbGVkIHRvIHNldHVwIHdlYiBzb2NrZXQgY29ubmVjdGlvbiB3aXRoIGRldiBzZXJ2ZXJcIiwgZXJyKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIndzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsU0FBUyxNQUFNLFdBQVcsTUFBTTtBQUU5QixNQUFJLE9BQU8sS0FBSyxDQUFDLE1BQU0sVUFBVTtBQUMvQixVQUFNLFVBQVUsS0FBSyxNQUFBO0FBQ3JCLFdBQU8sU0FBUyxPQUFPLElBQUksR0FBRyxJQUFJO0FBQUEsRUFDcEMsT0FBTztBQUNMLFdBQU8sU0FBUyxHQUFHLElBQUk7QUFBQSxFQUN6QjtBQUNGO0FBQ0EsTUFBTSxTQUFTO0FBQUEsRUFDYixPQUFPLElBQUksU0FBUyxNQUFNLFFBQVEsT0FBTyxHQUFHLElBQUk7QUFBQSxFQUNoRCxLQUFLLElBQUksU0FBUyxNQUFNLFFBQVEsS0FBSyxHQUFHLElBQUk7QUFBQSxFQUM1QyxNQUFNLElBQUksU0FBUyxNQUFNLFFBQVEsTUFBTSxHQUFHLElBQUk7QUFBQSxFQUM5QyxPQUFPLElBQUksU0FBUyxNQUFNLFFBQVEsT0FBTyxHQUFHLElBQUk7QUFDbEQ7QUFFQSxJQUFJO0FBQ0osU0FBUyx3QkFBd0I7QUFLL0IsTUFBSSxNQUFNLE1BQU07QUFDZCxVQUFNLFlBQVk7QUFDbEIsV0FBTyxNQUFNLDhCQUE4QixTQUFTO0FBQ3BELFNBQUssSUFBSSxVQUFVLFdBQVcsVUFBVTtBQUN4QyxPQUFHLHNCQUFzQixHQUFHLGlCQUFpQixLQUFLLEVBQUU7QUFDcEQsT0FBRyxhQUFhLENBQUMsT0FBTyxZQUFZLHlCQUFJLEtBQUssS0FBSyxVQUFVLEVBQUUsTUFBTSxVQUFVLE9BQU8sUUFBQSxDQUFTO0FBQzlGLE9BQUcsaUJBQWlCLFFBQVEsTUFBTTtBQUNoQyxhQUFPLE1BQU0seUJBQXlCO0FBQUEsSUFDeEMsQ0FBQztBQUNELE9BQUcsaUJBQWlCLFNBQVMsTUFBTTtBQUNqQyxhQUFPLE1BQU0sOEJBQThCO0FBQUEsSUFDN0MsQ0FBQztBQUNELE9BQUcsaUJBQWlCLFNBQVMsQ0FBQyxVQUFVO0FBQ3RDLGFBQU8sTUFBTSxtQ0FBbUMsS0FBSztBQUFBLElBQ3ZELENBQUM7QUFDRCxPQUFHLGlCQUFpQixXQUFXLENBQUMsTUFBTTtBQUNwQyxVQUFJO0FBQ0YsY0FBTSxVQUFVLEtBQUssTUFBTSxFQUFFLElBQUk7QUFDakMsWUFBSSxRQUFRLFNBQVMsVUFBVTtBQUM3QixtQ0FBSTtBQUFBLFlBQ0YsSUFBSSxZQUFZLFFBQVEsT0FBTyxFQUFFLFFBQVEsUUFBUSxNQUFNO0FBQUE7QUFBQSxRQUUzRDtBQUFBLE1BQ0YsU0FBUyxLQUFLO0FBQ1osZUFBTyxNQUFNLDRCQUE0QixHQUFHO0FBQUEsTUFDOUM7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0EsU0FBTztBQUNUO0FBRXlDO0FBQ3ZDLE1BQUk7QUFDRixVQUFNQSxNQUFLLHNCQUFBO0FBQ1hBLFFBQUcsb0JBQW9CLG1CQUFtQixDQUFDLFVBQVU7QUFDbkQsVUFBSSxNQUFNLFdBQVcsU0FBUyxTQUFTLFVBQVUsQ0FBQyxZQUFZLE9BQUE7QUFBQSxJQUNoRSxDQUFDO0FBQUEsRUFDSCxTQUFTLEtBQUs7QUFDWixXQUFPLE1BQU0seURBQXlELEdBQUc7QUFBQSxFQUMzRTtBQUNGOyIsInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswXX0=
