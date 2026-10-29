// اختبار مطابقة «التلاميذ الأكثر غياباً»: نشغّل كتلة الغياب القديمة (النسخة المجمَّدة للمرحلة 21) في بيئة معزولة بـDOM مُحاكى،
// ونقارن نتائجها بدوال src/absence/absenceLogic.js على بيانات عشوائية بذرة ثابتة.
// الفروق المقصودة عن القديم (موثّقة في الاختبارات): الحقول الإضافية المحفوظة (justifiedHours/family/patterns/contextNotes/...)،
// حفظ justifiedDays/unjustifiedDays عند التعديل، رأس CSV الزائد «الحالة»، تهريب & < > في التقرير.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as A from '../src/absence/absenceLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/absence.step21.js', import.meta.url), 'utf8');
const script10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8')
  + '\n' + fs.readFileSync(new URL('./fixtures/helpers.step45.js', import.meta.url), 'utf8'); // + الدوال المساعدة القديمة المجمَّدة (حُذفت من script-10 في المرحلة 46)
const script15 = fs.readFileSync(new URL('./fixtures/legacy.script-15.step46.js', import.meta.url), 'utf8');
const NOW = new Date(2026, 9, 26, 11, 30);
const J = (x) => JSON.parse(JSON.stringify(x));
function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }
const tick = () => new Promise((r) => setTimeout(r, 0));

// الدوال المساعدة المشتركة تؤخذ من script-10.js/script-15.js الحقيقيين لا من نسخة مكتوبة هنا
const helperSrc = [/^function val\(id\).*$/m, /^function getRadio\(name\).*$/m, /^function getChecked\(name\).*$/m, /^function iEsc\(t\).*$/m]
  .map((re) => script10.match(re)[0]).join('\n')
  + '\n' + script15.match(/function acNormalize\(str\) \{[\s\S]*?\n\}/)[0];

const TEXT_IDS = {
  studentName: 'ab_studentName', massar: 'ab_studentMassar', school: 'ab_school', level: 'ab_level', parentPhone: 'ab_parentPhone', recordDate: 'ab_recordDate',
  totalHours: 'ab_totalHours', justifiedHours: 'ab_justifiedHours', unjustifiedHours: 'ab_unjustifiedHours', firstAbsenceDate: 'ab_firstAbsenceDate', lastPresenceDate: 'ab_lastPresenceDate',
  totalDays: 'ab_totalDays', justifiedDays: 'ab_justifiedDays', unjustifiedDays: 'ab_unjustifiedDays', contextNotes: 'ab_contextNotes', recommendation: 'ab_recommendation',
};
const GROUPS = { ab_gender: A.GENDER_OPTIONS, ab_family: A.FAMILY_OPTIONS, ab_semester: A.SEMESTER_OPTIONS, ab_priority: A.PRIORITY_OPTIONS, ab_cause: A.CAUSE_OPTIONS, ab_pattern: A.PATTERN_OPTIONS };
const EXTRA_IDS = ['abm_month', 'abm_view', 'abm_cls', 'abm_search', 'abm_table', 'abm_msg', 'abm_file'];

// ── DOM مُحاكى بالقدر الذي تستعمله دوال الغياب القديمة ──
function makeDom() {
  const classes = new Set();
  const mk = (extra = {}) => ({ value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, scrollIntoView() {}, classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), toggle: (c) => (classes.has(c) ? classes.delete(c) : classes.add(c)), contains: (c) => classes.has(c) }, ...extra });
  const fields = {};
  [...Object.values(TEXT_IDS), ...EXTRA_IDS].forEach((id) => { fields[id] = mk(); });
  Object.defineProperty(fields.ab_level, 'selectedIndex', { set() { fields.ab_level.value = ''; }, get: () => 0 });
  const groups = {};
  for (const [name, opts] of Object.entries(GROUPS)) groups[name] = opts.map((o) => mk({ value: o[0], checked: false, type: name.endsWith('cause') || name.endsWith('pattern') ? 'checkbox' : 'radio' }));
  const rows = [];
  const makeRow = (dataset) => {
    const r = { dataset, cb: { type: 'checkbox', checked: false }, date: { type: 'date', value: '' }, note: { value: '' }, nameInput: null };
    r.querySelector = (sel) => (sel === 'input[type=checkbox]' ? r.cb : sel === 'input[type=date]' ? r.date : sel === '.iproc-note' ? r.note : sel === '.iproc-name' ? r.nameInput : null);
    r.remove = () => { const i = rows.indexOf(r); if (i >= 0) rows.splice(i, 1); };
    Object.defineProperty(r, 'innerHTML', { set() { r.nameInput = { value: '' }; }, get: () => '' });
    return r;
  };
  A.AB_PROCS.forEach((p) => rows.push(makeRow({ key: p.key })));
  const els = { abEditBar: mk(), abArchiveBody: mk(), abArchiveArrow: mk(), abArchiveSearch: mk(), abArchiveList: mk(), abArchiveCount: mk(), abArchiveStats: mk(), abReportContent: mk(), absencePrintModal: mk() };
  const byName = (n) => groups[n] || [];
  const document = {
    getElementById(id) {
      const m = id.match(/^ab_chk_(\w+)$/);
      if (m) return rows.find((r) => r.dataset.key === m[1])?.cb || null;
      return fields[id] || (els[id] ??= mk());
    },
    createElement: (tag) => (tag === 'a' ? { click() { els.__downloaded = this; } } : makeRow({})),
    querySelectorAll(sel) {
      let m;
      if (sel === '#ab-summary-table tbody tr') return rows.slice();
      if (sel === '#ab-summary-table tbody tr[data-custom]') return rows.filter((r) => r.dataset.custom);
      if (sel === '#ab-summary-table input') return rows.flatMap((r) => [r.cb, r.date, r.note, r.nameInput].filter(Boolean));
      if (sel.startsWith('#ab-summary-table tbody tr[data-key] input[type=checkbox]')) return rows.filter((r) => r.dataset.key).map((r) => r.cb);
      if (sel.startsWith('#ab-summary-table tbody tr[data-key] input[type=date]')) return rows.filter((r) => r.dataset.key).flatMap((r) => [r.date, r.note]);
      if (sel.startsWith('#toolAbsence input[type=text]')) return [...Object.values(fields).filter((e) => e !== fields.ab_level), ...rows.flatMap((r) => [r.date, r.note, r.nameInput].filter(Boolean))];
      if (sel.startsWith('#toolAbsence input[type=radio]')) return [...Object.values(groups).flat(), ...rows.map((r) => r.cb)];
      if (sel === '#toolAbsence .procedure-details') return [];
      if (sel === '#toolAbsence select') return [fields.ab_level];
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).filter((e) => e.checked);
      if ((m = sel.match(/^input\[name="(\w+)"\]$/))) return byName(m[1]);
      if (sel === '#ministry-logo-img') return [];
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
    querySelector(sel) {
      let m;
      if (sel === '#ab-summary-table tbody') return { appendChild: (tr) => rows.push(tr) };
      if ((m = sel.match(/^#ab-summary-table tbody tr\[data-key="(\w+)"\]$/))) return rows.find((r) => r.dataset.key === m[1]) || null;
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).find((e) => e.checked) || null;
      if ((m = sel.match(/^input\[name="(\w+)"\]\[value="(.*)"\]$/))) return byName(m[1]).find((e) => e.value === m[2]) || null;
      if (sel === '#toolAbsence .main-container') return { scrollTo() {}, insertBefore() {}, firstChild: null };
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
  };
  return { fields, groups, rows, els, document, makeRow };
}

function makeLegacy({ archive = [], inst = '', user = 'u1', students = [], store = {} } = {}) {
  const dom = makeDom();
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const log = { alerts: [], confirms: [], tasks: [], stats: 0, blobs: [], fills: [], events: [], cloud: [] };
  const appData = { absenceArchive: archive };
  const localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, x) => { store[k] = String(x); } };
  const wbs = [];
  const sandbox = {
    console, Date: FixedDate, document: dom.document, setTimeout: () => 0, appData, Blob, Promise, Uint8Array, Array, JSON, Set, Object,
    URL: { createObjectURL: (b) => { log.blobs.push(b); return 'blob:x'; } },
    alert: (m) => log.alerts.push(m), confirm: (m) => { log.confirms.push(m); return true; },
    saveUserKey: () => {}, updateDashboardStats: () => { log.stats++; },
    autoLogTask: (...a) => log.tasks.push(a), getInstitutionName: () => inst, userProfile: { institution: inst }, initAllAutocomplete: () => {},
    MINISTRY_LOGO_B64: '', localStorage, currentUser: user, STUDENT_DB: students,
    storageSet: (k, x) => { log.cloud.push([k, x]); return Promise.resolve(); }, storageGet: () => Promise.resolve(null),
    Event: class { constructor(t) { this.type = t; } },
    XLSX: { read: (u8) => wbs[u8[0]], utils: { sheet_to_json: (sheet) => sheet.rows } },
    FileReader: class { readAsArrayBuffer(f) { this.onload({ target: { result: new Uint8Array([f.__wb]) } }); } },
    acFillField: (cfg, student) => log.fills.push([cfg, student]),
  };
  sandbox.window = sandbox;
  sandbox.window.dispatchEvent = (e) => log.events.push(e.type);
  sandbox.scrollTo = () => {};
  const ctx = vm.createContext(sandbox);
  vm.runInContext(helperSrc, ctx);
  vm.runInContext(legacySrc, ctx);
  const file = (name, sheets) => { wbs.push({ SheetNames: sheets.map((_, i) => 's' + i), Sheets: Object.fromEntries(sheets.map((rows, i) => ['s' + i, { rows }])) }); return { name, __wb: wbs.length - 1 }; };
  return { ctx, dom, log, appData, store, file, run: (code) => vm.runInContext(code, ctx) };
}

// ── مولّد بيانات ──
const pick = (r, a) => a[Math.floor(r() * a.length)];
const subset = (r, opts) => opts.map((o) => o[0]).filter(() => r() < 0.4);
// safe=true: بلا & < > لأن القديم يدرج القيم خاماً في تقرير HTML أما الجديد فيهرّبها (يختبر الهروب على حدة)
function randForm(r, { name = true, safe = false } = {}) {
  const t = (arr) => pick(r, arr);
  const raw = (a, b) => (safe ? a : b);
  const num = () => t(['', '12', ' 5 ', '0', '40']);
  return {
    studentName: name ? t(['  أحمد بنعلي ', raw('فاطمة الزهراء', 'فاطمة <b>الزهراء</b>'), raw('يوسف المرابط', 'يوسف & المرابط'), 'سارة']) : t(['', '   ']),
    massar: t(['', 'G1234567', ' M9 ']), school: t(['', 'إعدادية الأمل', raw(' م م ', ' م & م ')]), level: t(['', '2APIC-3', ' 1APIC-1 ']),
    parentPhone: t(['', '0612345678']), recordDate: t(['', '2026-10-20', '2026-10-24']),
    totalHours: num(), justifiedHours: num(), unjustifiedHours: num(), totalDays: num(), justifiedDays: num(), unjustifiedDays: num(),
    firstAbsenceDate: t(['', '2026-09-10']), lastPresenceDate: t(['', '2026-10-01']),
    contextNotes: t(['', 'ملاحظات\nسطر ثان', raw(' نص ', ' <i> ')]), recommendation: t(['', 'متابعة أسبوعية', raw(' توصية ', ' a<b ')]),
    gender: t(['', 'ذكر', 'أنثى']), family: t(['', ...A.FAMILY_OPTIONS.map((o) => o[0])]), semester: t(['', ...A.SEMESTER_OPTIONS.map((o) => o[0])]),
    priority: t(['', ...A.PRIORITY_OPTIONS.map((o) => o[0])]), causes: subset(r, A.CAUSE_OPTIONS), patterns: subset(r, A.PATTERN_OPTIONS), procRows: randRows(r, safe),
  };
}
function randRows(r, safe = false) {
  const rows = A.blankProcRows().map((x) => (r() < 0.5 ? { ...x, checked: true, date: pick(r, ['', '2026-10-21']), notes: pick(r, ['', ' ملاحظة ', safe ? 'ab' : 'a<b']) } : { ...x, date: pick(r, ['', '2026-10-22']), notes: pick(r, ['', '  ']) }));
  const extra = Math.floor(r() * 3);
  for (let i = 0; i < extra; i++) rows.push({ custom: true, name: pick(r, ['', '  إجراء خاص ', safe ? 'x y' : 'x & y']), checked: r() < 0.5, date: pick(r, ['', '2026-10-23']), notes: pick(r, ['', 'ن']) });
  return rows;
}
const safeEntry = (r, i) => ({ ...A.saveEntry([], randForm(r, { safe: true }), new Date(NOW.getTime() + i)).entry, id: 1760000000000 + i });

function applyForm(dom, f) {
  for (const [k, id] of Object.entries(TEXT_IDS)) dom.fields[id].value = f[k] ?? '';
  const setG = (name, vals) => dom.groups[name].forEach((e) => { e.checked = vals.includes(e.value); });
  setG('ab_gender', f.gender ? [f.gender] : []); setG('ab_family', f.family ? [f.family] : []); setG('ab_semester', f.semester ? [f.semester] : []);
  setG('ab_priority', f.priority ? [f.priority] : []); setG('ab_cause', f.causes || []); setG('ab_pattern', f.patterns || []);
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
// الحقول التي يحفظها القديم (الإضافية الجديدة تُستبعد من المقارنة)
const LEGACY_KEYS = ['id', 'savedAt', 'recordDate', 'studentName', 'massar', 'school', 'level', 'gender', 'semester', 'parentPhone', 'totalHours', 'unjustifiedHours', 'totalDays', 'justifiedDays', 'unjustifiedDays', 'causes', 'procedures', 'procedureRows', 'currentStatus', 'priority', 'recommendation', 'nextFollowup'];
const legacyView = (e) => Object.fromEntries(LEGACY_KEYS.filter((k) => k in e).map((k) => [k, e[k]]));

// ── الحفظ ──
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  test(`مطابقة للقديم: abSaveToArchive (السجل والمهمة المسجَّلة) seed=${seed}`, () => {
    const r = rngOf(seed * 97);
    const L = makeLegacy();
    let mine = [];
    for (let step = 0; step < 12; step++) {
      const f = randForm(r, { name: r() < 0.85 });
      applyForm(L.dom, f);
      const before = L.log.alerts.length;
      L.run('abSaveToArchive()');
      const res = A.saveEntry(mine, f, NOW);
      if (!res) {
        assert.equal(L.log.alerts.length, before + 1);
        assert.equal(L.log.alerts.at(-1), A.MSG.NAME_FIRST);
        assert.equal(L.appData.absenceArchive.length, mine.length);
        continue;
      }
      mine = res.archive;
      assert.deepEqual(J(L.appData.absenceArchive.map(legacyView)), J(mine.map(legacyView)), 'الأرشيف بعد الخطوة ' + step);
      assert.deepEqual(J(L.log.tasks.at(-1)), J(A.taskLogArgs(res.entry)), 'معاملات سجل المهام');
    }
    assert.ok(L.log.stats >= 1);
  });
}

test('الحقول الإضافية المحفوظة تعود عند التحميل (justifiedHours/family/patterns/contextNotes/التواريخ)', () => {
  const f = randForm(rngOf(5), { safe: true });
  const e = A.saveEntry([], { ...f, studentName: 'س', justifiedHours: '3', family: 'طلاق', patterns: ['عشوائي', 'غياب متواصل'], contextNotes: 'ن', firstAbsenceDate: '2026-09-01', lastPresenceDate: '2026-09-30', justifiedDays: '2', unjustifiedDays: '4' }, NOW).entry;
  const v = A.loadValues(e);
  assert.equal(v.text.justifiedHours, '3'); assert.equal(v.family, 'طلاق'); assert.deepEqual(v.patterns, ['غياب متواصل', 'عشوائي']);
  assert.equal(v.text.contextNotes, 'ن'); assert.equal(v.text.firstAbsenceDate, '2026-09-01'); assert.equal(v.text.lastPresenceDate, '2026-09-30');
  assert.equal(v.text.justifiedDays, '2'); assert.equal(v.text.unjustifiedDays, '4');
});

// ── التقرير ──
for (const seed of [11, 12, 13, 14, 15, 16, 17, 18]) {
  test(`مطابقة للقديم: abGenerateReport (HTML حرفياً + حفظ تلقائي) seed=${seed}`, () => {
    const r = rngOf(seed * 53);
    const L = makeLegacy();
    for (let step = 0; step < 10; step++) {
      const f = randForm(r, { name: r() < 0.8, safe: true });
      applyForm(L.dom, f);
      const n0 = L.appData.absenceArchive.length;
      const a0 = L.log.alerts.length;
      L.run('abGenerateReport()');
      assert.equal(L.dom.els.abReportContent.innerHTML, A.reportHtml(f, { logo: '' }), 'تقرير الخطوة ' + step);
      assert.equal(L.log.alerts.length, a0, 'لا تنبيه عند إنشاء التقرير (حتى بلا اسم)');
      const named = !!String(f.studentName).trim();
      assert.equal(L.appData.absenceArchive.length, n0 + (named ? 1 : 0), named ? 'كل إنشاء تقرير يضيف سجلاً (كالقديم)' : 'بلا اسم لا يُحفظ شيء');
    }
  });
}

test('التقرير: بلا اسم يظهر «غير مُحدد»، والشعار يدخل في src، والقيم تُهرَّب', () => {
  const f = A.reportHtml({ studentName: '', procRows: A.blankProcRows(), causes: [], patterns: [] }, { logo: 'data:image/png;base64,AAA' });
  assert.ok(f.includes('غير مُحدد') && f.includes('src="data:image/png;base64,AAA"') && f.includes('لم يتم اختيار أي إجراء.'));
  const g = A.reportHtml({ studentName: 'س<script>', school: 'م&م', recommendation: '<b>', contextNotes: 'a>b', totalHours: '<1>', procRows: A.blankProcRows(), causes: [], patterns: [] });
  assert.ok(!g.includes('<script>') && g.includes('س&lt;script&gt;') && g.includes('م&amp;م') && g.includes('&lt;b&gt;') && g.includes('a&gt;b') && g.includes('&lt;1&gt; سا'));
});

// ── التحميل للتعديل ──
for (const seed of [21, 22, 23, 24, 25, 26]) {
  test(`مطابقة للقديم: abLoadEntry (الحقول والخيارات وجدول الإجراءات) seed=${seed}`, () => {
    const r = rngOf(seed * 41);
    const archive = Array.from({ length: 6 }, (_, i) => safeEntry(r, i));
    const base = archive[0];
    archive.push({ ...base, id: 1760000000100, massar: '—', school: '—', level: '—', gender: '—', semester: 'قيمة غريبة', priority: '—', causes: ['سبب قديم', 'أسباب صحية'], procedureRows: [{ key: 'zzz', date: '', notes: '' }, { custom: true, name: 'خاص', date: '2026-10-01', notes: 'ن' }, { key: 'warning', date: '2026-10-02', notes: 'م' }] });
    // ملفات قديمة بلا procedureRows: تُحدَّد الإجراءات الثابتة بأسمائها المختصرة
    archive.push({ ...base, id: 1760000000101, procedureRows: undefined, procedures: ['جلسة استماع', 'وثيقة التزام', 'اسم مجهول'] });
    for (const e of archive) {
      const L = makeLegacy({ archive: J(archive) });
      // حالة قديمة مسبقة في الجدول: القديم يحذف المخصَّص ويمسح التاريخ/الملاحظات دون إلغاء التحديد
      const pre = randForm(r, { safe: true });
      applyForm(L.dom, pre);
      let mineRows = mineRows0(pre.procRows);
      L.run(`abLoadEntry(${e.id})`);
      const v = A.loadValues(e);
      for (const k of ['studentName', 'massar', 'school', 'level', 'parentPhone', 'recordDate', 'totalHours', 'unjustifiedHours', 'totalDays', 'recommendation']) {
        assert.equal(L.dom.fields[TEXT_IDS[k]].value, v.text[k], 'الحقل ' + k);
      }
      assert.deepEqual(checkedOf(L.dom, 'ab_gender'), v.gender ? [v.gender] : []);
      assert.deepEqual(checkedOf(L.dom, 'ab_semester'), v.semester ? [v.semester] : []);
      assert.deepEqual(checkedOf(L.dom, 'ab_priority'), v.priority ? [v.priority] : []);
      assert.deepEqual(checkedOf(L.dom, 'ab_cause'), v.causes);
      assert.deepEqual(readRows(L.dom), mineRows0(A.procRowsForLoad(e, pre.procRows)));
      assert.equal(L.dom.els.abEditBar.dataset.editId, e.id);
      void mineRows;
    }
  });
}
function mineRows0(rows) { return mineRows(rows); }

// ── التحديث ──
for (const seed of [31, 32, 33, 34]) {
  test(`مطابقة للقديم: abUpdateEntry (الاستبدال بالمعرّف وإلا الإضافة) seed=${seed}`, () => {
    const r = rngOf(seed * 29);
    const archive = Array.from({ length: 4 }, (_, i) => safeEntry(r, i));
    const L = makeLegacy({ archive: J(archive) });
    let mine = J(archive);
    for (let step = 0; step < 8; step++) {
      const target = r() < 0.2 ? 1759999999999 : pick(r, archive).id;
      const f = randForm(r, { name: r() < 0.85, safe: true });
      applyForm(L.dom, f);
      L.dom.els.abEditBar.dataset.editId = String(target);
      const a0 = L.log.alerts.length;
      L.run('abUpdateEntry()');
      const res = A.updateEntry(mine, target, f, NOW);
      if (!res) { assert.equal(L.log.alerts.length, a0 + 1); assert.equal(L.log.alerts.at(-1), A.MSG.NAME_FIRST); continue; }
      mine = res.archive;
      assert.equal(L.log.alerts.at(-1), A.MSG.UPDATED(res.entry.studentName));
      const got = L.appData.absenceArchive;
      assert.equal(got.length, mine.length);
      // القديم لا يحفظ justifiedDays/unjustifiedDays عند التعديل (فقدان بيانات)؛ الجديد يحفظهما
      assert.deepEqual(J(got.map((e) => { const x = legacyView(e); delete x.justifiedDays; delete x.unjustifiedDays; return x; })), J(mine.map((e) => { const x = legacyView(e); delete x.justifiedDays; delete x.unjustifiedDays; return x; })), 'الأرشيف بعد الخطوة ' + step);
      assert.equal(res.entry.justifiedDays, A.saveEntry([], f, NOW)?.entry.justifiedDays ?? res.entry.justifiedDays);
      // القديم يُفرغ النموذج بعد الحفظ (abCancelEdit)؛ نُعيد تعبئته في الخطوة التالية
    }
  });
}

// ── الحذف والمسح والبحث والتصدير ──
test('مطابقة للقديم: deleteAbEntry وclearAbArchive', () => {
  const r = rngOf(7);
  const archive = Array.from({ length: 5 }, (_, i) => safeEntry(r, i));
  const L = makeLegacy({ archive: J(archive) });
  L.run(`deleteAbEntry(${archive[2].id})`);
  assert.deepEqual(J(L.appData.absenceArchive), J(A.deleteEntry(archive, archive[2].id)));
  assert.equal(L.log.confirms.at(-1), A.MSG.CONFIRM_DELETE);
  L.run('clearAbArchive()');
  assert.equal(L.log.confirms.at(-1), A.MSG.CONFIRM_CLEAR_ARCHIVE(4));
  assert.deepEqual(J(L.appData.absenceArchive), []);
  L.run('clearAbArchive()');
  assert.equal(L.log.alerts.at(-1), A.MSG.EMPTY_ARCHIVE);
});

for (const seed of [41, 42, 43]) {
  test(`مطابقة للقديم: renderAbArchive (البحث والعدّ والعاجلة) seed=${seed}`, () => {
    const r = rngOf(seed * 13);
    const archive = Array.from({ length: 9 }, (_, i) => safeEntry(r, i));
    const L = makeLegacy({ archive: J(archive) });
    for (const q of ['', 'سارة', 'أحمد', 'الأمل', 'لا شيء', '  أحمد  ']) {
      L.dom.els.abArchiveSearch.value = q;
      L.run('renderAbArchive()');
      const mine = A.filterArchive(archive, q);
      assert.equal(L.dom.els.abArchiveCount.textContent, archive.length);
      const html = L.dom.els.abArchiveList.innerHTML;
      if (!mine.length) assert.ok(html.includes('archive-empty'));
      else {
        assert.equal((html.match(/abLoadEntry\(/g) || []).length, mine.length);
        const ids = [...html.matchAll(/abLoadEntry\((\d+)\)/g)].map((m) => Number(m[1]));
        assert.deepEqual(ids, mine.map((e) => e.id), 'الترتيب (ترتيب الحفظ)');
      }
      assert.equal(L.dom.els.abArchiveStats.innerHTML.includes('حالات عاجلة'), A.urgentCount(archive) > 0);
    }
  });
}

test('مطابقة للقديم: exportAbArchiveCSV (مع تصحيح الرأس الزائد «الحالة»)', async () => {
  const r = rngOf(9);
  const archive = Array.from({ length: 6 }, (_, i) => safeEntry(r, i));
  const L = makeLegacy({ archive: J(archive) });
  L.run('exportAbArchiveCSV()');
  assert.equal(L.log.blobs.length, 1);
  const legacyCsv = await L.log.blobs[0].text();
  assert.ok(A.archiveCsv(archive).startsWith('\uFEFF'), 'BOM للعربية في Excel');
  const mine = A.archiveCsv(archive).replace(/^\uFEFF/, ''); // Blob.text() يحذف BOM عند فك الترميز
  const split = (s) => s.split('\n');
  const [lh, ...lrows] = split(legacyCsv), [mh, ...mrows] = split(mine);
  assert.deepEqual(lrows, mrows, 'الصفوف مطابقة حرفياً');
  assert.equal(lh.split('","').length, mh.split('","').length + 1, 'القديم برأس زائد واحد');
  assert.equal(lh.replace(',"الحالة"', ''), mh);
  assert.equal(mrows[0].split('","').length, mh.split('","').length, 'عدد أعمدة الرأس = عدد أعمدة الصف');
  assert.match(A.csvFileName(NOW), /^ارشيف_التلاميذ_الاكثر_غيابا_2026-10-26\.csv$/);
  assert.equal(L.L, undefined);
  const E = makeLegacy();
  E.run('exportAbArchiveCSV()');
  assert.equal(E.log.alerts.at(-1), A.MSG.EMPTY_CSV);
});

// ── جدول الإجراءات ──
test('جدول الإجراءات: الكتابة تحدّد الصف ولا تُلغي التحديد، والمخصَّص بلا اسم لا يُحفظ', () => {
  let rows = A.blankProcRows();
  rows = A.editProcRow(rows, 0, 'notes', ' ن ');
  assert.equal(rows[0].checked, true);
  rows = A.editProcRow(rows, 0, 'notes', '');
  assert.equal(rows[0].checked, true, 'مسح النص لا يُلغي التحديد');
  rows = A.editProcRow(rows, 1, 'date', '2026-10-01');
  assert.equal(rows[1].checked, true);
  rows = [...rows, A.newCustomRow(), { ...A.newCustomRow(), name: ' خاص ', notes: 'م' }];
  const d = A.procDetails(rows);
  assert.deepEqual(d.map((x) => x.name), [A.AB_PROCS[0].name, A.AB_PROCS[1].name, 'خاص']);
  assert.deepEqual(A.procNames(rows), [A.AB_PROCS[0].arch, A.AB_PROCS[1].arch, 'خاص']);
});

// ══════════════ استيراد الغياب الشهري ══════════════
const HEAD = ['الإسم', 'النسب', 'رقم التلميذ', 'المجموع'];
function sheet({ cls = '2APIC-3', school = 'إعدادية الأمل', month = 'أكتوبر', year = '2026 / 2027', students = [] } = {}) {
  const rows = [['مؤسسة', school], ['القسم', cls], ['الشهر', month], ['السنة الدراسية', year], []];
  rows.push(['النسب', 'الإسم', 'رقم التلميذ', ...Array(31).fill('d'), 'المجموع', '', '', '']);
  rows.push(['', '', '', ...Array(31).fill(''), 'يوم', 'يوم', 'ساعة', 'ساعة']);
  students.forEach((s) => rows.push([s.fam, s.name, s.mas, ...Array(31).fill(''), s.ud, s.jd, s.uh, s.jh]));
  return rows;
}
const NAMES = [['بنعلي', 'أحمد'], ['الزهراء', 'فاطمة'], ['المرابط', 'يوسف'], ['العلوي', 'سارة'], ['إدريسي', 'ياسين']];
function randSheet(r, over = {}) {
  const students = NAMES.map(([fam, name], i) => ({ fam, name, mas: r() < 0.9 ? 'G' + (100 + i) : '', ud: pick(r, [0, 1, 2, '3,5']), jd: pick(r, [0, 1]), uh: pick(r, [0, 2, 4]), jh: pick(r, [0, 3]) }));
  return sheet({ month: pick(r, ['أكتوبر', 'نونبر', 'يناير', 'ماي', 'شتنبر', 'شهر مجهول']), cls: pick(r, ['2APIC-1', '2APIC-2', '3APIC-1']), students, ...over });
}

for (const seed of [51, 52, 53, 54, 55]) {
  test(`مطابقة للقديم: abmParse على جداول عشوائية seed=${seed}`, () => {
    const r = rngOf(seed * 17);
    const L = makeLegacy();
    for (let i = 0; i < 8; i++) {
      const rows = randSheet(r);
      L.ctx.__rows = rows;
      assert.deepEqual(J(L.run('abmParse(__rows)')), J(A.abmParse(rows)));
    }
    for (const bad of [[], [['x']], [['رقم التلميذ', 'المجموع']], [['رقم التلميذ', 'المجموع'], ['يوم']]]) {
      L.ctx.__rows = bad;
      assert.deepEqual(J(L.run('abmParse(__rows)')), J(A.abmParse(bad)));
    }
  });
}

for (const seed of [61, 62, 63, 64]) {
  test(`مطابقة للقديم: abmImport + abmRender + abmFill + الحذف seed=${seed}`, async () => {
    const r = rngOf(seed * 19);
    const students = [{ fullName: 'بنعلي أحمد', massar: 'G999', class: '2APIC-1', gender: 'ذكر' }, { fullName: 'العلوي سارة', massar: '', class: '', gender: 'أنثى' }];
    const L = makeLegacy({ students: J(students) });
    L.dom.fields.abm_month.value = '2026-10';
    let mine = {};
    // استيراد على دفعتين (الثانية تستبدل القسم نفسه في الشهر نفسه وتضيف أقساماً)
    for (let batch = 0; batch < 2; batch++) {
      const sheets = [randSheet(r), randSheet(r), randSheet(r, { cls: '' })];
      const files = [L.file('a.xlsx', [sheets[0], sheets[1]]), L.file('b.xlsx', [sheets[2], [['لا شيء']]]), L.file('c.xlsx', [[['فارغ']]])];
      const input = { files, value: 'x' };
      L.ctx.__input = input;
      L.run('abmImport(__input)');
      await tick();
      const results = [{ f: 'a.xlsx', ds: [A.abmParse(sheets[0]), A.abmParse(sheets[1])].filter((d) => d && d.cls) }, { f: 'b.xlsx', ds: [A.abmParse(sheets[2])].filter((d) => d && d.cls) }, { f: 'c.xlsx', ds: [] }];
      const m = A.mergeImports(mine, results, '2026-10');
      mine = m.data;
      assert.deepEqual(J(JSON.parse(L.store['app:abMonthly:u1'])), J(mine), 'البيانات المخزَّنة بعد الدفعة ' + batch);
      assert.equal(L.dom.fields.abm_msg.textContent, A.importMessage(m).text);
      assert.equal(L.dom.fields.abm_msg.style.color, A.importMessage(m).ok ? '#16a34a' : '#dc2626');
      assert.equal(input.value, '', 'يُفرَّغ حقل الملفات');
      assert.ok(L.log.cloud.some(([k]) => k === 'u1:abMonthly'));
      if (m.school) assert.equal(L.ctx.userProfile.institution, 'إعدادية الأمل', 'تُحفظ المؤسسة إن لم تكن مُدخلة');
    }
    // العرض: كل الأقسام × طرق العرض × البحث
    for (const cls of ['', ...A.classesOf(mine)]) {
      for (const q of ['', 'سارة', 'احمد', 'ياسين']) {
        for (const viewPick of ['', '*', '2026-10', '2026-11', 'zzz']) {
          L.dom.fields.abm_cls.value = cls; L.dom.fields.abm_view.value = viewPick; L.dom.fields.abm_search.value = q; L.dom.fields.abm_month.value = '2026-10';
          L.run('abmRender()');
          // القديم يعيد حساب قيمة القسم والفترة من القائمتين المبنيّتين، فنحسبهما بالمنطق نفسه
          const classes = A.classesOf(mine);
          const effCls = classes.includes(cls) ? cls : '';
          const months = A.monthsFor(mine, effCls);
          const effView = A.resolveView(months, viewPick, '2026-10');
          assert.equal(L.dom.fields.abm_cls.value, effCls);
          assert.equal(L.dom.fields.abm_view.value, effView);
          const rows = A.viewRows(mine, { cls: effCls, view: effView, months, query: q }).slice(0, A.MAX_ROWS);
          assert.deepEqual(J(L.run('_abmRows')), J(rows), `الصفوف: قسم=${cls} فترة=${viewPick} بحث=${q}`);
          const table = L.dom.fields.abm_table.innerHTML;
          assert.equal(table.includes('<thead>'), rows.length > 0);
          assert.equal((table.match(/abmFill\(/g) || []).length, rows.length);
        }
      }
    }
    // التعبئة من صف
    L.dom.fields.abm_cls.value = A.classesOf(mine)[0]; L.dom.fields.abm_view.value = '*'; L.dom.fields.abm_search.value = '';
    L.run('abmRender()');
    const shown = J(L.run('_abmRows'));
    for (let i = 0; i < shown.length; i++) {
      L.log.fills.length = 0;
      L.run(`abmFill(${i})`);
      const db = students.find((s) => A.acNormalize(s.fullName) === A.acNormalize(shown[i].n));
      const fv = A.fillValues(shown[i], db);
      assert.deepEqual(J(L.log.fills[0][1]), J(fv.student));
      for (const [k, val] of Object.entries(fv.numbers)) assert.equal(L.dom.fields[TEXT_IDS[k]].value, val, k);
    }
    // حذف قسم ثم الكل
    const cls = A.classesOf(mine)[0];
    L.dom.fields.abm_cls.value = cls; L.dom.fields.abm_view.value = '*';
    L.run('abmRender()');
    const viewBefore = L.dom.fields.abm_view.value; // قبل أن يعيد الحذف رسم القائمتين
    L.run('abmDeleteClass()');
    mine = A.deleteClass(mine, cls, viewBefore);
    assert.equal(L.dom.fields.abm_msg.textContent, A.MSG.DELETED_CLASS(cls));
    assert.deepEqual(J(JSON.parse(L.store['app:abMonthly:u1'])), J(mine), 'بعد حذف القسم');
    L.run('abmDeleteAll()');
    assert.deepEqual(JSON.parse(L.store['app:abMonthly:u1']), {});
    assert.equal(L.dom.fields.abm_msg.textContent, A.MSG.DELETED_ALL);
  });
}

test('deleteClass: يُسقط الأشهر التي فرغت ويُبقي بقية الأشهر', () => {
  const data = { '2026-10': [{ n: 'أ', c: 'A', th: 1 }, { n: 'ب', c: 'B', th: 1 }], '2026-11': [{ n: 'أ', c: 'A', th: 1 }], '2026-12': [{ n: 'ج', c: 'B', th: 1 }] };
  assert.deepEqual(Object.keys(A.deleteClass(data, 'A', '*')), ['2026-10', '2026-12']);
  assert.deepEqual(Object.keys(A.deleteClass(data, 'A', '2026-11')), ['2026-10', '2026-12']);
  assert.deepEqual(A.deleteClass(data, 'A', '2026-10')['2026-10'].map((o) => o.n), ['ب']);
});

test('mergeImports: لا يعدّل الأصل، ويستبدل القسم نفسه ويستعمل الشهر البديل عند غياب المفتاح', () => {
  const data = { '2026-10': [{ n: 'قديم', c: 'X', th: 1 }, { n: 'باق', c: 'Y', th: 1 }] };
  const snap = J(data);
  const ds = [{ cls: 'X', key: '', school: 'م', list: [{ n: 'جديد', c: 'X', th: 2 }] }];
  const m = A.mergeImports(data, [{ f: 'f', ds }, { f: 'bad', ds: [] }], '2026-10');
  assert.deepEqual(data, snap);
  assert.deepEqual(m.data['2026-10'].map((o) => o.n), ['باق', 'جديد']);
  assert.deepEqual(m.bad, ['bad']); assert.equal(m.school, 'م'); assert.equal(m.total, 1);
});
