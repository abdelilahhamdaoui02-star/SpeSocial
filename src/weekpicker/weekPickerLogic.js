// منطق نافذة «اختر الأسبوع» — دوال نقية بلا DOM ولا React، منقولة من WEEK PICKER MODAL في script-10.js القديم:
// الأسبوع من الاثنين إلى الأحد، وتاريخ النهاية = البداية + 6 أيام، والتحقق قبل «معاينة التقرير».
// ملاحظة: نُبقي toISOString كما في القديم تماماً (للمطابقة)، فالنتيجة هي نفسها يوماً بيوم.

export const WP_FROM_KEY = 'wp:selectedFrom';
export const WP_TO_KEY = 'wp:selectedTo';

export const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const MESSAGES = {
  MISSING: '⚠️ يرجى تحديد تاريخ البداية والنهاية.',
  ORDER: '⚠️ تاريخ البداية يجب أن يكون قبل تاريخ النهاية.',
};

// أزرار «اختيار سريع»: offset بالأسابيع، والألوان منقولة حرفياً من HTML القديم
export const QUICK_PICKS = [
  { id: 'this', offset: 0, label: 'هذا الأسبوع', color: '#1d4ed8', bg: '#eff6ff', hover: '#dbeafe', border: '#bfdbfe' },
  { id: 'last', offset: -1, label: '◀ الأسبوع الماضي', color: '#166534', bg: '#f0fdf4', hover: '#dcfce7', border: '#bbf7d0' },
  { id: 'before', offset: -2, label: '◀◀ قبل أسبوعين', color: '#854d0e', bg: '#fefce8', hover: '#fef9c3', border: '#fef08a' },
];

// wpGetWeekRange القديمة: offsetWeeks = 0 هذا الأسبوع، -1 الماضي، -2 قبل أسبوعين
export function weekRange(offsetWeeks = 0, now = new Date()) {
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff + offsetWeeks * 7);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { from: mon.toISOString().slice(0, 10), to: sun.toISOString().slice(0, 10) };
}

// wpSyncToDate القديمة: تغيير «من تاريخ» يضبط «إلى تاريخ» على +6 أيام (وإن كان فارغاً لا يتغير شيء → null)
export function endFromStart(from) {
  if (!from) return null;
  const d = new Date(from + 'T12:00:00');
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

// wpUpdatePreview القديمة: نص الشريط الأزرق، أو null إن نقص تاريخ (الشريط يختفي)
export function previewText(from, to) {
  if (!from || !to) return null;
  const df = new Date(from + 'T12:00:00');
  const dt = new Date(to + 'T12:00:00');
  const diffDays = Math.round((dt - df) / 86400000) + 1;
  return `${DAY_NAMES[df.getDay()]} ${from}  →  ${DAY_NAMES[dt.getDay()]} ${to} \u00a0|\u00a0 ${diffDays} أيام`;
}

// wpGenerateReport القديمة (قبل الحفظ): رسالة الخطأ أو null إن كان كل شيء سليماً
export function validateRange(from, to) {
  if (!from || !to) return MESSAGES.MISSING;
  if (from > to) return MESSAGES.ORDER;
  return null;
}

// حفظ الأسبوع المختار في المتصفح (نفس المفتاحين القديمين؛ openWeeklyReportPreview القديمة تقرؤهما)
export function saveSelectedWeek(storage, from, to) {
  try {
    storage.setItem(WP_FROM_KEY, from);
    storage.setItem(WP_TO_KEY, to);
  } catch { /* التخزين غير متاح: نتجاهل كما في القديم */ }
}
