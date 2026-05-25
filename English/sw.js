/* Service Worker —— 离线缓存 */
var CACHE_APP = 'flashcard-app-v4';
var CACHE_DATA = 'flashcard-data-v4';
var STATIC_FILES = [
  './',
  './index.html',
  './manifest.json',
  './styles.css',
  './app.bundle.js'
];

/* 安装：预缓存应用核心文件 */
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_APP).then(function (cache) {
      return Promise.allSettled(
        STATIC_FILES.map(function (url) {
          return cache.add(url).catch(function (err) {
            console.warn('SW: failed to cache', url, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

/* 激活：清理旧缓存 */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_APP && k !== CACHE_DATA; })
          .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* 请求拦截 */
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);

  /* 词书 JSON：缓存优先（几乎不变的数据） */
  if (url.pathname.indexOf('/wordbooks/') !== -1) {
    event.respondWith(
      caches.open(CACHE_DATA).then(function (cache) {
        return cache.match(event.request).then(function (cached) {
          var fetchPromise = fetch(event.request).then(function (response) {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  /* 应用文件：stale-while-revalidate */
  event.respondWith(
    caches.open(CACHE_APP).then(function (cache) {
      return cache.match(event.request).then(function (cached) {
        var fetchPromise = fetch(event.request).then(function (response) {
          if (response && response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(function () {
          return cached;
        });
        return cached || fetchPromise;
      });
    })
  );
});
