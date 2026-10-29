// منطق قسم «قائمة التلاميذ» في الإعدادات (الإضافة اليدوية، البحث والحذف المحدَّد، استعادة النسخة السابقة، حذف القائمة كاملة)
// دوال نقية بلا DOM ولا React، منقولة من script-10.js (addStudentToList وsearchStudentInSettings وdeleteSelectedStudents ...)
// ومن script-11.js (checkStudentBackupAvailable وrestoreStudentBackup وclearAllStudents) بنفس القواعد والنصوص حرفياً.
import { normalizeDob } from '../students/studentList.js';
import { cleanClassValue } from '../students/cleanClass.js';

export const RESULTS_LIMIT = 50;

export const customKey = (user) => (user ? 'app:customStudents:' + user : 'app:customStudents');
export const backupKey = (user) => (user ? 'app:customStudents_backup:' + user : 'app:customStudents_backup');

export const MSG = {
  NAME_SHORT: '⚠️ أدخل اسماً كاملاً (3 أحرف على الأقل)',
  NO_BACKUP: 'لا توجد نسخة احتياطية.',
  EMPTY_BACKUP: 'النسخة الاحتياطية فارغة.',
  RESTORE_ERROR: 'خطأ أثناء الاستعادة.',
  NO_RESULTS: 'لا توجد نتائج.',
};
export const COLORS = { ok: '#16a34a', error: '#dc2626', deleted: '#dc2626', restored: '#1d4ed8', cleared: '#16a34a' };

// getImportedClasses القديمة: أقسام اللائحة (الذاكرة إن امتلأت وإلا المخزَّنة) مرتّبة عربياً، والكتابة الحرة مسموحة في الحقل
export function classOptions(dbList, custom) {
  const list = dbList && dbList.length ? dbList : custom || [];
  const set = new Set();
  list.forEach((s) => { const c = cleanClassValue(s && s.class); if (c) set.add(c); });
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
}

// ── الإضافة اليدوية ──
export function buildNewStudent(form) {
  const family = (form.family || '').trim();
  const given = (form.given || '').trim();
  const name = (family + ' ' + given).trim();
  const cls = (form.cls || '').trim();
  const massar = (form.massar || '').trim();
  const dob = normalizeDob(form.dob || '');
  if (!name || name.length < 3) return { error: MSG.NAME_SHORT };
  return { name, student: { name, family, given, class: cls || '', gender: form.gender || '', massar, dob } };
}

// لا يُضاف من اسمه موجود في القائمة المخزَّنة (والرسالة تظهر مع ذلك كما في القديم)
export function addToCustom(custom, student) {
  if (custom.some((s) => s.name === student.name)) return { list: custom, changed: false };
  return { list: [...custom, student], changed: true };
}
export const addedText = (name) => `✅ تمت إضافة "${name}" للقائمة.`;

// ── البحث والحذف المحدَّد ──
// state: 'empty' (لا بحث) | 'none' (لا نتائج) | 'results'
export function searchStudents(custom, dbList, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return { state: 'empty', shown: [], extra: 0 };
  const all = [...custom, ...dbList.filter((s) => !custom.some((c) => c.name === s.name || c.fullName === s.name))];
  const found = all.filter((s) => {
    const name = s.name || s.fullName || '';
    const cls = s.class || '';
    return name.toLowerCase().includes(q) || cls.toLowerCase().includes(q);
  });
  if (!found.length) return { state: 'none', shown: [], extra: 0 };
  const limit = Math.min(found.length, RESULTS_LIMIT);
  return {
    state: 'results',
    shown: found.slice(0, limit).map((s) => ({ name: s.name || s.fullName || '', class: s.class || '', gender: s.gender || '' })),
    extra: found.length > limit ? found.length - limit : 0,
  };
}

export const selectedLabel = (n) => n + ' محدد(ة)';
export const extraText = (n) => `... و ${n} نتيجة إضافية. دقق البحث للتضييق.`;

export function deleteConfirmText(names) {
  return `🗑 هل تريد حذف ${names.length} تلميذ(ة) من القائمة؟\n\n${names.slice(0, 5).join('\n')}${names.length > 5 ? '\n...' : ''}`;
}
export const deletedText = (n) => `✅ تم حذف ${n} تلميذ(ة) بنجاح.`;
export const removeNames = (custom, names) => custom.filter((s) => !names.includes(s.name) && !names.includes(s.fullName));

// ── النسخة الاحتياطية (تكتبها عملية الاستيراد) ──
export function readBackupInfo(storage, user) {
  const key = backupKey(user);
  try {
    const backup = storage.getItem(key);
    const date = storage.getItem(key + ':date') || '';
    const count = storage.getItem(key + ':count') || '0';
    if (backup && JSON.parse(backup).length > 0) return { available: true, info: `📅 آخر نسخة: ${date} — ${count} تلميذ(ة)` };
  } catch { /* كما في القديم: أي خطأ = لا نسخة */ }
  return { available: false, info: '' };
}

export function restoreConfirmText(storage, user) {
  const key = backupKey(user);
  const count = storage.getItem(key + ':count') || '0';
  const date = storage.getItem(key + ':date') || '';
  return `↩️ هل تريد استعادة القائمة السابقة؟\n\n📋 ${count} تلميذ(ة) — ${date}\n\nسيتم استبدال القائمة الحالية بالقائمة المحفوظة.`;
}
export const restoredText = (n) => `✅ تمت الاستعادة بنجاح — ${n} تلميذ(ة).`;

// يقرأ النسخة: { status: 'none'|'empty'|'error'|'ok', list }
export function loadBackup(storage, user) {
  try {
    const backup = storage.getItem(backupKey(user));
    if (!backup) return { status: 'none', list: [] };
    const list = JSON.parse(backup);
    if (!list.length) return { status: 'empty', list };
    return { status: 'ok', list };
  } catch {
    return { status: 'error', list: [] };
  }
}
export function dropBackup(storage, user) {
  const key = backupKey(user);
  storage.removeItem(key);
  storage.removeItem(key + ':date');
  storage.removeItem(key + ':count');
}

// ── حذف القائمة كاملة ──
export const clearConfirmText = (count) => `⚠️ هل أنت متأكد من حذف جميع التلاميذ (${count} تلميذ) من قاعدة البيانات نهائياً؟\n\nملاحظة: الأرشيف والسجلات لن تُحذف.`;
export const clearedText = (count) => `✅ تم حذف جميع التلاميذ (${count}). يمكنك الآن إضافتهم يدوياً.`;
export function dropCustomKeys(storage, user) {
  try {
    storage.removeItem('app:customStudents');
    if (user) storage.removeItem(customKey(user));
  } catch { /* التخزين غير متاح */ }
}
