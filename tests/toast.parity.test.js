// اختبار مطابقة الإشعارات: نشغّل showToast القديمة (النسخة المجمَّدة للمرحلة 31) بـDOM وموقّتات مُحاكاة،
// ونقارن الألوان والنص ومدد الظهور والتلاشي والإزالة بـsrc/ui/toastLogic.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { TOAST_FADE_MS, TOAST_VISIBLE_MS, createToastStore, toastColors } from '../src/ui/toastLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/toast.step31.js', import.meta.url), 'utf8');

function runLegacy(message, type) {
  const created = [];
  const timers = [];
  const ctx = vm.createContext({
    document: {
      createElement: () => { const el = { style: {}, textContent: '', removed: false, remove() { this.removed = true; } }; created.push(el); return el; },
      body: { appendChild() {} },
    },
    setTimeout: (fn, ms) => timers.push({ fn, ms }),
  });
  vm.runInContext(legacySrc, ctx);
  ctx.showToast(message, type);
  return { el: created[0], timers };
}

function runMine(message, type) {
  const timers = [];
  const store = createToastStore({ schedule: (fn, ms) => timers.push({ fn, ms }) });
  store.show(message, type);
  return { store, timers };
}

test('الألوان لكل نوع (والنوع المجهول/الفارغ = نجاح)', () => {
  for (const type of ['success', 'warning', 'error', undefined, '', 'غير معروف']) {
    const { el } = runLegacy('رسالة', type);
    const c = toastColors(type);
    assert.equal(el.style.background, c.bg, String(type));
    assert.equal(el.style.border, '2px solid ' + c.border, String(type));
    assert.equal(el.style.color, c.color, String(type));
  }
});

test('النص يظهر كما هو (بلا HTML)', () => {
  const { el } = runLegacy('⚠️ <b>حجم</b> البيانات كبير', 'warning');
  const { store } = runMine('⚠️ <b>حجم</b> البيانات كبير', 'warning');
  assert.equal(store.getSnapshot()[0].message, el.textContent);
});

test('المدد: 4000ms ظهور ثم تلاشٍ 400ms ثم إزالة — مثل القديم', () => {
  const legacy = runLegacy('م', 'success');
  const mine = runMine('م', 'success');
  assert.equal(legacy.timers.length, 1);
  assert.equal(legacy.timers[0].ms, TOAST_VISIBLE_MS);
  assert.equal(mine.timers[0].ms, TOAST_VISIBLE_MS);
  assert.equal(legacy.el.style.opacity, '1');
  assert.equal(mine.store.getSnapshot()[0].leaving, false);

  legacy.timers[0].fn(); mine.timers[0].fn();
  assert.equal(legacy.el.style.opacity, '0');
  assert.equal(mine.store.getSnapshot()[0].leaving, true);
  assert.equal(legacy.timers[1].ms, TOAST_FADE_MS);
  assert.equal(mine.timers[1].ms, TOAST_FADE_MS);
  assert.equal(legacy.el.removed, false);
  assert.equal(mine.store.getSnapshot().length, 1);

  legacy.timers[1].fn(); mine.timers[1].fn();
  assert.equal(legacy.el.removed, true);
  assert.equal(mine.store.getSnapshot().length, 0);
});

test('عدة إشعارات متزامنة: كل واحد يُزال في موعده دون المساس بالآخر', () => {
  const timers = [];
  const store = createToastStore({ schedule: (fn, ms) => timers.push({ fn, ms }) });
  const a = store.show('أ'); const b = store.show('ب', 'error');
  assert.deepEqual(store.getSnapshot().map((t) => t.message), ['أ', 'ب']);
  timers[0].fn(); // يبدأ تلاشي «أ» فقط
  assert.deepEqual(store.getSnapshot().map((t) => t.leaving), [true, false]);
  timers[2].fn(); // موقّت إزالة «أ» (الموقّت 1 هو ظهور «ب»)
  assert.deepEqual(store.getSnapshot().map((t) => t.id), [b]);
  assert.notEqual(a, b);
});

test('المشتركون يُبلَغون عند كل تغيير ويمكن إلغاء الاشتراك', () => {
  const timers = [];
  const store = createToastStore({ schedule: (fn, ms) => timers.push({ fn, ms }) });
  let n = 0;
  const off = store.subscribe(() => { n++; });
  store.show('1');
  assert.equal(n, 1);
  off();
  store.show('2');
  assert.equal(n, 1);
});

test('رسالة فارغة أو غير نصية لا تكسر', () => {
  const store = createToastStore({ schedule() {} });
  store.show(undefined); store.show(null); store.show(42);
  assert.deepEqual(store.getSnapshot().map((t) => t.message), ['', '', '42']);
  assert.equal(store.getSnapshot()[0].type, 'success');
});
