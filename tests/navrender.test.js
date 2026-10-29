// الخطوة 49: حالة التنقل تُرسم فعلاً — AppShell في jsdom حقيقي مع react-dom/client:
// فتح بوابة يفعّل صفحتها ويُظهر الشريط المجمَّد ويُخفي الرئيسية، والعودة تعكس ذلك، والخروج يُخفي كل شيء.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { buildSync } from 'esbuild';

const dom = new JSDOM('<!doctype html><body><div id="root"></div></body>', { pretendToBeVisual: true });
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.scrollTo = () => {};

// حزمة واحدة للمكوّن والتنقل كي يتشاركا نسخة المخزن نفسها (كما في التطبيق الفعلي)
const src = buildSync({
  stdin: {
    contents: "export { default as AppShell } from './legacy/AppShell.jsx'; export * from './navigation.js'; export { getSessionStore } from './session/sessionStore.js';",
    resolveDir: new URL('../src/', import.meta.url).pathname, loader: 'js',
  },
  bundle: true, format: 'esm', platform: 'node',
  external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client'], jsx: 'automatic', write: false,
}).outputFiles[0].text;
const tmpDir = new URL('./.tmp-navrender/', import.meta.url);
fs.mkdirSync(tmpDir, { recursive: true });
fs.writeFileSync(new URL('bundle.mjs', tmpDir), src);
const nav = await import(new URL('bundle.mjs', tmpDir).href);
const { AppShell } = nav;
fs.rmSync(tmpDir, { recursive: true, force: true });

const React = (await import('react')).default;
const { createRoot } = await import('react-dom/client');
const { act } = await import('react-dom/test-utils');

const root = createRoot(document.getElementById('root'));
await act(async () => { root.render(React.createElement(AppShell)); });
nav.installNavigation();

const $ = (id) => document.getElementById(id);
// الدخول والخروج عبر مخزن الجلسة (من الحزمة نفسها كي يتشاركه AppShell والتنقل)
const fire = (type) => act(async () => { type === 'entered' ? nav.getSessionStore().entered('u1') : nav.getSessionStore().loggedOut(); });
const activePages = () => [...document.querySelectorAll('.tool-page.active')].map((e) => e.id);

test('قبل الدخول: الرئيسية مخفية ولا بوابة مفتوحة ولا شريط', () => {
  assert.equal($('portalLanding').style.display, 'none');
  assert.deepEqual(activePages(), []);
  assert.ok(!$('frozenNav').classList.contains('visible'));
});

test('الشريط المجمَّد يرسم 14 بطاقة بعناوينها من navLogic', () => {
  assert.equal($('frozenNav').querySelectorAll('.frozen-card').length, 14);
});

test('دخول الجلسة يُظهر الرئيسية', async () => {
  await fire('entered');
  assert.equal($('portalLanding').style.display, 'block');
  assert.deepEqual(activePages(), []);
});

test('openPortal: تُفعَّل صفحة البوابة وحدها وتُخفى الرئيسية ويظهر الشريط مع البطاقة النشطة', async () => {
  await act(async () => { nav.openPortal('violence'); });
  assert.deepEqual(activePages(), ['toolViolence']);
  assert.equal($('portalLanding').style.display, 'none');
  assert.ok($('frozenNav').classList.contains('visible'));
  assert.deepEqual([...$('frozenNav').querySelectorAll('.frozen-card.active-tool')].map((e) => e.dataset.tool), ['violence']);
});

test('الانتقال من بوابة لأخرى من الشريط: تبدّل الصفحة النشطة', async () => {
  await act(async () => { $('frozenNav').querySelector('[data-tool="stats"]').click(); });
  assert.deepEqual(activePages(), ['toolStats']);
});

test('زر «العودة للرئيسية» داخل الصفحة يعيد الرئيسية ويخفي الشريط', async () => {
  await act(async () => { $('toolStats').querySelector('.back-btn').click(); });
  assert.deepEqual(activePages(), []);
  assert.equal($('portalLanding').style.display, 'block');
  assert.ok(!$('frozenNav').classList.contains('visible'));
});

test('بوابة مجهولة لا تغيّر شيئاً', async () => {
  await act(async () => { assert.equal(nav.openPortal('nope'), false); });
  assert.equal($('portalLanding').style.display, 'block');
  assert.deepEqual(activePages(), []);
});

test('خروج الجلسة وأنت داخل بوابة: تُغلق وتُخفى الرئيسية والشريط', async () => {
  await act(async () => { nav.openPortal('iip'); });
  await fire('loggedout');
  assert.deepEqual(activePages(), []);
  assert.equal($('portalLanding').style.display, 'none');
  assert.ok(!$('frozenNav').classList.contains('visible'));
});

test('بعد إعادة الدخول تظهر الرئيسية لا البوابة السابقة', async () => {
  await fire('entered');
  assert.equal($('portalLanding').style.display, 'block');
  assert.deepEqual(activePages(), []);
});

test.after(() => { root.unmount(); dom.window.close(); });
