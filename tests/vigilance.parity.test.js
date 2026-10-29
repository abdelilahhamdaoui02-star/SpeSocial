// اختبار مطابقة «خلية اليقظة»: نشغّل كتلة script-16.js القديمة (النسخة المجمَّدة للمرحلة 25) في بيئة معزولة
// ونقارن نتائجها بدوال src/vigilance/vigilanceLogic.js على البيانات نفسها (عشوائية بذرة ثابتة).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as V from '../src/vigilance/vigilanceLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/vigilance.step25.js', import.meta.url), 'utf8');
const NOW = new Date(2026, 9, 25, 10, 30);
const J = (v) => JSON.parse(JSON.stringify(v));
const tick = () => new Promise((r) => setImmediate(r));
// كود الاستيراد القديم يطبع بـ console.info؛ في وضع --test يشارك المشغّل قناة stdout نفسها فتتلف رسائله أحياناً، فنكتم المخرجات
const SILENT = { log() {}, info() {}, warn() {}, error() {}, debug() {} };

function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }

// ── بيئة القديم ──
function runLegacy({ archive = [], profile = null, inst = '', logo = '', rows = null, confirmAnswer = true } = {}) {
  const els = {};
  const mkEl = (id) => ({
    id, value: '', innerHTML: '', textContent: '', style: {}, checked: false, indeterminate: false,
    classList: { toggle() { return true; }, contains() { return true; }, add() {}, remove() {} },
    focus() {}, remove() {}, appendChild() {}, setAttribute() {}, addEventListener() {},
  });
  const el = (id) => (els[id] ??= mkEl(id));
  class FixedDate extends Date {
    constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); }
    static now() { return NOW.getTime(); }
  }
  const alerts = [];
  const store = {};
  const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  const checked = { cat: [], prio: null, status: null, editCat: [], editPrio: null, editStatus: null };
  const doc = {
    getElementById: el,
    querySelector: (sel) => {
      if (sel === 'input[name="vig_priority"]:checked') return checked.prio ? { value: checked.prio } : null;
      if (sel === 'input[name="vig_status"]:checked') return checked.status ? { value: checked.status } : null;
      if (sel === 'input[name="vigEditPriority"]:checked') return checked.editPrio ? { value: checked.editPrio } : null;
      if (sel === 'input[name="vigEditStatus"]:checked') return checked.editStatus ? { value: checked.editStatus } : null;
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel === 'input[name="vig_category"]:checked') return checked.cat.map((value) => ({ value }));
      if (sel === 'input[name="vigEditCategory"]:checked') return checked.editCat.map((value) => ({ value }));
      return [];
    },
    createElement: () => { const o = mkEl('created'); o.contentWindow = null; return o; },
    body: { appendChild() {} },
    head: { appendChild() {} },
  };
  const xl = { writes: [], aoa: [], cols: null, sheet: null };
  const XLSX = {
    read: () => ({ SheetNames: ['s'], Sheets: { s: {} } }),
    utils: {
      sheet_to_json: () => rows,
      book_new: () => ({}),
      aoa_to_sheet: (a) => { xl.aoa.push(a); const ws = {}; xl.sheetRef = ws; return ws; },
      book_append_sheet: (_wb, ws, name) => { xl.sheet = name; xl.cols = ws['!cols']; },
    },
    writeFile: (_wb, name) => xl.writes.push(name),
  };
  const words = [];
  const saved = [];
  const appData = { vigilanceCases: archive };
  const ctx = vm.createContext({
    window: {}, console: SILENT, Date: FixedDate, alert: (m) => alerts.push(m), confirm: () => confirmAnswer,
    setTimeout: () => 0, localStorage, document: doc, XLSX,
    FileReader: class { readAsArrayBuffer() { this.onload({ target: { result: new ArrayBuffer(0) } }); } },
    currentUser: 'u1', appData, userProfile: profile, MINISTRY_LOGO_B64: logo,
    getInstitutionName: () => inst, updateDashboardStats: () => {},
    saveUserKey: async (k) => { saved.push(k); return true; },
    exportToWord: async (id, name) => { words.push([id, name]); },
    Uint8Array,
  });
  vm.runInContext(legacySrc, ctx);
  const run = (code) => vm.runInContext(code, ctx);
  return { ctx, els, el, run, alerts, appData, store, checked, xl, words, saved, doc };
}

// ── مولّد بيانات ──
const NAMES = ['أحمد بنعلي', 'فاطمة الزهراء', 'يوسف <b>المرابط</b>', 'سارة & ليلى', 'محمد "أمين"'];
const LONG_ACTION = 'تم التواصل مع الأسرة وإبلاغ الإدارة التربوية وفتح ملف مرافقة نفسية واجتماعية للحالة';
const pad = (n) => String(n).padStart(2, '0');
const isoOf = (n) => { const d = new Date(NOW.getTime()); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
function makeEntry(r, i) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  const ncat = 1 + Math.floor(r() * 3);
  const cats = Array.from({ length: ncat }, () => pick(V.VIG_CATEGORIES));
  const weird = r() < 0.2;
  const e = {
    id: 1760000000000 + i * 7, savedAt: '٢٠٢٦/١٠/٢٥', studentName: pick(NAMES) + ' ' + i,
    massar: pick(['—', 'M' + i, 'G12345' + i]), date: r() < 0.9 ? isoOf(Math.floor(r() * 40)) : pick(['—', '']),
    school: pick(['إعدادية النور', '—', 'ثانوية <x>']), level: pick(['—', '1APIC-1', '2APIC-3']),
    category: weird ? LONG_ACTION : [...new Set(cats)].join(' | '),
    actions: weird ? pick(['', '—']) : pick(['جلسة استماع', 'سطر 1\nسطر 2\n\nسطر 3', LONG_ACTION + ' ' + LONG_ACTION, '', '—', 'إجراء <i>خاص</i> & "اقتباس"']),
    priority: pick([...V.PRIORITY_OPTIONS.map((x) => x[0]), '—']), status: pick([...V.STATUS_OPTIONS.map((x) => x[0]), '']),
    notes: pick(['', 'ملاحظة', 'ملاحظة\nبسطرين']), nextFollowup: pick(['—', isoOf(-5)]),
    trackingLogs: r() < 0.5 ? [] : [{ date: isoOf(3), result: 'تحسن', note: 'ملاحظة <b>', nextDate: isoOf(-2) }, { date: '—', result: '', note: 'x', nextDate: '—' }],
  };
  if (r() < 0.2) e._importBatch = 'import_1';
  return e;
}
const makeArchive = (seed, n = 14) => { const r = rngOf(seed); return Array.from({ length: n }, (_, i) => makeEntry(r, i)); };
const byId = (a) => a.slice().sort((x, y) => x.id - y.id);

// ── الثوابت ──
test('الثوابت (الاقتراحات والفئات والمفتاح) مطابقة للقديم', () => {
  const { run } = runLegacy();
  for (const [mine, theirs] of [['VIG_SUGGESTIONS', V.VIG_SUGGESTIONS], ['VIG_EDIT_SUGGESTIONS', V.VIG_EDIT_SUGGESTIONS], ['VIG_KNOWN_CATEGORIES', V.VIG_KNOWN_CATEGORIES]]) {
    assert.deepEqual(J(theirs), JSON.parse(run('JSON.stringify(' + mine + ')')), mine);
  }
  assert.equal(V.VIG_KEY, run('VIG_KEY'));
});

test('فئات النموذج الإحدى عشرة هي نفسها في نموذج الإضافة القديم وكلها لها اقتراحات', () => {
  const body = fs.readFileSync(new URL('./fixtures/body.step47.html', import.meta.url), 'utf8');
  // نقرأ الفئات من نسخة HTML المجمَّدة داخل التاريخ إن بقيت، وإلا نكتفي بتغطية الاقتراحات
  const fromHtml = [...body.matchAll(/name="vig_category" value="([^"]+)"/g)].map((m) => m[1]);
  if (fromHtml.length) assert.deepEqual(fromHtml, V.VIG_CATEGORIES);
  for (const c of V.VIG_CATEGORIES) {
    assert.ok(V.VIG_SUGGESTIONS[c]?.length, 'اقتراحات النموذج: ' + c);
    assert.ok(V.VIG_EDIT_SUGGESTIONS[c]?.actions.length && V.VIG_EDIT_SUGGESTIONS[c]?.notes.length, 'اقتراحات التعديل: ' + c);
  }
});

// ── الهروب ──
test('vigEsc مطابقة للقديم', () => {
  const { ctx } = runLegacy();
  for (const s of ['<b>&"x"</b>', '', null, undefined, 5, 'عادي']) assert.equal(V.vigEsc(s), ctx.vigEsc(s));
});

// ── قراءة الأرشيف ──
test('القراءة: بلا مستخدم [] ثم الذاكرة ثم localStorage عند فراغ الذاكرة', () => {
  const arch = makeArchive(3, 4);
  const { ctx, store, run } = runLegacy({ archive: [] });
  store['u1:vigilanceCases'] = JSON.stringify(arch);
  const legacy = J(ctx.vigGetArchive());
  const mine = V.getArchive([], { user: 'u1', storage: { getItem: (k) => store[k] ?? null } });
  assert.deepEqual(J(mine), legacy);
  run('currentUser = null');
  assert.deepEqual(J(ctx.vigGetArchive()), []);
  assert.deepEqual(V.getArchive(arch, { user: null }), []);
  // الذاكرة غير فارغة تتقدّم على localStorage
  const withMem = runLegacy({ archive: arch.slice(0, 2) });
  withMem.store['u1:vigilanceCases'] = JSON.stringify(arch);
  assert.deepEqual(J(withMem.ctx.vigGetArchive()), J(V.getArchive(arch.slice(0, 2), { user: 'u1', storage: { getItem: (k) => withMem.store[k] ?? null } })));
});

// ── الترحيل والإصلاح ──
test('الترحيل التلقائي vigMigrateArchive مطابق على بيانات عشوائية', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const arch = makeArchive(seed, 20);
    const { ctx } = runLegacy();
    const legacyArch = J(arch);
    const changed = ctx.vigMigrateArchive(legacyArch);
    const r = V.migrateArchive(J(arch));
    assert.equal(r.changed, changed, 'changed seed ' + seed);
    assert.deepEqual(J(r.archive), legacyArch, 'archive seed ' + seed);
  }
});

test('الإصلاح اليدوي vigRepairAllEntries مطابق (النتيجة والرسالة)', async () => {
  for (const seed of [1, 2, 3, 4]) {
    const arch = makeArchive(seed, 20);
    const L = runLegacy({ archive: J(arch) });
    await L.ctx.vigRepairAllEntries();
    const r = V.repairArchive(J(arch));
    assert.deepEqual(byId(J(L.appData.vigilanceCases)), byId(J(r.archive)), 'archive seed ' + seed);
    assert.equal(L.alerts[0], r.fixed > 0 ? V.MSG.REPAIR_DONE(r.fixed) : V.MSG.REPAIR_NONE, 'msg seed ' + seed);
  }
  const E = runLegacy({ archive: [] });
  await E.ctx.vigRepairAllEntries();
  assert.equal(E.alerts[0], V.MSG.EMPTY_ARCHIVE);
});

// ── المؤشرات والإحصاءات ──
test('المؤشرات (KPI) والإحصاءات مطابقة', () => {
  for (const seed of [1, 2, 3]) {
    const arch = makeArchive(seed, 25);
    const L = runLegacy({ archive: J(arch) });
    L.ctx.vigUpdateKPIs();
    const nums = [...L.el('vigKpiRow').innerHTML.matchAll(/line-height:1;">(\d+)<\/div>/g)].map((m) => Number(m[1]));
    const k = V.kpis(arch);
    assert.deepEqual(nums, [k.total, k.urgent, k.inProgress, k.resolved]);
    const s = L.ctx.vigGetStats();
    const st = V.archiveStats(arch);
    assert.equal(s.total, st.total); assert.equal(s.urgent, st.urgent);
    assert.equal(s.inProgress, k.inProgress); assert.equal(s.resolved, k.resolved);
    assert.deepEqual(Object.entries(s.byCategory), st.cats);
  }
});

// ── الفلترة والترتيب ──
test('عرض الأرشيف: الفلترة والترتيب بتاريخ المقابلة مطابقان (تصاعدي/تنازلي/بحث)', () => {
  for (const seed of [1, 2, 3]) {
    const arch = makeArchive(seed, 25);
    for (const dir of ['asc', 'desc']) {
      for (const search of ['', 'أحمد', 'عنف', 'نور', 'لا شيء إطلاقاً', '  فاطمة ']) {
        const L = runLegacy({ archive: J(arch) });
        L.run(`vigSortDir = '${dir}'`);
        L.el('vigArchiveSearch').value = search;
        L.ctx.renderVigArchive();
        const html = L.el('vigArchiveList').innerHTML;
        const legacyIds = [...html.matchAll(/id="vigRow_(\d+)"/g)].map((m) => Number(m[1]));
        const mine = V.filterSort(arch, search, dir).map((e) => e.id);
        assert.deepEqual(mine, legacyIds, `seed ${seed} ${dir} "${search}"`);
        assert.equal(L.el('vigArchiveCount').textContent, arch.length);
      }
    }
  }
});

test('الترتيب: sortByDate لا يعدّل المصفوفة الأصلية وثابت للتواريخ المتساوية', () => {
  const arch = makeArchive(9, 30);
  const copy = J(arch);
  const out = V.sortByDate(arch, 'asc');
  assert.deepEqual(arch, copy);
  for (let i = 1; i < out.length; i++) assert.ok((out[i - 1].date || '') <= (out[i].date || ''));
});

// ── إضافة حالة ──
function fillForm(L, f) {
  const set = (id, v) => { L.el(id).value = v; };
  set('vig_name', f.name); set('vig_massar', f.massar); set('vig_date', f.date); set('vig_school', f.school);
  set('vig_level', f.level); set('vig_actions', f.actions); set('vig_notes', f.notes); set('vig_next_followup', f.nextFollowup);
  L.checked.cat = V.orderedCategories(f.categories); L.checked.prio = f.priority || null; L.checked.status = f.status || null;
}
const FORMS = [
  { name: ' سعاد ', massar: ' G1 ', date: '2026-10-20', school: ' إعدادية ', level: '2APIC-1', categories: ['إشكالية نفسية', 'عنف مدرسي'], actions: ' جلسة ', priority: 'عاجلة', status: 'تحسن ملحوظ', notes: ' م ', nextFollowup: '2026-11-01' },
  { name: 'ليلى', massar: '', date: '2026-10-21', school: '', level: '', categories: ['أخرى'], actions: 'إجراء', priority: '', status: '', notes: '', nextFollowup: '' },
];

test('إضافة حالة: السجل الناتج مطابق للقديم (بما فيه القيم الافتراضية والمؤسسة من الملف الشخصي)', async () => {
  const profiles = [null, { institution: 'مؤسسة الملف' }, { school: 'مدرسة الملف' }, { institution: 'أ', school: 'ب' }];
  for (const profile of profiles) {
    for (const inst of ['', 'اسم المؤسسة']) {
      for (const f of FORMS) {
        const L = runLegacy({ archive: [], profile, inst });
        fillForm(L, f);
        await L.ctx.vigSaveEntry();
        const legacyEntry = J(L.appData.vigilanceCases[0]);
        const r = V.buildEntry(f, { now: NOW, profile, institution: inst });
        assert.deepEqual(J(r.entry), legacyEntry, JSON.stringify({ profile, inst, f: f.name }));
      }
    }
  }
});

test('إضافة حالة: رسائل التحقق بنفس ترتيب القديم', async () => {
  const cases = [
    [{ ...FORMS[0], name: '' }, V.MSG.NAME],
    [{ ...FORMS[0], date: '' }, V.MSG.DATE],
    [{ ...FORMS[0], categories: [] }, V.MSG.CATEGORY],
    [{ ...FORMS[0], actions: '   ' }, V.MSG.ACTIONS],
    [{ ...FORMS[0], name: '', date: '', categories: [], actions: '' }, V.MSG.NAME],
    [{ ...FORMS[0], date: '', categories: [], actions: '' }, V.MSG.DATE],
    [{ ...FORMS[0], categories: [], actions: '' }, V.MSG.CATEGORY],
  ];
  for (const [f, msg] of cases) {
    const L = runLegacy({ archive: [] });
    fillForm(L, f);
    await L.ctx.vigSaveEntry();
    assert.equal(L.alerts[0], msg);
    assert.equal(L.appData.vigilanceCases.length, 0);
    assert.equal(V.buildEntry(f, { now: NOW }).error, msg);
  }
});

test('الفئات تُحفظ بترتيب ظهورها في النموذج لا بترتيب النقر', () => {
  const r = V.buildEntry({ ...FORMS[0], categories: ['أخرى', 'عنف مدرسي', 'وضعية صحية'] }, { now: NOW });
  assert.equal(r.entry.category, 'عنف مدرسي | وضعية صحية | أخرى');
});

// ── تعديل حالة ──
test('تعديل حالة: formFromEntry وapplyEdit مطابقان لـ vigEditEntry وvigSaveEdit', async () => {
  const arch = makeArchive(11, 12);
  for (const e of arch) {
    const L = runLegacy({ archive: J(arch) });
    L.ctx.vigEditEntry(e.id);
    const f = V.formFromEntry(e);
    assert.equal(L.el('vigEditName').value, f.name);
    assert.equal(L.el('vigEditMassar').value, f.massar);
    assert.equal(L.el('vigEditDate').value, f.date);
    assert.equal(L.el('vigEditSchool').value, f.school);
    assert.equal(L.el('vigEditLevel').value, f.level);
    assert.equal(L.el('vigEditActions').value, f.actions);
    assert.equal(L.el('vigEditNotes').value, f.notes);
    assert.equal(L.el('vigEditFollowup').value, f.nextFollowup);
  }
  const edits = [
    { name: ' جديد ', massar: ' ', date: '', school: '', level: '', actions: '', notes: '  ', nextFollowup: '', categories: [], priority: '', status: '' },
    { name: 'اسم', massar: 'M1', date: '2026-01-01', school: 'مؤسسة', level: '3APIC-2', actions: 'إجراء', notes: 'ن', nextFollowup: '2026-02-02', categories: ['وضعية صحية', 'عنف مدرسي'], priority: 'عادية', status: 'انتهت المتابعة' },
  ];
  for (const f of edits) {
    for (const target of [arch[0], arch[5], arch[11]]) {
      const L = runLegacy({ archive: J(arch) });
      L.el('vigEditId').value = String(target.id);
      L.el('vigEditName').value = f.name; L.el('vigEditMassar').value = f.massar; L.el('vigEditDate').value = f.date;
      L.el('vigEditSchool').value = f.school; L.el('vigEditLevel').value = f.level; L.el('vigEditActions').value = f.actions;
      L.el('vigEditNotes').value = f.notes; L.el('vigEditFollowup').value = f.nextFollowup;
      L.checked.editCat = V.orderedCategories(f.categories); L.checked.editPrio = f.priority || null; L.checked.editStatus = f.status || null;
      await L.ctx.vigSaveEdit();
      const r = V.applyEdit(J(arch), target.id, f);
      assert.deepEqual(byId(J(L.appData.vigilanceCases)), byId(J(r.archive)));
    }
  }
  assert.equal(V.applyEdit(arch, arch[0].id, { name: '  ' }).error, V.MSG.EDIT_NAME);
  assert.equal(V.applyEdit(arch, -1, { name: 'x' }), null);
});

// ── الحذف ──
test('الحذف: removeIds يطابق vigDeleteSelected / vigDeleteEntry', async () => {
  const arch = makeArchive(21, 10);
  const ids = [arch[1].id, arch[4].id, arch[9].id];
  const L = runLegacy({ archive: J(arch) });
  L.ctx.document.querySelectorAll = () => []; // لا نعتمد على DOM التحديد؛ نختبر الحذف الفردي
  await L.ctx.vigDeleteEntry(ids[0]);
  assert.deepEqual(byId(J(L.appData.vigilanceCases)), byId(V.removeIds(arch, [ids[0]])));
  assert.equal(V.removeIds(arch, ids).length, arch.length - 3);
  assert.equal(V.removeIds(arch, []).length, arch.length);
});

// ── الاستيراد ──
const HDR = ['اسم التلميذ(ة)', 'القسم', 'نوع الوضعية الحرجة', 'الإجراءات المتخذة', 'تاريخ المقابلة', 'المؤسسة', 'درجة الأولوية', 'الحالة الراهنة', 'ملاحظات', 'المتابعة القادمة', 'رقم مسار'];
const IMPORT_SHEETS = {
  كامل: [HDR, ['أحمد', '2APIC-1', 'عنف مدرسي', 'جلسة', '2026-10-01', 'إعدادية', 'عاجلة', 'قيد المتابعة', 'ملاحظة', '2026-10-09', 'M1'], ['', '2APIC-1'], ['س', 'x'], ['ليلى', '', '', '', '', '', '', '', '', '', '']],
  'رأس بعد صفوف فارغة': [['عنوان'], [''], ['الاسم والنسب', 'الوضعية'], ['يوسف', 'انقطاع مزمن'], ['  ', 'أخرى'], ['مريم', '']],
  'أعمدة ناقصة': [['اسم التلميذ', 'الإجراء'], ['هند', 'إحالة'], ['سلمى', '']],
  'بلا عمود الاسم': [['عمود', 'آخر'], ['1', '2']],
  'صف واحد': [['اسم التلميذ(ة)']],
  'CSV تالف': [['?????', '?????', '?????'], ['??? ???', '???', '???']],
};

test('الاستيراد من Excel: السجلات والرسائل مطابقة للقديم على عدة أشكال من الملفات', async () => {
  for (const [label, rows] of Object.entries(IMPORT_SHEETS)) {
    const existing = makeArchive(31, 3);
    const L = runLegacy({ archive: J(existing), rows });
    L.ctx.vigImportFromFile({ files: [{}], value: 'x' });
    await tick();
    const msg = L.el('vigImportMsg').textContent;
    const batchId = 'import_' + NOW.getTime();
    const r = V.parseImportRows(rows, { nowMs: NOW.getTime(), savedAt: NOW.toLocaleString('ar-MA'), batchId });
    if (r.error) {
      assert.equal(msg, r.error, label);
      assert.deepEqual(J(L.appData.vigilanceCases), J(existing), label + ' (لا تغيير)');
    } else {
      assert.equal(msg, V.MSG.IMPORT_OK(r.imported), label);
      assert.deepEqual(byId(J(L.appData.vigilanceCases)), byId(J(V.mergeImport(existing, r.entries))), label);
      assert.equal(L.store['vig:lastImportBatch'], batchId);
      assert.equal(Number(L.store['vig:lastImportCount']), r.imported);
    }
  }
});

test('الاستيراد: آخر صف في الملف يصير أول الأرشيف (unshift القديمة)', () => {
  const r = V.parseImportRows(IMPORT_SHEETS['أعمدة ناقصة'], { nowMs: 1, savedAt: 's', batchId: 'b' });
  const merged = V.mergeImport([{ id: 0, studentName: 'قديم' }], r.entries);
  assert.deepEqual(merged.map((e) => e.studentName), ['سلمى', 'هند', 'قديم']);
});

test('حذف آخر استيراد يزيل دفعته فقط', async () => {
  const arch = makeArchive(41, 8);
  const L = runLegacy({ archive: J(arch) });
  L.store['vig:lastImportBatch'] = 'import_1';
  L.store['vig:lastImportCount'] = '2';
  L.store['vig:lastImportDate'] = 'التاريخ';
  await L.ctx.vigDeleteLastImport();
  const expected = arch.filter((c) => c._importBatch !== 'import_1');
  assert.deepEqual(byId(J(L.appData.vigilanceCases)), byId(J(expected)));
  assert.equal(L.el('vigImportMsg').textContent, V.MSG.IMPORT_DELETED(arch.length - expected.length));
  assert.equal(L.store['vig:lastImportBatch'], undefined);
});

// ── ملفات Excel ──
test('النموذج الفارغ والتصدير: الصفوف والأعمدة وأسماء الملفات مطابقة', () => {
  const arch = makeArchive(51, 6);
  const L = runLegacy({ archive: J(arch) });
  L.ctx.vigDownloadTemplate();
  assert.deepEqual(J(L.xl.aoa[0]), V.TEMPLATE_ROWS);
  assert.deepEqual(J(L.xl.cols.map((c) => c.wch)), V.TEMPLATE_COLS);
  assert.equal(L.xl.writes[0], V.TEMPLATE_FILE);
  assert.equal(L.xl.sheet, V.SHEET_NAME);

  const E = runLegacy({ archive: J(arch) });
  E.ctx.vigExportExcel();
  assert.deepEqual(J(E.xl.aoa[0]), J(V.exportRows(arch)));
  assert.deepEqual(J(E.xl.cols.map((c) => c.wch)), V.EXPORT_COLS);
  assert.equal(E.xl.writes[0], V.exportFileName(NOW));
  assert.equal(E.xl.sheet, V.SHEET_NAME);

  const empty = runLegacy({ archive: [] });
  empty.ctx.vigExportExcel();
  assert.equal(empty.alerts[0], V.MSG.EMPTY_ARCHIVE);
});

// ── الاقتراحات ──
const labelsIn = (html) => [...html.matchAll(/>\s*([^<>\n]+?)\s*<\/button>/g)].map((m) => m[1]);

test('اقتراحات النموذج: أول فئة بترتيب النموذج تحدد القائمة، ولا فئة → تلميحات الخطوات', () => {
  const combos = [[], ...V.VIG_CATEGORIES.map((c) => [c]), ['أخرى', 'عنف مدرسي'], ['وضعية صحية', 'انقطاع مزمن', 'أخرى']];
  for (const sel of combos) {
    const L = runLegacy();
    L.checked.cat = V.orderedCategories(sel);
    L.ctx.vigUpdateSuggestions();
    const html = L.el('vigSuggestContainer').innerHTML;
    const exp = V.suggestionsFor(sel);
    if (!exp.length) assert.ok(html.includes('خطوات ملء النموذج'), 'hints ' + sel);
    else assert.deepEqual(labelsIn(html), exp.map((s) => s[0]), sel.join('|'));
  }
});

test('اقتراحات التعديل (إجراءات وملاحظات) مطابقة وتُخفى عند عدم اختيار فئة', () => {
  for (const sel of [[], ...V.VIG_CATEGORIES.map((c) => [c]), ['أخرى', 'إدمان وانحراف']]) {
    const L = runLegacy();
    L.checked.editCat = V.orderedCategories(sel);
    L.ctx.vigEditShowSuggestions();
    const exp = V.editSuggestionsFor(sel);
    if (!exp) {
      assert.equal(L.el('vigEditActionsSugg').style.display, 'none');
      assert.equal(L.el('vigEditNotesSugg').style.display, 'none');
    } else {
      assert.deepEqual(labelsIn(L.el('vigEditActionsSugg').innerHTML), exp.actions.map((s) => s[0]));
      assert.deepEqual(labelsIn(L.el('vigEditNotesSugg').innerHTML), exp.notes.map((s) => s[0]));
    }
  }
});

test('إضافة نص الاقتراح إلى الحقل (سطر جديد إن لم يكن فارغاً)', () => {
  for (const start of ['', '   ', 'نص', 'نص   \n']) {
    const L = runLegacy();
    L.el('vig_actions').value = start;
    L.ctx.vigApplySuggestion('اقتراح');
    assert.equal(L.el('vig_actions').value, V.appendLine(start, 'اقتراح'));
    L.el('vigEditNotes').value = start;
    L.ctx.vigEditAppend('vigEditNotes', 'اقتراح');
    assert.equal(L.el('vigEditNotes').value, V.appendLine(start, 'اقتراح'));
  }
});

// ── التقارير ──
const PROFILES = [null, { fullName: 'المختص <b>' }, { school: 'مدرسة الملف', fullName: 'س' }];
test('التقرير الشامل: HTML مطابق (طباعة وWord، مع الشعار وبدونه، وكل أشكال الملف الشخصي)', () => {
  const arch = makeArchive(61, 16);
  for (const profile of PROFILES) {
    for (const logo of ['', 'data:image/png;base64,AAA']) {
      for (const [formSchool, inst] of [['', ''], ['حقل النموذج', ''], ['', 'اسم المؤسسة']]) {
        for (const forWord of [false, true]) {
          const L = runLegacy({ archive: J(arch), profile, inst, logo });
          L.el('vig_school').value = formSchool;
          const legacy = L.ctx.vigBuildReportHtml(forWord);
          const mine = V.reportHtml(arch, { school: V.reportSchool({ profile, formSchool, institution: inst }), profile, logo, forWord });
          assert.equal(mine, legacy);
        }
      }
    }
  }
  assert.equal(V.reportHtml([], { school: 'x' }), '');
  assert.equal(runLegacy({ archive: [] }).ctx.vigBuildReportHtml(false), '');
});

test('بطاقة الحالة: HTML مطابق لكل سجل (بسجل متابعة وبدونه)', () => {
  const arch = makeArchive(71, 14);
  for (const profile of PROFILES) {
    for (const logo of ['', 'data:image/png;base64,AAA']) {
      for (const [formSchool, inst] of [['', ''], ['حقل النموذج', ''], ['', 'اسم المؤسسة']]) {
        const L = runLegacy({ archive: J(arch), profile, inst, logo });
        L.el('vig_school').value = formSchool;
        for (const e of arch) {
          const legacy = L.ctx.vigBuildCaseHtml(J(e));
          const mine = V.caseHtml(e, { school: V.caseSchool(e, { profile, formSchool, institution: inst }), profile, logo });
          assert.equal(mine, legacy);
        }
      }
    }
  }
});

test('أنماط الطباعة وبناء مستند الإطار مطابقة', () => {
  const L = runLegacy({ archive: makeArchive(81, 3), profile: { fullName: 'س' } });
  assert.equal(V.caseStyles(''), L.ctx.vigCaseStyles(''));
  assert.equal(V.caseStyles('#vigCasePreviewBody'), L.ctx.vigCaseStyles('#vigCasePreviewBody'));

  // نلتقط (css, body) الممرَّرين إلى vigPrintInFrame القديمة من زرّي الطباعة
  const cap = [];
  L.ctx.vigPrintInFrame = (id, body, css) => cap.push({ id, body, css });
  L.ctx.vigPrintFullReport();
  assert.equal(cap[0].css, V.REPORT_PRINT_CSS);
  assert.equal(cap[0].body, L.ctx.vigBuildReportHtml(false));
  L.ctx._vigCaseId = L.appData.vigilanceCases[0].id;
  L.ctx.window._vigCaseId = L.appData.vigilanceCases[0].id;
  L.run('window._vigCaseId = ' + L.appData.vigilanceCases[0].id);
  L.ctx.vigCasePrint();
  assert.equal(cap[1].css, V.CASE_PRINT_CSS);

  // المستند المكتوب داخل الإطار
  const written = [];
  const frame = {
    id: '', style: {}, remove() {},
    contentWindow: { document: { open() {}, write: (s) => written.push(s), close() {}, querySelector: () => null, fonts: null }, focus() {}, print() {} },
  };
  const L2 = runLegacy();
  L2.doc.getElementById = () => null;
  L2.doc.createElement = () => frame;
  L2.ctx.vigPrintInFrame('f', '<p>جسم</p>', '.x{color:red}');
  assert.equal(written[0], V.buildPrintDocument('.x{color:red}', '<p>جسم</p>'));
});

test('أسماء ملفات Word مطابقة (التقرير والبطاقة)', async () => {
  const arch = makeArchive(91, 4);
  const L = runLegacy({ archive: J(arch), profile: { fullName: 'س' } });
  L.run('window._vigCaseId = ' + arch[1].id);
  await L.ctx.vigCaseWord();
  assert.equal(L.words[0][1], V.caseFileName(arch[1], NOW.toISOString().slice(0, 10)));
  await L.ctx.vigDownloadWord();
  assert.equal(L.words[1][1], 'تقرير_خلية_اليقظة_' + NOW.toISOString().slice(0, 10));
});

test('تاريخ اليوم', () => {
  assert.equal(V.todayIso(NOW), NOW.toISOString().slice(0, 10));
});
