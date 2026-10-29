// اختبار مطابقة الإقلاع: نشغّل script-11.js القديم (نسخة الخطوة 41 المجمَّدة) في بيئة معزولة بـDOM مصغَّر،
// ونقارن الشاشات الظاهرة والأحداث المرسلة وقيمة STORAGE_IS_CLOUD وعدد استدعاءات الدخول التلقائي مع src/boot/bootLogic.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createBoot, LOADING_MSG } from '../src/boot/bootLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/boot.step41.js', import.meta.url), 'utf8');

// وعد Firebase يُنشأ عند أول قراءة فقط (حتى لا يبقى وعد مرفوض بلا مستمع في سيناريو «بلا اتصال»)
function lazyReady(kind) {
  let p;
  return () => {
    if (kind === 'none') return null;
    if (!p) p = kind === 'ok' ? Promise.resolve(true) : kind === 'false' ? Promise.resolve(false) : Promise.reject(new Error('x'));
    return p;
  };
}

const IDS = { loading: 'appLoadingScreen', offline: 'appOfflineScreen', required: 'appFirebaseRequiredScreen', error: 'appFirebaseErrorScreen' };

// سيناريو: { online, ready: 'ok'|'false'|'reject'|'none', hasStorage, configured, restored }
async function runLegacy(sc) {
  const els = {};
  const events = [];
  const calls = { auto: 0, status: 0 };
  const listeners = {};
  const mkEl = () => ({ style: {}, set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; }, textContent: '' });
  const doc = {
    getElementById: (id) => els[id] || null,
    createElement: () => mkEl(),
    body: { appendChild: (el) => { els[el.id] = el; } },
    addEventListener: (n, fn) => { listeners['doc:' + n] = fn; },
  };
  // appLoadingMsg يُنشأ داخل innerHTML في القديم؛ نحاكيه عند الطلب
  const origGet = doc.getElementById;
  doc.getElementById = (id) => origGet(id) || (id === 'appLoadingMsg' ? { textContent: '' } : null);
  const readyOf = lazyReady(sc.ready);
  const win = {
    addEventListener: (n, fn) => { listeners['win:' + n] = fn; },
    dispatchEvent: (e) => { events.push(e.type); },
    _isFirebaseConfigured: () => sc.configured,
    storage: sc.hasStorage ? {} : undefined,
    get _firebaseReady() { return readyOf(); },
  };
  const ctx = vm.createContext({
    document: doc, window: win, navigator: { onLine: sc.online },
    Event: class { constructor(t) { this.type = t; } },
    tryAutoLogin: async () => { calls.auto++; return sc.restored; },
    fbUpdateStatus: () => { calls.status++; },
    location: { reload() {} },
  });
  // مثل المتصفح: window.storage مرئي أيضاً كمتغير عام (typeof window.storage فقط يُستعمل)
  vm.runInContext(legacySrc, ctx);
  await listeners['doc:DOMContentLoaded']();
  const visible = {};
  for (const [k, id] of Object.entries(IDS)) visible[k] = !!els[id] && els[id].style.display !== 'none';
  return { visible, events, calls, cloud: ctx.STORAGE_IS_CLOUD };
}

async function runMine(sc) {
  const events = [];
  const calls = { auto: 0, status: 0 };
  const clouds = [];
  const readyOf = lazyReady(sc.ready);
  const boot = createBoot({
    isOnline: () => sc.online,
    get firebaseReady() { return readyOf(); },
    hasStorage: () => sc.hasStorage,
    setCloud: (v) => clouds.push(!!v),
    isConfigured: () => sc.configured,
    tryAutoLogin: async () => { calls.auto++; return sc.restored; },
    // الإقلاع يستدعي مخزن الجلسة مباشرة؛ نسجّل بأسماء الأحداث القديمة كي تبقى المقارنة حرفية
    session: { hideAuth: () => events.push('legacy:hide-auth'), needLogin: () => events.push('legacy:need-login') },
    updateStatus: () => { calls.status++; },
    reload() {},
  });
  await boot.start();
  const s = boot.getSnapshot();
  return { visible: { loading: s.loading, offline: s.offline, required: s.required, error: s.error }, events, calls, cloud: clouds.length ? clouds[clouds.length - 1] : undefined, msg: s.loadingMsg };
}

const bools = [true, false];
const readies = ['ok', 'false', 'reject', 'none'];
const scenarios = [];
for (const online of bools) for (const ready of readies) for (const hasStorage of bools) for (const configured of bools) for (const restored of bools) {
  scenarios.push({ online, ready, hasStorage, configured, restored });
}

test('كل تركيبات الحالات (إنترنت × Firebase × إعداد × استعادة الجلسة) تعطي نفس النتيجة للقديم والجديد', async () => {
  for (const sc of scenarios) {
    const a = await runLegacy(sc);
    const b = await runMine(sc);
    const tag = JSON.stringify(sc);
    assert.deepEqual(b.visible, a.visible, 'الشاشات ' + tag);
    assert.deepEqual(b.events, a.events, 'الأحداث ' + tag);
    assert.deepEqual(b.calls, a.calls, 'الاستدعاءات ' + tag);
    assert.equal(Boolean(b.cloud), Boolean(a.cloud), 'STORAGE_IS_CLOUD ' + tag);
  }
});

test('بلا اتصال: شاشة «لا اتصال» فقط ويُرسَل legacy:hide-auth، ولا يُلمس Firebase', async () => {
  const b = await runMine({ online: false, ready: 'ok', hasStorage: true, configured: true, restored: true });
  assert.deepEqual(b.visible, { loading: false, offline: true, required: false, error: false });
  assert.deepEqual(b.events, ['legacy:hide-auth']);
  assert.equal(b.calls.auto, 0);
});

test('نص شاشة التحميل كما كان', () => {
  assert.equal(LOADING_MSG, '⏳ جارٍ الاتصال بقاعدة البيانات...');
  assert.ok(legacySrc.includes(LOADING_MSG));
});

test('انقطاع الإنترنت أثناء الاستخدام يعرض الشاشة، وعودته تعيد التحميل (كما في القديم)', () => {
  const events = []; let reloads = 0;
  const boot = createBoot({ isOnline: () => true, firebaseReady: null, hasStorage: () => true, setCloud() {}, isConfigured: () => true,
    tryAutoLogin: async () => true, session: { hideAuth: () => events.push('legacy:hide-auth'), needLogin() {} }, updateStatus() {}, reload: () => { reloads++; } });
  boot.showOffline();
  assert.equal(boot.getSnapshot().offline, true);
  assert.deepEqual(events, ['legacy:hide-auth']);
  boot.onOnline();
  assert.equal(reloads, 1);
  assert.match(legacySrc, /addEventListener\('offline'/);
  assert.match(legacySrc, /addEventListener\('online'[\s\S]*location\.reload\(\)/);
});

test('المشتركون يُبلَغون عند كل تغيير ويمكن إلغاء الاشتراك', async () => {
  const boot = createBoot({ isOnline: () => false, firebaseReady: null, hasStorage: () => true, setCloud() {}, isConfigured: () => true,
    tryAutoLogin: async () => true, session: { hideAuth() {}, needLogin() {} }, updateStatus() {}, reload() {} });
  let n = 0;
  const off = boot.subscribe(() => { n++; });
  await boot.start();
  assert.ok(n >= 1);
  const before = n; off();
  boot.showOffline();
  assert.equal(n, before);
});

test('الكود القديم لم يعد يحتوي الإقلاع، وبقيت دالتا أرشيف الغياب في script-16', () => {
  assert.ok(!fs.existsSync(new URL('../public/legacy/js/script-11.js', import.meta.url)));
  const s16 = fs.readFileSync(new URL('./fixtures/legacy.script-16.step46.js', import.meta.url), 'utf8');
  assert.match(s16, /function getAbArchive\(\) \{ return appData\.absenceArchive; \}/);
  assert.match(s16, /function saveAbArchive\(data\) \{ appData\.absenceArchive = data; saveUserKey\('absenceArchive'\); \}/);
  // الخطوة 48: scripts.manifest.json نفسه حُذف (المكتبات من npm)
  assert.ok(!fs.existsSync(new URL('../src/legacy/scripts.manifest.json', import.meta.url)));
});
