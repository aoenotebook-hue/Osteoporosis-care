var CACHE_NAME = 'osteo-care-v5';
var SHELL_FILES = [
  './',
  './index.html',
  './app-core.js',
  './app-ui.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // cache: 'reload' goes past the browser's HTTP cache. GitHub Pages lets a
      // file be reused for 10 minutes, and without this a new version's
      // install could store the previous version's page and scripts - and
      // keep serving them, cache-first, until the next version came out.
      return cache.addAll(SHELL_FILES.map(function (url) {
        return new Request(url, { cache: 'reload' });
      }));
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  // Clips stream in byte ranges. Safari will not play a clip answered from a
  // cached whole-file copy, so ranges and clips always go to the network.
  if (event.request.headers.has('range') || /\.mp4(\?|$)/.test(event.request.url)) return;
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return response;
      }).catch(function () {
        return cached;
      });
    })
  );
});
