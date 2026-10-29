// اختبار مطابقة بوابة «سجل المهام»: نشغّل النسخة القديمة المجمَّدة (tests/fixtures/tl.step11.js) في vm مع DOM وهمي،
// ونقارن بما تنتجه دوال src/tasklog/tasklogLogic.js على البيانات نفسها: القائمة والإحصاء، الإضافة، التعديل والحذف،
// الاختصارات الزمنية، والتقرير الأسبوعي (نصاً حرفياً). ثم نقارن ثوابت القوائم والاقتراحات بالقالب القديم المجمَّد.
// لا يغطي رسم JSX نفسه (اختُبر في متصفح حقيقي بشكل منفصل — انظر تقرير المرحلة 12).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  TL_TYPES, TYPE_ICONS, RESULTS, NATURE_SUGGESTIONS, NOTE_SUGGESTIONS, EMPTY_LIST_TEXT, EMPTY_REPORT_ALERT, ADD_ALERT, EMPTY_FILTER, DAY_NAMES,
  validateForm, makeTask, addTask, editTask, deleteTask, filterTasks, weekRange, monthRange, statsOf, groupByDate, buildReport, appendText,
} from '../src/tasklog/tasklogLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/tl.step11.js', import.meta.url), 'utf8');
const liveS15 = fs.readFileSync(new URL('./fixtures/legacy.script-15.step46.js', import.meta.url), 'utf8');
const oldTemplate = fs.readFileSync(new URL('./fixtures/tl.template.step11.html', import.meta.url), 'utf8');

const NOW0 = new Date(2026, 9, 23, 14, 30);

function rngOf(seed) {
  let x = seed;
  return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
}

// ── بيئة الكود القديم ──
function makeLegacy({ tasks = [], interviews = [], now = NOW0, source = legacySrc }) {
  const elements = new Map();
  const mk = (id) => {
    const classes = new Set();
    return { id, value: '', innerHTML: '', textContent: '', classes, classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c), toggle: (c) => (classes.has(c) ? (classes.delete(c), false) : (classes.add(c), true)) } };
  };
  const el = (id) => { if (!elements.has(id)) elements.set(id, mk(id)); return elements.get(id); };
  const radios = { tl_type: null, tl_result: null };
  const btn = { textContent: '➕ إضافة المهمة للسجل' };
  const img = { src: '' };
  const state = { alerts: [], confirms: [], confirmAnswer: true, saved: [], timers: [], fixedNow: now };
  class FixedDate extends Date {
    constructor(...a) { a.length ? super(...a) : super(state.fixedNow.getTime()); }
    static now() { return state.fixedNow.getTime(); }
  }
  const appData = { taskLog: tasks, interviewArchive: interviews };
  const ctx = vm.createContext({
    appData, console, Date: FixedDate,
    document: {
      getElementById: el,
      querySelector: (sel) => {
        const m = sel.match(/^input\[name="(tl_type|tl_result)"\]:checked$/);
        if (m) return radios[m[1]] === null ? null : { value: radios[m[1]] };
        if (sel === '#toolTasklog .btn-primary') return btn;
        return null;
      },
      querySelectorAll: (sel) => {
        if (sel === '#ministry-logo-img') return [img];
        if (sel.includes('tl_type')) return [{ set checked(v) { if (!v) { radios.tl_type = null; radios.tl_result = null; } } }];
        return [];
      },
    },
    saveUserKey: (k) => { state.saved.push(k); },
    alert: (m) => state.alerts.push(m),
    confirm: (m) => { state.confirms.push(m); return state.confirmAnswer; },
    setTimeout: (fn, ms) => { state.timers.push({ fn, ms }); },
    MINISTRY_LOGO_B64: 'data:image/png;base64,AAAA',
  });
  vm.runInContext('function getArchive(){return appData.interviewArchive;}', ctx);
  vm.runInContext(source, ctx);
  return { ctx, el, radios, btn, img, state, appData };
}

const setFilter = (L, f) => {
  L.el('tl_filter_from').value = f.from; L.el('tl_filter_to').value = f.to;
  L.el('tl_filter_type').value = f.type; L.el('tl_filter_result').value = f.result;
};
const clone = (rows) => JSON.parse(JSON.stringify(rows));

// ── بيانات عشوائية ──
const DATES = ['2026-09-28', '2026-10-01', '2026-10-05', '2026-10-12', '2026-10-19', '2026-10-20', '2026-10-23', '2026-10-25', '2026-11-02'];
const TITLES = ['اجتماع', 'مقابلة "أحمد"', '<b>x</b>', "د'ريس", '', undefined, 'نص طويل '.repeat(8), 'a & b'];
const TYPES = [...TL_TYPES, 'نوع غريب', ''];

function randTasks(r, n) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  return Array.from({ length: n }, (_, i) => ({
    id: 5000 + i, date: pick(DATES), time: pick(['', '09:30']), school: pick(['', 'إعدادية']), type: pick(TYPES), nature: pick(['', 'دعم']),
    title: pick(TITLES), target: pick(['', 'تلميذ']), notes: pick(['', 'ملاحظة']), result: pick([...RESULTS, '', 'قيمة أخرى']),
    duration: pick([0, 15, 45, undefined, 30, 120]),
  }));
}
function randFilter(r) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  return { from: pick(['', '2026-10-01', '2026-10-12']), to: pick(['', '2026-10-20', '2026-10-31']), type: pick(['', '', ...TL_TYPES]), result: pick(['', '', ...RESULTS]) };
}
function randInterviews(r, n) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  return Array.from({ length: n }, () => ({
    interviewDate: pick([...DATES, '', undefined]), studentName: pick(['أحمد', 'سارة', 'x y']),
    subject: pick(['غياب', '—', '', undefined, 'سلوك']), currentStatus: pick(['مُنجز', 'قيد المتابعة', '', undefined, 'جديد']),
  }));
}

// يقرأ HTML القائمة القديم بنيوياً (مجموعات وصفوف وإحصاء) بدل مقارنة المسافات والأسطر
function parseLegacyList(html) {
  const groups = [];
  const parts = html.split('<div style="margin-bottom:12px;">').slice(1);
  for (const p of parts) {
    const head = p.match(/<span>📅 (.*?) — (.*?)<\/span>\s*<span[^>]*>(\d+) مهام<\/span>/s);
    const rows = [...p.matchAll(/<tr id="tl-row-(\d+)">(.*?)<\/tr>/gs)].map((m) => ({
      id: Number(m[1]),
      date: m[2].match(/<input type="date" value="([^"]*)"/)[1],
      type: (m[2].match(/<option value="([^"]*)" selected>/) || [])[1],
      title: m[2].match(/value="([^"]*)"\s+placeholder="اسم المهمة\.\.\."/)[1].replace(/&quot;/g, '"'),
    }));
    groups.push({ dayName: head[1], date: head[2], count: Number(head[3]), rows });
  }
  return groups;
}
function parseLegacyStats(html) {
  return {
    total: Number(html.match(/📋 إجمالي: (\d+)/)[1]), done: Number(html.match(/✅ مُنجز: (\d+)/)[1]),
    pending: Number(html.match(/🔄 متابعة: (\d+)/)[1]), mins: Number(html.match(/⏱ (\d+) دقيقة/)[1]),
  };
}

// ── القائمة والإحصاء ──
for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) {
  test(`مطابقة للقديم: القائمة المجمَّعة والإحصاء والعدّاد seed=${seed}`, () => {
    const r = rngOf(seed);
    const tasks = randTasks(r, Math.floor(r() * 26));
    const L = makeLegacy({ tasks: clone(tasks) });
    for (let k = 0; k < 12; k++) {
      const f = k === 0 ? EMPTY_FILTER : randFilter(r);
      setFilter(L, f);
      L.ctx.tlRenderLog();
      const shown = filterTasks(tasks, f);
      assert.deepEqual(parseLegacyStats(L.el('tlStats').innerHTML), statsOf(shown), 'الإحصاء ' + JSON.stringify(f));
      const html = L.el('tlTaskList').innerHTML;
      if (!shown.length) {
        assert.ok(html.includes(EMPTY_LIST_TEXT));
        continue;
      }
      const legacy = parseLegacyList(html);
      const mine = groupByDate(shown).map((g) => ({
        dayName: g.dayName, date: g.date, count: g.tasks.length,
        rows: g.tasks.map((t) => ({ id: t.id, date: t.date || '', type: TL_TYPES.includes(t.type) ? t.type : undefined, title: t.title || '' })),
      }));
      assert.deepEqual(legacy, mine, 'المجموعات ' + JSON.stringify(f));
      assert.equal(L.el('tlTaskCount').textContent, tasks.length);
    }
  });
}

test('مطابقة للقديم: تاريخ فارغ يجمَّع تحت مفتاح فارغ واسم اليوم undefined (عيب قديم محفوظ في المنطق)', () => {
  const tasks = [{ id: 1, date: '', type: 'أخرى', title: 'ب', result: '' }, { id: 2, date: '2026-10-05', type: 'أخرى', title: 'أ', result: '' }];
  const L = makeLegacy({ tasks: clone(tasks) });
  setFilter(L, EMPTY_FILTER);
  L.ctx.tlRenderLog();
  assert.ok(L.el('tlTaskList').innerHTML.includes('📅 undefined — '));
  const g = groupByDate(tasks);
  assert.deepEqual(g.map((x) => x.date), ['2026-10-05', '']);
  assert.equal(g[1].dayName, undefined);
  assert.equal(g[0].dayName, DAY_NAMES[new Date('2026-10-05').getDay()]);
});

// ── الإضافة ──
for (const seed of [1, 2, 3, 4, 5, 6]) {
  test(`مطابقة للقديم: tlAddTask (التحقق والحقول) seed=${seed}`, () => {
    const r = rngOf(seed * 31);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const L = makeLegacy({ tasks: [] });
    let mine = [];
    for (let step = 0; step < 25; step++) {
      const form = {
        date: pick(['', '2026-10-23', '2026-10-24']), time: pick(['', '09:30']), school: pick(['', '  إعدادية  ', 'م']),
        type: pick(['', ...TL_TYPES]), nature: pick(['', ' دعم ']), title: pick(['', '  عنوان  ', '<b>']), target: pick(['', ' س ']),
        notes: pick(['', ' ملاحظة\nسطران ']), result: pick(['', ...RESULTS]), duration: pick(['', '45', '0', 'abc', '12.7', ' 30 ']),
      };
      L.el('tl_date').value = form.date; L.el('tl_time').value = form.time; L.el('tl_school').value = form.school;
      L.radios.tl_type = form.type || null; L.el('tl_nature').value = form.nature; L.el('tl_title').value = form.title;
      L.el('tl_target').value = form.target; L.el('tl_notes').value = form.notes; L.radios.tl_result = form.result || null;
      L.el('tl_duration').value = form.duration;
      setFilter(L, EMPTY_FILTER);
      const alertsBefore = L.state.alerts.length;
      const lenBefore = L.appData.taskLog.length;
      L.ctx.tlAddTask();
      const err = validateForm(form);
      if (err) {
        assert.equal(L.state.alerts.length - alertsBefore, 1);
        assert.equal(L.state.alerts[L.state.alerts.length - 1], err);
        assert.equal(err, ADD_ALERT);
        assert.equal(L.appData.taskLog.length, lenBefore, 'لا إضافة عند الخطأ');
      } else {
        assert.equal(L.state.alerts.length, alertsBefore);
        const added = L.appData.taskLog[0];
        mine = addTask(mine, makeTask(form, added.id));
        assert.deepEqual(clone(L.appData.taskLog), clone(mine));
        assert.equal(L.state.saved[L.state.saved.length - 1], 'taskLog');
        assert.equal(L.btn.textContent, '✅ تمت الإضافة!');
        assert.equal(L.state.timers.length > 0, true);
        L.state.timers.pop().fn();
        assert.equal(L.btn.textContent, '➕ إضافة المهمة للسجل');
      }
    }
  });
}

// ── التعديل والحذف والمسح ──
for (const seed of [1, 2, 3, 4, 5]) {
  test(`مطابقة للقديم: tlEditField وtlDeleteTask وtlClearAll seed=${seed}`, () => {
    const r = rngOf(seed * 97);
    const pick = (a) => a[Math.floor(r() * a.length)];
    const initial = randTasks(r, 10);
    const L = makeLegacy({ tasks: clone(initial) });
    setFilter(L, EMPTY_FILTER);
    let mine = clone(initial);
    for (let step = 0; step < 40; step++) {
      const op = pick(['edit', 'edit', 'edit', 'del', 'del', 'clear']);
      const id = r() > 0.15 && mine.length ? pick(mine).id : 99999;
      if (op === 'edit') {
        const field = pick(['date', 'type', 'title']);
        const value = field === 'date' ? pick(['2026-10-30', '']) : field === 'type' ? pick(TL_TYPES) : pick(['جديد', '', '"x"']);
        const savedBefore = L.state.saved.length;
        L.ctx.tlEditField(id, field, value);
        const next = editTask(mine, id, field, value);
        assert.equal(L.state.saved.length - savedBefore, next === mine ? 0 : 1, 'الحفظ فقط إن وُجد السجل');
        mine = next;
      } else if (op === 'del') {
        L.state.confirmAnswer = r() > 0.3;
        const before = L.state.confirms.length;
        L.ctx.tlDeleteTask(id);
        assert.equal(L.state.confirms[before], 'حذف هذه المهمة؟');
        if (L.state.confirmAnswer) mine = deleteTask(mine, id);
      } else {
        L.state.confirmAnswer = r() > 0.5;
        const before = L.state.confirms.length;
        L.ctx.tlClearAll();
        assert.equal(L.state.confirms[before], 'هل أنت متأكد من حذف جميع المهام المسجلة؟');
        if (L.state.confirmAnswer) mine = [];
      }
      assert.deepEqual(clone(L.appData.taskLog), clone(mine), `بعد ${op} #${step}`);
    }
  });
}

test('editTask وdeleteTask لا يعدّلان المصفوفة المُدخلة، والتعديل يطابق المعرّف بمساواة صارمة', () => {
  const rows = Object.freeze([Object.freeze({ id: 1, title: 'أ' }), Object.freeze({ id: '2', title: 'ب' })]);
  const edited = editTask(rows, 1, 'title', 'ج');
  assert.deepEqual(edited.map((t) => t.title), ['ج', 'ب']);
  assert.equal(edited[1], rows[1]);
  assert.equal(editTask(rows, 2, 'title', 'x'), rows, 'المعرّف النصي لا يطابق الرقمي (كالقديم)');
  assert.deepEqual(deleteTask(rows, 1).map((t) => t.id), ['2']);
  assert.equal(rows.length, 2);
});

// ── الاختصارات الزمنية ──
test('مطابقة للقديم: هذا الأسبوع والأسبوع الماضي وهذا الشهر على 400 لحظة مختلفة', () => {
  const r = rngOf(7);
  const L = makeLegacy({ tasks: [] });
  const moments = [];
  for (let i = 0; i < 400; i++) {
    const d = new Date(2025, 0, 1 + Math.floor(r() * 900), [0, 0, 1, 12, 23][Math.floor(r() * 5)], Math.floor(r() * 60));
    moments.push(d);
  }
  for (const d of moments) {
    L.state.fixedNow = d;
    for (const [fn, mine] of [['tlSetThisWeek', weekRange(d, 0)], ['tlSetLastWeek', weekRange(d, -1)], ['tlSetThisMonth', monthRange(d)]]) {
      setFilter(L, { from: 'x', to: 'y', type: 'مقابلة فردية', result: 'مُنجز' });
      L.ctx[fn]();
      assert.equal(L.el('tl_filter_from').value, mine.from, fn + ' من ' + d.toString());
      assert.equal(L.el('tl_filter_to').value, mine.to, fn + ' إلى ' + d.toString());
      assert.equal(L.el('tl_filter_type').value, '');
      assert.equal(L.el('tl_filter_result').value, '');
    }
  }
});

test('مطابقة للقديم: tlClearFilter يفرّغ الحقول الأربعة', () => {
  const L = makeLegacy({ tasks: [] });
  setFilter(L, { from: '2026-10-01', to: '2026-10-31', type: 'أخرى', result: 'مُنجز' });
  L.ctx.tlClearFilter();
  assert.deepEqual([L.el('tl_filter_from').value, L.el('tl_filter_to').value, L.el('tl_filter_type').value, L.el('tl_filter_result').value], ['', '', '', '']);
});

// ── التقرير ──
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  test(`مطابقة للقديم: التقرير الأسبوعي حرفياً seed=${seed}`, () => {
    const r = rngOf(seed * 131);
    const tasks = randTasks(r, Math.floor(r() * 18));
    const interviews = randInterviews(r, Math.floor(r() * 8));
    const L = makeLegacy({ tasks: clone(tasks), interviews: clone(interviews) });
    for (let k = 0; k < 6; k++) {
      const f = k === 0 ? EMPTY_FILTER : randFilter(r);
      setFilter(L, f);
      L.el('tlReportContent').innerHTML = '';
      L.el('tlPrintModal').classes.clear();
      L.img.src = '';
      const alertsBefore = L.state.alerts.length;
      L.ctx.tlGenerateReport();
      const res = buildReport(filterTasks(tasks, f), interviews, f.from, f.to);
      if (!res) {
        assert.equal(L.state.alerts[L.state.alerts.length - 1], EMPTY_REPORT_ALERT);
        assert.equal(L.el('tlReportContent').innerHTML, '', 'لا كتابة عند الفراغ');
        assert.ok(!L.el('tlPrintModal').classes.has('open'));
      } else {
        assert.equal(L.state.alerts.length, alertsBefore);
        assert.equal(L.el('tlReportContent').innerHTML, res.html, 'نص التقرير ' + JSON.stringify(f));
        assert.ok(L.el('tlPrintModal').classes.has('open'));
        assert.equal(L.img.src, 'data:image/png;base64,AAAA');
        assert.equal(res.total, filterTasks(tasks, f).length + interviews.filter((e) => { const d = e.interviewDate || ''; return (!f.from || d >= f.from) && (!f.to || d <= f.to); }).length);
      }
    }
  });
}

// ── ثوابت القوائم والاقتراحات مقابل القالب القديم المجمَّد ──
test('الثوابت تطابق القالب القديم: أنواع المهام ونتائجها وخيارات التصفية', () => {
  const radios = (name) => [...oldTemplate.matchAll(new RegExp(`<label><input type="radio" name="${name}" value="([^"]*)"> ([^<]*)</label>`, 'g'))].map((m) => [m[1], m[2]]);
  assert.deepEqual(radios('tl_type'), TL_TYPES.map((t) => [t, TYPE_ICONS[t] + ' ' + t]));
  assert.deepEqual(radios('tl_result'), RESULTS.map((x) => [x, ({ 'مُنجز': '✅', 'قيد المتابعة': '🔄', 'لم يكتمل': '❌' })[x] + ' ' + x]));
  const sel = (id) => { const m = oldTemplate.match(new RegExp(`<select id="${id}">(.*?)</select>`, 's')); return [...m[1].matchAll(/<option(?: value="")?>([^<]*)<\/option>/g)].map((x) => x[1]); };
  assert.deepEqual(sel('tl_filter_type'), ['— الكل —', ...TL_TYPES]);
  assert.deepEqual(sel('tl_filter_result'), ['— الكل —', ...RESULTS]);
});

test('الثوابت تطابق القالب القديم: اقتراحات الطبيعة والملاحظات', () => {
  const nature = [...oldTemplate.matchAll(/onclick="document\.getElementById\('tl_nature'\)\.value='([^']*)'">([^<]*)<\/button>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(nature, NATURE_SUGGESTIONS.map((s) => [s, s]));
  const notes = [...oldTemplate.matchAll(/onclick="appendSuggest\('tl_notes','([^']*)'\)">([^<]*)<\/button>/g)].map((m) => ({ text: m[1], label: m[2] }));
  assert.deepEqual(notes, NOTE_SUGGESTIONS.map((s) => ({ text: s.text, label: s.label })));
});

test('أيقونات الأنواع تطابق tlTypeIcons القديمة', () => {
  const L = makeLegacy({ tasks: [] });
  const legacyIcons = JSON.parse(JSON.stringify(vm.runInContext('tlTypeIcons', L.ctx)));
  assert.deepEqual(legacyIcons, TYPE_ICONS);
  // المصفوفة القادمة من vm تنتمي لعالم JS آخر، فنقارن عبر JSON (والترتيب مهم لأنه ترتيب الأزرار)
  assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(Object.keys(tlTypeIcons))', L.ctx)), TL_TYPES);
});

// ── ما بقي في الكود القديم الحيّ ──
function grabLive(re, endRe) {
  const i = liveS15.search(re);
  assert.ok(i >= 0, 'لم أجد ' + re);
  const rest = liveS15.slice(i);
  const m = rest.match(endRe);
  return rest.slice(0, m.index + m[0].length);
}

test('appendText يطابق appendSuggest القديمة (التي بقيت لأن body.html يستعملها)', () => {
  const code = grabLive(/function appendSuggest\(/, /\n\}\n/);
  for (const current of ['', '   ', 'سطر', 'سطر  \n  ', ' x ']) {
    const field = { value: current, focused: 0, focus() { this.focused++; } };
    const ctx = vm.createContext({ document: { getElementById: () => field } });
    vm.runInContext(code, ctx);
    ctx.appendSuggest('tl_notes', 'نص');
    assert.equal(field.value, appendText(current, 'نص'));
    assert.equal(field.focused, 1);
  }
});

test('autoLogTask الحيّة (تستدعيها الأدوات الأخرى) ما زالت تعمل وتُدخل المهمة أولاً', () => {
  const code = [grabLive(/function tlGetTasks\(/, /\n/), grabLive(/function tlSaveTasks\(/, /\n/), grabLive(/function autoLogTask\(/, /\n\}\n/)].join('\n');
  const saved = [];
  const appData = { taskLog: [{ id: 1, date: '2026-10-01' }] };
  const ctx = vm.createContext({ appData, saveUserKey: (k) => saved.push(k), Date });
  vm.runInContext(code, ctx);
  ctx.autoLogTask('مقابلة فردية', 'عنوان', 'تلميذ', 'مؤسسة', 'ملاحظات', 'مُنجز', '2026-10-20');
  assert.equal(appData.taskLog.length, 2);
  assert.equal(appData.taskLog[0].type, 'مقابلة فردية');
  assert.equal(appData.taskLog[0].date, '2026-10-20');
  assert.equal(appData.taskLog[0].auto, true);
  assert.deepEqual(saved, ['taskLog']);
  assert.ok(!liveS15.includes('function tlRenderLog'), 'واجهة القديم حُذفت');
});
