
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('mph-stub-v1').then(cache => cache.addAll([
      './index.html', './style.css', './app.js', './sample_data.json', './manifest.webmanifest'
    ]))
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
