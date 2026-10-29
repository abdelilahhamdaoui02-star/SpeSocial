// حالة التنقل بين البوابات — مصدرها الوحيد (الخطوة 49). كانت navigation.js تبدّل فئة active وstyle.display على عناصر
// الصفحة بـgetElementById وتُعلن بحدث legacy:tool-changed؛ الآن تُرسم الصفحات من هذه الحالة مباشرة (AppShell وFrozenNav وuseCurrentPortal).
//   current: معرّف البوابة المفتوحة أو null عند الصفحة الرئيسية
//   entered: دخل المستخدم (الصفحة الرئيسية لا تظهر قبل الدخول ولا بعد الخروج)
import { toolDomId } from './navLogic.js';
import { getSessionStore } from '../session/sessionStore.js';

export function createNavStore({ win, doc, session } = {}) {
  let state = Object.freeze({ current: null, entered: false });
  const subs = new Set();

  const set = (patch) => {
    state = Object.freeze({ ...state, ...patch });
    subs.forEach((fn) => fn());
  };
  const toTop = () => {
    if (win && typeof win.scrollTo === 'function') win.scrollTo({ top: 0, behavior: 'smooth' });
    if (doc && doc.documentElement) doc.documentElement.scrollTop = 0;
    if (doc && doc.body) doc.body.scrollTop = 0;
  };

  function openPortal(tool) {
    if (!toolDomId(tool)) return false; // معرّف مجهول: لا نُخفي الصفحة الرئيسية ولا نترك شاشة فارغة
    set({ current: tool });
    toTop();
    return true;
  }

  function goHome() {
    set({ current: null });
    // بطاقات الصفحة الرئيسية تعيد قراءة بياناتها (كان تغليف goBack في script-23.js يفعل ذلك)
    if (win && typeof win.dispatchEvent === 'function') win.dispatchEvent(new Event('legacy:stats-refresh'));
    toTop();
  }

  const enter = () => set({ entered: true });
  const leave = () => set({ entered: false, current: null });

  // الدخول والخروج يصلان من مخزن الجلسة (src/session/sessionStore.js) لا من أحداث window
  function install() {
    if (!session) return () => {};
    const offs = [session.on('entered', enter), session.on('loggedout', leave)];
    return () => offs.forEach((off) => off());
  }

  return {
    openPortal, goHome, enter, leave, install,
    getState: () => state,
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
  };
}

let store = null;
// بلا window/document (رسم على الخادم أو اختبار) يعمل المخزن بلا تمرير ولا أحداث
export const getNavStore = () => (store ||= createNavStore({
  win: typeof window !== 'undefined' ? window : undefined,
  doc: typeof document !== 'undefined' ? document : undefined,
  session: getSessionStore(),
}));
