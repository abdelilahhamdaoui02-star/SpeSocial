// اختبار «التنقل بين البوابات»: حالة التنقل (src/nav/navStore.js) تُختبر مباشرة بلا DOM؛
// أما الشريط المجمَّد والعناوين (src/nav/navLogic.js) فتُقارَن بنسخة _buildFrozenNav القديمة المجمَّدة للمرحلة 31.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createNavStore } from '../src/nav/navStore.js';
import { createSessionStore } from '../src/session/sessionStore.js';
import { ALL_TOOL_DOM_IDS, FROZEN_NAV, TOOL_DOM_IDS, TOOL_TITLES, frozenLabel, portalTitle, toolDomId } from '../src/nav/navLogic.js';

const J = (x) => JSON.parse(JSON.stringify(x)); // كائنات vm من عالم آخر: نقارنها بعد التسلسل
const legacySrc = fs.readFileSync(new URL('./fixtures/nav.step31.js', import.meta.url), 'utf8');

// حالة التنقل صارت مخزناً (nav/navStore) تُرسم منه الصفحات؛ لا DOM هنا. نُحاكي window بسجل أحداث وتمرير فقط.
function makeEnv() {
  const log = { events: [], scrolls: [] };
  const listeners = {};
  const doc = { documentElement: { scrollTop: 5 }, body: { scrollTop: 5 } };
  const win = {
    dispatchEvent: (e) => { log.events.push(e.type); (listeners[e.type] || []).forEach((fn) => fn(e)); return true; },
    addEventListener: (t, fn) => { (listeners[t] ||= new Set()).add(fn); },
    removeEventListener: (t, fn) => { (listeners[t] || new Set()).delete(fn); },
    scrollTo: (o) => log.scrolls.push(o),
  };
  return { doc, win, log };
}
const mkStore = () => { const env = makeEnv(); const session = createSessionStore(); return { env, session, nav: createNavStore({ ...env, session }) }; };

test('openPortal: تضبط البوابة الحالية وترجع true وتمرّر للأعلى لكل بوابة', () => {
  for (const tool of Object.keys(TOOL_DOM_IDS)) {
    const { env, nav } = mkStore();
    assert.equal(nav.openPortal(tool), true);
    assert.equal(nav.getState().current, tool, tool);
    assert.deepEqual(env.log.scrolls, [{ top: 0, behavior: 'smooth' }]);
    assert.equal(env.doc.documentElement.scrollTop, 0);
    assert.equal(env.doc.body.scrollTop, 0);
  }
});

test('فتح بوابة ثانية يستبدل الأولى', () => {
  const { nav } = mkStore();
  nav.openPortal('interview'); nav.openPortal('stats');
  assert.equal(nav.getState().current, 'stats');
});

test('goHome: العودة للرئيسية مع طلب إعادة قراءة البطاقات (كان في تغليف script-23)', () => {
  const { env, nav } = mkStore();
  nav.openPortal('violence');
  env.log.scrolls.length = 0;
  nav.goHome();
  assert.equal(nav.getState().current, null);
  assert.deepEqual(env.log.events, ['legacy:stats-refresh']);
  assert.equal(env.log.scrolls.length, 1);
});

test('معرّف مجهول: لا يتغيّر شيء (القديم كان يترك صفحة فارغة)', () => {
  const { env, nav } = mkStore();
  nav.openPortal('casefile');
  assert.equal(nav.openPortal('nope'), false);
  assert.equal(nav.openPortal('constructor'), false);
  assert.equal(nav.getState().current, 'casefile');
  assert.equal(toolDomId('nope'), '');
  assert.equal(toolDomId('constructor'), '');
  assert.equal(env.log.scrolls.length, 1);
});

test('الدخول والخروج: دخول الجلسة يُظهر الرئيسية وخروجها يغلق البوابة ويخفيها', () => {
  const { session, nav } = mkStore();
  const off = nav.install();
  assert.equal(nav.getState().entered, false);
  session.entered('u1');
  assert.equal(nav.getState().entered, true);
  nav.openPortal('absence');
  session.loggedOut();
  assert.deepEqual({ ...nav.getState() }, { current: null, entered: false });
  off();
  session.entered('u1');
  assert.equal(nav.getState().entered, false, 'بعد الإلغاء لا يستمع');
});

test('subscribe: يُبلَّغ المشتركون عند كل تغيّر ويتوقفون بعد الإلغاء', () => {
  const { nav } = mkStore();
  let n = 0;
  const un = nav.subscribe(() => { n++; });
  nav.openPortal('iip'); nav.goHome();
  assert.equal(n, 2);
  un(); nav.openPortal('iip');
  assert.equal(n, 2);
});

test('الحالة غير قابلة للتعديل (مرجع جديد عند كل تغيّر ليعمل useSyncExternalStore)', () => {
  const { nav } = mkStore();
  const a = nav.getState();
  nav.openPortal('stats');
  assert.notEqual(nav.getState(), a);
  assert.ok(Object.isFrozen(nav.getState()));
});

// ── الشريط المجمَّد والعناوين: المنطق البحت لم يتغيّر، فنبقي مقارنته بالنسخة القديمة المجمَّدة (fixture) ──
// DOM مُحاكى: كل عنصر له classList وstyle وinnerHTML، والأحداث والتمرير تُسجَّل
function makeLegacyEnv() {
  const els = {};
  const mk = () => {
    const classes = new Set();
    return { style: {}, innerHTML: '', scrollTop: 0, classes, classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c) } };
  };
  ['portalLanding', 'frozenNav', ...ALL_TOOL_DOM_IDS].forEach((id) => { els[id] = mk(); });
  const log = { events: [], scrolls: [] };
  const doc = { getElementById: (id) => els[id] || null, documentElement: mk(), body: mk() };
  const win = {
    dispatchEvent: (e) => { log.events.push({ type: e.type, detail: e.detail ?? null }); return true; },
    scrollTo: (o) => log.scrolls.push(o),
  };
  return { els, doc, win, log };
}
function legacyContext(env) {
  const ctx = vm.createContext({ document: env.doc, window: env.win, CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } }, SITE_CFG: {} });
  vm.runInContext(legacySrc, ctx);
  return ctx;
}

function parseCards(html) {
  return [...html.matchAll(/class="frozen-card([^"]*)" onclick="openTool\('(\w+)'\)" title="([^"]*)">\s*<div class="frozen-card-icon">([^<]*)<\/div>\s*<div class="frozen-card-label">([^<]*)<\/div>/g)]
    .map((m) => ({ active: m[1].includes('active-tool'), key: m[2], title: m[3], icon: m[4], label: m[5] }));
}

test('الشريط المجمَّد: الترتيب والأيقونات والتسميات والعناوين والبطاقة النشطة', () => {
  const a = makeLegacyEnv(); const ctxA = legacyContext(a);
  ctxA.openTool('casefile');
  const legacy = parseCards(a.els.frozenNav.innerHTML);
  const mine = FROZEN_NAV.map((it) => ({ active: it.key === 'casefile', key: it.key, title: portalTitle(it.key, ''), icon: it.icon, label: frozenLabel(it, '') }));
  assert.deepEqual(mine, legacy);
});

test('الشريط المجمَّد: التسمية المخصّصة من الأدمين (الاسم والعنوان)', () => {
  const a = makeLegacyEnv(); const ctxA = legacyContext(a);
  const gates = { interview: ' مقابلات خاصة ', stats: '', violence: 'حماية' };
  // سطور applySiteConfig القديمة (حُذفت من script-10.js) تُنفَّذ هنا على نسخة الاختبار
  vm.runInContext(`SITE_CFG = { gates: ${JSON.stringify(gates)} };
    const DEFAULT_TITLES = Object.assign({}, TOOL_TITLES);
    Object.keys(DEFAULT_TITLES).forEach(k => { const n = (SITE_CFG.gates[k] || '').trim(); TOOL_TITLES[k] = n ? DEFAULT_TITLES[k].split(' ')[0] + ' ' + n : DEFAULT_TITLES[k]; });`, ctxA);
  ctxA.openTool('stats');
  const legacy = parseCards(a.els.frozenNav.innerHTML);
  const mine = FROZEN_NAV.map((it) => ({ active: it.key === 'stats', key: it.key, title: portalTitle(it.key, gates[it.key]), icon: it.icon, label: frozenLabel(it, gates[it.key]) }));
  assert.deepEqual(mine, legacy);
});

test('عناوين البوابات الافتراضية مطابقة للقديمة', () => {
  const a = makeLegacyEnv(); const ctxA = legacyContext(a);
  assert.deepEqual(J(TOOL_TITLES), J(vm.runInContext('TOOL_TITLES', ctxA)));
  assert.deepEqual(Object.values(TOOL_DOM_IDS), J(vm.runInContext('ALL_TOOLS', ctxA)));
});
