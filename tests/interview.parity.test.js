// اختبار مطابقة «المقابلات الفردية»: نشغّل كتلة المقابلات القديمة (النسخة المجمَّدة للمرحلة 23) في بيئة معزولة بـDOM مُحاكى،
// ونقارن نتائجها بدوال src/interview/interviewLogic.js على بيانات عشوائية بذرة ثابتة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as I from '../src/interview/interviewLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/interview.step23.js', import.meta.url), 'utf8');
const script10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8')
  + '\n' + fs.readFileSync(new URL('./fixtures/helpers.step45.js', import.meta.url), 'utf8'); // + الدوال المساعدة القديمة المجمَّدة (حُذفت من script-10 في المرحلة 46)
const NOW = new Date(2026, 9, 26, 11, 30);
const J = (x) => JSON.parse(JSON.stringify(x));
function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }

// الدوال المساعدة المشتركة تؤخذ من script-10.js الحقيقي لا من نسخة مكتوبة هنا (ما زالت موجودة فيه)
const helperSrc = [/^function val\(id\).*$/m, /^function getRadio\(name\).*$/m, /^function getChecked\(name\).*$/m, /^function iEsc\(t\).*$/m]
  .map((re) => script10.match(re)[0]).join('\n');

const TEXT_IDS = {
  studentName: 'i_studentName', massar: 'i_studentMassar', school: 'i_school', level: 'i_level', interviewDate: 'i_interviewDate',
  subject: 'i_interviewSubject', summary: 'i_interviewSummary', specialistNotes: 'i_specialist_note_text', recommendation: 'i_recommendation', parentPhone: 'i_parentPhone',
};
const GROUPS = { i_gender: I.GENDER_OPTIONS, i_family: I.FAMILY_OPTIONS, i_semester: I.SEMESTER_OPTIONS, i_priority: I.PRIORITY_OPTIONS };

// ── DOM مُحاكى بالقدر الذي تستعمله دوال المقابلات القديمة ──
function makeDom() {
  const mk = (extra = {}) => {
    const classes = new Set();
    return { value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), toggle: (c) => (classes.has(c) ? classes.delete(c) : classes.add(c)), contains: (c) => classes.has(c) }, ...extra };
  };
  const fields = {};
  Object.values(TEXT_IDS).forEach((id) => { fields[id] = mk(); });
  Object.defineProperty(fields.i_level, 'selectedIndex', { set() { fields.i_level.value = ''; }, get: () => 0 });
  const groups = {};
  for (const [name, opts] of Object.entries(GROUPS)) groups[name] = opts.map((o) => mk({ value: o[0], checked: false, type: 'radio' }));
  const rows = [];
  const makeRow = (dataset) => {
    const r = { dataset, cb: { type: 'checkbox', checked: false }, date: { type: 'date', value: '' }, note: { value: '' }, nameInput: null };
    r.querySelector = (sel) => (sel === 'input[type=checkbox]' ? r.cb : sel === 'input[type=date]' ? r.date : sel === '.iproc-note' ? r.note : sel === '.iproc-name' ? r.nameInput : null);
    r.remove = () => { const i = rows.indexOf(r); if (i >= 0) rows.splice(i, 1); };
    Object.defineProperty(r, 'innerHTML', { set() { r.nameInput = { value: '' }; }, get: () => '' });
    return r;
  };
  I.I_PROCS.forEach((p) => rows.push(makeRow({ key: p.key })));
  const els = { iEditBar: mk(), archiveSearch: mk(), archiveBody: mk(), archiveArrow: mk(), archiveCount: mk(), archiveStats: mk(), archiveList: mk(), iReportContent: mk(), interviewPrintModal: mk() };
  const chips = { kids: [] };
  els.i_summaryChips = { set innerHTML(_) { chips.kids = []; }, get innerHTML() { return ''; }, appendChild: (b) => chips.kids.push(b) };
  els.i_summaryChipsLabel = mk();
  const byName = (n) => groups[n] || [];
  const document = {
    getElementById(id) {
      const m = id.match(/^i_chk_(\w+)$/);
      if (m) return rows.find((r) => r.dataset.key === m[1])?.cb || null;
      return fields[id] || (els[id] ??= mk());
    },
    createElement: (tag) => (tag === 'a' ? { click() { els.__downloaded = this; } } : tag === 'button' ? { type: '', className: '', textContent: '', title: '' } : makeRow({})),
    querySelectorAll(sel) {
      let m;
      if (sel === '#i-summary-table tbody tr') return rows.slice();
      if (sel === '#i-summary-table tbody tr[data-custom]') return rows.filter((r) => r.dataset.custom);
      if (sel === '#i-summary-table input') return rows.flatMap((r) => [r.cb, r.date, r.note, r.nameInput].filter(Boolean));
      if (sel.startsWith('#i-summary-table tbody tr[data-key] input[type=date]')) return rows.filter((r) => r.dataset.key).flatMap((r) => [r.date, r.note]);
      if (sel.startsWith('#toolInterview input[type=text]')) {
        const withPhone = sel.includes('type=tel');
        return [...Object.values(fields).filter((e) => e !== fields.i_level && (withPhone || e !== fields.i_parentPhone)), ...rows.flatMap((r) => [r.date, r.note, r.nameInput].filter(Boolean))];
      }
      if (sel.startsWith('#toolInterview input[type=radio]')) return [...Object.values(groups).flat(), ...rows.map((r) => r.cb)];
      if (sel === '#toolInterview .procedure-details') return [];
      if (sel === '#toolInterview select') return [fields.i_level];
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).filter((e) => e.checked);
      if ((m = sel.match(/^input\[name="(\w+)"\]$/))) return byName(m[1]);
      if (sel === '#ministry-logo-img') return [];
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
    querySelector(sel) {
      let m;
      if (sel === '#i-summary-table tbody') return { appendChild: (tr) => rows.push(tr) };
      if ((m = sel.match(/^#i-summary-table tbody tr\[data-key="(\w+)"\]$/))) return rows.find((r) => r.dataset.key === m[1]) || null;
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).find((e) => e.checked) || null;
      if ((m = sel.match(/^input\[name="(\w+)"\]\[value="(.*)"\]$/))) return byName(m[1]).find((e) => e.value === m[2]) || null;
      if (sel === '#toolInterview .main-container') return { scrollTo() {}, insertBefore() {}, firstChild: null };
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
  };
  return { fields, groups, rows, els, chips, document, makeRow };
}

function makeLegacy({ archive = [], inst = '' } = {}) {
  const dom = makeDom();
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const log = { alerts: [], confirms: [], tasks: [], stats: 0, blobs: [] };
  const appData = { interviewArchive: archive };
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
// safe=true: بلا & < > لأن القديم يدرج بعض القيم خاماً في تقرير HTML أما الجديد فيهرّبها (يختبر الهروب على حدة)
function randForm(r, { name = true, safe = false } = {}) {
  const t = (arr) => pick(r, arr);
  const raw = (a, b) => (safe ? a : b);
  return {
    studentName: name ? t(['  أحمد بنعلي ', raw('فاطمة الزهراء', 'فاطمة <b>الزهراء</b>'), raw('يوسف المرابط', 'يوسف & المرابط'), 'سارة']) : t(['', '   ']),
    massar: t(['', 'G1234567', ' M9 ']), school: t(['', 'إعدادية الأمل', raw(' م م ', ' م & م ')]), level: t(['', '2APIC-3', ' 1APIC-1 ']),
    interviewDate: t(['', '2026-10-20', '2026-10-24']), subject: t(['', 'غياب متكرر', ' متابعة دورية ']), parentPhone: t(['', '0612345678']),
    summary: t(['', 'ملخص\nسطر ثان', raw(' نص ', ' <i> ')]), specialistNotes: t(['', 'ملاحظة المختص', raw(' ن ', ' a>b ')]),
    recommendation: t(['', 'متابعة أسبوعية', raw(' توصية ', ' a<b ')]),
    gender: t(['', 'ذكر', 'أنثى']), family: t(['', ...I.FAMILY_OPTIONS.map((o) => o[0])]), semester: t(['', ...I.SEMESTER_OPTIONS.map((o) => o[0])]),
    priority: t(['', ...I.PRIORITY_OPTIONS.map((o) => o[0])]), procRows: randRows(r, safe),
  };
}
function randRows(r, safe = false) {
  const rows = I.blankProcRows().map((x) => (r() < 0.5 ? { ...x, checked: true, date: pick(r, ['', '2026-10-21']), notes: pick(r, ['', ' ملاحظة ', safe ? 'ab' : 'a<b']) } : { ...x, date: pick(r, ['', '2026-10-22']), notes: pick(r, ['', 'ن']) }));
  const extra = Math.floor(r() * 3);
  for (let i = 0; i < extra; i++) rows.push({ custom: true, name: pick(r, ['', '  إجراء خاص ', safe ? 'x y' : 'x & y']), checked: r() < 0.5, date: pick(r, ['', '2026-10-23']), notes: pick(r, ['', 'ن']) });
  return rows;
}
const safeEntry = (r, i) => ({ ...I.saveEntry([], randForm(r, { safe: true }), new Date(NOW.getTime() + i)).entry, id: 1760000000000 + i });

function applyForm(dom, f) {
  for (const [k, id] of Object.entries(TEXT_IDS)) dom.fields[id].value = f[k] ?? '';
  const setG = (name, val) => dom.groups[name].forEach((e) => { e.checked = !!val && e.value === val; });
  setG('i_gender', f.gender); setG('i_family', f.family); setG('i_semester', f.semester); setG('i_priority', f.priority);
  dom.rows.splice(0, dom.rows.length);
  (f.procRows || []).forEach((p) => {
    const row = dom.makeRow(p.custom ? { custom: '1' } : { key: p.key });
    if (p.custom) row.nameInput = { value: p.name };
    row.cb.checked = !!p.checked; row.date.value = p.date || ''; row.note.value = p.notes || '';
    dom.rows.push(row);
  });
}
const readRows = (dom) => dom.rows.map((r) => (r.dataset.custom
  ? { custom: true, name: r.nameInput.value, checked: r.cb.checked, date: r.date.value, notes: r.note.value }
  : { custom: false, key: r.dataset.key, checked: r.cb.checked, date: r.date.value, notes: r.note.value }));
const mineRows = (rows) => rows.map((r) => (r.custom
  ? { custom: true, name: r.name, checked: r.checked, date: r.date, notes: r.notes }
  : { custom: false, key: r.key, checked: r.checked, date: r.date, notes: r.notes }));
const checkedOf = (dom, name) => dom.groups[name].filter((x) => x.checked).map((x) => x.value);

// ── الجداول الثابتة ──
test('مطابقة للقديم: جداول الاقتراحات وقائمة الإجراءات حرفياً', () => {
  const L = makeLegacy();
  assert.deepEqual(J(I.SUMMARY_GROUPS), J(L.run('I_SUMMARY_GROUPS')));
  assert.deepEqual(J(I.NOTE_GROUPS), J(L.run('I_NOTE_GROUPS')));
  assert.deepEqual(J(I.SUBJECT_SUGG), J(L.run('I_SUBJECT_SUGG')));
  assert.deepEqual(J(I.SUMMARY_SUGG_BY_TYPE), J(L.run('SUMMARY_SUGG_BY_TYPE')));
  assert.deepEqual(J(I.REC_CHIPS), J(L.run('I_SUGG.i_recommendation')));
  assert.deepEqual(J(I.I_PROCS.map(({ key, arch, name }) => ({ key, arch, name }))), J(L.run('I_PROCS')));
  assert.equal(I.I_PROCS.length, 10);
});

// ── اقتراحات الملخص حسب الموضوع ──
test('مطابقة للقديم: renderSummaryChips (الاقتراحات والعنوان) لكل موضوع', () => {
  const L = makeLegacy();
  const subjects = ['', undefined, '  ', 'متابعة دورية', ' صعوبات تعلمية ', 'الغياب المتكرر', 'غياب', 'ا', 'غير معروف تماماً', 'تقييم سلوكي وأكثر', 'دعم', ...I.SUBJECT_SUGG];
  for (const s of subjects) {
    L.run(`renderSummaryChips(${JSON.stringify(s)})`);
    const got = L.dom.chips.kids.map((b) => [b.textContent, b.title]);
    assert.deepEqual(got, J(I.summarySuggestionsFor(s)), 'اقتراحات «' + s + '»');
    assert.equal(L.dom.els.i_summaryChipsLabel.textContent, I.summaryChipsLabel(s), 'عنوان «' + s + '»');
  }
});

// ── الحفظ ──
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  test(`مطابقة للقديم: iSaveToArchive (السجل والمهمة المسجَّلة) seed=${seed}`, () => {
    const r = rngOf(seed * 97);
    const L = makeLegacy();
    let mine = [];
    for (let step = 0; step < 12; step++) {
      const f = randForm(r, { name: r() < 0.85 });
      applyForm(L.dom, f);
      const before = L.log.alerts.length;
      L.run('iSaveToArchive()');
      const res = I.saveEntry(mine, f, NOW);
      if (!res) {
        assert.equal(L.log.alerts.length, before + 1);
        assert.equal(L.log.alerts.at(-1), I.MSG.NAME_FIRST);
        assert.deepEqual(J(L.appData.interviewArchive), J(mine));
        continue;
      }
      mine = res.archive;
      assert.deepEqual(J(L.appData.interviewArchive), J(mine), 'الأرشيف بعد الخطوة ' + step);
      assert.deepEqual(J(L.log.tasks.at(-1)), J(I.taskLogArgs(res.entry)), 'معاملات سجل المهام');
    }
    assert.ok(L.log.stats >= 1);
  });
}

// ── التقرير ──
for (const seed of [11, 12, 13, 14, 15, 16, 17, 18]) {
  test(`مطابقة للقديم: iGenerateReport (HTML حرفياً + حفظ تلقائي صامت) seed=${seed}`, () => {
    const r = rngOf(seed * 53);
    const L = makeLegacy();
    for (let step = 0; step < 10; step++) {
      const f = randForm(r, { name: r() < 0.8, safe: true });
      applyForm(L.dom, f);
      const n0 = L.appData.interviewArchive.length;
      const a0 = L.log.alerts.length;
      L.run('iGenerateReport()');
      assert.equal(L.dom.els.iReportContent.innerHTML, I.reportHtml(f, { logo: '' }), 'تقرير الخطوة ' + step);
      assert.equal(L.log.alerts.length, a0, 'لا تنبيه عند إنشاء التقرير (حتى بلا اسم)');
      const named = !!String(f.studentName).trim();
      assert.equal(L.appData.interviewArchive.length, n0 + (named ? 1 : 0), named ? 'كل إنشاء تقرير يضيف سجلاً (كالقديم)' : 'بلا اسم لا يُحفظ شيء');
    }
  });
}

test('التقرير: بلا اسم يظهر «غير مُحدد»، والشعار يدخل في src، والقيم تُهرَّب', () => {
  const f = I.reportHtml({ studentName: '', procRows: I.blankProcRows() }, { logo: 'data:image/png;base64,AAA' });
  assert.ok(f.includes('غير مُحدد') && f.includes('src="data:image/png;base64,AAA"'));
  const g = I.reportHtml({ studentName: 'س<script>', school: 'م&م', subject: 'a>b', summary: '<u>', specialistNotes: '<b>', recommendation: '<b>', massar: '<x>', procRows: I.blankProcRows() });
  assert.ok(!g.includes('<script>') && !g.includes('<u>') && !g.includes('<x>'));
  assert.ok(g.includes('س&lt;script&gt;') && g.includes('م&amp;م') && g.includes('a&gt;b') && g.includes('&lt;u&gt;') && g.includes('&lt;x&gt;'));
});

test('التقرير: قسم الإجراءات لا يظهر إلا مع إجراء واحد على الأقل، ولا ملخص بلا نص', () => {
  const none = I.reportHtml({ studentName: 'س', procRows: I.blankProcRows() });
  assert.ok(!none.includes('الإجراءات المتخذة') && !none.includes('ملخص المقابلة') && !none.includes('ملاحظات المختص الاجتماعي'));
  const rows = I.blankProcRows(); rows[0].checked = true; rows[0].date = '2026-10-20';
  const one = I.reportHtml({ studentName: 'س', summary: 'ن', specialistNotes: 'م', procRows: rows });
  assert.ok(one.includes('الإجراءات المتخذة') && one.includes('عقد جلسات متابعة دورية') && one.includes('ملخص المقابلة') && one.includes('ملاحظات المختص الاجتماعي'));
});

// ── التحميل للتعديل ──
for (const seed of [21, 22, 23, 24, 25, 26]) {
  test(`مطابقة للقديم: iLoadEntry (الحقول والخيارات وجدول الإجراءات) seed=${seed}`, () => {
    const r = rngOf(seed * 41);
    const archive = Array.from({ length: 6 }, (_, i) => safeEntry(r, i));
    const base = archive[0];
    archive.push({ ...base, id: 1760000000100, school: '—', level: '—', interviewDate: '—', subject: '—', gender: '—', semester: 'قيمة غريبة', priority: '—', procedureRows: [{ key: 'zzz', date: '2026-01-01', notes: 'x' }, { custom: true, name: 'مخصص', date: '', notes: 'ن' }] });
    // ملفات قديمة بلا procedureRows: تُحدَّد الإجراءات الثابتة بأسمائها المختصرة
    archive.push({ ...base, id: 1760000000101, procedureRows: undefined, procedures: ['جلسات متابعة دورية', 'توقيع التزام', 'اسم مجهول'] });
    archive.push({ ...base, id: 1760000000102, summary: undefined, specialistNotes: undefined, recommendation: undefined });
    for (const e of archive) {
      const L = makeLegacy({ archive: J(archive) });
      const pre = randForm(r, { safe: true });
      applyForm(L.dom, pre);
      L.run(`iLoadEntry(${e.id})`);
      const v = I.loadValues(e);
      const expectText = { ...pre, ...v.text };
      for (const [k, id] of Object.entries(TEXT_IDS)) assert.equal(L.dom.fields[id].value, expectText[k] ?? '', `${k} للسجل ${e.id}`);
      assert.deepEqual(checkedOf(L.dom, 'i_gender'), v.gender ? [v.gender] : []);
      assert.deepEqual(checkedOf(L.dom, 'i_semester'), v.semester ? [v.semester] : []);
      assert.deepEqual(checkedOf(L.dom, 'i_priority'), v.priority ? [v.priority] : []);
      assert.deepEqual(checkedOf(L.dom, 'i_family'), pre.family ? [pre.family] : [], 'الوضع الأسري لا يُمسّ');
      assert.deepEqual(readRows(L.dom), mineRows(I.procRowsForLoad(e)), 'جدول الإجراءات للسجل ' + e.id);
      assert.equal(L.dom.els.iEditBar.dataset.editId, e.id);
    }
  });
}

// ── التعديل والحفظ ──
for (const seed of [31, 32, 33, 34]) {
  test(`مطابقة للقديم: iUpdateEntry (استبدال بالمعرّف وإلا إضافة في الأول) seed=${seed}`, () => {
    const r = rngOf(seed * 29);
    const archive = Array.from({ length: 5 }, (_, i) => safeEntry(r, i));
    const L = makeLegacy({ archive: J(archive) });
    let mine = J(archive);
    for (let step = 0; step < 8; step++) {
      const target = step % 4 === 3 ? 999 : pick(r, mine).id; // معرّف غير موجود → يُضاف في الأول
      L.dom.els.iEditBar.dataset.editId = String(target);
      const f = randForm(r, { name: r() < 0.85, safe: true });
      applyForm(L.dom, f);
      const a0 = L.log.alerts.length;
      L.run('iUpdateEntry()');
      const res = I.updateEntry(mine, target, f, NOW);
      if (!res) {
        assert.equal(L.log.alerts.at(-1), I.MSG.NAME_FIRST);
        assert.equal(L.log.alerts.length, a0 + 1);
        assert.deepEqual(J(L.appData.interviewArchive), J(mine));
        continue;
      }
      mine = res.archive;
      assert.deepEqual(J(L.appData.interviewArchive), J(mine), 'الأرشيف بعد الخطوة ' + step);
      assert.equal(L.log.alerts.at(-1), I.MSG.UPDATED(String(f.studentName).trim()));
      // iCancelEdit القديمة بعد الحفظ: تمسح الحقول لكن لا تمسح هاتف الولي (حقل tel خارج محدِّدها) — والمكوّن الجديد يحافظ على ذلك
      assert.equal(L.dom.fields.i_parentPhone.value, f.parentPhone ?? '');
      assert.equal(L.dom.fields.i_studentName.value, '');
    }
  });
}

test('مطابقة للقديم: iClearAll تمسح حتى هاتف الولي وتطلب التأكيد بنفس النص', () => {
  const r = rngOf(7);
  const L = makeLegacy({ inst: 'إعدادية الأمل' });
  applyForm(L.dom, randForm(r, { safe: true }));
  L.dom.fields.i_parentPhone.value = '0600000000';
  L.run('iClearAll()');
  assert.equal(L.log.confirms.at(-1), I.MSG.CONFIRM_CLEAR_ALL);
  for (const [k, id] of Object.entries(TEXT_IDS)) assert.equal(L.dom.fields[id].value, k === 'school' ? 'إعدادية الأمل' : '', k);
  assert.ok(Object.values(L.dom.groups).flat().every((e) => !e.checked));
  assert.ok(L.dom.rows.every((x) => !x.dataset.custom && !x.cb.checked && !x.date.value && !x.note.value));
});

// ── الأرشيف: البحث والترتيب والعدّ والمسح والتصدير ──
function bigArchive(r, n) {
  const names = ['أحمد بنعلي', 'فاطمة الزهراء', 'يوسف المرابط', 'سارة', ' سارة '];
  return Array.from({ length: n }, (_, i) => ({
    ...safeEntry(r, i), id: 1760000000000 + Math.floor(r() * 30),
    studentName: pick(r, names), school: pick(r, ['إعدادية الأمل', 'مدرسة النور', '—']), interviewDate: pick(r, ['—', '2026-10-01', '2026-10-20', '2026-10-24', '']),
    priority: pick(r, ['—', ...I.PRIORITY_OPTIONS.map((o) => o[0])]),
  })).filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i);
}
for (const seed of [41, 42, 43, 44, 45, 46]) {
  test(`مطابقة للقديم: renderArchive (البحث والترتيب وعدّادات التلميذ والحالات العاجلة) seed=${seed}`, () => {
    const r = rngOf(seed * 17);
    const archive = bigArchive(r, 14);
    for (const search of ['', '  ', 'سارة', 'الأمل', 'ZZZ', 'أحمد']) {
      const L = makeLegacy({ archive: J(archive) });
      L.dom.els.archiveSearch.value = search;
      L.run('renderArchive()');
      const html = L.dom.els.archiveList.innerHTML;
      const gotIds = [...html.matchAll(/iLoadEntry\((\d+)\)/g)].map((m) => Number(m[1]));
      const shown = I.sortArchive(I.filterArchive(archive, search));
      assert.deepEqual(gotIds, shown.map((e) => e.id), 'ترتيب الصفوف للبحث «' + search + '»');
      const counts = I.studentCounts(archive);
      assert.deepEqual([...html.matchAll(/🔁 (\d+) مقابلات/g)].map((m) => Number(m[1])), shown.map((e) => I.countFor(counts, e)).filter((c) => c > 1), 'شارات التكرار');
      assert.equal(L.dom.els.archiveCount.textContent, archive.length);
      const urgentLegacy = (L.dom.els.archiveStats.innerHTML.match(/حالات عاجلة: <strong>(\d+)/) || [])[1];
      assert.equal(urgentLegacy ? Number(urgentLegacy) : 0, I.urgentCount(archive));
      if (!shown.length) assert.ok(html.includes(search.trim() ? 'لا توجد نتائج' : 'لا توجد مقابلات محفوظة بعد'));
    }
  });
}

test('مطابقة للقديم: deleteFromArchive وclearArchive (النصوص والنتائج)', () => {
  const r = rngOf(5);
  const archive = bigArchive(r, 9);
  const L = makeLegacy({ archive: J(archive) });
  const id = archive[3].id;
  L.run(`deleteFromArchive(${id})`);
  assert.equal(L.log.confirms.at(-1), I.MSG.CONFIRM_DELETE);
  assert.deepEqual(J(L.appData.interviewArchive), J(I.deleteEntry(archive, id)));
  L.run('clearArchive()');
  assert.equal(L.log.confirms.at(-1), I.MSG.CONFIRM_CLEAR_ARCHIVE(archive.length - 1));
  assert.deepEqual(J(L.appData.interviewArchive), []);
  L.run('clearArchive()');
  assert.equal(L.log.alerts.at(-1), I.MSG.EMPTY_ARCHIVE);
});

for (const seed of [51, 52, 53]) {
  test(`مطابقة للقديم: exportArchiveExcel (CSV حرفياً واسم الملف) seed=${seed}`, async () => {
    const r = rngOf(seed * 13);
    const archive = bigArchive(r, 8).map((e, i) => ({ ...e, recommendation: i % 3 ? 'توصية "مقتبسة"' : '', nextFollowup: '—' }));
    const L = makeLegacy({ archive: J(archive) });
    L.run('exportArchiveExcel()');
    // Blob.text() يحذف علامة BOM في بداية النص، فنقرأ البايتات كما هي
    assert.equal(Buffer.from(await L.log.blobs.at(-1).arrayBuffer()).toString('utf8'), I.archiveCsv(archive));
    assert.equal(L.dom.els.__downloaded.download, I.csvFileName(NOW));
    const E = makeLegacy({ archive: [] });
    E.run('exportArchiveExcel()');
    assert.equal(E.log.alerts.at(-1), I.MSG.EMPTY_CSV);
    assert.equal(E.log.blobs.length, 0);
  });
}

// ── دوال بحتة جديدة (لا مقابل مباشر لها في الكود القديم) ──
test('جدول الإجراءات: الكتابة تحدّد الصف ولا تُلغي التحديد (iAutoCheck)', () => {
  let rows = I.blankProcRows();
  rows = I.editProcRow(rows, 0, 'notes', 'وتيرة أسبوعية');
  assert.equal(rows[0].checked, true);
  rows = I.editProcRow(rows, 0, 'notes', '');
  assert.equal(rows[0].checked, true, 'مسح النص لا يُلغي التحديد');
  rows = I.editProcRow(rows, 1, 'date', '   ');
  assert.equal(rows[1].checked, false, 'مسافات فقط لا تحدّد');
  rows = I.editProcRow(rows, 0, 'checked', false);
  assert.equal(rows[0].checked, false);
  assert.notEqual(rows, I.editProcRow(rows, 2, 'date', '2026-10-01'));
});

test('لوحة الخيارات: النقر يضيف السطر أو يحذفه، والبحث يشمل كل المجموعات', () => {
  const item = I.SUMMARY_GROUPS[0].items[0];
  const other = I.SUMMARY_GROUPS[0].items[1];
  let text = I.toggleLine('', item);
  assert.equal(text, item);
  text = I.toggleLine(text, other);
  assert.equal(text, item + '\n' + other);
  assert.deepEqual(I.usedLines(text), [item, other]);
  text = I.toggleLine(text, item);
  assert.equal(text, other, 'الحذف يزيل السطر ويُنظّف الأسطر الفارغة على الأطراف');
  assert.equal(I.toggleLine('نص حر\n', item), 'نص حر\n'.trimEnd() + '\n' + item);
  assert.deepEqual(I.optionPool(I.SUMMARY_GROUPS, 1, '   '), I.SUMMARY_GROUPS[1].items);
  const found = I.optionPool(I.SUMMARY_GROUPS, 0, 'الهدوء');
  assert.ok(found.length >= 1 && found.every((t) => t.includes('الهدوء')));
  assert.deepEqual(I.optionPool(I.NOTE_GROUPS, 0, 'لا يوجد هذا النص أبداً xyz'), []);
});

test('اقتراحات الملخص: مطابقة تامة ثم جزئية ثم الافتراضية', () => {
  assert.equal(I.summarySuggestionsFor('متابعة دورية'), I.SUMMARY_SUGG_BY_TYPE['متابعة دورية']);
  assert.equal(I.summarySuggestionsFor('جلسة متابعة دورية اليوم'), I.SUMMARY_SUGG_BY_TYPE['متابعة دورية']);
  assert.equal(I.summarySuggestionsFor(''), I.SUMMARY_SUGG_BY_TYPE._default);
  assert.equal(I.summaryChipsLabel('متابعة دورية'), '💡 اقتراحات جاهزة — متابعة دورية:');
  assert.equal(I.summaryChipsLabel('جلسة متابعة دورية اليوم'), '💡 اقتراحات جاهزة:');
});

test('الحفظ لا يضيف رقم المسار ولا الوضع الأسري ولا هاتف الولي إلى السجل (كالقديم)', () => {
  const res = I.saveEntry([], { studentName: 'س', massar: 'G1', family: 'مستقر', parentPhone: '06', procRows: I.blankProcRows() }, NOW);
  const keys = Object.keys(res.entry);
  assert.ok(!keys.includes('massar') && !keys.includes('family') && !keys.includes('parentPhone'));
  assert.equal(res.entry.id, NOW.getTime());
  assert.equal(I.saveEntry([], { studentName: '  ', procRows: [] }), null);
});
