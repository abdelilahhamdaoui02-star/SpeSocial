// الخطوة 48: المكتبات الخارجية من npm بدل CDN.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadExternalLibs, LIB_LOADERS, resetExternalLibsForTests } from '../src/libs/externalLibs.js';

test('الأسماء الأربعة المعروفة للكود القديم', () => {
  assert.deepEqual(Object.keys(LIB_LOADERS).sort(), ['Chart', 'ExcelJS', 'XLSX', 'docx']);
});

test('loadExternalLibs يسجّل كل مكتبة على window مرة واحدة، وفشل واحدة لا يعطّل البقية', async () => {
  resetExternalLibsForTests();
  const win = {}; let calls = 0;
  const loaders = { a: async () => { calls++; return 'A'; }, b: async () => { throw new Error('x'); }, c: async () => 'C' };
  const origErr = console.error; console.error = () => {};
  try {
    await loadExternalLibs(win, loaders); await loadExternalLibs(win, loaders);
  } finally { console.error = origErr; }
  assert.deepEqual(win, { a: 'A', c: 'C' });
  assert.equal(calls, 1);
  resetExternalLibsForTests();
});

test('المكتبات الحقيقية تُحمَّل وفيها الدوال التي يستعملها الكود', async () => {
  resetExternalLibsForTests();
  const win = {};
  await loadExternalLibs(win);
  assert.equal(typeof win.XLSX.utils.book_new, 'function');
  assert.equal(typeof win.XLSX.read, 'function');
  assert.equal(typeof win.docx.Document, 'function');
  assert.ok(win.docx.PageOrientation);
  assert.equal(typeof win.ExcelJS.Workbook, 'function');
  assert.equal(typeof win.Chart, 'function');
  assert.ok(win.Chart.registry.getScale('category'), 'المقاييس مسجَّلة كنسخة CDN');
  resetExternalLibsForTests();
});

test('النسخ مثبَّتة كما كانت على CDN', () => {
  const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.dependencies.docx, '9.6.1');
  assert.equal(pkg.dependencies['chart.js'], '4.4.1');
  assert.equal(pkg.dependencies.xlsx, '0.18.5');
  assert.equal(pkg.dependencies.exceljs, '4.4.0');
});
