// اختبار مطابقة «حالات العنف»: نشغّل كتلة العنف القديمة (النسخة المجمَّدة للمرحلة 19) في بيئة معزولة بـDOM مُحاكى،
// ونقارن نتائجها بدوال src/violence/violenceLogic.js على بيانات عشوائية بذرة ثابتة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as V from '../src/violence/violenceLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/violence.step19.js', import.meta.url), 'utf8');
const script10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8')
  + '\n' + fs.readFileSync(new URL('./fixtures/helpers.step45.js', import.meta.url), 'utf8'); // + الدوال المساعدة القديمة المجمَّدة (حُذفت من script-10 في المرحلة 46)
const NOW = new Date(2026, 9, 25, 11, 30);
const J = (x) => JSON.parse(JSON.stringify(x));
function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }

// الدوال المساعدة المشتركة تؤخذ من script-10.js الحقيقي لا من نسخة مكتوبة هنا
const helperSrc = [
  /^function val\(id\).*$/m, /^function getRadio\(name\).*$/m, /^function getChecked\(name\).*$/m, /^function iEsc\(t\).*$/m,
].map((re) => script10.match(re)[0]).join('\n') + '\n' + script10.match(/function iAutoCheck\(inp\) \{[\s\S]*?\n\}/)[0];

const TEXT_IDS = { studentName: 'vio_studentName', level: 'vio_level', massar: 'vio_massar', aggName: 'vio_agg_name', aggLevel: 'vio_agg_level', aggMassar: 'vio_agg_massar', reportDate: 'vio_reportDate', school: 'vio_school', parentPhone: 'vio_parentPhone', description: 'vio_description', recommendation: 'vio_recommendation' };
const GROUPS = { vio_type: V.TYPE_OPTIONS, vio_report_source: V.SOURCE_OPTIONS, vio_location: V.LOCATION_OPTIONS, vio_priority: V.PRIORITY_OPTIONS };

// ── DOM مُحاكى بالقدر الذي تستعمله دوال العنف القديمة ──
function makeDom() {
  const mk = (extra = {}) => ({ value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, ...extra });
  const fields = {};
  Object.values(TEXT_IDS).forEach((id) => { fields[id] = mk(); });
  const groups = {};
  for (const [name, opts] of Object.entries(GROUPS)) groups[name] = opts.map((o) => mk({ value: o[0], checked: false, type: name === 'vio_type' || name === 'vio_report_source' ? 'checkbox' : 'radio' }));
  const rows = [];
  const makeRow = (dataset) => {
    const r = { dataset, cb: { type: 'checkbox', checked: false }, date: { type: 'date', value: '' }, note: { value: '' }, nameInput: dataset.custom ? { value: '' } : null, removed: false };
    r.querySelector = (sel) => (sel === 'input[type=checkbox]' ? r.cb : sel === 'input[type=date]' ? r.date : sel === '.iproc-note' ? r.note : sel === '.iproc-name' ? r.nameInput : null);
    r.closest = () => r;
    r.remove = () => { const i = rows.indexOf(r); if (i >= 0) rows.splice(i, 1); };
    Object.defineProperty(r, 'innerHTML', { set() { r.nameInput = { value: '' }; }, get: () => '' });
    return r;
  };
  V.VIO_PROCS.forEach((p) => rows.push(makeRow({ key: p.key })));
  const els = { vioEditBar: mk() };
  const byName = (name) => groups[name] || [];
  const document = {
    getElementById: (id) => fields[id] || (els[id] ??= mk()),
    createElement: () => makeRow({}),
    querySelectorAll(sel) {
      let m;
      if (sel === '#vio-summary-table tbody tr') return rows.slice();
      if (sel === '#vio-summary-table tbody tr[data-custom]') return rows.filter((r) => r.dataset.custom);
      if (sel === '#vio-summary-table input') return rows.flatMap((r) => [r.cb, r.date, r.note, r.nameInput].filter(Boolean));
      if (sel.startsWith('#toolViolence input[type=text]')) return [...Object.values(fields), ...rows.flatMap((r) => [r.date, r.note, r.nameInput].filter(Boolean))];
      if (sel.startsWith('#toolViolence input[type=radio]')) return [...Object.values(groups).flat(), ...rows.map((r) => r.cb)];
      if (sel === '#toolViolence .procedure-details') return [];
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).filter((e) => e.checked);
      if ((m = sel.match(/^input\[name="(\w+)"\]$/))) return byName(m[1]);
      if (sel === '#ministry-logo-img') return [];
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
    querySelector(sel) {
      let m;
      if (sel === '#vio-summary-table tbody') return { appendChild: (tr) => rows.push(tr) };
      if ((m = sel.match(/^#vio-summary-table tbody tr\[data-key="(\w+)"\]$/))) return rows.find((r) => r.dataset.key === m[1]) || null;
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).find((e) => e.checked) || null;
      if ((m = sel.match(/^input\[name="(\w+)"\]\[value="(.*)"\]$/))) return byName(m[1]).find((e) => e.value === m[2]) || null;
      if (sel === '#toolViolence .main-container') return { scrollTo() {}, insertBefore() {}, firstChild: null };
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
  };
  return { fields, groups, rows, els, document, makeRow };
}

function makeLegacy({ archive = [], inst = '' } = {}) {
  const dom = makeDom();
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const log = { alerts: [], confirms: [], tasks: [], stats: 0, saves: 0 };
  const appData = { violenceArchive: archive };
  const sandbox = {
    console, Date: FixedDate, document: dom.document, setTimeout: () => 0, appData,
    alert: (m) => log.alerts.push(m), confirm: (m) => { log.confirms.push(m); return true; },
    saveUserKey: () => { log.saves++; }, updateDashboardStats: () => { log.stats++; },
    autoLogTask: (...a) => log.tasks.push(a), getInstitutionName: () => inst, initAllAutocomplete: () => {},
    MINISTRY_LOGO_B64: '',
  };
  sandbox.window = sandbox; // كالمتصفح: window هو الكائن العام (وvioSaveToArchiveSilent تعتمد على ذلك)
  sandbox.scrollTo = () => {};
  const ctx = vm.createContext(sandbox);
  vm.runInContext(helperSrc, ctx);
  vm.runInContext(legacySrc, ctx);
  return { ctx, dom, log, appData, run: (code) => vm.runInContext(code, ctx) };
}

// ── مولّد بيانات ──
const pick = (r, a) => a[Math.floor(r() * a.length)];
const subset = (r, opts) => opts.map((o) => o[0]).filter(() => r() < 0.4);
function randForm(r, { name = true } = {}) {
  const t = (arr) => pick(r, arr);
  return {
    studentName: name ? t(['  أحمد بنعلي ', 'فاطمة <b>الزهراء</b>', 'يوسف & المرابط', 'سارة']) : t(['', '   ']),
    level: t(['', '2APIC-3', ' 1APIC-1 ']), massar: t(['', 'G1234567', ' M9 ']),
    aggName: t(['', 'خالد العلمي', ' <x> ']), aggLevel: t(['', '3APIC-2']), aggMassar: t(['', 'G7654321']),
    reportDate: t(['', '2026-10-20', '2026-10-24']), school: t(['', 'إعدادية الأمل', ' م & م ']), parentPhone: t(['', '0612345678']),
    description: t(['', 'وصف الحادثة\nسطر ثان', ' <script> ']), recommendation: t(['', 'متابعة أسبوعية', ' توصية ']),
    types: subset(r, V.TYPE_OPTIONS), sources: subset(r, V.SOURCE_OPTIONS),
    location: t(['', ...V.LOCATION_OPTIONS.map((o) => o[0])]), priority: t(['', ...V.PRIORITY_OPTIONS.map((o) => o[0])]),
    procRows: randRows(r),
  };
}
function randRows(r) {
  const rows = V.blankProcRows().map((x) => (r() < 0.5 ? { ...x, checked: true, date: pick(r, ['', '2026-10-21']), notes: pick(r, ['', ' ملاحظة ', 'a<b']) } : { ...x, date: pick(r, ['', '2026-10-22']), notes: pick(r, ['', '  ']) }));
  const extra = Math.floor(r() * 3);
  for (let i = 0; i < extra; i++) rows.push({ custom: true, name: pick(r, ['', '  إجراء خاص ', 'x & y']), checked: r() < 0.5, date: pick(r, ['', '2026-10-23']), notes: pick(r, ['', 'ن']) });
  return rows;
}
const safeEntry = (r, i) => ({ ...V.saveEntry([], randForm(r), new Date(NOW.getTime() + i)).entry, id: 1760000000000 + i });

// تطبيق نموذج على DOM القديم
function applyForm(dom, f) {
  for (const [k, id] of Object.entries(TEXT_IDS)) dom.fields[id].value = f[k] ?? '';
  const setG = (name, vals) => dom.groups[name].forEach((e) => { e.checked = vals.includes(e.value); });
  setG('vio_type', f.types || []); setG('vio_report_source', f.sources || []);
  setG('vio_location', f.location ? [f.location] : []); setG('vio_priority', f.priority ? [f.priority] : []);
  dom.rows.splice(0, dom.rows.length);
  (f.procRows || []).forEach((p) => {
    const row = dom.makeRow(p.custom ? { custom: '1' } : { key: p.key });
    if (p.custom) row.nameInput = { value: p.name };
    row.cb.checked = !!p.checked; row.date.value = p.date || ''; row.note.value = p.notes || '';
    dom.rows.push(row);
  });
}
const readRows = (dom) => dom.rows.map((r) => (r.dataset.custom ? { custom: true, name: r.nameInput.value, checked: r.cb.checked, date: r.date.value, notes: r.note.value } : { custom: false, key: r.dataset.key, checked: r.cb.checked, date: r.date.value, notes: r.note.value }));
const mineRows = (rows) => rows.map((r) => (r.custom ? { custom: true, name: r.name, checked: r.checked, date: r.date, notes: r.notes } : { custom: false, key: r.key, checked: r.checked, date: r.date, notes: r.notes }));

// ── الحفظ ──
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  test(`مطابقة للقديم: vioSaveToArchive (السجل والمهمة المسجَّلة) seed=${seed}`, () => {
    const r = rngOf(seed * 97);
    const L = makeLegacy();
    let mine = [];
    for (let step = 0; step < 12; step++) {
      const f = randForm(r, { name: r() < 0.85 });
      applyForm(L.dom, f);
      const before = L.log.alerts.length;
      L.run('vioSaveToArchive()');
      const res = V.saveEntry(mine, f, NOW);
      if (!res) {
        assert.equal(L.log.alerts.length, before + 1);
        assert.equal(L.log.alerts.at(-1), V.MSG.NAME_FIRST);
        assert.deepEqual(J(L.appData.violenceArchive), J(mine));
        continue;
      }
      mine = res.archive;
      assert.deepEqual(J(L.appData.violenceArchive), J(mine), 'الأرشيف بعد الخطوة ' + step);
      assert.deepEqual(J(L.log.tasks.at(-1)), J(V.taskLogArgs(res.entry)), 'معاملات سجل المهام');
    }
    assert.ok(L.log.stats >= 1);
  });
}

// ── التقرير ──
for (const seed of [11, 12, 13, 14, 15, 16, 17, 18]) {
  test(`مطابقة للقديم: vioGenerateReport (HTML حرفياً + حفظ تلقائي) seed=${seed}`, () => {
    const r = rngOf(seed * 53);
    const L = makeLegacy();
    for (let step = 0; step < 10; step++) {
      const f = randForm(r, { name: r() < 0.9 });
      applyForm(L.dom, f);
      const n0 = L.appData.violenceArchive.length;
      const a0 = L.log.alerts.length;
      L.run('vioGenerateReport()');
      if (!String(f.studentName).trim()) { assert.equal(L.log.alerts.length, a0 + 1); assert.equal(L.appData.violenceArchive.length, n0); continue; }
      assert.equal(L.dom.els.vioReportContent.innerHTML, V.reportHtml(f, { logo: '' }), 'تقرير الخطوة ' + step);
      assert.equal(L.appData.violenceArchive.length, n0 + 1, 'كل إنشاء تقرير يضيف سجلاً (كالقديم)');
      assert.equal(L.log.alerts.length, a0, 'الحفظ التلقائي صامت');
    }
  });
}

test('التقرير: الشعار يُدرج في src ويبقى الباقي كما هو', () => {
  const f = V.blankForm('2026-10-24', 'م');
  f.studentName = 'س';
  assert.equal(V.reportHtml(f, { logo: 'data:image/png;base64,AAA' }), V.reportHtml(f, { logo: '' }).replace('src=""', 'src="data:image/png;base64,AAA"'));
});

// ── التحميل للتعديل ──
for (const seed of [21, 22, 23, 24, 25, 26]) {
  test(`مطابقة للقديم: vioLoadEntry (الحقول والخيارات وجدول الإجراءات) seed=${seed}`, () => {
    const r = rngOf(seed * 41);
    const archive = Array.from({ length: 6 }, (_, i) => safeEntry(r, i));
    // سجلات بقيم «—» وأنواع مجهولة ومفتاح إجراء مجهول
    archive.push({ ...archive[0], id: 1760000000100, massar: '—', aggName: '—', school: '—', location: '—', priority: '—', types: ['نوع قديم', 'تحرش'], procRows: [{ key: 'zzz', name: 'x', date: '', notes: '' }, { custom: true, name: 'خاص', date: '2026-10-01', notes: 'ن' }, { key: 'admin', date: '2026-10-02', notes: 'م' }] });
    const L = makeLegacy({ archive: J(archive) });
    // حالة سابقة في الجدول: صفوف مخصَّصة يجب أن تُمسح عند التحميل
    applyForm(L.dom, { ...randForm(r), procRows: randRows(r) });
    for (const e of archive) {
      L.run(`vioLoadEntry(${e.id})`);
      const want = V.formFromEntry(e);
      for (const [k, id] of Object.entries(TEXT_IDS)) assert.equal(L.dom.fields[id].value, want[k] ?? '', `${k} للسجل ${e.id}`);
      const checked = (name) => L.dom.groups[name].filter((x) => x.checked).map((x) => x.value);
      assert.deepEqual(checked('vio_type'), V.inDomOrder(V.TYPE_OPTIONS, want.types));
      assert.deepEqual(checked('vio_location'), want.location ? [want.location] : []);
      assert.deepEqual(checked('vio_priority'), want.priority ? [want.priority] : []);
      assert.deepEqual(readRows(L.dom), mineRows(want.procRows), 'جدول الإجراءات للسجل ' + e.id);
      assert.equal(L.dom.els.vioEditBar.dataset.editId, e.id);
    }
  });
}

// ── التحديث ──
for (const seed of [31, 32, 33, 34, 35, 36]) {
  test(`مطابقة للقديم: vioUpdateEntry (الاستبدال/الإضافة/التحقق) seed=${seed}`, () => {
    const r = rngOf(seed * 29);
    const archive = Array.from({ length: 5 }, (_, i) => safeEntry(r, i));
    const L = makeLegacy({ archive: J(archive) });
    let mine = J(archive);
    for (let step = 0; step < 10; step++) {
      const target = r() < 0.8 ? pick(r, mine).id : 999999;
      const f = randForm(r, { name: r() < 0.85 });
      applyForm(L.dom, f);
      L.dom.els.vioEditBar.dataset.editId = String(target);
      const a0 = L.log.alerts.length;
      L.run('vioUpdateEntry()');
      const res = V.updateEntry(mine, target, f, NOW);
      if (!res) { assert.equal(L.log.alerts.at(-1), V.MSG.NAME_FIRST); assert.equal(L.log.alerts.length, a0 + 1); }
      else {
        mine = res.archive;
        assert.equal(L.log.alerts.at(-1), V.MSG.UPDATED(String(f.studentName).trim()));
      }
      assert.deepEqual(J(L.appData.violenceArchive), J(mine), 'الأرشيف بعد التحديث ' + step);
      if (res) { // vioCancelEdit: كل الحقول والخيارات والجدول فارغة
        assert.ok(Object.values(L.dom.fields).every((e) => e.value === ''));
        assert.ok(Object.values(L.dom.groups).flat().every((e) => !e.checked));
        assert.deepEqual(readRows(L.dom), mineRows(V.blankProcRows()));
      }
    }
  });
}

// ── الأرشيف: العرض والبحث والحذف والمسح ──
function parseList(html) {
  const rows = html.split('<tr>').slice(2);
  const cell = (tr) => [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
  return rows.map((tr) => {
    const c = cell(tr);
    return { n: c[0], name: c[1].replace(/<[^>]+>/g, '').trim(), agg: c[2].trim(), date: c[3].replace('📅', '').trim(), types: [...c[4].matchAll(/archive-tag">([^<]*)</g)].map((m) => m[1]), priority: c[5].replace(/<[^>]+>/g, '').trim() };
  });
}
for (const seed of [41, 42, 43, 44]) {
  test(`مطابقة للقديم: renderVioArchive والبحث seed=${seed}`, () => {
    const r = rngOf(seed * 17);
    const names = ['أحمد بنعلي', 'فاطمة الزهراء', 'يوسف المرابط', 'سارة', 'AHMED Said'];
    const archive = Array.from({ length: 9 }, (_, i) => ({ ...safeEntry(r, i), studentName: pick(r, names) + ' ' + i, aggName: pick(r, ['—', 'خالد']), priority: pick(r, ['عاجلة', 'عالية', 'متوسطة', 'عادية', '—']) }));
    const L = makeLegacy({ archive: J(archive) });
    for (const q of ['', ' ', 'أحمد', 'ahmed', '  سارة ', 'لا يوجد', '3']) {
      L.dom.els.vioArchiveSearch = { value: q };
      L.run('renderVioArchive()');
      assert.equal(L.dom.els.vioArchiveCount.textContent, archive.length);
      const shown = V.filterArchive(archive, q);
      const html = L.dom.els.vioArchiveList.innerHTML;
      if (!shown.length) { assert.ok(html.includes(V.MSG.EMPTY_LIST)); continue; }
      const mine = shown.map((e, i) => ({ n: String(i + 1), name: '🛡️ ' + e.studentName, agg: e.aggName && e.aggName !== '—' ? e.aggName : '—', date: e.reportDate, types: e.types, priority: e.priority }));
      assert.deepEqual(parseList(html), mine, 'بحث «' + q + '»');
    }
  });
}

test('مطابقة للقديم: deleteVioEntry وclearVioArchive (النصوص والنتائج)', () => {
  const r = rngOf(5);
  const archive = Array.from({ length: 5 }, (_, i) => safeEntry(r, i));
  const L = makeLegacy({ archive: J(archive) });
  L.run(`deleteVioEntry(${archive[2].id})`);
  assert.equal(L.log.confirms.at(-1), V.MSG.CONFIRM_DELETE);
  assert.deepEqual(J(L.appData.violenceArchive), J(V.deleteEntry(archive, archive[2].id)));
  L.run('clearVioArchive()');
  assert.equal(L.log.confirms.at(-1), V.MSG.CONFIRM_CLEAR_ARCHIVE(4));
  assert.deepEqual(J(L.appData.violenceArchive), []);
  L.run('clearVioArchive()');
  assert.equal(L.log.alerts.at(-1), V.MSG.EMPTY_ARCHIVE);
});

test('مطابقة للقديم: vioClearAll (تأكيد + مسح كل شيء + المؤسسة واليوم)', () => {
  const r = rngOf(9);
  const L = makeLegacy({ inst: 'إعدادية الأمل' });
  applyForm(L.dom, randForm(r));
  L.run('vioClearAll()');
  assert.equal(L.log.confirms.at(-1), V.MSG.CONFIRM_CLEAR_ALL);
  const fields = Object.fromEntries(Object.entries(TEXT_IDS).map(([k, id]) => [k, L.dom.fields[id].value]));
  assert.deepEqual(fields, { ...Object.fromEntries(Object.keys(TEXT_IDS).map((k) => [k, ''])), school: 'إعدادية الأمل', reportDate: V.todayIso(NOW) });
  assert.ok(Object.values(L.dom.groups).flat().every((e) => !e.checked));
  assert.deepEqual(readRows(L.dom), mineRows(V.blankProcRows()));
});

// ── جدول الإجراءات (iAutoCheck) ──
test('iAutoCheck: الكتابة تحدّد الصف ولا تُلغي التحديد أبداً', () => {
  let rows = V.blankProcRows();
  rows = V.editProcRow(rows, 0, 'notes', 'ن');
  assert.equal(rows[0].checked, true);
  rows = V.editProcRow(rows, 0, 'notes', '');
  assert.equal(rows[0].checked, true, 'مسح النص لا يُلغي التحديد');
  rows = V.editProcRow(rows, 1, 'notes', '   ');
  assert.equal(rows[1].checked, false, 'مسافات فقط لا تحدّد');
  rows = V.editProcRow(rows, 2, 'date', '2026-10-01');
  assert.equal(rows[2].checked, true);
  rows = V.editProcRow(rows, 0, 'checked', false);
  assert.equal(rows[0].checked, false);
  const c = V.newCustomRow();
  assert.equal(V.editProcRow([c], 0, 'name', 'إجراء')[0].checked, true);
});

test('procDetails: المخصَّص بلا اسم يُهمَل ولو كان محدداً، والثابت غير المحدد يُهمَل ولو كتب فيه', () => {
  const rows = V.blankProcRows();
  rows[0] = { ...rows[0], checked: true, date: '2026-10-01', notes: '  س  ' };
  rows[1] = { ...rows[1], checked: false, notes: 'x' };
  rows.push({ custom: true, name: '   ', checked: true, date: '', notes: 'ن' });
  rows.push({ custom: true, name: ' خاص ', checked: false, date: '', notes: '' });
  assert.deepEqual(V.procDetails(rows), [
    { key: 'listening', name: 'جلسة استماع مع الضحية', date: '2026-10-01', notes: 'س' },
    { custom: true, name: 'خاص', date: '', notes: '' },
  ]);
});

test('الترتيب: الأنواع ومصادر الإبلاغ بترتيب النموذج لا بترتيب النقر', () => {
  const f = { ...V.blankForm(), studentName: 'س', types: ['ابتزاز', 'عنف جسدي'], sources: ['أستاذ', 'ولي الأمر'] };
  assert.deepEqual(V.saveEntry([], f, NOW).entry.types, ['عنف جسدي', 'ابتزاز']);
  assert.ok(V.reportHtml(f).includes('عنف جسدي / ابتزاز'));
  assert.ok(V.reportHtml(f).includes('ولي الأمر / أستاذ'));
});
