// فتح وإغلاق نافذة «الحساب الشخصي» — منقولان من openProfile/closeProfile في script-10.js
// مع تغليف الهاتف الذي كان في script-39.js (قفل تمرير الصفحة، وزر الرجوع في الهاتف يغلق النافذة).
// تُستورد مباشرة (openProfile/closeProfile)؛ لم يعد شيء منهما على window.
// env: { doc, history, isMobile(), emit(name) } — يُحقن لتسهيل الاختبار.
export function createProfileWindow(env) {
  const { doc, history, isMobile, emit } = env;
  const root = () => doc.documentElement;
  const modal = () => doc.getElementById('profileModal');

  // الفتح/الإغلاق «الخام» (ما كان في script-10.js)
  function rawOpen() {
    emit('legacy:profile-open');
    const m = modal();
    m.classList.add('open');
    m.scrollTop = 0;
  }
  function rawClose() {
    modal().classList.remove('open');
    emit('legacy:profile-close');
  }

  function openProfile() {
    rawOpen();
    if (isMobile()) {
      root().classList.add('pf-lock');
      try { history.pushState({ pf: 1 }, ''); } catch (e) { /* السجل غير متاح */ }   // زر الرجوع في الهاتف يغلق الصفحة
    }
  }

  function closeProfile() {
    if (isMobile() && history.state && history.state.pf) { history.back(); return; }
    rawClose();
    root().classList.remove('pf-lock');
  }

  // popstate: يصل بعد history.back() أو عند ضغط زر الرجوع في الهاتف
  function onPopState() {
    const m = modal();
    if (m && m.classList.contains('open')) {
      rawClose();
      root().classList.remove('pf-lock');
    }
  }

  return { openProfile, closeProfile, onPopState };
}

let instance = null;
const get = () => {
  if (!instance) {
    const mq = window.matchMedia('(max-width:820px)');
    instance = createProfileWindow({
      doc: document,
      history: window.history,
      isMobile: () => mq.matches,
      emit: (name) => window.dispatchEvent(new Event(name)),
    });
  }
  return instance;
};

// تستوردها الرأس وشريط الأدوات ونافذة الحساب وزر Escape مباشرة (كانتا على window)
export const openProfile = () => get().openProfile();
export const closeProfile = () => get().closeProfile();

let installed = false;
// زر الرجوع في الهاتف يغلق النافذة (popstate)؛ يُستدعى مرة واحدة قبل تحميل السكربتات القديمة
export function installProfileWindow() {
  if (installed) return;
  installed = true;
  window.addEventListener('popstate', () => get().onPopState());
}
