// تصدير لائحة التلاميذ إلى Excel — وحدة ES منقولة من exportStudentListExcel في script-10.js (الخطوة 44).
// ورقة «قائمة كاملة» ثم ورقة لكل قسم بأعمدة: الرقم | رقم مسار | النسب | الاسم | (القسم) | الجنس | تاريخ الازدياد (dd/mm/yyyy).
// المكتبة XLSX تأتي من window (ما زالت تُحمَّل من CDN إلى الخطوة 48) وتُمرَّر كوسيط لتسهيل الاختبار.
import { splitName, formatDob } from './studentList.js';

export const HEAD_ALL = ['الرقم', 'رقم مسار', 'النسب', 'الاسم', 'القسم', 'الجنس', 'تاريخ الازدياد'];
export const HEAD_CLASS = ['الرقم', 'رقم مسار', 'النسب', 'الاسم', 'الجنس', 'تاريخ الازدياد'];
export const COLS_ALL = [8, 15, 22, 22, 15, 10, 14];
export const COLS_CLASS = [8, 15, 22, 22, 10, 14];
export const ALL_SHEET = 'قائمة كاملة';
export const EMPTY_MSG = '⚠️ القائمة فارغة حالياً.';

// القائمة المعروضة: الأساسية ثم المخزَّنة التي لا يطابق اسمها أحداً منها
export const mergeForExport = (base, custom) => [...base, ...custom.filter((c) => !base.some((s) => s.name === c.name))];

// اسم ورقة صالح في Excel: بلا : \ / ? * [ ] وبحد أقصى 31 حرفاً، وفريد (التقصير قد يجعل اسمين متطابقين فيرفض XLSX)
export function sheetName(cls, used = new Set()) {
  const base = String(cls).replace(/[:\\/?*[\]]/g, '-').slice(0, 31);
  let name = base, n = 2;
  while (used.has(name.toLowerCase())) { const suf = '-' + n++; name = base.slice(0, 31 - suf.length) + suf; }
  used.add(name.toLowerCase());
  return name;
}

// يبني الأوراق: { all: { name, rows, cols }, classes: [{ cls, name, rows, cols }] } (الأقسام مرتّبة بالفرز الافتراضي كالقديم)
export function buildExportSheets(all) {
  const byClass = {};
  all.forEach((s) => { const cls = s.class || 'غير محدد'; (byClass[cls] = byClass[cls] || []).push(s); });

  const rows = [HEAD_ALL];
  all.forEach((s, i) => { const n = splitName(s); rows.push([i + 1, s.massar || '', n.family, n.given, s.class || '', s.gender || '', formatDob(s.dob)]); });

  const used = new Set([ALL_SHEET.toLowerCase()]);
  const classes = Object.keys(byClass).sort().map((cls) => {
    const r = [HEAD_CLASS];
    byClass[cls].forEach((s, i) => { const n = splitName(s); r.push([i + 1, s.massar || '', n.family, n.given, s.gender || '', formatDob(s.dob)]); });
    return { cls, name: sheetName(cls, used), rows: r, cols: COLS_CLASS.map((wch) => ({ wch })) };
  });
  return { all: { name: ALL_SHEET, rows, cols: COLS_ALL.map((wch) => ({ wch })) }, classes };
}

export const fileNameFor = (now = new Date()) => `قائمة_التلاميذ_${now.toLocaleDateString('ar-MA').replace(/\//g, '-')}.xlsx`;

// يكتب الملف. يُرجِع { ok:true, file, count } أو { ok:false, reason:'empty'|'no-xlsx' }
export function exportStudentList(all, XLSX, now = new Date()) {
  if (!all.length) return { ok: false, reason: 'empty' };
  if (!XLSX) return { ok: false, reason: 'no-xlsx' };
  const sheets = buildExportSheets(all);
  const wb = XLSX.utils.book_new();
  [sheets.all, ...sheets.classes].forEach((sh) => {
    const ws = XLSX.utils.aoa_to_sheet(sh.rows);
    ws['!cols'] = sh.cols;
    XLSX.utils.book_append_sheet(wb, ws, sh.name);
  });
  const file = fileNameFor(now);
  XLSX.writeFile(wb, file);
  return { ok: true, file, count: all.length };
}
