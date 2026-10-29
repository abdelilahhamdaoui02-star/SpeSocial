// بيئة اختبار الخطوة 47: تشغّل script-10/15/16 القديمة (نسخ الخطوة 46 المجمَّدة في tests/fixtures) في vm بجانب وحدات src/session الجديدة،
// بنفس التخزين المحلي والسحابي والمؤقّتات الوهمية، ثم تقارن اللقطات.
import fs from 'node:fs';
import vm from 'node:vm';

const read = (n) => fs.readFileSync(new URL('../fixtures/legacy.script-' + n + '.step46.js', import.meta.url), 'utf8');
export const LEGACY = [read(10), read(15), read(16)];

export const FIXED = new Date('2026-10-29T09:30:00Z').getTime();
export class FakeDate extends Date {
  constructor(...a) { if (a.length) super(...a); else super(FIXED); }
  static now() { return FIXED; }
}

class Ev { constructor(type) { this.type = type; } }
class CEv extends Ev { constructor(type, init) { super(type); this.detail = init && init.detail; } }

const ELEMENT_IDS = ['portalLanding', 'userBar', 'searchNotifBar', 'authStorageNote', 'settingsModal', 'firebaseSetupModal', 'profileOTPCountdown', 'sugg'];

function mkEl() {
  const classes = new Set();
  return {
    style: {}, textContent: '', value: '', _html: '', focused: false,
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) },
    set innerHTML(v) { this._html = v; }, get innerHTML() { return this._html; },
    focus() { this.focused = true; },
    snap() { return JSON.stringify({ style: this.style, text: this.textContent, html: this._html, value: this.value, cls: [...classes].sort(), focused: this.focused }); },
  };
}

// بيئة واحدة: تخزين محلي وسحابي ومؤقّتات وسجل موحَّد
export function makeEnv(opts = {}) {
  const log = [];
  const local = new Map(Object.entries(opts.local || {}));
  const cloud = new Map(Object.entries(opts.cloud || {}));
  const timers = [];
  const els = {}; ELEMENT_IDS.forEach((id) => { els[id] = mkEl(); });
  const lists = { '.bb-avatar': [mkEl(), mkEl()], '.bb-name': [mkEl()], '#profileInfoAvatar,#userInitial,.bb-avatar': [mkEl(), mkEl(), mkEl()] };
  const env = {
    log, local, cloud, els, lists, timers, online: opts.online !== false, confirmAnswer: opts.confirm !== false,
    cloudFail: opts.cloudFail || null, // 'get' | 'set' | 'hang'
    fbAuth: opts.fbAuth || null,
    sched: (fn, ms) => { timers.push({ fn, ms, seq: timers.length }); return timers.length; },
    flush() { const t = timers.splice(0).sort((a, b) => a.ms - b.ms || a.seq - b.seq); t.forEach((x) => x.fn()); },
    emit: (name, detail) => log.push(['event', name, detail === undefined ? null : detail]),
    winCall: (name) => (...a) => { log.push(['win', name, ...a]); },
    toast: (m, t) => log.push(['toast', m, t]),
    cloudApi: {
      async get(k, s) { log.push(['cloud.get', k, !!s]); if (env.cloudFail === 'get') throw new Error('boom'); return cloud.has(k) ? { key: k, value: cloud.get(k), shared: !!s } : null; },
      set(k, v, s) {
        log.push(['cloud.set', k, v.length, !!s]);
        if (env.cloudFail === 'hang') return new Promise(() => {});
        if (env.cloudFail === 'set') return Promise.reject(new Error('fail'));
        cloud.set(k, v); return Promise.resolve({ key: k });
      },
    },
    localApi: {
      get: (k) => (local.has(k) ? local.get(k) : null),
      set: (k, v) => { local.set(k, v); },
      remove: (k) => { local.delete(k); },
    },
    doc: {
      getElementById: (id) => els[id] || null,
      querySelectorAll: (sel) => lists[sel] || [],
      addEventListener() {}, createElement: () => mkEl(),
    },
    // StudentDb مسجِّل: كل استدعاء يدخل السجل
    StudentDb: {
      calls: [],
      replaceFromCustom(l) { log.push(['db.replace', JSON.stringify(l)]); }, mergeCustom(l) { log.push(['db.merge', JSON.stringify(l)]); },
      clear() { log.push(['db.clear']); }, list() { return []; },
    },
    snapshot() {
      return JSON.stringify({
        log, local: [...local.entries()].sort(), cloud: [...cloud.entries()].sort(),
        els: Object.fromEntries(Object.entries(els).map(([k, v]) => [k, v.snap()])),
        lists: Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, v.map((x) => x.snap())])),
      });
    },
  };
  return env;
}

// ── التشغيل القديم: السكربتات الثلاثة في سياق واحد بالترتيب نفسه ──
export function runLegacy(env, extra = {}) {
  const warns = [];
  const win = {
    addEventListener() {}, dispatchEvent: (e) => { env.emit(e.type, e.detail); return true; },
    storage: env.cloudApi, _fbAuth: env.fbAuth, _firebaseReady: undefined, _firebaseStatus: extra.firebaseStatus,
    location: { hostname: 'localhost' },
  };
  const rec = (n) => env.winCall(n);
  const ctx = vm.createContext({
    window: win, document: env.doc, navigator: { get onLine() { return env.online; } },
    localStorage: { getItem: (k) => env.localApi.get(k), setItem: (k, v) => env.localApi.set(k, v), removeItem: (k) => env.localApi.remove(k) },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    Event: Ev, CustomEvent: CEv, Date: FakeDate, JSON, Promise, Math, Object, Array, Error, String, Number, RegExp, URL, encodeURIComponent,
    console: { log() {}, warn: (...a) => warns.push(a.map(String).join(' ')), error() {} },
    setTimeout: env.sched, clearInterval() {}, setInterval() { return 0; }, clearTimeout() {},
    confirm: () => env.confirmAnswer, alert() {}, fetch: async () => ({}),
    StudentDb: env.StudentDb, showToast: env.toast,
    updateDirectorateUI: rec('updateDirectorateUI'), updateAllLevelSelects: rec('updateAllLevelSelects'),
    applyInstitutionEverywhere: rec('applyInstitutionEverywhere'), loadSiteConfig: rec('loadSiteConfig'),
    getDirectorate: () => 'مديرية', initLogoFromStorage: rec('initLogoFromStorage'),
    MINISTRY_LOGO_B64: 'LOGO', WeeklyReport: extra.WeeklyReport, WeeklyPrint: extra.WeeklyPrint,
    closeSettings: env.winCall('closeSettings'), closeProfile: env.winCall('closeProfile'),
  });
  LEGACY.forEach((src) => vm.runInContext(src, ctx));
  const get = (expr) => vm.runInContext(expr, ctx);
  return {
    ctx, win, warns, get,
    setUser: (u) => vm.runInContext('currentUser = ' + JSON.stringify(u), ctx),
    setCloud: (v) => { win.__legacyBridge.setCloud(v); },
    user: () => get('currentUser'), profile: () => get('userProfile'), appData: () => get('appData'),
  };
}
