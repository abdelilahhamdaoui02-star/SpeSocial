// حالة نافذة «معاينة وتعديل التقرير الأسبوعي». الكود القديم (بطاقة التقرير ونافذة اختيار الأسبوع)
// ما زال يستدعي openWeeklyReportPreview بالاسم العام، فنسجّلها في installWeeklyPreview.
// الأرشيفات تُقرأ وتُكتب عبر weeklyBridge من جسر الجلسة (src/session/sessionBridge.js) لأن appData ثابت لا تراه الوحدات.
import { buildPreviewRows } from '../weekly/weeklyReport.js';
import { resolveRange, applyToRow, buildPatch, updateArchive, removeFromArchive, deleteMessage } from './weeklyPreviewLogic.js';
import { showToast } from '../ui/toast.js';
import { getBridge } from '../session/sessionBridge.js';

const initial = { open: false, from: '', to: '', rows: [], tab: 'all', editing: null, editSeq: 0 };
let state = initial;
const listeners = new Set();
const set = (next) => { state = { ...state, ...next }; listeners.forEach((fn) => fn()); };

export const getWeeklyPreview = () => state;
export const subscribeWeeklyPreview = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

const bridge = () => { const b = getBridge(); return b ? b.weeklyBridge : undefined; };

// إعادة ضبط للاختبار
export const resetWeeklyPreview = () => { state = initial; listeners.forEach((fn) => fn()); };

// openWeeklyReportPreview القديمة: الأسبوع المحدد، ثم صفوفه من الأرشيفات، ثم فتح النافذة على تبويب «كل الملفات»
export function openWeeklyPreview() {
  const { from, to } = resolveRange(window.localStorage);
  const b = bridge();
  const rows = b ? buildPreviewRows(b.collections(), from, to) : [];
  set({ open: true, from, to, rows, tab: 'all', editing: null });
}

export const closeWeeklyPreview = () => set({ open: false, editing: null });
export const setPreviewTab = (tab) => set({ tab });
// editSeq يتغيّر مع كل فتح فيُعاد تركيب النموذج من قيم السجل (حتى لو لا معرّف للسجل)
export const openEditRow = (row) => {
  if (String(row._type).startsWith('parent')) { showToast('✏️ لتعديل هذا السجل افتح بوابة التواصل مع الأولياء'); return; }
  set({ editing: row, editSeq: state.editSeq + 1 });
};export const closeEditRow = () => set({ editing: null });

function notifyArchiveChanged() {
  const b = bridge();
  if (b && typeof b.refreshStats === 'function') b.refreshStats();
}

// «حفظ التعديلات»: يحدّث الصف المعروض وسجل الأرشيف معاً ثم يغلق نافذة التعديل
export function saveEditRow(form) {
  const row = state.editing;
  if (!row) return;
  const updated = applyToRow(row, form);
  updateArchive(bridge(), row, buildPatch(row, form));
  set({ rows: state.rows.map((r) => (r === row ? updated : r)), editing: null });
  showToast('✅ تم حفظ التعديلات بنجاح');
}

// حذف سجل بعد تأكيد؛ fromEdit = من زر «حذف السجل» داخل نافذة التعديل (نص التأكيد أقصر كما كان)
export function deleteRow(row, { fromEdit = false, confirmFn = (m) => window.confirm(m) } = {}) {
  if (!row || !state.rows.includes(row)) return false;
  if (!confirmFn(deleteMessage(row, { fromArchive: !fromEdit }))) return false;
  removeFromArchive(bridge(), row);
  notifyArchiveChanged();
  set({ rows: state.rows.filter((r) => r !== row), editing: null });
  showToast('🗑️ تم حذف السجل بنجاح');
  return true;
}

export function installWeeklyPreview() {
  window.openWeeklyReportPreview = openWeeklyPreview;
  window.wprClose = closeWeeklyPreview;
}
