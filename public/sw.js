/**
 * 蚊媒监测系统 Service Worker
 * 功能：离线缓存静态资源、百度地图瓦片、Supabase 图片，支持预下载地图区域
 * 版本: v1.0
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const TILE_CACHE = `baidu-tiles-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// 静态资源列表（安装时预缓存）
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  // Vite 构建后的 JS/CSS 会通过 workbox 自动添加，这里仅作为基础
];

// 安装事件：预缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // 立即激活
});

// 激活事件：清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (![STATIC_CACHE, TILE_CACHE, IMAGE_CACHE, API_CACHE].includes(name)) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// 判断请求是否为百度地图瓦片
function isBaiduTile(request) {
  const url = new URL(request.url);
  return url.hostname.includes('map.bdimg.com') && url.pathname.includes('/tile/');
}

// 判断请求是否为 Supabase Storage 图片
function isStorageImage(request) {
  const url = new URL(request.url);
  return url.hostname.includes('supabase.co') && url.pathname.includes('/storage/v1/object/public/');
}

// 判断是否为 API 请求 (Edge Function)
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || url.pathname.includes('/functions/v1/');
}

// 请求拦截
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. 百度地图瓦片：Cache First
  if (isBaiduTile(request)) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 2. Storage 图片：Cache First
  if (isStorageImage(request)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 3. API 请求：Network First（离线时使用缓存）
  if (isApiRequest(request)) {
    event.respondWith(
      fetch(request).then((response) => {
        // 只缓存 GET 请求的成功响应
        if (request.method === 'GET' && response.ok) {
          const cloned = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, cloned);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(request).then((cached) => cached || new Response('离线无缓存', { status: 503 }));
      })
    );
    return;
  }

  // 4. 其他请求（静态资源等）：Cache First，fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        // 可选：缓存 JS/CSS 等
        if (request.method === 'GET' && response.ok && request.url.startsWith(self.location.origin)) {
          const cloned = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, cloned);
          });
        }
        return response;
      });
    })
  );
});

// 监听主线程消息（用于预下载地图瓦片）
self.addEventListener('message', (event) => {
  const { action, payload } = event.data;
  if (action === 'CACHE_TILES' && payload && Array.isArray(payload.urls)) {
    event.waitUntil(cacheTiles(payload.urls));
  } else if (action === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * 批量缓存瓦片 URL
 * @param {string[]} urls 瓦片 URL 数组
 */
async function cacheTiles(urls) {
  const cache = await caches.open(TILE_CACHE);
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
      }
    } catch (err) {
      console.warn('[SW] 缓存瓦片失败', url, err);
    }
  }
  // 通知所有客户端缓存完成
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ action: 'TILES_CACHED', urls });
  });
}