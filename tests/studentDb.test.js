import test from 'node:test';
import assert from 'node:assert/strict';
import { StudentDb } from '../src/students/studentDb.js';
import { cleanClassValue } from '../src/students/cleanClass.js';

const reset = () => StudentDb.clear();

test('replaceFromCustom: بنية name+fullName وتجاهل الأسماء الفارغة', () => {
  reset();
  StudentDb.replaceFromCustom([{ name: 'أحمد بن علي', class: '3/2', gender: 'ذكر', massar: 'G1' }, { class: 'x' }, { fullName: 'سعاد' }]);
  assert.deepEqual(StudentDb.list(), [
    { fullName: 'أحمد بن علي', name: 'أحمد بن علي', firstName: 'أحمد', lastName: 'بن علي', class: '3/2', gender: 'ذكر', massar: 'G1', dob: '', family: '', given: '' },
    { fullName: 'سعاد', name: 'سعاد', firstName: 'سعاد', lastName: '', class: '', gender: '', massar: '', dob: '', family: '', given: '' },
  ]);
});

test('المصفوفة نفسها تبقى مرجعاً واحداً بعد الاستبدال والتفريغ', () => {
  const ref = StudentDb.list();
  StudentDb.replaceFromCustom([{ name: 'ا ب' }]); StudentDb.clear();
  assert.equal(StudentDb.list(), ref); assert.equal(ref.length, 0);
});

test('mergeCustom: لا يكرّر بالاسم الكامل ولا يضع name', () => {
  reset();
  StudentDb.mergeCustom([{ name: 'ليلى أمين', class: '1/1' }]);
  StudentDb.mergeCustom([{ fullName: 'ليلى أمين' }, { name: 'عمر' }, { name: '' }]);
  assert.equal(StudentDb.count(), 2);
  assert.ok(!('name' in StudentDb.list()[0]));
  assert.equal(StudentDb.list()[0].lastName, 'أمين');
});

test('fillIfEmpty: يملأ عند الفراغ فقط', () => {
  reset(); StudentDb.fillIfEmpty([{ fullName: 'س ع' }]); assert.equal(StudentDb.count(), 1);
  StudentDb.fillIfEmpty([{ fullName: 'ب ج' }]); assert.equal(StudentDb.count(), 1);
});

test('removeByNames وremoveByName وreplaceRaw وsnapshotJson', () => {
  reset();
  StudentDb.replaceFromCustom([{ name: 'أ' }, { name: 'ب' }, { name: 'ج' }, { name: 'ب' }]);
  StudentDb.removeByNames(['ب']); assert.deepEqual(StudentDb.list().map((s) => s.fullName), ['أ', 'ج']);
  StudentDb.removeByName('أ'); assert.deepEqual(StudentDb.list().map((s) => s.fullName), ['ج']);
  StudentDb.removeByName('غير موجود'); assert.equal(StudentDb.count(), 1);
  assert.equal(JSON.parse(StudentDb.snapshotJson()).length, 1);
  StudentDb.replaceRaw([{ x: 1 }, { x: 2 }]); assert.deepEqual(StudentDb.list(), [{ x: 1 }, { x: 2 }]);
});

test('cleanClassValue: تجاهل العناوين وأسماء الأوراق', () => {
  for (const v of ['', null, 'القسم', 'class', '--', 'Sheet1', 'ورقة 2', 'feuille']) assert.equal(cleanClassValue(v), '');
  assert.equal(cleanClassValue(' 3/2 '), '3/2');
});
