// اختبار مطابقة «سجل التلميذ»: نشغّل openStudentHistory/rOpenStudentHistory/printStudentHistory القديمة
// (النسخة المجمَّدة للمرحلة 31) بـDOM مُحاكى، ونقارن العدد والعنوان والترتيب والصف الحالي وصفحة الطباعة
// بـsrc/history على بيانات عشوائية بذرة ثابتة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { HISTORY_TYPES, clip100, esc, historyEntries, priorityBadge } from '../src/history/historyLogic.js';
import { buildHistoryPrintHtml } from '../src/history/historyPrint.js';
import { createHistoryStore } from '../src/history/historyStore.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/history.step31.js', import.meta.url), 'utf8');
const NOW = new Date(2026, 9, 27, 10, 0);
const J = (x) => JSON.parse(JSON.stringify(x));
const squash = (h) => h.replace(/\s+/g, ' ').trim();
function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }

const NAMES = ['أحمد العلوي', 'ليلى بنعيسى', 'يوسف التازي', 'مريم الحسني'];
const PRIOS = ['عاجلة', 'عالية', 'متوسطة', 'عادية', '—', '', undefined, 'أخرى'];
const PROCS = ['اتصال بالولي', 'زيارة منزلية', 'إحالة', 'تتبع'];

function makeArchives(rnd) {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const date = () => `2026-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`;
  const interviewArchive = Array.from({ length: 14 }, (_, i) => ({
    id: 1000 + i, studentName: i % 5 === 0 ? ' ' + pick(NAMES).toUpperCase() + ' ' : pick(NAMES), school: 'ثانوية الأمل', interviewDate: rnd() < 0.1 ? undefined : date(),
    subject: rnd() < 0.2 ? '' : 'موضوع ' + i, priority: pick(PRIOS), currentStatus: rnd() < 0.3 ? '' : 'حالة ' + i,
    summary: rnd() < 0.3 ? '' : 'ملخص '.repeat(5 + Math.floor(rnd() * 40)), nextFollowup: rnd() < 0.5 ? date() : '',
  }));
  const reintegrationArchive = Array.from({ length: 12 }, (_, i) => ({
    id: 2000 + i, studentName: pick(NAMES), school: i % 3 ? 'إعدادية النهضة' : '', reintegrationDate: rnd() < 0.1 ? undefined : date(),
    absenceDuration: rnd() < 0.3 ? '' : `${1 + Math.floor(rnd() * 30)} يوماً`, procedures: rnd() < 0.2 ? undefined : [pick(PROCS), pick(PROCS)].slice(0, 1 + Math.floor(rnd() * 2)),
    priority: pick(PRIOS), currentStatus: rnd() < 0.3 ? '' : 'حالة ' + i, recommendation: rnd() < 0.3 ? '' : 'توصية ' + i,
  }));
  return { interviewArchive, reintegrationArchive };
}

function runLegacy(archives, type, name, currentId) {
  const els = {};
  const el = (id) => (els[id] ||= { style: {}, textContent: '', innerHTML: '' });
  let written = '';
  class FakeDate extends Date { constructor(...a) { super(...(a.length ? a : [NOW])); } }
  const ctx = vm.createContext({
    document: { getElementById: el },
    window: { open: () => ({ document: { write: (h) => { written = h; }, close() {} }, focus() {}, print() {} }) },
    getArchive: () => archives.interviewArchive, getRArchive: () => archives.reintegrationArchive,
    MINISTRY_LOGO_B64: 'data:image/png;base64,AAAA', Date: FakeDate, setTimeout: (fn) => fn(),
  });
  vm.runInContext(legacySrc, ctx);
  if (type === 'interview') ctx.openStudentHistory(name, currentId); else ctx.rOpenStudentHistory(name, currentId);
  const modal = { title: el('studentHistoryModalTitle').textContent, name: el('studentHistoryModalName').textContent, count: el('studentHistoryModalCount').textContent, body: el('studentHistoryModalBody').innerHTML, display: el('studentHistoryModal').style.display };
  let printed = null;
  ctx.printStudentHistory();
  printed = written;
  return { modal, printed };
}

const DATE_FIELD = { interview: 'interviewDate', reintegration: 'reintegrationDate' };

test('سجل التلميذ: العدد والعنوان والترتيب والصف الحالي مطابقة للقديم', () => {
  const rnd = rngOf(77);
  let withRows = 0;
  for (let round = 0; round < 6; round++) {
    const archives = makeArchives(rnd);
    for (const type of ['interview', 'reintegration']) {
      const cfg = HISTORY_TYPES[type];
      const arc = archives[cfg.collection];
      for (const name of [...NAMES, 'لا أحد']) {
        const mine = historyEntries(arc, name, type);
        const currentId = mine.length ? mine[Math.floor(rnd() * mine.length)].id : 12345;
        const { modal } = runLegacy(archives, type, name, currentId);
        assert.equal(modal.title, cfg.title);
        assert.equal(modal.name, name);
        assert.equal(modal.count, cfg.count(mine.length));
        assert.equal(modal.display, 'flex');
        if (!mine.length) { assert.ok(modal.body.includes(cfg.empty), 'رسالة الفراغ'); continue; }
        withRows++;
        // ترتيب التواريخ في الجدول القديم = ترتيب سجلاتنا
        const legacyDates = [...modal.body.matchAll(/📅 ([^<]*)<\/td>/g)].map((m) => m[1]);
        assert.deepEqual(legacyDates, mine.map((e) => e[DATE_FIELD[type]] || '—'));
        // الصف الحالي (المحدَّد بإطار) هو نفسه
        const rows = modal.body.split('<tr style="background:#').slice(1); // صفوف البيانات فقط (ترويسة الجدول تبدأ بتدرّج لوني)
        const legacyCurrent = rows.map((r, i) => (r.includes('outline:2px solid #3b82f6') ? i : -1)).filter((i) => i >= 0);
        assert.deepEqual(legacyCurrent, mine.map((e, i) => (e.id === currentId ? i : -1)).filter((i) => i >= 0));
        // الأولوية: الشارة نفسها
        const legacyPrio = rows.map((r) => (r.match(/border-radius:10px;[^>]*>● ([^<]*)</) || [])[1] ?? null);
        assert.deepEqual(legacyPrio, mine.map((e) => (priorityBadge(e.priority) ? priorityBadge(e.priority).label : null)));
      }
    }
  }
  assert.ok(withRows >= 20, 'يجب أن يغطي الاختبار حالات فعلية: ' + withRows);
});

test('صفحة الطباعة مطابقة للقديمة حرفياً (بعد توحيد المسافات)', () => {
  const rnd = rngOf(4242);
  let n = 0;
  for (let round = 0; round < 4; round++) {
    const archives = makeArchives(rnd);
    for (const type of ['interview', 'reintegration']) {
      for (const name of NAMES) {
        const entries = historyEntries(archives[HISTORY_TYPES[type].collection], name, type);
        if (!entries.length) continue;
        n++;
        const { printed } = runLegacy(archives, type, name, null);
        const html = buildHistoryPrintHtml({ type, entries, name, logo: 'data:image/png;base64,AAAA', now: NOW });
        assert.equal(squash(html), squash(printed), `${type} ${name}`);
      }
    }
  }
  assert.ok(n >= 8);
});

test('الطباعة بلا شعار: لا وسم img', () => {
  const html = buildHistoryPrintHtml({ type: 'interview', entries: [{ id: 1, studentName: 'س', school: '' }], name: 'س', now: NOW });
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('المؤسسة التعليمية'));
});

test('الطباعة تهرب HTML في الأسماء والحقول (القديم كان يحقنه كما هو)', () => {
  const html = buildHistoryPrintHtml({ type: 'interview', entries: [{ id: 1, studentName: 'x', school: '<i>م</i>', subject: '<script>alert(1)</script>' }], name: '<b>اسم</b>', now: NOW });
  assert.ok(!html.includes('<script>alert'));
  assert.ok(!html.includes('<b>اسم</b>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.equal(esc('a&b"c'), 'a&amp;b&quot;c');
});

test('المطابقة بالاسم: دون حساسية للحالة وبعد قص المسافات؛ والفرز بالتاريخ ثم الثبات', () => {
  const arc = [
    { id: 1, studentName: ' Ali ', interviewDate: '2026-03-01' },
    { id: 2, studentName: 'ali', interviewDate: '2026-01-01' },
    { id: 3, studentName: 'ali', interviewDate: '2026-01-01' },
    { id: 4, studentName: 'omar', interviewDate: '2026-02-01' },
    { id: 5, studentName: 'ALI' },
  ];
  assert.deepEqual(historyEntries(arc, 'Ali', 'interview').map((e) => e.id), [5, 2, 3, 1]);
  assert.deepEqual(historyEntries(undefined, 'Ali', 'interview'), []);
});

test('ملخص المقابلة: أول 100 حرف ثم «…»', () => {
  assert.equal(clip100(''), '—');
  assert.equal(clip100('قصير'), 'قصير');
  assert.equal(clip100('ا'.repeat(100)), 'ا'.repeat(100));
  assert.equal(clip100('ا'.repeat(101)), 'ا'.repeat(100) + '…');
});

test('المخزن: فتح/إغلاق، وتسجيل أفعال التعديل والحذف لكل نوع', () => {
  const store = createHistoryStore();
  assert.deepEqual(J(store.getSnapshot()), { open: false, type: 'interview', name: '', currentId: null });
  let seen = 0; store.subscribe(() => { seen++; });
  store.open('reintegration', 'س', 7);
  assert.deepEqual(J(store.getSnapshot()), { open: true, type: 'reintegration', name: 'س', currentId: 7 });
  store.close();
  assert.equal(store.getSnapshot().open, false);
  assert.equal(store.getSnapshot().name, 'س');
  assert.equal(seen, 2);

  const calls = [];
  const off = store.register('interview', { loadEntry: (id) => calls.push(['load', id]), del: (id, skip) => calls.push(['del', id, skip]) });
  store.run('interview', 'loadEntry', 5);
  store.run('interview', 'del', 5, true);
  store.run('reintegration', 'loadEntry', 5); // غير مسجَّلة: لا شيء
  assert.deepEqual(calls, [['load', 5], ['del', 5, true]]);
  off();
  assert.equal(store.run('interview', 'loadEntry', 1), undefined);
  assert.equal(calls.length, 2);
});

test('إلغاء تسجيل قديم لا يمسّ تسجيلاً أحدث (تركيب مزدوج في StrictMode)', () => {
  const store = createHistoryStore();
  const calls = [];
  const off1 = store.register('interview', { loadEntry: () => calls.push('old') });
  store.register('interview', { loadEntry: () => calls.push('new') });
  off1();
  store.run('interview', 'loadEntry', 1);
  assert.deepEqual(calls, ['new']);
});
