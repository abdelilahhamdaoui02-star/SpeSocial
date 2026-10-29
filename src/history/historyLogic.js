// منطق نافذة «سجل التلميذ» المشتركة بين المقابلات الفردية والإدماج المدرسي — دوال بحتة بلا DOM،
// منقولة من openStudentHistory / rOpenStudentHistory / printStudentHistory في script-10.js.

export const HISTORY_TYPES = Object.freeze({
  interview: {
    collection: 'interviewArchive',
    dateField: 'interviewDate',
    title: '📋 سجل مقابلات التلميذ(ة)',
    count: (n) => `${n} مقابلات`,
    empty: 'لا توجد مقابلات.',
    confirmDelete: 'حذف هذه المقابلة؟',
  },
  reintegration: {
    collection: 'reintegrationArchive',
    dateField: 'reintegrationDate',
    title: '📋 سجل ملفات إعادة الإدماج للتلميذ(ة)',
    count: (n) => `${n} ملفات`,
    empty: 'لا توجد ملفات.',
    confirmDelete: 'حذف هذا الملف؟',
  },
});

const sameName = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

// سجلات التلميذ نفسه (المقارنة بالاسم دون حساسية للحالة)، من الأقدم إلى الأحدث بحسب حقل التاريخ
export function historyEntries(archive, studentName, type) {
  const field = HISTORY_TYPES[type].dateField;
  return (archive || [])
    .filter((e) => sameName(e.studentName, studentName))
    .sort((a, b) => (a[field] || '').localeCompare(b[field] || ''));
}

export const PRIORITY_COLOR = Object.freeze({ 'عاجلة': '#dc2626', 'عالية': '#c2410c', 'متوسطة': '#d97706', 'عادية': '#16a34a' });
export const PRIORITY_BG = Object.freeze({ 'عاجلة': '#fee2e2', 'عالية': '#fff7ed', 'متوسطة': '#fffbeb', 'عادية': '#f0fdf4' });

// null = لا شارة (فارغة أو «—»)
export function priorityBadge(priority) {
  if (!priority || priority === '—') return null;
  return {
    label: priority,
    bg: PRIORITY_BG[priority] || '#f1f5f9',
    color: PRIORITY_COLOR[priority] || '#64748b',
    border: PRIORITY_COLOR[priority] || '#cbd5e1',
  };
}

// ملخص المقابلة في الجدول: أول 100 حرف ثم «…»
export const clip100 = (s) => (s ? s.slice(0, 100) + (s.length > 100 ? '…' : '') : '—');

export const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
