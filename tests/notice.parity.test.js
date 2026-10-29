// اختبار مطابقة المرحلة 34 (الميزاجور): نشغّل renderSiteNotice القديمة (المجمَّدة) ونقارنها بـ noticeView الجديدة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { noticeView, readDismissed, saveDismissed, NOTICE_DISMISSED_KEY } from '../src/notice/noticeLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/notice.step34.js', import.meta.url), 'utf8');

function runLegacy(notice, dismissed) {
  const parts = { b: { textContent: '' }, p: { textContent: '' }, small: { textContent: '' }, button: {} };
  const box = { className: 'site-notice', style: { display: 'none' }, innerHTML: '', querySelector: (s) => parts[s] };
  const store = dismissed == null ? {} : { [NOTICE_DISMISSED_KEY]: dismissed };
  const ctx = vm.createContext({
    SITE_CFG: { notice },
    document: { getElementById: (id) => (id === 'siteNotice' ? box : null) },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
  });
  vm.runInContext(legacySrc, ctx);
  vm.runInContext('renderSiteNotice', ctx)();
  return { box, parts, store };
}

const base = { on: true, id: '1700000000000', title: 'تحديث جديد', text: 'أُضيفت ميزة جديدة', level: 'warn', date: '27 أكتوبر 2026' };
const cases = {
  'إشعار ظاهر': [base, null],
  'مستوى افتراضي': [{ ...base, level: undefined }, null],
  'مستوى عاجل': [{ ...base, level: 'urgent' }, null],
  'بلا عنوان': [{ ...base, title: '' }, null],
  'بلا نص': [{ ...base, text: '' }, null],
  'بلا عنوان ولا نص': [{ ...base, title: '', text: '' }, null],
  'متوقف': [{ ...base, on: false }, null],
  'أغلقه المستخدم': [base, base.id],
  'أغلق إشعاراً آخر': [base, '999'],
  'بلا تاريخ': [{ ...base, date: undefined }, null],
  'لا يوجد إشعار': [undefined, null],
  'كائن فارغ': [{}, null],
};

for (const [name, [notice, dismissed]] of Object.entries(cases)) {
  test(`مطابقة الميزاجور: ${name}`, () => {
    const old = runLegacy(notice, dismissed);
    const mine = noticeView(notice, dismissed == null ? '' : dismissed);
    if (!mine) {
      assert.equal(old.box.style.display, 'none');
      return;
    }
    assert.equal(old.box.style.display, 'flex');
    assert.equal(old.box.className, 'site-notice lv-' + mine.level);
    assert.equal(old.parts.b.textContent, mine.title);
    assert.equal(old.parts.p.textContent, mine.text);
    assert.equal(old.parts.small.textContent, mine.date);
  });
}

test('مطابقة زر الإغلاق: يحفظ المعرّف ويخفي الإشعار', () => {
  const old = runLegacy(base, null);
  old.parts.button.onclick();
  assert.equal(old.box.style.display, 'none');
  const store = {};
  saveDismissed({ setItem: (k, v) => { store[k] = v; } }, base.id);
  assert.deepEqual(store, old.store);
  assert.equal(noticeView(base, readDismissed({ getItem: (k) => store[k] })), null);
});

test('قراءة وكتابة المعرّف لا ترميان عند فشل التخزين', () => {
  assert.equal(readDismissed({ getItem: () => { throw new Error('x'); } }), '');
  assert.equal(readDismissed({ getItem: () => null }), '');
  assert.doesNotThrow(() => saveDismissed({ setItem: () => { throw new Error('x'); } }, 'id'));
});

test('الكود القديم يبثّ الإشعار مع الإعدادات ولم يعد يرسمه', () => {
  const src = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
  assert.ok(!src.includes('renderSiteNotice'));
  assert.ok(!src.includes("getElementById('siteNotice')"));
  // بثّ legacy:site-config (مع notice) انتقل إلى src/institution في الخطوة 43
  assert.ok(!src.includes('legacy:site-config'));
  const inst = fs.readFileSync(new URL('../src/institution/institutionStore.js', import.meta.url), 'utf8');
  assert.match(inst, /legacy:site-config/);
  assert.match(fs.readFileSync(new URL('../src/institution/institutionLogic.js', import.meta.url), 'utf8'), /notice: c\.notice \|\| \{\}/);
});
