// الخطوة 50: مخزن الجلسة الوحيد وسجل خدمات السحابة — بلا window ولا React.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionStore, reduceSession, INITIAL_SESSION } from '../src/session/sessionStore.js';
import {
  registerCloud, setCloudReady, setCloudStatus, setCloudConfigured, getCloudStorage, getFbAuth, getCloudReady, getCloudStatus,
  getSiteConfigApi, isFirebaseConfigured, resetCloud, STATUS,
} from '../src/services/cloud.js';
import { createBoot } from '../src/boot/bootLogic.js';

test('الحالة الأولى: booting بلا مستخدم', () => {
  assert.deepEqual({ ...createSessionStore().getState() }, { status: 'booting', user: null, logoutCount: 0 });
});

test('المخفِّض مطابق لمنطق AuthContext السابق', () => {
  let s = INITIAL_SESSION;
  s = reduceSession(s, { type: 'entered', user: 'a' });
  assert.deepEqual(s, { status: 'signedIn', user: 'a', logoutCount: 0 });
  s = reduceSession(s, { type: 'loggedout' });
  assert.deepEqual(s, { status: 'signedOut', user: null, logoutCount: 1 });
  s = reduceSession(s, { type: 'hide' });
  assert.equal(s.status, 'hidden');
  s = reduceSession(s, { type: 'need-login' });
  assert.deepEqual(s, { status: 'signedOut', user: null, logoutCount: 1 });
  assert.equal(reduceSession(s, { type: 'مجهول' }), s);
  assert.equal(reduceSession(INITIAL_SESSION, { type: 'entered' }).user, null, 'بلا اسم → null');
});

test('الدخول والخروج يحدّثان الحالة ويُبلغان المشتركين والمستمعين بالترتيب', () => {
  const st = createSessionStore();
  const log = [];
  st.subscribe(() => log.push('sub:' + st.getState().status));
  st.on('entered', (s) => log.push('entered:' + s.user));
  st.on('loggedout', () => log.push('out'));
  st.entered('u1');
  st.loggedOut();
  assert.deepEqual(log, ['entered:u1', 'sub:signedIn', 'out', 'sub:signedOut']);
  assert.equal(st.getState().logoutCount, 1);
  st.loggedOut();
  assert.equal(st.getState().logoutCount, 2);
});

test('الإلغاء يوقف المستمع والمشترك، وانتقال مجهول يرمي', () => {
  const st = createSessionStore();
  let n = 0;
  const off = st.on('entered', () => n++);
  const unsub = st.subscribe(() => n += 10);
  st.entered('a'); off(); unsub(); st.entered('b');
  assert.equal(n, 11);
  assert.throws(() => st.on('نوع', () => {}), /مجهول/);
});

test('الحالة مجمَّدة وتبقى المرجع نفسه بين التغييرات إلى أن يحدث انتقال', () => {
  const st = createSessionStore();
  const a = st.getState();
  assert.equal(st.getState(), a);
  assert.ok(Object.isFrozen(a));
  st.needLogin();
  assert.notEqual(st.getState(), a);
});

test('سجل السحابة: فارغ قبل التسجيل ثم يعيد ما سُجّل، ويُصفَّر', () => {
  resetCloud();
  assert.equal(getCloudStorage(), null);
  assert.equal(getFbAuth(), null);
  assert.equal(getCloudReady(), null);
  const storage = { get() {} }; const auth = { login() {} }; const p = Promise.resolve(true);
  registerCloud({ storage, auth }); setCloudReady(p);
  assert.equal(getCloudStorage(), storage);
  assert.equal(getFbAuth(), auth);
  assert.equal(getCloudReady(), p);
  resetCloud();
  assert.equal(getCloudStorage(), null);
});

test('سجل السحابة: الحالة والإعداد والإعدادات العامة (بديل _firebaseStatus و_isFirebaseConfigured و_siteConfig)', () => {
  resetCloud();
  assert.equal(getCloudStatus(), STATUS.notConfigured);
  assert.equal(isFirebaseConfigured(), false);
  assert.equal(getSiteConfigApi(), null);
  const site = { get: async () => null };
  registerCloud({ storage: {}, auth: {}, siteConfig: site });
  setCloudStatus(STATUS.connected); setCloudConfigured(() => true);
  assert.equal(getCloudStatus(), 'connected');
  assert.equal(isFirebaseConfigured(), true);
  assert.equal(getSiteConfigApi(), site);
  setCloudStatus(undefined);
  assert.equal(getCloudStatus(), 'not_configured');
  setCloudConfigured(null);
  assert.equal(isFirebaseConfigured(), false);
  resetCloud();
});

test('الإقلاع يتحكم بمخزن الجلسة مباشرة: بلا اتصال → hidden، وبلا جلسة محفوظة → signedOut', async () => {
  const st = createSessionStore();
  const base = { firebaseReady: null, hasStorage: () => true, setCloud() {}, isConfigured: () => true, tryAutoLogin: async () => false, session: st, updateStatus() {}, reload() {} };
  await createBoot({ ...base, isOnline: () => false }).start();
  assert.equal(st.getState().status, 'hidden');
  const st2 = createSessionStore();
  await createBoot({ ...base, isOnline: () => true, firebaseReady: Promise.resolve(true), session: st2 }).start();
  assert.equal(st2.getState().status, 'signedOut');
});
