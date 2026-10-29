// اختبار homeChrome (ما كان script-23.js يفعله خارج البطاقات): فئة on-home وشعار الصفحة الرئيسية
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { installHomeChrome, isOnHome, syncOnHome } from '../src/home/homeChrome.js';

function makeDoc({ logo = true } = {}) {
  const cls = new Set();
  const lg = logo ? { src: '', style: {} } : null;
  return {
    cls, lg,
    body: { classList: { toggle: (c, on) => { if (on) cls.add(c); else cls.delete(c); } } },
    getElementById: (id) => (id === 'hpMinistryLogo' ? lg : null),
  };
}

test('isOnHome: دخل المستخدم ولا بوابة مفتوحة فقط', () => {
  assert.equal(isOnHome({ entered: true, current: null }), true);
  assert.equal(isOnHome({ entered: true, current: 'stats' }), false);
  assert.equal(isOnHome({ entered: false, current: null }), false);
});

test('syncOnHome تضبط فئة on-home على body حسب الحالة', () => {
  const d = makeDoc();
  syncOnHome(d, { entered: true, current: null }); assert.ok(d.cls.has('on-home'));
  syncOnHome(d, { entered: true, current: 'iip' }); assert.ok(!d.cls.has('on-home'));
  syncOnHome(d, { entered: false, current: null }); assert.ok(!d.cls.has('on-home'));
});

test('شعار الترويسة: الافتراضي إن وُجد، وإلا يُخفى', () => {
  const a = makeDoc();
  installHomeChrome({ doc: a, defaultLogo: 'data:logo' });
  assert.equal(a.lg.src, 'data:logo');
  const b = makeDoc();
  installHomeChrome({ doc: b, defaultLogo: '' });
  assert.equal(b.lg.style.display, 'none');
  assert.equal(b.lg.src, '');
});

test('script-23.js حُذف، وAppShell يرسم #hpMinistryLogo وَ#portalLanding', () => {
  assert.ok(!fs.existsSync(new URL('../public/legacy/js/script-23.js', import.meta.url)));
  const src = fs.readFileSync(new URL('../src/legacy/AppShell.jsx', import.meta.url), 'utf8');
  assert.match(src, /id="hpMinistryLogo"/);
  assert.match(src, /id="portalLanding"/);
});
