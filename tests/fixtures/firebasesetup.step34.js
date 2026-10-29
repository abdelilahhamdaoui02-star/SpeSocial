// مجمَّد من script-10.js قبل المرحلة 34 (نافذة إعداد Firebase)
function openFirebaseSetup() {
  document.getElementById('firebaseSetupModal').classList.add('open');
  fbLoadCurrentConfig();
  fbUpdateStatus();
}

function closeFirebaseSetup() {
  document.getElementById('firebaseSetupModal').classList.remove('open');
}

function fbLoadCurrentConfig() {
  try {
    const saved = localStorage.getItem('app:firebase:config');
    if (saved) {
      const c = JSON.parse(saved);
      const fields = ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'];
      fields.forEach(f => {
        const el = document.getElementById('fb_' + f);
        if (el && c[f]) { el.value = c[f]; el.classList.add('valid'); }
      });
    }
  } catch {}
}

function fbFieldValidate(input) {
  const v = input.value.trim();
  input.classList.toggle('valid', v.length > 3 && !v.startsWith('REPLACE'));
  input.classList.remove('invalid');
}

function fbParseConfig() {
  const text = (document.getElementById('fbPasteArea').value || '').trim();
  const msgEl = document.getElementById('fbMsg');
  if (!text) { msgEl.style.color='#dc2626'; msgEl.textContent='⚠️ الصق كود firebaseConfig أولاً.'; return; }

  const patterns = {
    apiKey:            /apiKey\s*:\s*["']([^"']+)["']/,
    authDomain:        /authDomain\s*:\s*["']([^"']+)["']/,
    projectId:         /projectId\s*:\s*["']([^"']+)["']/,
    storageBucket:     /storageBucket\s*:\s*["']([^"']+)["']/,
    messagingSenderId: /messagingSenderId\s*:\s*["']([^"']+)["']/,
    appId:             /appId\s*:\s*["']([^"']+)["']/
  };

  let found = 0;
  Object.entries(patterns).forEach(([key, re]) => {
    const m = text.match(re);
    const el = document.getElementById('fb_' + key);
    if (m && el) { el.value = m[1]; el.classList.add('valid'); found++; }
  });

  if (found >= 4) {
    msgEl.style.color = '#16a34a';
    msgEl.textContent = '✅ تم استخراج ' + found + ' قيم بنجاح! تحقق منها ثم احفظ.';
  } else {
    msgEl.style.color = '#dc2626';
    msgEl.textContent = '⚠️ تم استخراج ' + found + ' قيم فقط. تأكد من نسخ الكود كاملاً.';
  }
}

function fbSaveConfig() {
  const msgEl = document.getElementById('fbMsg');
  const fields = ['apiKey','authDomain','projectId','storageBucket','messagingSenderId','appId'];
  const config = {};
  let valid = true;

  fields.forEach(f => {
    const el = document.getElementById('fb_' + f);
    const v = (el ? el.value : '').trim();
    if (!v || v.startsWith('REPLACE') || v.length < 4) {
      if (f === 'apiKey' || f === 'projectId') { valid = false; if (el) el.classList.add('invalid'); }
    } else {
      config[f] = v;
    }
  });

  if (!valid || !config.apiKey || !config.projectId) {
    msgEl.style.color = '#dc2626';
    msgEl.textContent = '⚠️ يجب ملء apiKey وprojectId على الأقل.'; return;
  }

  try {
    localStorage.setItem('app:firebase:config', JSON.stringify(config));
    msgEl.style.color = '#16a34a';
    msgEl.textContent = '✅ تم الحفظ! سيُعاد تحميل التطبيق لتطبيق الإعداد الجديد...';
    setTimeout(() => location.reload(), 1800);
  } catch (e) {
    msgEl.style.color = '#dc2626';
    msgEl.textContent = '❌ خطأ في الحفظ: ' + e.message;
  }
}

async function fbTestConnection() {
  const msgEl = document.getElementById('fbMsg');
  msgEl.style.color = '#1a3a5c';
  msgEl.textContent = '⏳ جارٍ اختبار الاتصال...';
  try {
    if (window.storage && window.storage.testConnection) {
      const ok = await window.storage.testConnection();
      if (ok) {
        msgEl.style.color = '#16a34a';
        msgEl.textContent = '✅ الاتصال بـ Firebase يعمل بشكل مثالي!';
        fbUpdateStatus();
      } else {
        msgEl.style.color = '#dc2626';
        msgEl.textContent = '❌ فشل الاتصال. تحقق من إعدادات Firestore وقواعد الأمان (test mode).';
      }
    } else {
      msgEl.style.color = '#dc2626';
      msgEl.textContent = '❌ Firebase غير مُهيأ. احفظ الإعداد أولاً وأعد التحميل.';
    }
  } catch (e) {
    msgEl.style.color = '#dc2626';
    msgEl.textContent = '❌ خطأ: ' + (e.message || 'فشل الاتصال');
  }
}

function fbClearConfig() {
  if (!confirm('هل تريد حذف إعداد Firebase والعودة للوضع المحلي؟')) return;
  try { localStorage.removeItem('app:firebase:config'); } catch {}
  alert('تم. سيُعاد تحميل التطبيق.');
  location.reload();
}

function fbUpdateStatus() {
  const statusEl = document.getElementById('fbSetupStatus');
  const iconEl = document.getElementById('fbSetupStatusIcon');
  const textEl = document.getElementById('fbSetupStatusText');
  const testBtn = document.getElementById('fbTestBtn');
  const triggerDot = document.getElementById('fbTriggerDot');
  const triggerText = document.getElementById('fbTriggerText');

  const status = window._firebaseStatus || 'not_configured';

  if (status === 'connected') {
    if (statusEl) { statusEl.className = 'fb-setup-status fb-status-ok'; }
    if (iconEl) iconEl.textContent = '✅';
    if (textEl) textEl.textContent = 'Firebase متصل — البيانات تتزامن بين جميع الأجهزة';
    if (testBtn) testBtn.style.display = '';
    if (triggerDot) triggerDot.style.background = '#4ade80';
    if (triggerText) triggerText.textContent = '☁️ Firebase متصل — إعداد التخزين السحابي';
  } else if (status === 'error') {
    if (statusEl) { statusEl.className = 'fb-setup-status fb-status-err'; }
    if (iconEl) iconEl.textContent = '❌';
    if (textEl) textEl.textContent = 'خطأ في الاتصال بـ Firebase — تحقق من الإعداد';
    if (triggerDot) triggerDot.style.background = '#f87171';
    if (triggerText) triggerText.textContent = '❌ خطأ Firebase — انقر للإصلاح';
  } else {
    if (statusEl) { statusEl.className = 'fb-setup-status fb-status-warn'; }
    if (iconEl) iconEl.textContent = '⚠️';
    if (textEl) textEl.textContent = 'Firebase غير مُعدّ — البيانات محفوظة محلياً فقط (لا تتزامن بين الأجهزة)';
    if (triggerDot) triggerDot.style.background = '#fb923c';
    if (triggerText) triggerText.textContent = '⚙️ إعداد Firebase للتزامن بين الأجهزة';
  }

  // Update sync label in header
  window.dispatchEvent(new CustomEvent('legacy:sync-status', { detail: { cloud: status === 'connected', status } }));
}
