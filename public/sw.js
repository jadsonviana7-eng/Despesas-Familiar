const CACHE_NAME = 'fin-app-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Instalação do Service Worker - Caching dos arquivos estáticos iniciais
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação do Service Worker - Limpeza de caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptador de requisições (Fetch) - Estratégia Stale-While-Revalidate
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Evita cachear chamadas de API do Firebase (Firestore/Auth) para não interferir na sincronização nativa
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebase')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Se houver no cache, retorna imediatamente e atualiza em background
        fetch(e.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
            }
          })
          .catch((err) => console.log('Erro de rede ao atualizar cache em background:', err));
        return cachedResponse;
      }
      
      // Busca na rede se não estiver no cache
      return fetch(e.request).then((networkResponse) => {
        if (e.request.method === 'GET' && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Caso esteja offline e queira navegar para outra rota, serve a index.html
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
