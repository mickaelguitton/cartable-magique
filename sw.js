/* Service worker du « Cartable magique » : fait fonctionner le portail et tous ses outils sans internet,
   et installe automatiquement les nouvelles versions.
   Le numéro de version vient de version.js (seul fichier à modifier à chaque nouvelle version).
   M. Guitton — fichier mis au point avec l'aide de Claude AI. */
importScripts('version.js');
const CACHE = 'cartable-magique-' + self.APP_VERSION;

/* Tous les fichiers à garder pour le hors ligne.
   POUR AJOUTER UN OUTIL : ajouter ici son dossier (ex. './frise/'), comme les quatre ci-dessous. */
const FILES = [
  './', 'version.js', 'portail.js', 'manifest.webmanifest', 'fonts/fredoka.woff2',
  'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon.png',
  'images/calcul-mental.jpg', 'images/gym-des-mots.jpg', 'images/machine-conjugaison.jpg', 'images/a-qui-le-tour.jpg',
  './calcul-mental/', './gym-des-mots/', './machine-conjugaison/', './a-qui-le-tour/'
];

/* Installation : on télécharge toute la nouvelle version (sans passer par le cache du navigateur),
   puis on l'active tout de suite. */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

/* Activation : on supprime les anciennes versions. */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('cartable-magique-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Utilisation : tout vient du cache (donc aussi sans connexion).
   « dossier/index.html » et « dossier/ » désignent la même page. */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;               // liens externes (licence…) : laissés au navigateur
  const cle = url.pathname.endsWith('/index.html') ? url.pathname.slice(0, -10) : url.pathname;
  e.respondWith(
    caches.match(cle, { ignoreSearch: true })
      .then(r => r || fetch(e.request))
      .catch(() => caches.match('./'))
  );
});
