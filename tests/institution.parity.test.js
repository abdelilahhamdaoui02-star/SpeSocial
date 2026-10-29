// اختبار مطابقة الخطوة 43: نشغّل كود المديرية/المؤسسة/الأقسام/إعدادات المنصة القديم (نسخة script-10 المجمَّدة)
// ونقارن DOM الناتج والأحداث وقوائم الأقسام بـsrc/institution.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createInstitution } from '../src/institution/institutionStore.js';
import * as L from '../src/institution/institutionLogic.js';
import { cleanClassValue } from '../src/students/cleanClass.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/institution.step42.js', import.meta.url), 'utf8');

// ── DOM مصغَّر مشترك: عناصر لها class وtextContent/value/innerHTML/dataset ──
function makeDom() {
  const mk = (cls, text = '') => ({ cls: cls.split(' '), textContent: text, value: '', innerHTML: '', dataset: {},
    querySelector(sel) { const m = sel.match(/option\[value="(.*)"\]/); if (!m) return null; return this.innerHTML.includes(`value="${m[1]}"`) ? { v: m[1] } : null; } });
  const els = {
    ministry: [mk('dyn-ministry', 'وزارة قديمة'), mk('dyn-ministry', 'وزارة قديمة')],
    hpSub: [mk('hp-sub', 'عنوان افتراضي')], authTitle: [mk('auth-title', 'منصة التوثيق المهني')],
    dir: [mk('dynamic-directorate', 'x'), mk('dynamic-directorate', 'x')],
    pm: [mk('pm-directorate')], kingdom: [mk('dynamic-dir-kingdom')], sub2: [mk('dynamic-dir-sub2')],
    sub3: [mk('dynamic-dir-sub3')], oh: [mk('dynamic-dir-oh-sub')],
    levels: [mk('level-select'), mk('level-select abm-select'), (() => { const e = mk('level-select'); e.react = true; return e; })()],
    greet: mk('', 'x'),
    fields: {},
  };
  L.INSTITUTION_FIELD_IDS.slice(0, 4).forEach((id) => { els.fields[id] = mk('', ''); els.fields[id].value = 'قديم'; });
  const bySel = (sel) => {
    switch (sel) {
      case '.dyn-ministry': return els.ministry;
      case '.hp-sub, .auth-title': return [...els.hpSub, ...els.authTitle];
      case '.dynamic-directorate': return els.dir;
      case '.pm-directorate': return els.pm;
      case '.dynamic-dir-kingdom': return els.kingdom;
      case '.dynamic-dir-sub2': return els.sub2;
      case '.dynamic-dir-sub3': return els.sub3;
      case '.dynamic-dir-oh-sub': return els.oh;
      case 'select.level-select:not(.abm-select):not([data-react-level])': return [els.levels[0]];
      default: return [];
    }
  };
  const doc = {
    querySelectorAll: (sel) => bySel(sel),
    getElementById: (id) => (id === 'portalGreetingSub' ? els.greet : els.fields[id] || null),
  };
  const snap = () => JSON.stringify({
    ministry: els.ministry.map((e) => e.textContent), hp: els.hpSub[0].textContent, auth: els.authTitle[0].textContent,
    dir: els.dir.map((e) => e.textContent), pm: els.pm[0].textContent, kingdom: els.kingdom[0].textContent,
    sub2: els.sub2[0].textContent, sub3: els.sub3[0].textContent, oh: els.oh[0].textContent, greet: els.greet.textContent,
    level0: els.levels[0].innerHTML, level0v: els.levels[0].value, level1: els.levels[1].innerHTML, level2: els.levels[2].innerHTML,
    fields: Object.fromEntries(Object.entries(els.fields).map(([k, v]) => [k, v.value])),
  });
  return { doc, els, snap };
}

function scenario(o = {}) {
  return { profile: o.profile ?? {}, db: o.db ?? [], custom: o.custom ?? [], stored: o.stored ?? null, remote: o.remote ?? null, ...o };
}

function runLegacy(sc) {
  const d = makeDom(); const events = []; const store = {};
  if (sc.stored) store['site:cfg'] = sc.stored;
  const ctx = vm.createContext({
    document: d.doc, userProfile: sc.profile,
    StudentDb: { count: () => sc.db.length, list: () => sc.db },
    getCustomStudents: () => sc.custom, cleanClassValue,
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    CustomEvent: class { constructor(t, i) { this.type = t; this.detail = i && i.detail; } },
  });
  ctx.window = { dispatchEvent: (e) => events.push([e.type, JSON.stringify(e.detail)]),
    _firebaseReady: Promise.resolve(true), _siteConfig: sc.remote ? { get: async () => ({ json: sc.remote }) } : null };
  vm.runInContext(legacySrc, ctx);
  const call = (n, ...a) => vm.runInContext(n, ctx)(...a);
  return { d, events, store, call, ctx };
}

function runMine(sc) {
  const d = makeDom(); const events = []; const store = {};
  if (sc.stored) store['site:cfg'] = sc.stored;
  const win = { dispatchEvent: (e) => events.push([e.type, JSON.stringify(e.detail)]) };
  const inst = createInstitution({
    doc: d.doc, win, cloudReady: () => Promise.resolve(true), siteConfigApi: () => (sc.remote ? { get: async () => ({ json: sc.remote }) } : null), storage: () => ({ getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } }),
    getProfile: () => sc.profile, getDbList: () => sc.db, getCustomList: () => sc.custom,
    CustomEventCtor: class { constructor(t, i) { this.type = t; this.detail = i && i.detail; } },
  });
  return { d, events, store, inst };
}

const CFG_FULL = { ministry: ' وزارة جديدة ', platform: ' منصة مخصّصة ', gates: { parents: 'الأولياء' }, news: { on: true }, notice: { id: 'n1', text: 'مرحبا' } };
const profiles = [{}, { school: 'مديرية الدار البيضاء', institution: 'ثانوية الأمل' }, { institution: 'إعدادية النهضة' }];
const dbs = [[], [{ class: '1APIC-1' }, { class: '2APIC-3' }, { class: 'القسم' }, { class: '1APIC-1' }]];
const customs = [[], [{ class: 'TC-علوم' }, { class: '10 ب' }, { class: '2 أ' }]];

test('applySiteConfig + updateDirectorateUI: نفس DOM ونفس الحدث لكل الإعدادات والملفات الشخصية', () => {
  for (const cfg of [null, {}, { ministry: '   ' }, { platform: '   ' }, CFG_FULL]) {
    for (const profile of profiles) {
      const a = runLegacy(scenario({ profile })); const b = runMine(scenario({ profile }));
      a.call('applySiteConfig', cfg); b.inst.applySiteConfig(cfg);
      assert.equal(b.d.snap(), a.d.snap(), JSON.stringify([cfg, profile]));
      assert.deepEqual(b.events, a.events, JSON.stringify([cfg, profile]));
    }
  }
});

test('data-def: النص الأصلي يُحفظ أول مرة ويُستعاد عند فراغ المنصة', () => {
  const a = runLegacy(scenario()); const b = runMine(scenario());
  for (const cfg of [{ platform: 'أ' }, { platform: 'ب' }, { platform: '' }, {}]) { a.call('applySiteConfig', cfg); b.inst.applySiteConfig(cfg); assert.equal(b.d.snap(), a.d.snap()); }
  assert.equal(b.d.els.hpSub[0].textContent, 'عنوان افتراضي');
});

test('getMinistry/getDirectorate/getInstitutionName مثل القديمة', () => {
  for (const profile of profiles) {
    for (const cfg of [{}, { ministry: 'م' }, { ministry: '  ' }]) {
      const a = runLegacy(scenario({ profile })); const b = runMine(scenario({ profile }));
      a.call('applySiteConfig', cfg); b.inst.applySiteConfig(cfg);
      assert.equal(b.inst.getMinistry(), a.call('getMinistry'));
      assert.equal(b.inst.getDirectorate(), a.call('getDirectorate'));
      assert.equal(b.inst.getInstitutionName(), a.call('getInstitutionName'));
    }
  }
});

test('getImportedClasses وbuildLevelOptions: الذاكرة ثم المخزَّن، مرتّبة عربياً، مع التنظيف والهروب', () => {
  for (const db of dbs) for (const custom of customs) {
    const sc = scenario({ db, custom });
    const a = runLegacy(sc); const b = runMine(sc);
    assert.deepEqual([...b.inst.getImportedClasses()], [...a.call('getImportedClasses')]);
    assert.equal(b.inst.buildLevelOptions(), a.call('buildLevelOptions', 16));
  }
  const odd = scenario({ custom: [{ class: 'a"b' }, { class: '<x>' }, { class: 'p&q' }] });
  assert.equal(runMine(odd).inst.buildLevelOptions(), runLegacy(odd).call('buildLevelOptions', 16));
});

test('أخطاء قراءة اللائحة لا تكسر (كما try/catch القديم)', () => {
  const a = runLegacy(scenario());
  a.ctx.StudentDb.count = () => { throw new Error('x'); }; a.ctx.getCustomStudents = () => { throw new Error('y'); };
  const b = createInstitution({ doc: makeDom().doc, win: {}, storage: () => ({}), getProfile: () => ({}),
    getDbList: () => { throw new Error('x'); }, getCustomList: () => { throw new Error('y'); }, CustomEventCtor: class {} });
  assert.deepEqual([...b.getImportedClasses()], [...a.call('getImportedClasses')]);
  assert.deepEqual([...b.getImportedClasses()], []);
});

test('updateAllLevelSelects: يعيد بناء الخيارات ويُبقي القيمة الحالية إن وُجدت', () => {
  for (const sc of [scenario(), scenario({ db: dbs[1] }), scenario({ custom: customs[1] })]) {
    for (const cur of ['', '1APIC-1', 'غير موجودة', '2 أ']) {
      const a = runLegacy(sc); const b = runMine(sc);
      a.d.els.levels[0].value = cur; b.d.els.levels[0].value = cur;
      a.call('updateAllLevelSelects'); b.inst.updateAllLevelSelects();
      assert.equal(b.d.snap(), a.d.snap(), JSON.stringify([sc.db.length, cur]));
    }
  }
});

test('applyInstitutionEverywhere: يملأ حقول المؤسسة الموجودة فقط', () => {
  for (const profile of profiles) {
    const a = runLegacy(scenario({ profile })); const b = runMine(scenario({ profile }));
    a.call('applyInstitutionEverywhere'); b.inst.applyInstitutionEverywhere();
    assert.equal(b.d.snap(), a.d.snap());
  }
});

test('loadSiteConfig: المحلي أولاً ثم السحابي مع حفظه محلياً — نفس الأحداث والتخزين', async () => {
  const remote = JSON.stringify({ ministry: 'سحابية', gates: { x: 'y' }, notice: { id: 'z' } });
  const local = JSON.stringify({ ministry: 'محلية', platform: 'منصة' });
  for (const sc of [scenario(), scenario({ stored: local }), scenario({ remote }), scenario({ stored: local, remote }), scenario({ stored: '{bad json', remote })]) {
    const a = runLegacy(sc); const b = runMine(sc);
    await a.call('loadSiteConfig'); await b.inst.loadSiteConfig();
    assert.deepEqual(b.events, a.events, JSON.stringify(sc.stored) + JSON.stringify(sc.remote));
    assert.deepEqual(b.store, a.store);
    assert.equal(b.d.snap(), a.d.snap());
  }
});

test('الخدمة السحابية غائبة أو ترمي: لا يكسر ولا يبثّ شيئاً', async () => {
  const b = runMine(scenario());
  b.inst.loadSiteConfig; await b.inst.loadSiteConfig();
  assert.deepEqual(b.events, []);
  const win = { dispatchEvent() { throw new Error('boom'); } };
  const c = createInstitution({ doc: makeDom().doc, win, cloudReady: () => Promise.resolve(true), siteConfigApi: () => ({ get: async () => ({ json: '{}' }) }), storage: () => ({ getItem: () => null, setItem() {} }), getProfile: () => ({}), getDbList: () => [], getCustomList: () => [], CustomEventCtor: class {} });
  await assert.doesNotReject(() => c.loadSiteConfig());
});

test('المنطق النقي: نصوص المديرية وتفاصيل الحدث وخيارات الأقسام', () => {
  const t = L.directorateTexts('وز', 'مدير');
  assert.deepEqual(t, { dir: 'مدير', greetSub: 'المختص الاجتماعي · مدير', kingdom: 'المملكة المغربية — وز — مدير', sub2: 'وز — مدير', sub3: '🏛 وز — مدير', ohSub: 'مدير — المصلحة الاجتماعية' });
  assert.deepEqual(L.siteConfigDetail(null), { gates: {}, news: {}, notice: {} });
  assert.equal(L.levelOptionsHtml([]), L.LEVEL_PLACEHOLDER_EMPTY);
  assert.equal(L.DEFAULT_MINISTRY, 'وزارة التربية الوطنية والتعليم الأولي والرياضة');
  assert.equal(L.directorateOf({}), 'مديرية الحي الحسني');
});

test('script-10.js لم يعد يعرّف هذه الدوال، ولا تسجيل لها على window', () => {
  const s10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
  for (const n of ['function applySiteConfig', 'function loadSiteConfig', 'function getMinistry', 'function updateDirectorateUI', 'function getDirectorate',
    'function getImportedClasses', 'function getInstitutionName', 'function applyInstitutionEverywhere', 'function buildLevelOptions',
    'function updateAllLevelSelects', 'function buildCollegeOptions', 'function buildLyceeOptions', 'function buildPrimaryOptions', 'INSTITUTION_FIELD_IDS', 'SITE_CFG']) {
    assert.ok(!s10.includes(n), n);
  }
  // الخطوة 5: لا تسجيل على window؛ الجلسة والبوابات تستدعيها عبر getInstitution()
  const app = fs.readFileSync(new URL('../src/legacy/LegacyApp.jsx', import.meta.url), 'utf8');
  assert.ok(!app.includes('installInstitution'));
  const store = fs.readFileSync(new URL('../src/institution/institutionStore.js', import.meta.url), 'utf8');
  assert.ok(!/Object\.assign\(window/.test(store) && !/window\.\w+\s*=/.test(store));
  assert.ok(store.includes('export const getInstitution'));
});
