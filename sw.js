// ============================================
// tablo — Service Worker (Resilient)
// ============================================

(function() {
  'use strict';

  var CACHE_NAME = 'tablo-v0.1.0';
  
  // ONLY cache files that actually exist
  var ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './assets/css/style.css',
    './assets/css/icons.css',
    './assets/js/config.js',
    './assets/js/header.js',
    './assets/js/footer.js',
    './assets/js/pwa-install.js',
    './assets/js/translations.json',
    './assets/fonts/nunito-regular.woff2',
    './assets/fonts/nunito-semibold.woff2',
    './assets/fonts/nunito-bold.woff2',
    './assets/fonts/forkawesome-webfont.woff2',
    './assets/images/favicon.svg',
    './games/memory-match/index.html',
    './games/memory-match/game.js',
    './games/memory-match/styles.css'
  ];

  // ========== INSTALL ==========
  self.addEventListener('install', function(event) {
    event.waitUntil(
      Promise.all(
        ASSETS_TO_CACHE.map(function(url) {
          return caches.open(CACHE_NAME).then(function(cache) {
            return cache.add(url).catch(function(err) {
              console.warn('SW: Failed to cache', url, err);
            });
          });
        })
      ).then(function() {
        return self.skipWaiting();
      })
    );
  });

  // ========== ACTIVATE ==========
  self.addEventListener('activate', function(event) {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.filter(function(cacheName) {
            return cacheName !== CACHE_NAME;
          }).map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      }).then(function() {
        return self.clients.claim();
      })
    );
  });

  // ========== FETCH ==========
  self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          if (response) {
            return response;
          }
          return fetch(event.request).then(function(response) {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            var responseToCache = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseToCache);
            });
            return response;
          });
        }).catch(function() {
          // Offline fallback
          return caches.match('./index.html');
        })
    );
  });

})();