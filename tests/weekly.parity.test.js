// اختبار مطابقة الخطوة 37 (منطق التقرير الأسبوعي): نشغّل wkBuildRows وwkReportHtml وopenWeeklyReportPreview القديمة (المجمَّدة)
// على بيانات عشوائية مثبَّتة بالبذور، ونقارنها بـ buildRows وbuildReportHtml وbuildPreviewRows الجديدة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildRows, buildPreviewRows, buildReportHtml, collectWeek, WeeklyReport } from '../src/weekly/weeklyReport.js';

// الخطوة 38: الفرق الوحيد المقصود في HTML بين القديم والجديد (حين لا سجلات اتصال) هو عنوان قسم الجدول
const T_OLD = 'المقابلات والإدماج والغياب والعنف والإعاقة والورشات</div>';
const T_NEW = 'المقابلات والإدماج والغياب والعنف والإعاقة والورشات والاتصال بالأولياء</div>';
const oldTitle = (h) => h.replace(T_NEW, T_OLD);

const legacySrc = fs.readFileSync(new URL('./fixtures/weekly.step37.js', import.meta.url), 'utf8');
const clone = (x) => JSON.parse(JSON.stringify(x));

// الكود القديم الحيّ بعد الربط (script-10.js الحالي): بعد الخطوة 40 لم تعد صفوف المعاينة تُبنى فيه؛ بقي جسر النافذة (window.wprBridge)
// الذي يسلّم الأرشيفات لـ buildPreviewRows الجديدة، وwkCollections وwkBuildRows وwkReportHtml المفوِّضة إلى WeeklyReport
const live = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
const wiredSrc = live.slice(live.indexOf('var WPR_ARCHIVES'), live.indexOf('// ======= WEEK PICKER MODAL')) + '\n' +
  live.slice(live.indexOf('// جمع صفوف الأسبوع وبناء HTML التقرير'), live.indexOf('async function downloadWeeklyReportWordForRange'));

// مولّد عشوائي مثبَّت بالبذرة (mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const FROM = '2026-10-26';
const TO = '2026-11-01';
const DATES = ['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-29', '2026-11-01', '2026-11-02', '', undefined];
const STATUS = ['مُنجز', 'قيد المتابعة', 'جارية', 'منتهية', 'مُغلق', 'مفتوحة', '', undefined];
const NAMES = ['أحمد العلوي', 'سناء <b>المنصوري</b>', 'يوسف & ابنه', '😀 ليلى 🎓', '', undefined];
const SUBJ = ['سلوك', 'تأخر دراسي', 'نزاع  بين\nتلميذين', '', undefined, 'موضوع ♿ طويل'];

function genRecords(r, n, mk) {
  return Array.from({ length: Math.floor(r() * n) }, (_, i) => mk(r, i));
}
const pick = (r, a) => a[Math.floor(r() * a.length)];
const maybe = (r, v) => (r() < 0.8 ? v : undefined);

function genData(seed) {
  const r = rng(seed);
  const common = (r, i, dateKey) => ({
    id: 'id' + seed + '_' + i, [dateKey]: pick(r, DATES), studentName: pick(r, NAMES), school: maybe(r, 'إعدادية الأمل'),
    level: maybe(r, pick(r, ['1/1', '2/3', '3/2'])), priority: maybe(r, pick(r, ['عاجلة', 'عالية', 'متوسطة'])), nextFollowup: maybe(r, pick(r, DATES)), currentStatus: pick(r, STATUS),
  });
  return {
    interviewArchive: genRecords(r, 8, (r, i) => ({ ...common(r, i, 'interviewDate'), subject: pick(r, SUBJ) })),
    reintegrationArchive: genRecords(r, 8, (r, i) => ({ ...common(r, i, 'reintegrationDate'), reason: pick(r, SUBJ) })),
    absenceArchive: genRecords(r, 8, (r, i) => {
      const e = { ...common(r, i, 'recordDate'), totalHours: pick(r, [0, 3, 12, undefined]), unjustifiedHours: pick(r, [0, 2, undefined]) };
      if (r() < 0.4) { delete e.recordDate; e.savedAt = pick(r, ['2026-10-28T09:30:00.000Z', '2026-11-05T10:00:00Z', '', undefined]); }
      return e;
    }),
    specialNeedsArchive: genRecords(r, 6, (r, i) => ({ ...common(r, i, 'date'), disabilityType: pick(r, SUBJ) })),
    violenceArchive: genRecords(r, 6, (r, i) => ({ ...common(r, i, 'reportDate'), category: pick(r, SUBJ), status: pick(r, STATUS) })),
    workshopsArchive: genRecords(r, 6, (r, i) => ({
      id: 'w' + seed + '_' + i, date: pick(r, DATES), title: pick(r, NAMES), school: maybe(r, 'إعدادية الأمل'), theme: r() < 0.5 ? pick(r, [['أ', 'ب'], [], ['حياة مدرسية']]) : undefined,
      type: pick(r, ['ورشة', undefined]), result: pick(r, STATUS), priority: maybe(r, 'عالية'), nextDate: maybe(r, pick(r, DATES)),
    })),
  };
}

// الكود القديم يقرأ الأرشيفات عبر دوال عامة؛ نعرّفها على بيانات الحالة. skip: دوال غير معرَّفة (حارس typeof في القديم)
function runWith(src, c, { logo, range = [FROM, TO], skip = [] } = {}) {
  const ctx = {
    getArchive: () => c.interviewArchive,
    getRArchive: () => c.reintegrationArchive,
    getAbArchive: () => c.absenceArchive,
    getSnArchive: () => c.specialNeedsArchive,
    getVioArchive: () => c.violenceArchive,
    appData: { workshopsArchive: c.workshopsArchive },
    document: { getElementById: () => ({ style: {}, textContent: '' }) },
    localStorage: { getItem: (k) => (k === 'wp:selectedFrom' ? range[0] : range[1]) },
    wprUpdateTabStyles() {}, wprRenderStats() {}, wprRenderTable() {},
    window: {},
    WeeklyReport,
  };
  for (const s of skip) delete ctx[s];
  if (logo !== undefined) ctx.MINISTRY_LOGO_B64 = logo;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return {
    rows: (f, t) => clone(vm.runInContext('wkBuildRows', ctx)(f, t)),
    html: (f, t) => vm.runInContext('wkReportHtml', ctx)(f, t),
    // القديم المجمَّد يبني _wprAllRows بنفسه؛ المربوط يمرّر أرشيفاته عبر الجسر إلى buildPreviewRows (ما تفعله النافذة الجديدة عند الفتح)
    preview: () => {
      if (src === legacySrc) { vm.runInContext('openWeeklyReportPreview', ctx)(); return clone(vm.runInContext('_wprAllRows', ctx)); }
      return clone(buildPreviewRows(ctx.window.wprBridge.collections(), range[0], range[1]));
    },
  };
}

const runLegacy = (c, o) => runWith(legacySrc, c, o);
const runWired = (c, o) => runWith(wiredSrc, c, o);

for (let seed = 1; seed <= 40; seed++) {
  test(`مطابقة wkBuildRows: seed=${seed}`, () => {
    const c = genData(seed);
    assert.deepEqual(clone(buildRows(c, FROM, TO)), runLegacy(c).rows(FROM, TO));
  });
  test(`مطابقة openWeeklyReportPreview (صفوف المعاينة): seed=${seed}`, () => {
    const c = genData(seed);
    assert.deepEqual(clone(buildPreviewRows(c, FROM, TO)), runLegacy(c).preview());
  });
  test(`مطابقة wkReportHtml: seed=${seed}`, () => {
    const c = genData(seed);
    const logo = seed % 3 === 0 ? 'data:image/png;base64,AAA=' : seed % 3 === 1 ? '' : undefined;
    const old = runLegacy(c, { logo });
    const mine = buildReportHtml(buildRows(c, FROM, TO), FROM, TO, logo || '');
    assert.equal(oldTitle(mine), old.html(FROM, TO));
  });
}

test('مطابقة أسبوع بلا ملفات (الصف الفارغ في الجدول)', () => {
  const c = { interviewArchive: [], reintegrationArchive: [], absenceArchive: [], specialNeedsArchive: [], violenceArchive: [], workshopsArchive: [] };
  assert.equal(oldTitle(buildReportHtml(buildRows(c, FROM, TO), FROM, TO, '')), runLegacy(c).html(FROM, TO));
});

test('مطابقة غياب دوال الأرشيف الاختيارية (حارس typeof القديم) = أرشيف فارغ', () => {
  const c = genData(7);
  const old = runLegacy(c, { skip: ['getRArchive', 'getAbArchive', 'getSnArchive', 'getVioArchive'] });
  const mine = { interviewArchive: c.interviewArchive, workshopsArchive: c.workshopsArchive };
  assert.deepEqual(clone(buildRows(mine, FROM, TO)), old.rows(FROM, TO));
  assert.deepEqual(clone(buildPreviewRows(mine, FROM, TO)), old.preview());
});

test('مطابقة حدود الأسبوع: يشمل اليومين الأول والأخير ويستثني ما حولهما', () => {
  const c = genData(3);
  const edge = ['2026-10-25', '2026-10-26', '2026-11-01', '2026-11-02'].map((d, i) => ({ id: 'e' + i, interviewDate: d, studentName: 'ح' + i }));
  const all = { ...c, interviewArchive: edge };
  const rows = buildRows(all, FROM, TO).filter((r) => r.archiveType === 'interview');
  assert.deepEqual(rows.map((r) => r.date), ['2026-10-26', '2026-11-01']);
  assert.deepEqual(clone(buildRows(all, FROM, TO)), runLegacy(all).rows(FROM, TO));
});

test('collectWeek: الأرشيف الناقص يُعامل كقائمة فارغة', () => {
  const w = collectWeek({}, FROM, TO);
  for (const k of ['interviews', 'reintegrations', 'absences', 'specNeeds', 'violence', 'workshops', 'calls', 'meetings']) assert.deepEqual(w[k], []);
});

// ── ربط script-10.js الحيّ: الدوال المفوِّضة تعطي نفس نتائج القديمة المجمَّدة بالضبط ──
for (let seed = 1; seed <= 40; seed++) {
  test(`مطابقة الكود القديم بعد الربط بالوحدة الجديدة: seed=${seed}`, () => {
    const c = genData(seed);
    const logo = seed % 3 === 0 ? 'data:image/png;base64,AAA=' : seed % 3 === 1 ? '' : undefined;
    const old = runLegacy(c, { logo });
    const wired = runWired(c, { logo });
    assert.deepEqual(wired.rows(FROM, TO), old.rows(FROM, TO));
    assert.deepEqual(wired.preview(), old.preview());
    assert.equal(oldTitle(wired.html(FROM, TO)), old.html(FROM, TO));
  });
}

test('ربط script-10: غياب دوال الأرشيف الاختيارية لا يكسر شيئاً', () => {
  const c = genData(11);
  const skip = ['getRArchive', 'getAbArchive', 'getSnArchive', 'getVioArchive'];
  const old = runLegacy(c, { skip });
  const wired = runWired(c, { skip });
  assert.deepEqual(wired.rows(FROM, TO), old.rows(FROM, TO));
  assert.deepEqual(wired.preview(), old.preview());
});

// ══ الخطوة 38: بوابة الاتصال بالأولياء (الهاتف والمقابلات) في صفوف التقرير ══
const CALLS = [
  { id: 'c1', name: 'أحمد العلوي', massar: 'R1', phone: '0600000000', time: '10:00', result: 'تم الرد', date: '2026-10-27', notes: 'سيحضر غداً' },
  { id: 'c2', name: 'سناء', date: '2026-10-29', result: 'لم يرد', notes: '' },
  { id: 'c3', name: 'خارج الأسبوع', date: '2026-11-02', result: 'تم الرد' },
  { id: 'c4', date: '2026-10-26' },
];
const MEETS = [
  { id: 'm1', student: 'يوسف', cls: '2/3', parent: 'والد يوسف', cin: 'AB1', job: 'تاجر', date: '2026-10-28', subject: 'تأخر دراسي' },
  { id: 'm2', student: 'ليلى', date: '2026-10-25', subject: 'خارج' },
  { id: 'm3', date: '2026-11-01' },
];

test('خطوة 38: collectWeek يجمع الاتصالات والمقابلات داخل الأسبوع فقط (الحدّان شاملان)', () => {
  const w = collectWeek({ parentCalls: CALLS, parentMeetings: MEETS }, FROM, TO);
  assert.deepEqual(w.calls.map((e) => e.id), ['c1', 'c2', 'c4']);
  assert.deepEqual(w.meetings.map((e) => e.id), ['m1', 'm3']);
});

test('خطوة 38: buildRows يحوّل سجل الاتصال وسجل المقابلة إلى صف تقرير', () => {
  const rows = buildRows({ parentCalls: CALLS, parentMeetings: MEETS }, FROM, TO);
  const call = rows.find((r) => r.id === 'c1');
  assert.equal(call.archiveType, 'parentCall');
  assert.equal(call.name, 'أحمد العلوي');
  assert.equal(call.type, 'اتصال بولي الأمر 📞');
  assert.equal(call.subject, 'تم الرد — سيحضر غداً');
  assert.equal(call.date, '2026-10-27');
  const noNotes = rows.find((r) => r.id === 'c2');
  assert.equal(noNotes.subject, 'لم يرد');
  const meet = rows.find((r) => r.id === 'm1');
  assert.equal(meet.archiveType, 'parentMeeting');
  assert.equal(meet.name, 'يوسف');
  assert.equal(meet.level, '2/3');
  assert.equal(meet.subject, 'تأخر دراسي');
  assert.equal(meet.type, 'مقابلة ولي أمر 🤝');
});

test('خطوة 38: الحقول الناقصة تصير «—» ولا يظهر undefined', () => {
  const rows = buildRows({ parentCalls: [{ id: 'x', date: '2026-10-26' }], parentMeetings: [{ id: 'y', date: '2026-10-26' }] }, FROM, TO);
  assert.equal(rows.length, 2);
  for (const r of rows) {
    assert.equal(r.name, '—');
    assert.equal(r.subject, '—');
    for (const v of Object.values(r)) assert.notEqual(v, undefined);
  }
});

test('خطوة 38: الصفوف الجديدة تُفرز مع البقية بالتاريخ', () => {
  const c = { ...genData(5), parentCalls: CALLS, parentMeetings: MEETS };
  const dates = buildRows(c, FROM, TO).map((r) => r.date);
  assert.deepEqual(dates, [...dates].sort((a, b) => a.localeCompare(b)));
});

test('خطوة 38: ما سبق من الصفوف لا يتغيّر بإضافة الاتصال (الصفوف القديمة بالترتيب نفسه)', () => {
  const base = genData(9);
  const without = buildRows(base, FROM, TO);
  const withContact = buildRows({ ...base, parentCalls: CALLS, parentMeetings: MEETS }, FROM, TO)
    .filter((r) => r.archiveType !== 'parentCall' && r.archiveType !== 'parentMeeting');
  assert.deepEqual(withContact, without);
});

test('خطوة 38: معاينة التعديل (buildPreviewRows) لا تتأثر — لا صفوف اتصال فيها بعد', () => {
  const c = genData(9);
  assert.deepEqual(clone(buildPreviewRows({ ...c, parentCalls: CALLS, parentMeetings: MEETS }, FROM, TO)), clone(buildPreviewRows(c, FROM, TO)));
});

test('خطوة 38: HTML التقرير يعرض الاتصال والمقابلة ويُدخلهما في الحصيلة حسب النوع', () => {
  const rows = buildRows({ parentCalls: CALLS, parentMeetings: MEETS }, FROM, TO);
  const html = buildReportHtml(rows, FROM, TO, '');
  assert.ok(html.includes('اتصال بولي الأمر'));
  assert.ok(html.includes('مقابلة ولي أمر'));
  assert.ok(html.includes('<td>3</td><td>60%</td>') || html.includes('<td>3</td><td>'));
  assert.ok(!html.includes('📞') && !html.includes('🤝'), 'الرموز التعبيرية تُحذف من التقرير المطبوع');
  assert.ok(html.includes('والاتصال بالأولياء'));
});

test('خطوة 38: الربط في script-10 يمرّر الأرشيفين (wkCollections)', () => {
  const c = { ...genData(2), parentCalls: CALLS, parentMeetings: MEETS };
  const src = live.slice(live.indexOf('function wkCollections'), live.indexOf('function wkReportHtml'));
  const ctx = { appData: { workshopsArchive: c.workshopsArchive, parentCalls: CALLS, parentMeetings: MEETS }, WeeklyReport };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const got = clone(vm.runInContext('wkBuildRows', ctx)(FROM, TO));
  assert.deepEqual(got.filter((r) => r.archiveType === 'parentCall' || r.archiveType === 'parentMeeting').map((r) => r.id).sort(), ['c1', 'c2', 'c4', 'm1', 'm3']);
});
