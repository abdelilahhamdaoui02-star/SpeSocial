import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDob, formatDob, splitName, groupByClass, buildStudentListHtml } from '../src/students/studentList.js';

test('normalizeDob: صيغ متعددة → ISO', () => {
  assert.equal(normalizeDob('05/01/2010'), '2010-01-05');
  assert.equal(normalizeDob('5-1-2010'), '2010-01-05');
  assert.equal(normalizeDob('2010-01-05'), '2010-01-05');
  assert.equal(normalizeDob(40179), '2010-01-01'); // رقم إكسل التسلسلي
  assert.equal(normalizeDob(''), ''); assert.equal(normalizeDob(null), '');
  assert.equal(normalizeDob('غير معروف'), 'غير معروف');
  assert.equal(formatDob('2010-01-05'), '05/01/2010');
});

test('splitName: الحقول المحفوظة أولاً ثم الاسم الكامل (النسب أولاً)', () => {
  assert.deepEqual(splitName({ family: 'بلهيداني', given: 'آدم' }), { family: 'بلهيداني', given: 'آدم' });
  assert.deepEqual(splitName({ name: 'قاسمي وسيم علي' }), { family: 'قاسمي', given: 'وسيم علي' });
  assert.deepEqual(splitName({ fullName: 'واحد' }), { family: 'واحد', given: '' });
});

test('groupByClass: ترتيب طبيعي وقسم «غير محدد»', () => {
  const g = groupByClass([{ class: '1BAC-10' }, { class: '1BAC-2' }, {}, { class: '1BAC-2' }]);
  assert.deepEqual(g.map(([c, l]) => [c, l.length]), [['1BAC-2', 2], ['1BAC-10', 1], ['غير محدد', 1]]);
});

test('buildStudentListHtml: ورقة لكل قسم والأعمدة المطلوبة وهروب HTML', () => {
  const html = buildStudentListHtml([
    { name: 'أ ب', massar: 'G1', gender: 'ذكر', dob: '2010-01-05', class: '1A' },
    { name: 'ج <b>د</b>', massar: 'G2', gender: 'أنثى', class: '1B' },
  ], { institution: 'ثانوية', directorate: 'مديرية', date: 'اليوم' });
  assert.equal((html.match(/<section class="sheet">/g) || []).length, 2);
  for (const h of ['رقم مسار', 'النسب', 'الاسم', 'الجنس', 'تاريخ الازدياد']) assert.ok(html.includes(`>${h}</th>`), h);
  assert.ok(html.includes('لائحة تلاميذ القسم: 1A') && html.includes('05/01/2010') && html.includes('G2'));
  assert.ok(!html.includes('<b>د</b>') && html.includes('&lt;b&gt;'));
});
