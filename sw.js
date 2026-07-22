const CACHE_NAME = 'handwriting-worksheet-v1.4.0';
const ASSETS = [
  './',
  './handwriting-worksheet.html',
  './manifest.json'
];

// 1. 설치: 백그라운드에서 자원 다운로드 및 캐싱
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. 활성화: 구버전 캐시 삭제 및 제어 획득
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 자원 요청 처리 (네트워크 우선 -> 오프라인 캐시 폴백)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // 외부 폰트나 API 등은 캐시 또는 네트워크
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./handwriting-worksheet.html');
          }
        });
      })
  );
});

// 4. 새 버전 대기 해제 명령 수신
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
