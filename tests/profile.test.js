// اختبار مطابقة المرحلة 13: نشغّل دوال الحساب الشخصي القديمة (المجمَّدة) في بيئة معزولة
// ونقارن نتائجها بما تنتجه src/profile/profileLogic.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  formFromProfile, bannerOf, patchFromForm, validatePasswordChange, passwordErrorMessage,
  photoCrop, isValidPhone, generateOTP, countdownLabel, checkOTP, avatarStyle, MSG, CYCLES, DEFAULT_CYCLE,
} from '../src/profile/profileLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/profile.step12.js', import.meta.url), 'utf8');

function makeEnv({ profile = {}, user = 'u1', fbAuth } = {}) {
  const els = {};
  const el = (id) => (els[id] ??= { id, value: '', textContent: '', innerHTML: '', style: {}, disabled: false, classList: { add() {}, remove() {} } });
  const saved = [];
  const ctx = vm.createContext({
    document: { getElementById: el },
    window: { dispatchEvent() {}, _fbAuth: fbAuth },
    Event: class { constructor(t) { this.type = t; } },
    console, alert: (m) => saved.push({ alert: m }),
    setTimeout: () => 0, setInterval: () => 0, clearInterval() {},
    currentUser: user, userProfile: profile,
    storageSet: async (k, v) => { saved.push({ k, v }); },
    updateDirectorateUI() {}, updateAllLevelSelects() {}, applyInstitutionEverywhere() {}, applyPhoto() {},
    dispatchOTP() {}, startOTPCountdown() {},
  });
  vm.runInContext('var currentUser = this.currentUser; var userProfile = this.userProfile;', ctx);
  vm.runInContext(legacySrc, ctx);
  return { ctx, el, saved };
}

const strip = (h) => h.replace(/<br>/g, ' ').replace(/<[^>]+>/g, '');
const forms = [
  { fullName: 'أحمد الأمين', title: 'مختص اجتماعي', school: 'مديرية الحي الحسني', institution: 'ثانوية المختار', phone: '0612345678' },
  { fullName: '', title: '', school: '', institution: '', phone: '' },
  { fullName: 'sara', title: 'x', school: '', institution: 'ابتدائية', phone: '' },
  { fullName: '', title: 'مدير', school: 'مديرية', institution: '', phone: '0600000000' },
];

test('اللافتة العلوية تطابق updateProfileBanner القديمة', () => {
  for (const f of forms) for (const verified of [false, true]) {
    const profile = { phoneVerified: verified };
    const { ctx, el } = makeEnv({ profile, user: 'login1' });
    el('profileFullName').value = f.fullName; el('profileTitle').value = f.title; el('profileSchool').value = f.school;
    el('profileInstitution').value = f.institution; el('profilePhone').value = f.phone;
    el('profileSecurityBadge');
    vm.runInContext('updateProfileBanner()', ctx);
    const b = bannerOf(f, 'login1', profile);
    assert.equal(el('profileInfoAvatar').textContent, b.initial);
    assert.equal(el('profileInfoName').textContent, b.name);
    assert.equal(strip(el('profileInfoTitle').innerHTML), '💼' + b.title);
    assert.equal(strip(el('profileInfoSchool').innerHTML), '🏛️' + b.school + (b.institution ? ' 🏫 ' + b.institution : ''));
    assert.equal(strip(el('profileInfoPhone').innerHTML), b.phone ? '📱' + b.phone : '');
    assert.equal(el('profileSecurityBadge').style.display, b.verified ? 'inline-flex' : 'none');
  }
});

test('الحفظ يكتب نفس الحقول المقصوصة التي كتبتها saveProfile القديمة', async () => {
  const dom = { fullName: '  أحمد  ', title: ' مختص', school: 'مديرية ', institution: ' ثانوية ', cycle: 'both', phone: ' 0612345678 ', email: ' a@b.c ' };
  const { ctx, el, saved } = makeEnv({ profile: { photo: 'data:x', phoneVerified: true } });
  Object.entries({ profileFullName: dom.fullName, profileTitle: dom.title, profileSchool: dom.school, profileInstitution: dom.institution, profileCycle: dom.cycle, profilePhone: dom.phone, profileEmail: dom.email }).forEach(([id, v]) => { el(id).value = v; });
  el('profileMsg');
  await vm.runInContext('saveProfile()', ctx);
  const legacy = JSON.parse(saved.find((s) => s.k).v);
  const mine = { photo: 'data:x', phoneVerified: true, ...patchFromForm(dom) };
  assert.deepEqual(legacy, mine);
  assert.equal(el('profileMsg').textContent, MSG.saved);
});

test('السلك الافتراضي والقيم الفارغة', () => {
  assert.equal(formFromProfile({}).cycle, DEFAULT_CYCLE);
  assert.equal(formFromProfile(null).fullName, '');
  assert.equal(patchFromForm({}).cycle, 'college');
  assert.deepEqual(CYCLES.map((c) => c[0]), ['college', 'lycee', 'both', 'primary', 'all']);
});

test('رسائل تغيير كلمة المرور تطابق changePassword القديمة', async () => {
  const cases = [['', '', ''], ['a', '', 'x'], ['old', '12345', '12345'], ['old', 'abcdef', 'abcdeg'], ['old', 'abcdef', 'abcdef']];
  for (const [o, n, n2] of cases) {
    const calls = [];
    const { ctx, el } = makeEnv({ fbAuth: { changePassword: async (a, b) => { calls.push([a, b]); } } });
    el('profileOldPwd').value = o; el('profileNewPwd').value = n; el('profileNewPwd2').value = n2; el('profileMsg');
    await vm.runInContext('changePassword()', ctx);
    const err = validatePasswordChange(o, n, n2);
    if (err) { assert.equal(el('profileMsg').textContent, err); assert.equal(calls.length, 0); }
    else { assert.equal(el('profileMsg').textContent, MSG.pwdChanged); assert.deepEqual(calls, [[o, n]]); }
  }
});

test('أخطاء Firebase لتغيير كلمة المرور', async () => {
  for (const e of [{ code: 'auth/invalid-credential' }, { code: 'auth/wrong-password' }, { code: 'auth/network', message: 'offline' }, {}]) {
    const { ctx, el } = makeEnv({ fbAuth: { changePassword: async () => { throw e; } } });
    el('profileOldPwd').value = 'old'; el('profileNewPwd').value = 'abcdef'; el('profileNewPwd2').value = 'abcdef'; el('profileMsg');
    await vm.runInContext('changePassword()', ctx);
    assert.equal(el('profileMsg').textContent, passwordErrorMessage(e));
  }
});

test('رمز التحقق: الطول والتحقق ورسائل الانتهاء والخطأ', async () => {
  for (let i = 0; i < 200; i++) assert.match(generateOTP(), /^[1-9]\d{5}$/);
  assert.equal(generateOTP(() => 0), '100000');
  assert.equal(generateOTP(() => 0.999999), '999999');
  assert.equal(countdownLabel(120), '⏱ صلاحية الرمز: 2:00');
  assert.equal(countdownLabel(5), '⏱ صلاحية الرمز: 0:05');
  assert.equal(isValidPhone('1234567'), false);
  assert.equal(isValidPhone('12345678'), true);
  assert.equal(isValidPhone(''), false);
  assert.equal(checkOTP('123456', ''), 'expired');
  assert.equal(checkOTP(' 123456 ', '123456'), 'ok');
  assert.equal(checkOTP('000000', '123456'), 'wrong');

  // القديمة: نفس النتائج الثلاث
  const run = async (code, input) => {
    const { ctx, el, saved } = makeEnv({ profile: {} });
    vm.runInContext(`_otpCode = ${JSON.stringify(code)}`, ctx);
    el('profileOTPInput').value = input; el('profilePhone').value = '0612345678';
    ['profileFullName', 'profileTitle', 'profileSchool', 'profileInstitution', 'profileInfoAvatar', 'profileInfoName', 'profileInfoTitle', 'profileInfoSchool', 'profileInfoPhone', 'profileSecurityBadge', 'profileOTPSection', 'profileOTPCountdown', 'profileSendOTPBtn', 'profileMsg'].forEach((id) => el(id));
    await vm.runInContext('profileVerifyOTP()', ctx);
    return { saved, alerts: saved.filter((s) => s.alert).map((s) => s.alert), stored: saved.find((s) => s.k) };
  };
  let r = await run('', '123456'); assert.deepEqual(r.alerts, [MSG.otpExpiredAlert]);
  r = await run('123456', '000000'); assert.deepEqual(r.alerts, [MSG.otpWrongAlert]);
  r = await run('123456', '123456'); assert.equal(r.alerts.length, 0);
  assert.deepEqual(JSON.parse(r.stored.v), { phoneVerified: true, phone: '0612345678' });
});

test('قصّ الصورة الشخصية: مربع من الوسط', () => {
  assert.deepEqual(photoCrop(400, 300), { sx: 50, sy: 0, side: 300, size: 240 });
  assert.deepEqual(photoCrop(300, 500), { sx: 0, sy: 100, side: 300, size: 240 });
  assert.deepEqual(photoCrop(240, 240, 100), { sx: 0, sy: 0, side: 240, size: 100 });
});

test('نمط الصورة الرمزية', () => {
  assert.equal(avatarStyle(''), undefined);
  assert.equal(avatarStyle('data:img').backgroundImage, 'url("data:img")');
  assert.equal(avatarStyle('data:img').color, 'transparent');
});

// ── جسر الحفظ الجديد في script-10.js ──
function loadBridgeSave() {
  const src = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
  const i = src.indexOf('  async saveProfile(patch, opts) {');
  const j = src.indexOf('\n  }\n};', i);
  assert.ok(i > 0 && j > i, 'لم أجد saveProfile في الجسر');
  const body = src.slice(i, j + 4).replace('async saveProfile(', 'async function saveProfile(');
  const log = [];
  const ctx = vm.createContext({
    userProfile: { fullName: 'قديم', photo: 'p', phoneVerified: true }, currentUser: 'u1',
    storageSet: async (k, v) => log.push(['set', k, JSON.parse(v)]),
    window: { dispatchEvent: (e) => log.push(['event', e.type]) },
    Event: class { constructor(t) { this.type = t; } },
    updateDirectorateUI: () => log.push(['dir']), updateAllLevelSelects: () => log.push(['levels']),
    applyInstitutionEverywhere: () => log.push(['inst']), applyPhoto: () => log.push(['photo']),
  });
  vm.runInContext(body, ctx);
  return { save: (p, o) => vm.runInContext('saveProfile', ctx)(p, o), log, ctx };
}

test('جسر saveProfile: يدمج ويحذف الصورة عند null ويطلق الأثر الجانبي', async () => {
  const { save, log } = loadBridgeSave();
  await save({ fullName: 'جديد', photo: null });
  assert.deepEqual(log[0], ['set', 'u1:profile', { fullName: 'جديد', phoneVerified: true }]);
  assert.deepEqual(log.slice(1).map((x) => x[0]), ['event', 'dir', 'levels', 'inst', 'photo']);
});

test('جسر saveProfile: effects=false يحفظ بصمت', async () => {
  const { save, log } = loadBridgeSave();
  await save({ phone: '06', phoneVerified: true }, { effects: false });
  assert.deepEqual(log.map((x) => x[0]), ['set', 'event']);
  assert.equal(log[0][2].phone, '06');
});
