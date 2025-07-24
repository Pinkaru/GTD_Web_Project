const CACHE_NAME = 'clarity-matrix-v1.0.0';
const urlsToCache = [
  '/',
  '/main',
  '/inbox', 
  '/today',
  '/projects',
  '/eisenhower_matrix',
  '/completed',
  '/settings',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/storage-manager.js',
  '/manifest.json'
];

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('🔧 Service Worker: 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 캐시 열기 성공');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: 설치 완료');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('❌ Service Worker 설치 실패:', err);
      })
  );
});

// 활성화 이벤트 
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: 활성화 중...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: 활성화 완료');
      return self.clients.claim();
    })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  // POST 요청은 캐시하지 않음
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 캐시에서 발견되면 캐시된 버전 반환
        if (response) {
          console.log('📋 캐시에서 제공:', event.request.url);
          return response;
        }

        // 캐시에 없으면 네트워크에서 가져옴
        console.log('🌐 네트워크에서 가져옴:', event.request.url);
        return fetch(event.request).then(response => {
          // 응답이 유효하지 않으면 그대로 반환
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // 응답 복사하여 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(() => {
          // 네트워크 실패 시 오프라인 페이지 제공 (선택사항)
          if (event.request.destination === 'document') {
            return caches.match('/main');
          }
        });
      })
  );
});

// 백그라운드 동기화 (선택사항)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('🔄 백그라운드 동기화 실행');
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // 오프라인 상태에서 저장된 데이터를 서버와 동기화
  return new Promise((resolve) => {
    console.log('📡 백그라운드 동기화 완료');
    resolve();
  });
}

// 푸시 알림 (선택사항)
self.addEventListener('push', event => {
  if (!event.data) return;

  const options = {
    body: event.data.text(),
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '앱 열기',
        icon: '/assets/images/checkmark.png'
      },
      {
        action: 'close', 
        title: '닫기',
        icon: '/assets/images/close.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Clarity Matrix', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/main')
    );
  }
});