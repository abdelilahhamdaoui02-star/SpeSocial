// اختبار مطابقة الخطوة 35 (نافذة اختيار الأسبوع): نشغّل الدوال القديمة (المجمَّدة) ونقارنها بـ weekPickerLogic الجديدة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { weekRange, endFromStart, previewText, validateRange, saveSelectedWeek, QUICK_PICKS, WP_FROM_KEY, WP_TO_KEY } from '../src/weekpicker/weekPickerLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/weekpicker.step35.js', import.meta.url), 'utf8');

// Date ثابت "الآن" (بتوقيت الجهاز المحلي) كي تتطابق النتائج يوماً بيوم
function fakeDateClass(ms) {
  return class extends Date {
    constructor(...a) { if (a.length === 0) super(ms); else super(...a); }
    static now() { return ms; }
  };
}

function runLegacy({ now = new Date(2026, 9, 28, 10, 0, 0), inputs = {}, storeInit = {} } = {}) {
  const els = {
    weekPickerModal: { style: { display: 'none' } },
    wpFromDate: { value: inputs.from || '' },
    wpToDate: { value: inputs.to || '' },
    wpPreview: { style: { display: 'none' }, innerHTML: '' },
  };
  const store = { ...storeInit };
  const log = { alerts: [], events: [], previewOpened: 0 };
  const ctx = vm.createContext({
    Date: fakeDateClass(now.getTime()),
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    document: { getElementById: (id) => els[id] },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    alert: (m) => log.alerts.push(m),
    openWeeklyReportPreview: () => { log.previewOpened++; },
  });
  ctx.window = { dispatchEvent: (e) => log.events.push(e) };
  vm.runInContext(legacySrc, ctx);
  const call = (name, ...args) => vm.runInContext(name, ctx)(...args);
  return { els, store, log, call };
}

// أيام الأسبوع كلها + حدود الأشهر والسنة + سنة كبيسة
const NOWS = [
  new Date(2026, 9, 26, 9, 0), new Date(2026, 9, 27, 9, 0), new Date(2026, 9, 28, 9, 0), new Date(2026, 9, 29, 9, 0),
  new Date(2026, 9, 30, 9, 0), new Date(2026, 9, 31, 9, 0), new Date(2026, 10, 1, 9, 0),
  new Date(2026, 0, 1, 0, 30), new Date(2026, 11, 31, 23, 30), new Date(2024, 1, 29, 12, 0), new Date(2027, 2, 1, 6, 0),
];

for (const now of NOWS) {
  for (const offset of [0, -1, -2]) {
    test(`مطابقة wpGetWeekRange: ${now.toDateString()} / ${offset}`, () => {
      const old = runLegacy({ now }).call('wpGetWeekRange', offset);
      assert.deepEqual(weekRange(offset, now), { from: old.from, to: old.to }); // نقارن القيم فقط (كائنات vm من عالَم آخر)
    });
  }
}

test('مطابقة أزرار الاختيار السريع (هذا الأسبوع / الماضي / قبل أسبوعين)', () => {
  const names = { this: 'wpSetThisWeek', last: 'wpSetLastWeek', before: 'wpSetWeekBefore' };
  for (const now of NOWS) {
    for (const p of QUICK_PICKS) {
      const old = runLegacy({ now });
      old.call(names[p.id]);
      const mine = weekRange(p.offset, now);
      assert.equal(old.els.wpFromDate.value, mine.from);
      assert.equal(old.els.wpToDate.value, mine.to);
      assert.equal(old.els.wpPreview.innerHTML.replace(/&nbsp;/g, '\u00a0'), previewText(mine.from, mine.to));
    }
  }
});

test('مطابقة فتح النافذة: تبدأ على هذا الأسبوع', () => {
  for (const now of NOWS) {
    const old = runLegacy({ now });
    old.call('openWeekPickerModal');
    assert.equal(old.els.weekPickerModal.style.display, 'flex');
    const r = weekRange(0, now);
    assert.equal(old.els.wpFromDate.value, r.from);
    assert.equal(old.els.wpToDate.value, r.to);
  }
});

const FROMS = ['2026-10-26', '2026-12-28', '2024-02-26', '2026-02-27', '2027-01-01', '2026-10-31'];
for (const from of FROMS) {
  test(`مطابقة wpSyncToDate: ${from}`, () => {
    const old = runLegacy({ inputs: { from } });
    old.call('wpSyncToDate');
    assert.equal(old.els.wpToDate.value, endFromStart(from));
    assert.equal(old.els.wpPreview.innerHTML.replace(/&nbsp;/g, '\u00a0'), previewText(from, endFromStart(from)));
  });
}

test('مطابقة wpSyncToDate: «من تاريخ» فارغ لا يغيّر شيئاً', () => {
  const old = runLegacy({ inputs: { from: '', to: '2026-11-01' } });
  old.call('wpSyncToDate');
  assert.equal(old.els.wpToDate.value, '2026-11-01');
  assert.equal(endFromStart(''), null);
});

const PREVIEWS = [['2026-10-26', '2026-11-01'], ['2026-10-26', '2026-10-26'], ['2026-10-26', '2026-10-20'], ['2026-02-27', '2026-03-05'], ['', '2026-11-01'], ['2026-10-26', ''], ['', '']];
for (const [from, to] of PREVIEWS) {
  test(`مطابقة wpUpdatePreview: «${from}» → «${to}»`, () => {
    const old = runLegacy();
    old.call('wpUpdatePreview', from, to);
    const mine = previewText(from, to);
    if (mine === null) {
      assert.equal(old.els.wpPreview.style.display, 'none');
    } else {
      assert.equal(old.els.wpPreview.style.display, 'block');
      assert.equal(old.els.wpPreview.innerHTML.replace(/&nbsp;/g, '\u00a0'), mine);
    }
  });
}

const GEN = [['', ''], ['2026-10-26', ''], ['', '2026-11-01'], ['2026-11-02', '2026-10-26'], ['2026-10-26', '2026-11-01'], ['2026-10-26', '2026-10-26']];
for (const [from, to] of GEN) {
  test(`مطابقة wpGenerateReport: «${from}» → «${to}»`, () => {
    const old = runLegacy({ inputs: { from, to }, storeInit: {} });
    old.call('openWeekPickerModal'); // يعيد ضبط الحقول على هذا الأسبوع، فنعيد وضع مدخلاتنا
    old.els.wpFromDate.value = from; old.els.wpToDate.value = to;
    old.call('wpGenerateReport');
    const err = validateRange(from, to);
    if (err) {
      assert.deepEqual(old.log.alerts, [err]);
      assert.deepEqual(old.store, {});
      assert.equal(old.log.previewOpened, 0);
      assert.equal(old.els.weekPickerModal.style.display, 'flex');
    } else {
      assert.deepEqual(old.log.alerts, []);
      const mine = {};
      saveSelectedWeek({ setItem: (k, v) => { mine[k] = String(v); } }, from, to);
      assert.deepEqual(old.store, mine);
      assert.deepEqual(old.store, { [WP_FROM_KEY]: from, [WP_TO_KEY]: to });
      assert.equal(old.log.events.length, 1);
      assert.equal(old.log.events[0].type, 'legacy:week-range');
      assert.deepEqual({ ...old.log.events[0].detail }, { from, to });
      assert.equal(old.els.weekPickerModal.style.display, 'none');
      assert.equal(old.log.previewOpened, 1);
    }
  });
}

test('saveSelectedWeek: لا يرمي خطأ إن كان التخزين معطّلاً', () => {
  assert.doesNotThrow(() => saveSelectedWeek({ setItem() { throw new Error('quota'); } }, '2026-10-26', '2026-11-01'));
});
