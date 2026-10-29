// الخطوة 47: تركيب installSession يسجّل على window كل الأسماء التي كانت تعرّفها script-10/15/16 وتستدعيها بوابات React وأزرار HTML.
import test from 'node:test';
import assert from 'node:assert/strict';

const listeners = {};
globalThis.window = globalThis;
globalThis.document = { addEventListener: (n, fn) => { listeners[n] = fn; }, getElementById: () => null, querySelectorAll: () => [] };
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true });
const sent = [];
window.dispatchEvent = (e) => { sent.push(e.type); return true; };
window.addEventListener = () => {};

const { installSession, getSession } = await import('../src/session/installSession.js');
const { getBridge } = await import('../src/session/sessionBridge.js');
installSession();

// الخطوة 52: كل ما كانت تسجّله script-10/15/16 على window صار على getSession() وتستدعيه الوحدات باستيراد مباشر
const MOVED = [
  'saveUserKey', 'loadUserData', 'getCustomStudents', 'saveCustomStudents', 'tryAutoLogin', 'authEnterApp', 'authLogout', 'applyPhoto', 'updateDashboardStats',
  'fbUpdateStatus', 'openSettings', 'closeSettings', 'openFirebaseSetup', 'closeFirebaseSetup', 'openFirebaseSetupFromSettings',
  'getArchive', 'saveArchive', 'getRArchive', 'saveRArchive', 'getAbArchive', 'saveAbArchive', 'getCtArchive', 'saveCtArchive',
  'getSnArchive', 'saveSnArchive', 'getVioArchive', 'saveVioArchive', 'vigGetArchive', 'tlGetTasks', 'tlSaveTasks', 'autoLogTask', 'appendSuggest',
  'wprBridge', 'wkCollections', 'wkBuildRows', 'wkReportHtml', 'downloadWeeklyReportWordForRange', 'printWeeklyReportForRange',
  'wpGetWeekRange', 'wpUpdateMainBadge', 'wpInitMainBadge', 'pgExportXlsx', 'dispatchOTP', 'STUDENTS',
];

test('لا شيء من الأسماء القديمة مسجَّل على window بعد التركيب', () => {
  for (const n of MOVED) assert.equal(window[n], undefined, 'ما زال على window: ' + n);
});

test('واجهة الجلسة تعرض كل ما انتقل من window', () => {
  const s = getSession();
  for (const k of ['saveUserKey', 'loadUserData', 'getCustomStudents', 'saveCustomStudents']) assert.equal(typeof s.userData[k], 'function', 'userData.' + k);
  for (const k of ['tryAutoLogin', 'enterApp', 'logout', 'applyPhoto', 'updateDashboardStats', 'startSession', 'saveProfile']) assert.equal(typeof s.flow[k], 'function', 'flow.' + k);
  for (const k of ['fbUpdateStatus', 'openSettings', 'closeSettings', 'openFirebaseSetup', 'closeFirebaseSetup', 'openFirebaseSetupFromSettings']) assert.equal(typeof s.panels[k], 'function', 'panels.' + k);
  for (const k of ['getArchive', 'saveArchive', 'getRArchive', 'saveRArchive', 'getAbArchive', 'saveAbArchive', 'getCtArchive', 'saveCtArchive', 'getSnArchive', 'saveSnArchive', 'getVioArchive', 'saveVioArchive', 'vigGetArchive', 'tlGetTasks', 'tlSaveTasks', 'autoLogTask', 'appendSuggest']) assert.equal(typeof s.archives[k], 'function', 'archives.' + k);
  for (const k of ['wkCollections', 'wkBuildRows', 'wkReportHtml', 'downloadWeeklyReportWordForRange', 'printWeeklyReportForRange', 'wpGetWeekRange', 'wpUpdateMainBadge', 'wpInitMainBadge']) assert.equal(typeof s.weekly[k], 'function', 'weekly.' + k);
  assert.equal(typeof s.weekly.wprBridge.collections, 'function');
  assert.equal(typeof s.pgExportXlsx, 'function');
  assert.equal(typeof s.dispatchOTP, 'function');
});

test('الجسر يعرض نفس الواجهة التي يقرؤها المخزن وبقية الوحدات', () => {
  const b = getBridge();
  for (const k of ['setCloud', 'startSession', 'getUser', 'getProfile', 'getAppData', 'getStudents', 'getStudentsRaw', 'saveCollection', 'saveStudents', 'saveProfile']) {
    assert.equal(typeof b[k], 'function', k);
  }
  assert.equal(Object.keys(b.getAppData()).length, 15);
  assert.equal(b.getUser(), null);
  assert.throws(() => b.saveCollection('مجهول', []), /مجموعة غير معروفة/);
  assert.equal(b.weeklyBridge, getSession().weekly.wprBridge);
});

test('زر Escape يغلق نافذة الحساب (closeProfile مستوردة) ولا يرمي إن غابت النافذة', () => {
  window.matchMedia = () => ({ matches: false });
  document.documentElement = { classList: { add() {}, remove() {} } };
  listeners.keydown({ key: 'Escape' }); // النافذة غائبة من الصفحة: لا شيء ولا خطأ
  const removed = [];
  const modal = { classList: { add() {}, remove: (c) => removed.push(c) } };
  document.getElementById = (id) => (id === 'profileModal' ? modal : null);
  listeners.keydown({ key: 'Escape' }); listeners.keydown({ key: 'a' });
  assert.deepEqual(removed, ['open']);
});

test('الجلسة مفردة، والخروج بلا تأكيد من المتصفح لا يمسّ الحالة (confirm مرفوض)', () => {
  assert.equal(getSession(), getSession());
  window.confirm = () => false;
  getBridge().getAppData().taskLog.push({ id: 1 });
  getSession().flow.logout();
  assert.equal(getBridge().getAppData().taskLog.length, 1);
  assert.ok(!sent.includes('legacy:loggedout'));
});

test('لا شيء من الجلسة أو التخزين على window بعد التركيب (الخطوة 51)', () => {
  for (const n of ['__legacyBridge', 'storage', '_fbAuth', '_firebaseReady', '_siteConfig', '_firebaseStatus', '_isFirebaseConfigured', '_getFirebaseConfig']) {
    assert.equal(window[n], undefined, n);
  }
});
