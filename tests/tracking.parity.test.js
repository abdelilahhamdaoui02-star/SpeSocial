// اختبار مطابقة الخطوة 45 (الإشعارات وجدول التتبع الشهري): نشغّل الكتلة القديمة المجمَّدة ونقارنها بـ trackingLogic/trackingPrint الجديدة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  getAllNotifs, getAllTrackingLogs, monthOptions, filterRows, trackingKpis, notifGetLogs,
  classifyNotif, groupNotifs, bellCount, relativeLabel, stripEmoji, sessionSummary, actionChips, monthLabelOf,
} from '../src/tracking/trackingLogic.js';
import { buildTrackingPrintHtml } from '../src/tracking/trackingPrint.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/tracking.step45.js', import.meta.url), 'utf8');
const NOW = new Date(2026, 9, 28, 10, 30, 0);

function fakeDateClass(ms) {
  return class extends Date {
    constructor(...a) { if (a.length === 0) super(ms); else super(...a); }
    static now() { return ms; }
  };
}

const log = (id, date, result, note, by, nextDate) => ({ id, date, result, note, by, nextDate, savedAt: '28‏/10‏/2026' });
function sampleArchives() {
  return {
    interview: [
      { id: 'i1', studentName: 'أحمد العلوي', school: 'ثانوية الأمل', level: '3APIC-1', priority: 'عالية', nextFollowup: '2026-10-28', procedures: ['استماع', 'اتصال بالأسرة'], summary: 'ملخص مقابلة',
        trackingLogs: [log('l1', '2026-10-05', '✅ تحسن ملحوظ', 'تحسن في الحضور', 'المختص', '2026-11-02'), log('l2', '2026-10-20', '🔶 لا يزال قيد المتابعة', '', 'المختص', '')] },
      { id: 'i2', studentName: 'سلمى', school: 'إعدادية النور', nextFollowup: '—', trackingLogs: [] },
    ],
    reintegration: [
      { id: 'r1', studentName: 'يوسف بنعلي', school: 'ثانوية الأمل', level: '2BAC', priority: 'عاجلة', nextFollowup: '2026-10-20', procedures: [], summary: '',
        trackingLogs: [log('l3', '2026-09-12', '🔴 تراجع — يستدعي تدخلاً', 'غياب متكرر', 'م. اجتماعي', '2026-10-01')] },
    ],
    absence: [
      { id: 'a1', studentName: 'ليلى', school: 'إعدادية النور', nextFollowup: '2026-10-30', trackingLogs: [log('l4', '2026-10-27', '🟢 وضعية مستقرة', 'مستقرة', '', '')] },
      { id: 'a2', studentName: 'عمر', school: 'إعدادية النور', nextFollowup: 'not-a-date', trackingLogs: [log('l5', '', '🏛️ تمت الإحالة', 'أُحيل', 'المدير', '')] },
    ],
    specialNeeds: [
      { id: 's1', studentName: 'ريم', school: 'ثانوية الأمل', level: '1APIC', priority: 'عادية', nextFollowup: '2026-12-15', specialistNotes: 'ملاحظات المختص', procedures: ['تكييف الامتحان'],
        trackingLogs: [log('l6', '2026-11-03', '✔️ انتهت المتابعة', 'انتهت', 'أ', ''), log('l7', '2026-10-28', '⚠️ متأخرة', 'ملاحظة', 'ب', '')] },
    ],
    violence: [
      { id: 'v1', studentName: 'كريم', school: 'ثانوية الأمل', nextFollowup: '2026-10-29', procedures: ['إخبار الإدارة', 'إحالة'], summary: 'حادثة',
        trackingLogs: [log('l8', '2026-10-28', '🔴 تراجع — يستدعي تدخلاً', 'تدخل عاجل', 'المختص', '2026-11-05')] },
    ],
  };
}

// يشغّل الكتلة القديمة بأرشيفات محقونة وعناصر DOM مزيّفة
function runLegacy({ archives = sampleArchives(), filters = {}, now = NOW } = {}) {
  const els = {
    trackTableMonthFilter: { value: filters.month || '', innerHTML: '', options: [], appendChild(o) { this.options.push(o); }, },
    trackTableTypeFilter: { value: filters.type || '' },
    trackTableSearch: { value: filters.search || '' },
    trackTableKpis: { innerHTML: '' },
    trackTableCount: { textContent: '' },
    trackTableLastUpdate: { textContent: '' },
    trackingTableContainer: { innerHTML: '' },
  };
  const saved = {};
  const printed = { html: '', printCalled: false };
  const ctx = vm.createContext({
    Date: fakeDateClass(now.getTime()),
    getArchive: () => archives.interview,
    getRArchive: () => archives.reintegration,
    getAbArchive: () => archives.absence,
    getSnArchive: () => archives.specialNeeds,
    getVioArchive: () => archives.violence,
    saveArchive: (d) => { saved.interview = d; },
    saveRArchive: (d) => { saved.reintegration = d; },
    saveAbArchive: (d) => { saved.absence = d; },
    saveSnArchive: (d) => { saved.specialNeeds = d; },
    saveUserKey: () => {},
    printLogoImg: (h) => `<LOGO ${h}>`,
    document: {
      getElementById: (id) => els[id] || null,
      createElement: () => ({ value: '', textContent: '' }),
    },
    window: {
      open: () => ({ document: { write: (h) => { printed.html = h; }, close() {} }, focus() {}, print() { printed.printCalled = true; } }),
    },
    setTimeout: (fn) => { fn(); },
    console,
  });
  ctx.window.appData = {};
  vm.runInContext(legacySrc, ctx);
  const call = (name, ...args) => vm.runInContext(name, ctx)(...args);
  return { els, saved, printed, call };
}

const plain = (x) => JSON.parse(JSON.stringify(x));
const textOf = (html) => html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

test('مطابقة getAllNotifs: العناصر والترتيب والتاريخ', () => {
  const old = runLegacy().call('getAllNotifs');
  const neu = getAllNotifs(sampleArchives(), NOW);
  const norm = (r) => plain(r.allItems.map((i) => ({ ...i, date: i.date.getTime() })));
  assert.deepEqual(norm(neu), norm(old));
  assert.equal(neu.today.getTime(), old.today.getTime());
  assert.equal(neu.allItems.length, 5); // '—' وتاريخ غير صالح وغياب nextFollowup مستبعدة
});

test('مطابقة getAllNotifs مع أرشيفات فارغة وبلا مفاتيح', () => {
  const empty = { interview: [], reintegration: [], absence: [], specialNeeds: [], violence: [] };
  assert.deepEqual(getAllNotifs(empty, NOW).allItems, []);
  assert.deepEqual(getAllNotifs({}, NOW).allItems, []);
  assert.equal(runLegacy({ archives: empty }).call('getAllNotifs').allItems.length, 0);
});

test('مطابقة notifGetLogs (نوع مجهول / معرّف غائب / سجل موجود)', () => {
  const a = sampleArchives();
  const { call } = runLegacy({ archives: a });
  for (const [t, id] of [['interview', 'i1'], ['interview', 'zzz'], ['violence', 'v1'], ['unknown', 'x'], ['', 'i1'], ['interview', '']]) {
    assert.deepEqual(plain(notifGetLogs(a, t, id)), plain(call('notifGetLogs', t, id)), `${t}/${id}`);
  }
});

test('مطابقة notifSaveArchive: يحفظ النوع الصحيح فقط', () => {
  const { call, saved } = runLegacy();
  call('notifSaveArchive', 'absence', [1]);
  call('notifSaveArchive', 'reintegration', [2]);
  assert.deepEqual(plain(saved), { absence: [1], reintegration: [2] });
});

test('مطابقة getAllTrackingLogs: الصفوف والفرز (التاريخ الفارغ «—» في النهاية)', () => {
  const old = plain(runLegacy().call('getAllTrackingLogs'));
  const neu = plain(getAllTrackingLogs(sampleArchives()));
  assert.deepEqual(neu, old);
  assert.equal(neu[neu.length - 1].trackDate, '—');
});

test('مطابقة populateMonthFilter: الأشهر وتسمياتها وترتيبها', () => {
  const lg = runLegacy();
  lg.call('populateMonthFilter');
  const oldOpts = lg.els.trackTableMonthFilter.options.map((o) => ({ value: o.value, label: o.textContent }));
  assert.deepEqual(monthOptions(getAllTrackingLogs(sampleArchives())), oldOpts);
  assert.deepEqual(oldOpts.map((o) => o.value), ['2026-11', '2026-10', '2026-09']);
});

const FILTERS = [
  {}, { month: '2026-10' }, { type: 'violence' }, { search: 'تدخل' }, { search: 'المختص' }, { search: 'ملخص مقابلة' },
  { month: '2026-10', type: 'interview' }, { month: '2026-11', search: 'انتهت' }, { search: '  أحمد  ' }, { search: 'لا شيء مطلقاً' },
];

for (const f of FILTERS) {
  test(`مطابقة renderTrackingTable: ${JSON.stringify(f)}`, () => {
    const lg = runLegacy({ filters: f });
    lg.call('renderTrackingTable');
    const rows = filterRows(getAllTrackingLogs(sampleArchives()), f);
    const k = trackingKpis(rows);
    const nums = [...lg.els.trackTableKpis.innerHTML.matchAll(/font-size:1\.5rem;font-weight:800;color:#[0-9a-f]+;">(\d+)</g)].map((m) => +m[1]);
    assert.deepEqual(nums, [k.total, k.improved, k.pending, k.needsAttn], 'KPIs');
    assert.equal(lg.els.trackTableCount.textContent, `${rows.length} سجل تتبع`);
    const html = lg.els.trackingTableContainer.innerHTML;
    if (!rows.length) { assert.match(html, /لا توجد سجلات تتبع للمعايير المحددة/); return; }
    assert.equal((html.match(/onmouseover=/g) || []).length, rows.length, 'عدد الصفوف');
    // أسماء التلاميذ بنفس الترتيب
    const names = [...html.matchAll(/font-weight:700;color:#1a3a5c;font-size:0\.82rem;">([^<]*)</g)].map((m) => m[1]);
    assert.deepEqual(names, rows.map((r) => r.studentName));
  });
}

test('مطابقة تاريخ «آخر تحديث» وتسمية الشهر', () => {
  const lg = runLegacy();
  lg.call('renderTrackingTable');
  assert.equal(lg.els.trackTableLastUpdate.textContent, new Date(NOW).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' }));
});

for (const f of FILTERS) {
  test(`مطابقة downloadMonthlyTrackingTable (نص صفحة الطباعة): ${JSON.stringify(f)}`, () => {
    const lg = runLegacy({ filters: f });
    lg.call('downloadMonthlyTrackingTable');
    assert.ok(lg.printed.printCalled, 'استُدعيت الطباعة');
    const rows = filterRows(getAllTrackingLogs(sampleArchives()), f, { forPrint: true });
    const html = buildTrackingPrintHtml({ rows, monthFilter: f.month || '', logoHtml: '<LOGO 90>' });
    assert.equal(textOf(html), textOf(lg.printed.html));
  });
}

test('طباعة: كل بطاقة تلميذ تحمل عدد جلساتها وتوقيعين، والصفحة تبدأ بالشعار', () => {
  const rows = filterRows(getAllTrackingLogs(sampleArchives()));
  const html = buildTrackingPrintHtml({ rows, logoHtml: '<LOGO 90>' });
  assert.equal((html.match(/class="student-card"/g) || []).length, 6);
  assert.equal((html.match(/المختص الاجتماعي/g) || []).length, 6);
  assert.ok(html.indexOf('<LOGO 90>') < html.indexOf('class="page-header"'));
});

test('طباعة: لا سجلات → رسالة الفراغ', () => {
  assert.match(buildTrackingPrintHtml({ rows: [], logoHtml: '' }), /لا توجد سجلات تتبع للفترة المحددة/);
});

test('انحراف مقصود: القيم النصية تُهرَّب في صفحة الطباعة (القديم كان يحقنها خاماً)', () => {
  const a = sampleArchives();
  a.interview[0].studentName = '<img src=x onerror=alert(1)> & "اسم"';
  const rows = getAllTrackingLogs(a);
  const html = buildTrackingPrintHtml({ rows, logoHtml: '' });
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;اسم&quot;'));
  // القديم يحقنها كما هي — نوثّق السلوك الذي تخلّصنا منه
  const lg = runLegacy({ archives: a });
  lg.call('downloadMonthlyTrackingTable');
  assert.ok(lg.printed.html.includes('<img src=x onerror=alert(1)>'));
});

test('فلتر الطباعة يبحث في 3 حقول فقط بينما الشاشة تبحث في 5 (كما كان)', () => {
  const rows = getAllTrackingLogs(sampleArchives());
  assert.ok(filterRows(rows, { search: 'ملخص مقابلة' }).length > 0);
  assert.equal(filterRows(rows, { search: 'ملخص مقابلة' }, { forPrint: true }).length, 0);
});

test('KPIs: «متأخرة» تُحسب في الشاشة فقط، «تراجع» في الاثنين', () => {
  const rows = getAllTrackingLogs(sampleArchives());
  assert.equal(trackingKpis(rows).needsAttn, 3); // تراجع×2 + متأخرة×1
  assert.equal(trackingKpis(rows, { forPrint: true }).needsAttn, 2);
});

test('stripEmoji وملخص الجلسة وشارات الإجراءات', () => {
  assert.equal(stripEmoji('✅ تحسن ملحوظ'), 'تحسن ملحوظ');
  assert.equal(stripEmoji('🔴 تراجع — يستدعي تدخلاً'), 'تراجع — يستدعي تدخلاً');
  assert.equal(stripEmoji(undefined), '');
  const [first, second] = getAllTrackingLogs(sampleArchives());
  assert.equal(sessionSummary({ trackNote: '—', summary: 'س' }), 'س');
  assert.equal(sessionSummary({ trackNote: '—', summary: '—' }), '—');
  assert.equal(sessionSummary(first), first.trackNote);
  assert.deepEqual(actionChips({ trackActions: 'أ، ب' }), ['أ', 'ب']);
  assert.deepEqual(actionChips({ trackActions: '—' }), []);
  assert.ok(second);
});

test('monthLabelOf', () => {
  assert.equal(monthLabelOf(''), 'كل الأشهر');
  assert.equal(monthLabelOf('2026-10'), new Date(2026, 9, 1).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long' }));
});

// ── ما أُضيف في هذه الخطوة (لا مقابل قديم له: واجهة الإشعارات كانت قد حُذفت من HTML) ──
test('تصنيف المواعيد: متأخر/اليوم/قريب(≤3 أيام)/لاحقاً', () => {
  const today = new Date(2026, 9, 28);
  const at = (d) => ({ date: new Date(2026, 9, d) });
  assert.equal(classifyNotif(at(27), today), 'overdue');
  assert.equal(classifyNotif(at(28), today), 'today');
  assert.equal(classifyNotif(at(29), today), 'soon');
  assert.equal(classifyNotif(at(31), today), 'soon');
  assert.equal(classifyNotif({ date: new Date(2026, 10, 1) }, today), 'upcoming');
});

test('groupNotifs: التوزيع والترتيب بالأقرب أولاً وعدّاد الجرس', () => {
  const { allItems, today } = getAllNotifs(sampleArchives(), NOW);
  const { groups, counts, total } = groupNotifs(allItems, today);
  assert.deepEqual(counts, { overdue: 1, today: 1, soon: 2, upcoming: 1 });
  assert.equal(total, 5);
  assert.equal(groups.today[0].student, 'أحمد العلوي');
  assert.equal(groups.overdue[0].student, 'يوسف بنعلي');
  assert.deepEqual(groups.soon.map((i) => i.student), ['كريم', 'ليلى']);
  assert.equal(bellCount(counts), 2);
});

test('relativeLabel', () => {
  const today = new Date(2026, 9, 28);
  const lab = (d) => relativeLabel({ date: new Date(2026, 9, d) }, today);
  assert.equal(lab(28), 'اليوم');
  assert.equal(lab(29), 'غداً');
  assert.equal(lab(27), 'أمس');
  assert.equal(lab(31), 'بعد 3 أيام');
  assert.equal(lab(20), 'متأخر 8 يوماً');
});
