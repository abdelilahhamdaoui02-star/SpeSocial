// لائحة التلاميذ: تطبيع الحقول (النسب/الاسم/تاريخ الازدياد) وطباعة اللائحة — ورقة لكل قسم.
// تُسجَّل على window (StudentList, printStudentList) لأن أزرار الإعدادات القديمة تستعمل onclick بالاسم العام.
import { getBridge } from '../session/sessionBridge.js';
import { printLogo } from '../settings/logoStore.js';

const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');

// ── تاريخ الازدياد ──
// الأرقام العربية-الهندية والفارسية → لاتينية (٠١٢٣ → 0123)
const toLatinDigits = (s) => s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) & 0xf));

// أسماء الأشهر (عربية مغربية ومشرقية وفرنسية وإنجليزية) بعد حذف الهمزات والتشكيل
const stripAr = (w) => w.replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const MONTH_WORDS = {
  1: ['يناير', 'janvier', 'january', 'jan'], 2: ['فبراير', 'fevrier', 'february', 'feb'], 3: ['مارس', 'mars', 'march', 'mar'],
  4: ['ابريل', 'avril', 'april', 'apr'], 5: ['ماي', 'مايو', 'mai', 'may'], 6: ['يونيو', 'يونيه', 'juin', 'june', 'jun'],
  7: ['يوليوز', 'يوليو', 'juillet', 'july', 'jul'], 8: ['غشت', 'اغسطس', 'aout', 'august', 'aug'],
  9: ['شتنبر', 'سبتمبر', 'septembre', 'september', 'sep'], 10: ['اكتوبر', 'octobre', 'october', 'oct'],
  11: ['نونبر', 'نوفمبر', 'novembre', 'november', 'nov'], 12: ['دجنبر', 'ديسمبر', 'decembre', 'december', 'dec'],
};
const MONTH_BY_WORD = {};
Object.entries(MONTH_WORDS).forEach(([n, ws]) => ws.forEach((w) => { MONTH_BY_WORD[w] = Number(n); }));
const monthOfWord = (w) => MONTH_BY_WORD[stripAr(String(w).toLowerCase().replace(/[éè]/g, 'e').replace(/û/g, 'u').replace(/[.,]/g, ''))] || 0;

// تاريخ صالح فعلاً (31/02 مرفوض) وضمن مدى معقول لسنة الازدياد
function validYmd(y, m, d) {
  if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
}
const isoOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const fromSerial = (v) => { const d = new Date(Math.round((v - 25569) * 86400000)); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
// سنة من رقمين: ≤ سنة اليوم → 20xx وإلا 19xx
const fullYear = (yy) => { const cur = new Date().getFullYear() % 100; return yy <= cur ? 2000 + yy : 1900 + yy; };
// يوم/شهر بترتيب مغربي؛ إن كان «الشهر» > 12 و«اليوم» ≤ 12 فالصيغة أمريكية فنقلبهما
function dmy(d, m, y) {
  d = Number(d); m = Number(m); y = Number(y);
  if (m > 12 && d <= 12) { const t = d; d = m; m = t; }
  return validYmd(y, m, d) ? isoOf(y, m, d) : null;
}

// تاريخ الازدياد → YYYY-MM-DD (يقبل رقم إكسل التسلسلي وdd/mm/yyyy وdd-mm-yyyy وdd/mm/yy وyyyy-mm-dd وDate
// و«15 مارس 2008» و«15 mars 2008» والأرقام العربية والوقت الملحق)؛ ما لا يُفهم يُرجَع كما هو
export function normalizeDob(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date) return isNaN(v) ? '' : `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
  if (typeof v === 'number') return v > 1000 && v < 80000 ? fromSerial(v) : String(v);
  const orig = String(v).trim();
  let s = toLatinDigits(orig).replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim();
  s = s.replace(/[T\s]+\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i, '').trim(); // «2008-03-15T00:00:00» أو «15/03/2008 00:00»
  if (/^\d{5}$/.test(s) && Number(s) > 1000 && Number(s) < 80000) return fromSerial(Number(s)); // رقم إكسل مكتوب كنص
  let m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
  if (m) return validYmd(+m[1], +m[2], +m[3]) ? isoOf(m[1], pad(m[2]), pad(m[3])) : orig;
  m = s.match(/^(\d{1,2})[-\/.\s](\d{1,2})[-\/.\s](\d{4})$/);
  if (m) return dmy(m[1], m[2], m[3]) || orig;
  m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2})$/);
  if (m) return dmy(m[1], m[2], fullYear(+m[3])) || orig;
  m = s.match(/^(\d{1,2})(?:er)?[\s\-\/.]+([^\d\s\-\/.]+)[\s\-\/.,]+(\d{4})$/);
  if (m) { const mo = monthOfWord(m[2]); if (mo && validYmd(+m[3], mo, +m[1])) return isoOf(m[3], pad(mo), pad(m[1])); }
  return orig;
}

// هل القيمة تاريخ بصيغة YYYY-MM-DD صالحة (ما يقبله حقل <input type="date">)؟
export function isIsoDob(v) {
  const m = String(v == null ? '' : v).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return !!m && validYmd(+m[1], +m[2], +m[3]);
}

// YYYY-MM-DD → dd/mm/yyyy للعرض
export function formatDob(v) {
  const iso = normalizeDob(v);
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

// النسب والاسم الشخصي: من الحقلين المحفوظين إن وُجدا، وإلا من الاسم الكامل (الاستيراد يكتب «النسب ثم الاسم»)
export function splitName(s) {
  if (s && (s.family || s.given)) return { family: String(s.family || '').trim(), given: String(s.given || '').trim() };
  const parts = String((s && (s.name || s.fullName)) || '').trim().split(/\s+/).filter(Boolean);
  return { family: parts[0] || '', given: parts.slice(1).join(' ') };
}

// تجميع حسب القسم: [[قسم، تلاميذه بترتيب الإدخال]] مرتبة بالأقسام طبيعياً (1BACSEF-2 قبل 1BACSEF-10)
export function groupByClass(students) {
  const by = new Map();
  (students || []).forEach((s) => {
    const c = String((s && s.class) || '').trim() || 'غير محدد';
    if (!by.has(c)) by.set(c, []);
    by.get(c).push(s);
  });
  return [...by.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ar', { numeric: true }));
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Cairo', Arial, sans-serif; margin: 0; color: #111; background: #fff; direction: rtl; }
  .sheet { page-break-after: always; break-after: page; }
  .sheet:last-child { page-break-after: auto; break-after: auto; }
  .hd { text-align: center; border-bottom: 2px solid #1a3a5c; padding-bottom: 6px; margin-bottom: 8px; }
  .hd img { max-height: 70px; max-width: 100%; }
  .hd .dir { font-size: 11px; color: #475569; margin: 2px 0; }
  .hd .inst { font-size: 13px; font-weight: 800; margin: 2px 0; }
  .hd h1 { font-size: 15px; font-weight: 800; color: #1a3a5c; margin: 4px 0 0; }
  .meta { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin: 6px 0 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th, td { border: 1px solid #334155; padding: 3px 6px; }
  th { background: #e5ecf5; font-weight: 800; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  td.c { text-align: center; } td.r { text-align: right; }
  .f { color: #be185d; font-weight: 700; } .m { color: #1d4ed8; font-weight: 700; }
  .ft { margin-top: 8px; font-size: 10px; color: #64748b; text-align: left; }`;

// مستند HTML كامل: ورقة (أو أكثر عند كثرة التلاميذ) لكل قسم بجدول: ر.ت | رقم مسار | النسب | الاسم | الجنس | تاريخ الازدياد
export function buildStudentListHtml(students, { institution = '', directorate = '', date = '', logoHtml = '' } = {}) {
  const groups = groupByClass(students);
  const sheets = groups.map(([cls, list]) => {
    const rows = list.map((s, i) => {
      const { family, given } = splitName(s);
      const g = s.gender === 'أنثى' ? 'f' : (s.gender ? 'm' : '');
      return `<tr><td class="c">${i + 1}</td><td class="c">${esc(s.massar)}</td><td class="r">${esc(family)}</td><td class="r">${esc(given)}</td>`
        + `<td class="c ${g}">${esc(s.gender)}</td><td class="c">${esc(formatDob(s.dob))}</td></tr>`;
    }).join('');
    return `<section class="sheet"><div class="hd">${logoHtml}`
      + (directorate ? `<div class="dir">${esc(directorate)}</div>` : '')
      + (institution ? `<div class="inst">${esc(institution)}</div>` : '')
      + `<h1>لائحة تلاميذ القسم: ${esc(cls)}</h1></div>`
      + `<div class="meta"><span>عدد التلاميذ: ${list.length}</span><span>تاريخ الطباعة: ${esc(date)}</span></div>`
      + `<table><thead><tr><th style="width:34px">ر.ت</th><th style="width:105px">رقم مسار</th><th>النسب</th><th>الاسم</th><th style="width:52px">الجنس</th><th style="width:92px">تاريخ الازدياد</th></tr></thead>`
      + `<tbody>${rows}</tbody></table></section>`;
  }).join('');
  return `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>لائحة التلاميذ</title><style>${CSS}</style></head><body>${sheets}</body></html>`;
}

// الدالة المرتبطة بزر «طباعة اللائحة» — تقرأ التلاميذ وسياق الصفحة من الكود القديم
export function printStudentList() {
  const w = window;
  const base = []; // القائمة الأساسية القديمة (STUDENTS) فارغة منذ زمن ولم تعد معرَّفة
  const bridge = getBridge();
  const custom = bridge && bridge.getStudentsRaw ? bridge.getStudentsRaw() : [];
  const all = [...base, ...custom.filter((c) => !base.some((s) => s.name === c.name))];
  if (!all.length) { alert('⚠️ القائمة فارغة حالياً.'); return; }
  const dirEl = document.querySelector('.dynamic-directorate');
  const html = buildStudentListHtml(all, {
    institution: (bridge && bridge.getProfile && (bridge.getProfile() || {}).institution) || '', // = getInstitutionName() دون استيراد institutionStore (يجرّ دورة: institutionLogic ← studentsLogic ← studentList)
    directorate: dirEl ? dirEl.textContent.trim() : '',
    date: new Date().toLocaleDateString('ar-MA'),
    logoHtml: printLogo(70),
  });
  const win = w.open('', '_blank', 'width=800,height=900');
  if (!win) { alert('⚠️ اسمح بالنوافذ المنبثقة لطباعة اللائحة.'); return; }
  win.document.write(html.replace('</body>', '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body>'));
  win.document.close();
}

export const StudentList = { normalizeDob, isIsoDob, formatDob, splitName, groupByClass, buildStudentListHtml };
if (typeof window !== 'undefined') { window.StudentList = StudentList; window.printStudentList = printStudentList; }
