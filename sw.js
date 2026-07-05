const CACHE_VERSION = 'v1';
const CACHE_NAME = 'cupper-account-' + CACHE_VERSION;

// 需要缓存的文件列表（只缓存最必要的文件）
const CACHE_FILES = [
  './',
  'manifest.json',
  'icon.png'
];

// 安装 Service Worker 并缓存关键文件
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
});

// 拦截请求：优先使用网络，网络失败时使用缓存
self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request).catch(function() {
      return caches.match(event.request);
    })
  );
});