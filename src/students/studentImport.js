// استيراد لائحة التلاميذ من Excel/CSV — وحدة ES منقولة من importStudentListFromFile في script-10.js (الخطوة 44).
// المنطق نقيّ بلا DOM ولا React: يستقبل صفوف الأوراق (ناتج sheet_to_json بـ header:1) ويُرجِع التلاميذ،
// وقراءة الملفات (XLSX) والتأكيد والحفظ تتولاها commitImport / readFiles في الأسفل (بحقن البيئة لتسهيل الاختبار).
// عن القديم: نفس اكتشاف الرأس والأعمدة والقسم والمؤسسة، مع إصلاحات تخص «تاريخ الازدياد»:
//   1) عمود «مكان الازدياد» لا يُعتبر تاريخاً (كان آخر عمود يحوي «ازدياد» هو الفائز فيُخزَّن اسم المدينة)،
//   2) تُفهم صيغ أكثر (الأرقام العربية، سنة من رقمين، أسماء الأشهر…) ولا يُخزَّن إلا تاريخ صالح،
//   3) إن لم يوجد رأس لعمود الازدياد يُكتشف العمود من قيمه، 4) يُبلَّغ المستخدم بعدد من قُرئ تاريخ ازدياده.
import { normalizeDob, isIsoDob } from './studentList.js';
import { cleanClassValue } from './cleanClass.js';
import { backupKey } from '../settings/studentsLogic.js';

const str = (c) => String(c == null ? '' : c).trim();

// ── اكتشاف رأس الجدول والأعمدة ──
const PLACE = (h) => h.includes('مكان') || /lieu|place|ville|مدينة/i.test(h);
const DOB_KEYS = (h, lh) => h.includes('الازدياد') || h.includes('الإزدياد') || h.includes('ازدياد') || h.includes('إزدياد')
  || h.includes('ميلاد') || lh.includes('naissance') || lh.includes('birth') || lh.includes('dob') || lh.includes('ddn');
const DATE_WORD = (h, lh) => h.includes('تاريخ') || h.includes('ت.') || lh.includes('date');

// من بين أعمدة الازدياد: نتجاهل «المكان»، ونفضّل ما فيه «تاريخ/date»، وإلا فالأخير كما في القديم
function pickDobCol(cands) {
  const ok = cands.filter((c) => !c.place);
  if (!ok.length) return -1;
  const dated = ok.find((c) => c.date);
  return (dated || ok[ok.length - 1]).idx;
}

// يُرجِع { headerRowIdx, nameCol, familyCol, genderCol, massarCol, numCol, classCol, dobCol }
export function detectColumns(rows) {
  let headerRowIdx = -1;
  let nameCol = -1, familyCol = -1, genderCol = -1, massarCol = -1, numCol = -1, classCol = -1, dobCol = -1;

  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const rowStr = rows[i].map((c) => str(c));
    // نبحث عن صف يحتوي على كلمات مثل "الإسم" أو "النسب"
    const hasName = rowStr.some((h) => h.includes('الإسم') || h.includes('الاسم') || h.includes('nom') || h.includes('name') || h.includes('إسم'));
    const hasFam = rowStr.some((h) => h.includes('النسب') || h.includes('نسب') || h.includes('prénom') || h.includes('prenom'));
    if (hasName || hasFam) {
      headerRowIdx = i;
      const dobCands = [];
      rowStr.forEach((h, idx) => {
        const lh = h.toLowerCase();
        if (h.includes('النسب') || h.includes('نسب') || lh.includes('prénom') || lh.includes('prenom')) familyCol = idx;
        if (h.includes('الإسم') || h.includes('الاسم') || h.includes('إسم') || lh.includes('name')) nameCol = idx;
        if (h.includes('الجنس') || h.includes('النوع') || lh.includes('genre') || lh.includes('gender') || lh.includes('sex')) genderCol = idx;
        if (h.includes('الرمز') || h.includes('مسار') || lh.includes('massar') || lh.includes('code')) massarCol = idx;
        if (h.includes('ر.ت') || h === 'رقم' || h === 'رقم التلميذ') numCol = idx;
        if (h.includes('القسم') || h.includes('الفوج') || lh.includes('classe')) classCol = idx;
        if (DOB_KEYS(h, lh)) dobCands.push({ idx, place: PLACE(h) || PLACE(lh), date: DATE_WORD(h, lh) });
      });
      dobCol = pickDobCol(dobCands);
      break;
    }
  }

  // إذا لم يوجد رأس واضح — استخدام الطريقة القديمة (الصف الأول كرأس)
  if (headerRowIdx === -1) {
    const header = rows[0].map((h) => str(h));
    const dobCands = [];
    header.forEach((h, i) => {
      const lh = h.toLowerCase();
      if (lh.includes('اسم') || lh.includes('nom') || lh.includes('name')) nameCol = i;
      if (lh.includes('قسم') || lh.includes('فوج') || lh.includes('classe') || lh.includes('class') || lh.includes('niveau')) classCol = i;
      if (lh.includes('جنس') || lh.includes('genre') || lh.includes('gender') || lh.includes('sex')) genderCol = i;
      if (lh.includes('مسار') || lh.includes('massar') || lh.includes('رقم')) massarCol = i;
      if (DOB_KEYS(lh, lh)) dobCands.push({ idx: i, place: PLACE(lh), date: DATE_WORD(lh, lh) });
    });
    dobCol = pickDobCol(dobCands);
    if (nameCol === -1) nameCol = 0;
    headerRowIdx = 0;
  }
  return { headerRowIdx, nameCol, familyCol, genderCol, massarCol, numCol, classCol, dobCol };
}

// قيمة تشبه اسم قسم (مثل 1BACSEF-2 أو 3APIC 4)
export const looksLikeClass = (v) => {
  v = str(v);
  if (!v || v.length > 40) return false;
  return /^\d?\s*[A-Za-z]{2,}[\s\-_/.]*\d{1,2}$/.test(v);
};

// عمود لا رأس له قيمه تواريخ ازدياد معقولة (≥ 70% من القيم المعبّأة، ثلاث على الأقل، بسنوات 1985–2022)
export function guessDobColumn(rows, headerRowIdx, skipCols = []) {
  const sample = rows.slice(headerRowIdx + 1, headerRowIdx + 41);
  const width = Math.max(0, ...sample.map((r) => r.length));
  for (let col = 0; col < width; col++) {
    if (skipCols.includes(col)) continue;
    const vals = sample.map((r) => r[col]).filter((v) => str(v) !== '');
    if (vals.length < 3) continue;
    const good = vals.filter((v) => { const iso = normalizeDob(v); return isIsoDob(iso) && +iso.slice(0, 4) >= 1985 && +iso.slice(0, 4) <= 2022; });
    if (good.length >= 0.7 * vals.length) return col;
  }
  return -1;
}

// ── ورقة واحدة ──
// يُرجِع { students, count, school, dobColumn: 'header'|'guessed'|'none', dobBad: [القيم التي لم تُفهم] }
export function parseSheet(rows, sheetName, fileName) {
  const out = { students: [], count: 0, school: '', dobColumn: 'none', dobBad: [] };
  if (!rows || rows.length < 2) return out;

  const cols = detectColumns(rows);
  const { headerRowIdx, nameCol, familyCol, genderCol, massarCol } = cols;
  let { classCol, dobCol } = cols;
  out.dobColumn = dobCol !== -1 ? 'header' : 'none';

  // ── قراءة القسم واسم المؤسسة من أعلى الورقة (قبل رأس الجدول) ──
  const metaFind = (keys) => {
    for (let r = 0; r < headerRowIdx; r++) {
      const cells = (rows[r] || []).map((c) => str(c));
      for (let c = 0; c < cells.length; c++) {
        const txt = cells[c], low = txt.toLowerCase();
        if (!txt || !keys.some((k) => low.includes(k))) continue;
        const m = txt.split(/[:：]/);
        if (m.length > 1 && m.slice(1).join(':').trim()) return m.slice(1).join(':').trim();
        for (let d = 1; d < cells.length; d++) {
          const cand = cells[c + d] || cells[c - d] || '';
          if (cand && !keys.some((k) => cand.toLowerCase().includes(k))) return cand;
        }
      }
    }
    return '';
  };
  const metaClass = cleanClassValue(metaFind(['القسم', 'الفوج', 'classe']));
  const metaSchool = metaFind(['المؤسسة', 'المؤسّسة', 'مؤسسة', 'établissement', 'etablissement', 'école', 'ecole']);
  if (metaSchool) out.school = metaSchool;

  // ── كشف ذكي للقسم إذا لم يُعثر عليه بالعناوين ──
  let metaClass2 = metaClass;
  if (!metaClass2) {
    outer: for (let r = 0; r <= headerRowIdx && r < rows.length; r++) {
      for (const cell of (rows[r] || [])) {
        const c = String(cell == null ? '' : cell).split(/[:：]/).pop().trim();
        if (looksLikeClass(c)) { metaClass2 = c; break outer; }
      }
    }
  }
  if (classCol === -1) {
    const sample = rows.slice(headerRowIdx + 1, headerRowIdx + 41);
    const width = Math.max(0, ...sample.map((r) => r.length));
    for (let col = 0; col < width; col++) {
      const vals = sample.map((r) => str(r[col])).filter(Boolean);
      if (vals.length >= 3 && vals.filter(looksLikeClass).length >= 0.7 * vals.length) { classCol = col; break; }
    }
  }

  // ── عمود الازدياد بلا رأس: نكتشفه من القيم (دون الأعمدة المعروفة) ──
  if (dobCol === -1) {
    const g = guessDobColumn(rows, headerRowIdx, [nameCol, familyCol, genderCol, massarCol, classCol, cols.numCol]);
    if (g !== -1) { dobCol = g; out.dobColumn = 'guessed'; }
  }

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    // تخطي الصفوف الفارغة أو التي تبدأ بنص (ليست بيانات تلاميذ)
    const firstCell = String(row[0] || '').trim();
    if (!firstCell) continue;

    let fullName = '', famPart = '', givPart = '';
    if (familyCol !== -1 && nameCol !== -1) {
      // الشكل المغربي: النسب + الإسم
      const family = String(row[familyCol] || '').trim();
      const given = String(row[nameCol] || '').trim();
      if (family || given) { fullName = (family + ' ' + given).trim(); famPart = family; givPart = given; }
    } else if (nameCol !== -1) {
      fullName = String(row[nameCol] || '').trim();
    } else {
      // fallback: أول خلية غير فارغة
      for (const cell of row) {
        const v = String(cell || '').trim();
        if (v && v.length > 2 && isNaN(v)) { fullName = v; break; }
      }
    }

    if (!fullName || fullName.length < 2) continue;

    const gender = genderCol !== -1 ? String(row[genderCol] || '').trim() : '';
    const massar = massarCol !== -1 ? String(row[massarCol] || '').trim() : '';
    const rowClass = classCol !== -1 ? cleanClassValue(row[classCol]) : '';

    // تاريخ الازدياد: لا يُخزَّن إلا تاريخ صالح (YYYY-MM-DD) كي يُملأ في حقول <input type="date">
    let dob = '';
    if (dobCol !== -1 && str(row[dobCol]) !== '') {
      const iso = normalizeDob(row[dobCol]);
      if (isIsoDob(iso)) dob = iso; else if (out.dobBad.length < 5) out.dobBad.push(str(row[dobCol]));
    }
    out.students.push({
      name: fullName, fullName,
      family: famPart, given: givPart, dob,
      class: rowClass || metaClass2 || cleanClassValue(sheetName),
      gender, massar,
      _sheet: sheetName, _file: fileName,
    });
    out.count++;
  }
  return out;
}

// ── ملف كامل: sheets = [{ name, rows }] ──
export function parseWorkbook(sheets, fileName) {
  const students = [], sheetsInfo = [];
  let school = '', dobHeader = false, dobGuessed = false;
  const dobBad = [];
  sheets.forEach((sh) => {
    const r = parseSheet(sh.rows, sh.name, fileName);
    if (r.school && !school) school = r.school;
    if (r.dobColumn === 'header') dobHeader = true;
    if (r.dobColumn === 'guessed') dobGuessed = true;
    r.dobBad.forEach((v) => { if (dobBad.length < 5) dobBad.push(v); });
    students.push(...r.students);
    if (r.count > 0) sheetsInfo.push(`${sh.name}: ${r.count} تلميذ(ة)`);
  });
  return { students, sheetsInfo, fileName, sheets: sheets.length, school, dobHeader, dobGuessed, dobBad };
}

// ── دمج ملفات متعددة وحذف المكرَّر بالاسم ──
export function mergeResults(results) {
  const all = [], info = [];
  let totalSheets = 0;
  results.forEach((r) => {
    all.push(...r.students);
    info.push(`📄 ${r.fileName}: ${r.students.length} تلميذ(ة) من ${r.sheets} ورقة`);
    totalSheets += r.sheets;
  });
  const seen = new Set();
  const unique = all.filter((s) => { if (seen.has(s.name)) return false; seen.add(s.name); return true; });
  return { unique, info, totalSheets };
}

// ── إحصاء تاريخ الازدياد المقروء ──
export function dobStats(unique, results) {
  const withDob = unique.filter((s) => isIsoDob(s.dob)).length;
  const anyColumn = results.some((r) => r.dobHeader || r.dobGuessed);
  const bad = [];
  results.forEach((r) => r.dobBad.forEach((v) => { if (bad.length < 3) bad.push(v); }));
  return { total: unique.length, withDob, anyColumn, guessed: results.some((r) => r.dobGuessed && !r.dobHeader), bad };
}
export function dobLine(st) {
  if (!st.anyColumn) return '\n⚠️ لم يُعثر على عمود «تاريخ الازدياد» في الملف — لن تُملأ خانة الازدياد تلقائياً (يمكنك إضافته يدوياً).';
  let t = `\n🎂 تاريخ الازدياد: قُرئ لـ ${st.withDob} من ${st.total} تلميذ(ة)` + (st.guessed ? ' (اكتُشف العمود من قيمه)' : '');
  if (st.bad.length) t += `\n⚠️ تعذّرت قراءة بعض التواريخ، مثل: ${st.bad.join(' ، ')}`;
  return t;
}

// ── نصوص التأكيد والنتيجة (حرفياً كالقديم، مع سطر الازدياد) ──
export const MSG = {
  READING: '⏳ جاري قراءة الملفات...',
  NONE: '❌ لم يتم العثور على أسماء صالحة في أي ملف.',
  NO_XLSX: '⚠️ مكتبة Excel غير جاهزة بعد — أعد المحاولة بعد لحظات.',
  readError: (m) => '❌ خطأ في قراءة الملفات: ' + m,
  NO_INSTITUTION: '\n⚠️ لم يُعثر على اسم المؤسسة في الملف — أدخله في «الملف الشخصي» ليُملأ تلقائياً في البوابات.',
};
export function confirmText(unique, filesCount, totalSheets, info, dobText = '') {
  const filesLabel = filesCount > 1 ? `\n\n📁 الملفات المُعالجة:\n${info.join('\n')}` : '';
  return `✅ تم اكتشاف ${unique.length} تلميذ(ة) من ${filesCount} ملف (${totalSheets} ورقة).${filesLabel}${dobText}\n\nهل تريد استيرادهم؟\n(سيتم استبدال قائمة التلاميذ الحالية بالقائمة الجديدة)`;
}
export const doneText = (n, filesCount) => `✅ تم استيراد ${n} تلميذ(ة) من ${filesCount} ملف بنجاح!`;
export const schoolText = (name) => `\n🏫 اسم المؤسسة: ${name}`;
export function classesText(classes, unique) {
  let t = '';
  if (classes.length) t = `\n📚 الأقسام (${classes.length}): ` + classes.slice(0, 8).join('، ') + (classes.length > 8 ? ' …' : '');
  const noCls = unique.filter((s) => !cleanClassValue(s.class)).length;
  if (noCls) t += `\n⚠️ ${noCls} تلميذ(ة) بدون قسم — تحقق من وجود عمود أو سطر «القسم» في الملف.`;
  return t;
}

// ── قراءة الملفات بمكتبة XLSX (تُمرَّر لتسهيل الاختبار) ──
export async function readFiles(files, XLSX) {
  return Promise.all(files.map(async (file) => {
    const data = new Uint8Array(await file.arrayBuffer());
    const wb = XLSX.read(data, { type: 'array' });
    const sheets = wb.SheetNames.map((name) => ({ name, rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' }) }));
    return parseWorkbook(sheets, file.name);
  }));
}

// ── الحفظ بعد تأكيد المستخدم ──
// env: { storage, user, StudentDb, saveStudents(list), saveProfile(patch, opts), getInstitutionName(), applyInstitutionEverywhere(),
//        updateAllLevelSelects(), getImportedClasses(), now() }
// يُرجِع نص الرسالة النهائية. القائمة القديمة تُحفظ نسخةً احتياطية (تُستعاد من الإعدادات) ثم تُستبدل بالجديدة.
export function commitImport(unique, results, filesCount, env) {
  try {
    const bk = backupKey(env.user);
    env.storage.setItem(bk, env.StudentDb.snapshotJson());
    env.storage.setItem(bk + ':date', env.now());
    env.storage.setItem(bk + ':count', env.StudentDb.count());
  } catch { /* كما في القديم: فشل النسخة لا يمنع الاستيراد */ }

  env.StudentDb.clear();
  env.saveStudents(unique); // يكتب التخزين المحلي والسحابي ويحدّث الذاكرة والأقسام والعدادات

  // اسم المؤسسة يتغيّر تلقائياً حسب الملف المستورد
  const fileSchool = (results.find((r) => r.school) || {}).school || '';
  let schoolNote = '';
  try {
    if (fileSchool) {
      Promise.resolve(env.saveProfile({ institution: fileSchool }, { effects: false })).catch(() => {});
      schoolNote = schoolText(fileSchool);
    } else if (!env.getInstitutionName()) {
      schoolNote = MSG.NO_INSTITUTION;
    }
    env.applyInstitutionEverywhere();
  } catch { /* كما في القديم */ }

  // الأقسام: تتحدّث القوائم تلقائياً من اللائحة المستوردة
  let classNote = '';
  try {
    env.updateAllLevelSelects();
    classNote = classesText(env.getImportedClasses(), unique);
  } catch { /* كما في القديم */ }

  return doneText(unique.length, filesCount) + schoolNote + classNote + dobLine(dobStats(unique, results));
}
