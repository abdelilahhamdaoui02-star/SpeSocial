// اختبار الخطوة 44 (استيراد وتصدير لائحة التلاميذ + قراءة تاريخ الازدياد):
// نشغّل الدالتين القديمتين المجمَّدتين (fixtures/studentimport.step43.js) في vm بمكتبة XLSX مزيَّفة ونقارنهما بالوحدتين الجديدتين.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { normalizeDob, formatDob, splitName, isIsoDob } from '../src/students/studentList.js';
import { cleanClassValue } from '../src/students/cleanClass.js';
import {
  parseSheet, parseWorkbook, mergeResults, readFiles, commitImport, dobStats, dobLine, detectColumns, guessDobColumn, MSG,
} from '../src/students/studentImport.js';
import { buildExportSheets, exportStudentList, mergeForExport, sheetName, fileNameFor, HEAD_ALL, HEAD_CLASS } from '../src/students/studentExport.js';
import { fillDob } from '../src/autocomplete/studentAutocomplete.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/studentimport.step43.js', import.meta.url), 'utf8');
const clone = (x) => JSON.parse(JSON.stringify(x));

// ── مولّد عشوائي بذرة ثابتة ──
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const NAMES = ['أحمد', 'فاطمة', 'يوسف', 'خديجة', 'عمر', 'سلمى', 'إدريس', 'مريم', 'ياسين', 'هاجر'];
const FAMS = ['العلوي', 'بنعمر', 'الإدريسي', 'قاسمي', 'بلهيداني', 'الحسني', 'التازي', 'الفاسي'];
const pad = (n) => String(n).padStart(2, '0');

function genSheet(r, { withPlace = false } = {}) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  const rows = [];
  const withMeta = r() < 0.6;
  const cls = pick(['1BACSEF-2', '2BACSM-1', '3APIC 4']);
  if (withMeta) { rows.push(['المؤسسة : ثانوية الأمل']); rows.push(['القسم: ' + cls]); }
  const useClassCol = r() < 0.5;
  const useDob = r() < 0.8;
  const dobAsSerial = r() < 0.5;
  const cols = ['num', 'massar', 'family', 'given', 'gender'];
  if (useClassCol) cols.push('class');
  if (useDob) cols.push('dob');
  if (withPlace) cols.push('place');
  const [first, ...rest] = cols; // «الرقم» يبقى أولاً
  rest.sort(() => r() - 0.5);
  const order = [first, ...rest];
  const HEAD = { num: 'ر.ت', massar: 'الرمز', family: 'النسب', given: 'الإسم', gender: 'الجنس', class: 'القسم', dob: 'تاريخ الازدياد', place: 'مكان الازدياد' };
  rows.push(order.map((c) => HEAD[c]));
  const n = 4 + Math.floor(r() * 8);
  for (let i = 0; i < n; i++) {
    const y = 2005 + Math.floor(r() * 8), m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28);
    const cell = {
      num: i + 1, massar: 'G' + (130000000 + Math.floor(r() * 9999999)), family: pick(FAMS), given: pick(NAMES) + ' ' + pick(NAMES),
      gender: r() < 0.5 ? 'ذكر' : 'أنثى', class: cls,
      dob: dobAsSerial ? Math.round(Date.UTC(y, m - 1, d) / 86400000) + 25569 : `${pad(d)}/${pad(m)}/${y}`,
      place: pick(['الدار البيضاء', 'سطات', 'برشيد']),
    };
    rows.push(order.map((c) => cell[c]));
  }
  return rows;
}

// ── XLSX مزيَّفة: الملف = فهرس في مصفوفة المصنفات ──
const makeFiles = (wbs) => wbs.map((wb, i) => ({ name: `f${i}.xlsx`, idx: i, arrayBuffer: async () => new Uint8Array([i]).buffer }));
const fakeXlsx = (wbs) => ({
  read: (data) => wbs[data[0]],
  utils: { sheet_to_json: (ws) => ws.rows },
});
const mkWb = (sheets) => ({ SheetNames: sheets.map((s) => s[0]), Sheets: Object.fromEntries(sheets.map(([n, rows]) => [n, { rows }])) });

// ── تشغيل الاستيراد القديم ──
async function runLegacyImport(wbs, { instName = '' } = {}) {
  const msg = { style: {}, textContent: '' };
  const rec = { saved: [], store: {}, profile: {}, confirms: [], cleared: 0, applied: 0 };
  const files = makeFiles(wbs);
  class FR { readAsArrayBuffer(f) { ctx.__cur = f; setTimeout(() => this.onload({ target: { result: new Uint8Array([f.idx]).buffer } }), 0); } }
  const xl = { read: (data) => wbs[data[0]], utils: { sheet_to_json: (ws) => ws.rows } };
  const ctx = vm.createContext({
    document: { getElementById: (id) => (id === 'importStudentMsg' ? msg : null) },
    FileReader: FR, XLSX: xl, Uint8Array, Promise, Set, Math, String, Array, Object, Number, JSON,
    confirm: (t) => { rec.confirms.push(t); return true; },
    localStorage: { setItem: (k, v) => { rec.store[k] = String(v); } },
    currentUser: 'u1', userProfile: rec.profile, storageSet: () => Promise.resolve(),
    StudentDb: { snapshotJson: () => '[{"old":1}]', count: () => 1, clear: () => { rec.cleared++; } },
    saveCustomStudents: (l) => { rec.saved.push(clone(l)); },
    getInstitutionName: () => instName, applyInstitutionEverywhere: () => { rec.applied++; },
    updateAllLevelSelects: () => {}, getImportedClasses: () => ['1A', '2B'], cleanClassValue,
    StudentList: { normalizeDob }, window: { dispatchEvent: () => {} }, Event: class { constructor(t) { this.type = t; } },
  });
  vm.runInContext(legacySrc + '\n;this.imp = importStudentListFromFile;', ctx);
  ctx.imp({ files, value: 'x' });
  for (let i = 0; i < 200 && !msg.textContent.startsWith('✅ تم استيراد') && !msg.textContent.startsWith('❌'); i++) await new Promise((r) => setTimeout(r, 2));
  return { msg: msg.textContent, rec };
}

// ── تشغيل الاستيراد الجديد ──
async function runNewImport(wbs, { instName = '', failBackup = false } = {}) {
  const rec = { saved: [], store: {}, profile: null, cleared: 0, applied: 0 };
  const files = makeFiles(wbs);
  const results = await readFiles(files, fakeXlsx(wbs));
  const { unique, info, totalSheets } = mergeResults(results);
  const msg = commitImport(unique, results, files.length, {
    storage: { setItem: (k, v) => { if (failBackup) throw new Error('quota'); rec.store[k] = String(v); } },
    user: 'u1',
    StudentDb: { snapshotJson: () => '[{"old":1}]', count: () => 1, clear: () => { rec.cleared++; } },
    saveStudents: (l) => { rec.saved.push(clone(l)); },
    saveProfile: (p, o) => { rec.profile = { p, o }; return Promise.resolve(); },
    getInstitutionName: () => instName, applyInstitutionEverywhere: () => { rec.applied++; },
    updateAllLevelSelects: () => {}, getImportedClasses: () => ['1A', '2B'], now: () => 'NOW',
  });
  return { msg, rec, unique, info, totalSheets, results };
}

for (let seed = 1; seed <= 40; seed++) {
  test(`مطابقة للقديم: استيراد لائحة التلاميذ seed=${seed}`, async () => {
    const r = rng(seed);
    const nFiles = 1 + Math.floor(r() * 2);
    const wbs = Array.from({ length: nFiles }, () => mkWb(Array.from({ length: 1 + Math.floor(r() * 3) }, (_, k) => [`ورقة${k + 1}`, genSheet(r)])));
    const instName = seed % 2 ? '' : 'ثانوية قائمة';
    const L = await runLegacyImport(wbs, { instName });
    const N = await runNewImport(wbs, { instName });

    // 1) القائمة المحفوظة هي نفسها (آخر ما كتبه القديم)
    assert.deepEqual(N.rec.saved[N.rec.saved.length - 1], L.rec.saved[L.rec.saved.length - 1]);
    // 2) نص التأكيد
    const dl = dobLine(dobStats(N.unique, N.results));
    assert.equal(L.rec.confirms[0], N.unique.length ? L.rec.confirms[0] : '');
    // 3) رسالة النتيجة: نفسها مع إضافة سطر الازدياد فقط
    assert.equal(N.msg.slice(0, N.msg.length - dl.length), L.msg);
    // 4) النسخة الاحتياطية والمؤسسة
    assert.equal(N.rec.store['app:customStudents_backup:u1'], L.rec.store['app:customStudents_backup:u1']);
    assert.equal(N.rec.store['app:customStudents_backup:u1:count'], L.rec.store['app:customStudents_backup:u1:count']);
    assert.equal(N.rec.profile ? N.rec.profile.p.institution : undefined, L.rec.profile.institution);
    assert.equal(N.rec.applied, L.rec.applied);
    assert.ok(N.unique.length > 0);
  });
}

test('تأكيد الاستيراد: يطابق نص القديم ويضيف سطر الازدياد قبل السؤال', async () => {
  const r = rng(7);
  const wbs = [mkWb([['A', genSheet(r)], ['B', genSheet(r)]]), mkWb([['C', genSheet(r)]])];
  const L = await runLegacyImport(wbs);
  const N = await runNewImport(wbs);
  const { confirmText } = await import('../src/students/studentImport.js');
  const plain = confirmText(N.unique, 2, N.totalSheets, N.info);
  assert.equal(plain, L.rec.confirms[0]);
  const withDob = confirmText(N.unique, 2, N.totalSheets, N.info, dobLine(dobStats(N.unique, N.results)));
  assert.ok(withDob.includes('🎂 تاريخ الازدياد') && withDob.endsWith('(سيتم استبدال قائمة التلاميذ الحالية بالقائمة الجديدة)'));
});

// ───────── تاريخ الازدياد ─────────
test('قراءة الازدياد: الرقم التسلسلي ونص dd/mm/yyyy يعطيان ISO ويُملأ في الطلاب', () => {
  const rows = [
    ['ر.ت', 'النسب', 'الإسم', 'تاريخ الازدياد'],
    [1, 'العلوي', 'أحمد', 39522], // 15/03/2008
    [2, 'بنعمر', 'فاطمة', '05/01/2010'],
    [3, 'قاسمي', 'يوسف', '٢٠/٠٤/٢٠٠٩'],
    [4, 'الفاسي', 'سلمى', '1er août 2009'],
  ];
  const r = parseSheet(rows, 'ورقة1', 'f.xlsx');
  assert.deepEqual(r.students.map((s) => s.dob), ['2008-03-15', '2010-01-05', '2009-04-20', '2009-08-01']);
  assert.equal(r.dobColumn, 'header');
});

test('«مكان الازدياد» لا يحلّ محل «تاريخ الازدياد» (إصلاح خطأ القديم)', async () => {
  const r = rng(11);
  const sheet = genSheet(r, { withPlace: true });
  // في بعض البذور يظهر عمود التاريخ بعد عمود المكان وفي بعضها قبله؛ نجرّب كلا الترتيبين
  const hdrIdx = sheet.findIndex((row) => row.includes('تاريخ الازدياد'));
  for (const swap of [false, true]) {
    const s2 = sheet.map((row) => row.slice());
    if (swap) {
      const a = s2[hdrIdx].indexOf('تاريخ الازدياد'), b = s2[hdrIdx].indexOf('مكان الازدياد');
      s2.forEach((row, i) => { if (i >= hdrIdx) { const t = row[a]; row[a] = row[b]; row[b] = t; } });
    }
    const res = parseSheet(s2, 'ورقة', 'f');
    assert.ok(res.students.length > 0);
    res.students.forEach((s) => assert.ok(isIsoDob(s.dob), `dob=${s.dob}`));
  }
  assert.equal(detectColumns([['الرقم', 'النسب', 'الإسم', 'مكان الازدياد']]).dobCol, -1);
  assert.equal(detectColumns([['النسب', 'الإسم', 'مكان الازدياد', 'تاريخ الازدياد']]).dobCol, 3);
});

test('عمود تواريخ بلا رأس يُكتشف من قيمه، ولا يُخلط مع الأعمدة الأخرى', () => {
  const rows = [
    ['النسب', 'الإسم', 'الرمز', 'عمود'],
    ['العلوي', 'أحمد', 'G1', '15/03/2008'],
    ['بنعمر', 'فاطمة', 'G2', '01/12/2009'],
    ['قاسمي', 'يوسف', 'G3', 39800],
    ['الفاسي', 'سلمى', 'G4', '2010-02-02'],
  ];
  assert.equal(guessDobColumn(rows, 0, [1, 0, 2]), 3);
  const r = parseSheet(rows, 'x', 'f');
  assert.equal(r.dobColumn, 'guessed');
  assert.deepEqual(r.students.map((s) => s.dob).slice(0, 2), ['2008-03-15', '2009-12-01']);
  // أرقام مسار أو أرقام عادية ليست تواريخ
  const noDates = [['النسب', 'الإسم', 'الرمز', 'عمود'], ['أ', 'ب', 'G1', 5], ['ج', 'د', 'G2', 7], ['هـ', 'و', 'G3', 9]];
  assert.equal(parseSheet(noDates, 'x', 'f').dobColumn, 'none');
});

test('تاريخ لا يُفهم لا يُخزَّن (فيبقى حقل الازدياد فارغاً) ويُبلَّغ به المستخدم', () => {
  const rows = [['النسب', 'الإسم', 'تاريخ الازدياد'], ['أ', 'ب', '15/03/2008'], ['ج', 'د', 'غير معروف'], ['هـ', 'و', '31/02/2008'], ['ز', 'ح', '']];
  const wb = parseWorkbook([{ name: 's', rows }], 'f.xlsx');
  assert.deepEqual(wb.students.map((s) => s.dob), ['2008-03-15', '', '', '']);
  assert.deepEqual(wb.dobBad, ['غير معروف', '31/02/2008']);
  const { unique } = mergeResults([wb]);
  const st = dobStats(unique, [wb]);
  assert.equal(st.withDob, 1);
  const line = dobLine(st);
  assert.ok(line.includes('قُرئ لـ 1 من 4') && line.includes('غير معروف'));
});

test('ملف بلا أي عمود ازدياد: تحذير صريح بدل الصمت', () => {
  const rows = [['النسب', 'الإسم'], ['أ', 'ب'], ['ج', 'د']];
  const wb = parseWorkbook([{ name: 's', rows }], 'f.xlsx');
  const { unique } = mergeResults([wb]);
  assert.ok(dobLine(dobStats(unique, [wb])).includes('لم يُعثر على عمود «تاريخ الازدياد»'));
});

test('normalizeDob: يطابق القديم فيما كان يفهمه ويفهم أكثر منه', () => {
  // القديم (حرفياً): ثلاث صيغ + تسلسلي + Date
  const old = (v) => {
    if (v == null || v === '') return '';
    if (v instanceof Date && !isNaN(v)) return `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}`;
    if (typeof v === 'number' && v > 1000 && v < 80000) { const d = new Date(Math.round((v - 25569) * 86400000)); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; }
    const s = String(v).trim();
    let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/); if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); if (m) return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
    return s;
  };
  const r = rng(99);
  for (let i = 0; i < 300; i++) {
    const y = 2000 + Math.floor(r() * 15), m = 1 + Math.floor(r() * 12), d = 1 + Math.floor(r() * 28);
    for (const v of [`${d}/${m}/${y}`, `${pad(d)}-${pad(m)}-${y}`, `${y}-${pad(m)}-${pad(d)}`, `${y}.${m}.${d}`, Math.round(Date.UTC(y, m - 1, d) / 86400000) + 25569, new Date(y, m - 1, d)]) {
      assert.equal(normalizeDob(v), old(v), String(v));
    }
  }
  for (const v of ['', null, undefined, 'غير معروف', 'abc']) assert.equal(normalizeDob(v), old(v));
  // الإضافات
  assert.equal(normalizeDob('15/03/08'), '2008-03-15');
  assert.equal(normalizeDob('15 مارس 2008'), '2008-03-15');
  assert.equal(normalizeDob('5/13/2008'), '2008-05-13');
  assert.equal(normalizeDob('2008-03-15T00:00:00.000Z'), '2008-03-15');
  assert.equal(normalizeDob('31/02/2008'), '31/02/2008'); // يوم غير موجود: يُترك كما هو
  assert.equal(formatDob('٠٥/٠١/٢٠١٠'), '05/01/2010');
});

test('ملء تاريخ الازدياد في الحقل: ISO وصيغ قديمة ومسح عند غياب التاريخ وإطلاق الأحداث', () => {
  const mk = (value = '') => { const el = { value, events: [], dispatchEvent(e) { this.events.push(e.type); return true; } }; return el; };
  let el = mk();
  fillDob(el, '2008-03-15'); assert.equal(el.value, '2008-03-15'); assert.deepEqual(el.events, ['input', 'change']);
  el = mk(); fillDob(el, '15/03/2008'); assert.equal(el.value, '2008-03-15'); // قائمة قديمة بصيغة نصية
  el = mk('2007-01-01'); fillDob(el, ''); assert.equal(el.value, ''); // لا يبقى تاريخ التلميذ السابق
  el = mk('2007-01-01'); fillDob(el, 'غير معروف'); assert.equal(el.value, '');
  el = mk('2008-03-15'); fillDob(el, '2008-03-15'); assert.deepEqual(el.events, []); // لا ضجيج إن لم يتغير
  assert.doesNotThrow(() => fillDob(null, '2008-03-15'));
});

// ───────── التصدير ─────────
function runLegacyExport(custom, base = []) {
  const rec = { sheets: [], file: '', alerts: [] };
  const ctx = vm.createContext({
    STUDENTS: base, alert: (m) => rec.alerts.push(m), getCustomStudents: () => custom,
    StudentList: { splitName, formatDob }, Date, Object, String, RegExp,
    XLSX: {
      utils: { book_new: () => ({}), aoa_to_sheet: (rows) => ({ rows }), book_append_sheet: (wb, ws, name) => rec.sheets.push({ name, rows: ws.rows, cols: ws['!cols'] }) },
      writeFile: (wb, name) => { rec.file = name; },
    },
  });
  vm.runInContext(legacySrc + '\n;this.exp = exportStudentListExcel;', ctx);
  ctx.exp();
  return rec;
}
function runNewExport(custom, base = []) {
  const rec = { sheets: [], file: '' };
  const XLSX = {
    utils: { book_new: () => ({}), aoa_to_sheet: (rows) => ({ rows }), book_append_sheet: (wb, ws, name) => rec.sheets.push({ name, rows: ws.rows, cols: ws['!cols'] }) },
    writeFile: (wb, name) => { rec.file = name; },
  };
  const res = exportStudentList(mergeForExport(base, custom), XLSX);
  return { rec, res };
}

for (let seed = 1; seed <= 20; seed++) {
  test(`مطابقة للقديم: تصدير لائحة التلاميذ إلى Excel seed=${seed}`, () => {
    const r = rng(seed * 13);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const classes = ['1BAC-2', '1BAC-10', '2BAC/1', 'غير', '', undefined];
    const custom = Array.from({ length: 5 + Math.floor(r() * 12) }, (_, i) => ({
      name: pick(FAMS) + ' ' + pick(NAMES) + i, family: r() < 0.7 ? pick(FAMS) : '', given: pick(NAMES), class: pick(classes),
      gender: pick(['ذكر', 'أنثى', '']), massar: r() < 0.8 ? 'G' + i : '', dob: pick(['2008-03-15', '', '15/03/2009', undefined]),
    }));
    const base = seed % 3 === 0 ? [{ name: 'أساسي واحد', class: '1BAC-2', gender: 'ذكر' }] : [];
    const L = runLegacyExport(custom, base);
    const N = runNewExport(custom, base);
    assert.deepEqual(clone(N.rec.sheets), clone(L.sheets));
    assert.equal(N.rec.file, L.file);
    assert.equal(N.res.ok, true);
  });
}

test('تصدير: القائمة الفارغة وغياب المكتبة، وأسماء الأوراق الفريدة', () => {
  assert.deepEqual(exportStudentList([], {}), { ok: false, reason: 'empty' });
  assert.deepEqual(exportStudentList([{ name: 'أ ب' }], null), { ok: false, reason: 'no-xlsx' });
  const used = new Set();
  const a = sheetName('1BAC-2:' + 'x'.repeat(40), used), b = sheetName('1BAC-2:' + 'x'.repeat(41), used);
  assert.notEqual(a.toLowerCase(), b.toLowerCase());
  assert.ok(a.length <= 31 && b.length <= 31 && !/[:\\/?*[\]]/.test(a + b));
  // قسمان بالاسم نفسه بعد التقصير لا يُسقطان XLSX
  const sheets = buildExportSheets([{ name: 'ا ب', class: 'ق'.repeat(35) + '1' }, { name: 'ج د', class: 'ق'.repeat(35) + '2' }]);
  assert.equal(new Set(sheets.classes.map((c) => c.name.toLowerCase())).size, 2);
  assert.deepEqual(sheets.all.rows[0], HEAD_ALL);
  assert.deepEqual(sheets.classes[0].rows[0], HEAD_CLASS);
  assert.ok(fileNameFor(new Date(2026, 9, 28)).startsWith('قائمة_التلاميذ_') && fileNameFor().endsWith('.xlsx'));
});

test('الدورة الكاملة: ما يُصدَّر يُستورد من جديد بالتواريخ نفسها', async () => {
  const students = [
    { name: 'العلوي أحمد', family: 'العلوي', given: 'أحمد', class: '1BAC-2', gender: 'ذكر', massar: 'G1', dob: '2008-03-15' },
    { name: 'بنعمر فاطمة', family: 'بنعمر', given: 'فاطمة', class: '1BAC-2', gender: 'أنثى', massar: 'G2', dob: '2009-12-01' },
  ];
  const sheets = buildExportSheets(students);
  const wb = mkWb([[sheets.all.name, sheets.all.rows]]);
  const back = await readFiles(makeFiles([wb]), fakeXlsx([wb]));
  const { unique } = mergeResults(back);
  // التصدير يكتب dd/mm/yyyy كنص؛ الاستيراد يعيدها إلى ISO
  assert.deepEqual(unique.map((s) => [s.name, s.dob, s.massar, s.class]), students.map((s) => [s.name, s.dob, s.massar, s.class]));
});

test('الاستيراد: فشل كتابة النسخة الاحتياطية لا يمنع الاستيراد، وغياب المؤسسة يُنبَّه إليه', async () => {
  const r = rng(5);
  const wb = mkWb([['ورقة1', genSheet(r).filter((row) => !String(row[0]).startsWith('المؤسسة'))]]);
  const N = await runNewImport([wb], { instName: '', failBackup: true });
  assert.equal(N.rec.saved.length, 1);
  assert.equal(N.rec.cleared, 1);
  assert.ok(N.msg.includes(MSG.NO_INSTITUTION.trim()));
});

test('الاستيراد: كتابة واحدة للقائمة بعد المسح (لا كتابة وسيطة فارغة كالقديم)', async () => {
  const r = rng(21);
  const wb = mkWb([['ورقة1', genSheet(r)]]);
  const N = await runNewImport([wb]);
  assert.equal(N.rec.saved.length, 1);
  assert.ok(N.rec.saved[0].length > 0);
  const L = await runLegacyImport([wb]);
  assert.equal(L.rec.saved.length, 2); assert.deepEqual(L.rec.saved[0], []);
});

test('الاستيراد: لا أسماء صالحة → لا حفظ', async () => {
  const wb = mkWb([['ورقة', [['x'], ['y']]]]);
  const files = makeFiles([wb]);
  const results = await readFiles(files, fakeXlsx([wb]));
  assert.equal(mergeResults(results).unique.length, 0);
});

test('StudentsSection: لا استدعاء للدالتين القديمتين وتبقى المعرّفات', () => {
  const src = fs.readFileSync(new URL('../src/settings/StudentsSection.jsx', import.meta.url), 'utf8');
  assert.ok(!/callLegacy|window\.(importStudentListFromFile|exportStudentListExcel)/.test(src));
  for (const id of ['importStudentFile', 'importStudentMsg']) assert.ok(src.includes(`id="${id}"`), id);
  const s10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
  assert.ok(!/function\s+(importStudentListFromFile|exportStudentListExcel)\b/.test(s10));
});
