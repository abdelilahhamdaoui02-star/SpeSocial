// اختبار مطابقة المرحلة 34: نشغّل دوال نافذة إعداد Firebase القديمة (المجمَّدة) في vm بDOM مزيّف
// ونقارنها بـ firebaseSetupLogic الجديدة (الاستخراج، التحقق والحفظ، اختبار الاتصال، الحذف، الحالة).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  FIELDS, MSG, isFieldValid, loadSavedValues, parseConfigText, saveConfig, runConnectionTest,
  clearConfig, statusView, buildConfig, CONFIG_KEY,
} from '../src/firebase-setup/firebaseSetupLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/firebasesetup.step34.js', import.meta.url), 'utf8');

function fakeEl() {
  const cls = new Set();
  return {
    value: '', textContent: '', style: {}, className: '',
    classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), toggle: (c, on) => (on ? cls.add(c) : cls.delete(c)), contains: (c) => cls.has(c) },
    _cls: cls,
  };
}

function makeLegacy({ values = {}, paste = '', storageInit = {}, confirmAnswer = true, status, storageApi, setThrows } = {}) {
  const ids = ['firebaseSetupModal', 'fbPasteArea', 'fbMsg', 'fbSetupStatus', 'fbSetupStatusIcon', 'fbSetupStatusText', 'fbTestBtn', 'fbTriggerDot', 'fbTriggerText', ...FIELDS.map((f) => 'fb_' + f)];
  const els = Object.fromEntries(ids.map((i) => [i, fakeEl()]));
  FIELDS.forEach((f) => { els['fb_' + f].value = values[f] || ''; });
  els.fbPasteArea.value = paste;
  els.fbTestBtn.style.display = 'none';
  const store = { ...storageInit };
  const log = { reloads: 0, alerts: [], confirms: [], events: [] };
  const ctx = vm.createContext({
    document: { getElementById: (id) => els[id] || null },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { if (setThrows) throw new Error(setThrows); store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    location: { reload: () => { log.reloads++; } },
    alert: (m) => log.alerts.push(m),
    confirm: (m) => { log.confirms.push(m); return confirmAnswer; },
    setTimeout: (fn) => { log.timeout = fn; return 1; },
    CustomEvent: class { constructor(t, o) { this.type = t; this.detail = o && o.detail; } },
    window: { _firebaseStatus: status, storage: storageApi, dispatchEvent: (e) => log.events.push(e) },
    console,
  });
  vm.runInContext(legacySrc, ctx);
  return { els, store, log, call: (n) => vm.runInContext(n, ctx) };
}

const CODE = `const firebaseConfig = {
  apiKey: "AIzaSyABC123",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-proj",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "12345678",
  appId: "1:123:web:abc"
};`;

const pastes = {
  'كود كامل': CODE,
  'فراغ': '   ',
  'قيم قليلة': 'apiKey: "AAAAA", projectId: \'pppp\'',
  'نقطتان ومسافات': 'apiKey : "k1k1k1"\nprojectId:"p1p1p1"\nauthDomain:  "a.b"\nappId: "x:y"',
  'أربع قيم بالضبط': 'apiKey:"aaaa" authDomain:"bbbb" projectId:"cccc" appId:"dddd"',
};

for (const [name, text] of Object.entries(pastes)) {
  test(`مطابقة الاستخراج التلقائي: ${name}`, () => {
    const old = makeLegacy({ paste: text });
    old.call('fbParseConfig')();
    const mine = parseConfigText(text);
    for (const f of FIELDS) {
      assert.equal(mine.values[f] || '', old.els['fb_' + f].value, f);
      assert.equal(f in mine.values, old.els['fb_' + f]._cls.has('valid'), 'valid ' + f);
    }
    assert.equal(mine.message.text, old.els.fbMsg.textContent);
    assert.equal(MSG_COLOR(mine.message.kind), old.els.fbMsg.style.color);
  });
}
const MSG_COLOR = (k) => ({ err: '#dc2626', ok: '#16a34a', info: '#1a3a5c' })[k];

const saves = {
  'كامل': { apiKey: 'AIzaSyABC', authDomain: 'a.firebaseapp.com', projectId: 'proj1', storageBucket: 'b.app', messagingSenderId: '1234', appId: '1:2:web:3' },
  'المطلوبان فقط': { apiKey: 'AIzaSyABC', projectId: 'proj1' },
  'بلا apiKey': { projectId: 'proj1', authDomain: 'a.b.c' },
  'بلا projectId': { apiKey: 'AIzaSyABC' },
  'قيمة REPLACE': { apiKey: 'REPLACE_ME', projectId: 'proj1' },
  'قصيرة جداً': { apiKey: 'abc', projectId: 'proj1' },
  'اختيارية ناقصة وقصيرة': { apiKey: 'AIzaSyABC', projectId: 'proj1', authDomain: 'x', appId: 'REPLACE' },
  'مسافات حول القيم': { apiKey: '  AIzaSyABC  ', projectId: ' proj1 ' },
};

for (const [name, values] of Object.entries(saves)) {
  test(`مطابقة حفظ الإعداد: ${name}`, () => {
    const old = makeLegacy({ values });
    old.call('fbSaveConfig')();
    const store = {};
    const mine = saveConfig({ setItem: (k, v) => { store[k] = v; } }, { ...Object.fromEntries(FIELDS.map((f) => [f, ''])), ...values });
    assert.equal(mine.message.text, old.els.fbMsg.textContent);
    assert.equal(MSG_COLOR(mine.message.kind), old.els.fbMsg.style.color);
    assert.equal(store[CONFIG_KEY] ?? null, old.store[CONFIG_KEY] ?? null);
    for (const f of FIELDS) assert.equal((mine.invalid || []).includes(f), old.els['fb_' + f]._cls.has('invalid'), 'invalid ' + f);
    assert.equal(mine.status === 'saved', typeof old.log.timeout === 'function', 'جدولة إعادة التحميل');
    old.log.timeout && old.log.timeout();
    assert.equal(old.log.reloads, mine.status === 'saved' ? 1 : 0);
  });
}

test('مطابقة حفظ الإعداد: فشل الكتابة في التخزين', () => {
  const old = makeLegacy({ values: saves['كامل'], setThrows: 'quota' });
  old.call('fbSaveConfig')();
  const mine = saveConfig({ setItem: () => { throw new Error('quota'); } }, saves['كامل']);
  assert.equal(mine.status, 'error');
  assert.equal(mine.message.text, old.els.fbMsg.textContent);
  assert.equal(old.log.timeout, undefined);
});

test('مطابقة قراءة الإعداد المحفوظ', () => {
  const saved = { apiKey: 'AIzaSyABC', projectId: 'p-1', appId: '1:2:web:3', extra: 'ignored' };
  const old = makeLegacy({ storageInit: { [CONFIG_KEY]: JSON.stringify(saved) } });
  old.call('fbLoadCurrentConfig')();
  const mine = loadSavedValues({ getItem: (k) => (k === CONFIG_KEY ? JSON.stringify(saved) : null) });
  for (const f of FIELDS) {
    assert.equal(mine[f] || '', old.els['fb_' + f].value, f);
    assert.equal(f in mine, old.els['fb_' + f]._cls.has('valid'), 'valid ' + f);
  }
  assert.deepEqual(loadSavedValues({ getItem: () => 'not json' }), {});
  assert.deepEqual(loadSavedValues({ getItem: () => null }), {});
});

test('مطابقة صلاحية الحقل أثناء الكتابة', () => {
  for (const v of ['', 'abc', 'abcd', 'REPLACE_ME_NOW', '  abcde  ', 'REPLACE']) {
    const old = makeLegacy();
    const input = fakeEl(); input.value = v; input._cls.add('invalid');
    old.call('fbFieldValidate')(input);
    assert.equal(isFieldValid(v), input._cls.has('valid'), JSON.stringify(v));
    assert.equal(input._cls.has('invalid'), false);
  }
});

for (const [name, api, expectedOk] of [
  ['ينجح', { testConnection: async () => true }, true],
  ['يفشل', { testConnection: async () => false }, false],
  ['يرمي خطأ', { testConnection: async () => { throw new Error('boom'); } }, false],
  ['يرمي خطأ بلا رسالة', { testConnection: async () => { throw {}; } }, false],
  ['Firebase غير مهيأ', undefined, false],
  ['بلا testConnection', {}, false],
]) {
  test(`مطابقة اختبار الاتصال: ${name}`, async () => {
    const old = makeLegacy({ storageApi: api, status: 'connected' });
    await old.call('fbTestConnection')();
    const mine = await runConnectionTest(api);
    assert.equal(mine.message.text, old.els.fbMsg.textContent);
    assert.equal(MSG_COLOR(mine.message.kind), old.els.fbMsg.style.color);
    assert.equal(mine.ok, expectedOk);
  });
}

for (const answer of [true, false]) {
  test(`مطابقة حذف الإعداد (التأكيد = ${answer})`, () => {
    const old = makeLegacy({ confirmAnswer: answer, storageInit: { [CONFIG_KEY]: '{}' } });
    old.call('fbClearConfig')();
    const store = { [CONFIG_KEY]: '{}' };
    const asked = [];
    const done = clearConfig({ removeItem: (k) => { delete store[k]; } }, (m) => { asked.push(m); return answer; });
    assert.equal(done, answer);
    assert.deepEqual(asked, old.log.confirms);
    assert.equal(CONFIG_KEY in store, CONFIG_KEY in old.store);
    assert.equal(old.log.reloads, answer ? 1 : 0);
    assert.deepEqual(old.log.alerts, answer ? [MSG.cleared] : []);
  });
}

for (const status of ['connected', 'error', 'not_configured', undefined]) {
  test(`مطابقة عرض الحالة: ${status}`, () => {
    const old = makeLegacy({ status });
    old.call('fbUpdateStatus')();
    const v = statusView(status || 'not_configured');
    assert.equal(v.className, old.els.fbSetupStatus.className);
    assert.equal(v.icon, old.els.fbSetupStatusIcon.textContent);
    assert.equal(v.text, old.els.fbSetupStatusText.textContent);
    assert.equal(v.dot, old.els.fbTriggerDot.style.background);
    assert.equal(v.trigger, old.els.fbTriggerText.textContent);
    assert.equal(v.showTest, old.els.fbTestBtn.style.display === '');
    const ev = old.log.events.find((e) => e.type === 'legacy:sync-status');
    assert.equal(ev.detail.status, status || 'not_configured');
    assert.equal(ev.detail.cloud, status === 'connected');
  });
}

test('buildConfig: الحقول الاختيارية الناقصة لا تمنع الحفظ', () => {
  const r = buildConfig({ apiKey: 'AIzaSyABC', projectId: 'proj1', authDomain: '', storageBucket: 'x' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.config, { apiKey: 'AIzaSyABC', projectId: 'proj1' });
});

test('الكود القديم لم يعد يلمس عناصر النافذة ويكتفي بالفتح والإغلاق والبث', () => {
  const src = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
  for (const n of ['fbParseConfig', 'fbSaveConfig', 'fbTestConnection', 'fbClearConfig', 'fbLoadCurrentConfig', 'fbFieldValidate', 'fbSetupStatusText', 'fbTriggerDot', 'app:firebase:config']) {
    assert.ok(!src.includes(n), n);
  }
  for (const n of ['function openFirebaseSetup', 'function closeFirebaseSetup', 'function fbUpdateStatus', 'legacy:firebase-setup-open', 'legacy:sync-status']) {
    assert.ok(src.includes(n), n);
  }
});

test('الإعداد المحفوظ يبقى بنفس المفتاح الذي يقرؤه firebaseConfig.js عند الإقلاع', () => {
  const src = fs.readFileSync(new URL('../src/services/firebaseConfig.js', import.meta.url), 'utf8');
  assert.ok(src.includes(`'${CONFIG_KEY}'`));
});
