// Classic (non-module) service worker. CACHE_VERSION is a hash of the precached files: after changing any
// of them (or the list below) run `npm run stamp`. `npm test` fails if the version is out of date.
const CACHE_PREFIX = 'tetun-';
const CACHE_VERSION = 'tetun-e69919b8d7';
const PRECACHE_URLS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "favicon.png",
  "apple-touch-icon-precomposed.png",
  "css/app.css",
  "content/words.json",
  "js/app.js",
  "js/data.js",
  "js/dom.js",
  "js/game.js",
  "js/progress.js",
  "js/search.js",
  "js/views/phrasebook.js",
  "js/views/practise.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "images/greetings_disabled.png",
  "images/greetings_finished.png",
  "images/greetings_ninja.png",
  "images/excuseme_disabled.png",
  "images/excuseme_finished.png",
  "images/excuseme_ninja.png",
  "images/learning_disabled.png",
  "images/learning_finished.png",
  "images/learning_ninja.png",
  "images/doing_disabled.png",
  "images/doing_finished.png",
  "images/doing_ninja.png",
  "images/when_disabled.png",
  "images/when_finished.png",
  "images/when_ninja.png",
  "images/numbers_disabled.png",
  "images/numbers_finished.png",
  "images/numbers_ninja.png",
  "images/school_disabled.png",
  "images/school_finished.png",
  "images/school_ninja.png",
  "images/directions_disabled.png",
  "images/directions_finished.png",
  "images/directions_ninja.png",
  "images/household_disabled.png",
  "images/household_finished.png",
  "images/household_ninja.png",
  "images/plans_disabled.png",
  "images/plans_finished.png",
  "images/plans_ninja.png",
  "images/activities_disabled.png",
  "images/activities_finished.png",
  "images/activities_ninja.png",
  "images/eat_disabled.png",
  "images/eat_finished.png",
  "images/eat_ninja.png"
];

self.addEventListener('install', (event) => {
  // `reload` skips the browser's HTTP cache, so a new version never stores stale copies of old files.
  const requests = PRECACHE_URLS.map((url) => new Request(new URL(url, self.location.href).href, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(requests)));
});

// Replace the old cache as a whole, so a visitor never gets half of one version and half of another.
// Only this app's caches are touched: other sites on the same origin keep theirs.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.match(request, { ignoreSearch: true }))
      .then((hit) => hit || fetch(request))
  );
});

// The page asks for this only after the visitor accepts the update banner.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
