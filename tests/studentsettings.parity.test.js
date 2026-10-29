// اختبار مطابقة الخطوة 36 (قسم قائمة التلاميذ في الإعدادات): نشغّل الدوال القديمة (المجمَّدة) ونقارنها بـ studentsLogic الجديدة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as L from '../src/settings/studentsLogic.js';
import { normalizeDob } from '../src/students/studentList.js';
import { cleanClassValue } from '../src/students/cleanClass.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/studentsettings.step36.js', import.meta.url), 'utf8');
// getImportedClasses انتقلت إلى src/institution (الخطوة 43)؛ نقتطعها من النسخة المجمَّدة لنقارن classOptions بها
const s10 = fs.readFileSync(new URL('./fixtures/institution.step42.js', import.meta.url), 'utf8');
const gic = s10.slice(s10.indexOf('function getImportedClasses()'), s10.indexOf('// ── اسم المؤسسة'));

const clone = (x) => JSON.parse(JSON.stringify(x));
// واجهة localStorage فوق كائن عادي (دوال studentsLogic تتعامل مع storage لا مع كائن)
const st = (o) => ({ getItem: (k) => (k in o ? o[k] : null), setItem: (k, v) => { o[k] = String(v); }, removeItem: (k) => { delete o[k]; } });
const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'");

function runLegacy({ custom = [], db = [], values = {}, checked = [], user = '', store = {}, confirmAnswer = true } = {}) {
  const el = (v = '') => ({ value: v, style: {}, textContent: '', innerHTML: '' });
  const els = {
    newStudentFamily: el(values.family), newStudentGiven: el(values.given), newStudentClass: el(values.cls),
    newStudentGender: el(values.gender), newStudentMassar: el(values.massar), newStudentDob: el(values.dob),
    settingsStudentMsg: el(), delStudentSearch: el(values.query), settingsStudentResults: el(), bulkActionBar: el(),
    selectedCountLabel: el(), deleteSelectedBtn: el(), selectAllStudents: el(), newStudentClassList: el(),
    restoreBackupBox: el(), restoreBackupInfo: el(),
  };
  const rec = { saved: [], merged: [], removed: [], replacedRaw: [], cleared: 0, confirms: [], alerts: [], events: [], cloud: [], timeouts: 0 };
  const dbArr = clone(db);
  const cbs = checked.map((n) => ({ dataset: { name: n }, checked: true }));
  const ctx = vm.createContext({
    document: { getElementById: (id) => els[id] || null, querySelectorAll: (sel) => (sel.includes(':checked') ? cbs.filter((c) => c.checked) : cbs) },
    StudentList: { normalizeDob },
    StudentDb: {
      list: () => dbArr, count: () => dbArr.length,
      mergeCustom: (l) => rec.merged.push(clone(l)),
      removeByNames: (n) => rec.removed.push(clone(n)),
      replaceRaw: (l) => rec.replacedRaw.push(clone(l)),
      clear: () => { rec.cleared++; dbArr.length = 0; },
    },
    cleanClassValue,
    getCustomStudents: () => clone(custom),
    saveCustomStudents: (l) => rec.saved.push(clone(l)),
    updateAllLevelSelects: () => {},
    currentUser: user,
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    storageSet: (k, v) => { rec.cloud.push([k, v]); return Promise.resolve(); },
    confirm: (m) => { rec.confirms.push(m); return confirmAnswer; },
    alert: (m) => rec.alerts.push(m),
    setTimeout: () => { rec.timeouts++; },
    Event: class { constructor(t) { this.type = t; } },
  });
  ctx.window = { dispatchEvent: (e) => rec.events.push(e.type) };
  vm.runInContext(gic + '\n' + legacySrc, ctx);
  const call = (n, ...a) => vm.runInContext(n, ctx)(...a);
  return { els, rec, store, call, db: dbArr };
}

// ── الإضافة اليدوية ──
const FORMS = {
  'كامل': { family: 'العلوي', given: 'أحمد', cls: '1/3', gender: 'ذكر', massar: ' R123 ', dob: '2010-05-03' },
  'بتاريخ بصيغة أخرى': { family: 'المنصوري', given: 'سناء', cls: '2/1', gender: 'أنثى', massar: '', dob: '03/05/2010' },
  'نسب فقط': { family: 'الإدريسي', given: '', cls: '', gender: '', massar: '', dob: '' },
  'اسم قصير': { family: 'أ', given: 'ب', cls: '1/1', gender: '', massar: '', dob: '' },
  'فارغ': { family: '', given: '', cls: '', gender: '', massar: '', dob: '' },
  'مسافات فقط': { family: '  ', given: '  ', cls: '', gender: '', massar: '', dob: '' },
  'اسم مكرر': { family: 'العلوي', given: 'أحمد', cls: '1/3', gender: 'ذكر', massar: '', dob: '' },
};
const CUSTOM = [{ name: 'العلوي أحمد', family: 'العلوي', given: 'أحمد', class: '1/3', gender: 'ذكر', massar: 'A1', dob: '' }];
for (const [name, values] of Object.entries(FORMS)) {
  test(`مطابقة addStudentToList: ${name}`, () => {
    const old = runLegacy({ custom: CUSTOM, values });
    old.call('addStudentToList');
    const mine = L.buildNewStudent({ family: values.family, given: values.given, cls: values.cls, gender: values.gender, massar: values.massar, dob: values.dob });
    const msg = old.els.settingsStudentMsg;
    if (mine.error) {
      assert.equal(msg.textContent, mine.error);
      assert.equal(msg.style.color, L.COLORS.error);
      assert.equal(old.rec.saved.length, 0);
      assert.equal(old.rec.merged.length, 0);
      return;
    }
    const r = L.addToCustom(clone(CUSTOM), mine.student);
    assert.equal(msg.textContent, L.addedText(mine.name));
    assert.equal(msg.style.color, L.COLORS.ok);
    assert.deepEqual(old.rec.saved, r.changed ? [r.list] : []);
    assert.deepEqual(old.rec.merged, [[mine.student]]);
    assert.equal(old.rec.timeouts, 1);
    for (const id of ['newStudentFamily', 'newStudentGiven', 'newStudentMassar', 'newStudentDob']) assert.equal(old.els[id].value, '');
    assert.deepEqual(old.rec.events, ['legacy:students-changed']);
  });
}

// ── اقتراحات القسم ──
const DBL = [
  { name: 'ا ب', fullName: 'ا ب', class: '1/10' }, { name: 'ج د', fullName: 'ج د', class: '1/2' },
  { name: 'ه و', fullName: 'ه و', class: ' 1/2 ' }, { name: 'ز ح', fullName: 'ز ح', class: '' }, { name: 'ط ي', fullName: 'ط ي' },
];
for (const [label, db, custom] of [['الذاكرة ممتلئة', DBL, [{ name: 'x', class: '9/9' }]], ['الذاكرة فارغة', [], [{ name: 'x', class: '9/9' }, { name: 'y', class: '3/1' }]], ['كلاهما فارغ', [], []]]) {
  test(`مطابقة fillNewStudentClassList: ${label}`, () => {
    const old = runLegacy({ db, custom });
    old.call('fillNewStudentClassList');
    const vals = [...old.els.newStudentClassList.innerHTML.matchAll(/value="([^"]*)"/g)].map((m) => unesc(m[1]));
    assert.deepEqual(L.classOptions(db, custom), vals);
  });
}

// ── البحث ──
const many = Array.from({ length: 60 }, (_, i) => ({ name: 'تلميذ ' + (i + 1), class: '1/' + (i % 3), gender: i % 2 ? 'أنثى' : 'ذكر' }));
const SEARCH_SETS = {
  'قائمة صغيرة': { custom: [{ name: 'محمد أمين', class: '1/1', gender: 'ذكر' }, { name: 'سناء "الحسن"', class: '1/2', gender: 'أنثى' }], db: [{ name: 'محمد أمين', fullName: 'محمد أمين', class: '1/1' }, { name: 'يوسف محمد', fullName: 'يوسف محمد', class: '2/1', gender: 'ذكر' }, { fullName: "عبد الله O'neil", class: '2/2' }] },
  'قائمة كبيرة': { custom: [], db: many },
};
for (const [setName, set] of Object.entries(SEARCH_SETS)) {
  for (const q of ['', '  ', 'محمد', 'MOHAMED', '1/1', 'تلميذ', 'تلميذ 1', 'zzz', '2/', 'الحسن', 'neil']) {
    test(`مطابقة searchStudentInSettings: ${setName} «${q}»`, () => {
      const old = runLegacy({ custom: set.custom, db: set.db, values: { query: q } });
      old.call('searchStudentInSettings');
      const mine = L.searchStudents(set.custom, set.db, q);
      const html = old.els.settingsStudentResults.innerHTML;
      if (mine.state === 'empty') { assert.equal(html, ''); assert.equal(old.els.bulkActionBar.style.display, 'none'); return; }
      if (mine.state === 'none') { assert.ok(html.includes(L.MSG.NO_RESULTS)); assert.equal(old.els.bulkActionBar.style.display, 'none'); return; }
      assert.equal(old.els.bulkActionBar.style.display, 'flex');
      const names = [...html.matchAll(/data-name="([^"]*)"/g)].map((m) => unesc(m[1]));
      assert.deepEqual(mine.shown.map((s) => s.name), names);
      const metas = [...html.matchAll(/white-space:nowrap;">([^<]*)<\/span>/g)].map((m) => m[1]);
      assert.deepEqual(mine.shown.map((s) => `${s.class} ${s.gender}`), metas);
      const extra = html.match(/\.\.\. و (\d+) نتيجة إضافية\. دقق البحث للتضييق\./);
      assert.equal(mine.extra, extra ? Number(extra[1]) : 0);
      if (mine.extra) assert.ok(html.includes(L.extraText(mine.extra)));
    });
  }
}

// ── الحذف المحدَّد ──
const DEL_CUSTOM = [{ name: 'أ 1' }, { name: 'ب 2' }, { name: 'ج 3' }, { fullName: 'د 4', name: 'د 4' }, { name: 'هـ 5' }, { name: 'و 6' }, { name: 'ز 7' }];
for (const [label, names, answer] of [['اثنان', ['أ 1', 'ج 3'], true], ['سبعة (نقاط الاختصار)', DEL_CUSTOM.map((s) => s.name), true], ['إلغاء التأكيد', ['أ 1'], false], ['بلا تحديد', [], true]]) {
  test(`مطابقة deleteSelectedStudents: ${label}`, () => {
    const old = runLegacy({ custom: DEL_CUSTOM, db: DEL_CUSTOM, checked: names, values: { query: 'x' }, confirmAnswer: answer });
    old.call('deleteSelectedStudents');
    if (!names.length) { assert.equal(old.rec.confirms.length, 0); assert.equal(old.rec.saved.length, 0); return; }
    assert.deepEqual(old.rec.confirms, [L.deleteConfirmText(names)]);
    if (!answer) { assert.equal(old.rec.saved.length, 0); assert.equal(old.rec.removed.length, 0); return; }
    assert.deepEqual(old.rec.saved, [L.removeNames(clone(DEL_CUSTOM), names)]);
    assert.deepEqual(old.rec.removed, [names]);
    assert.equal(old.els.settingsStudentMsg.textContent, L.deletedText(names.length));
    assert.equal(old.els.settingsStudentMsg.style.color, L.COLORS.deleted);
  });
}

// ── النسخة الاحتياطية والاستعادة ──
const bk = (user) => L.backupKey(user);
const BLIST = [{ name: 'أ 1' }, { name: 'ب 2' }];
const STORES = {
  'نسخة سليمة': (u) => ({ [bk(u)]: JSON.stringify(BLIST), [bk(u) + ':date']: '2026-10-20', [bk(u) + ':count']: '2' }),
  'نسخة بلا تاريخ وعدد': (u) => ({ [bk(u)]: JSON.stringify(BLIST) }),
  'نسخة فارغة': (u) => ({ [bk(u)]: '[]', [bk(u) + ':date']: 'd', [bk(u) + ':count']: '0' }),
  'لا نسخة': () => ({}),
  'JSON تالف': (u) => ({ [bk(u)]: '{bad', [bk(u) + ':date']: 'd' }),
};
for (const user of ['', 'سعيد']) {
  for (const [label, mk] of Object.entries(STORES)) {
    test(`مطابقة checkStudentBackupAvailable: ${label} [${user || 'بلا مستخدم'}]`, () => {
      const old = runLegacy({ user, store: mk(user) });
      old.call('checkStudentBackupAvailable');
      const mine = L.readBackupInfo(st(old.store), user);
      assert.equal(old.els.restoreBackupBox.style.display === 'block', mine.available);
      if (mine.available) assert.equal(old.els.restoreBackupInfo.textContent, mine.info);
    });
    for (const answer of [true, false]) {
      test(`مطابقة restoreStudentBackup: ${label} [${user || 'بلا مستخدم'}] تأكيد=${answer}`, () => {
        const old = runLegacy({ user, store: mk(user), confirmAnswer: answer });
        const before = clone(old.store);
        old.call('restoreStudentBackup');
        assert.deepEqual(old.rec.confirms, [L.restoreConfirmText(st(clone(before)), user)]);
        if (!answer) { assert.equal(old.rec.saved.length, 0); return; }
        const r = L.loadBackup(st(clone(before)), user);
        if (r.status === 'none') assert.deepEqual(old.rec.alerts, [L.MSG.NO_BACKUP]);
        else if (r.status === 'empty') assert.deepEqual(old.rec.alerts, [L.MSG.EMPTY_BACKUP]);
        else if (r.status === 'error') assert.deepEqual(old.rec.alerts, [L.MSG.RESTORE_ERROR]);
        else {
          assert.deepEqual(old.rec.alerts, []);
          assert.deepEqual(old.rec.replacedRaw, [r.list]);
          assert.deepEqual(old.rec.saved, [r.list]);
          const mineStore = clone(before);
          L.dropBackup(st(mineStore), user);
          assert.deepEqual(old.store, mineStore);
          assert.equal(old.els.settingsStudentMsg.textContent, L.restoredText(r.list.length));
          assert.equal(old.els.settingsStudentMsg.style.color, L.COLORS.restored);
        }
        if (r.status !== 'ok') assert.deepEqual(old.store, before);
      });
    }
  }
}

// ── حذف القائمة كاملة ──
for (const user of ['', 'سعيد']) {
  for (const answer of [true, false]) {
    test(`مطابقة clearAllStudents: [${user || 'بلا مستخدم'}] تأكيد=${answer}`, () => {
      const store0 = { 'app:customStudents': '[1]', 'app:customStudents:سعيد': '[2]', 'app:customStudents:آخر': '[3]', other: 'x' };
      const old = runLegacy({ user, db: DBL, store: clone(store0), confirmAnswer: answer });
      old.call('clearAllStudents');
      assert.deepEqual(old.rec.confirms, [L.clearConfirmText(DBL.length)]);
      if (!answer) { assert.equal(old.rec.cleared, 0); assert.deepEqual(old.store, store0); return; }
      assert.equal(old.rec.cleared, 1);
      const mine = clone(store0);
      L.dropCustomKeys(st(mine), user);
      assert.deepEqual(old.store, mine);
      assert.equal(old.els.settingsStudentMsg.textContent, L.clearedText(DBL.length));
      assert.equal(old.els.settingsStudentMsg.style.color, L.COLORS.cleared);
      assert.deepEqual(old.rec.cloud, user ? [[user + ':customStudents', '[]']] : []);
    });
  }
}

test('مفتاحا التخزين: customKey وbackupKey', () => {
  assert.equal(L.customKey(''), 'app:customStudents');
  assert.equal(L.customKey('سعيد'), 'app:customStudents:سعيد');
  assert.equal(L.backupKey(''), 'app:customStudents_backup');
  assert.equal(L.backupKey('سعيد'), 'app:customStudents_backup:سعيد');
});
