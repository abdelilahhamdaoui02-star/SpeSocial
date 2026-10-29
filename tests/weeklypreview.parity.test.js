// اختبار مطابقة الخطوة 40 (نافذة معاينة وتعديل التقرير الأسبوعي): نشغّل الدوال القديمة (المجمَّدة في fixtures) على بيانات عشوائية
// مثبَّتة بالبذور: نقرأ من HTML النموذج القديم قيمه الابتدائية ونقارنها بـ initialForm، ثم نحفظ نفس القيم بالقديم والجديد
// ونقارن الأرشيف والصف المعروض، وكذلك الحذف ونص التأكيد. ثم اختبارات المخزن (فتح/حفظ/حذف) ببيئة window وهمية.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { WeeklyReport, buildPreviewRows } from '../src/weekly/weeklyReport.js';
import {
  TABS, resolveRange, filterRows, statsOf, statusBg, statusColor, priorityBadge, priorityText, rowStatus, statusOptions,
  initialForm, buildPatch, applyToRow, dynamicSections, updateArchive, removeFromArchive, deleteMessage, PRIORITIES, STATUSES,
} from '../src/weeklypreview/weeklyPreviewLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/weeklypreview.step40.js', import.meta.url), 'utf8');
const clone = (x) => JSON.parse(JSON.stringify(x));
const FROM = '2026-10-26';
const TO = '2026-11-01';

function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const maybe = (r, v) => (r() < 0.75 ? v : undefined);

// بيانات بلا علامات اقتباس ولا أقواس زاوية: القديم يبني HTML بالتجميع النصي فلا يحتمل الاقتباس داخل value="..."
const DATES = ['2026-10-26', '2026-10-27', '2026-10-29', '2026-11-01'];
const STATUS = ['مُنجز', 'قيد المتابعة', 'جارية', 'منتهية', 'مُغلق', 'مفتوحة', '', undefined];
const PRIO = ['عاجلة', 'عالية', 'متوسطة', 'عادية', '—', 'غريبة', '', undefined];
const NAMES = ['أحمد العلوي', 'سناء المنصوري', 'يوسف', ' ليلى ', '', undefined];
const TEXT = ['سلوك', 'تأخر دراسي', 'نزاع بين تلميذين', '', undefined, 'موضوع طويل'];
const VIO_STATUS = ['جارية', 'تحت المراقبة', 'مُغلقة', 'محالة', 'أخرى', 'غير معروفة', '', undefined];

function genData(seed) {
  const r = rng(seed);
  const n = (max) => Math.floor(r() * max) + 1;
  const base = (i, p, dateKey, extra = {}) => ({
    id: p + seed + '_' + i, [dateKey]: pick(r, DATES), studentName: pick(r, NAMES), school: maybe(r, 'إعدادية الأمل'), priority: pick(r, PRIO),
    nextFollowup: maybe(r, pick(r, DATES)), notes: maybe(r, pick(r, TEXT)), level: maybe(r, pick(r, ['1/1', '2/3'])), gender: maybe(r, pick(r, ['ذكر', 'أنثى', 'x'])), ...extra,
  });
  const list = (max, mk) => Array.from({ length: n(max) }, (_, i) => mk(i));
  return {
    interviewArchive: list(4, (i) => base(i, 'i', 'interviewDate', { currentStatus: pick(r, STATUS), reason: maybe(r, pick(r, TEXT)), interviewReason: maybe(r, pick(r, TEXT)), caseStatus: maybe(r, pick(r, TEXT)), status: maybe(r, pick(r, TEXT)) })),
    reintegrationArchive: list(3, (i) => base(i, 'r', 'reintegrationDate', { currentStatus: pick(r, STATUS) })),
    absenceArchive: list(3, (i) => base(i, 'a', 'recordDate', { currentStatus: pick(r, STATUS), absenceDays: maybe(r, pick(r, [0, 2, 5])), days: maybe(r, pick(r, [1, 3])), absenceType: maybe(r, pick(r, ['مبرر', 'غير مبرر'])), type: maybe(r, pick(r, TEXT)) })),
    violenceArchive: list(3, (i) => base(i, 'v', 'reportDate', { status: pick(r, VIO_STATUS), category: maybe(r, pick(r, TEXT)), violenceType: maybe(r, pick(r, TEXT)), actions: maybe(r, pick(r, TEXT)) })),
    workshopsArchive: list(3, (i) => base(i, 'w', 'date', { title: pick(r, NAMES), result: pick(r, STATUS), type: maybe(r, pick(r, TEXT)), activityType: maybe(r, pick(r, TEXT)), participants: maybe(r, pick(r, [0, 12, 30])), participantsCount: maybe(r, pick(r, [8, 20])), classes: maybe(r, 'A-1، B-2') })),
    specialNeedsArchive: list(3, (i) => base(i, 's', 'date', { currentStatus: pick(r, STATUS), diagnosis: maybe(r, pick(r, TEXT)), disabilityType: maybe(r, pick(r, TEXT)), actions: maybe(r, pick(r, TEXT)), support: maybe(r, pick(r, TEXT)) })),
  };
}

// ── تشغيل القديم المجمَّد في vm مع DOM وهمي يقرأ نموذج التعديل من HTML الذي يبنيه ──
function parseFields(html) {
  const fields = {};
  for (const m of html.matchAll(/<input id="(wpr_ed_\w+)"([^>]*?)>/g)) {
    const v = /value="([^"]*)"/.exec(m[2]);
    fields[m[1]] = { value: v ? v[1] : '' };
  }
  for (const m of html.matchAll(/<textarea id="(wpr_ed_\w+)"[^>]*>([\s\S]*?)<\/textarea>/g)) fields[m[1]] = { value: m[2] };
  for (const m of html.matchAll(/<select id="(wpr_ed_\w+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const opts = [...m[2].matchAll(/<option value="([^"]*)"( selected)?>/g)].map((o) => ({ value: o[1], selected: !!o[2] }));
    const sel = opts.find((o) => o.selected) || opts[0];
    fields[m[1]] = { value: sel ? sel.value : '', options: opts.map((o) => o.value) };
  }
  return fields;
}

function runLegacy(c, { confirmAnswer = true } = {}) {
  const archives = clone(c);
  const els = new Map();
  const style = () => ({ style: {}, textContent: '', innerHTML: '' });
  let editHtml = '';
  let fields = {};
  const log = { confirms: [], toasts: [], saved: [], stats: 0 };
  const document = {
    getElementById: (id) => {
      if (id === 'wprEditFields') return { set innerHTML(h) { editHtml = h; fields = parseFields(h); } };
      if (id.startsWith('wpr_ed_')) return fields[id] || null;
      if (!els.has(id)) els.set(id, style());
      return els.get(id);
    },
    createElement: () => ({ style: {}, remove() {} }),
    body: { appendChild: (el) => log.toasts.push(el.textContent) },
  };
  const ctx = {
    document, localStorage: { getItem: (k) => (k === 'wp:selectedFrom' ? FROM : TO) }, window: {}, WeeklyReport,
    setTimeout: () => 0,
    confirm: (m) => { log.confirms.push(m); return confirmAnswer; },
    updateDashboardStats: () => { log.stats++; },
    saveUserKey: (k) => log.saved.push(k),
    getArchive: () => archives.interviewArchive, saveArchive: (a) => { archives.interviewArchive = a; },
    getRArchive: () => archives.reintegrationArchive, saveRArchive: (a) => { archives.reintegrationArchive = a; },
    getAbArchive: () => archives.absenceArchive, saveAbArchive: (a) => { archives.absenceArchive = a; },
    getVioArchive: () => archives.violenceArchive, saveVioArchive: (a) => { archives.violenceArchive = a; },
    getSnArchive: () => archives.specialNeedsArchive, saveSnArchive: (a) => { archives.specialNeedsArchive = a; },
    appData: archives,
  };
  ctx.wkCollections = () => archives;
  vm.createContext(ctx);
  vm.runInContext(legacySrc.replace(/wkCollections\(\)/g, 'wkCollections()'), ctx);
  const call = (name, ...a) => vm.runInContext(name, ctx)(...a);
  return {
    archives, log, fields: () => fields, editHtml: () => editHtml,
    open: () => call('openWeeklyReportPreview'),
    rows: () => clone(vm.runInContext('_wprAllRows', ctx)),
    edit: (i) => call('wprOpenEdit', i),
    save: () => call('wprSaveEdit'),
    del: (i) => call('wprDeleteRow', i, null),
    delFromEdit: () => call('wprDeleteFromEdit'),
    tab: (t) => call('wprShowTab', t),
    setField: (id, v) => { if (fields[id]) fields[id].value = v; },
  };
}

// الجسر الذي يوفّره script-10 للنافذة الجديدة، على نسخة من البيانات
function makeBridge(c) {
  const a = clone(c);
  const key = { interview: 'interviewArchive', reintegration: 'reintegrationArchive', absence: 'absenceArchive', violence: 'violenceArchive', workshop: 'workshopsArchive', specNeeds: 'specialNeedsArchive' };
  const log = { stats: 0 };
  return { a, log, collections: () => a, get: (t) => a[key[t]], save: (t, arr) => { a[key[t]] = arr; }, refreshStats: () => { log.stats++; } };
}

// قيم التعديل العشوائية للنموذج (من خيارات كل حقل إن كان قائمة)
function editedForm(r, form, legacyFields) {
  const out = { ...form };
  for (const k of Object.keys(form)) {
    const lf = legacyFields['wpr_ed_' + k];
    if (r() < 0.5) continue;
    if (lf && lf.options) out[k] = pick(r, lf.options);
    else if (k === 'date' || k === 'followup') out[k] = pick(r, DATES);
    else if (k === 'wsParticipants' || k === 'abDays') out[k] = String(Math.floor(r() * 40));
    else out[k] = pick(r, ['  نص جديد  ', 'قيمة', '']);
  }
  return out;
}

// ── مطابقة نموذج التعديل: القيم الابتدائية ثم الحفظ ثم الحذف ──
for (let seed = 1; seed <= 40; seed++) {
  test(`مطابقة صفوف المعاينة والنموذج الابتدائي والحفظ: seed=${seed}`, () => {
    const c = genData(seed);
    const old = runLegacy(c);
    old.open();
    const oldRows = old.rows();
    const mineRows = clone(buildPreviewRows(clone(c), FROM, TO));
    assert.deepEqual(mineRows, oldRows);

    const r = rng(seed * 7919);
    mineRows.forEach((row, idx) => {
      const oldRun = runLegacy(c); oldRun.open(); oldRun.edit(idx);
      const lf = oldRun.fields();
      const form = initialForm(row);
      // كل حقل في النموذج الجديد له حقل مقابل في القديم بالقيمة نفسها، والعكس
      const legacyInitial = Object.fromEntries(Object.entries(lf).map(([k, v]) => [k.replace('wpr_ed_', ''), v.value]));
      assert.deepEqual(form, legacyInitial, `القيم الابتدائية للصف ${idx} (${row._type})`);

      // حفظ قيم معدَّلة بالقديم والجديد
      const edited = editedForm(r, form, lf);
      for (const [k, v] of Object.entries(edited)) oldRun.setField('wpr_ed_' + k, v);
      oldRun.save();
      const bridge = makeBridge(c);
      const target = buildPreviewRows(bridge.collections(), FROM, TO)[idx];
      assert.ok(updateArchive(bridge, target, buildPatch(target, edited)) || !target.id);
      assert.deepEqual(bridge.a, oldRun.archives, `الأرشيف بعد الحفظ (صف ${idx})`);
      assert.deepEqual(clone(applyToRow(target, edited)), oldRun.rows()[idx], `الصف المعروض بعد الحفظ (صف ${idx})`);
    });
  });

  test(`مطابقة الحذف (من الجدول ومن نافذة التعديل) ونص التأكيد: seed=${seed}`, () => {
    const c = genData(seed);
    const rows = buildPreviewRows(clone(c), FROM, TO);
    rows.forEach((row, idx) => {
      // من الجدول
      const a = runLegacy(c); a.open(); a.del(idx);
      const b1 = makeBridge(c);
      const t1 = buildPreviewRows(b1.collections(), FROM, TO)[idx];
      removeFromArchive(b1, t1);
      assert.deepEqual(b1.a, a.archives);
      assert.deepEqual(a.log.confirms, [deleteMessage(t1)]);
      assert.deepEqual(a.rows(), clone(buildPreviewRows(b1.collections(), FROM, TO)));
      assert.equal(a.log.stats, 1);
      // من نافذة التعديل (نص التأكيد مختلف)
      const e = runLegacy(c); e.open(); e.edit(idx); e.delFromEdit();
      assert.deepEqual(e.archives, b1.a);
      assert.deepEqual(e.log.confirms, [deleteMessage(t1, { fromArchive: false })]);
      // الإلغاء لا يغيّر شيئاً
      const n = runLegacy(c, { confirmAnswer: false }); n.open(); n.del(idx);
      assert.deepEqual(n.archives, clone(c));
    });
  });
}

// حارس ضد اختبار فارغ: بيانات البذور تغطي الأنواع الستة بعدد وافر من الصفوف
test('تغطية البيانات العشوائية: الأنواع الستة كلها وأكثر من 100 صف', () => {
  const types = new Set();
  let total = 0;
  for (let seed = 1; seed <= 40; seed++) buildPreviewRows(genData(seed), FROM, TO).forEach((r) => { types.add(r._type); total++; });
  assert.deepEqual([...types].sort(), ['absence', 'interview', 'reintegration', 'specNeeds', 'violence', 'workshop']);
  assert.ok(total > 100, 'total=' + total);
});

// ── التبويبات والإحصاء وشارات الجدول ──
test('التبويبات: المعرّفات هي نفسها معرّفات أزرار HTML القديم بترتيبها', () => {
  assert.deepEqual(TABS.map((t) => t.id), ['all', 'interview', 'reintegration', 'absence', 'violence', 'workshop', 'specNeeds']);
});

for (let seed = 1; seed <= 20; seed++) {
  test(`التصفية حسب التبويب والإحصاء: seed=${seed}`, () => {
    const c = genData(seed);
    const rows = clone(buildPreviewRows(c, FROM, TO));
    for (const t of TABS) {
      const old = runLegacy(c); old.open(); old.tab(t.id);
      const expected = t.id === 'all' ? rows : rows.filter((x) => x._type === t.id);
      assert.deepEqual(clone(filterRows(rows, t.id)), expected);
    }
    const s = statsOf(rows);
    assert.equal(s.total, rows.length);
    assert.equal(s.byType.reduce((n, x) => n + x.count, 0), rows.length);
    // ترتيب الأنواع = ترتيب أول ظهور
    assert.deepEqual(s.byType.map((x) => x.type), [...new Set(rows.map((x) => x._type))]);
  });
}

test('شارات الجدول: ألوان الحالة وشارة الأولوية', () => {
  for (const s of ['مُنجز', 'منتهية', 'مُغلق']) { assert.equal(statusBg(s), '#dcfce7'); assert.equal(statusColor(s), '#166534'); }
  for (const s of ['قيد المتابعة', 'جارية']) { assert.equal(statusBg(s), '#fef9c3'); assert.equal(statusColor(s), '#854d0e'); }
  for (const s of ['—', 'أخرى', '', undefined]) { assert.equal(statusBg(s), '#f1f5f9'); assert.equal(statusColor(s), '#475569'); }
  assert.deepEqual(['عاجلة', 'عالية', 'متوسطة', 'عادية', '—', '', 'x'].map(priorityBadge), ['🔴', '🟠', '🟡', '🟢', '—', '—', '—']);
  assert.deepEqual(['عاجلة', '—', '', undefined].map(priorityText), ['عاجلة', '', '', '']);
  assert.equal(rowStatus({ _statusField: 'result', result: 'جارية' }), 'جارية');
  assert.equal(rowStatus({ _statusField: 'result' }), '—');
});

test('خيارات الحالة: قيمة غريبة تُضاف أولاً', () => {
  assert.deepEqual(statusOptions('مُنجز'), STATUSES);
  assert.deepEqual(statusOptions(''), STATUSES);
  assert.deepEqual(statusOptions('مفتوحة'), ['مفتوحة', ...STATUSES]);
  assert.ok(PRIORITIES.includes('—'));
});

test('أقسام النموذج: لكل نوع الأقسام نفسها المعروضة في القديم', () => {
  const ids = (t) => dynamicSections(t, 'x').map((s) => s.id);
  assert.deepEqual(ids('interview'), ['extra', 'interview']);
  assert.deepEqual(ids('reintegration'), ['extra']);
  assert.deepEqual(ids('absence'), ['extra', 'absence']);
  assert.deepEqual(ids('specNeeds'), ['extra', 'specNeeds']);
  assert.deepEqual(ids('violence'), ['violence']);
  assert.deepEqual(ids('workshop'), ['workshop']);
  assert.deepEqual(ids('unknown'), []);
});

// ── الأرشيف: السجل بلا معرّف لا يُعدَّل ولا يُحذف (القديم كان يطابق أول سجل بلا معرّف) ──
test('سجل بلا معرّف: لا يُلمس الأرشيف', () => {
  const c = { interviewArchive: [{ interviewDate: FROM, studentName: 'أ' }, { id: 'x', interviewDate: FROM, studentName: 'ب' }] };
  const b = makeBridge({ ...genData(1), ...c });
  const row = buildPreviewRows(b.collections(), FROM, TO).find((r) => r.studentName === 'أ');
  assert.equal(updateArchive(b, row, { studentName: 'جديد' }), false);
  assert.equal(removeFromArchive(b, row), false);
  assert.equal(b.a.interviewArchive[0].studentName, 'أ');
  assert.equal(updateArchive(null, row, {}), false);
});

test('المعرّف يُقارن بـ == (رقم ونص)', () => {
  const b = makeBridge({ ...genData(1), interviewArchive: [{ id: 5, interviewDate: FROM, studentName: 'أ' }] });
  assert.equal(updateArchive(b, { _type: 'interview', id: '5' }, { studentName: 'ب' }), true);
  assert.equal(b.a.interviewArchive[0].studentName, 'ب');
  assert.equal(removeFromArchive(b, { _type: 'interview', id: 5 }), true);
  assert.equal(b.a.interviewArchive.length, 0);
});

// ── نطاق الأسبوع ──
test('resolveRange: المحفوظ ثم الأسبوع الحالي (اثنين → أحد) كما في القديم', () => {
  const st = (o) => ({ getItem: (k) => (k in o ? o[k] : null) });
  assert.deepEqual(resolveRange(st({ 'wp:selectedFrom': '2026-10-19', 'wp:selectedTo': '2026-10-25' })), { from: '2026-10-19', to: '2026-10-25' });
  const now = new Date(2026, 9, 28, 12, 0);
  const old = runLegacy(genData(1));
  const ctx = vm.createContext({ Date: class extends Date { constructor(...a) { if (a.length === 0) super(now); else super(...a); } }, document: { getElementById: () => ({ style: {}, set innerHTML(v) {} }) }, localStorage: st({}), window: {}, WeeklyReport, wkCollections: () => ({}) });
  vm.runInContext(legacySrc, ctx);
  vm.runInContext('openWeeklyReportPreview()', ctx);
  assert.deepEqual(resolveRange(st({}), now), { from: ctx.window._wprFrom, to: ctx.window._wprTo });
  assert.ok(old);
  // أحد: الأسبوع ينتهي به
  const sun = new Date(2026, 10, 1, 12, 0);
  assert.equal(resolveRange(st({}), sun).to, new Date(2026, 10, 1, 12).toISOString().slice(0, 10));
  // تخزين يرمي استثناء → الأسبوع الحالي
  assert.equal(resolveRange({ getItem() { throw new Error('x'); } }, now).from.length, 10);
});

// ── المخزن ──
const store = await import('../src/weeklypreview/weeklyPreviewStore.js');
const { setBridge } = await import('../src/session/sessionBridge.js');

function setupWindow(c, { range = [FROM, TO], confirmAnswer = true } = {}) {
  const bridge = makeBridge(c);
  const toasts = [];
  setBridge({ weeklyBridge: bridge });
  globalThis.window = {
    localStorage: { getItem: (k) => (k === 'wp:selectedFrom' ? range[0] : range[1]) },
    confirm: (m) => { toasts.push('confirm:' + m); return confirmAnswer; },
  };
  store.resetWeeklyPreview();
  return { bridge, toasts };
}
const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = () => 0; // إشعارات showToast تجدول إزالتها بعد ثوانٍ؛ لا نريد مؤقتات معلَّقة في الاختبار
test.after(() => { globalThis.setTimeout = realSetTimeout; delete globalThis.window; });

test('المخزن: openWeeklyPreview يقرأ الأسبوع والصفوف ويفتح على «كل الملفات»', () => {
  const c = genData(3);
  const { bridge } = setupWindow(c);
  store.setPreviewTab('violence');
  store.openWeeklyPreview();
  const s = store.getWeeklyPreview();
  assert.equal(s.open, true);
  assert.equal(s.tab, 'all');
  assert.deepEqual([s.from, s.to], [FROM, TO]);
  assert.deepEqual(clone(s.rows), clone(buildPreviewRows(bridge.a, FROM, TO)));
});

test('المخزن: التبويب والتعديل والإغلاق', () => {
  setupWindow(genData(4));
  store.openWeeklyPreview();
  store.setPreviewTab('absence');
  assert.equal(store.getWeeklyPreview().tab, 'absence');
  const row = store.getWeeklyPreview().rows[0];
  const seq = store.getWeeklyPreview().editSeq;
  store.openEditRow(row);
  assert.equal(store.getWeeklyPreview().editing, row);
  assert.equal(store.getWeeklyPreview().editSeq, seq + 1);
  store.closeEditRow();
  assert.equal(store.getWeeklyPreview().editing, null);
  store.openEditRow(row);
  store.closeWeeklyPreview();
  assert.deepEqual([store.getWeeklyPreview().open, store.getWeeklyPreview().editing], [false, null]);
});

test('المخزن: saveEditRow يحدّث الصف والأرشيف ويغلق نافذة التعديل', () => {
  const c = genData(5);
  const { bridge } = setupWindow(c);
  store.openWeeklyPreview();
  const row = store.getWeeklyPreview().rows[0];
  store.openEditRow(row);
  const form = { ...initialForm(row), name: '  اسم جديد  ', notes: ' ملاحظة ' };
  store.saveEditRow(form);
  const s = store.getWeeklyPreview();
  assert.equal(s.editing, null);
  assert.equal(s.rows[0].studentName, 'اسم جديد');
  assert.equal(s.rows[0].notes, 'ملاحظة');
  assert.notEqual(s.rows[0], row);
  const keyOf = { interview: 'interviewArchive', reintegration: 'reintegrationArchive', absence: 'absenceArchive', violence: 'violenceArchive', workshop: 'workshopsArchive', specNeeds: 'specialNeedsArchive' };
  const saved = bridge.a[keyOf[row._type]].find((e) => e.id === row.id);
  assert.equal(saved.studentName, 'اسم جديد');
  assert.equal(saved.notes, 'ملاحظة');
});

test('المخزن: deleteRow يسأل أولاً، والإلغاء لا يحذف، والتأكيد يحذف من الصفوف والأرشيف ويحدّث الإحصاءات', () => {
  const c = genData(6);
  const { bridge } = setupWindow(c);
  store.openWeeklyPreview();
  const before = store.getWeeklyPreview().rows;
  const row = before[0];
  assert.equal(store.deleteRow(row, { confirmFn: () => false }), false);
  assert.equal(store.getWeeklyPreview().rows.length, before.length);
  let asked = null;
  assert.equal(store.deleteRow(row, { confirmFn: (m) => { asked = m; return true; } }), true);
  assert.equal(asked, deleteMessage(row));
  assert.equal(store.getWeeklyPreview().rows.length, before.length - 1);
  assert.ok(!store.getWeeklyPreview().rows.includes(row));
  assert.equal(bridge.log.stats, 1);
  assert.deepEqual(clone(store.getWeeklyPreview().rows), clone(buildPreviewRows(bridge.a, FROM, TO)));
  // صف غير موجود لا يُحذف
  assert.equal(store.deleteRow(row, { confirmFn: () => true }), false);
});

test('المخزن: الحذف من نافذة التعديل يغلقها ونص التأكيد أقصر', () => {
  setupWindow(genData(7));
  store.openWeeklyPreview();
  const row = store.getWeeklyPreview().rows[0];
  store.openEditRow(row);
  let asked = null;
  store.deleteRow(row, { fromEdit: true, confirmFn: (m) => { asked = m; return true; } });
  assert.equal(asked, deleteMessage(row, { fromArchive: false }));
  assert.ok(!asked.includes('من الأرشيف'));
  assert.equal(store.getWeeklyPreview().editing, null);
});

test('المخزن: بلا جسر (الكود القديم لم يُحمَّل بعد) تُفتح النافذة فارغة ولا يحدث خطأ', () => {
  setBridge(null);
  globalThis.window = { localStorage: { getItem: () => null } };
  store.resetWeeklyPreview();
  store.openWeeklyPreview();
  assert.deepEqual(store.getWeeklyPreview().rows, []);
  assert.equal(store.getWeeklyPreview().open, true);
});

test('installWeeklyPreview: يسجّل الاسمين العامين اللذين يستدعيهما الكود القديم', () => {
  globalThis.window = {};
  store.installWeeklyPreview();
  assert.equal(globalThis.window.openWeeklyReportPreview, store.openWeeklyPreview);
  assert.equal(globalThis.window.wprClose, store.closeWeeklyPreview);
});

// ── ربط script-10 الحيّ: الجسر يقرأ ويكتب الأرشيفات الستة بالدوال القديمة ──
test('جسر script-10 (window.wprBridge): get/save لكل نوع عبر الدوال القديمة وحرس typeof', () => {
  const live = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
  const src = live.slice(live.indexOf('var WPR_ARCHIVES'), live.indexOf('// ======= WEEK PICKER MODAL'));
  const c = genData(2);
  const arch = clone(c);
  const saved = [];
  const ctx = {
    window: {}, appData: arch, wkCollections: () => arch,
    getArchive: () => arch.interviewArchive, saveArchive: (a) => { arch.interviewArchive = a; saved.push('i'); },
    getRArchive: () => arch.reintegrationArchive, saveRArchive: (a) => { arch.reintegrationArchive = a; saved.push('r'); },
    getAbArchive: () => arch.absenceArchive, saveAbArchive: (a) => { arch.absenceArchive = a; saved.push('a'); },
    getVioArchive: () => arch.violenceArchive, saveVioArchive: (a) => { arch.violenceArchive = a; saved.push('v'); },
    getSnArchive: () => arch.specialNeedsArchive, saveSnArchive: (a) => { arch.specialNeedsArchive = a; saved.push('s'); },
    saveUserKey: (k) => saved.push(k), updateDashboardStats: () => saved.push('stats'),
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const b = ctx.window.wprBridge;
  assert.equal(b.collections(), arch);
  const keyOf = { interview: 'interviewArchive', reintegration: 'reintegrationArchive', absence: 'absenceArchive', violence: 'violenceArchive', workshop: 'workshopsArchive', specNeeds: 'specialNeedsArchive' };
  for (const [t, k] of Object.entries(keyOf)) assert.equal(b.get(t), arch[k], t);
  assert.equal(b.get('nope').length, 0); // مصفوفات vm من عالَم آخر: نقارن الطول
  b.save('workshop', []);
  assert.equal(arch.workshopsArchive.length, 0);
  assert.ok(saved.includes('workshopsArchive'));
  b.save('interview', []); b.save('violence', []);
  assert.deepEqual([arch.interviewArchive.length, arch.violenceArchive.length], [0, 0]);
  b.refreshStats();
  assert.ok(saved.includes('stats'));
  // دوال الأرشيف الاختيارية غير معرَّفة → قائمة فارغة وحفظ صامت
  const ctx2 = vm.createContext({ window: {}, appData: { workshopsArchive: [] }, wkCollections: () => ({}) });
  vm.runInContext(src, ctx2);
  assert.equal(ctx2.window.wprBridge.get('absence').length, 0);
  assert.doesNotThrow(() => ctx2.window.wprBridge.save('absence', []));
  assert.doesNotThrow(() => ctx2.window.wprBridge.refreshStats());
});
