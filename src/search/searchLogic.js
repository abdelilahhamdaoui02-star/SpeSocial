// منطق «البحث العام عن تلميذ» — دوال بحتة بلا DOM، منقولة من globalSearchStudents في script-10.js.
// نسخة محسّنة: التطبيع يُحسب مرة واحدة لكل قائمة (ذاكرة مؤقتة WeakMap) والمسح يتوقف عند اكتمال العدد.
// ملاحظة: الذاكرة المؤقتة مبنية على «مرجع» المصفوفة؛ إذا عُدّلت مصفوفة في مكانها (push/splice) دون إنشاء مصفوفة جديدة
// فلن يتحدث فهرسها. المتاجر الحالية (useStudents/useCollection) تُرجع مصفوفات جديدة عند التغيّر، فلا مشكلة.

export const MIN_QUERY = 2;
export const MAX_STUDENT_RESULTS = 8;
export const MAX_ARCHIVE_RESULTS = 5;

// توحيد الألف والتاء المربوطة والياء، وحروف صغيرة (كما في البحث القديم)
export const normSearch = (v) => (v || '').replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه').replace(/[يى]/g, 'ي').toLowerCase();

// مصادر الأرشيف التي يُبحث فيها عن الاسم، بترتيبها القديم
export const ARCHIVE_SOURCES = Object.freeze([
  { key: 'interviewArchive',     type: 'مقابلة', icon: '🗂', color: '#1a3a5c' },
  { key: 'reintegrationArchive', type: 'إدماج',  icon: '📋', color: '#16a34a' },
  { key: 'absenceArchive',       type: 'غياب',   icon: '🚨', color: '#d97706' },
  { key: 'violenceArchive',      type: 'عنف',    icon: '🛡️', color: '#dc2626' },
]);

// قاعدة التلاميذ + المخصَّصين الذين ليسوا فيها (المقارنة بالاسم بعد التوحيد)
// تُحفظ آخر نتيجة: نفس المدخلات تُرجع نفس المصفوفة (فيعمل فهرس searchStudents)
let lastMerge = { db: undefined, custom: undefined, list: null };
export function mergeStudents(dbList, customList) {
  if (lastMerge.list && lastMerge.db === dbList && lastMerge.custom === customList) return lastMerge.list;
  const all = [...(dbList || [])];
  const seen = new Set(all.map((s) => normSearch(s.fullName))); // مرة واحدة بدل find لكل مخصَّص
  (customList || []).forEach((s) => {
    const c = { fullName: s.name || s.fullName || '', class: s.class || '', gender: s.gender || '', massar: s.massar || '', _fromCustom: true };
    if (!c.fullName) return;
    const n = normSearch(c.fullName);
    if (!seen.has(n)) { seen.add(n); all.push(c); }
  });
  lastMerge = { db: dbList, custom: customList, list: all };
  return all;
}

// فهرس مطبَّع لكل مصفوفة (يُبنى مرة واحدة ويُعاد استعماله ما دام المرجع نفسه)
const studentIndexCache = new WeakMap();
function studentIndex(all) {
  let idx = studentIndexCache.get(all);
  if (!idx) {
    idx = all.map((s) => ({ s, n: normSearch(s.fullName), m: (s.massar || '').toLowerCase() }));
    studentIndexCache.set(all, idx);
  }
  return idx;
}

export function searchStudents(all, query, limit = MAX_STUDENT_RESULTS) {
  const q = (query || '').trim();
  const qn = normSearch(q);        // مرة واحدة، لا لكل تلميذ
  const ql = q.toLowerCase();
  const out = [];
  const idx = studentIndex(all || []);
  for (let i = 0; i < idx.length; i++) {
    const it = idx[i];
    if (it.n.includes(qn) || it.m.startsWith(ql)) {
      out.push(it.s);
      if (out.length >= limit) break; // الترتيب والنتيجة نفسهما كالسابق (filter ثم slice)
    }
  }
  return out;
}

const archiveIndexCache = new WeakMap();
function archiveIndex(arr) {
  let idx = archiveIndexCache.get(arr);
  if (!idx) {
    idx = arr.map((e) => ({ name: e.studentName, n: normSearch(e.studentName), school: e.school }));
    archiveIndexCache.set(arr, idx);
  }
  return idx;
}

// نتائج الأرشيف: اسم واحد لكل تلميذ (أول ظهور)، ثم أول 5
export function searchArchives(collections, query, limit = MAX_ARCHIVE_RESULTS) {
  const qn = normSearch((query || '').trim());
  const seen = new Set();
  const out = [];
  for (const src of ARCHIVE_SOURCES) {
    const arr = (collections && collections[src.key]) || [];
    const idx = archiveIndex(arr);
    for (let i = 0; i < idx.length; i++) {
      const it = idx[i];
      if (it.n.includes(qn) && !seen.has(it.name)) {
        seen.add(it.name);
        out.push({ name: it.name, school: it.school, type: src.type, icon: src.icon, color: src.color });
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}

// null إن كان النص أقصر من حرفين (القائمة مغلقة)، وإلا { students, archive }
export function globalSearch({ students, customStudents, collections, query }) {
  const q = (query || '').trim();
  if (q.length < MIN_QUERY) return null;
  return {
    students: searchStudents(mergeStudents(students, customStudents), q),
    archive: searchArchives(collections, q),
  };
}
