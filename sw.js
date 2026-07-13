// ============================================
// Tablo — Service Worker (v0.3.0)
// ============================================

const CACHE_NAME = 'tablo-v0.3.0';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/assets/css/icons.css',
  '/assets/js/config.js',
  '/assets/js/header.js',
  '/assets/js/footer.js',
  '/assets/js/translations.json',
  '/assets/fonts/nunito-regular.woff2',
  '/assets/fonts/nunito-semibold.woff2',
  '/assets/fonts/nunito-bold.woff2',
  '/assets/fonts/forkawesome-webfont.woff2',
  '/assets/images/favicon.svg',

  // Memory Match
  '/games/memory-match/index.html',
  '/games/memory-match/game.js',
  '/games/memory-match/styles.css',

  // Connect 4
  '/games/connect4/index.html',
  '/games/connect4/game.js',
  '/games/connect4/styles.css',

  // Dots & Lines
  '/games/dots-and-lines/index.html',
  '/games/dots-and-lines/game.js',
  '/games/dots-and-lines/styles.css',

  // Tic-Tac-Toe
  '/games/tic-tac-toe/index.html',
  '/games/tic-tac-toe/game.js',
  '/games/tic-tac-toe/styles.css',

  // Simon Says
  '/games/simon-says/index.html',
  '/games/simon-says/game.js',
  '/games/simon-says/styles.css',

  // Number Slider
  '/games/number-slider/index.html',
  '/games/number-slider/game.js',
  '/games/number-slider/styles.css',

  // Lights Out
  '/games/lights-out/index.html',
  '/games/lights-out/game.js',
  '/games/lights-out/styles.css',

  // Whack-a-Mole
  '/games/whack-a-mole/index.html',
  '/games/whack-a-mole/game.js',
  '/games/whack-a-mole/styles.css',

  // Snake
  '/games/snake/index.html',
  '/games/snake/game.js',
  '/games/snake/styles.css',

  // 2048
  '/games/2048/index.html',
  '/games/2048/game.js',
  '/games/2048/styles.css',

  // Wordle
  '/games/wordle/index.html',
  '/games/wordle/game.js',
  '/games/wordle/styles.css',

  // Spot the Difference
  '/games/spot-the-difference/index.html',
  '/games/spot-the-difference/game.js',
  '/games/spot-the-difference/styles.css',

  // Hexagon Puzzle
  '/games/hexagon-puzzle/index.html',
  '/games/hexagon-puzzle/game.js',
  '/games/hexagon-puzzle/styles.css',

  // Chess
  '/games/chess/index.html',
  '/games/chess/game.js',
  '/games/chess/styles.css',

  // Sudoku
  '/games/sudoku/index.html',
  '/games/sudoku/game.js',
  '/games/sudoku/styles.css'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        var promises = PRECACHE_URLS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('Failed to precache:', url, err);
          });
        });
        return Promise.all(promises);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

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
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(function(response) {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            return response;
          })
          .catch(function() {
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});