// اختبار مطابقة المرحلة 14: نشغّل دوال المظهر القديمة (المجمَّدة) ونقارن بما تفعله src/settings/settingsLogic.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  FONT_SIZES, FONT_PX, THEMES, fontPx, fontLabel, headerBg, readAppearance, applyDark, applyFont, applyTheme,
  applyStoredAppearance, activeThemeIndex, fbStatusView, KEYS,
} from '../src/settings/settingsLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/settings.step13.js', import.meta.url), 'utf8');

function makeDom(initial = {}) {
  const store = { ...initial };
  const storage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
  const classes = new Set();
  const props = {};
  const doc = {
    body: { style: {}, classList: { toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)), add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c) } },
    documentElement: { style: { setProperty: (k, v) => { props[k] = v; } } },
  };
  return { store, storage, classes, props, doc };
}

function runLegacy(initial, code) {
  const d = makeDom(initial);
  const lbl = { textContent: '' };
  const ctx = vm.createContext({
    document: { ...d.doc, querySelectorAll: () => [], getElementById: (id) => (id === 'fontSizeLabel' ? lbl : null) },
    localStorage: d.storage, console,
  });
  vm.runInContext(legacySrc, ctx);
  vm.runInContext(code, ctx);
  return { ...d, lbl };
}

test('الوضع الليلي يطابق applyDarkMode القديمة', () => {
  for (const on of [true, false]) {
    const old = runLegacy({}, `applyDarkMode(${on})`);
    const mine = makeDom(); applyDark(mine.doc, mine.storage, on);
    assert.deepEqual([...mine.classes], [...old.classes]);
    assert.deepEqual(mine.store, old.store);
  }
});

test('حجم الخط يطابق applyFontSize القديمة (بما فيه القيمة غير المعروفة)', () => {
  for (const size of ['small', 'medium', 'large', 'xlarge', 'weird']) {
    const old = runLegacy({}, `applyFontSize(${JSON.stringify(size)}, null)`);
    const mine = makeDom(); applyFont(mine.doc, mine.storage, size);
    assert.equal(mine.doc.body.style.fontSize, old.doc.body.style.fontSize);
    assert.deepEqual(mine.store, old.store);
    assert.equal(fontLabel(size), old.lbl.textContent);
  }
});

test('لون السمة يطابق applyColorTheme القديمة', () => {
  for (const [p, l] of THEMES) {
    const old = runLegacy({}, `applyColorTheme(${JSON.stringify(p)}, ${JSON.stringify(l)}, null)`);
    const mine = makeDom(); applyTheme(mine.doc, mine.storage, p, l);
    assert.deepEqual(mine.props, old.props);
    assert.deepEqual(mine.store, old.store);
    assert.equal(mine.props['--header-bg'], headerBg(p, l));
  }
});

test('تطبيق المحفوظ عند البدء يطابق loadAppSettings القديمة', () => {
  const cases = [
    {},
    { 'app:darkMode': '1' },
    { 'app:darkMode': '0', 'app:fontSize': 'large' },
    { 'app:fontSize': 'zzz' },
    { 'app:colorPrimary': '#166534', 'app:colorLight': '#16a34a' },
    { 'app:colorPrimary': '#166534' },
    { 'app:darkMode': '1', 'app:fontSize': 'small', 'app:colorPrimary': '#7c3aed', 'app:colorLight': '#8b5cf6' },
  ];
  for (const init of cases) {
    const old = runLegacy(init, 'loadAppSettings()');
    const mine = makeDom(init); applyStoredAppearance(mine.doc, mine.storage);
    assert.deepEqual([...mine.classes], [...old.classes], JSON.stringify(init));
    assert.equal(mine.doc.body.style.fontSize, old.doc.body.style.fontSize, JSON.stringify(init));
    assert.deepEqual(mine.props, old.props, JSON.stringify(init));
    assert.deepEqual(mine.store, init); // القراءة لا تكتب
  }
});

test('أخطاء التخزين لا تكسر التطبيق', () => {
  const d = makeDom();
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.doesNotThrow(() => applyDark(d.doc, bad, true));
  assert.doesNotThrow(() => applyFont(d.doc, bad, 'large'));
  assert.doesNotThrow(() => applyTheme(d.doc, bad, '#000', '#111'));
  assert.deepEqual(readAppearance(bad), { dark: false, font: '', primary: '', light: '' });
  assert.ok(d.classes.has('dark-mode'));
});

test('اختيار السمة والخط الظاهرين في الواجهة', () => {
  assert.equal(activeThemeIndex(''), 0);
  assert.equal(activeThemeIndex('#7c3aed'), 2);
  assert.equal(activeThemeIndex('#nope'), 0);
  assert.deepEqual(FONT_SIZES.map((f) => f[0]), Object.keys(FONT_PX));
  assert.equal(fontPx(undefined), '25px');
  assert.equal(THEMES.length, 6);
  assert.equal(KEYS.dark, 'app:darkMode');
});

test('نص حالة Firebase يطابق ما كان يكتبه الكود القديم', () => {
  assert.equal(fbStatusView('connected').text, '✅ Firebase متصل — البيانات تتزامن بين جميع الأجهزة');
  assert.equal(fbStatusView('error').text, '❌ خطأ في الاتصال — تحقق من إعداد Firebase');
  assert.equal(fbStatusView('not_configured').text, '⚠️ Firebase غير مُعدّ — البيانات محلية فقط');
  assert.equal(fbStatusView(undefined).kind, 'warn');
});

test('قسم قائمة التلاميذ (React) يحتفظ بمعرّفاته', () => {
  // الاستيراد القديم ما زال يكتب في importStudentMsg بالمعرّف (الخطوة 36 نقلت بقية القسم إلى StudentsSection.jsx)
  const stu = fs.readFileSync(new URL('../src/settings/StudentsSection.jsx', import.meta.url), 'utf8');
  for (const id of ['importStudentFile', 'importStudentMsg', 'newStudentFamily', 'newStudentGiven', 'newStudentClass', 'newStudentMassar', 'newStudentDob', 'settingsStudentMsg', 'delStudentSearch', 'bulkActionBar', 'selectAllStudents', 'selectedCountLabel', 'deleteSelectedBtn', 'settingsStudentResults', 'restoreBackupBox', 'restoreBackupInfo']) assert.ok(stu.includes(`id="${id}"`), id);
  const body = fs.readFileSync(new URL('./fixtures/body.step47.html', import.meta.url), 'utf8');
  assert.ok(body.includes('<div id="settingsModal">'));
  assert.ok(!body.includes('id="darkModeToggle"'));
});
