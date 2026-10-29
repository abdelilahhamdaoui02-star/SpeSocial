// اختبار مطابقة المرحلة 34 (الشعار): نشغّل applyLogo/_saveLogo/removeLogo/initLogoFromStorage/printLogoImg القديمة
// (المجمَّدة) ونقارنها بـ logoStore الجديد ودالة printLogoImg في logoLogic.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createLogoStore, LOGO_KEY } from '../src/settings/logoStore.js';
import { printLogoImg } from '../src/settings/logoLogic.js';
import { DEFAULT_MINISTRY_LOGO_B64 } from '../src/settings/defaultLogo.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/logo.apply.step34.js', import.meta.url), 'utf8');

function makeWorld({ stored = null, setThrows = false, toast = true } = {}) {
  const imgs = [{ src: '' }, { src: '' }];
  const store = stored == null ? {} : { [LOGO_KEY]: stored };
  const log = { events: [], alerts: [], toasts: [] };
  const storage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { if (setThrows) throw new Error('quota'); store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  const doc = { querySelectorAll: (sel) => (sel === '#ministry-logo-img' ? imgs : []) };
  const showToast = toast ? (m) => log.toasts.push(m) : undefined;
  return { imgs, store, log, storage, doc, showToast };
}

function legacy(opts) {
  const w = makeWorld(opts);
  const win = { _reportLogoHTML: undefined, dispatchEvent: (e) => w.log.events.push({ type: e.type, detail: e.detail }) };
  const ctx = vm.createContext({
    document: w.doc, localStorage: w.storage, alert: (m) => w.log.alerts.push(m), showToast: w.showToast,
    window: win, CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } }, console,
  });
  vm.runInContext(`var MINISTRY_LOGO_B64 = ${JSON.stringify(DEFAULT_MINISTRY_LOGO_B64)}; var DEFAULT_MINISTRY_LOGO_B64 = MINISTRY_LOGO_B64;`, ctx);
  vm.runInContext(legacySrc, ctx);
  return { ...w, win, call: (code) => vm.runInContext(code, ctx) };
}

function mine(opts) {
  const w = makeWorld(opts);
  const win = {
    MINISTRY_LOGO_B64: DEFAULT_MINISTRY_LOGO_B64, _reportLogoHTML: undefined, showToast: w.showToast,
    dispatchEvent: (e) => w.log.events.push({ type: e.type, detail: e.detail }),
  };
  const s = createLogoStore({ win, doc: w.doc, storage: () => w.storage, alert: (m) => w.log.alerts.push(m) });
  return { ...w, win, s };
}

// الكائنات المنشأة داخل vm لها نموذج أولي مختلف، فنقارن نسخة JSON منها
const snap = (x, legacyWorld) => JSON.parse(JSON.stringify({
  src: legacyWorld ? x.call('MINISTRY_LOGO_B64') : x.win.MINISTRY_LOGO_B64,
  html: x.win._reportLogoHTML,
  imgs: x.imgs.map((i) => i.src),
  events: x.log.events, alerts: x.log.alerts, toasts: x.log.toasts, store: x.store,
}));

const URL1 = 'data:image/png;base64,AAAA';

test('مطابقة initLogoFromStorage: بلا شعار محفوظ → الافتراضي', () => {
  const o = legacy(); o.call('initLogoFromStorage')();
  const m = mine(); m.s.initLogoFromStorage();
  assert.deepEqual(snap(m), snap(o, true));
  assert.equal(m.win.MINISTRY_LOGO_B64, DEFAULT_MINISTRY_LOGO_B64);
  assert.equal(m.log.events[0].detail.custom, false);
});

test('مطابقة initLogoFromStorage: شعار محفوظ', () => {
  const o = legacy({ stored: URL1 }); o.call('initLogoFromStorage')();
  const m = mine({ stored: URL1 }); m.s.initLogoFromStorage();
  assert.deepEqual(snap(m), snap(o, true));
  assert.equal(m.log.events[0].detail.custom, true);
});

test('مطابقة initLogoFromStorage: التخزين يرمي', () => {
  const failing = { getItem: () => { throw new Error('denied'); } };
  const o = legacy(); o.call('localStorage').getItem = failing.getItem;
  o.call('initLogoFromStorage')();
  const m = mine(); m.storage.getItem = failing.getItem; m.s.initLogoFromStorage();
  assert.deepEqual(snap(m), snap(o, true));
});

for (const [name, opts] of [
  ['حفظ ناجح مع toast', {}],
  ['حفظ ناجح بلا showToast', { toast: false }],
  ['تعذّر الحفظ (حجم كبير)', { setThrows: true }],
]) {
  test(`مطابقة _saveLogo: ${name}`, () => {
    const o = legacy(opts); o.call('_saveLogo')(URL1);
    const m = mine(opts); m.s.saveLogo(URL1);
    assert.deepEqual(snap(m), snap(o, true));
    assert.equal(m.win.MINISTRY_LOGO_B64, URL1);
  });
}

test('مطابقة removeLogo: يحذف المحفوظ ويعيد الافتراضي', () => {
  const o = legacy({ stored: URL1 }); o.call('applyLogo')(URL1, true); o.log.events.length = 0; o.call('removeLogo')();
  const m = mine({ stored: URL1 }); m.s.applyLogo(URL1, true); m.log.events.length = 0; m.s.removeLogo();
  assert.deepEqual(snap(m), snap(o, true));
  assert.equal(LOGO_KEY in m.store, false);
  assert.equal(m.win.MINISTRY_LOGO_B64, DEFAULT_MINISTRY_LOGO_B64);
});

test('مطابقة printLogoImg: الشعار الفعّال وحجم الارتفاع', () => {
  const o = legacy(); o.call('applyLogo')(URL1, true);
  assert.equal(printLogoImg(o.call('MINISTRY_LOGO_B64'), undefined), o.call('printLogoImg')());
  assert.equal(printLogoImg(o.call('MINISTRY_LOGO_B64'), 90), o.call('printLogoImg')(90));
  assert.equal(printLogoImg('', 90), '');
});

test('الشعار الافتراضي المنقول يبدأ ببداية صورة وغير فارغ', () => {
  assert.match(DEFAULT_MINISTRY_LOGO_B64, /^data:image\/png;base64,/);
  assert.ok(DEFAULT_MINISTRY_LOGO_B64.length > 10000);
});

test('الكود القديم لم يعد يعرّف دوال الشعار ولا ثابته', () => {
  const s10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
  for (const n of ['function applyLogo', 'function _saveLogo', 'function removeLogo', 'function initLogoFromStorage', 'function printLogoImg', 'function _refreshLogoImages', 'app:institutionLogo']) {
    assert.ok(!s10.includes(n), n);
  }
  // script-00.js (كان يحمل الثابت فقط) حُذف في الخطوة 42
  assert.ok(!fs.existsSync(new URL('../public/legacy/js/script-00.js', import.meta.url)));
});
