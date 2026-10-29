import test from 'node:test';
import assert from 'node:assert/strict';
import { initialOf, displayName, syncLabel, dateParts } from '../src/header/headerLogic.js';

test('الحرف الأول والاسم المعروض', () => {
  assert.equal(initialOf({ fullName: 'أحمد' }, 'u1'), 'أ');
  assert.equal(initialOf({}, 'sara'), 'S');
  assert.equal(initialOf({}, null), '؟');
  assert.equal(displayName({ fullName: 'أحمد' }, 'u1'), 'أحمد');
  assert.equal(displayName({}, 'u1'), 'u1');
});
test('وسم المزامنة', () => {
  assert.equal(syncLabel(true), '☁️ Firebase');
  assert.equal(syncLabel(false), '💾 محلي');
});
test('تاريخ اللوحة', () => {
  assert.deepEqual(dateParts(new Date(2026, 9, 23)), { day: 'الجمعة', full: '23 أكتوبر 2026' });
});
