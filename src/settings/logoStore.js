// تطبيق شعار المؤسسة وحفظه — منقول من applyLogo / _saveLogo / removeLogo / initLogoFromStorage /
// printLogoImg / _refreshLogoImages القديمة (script-10.js) ومن ثابت الشعار في script-00.js.
// الخطوة 5: لم يعد شيء من هذا على window (لا MINISTRY_LOGO_B64 ولا printLogoImg ولا applyLogo…)؛ الوحدات تقرأ الشعار بـ getLogo() وتطبع بـ printLogo().
import { DEFAULT_MINISTRY_LOGO_B64 } from './defaultLogo.js';
import { printLogoImg } from './logoLogic.js';
import { showToast } from '../ui/toast.js';

// المفتاح القديم في localStorage؛ صار اسماً داخلياً لمهيِّئ التخزين، ويُرحَّل منه الشعار القديم مرة واحدة (userData.loadLogo)
export const LOGO_KEY = 'app:institutionLogo';
export const LOGO_MSG_SESSION_ONLY = '⚠️ تم تطبيق الشعار لهذه الجلسة فقط (تعذّر حفظه في المتصفح لأن حجمه كبير).';
export const LOGO_MSG_SAVED = '✅ تم حفظ شعار المؤسسة';

// env: { win, doc, storage(), alert(msg) } — يُحقن لتسهيل الاختبار
export function createLogoStore(env) {
  const { win, doc } = env;

  function refreshImages() {
    doc.querySelectorAll('#ministry-logo-img').forEach((img) => { img.src = win.MINISTRY_LOGO_B64; });
  }

  function applyLogo(dataUrl, isCustom) {
    // الشعار المختار يصبح هو الشعار المستعمل في رأس جميع التقارير والطباعة
    win.MINISTRY_LOGO_B64 = dataUrl;
    win._reportLogoHTML = `<img src="${dataUrl}" alt="شعار المؤسسة" style="width:100%;height:auto;display:block;margin:0;">`;
    refreshImages();
    // معاينة الشعار وحالته وزر الحذف في الإعدادات يرسمها React (تصلها من هذا الحدث)
    win.dispatchEvent(new CustomEvent('legacy:logo-changed', { detail: { custom: !!isCustom, src: dataUrl } }));
  }

  function saveLogo(dataUrl) {
    let stored = true;
    try { env.storage().setItem(LOGO_KEY, dataUrl); } catch { stored = false; }
    applyLogo(dataUrl, true);
    if (!stored) env.alert(LOGO_MSG_SESSION_ONLY);
    else if (typeof win.showToast === 'function') { try { win.showToast(LOGO_MSG_SAVED); } catch {} }
  }

  function removeLogo() {
    try { env.storage().removeItem(LOGO_KEY); } catch {}
    applyLogo(DEFAULT_MINISTRY_LOGO_B64, false);
  }

  function initLogoFromStorage() {
    try {
      const saved = env.storage().getItem(LOGO_KEY);
      if (saved) { applyLogo(saved, true); return; }
    } catch {}
    applyLogo(DEFAULT_MINISTRY_LOGO_B64, false);
  }

  return { applyLogo, saveLogo, removeLogo, initLogoFromStorage, refreshImages };
}

// حالة الشعار الفعّال: كائن خاص بالوحدة يحمل ما كان الكود القديم يكتبه على window (المصدر والصورة الجاهزة للتقارير)،
// ويُمرَّر إلى createLogoStore بدل window فتبقى الدالة المختبَرة كما هي.
const host = {
  MINISTRY_LOGO_B64: DEFAULT_MINISTRY_LOGO_B64,
  _reportLogoHTML: null,
  showToast,
  dispatchEvent: (e) => window.dispatchEvent(e),
};

// ── التخزين: Firebase لكل مستخدم (<المستخدم>:institutionLogo) وليس localStorage المتصفح ──
// createLogoStore تتعامل مع «تخزين» بواجهة getItem/setItem/removeItem؛ نمرّر لها مهيِّئاً يحتفظ بنسخة في الذاكرة
// ويرسل كل كتابة إلى الجلسة (setLogoRemote) لتحفظها في Firebase. فيتبع الشعار الحساب على كل جهاز.
let remote = null; // { save(dataUrl | null) → Promise } تركّبه الجلسة عند الإقلاع
let cached = null; // شعار المستخدم الحالي المخصَّص (data URL)؛ null = الافتراضي

export const setLogoRemote = (r) => { remote = r || null; };

const warnSave = (e) => console.warn('تعذّر حفظ الشعار في Firebase:', e);

const cloudStorage = {
  getItem: (k) => (k === LOGO_KEY ? cached : null),
  setItem: (k, v) => {
    if (k !== LOGO_KEY) return;
    if (!remote) throw new Error('no-session'); // لا مستخدم → يُطبَّق للجلسة فقط (رسالة LOGO_MSG_SESSION_ONLY)
    cached = v;
    Promise.resolve(remote.save(v)).catch(warnSave);
  },
  removeItem: (k) => {
    if (k !== LOGO_KEY) return;
    cached = null;
    if (remote) Promise.resolve(remote.save(null)).catch(warnSave);
  },
};

function browserEnv() {
  return {
    win: host,
    doc: document,
    storage: () => cloudStorage,
    alert: (m) => window.alert(m),
  };
}

let store = null;
const get = () => (store || (store = createLogoStore(browserEnv())));

export const saveLogo = (dataUrl) => get().saveLogo(dataUrl);
export const removeLogo = () => get().removeLogo();
export const initLogoFromStorage = () => get().initLogoFromStorage();

// يُستدعى بعد دخول المستخدم بالشعار المحفوظ له في Firebase (فارغ/null → الشعار الافتراضي)، وعند الخروج بـ null
export function setLogoFromCloud(dataUrl) {
  cached = dataUrl || null;
  get().initLogoFromStorage();
}

// الشعار الفعّال (data URL): الافتراضي حتى يُطبَّق المحفوظ. يقرؤه كل من يبني تقريراً أو يطبع مستنداً
export const getLogo = () => host.MINISTRY_LOGO_B64 || '';
// وسم <img> الشعار لأي وثيقة طباعة (كانت printLogoImg على window)
export const printLogo = (maxH) => printLogoImg(getLogo(), maxH);

// كان script-00.js يملأ صور #ministry-logo-img عند DOMContentLoaded؛ يُستدعى قبل تحميل السكربتات القديمة (كما installProfileWindow)
export function installLogo() {
  document.addEventListener('DOMContentLoaded', get().refreshImages);
}
