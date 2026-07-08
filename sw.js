// 缓存名称，更新SW时修改版本号可强制刷新缓存
const CACHE_NAME = 'kuaiJiShi-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  // 如果图标与 index.html 同目录，请添加图标路径
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 安装事件：预缓存静态资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('缓存静态资源');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // 跳过等待，让新SW立即激活
  self.skipWaiting();
});

// 激活事件：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截：优先使用缓存，离线时回退到缓存数据
self.addEventListener('fetch', event => {
  // 对于 localhost 或 data URL 等不处理
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // 命中缓存直接返回
      if (cachedResponse) {
        return cachedResponse;
      }

      // 否则发起网络请求，并动态缓存（对页面和API均可）
      return fetch(event.request).then(response => {
        // 只缓存成功的GET请求
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          // 把请求的URL加入缓存（如未来的API请求也可以缓存）
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // 网络错误（离线）时，对于页面请求可以返回缓存的 index.html
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        // 其他资源无法获取时什么也不返回
      });
    })
  );
});
