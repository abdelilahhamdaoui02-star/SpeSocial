// الخطوة 48: AppShell.jsx (JSX) يعطي نفس DOM الذي كان يحقنه body.html (النسخة المجمَّدة tests/fixtures/body.step47.html).
// نقارن الشجرتين بعد تطبيع: حذف التعليقات وowned onclick (صارت معالجات React)، وطيّ الفراغات، وقراءة style عبر cssText.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildSync } from 'esbuild';

// Node لا يفهم JSX: نجمّع AppShell.jsx بـesbuild (من حزمة vite) إلى وحدة مؤقتة ثم نستوردها
const out = buildSync({
  entryPoints: [new URL('../src/legacy/AppShell.jsx', import.meta.url).pathname], bundle: true, format: 'esm', platform: 'node',
  external: ['react', 'react/jsx-runtime'], jsx: 'automatic', write: false,
}).outputFiles[0].text;
const tmpDir = new URL('./.tmp/', import.meta.url);
fs.mkdirSync(tmpDir, { recursive: true });
fs.writeFileSync(new URL('appshell.mjs', tmpDir), out);
const { default: AppShell } = await import(new URL('appshell.mjs', tmpDir).href);
fs.rmSync(tmpDir, { recursive: true, force: true });

const INLINE = new Set(['span', 'strong', 'b', 'a', 'i', 'em', 'svg', 'img', 'small', 'button', 'label', 'code']);

function norm(node) {
  if (node.nodeType === 3) return null;
  const attrs = {};
  for (const a of Array.from(node.attributes)) {
    if (a.name === 'onclick') continue;
    attrs[a.name] = a.name === 'style' ? node.style.cssText.replace(/\s+/g, '') : a.value;
  }
  const out = { tag: node.tagName.toLowerCase(), attrs, kids: [] };
  const kids = Array.from(node.childNodes).filter((k) => k.nodeType === 1 || k.nodeType === 3);
  kids.forEach((k, i) => {
    if (k.nodeType === 1) { out.kids.push(norm(k)); return; }
    const raw = k.textContent;
    if (!raw.trim()) {
      // فراغ بين عنصرين سطريين له معنى (يُعرض مسافة)؛ بين الكتل لا
      const prev = kids[i - 1], next = kids[i + 1];
      const il = (n) => n && (n.nodeType === 3 ? n.textContent.trim() : INLINE.has(n.tagName.toLowerCase()));
      // .back-bar-right حاوية flex (style-02.css): الفراغ بين أبنائها لا يُعرض أصلاً فلا نعدّه فرقاً
      if (il(prev) && il(next) && !(out.attrs.class || '').includes('back-bar-right')) out.kids.push(' ');
      return;
    }
    out.kids.push(raw.replace(/\s+/g, ' ').trim());
  });
  return out;
}

const parse = (html) => new JSDOM('<!doctype html><body>' + html).window.document.body;

test('AppShell يطابق body.html: الأصناف والمعرّفات والأنماط والنصوص والبنية', () => {
  const legacy = parse('<div>' + fs.readFileSync(new URL('./fixtures/body.step47.html', import.meta.url), 'utf8') + '</div>');
  const modern = parse('<div>' + renderToStaticMarkup(React.createElement(AppShell)) + '</div>');
  // فرقان مقصودان (الخطوة 49): الرئيسية صارت تُخفى/تُظهر من حالة التنقل (style=display:none قبل الدخول)،
  // والشريط المجمَّد يُرسم داخل #frozenNav بدل نقطة رسم فارغة (يُختبر في navrender.test.js)
  modern.querySelector('#portalLanding').removeAttribute('style');
  modern.querySelector('#frozenNav').innerHTML = '';
  const a = norm(modern.firstElementChild), b = norm(legacy.firstElementChild);
  assert.deepEqual(a, b);
});

test('أزرار «العودة» وشريحة المستخدم في كل صفحات الأدوات الخمس عشرة', () => {
  const dom = parse(renderToStaticMarkup(React.createElement(AppShell)));
  const pages = dom.querySelectorAll('.tool-page');
  assert.equal(pages.length, 15);
  pages.forEach((p) => {
    assert.equal(p.querySelectorAll('.back-btn').length, 1, p.id);
    assert.equal(p.querySelectorAll('.bb-avatar').length, 1, p.id);
    assert.equal(p.querySelectorAll('.bb-name').length, 1, p.id);
  });
});

test('نقاط الرسم التي تبحث عنها LegacyApp موجودة', () => {
  const src = fs.readFileSync(new URL('../src/legacy/LegacyApp.jsx', import.meta.url), 'utf8');
  const ids = [...src.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]);
  assert.ok(ids.length > 25);
  const dom = parse(renderToStaticMarkup(React.createElement(AppShell)));
  for (const id of ids) assert.ok(dom.querySelector('#' + id), 'مفقودة: ' + id);
});

test('لم يعد في المشروع body.html ولا dangerouslySetInnerHTML ولا scripts.manifest.json', () => {
  assert.ok(!fs.existsSync(new URL('../src/legacy/body.html', import.meta.url)));
  assert.ok(!fs.existsSync(new URL('../src/legacy/scripts.manifest.json', import.meta.url)));
  const src = fs.readFileSync(new URL('../src/legacy/LegacyApp.jsx', import.meta.url), 'utf8');
  assert.ok(!src.includes('dangerouslySetInnerHTML'));
});
