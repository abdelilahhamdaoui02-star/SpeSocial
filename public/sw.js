// Service Worker — منصة التوثيق المهني (شرط أساسي لاعتبار الموقع PWA قابلاً للتثبيت)
const VERSION = 'v1';
const CACHE = 'spesocial-' + VERSION;
const SCOPE = self.registration.scope;
const SHELL = [SCOPE, SCOPE + 'index.html', SCOPE + 'manifest.json', SCOPE + 'icons/icon-192.png', SCOPE + 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.allSettled(SHELL.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('spesocial-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // لا نعترض Firebase ولا أي نطاق خارجي: تبقى طلباتها مباشرة
  if (url.origin !== self.location.origin) return;

  // الصفحات: الشبكة أولاً (لنحصل على آخر نسخة منشورة) ثم النسخة المحفوظة عند انقطاع الاتصال
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match(SCOPE + 'index.html') || caches.match(SCOPE)))
    );
    return;
  }

  // الملفات الثابتة (JS/CSS/صور): من الذاكرة فوراً مع تحديثها في الخلفية
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
