// اختبار مطابقة الخطوة 47: طبقة التخزين والجلسة والأرشيفات والجسر الجديدة (src/session) مقابل script-10/15/16 القديمة (نسخ الخطوة 46 المجمَّدة).
// كل سيناريو يُشغَّل على القديم والجديد بنفس التخزين والمؤقّتات، ثم تُقارن اللقطات حرفياً (السجل والتخزين وعناصر الصفحة).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeEnv, runLegacy, FakeDate } from './helpers/sessionEnv.js';
import * as state from '../src/session/sessionState.js';
import { appData, COLLECTION_KEYS, resetAppData } from '../src/session/sessionState.js';
import { createStorageLayer, createSessionMemo } from '../src/session/storageLayer.js';
import { createUserData } from '../src/session/userData.js';
import { createSessionFlow } from '../src/session/sessionFlow.js';
import { createPanels } from '../src/session/panels.js';
import { createArchives } from '../src/session/archives.js';
import { createWeeklyBridge } from '../src/session/weeklyBridge.js';
import { WeeklyReport } from '../src/weekly/weeklyReport.js';

const tick = () => new Promise((r) => setImmediate(r));
// ترتيب المفاتيح لا يهم وظيفياً: نقارن appData بمفاتيح مرتَّبة
const sortedJson = (o) => JSON.stringify(Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]])));

// ── الجديد: نفس بناء installSession لكن بتبعيات الاختبار ──
function runNew(env, extra = {}) {
  // حالة جديدة نظيفة
  state.setUser(null); state.setProfile({}); state.setCloud(false); resetAppData();
  const warns = [];
  const storage = createStorageLayer({
    isCloud: state.isCloud, cloud: () => env.cloudApi, local: env.localApi, toast: env.toast,
    warn: (...a) => warns.push(a.map(String).join(' ')), setTimeout: env.sched, clearTimeout() {},
  });
  const memo = createSessionMemo(env.localApi);
  const win = (name) => env.winCall(name)();
  // الخطوة 5: دوال المؤسسة والشعار تُحقن بأسمائها (لا callWin)؛ نسجّلها بالأسماء القديمة نفسها كي تبقى مقارنة سجل الاستدعاءات حرفية مع القديم
  const institution = {
    loadSiteConfig: () => { win('loadSiteConfig'); }, updateDirectorateUI: () => { win('updateDirectorateUI'); },
    updateAllLevelSelects: () => { win('updateAllLevelSelects'); }, applyInstitutionEverywhere: () => { win('applyInstitutionEverywhere'); },
  };
  const userData = createUserData({
    state, appData, collectionKeys: COLLECTION_KEYS, storage, local: env.localApi, StudentDb: env.StudentDb,
    emit: env.emit, toast: env.toast, warn: (...a) => warns.push(a.map(String).join(' ')), error() {}, log() {},
    isCloud: state.isCloud, updateAllLevelSelects: institution.updateAllLevelSelects, schedule: env.sched,
  });
  const panels = createPanels({ doc: env.doc, initLogo: () => { win('initLogoFromStorage'); }, status: () => extra.firebaseStatus, emit: env.emit });
  const flow = createSessionFlow({
    state, resetAppData, userData, storage, memo, local: env.localApi, StudentDb: env.StudentDb, doc: env.doc,
    isOnline: () => env.online, fbAuth: () => env.fbAuth, confirm: () => env.confirmAnswer, emit: env.emit,
    // الدخول والخروج صارا يمرّان بمخزن الجلسة؛ نسجّلهما بالأسماء القديمة نفسها كي تبقى مقارنة الأحداث حرفية مع القديم
    session: { entered: (user) => env.emit('legacy:entered', { user }), loggedOut: () => env.emit('legacy:loggedout') },
    institution, schedule: env.sched, warn() {}, getCustomStudents: userData.getCustomStudents, fbUpdateStatus: () => panels.fbUpdateStatus(),
  });
  const archives = createArchives({ appData, getUser: state.getUser, saveUserKey: userData.saveUserKey, doc: env.doc, now: () => new FakeDate() });
  const weekly = createWeeklyBridge({
    appData, archives, WeeklyReport, WeeklyPrint: extra.WeeklyPrint, local: env.localApi, emit: env.emit, updateDashboardStats: flow.updateDashboardStats,
    saveUserKey: userData.saveUserKey, getLogo: () => 'LOGO', now: () => new FakeDate(),
  });
  return {
    warns, storage, userData, flow, panels, archives, weekly,
    setUser: (u) => state.setUser(u), setCloud: (v) => state.setCloud(v),
    user: () => state.getUser(), profile: () => state.getProfile(), appData: () => appData,
  };
}

// يشغّل السيناريو على الطرفين ويعيد لقطتين لتُقارنا
async function both(envOpts, scenario, extra) {
  const eo = typeof envOpts === 'function' ? envOpts : () => envOpts;
  const eL = makeEnv(eo()); const L = runLegacy(eL, extra);
  const rL = await scenario(L, eL, 'legacy');
  const eN = makeEnv(eo()); const N = runNew(eN, extra);
  const rN = await scenario(N, eN, 'new');
  return {
    legacy: { snap: eL.snapshot(), ret: rL, warns: L.warns, data: sortedJson(L.appData()), profile: JSON.stringify(L.profile()), user: L.user() },
    modern: { snap: eN.snapshot(), ret: rN, warns: N.warns, data: sortedJson(N.appData()), profile: JSON.stringify(N.profile()), user: N.user() },
  };
}
// بعد الدخول: القديم يقرأ قائمة التلاميذ من Firebase قراءة زائدة لا أثر لها ويطلق students-changed بعد حل الوعد؛
// الجديد يطلقه مباشرة بلا قراءة. نحذف هذين من اللقطتين عند مقارنة مسارات الدخول.
function loose(snap) {
  const o = JSON.parse(snap);
  let seen = 0;
  const reads = o.log.filter((x) => x[0] === 'cloud.get' && x[1] === 'bob:customStudents').length;
  o.log = o.log.filter((x) => {
    if (x[0] === 'event' && x[1] === 'legacy:students-changed') return false;
    if (x[0] === 'cloud.get' && x[1] === 'bob:customStudents') { seen++; return !(reads > 1 && seen === reads); }
    return true;
  });
  return JSON.stringify(o);
}
// ظهور #portalLanding صار من حالة التنقل (src/nav/navStore) لا من style.display في enterApp؛ نستثنيه من مقارنة اللقطات
function noLanding(snap) {
  const o = JSON.parse(snap);
  if (o.els) delete o.els.portalLanding;
  return JSON.stringify(o);
}
const same = (r, msg, { enter = false } = {}) => {
  if (enter) assert.equal(noLanding(loose(r.modern.snap)), noLanding(loose(r.legacy.snap)), msg + ' — اللقطة');
  else assert.equal(noLanding(r.modern.snap), noLanding(r.legacy.snap), msg + ' — اللقطة');
  assert.equal(JSON.stringify(r.modern.ret), JSON.stringify(r.legacy.ret), msg + ' — القيمة المُرجَعة');
  assert.deepEqual(r.modern.warns, r.legacy.warns, msg + ' — التحذيرات');
  assert.equal(r.modern.data, r.legacy.data, msg + ' — appData');
  assert.equal(r.modern.profile, r.legacy.profile, msg + ' — الملف الشخصي');
  assert.equal(r.modern.user, r.legacy.user, msg + ' — المستخدم');
};

// واجهة موحَّدة للسيناريو: القديم يستدعي الدوال العامة، والجديد وحدات src
const api = (h, kind) => (kind === 'legacy' ? {
  get: (k, s) => h.ctx.storageGet(k, s), set: (k, v, s) => h.ctx.storageSet(k, v, s),
  load: () => h.ctx.loadUserData(), save: (k) => h.ctx.saveUserKey(k),
  getCustom: () => h.ctx.getCustomStudents(), saveCustom: (l) => h.ctx.saveCustomStudents(l),
  enter: () => h.ctx.authEnterApp(), logout: () => h.ctx.authLogout(), auto: () => h.ctx.tryAutoLogin(),
  saveProfile: (p, o) => h.win.__legacyBridge.saveProfile(p, o), start: (n) => h.win.__legacyBridge.startSession(n),
  collection: (k, v) => h.win.__legacyBridge.saveCollection(k, v),
  status: () => h.ctx.fbUpdateStatus(), openFb: () => h.ctx.openFirebaseSetup(), closeFb: () => h.ctx.closeFirebaseSetup(),
  openSet: () => h.ctx.openSettings(), closeSet: () => h.ctx.closeSettings(), fbFromSet: () => h.ctx.openFirebaseSetupFromSettings(),
  photo: () => h.ctx.applyPhoto(), stats: () => h.ctx.updateDashboardStats(),
  A: h.ctx, W: h.ctx,
} : {
  get: (k, s) => h.storage.get(k, s), set: (k, v, s) => h.storage.set(k, v, s),
  load: () => h.userData.loadUserData(), save: (k) => h.userData.saveUserKey(k),
  getCustom: () => h.userData.getCustomStudents(), saveCustom: (l) => h.userData.saveCustomStudents(l),
  enter: () => h.flow.enterApp(), logout: () => h.flow.logout(), auto: () => h.flow.tryAutoLogin(),
  saveProfile: (p, o) => h.flow.saveProfile(p, o), start: (n) => h.flow.startSession(n),
  collection: (k, v) => { appData[k] = v; return h.userData.saveUserKey(k); },
  status: () => h.panels.fbUpdateStatus(), openFb: () => h.panels.openFirebaseSetup(), closeFb: () => h.panels.closeFirebaseSetup(),
  openSet: () => h.panels.openSettings(), closeSet: () => h.panels.closeSettings(), fbFromSet: () => h.panels.openFirebaseSetupFromSettings(),
  photo: () => h.flow.applyPhoto(), stats: () => h.flow.updateDashboardStats(),
  A: h.archives, W: h.weekly,
});

// ───────────────────────── طبقة التخزين ─────────────────────────
const KEY = 'bob:taskLog';
for (const cloudOn of [false, true]) for (const shared of [false, true]) for (const mode of ['has', 'empty', 'fail']) {
  test(`storageGet: cloud=${cloudOn} shared=${shared} ${mode} يطابق القديم`, async () => {
    const r = await both(() => ({ local: { [KEY]: 'LOCAL' }, cloud: mode === 'has' ? { [KEY]: 'CLOUD' } : {}, cloudFail: mode === 'fail' ? 'get' : null }), async (h, e, k) => {
      h.setCloud(cloudOn); return api(h, k).get(KEY, shared);
    });
    same(r, 'storageGet');
  });
  test(`storageSet: cloud=${cloudOn} shared=${shared} ${mode} يطابق القديم`, async () => {
    const r = await both(() => ({ cloudFail: mode === 'fail' ? 'set' : null }), async (h, e, k) => {
      h.setCloud(cloudOn); return api(h, k).set(KEY, '[1,2]', shared);
    });
    same(r, 'storageSet');
  });
}

test('storageSet: مهلة 8 ثوانٍ تُظهر إشعار «استغرق وقتاً طويلاً» وتبقي النسخة المحلية', async () => {
  const r = await both({ cloudFail: 'hang' }, async (h, e, k) => {
    h.setCloud(true);
    const p = api(h, k).set(KEY, '[9]', true);
    await tick(); e.flush(); // يطلق مؤقّت المهلة
    await p; return 'done';
  });
  same(r, 'timeout');
  assert.ok(r.modern.snap.includes('استغرق وقتاً طويلاً'));
});

// ───────────────────────── تحميل البيانات وحفظها ─────────────────────────
const CLOUD_FULL = () => ({
  cloud: {
    'bob:interviewArchive': JSON.stringify([{ id: 1 }]), 'bob:taskLog': JSON.stringify([{ id: 2 }]),
    'bob:violenceArchive': '{bad json', 'bob:profile': JSON.stringify({ fullName: 'بوب', institution: 'ثانوية' }),
    'bob:customStudents': JSON.stringify([{ name: 'علي' }]),
  },
});
test('loadUserData: بيانات سحابية سليمة وتالفة والملف الشخصي وقائمة التلاميذ', async () => {
  const r = await both(CLOUD_FULL, async (h, e, k) => { h.setCloud(true); h.setUser('bob'); await api(h, k).load(); return 'ok'; });
  same(r, 'loadUserData');
  assert.ok(JSON.parse(r.modern.data).interviewArchive.length === 1);
});
test('loadUserData: بلا قائمة تلاميذ سحابية يفرّغ النسخة المحلية', async () => {
  const r = await both({ local: { 'app:customStudents:bob': '[{"name":"x"}]' }, cloud: {} }, async (h, e, k) => { h.setCloud(true); h.setUser('bob'); await api(h, k).load(); return 'ok'; });
  same(r, 'loadUserData فارغ');
  assert.ok(!r.modern.snap.includes('app:customStudents:bob'));
});
test('loadUserData: فشل السحابة يرجع إلى localStorage', async () => {
  const r = await both({ local: { 'bob:taskLog': '[{"id":7}]' }, cloudFail: 'get' }, async (h, e, k) => { h.setCloud(true); h.setUser('bob'); await api(h, k).load(); return 'ok'; });
  same(r, 'loadUserData احتياطي');
});

for (const sc of [
  { name: 'بلا مستخدم', user: null, cloud: true },
  { name: 'سحابي', user: 'bob', cloud: true },
  { name: 'محلي فقط', user: 'bob', cloud: false },
  { name: 'فشل الحفظ السحابي', user: 'bob', cloud: true, cloudFail: 'set' },
  { name: 'حجم كبير', user: 'bob', cloud: true, big: true },
]) {
  test(`saveUserKey: ${sc.name}`, async () => {
    const r = await both({ cloudFail: sc.cloudFail || null }, async (h, e, k) => {
      h.setCloud(sc.cloud); h.setUser(sc.user);
      h.appData().taskLog = sc.big ? [{ x: 'a'.repeat(800100) }] : [{ id: 1 }];
      return api(h, k).save('taskLog');
    });
    same(r, 'saveUserKey ' + sc.name);
  });
}

test('saveCustomStudents / getCustomStudents: مع مستخدم وبدونه', async () => {
  for (const user of ['bob', null]) {
    const r = await both({ local: {} }, async (h, e, k) => {
      h.setCloud(true); h.setUser(user);
      const a = api(h, k);
      a.saveCustom([{ name: 'علي' }, { name: 'سارة' }]);
      e.flush();
      await tick();
      return a.getCustom();
    });
    same(r, 'قائمة التلاميذ user=' + user);
  }
});

// ───────────────────────── الجلسة ─────────────────────────
test('saveProfile: دمج وحذف الصورة عند null وأثر جانبي، وbالصمت effects=false', async () => {
  for (const opts of [undefined, { effects: false }]) {
    const r = await both({}, async (h, e, k) => {
      h.setCloud(true); h.setUser('bob');
      h.profile().photo = 'data:img'; h.profile().fullName = 'قديم';
      await api(h, k).saveProfile({ fullName: 'جديد', photo: null, phone: '0600' }, opts);
      return 'ok';
    });
    same(r, 'saveProfile ' + JSON.stringify(opts));
  }
});

test('applyPhoto: مع صورة وبدونها', async () => {
  for (const photo of ['data:img', undefined]) {
    const r = await both({}, async (h, e, k) => { h.setUser('bob'); if (photo) h.profile().photo = photo; api(h, k).photo(); return 'ok'; });
    same(r, 'applyPhoto ' + photo);
  }
});

test('updateDashboardStats يبثّ legacy:stats-refresh', async () => {
  const r = await both({}, async (h, e, k) => { api(h, k).stats(); return 'ok'; });
  same(r, 'updateDashboardStats');
});

test('tryAutoLogin: بلا إنترنت / بلا سحابة / بلا جلسة / جلسة صالحة / خطأ', async () => {
  const cases = [
    { online: false, cloud: true, auth: { restore: async () => 'bob' } },
    { online: true, cloud: false, auth: { restore: async () => 'bob' } },
    { online: true, cloud: true, auth: null },
    { online: true, cloud: true, auth: { restore: async () => null } },
    { online: true, cloud: true, auth: { restore: async () => { throw new Error('x'); } } },
    { online: true, cloud: true, auth: { restore: async () => 'bob' } },
  ];
  for (const c of cases) {
    const r = await both(() => ({ online: c.online, fbAuth: c.auth, ...CLOUD_FULL() }), async (h, e, k) => {
      h.setCloud(c.cloud); const ok = await api(h, k).auto(); e.flush(); return ok;
    });
    same(r, 'tryAutoLogin ' + JSON.stringify([c.online, c.cloud, !!c.auth]), { enter: true });
  }
});

// authEnterApp القديمة تقرأ قائمة التلاميذ من Firebase قراءة زائدة لا أثر لها (كانت تتوقع كائناً وتصلها سلسلة)
// وتُطلق legacy:students-changed بعدها؛ الجديدة تطلقه مباشرة بلا القراءة. نقارن كل شيء عدا ترتيب هذا الحدث وتلك القراءة.
const normEnter = (snap) => {
  const o = JSON.parse(snap);
  o.log = o.log.filter((x) => !(x[0] === 'cloud.get' && x[1] === 'bob:customStudents' && x.enter));
  return o;
};
test('enterApp: الأحداث وعناصر الصفحة والمؤقّتات مطابقة للقديم', async () => {
  const eL = makeEnv(CLOUD_FULL()); const L = runLegacy(eL);
  L.setCloud(true); L.setUser('bob'); await api(L, 'legacy').load(); eL.log.length = 0;
  api(L, 'legacy').enter(); await tick(); const legacyMs = eL.timers.map((t) => t.ms).sort((a, b) => a - b); eL.flush(); await tick();

  const eN = makeEnv(CLOUD_FULL()); const N = runNew(eN);
  N.setCloud(true); N.setUser('bob'); await api(N, 'new').load(); eN.log.length = 0;
  api(N, 'new').enter(); const newMs = eN.timers.map((t) => t.ms).sort((a, b) => a - b); eN.flush(); await tick();

  assert.deepEqual(newMs, legacyMs, 'نفس المؤقّتات');
  const strip = (log) => log.filter((x) => x[0] !== 'cloud.get' && !(x[0] === 'event' && x[1] === 'legacy:students-changed'));
  assert.ok(eN.log.some((x) => x[1] === 'legacy:students-changed') && eL.log.some((x) => x[1] === 'legacy:students-changed'), 'الطرفان يطلقان students-changed');
  const sortEv = (log) => strip(log).map((x) => JSON.stringify(x)).sort();
  assert.deepEqual(sortEv(eN.log), sortEv(eL.log), 'نفس الأحداث والنداءات');
  const elsSnap = (e) => JSON.stringify(Object.fromEntries(Object.entries(e.els).filter(([k]) => k !== 'portalLanding').map(([k, v]) => [k, v.snap()])));
  assert.equal(elsSnap(eN), elsSnap(eL));
  assert.equal(eN.els.portalLanding.snap().includes('block'), false, 'enterApp لم يعد يضبط display على #portalLanding (حالة التنقل تتولاه)');
  assert.equal(JSON.stringify(Object.entries(eN.lists).map(([k, v]) => [k, v.map((x) => x.snap())])), JSON.stringify(Object.entries(eL.lists).map(([k, v]) => [k, v.map((x) => x.snap())])));
  assert.equal(eN.els.authStorageNote.textContent.startsWith('☁️'), true);
});
test('enterApp: وضع التخزين المحلي يكتب ملاحظة «التخزين المحلي»', async () => {
  const eN = makeEnv({}); const N = runNew(eN); N.setCloud(false); N.setUser('bob');
  api(N, 'new').enter();
  const eL = makeEnv({}); const L = runLegacy(eL); L.setCloud(false); L.setUser('bob'); api(L, 'legacy').enter();
  assert.equal(eN.els.authStorageNote.textContent, eL.els.authStorageNote.textContent);
});

test('startSession: يضبط المستخدم ويحمّل ثم يدخل', async () => {
  const eL = makeEnv(CLOUD_FULL()); const L = runLegacy(eL); L.setCloud(true); await api(L, 'legacy').start('bob'); await tick(); eL.flush(); await tick();
  const eN = makeEnv(CLOUD_FULL()); const N = runNew(eN); N.setCloud(true); await api(N, 'new').start('bob'); eN.flush(); await tick();
  assert.equal(N.user(), L.user());
  assert.equal(sortedJson(N.appData()), sortedJson(L.appData()));
  assert.equal(JSON.stringify(N.profile()), JSON.stringify(L.profile()));
  assert.equal(eN.local.get('app:session:user'), eL.local.get('app:session:user'));
  const names = (log) => log.filter((x) => x[0] === 'event').map((x) => x[1]).sort();
  assert.deepEqual(names(eN.log), names(eL.log));
});

test('logout: بعد التأكيد يفرّغ كل شيء، وبالإلغاء لا يفعل شيئاً', async () => {
  for (const confirm of [true, false]) {
    const eL = makeEnv({ confirm, local: { 'app:customStudents:bob': '[1]', 'app:customStudents': '[2]', 'app:session:user': 'bob' }, ...CLOUD_FULL() });
    const eN = makeEnv({ confirm, local: { 'app:customStudents:bob': '[1]', 'app:customStudents': '[2]', 'app:session:user': 'bob' }, ...CLOUD_FULL() });
    let outL, outN;
    for (const [env, kind] of [[eL, 'legacy'], [eN, 'new']]) {
      const h = kind === 'legacy' ? runLegacy(env, { fbAuth: null }) : runNew(env);
      h.setCloud(true); h.setUser('bob'); await api(h, kind).load();
      h.appData().violenceArchive = [{ id: 9 }]; h.profile().fullName = 'بوب'; env.log.length = 0;
      api(h, kind).logout();
      const o = { user: h.user(), profile: JSON.stringify(h.profile()), local: [...env.local.entries()].sort(), log: env.log, els: env.els.userBar.snap() + env.els.searchNotifBar.snap(), a: h.appData() };
      if (kind === 'legacy') outL = o; else outN = o;
    }
    assert.equal(outN.user, outL.user); assert.equal(outN.profile, outL.profile);
    assert.deepEqual(outN.local, outL.local); assert.equal(JSON.stringify(outN.log), JSON.stringify(outL.log)); assert.equal(outN.els, outL.els);
    // القديم كان يترك العنف والإعاقة والاتصالات بالأولياء؛ الجديد يفرّغ كل المجموعات (تُستبدل كلها عند الدخول التالي)
    if (confirm) {
      assert.equal(JSON.stringify(outN.a.violenceArchive), '[]');
      assert.equal(JSON.stringify(outN.a.interviewArchive), JSON.stringify(outL.a.interviewArchive));
    }
  }
});

test('نوافذ الإعدادات وإعداد Firebase وحالة Firebase', async () => {
  for (const status of [undefined, 'connected', 'error']) {
    const r = await both({}, async (h, e, k) => {
      const a = api(h, k); a.status(); a.openFb(); a.closeFb(); a.openSet(); a.closeSet(); a.fbFromSet(); return 'ok';
    }, { firebaseStatus: status });
    same(r, 'panels ' + status);
  }
});

test('الجسر: saveCollection يرفض مجموعة مجهولة ويحفظ المعروفة', async () => {
  const r = await both({}, async (h, e, k) => {
    h.setCloud(true); h.setUser('bob');
    let err = null;
    try { if (k === 'legacy') h.win.__legacyBridge.saveCollection('nope', []); else throw new Error('مجموعة غير معروفة: nope'); } catch (x) { err = x.message; }
    await api(h, k).collection('followUp', [{ id: 3 }]);
    return err;
  });
  same(r, 'saveCollection');
});

// ───────────────────────── الأرشيفات وسجل المهام ─────────────────────────
test('الأرشيفات: قراءة وحفظ كل نوع تطابق القديم', async () => {
  const names = [['getArchive', 'saveArchive'], ['getRArchive', 'saveRArchive'], ['getAbArchive', 'saveAbArchive'], ['getCtArchive', 'saveCtArchive'], ['getSnArchive', 'saveSnArchive'], ['getVioArchive', 'saveVioArchive']];
  const r = await both({}, async (h, e, k) => {
    h.setCloud(true); h.setUser('bob'); const A = api(h, k).A; const out = [];
    // نترك الحفظ (غير المنتظَر) يكتمل قبل التالي؛ فاختلاف «عالم» Promise داخل vm يضيف خطوة ميكروتاسك للقديم فقط ويقلب ترتيب الأحداث المتداخلة
    for (const [g, s] of names) { out.push(JSON.stringify(A[g]())); A[s]([{ id: g }]); await tick(); out.push(JSON.stringify(A[g]())); }
    return out;
  });
  same(r, 'archives');
});

test('vigGetArchive: بلا مستخدم يعيد [] ومع مستخدم المصفوفة فقط', async () => {
  const r = await both({}, async (h, e, k) => {
    const A = api(h, k).A; const out = [A.vigGetArchive()];
    h.setUser('bob'); h.appData().vigilanceCases = [{ id: 1 }]; out.push(A.vigGetArchive());
    h.appData().vigilanceCases = 'x'; out.push(A.vigGetArchive()); return out;
  });
  same(r, 'vigGetArchive');
});

test('autoLogTask وtlGetTasks وappendSuggest', async () => {
  const r = await both({}, async (h, e, k) => {
    h.setCloud(true); h.setUser('bob'); const A = api(h, k).A;
    A.autoLogTask('مقابلة', 'عنوان', 'تلميذ', 'مدرسة', 'ملاحظة', '', '2026-10-01');
    A.autoLogTask('غياب', '', '', '', '', 'تم', 'غير صالح');
    A.tlSaveTasks([{ id: 5 }].concat(A.tlGetTasks()));
    e.els.sugg.value = '';
    A.appendSuggest('sugg', 'سطر 1'); A.appendSuggest('sugg', 'سطر 2'); A.appendSuggest('nope', 'x');
    await tick();
    return [JSON.stringify(A.tlGetTasks()), e.els.sugg.value];
  });
  same(r, 'autoLogTask');
});

// ───────────────────────── التقرير الأسبوعي ─────────────────────────
const printed = [];
const WP = { printWeeklyReport: (h) => printed.push(['print', h.length]), exportWeeklyWord: async (h, f, t) => { printed.push(['word', h.length, f, t]); } };
function weeklyFixture(h, k) {
  h.setCloud(true); h.setUser('bob'); const d = h.appData();
  d.interviewArchive = [{ id: 1, date: '2026-10-27', studentName: 'علي', cls: '1', recordDate: '2026-10-27' }];
  d.absenceArchive = [{ id: 2, recordDate: '2026-10-28', studentName: 'سارة' }];
  d.workshopsArchive = [{ id: 3, date: '2026-10-28', title: 'ورشة' }];
  d.parentCalls = [{ id: 4, date: '2026-10-29' }];
}
test('wkCollections وwkReportHtml وwkBuildRows تطابق القديم', async () => {
  const r = await both({}, async (h, e, k) => {
    weeklyFixture(h, k); const W = api(h, k).W;
    return [JSON.stringify(W.wkCollections()), JSON.stringify(W.wkBuildRows('2026-10-26', '2026-11-01')), W.wkReportHtml('2026-10-26', '2026-11-01')];
  }, { WeeklyReport, WeeklyPrint: WP });
  same(r, 'weekly');
});
test('wprBridge: get/save لكل نوع وحرس النوع المجهول', async () => {
  const r = await both({}, async (h, e, k) => {
    weeklyFixture(h, k); await tick(); const B = api(h, k).W.wprBridge || h.win.wprBridge; const out = [];
    for (const t of ['interview', 'reintegration', 'absence', 'violence', 'workshop', 'specNeeds', 'unknown']) {
      out.push(JSON.stringify(B.get(t))); B.save(t, [{ id: t }]); out.push(JSON.stringify(B.get(t)));
    }
    B.refreshStats(); await tick();
    return out;
  }, { WeeklyReport, WeeklyPrint: WP });
  same(r, 'wprBridge');
});
test('wpGetWeekRange وwpInitMainBadge', async () => {
  const r = await both({ local: { 'wp:selectedFrom': '2026-09-01', 'wp:selectedTo': '2026-09-07' } }, async (h, e, k) => {
    const W = api(h, k).W; const out = [0, 1, -2].map((n) => JSON.stringify(W.wpGetWeekRange(n)));
    W.wpInitMainBadge(); e.local.clear(); W.wpInitMainBadge(); W.wpUpdateMainBadge('a', 'b');
    return out;
  }, { WeeklyReport, WeeklyPrint: WP });
  same(r, 'week range');
});
test('الطباعة والتصدير إلى Word لفترة', async () => {
  printed.length = 0;
  const eL = makeEnv({}); const L = runLegacy(eL, { WeeklyReport, WeeklyPrint: WP }); weeklyFixture(L, 'legacy');
  L.ctx.printWeeklyReportForRange('2026-10-26', '2026-11-01'); await L.ctx.downloadWeeklyReportWordForRange('2026-10-26', '2026-11-01');
  const legacyOut = printed.splice(0);
  const eN = makeEnv({}); const N = runNew(eN, { WeeklyReport, WeeklyPrint: WP }); weeklyFixture(N, 'new');
  N.weekly.printWeeklyReportForRange('2026-10-26', '2026-11-01'); await N.weekly.downloadWeeklyReportWordForRange('2026-10-26', '2026-11-01');
  assert.deepEqual(printed, legacyOut);
});

// ───────────────────────── حراسة: لا بقايا قديمة ─────────────────────────
test('لم يعد في المشروع script-10/15/16 ولا public/legacy ولا قائمة سكربتات', () => {
  for (const n of [10, 15, 16]) assert.ok(!fs.existsSync(new URL('../public/legacy/js/script-' + n + '.js', import.meta.url)));
  assert.ok(!fs.existsSync(new URL('../public/legacy', import.meta.url)));
  assert.ok(!fs.existsSync(new URL('../src/legacy/scripts.manifest.json', import.meta.url)));
});
