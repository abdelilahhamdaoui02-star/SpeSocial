// منطق «البرنامج التدخلي الفردي» (المرحلة 17) — دوال نقية بلا DOM، منقولة من script-36.js القديم
// (المجمَّد في tests/fixtures/iip.step16.js) وكل دالة هنا تقابل جزءاً من مصنع الأحداث القديم.
// التخزين كما كان: localStorage بالمفتاح app:iip:<اسم المستخدم>، لم يتغير شكل البيانات المحفوظة.
import { MODELS, DOM } from './iipData.js';

export const KEY_PREFIX = 'app:iip:';
export const storageKey = (user) => KEY_PREFIX + (user || '');

export const MSG = {
  NAME_FIRST: '⚠️ أدخل اسم التلميذ(ة) أولاً',
  SAVED: '✅ تم حفظ البرنامج',
  STORAGE_FULL: 'تعذّر الحفظ: مساحة التخزين ممتلئة',
  MAX_MODELS: '⚠️ يمكن اختيار نموذجين على الأكثر',
  PICK_MODEL: 'اختر نموذجاً تدخلياً أولاً',
  SESSION_NEEDED: 'أدخل محور الجلسة أو الملاحظات',
  WORD_FAILED: 'تعذّر إنشاء ملف Word',
};

export const CONFIRM = {
  OPEN_EXISTING: 'يوجد برنامج نشط لهذا التلميذ(ة). هل تريد فتحه بدل إنشاء برنامج جديد؟',
  REPLACE_STRATEGIES: 'سيُستبدل نص الاستراتيجيات الحالي. متابعة؟',
  NEW_PROGRAM: 'سيتم إغلاق النموذج الحالي (محفوظ تلقائياً). متابعة؟',
  DELETE: 'حذف هذا البرنامج نهائياً؟',
};

export const NO_SUGGESTIONS_TEXT = 'لا توجد اقتراحات بعد (أدخل المؤشرات القاعدية أولاً).';
export const EMPTY_SESSIONS_TEXT = 'لا توجد جلسات مسجلة بعد.';
export const EMPTY_ARCHIVE_TEXT = 'لا توجد برامج محفوظة.';
export const DONE_LEVELS = ['', 'لم يبدأ', 'في تقدّم', 'تحقق جزئياً', 'تحقق'];
export const NAME_PLACEHOLDER_EMPTY_DB = 'استورد لائحة التلاميذ أولاً (من الصفحة الرئيسية) أو اكتب الاسم يدوياً';

const pad2 = (n) => String(n).padStart(2, '0');
export const todayStr = (now = new Date()) => now.getFullYear() + '-' + pad2(now.getMonth() + 1) + '-' + pad2(now.getDate());

export const blank = (now = new Date()) => ({
  id: 'iip_' + now.getTime(), opened: todayStr(now), status: 'نشط', domain: '', models: [], primary: '', goals: [{}], sessions: [],
  referral: {}, consent: {}, assess: {}, baseline: {}, roles: {}, schedule: {}, review: {}, post: {}, strategies: '',
});

export const clone = (o) => JSON.parse(JSON.stringify(o));

// ── التخزين ──
export function loadAll(storage, user) {
  try {
    const v = JSON.parse(storage.getItem(storageKey(user)) || '[]');
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}
export function storeAll(storage, user, all) {
  try { storage.setItem(storageKey(user), JSON.stringify(all)); return true; } catch (e) { return false; }
}

// ── مسارات الحقول (assess.risks …) ──
export const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
// نسخة غير مغيِّرة من sp القديمة: تعيد برنامجاً جديداً والأصل لا يُمَسّ
export function setPath(o, p, v) {
  const next = clone(o);
  const a = p.split('.');
  let x = next;
  a.slice(0, -1).forEach((k) => { x = x[k] || (x[k] = {}); });
  x[a[a.length - 1]] = v;
  return next;
}

// ── الحفظ ──
export const canSave = (cur) => !!(cur.studentName && cur.studentName.trim());

// يضيف البرنامج أول الأرشيف إن كان جديداً أو يستبدل نسخته؛ يعيد البرنامج بعد ختم updated والأرشيف الجديد
export function upsert(all, cur, nowIso) {
  const stamped = { ...cur, updated: nowIso };
  const next = all.slice();
  const i = next.findIndex((x) => x.id === stamped.id);
  if (i < 0) next.unshift(clone(stamped)); else next[i] = clone(stamped);
  return { cur: stamped, all: next };
}

// برنامج نشط آخر لنفس التلميذ (بالمسار أو الاسم) — يسبّب سؤال «هل تريد فتحه؟»
export function findActiveDuplicate(all, cur) {
  return all.find((p) => p.id !== cur.id && p.status === 'نشط'
    && ((p.massar && p.massar === cur.massar) || (p.studentName && p.studentName === cur.studentName)));
}
export const dupKey = (cur) => (cur.massar || cur.studentName || '').trim();

// ── النماذج التدخلية ──
export function pickModel(cur, k) {
  const next = clone(cur);
  const i = next.models.indexOf(k);
  if (i >= 0) {
    next.models.splice(i, 1);
    if (next.primary === k) next.primary = next.models[0] || '';
  } else {
    if (next.models.length >= 2) return { error: MSG.MAX_MODELS };
    next.models.push(k);
    if (!next.primary) next.primary = k;
  }
  return { cur: next };
}
export const setPrimary = (cur, k) => ({ ...clone(cur), primary: k });
export const recommendedModels = (domain) => (domain && DOM[domain] ? DOM[domain][1] : []);

// ── الأهداف ──
export const addGoal = (cur) => { const n = clone(cur); n.goals.push({}); return n; };
export function delGoal(cur, i) {
  const n = clone(cur);
  n.goals.splice(i, 1);
  if (!n.goals.length) n.goals = [{}];
  return n;
}
export function setGoalField(cur, i, k, v) { const n = clone(cur); n.goals[i][k] = v; return n; }

// اقتراح الاستراتيجيات من النموذج الرئيسي؛ إن كان هناك نص موجود تسأل الواجهة عن الاستبدال قبل الاستدعاء
export function autoplan(cur) {
  const m = MODELS[cur.primary];
  if (!m) return { error: MSG.PICK_MODEL };
  const n = clone(cur);
  n.strategies = 'النموذج: ' + m.n + '\n' + m.steps.map((s, i) => (i + 1) + '. ' + s).join('\n');
  const total = parseInt((m.sess.match(/\d+\s*(?:إلى|–|-)\s*(\d+)/) || [])[1]);
  if (total && !n.schedule.total) n.schedule.total = total;
  return { cur: n };
}

// ── الجلسات ──
export const EMPTY_DRAFT = (today) => ({ date: today, dur: '', scale: '', focus: '', tech: '', task: '', resp: '', next: '' });
export function addSession(cur, d, today) {
  const s = {
    date: d.date || today, dur: d.dur || cur.schedule.dur || '', scale: d.scale, focus: d.focus, tech: d.tech, task: d.task, resp: d.resp, next: d.next,
  };
  if (!s.focus && !s.resp) return { error: MSG.SESSION_NEEDED };
  const n = clone(cur);
  n.sessions.push(s);
  return { cur: n };
}
export function delSession(cur, i) { const n = clone(cur); n.sessions.splice(i, 1); return n; }

// ── مؤشرات الملخص (الجلسات والتقدم والمؤشرات القبلية/البعدية) ──
export function progressView(cur) {
  const S = cur.sessions;
  const sc = S.filter((s) => s.scale !== '' && !isNaN(+s.scale)).map((s) => +s.scale);
  const tot = +getPath(cur, 'schedule.total') || 0;
  const d = sc.length > 1 ? sc[sc.length - 1] - sc[0] : null;
  const b = cur.baseline || {}; const p = cur.post || {};
  const df = (a, z) => (a !== '' && a != null && z !== '' && z != null ? (' (' + (z - a > 0 ? '+' : '') + (z - a) + ')') : '');
  const items = [{ key: 'sessions', label: '📅 الجلسات: ', bold: S.length + (tot ? ' / ' + tot : '') }];
  if (d != null) items.push({ key: 'delta', label: '📈 تغيّر التقدم: ', bold: (d > 0 ? '+' : '') + d });
  if (p.abs !== undefined && p.abs !== '') items.push({ key: 'abs', text: 'الغياب: ' + (b.abs || 0) + ' ← ' + p.abs + df(b.abs, p.abs) });
  if (p.inc !== undefined && p.inc !== '') items.push({ key: 'inc', text: 'الوقائع: ' + (b.inc || 0) + ' ← ' + p.inc + df(b.inc, p.inc) });
  if (p.well !== undefined && p.well !== '') items.push({ key: 'well', text: 'الرفاه: ' + (b.well || 0) + ' ← ' + p.well + df(b.well, p.well) });
  return items;
}

// ── الأرشيف ──
export function archiveRows(all) {
  return all.map((p) => ({
    id: p.id, name: p.studentName ?? '', level: p.level ?? '',
    domain: p.domain && DOM[p.domain] ? DOM[p.domain][0] : '',
    primary: p.primary && MODELS[p.primary] ? MODELS[p.primary].n : '',
    sessions: p.sessions.length, status: p.status ?? '',
  }));
}

// ── نصوص الملء السريع والشرائح ──
// kind: 'replace' (قوائم/أرقام/تواريخ تُستبدل قيمتها) | 'one' (خانة نص من سطر: تُضاف بفاصلة عربية) | 'area' (منطقة نص: سطر جديد)
// تعيد النص الجديد أو null إن كان مضافاً من قبل (كالقديم: لا تكرار)
export function applySuggestion(value, item, kind) {
  const it = typeof item === 'string' ? { t: item, v: item } : item;
  if (kind === 'replace') return String(it.v);
  const cur = value == null ? '' : String(value);
  if (cur.indexOf(it.v) >= 0) return null;
  return cur ? cur + (kind === 'one' ? '، ' : '\n') + it.v : String(it.v);
}
export const normalizeItems = (items) => items.map((x) => (typeof x === 'string' ? { t: x, v: x } : x));

// ── سياق التقرير (المؤسسة والمختص والشعار) من الملف الشخصي ──
export function reportContext(profile, logo) {
  const sc = profile || {};
  const school = ((sc.institution || sc.school || '') + '').trim() || (sc.institution || '') || 'المؤسسة التعليمية';
  return { school, spec: sc.fullName || '', logo: logo || '' };
}
export const wordFileName = (name) => 'برنامج_تدخلي_فردي_' + name.replace(/\s+/g, '_');
