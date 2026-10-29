// منطق إقلاع التطبيق — منقول من script-11.js القديم (الخطوة 42):
// فحص الإنترنت ثم انتظار Firebase ثم الدخول التلقائي، وأي شاشة حالة تُعرض (تحميل / لا اتصال / إعداد Firebase / فشل الاتصال).
// بلا DOM ولا React: كل ما يلمس المتصفح يُحقن عبر deps لتسهيل الاختبار.
export const LOADING_MSG = '⏳ جارٍ الاتصال بقاعدة البيانات...';

export const initialBootState = () => ({
  loading: false, loadingMsg: '', offline: false, required: false, error: false,
});

// deps: { isOnline(), firebaseReady (Promise|null), hasStorage(), setCloud(bool), isConfigured(),
//         tryAutoLogin(): Promise<bool>, session: { hideAuth(), needLogin() } (مخزن الجلسة), updateStatus(), reload() }
export function createBoot(deps) {
  let state = initialBootState();
  const listeners = new Set();
  const set = (patch) => { state = { ...state, ...patch }; listeners.forEach((fn) => fn()); };

  const showLoading = (msg) => set({ loading: true, loadingMsg: msg });
  const hideLoading = () => set({ loading: false });

  function showOffline() {
    hideLoading();
    // شاشة الدخول تختفي خلف شاشة «لا يوجد اتصال» (مخزن الجلسة: status = hidden)
    deps.session.hideAuth();
    set({ offline: true });
  }

  async function start() {
    // 1. فحص الإنترنت أولاً
    if (!deps.isOnline()) { showOffline(); return; }

    // 2. شاشة تحميل
    showLoading(LOADING_MSG);

    // 3. انتظار Firebase
    let firebaseOk = false;
    if (deps.firebaseReady) {
      try {
        const ok = await deps.firebaseReady;
        firebaseOk = ok && deps.hasStorage();
        deps.setCloud(firebaseOk);
      } catch { firebaseOk = false; deps.setCloud(false); }
    }

    // 4. Firebase غير مُعدّ → شاشة الإعداد
    if (!deps.isConfigured()) { hideLoading(); set({ required: true }); return; }

    // 5. مُعدّ لكن فشل الاتصال → شاشة الخطأ
    if (!firebaseOk) { hideLoading(); set({ error: true }); return; }

    // 6. Firebase متصل → محاولة الدخول التلقائي
    hideLoading();
    const restored = await deps.tryAutoLogin();
    if (!restored) {
      deps.session.needLogin();
      deps.updateStatus();
    }
  }

  return {
    start,
    showOffline,
    onOnline: () => deps.reload(), // عودة الإنترنت أثناء الاستخدام → إعادة تحميل الصفحة
    getSnapshot: () => state,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
