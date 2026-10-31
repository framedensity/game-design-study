// オフラインでも開けるようにするためのファイル（Service Worker）
//
// ネットにつながっている時は、いつも最新のファイルを取りに行き、取れたものを保存しておきます。
// つながっていない時（電車の中など）は、保存しておいたものを使います。
// ファイルを足した時は、下の FILES にも足してください。

const CACHE = 'gds-v3';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './data/quiz.js',
  './data/tips.js',
  './data/rules.js',
  './data/problems.js',
  './data/library.js',
  './data/sakurai.js',
  './js/ruby.js',
  './js/store.js',
  './js/ui.js',
  './js/demos.js',
  './js/tips.js',
  './js/quiz.js',
  './js/exercise.js',
  './js/breakdown.js',
  './js/library.js',
  './js/glossary.js',
  './js/sakurai.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});
