// مخزن الجلسة الوحيد (الخطوة 50) — مصدر الحقيقة لحالة الدخول. كان الدخول والخروج يصلان كحدثي window
// (legacy:entered / legacy:loggedout) فيسمعهما AuthContext والتنقل والمخزن والملف الشخصي والمعاينة؛ الآن تُستدعى هنا الدوال مباشرة.
//   status: booting   → الإقلاع لم ينتهِ (شاشة الدخول خلف شاشة التحميل)
//           signedOut → لا جلسة، تظهر شاشة الدخول
//           signedIn  → مستخدم معتمد
//           hidden    → شاشة «لا اتصال» تغطي كل شيء
//   logoutCount: يزيد مع كل خروج (شاشة الدخول تفرّغ حقولها عند تغيّره)
// بلا window ولا React: يُختبر مباشرة، وتقرؤه المكوّنات بـ useSyncExternalStore (انظر AuthContext).

export const INITIAL_SESSION = Object.freeze({ status: 'booting', user: null, logoutCount: 0 });

export function reduceSession(state, action) {
  switch (action.type) {
    case 'entered':
      return { ...state, status: 'signedIn', user: action.user ?? null };
    case 'loggedout':
      return { status: 'signedOut', user: null, logoutCount: state.logoutCount + 1 };
    case 'need-login':
      return { ...state, status: 'signedOut', user: null };
    case 'hide':
      return { ...state, status: 'hidden' };
    default:
      return state;
  }
}

export function createSessionStore() {
  let state = INITIAL_SESSION;
  const subs = new Set();
  const handlers = { entered: new Set(), loggedout: new Set() };

  function dispatch(action) {
    state = Object.freeze(reduceSession(state, action));
    // أولاً من يحتاج رد فعل فورياً (المخزن والتنقل) ثم مشتركو الرسم
    (handlers[action.type] || []).forEach((fn) => fn(state));
    subs.forEach((fn) => fn());
  }

  return {
    getState: () => state,
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
    // ردّ فعل على انتقال محدد: on('entered' | 'loggedout', fn(state)) → دالة إلغاء
    on(type, fn) {
      if (!handlers[type]) throw new Error('انتقال جلسة مجهول: ' + type);
      handlers[type].add(fn);
      return () => handlers[type].delete(fn);
    },
    entered: (user) => dispatch({ type: 'entered', user }),
    loggedOut: () => dispatch({ type: 'loggedout' }),
    needLogin: () => dispatch({ type: 'need-login' }),
    hideAuth: () => dispatch({ type: 'hide' }),
  };
}

let store = null;
export const getSessionStore = () => store || (store = createSessionStore());
