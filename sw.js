const CACHE = 'notthat-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png'
];

// Kurulumda temel dosyaları cache'le
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Eski cache'leri temizle
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Ağ önce, yoksa cache'den sun (network-first strateji)
// Supabase ve AI istekleri için ağı zorunlu tut
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Supabase, Cloudflare Worker, Google API — cache'leme
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com')
  ) {
    return; // Tarayıcının normal davranışına bırak
  }

  // Statik dosyalar için: cache önce, sonra ağ
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      });
      return cached || network;
    })
  );
});
