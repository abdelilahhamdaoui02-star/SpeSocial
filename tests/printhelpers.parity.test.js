// اختبار مطابقة مساعدات الطباعة (المرحلة 46): نشغّل النسخ القديمة المجمَّدة (script-37 وجزء script-16 وجزء script-10)
// في سياق vm بـDOM مُحاكى، ونقارنها بـsrc/print/printHelpers.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  buildCompactRows, convertGrid, compactAllGrids, isFullField,
  markEmptyFields, waitLogoThenPrint, createPrintMode, COMPACT_TABLE_STYLE,
} from '../src/print/printHelpers.js';

const read = (n) => fs.readFileSync(new URL('./fixtures/' + n, import.meta.url), 'utf8');
const compactSrc = read('script-37.step45.js');
const waitSrc = read('waitlogo.step45.js');
const modeSrc = read('printmode.step45.js');

// ───────── DOM مُحاكى ─────────
function mkField(lbl, val, o = {}) {
  return {
    getAttribute: (n) => (n === 'style' ? (o.style || null) : null),
    classList: { contains: (c) => c === 'empty-field' && !!o.empty },
    querySelector: (sel) => {
      if (sel === '.lbl') return o.noLbl ? null : { innerHTML: lbl };
      if (sel === '.val') return { innerHTML: val };
      return null;
    },
  };
}
function mkGrid(fields) {
  const parent = { replaced: null, replaceChild(n) { this.replaced = n; } };
  return {
    attrs: {}, parentNode: parent,
    querySelectorAll: () => fields,
    setAttribute(k, v) { this.attrs[k] = v; },
  };
}
function mkDoc(grids) {
  return {
    body: {},
    querySelectorAll: () => grids,
    createElement: (tag) => ({ tag, className: '', attrs: {}, innerHTML: '', setAttribute(k, v) { this.attrs[k] = v; } }),
  };
}
const snapshot = (grid) => ({
  table: grid.parentNode.replaced && {
    className: grid.parentNode.replaced.className,
    attrs: grid.parentNode.replaced.attrs,
    html: grid.parentNode.replaced.innerHTML,
  },
  gridAttrs: grid.attrs,
});

function runLegacyCompact(makeFields) {
  const grid = mkGrid(makeFields());
  const doc = mkDoc([grid]);
  const listeners = {};
  const ctx = vm.createContext({
    document: doc,
    window: { addEventListener: (n, fn) => { listeners[n] = fn; } },
    MutationObserver: class { observe() {} },
    requestAnimationFrame: (fn) => fn(),
  });
  vm.runInContext(compactSrc, ctx);
  return snapshot(grid);
}
function runMineCompact(makeFields) {
  const grid = mkGrid(makeFields());
  compactAllGrids(mkDoc([grid]));
  return snapshot(grid);
}

const CASES = {
  'أزواج عادية وعدد فردي': () => [mkField('أ', '1'), mkField('ب', '2'), mkField('ج', '3')],
  'حقل عريض في الوسط': () => [mkField('أ', '1'), mkField('ع', 'نص طويل', { style: 'grid-column:span 2' }), mkField('ب', '2'), mkField('ج', '3')],
  'span 1 ليس عريضاً وspan 3 عريض': () => [mkField('أ', '1', { style: 'grid-column: span 1' }), mkField('ب', '2'), mkField('ج', '3', { style: 'grid-column : span 3' })],
  'تخطي الحقول الفارغة وبلا عنوان': () => [mkField('أ', '1', { empty: true }), mkField('ب', '2', { noLbl: true }), mkField('ج', '3'), mkField('د', '4')],
  'كل الحقول متخطاة': () => [mkField('أ', '1', { empty: true }), mkField('ب', '2', { noLbl: true })],
  'شبكة فارغة': () => [],
  'محتوى HTML داخل القيم': () => [mkField('<b>اسم</b>', '<i>محمد</i> &amp; أحمد'), mkField('ص', '<br>')],
};

for (const [name, make] of Object.entries(CASES)) {
  test('الجدول المضغوط يطابق script-37 القديم — ' + name, () => {
    assert.deepEqual(runMineCompact(make), runLegacyCompact(make));
  });
}

test('ثوابت الجدول المضغوط', () => {
  const grid = mkGrid([mkField('أ', '1')]);
  convertGrid(grid, mkDoc([grid]));
  const t = grid.parentNode.replaced;
  assert.equal(t.className, 'info-table-report');
  assert.equal(t.attrs['data-compact'], '1');
  assert.equal(t.attrs.style, COMPACT_TABLE_STYLE);
  assert.ok(t.innerHTML.startsWith('<tbody>') && t.innerHTML.endsWith('</tbody>'));
  assert.equal(isFullField(mkField('x', 'y', { style: 'grid-column:span 2' })), true);
  assert.equal(isFullField(mkField('x', 'y')), false);
  assert.deepEqual(buildCompactRows([]), []);
});

// ───────── وسم الحقول الفارغة وانتظار الشعار ─────────
function mkField2(text) {
  const cls = new Set();
  const valEl = { textContent: text };
  return { cls, classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c) }, querySelector: (s) => (s === '.val' ? valEl : null) };
}
function mkImg(state) {
  return { complete: state === 'loaded', naturalHeight: state === 'loaded' ? 10 : 0, onload: null, onerror: null };
}
function scenario(kind) {
  const fields = [mkField2('—'), mkField2('  '), mkField2('-'), mkField2('قيمة')];
  const imgs = kind === 'none' ? [] : kind === 'loaded' ? [mkImg('loaded'), mkImg('loaded')] : [mkImg('loaded'), mkImg('pending')];
  const doc = { querySelectorAll: (sel) => (sel.includes('.report-field') ? fields : imgs) };
  return { fields, imgs, doc };
}
function drive(kind, action) {
  const sc = scenario(kind);
  const timers = [];
  const log = { prints: 0 };
  const later = (fn, ms) => timers.push({ fn, ms });
  return { sc, timers, log, later };
}
const marks = (fields) => fields.map((f) => f.cls.has('empty-field'));

for (const kind of ['none', 'loaded', 'pending']) {
  for (const action of ['onload', 'onerror', 'timer']) {
    test(`انتظار الشعار يطابق القديم — ${kind} / ${action}`, () => {
      const run = (impl) => {
        const d = drive(kind);
        impl(d);
        // نحاكي الحدث المطلوب ثم نُطلق المؤقتات بترتيبها
        if (action !== 'timer') d.sc.imgs.forEach((i) => { if (i[action]) i[action](); });
        d.timers.forEach((t) => t.fn());
        return { prints: d.log.prints, timers: d.timers.map((t) => t.ms), marks: marks(d.sc.fields) };
      };
      const legacy = run((d) => {
        const ctx = vm.createContext({
          document: d.sc.doc, setTimeout: d.later,
          window: { print: () => { d.log.prints++; } },
        });
        vm.runInContext(waitSrc, ctx);
        ctx._waitLogoThenPrint();
      });
      const mine = run((d) => {
        waitLogoThenPrint({ document: d.sc.doc, setTimeout: d.later, print: () => { d.log.prints++; } });
      });
      assert.deepEqual(mine, legacy);
      assert.ok(mine.prints >= 1, 'يجب أن تُطبع مرة على الأقل');
    });
  }
}

test('وسم الحقول الفارغة: القيمة تُعاد حين تمتلئ', () => {
  const f = mkField2('—');
  const doc = { querySelectorAll: () => [f] };
  markEmptyFields(doc);
  assert.equal(f.cls.has('empty-field'), true);
  f.querySelector('.val').textContent = 'محمد';
  markEmptyFields(doc);
  assert.equal(f.cls.has('empty-field'), false);
});

// ───────── وضع الطباعة ─────────
function mkModeDoc(open) {
  const classes = new Set();
  return { classes, title: 'المنصة', querySelector: () => (open ? {} : null), documentElement: { classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) } } };
}
for (const open of [true, false]) {
  test('وضع الطباعة يطابق script-10 القديم — نافذة طباعة ' + (open ? 'مفتوحة' : 'مغلقة'), () => {
    const legacyDoc = mkModeDoc(open);
    const listeners = {};
    const ctx = vm.createContext({ document: legacyDoc, window: { addEventListener: (n, fn) => { listeners[n] = fn; } } });
    vm.runInContext(modeSrc, ctx);
    const mineDoc = mkModeDoc(open);
    const mode = createPrintMode(mineDoc);

    const state = (d) => ({ cls: [...d.classes], title: d.title });
    listeners.beforeprint(); mode.before();
    assert.deepEqual(state(mineDoc), state(legacyDoc));
    listeners.beforeprint(); mode.before(); // استدعاء ثانٍ لا يُضيّع العنوان الأصلي
    listeners.afterprint(); mode.after();
    assert.deepEqual(state(mineDoc), state(legacyDoc));
    assert.equal(mineDoc.title, 'المنصة');
    assert.deepEqual(mineDoc.classes.size, 0);
  });
}
