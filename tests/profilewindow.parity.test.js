// اختبار مطابقة نافذة الحساب: نشغّل openProfile/closeProfile القديمتين مع تغليف script-39 (نسخة الخطوة 41 المجمَّدة)
// ونقارن سجل العمليات (الفئات والأحداث وpushState/back) مع src/profile/profileWindow.js في الحالتين: شاشة كبيرة وهاتف.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createProfileWindow } from '../src/profile/profileWindow.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/profilewindow.step41.js', import.meta.url), 'utf8');

// بيئة وهمية مشتركة: تسجّل كل شيء في log بالترتيب
function makeEnv(mobile) {
  const log = [];
  const modal = {
    scrollTop: 99, _open: false,
    classList: {
      add: (c) => { if (c === 'open') modal._open = true; log.push('modal+' + c); },
      remove: (c) => { if (c === 'open') modal._open = false; log.push('modal-' + c); },
      contains: (c) => c === 'open' && modal._open,
    },
  };
  const htmlCls = new Set();
  const root = { classList: { add: (c) => { htmlCls.add(c); log.push('html+' + c); }, remove: (c) => { htmlCls.delete(c); log.push('html-' + c); } } };
  const popHandlers = [];
  const hist = {
    state: null, stack: [],
    pushState(s) { this.stack.push(this.state); this.state = s; log.push('push'); },
    back() { log.push('back'); this.state = this.stack.pop() ?? null; popHandlers.forEach((fn) => fn()); },
  };
  const doc = { documentElement: root, getElementById: (id) => (id === 'profileModal' ? modal : null) };
  return { log, modal, doc, hist, popHandlers, htmlCls, mobile };
}

function runLegacy(mobile, script) {
  const e = makeEnv(mobile);
  const ctx = vm.createContext({
    document: e.doc, history: e.hist, Event: class { constructor(t) { this.type = t; } },
  });
  ctx.window = ctx;
  ctx.dispatchEvent = (ev) => e.log.push('ev:' + ev.type);
  ctx.matchMedia = () => ({ matches: mobile });
  ctx.addEventListener = (n, fn) => { if (n === 'popstate') e.popHandlers.push(fn); };
  vm.runInContext(legacySrc, ctx);
  script(ctx, e);
  return e;
}

function runMine(mobile, script) {
  const e = makeEnv(mobile);
  const p = createProfileWindow({ doc: e.doc, history: e.hist, isMobile: () => mobile, emit: (n) => e.log.push('ev:' + n) });
  e.popHandlers.push(p.onPopState);
  script(p, e);
  return e;
}

const scenarios = {
  'فتح ثم إغلاق': (w) => { w.openProfile(); w.closeProfile(); },
  'فتح فقط': (w) => { w.openProfile(); },
  'إغلاق بلا فتح': (w) => { w.closeProfile(); },
  'فتح مرتين ثم إغلاق': (w) => { w.openProfile(); w.openProfile(); w.closeProfile(); },
  'فتح ثم popstate (زر الرجوع)': (w, e) => { w.openProfile(); e.popHandlers.forEach((fn) => fn()); },
  'popstate والنافذة مغلقة': (w, e) => { e.popHandlers.forEach((fn) => fn()); },
};

for (const mobile of [false, true]) {
  for (const [name, fn] of Object.entries(scenarios)) {
    test(`${mobile ? 'هاتف' : 'شاشة كبيرة'} — ${name}`, () => {
      const a = runLegacy(mobile, fn);
      const b = runMine(mobile, fn);
      assert.deepEqual(b.log, a.log);
      assert.equal(b.modal._open, a.modal._open);
      assert.deepEqual([...b.htmlCls], [...a.htmlCls]);
      assert.equal(b.modal.scrollTop, a.modal.scrollTop);
    });
  }
}

test('على الهاتف: الإغلاق يمرّ عبر history.back ثم popstate يغلق ويفكّ القفل', () => {
  const b = runMine(true, (w) => { w.openProfile(); w.closeProfile(); });
  assert.deepEqual(b.log, ['ev:legacy:profile-open', 'modal+open', 'html+pf-lock', 'push', 'back', 'modal-open', 'ev:legacy:profile-close', 'html-pf-lock']);
});

test('الكود القديم لم يعد يعرّف openProfile/closeProfile ولا script-39 موجود', () => {
  const s10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
  assert.ok(!/function openProfile\b/.test(s10));
  assert.ok(!/function closeProfile\b/.test(s10));
  assert.ok(!fs.existsSync(new URL('../public/legacy/js/script-39.js', import.meta.url)));
  // زر Escape في script-10 ما زال يستدعي closeProfile بالاسم العام
  assert.match(s10, /closeProfile\(\)/);
});
