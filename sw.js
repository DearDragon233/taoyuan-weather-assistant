/* 桃园农事气象助手 Service Worker（PWA 离线兜底）
 *
 * 缓存策略：
 *  - 导航请求（页面）：network-first，联网时优先拿最新页面（保证更新及时生效），
 *    失败时回退缓存的 index.html；成功响应顺手更新缓存。
 *  - 同源静态资源（图标/清单等）：cache-first，命中直接返回。
 *  - 气象数据接口（api.open-meteo.com / archive-api.open-meteo.com）：绝不拦截，
 *    由页面自己请求并做 localStorage 缓存兜底，Service Worker 不掺和。
 *  - 其他跨域请求一律不处理。
 *
 * 维护提示：改动 index.html 或静态资源后，请把下面的 CACHE_VERSION 版本号 +1
 * （如 taoyuan-shell-v6 -> taoyuan-shell-v5），旧缓存会在 activate 时自动清理。
 */
const CACHE_VERSION = "taoyuan-shell-v6";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png"
];

/* 安装：预缓存页面外壳，并立即接管旧 SW。
   每个资源用 cache:"no-cache" 与服务器校验，避免被浏览器启发式 HTTP 缓存污染预缓存 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => Promise.all(
        SHELL_ASSETS.map((asset) =>
          fetch(asset, { cache: "no-cache" }).then((response) => {
            if (!response.ok) throw new Error("precache " + asset + " HTTP " + response.status);
            return cache.put(asset, response);
          })
        )
      ))
      .then(() => self.skipWaiting())
  );
});

/* 激活：清理旧版本缓存，并让新 SW 立刻控制所有页面 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  /* 气象数据接口绝不拦截：页面自己有 localStorage 数据缓存兜底 */
  if (
    url.hostname === "api.open-meteo.com" ||
    url.hostname === "archive-api.open-meteo.com"
  ) {
    return;
  }
  /* 其他跨域请求一律不管 */
  if (url.origin !== self.location.origin) return;

  /* 导航请求：network-first，断网时回退缓存的 index.html。
     cache:"no-cache" 强制与服务器校验，防止启发式缓存返回过期页面 */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req, { cache: "no-cache" })
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put("./index.html", copy));
          }
          return response;
        })
        .catch(() =>
          caches.match("./index.html").then((cached) => cached || Response.error())
        )
    );
    return;
  }

  /* 同源静态资源：cache-first，未命中时取网络并写入缓存 */
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy));
        }
        return response;
      });
    })
  );
});
