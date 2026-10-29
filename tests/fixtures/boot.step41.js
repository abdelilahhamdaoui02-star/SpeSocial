// مجمَّد من script-11.js قبل الخطوة 42 (الإقلاع: الدخول التلقائي وشاشات التحميل/الانقطاع/خطأ Firebase) — مرجع اختبار المطابقة فقط

// ======= AUTO-LOGIN ON PAGE LOAD =======
document.addEventListener('DOMContentLoaded', async () => {

  // ══════════════════════════════════════════════════
  //  🔒 ONLINE + FIREBASE REQUIRED — شرط الاتصال
  // ══════════════════════════════════════════════════

  // 1. فحص الإنترنت أولاً
  if (!navigator.onLine) {
    showOfflineScreen();
    return;
  }

  // 2. إظهار شاشة تحميل
  showLoadingScreen('⏳ جارٍ الاتصال بقاعدة البيانات...');

  // 3. انتظار Firebase
  let firebaseOk = false;
  if (window._firebaseReady) {
    try {
      const ok = await window._firebaseReady;
      firebaseOk = ok && typeof window.storage !== 'undefined';
      STORAGE_IS_CLOUD = firebaseOk;
    } catch { firebaseOk = false; STORAGE_IS_CLOUD = false; }
  }

  // 4. إذا Firebase غير مُعدّ → إظهار شاشة الإعداد
  if (!window._isFirebaseConfigured()) {
    hideLoadingScreen();
    showFirebaseRequiredScreen();
    return;
  }

  // 5. إذا Firebase مُعدّ لكن فشل الاتصال → خطأ
  if (!firebaseOk) {
    hideLoadingScreen();
    showFirebaseErrorScreen();
    return;
  }

  // 6. Firebase متصل ✅ — محاولة الدخول التلقائي
  hideLoadingScreen();
  const restored = await tryAutoLogin();
  if (!restored) {
    window.dispatchEvent(new Event('legacy:need-login'));
    fbUpdateStatus();
  }
});

// مراقبة الاتصال بالإنترنت أثناء الاستخدام
window.addEventListener('offline', () => {
  showOfflineScreen();
});
window.addEventListener('online', () => {
  location.reload();
});

// ══════════════════════════════════════════════════
//  شاشات الحالة — Loading / Offline / Firebase Error
// ══════════════════════════════════════════════════

function showLoadingScreen(msg) {
  let el = document.getElementById('appLoadingScreen');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appLoadingScreen';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#0f2744,#1a3a5c);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;font-family:Cairo,sans-serif;';
    el.innerHTML = `
      <div style="font-size:3rem;">🔥</div>
      <div id="appLoadingMsg" style="color:white;font-size:1rem;font-weight:700;">${msg}</div>
      <div style="width:48px;height:48px;border:4px solid rgba(255,255,255,0.2);border-top-color:#c8a94a;border-radius:50%;animation:spin 0.9s linear infinite;"></div>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(el);
  } else {
    document.getElementById('appLoadingMsg').textContent = msg;
    el.style.display = 'flex';
  }
}

function hideLoadingScreen() {
  const el = document.getElementById('appLoadingScreen');
  if (el) el.style.display = 'none';
}

function showOfflineScreen() {
  hideLoadingScreen();
  // Hide auth overlay if visible
  window.dispatchEvent(new Event('legacy:hide-auth'));

  let el = document.getElementById('appOfflineScreen');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appOfflineScreen';
    el.style.cssText = 'position:fixed;inset:0;z-index:99998;background:linear-gradient(135deg,#0f172a,#1e293b);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;font-family:Cairo,sans-serif;text-align:center;padding:32px;';
    el.innerHTML = `
      <div style="font-size:4rem;">📡</div>
      <div style="color:#f0d97a;font-size:1.3rem;font-weight:800;">لا يوجد اتصال بالإنترنت</div>
      <div style="color:rgba(255,255,255,0.75);font-size:0.88rem;max-width:320px;line-height:1.8;">
        هذا التطبيق يتطلب اتصالاً بالإنترنت للعمل.<br>
        تأكد من اتصالك ثم أعد المحاولة.
      </div>
      <button onclick="location.reload()" style="margin-top:12px;padding:12px 32px;background:linear-gradient(135deg,#c8a94a,#f0d97a);color:#0f2744;border:none;border-radius:12px;font-family:Cairo,sans-serif;font-size:0.95rem;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(200,169,74,0.4);">
        🔄 إعادة المحاولة
      </button>
    `;
    document.body.appendChild(el);
  } else {
    el.style.display = 'flex';
  }
}

function showFirebaseRequiredScreen() {
  let el = document.getElementById('appFirebaseRequiredScreen');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appFirebaseRequiredScreen';
    el.style.cssText = 'position:fixed;inset:0;z-index:99997;background:linear-gradient(135deg,#0f2744,#1a3a5c);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;font-family:Cairo,sans-serif;text-align:center;padding:24px;overflow-y:auto;';
    el.innerHTML = `
      <div style="background:white;border-radius:20px;max-width:460px;width:100%;padding:32px 28px;box-shadow:0 24px 80px rgba(0,0,0,0.5);">
        <div style="font-size:3rem;margin-bottom:12px;">🔥</div>
        <div style="font-size:1.2rem;font-weight:800;color:#1a3a5c;margin-bottom:8px;">إعداد Firebase مطلوب</div>
        <div style="font-size:0.82rem;color:#64748b;line-height:1.8;margin-bottom:22px;">
          لاستخدام التطبيق على جميع أجهزتك، يجب إعداد Firebase مرة واحدة فقط.
        </div>
        <div style="background:#fff7ed;border:2px solid #fed7aa;border-radius:12px;padding:16px;margin-bottom:20px;text-align:right;font-size:0.78rem;color:#9a3412;line-height:2;">
          <strong>📋 خطوات سريعة:</strong>
          <ol style="padding-right:18px;margin-top:6px;">
            <li>اذهب إلى <a href="https://console.firebase.google.com" target="_blank" style="color:#f97316;font-weight:700;">console.firebase.google.com</a></li>
            <li>أنشئ مشروعاً جديداً ← أضف تطبيق ويب</li>
            <li>انسخ كائن firebaseConfig</li>
            <li>انقر الزر أدناه والصق الكود</li>
            <li>فعّل Firestore Database بوضع test mode</li>
          </ol>
        </div>
        <button onclick="openFirebaseSetup()" style="width:100%;padding:13px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;border-radius:12px;font-size:1rem;font-weight:800;cursor:pointer;box-shadow:0 4px 16px rgba(249,115,22,0.35);">
          ⚙️ إعداد Firebase الآن
        </button>
      </div>
    `;
    document.body.appendChild(el);
  } else {
    el.style.display = 'flex';
  }
}

function showFirebaseErrorScreen() {
  let el = document.getElementById('appFirebaseErrorScreen');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appFirebaseErrorScreen';
    el.style.cssText = 'position:fixed;inset:0;z-index:99997;background:linear-gradient(135deg,#0f2744,#1a3a5c);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;font-family:Cairo,sans-serif;text-align:center;padding:24px;overflow-y:auto;';
    el.innerHTML = `
      <div style="background:white;border-radius:20px;max-width:440px;width:100%;padding:32px 28px;box-shadow:0 24px 80px rgba(0,0,0,0.5);">
        <div style="font-size:3rem;margin-bottom:12px;">❌</div>
        <div style="font-size:1.1rem;font-weight:800;color:#991b1b;margin-bottom:8px;">فشل الاتصال بـ Firebase</div>
        <div style="font-size:0.82rem;color:#64748b;line-height:1.8;margin-bottom:20px;">
          تأكد من صحة إعدادات Firebase وأن Firestore Database مُفعَّل بوضع <strong>test mode</strong>.
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button onclick="openFirebaseSetup()" style="padding:12px;background:linear-gradient(135deg,#f97316,#ea580c);color:white;border:none;border-radius:10px;font-family:Cairo,sans-serif;font-size:0.92rem;font-weight:700;cursor:pointer;">
            🔧 مراجعة إعدادات Firebase
          </button>
          <button onclick="location.reload()" style="padding:10px;background:white;color:#1a3a5c;border:2px solid #1a3a5c;border-radius:10px;font-family:Cairo,sans-serif;font-size:0.88rem;font-weight:700;cursor:pointer;">
            🔄 إعادة المحاولة
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(el);
  } else {
    el.style.display = 'flex';
  }
}



