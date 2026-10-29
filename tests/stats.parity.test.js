// اختبار مطابقة: نشغّل كتلة الإحصاء القديمة (نسخة المرحلة 15 المجمَّدة) في بيئة معزولة مع Chart وImage وcanvas مزيّفة،
// ونقارن نتائجها بدوال src/stats/statsLogic.js على البيانات نفسها.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as S from '../src/stats/statsLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/stats.step15.js', import.meta.url), 'utf8');
const NOW = new Date(2026, 9, 24, 10, 0);

function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }
const J = (v) => JSON.parse(JSON.stringify(v));

function runLegacy(collections, { pngMode = 'ok' } = {}) {
  const els = {};
  const mkCanvas = () => ({
    width: 0, height: 0, cleared: 0,
    getContext: () => ({ fillStyle: '', fillRect() {}, clearRect() { /* يُعدّ عبر المرجع */ }, drawImage() { if (pngMode === 'throw') throw new Error('x'); } }),
    toDataURL(t) { return 'png:' + this.width + 'x' + this.height + ':' + t; },
  });
  const el = (id) => (els[id] ??= (id.startsWith('stChart') ? Object.assign(mkCanvas(), { id, width: 300, height: 150 }) : { id, value: '', innerHTML: '', textContent: '', classList: { open: false, add(c) { if (c === 'open') this.open = true; } } }));
  const charts = []; const alerts = [];
  class FakeChart { constructor(e, cfg) { this.el = e; this.cfg = cfg; this.destroyed = false; charts.push(this); } destroy() { this.destroyed = true; } }
  FakeChart.defaults = { color: '', font: {} };
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } }
  class FakeImage { set src(v) { this._s = v; (pngMode === 'error' ? this.onerror : this.onload)(); } }
  const win = { Chart: FakeChart };
  const ctx = vm.createContext({
    window: win, Chart: FakeChart, Date: FixedDate, Image: FakeImage, console, appData: collections, alert: (m) => alerts.push(m),
    encodeURIComponent, MINISTRY_LOGO_B64: undefined,
    document: { getElementById: el, createElement: () => mkCanvas(), querySelectorAll: () => [] },
  });
  vm.runInContext(legacySrc, ctx);
  return { ctx, els, el, charts, alerts, win };
}

const NAMES = ['أحمد', 'فاطمة', 'يوسف', 'سارة', ''];
const SCHOOLS = ['إعدادية الخوارزمي', 'ثانوية ابن سينا', '—', '', undefined, 'ECOLE Al Amal'];
function makeData(seed, ym = '2026-10') {
  const r = rngOf(seed), pick = (a) => a[Math.floor(r() * a.length)];
  const day = () => ym + '-' + String(1 + Math.floor(r() * 31)).padStart(2, '0');
  const dateOrBad = () => pick([day(), day(), day(), '', '—', 'غير صالح', undefined]);
  const base = (i) => ({ id: pick([1000 + i, String(2000 + i), 'abc', undefined, 1760000000000 + i * 86400000]), studentName: pick(NAMES), school: pick(SCHOOLS) });
  const mk = (n, f) => Array.from({ length: Math.floor(r() * n) }, (_, i) => f(base(i)));
  return {
    interviewArchive: mk(8, (b) => ({ ...b, interviewDate: dateOrBad(), subject: pick(['موضوع', '—', '', undefined]) })),
    reintegrationArchive: mk(5, (b) => ({ ...b, reintegrationDate: dateOrBad() })),
    absenceArchive: mk(5, (b) => ({ ...b, recordDate: dateOrBad() })),
    violenceArchive: mk(4, (b) => ({ ...b, reportDate: dateOrBad() })),
    specialNeedsArchive: mk(4, (b) => ({ ...b, recordDate: dateOrBad() })),
    pdAssocArchive: mk(3, (b) => ({ ...b, date: dateOrBad(), fields: pick([{ 'pd3-school': 'جمعية س' }, {}, undefined]) })),
    pdHealthArchive: mk(3, (b) => ({ ...b, date: dateOrBad(), fields: pick([{ 'pd4-school': '—' }, { 'pd4-school': 'مستوصف' }, undefined]) })),
    workshopsArchive: mk(6, (b) => ({ ...b, date: dateOrBad(), title: pick(['ورشة 1', '', undefined]), result: pick(['نتيجة إيجابية', 'متوسطة', 'سلبية', 'ناجح', 'رفض', 'غير ذلك', '—', '', undefined]), duration: pick(['45', '60 دقيقة', '', 'abc', 30, undefined]) })),
    taskLog: mk(10, (b) => ({ ...b, date: dateOrBad(), auto: pick([true, false, undefined]),
      type: pick(['مقابلة فردية', 'جلسة إنصات', 'ورشة', 'أخرى', 'اتصال بولي الأمر', 'جلسة مع ولي الأمر', 'استدعاء ولي الأمر']),
      title: pick(['إدماج مدرسي — س', 'ملف غياب — س', 'ورشة/نشاط س', 'حالة عنف', 'اتصال هاتفي', 'اجتماع ثلاثي', 'عادي', '', undefined]),
      result: pick(['مُنجز', 'قيد المتابعة', 'لم يكتمل', undefined]), duration: pick([0, 15, 45, undefined]) })),
  };
}

test('الأشهر: stSetMonth وstSetThisMonth وstShiftMonth', () => {
  const lg = runLegacy({});
  for (const ym of ['2026-10', '2026-02', '2024-02', '2026-12', '2027-01', '2026-13', '2026-00', 'x', '', undefined, '2026-1']) {
    delete lg.els.st_from; delete lg.els.st_to; delete lg.els.stMonthLabel;
    lg.el('st_month'); lg.el('st_from'); lg.el('st_to'); lg.el('stMonthLabel');
    lg.ctx.stSetMonth(ym);
    const m = S.monthRange(ym);
    if (!m) { assert.equal(lg.els.st_from.value, '', 'غير صالح ' + ym); assert.equal(S.monthRange(ym), null); continue; }
    assert.equal(lg.els.st_month.value, ym);
    assert.equal(lg.els.st_from.value, m.from);
    assert.equal(lg.els.st_to.value, m.to);
    assert.equal(lg.els.stMonthLabel.textContent, m.label);
  }
  lg.ctx.stSetThisMonth();
  assert.equal(lg.els.st_month.value, S.ymOf(NOW));
  for (const cur of ['2026-10', '2026-12', '2026-01', '2025-01', 'bad', '']) {
    for (const k of [-1, 1, -13, 13]) {
      lg.el('st_month').value = cur;
      lg.ctx.stShiftMonth(k);
      assert.equal(lg.els.st_month.value, S.shiftMonth(cur, k, NOW), `${cur} ${k}`);
    }
  }
});

test('أسابيع الشهر مطابقة', () => {
  const lg = runLegacy({});
  for (let y = 2024; y <= 2027; y++) for (let m = 1; m <= 12; m++) {
    const ym = y + '-' + String(m).padStart(2, '0');
    lg.ctx.stSetMonth(ym);
    const r = S.monthRange(ym);
    assert.deepEqual(J(lg.ctx.stMonthWeeks()), J(S.monthWeeks(r.from, r.to)), ym);
  }
  lg.els.st_from.value = ''; lg.els.st_to.value = '';
  assert.deepEqual(J(lg.ctx.stMonthWeeks()), []);
  assert.deepEqual(S.monthWeeks('', ''), []);
});

for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) {
  test(`التجميع: المهام الحيّة والمرشَّحة seed=${seed}`, () => {
    const data = makeData(seed);
    const lg = runLegacy(data);
    assert.deepEqual(J(lg.ctx.stLiveBaseTasks()), J(S.liveBaseTasks(data)), 'المصدر الحيّ');
    const r = (seed % 2) ? S.monthRange('2026-10') : null;
    for (const school of ['', '  ', 'الخوارزمي', ' ابن سينا ', 'ecole', 'xyz']) {
      for (const range of [r || { from: '', to: '' }, { from: '2026-10-05', to: '2026-10-20' }, { from: '', to: '2026-10-10' }, { from: '2026-10-15', to: '' }]) {
        lg.el('st_from').value = range.from; lg.el('st_to').value = range.to; lg.el('st_school_filter').value = school;
        assert.deepEqual(J(lg.ctx.stGetFilteredTasks()), J(S.filterTasks(data, { from: range.from, to: range.to, school })), `${school}|${range.from}|${range.to}`);
      }
    }
  });
}

test('ST_CATS: الفئات والترتيب والألوان والمرشِّحات مطابقة', () => {
  const lg = runLegacy({});
  const meta = J(vm.runInContext('ST_CATS.map(c => ({label:c.label, icon:c.icon, color:c.color}))', lg.ctx));
  assert.deepEqual(meta, S.ST_CATS.map(({ label, icon, color }) => ({ label, icon, color })));
  const tasks = [];
  for (const type of ['مقابلة فردية', 'جلسة إنصات', 'ورشة', 'أخرى', 'x', undefined]) {
    for (const title of ['إدماج مدرسي — س', 'ملف غياب — س', 'ورشة/نشاط س', 'حالة عنف', 'وضعية إعاقة', 'إحالة لجمعية', 'إخبار صحي', 'اتصال هاتفي', 'جلسة استماع مع ولي', 'اجتماع ثلاثي', 'زيارة منزلية', 'عادي', '', undefined]) tasks.push({ type, title });
  }
  lg.ctx.__tasks = tasks;
  const legacy = J(vm.runInContext('ST_CATS.map(c => __tasks.map(t => !!c.filter(t)))', lg.ctx));
  assert.deepEqual(legacy, S.ST_CATS.map((c) => tasks.map((t) => !!c.filter(t))));
});

for (const seed of [4, 9, 16, 25]) {
  test(`stRender: إعدادات الرسوم والبطاقات والمفتاح seed=${seed}`, () => {
    const data = makeData(seed);
    const lg = runLegacy(data);
    lg.ctx.stSetMonth('2026-10');
    lg.el('st_school_filter').value = '';
    lg.ctx.stRender();
    const tasks = S.filterTasks(data, { from: '2026-10-01', to: '2026-10-31', school: '' });
    const sum = S.summarize(tasks);
    const nums = [...lg.els.stKpiCards.innerHTML.matchAll(/font-weight:800;color:#[0-9a-f]{6};">(\d+)<\/div>/g)].map((m) => +m[1]);
    assert.deepEqual(nums, [sum.total, sum.done, sum.mins, sum.days], 'بطاقات KPI');
    assert.equal(lg.win.Chart.defaults.color, '#000');
    if (!sum.total) {
      assert.equal(lg.charts.length, 0);
      assert.match(lg.els.stResultLegend.innerHTML, new RegExp(S.NO_DATA_TEXT));
      return;
    }
    const wins = S.monthWeeks('2026-10-01', '2026-10-31');
    const cfg = S.chartConfigs(tasks, wins);
    // stSetMonth القديمة ترسم بنفسها ثم رسمنا ثانيةً: الرسوم الحيّة ثلاثة، والسابقة أُتلفت (كما يفعل المكوّن عند كل تحديث)
    const live = lg.charts.filter((c) => !c.destroyed);
    assert.equal(live.length, 3);
    assert.equal(lg.charts.length - live.length, lg.charts.length / 2, 'الرسوم السابقة أُتلفت');
    for (const c of live) assert.deepEqual(J(c.cfg), J(cfg[c.el.id]), c.el.id);
    const counts = S.resultCounts(tasks);
    const legend = [...lg.els.stResultLegend.innerHTML.matchAll(/<strong[^>]*>(\d+)<\/strong> (\S+(?: \S+)?) \((\d+)%\)/g)].map((m) => [+m[1], m[2], +m[3]]);
    assert.deepEqual(legend, S.RESULT_LABELS.map((l, i) => [counts[i], l, S.pct(counts[i], sum.total)]), 'المفتاح');
  });
}

test('stRender بلا بيانات: تُفرَّغ اللوحات ولا تُنشأ رسوم', () => {
  const lg = runLegacy({});
  lg.ctx.stSetMonth('2026-10');
  lg.ctx.stRender();
  assert.equal(lg.charts.length, 0);
  assert.match(lg.els.stResultLegend.innerHTML, /لا توجد بيانات للفترة المختارة/);
  assert.deepEqual(S.summarize([]), { total: 0, done: 0, mins: 0, days: 0 });
  assert.equal(S.pct(0, 0), 0);
});

test('مبيانات SVG مطابقة حرفياً', () => {
  const lg = runLegacy({});
  const r = rngOf(7);
  assert.equal(lg.ctx.stNiceStep(0), S.stNiceStep(0));
  for (const v of [0.5, 1, 2, 3, 6, 11, 26, 51, 101, 501, 1001, 2500]) assert.equal(lg.ctx.stNiceStep(v), S.stNiceStep(v), 'step ' + v);
  for (let t = 0; t < 20; t++) {
    const n = 1 + Math.floor(r() * 8);
    const vals = Array.from({ length: n }, () => Math.floor(r() * 40));
    const labels = vals.map((_, i) => 'تسمية ' + i), colors = vals.map(() => '#' + Math.floor(r() * 0xffffff).toString(16).padStart(6, '0'));
    assert.deepEqual(J(lg.ctx.stSvgBars(labels, vals, colors)), J(S.svgBars(labels, vals, colors)));
    const subs = vals.map((_, i) => i + ' – ' + (i + 6) + '/10');
    assert.deepEqual(J(lg.ctx.stSvgLine(labels, subs, vals)), J(S.svgLine(labels, subs, vals)));
    const dv = [vals[0] || 0, vals[1] || 0, vals[2] || 0], total = dv.reduce((a, b) => a + b, 0);
    assert.deepEqual(J(lg.ctx.stSvgDonut(['أ', 'ب', 'ج'], dv, ['#1', '#2', '#3'], total)), J(S.svgDonut(['أ', 'ب', 'ج'], dv, ['#1', '#2', '#3'], total)));
  }
  assert.deepEqual(J(lg.ctx.stSvgDonut(['أ'], [0], ['#1'], 0)), J(S.svgDonut(['أ'], [0], ['#1'], 0)));
  assert.deepEqual(J(lg.ctx.stSvgDonut(['أ'], [5], ['#1'], 5)), J(S.svgDonut(['أ'], [5], ['#1'], 5)));
});

for (const mode of ['ok', 'error', 'throw']) {
  test(`SVG→PNG مطابق للقديم (${mode})`, async () => {
    const lg = runLegacy({}, { pngMode: mode });
    const ch = S.svgBars(['أ', 'ب'], [3, 5], ['#111', '#222']);
    const legacy = await lg.ctx.stSvgToPng(ch);
    const mkCanvas = () => ({
      width: 0, height: 0,
      getContext: () => ({ fillStyle: '', fillRect() {}, drawImage() { if (mode === 'throw') throw new Error('x'); } }),
      toDataURL(t) { return 'png:' + this.width + 'x' + this.height + ':' + t; },
    });
    class FakeImage { set src(v) { (mode === 'error' ? this.onerror : this.onload)(); } }
    assert.equal(await S.svgToPng(ch, { Image: FakeImage, createCanvas: (w, h) => Object.assign(mkCanvas(), { width: w, height: h }) }), legacy);
  });
}

for (const seed of [2, 7, 12]) {
  test(`التقرير الشهري مطابق للقديم seed=${seed}`, async () => {
    const data = makeData(seed);
    const lg = runLegacy(data);
    lg.ctx.stSetMonth('2026-10');
    const range = S.monthRange('2026-10');
    const tasks = S.filterTasks(data, { from: range.from, to: range.to, school: '' });
    lg.el('stReportContent').innerHTML = 'قبل';
    await lg.ctx.stGenerateHTMLReport();
    if (!tasks.length) {
      assert.equal(lg.alerts[0], S.EMPTY_REPORT_ALERT);
      assert.equal(lg.els.stReportContent.innerHTML, 'قبل');
      return;
    }
    const model = S.reportModel(tasks, { ym: '2026-10', from: range.from, to: range.to });
    const pngs = await Promise.all(model.charts.map(async (ch) => {
      const mk = (w, h) => ({ width: w, height: h, getContext: () => ({ fillStyle: '', fillRect() {}, drawImage() {} }), toDataURL: (t) => 'png:' + w + 'x' + h + ':' + t });
      class Img { set src(v) { this.onload(); } }
      return S.svgToPng(ch, { Image: Img, createCanvas: mk });
    }));
    assert.equal(lg.els.stReportContent.innerHTML, S.reportHtml(model, pngs));
    assert.equal(lg.els.stPrintModal.classList.open, true);
  });
}

test('التقرير بمؤسسة مرشَّحة وبشهر آخر', async () => {
  const data = makeData(3, '2026-09');
  const lg = runLegacy(data);
  lg.ctx.stSetMonth('2026-09');
  lg.el('st_school_filter').value = 'الخوارزمي';
  const range = S.monthRange('2026-09');
  const tasks = S.filterTasks(data, { from: range.from, to: range.to, school: 'الخوارزمي' });
  await lg.ctx.stGenerateHTMLReport();
  if (!tasks.length) { assert.equal(lg.alerts[0], S.EMPTY_REPORT_ALERT); return; }
  const model = S.reportModel(tasks, { ym: '2026-09', from: range.from, to: range.to });
  assert.match(lg.els.stReportContent.innerHTML, new RegExp(model.period.replace(/[()]/g, '\\$&')));
  assert.match(lg.els.stReportContent.innerHTML, new RegExp('شهر ' + model.monthName));
});

// ثغرة اكتُشفت بالإفساد المتعمّد: مدرسة إحالات الجمعيات والإخبار الصحي تُقرأ من fields لا من e.school، ولم تغطّها البذور العشوائية
test('إحالات الجمعيات والإخبار الصحي: المؤسسة من fields وتصفيتها', () => {
  const data = {
    pdAssocArchive: [
      { id: 1, studentName: 'أ', date: '2026-10-03', school: 'تجاهل', fields: { 'pd3-school': 'إعدادية الأمل' } },
      { id: 2, studentName: 'ب', date: '2026-10-04', fields: {} },
      { id: 3, studentName: 'ج', date: '2026-10-05', fields: { 'pd3-school': '—' } },
    ],
    pdHealthArchive: [
      { id: 4, studentName: 'د', date: '2026-10-06', school: 'تجاهل', fields: { 'pd4-school': 'ثانوية النور' } },
      { id: 5, studentName: 'هـ', date: '2026-10-07' },
    ],
  };
  const lg = runLegacy(data);
  const mine = S.liveBaseTasks(data);
  assert.deepEqual(J(lg.ctx.stLiveBaseTasks()), J(mine));
  assert.deepEqual(mine.map((t) => t.school), ['إعدادية الأمل', '', '', 'ثانوية النور', '']);
  for (const school of ['الأمل', 'نور', 'تجاهل', '']) {
    lg.el('st_from').value = '2026-10-01'; lg.el('st_to').value = '2026-10-31'; lg.el('st_school_filter').value = school;
    assert.deepEqual(J(lg.ctx.stGetFilteredTasks()), J(S.filterTasks(data, { from: '2026-10-01', to: '2026-10-31', school })), school);
  }
});
