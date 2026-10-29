// اختبار مطابقة «البحث العام عن تلميذ»: نشغّل globalSearchStudents القديمة (النسخة المجمَّدة للمرحلة 31) بـDOM مُحاكى،
// ونقارن الأسماء والأقسام والأنواع وترتيبها بـsrc/search/searchLogic.js على بيانات عشوائية بذرة ثابتة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { ARCHIVE_SOURCES, globalSearch, mergeStudents, normSearch } from '../src/search/searchLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/search.step31.js', import.meta.url), 'utf8');
const J = (x) => JSON.parse(JSON.stringify(x));
function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }

const FIRST = ['أحمد', 'آمنة', 'إسماعيل', 'فاطمة', 'يوسف', 'مريم', 'هاجر', 'موسى', 'ليلى', 'عبد الله', 'سارة', 'أيمن', 'حفصة', 'رضى'];
const LAST = ['العلوي', 'بنعيسى', 'الإدريسي', 'أمزيان', 'التازي', 'الحسني', 'المرابط', 'السبتي', 'شاكر'];
const CLASSES = ['1/1', '2/3', '3APIC-2', 'TC-1', ''];

function makeData(rnd) {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const name = () => pick(FIRST) + ' ' + pick(LAST);
  const students = Array.from({ length: 25 }, (_, i) => ({ fullName: name(), class: pick(CLASSES), gender: rnd() < 0.5 ? 'أنثى' : 'ذكر', massar: 'R' + (130000000 + i * 37) }));
  // مخصَّصون: بعضهم موجود في القاعدة بالاسم نفسه (يجب ألا يتكرر) وبعضهم جديد، وبصيغتي name/fullName
  const custom = [
    { name: students[0].fullName, class: '9/9', gender: 'ذكر', massar: 'X1' },
    { fullName: 'نور الهدى بوزيد', class: '2/1', gender: 'أنثى', massar: 'R999000111' },
    { name: 'مصطفى الزيتوني', class: '2/2', gender: 'ذكر', massar: 'R999000222' },
    { name: '', class: '2/2' },
  ];
  const arc = (n, prefix) => Array.from({ length: n }, (_, i) => ({ id: i, studentName: rnd() < 0.5 ? pick(students).fullName : name(), school: prefix + i }));
  const archives = { interviewArchive: arc(5, 'a'), reintegrationArchive: arc(4, 'b'), absenceArchive: arc(5, 'c'), violenceArchive: arc(3, 'd') };
  archives.interviewArchive.push({ id: 99, school: 'بلا اسم' });
  return { students, custom, archives };
}

function runLegacy({ students, custom, archives }, query) {
  const dropdown = { innerHTML: '', style: {} };
  const ctx = vm.createContext({
    document: { getElementById: (id) => (id === 'globalSearchDropdown' ? dropdown : null), addEventListener() {} },
    window: { dispatchEvent() {} },
    CustomEvent: class {},
    StudentDb: { list: () => students.map((s) => ({ ...s })), fillIfEmpty() {} },
    getCustomStudents: () => custom,
    getArchive: () => archives.interviewArchive, getRArchive: () => archives.reintegrationArchive,
    getAbArchive: () => archives.absenceArchive, getVioArchive: () => archives.violenceArchive,
    openTool() {},
  });
  vm.runInContext(legacySrc, ctx);
  ctx.globalSearchStudents(query);
  return dropdown;
}

function parse(dropdown) {
  if (dropdown.style.display === 'none') return null;
  const html = dropdown.innerHTML;
  if (html.includes('لا توجد نتائج')) return { students: [], archive: [] };
  const [dbPart, archivePart = ''] = html.split('🗄 من الأرشيف');
  const rows = (part) => part.split('<div onclick=').slice(1);
  const students = rows(dbPart.replace('👥 من قاعدة التلاميذ', '')).filter(() => dbPart.includes('👥')).map((r) => {
    const m = [...r.matchAll(/font-size:0\.84rem;">([^<]*)<\/span>/g)];
    const pills = [...r.matchAll(/font-size:0\.7rem;[^>]*>([^<]*)<\/span>/g)].map((x) => x[1]);
    return { fullName: m[0][1], class: pills[0] };
  });
  const archive = rows(archivePart).map((r) => {
    const name = r.match(/font-size:0\.84rem;">([^<]*)<\/span>/)[1];
    const type = [...r.matchAll(/font-size:0\.7rem;">([^<]*)<\/span>/g)].pop()[1];
    return { name, type };
  });
  return { students, archive };
}

test('البحث العام: مطابقة القديم على بيانات عشوائية', () => {
  const rnd = rngOf(20261027);
  let nonEmpty = 0;
  for (let round = 0; round < 12; round++) {
    const data = makeData(rnd);
    const all = [...data.students.map((s) => s.fullName), ...data.custom.map((c) => c.name || c.fullName), ...Object.values(data.archives).flat().map((e) => e.studentName)].filter(Boolean);
    const queries = [];
    for (let i = 0; i < 14; i++) {
      const n = all[Math.floor(rnd() * all.length)];
      const from = Math.floor(rnd() * Math.max(1, n.length - 3));
      let q = n.slice(from, from + 2 + Math.floor(rnd() * 3));
      if (rnd() < 0.4) q = q.replace(/ا/g, 'أ').replace(/ه/g, 'ة').replace(/ى/g, 'ي'); // صيغ مختلفة للحرف نفسه
      queries.push(q);
    }
    queries.push('R13', 'R9990', 'r1300', 'ز', 'زززز', '  ', '', ' أ ', 'نور', 'مصطفى');
    for (const q of queries) {
      const legacy = parse(runLegacy(data, q));
      const mine = globalSearch({ students: data.students, customStudents: data.custom, collections: data.archives, query: q });
      if (legacy === null) { assert.equal(mine, null, JSON.stringify(q)); continue; }
      assert.deepEqual(
        { students: mine.students.map((s) => ({ fullName: s.fullName, class: s.class || '' })), archive: mine.archive.map((e) => ({ name: e.name, type: e.type })) },
        J(legacy), JSON.stringify(q),
      );
      if (mine.students.length || mine.archive.length) nonEmpty++;
    }
  }
  assert.ok(nonEmpty > 50, 'الاختبار يجب أن يغطي نتائج فعلية: ' + nonEmpty);
});

test('قيود النتائج: 8 تلاميذ كحد أقصى و5 من الأرشيف', () => {
  const students = Array.from({ length: 20 }, (_, i) => ({ fullName: 'محمد ' + i, class: '1/1', massar: 'R' + i }));
  const archive = Array.from({ length: 12 }, (_, i) => ({ studentName: 'محمد أرشيف ' + i }));
  const r = globalSearch({ students, customStudents: [], collections: { interviewArchive: archive }, query: 'محمد' });
  assert.equal(r.students.length, 8);
  assert.equal(r.archive.length, 5);
});

test('نص أقصر من حرفين = لا نتائج (القائمة مغلقة)', () => {
  assert.equal(globalSearch({ students: [{ fullName: 'أحمد' }], customStudents: [], collections: {}, query: 'أ' }), null);
  assert.equal(globalSearch({ students: [], customStudents: [], collections: {}, query: '   ' }), null);
});

test('الاسم نفسه من الأرشيف يظهر مرة واحدة، وأول مصدر يغلب (مقابلة قبل إدماج)', () => {
  const r = globalSearch({
    students: [], customStudents: [],
    collections: { interviewArchive: [{ studentName: 'ليلى أمين' }], reintegrationArchive: [{ studentName: 'ليلى أمين' }], violenceArchive: [{ studentName: 'ليلى أمين' }] },
    query: 'ليلى',
  });
  assert.deepEqual(r.archive.map((e) => e.type), ['مقابلة']);
});

test('التوحيد: ا/أ/إ/آ وة/ه وي/ى بلا حساسية للحالة', () => {
  assert.equal(normSearch('أحمد'), normSearch('احمد'));
  assert.equal(normSearch('فاطمة'), normSearch('فاطمه'));
  assert.equal(normSearch('موسى'), normSearch('موسي'));
  assert.equal(normSearch('ABC'), 'abc');
  assert.equal(normSearch(undefined), '');
});

test('دمج المخصَّصين: لا تكرار بالاسم بعد التوحيد، ولا أسماء فارغة', () => {
  const merged = mergeStudents([{ fullName: 'أحمد العلوي' }], [{ name: 'احمد العلوي' }, { name: 'سناء' }, { name: '' }]);
  assert.deepEqual(merged.map((s) => s.fullName), ['أحمد العلوي', 'سناء']);
});

test('مصادر الأرشيف بترتيبها القديم', () => {
  assert.deepEqual(ARCHIVE_SOURCES.map((s) => s.type), ['مقابلة', 'إدماج', 'غياب', 'عنف']);
});
