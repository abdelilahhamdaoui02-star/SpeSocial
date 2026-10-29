// طبقة التخزين المزدوجة: localStorage دائماً + Firebase Firestore للمفاتيح المشتركة — منقولة حرفياً من storageGet/storageSet في script-10.js (الخطوة 47).
// بلا DOM: كل ما يلمس المتصفح يُحقن عبر deps لتسهيل الاختبار.
//   deps: { isCloud(), cloud() → services/cloud (storage)، local: { get(key), set(key, value), remove(key) }, toast(msg, type), warn(...args),
//           timeoutMs?, setTimeout?, clearTimeout? }
export const SHARED_KEYS = ['auth:users'];
export const CLOUD_TIMEOUT_MS = 8000;
export const MSG = {
  timeout: '⚠️ الحفظ السحابي استغرق وقتاً طويلاً — تم الحفظ محلياً',
  failed: '⚠️ فشل الحفظ السحابي — البيانات محفوظة محلياً فقط',
  notConnected: '⚠️ Firebase غير متصل — الحفظ محلي فقط، لن تتزامن البيانات بين الأجهزة.',
};

export function createStorageLayer(deps) {
  const st = deps.setTimeout || setTimeout;
  const ct = deps.clearTimeout || clearTimeout;
  const ms = deps.timeoutMs || CLOUD_TIMEOUT_MS;

  async function get(key, shared) {
    // Firebase أولاً دائماً للبيانات المشتركة — localStorage فقط كاحتياطي عند انقطاع الاتصال
    if (deps.isCloud() && shared) {
      try {
        const r = await deps.cloud().get(key, true);
        if (r && r.value) {
          deps.local.set(key, r.value); // مزامنة مع localStorage كنسخة احتياطية محلية
          return r.value;
        }
        // Firebase متصل لكن لا توجد بيانات — لا نرجع localStorage لتفادي بيانات قديمة
        return null;
      } catch (err) {
        deps.warn('Firebase GET error — falling back to localStorage:', err);
        return deps.local.get(key);
      }
    }
    return deps.local.get(key);
  }

  async function set(key, value, shared) {
    deps.local.set(key, value); // حفظ محلي فوري دائماً — لا ينتظر Firebase
    if (deps.isCloud() && shared) {
      let timer;
      const timeout = new Promise((_, reject) => { timer = st(() => reject(new Error('timeout')), ms); });
      try {
        await Promise.race([deps.cloud().set(key, value, true), timeout]);
      } catch (err) {
        const msg = err && err.message === 'timeout' ? MSG.timeout : MSG.failed;
        deps.warn(msg, err);
        deps.toast(msg, 'warning');
      }
      ct(timer); // نُلغي مؤقّت المهلة بعد الانتهاء (القديم كان يتركه يعمل بلا أثر)
    } else if (shared && !deps.isCloud()) {
      deps.warn(MSG.notConnected);
    }
  }

  return { get, set };
}

// آخر مستخدم دخل (كان sessionSave/sessionClear/sessionGet) — الدخول التلقائي الفعلي يتولاه Firebase Auth
const SESSION_KEY = 'app:session:user';
export function createSessionMemo(local) {
  return {
    save: (username) => local.set(SESSION_KEY, username),
    clear: () => local.remove(SESSION_KEY),
    get: () => local.get(SESSION_KEY),
  };
}

// localStorage آمن (قد يرمي في الوضع الخاص أو عند امتلائه)
export const browserLocal = () => ({
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ممتلئ أو محظور */ } },
  remove: (k) => { try { localStorage.removeItem(k); } catch { /* محظور */ } },
});
