// اختبار نافذة المعاينة الموحَّدة: المواصفات والشكل مطابقان لنوافذ body.html العشر القديمة (النسخة المجمَّدة للمرحلة 27)،
// والمخزن يفتح ويغلق ويستبدل. (الطباعة والإغلاق عند تغيّر البوابة تحتاجان متصفحاً فتُجرَّبان يدوياً.)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PREVIEWS } from '../src/preview/previewSpecs.js';
import { transformSync } from 'esbuild';
import { openPreview, closePreview, getPreview, subscribePreview } from '../src/preview/previewStore.js';

// node لا يقرأ JSX: نحوّل PreviewHost.jsx بـesbuild إلى ملف مؤقت بجوار الاختبار (تُحوَّل مساراته النسبية إلى مطلقة) ثم نحذفه
const srcDir = new URL('../src/preview/', import.meta.url);
const tmp = new URL('./.preview-host.tmp.mjs', import.meta.url);
const code = transformSync(fs.readFileSync(new URL('PreviewHost.jsx', srcDir), 'utf8'), { loader: 'jsx', jsx: 'automatic', format: 'esm' }).code
  .replace(/from "(\.{1,2}\/[\w./-]+)"/g, (_, f) => `from "${new URL(f, srcDir).href}"`);
fs.writeFileSync(tmp, code);
const { PreviewModal } = await import(tmp.href);
fs.rmSync(tmp);

const legacy = fs.readFileSync(new URL('./fixtures/printmodals.step27.html', import.meta.url), 'utf8');
const blocks = Object.fromEntries([...legacy.matchAll(/<div id="(\w+PrintModal)"[\s\S]*?(?=\n\n<div id="\w+PrintModal"|\n$)/g)].map((m) => [m[1], m[0]]));
const text = (html) => html.replace(/<[^>]+>/g, '|').split('|').map((t) => t.trim()).filter(Boolean);

test('وُجدت النوافذ العشر في النسخة المجمَّدة وكل مواصفة تقابل واحدة', () => {
  assert.equal(Object.keys(blocks).length, 10);
  assert.deepEqual(Object.values(PREVIEWS).map((s) => s.id).sort(), Object.keys(blocks).sort());
});

for (const [key, spec] of Object.entries(PREVIEWS)) {
  test(`النافذة «${key}»: المعرّفات والنصوص والأزرار مطابقة للقديم`, () => {
    const old = blocks[spec.id];
    assert.ok(old, 'النافذة القديمة موجودة');
    // المعرّفات التي يربطها CSS الطباعة وexportToWord
    assert.ok(old.includes(`id="${spec.body}"`), 'معرّف المحتوى');
    if (spec.titleId) assert.ok(old.includes(`id="${spec.titleId}"`));
    // الأبعاد الخاصة
    const oldMax = old.match(/class="modal-box" style="max-width:(\d+)px;"/);
    assert.equal(oldMax ? Number(oldMax[1]) : undefined, spec.maxWidth);
    // نص العنوان والأزرار بترتيبها
    const mine = renderToStaticMarkup(createElement(PreviewModal, { spec, html: '<p>x</p>', title: spec.title, wordName: spec.word, onClose() {}, onPrint() {}, onWord() {} }));
    assert.deepEqual(text(mine).filter((t) => t !== 'x'), text(old));
    assert.ok(mine.includes(`id="${spec.id}"`) && mine.includes('class="print-modal open"') && mine.includes(`id="${spec.body}"`));
    // اسم ملف Word الافتراضي = الذي كان في onclick القديم
    if (!spec.titleId) assert.ok(old.includes(`exportToWord('${spec.body}', '${spec.word}')`));
  });
}

test('المحتوى يُدرج كما هو HTML ولا يُهرَّب', () => {
  const spec = PREVIEWS.violence;
  const mine = renderToStaticMarkup(createElement(PreviewModal, { spec, html: '<table class="info-table-report"><tr><td>م & م</td></tr></table>', title: 't', wordName: 'w', onClose() {}, onPrint() {}, onWord() {} }));
  assert.ok(mine.includes('<table class="info-table-report"><tr><td>م & م</td></tr></table>'));
});

test('عنوان نافذتي الوثائق والسجلات واسم ملف Word يُمرَّران في كل فتح', () => {
  const spec = PREVIEWS.printdocs;
  const mine = renderToStaticMarkup(createElement(PreviewModal, { spec, html: '', title: 'إخبار', wordName: 'ملف_إخبار', onClose() {}, onPrint() {}, onWord() {} }));
  assert.ok(mine.includes('id="pdModalTitle"') && mine.includes('data-f="ملف_إخبار"') && mine.includes('>إخبار<'));
});

test('المخزن: يفتح ويستبدل ويغلق ويُبلغ المشتركين', () => {
  globalThis.document = { querySelector: () => 'HOST', body: 'BODY' };
  let n = 0;
  const off = subscribePreview(() => { n++; });
  openPreview('snapshot' in PREVIEWS ? 'x' : 'specialneeds', '<b>1</b>');
  assert.equal(getPreview().key, 'specialneeds');
  assert.equal(getPreview().title, PREVIEWS.specialneeds.title);
  assert.equal(getPreview().word, PREVIEWS.specialneeds.word);
  assert.equal(getPreview().host, 'HOST');
  openPreview('gate', '<b>2</b>', { title: 'سجل', word: 'ملف' });
  assert.equal(getPreview().key, 'gate');
  assert.equal(getPreview().title, 'سجل');
  assert.equal(getPreview().word, 'ملف');
  closePreview();
  assert.equal(getPreview(), null);
  closePreview();
  assert.equal(n, 3, 'الإغلاق الثاني لا يُبلغ أحداً');
  assert.throws(() => openPreview('nope', ''), /غير معروفة/);
  off();
  delete globalThis.document;
});
