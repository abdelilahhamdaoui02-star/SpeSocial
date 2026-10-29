// منطق نافذة «إعداد Firebase» — منقول من fbParseConfig / fbSaveConfig / fbTestConnection /
// fbClearConfig / fbUpdateStatus القديمة (script-10.js) بنفس الشروط والنصوص.

export const CONFIG_KEY = 'app:firebase:config';
export const FIELDS = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
export const REQUIRED = ['apiKey', 'projectId'];
export const RELOAD_DELAY_MS = 1800;

export const PLACEHOLDERS = {
  apiKey: 'AIzaSy...',
  authDomain: 'your-app.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-app.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123...:web:abc...',
};

export const PASTE_PLACEHOLDER = 'const firebaseConfig = {\n  apiKey: "AIza...",\n  authDomain: "...",\n  projectId: "...",\n  ...\n};';

export const MSG = {
  pasteFirst: '⚠️ الصق كود firebaseConfig أولاً.',
  needRequired: '⚠️ يجب ملء apiKey وprojectId على الأقل.',
  saved: '✅ تم الحفظ! سيُعاد تحميل التطبيق لتطبيق الإعداد الجديد...',
  testing: '⏳ جارٍ اختبار الاتصال...',
  testOk: '✅ الاتصال بـ Firebase يعمل بشكل مثالي!',
  testFail: '❌ فشل الاتصال. تحقق من إعدادات Firestore وقواعد الأمان (test mode).',
  notReady: '❌ Firebase غير مُهيأ. احفظ الإعداد أولاً وأعد التحميل.',
  confirmClear: 'هل تريد حذف إعداد Firebase والعودة للوضع المحلي؟',
  cleared: 'تم. سيُعاد تحميل التطبيق.',
};

// ألوان الرسالة (كانت تُكتب في style.color)
export const MSG_COLORS = { err: '#dc2626', ok: '#16a34a', info: '#1a3a5c' };

const PATTERNS = Object.fromEntries(
  FIELDS.map((f) => [f, new RegExp(f + '\\s*:\\s*["\']([^"\']+)["\']')])
);

export const emptyValues = () => Object.fromEntries(FIELDS.map((f) => [f, '']));

// الحقل صالح (إطار أخضر) إذا زاد على 3 محارف ولم يبدأ بـ REPLACE
export function isFieldValid(value) {
  const v = String(value == null ? '' : value).trim();
  return v.length > 3 && !v.startsWith('REPLACE');
}

// قراءة الإعداد المحفوظ: الحقول الموجودة فقط (كما كانت fbLoadCurrentConfig)
export function loadSavedValues(storage) {
  try {
    const saved = storage.getItem(CONFIG_KEY);
    if (!saved) return {};
    const c = JSON.parse(saved);
    const out = {};
    FIELDS.forEach((f) => { if (c[f]) out[f] = c[f]; });
    return out;
  } catch {
    return {};
  }
}

// «استخراج تلقائي»: يستخرج القيم من كود firebaseConfig الملصوق
// يعيد { found, values, message: {text, kind} }
export function parseConfigText(text) {
  const t = String(text || '').trim();
  if (!t) return { found: 0, values: {}, message: { text: MSG.pasteFirst, kind: 'err' } };
  const values = {};
  let found = 0;
  FIELDS.forEach((f) => {
    const m = t.match(PATTERNS[f]);
    if (m) { values[f] = m[1]; found++; }
  });
  const message = found >= 4
    ? { text: '✅ تم استخراج ' + found + ' قيم بنجاح! تحقق منها ثم احفظ.', kind: 'ok' }
    : { text: '⚠️ تم استخراج ' + found + ' قيم فقط. تأكد من نسخ الكود كاملاً.', kind: 'err' };
  return { found, values, message };
}

// التحقق قبل الحفظ: يعيد { ok, config, invalid: [الحقول المطلوبة الناقصة] }
export function buildConfig(values) {
  const config = {};
  const invalid = [];
  FIELDS.forEach((f) => {
    const v = String(values[f] == null ? '' : values[f]).trim();
    if (!v || v.startsWith('REPLACE') || v.length < 4) {
      if (REQUIRED.includes(f)) invalid.push(f);
    } else {
      config[f] = v;
    }
  });
  const ok = invalid.length === 0 && !!config.apiKey && !!config.projectId;
  return { ok, config, invalid };
}

// «حفظ الإعداد»: يعيد { status: 'invalid'|'saved'|'error', invalid?, message }
export function saveConfig(storage, values) {
  const { ok, config, invalid } = buildConfig(values);
  if (!ok) return { status: 'invalid', invalid, message: { text: MSG.needRequired, kind: 'err' } };
  try {
    storage.setItem(CONFIG_KEY, JSON.stringify(config));
    return { status: 'saved', config, message: { text: MSG.saved, kind: 'ok' } };
  } catch (e) {
    return { status: 'error', message: { text: '❌ خطأ في الحفظ: ' + e.message, kind: 'err' } };
  }
}

// «اختبار الاتصال»: api = التخزين السحابي من services/cloud (فيه testConnection) أو undefined
export async function runConnectionTest(api) {
  try {
    if (api && api.testConnection) {
      const ok = await api.testConnection();
      return ok
        ? { ok: true, message: { text: MSG.testOk, kind: 'ok' } }
        : { ok: false, message: { text: MSG.testFail, kind: 'err' } };
    }
    return { ok: false, message: { text: MSG.notReady, kind: 'err' } };
  } catch (e) {
    return { ok: false, message: { text: '❌ خطأ: ' + (e.message || 'فشل الاتصال'), kind: 'err' } };
  }
}

// «حذف الإعداد»: يعيد true إذا حُذف (بعد تأكيد المستخدم)
export function clearConfig(storage, confirmFn) {
  if (!confirmFn(MSG.confirmClear)) return false;
  try { storage.removeItem(CONFIG_KEY); } catch {}
  return true;
}

// عرض حالة Firebase: شريط النافذة + زر الدخول (النقطة والنص) + ظهور زر الاختبار
export function statusView(status) {
  if (status === 'connected') {
    return {
      kind: 'ok', className: 'fb-setup-status fb-status-ok', icon: '✅',
      text: 'Firebase متصل — البيانات تتزامن بين جميع الأجهزة',
      showTest: true, dot: '#4ade80', trigger: '☁️ Firebase متصل — إعداد التخزين السحابي',
    };
  }
  if (status === 'error') {
    return {
      kind: 'err', className: 'fb-setup-status fb-status-err', icon: '❌',
      text: 'خطأ في الاتصال بـ Firebase — تحقق من الإعداد',
      showTest: false, dot: '#f87171', trigger: '❌ خطأ Firebase — انقر للإصلاح',
    };
  }
  return {
    kind: 'warn', className: 'fb-setup-status fb-status-warn', icon: '⚠️',
    text: 'Firebase غير مُعدّ — البيانات محفوظة محلياً فقط (لا تتزامن بين الأجهزة)',
    showTest: false, dot: '#fb923c', trigger: '⚙️ إعداد Firebase للتزامن بين الأجهزة',
  };
}

// الوصول إلى localStorage دون أن يرمي المتصفح (وضع خاص/تخزين محظور): نعيد كائناً يفشل عند الكتابة فقط
export function browserStorage(win) {
  try { return win.localStorage; } catch {
    const fail = () => { throw new Error('التخزين غير متاح'); };
    return { getItem: () => null, setItem: fail, removeItem: () => {} };
  }
}
