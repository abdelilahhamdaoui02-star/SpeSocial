// اختبار مطابقة «البرنامج التدخلي الفردي» (المرحلة 17): نشغّل السكربت القديم المجمَّد (tests/fixtures/iip.step16.js) في vm
// مع DOM وهمي، ونقارن ما ينتجه (البيانات المحفوظة، التقرير، المنحنى، المؤشرات، الاقتراحات، الأرشيف، مستند الطباعة)
// بما تنتجه دوال src/iip على المدخلات نفسها. رسم JSX نفسه لا يغطيه هذا الملف (يُختبر في المتصفح).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { MODELS, DOM, RSUG, PSUG, XR, XS, PRINT_CSS, buildSuggestions } from '../src/iip/iipData.js';
import { chartSvg, reportHtml } from '../src/iip/iipReport.js';
import { buildPrintDocument } from '../src/iip/iipPrint.js';
import {
  blank, clone, setPath, upsert, canSave, findActiveDuplicate, dupKey, pickModel, setPrimary, addGoal, delGoal, setGoalField,
  autoplan, addSession, delSession, progressView, archiveRows, applySuggestion, reportContext, loadAll, storeAll, storageKey, todayStr,
  wordFileName, MSG, CONFIRM,
} from '../src/iip/iipLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/iip.step16.js', import.meta.url), 'utf8');
const NOW = new Date(2026, 9, 24, 10, 15, 0);
const USER = 'مختص تجريبي';

// ── بيئة الكود القديم ──
function makeLegacy({ stored = null, profile = { institution: 'ثانوية الأمل', fullName: 'سعاد المختصة' }, logo = '', now = NOW, confirmAnswer = true } = {}) {
  const els = new Map();
  const mk = (id) => ({
    id, value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, hidden: false, tagName: 'DIV', _id: id,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    querySelectorAll: () => [], querySelector: () => null, closest: () => null, appendChild() {}, remove() {}, setAttribute() {}, getAttribute: () => '',
  });
  const el = (id) => { if (!els.has(id)) els.set(id, mk(id)); return els.get(id); };
  const handlers = {};
  el('toolIip').addEventListener = (type, fn) => { (handlers[type] = handlers[type] || []).push(fn); };
  const timers = [];
  const state = { confirms: [], alerts: [], written: [], words: [], fixedNow: now, confirmAnswer };
  class FixedDate extends Date {
    constructor(...a) { a.length ? super(...a) : super(state.fixedNow.getTime()); }
    static now() { return state.fixedNow.getTime(); }
  }
  const storage = new Map();
  if (stored) storage.set(storageKey(USER), JSON.stringify(stored));
  const frame = { style: {}, id: '', contentWindow: { document: { open() {}, write: (h) => state.written.push(h), close() {}, querySelector: () => null }, focus() {}, print() {} }, remove() {} };
  const document = {
    getElementById: el, querySelectorAll: () => [], querySelector: () => null,
    createElement: (t) => (t === 'iframe' ? frame : mk('x')),
    body: { appendChild() {} },
  };
  const ctx = vm.createContext({
    document, console, Date: FixedDate, JSON, Event: class { constructor(t) { this.type = t; } }, Promise,
    localStorage: { getItem: (k) => (storage.has(k) ? storage.get(k) : null), setItem: (k, v) => { storage.set(k, String(v)); } },
    confirm: (m) => { state.confirms.push(m); return state.confirmAnswer; },
    alert: (m) => state.alerts.push(m),
    setTimeout: (fn) => { timers.push(fn); return timers.length; }, clearTimeout: (id) => { if (id) timers[id - 1] = null; },
    currentUser: USER, userProfile: profile, getInstitutionName: () => profile.institution || '', MINISTRY_LOGO_B64: logo,
    exportToWord: (id, name) => { state.words.push([id, name]); return Promise.resolve(); },
    STUDENT_DB: [], AUTOCOMPLETE_FIELDS: [], acSetup() {},
  });
  ctx.window = ctx;
  ctx.scrollTo = () => {};
  const patched = legacySrc.replace('window.iipInit=function(){',
    'window.__iip={MODELS,DOM,RSUG,PSUG,XR,XS,CSS,SG,report,chart,progress,blank,iipPrint,pickSG,addChip,archive,sess,getCur:()=>cur,setCur:v=>{cur=v},getAll:()=>ALL,setAll:v=>{ALL=v},sync,save};\nwindow.iipInit=function(){');
  assert.notEqual(patched, legacySrc);
  vm.runInContext(patched, ctx);
  const flush = () => { let guard = 0; while (timers.some(Boolean) && guard++ < 50) { const fns = timers.splice(0); fns.forEach((f) => f && f()); } };
  const L = ctx.__iip;
  return {
    ctx, L, el, state, storage, flush,
    init: () => ctx.iipInit(),
    fire: (type, target) => (handlers[type] || []).forEach((h) => h({ target, stopPropagation() {} })),
    stored: () => JSON.parse(storage.get(storageKey(USER)) || '[]'),
  };
}
const target = (o) => { const t = { tagName: 'INPUT', type: 'text', value: '', dataset: {}, getAttribute: () => null, closest: () => null, ...o }; return t; };
function typeK(h, k, value, type) { h.fire('input', target({ dataset: { k }, value, type: type || 'text', checked: value })); }
function typeG(h, g, value) { h.fire('input', target({ dataset: { g }, value })); }
function click(h, act, extra = {}) {
  const t = target({ tagName: 'BUTTON', dataset: { act, ...extra } });
  t.closest = (s) => (s === '[data-act]' ? t : null);
  h.fire('click', t); h.flush();
}
const strip = (html) => html.replace(/<[^>]*>/g, '');
const jsonEq = (a, b) => assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));

// برنامج غني للمقارنات
function richProgram() {
  let p = blank(NOW);
  const set = (k, v) => { p = setPath(p, k, v); };
  set('studentName', 'أحمد بن علي <b>'); set('massar', 'R130000001'); set('level', '1APIC-3'); set('referral.source', 'الإدارة'); set('referral.reason', 'غياب متكرر وغير مبرر، عزلة');
  set('consent.parent', true); set('consent.conf', true); set('domain', 'abs');
  set('assess.problem', 'يتغيب منذ شهر & يتأخر'); set('assess.strengths', 'يحب الرياضة'); set('assess.risks', 'ضعف الدعم'); set('assess.protect', 'صديق داعم');
  set('assess.family', 'أسرة متعاونة'); set('assess.school', 'علاقة جيدة'); set('assess.community', 'جمعية');
  set('baseline.abs', '12'); set('baseline.inc', '3'); set('baseline.well', '4'); set('baseline.mot', '5');
  p = { ...p, models: ['mi', 'sfbt'], primary: 'mi' };
  p = { ...p, goals: [{ text: 'خفض الغياب إلى 4 ساعات', ind: 'ساعات الغياب/الشهر', base: '12', target: '4', due: '2026-11-21', done: 'في تقدّم' }, {}, { text: 'تحسين الرفاه', done: 'تحقق' }] };
  set('strategies', 'النموذج: x\n1. a'); set('roles.student', 'الحضور'); set('roles.family', 'المتابعة'); set('roles.teachers', 'التنقيط'); set('roles.partners', 'مركز صحي');
  set('schedule.start', '2026-10-25'); set('schedule.freq', 'أسبوعياً'); set('schedule.dur', '30'); set('schedule.total', '6');
  p = { ...p, sessions: [
    { date: '2026-10-26', dur: '30', scale: '3', focus: 'بناء العلاقة', tech: 'الإصغاء', task: 'حضور', resp: 'متجاوب', next: 'مراجعة' },
    { date: '2026-11-02', dur: '30', scale: '5', focus: 'الهدف', tech: 'التدرّج', task: 'تدوين', resp: 'متحفظ', next: 'اتصال' },
    { date: '2026-11-09', dur: '', scale: '', focus: 'تقييم', tech: '', task: '', resp: '', next: '' },
    { date: '2026-11-16', dur: '45', scale: '8', focus: 'إغلاق', tech: '', task: '', resp: 'ممتاز', next: '' }] };
  set('review.date', '2026-11-20'); set('review.outcome', 'تحقق جزئي (تمديد البرنامج)'); set('review.notes', 'استمرار الدعم');
  set('post.abs', '5'); set('post.inc', '1'); set('post.well', '7'); set('status', 'منتهٍ');
  return p;
}

// ── 1) الثوابت المنقولة حرفياً ──
test('المكتبة المنقولة (النماذج، المجالات، الاقتراحات، CSS) تطابق السكربت القديم', () => {
  const h = makeLegacy();
  jsonEq(MODELS, h.L.MODELS); jsonEq(DOM, h.L.DOM); jsonEq(RSUG, h.L.RSUG);
  jsonEq(PSUG, h.L.PSUG); jsonEq(PSUG._, h.L.PSUG._);
  jsonEq(XR, h.L.XR); jsonEq(XS, h.L.XS);
  assert.equal(PRINT_CSS, h.L.CSS);
  assert.equal(Object.keys(MODELS).length, 8);
  assert.equal(Object.keys(DOM).length, 9);
});

// ── 2) اقتراحات الملء السريع ──
test('buildSuggestions يطابق مصفوفة SG القديمة لكل خانة، في كل مجال وبمؤشرات قاعدية وجلسات مختلفة', () => {
  const selToKey = {
    '[data-g$=".text"]': 'goal.text', '[data-g$=".ind"]': 'goal.ind', '[data-g$=".base"]': 'goal.base', '[data-g$=".target"]': 'goal.target', '[data-g$=".due"]': 'goal.due',
    '#s_dur': 'sess.dur', '#s_scale': 'sess.scale', '#s_focus': 'sess.focus', '#s_tech': 'sess.tech', '#s_task': 'sess.task', '#s_resp': 'sess.resp', '#s_next': 'sess.next',
  };
  const keyOf = (sel) => selToKey[sel] || sel.match(/^\[data-k="(.*)"\]$/)[1];
  const states = [];
  for (const domain of ['', ...Object.keys(DOM)]) {
    states.push({ ...blank(NOW), domain });
    states.push({ ...richProgram(), domain });
  }
  states.push({ ...blank(NOW), baseline: { abs: '2', inc: '', well: 5 } });
  states.push({ ...blank(NOW), primary: 'cbt', sessions: [{ scale: '4' }, { scale: '' }, { scale: '6' }] });
  const h = makeLegacy(); h.init();
  assert.equal(h.L.SG.length, 35);
  for (const st of states) {
    h.L.setCur(clone(st));
    const mine = buildSuggestions(clone(st), NOW);
    for (const [sel, fn] of h.L.SG) {
      const key = keyOf(sel);
      assert.ok(mine[key], 'مفتاح مفقود: ' + key);
      jsonEq(mine[key](), fn());
    }
    assert.equal(Object.keys(mine).length, h.L.SG.length);
  }
});

test('applySuggestion يطابق pickSG وaddChip القديمتين (استبدال/إضافة بفاصلة/سطر جديد/بلا تكرار)', () => {
  const h = makeLegacy(); h.init();
  const run = (elProps, value, item) => {
    const el = { value, dispatchEvent() {}, getAttribute: (n) => (n === 'data-g' ? elProps.dataG : null), dataset: elProps.dataset || {}, ...elProps };
    const list = { _items: [item], parentElement: null }; const box = { _el: el }; list.parentElement = box;
    h.L.pickSG({ parentElement: list, dataset: { sgc: '0' } });
    return el.value;
  };
  const cases = [
    [{ tagName: 'SELECT' }, 'old', { t: 'x', v: 'new' }, 'replace'],
    [{ tagName: 'INPUT', type: 'number' }, '3', { t: '5', v: '5' }, 'replace'],
    [{ tagName: 'INPUT', type: 'date' }, '', { t: 'اليوم', v: '2026-10-24' }, 'replace'],
    [{ tagName: 'INPUT', type: 'text', dataG: '0.base', dataset: { g: '0.base' } }, 'a', { t: 'غياب: 8', v: '8' }, 'replace'],
    [{ tagName: 'INPUT', type: 'text', dataG: '1.target', dataset: { g: '1.target' } }, 'a', { t: 'صفر', v: 'صفر' }, 'replace'],
    [{ tagName: 'INPUT', type: 'text' }, '', { t: 'أ', v: 'أ' }, 'one'],
    [{ tagName: 'INPUT', type: 'text' }, 'أ', { t: 'ب', v: 'ب' }, 'one'],
    [{ tagName: 'INPUT', type: 'text' }, 'أ، ب', { t: 'ب', v: 'ب' }, 'one'],
    [{ tagName: 'TEXTAREA', type: 'textarea' }, '', { t: 'أ', v: 'أ' }, 'area'],
    [{ tagName: 'TEXTAREA', type: 'textarea' }, 'أ', { t: 'ب', v: 'ب' }, 'area'],
    [{ tagName: 'TEXTAREA', type: 'textarea' }, 'أ\nب', { t: 'ب', v: 'ب' }, 'area'],
  ];
  for (const [props, value, item, kind] of cases) {
    const legacy = run(props, value, item);
    const mine = applySuggestion(value, item, kind);
    assert.equal(mine == null ? value : mine, legacy, JSON.stringify([props.tagName, props.type, value, item.v]));
  }
  // الشرائح النصية (RSUG/PSUG) تمر بقاعدة addChip نفسها
  const chip = (tag, value, t) => {
    const el = h.el('chipTarget'); el.tagName = tag; el.value = value; el.dataset = { k: tag === 'INPUT' ? 'referral.reason' : 'assess.problem' };
    const holder = { _a: [t], parentElement: null };
    h.L.setCur(blank(NOW));
    h.L.addChip({ parentElement: holder, dataset: { i: '0', chip: 'chipTarget' } });
    return el.value;
  };
  assert.equal(chip('INPUT', 'س', 'ص'), applySuggestion('س', 'ص', 'one'));
  assert.equal(chip('TEXTAREA', 'س', 'ص'), applySuggestion('س', 'ص', 'area'));
  assert.equal(chip('TEXTAREA', 'س ص', 'ص'), 'س ص');
  assert.equal(applySuggestion('س ص', 'ص', 'area'), null);
});

// ── 3) المنحنى والتقرير والمؤشرات ──
test('chartSvg يطابق chart القديمة (أقل من نقطتين، وضع الطباعة، ثلاث نقاط وأكثر، قيم غير رقمية)', () => {
  const h = makeLegacy();
  const sets = [
    [], [{ scale: '3' }], [{ scale: '3' }, { scale: '' }], [{ scale: '3' }, { scale: '9' }],
    [{ scale: '0' }, { scale: '10' }, { scale: '5.5' }, { scale: 'x' }, { scale: null }, { scale: '7' }], richProgram().sessions,
  ];
  for (const S of sets) for (const print of [false, true]) assert.equal(chartSvg(S, print), h.L.chart(S, print), JSON.stringify([S.length, print]));
});

test('reportHtml يطابق report القديمة حرفياً (برنامج غني، برنامج فارغ، مع شعار وبدونه)', () => {
  for (const [prog, profile, logo] of [
    [richProgram(), { institution: 'ثانوية الأمل', fullName: 'سعاد المختصة' }, 'data:image/png;base64,AAA'],
    [richProgram(), { school: 'مدرسة بديلة' }, ''],
    [{ ...blank(NOW), studentName: 'س' }, {}, ''],
    [{ ...blank(NOW), studentName: 'س', institution: undefined }, { institution: '  ', fullName: 'م' }, ''],
  ]) {
    const h = makeLegacy({ profile, logo });
    h.init(); h.L.setCur(clone(prog));
    const legacy = h.L.report();
    const mine = reportHtml(clone(prog), reportContext(profile, logo));
    assert.equal(mine, legacy);
  }
});

test('progressView يطابق progress القديمة نصاً (جلسات، تغيّر، مؤشرات بعدية، فروق)', () => {
  const variants = [
    blank(NOW), richProgram(),
    { ...richProgram(), post: { abs: '0', inc: '', well: '9' }, baseline: {} },
    { ...richProgram(), sessions: [{ scale: '4' }], schedule: {} },
    { ...richProgram(), post: { abs: '12' }, baseline: { abs: '12' } },
    { ...richProgram(), sessions: [{ scale: '9' }, { scale: '2' }] },
  ];
  const h = makeLegacy(); h.init();
  for (const p of variants) {
    h.L.setCur(clone(p)); h.L.progress();
    const legacyText = strip(h.el('iip_progress').innerHTML).replace(/\s+/g, ' ');
    const mineText = progressView(p).map((i) => (i.label ? i.label + i.bold : i.text)).join('').replace(/\s+/g, ' ');
    assert.equal(mineText, legacyText);
  }
});

test('archiveRows يطابق جدول الأرشيف القديم', () => {
  const list = [richProgram(), { ...blank(NOW), id: 'iip_2', studentName: 'ليلى', domain: 'zzz', primary: 'nope' }, { ...blank(NOW), id: 'iip_3', studentName: 'عمر', domain: 'vio', primary: 'tic', level: '2APIC' }];
  const h = makeLegacy(); h.init();
  h.L.setAll(clone(list)); h.L.archive();
  const html = h.el('iip_arch').innerHTML;
  const cells = [...html.matchAll(/<tr><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td>/g)].map((m) => m.slice(1, 7));
  const mine = archiveRows(list).map((r) => [r.name, r.level, r.domain, r.primary, String(r.sessions), r.status]);
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  assert.deepEqual(mine.map((r) => r.map((c) => esc(c))), cells);
  h.L.setAll([]); h.L.archive();
  assert.match(h.el('iip_arch').innerHTML, /لا توجد برامج محفوظة/);
});

test('مستند الطباعة يطابق ما يكتبه iipPrint القديم في الإطار', () => {
  const h = makeLegacy(); h.init();
  h.L.iipPrint('<div>تقرير</div>');
  assert.equal(h.state.written.length, 1);
  assert.equal(buildPrintDocument('<div>تقرير</div>'), h.state.written[0]);
});

// ── 4) سيناريو كامل عبر أحداث الواجهة القديمة ثم المقارنة بالمخرجات ──
test('سيناريو كامل: ما يحفظه القديم بعد الأحداث = ما تنتجه دوال المنطق الجديدة بالعمليات نفسها', () => {
  const h = makeLegacy(); h.init(); h.flush();
  const ISO = NOW.toISOString();
  // ── القديم ──
  h.el('iip_name').value = 'سلمى الإدريسي'; h.el('iip_massar').value = 'R9'; h.el('iip_level').value = '2APIC-1';
  h.fire('input', target({ dataset: { k: 'studentName' }, value: 'سلمى الإدريسي' }));
  h.fire('input', target({ dataset: { k: 'massar' }, value: 'R9' }));
  h.fire('input', target({ dataset: { k: 'level' }, value: '2APIC-1' }));
  typeK(h, 'referral.source', 'الأستاذ(ة)'); typeK(h, 'consent.parent', true, 'checkbox');
  h.fire('change', target({ dataset: { actChange: 'domain' }, tagName: 'SELECT', value: 'beh' }));
  typeK(h, 'assess.problem', 'سلوك مزعج'); typeK(h, 'baseline.abs', '5', 'number');
  click(h, 'pick', { m: 'cico' }); click(h, 'pick', { m: 'cbt' }); click(h, 'pick', { m: 'tcp' });
  assert.equal(h.el('iip_msg').textContent, MSG.MAX_MODELS);
  click(h, 'primary', { m: 'cbt' }); click(h, 'pick', { m: 'cico' });
  click(h, 'addgoal'); click(h, 'addgoal'); typeG(h, '0.text', 'هدف 1'); typeG(h, '1.text', 'هدف 2'); typeG(h, '1.done', 'تحقق');
  click(h, 'delgoal', { i: '0' });
  click(h, 'autoplan');
  h.el('s_date').value = ''; h.el('s_dur').value = ''; h.el('s_scale').value = '4'; h.el('s_focus').value = 'محور'; h.el('s_tech').value = ''; h.el('s_task').value = ''; h.el('s_resp').value = ''; h.el('s_next').value = '';
  click(h, 'addsess');
  h.el('s_scale').value = '7'; h.el('s_focus').value = ''; h.el('s_resp').value = 'ملاحظة'; click(h, 'addsess');
  h.el('s_focus').value = ''; h.el('s_resp').value = ''; click(h, 'addsess');
  assert.equal(h.el('iip_msg').textContent, MSG.SESSION_NEEDED);
  click(h, 'delsess', { i: '0' });
  click(h, 'save');
  assert.equal(h.el('iip_msg').textContent, MSG.SAVED);
  const legacySaved = h.stored();

  // ── الجديد ──
  let c = blank(NOW);
  c = { ...c, studentName: 'سلمى الإدريسي', massar: 'R9', level: '2APIC-1' };
  c = setPath(c, 'referral.source', 'الأستاذ(ة)'); c = setPath(c, 'consent.parent', true);
  c = { ...c, domain: 'beh' }; c = setPath(c, 'assess.problem', 'سلوك مزعج'); c = setPath(c, 'baseline.abs', '5');
  for (const k of ['cico', 'cbt', 'tcp']) { const r = pickModel(c, k); if (r.cur) c = r.cur; else assert.equal(r.error, MSG.MAX_MODELS); }
  c = setPrimary(c, 'cbt'); c = pickModel(c, 'cico').cur;
  c = addGoal(addGoal(c)); c = setGoalField(c, 0, 'text', 'هدف 1'); c = setGoalField(c, 1, 'text', 'هدف 2'); c = setGoalField(c, 1, 'done', 'تحقق');
  c = delGoal(c, 0);
  c = autoplan(c).cur;
  const today = todayStr(NOW);
  const blankDraft = { date: '', dur: '', scale: '4', focus: 'محور', tech: '', task: '', resp: '', next: '' };
  c = addSession(c, blankDraft, today).cur;
  c = addSession(c, { ...blankDraft, scale: '7', focus: '', resp: 'ملاحظة' }, today).cur;
  assert.equal(addSession(c, { ...blankDraft, focus: '', resp: '' }, today).error, MSG.SESSION_NEEDED);
  c = delSession(c, 0);
  const r = upsert([], c, ISO);
  jsonEq(r.all, legacySaved);
  // التقرير المبني من البرنامج المحفوظ مطابق أيضاً
  h.L.setCur(clone(legacySaved[0]));
  assert.equal(reportHtml(clone(legacySaved[0]), reportContext({ institution: 'ثانوية الأمل', fullName: 'سعاد المختصة' }, '')), h.L.report());
});

test('autoplan: أول عدد جلسات من نطاق «a إلى b» يوضع في الجدولة إن كانت فارغة، ولا يُستبدل إن وُجد', () => {
  for (const k of Object.keys(MODELS)) {
    const h = makeLegacy(); h.init();
    for (const pre of [{}, { total: 3 }]) {
      const p = { ...blank(NOW), primary: k, models: [k], schedule: { ...pre } };
      h.L.setCur(clone(p)); click(h, 'autoplan');
      const legacy = h.L.getCur();
      const mine = autoplan(clone(p)).cur;
      jsonEq(mine, legacy);
    }
  }
  assert.equal(autoplan(blank(NOW)).error, MSG.PICK_MODEL);
});

test('البرنامج المكرر: القديم يسأل عند وجود برنامج نشط لنفس التلميذ، والجديد يجد المرشح نفسه ويستعمل النص نفسه', () => {
  const existing = { ...blank(NOW), id: 'iip_old', studentName: 'نور', massar: 'R7', status: 'نشط', sessions: [] };
  const done = { ...blank(NOW), id: 'iip_done', studentName: 'ياسين', massar: 'R8', status: 'منتهٍ' };
  const h = makeLegacy({ stored: [existing, done] }); h.init();
  h.el('iip_name').value = 'نور'; h.el('iip_massar').value = ''; h.el('iip_level').value = '';
  h.fire('input', target({ dataset: { k: 'studentName' }, value: 'نور' })); h.flush();
  assert.deepEqual(h.state.confirms, [CONFIRM.OPEN_EXISTING]);
  assert.equal(h.L.getCur().id, 'iip_old');
  const mine = { ...blank(NOW), id: 'iip_new', studentName: 'نور' };
  assert.equal(findActiveDuplicate([existing, done], mine).id, 'iip_old');
  assert.equal(findActiveDuplicate([existing, done], { ...mine, studentName: 'ياسين', massar: 'R8' }), undefined);
  assert.equal(findActiveDuplicate([existing, done], { ...existing }), undefined);
  assert.equal(dupKey({ massar: ' R7 ', studentName: 'x' }), 'R7');
  assert.equal(dupKey({ massar: '', studentName: ' نور ' }), 'نور');
});

test('الحفظ: اسم فارغ يُرفض، والتخزين يستعمل مفتاح app:iip: واسم المستخدم، وفشل التخزين يُكتشف', () => {
  const h = makeLegacy(); h.init();
  click(h, 'save');
  assert.equal(h.el('iip_msg').textContent, MSG.NAME_FIRST);
  assert.equal(canSave({ studentName: '   ' }), false);
  assert.equal(canSave({ studentName: 'س' }), true);
  assert.equal(storageKey(USER), 'app:iip:' + USER);
  assert.equal(storageKey(null), 'app:iip:');
  const mem = new Map();
  const ok = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.equal(storeAll(ok, USER, [{ id: 1 }]), true);
  assert.deepEqual(loadAll(ok, USER), [{ id: 1 }]);
  assert.deepEqual(loadAll(ok, 'غيره'), []);
  assert.deepEqual(loadAll({ getItem: () => '{bad' }, USER), []);
  assert.deepEqual(loadAll({ getItem: () => '{"a":1}' }, USER), []);
  assert.equal(storeAll({ setItem() { throw new Error('quota'); } }, USER, []), false);
  assert.deepEqual(loadAll(null, USER), []);
});

test('upsert: برنامج جديد يوضع أولاً، وتعديله يستبدل نسخته في موضعها، ولا يُمَسّ الأصل', () => {
  const a = { ...blank(NOW), id: 'iip_a', studentName: 'أ' }; const b = { ...blank(NOW), id: 'iip_b', studentName: 'ب' };
  let r = upsert([a], b, 'T1');
  assert.deepEqual(r.all.map((x) => x.id), ['iip_b', 'iip_a']);
  assert.equal(r.cur.updated, 'T1'); assert.equal(b.updated, undefined);
  r = upsert(r.all, { ...a, studentName: 'أ2' }, 'T2');
  assert.deepEqual(r.all.map((x) => [x.id, x.studentName]), [['iip_b', 'ب'], ['iip_a', 'أ2']]);
});

test('setPath لا يغيّر الأصل وينشئ الفروع الناقصة؛ وwordFileName وreportContext كما كانتا', () => {
  const p = blank(NOW);
  const q = setPath(p, 'assess.risks', 'x');
  assert.equal(p.assess.risks, undefined); assert.equal(q.assess.risks, 'x');
  assert.equal(setPath({}, 'a.b.c', 1).a.b.c, 1);
  assert.equal(wordFileName('سلمى  الإدريسي'), 'برنامج_تدخلي_فردي_سلمى_الإدريسي');
  assert.deepEqual(reportContext({}, ''), { school: 'المؤسسة التعليمية', spec: '', logo: '' });
  assert.deepEqual(reportContext({ institution: ' ثانوية ', fullName: 'م' }, 'L'), { school: 'ثانوية', spec: 'م', logo: 'L' });
  assert.deepEqual(reportContext(null, null), { school: 'المؤسسة التعليمية', spec: '', logo: '' });
});

test('زر Word القديم يستدعي exportToWord بالمعرّف والاسم نفسيهما', () => {
  const h = makeLegacy(); h.init();
  h.L.setCur({ ...richProgram(), studentName: 'سلمى  الإدريسي' });
  h.el('iip_name').value = 'سلمى  الإدريسي'; // sync القديمة تقرأ الحقل من الصفحة قبل الحفظ
  click(h, 'word');
  assert.deepEqual(h.state.words, [['iipReportContent', wordFileName('سلمى  الإدريسي')]]);
});
