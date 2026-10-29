// اختبار مطابقة «رصد السلوك»: نشغّل كتلة script-18.js القديمة (النسخة المجمَّدة للمرحلة 18) في بيئة معزولة
// ونقارن نتائجها بدوال src/behavior/behaviorLogic.js على البيانات نفسها (عشوائية بذرة ثابتة).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as B from '../src/behavior/behaviorLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/behavior.step18.js', import.meta.url), 'utf8');
const NOW = new Date(2026, 9, 24, 10, 0);
const J = (v) => JSON.parse(JSON.stringify(v));

function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }

// ── بيئة القديم ──
function runLegacy({ files = [], students = [], profile = null, inst = '', logo = '' } = {}) {
  const els = {};
  const el = (id) => (els[id] ??= { id, value: '', innerHTML: '', textContent: '', style: {} });
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } }
  const alerts = [];
  const appData = { behaviorFiles: files };
  const ctx = vm.createContext({
    window: {}, console, Date: FixedDate, alert: (m) => alerts.push(m), confirm: () => true,
    appData, STUDENT_DB: students, userProfile: profile, MINISTRY_LOGO_B64: logo,
    getInstitutionName: () => inst, cleanClassValue: (v) => String(v || '').trim(),
    vigEsc: (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    saveUserKey: async () => true,
    document: { getElementById: el, querySelector: () => null, querySelectorAll: () => [] },
  });
  vm.runInContext(legacySrc, ctx);
  const run = (code) => vm.runInContext(code, ctx);
  return { ctx, els, el, run, alerts, appData };
}

// ── مولّد بيانات ──
const NAMES = ['أحمد بنعلي', 'فاطمة الزهراء', 'يوسف المرابط', 'سارة', 'محمد أمين', 'إيمان <b>'];
const BEHS = [...B.BM_CON.map((x) => x[0]), 'اعتداء جسدي على زميل', 'سلوك مخصص'];
const POS = B.BM_POS;
const pad = (n) => String(n).padStart(2, '0');
function dayOffset(n) { const d = new Date(NOW.getTime()); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function makeFile(r, i) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  const dense = r() < 0.5; // نصف الملفات كثيفة الملاحظات في آخر أسبوعين لبلوغ عتبات التنبيه (3 و5 و8 …)
  const nobs = dense ? 6 + Math.floor(r() * 30) : Math.floor(r() * 18);
  const obs = Array.from({ length: nobs }, (_, k) => {
    const kind = r() < 0.7 ? 'con' : 'pos';
    const beh = kind === 'con' ? pick(BEHS) : pick(POS);
    const known = B.BM_CON.find((x) => x[0] === beh);
    return { id: 1760000000000 + i * 1000 + k, date: dayOffset(dense ? Math.floor(r() * 14) - 1 : Math.floor(r() * 24) - 3), kind, beh, portal: kind === 'con' ? (known ? known[1] : 'interview') : '', place: pick(['', 'الساحة', 'القسم']), sev: 1 + Math.floor(r() * 3), by: pick(['', 'الحراسة']), ctx: pick(['', 'أثناء الاستراحة & <x>']), src: pick(['grid', 'grid', undefined]) };
  });
  const dims = (n) => { const o = {}; B.BM_EV_DIMS.slice(0, n).forEach((d) => { if (r() < 0.8) o[d.k] = { lv: pick(['0', '1', '2', '']), items: r() < 0.5 ? [d.items[0]] : [], note: pick(['', 'ملاحظة']) }; }); return o; };
  const evals = r() < 0.5 ? Array.from({ length: 1 + Math.floor(r() * 2) }, (_, k) => ({ id: k, date: dayOffset(Math.floor(r() * 10)), dims: dims(6), note: pick(['', 'عام']) })) : undefined;
  const f = {
    id: 1760000000000 + i, studentName: pick(NAMES) + ' ' + i, massar: pick(['—', 'M' + i, 'G12345' + i]), school: 'إعدادية', level: pick(['—', '1APIC-1', '2APIC-3']),
    tier: pick(['2', '3', '2+3']), reason: pick(['', 'اعتداء على زميل', 'وصف عادي']), strengths: '', addedAt: dayOffset(20), status: pick(['متابعة', 'متابعة', 'أُغلق']),
    obs, gridRows: r() < 0.5 ? [{ beh: pick(BEHS), kind: 'con' }, { beh: pick(POS), kind: 'pos' }] : [],
    plan: r() < 0.5 ? null : { goal: pick(['', 'هدف']), goals: ['a', '', 'c'], review: pick(['', dayOffset(3), dayOffset(-5), B.bmIso(NOW)]), strategies: 'س1\nس2', resp: 'ر', result: pick(['', 'نتيجة']) },
  };
  if (evals) f.evals = evals;
  return f;
}
const makeFiles = (seed, n = 6) => { const r = rngOf(seed); return Array.from({ length: n }, (_, i) => makeFile(r, i)); };

// ── الثوابت ──
test('الثوابت (المجالات والاستراتيجيات والأهداف والتقييم) مطابقة للقديم', () => {
  const { run } = runLegacy();
  for (const k of ['BM_CON', 'BM_POS', 'BM_PORTALS', 'BM_STRAT', 'BM_STRAT_DEF', 'BM_DAYS', 'BM_EV_DIMS', 'BM_EV_LV', 'BM_TIER_ACTIONS', 'BM_GOALS_SUG', 'BM_GOALS_DEF']) {
    assert.deepEqual(J(B[k]), JSON.parse(run('JSON.stringify(' + k + ')')), k);
  }
  assert.equal(B.BM_KEY, run('BM_KEY'));
});

// ── التواريخ ──
test('دوال الأسبوع والتواريخ مطابقة للقديم', () => {
  const { ctx, run } = runLegacy();
  for (const iso of ['2026-10-24', '2026-10-19', '2026-12-31', '2027-01-01', '2026-02-28', '2024-02-29']) {
    assert.equal(B.bmMonday(iso, NOW), ctx.bmMonday(iso), 'monday ' + iso);
    assert.equal(B.bmAddDays(iso, 7), ctx.bmAddDays(iso, 7));
    assert.equal(B.bmAddDays(iso, -45), ctx.bmAddDays(iso, -45));
    assert.deepEqual(B.bmWeekDates(iso), J(ctx.bmWeekDates(iso)));
    assert.equal(B.bmFmt(iso), ctx.bmFmt(iso));
  }
  assert.equal(B.bmMonday(null, NOW), ctx.bmMonday());
  assert.equal(B.bmAgo(6, NOW), ctx.bmAgo(6));
  assert.equal(B.bmAgo(13, NOW), ctx.bmAgo(13));
  assert.equal(B.bmIso(NOW), ctx.bmIso(new ctx.Date()));
  for (const n of [0, 1, 4, 5, 6, 7, 12]) assert.equal(B.bmMarks(n), ctx.bmMarks(n));
  for (const v of ['ab - c', 'A_B–C', '', null, undefined, ' x ']) assert.equal(B.bmNz(v), ctx.bmNz(v));
  for (const t of ['2', '3', '2+3']) assert.equal(B.bmTierLbl(t), ctx.bmTierLbl(t));
  void run;
});

// ── الإحصاء والتنبيهات ──
test('bmStats: نفس الملاحظات والتنبيهات والإحالات على 300 ملف عشوائي', () => {
  const { ctx } = runLegacy();
  for (let seed = 1; seed <= 50; seed++) {
    for (const f of makeFiles(seed)) {
      const a = J(B.bmStats(f, NOW)), b = J(ctx.bmStats(f));
      assert.deepEqual(a, b, 'seed ' + seed + ' ' + f.studentName);
    }
  }
});

test('bmTierAdvice: نفس المستوى والأسباب مع بيانات ومن دونها', () => {
  const { ctx } = runLegacy();
  for (let seed = 1; seed <= 50; seed++) {
    for (const f of makeFiles(seed)) {
      for (const reason of ['', 'اعتداء بالضرب', 'وصف عادي']) {
        assert.deepEqual(J(B.bmTierAdvice(f, reason, NOW)), J(ctx.bmTierAdvice(f, reason)), 'seed ' + seed);
      }
    }
  }
  assert.deepEqual(J(B.bmTierAdvice(null, 'تهديد', NOW)), J(ctx.bmTierAdvice(null, 'تهديد')));
  assert.deepEqual(J(B.bmTierAdvice(null, '', NOW)), J(ctx.bmTierAdvice(null, '')));
});

// ── الجدول الأسبوعي ──
test('bmGridRows / bmCellCount / bmWeekCount / bmGoals مطابقة', () => {
  const { ctx } = runLegacy();
  for (let seed = 1; seed <= 40; seed++) {
    for (const f of makeFiles(seed)) {
      for (const w of [B.bmMonday(null, NOW), B.bmAddDays(B.bmMonday(null, NOW), -7), B.bmAddDays(B.bmMonday(null, NOW), 7)]) {
        const rows = B.bmGridRows(f, w);
        assert.deepEqual(rows, J(ctx.bmGridRows(f, w)));
        assert.equal(B.bmWeekCount(f, w), ctx.bmWeekCount(f, w));
        assert.equal(B.bmWeekCount(f, w, 'con'), ctx.bmWeekCount(f, w, 'con'));
        assert.equal(B.bmWeekCount(f, w, 'pos'), ctx.bmWeekCount(f, w, 'pos'));
        for (const r of rows) for (const d of B.bmWeekDates(w)) assert.equal(B.bmCellCount(f, d, r), ctx.bmCellCount(f, d, r));
      }
      assert.deepEqual(B.bmGoals(f), J(ctx.bmGoals(f)));
    }
  }
  assert.equal(B.bmWeekCount && B.bmGridRows(null, '2026-10-19').length, ctx.bmGridRows(null, '2026-10-19').length);
  assert.deepEqual(B.bmGoals(null), J(ctx.bmGoals(null)));
});

test('اقتراحات الجدول (bmGridSug) مطابقة: القائمة والعنوان', () => {
  for (let seed = 1; seed <= 40; seed++) {
    for (const f of makeFiles(seed, 4)) {
      const L = runLegacy({ files: [{ ...f, status: 'متابعة' }] });
      const fa = { ...f, status: 'متابعة' };
      L.el('bm_name').value = fa.studentName; L.el('bm_massar').value = '';
      L.el('bmGridSug');
      L.run("_bmWeek = '2026-10-19'");
      L.run('bmGridSug()');
      const mine = B.bmGridSuggest(fa, '2026-10-19');
      const legacyList = L.ctx.window._bmGridSugList;
      if (!mine) { assert.equal(L.els.bmGridSug.innerHTML, '', 'seed ' + seed); continue; }
      assert.deepEqual(mine.list, J(legacyList));
      assert.ok(L.els.bmGridSug.innerHTML.includes(mine.title));
    }
  }
  // ملف غير موجود (f = null): القديم يعرض الاقتراحات الشائعة
  const L = runLegacy({ files: [] }); L.el('bmGridSug'); L.run("_bmWeek = '2026-10-19'"); L.run('bmGridSug()');
  const mine = B.bmGridSuggest(null, '2026-10-19');
  assert.deepEqual(mine.list, J(L.ctx.window._bmGridSugList));
});

// ── الأهداف والاستراتيجيات ──
test('اقتراح الأهداف والاستراتيجيات مطابق للقديم', () => {
  for (let seed = 1; seed <= 40; seed++) {
    for (const f of makeFiles(seed, 4)) {
      const fa = { ...f, status: 'متابعة' };
      const L = runLegacy({ files: [fa] });
      L.el('bm_name').value = fa.studentName; L.el('bm_massar').value = '';
      L.el('bm_pl_goal_sug'); L.el('bm_pl_sug');
      L.run('bmGoalSug(); bmStratSug();');
      assert.deepEqual(B.bmGoalSuggest(fa, NOW), J(L.ctx.window._bmGoalList), 'goals seed ' + seed);
      const st = B.bmStratSuggest(fa);
      assert.deepEqual(st.list, J(L.ctx.window._bmSug), 'strat seed ' + seed);
      assert.equal(L.els.bm_pl_sug.innerHTML.includes('حسب أكثر السلوكيات تسجيلًا'), st.tops.length > 0);
    }
  }
  const L = runLegacy({ files: [] }); L.el('bm_name'); L.el('bm_massar'); L.el('bm_pl_goal_sug'); L.el('bm_pl_sug'); L.run('bmGoalSug(); bmStratSug();');
  assert.deepEqual(B.bmGoalSuggest(null, NOW), J(L.ctx.window._bmGoalList));
  assert.deepEqual(B.bmStratSuggest(null).list, J(L.ctx.window._bmSug));
});

test('bmAppendStrategy يطابق bmAddStrat القديمة (سطر جديد بلا تكرار)', () => {
  for (const [text, s] of [['', 'أ'], ['أ', 'ب'], ['أ\nب', 'ب'], ['  أ  ', 'أ'], ['أ\n', 'ج']]) {
    const L = runLegacy();
    L.el('bm_pl_strat').value = text; L.ctx.window._bmSug = [s];
    L.run('bmAddStrat(0)');
    assert.equal(B.bmAppendStrategy(text, s), L.els.bm_pl_strat.value, JSON.stringify([text, s]));
  }
});

test('بطاقة اقتراح المستوى (bmTierSug) مطابقة: المستوى والأسباب والإجراءات وحالة «المعتمد»', () => {
  for (let seed = 1; seed <= 30; seed++) {
    for (const f of makeFiles(seed, 4)) {
      const fa = { ...f, status: 'متابعة' };
      for (const reason of ['', 'ضرب']) {
        const L = runLegacy({ files: [fa] });
        L.el('bm_name').value = fa.studentName; L.el('bm_massar').value = ''; L.el('bm_reason').value = reason;
        L.el('bm_tier_sug'); L.el('bm_pl_tier_sug');
        L.run('bmTierSug()');
        const mine = B.bmTierSuggest(fa, reason, fa.tier, NOW);
        const html = L.els.bm_tier_sug.innerHTML;
        assert.ok(html.includes(mine.name), 'name');
        mine.why.forEach((w) => assert.ok(html.includes(B.bmEsc(w))));
        mine.actions.forEach((a) => assert.ok(html.includes(B.bmEsc(a))));
        assert.equal(html.includes('✔'), mine.same);
        assert.equal(html.includes('ضمن المستويين المعتمدين'), mine.same && mine.multi);
      }
    }
  }
});

test('bmApplyTierTo يطابق bmApplyTier القديمة', () => {
  for (const cur of ['2', '3', '2+3']) for (const t of ['2', '3']) for (const add of [false, true]) {
    const L = runLegacy({ files: [{ id: 1, studentName: 'س', massar: 'M', tier: cur, status: 'متابعة', obs: [] }] });
    L.el('bm_name').value = 'س'; L.el('bm_massar').value = 'M';
    L.run('bmTierSet = function(t){ window.__t = t; }; bmRender = function(){}; bmBadge = function(){}; bmTierSug = function(){};');
    L.run('bmApplyTier("' + t + '", ' + add + ')');
    assert.equal(B.bmApplyTierTo(cur, t, add), L.ctx.window.__t, cur + ' ' + t + ' ' + add);
  }
});

// ── التقييم السريع والتقارير ──
test('أجزاء التقرير (التقييم السريع والجدول الأسبوعي) نصياً مطابقة', () => {
  const { ctx } = runLegacy();
  for (let seed = 1; seed <= 40; seed++) {
    for (const f of makeFiles(seed)) {
      assert.equal(B.bmEvListHtml(f), ctx.bmEvListHtml(f));
      assert.equal(B.bmEvReportHtml(f), ctx.bmEvReportHtml(f));
      for (const w of ['2026-10-19', '2026-10-12']) assert.equal(B.bmGridReportHtml(f, w), ctx.bmGridReportHtml(f, w));
      const a = B.bmEvLatest(f), b = ctx.bmEvLatest(f);
      assert.deepEqual(J(a), J(b));
      for (const lv of ['0', '1', '2', '', 'x']) assert.equal(B.bmEvLvName(lv), ctx.bmEvLvName(lv));
    }
  }
});

test('bmBuildReport: التقرير الكامل (طباعة/Word) مطابق حرفياً للقديم مع شعار وبدونه ومع أسبوع محدد', () => {
  for (let seed = 1; seed <= 25; seed++) {
    const files = makeFiles(seed);
    for (const [profile, inst, logo] of [[{ school: 'ثانوية الأمل', fullName: 'نورة' }, '', 'data:image/png;base64,AAA'], [null, 'مؤسسة بديلة', ''], [{ fullName: '' }, '', '']]) {
      const L = runLegacy({ files, profile, inst, logo });
      const week = seed % 2 ? '2026-10-19' : '2026-10-05';
      L.run("_bmWeek = '" + week + "'");
      const school = ((profile && profile.school) || inst || '').trim();
      const ctx = { school, spec: profile && profile.fullName ? profile.fullName : '', logo, week, now: NOW };
      assert.equal(B.bmBuildReport(files, undefined, ctx), L.ctx.bmBuildReport(), 'كل الملفات النشطة seed ' + seed);
      const one = files[seed % files.length];
      assert.equal(B.bmBuildReport(files, one.id, ctx), L.ctx.bmBuildReport(one.id), 'ملف واحد seed ' + seed);
    }
  }
  assert.equal(B.bmBuildReport([], undefined, { now: NOW }), '');
  assert.equal(B.bmBuildReport([{ id: 1, status: 'أُغلق', obs: [] }], undefined, { now: NOW }), '');
});

test('التقرير بلا أسبوع محدد يستعمل أسبوع اليوم كالقديم', () => {
  const files = makeFiles(7);
  const L = runLegacy({ files });
  assert.equal(B.bmBuildReport(files, undefined, { now: NOW }), L.ctx.bmBuildReport());
});

// ── التلميذ والملف الحالي ──
test('البحث عن التلميذ في اللائحة وعن ملف المتابعة مطابق للقديم', () => {
  const r = rngOf(99);
  const students = Array.from({ length: 12 }, (_, i) => ({ fullName: ['محمد أمين', 'أمينة بنعلي', 'يوسف', 'فاطمة الزهراء'][i % 4] + (i < 4 ? '' : ' ' + i), massar: 'G' + (100 + i), class: i % 2 ? '1APIC-1' : '2APIC-3' }));
  students.push({ fullName: 'محمد أمين', massar: 'G999', class: '1APIC-1' }); // اسم مكرر بمسار مختلف
  const files = makeFiles(5, 6);
  const L = runLegacy({ files, students });
  const queries = [['', ''], ['محمد أمين', ''], ['محمد أمين', 'G100'], ['محمد أمين', 'G999'], ['', 'G101'], ['امين محمد', ''], ['أمينة بنعلي', 'G101'], ['غير موجود', ''], ['', 'G000'], ['يوسف', 'G102']];
  files.forEach((f) => queries.push([f.studentName, ''], [f.studentName.toUpperCase(), f.massar], ['', f.massar]));
  for (const [name, massar] of queries) {
    L.el('bm_name').value = name; L.el('bm_massar').value = massar;
    assert.deepEqual(J(B.bmFindStudentIn(students, massar, name)), J(L.ctx.bmFindStudent()), JSON.stringify([name, massar]));
    assert.deepEqual(J(B.bmFindCurFile(files, name, massar)), J(L.ctx.bmFindCur()), JSON.stringify([name, massar]));
  }
  assert.equal(B.bmFindStudentIn([], 'x', 'y'), null);
  void r;
});

// ── قائمة المتابعة ──
test('bmListRows: العدّاد والترتيب والتصفية والاتجاه والعلامات الأسبوعية كما في bmRender القديمة', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const files = makeFiles(seed, 7);
    for (const q of ['', 'أحمد', 'غير']) {
      const L = runLegacy({ files });
      L.el('bmSearch').value = q; L.el('bmCount'); L.el('bmList');
      L.run('bmRender()');
      const mine = B.bmListRows(files, q, NOW);
      assert.equal(mine.activeCount, L.els.bmCount.textContent);
      const html = L.els.bmList.innerHTML;
      if (!mine.items.length) { assert.ok(html.includes('لا يوجد تلاميذ في قائمة المتابعة بعد')); continue; }
      // ترتيب البطاقات في الـ HTML = ترتيب items (النشطة أولاً ثم المغلقة)
      let last = -1;
      mine.items.forEach((it) => {
        const pos = html.indexOf('bmOpen(' + it.file.id + ')');
        assert.ok(pos > last, 'ترتيب ' + it.file.studentName);
        last = pos;
        assert.equal(it.closed, it.file.status === 'أُغلق');
        assert.equal(it.trend, it.stats.cc.length - it.stats.pc.length);
        assert.ok(html.includes('<strong>' + it.stats.cc.length + '</strong>'));
        assert.equal(it.recent.length, Math.min(4, it.file.obs.length));
      });
    }
  }
});

// ── عمليات الكتابة (لا تغيّر الأصل) ──
test('bmAddMark / bmRemoveMark: العلامة من الجدول تُضاف وتُحذف آخرها فقط، والأصل لا يُمَسّ', () => {
  const f = { id: 1, obs: [{ id: 1, date: '2026-10-19', kind: 'con', beh: 'عراك أو دفع زميل', src: 'grid' }, { id: 2, date: '2026-10-19', kind: 'con', beh: 'عراك أو دفع زميل', src: 'grid' }, { id: 3, date: '2026-10-19', kind: 'con', beh: 'عراك أو دفع زميل' }], gridRows: [] };
  const snapshot = JSON.stringify(f);
  const row = { kind: 'con', beh: 'عراك أو دفع زميل' };
  const added = B.bmAddMark(f, row, '2026-10-20', 77);
  assert.equal(JSON.stringify(f), snapshot);
  assert.deepEqual(added.obs.at(-1), { id: 77, date: '2026-10-20', kind: 'con', beh: 'عراك أو دفع زميل', portal: 'violence', place: '', sev: 1, by: '', ctx: '', src: 'grid' });
  assert.equal(B.bmAddMark(f, { kind: 'pos', beh: 'مساعدة زميل' }, '2026-10-20', 1).obs.at(-1).portal, '');
  assert.equal(B.bmAddMark(f, { kind: 'con', beh: 'سلوك غير معروف' }, '2026-10-20', 1).obs.at(-1).portal, 'interview');
  const removed = B.bmRemoveMark(f, row, '2026-10-19');
  assert.deepEqual(removed.obs.map((o) => o.id), [1, 3]); // حُذفت آخر علامة من الجدول (id 2) وبقيت القديمة بلا src
  assert.equal(B.bmRemoveMark(f, row, '2026-10-25'), null);
  assert.equal(B.bmRemoveMark({ ...f, obs: [f.obs[2]] }, row, '2026-10-19'), null); // ملاحظة قديمة ليست من الجدول
});

test('bmPushRowTo / bmDelRowFrom / bmEvUpsert / bmNewFile', () => {
  const f = { id: 1, obs: [], gridRows: [{ beh: 'أ', kind: 'con' }] };
  assert.equal(B.bmPushRowTo(f, 'con', 'أ', '2026-10-19').dup, true);
  const p = B.bmPushRowTo(f, 'pos', 'أ', '2026-10-19');
  assert.equal(p.dup, false);
  assert.deepEqual(p.file.gridRows, [{ beh: 'أ', kind: 'con' }, { beh: 'أ', kind: 'pos' }]);
  assert.deepEqual(f.gridRows, [{ beh: 'أ', kind: 'con' }]);
  assert.deepEqual(B.bmDelRowFrom(p.file, { kind: 'con', beh: 'أ' }).gridRows, [{ beh: 'أ', kind: 'pos' }]);
  const e1 = B.bmEvUpsert({ id: 1, obs: [] }, '2026-10-20', { psy: { lv: '1', items: [], note: '' } }, 'ع', 5);
  const e2 = B.bmEvUpsert(e1, '2026-10-20', { psy: { lv: '2', items: [], note: '' } }, 'ع2', 6);
  assert.equal(e2.evals.length, 1); assert.equal(e2.evals[0].dims.psy.lv, '2'); assert.equal(e1.evals[0].dims.psy.lv, '1');
  const nf = B.bmNewFile({ name: 'س', massar: '', level: '', tier: '', school: 'م' }, NOW, 5);
  assert.deepEqual(nf, { id: 5, studentName: 'س', massar: '—', school: 'م', level: '—', tier: '2', reason: '', strengths: '', addedAt: B.bmIso(NOW), status: 'متابعة', obs: [], gridRows: [], plan: null });
});

test('ملخص التقييم السريع يطابق bmEvSum القديمة', () => {
  for (const levels of [{}, { psy: '0' }, { psy: '0', phy: '1', hea: '2' }, { psy: '2', phy: '2', hea: '2', beh: '2', ver: '2', edu: '2' }]) {
    for (const saved of [false, true]) {
      const L = runLegacy({ files: [] });
      L.el('bmEvSum'); L.el('bm_ev_date').value = '2026-10-20'; L.el('bm_name').value = 'س'; L.el('bm_massar').value = '';
      L.run('bmRadio = function(n){ return (' + JSON.stringify(levels) + ')[n.replace("bm_ev_","")] || ""; };');
      if (saved) L.ctx.appData.behaviorFiles = [{ id: 1, studentName: 'س', massar: '', status: 'متابعة', obs: [], evals: [{ date: '2026-10-20', dims: {} }] }];
      L.run('bmEvSum()');
      assert.equal(B.bmEvSummaryText(B.bmEvCounts(levels), saved), L.els.bmEvSum.textContent, JSON.stringify([levels, saved]));
    }
  }
});
