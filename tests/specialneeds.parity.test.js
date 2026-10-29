// اختبار مطابقة «وضعية إعاقة وصعوبات التعلم»: نشغّل كتلة الإعاقة القديمة (النسخة المجمَّدة للمرحلة 26) في بيئة معزولة بـDOM مُحاكى،
// ونقارن نتائجها بدوال src/specialneeds/specialNeedsLogic.js على بيانات عشوائية بذرة ثابتة.
// الانحرافان المقصودان عن القديم يُختبران صراحةً في آخر الملف:
//   ١) تعديل ملف يحفظ جلسات التتبع والمتابعة القادمة والأولوية (القديم كان يمحوها)
//   ٢) بطاقة المتابعة المنزَّلة تُهرِّب الأحرف الخاصة (القديم يدرجها خاماً)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as S from '../src/specialneeds/specialNeedsLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/specialneeds.step26.js', import.meta.url), 'utf8');
const template = fs.readFileSync(new URL('./fixtures/specialneeds.template.step26.html', import.meta.url), 'utf8');
const script10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8')
  + '\n' + fs.readFileSync(new URL('./fixtures/helpers.step45.js', import.meta.url), 'utf8'); // + الدوال المساعدة القديمة المجمَّدة (حُذفت من script-10 في المرحلة 46)
// printLogoImg القديمة انتقلت في المرحلة 34 إلى src/settings؛ نقارن بنسختها المجمَّدة
const logoLegacy = fs.readFileSync(new URL('./fixtures/logo.apply.step34.js', import.meta.url), 'utf8');
const NOW = new Date(2026, 9, 25, 11, 30);
const DIRECTORATE = 'مديرية الحي الحسني';
const J = (x) => JSON.parse(JSON.stringify(x));
function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }

// الدوال المساعدة المشتركة تؤخذ من script-10.js الحقيقي لا من نسخة مكتوبة هنا
const helperSrc = [/^function iEsc\(t\).*$/m].map((re) => script10.match(re)[0]).join('\n') + '\n'
  + script10.match(/function iAutoCheck\(inp\) \{[\s\S]*?\n\}/)[0] + '\n'
  + logoLegacy.match(/function printLogoImg\(maxH\) \{[\s\S]*?\n\}/)[0];

const TEXT_IDS = { studentName: 'sn_studentName', massar: 'sn_studentMassar', school: 'sn_school', parentPhone: 'sn_parentPhone', recordDate: 'sn_recordDate', diagnosis: 'sn_diagnosis', recommendation: 'sn_recommendation' };
const GROUPS = {
  sn_gender: S.GENDER_OPTIONS, sn_category: S.CATEGORY_OPTIONS, sn_has_report: S.HAS_REPORT_OPTIONS, sn_referral: S.REFERRAL_OPTIONS,
  sn_current_status: S.CURRENT_STATUS_OPTIONS, sn_adaptations: S.ADAPTATION_OPTIONS,
};
const RADIO_KEY = { sn_gender: 'gender', sn_category: 'category', sn_has_report: 'hasReport', sn_referral: 'referral', sn_current_status: 'currentStatus' };
const LEVELS = ['1APIC-1', '2APIC-3', '3APIC-2'];

// ── DOM مُحاكى بالقدر الذي تستعمله دوال الإعاقة القديمة ──
function makeDom() {
  const mk = (extra = {}) => ({ value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, ...extra });
  const fields = {};
  Object.values(TEXT_IDS).forEach((id) => { fields[id] = mk(); });
  fields.sn_level = mk({ options: [{ value: '' }, ...LEVELS.map((value) => ({ value }))] });
  const groups = {};
  for (const [name, opts] of Object.entries(GROUPS)) groups[name] = opts.map((o) => mk({ value: o[0], checked: false, type: name === 'sn_adaptations' ? 'checkbox' : 'radio' }));
  const rows = [];
  const makeRow = (dataset) => {
    const r = { dataset, cb: { type: 'checkbox', checked: false }, date: { type: 'date', value: '' }, note: { value: '' }, nameInput: dataset.custom ? { value: '' } : null };
    r.querySelector = (sel) => (sel === 'input[type=checkbox]' ? r.cb : sel === 'input[type=date]' ? r.date : sel === '.iproc-note' ? r.note : sel === '.iproc-name' ? r.nameInput : null);
    r.closest = () => r;
    r.remove = () => { const i = rows.indexOf(r); if (i >= 0) rows.splice(i, 1); };
    Object.defineProperty(r, 'innerHTML', { set() { r.nameInput = { value: '' }; }, get: () => '' });
    return r;
  };
  S.SN_PROCS.forEach((p) => rows.push(makeRow({ key: p.key })));
  const els = {};
  const downloads = [];
  const byName = (name) => groups[name] || [];
  const document = {
    getElementById: (id) => fields[id] || (els[id] ??= mk()),
    createElement: (tag) => {
      if (tag === 'a') { const a = mk(); a.click = () => downloads.push({ download: a.download, blob: a.href }); a.remove = () => {}; return a; }
      return makeRow({});
    },
    body: { appendChild() {} },
    querySelectorAll(sel) {
      let m;
      if (sel === '#sn-summary-table tbody tr') return rows.slice();
      if (sel === '#sn-summary-table tbody tr[data-custom]') return rows.filter((r) => r.dataset.custom);
      if (sel === '#sn-summary-table input') return rows.flatMap((r) => [r.cb, r.date, r.note, r.nameInput].filter(Boolean));
      if (sel.startsWith('#toolSpecialNeeds input[type=text]')) return [...Object.values(TEXT_IDS).map((id) => fields[id]), ...rows.flatMap((r) => [r.date, r.note, r.nameInput].filter(Boolean))];
      if (sel.startsWith('#toolSpecialNeeds input[type=radio]')) return [...Object.values(groups).flat(), ...rows.map((r) => r.cb)];
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).filter((e) => e.checked);
      if ((m = sel.match(/^input\[name="(\w+)"\]$/))) return byName(m[1]);
      if (sel === '.bb-avatar' || sel === '.bb-name' || sel === '#ministry-logo-img') return [];
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
    querySelector(sel) {
      let m;
      if (sel === '#sn-summary-table tbody') return { appendChild: (tr) => rows.push(tr) };
      if ((m = sel.match(/^#sn-summary-table tbody tr\[data-key="(\w+)"\]$/))) return rows.find((r) => r.dataset.key === m[1]) || null;
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).find((e) => e.checked) || null;
      if (sel === '#toolSpecialNeeds .main-container') return { insertBefore() {}, firstChild: null };
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
  };
  return { fields, groups, rows, els, downloads, document, makeRow };
}

function makeLegacy({ archive = [], inst = '', logo = '' } = {}) {
  const dom = makeDom();
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const log = { alerts: [], confirms: [], tasks: [], saves: 0 };
  const appData = { specialNeedsArchive: archive };
  class Blob { constructor(parts, opts) { this.parts = parts; this.type = opts && opts.type; } }
  const sandbox = {
    console, Date: FixedDate, document: dom.document, setTimeout: () => 0, appData, Blob,
    URL: { createObjectURL: (b) => b, revokeObjectURL() {} },
    alert: (m) => log.alerts.push(m), confirm: (m) => { log.confirms.push(m); return true; },
    saveUserKey: () => { log.saves++; },
    autoLogTask: (...a) => log.tasks.push(a), getInstitutionName: () => inst, initAllAutocomplete: () => {},
    getDirectorate: () => DIRECTORATE, userProfile: {}, currentUser: 'u', MINISTRY_LOGO_B64: logo,
  };
  sandbox.window = sandbox; // كالمتصفح: window هو الكائن العام (وsnSaveToArchiveSilent تعتمد على ذلك)
  sandbox.scrollTo = () => {};
  const ctx = vm.createContext(sandbox);
  vm.runInContext(helperSrc, ctx);
  vm.runInContext(legacySrc, ctx);
  return { ctx, dom, log, appData, run: (code) => vm.runInContext(code, ctx) };
}

// ── مولّد بيانات ──
const pick = (r, a) => a[Math.floor(r() * a.length)];
const subset = (r, opts) => opts.map((o) => o[0]).filter(() => r() < 0.4);
function randRows(r) {
  const rows = S.blankProcRows().map((x) => (r() < 0.5 ? { ...x, checked: true, date: pick(r, ['', '2026-10-21']), notes: pick(r, ['', ' ملاحظة ', 'a<b']) } : { ...x, date: pick(r, ['', '2026-10-22']), notes: pick(r, ['', '  ']) }));
  const extra = Math.floor(r() * 3);
  for (let i = 0; i < extra; i++) rows.push({ custom: true, name: pick(r, ['', '  إجراء خاص ', 'x & y']), checked: r() < 0.5, date: pick(r, ['', '2026-10-23']), notes: pick(r, ['', 'ن']) });
  return rows;
}
function randForm(r, { name = true, category = true } = {}) {
  const t = (arr) => pick(r, arr);
  return {
    studentName: name ? t(['  أحمد بنعلي ', 'فاطمة <b>الزهراء</b>', 'يوسف & المرابط', 'سارة']) : t(['', '   ']),
    massar: t(['', 'G1234567', ' M9 ']), school: t(['', 'إعدادية الأمل', ' م & م ']), level: t(['', ...LEVELS]),
    gender: t(['', 'ذكر', 'أنثى']), parentPhone: t(['', '0612345678']), recordDate: t(['', '2026-10-20', '2026-10-24']),
    category: category ? t(S.CATEGORY_OPTIONS.map((o) => o[0])) : '',
    diagnosis: t(['', 'تشخيص\nسطر ثان', ' <script> ']),
    hasReport: t(['', ...S.HAS_REPORT_OPTIONS.map((o) => o[0])]), referral: t(['', ...S.REFERRAL_OPTIONS.map((o) => o[0])]),
    adaptations: subset(r, S.ADAPTATION_OPTIONS), currentStatus: t(['', ...S.CURRENT_STATUS_OPTIONS.map((o) => o[0])]),
    recommendation: t(['', 'متابعة أسبوعية', ' توصية <i> ']), procRows: randRows(r),
  };
}
const safeEntry = (r, i) => ({ ...S.saveEntry([], randForm(r), new Date(NOW.getTime() + i)).entry, id: 1760000000000 + i });

// تطبيق نموذج على DOM القديم
function applyForm(dom, f) {
  for (const [k, id] of Object.entries(TEXT_IDS)) dom.fields[id].value = f[k] ?? '';
  dom.fields.sn_level.value = f.level || '';
  const setG = (name, vals) => dom.groups[name].forEach((e) => { e.checked = vals.includes(e.value); });
  for (const [name, key] of Object.entries(RADIO_KEY)) setG(name, f[key] ? [f[key]] : []);
  setG('sn_adaptations', f.adaptations || []);
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
const checked = (dom, name) => dom.groups[name].filter((x) => x.checked).map((x) => x.value);

// ── ثوابت النموذج مطابقة للقالب القديم حرفياً ──
test('الثوابت: أسماء الإجراءات مطابقة لـSN_PROCS القديمة', () => {
  const L = makeLegacy();
  assert.deepEqual(J(S.SN_PROCS.map((p) => ({ key: p.key, name: p.name }))), J(L.run('SN_PROCS')));
});

test('الثوابت: تسميات الإجراءات وأمثلة الملاحظات مطابقة للجدول القديم', () => {
  const found = [...template.matchAll(/<tr data-key="(\w+)">[\s\S]*?<td class="nm">([^<]*)<\/td>[\s\S]*?placeholder="([^"]*)"/g)].map((m) => ({ key: m[1], label: m[2].trim(), ph: m[3] }));
  assert.deepEqual(S.SN_PROCS.map((p) => ({ key: p.key, label: p.label, ph: p.ph })), found);
});

// التصنيفات جدول لا مجموعة labels فتُختبر في الاختبار التالي
for (const [name, opts] of Object.entries(GROUPS).filter(([n]) => n !== 'sn_category')) {
  test(`الثوابت: خيارات ${name} (القيم والتسميات وترتيبها) مطابقة للقالب القديم`, () => {
    const found = [...template.matchAll(new RegExp(`<label><input type="(?:radio|checkbox)" name="${name}" value="([^"]*)">\\s*([^<]*)</label>`, 'g'))].map((m) => [m[1], m[2].trim()]);
    assert.deepEqual(opts, found);
  });
}

test('الثوابت: تصنيفات الوضعية (جدول الاختيار) مطابقة للقالب القديم', () => {
  const found = [...template.matchAll(/<input type="radio" name="sn_category" value="([^"]*)"><\/td>\s*<td class="nm">([^<]*)<\/td>/g)].map((m) => [m[1], m[2].trim()]);
  assert.deepEqual(S.CATEGORY_OPTIONS, found);
});

test('الثوابت: أزرار الاقتراحات السريعة ونتائج المتابعة مطابقة للقالب القديم', () => {
  const chips = (id) => [...template.matchAll(new RegExp(`appendSuggest\\('${id}','([^']*)'\\)">([^<]*)</button>`, 'g'))].map((m) => [m[2].trim(), m[1]]);
  assert.deepEqual(S.DIAGNOSIS_CHIPS, chips('sn_diagnosis'));
  assert.deepEqual(S.RECOMMENDATION_CHIPS, chips('sn_recommendation'));
  const results = [...template.slice(template.indexOf('id="snTrackResult"')).matchAll(/<option value="([^"]+)">/g)].slice(0, 6).map((m) => m[1]);
  assert.deepEqual(S.TRACK_RESULTS, results);
});

// ── iAutoCheck ──
test('الكتابة في خانة صف تحدّد مربعه ولا تُلغي التحديد (iAutoCheck)', () => {
  const L = makeLegacy();
  const row = L.dom.rows[0];
  const inp = { value: '  ', closest: () => row };
  L.run('iAutoCheck')(inp);
  assert.equal(row.cb.checked, false);
  inp.value = 'x';
  L.run('iAutoCheck')(inp);
  assert.equal(row.cb.checked, true);
  let rows = S.blankProcRows();
  assert.equal(S.editProcRow(rows, 0, 'notes', '  ')[0].checked, false);
  assert.equal(S.editProcRow(rows, 0, 'notes', 'x')[0].checked, true);
  rows = S.editProcRow(rows, 0, 'checked', true);
  assert.equal(S.editProcRow(rows, 0, 'notes', '')[0].checked, true, 'مسح الملاحظة لا يلغي التحديد');
});

// ── الحفظ ──
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  test(`مطابقة للقديم: snSaveToArchive (السجل والمهمة المسجَّلة والتنبيهات) seed=${seed}`, () => {
    const r = rngOf(seed * 97);
    const L = makeLegacy();
    let mine = [];
    for (let step = 0; step < 14; step++) {
      const f = randForm(r, { name: r() < 0.85, category: r() < 0.85 });
      applyForm(L.dom, f);
      const before = L.log.alerts.length;
      L.run('snSaveToArchive()');
      const res = S.saveEntry(mine, f, NOW);
      if (res.error) {
        assert.equal(L.log.alerts.length, before + 1);
        assert.equal(L.log.alerts.at(-1), res.error === 'name' ? S.MSG.NAME_FIRST : S.MSG.CATEGORY_FIRST);
        assert.deepEqual(J(L.appData.specialNeedsArchive), J(mine));
        continue;
      }
      mine = res.archive;
      assert.deepEqual(J(L.appData.specialNeedsArchive), J(mine), 'الأرشيف بعد الخطوة ' + step);
      assert.deepEqual(J(L.log.tasks.at(-1)), J(S.taskLogArgs(res.entry)), 'معاملات سجل المهام');
    }
  });
}

// ── التقرير ──
for (const seed of [11, 12, 13, 14, 15, 16, 17, 18]) {
  test(`مطابقة للقديم: snGenerateReport (HTML حرفياً + حفظ تلقائي صامت) seed=${seed}`, () => {
    const r = rngOf(seed * 53);
    const L = makeLegacy();
    for (let step = 0; step < 12; step++) {
      const f = randForm(r, { name: r() < 0.9, category: r() < 0.8 });
      applyForm(L.dom, f);
      const n0 = L.appData.specialNeedsArchive.length;
      const a0 = L.log.alerts.length;
      L.run('snGenerateReport()');
      if (!String(f.studentName).trim()) { assert.equal(L.log.alerts.length, a0 + 1); assert.equal(L.appData.specialNeedsArchive.length, n0); continue; }
      assert.equal(L.dom.els.snReportContent.innerHTML, S.reportHtml(f, { logo: '', directorate: DIRECTORATE }), 'تقرير الخطوة ' + step);
      // الحفظ التلقائي صامت: يحفظ سجلاً جديداً إن وُجد التصنيف، وإلا لا يحفظ ولا ينبّه
      assert.equal(L.appData.specialNeedsArchive.length, n0 + (f.category ? 1 : 0));
      assert.equal(L.log.alerts.length, a0, 'الحفظ التلقائي صامت');
    }
  });
}

test('التقرير: الشعار يُدرج في src ويبقى الباقي كما هو', () => {
  const f = S.blankForm('2026-10-24', 'م');
  f.studentName = 'س';
  const base = S.reportHtml(f, { logo: '', directorate: 'م' });
  assert.equal(S.reportHtml(f, { logo: 'data:image/png;base64,AAA', directorate: 'م' }), base.replace('src=""', 'src="data:image/png;base64,AAA"'));
});

// ── التحميل للتعديل ──
for (const seed of [21, 22, 23, 24, 25, 26]) {
  test(`مطابقة للقديم: snLoadEntry (الحقول والخيارات وجدول الإجراءات) seed=${seed}`, () => {
    const r = rngOf(seed * 41);
    const archive = Array.from({ length: 6 }, (_, i) => safeEntry(r, i));
    // سجلات بقيم «—» وتصنيفات مجهولة ومفتاح إجراء مجهول وسجل قديم بلا procedureRows
    archive.push({ ...archive[0], id: 1760000000100, massar: '—', school: '—', parentPhone: '—', recordDate: '—', diagnosis: '—', gender: '—', category: 'تصنيف قديم', hasReport: '—', referral: '—', currentStatus: '—', level: 'قسم غير موجود', procedureRows: [{ key: 'zzz', name: 'x', date: '', notes: '' }, { custom: true, name: 'مخصص', date: '2026-10-01', notes: 'ن' }, { key: 'parent', date: '2026-10-02', notes: 'هاتفياً' }], adaptations: ['وثائق مبسّطة', 'قديم'] });
    const legacyShape = { ...archive[1], id: 1760000000101, level: '2APIC-3' };
    delete legacyShape.procedureRows;
    legacyShape.actions = ['تنسيق مع الإدارة', 'إجراء قديم حر', 'جلسة استماع مع التلميذ'];
    legacyShape.actionsDetails = 'تفاصيل قديمة';
    archive.push(legacyShape);
    const noDetails = { ...archive[2], id: 1760000000102 };
    delete noDetails.procedureRows;
    noDetails.actions = [];
    archive.push(noDetails);
    const L = makeLegacy({ archive: J(archive) });
    // حالة سابقة في الجدول: صفوف مخصَّصة يجب أن تُمسح عند التحميل
    applyForm(L.dom, { ...randForm(r), procRows: randRows(r) });
    for (const e of archive) {
      const levelBefore = L.dom.fields.sn_level.value;
      L.run(`snLoadEntry(${e.id})`);
      const want = S.formFromEntry(e);
      for (const [k, id] of Object.entries(TEXT_IDS)) {
        // حقل التاريخ في المتصفح يرفض القيم غير ISO فيصير فارغاً؛ المحاكي هنا نصّي فنطابق المنطق قبل هذا التطبيع
        assert.equal(L.dom.fields[id].value, want[k] ?? '', `${k} للسجل ${e.id}`);
      }
      assert.equal(L.dom.fields.sn_level.value, LEVELS.includes(want.level) ? want.level : levelBefore, 'القسم يتغيّر فقط إن وُجد خيار مطابق');
      for (const [name, key] of Object.entries(RADIO_KEY)) assert.deepEqual(checked(L.dom, name), want[key] ? [want[key]] : [], `${name} للسجل ${e.id}`);
      assert.deepEqual(checked(L.dom, 'sn_adaptations'), want.adaptations);
      assert.deepEqual(readRows(L.dom), mineRows(want.procRows), `جدول الإجراءات للسجل ${e.id}`);
      assert.equal(L.dom.els.snEditBar.dataset.editId, e.id);
    }
  });
}

// ── التحديث ──
for (const seed of [31, 32, 33, 34]) {
  test(`مطابقة للقديم: snUpdateEntry (الاستبدال بالمعرّف وإلا الإضافة) seed=${seed}`, () => {
    const r = rngOf(seed * 29);
    const archive = Array.from({ length: 5 }, (_, i) => safeEntry(r, i));
    const L = makeLegacy({ archive: J(archive) });
    let mine = archive;
    for (let step = 0; step < 8; step++) {
      const f = randForm(r, { name: r() < 0.85, category: r() < 0.8 });
      applyForm(L.dom, f);
      const id = r() < 0.85 ? pick(r, mine).id : 1760099999999; // معرّف غير موجود → يُضاف في الأول
      L.dom.els.snEditBar = { style: {}, dataset: { editId: String(id) }, classList: { contains: () => false } };
      const before = L.log.alerts.length;
      L.run('snUpdateEntry()');
      const res = S.updateEntry(mine, id, f, NOW);
      if (res.error) {
        assert.equal(L.log.alerts.length, before + 1);
        assert.equal(L.log.alerts.at(-1), S.MSG.NAME_FIRST);
        assert.deepEqual(J(L.appData.specialNeedsArchive), J(mine));
        continue;
      }
      mine = res.archive;
      assert.deepEqual(J(L.appData.specialNeedsArchive), J(mine), 'الأرشيف بعد التحديث ' + step);
      assert.equal(L.log.alerts.at(-1), S.MSG.UPDATED(String(f.studentName).trim()));
    }
  });
}

// ── الحذف والمسح والبحث والإحصاء ──
test('مطابقة للقديم: الحذف ومسح الأرشيف وتنبيه الفراغ', () => {
  const r = rngOf(7);
  const archive = Array.from({ length: 5 }, (_, i) => safeEntry(r, i));
  const L = makeLegacy({ archive: J(archive) });
  L.run(`deleteSnEntry(${archive[2].id})`);
  assert.deepEqual(J(L.appData.specialNeedsArchive), J(S.deleteEntry(archive, archive[2].id)));
  assert.equal(L.log.confirms.at(-1), S.MSG.CONFIRM_DELETE);
  L.run('clearSnArchive()');
  assert.equal(L.log.confirms.at(-1), S.MSG.CONFIRM_CLEAR_ARCHIVE(4));
  assert.deepEqual(J(L.appData.specialNeedsArchive), []);
  L.run('clearSnArchive()');
  assert.equal(L.log.alerts.at(-1), S.MSG.EMPTY_ARCHIVE);
});

test('مطابقة للقديم: البحث (الاسم أو التصنيف) والإحصاء بترتيب السجلات', () => {
  const r = rngOf(9);
  const archive = Array.from({ length: 9 }, (_, i) => ({ ...safeEntry(r, i), studentName: ['أحمد', 'ليلى', 'أحمد ياسين', 'سارة', 'Omar', 'عمر', 'ريم', 'أيوب', 'منى'][i] }));
  archive[3].priority = 'عاجلة'; archive[6].priority = 'عاجلة'; archive[7].priority = 'عادية';
  const L = makeLegacy({ archive: J(archive) });
  for (const q of ['', ' أحمد ', 'omar', 'إعاقة', 'صعوبات', 'zzz', 'TDAH', 'tdah']) {
    L.dom.fields.snArchiveSearch = { value: q };
    L.dom.els.snArchiveSearch = L.dom.fields.snArchiveSearch;
    L.run('renderSnArchive()');
    const html = L.dom.els.snArchiveList.innerHTML;
    const names = [...html.matchAll(/<strong style="color:#1d4ed8;">♿ ([^<]*)<\/strong>/g)].map((m) => m[1]);
    assert.deepEqual(names, S.filterArchive(archive, q).map((e) => e.studentName), 'بحث «' + q + '»');
    const st = S.archiveStats(archive);
    assert.equal(L.dom.els.snArchiveCount.textContent, st.total);
    assert.ok(L.dom.els.snArchiveStats.innerHTML.includes(`إجمالي الملفات: <strong>${st.total}</strong>`));
    assert.equal(L.dom.els.snArchiveStats.innerHTML.includes('حالات عاجلة'), st.urgent > 0);
    if (st.urgent) assert.ok(L.dom.els.snArchiveStats.innerHTML.includes(`حالات عاجلة: <strong>${st.urgent}</strong>`));
  }
});

// ── مسح النموذج ──
test('مطابقة للقديم: snClearAll (الحقول والخيارات وجدول الإجراءات)', () => {
  const r = rngOf(5);
  const L = makeLegacy({ inst: 'إعدادية الأمل' });
  applyForm(L.dom, randForm(r));
  L.run('snClearAll()');
  assert.equal(L.log.confirms.at(-1), S.MSG.CONFIRM_CLEAR_ALL);
  for (const [k, id] of Object.entries(TEXT_IDS)) {
    const expected = k === 'school' ? 'إعدادية الأمل' : k === 'recordDate' ? S.todayIso(NOW) : '';
    assert.equal(L.dom.fields[id].value, expected, k);
  }
  for (const name of Object.keys(GROUPS)) assert.deepEqual(checked(L.dom, name), []);
  assert.deepEqual(readRows(L.dom), mineRows(S.blankProcRows()));
});

// ── جلسات التتبع ──
test('مطابقة للقديم: إضافة جلسة تتبع (الحقول المطلوبة والتحديث والتنبيهات)', () => {
  const r = rngOf(3);
  const archive = Array.from({ length: 4 }, (_, i) => safeEntry(r, i));
  const L = makeLegacy({ archive: J(archive) });
  const id = archive[1].id;
  L.run(`snOpenTrackingCard(${id})`);
  assert.equal(L.dom.els.snTrackNextDate.value, S.defaultNextDate(archive[1]));
  let mine = archive;
  const attempts = [
    { date: '', result: '✅ تحسن ملحوظ', note: '', by: '', nextDate: '' },
    { date: '2026-10-20', result: '', note: '', by: '', nextDate: '' },
    { date: '2026-10-20', result: '🔶 لا يزال قيد المتابعة', note: '  جلسة أولى ', by: ' الأستاذ ', nextDate: '2026-11-01' },
    { date: '2026-10-27', result: '🏛️ تمت الإحالة', note: '', by: '', nextDate: '' },
  ];
  for (const a of attempts) {
    L.dom.els.snTrackDate.value = a.date; L.dom.els.snTrackResult.value = a.result; L.dom.els.snTrackNote.value = a.note;
    L.dom.els.snTrackBy.value = a.by; L.dom.els.snTrackNextDate.value = a.nextDate;
    const n = L.log.alerts.length;
    L.run('snAddTrackingLog()');
    const res = S.addTrackingLog(mine, id, a, NOW);
    if (res.error) {
      assert.equal(L.log.alerts.at(-1), res.error === 'date' ? S.MSG.TRACK_DATE : S.MSG.TRACK_RESULT);
      assert.equal(L.log.alerts.length, n + 1);
    } else {
      mine = res.archive;
      assert.equal(L.log.alerts.at(-1), S.MSG.TRACK_SAVED);
    }
    assert.deepEqual(J(L.appData.specialNeedsArchive), J(mine));
  }
  // الحذف
  const logId = mine[1].trackingLogs[0].id;
  L.run(`snDeleteTrackingLog('${logId}')`);
  assert.equal(L.log.confirms.at(-1), S.MSG.CONFIRM_DELETE_LOG);
  mine = S.deleteTrackingLog(mine, id, logId).archive;
  assert.deepEqual(J(L.appData.specialNeedsArchive), J(mine));
});

// ── بطاقة المتابعة (تنزيل HTML وWord) ──
function entryWithLogs(r) {
  // القيم بلا أحرف HTML خاصة: القديم يدرجها خاماً والجديد يهرّبها (انحراف مقصود ٢ يُختبر على حدة)
  const e = { ...safeEntry(r, 1), studentName: 'أحمد بنعلي', school: 'إعدادية الأمل', priority: 'عالية', nextFollowup: '2026-11-03' };
  e.trackingLogs = S.TRACK_RESULTS.map((result, i) => ({ id: 'L' + i, date: '2026-10-1' + i, result, note: i % 2 ? '' : 'ملاحظة ' + i, by: i % 3 ? 'المختص' : '', nextDate: i % 2 ? '2026-11-0' + i : '', savedAt: 's' }));
  e.trackingLogs.push({ id: 'L9', date: '2026-10-19', result: 'نتيجة قديمة', note: '', by: '', nextDate: '', savedAt: 's' });
  return e;
}
test('مطابقة للقديم: بطاقة المتابعة HTML بلا شعار وبالشعار', () => {
  for (const logo of ['', 'data:image/png;base64,AAA']) {
    const e = entryWithLogs(rngOf(4));
    const L = makeLegacy({ archive: [J(e)], logo });
    L.run(`snOpenTrackingCard(${e.id})`);
    L.run('snDownloadTrackingCard()');
    const dl = L.dom.downloads.at(-1);
    assert.equal(dl.download, S.trackingCardFileName(e));
    assert.equal(dl.blob.parts[0], S.trackingCardHtml(e, { logo, now: NOW }));
    assert.equal(dl.blob.type, 'text/html;charset=utf-8');
  }
});
test('مطابقة للقديم: بطاقة المتابعة بلا جلسات (HTML وWord)', () => {
  const e = { ...safeEntry(rngOf(6), 2), studentName: 'سارة', school: 'إعدادية الأمل' };
  const L = makeLegacy({ archive: [J(e)] });
  L.run(`snOpenTrackingCard(${e.id})`);
  L.run('snDownloadTrackingCard()');
  assert.equal(L.dom.downloads.at(-1).blob.parts[0], S.trackingCardHtml(e, { now: NOW }));
  L.run('snDownloadTrackingCardWord()');
  const dl = L.dom.downloads.at(-1);
  assert.equal(dl.download, S.trackingCardWordFileName(e));
  assert.deepEqual(J(dl.blob.parts), ['\ufeff', S.trackingCardWordHtml(e, { now: NOW })]);
  assert.equal(dl.blob.type, 'application/msword;charset=utf-8');
});
test('مطابقة للقديم: بطاقة المتابعة Word بجلسات وأحرف خاصة', () => {
  const e = { ...entryWithLogs(rngOf(8)), studentName: 'يوسف: "م" <x> & / \\ ن' };
  e.trackingLogs[0].note = 'a<b & "c" \'d\'';
  const L = makeLegacy({ archive: [J(e)] });
  L.run(`snOpenTrackingCard(${e.id})`);
  L.run('snDownloadTrackingCardWord()');
  const dl = L.dom.downloads.at(-1);
  assert.equal(dl.download, S.trackingCardWordFileName(e));
  assert.equal(dl.blob.parts[1], S.trackingCardWordHtml(e, { now: NOW }));
});

// ── الانحرافان المقصودان ──
test('انحراف مقصود ١: تعديل الملف يحفظ جلسات التتبع والمتابعة القادمة والأولوية', () => {
  const r = rngOf(12);
  const e = entryWithLogs(r);
  const f = randForm(r);
  f.studentName = 'اسم جديد';
  const res = S.updateEntry([e], e.id, f, NOW);
  const saved = res.archive[0];
  assert.deepEqual(saved.trackingLogs, e.trackingLogs);
  assert.equal(saved.nextFollowup, '2026-11-03');
  assert.equal(saved.priority, 'عالية');
  assert.equal(saved.studentName, 'اسم جديد');
  // وما عدا هذه الحقول فمطابق للقديم حرفياً
  const L = makeLegacy({ archive: [J(e)] });
  applyForm(L.dom, f);
  L.dom.els.snEditBar = { style: {}, dataset: { editId: String(e.id) }, classList: { contains: () => false } };
  L.run('snUpdateEntry()');
  const legacy = L.appData.specialNeedsArchive[0];
  assert.equal(legacy.trackingLogs, undefined, 'القديم يمحو الجلسات');
  assert.deepEqual(J({ ...saved, trackingLogs: undefined, nextFollowup: undefined, priority: undefined }), J({ ...legacy, trackingLogs: undefined, nextFollowup: undefined, priority: undefined }));
  // سجل بلا جلسات لا تُضاف له حقول فارغة
  const plain = safeEntry(r, 3);
  const res2 = S.updateEntry([plain], plain.id, f, NOW);
  assert.equal('trackingLogs' in res2.archive[0], false);
});

test('انحراف مقصود ٢: بطاقة المتابعة تُهرِّب الأحرف الخاصة بدل إدراجها خاماً', () => {
  const e = { ...safeEntry(rngOf(2), 1), studentName: 'أ <b>ب</b> & ج' };
  e.trackingLogs = [{ id: 'x', date: '2026-10-01', result: 'x', note: '<script>1</script>', by: '', nextDate: '' }];
  const html = S.trackingCardHtml(e, { now: NOW });
  assert.ok(!html.includes('<b>ب</b>'));
  assert.ok(!html.includes('<script>1</script>'));
  assert.ok(html.includes('أ &lt;b&gt;ب&lt;/b&gt; &amp; ج'));
});
