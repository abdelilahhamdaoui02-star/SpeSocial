// مخزن البيانات — الجسر بين بيانات الكود القديم (appData / STUDENT_DB) ومكوّنات React.
//
// الفكرة: الكود القديم يبقى هو الذي يحمّل ويحفظ (loadUserData / saveUserKey)،
// ونحن نستمع لأحداث window التي أضفناها فيه، ونحتفظ بنسخة «لقطة» غير قابلة للتغيير
// يقرؤها React بـ useSyncExternalStore. وعند التحويل الكامل لاحقاً تنتقل الكتابة هنا فقط.
//
// الأحداث:
//   legacy:data-loaded      → انتهى تحميل بيانات المستخدم بعد الدخول
//   legacy:data-changed     → حُفظت مجموعة (detail.key)
//   legacy:students-changed → تغيّرت قائمة التلاميذ
//   (الدخول والخروج لم يعودا حدثين: يصلان من مخزن الجلسة src/session/sessionStore.js — دخول فنقرأ كل شيء، خروج فنفرّغ)
//   legacy:site-config      → إعدادات المنصة من لوحة الأدمين (detail.gates = أسماء البوابات المخصّصة، detail.news = إعدادات الأخبار)
//   legacy:week-range       → الأسبوع المحدد للتقرير الأسبوعي (detail.from / detail.to بصيغة YYYY-MM-DD)
//   legacy:sync-status      → وضع التخزين (detail.cloud = true عند Firebase)
//   legacy:profile-changed  → حُفظ الملف الشخصي (الاسم…)
//   legacy:stats-refresh    → الكود القديم يطلب إعادة قراءة كل المجموعات (يُرسَل من updateDashboardStats)

const EMPTY = Object.freeze({
  ready: false,
  user: null,
  profile: {},
  collections: {},
  students: [],
  siteGates: {},         // أسماء البوابات المخصّصة من الأدمين (تبقى بعد الخروج لأنها عامة)
  siteNews: {},          // إعدادات الأخبار من الأدمين: items/keywords/proxy/auto/perKeyword (عامة، تبقى بعد الخروج)
  syncCloud: false,      // هل التخزين سحابي (Firebase)؟ يظهر في شريط المستخدم
  weekRange: { from: '', to: '' }, // أسبوع التقرير الأسبوعي المحدد (اختيار محفوظ في المتصفح، يبقى بعد الخروج)
  version: 0,
});

import { getSessionStore } from '../session/sessionStore.js';
import { getBridge } from '../session/sessionBridge.js';

let state = EMPTY;
const listeners = new Set();

const bridge = () => getBridge();

function emit(next) {
  state = { ...next, version: state.version + 1 };
  listeners.forEach((fn) => fn());
}

export const getState = () => state;

// إن لم يتغير المحتوى نُبقي المرجع نفسه، فلا يُعاد حساب القائمة ولا يُعاد جلب الأخبار كلما وصل الحدث
const keepIfSame = (prev, next) => {
  try { return JSON.stringify(prev) === JSON.stringify(next) ? prev : next; } catch (e) { return next; }
};

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const copyStudents = () => {
  const b = bridge();
  const list = b && b.getStudents ? b.getStudents() : [];
  return list.map((s) => ({ ...s }));
};

function readUser() {
  const b = bridge();
  return b && b.getUser ? b.getUser() : null;
}

// قراءة كاملة (بعد التحميل أو الدخول)
function syncAll() {
  const b = bridge();
  if (!b || !b.getAppData) return;
  const data = b.getAppData();
  const collections = {};
  Object.keys(data).forEach((k) => {
    collections[k] = Array.isArray(data[k]) ? data[k].slice() : data[k];
  });
  emit({
    ...state,
    ready: true,
    user: readUser(),
    profile: { ...(b.getProfile ? b.getProfile() : {}) },
    collections,
    students: copyStudents(),
  });
}

// تحديث مجموعة واحدة فقط (الأرخص)
function syncKey(key) {
  const b = bridge();
  if (!b || !b.getAppData || !key) return;
  const value = b.getAppData()[key];
  emit({
    ...state,
    collections: { ...state.collections, [key]: Array.isArray(value) ? value.slice() : value },
  });
}

function syncStudents() {
  emit({ ...state, students: copyStudents() });
}

let installed = false;
export function installStore() {
  if (installed) return;
  installed = true;
  window.addEventListener('legacy:data-loaded', syncAll);
  const session = getSessionStore();
  session.on('entered', syncAll);
  window.addEventListener('legacy:data-changed', (e) => syncKey(e.detail && e.detail.key));
  window.addEventListener('legacy:students-changed', syncStudents);
  session.on('loggedout', () => emit({ ...EMPTY, siteGates: state.siteGates, siteNews: state.siteNews, weekRange: state.weekRange, syncCloud: state.syncCloud }));
  window.addEventListener('legacy:sync-status', (e) => emit({ ...state, syncCloud: !!(e.detail && e.detail.cloud) }));
  window.addEventListener('legacy:profile-changed', () => {
    const b = bridge();
    emit({ ...state, user: readUser(), profile: { ...(b && b.getProfile ? b.getProfile() : {}) } });
  });
  window.addEventListener('legacy:week-range', (e) => {
    const d = (e.detail || {});
    emit({ ...state, weekRange: { from: d.from || '', to: d.to || '' } });
  });
  // إعادة قراءة شاملة عند طلب الكود القديم، لكن فقط بعد جاهزية البيانات حتى لا نُظهر أصفاراً قبل التحميل
  window.addEventListener('legacy:stats-refresh', () => { if (state.ready) syncAll(); });
  window.addEventListener('legacy:site-config', (e) => {
    const d = e.detail || {};
    emit({ ...state, siteGates: { ...(d.gates || {}) }, siteNews: keepIfSame(state.siteNews, d.news && typeof d.news === 'object' ? d.news : {}) });
  });

  // أداة فحص في وضع التطوير فقط: افتح Console واكتب __store.getState()
  if (import.meta.env?.DEV) window.__store = { getState, subscribe };
}

// ── الكتابة: تمرّ دائماً عبر مسار الحفظ القديم حتى يبقى Firebase وlocalStorage كما هما ──
export async function saveCollection(key, items) {
  const b = bridge();
  if (!b || !b.saveCollection) throw new Error('الجسر القديم غير جاهز');
  return b.saveCollection(key, items);
}

export function saveStudents(list) {
  const b = bridge();
  if (!b || !b.saveStudents) throw new Error('الجسر القديم غير جاهز');
  b.saveStudents(list);
}

export function getStudentsRaw() {
  const b = bridge();
  return b && b.getStudentsRaw ? b.getStudentsRaw() : [];
}
