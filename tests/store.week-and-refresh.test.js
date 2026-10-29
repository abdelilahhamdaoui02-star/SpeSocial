import test from 'node:test';
import assert from 'node:assert/strict';

const appData = { interviewArchive: [{ interviewDate: '2026-10-01' }] };
globalThis.window = new EventTarget();
const { setBridge } = await import('../src/session/sessionBridge.js');
setBridge({ getAppData: () => appData, getUser: () => 'u1', getProfile: () => ({}), getStudents: () => [] });
const { installStore, getState } = await import('../src/store/legacyStore.js');
const { getSessionStore } = await import('../src/session/sessionStore.js');
installStore();
const fire = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

test('stats-refresh قبل جاهزية البيانات لا يغيّر شيئاً', () => {
  const v = getState().version;
  fire('legacy:stats-refresh');
  assert.equal(getState().version, v);
  assert.equal(getState().ready, false);
});

test('week-range يحفظ الأسبوع في المخزن', () => {
  fire('legacy:week-range', { from: '2026-10-19', to: '2026-10-25' });
  assert.deepEqual(getState().weekRange, { from: '2026-10-19', to: '2026-10-25' });
});

test('بعد data-loaded يعيد stats-refresh قراءة المجموعات', () => {
  fire('legacy:data-loaded');
  assert.equal(getState().ready, true);
  appData.interviewArchive = [{ interviewDate: '2026-10-01' }, { interviewDate: '2026-10-02' }];
  fire('legacy:stats-refresh');
  assert.equal(getState().collections.interviewArchive.length, 2);
});

test('الخروج يفرّغ البيانات ويُبقي الأسبوع المحدد', () => {
  getSessionStore().loggedOut();
  assert.equal(getState().ready, false);
  assert.deepEqual(getState().collections, {});
  assert.deepEqual(getState().weekRange, { from: '2026-10-19', to: '2026-10-25' });
});

test('sync-status وprofile-changed يحدّثان المخزن ويبقى وسم المزامنة بعد الخروج', () => {
  fire('legacy:sync-status', { cloud: true });
  assert.equal(getState().syncCloud, true);
  getSessionStore().loggedOut();
  assert.equal(getState().syncCloud, true);
  fire('legacy:profile-changed');
  assert.deepEqual(getState().profile, {});
});
