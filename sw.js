/* Service worker de l'ancienne adresse « Le cartable magique ».
   L'appli s'appelle maintenant « Le tableau magique » (https://mickaelguitton.github.io/tableau-magique/).
   Sur les ordinateurs où l'ancienne appli est installée, cette version remplace tout par la page
   de déménagement (index.html), quelle que soit la page demandée (accueil ou outil).
   M. Guitton — fichier mis au point avec l'aide de Claude AI. */
importScripts('version.js');
const CACHE = 'cartable-magique-' + self.APP_VERSION;
const FILES = ['./', 'version.js', 'manifest.webmanifest', 'nouvelle-icone.png', 'favicon.png',
               'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'fonts/fredoka.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

/* Activation : on efface toutes les anciennes versions de l'appli */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('cartable-magique-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Toute page demandée (accueil ou ancien outil) → page de déménagement */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.match('./').then(r => r || fetch(e.request)));
    return;
  }
  e.respondWith(caches.match(url.pathname, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
