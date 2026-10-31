// تفعيل PWA: تسجيل الـ Service Worker + زر/شريط تثبيت التطبيق (Android وسطح المكتب عبر beforeinstallprompt، وiOS بإرشاد يدوي)
const DISMISS_KEY = 'pwaInstallDismissed';
const DAYS = 7;

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const recentlyDismissed = () => {
  try { const t = +localStorage.getItem(DISMISS_KEY) || 0; return Date.now() - t < DAYS * 864e5; } catch (e) { return false; }
};
const dismiss = () => { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* ignore */ } };

let deferred = null;
let bar = null;

function showBar(html, onInstall) {
  if (bar || isStandalone() || recentlyDismissed()) return;
  bar = document.createElement('div');
  bar.id = 'pwaInstallBar';
  bar.setAttribute('dir', 'rtl');
  bar.style.cssText = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:99999;background:#1a3a5c;color:#fff;border-radius:14px;padding:12px 14px;display:flex;gap:10px;align-items:center;box-shadow:0 8px 28px rgba(0,0,0,.35);font-family:Cairo,Arial,sans-serif;font-size:.88rem;max-width:520px;margin:0 auto';
  bar.innerHTML = '<img src="' + import.meta.env.BASE_URL + 'icons/icon-192.png" alt="" style="width:40px;height:40px;border-radius:10px">' +
    '<div style="flex:1;line-height:1.6">' + html + '</div>';
  if (onInstall) {
    const b = document.createElement('button');
    b.textContent = 'تثبيت';
    b.style.cssText = 'background:#f5be3c;color:#1a3a5c;border:0;border-radius:9px;padding:7px 16px;font-weight:800;font-family:inherit;cursor:pointer';
    b.onclick = onInstall;
    bar.appendChild(b);
  }
  const x = document.createElement('button');
  x.textContent = '✕'; x.setAttribute('aria-label', 'إغلاق');
  x.style.cssText = 'background:none;border:0;color:#fff;font-size:1.1rem;cursor:pointer;opacity:.8';
  x.onclick = () => { dismiss(); hideBar(); };
  bar.appendChild(x);
  document.body.appendChild(bar);
}
function hideBar() { if (bar) { bar.remove(); bar = null; } }

export function installPwa() {
  const base = import.meta.env.BASE_URL;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(base + 'sw.js', { scope: base }).catch((e) => console.warn('SW:', e));
    });
  }

  // Chrome / Edge / Samsung / Opera: الحدث الرسمي لإظهار نافذة التثبيت
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    showBar('ثبّت <strong>منصة التوثيق المهني</strong> على جهازك للوصول السريع وبدون متصفح.', async () => {
      if (!deferred) return;
      deferred.prompt();
      try { await deferred.userChoice; } catch (err) { /* ignore */ }
      deferred = null; hideBar();
    });
  });
  window.addEventListener('appinstalled', () => { deferred = null; hideBar(); });

  // iOS Safari: لا يوجد beforeinstallprompt، فنعرض الإرشاد اليدوي
  if (isIos() && !isStandalone()) {
    window.addEventListener('load', () => setTimeout(() => {
      showBar('لتثبيت التطبيق: اضغط زر المشاركة <strong>⎋</strong> في Safari ثم اختر <strong>«إضافة إلى الشاشة الرئيسية»</strong>.', null);
    }, 2500));
  }
}
