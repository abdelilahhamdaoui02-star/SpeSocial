// اختبار مطابقة الخطوة 39 (طباعة التقرير الأسبوعي وWord): نشغّل printWeeklyReportForRange وdownloadWeeklyReportWordForRange القديمتين
// (المجمَّدتين) على DOM مزيَّف يلتقط ما يُكتب في إطار الطباعة وما يوضع في عنصر Word، ونقارنه بوحدة weeklyPrint.js الجديدة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { PRINT_CSS, wrapSignatures, buildPrintDocument, printWeeklyReport, exportWeeklyWord, wordFileName } from '../src/weekly/weeklyPrint.js';
import { buildRows, buildReportHtml } from '../src/weekly/weeklyReport.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/weeklyprint.step39.js', import.meta.url), 'utf8');
const live = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
const wiredSrc = live.slice(live.indexOf('// الطباعة والتصدير إلى Word صارا'), live.indexOf('// المظهر المحفوظ يُطبَّق عند بدء التطبيق'));

const FROM = '2026-10-26';
const TO = '2026-11-01';
const HTMLS = [
  buildReportHtml(buildRows({ interviewArchive: [{ id: 1, interviewDate: '2026-10-27', studentName: 'أحمد', level: '1/1', subject: 'سلوك' }], parentCalls: [{ id: 2, name: 'سناء', date: '2026-10-28', result: 'تم الرد', notes: 'ملاحظة' }] }, FROM, TO), FROM, TO, ''),
  buildReportHtml([], FROM, TO, 'data:image/png;base64,AAA='),
  '<div class="x">لا توقيع</div>',
  '<p>a</p><div class="sig-block">1</div><div class="sig-block"><div class="sig-line"></div>2</div>\n  ',
];

// DOM مزيَّف: يلتقط الإطار (d.write) والمضيف المؤقت لـ Word، وتُسجَّل طلبات الطباعة والمؤقتات
function fakeEnv() {
  const log = { frames: [], writes: [], printed: 0, wordHosts: [], wordCalls: [], timers: [] };
  const mkEl = (tag) => {
    const el = {
      tag, style: {}, attrs: {}, removed: false, innerHTML: '', id: '',
      setAttribute(k, v) { this.attrs[k] = v; }, remove() { this.removed = true; },
    };
    if (tag === 'iframe') {
      const doc = {
        open() {}, close() {}, write(h) { log.writes.push(h); },
        querySelector: (q) => (q === '.nrh-logo img' ? null : null),
        fonts: undefined,
      };
      el.contentWindow = { document: doc, focus() {}, print() { log.printed++; } };
      log.frames.push(el);
    }
    return el;
  };
  const body = { appendChild(el) { if (el.tag === 'div') log.wordHosts.push(el); } };
  const document = { createElement: mkEl, getElementById: () => null, body };
  const setTimeout = (fn, ms) => { log.timers.push(ms); fn(); return 0; };
  const exportToWord = async (id, name) => { log.wordCalls.push({ id, name, html: log.wordHosts.at(-1)?.innerHTML, attrs: { ...log.wordHosts.at(-1)?.attrs }, css: log.wordHosts.at(-1)?.style.cssText }); };
  return { log, document, setTimeout, exportToWord, console };
}

function runPrint(src, html, from, to) {
  const env = fakeEnv();
  const ctx = { ...env, window: { exportToWord: env.exportToWord }, wkReportHtml: () => html, WeeklyPrint: { printWeeklyReport: undefined, exportWeeklyWord: undefined }, MINISTRY_LOGO_B64: '' };
  // القديم يستعمل exportToWord العامة؛ الجديد يستعملها عبر window
  ctx.exportToWord = env.exportToWord;
  return { ctx, env };
}

for (const [i, html] of HTMLS.entries()) {
  test(`مطابقة الطباعة: مستند الإطار المكتوب يطابق القديم (حالة ${i})`, () => {
    // القديم
    const { ctx: c1, env: e1 } = runPrint(legacySrc, html);
    vm.createContext(c1); vm.runInContext(legacySrc, c1);
    vm.runInContext(`printWeeklyReportForRange('${FROM}','${TO}')`, c1);
    // الجديد
    const e2 = fakeEnv();
    const g = globalThis; const prev = { document: g.document, setTimeout: g.setTimeout };
    g.document = e2.document; g.setTimeout = e2.setTimeout;
    try { printWeeklyReport(html); } finally { g.document = prev.document; g.setTimeout = prev.setTimeout; if (prev.document === undefined) delete g.document; }
    assert.equal(e1.log.writes.length, 1);
    assert.equal(e2.log.writes.length, 1);
    assert.equal(e2.log.writes[0], e1.log.writes[0]);
    assert.equal(e2.log.printed, e1.log.printed);
    assert.equal(e2.log.frames[0].id, e1.log.frames[0].id);
    assert.equal(e2.log.frames[0].style.cssText, e1.log.frames[0].style.cssText);
  });

  test(`مطابقة الطباعة بعد ربط script-10 (حالة ${i})`, () => {
    const { ctx: c1, env: e1 } = runPrint(legacySrc, html);
    vm.createContext(c1); vm.runInContext(legacySrc, c1); vm.runInContext(`printWeeklyReportForRange('${FROM}','${TO}')`, c1);

    const e3 = fakeEnv();
    const g = globalThis; const prev = { document: g.document, setTimeout: g.setTimeout };
    g.document = e3.document; g.setTimeout = e3.setTimeout;
    const ctx3 = { ...e3, wkReportHtml: () => html, WeeklyPrint: { printWeeklyReport, exportWeeklyWord } };
    try { vm.createContext(ctx3); vm.runInContext(wiredSrc, ctx3); vm.runInContext(`printWeeklyReportForRange('${FROM}','${TO}')`, ctx3); }
    finally { g.document = prev.document; g.setTimeout = prev.setTimeout; if (prev.document === undefined) delete g.document; }
    assert.equal(e3.log.writes[0], e1.log.writes[0]);
  });
}

test('wrapSignatures: يغلّف كتلتي التوقيع الأخيرتين فقط ولا يغيّر HTML بلا توقيع', () => {
  const w = wrapSignatures(HTMLS[3]);
  assert.ok(w.includes('<div class="sig-wrap"><div class="sig-block">1'));
  assert.ok(w.trimEnd().endsWith('</div></div>'));
  assert.equal(wrapSignatures('<b>x</b>'), '<b>x</b>');
});

test('buildPrintDocument: اتجاه RTL وCSS A4 أفقي والمحتوى داخل body', () => {
  const d = buildPrintDocument('<i>م</i>');
  assert.ok(d.startsWith('<!DOCTYPE html><html dir="rtl" lang="ar">'));
  assert.ok(d.includes('@page { size: A4 landscape; margin: 0; }'));
  assert.ok(d.includes('<body><i>م</i></body>'));
  assert.ok(PRINT_CSS.includes('wk-table-report'));
});

test('Word: عنصر مخفي بالمعرّف نفسه وبسمة الأفقي، واسم الملف كالقديم، ثم يُزال العنصر', async () => {
  // القديم
  const { ctx: c1, env: e1 } = runPrint(legacySrc, HTMLS[0]);
  vm.createContext(c1); vm.runInContext(legacySrc, c1);
  await vm.runInContext(`downloadWeeklyReportWordForRange('${FROM}','${TO}')`, c1);
  // الجديد (يستدعي exportToWord عبر window)
  const e2 = fakeEnv();
  const g = globalThis; const prev = { document: g.document, window: g.window };
  g.document = e2.document; g.window = { exportToWord: e2.exportToWord };
  try { await exportWeeklyWord(HTMLS[0], FROM, TO); } finally { g.document = prev.document; g.window = prev.window; if (prev.document === undefined) delete g.document; if (prev.window === undefined) delete g.window; }
  assert.deepEqual(e2.log.wordCalls, e1.log.wordCalls);
  assert.equal(e2.log.wordHosts[0].removed, true);
  assert.equal(e1.log.wordHosts[0].removed, true);
  assert.equal(wordFileName(FROM, TO), e1.log.wordCalls[0].name);
});
