// اختبار مطابقة: نشغّل script-24.js القديم (نسخة المرحلة 9 المجمَّدة) في بيئة معزولة،
// ونقارن كل ما يعرضه ويطبعه بما تنتجه دوال src/casefile/casefileLogic.js على البيانات نفسها.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildGroups, searchCases, fileModel, fileHtml, buildPrintHtml, CF_CSS, esc, nz } from '../src/casefile/casefileLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/script-24.step9.js', import.meta.url), 'utf8');
const s18 = fs.readFileSync(new URL('./fixtures/behavior.step18.js', import.meta.url), 'utf8');

// نستخرج من النسخة المجمَّدة لـ script-18.js (tests/fixtures/behavior.step18.js، وقد حُذف الأصل في المرحلة 18) دوال السلوك الحقيقية (bmIso/bmAgo/bmStats/bmTierLbl وثابت BM_EV_DIMS) لنقارن بها فعلاً
function grab(re, endRe) {
  const i = s18.search(re);
  assert.ok(i >= 0, 'لم أجد ' + re);
  const rest = s18.slice(i);
  const m = rest.match(endRe);
  return rest.slice(0, m.index + m[0].length);
}
const bmCode = [
  grab(/function bmIso\(/, /\n/),
  grab(/function bmAgo\(/, /\n/),
  grab(/const BM_EV_DIMS = \[/, /\n\];/),
  grab(/function bmStats\(/, /\n\}\n/),
  grab(/function bmTierLbl\(/, /\n/),
].join('\n');

const NOW = new Date(2026, 9, 23, 14, 30);

function rngOf(seed) {
  let x = seed;
  return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
}

// أسماء تتضمن اختلافات الهمزة والتاء المربوطة والياء، ومحارف HTML خاصة
const NAMES = ['أحمد بنعلي', 'احمد بنعلي', 'فاطمة الزهراء', 'فاطمه الزهراء', 'يوسف العلوي', 'يوسف العلوى', 'سارة <b>x</b>', "مريم \"د'ريس\"", 'ياسين & سلمى', 'إيمان الحسني', 'ايمان الحسنى', 'عمر', 'نور الدين الإدريسي', 'نور الدين الادريسي'];
const LEVELS = ['1AC-3', '2AC-1', '3AC-2', '—', '', null];
const PRIOS = ['عاجل', 'عالي', 'مرتفع', 'عادي', 'منخفض', '', undefined, '—'];

function makeData(seed) {
  const r = rngOf(seed);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const day = (off = 0) => { const d = new Date(NOW.getTime()); d.setDate(d.getDate() - Math.floor(r() * 20) + off); return d.toISOString().slice(0, 10); };
  const base = (i) => {
    const o = { id: Math.floor(r() * 5) + i, studentName: pick(NAMES), savedAt: r() > 0.5 ? day() + 'T09:00' : undefined };
    if (r() > 0.4) o.massar = pick(['M123456', 'G987654', ' ', '—', undefined]);
    if (r() > 0.4) o.level = pick(LEVELS);
    if (r() > 0.5) o.school = pick(['إعدادية الخوارزمي', 'ثانوية ابن سينا', '-', '']);
    if (r() > 0.2) o.priority = pick(PRIOS);
    return o;
  };
  const mk = (n, f) => Array.from({ length: n }, (_, i) => f(base(i), i));
  const txt = () => pick(['نص عادي', 'سطر 1\nسطر 2', '<script>alert(1)</script>', '', undefined, '—', ['أ', '', 'ب']]);
  const obsOf = () => Array.from({ length: Math.floor(r() * 8) }, (_, k) => ({ id: k, date: day(), kind: r() > 0.5 ? 'con' : 'pos', sev: 1 + Math.floor(r() * 3), beh: 'سلوك' }));
  return {
    interviewArchive: mk(Math.floor(r() * 9), (b) => ({ ...b, interviewDate: r() > 0.2 ? day() : 'غير صالح', subject: txt(), summary: txt(), recommendation: txt() })),
    reintegrationArchive: mk(Math.floor(r() * 5), (b) => ({ ...b, reintegrationDate: day(), causes: txt(), absenceDuration: txt() })),
    absenceArchive: mk(Math.floor(r() * 9), (b) => ({ ...b, recordDate: day(), totalHours: Math.floor(r() * 40), unjustifiedHours: txt(), totalDays: r() > 0.5 ? 0 : 3 })),
    violenceArchive: mk(Math.floor(r() * 5), (b) => ({ ...b, reportDate: day(), aggName: txt(), types: txt(), description: txt() })),
    contactsArchive: mk(Math.floor(r() * 6), (b) => ({ ...b, date: day(), type: txt(), parentName: txt(), parentPhone: txt(), result: txt() })),
    specialNeedsArchive: mk(Math.floor(r() * 4), (b) => ({ ...b, recordDate: day(), category: txt(), hasReport: pick(['نعم', 'لا', true, false]), adaptations: txt() })),
    vigilanceCases: mk(Math.floor(r() * 4), (b) => ({ ...b, date: day(), category: txt(), status: txt(), trackingLogs: r() > 0.5 ? [1, 2, 3] : [] })),
    behaviorFiles: mk(Math.floor(r() * 5), (b) => ({ ...b, obs: obsOf(), tier: pick(['1', '2', '3', '2+3']), plan: r() > 0.5 ? { goal: txt(), review: day() } : undefined, reason: txt(), addedAt: day() })),
  };
}

function runLegacy(data, user = 'u1') {
  const els = {};
  // عنصر الأنماط لا يُنشأ تلقائياً: الكود القديم يحقنه بنفسه إن لم يجده
  const el = (id) => (id === 'cfStyleV17' ? (els[id] || null) : (els[id] ??= { id, value: '', innerHTML: '', style: {}, textContent: '' }));
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } }
  const written = [];
  const alerts = [];
  const win = { open: () => ({ document: { open() {}, write: (h) => written.push(h), close() {} }, focus() {}, print() {} }) };
  const ctx = vm.createContext({
    window: win, Date: FixedDate, console, appData: data, currentUser: user, alert: (m) => alerts.push(m),
    setTimeout() {}, MINISTRY_LOGO_B64: 'data:image/png;base64,AAAA',
    document: { getElementById: el, head: { appendChild(n) { els[n.id] = n; } }, createElement: () => ({ id: '', textContent: '' }) },
  });
  vm.runInContext(`
    function getArchive(){return appData.interviewArchive;} function getRArchive(){return appData.reintegrationArchive;}
    function getAbArchive(){return appData.absenceArchive;} function getVioArchive(){return appData.violenceArchive||[];}
    function getCtArchive(){return appData.contactsArchive||[];} function getSnArchive(){return appData.specialNeedsArchive||[];}
    function vigGetArchive(){return appData.vigilanceCases||[];} function bmGet(){return appData.behaviorFiles||[];}
    ${bmCode}
  `, ctx);
  vm.runInContext(legacySrc, ctx);
  return { win, els, written, alerts };
}

// يحوّل نتيجة البحث إلى نص HTML بنفس صياغة الكود القديم (للأنواع التي لا يطبعها الإنتاج كنص)
function resultToLegacyString(result) {
  if (result.kind === 'short') return '<div class="cf-empty">🔍 اكتب حرفين على الأقل من اسم التلميذ(ة) لعرض ملفه الشامل.</div>';
  if (result.kind === 'none') {
    return '<div class="cf-empty">لا توجد سجلات باسم «' + esc(result.query) + '». ' +
      'تظهر هنا فقط التلاميذ الذين سُجّلت لهم مقابلة أو ملف في إحدى الأدوات.</div>';
  }
  if (result.kind === 'one') return fileHtml(fileModel(result.group));
  return '<div style="font-weight:700;color:#475569;margin:10px 0;">وُجد ' + result.total +
    ' تلميذ(ة) — اختر واحداً:</div>' + result.picks.map((g, i) =>
    '<div class="cf-pick" onclick="cfSelectStudent(' + i + ')"><span>👤</span><span style="flex:1;">' + esc(g.name) +
    '</span><span style="font-size:.75rem;color:#64748b;">' + esc(g.level) + '</span><span style="font-size:.75rem;color:#0f766e;">' +
    g.total + ' سجل</span></div>').join('');
}

const QUERIES = ['', 'أ', 'احمد', 'أحمد بنعلي', 'احمد بنعلى', 'فاطمه', 'الزهراء', 'يوسف', 'سارة', '<b>', 'ياسين &', 'مريم', 'عمر', 'نور', 'الادريسي', 'ايمان', 'M123456', 'm12', 'G98', 'غير موجود', '  احمد   بنعلي  ', 'ب'];

for (const seed of [1, 2, 3, 5, 8, 13, 21, 42]) {
  test(`مطابقة للقديم: نتائج البحث والملف seed=${seed}`, () => {
    const data = makeData(seed);
    const { win, els } = runLegacy(data);
    const groups = buildGroups(data, { user: 'u1', today: NOW, storage: null });
    for (const q of QUERIES) {
      els.cf_search = { value: q };
      win.cfRenderSearch();
      const result = searchCases(groups, q);
      assert.equal(els.cfResultsContainer.innerHTML, resultToLegacyString(result), `استعلام «${q}»`);
      assert.equal(els.cfPrintBtnRow.style.display === '', result.kind === 'one', `زر الطباعة «${q}»`);
    }
  });

  test(`مطابقة للقديم: اختيار تلميذ من القائمة seed=${seed}`, () => {
    const data = makeData(seed);
    const { win, els } = runLegacy(data);
    const groups = buildGroups(data, { user: 'u1', today: NOW, storage: null });
    els.cf_search = { value: 'ا' };
    for (const q of ['ا', 'ي', 'ن', 'ر']) {
      els.cf_search = { value: q };
      win.cfRenderSearch();
      const many = searchCases(groups, q);
      if (many.kind !== 'many') continue;
      for (let i = 0; i < many.picks.length; i++) {
        win.cfSelectStudent(i);
        // الإنتاج: الاختيار يضع الاسم في خانة البحث ثم يبحث → يجب أن يظهر الملف نفسه
        const after = searchCases(groups, many.picks[i].name);
        assert.equal(after.kind, 'one');
        assert.equal(els.cfResultsContainer.innerHTML, fileHtml(fileModel(after.group)));
        assert.equal(els.cf_search.value, many.picks[i].name);
      }
    }
  });

  test(`مطابقة للقديم: صفحة الطباعة seed=${seed}`, () => {
    const data = makeData(seed);
    const groups = buildGroups(data, { user: 'u1', today: NOW, storage: null });
    const names = [...new Set(Object.values(groups).map((g) => g.name))];
    for (const name of names) {
      const { win, els, written } = runLegacy(data);
      els.cf_search = { value: name };
      win.cfRenderSearch();
      const r = searchCases(groups, name);
      if (r.kind !== 'one') continue;
      win.cfPrintFile();
      assert.equal(written.length, 1);
      assert.equal(written[0], buildPrintHtml(fileModel(r.group), { logo: 'data:image/png;base64,AAAA', today: NOW.toLocaleDateString('ar-MA') }), name);
    }
  });
}

test('الأنماط (CSS) مطابقة حرفياً للقديم', () => {
  const { win, els } = runLegacy(makeData(1));
  els.cf_search = { value: '' };
  win.cfRenderSearch();
  assert.equal(els.cfStyleV17.textContent, CF_CSS);
});

test('الطباعة بلا شعار تطابق القديم', () => {
  const data = makeData(3);
  const groups = buildGroups(data, { user: 'u1', today: NOW, storage: null });
  const name = Object.values(groups)[0].name;
  const els = {}; const written = [];
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } }
  const ctx = vm.createContext({
    window: { open: () => ({ document: { open() {}, write: (h) => written.push(h), close() {} }, focus() {}, print() {} }) },
    Date: FixedDate, console, appData: data, currentUser: 'u1', alert() {}, setTimeout() {},
    document: { getElementById: (id) => (id === 'cfStyleV17' ? (els[id] || null) : (els[id] ??= { id, value: '', style: {} })), head: { appendChild(n) { els[n.id] = n; } }, createElement: () => ({}) },
  });
  vm.runInContext(`function getArchive(){return appData.interviewArchive;} function getRArchive(){return appData.reintegrationArchive;}
    function getAbArchive(){return appData.absenceArchive;} function getVioArchive(){return appData.violenceArchive||[];}
    function getCtArchive(){return appData.contactsArchive||[];} function getSnArchive(){return appData.specialNeedsArchive||[];}
    function vigGetArchive(){return appData.vigilanceCases||[];} function bmGet(){return appData.behaviorFiles||[];}${bmCode}`, ctx);
  vm.runInContext(legacySrc, ctx);
  els.cf_search = { value: name };
  ctx.window.cfRenderSearch();
  ctx.window.cfPrintFile();
  const r = searchCases(groups, name);
  assert.equal(written[0], buildPrintHtml(fileModel(r.group), { logo: '', today: NOW.toLocaleDateString('ar-MA') }));
});

test('مصدر معطوب لا يوقف بقية المصادر (كالقديم)', () => {
  const data = makeData(5);
  data.behaviorFiles = [{ studentName: 'أحمد بنعلي', id: 1 }]; // بلا obs → الخطأ داخل المصدر
  const { win, els } = runLegacy(data);
  const groups = buildGroups(data, { user: 'u1', today: NOW, storage: null });
  els.cf_search = { value: 'احمد' };
  win.cfRenderSearch();
  assert.equal(els.cfResultsContainer.innerHTML, resultToLegacyString(searchCases(groups, 'احمد')));
});

test('خلية اليقظة: بلا مستخدم لا شيء، وتُقرأ من localStorage عند فراغ الذاكرة', () => {
  const data = { vigilanceCases: [] };
  const rec = [{ studentName: 'سعد', date: '2026-10-01', category: 'ج' }];
  const store = { getItem: (k) => (k === 'u1:vigilanceCases' ? JSON.stringify(rec) : null) };
  assert.equal(Object.keys(buildGroups(data, { user: null, today: NOW, storage: store })).length, 0);
  assert.equal(Object.keys(buildGroups(data, { user: 'u1', today: NOW, storage: store })).length, 1);
  assert.equal(Object.keys(buildGroups(data, { user: 'u1', today: NOW, storage: { getItem() { throw new Error('x'); } } })).length, 0);
});

test('nz يوحّد الهمزات والتاء المربوطة والياء', () => {
  assert.equal(nz('  أحمد   الزَهراء '), nz('احمد الزَهراء'));
  assert.equal(nz('فاطمة'), nz('فاطمه'));
  assert.equal(nz('موسى'), nz('موسي'));
});
