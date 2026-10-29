// اختبار مطابقة «الإدماج المدرسي»: نشغّل كتلة الإدماج القديمة (النسخة المجمَّدة للمرحلة 20) في بيئة معزولة بـDOM مُحاكى،
// ونقارن نتائجها بدوال src/reintegration/reintegrationLogic.js على بيانات عشوائية بذرة ثابتة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as R from '../src/reintegration/reintegrationLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/reintegration.step20.js', import.meta.url), 'utf8');
const script10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8')
  + '\n' + fs.readFileSync(new URL('./fixtures/helpers.step45.js', import.meta.url), 'utf8'); // + الدوال المساعدة القديمة المجمَّدة (حُذفت من script-10 في المرحلة 46)
const NOW = new Date(2026, 9, 25, 11, 30);
const J = (x) => JSON.parse(JSON.stringify(x));
function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }

// الدوال المساعدة المشتركة تؤخذ من script-10.js الحقيقي لا من نسخة مكتوبة هنا
const helperSrc = [/^function val\(id\).*$/m, /^function getRadio\(name\).*$/m, /^function getChecked\(name\).*$/m, /^function iEsc\(t\).*$/m]
  .map((re) => script10.match(re)[0]).join('\n');

const TEXT_IDS = { studentName: 'r_studentName', massar: 'r_studentMassar', school: 'r_school', level: 'r_level', reintegrationDate: 'r_reintegrationDate', parentPhone: 'r_parentPhone', absenceDuration: 'r_absenceDuration', absenceStart: 'r_absenceStart', contextNotes: 'r_contextNotes', recommendation: 'r_recommendation' };
const GROUPS = { r_gender: R.GENDER_OPTIONS, r_family: R.FAMILY_OPTIONS, r_semester: R.SEMESTER_OPTIONS, r_priority: R.PRIORITY_OPTIONS, r_cause: R.CAUSE_OPTIONS };

// ── DOM مُحاكى بالقدر الذي تستعمله دوال الإدماج القديمة ──
function makeDom() {
  const classes = new Set();
  const mk = (extra = {}) => ({ value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), toggle: (c) => (classes.has(c) ? classes.delete(c) : classes.add(c)), contains: (c) => classes.has(c) }, ...extra });
  const fields = {};
  Object.values(TEXT_IDS).forEach((id) => { fields[id] = mk(); });
  Object.defineProperty(fields.r_level, 'selectedIndex', { set() { fields.r_level.value = ''; }, get: () => 0 });
  const groups = {};
  for (const [name, opts] of Object.entries(GROUPS)) groups[name] = opts.map((o) => mk({ value: o[0], checked: false, type: name === 'r_cause' ? 'checkbox' : 'radio' }));
  const rows = [];
  const makeRow = (dataset) => {
    const r = { dataset, cb: { type: 'checkbox', checked: false }, date: { type: 'date', value: '' }, note: { value: '' }, nameInput: null };
    r.querySelector = (sel) => (sel === 'input[type=checkbox]' ? r.cb : sel === 'input[type=date]' ? r.date : sel === '.iproc-note' ? r.note : sel === '.iproc-name' ? r.nameInput : null);
    r.remove = () => { const i = rows.indexOf(r); if (i >= 0) rows.splice(i, 1); };
    Object.defineProperty(r, 'innerHTML', { set() { r.nameInput = { value: '' }; }, get: () => '' });
    return r;
  };
  R.R_PROCS.forEach((p) => rows.push(makeRow({ key: p.key })));
  const els = { rEditBar: mk() };
  const byName = (n) => groups[n] || [];
  const document = {
    getElementById(id) {
      const m = id.match(/^r_chk_(\w+)$/);
      if (m) return rows.find((r) => r.dataset.key === m[1])?.cb || null;
      return fields[id] || (els[id] ??= mk());
    },
    createElement: (tag) => (tag === 'a' ? { click() { els.__downloaded = this; } } : makeRow({})),
    querySelectorAll(sel) {
      let m;
      if (sel === '#r-summary-table tbody tr') return rows.slice();
      if (sel === '#r-summary-table tbody tr[data-custom]') return rows.filter((r) => r.dataset.custom);
      if (sel === '#r-summary-table input') return rows.flatMap((r) => [r.cb, r.date, r.note, r.nameInput].filter(Boolean));
      if (sel.startsWith('#r-summary-table tbody tr[data-key] input[type=date]')) return rows.filter((r) => r.dataset.key).flatMap((r) => [r.date, r.note]);
      if (sel.startsWith('#toolReintegration input[type=text]')) return [...Object.values(fields).filter((e) => e !== fields.r_level), ...rows.flatMap((r) => [r.date, r.note, r.nameInput].filter(Boolean))];
      if (sel.startsWith('#toolReintegration input[type=radio]')) return [...Object.values(groups).flat(), ...rows.map((r) => r.cb)];
      if (sel === '#toolReintegration .procedure-details') return [];
      if (sel === '#toolReintegration select') return [fields.r_level];
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).filter((e) => e.checked);
      if ((m = sel.match(/^input\[name="(\w+)"\]$/))) return byName(m[1]);
      if (sel === '#ministry-logo-img') return [];
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
    querySelector(sel) {
      let m;
      if (sel === '#r-summary-table tbody') return { appendChild: (tr) => rows.push(tr) };
      if ((m = sel.match(/^#r-summary-table tbody tr\[data-key="(\w+)"\]$/))) return rows.find((r) => r.dataset.key === m[1]) || null;
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).find((e) => e.checked) || null;
      if ((m = sel.match(/^input\[name="(\w+)"\]\[value="(.*)"\]$/))) return byName(m[1]).find((e) => e.value === m[2]) || null;
      if (sel === '#toolReintegration .main-container') return { scrollTo() {}, insertBefore() {}, firstChild: null };
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
  };
  return { fields, groups, rows, els, document, makeRow };
}

function makeLegacy({ archive = [], inst = '' } = {}) {
  const dom = makeDom();
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const log = { alerts: [], confirms: [], tasks: [], stats: 0, blobs: [] };
  const appData = { reintegrationArchive: archive };
  const sandbox = {
    console, Date: FixedDate, document: dom.document, setTimeout: () => 0, appData, Blob,
    URL: { createObjectURL: (b) => { log.blobs.push(b); return 'blob:x'; } },
    alert: (m) => log.alerts.push(m), confirm: (m) => { log.confirms.push(m); return true; },
    saveUserKey: () => {}, updateDashboardStats: () => { log.stats++; },
    autoLogTask: (...a) => log.tasks.push(a), getInstitutionName: () => inst, userProfile: { institution: inst }, initAllAutocomplete: () => {},
    MINISTRY_LOGO_B64: '',
  };
  sandbox.window = sandbox;
  sandbox.scrollTo = () => {};
  const ctx = vm.createContext(sandbox);
  vm.runInContext(helperSrc, ctx);
  vm.runInContext(legacySrc, ctx);
  return { ctx, dom, log, appData, run: (code) => vm.runInContext(code, ctx) };
}

// ── مولّد بيانات ──
const pick = (r, a) => a[Math.floor(r() * a.length)];
const subset = (r, opts) => opts.map((o) => o[0]).filter(() => r() < 0.4);
// safe=true: بلا & < > لأن القديم يدرج القيم خاماً في تقرير HTML أما الجديد فيهرّبها (يختبر الهروب على حدة)
function randForm(r, { name = true, safe = false } = {}) {
  const t = (arr) => pick(r, arr);
  const raw = (a, b) => (safe ? a : b);
  return {
    studentName: name ? t(['  أحمد بنعلي ', raw('فاطمة الزهراء', 'فاطمة <b>الزهراء</b>'), raw('يوسف المرابط', 'يوسف & المرابط'), 'سارة']) : t(['', '   ']),
    massar: t(['', 'G1234567', ' M9 ']), school: t(['', 'إعدادية الأمل', raw(' م م ', ' م & م ')]), level: t(['', '2APIC-3', ' 1APIC-1 ']),
    reintegrationDate: t(['', '2026-10-20', '2026-10-24']), parentPhone: t(['', '0612345678']),
    absenceDuration: t(['', 'شهران', ' فصل ']), absenceStart: t(['', '2026-08-01']),
    contextNotes: t(['', 'ملاحظات\nسطر ثان', raw(' نص ', ' <i> ')]), recommendation: t(['', 'متابعة أسبوعية', raw(' توصية ', ' a<b ')]),
    gender: t(['', 'ذكر', 'أنثى']), family: t(['', ...R.FAMILY_OPTIONS.map((o) => o[0])]), semester: t(['', ...R.SEMESTER_OPTIONS.map((o) => o[0])]),
    priority: t(['', ...R.PRIORITY_OPTIONS.map((o) => o[0])]), causes: subset(r, R.CAUSE_OPTIONS), procRows: randRows(r, safe),
  };
}
function randRows(r, safe = false) {
  const rows = R.blankProcRows().map((x) => (r() < 0.5 ? { ...x, checked: true, date: pick(r, ['', '2026-10-21']), notes: pick(r, ['', ' ملاحظة ', safe ? 'ab' : 'a<b']) } : { ...x, date: pick(r, ['', '2026-10-22']), notes: pick(r, ['', '  ']) }));
  const extra = Math.floor(r() * 3);
  for (let i = 0; i < extra; i++) rows.push({ custom: true, name: pick(r, ['', '  إجراء خاص ', safe ? 'x y' : 'x & y']), checked: r() < 0.5, date: pick(r, ['', '2026-10-23']), notes: pick(r, ['', 'ن']) });
  return rows;
}
const safeEntry = (r, i) => ({ ...R.saveEntry([], randForm(r, { safe: true }), new Date(NOW.getTime() + i)).entry, id: 1760000000000 + i });

function applyForm(dom, f) {
  for (const [k, id] of Object.entries(TEXT_IDS)) dom.fields[id].value = f[k] ?? '';
  const setG = (name, vals) => dom.groups[name].forEach((e) => { e.checked = vals.includes(e.value); });
  setG('r_gender', f.gender ? [f.gender] : []); setG('r_family', f.family ? [f.family] : []); setG('r_semester', f.semester ? [f.semester] : []);
  setG('r_priority', f.priority ? [f.priority] : []); setG('r_cause', f.causes || []);
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
const checkedOf = (dom, name) => dom.groups[name].filter((x) => x.checked).map((x) => x.value);

// ── الحفظ ──
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  test(`مطابقة للقديم: rSaveToArchive (السجل والمهمة المسجَّلة) seed=${seed}`, () => {
    const r = rngOf(seed * 97);
    const L = makeLegacy();
    let mine = [];
    for (let step = 0; step < 12; step++) {
      const f = randForm(r, { name: r() < 0.85 });
      applyForm(L.dom, f);
      const before = L.log.alerts.length;
      L.run('rSaveToArchive()');
      const res = R.saveEntry(mine, f, NOW);
      if (!res) {
        assert.equal(L.log.alerts.length, before + 1);
        assert.equal(L.log.alerts.at(-1), R.MSG.NAME_FIRST);
        assert.deepEqual(J(L.appData.reintegrationArchive), J(mine));
        continue;
      }
      mine = res.archive;
      assert.deepEqual(J(L.appData.reintegrationArchive), J(mine), 'الأرشيف بعد الخطوة ' + step);
      assert.deepEqual(J(L.log.tasks.at(-1)), J(R.taskLogArgs(res.entry)), 'معاملات سجل المهام');
    }
    assert.ok(L.log.stats >= 1);
  });
}

// ── التقرير ──
for (const seed of [11, 12, 13, 14, 15, 16, 17, 18]) {
  test(`مطابقة للقديم: rGenerateReport (HTML حرفياً + حفظ تلقائي) seed=${seed}`, () => {
    const r = rngOf(seed * 53);
    const L = makeLegacy();
    for (let step = 0; step < 10; step++) {
      const f = randForm(r, { name: r() < 0.8, safe: true });
      applyForm(L.dom, f);
      const n0 = L.appData.reintegrationArchive.length;
      const a0 = L.log.alerts.length;
      L.run('rGenerateReport()');
      assert.equal(L.dom.els.rReportContent.innerHTML, R.reportHtml(f, { logo: '' }), 'تقرير الخطوة ' + step);
      assert.equal(L.log.alerts.length, a0, 'لا تنبيه عند إنشاء التقرير (حتى بلا اسم)');
      const named = !!String(f.studentName).trim();
      assert.equal(L.appData.reintegrationArchive.length, n0 + (named ? 1 : 0), named ? 'كل إنشاء تقرير يضيف سجلاً (كالقديم)' : 'بلا اسم لا يُحفظ شيء');
    }
  });
}

test('التقرير: بلا اسم يظهر «غير مُحدد»، والشعار يدخل في src، والقيم تُهرَّب', () => {
  const f = R.reportHtml({ studentName: '', procRows: R.blankProcRows(), causes: [] }, { logo: 'data:image/png;base64,AAA' });
  assert.ok(f.includes('غير مُحدد') && f.includes('src="data:image/png;base64,AAA"'));
  const g = R.reportHtml({ studentName: 'س<script>', school: 'م&م', recommendation: '<b>', contextNotes: 'a>b', procRows: R.blankProcRows(), causes: [] });
  assert.ok(!g.includes('<script>') && g.includes('س&lt;script&gt;') && g.includes('م&amp;م') && g.includes('&lt;b&gt;') && g.includes('a&gt;b'));
});

// ── التحميل للتعديل ──
for (const seed of [21, 22, 23, 24, 25, 26]) {
  test(`مطابقة للقديم: rLoadEntry (الحقول والخيارات وجدول الإجراءات) seed=${seed}`, () => {
    const r = rngOf(seed * 41);
    const archive = Array.from({ length: 6 }, (_, i) => safeEntry(r, i));
    const base = archive[0];
    archive.push({ ...base, id: 1760000000100, massar: '—', school: '—', level: '—', gender: '—', semester: 'قيمة غريبة', priority: '—', causes: ['سبب قديم', 'أسباب صحية'], procedureRows: [{ key: 'zzz', date: '', notes: '' }, { custom: true, name: 'خاص', date: '2026-10-01', notes: 'ن' }, { key: 'support', date: '2026-10-02', notes: 'م' }] });
    // ملفات قديمة بلا procedureRows: تُحدَّد الإجراءات الثابتة بأسمائها المختصرة
    archive.push({ ...base, id: 1760000000101, procedureRows: undefined, procedures: ['جلسة الاستماع', 'وثيقة التزام', 'اسم مجهول'] });
    archive.push({ ...base, id: 1760000000102, procedureRows: [], procedures: ['متابعة ميدانية'] });
    const L = makeLegacy({ archive: J(archive) });
    for (const e of archive) {
      const prev = randForm(r);
      applyForm(L.dom, prev);
      L.run(`rLoadEntry(${e.id})`);
      const want = R.loadValues(e);
      for (const [k, id] of Object.entries(TEXT_IDS)) {
        const expected = k in want.text ? want.text[k] : (prev[k] ?? '');
        assert.equal(L.dom.fields[id].value, expected, `${k} للسجل ${e.id}`);
      }
      assert.deepEqual(checkedOf(L.dom, 'r_gender'), want.gender ? [want.gender] : []);
      assert.deepEqual(checkedOf(L.dom, 'r_semester'), want.semester ? [want.semester] : []);
      assert.deepEqual(checkedOf(L.dom, 'r_priority'), want.priority ? [want.priority] : []);
      assert.deepEqual(checkedOf(L.dom, 'r_cause'), want.causes);
      assert.deepEqual(checkedOf(L.dom, 'r_family'), prev.family ? [prev.family] : [], 'الوضع الأسري لا يُمسّ');
      assert.deepEqual(readRows(L.dom), mineRows(R.procRowsForLoad(e, prev.procRows)), 'جدول الإجراءات للسجل ' + e.id);
      assert.equal(L.dom.els.rEditBar.dataset.editId, e.id);
    }
  });
}

// ── التحديث ──
for (const seed of [31, 32, 33, 34, 35, 36]) {
  test(`مطابقة للقديم: rUpdateEntry (الاستبدال/الإضافة/التحقق/المسح بعده) seed=${seed}`, () => {
    const r = rngOf(seed * 29);
    const archive = Array.from({ length: 5 }, (_, i) => safeEntry(r, i));
    const L = makeLegacy({ archive: J(archive) });
    let mine = J(archive);
    for (let step = 0; step < 10; step++) {
      const target = r() < 0.8 ? pick(r, mine).id : 999999;
      const f = randForm(r, { name: r() < 0.85 });
      applyForm(L.dom, f);
      L.dom.els.rEditBar.dataset.editId = String(target);
      const a0 = L.log.alerts.length;
      L.run('rUpdateEntry()');
      const res = R.updateEntry(mine, target, f, NOW);
      if (!res) { assert.equal(L.log.alerts.at(-1), R.MSG.NAME_FIRST); assert.equal(L.log.alerts.length, a0 + 1); }
      else { mine = res.archive; assert.equal(L.log.alerts.at(-1), R.MSG.UPDATED(String(f.studentName).trim())); }
      assert.deepEqual(J(L.appData.reintegrationArchive), J(mine), 'الأرشيف بعد التحديث ' + step);
      if (res) {
        assert.ok(Object.values(L.dom.fields).every((e) => e.value === ''));
        assert.ok(Object.values(L.dom.groups).flat().every((e) => !e.checked));
        assert.deepEqual(readRows(L.dom), mineRows(R.blankProcRows()));
      }
    }
  });
}

// ── الأرشيف: العرض والبحث والترتيب والعدّ ──
function parseList(html) {
  const rows = html.split('<tr>').slice(2);
  const cells = (tr) => [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
  const strip = (x) => x.replace(/<[^>]+>/g, '').trim();
  return rows.map((tr) => {
    const c = cells(tr);
    const multi = c[1].match(/🔁 (\d+) ملفات/);
    return { n: strip(c[0]), name: strip(c[1].split('<br>')[0]), multi: multi ? Number(multi[1]) : 0, school: strip(c[2]), level: strip(c[3]), date: strip(c[4]), duration: strip(c[5]), priority: strip(c[6]), status: strip(c[7]), history: c[8].includes('📋 السجل') };
  });
}
for (const seed of [41, 42, 43, 44]) {
  test(`مطابقة للقديم: renderRArchive (الترتيب والبحث والعدّاد والإحصاءات) seed=${seed}`, () => {
    const r = rngOf(seed * 17);
    const names = ['أحمد بنعلي', 'فاطمة الزهراء', 'يوسف المرابط', 'سارة', 'AHMED Said'];
    const archive = Array.from({ length: 10 }, (_, i) => ({ ...safeEntry(r, i), studentName: pick(r, names), school: pick(r, ['مدرسة أ', 'مدرسة ب', '—']), priority: pick(r, ['عاجلة', 'عالية', 'متوسطة', 'عادية', '—']), reintegrationDate: pick(r, ['—', '2026-10-01', '2026-10-05', '2026-09-20']) }));
    const L = makeLegacy({ archive: J(archive) });
    for (const q of ['', ' ', 'أحمد', 'ahmed', '  سارة ', 'مدرسة ب', 'لا يوجد']) {
      L.dom.els.rArchiveSearch = { value: q };
      L.run('renderRArchive()');
      assert.equal(L.dom.els.rArchiveCount.textContent, archive.length);
      const urgent = R.urgentCount(archive);
      assert.equal(L.dom.els.rArchiveStats.innerHTML.includes('حالات عاجلة'), urgent > 0);
      assert.ok(L.dom.els.rArchiveStats.innerHTML.includes(`<strong>${archive.length}</strong>`));
      const shown = R.sortArchive(R.filterArchive(archive, q));
      const html = L.dom.els.rArchiveList.innerHTML;
      if (!shown.length) { assert.ok(html.includes(q.trim() ? '🔍 لا توجد نتائج.' : '📂 لا توجد ملفات محفوظة بعد.')); continue; }
      const counts = R.studentCounts(archive);
      const mine = shown.map((e, i) => {
        const c = R.countFor(counts, e);
        return { n: String(i + 1), name: '👤 ' + e.studentName, multi: c > 1 ? c : 0, school: e.school || '—', level: e.level || '—', date: '📅 ' + (e.reintegrationDate || '—'), duration: e.absenceDuration || '—', priority: e.priority && e.priority !== '—' ? '● ' + e.priority : '—', status: e.currentStatus || '—', history: c > 1 };
      });
      assert.deepEqual(parseList(html), mine, 'بحث «' + q + '»');
    }
  });
}

test('مطابقة للقديم: deleteREntry وclearRArchive (النصوص والنتائج)', () => {
  const r = rngOf(5);
  const archive = Array.from({ length: 5 }, (_, i) => safeEntry(r, i));
  const L = makeLegacy({ archive: J(archive) });
  L.run(`deleteREntry(${archive[2].id})`);
  assert.equal(L.log.confirms.at(-1), R.MSG.CONFIRM_DELETE);
  assert.deepEqual(J(L.appData.reintegrationArchive), J(R.deleteEntry(archive, archive[2].id)));
  const n = L.log.confirms.length;
  L.run(`deleteREntry(${archive[0].id}, true)`);
  assert.equal(L.log.confirms.length, n, 'skipConfirm يتجاوز التأكيد (يُستعمل من نافذة السجل)');
  L.run('clearRArchive()');
  assert.equal(L.log.confirms.at(-1), R.MSG.CONFIRM_CLEAR_ARCHIVE(3));
  assert.deepEqual(J(L.appData.reintegrationArchive), []);
  L.run('clearRArchive()');
  assert.equal(L.log.alerts.at(-1), R.MSG.EMPTY_ARCHIVE);
});

test('مطابقة للقديم: exportRArchiveCSV (المحتوى الحرفي واسم الملف)', async () => {
  const r = rngOf(7);
  const archive = Array.from({ length: 6 }, (_, i) => ({ ...safeEntry(r, i), recommendation: pick(r, ['', 'نص "مقتبس"', 'سطر\nثان']) }));
  const L = makeLegacy({ archive: J(archive) });
  L.run('exportRArchiveCSV()');
  // Blob.text() يحذف علامة BOM عند فك الترميز، فنفكّ البايتات مع إبقائها
  const csv = new TextDecoder('utf-8', { ignoreBOM: true }).decode(await L.log.blobs.at(-1).arrayBuffer());
  assert.ok(csv.startsWith('\uFEFF'));
  assert.equal(csv, R.archiveCsv(archive));
  assert.equal(L.dom.els.__downloaded.download, R.csvFileName(NOW));
  const E = makeLegacy({ archive: [] });
  E.run('exportRArchiveCSV()');
  assert.equal(E.log.alerts.at(-1), R.MSG.EMPTY_CSV);
});

test('مطابقة للقديم: rClearAll (تأكيد + مسح كل شيء + المؤسسة)', () => {
  const r = rngOf(9);
  const L = makeLegacy({ inst: 'إعدادية الأمل' });
  applyForm(L.dom, randForm(r));
  L.run('rClearAll()');
  assert.equal(L.log.confirms.at(-1), R.MSG.CONFIRM_CLEAR_ALL);
  const fields = Object.fromEntries(Object.entries(TEXT_IDS).map(([k, id]) => [k, L.dom.fields[id].value]));
  assert.deepEqual(fields, { ...Object.fromEntries(Object.keys(TEXT_IDS).map((k) => [k, ''])), school: 'إعدادية الأمل' });
  assert.ok(Object.values(L.dom.groups).flat().every((e) => !e.checked));
  assert.deepEqual(readRows(L.dom), mineRows(R.blankProcRows()));
});

// ── الاقتراحات الجاهزة والإجراءات ──
test('الاقتراحات الجاهزة مطابقة للقديم (R_SUGG) وإضافتها للنص كما في appendSuggest', () => {
  const L = makeLegacy();
  const old = J(L.run('R_SUGG'));
  assert.deepEqual(old.r_contextNotes, J(R.R_SUGG.contextNotes));
  assert.deepEqual(old.r_recommendation, J(R.R_SUGG.recommendation));
  assert.equal(R.appendSuggestion('', 'ن'), 'ن');
  assert.equal(R.appendSuggestion('  ', 'ن'), 'ن');
  assert.equal(R.appendSuggestion('أ  \n', 'ن'), 'أ\nن');
});

test('الإجراءات الستة مطابقة للقديم (R_PROCS: المفتاح والاسم والمختصر)', () => {
  const L = makeLegacy();
  assert.deepEqual(J(L.run('R_PROCS')), R.R_PROCS.map(({ key, arch, name }) => ({ key, arch, name })));
});

test('iAutoCheck: الكتابة تحدّد الصف ولا تُلغي التحديد أبداً', () => {
  let rows = R.blankProcRows();
  rows = R.editProcRow(rows, 0, 'notes', 'ن');
  assert.equal(rows[0].checked, true);
  rows = R.editProcRow(rows, 0, 'notes', '');
  assert.equal(rows[0].checked, true, 'مسح النص لا يُلغي التحديد');
  rows = R.editProcRow(rows, 1, 'notes', '   ');
  assert.equal(rows[1].checked, false, 'مسافات فقط لا تحدّد');
  rows = R.editProcRow(rows, 2, 'date', '2026-10-01');
  assert.equal(rows[2].checked, true);
  rows = R.editProcRow(rows, 0, 'checked', false);
  assert.equal(rows[0].checked, false);
  assert.equal(R.editProcRow([R.newCustomRow()], 0, 'name', 'إجراء')[0].checked, true);
});

test('rRestoreProcRows: يمسح تواريخ الثابتة وملاحظاتها ولا يُلغي تحديدها (سلوك قديم محفوظ)', () => {
  const cur = R.blankProcRows().map((x, i) => ({ ...x, checked: i < 2, date: '2026-01-01', notes: 'قديم' }));
  cur.push({ custom: true, name: 'مخصص قديم', checked: true, date: '', notes: '' });
  const rows = R.procRowsForLoad({ procedureRows: [{ key: 'support', date: '2026-10-02', notes: 'م' }] }, cur);
  assert.equal(rows.length, 6, 'المخصَّصة القديمة تُحذف');
  assert.deepEqual(rows.map((r) => r.checked), [true, true, false, false, true, false]);
  assert.deepEqual(rows.map((r) => r.date), ['', '', '', '', '2026-10-02', '']);
});

test('procDetails: المخصَّص بلا اسم يُهمَل ولو كان محدداً، والثابت غير المحدد يُهمَل ولو كتب فيه', () => {
  const rows = R.blankProcRows();
  rows[0] = { ...rows[0], checked: true, date: '2026-10-01', notes: '  س  ' };
  rows[1] = { ...rows[1], checked: false, notes: 'x' };
  rows.push({ custom: true, name: '   ', checked: true, date: '', notes: 'ن' });
  rows.push({ custom: true, name: ' خاص ', checked: false, date: '', notes: '' });
  assert.deepEqual(R.procDetails(rows), [
    { key: 'listening', name: 'جلسة الاستماع مع التلميذ(ة)', date: '2026-10-01', notes: 'س' },
    { custom: true, name: 'خاص', date: '', notes: '' },
  ]);
  assert.deepEqual(R.procNames(rows), ['جلسة الاستماع', 'خاص']);
});

test('الترتيب: الأسباب بترتيب النموذج لا بترتيب النقر', () => {
  const f = { studentName: 'س', causes: ['تأثير الأقران', 'أسباب صحية'], procRows: R.blankProcRows() };
  assert.deepEqual(R.saveEntry([], f, NOW).entry.causes, ['أسباب صحية', 'تأثير الأقران']);
  assert.ok(R.reportHtml(f).includes('أسباب صحية / تأثير الأقران'));
});
