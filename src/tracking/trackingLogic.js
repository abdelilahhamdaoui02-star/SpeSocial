// الإشعارات وجدول التتبع الشهري — منطق خالص (بلا DOM) منقول من كتلة «Notifications / جدول التتبع الشهري الشامل» في script-10.js القديم.
// مُختبَر بمطابقة النسخة المجمَّدة tests/fixtures/tracking.step45.js (tests/tracking.parity.test.js).
//
// الأرشيفات تُمرَّر كائناً واحداً { interview, reintegration, absence, specialNeeds, violence } (بدل notifGetArchive القديمة التي كانت تقرأ appData).

// نوع الأرشيف → اسم المجموعة في المخزن (appData)
export const ARCHIVE_COLLECTIONS = Object.freeze({
  interview: 'interviewArchive',
  reintegration: 'reintegrationArchive',
  absence: 'absenceArchive',
  specialNeeds: 'specialNeedsArchive',
  violence: 'violenceArchive',
});
export const ARCHIVE_TYPES = Object.freeze(Object.keys(ARCHIVE_COLLECTIONS));

// ── الإشعارات: تسميات وأيقونات كل نوع (حرفياً من getAllNotifs) ──
export const NOTIF_TYPES = Object.freeze({
  interview: { label: 'مقابلة فردية', icon: '🗂' },
  reintegration: { label: 'إدماج مدرسي', icon: '📋' },
  absence: { label: 'ملف غياب', icon: '🚨' },
  specialNeeds: { label: 'وضعية إعاقة', icon: '♿' },
  violence: { label: 'حالة عنف', icon: '🛡️' },
});

// ── جدول التتبع: تسميات وأيقونات كل نوع (حرفياً من getAllTrackingLogs) ──
export const TRACK_TYPE_LABELS = Object.freeze({
  interview: 'مقابلة فردية',
  reintegration: 'إعادة الإدماج',
  absence: 'الغياب',
  specialNeeds: 'الاحتياجات الخاصة',
  violence: 'العنف المدرسي',
});
export const TRACK_TYPE_ICONS = Object.freeze({
  interview: '🗂️', reintegration: '🔄', absence: '⚠️', specialNeeds: '♿', violence: '🛡️',
});

export const STATUS_COLOR = Object.freeze({
  '✅ تحسن ملحوظ': '#16a34a', '🟢 وضعية مستقرة': '#16a34a', '🔶 لا يزال قيد المتابعة': '#d97706',
  '🔴 تراجع — يستدعي تدخلاً': '#dc2626', '🏛️ تمت الإحالة': '#7c3aed', '✔️ انتهت المتابعة': '#0f766e',
});
export const STATUS_BG = Object.freeze({
  '✅ تحسن ملحوظ': '#f0fdf4', '🟢 وضعية مستقرة': '#f0fdf4', '🔶 لا يزال قيد المتابعة': '#fffbeb',
  '🔴 تراجع — يستدعي تدخلاً': '#fef2f2', '🏛️ تمت الإحالة': '#f5f3ff', '✔️ انتهت المتابعة': '#f0fdfa',
});

const DAY_MS = 86400000;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };

// ══════════ الإشعارات ══════════

// getAllNotifs القديمة: كل سجل له nextFollowup صالح يصير عنصراً. الترتيب = ترتيب الأرشيفات ثم ترتيب السجلات (بلا فرز).
export function getAllNotifs(archives, now = new Date()) {
  const today = startOfDay(now);
  const allItems = [];
  ARCHIVE_TYPES.forEach((archiveType) => {
    const meta = NOTIF_TYPES[archiveType];
    ((archives && archives[archiveType]) || []).forEach((e) => {
      if (e.nextFollowup && e.nextFollowup !== '—') {
        const d = startOfDay(e.nextFollowup);
        if (!isNaN(d)) {
          allItems.push({ date: d, dateStr: e.nextFollowup, student: e.studentName, school: e.school, type: meta.label, icon: meta.icon, priority: e.priority, id: e.id, archiveType });
        }
      }
    });
  });
  return { allItems, today };
}

// تصنيف الموعد (الألوان today/soon/upcoming/overdue موجودة في CSS القديم .notif-dot/.notif-date).
// قرار هذه الخطوة: «قريب» = خلال ثلاثة أيام بعد اليوم، وما بعدها «قادم».
export const SOON_DAYS = 3;
export function classifyNotif(item, today) {
  const diff = Math.round((startOfDay(item.date).getTime() - startOfDay(today).getTime()) / DAY_MS);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= SOON_DAYS) return 'soon';
  return 'upcoming';
}

export const NOTIF_SECTIONS = Object.freeze([
  { key: 'overdue', title: '⏰ متأخرة', color: '#7c3aed' },
  { key: 'today', title: '🔴 اليوم', color: '#dc2626' },
  { key: 'soon', title: '🟠 خلال الأيام القادمة', color: '#d97706' },
  { key: 'upcoming', title: '🔵 لاحقاً', color: '#2563a8' },
]);

// يوزّع العناصر على الأقسام الأربعة مرتبةً بالأقرب فالأبعد؛ ويعيد العدّادات
export function groupNotifs(allItems, today) {
  const groups = { overdue: [], today: [], soon: [], upcoming: [] };
  allItems.forEach((it) => groups[classifyNotif(it, today)].push(it));
  Object.values(groups).forEach((g) => g.sort((a, b) => a.date - b.date));
  const counts = { overdue: groups.overdue.length, today: groups.today.length, soon: groups.soon.length, upcoming: groups.upcoming.length };
  return { groups, counts, total: allItems.length };
}

// رقم الجرس: ما يستدعي انتباهاً الآن (اليوم + المتأخر)
export const bellCount = (counts) => counts.today + counts.overdue;

// notifGetLogs القديمة
export function notifGetLogs(archives, archiveType, entryId) {
  if (!archiveType || !entryId) return [];
  const entry = ((archives && archives[archiveType]) || []).find((e) => e.id === entryId);
  return entry ? (entry.trackingLogs || []) : [];
}

// ══════════ جدول التتبع الشهري ══════════

// getAllTrackingLogs القديمة (الفرز بتاريخ التتبع تنازلياً، و«—» في النهاية)
export function getAllTrackingLogs(archives) {
  const rows = [];
  ARCHIVE_TYPES.forEach((type) => {
    ((archives && archives[type]) || []).forEach((entry) => {
      (entry.trackingLogs || []).forEach((log) => {
        rows.push({
          archiveType: type,
          typeLabel: TRACK_TYPE_LABELS[type] || type,
          typeIcon: TRACK_TYPE_ICONS[type] || '📋',
          entryId: entry.id,
          studentName: entry.studentName || '—',
          school: entry.school || '—',
          level: entry.level || '—',
          priority: entry.priority || '—',
          trackDate: log.date || '—',
          trackResult: log.result || '—',
          trackNote: log.note || '—',
          trackBy: log.by || '—',
          trackActions: (entry.procedures || []).join('، ') || '—',
          nextDate: log.nextDate || '—',
          savedAt: log.savedAt || '—',
          logId: log.id,
          summary: entry.summary || entry.specialistNotes || '—',
        });
      });
    });
  });
  rows.sort((a, b) => {
    if (a.trackDate === '—') return 1;
    if (b.trackDate === '—') return -1;
    return b.trackDate.localeCompare(a.trackDate);
  });
  return rows;
}

const monthName = (ym) => {
  const [y, mo] = ym.split('-');
  return new Date(+y, +mo - 1, 1).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long' });
};

// populateMonthFilter القديمة: الأشهر الموجودة فعلاً (الأحدث أولاً) بصيغة [{ value:'YYYY-MM', label }]
export function monthOptions(rows) {
  const months = new Set();
  rows.forEach((r) => { if (r.trackDate && r.trackDate !== '—' && r.trackDate.length >= 7) months.add(r.trackDate.slice(0, 7)); });
  return [...months].sort().reverse().map((value) => ({ value, label: monthName(value) }));
}

export const monthLabelOf = (monthFilter) => (monthFilter ? monthName(monthFilter) : 'كل الأشهر');

// الفلترة: واجهة الجدول تبحث في الاسم والملاحظة والإجراءات والملخص والمتابِع؛ التصدير (الطباعة) القديم كان يبحث في الثلاثة الأولى فقط — نُبقي الفرق كما كان.
export function filterRows(rows, { month = '', type = '', search = '' } = {}, { forPrint = false } = {}) {
  let out = rows;
  const q = (search || '').trim().toLowerCase();
  if (month) out = out.filter((r) => r.trackDate.startsWith(month));
  if (type) out = out.filter((r) => r.archiveType === type);
  if (q) {
    out = out.filter((r) => (forPrint
      ? r.studentName.toLowerCase().includes(q) || r.trackNote.toLowerCase().includes(q) || r.trackActions.toLowerCase().includes(q)
      : r.studentName.toLowerCase().includes(q) || r.trackNote.toLowerCase().includes(q) || r.trackActions.toLowerCase().includes(q)
        || r.summary.toLowerCase().includes(q) || r.trackBy.toLowerCase().includes(q)));
  }
  return out;
}

// البطاقات الأربع. الشاشة تعدّ «تراجع» و«متأخرة»، والطباعة «تراجع» فقط (كما كانتا).
export function trackingKpis(rows, { forPrint = false } = {}) {
  return {
    total: rows.length,
    improved: rows.filter((r) => r.trackResult.includes('تحسن') || r.trackResult.includes('مستقرة')).length,
    needsAttn: rows.filter((r) => (forPrint ? r.trackResult.includes('تراجع') : r.trackResult.includes('تراجع') || r.trackResult.includes('متأخرة'))).length,
    pending: rows.filter((r) => r.trackResult.includes('قيد المتابعة')).length,
  };
}

// تجميع الصفوف بحسب (التلميذ، النوع، السجل) بترتيب الظهور الأول
export function groupByStudent(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const key = r.studentName + '||' + r.archiveType + '||' + r.entryId;
    if (!map.has(key)) map.set(key, { info: r, logs: [] });
    map.get(key).logs.push(r);
  });
  return [...map.values()];
}

// stripEmoji القديمة بالتعبير نفسه
export function stripEmoji(str) {
  return (str || '').replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F300}-\u{1F9FF}]|[\u2702-\u27B0]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[✅✔️🔶🔴🟢🟣🏛️📅📊📝⚙️👤📂📋🔔⚠️🛡️♿🗂️🔄]/gu, '').trim();
}

// ملخص الجلسة المعروض في الخلية: الملاحظة، وإلا ملخص السجل، وإلا «—»
export const sessionSummary = (r) => (r.trackNote !== '—' ? r.trackNote : (r.summary !== '—' ? r.summary : '—'));

// الإجراءات المتخذة كوسوم
export const actionChips = (r) => (r.trackActions && r.trackActions !== '—' ? r.trackActions.split('، ') : []);

// تاريخ اليوم بالعربية (ar-MA) كما في «آخر تحديث» والتقرير المطبوع
export const longDate = (d = new Date()) => d.toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' });

// نص الموعد النسبي بجانب التاريخ (اليوم / غداً / بعد N يوماً / متأخر N يوماً)
export function relativeLabel(item, today) {
  const diff = Math.round((startOfDay(item.date).getTime() - startOfDay(today).getTime()) / DAY_MS);
  if (diff === 0) return 'اليوم';
  if (diff === 1) return 'غداً';
  if (diff === -1) return 'أمس';
  return diff > 0 ? `بعد ${diff} أيام` : `متأخر ${-diff} يوماً`;
}
