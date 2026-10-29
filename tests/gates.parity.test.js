// اختبار مطابقة بوابتي «التواصل مع الأولياء» و«المتابعة»:
// نشغّل النسخة القديمة المجمَّدة (tests/fixtures/pg.step10.js) في vm مع DOM وهمي بما يكفي لـ mkGate،
// ونقارن بما تنتجه دوال src/gates/gateLogic.js على التسلسل نفسه من العمليات: كتابة، حفظ، تعديل، حذف، بحث، إلغاء، معاينة، استيراد.
// لا يغطي رسم JSX نفسه (انظر تقرير المرحلة 11: اختُبر في متصفح حقيقي بشكل منفصل).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  GATES, RES, esc, iEsc, tableModel, filterRows, defaultValues, editValues, readDraft, validateDraft, saveRows, findRow, removeRow,
  parseImport, reportHtml, printTitle, directorateOf, followCount, makeRecordId, NO_RECORDS_TEXT,
} from '../src/gates/gateLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/pg.step10.js', import.meta.url), 'utf8');
const s10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8')
  + '\n' + fs.readFileSync(new URL('./fixtures/helpers.step45.js', import.meta.url), 'utf8'); // + الدوال المساعدة القديمة المجمَّدة (حُذفت من script-10 في المرحلة 46)
// getDirectorate صارت في src/institution (الخطوة 43): نأخذها من النسخة المجمَّدة
const inst43 = fs.readFileSync(new URL('./fixtures/institution.step42.js', import.meta.url), 'utf8');

// دالتان مساعدتان باقيتان في script-10.js الحيّ: نأخذهما منه فعلاً لنقارن بهما
function grab(re, endRe, src = s10) {
  const i = src.search(re);
  assert.ok(i >= 0, 'لم أجد ' + re);
  const rest = src.slice(i);
  const m = rest.match(endRe);
  return rest.slice(0, m.index + m[0].length);
}
const helpers = [grab(/function iEsc\(/, /\n/), grab(/function getDirectorate\(/, /\n\}\n/, inst43)].join('\n');

const NOW = new Date(2026, 9, 23, 14, 30);
const LOGO = 'data:image/png;base64,AAAA';

function rngOf(seed) {
  let x = seed;
  return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
}

// ── بيئة الكود القديم ──
function makeLegacy({ data, profile = {}, logo = LOGO, tickNow = true, seed = 1, sheetRows = [], source = legacySrc }) {
  const mkRoot = (id) => {
    const cache = {};
    return {
      id, innerHTML: '', onclick: null, oninput: null, onchange: null, scrolled: 0, cache,
      scrollIntoView() { this.scrolled++; },
      querySelector(sel) { return (cache[sel] ??= { value: '', innerHTML: '', clicks: 0, click() { this.clicks++; } }); },
    };
  };
  const roots = { pgCalls: mkRoot('pgCalls'), pgMeet: mkRoot('pgMeet'), pgFu: mkRoot('pgFu') };
  const classes = new Set();
  const modal = { parentNode: null, classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) } };
  const act = { appended: [], appendChild(n) { this.appended.push(n); n.parentNode = this; } };
  const els = {
    ...roots,
    pgReportContent: { innerHTML: '' },
    pgPrintTitle: { textContent: '', dataset: {} },
    pgPrintModal: modal,
    fuBadge: { textContent: '', style: { display: '' } },
  };
  const state = { alerts: [], confirms: [], confirmAnswer: true, saved: [] };
  let now = NOW.getTime();
  class FixedDate extends Date {
    constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); }
    static now() { return tickNow ? now++ : now; }
  }
  const rnd = rngOf(seed);
  const M = Object.create(Math);
  M.random = rnd;
  const frs = [];
  class FakeFileReader {
    readAsArrayBuffer() { this.result = []; this.promise = this.onload(); frs.push(this); }
  }
  const ctx = vm.createContext({
    document: {
      getElementById: (id) => els[id] ?? null,
      querySelector: (sel) => (sel === '.tool-page.active' ? act : null),
      documentElement: { classList: { add() {}, remove() {} } },
    },
    appData: data, userProfile: profile, MINISTRY_LOGO_B64: logo,
    saveUserKey: async (k) => { state.saved.push(k); return true; },
    alert: (m) => state.alerts.push(m),
    confirm: (m) => { state.confirms.push(m); return state.confirmAnswer; },
    Date: FixedDate, Math: M, console, setTimeout() {}, window: { print() {} },
    FileReader: FakeFileReader,
    XLSX: { read: () => ({ SheetNames: ['S'], Sheets: { S: {} } }), utils: { sheet_to_json: () => sheetRows } },
  });
  vm.runInContext(helpers, ctx);
  vm.runInContext(source, ctx);
  return { ctx, roots, els, modal, classes, act, state, frs };
}

const KEY_TO_ROOT = { calls: 'pgCalls', meet: 'pgMeet', fu: 'pgFu' };
const field = (L, gate, k) => L.roots[KEY_TO_ROOT[gate.id]].querySelector('[data-k="' + k + '"]');
const tbody = (L, gate) => L.roots[KEY_TO_ROOT[gate.id]].querySelector('tbody').innerHTML;
const click = (L, gate, a, id) => L.roots[KEY_TO_ROOT[gate.id]].onclick({ target: { closest: () => ({ dataset: { a, id } }) } });

// يحوّل نموذج الجدول إلى نص HTML بصيغة draw() القديمة (React يرسم الشيء نفسه عناصر لا نصاً)
function modelToLegacyHtml(gate, model) {
  if (!model.length) return '<tr><td colspan="' + (gate.fields.length + 2) + '" style="text-align:center;color:var(--text-muted)">' + NO_RECORDS_TEXT + '</td></tr>';
  return model.map((r) => '<tr><td>' + r.n + '</td>' + gate.fields.map((f, i) => {
    const c = r.cells[i];
    return '<td>' + (f.badge ? '<span class="pg-st s' + c.badge + '">' + esc(c.text) + '</span>' : esc(c.text)) + '</td>';
  }).join('') + '<td style="white-space:nowrap"><button class="pg-btn sm" data-a="edit" data-id="' + r.id + '">✏️</button> <button class="pg-btn sm red" data-a="del" data-id="' + r.id + '">🗑</button></td></tr>').join('');
}

// ── بيانات عشوائية ──
const TEXTS = ['أحمد بنعلي', 'فاطمة الزهراء', 'سارة <b>x</b>', "مريم \"د'ريس\"", 'ياسين & سلمى', 'سطر 1\nسطر 2', '<script>alert(1)</script>', '  مسافات  ', '0', 0, '—', '', undefined, 'نص طويل '.repeat(12)];
const CLASSES = ['1AC-3', '2AC-1', '', undefined];

function randRow(r, gate, i) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  const row = { id: pick([String(1000 + i), 2000 + i, 'x' + i]) };
  for (const f of gate.fields) {
    if (r() < 0.12) continue;
    if (f.opts) row[f.k] = pick([...f.opts, '', 'قيمة غير معروفة', undefined]);
    else if (f.t === 'date') row[f.k] = pick(['2026-10-01', '2026-09-15', '', undefined]);
    else if (f.t === 'tel') row[f.k] = pick(['0612345678', '06 12 34 56 78', '']);
    else if (f.k === 'cls') row[f.k] = pick(CLASSES);
    else row[f.k] = pick(TEXTS);
  }
  return row;
}
const cloneRows = (rows) => rows.map((x) => ({ ...x }));

function queryOf(r, rows) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  if (rows.length && r() > 0.4) {
    const row = pick(rows);
    const vals = Object.values(row).map(String).filter(Boolean);
    const v = pick(vals.length ? vals : ['x']);
    return pick(['', ' ']) + v.slice(0, 1 + Math.floor(r() * 4)) + pick(['', ' ']);
  }
  return pick(['', 'name', 'id', '"', '<', 'أ', 'status', '  ', 'غير موجود', '1000', 'تحسن']);
}

// ── محاكي منطق الإنتاج: ما يفعله GateTable.jsx بالدوال النقية ──
class Sim {
  constructor(gate, rows) { this.gate = gate; this.rows = rows; this.q = ''; this.editId = null; this.reset(); }
  reset() { this.editId = null; this.form = defaultValues(this.gate, NOW); }
  type(k, v) { this.form[k] = v; }
  save(makeId) {
    const d = readDraft(this.gate, (k) => this.form[k]);
    const err = validateDraft(this.gate, d);
    if (err) return err;
    this.rows = saveRows(this.rows, d, this.editId, makeId);
    this.reset();
    return null;
  }
  edit(id) {
    const r = findRow(this.rows, id);
    if (!r) return false;
    this.editId = String(id);
    this.form = editValues(this.gate, r);
    return true;
  }
  del(id) { this.rows = removeRow(this.rows, id); }
  search(v) { this.q = v.trim(); }
  html() { return modelToLegacyHtml(this.gate, tableModel(this.gate, this.rows, this.q)); }
}

const profiles = [{}, { institution: 'إعدادية الخوارزمي', school: 'مديرية الدار البيضاء' }, { institution: '<b>x</b> & "y"', school: '' }];

for (const gate of Object.values(GATES)) {
  for (const seed of [1, 2, 3, 5, 8, 13]) {
    test(`مطابقة للقديم: تسلسل عمليات عشوائي [${gate.id}] seed=${seed}`, async () => {
      const r = rngOf(seed * 7919 + gate.id.length);
      const pick = (a) => a[Math.floor(r() * a.length)];
      const initial = Array.from({ length: Math.floor(r() * 8) }, (_, i) => randRow(r, gate, i));
      const profile = pick(profiles);
      const logo = pick([LOGO, '']);
      const data = { parentCalls: [], parentMeetings: [], followUp: [] };
      data[gate.key] = cloneRows(initial);
      const L = makeLegacy({ data, profile, logo, seed });
      L.ctx.initParents(); L.ctx.initFollowup();
      const sim = new Sim(gate, cloneRows(initial));

      const check = (label) => {
        assert.deepEqual(JSON.parse(JSON.stringify(data[gate.key])), JSON.parse(JSON.stringify(sim.rows)), 'السجلات بعد ' + label);
        assert.equal(tbody(L, gate), sim.html(), 'الجدول بعد ' + label);
        for (const f of gate.fields) assert.equal(field(L, gate, f.k).value, sim.form[f.k], `حقل ${f.k} بعد ${label}`);
      };
      check('البناء');

      for (let step = 0; step < 45; step++) {
        const op = pick(['type', 'type', 'type', 'save', 'save', 'edit', 'edit', 'del', 'search', 'reset', 'print']);
        if (op === 'type') {
          const f = pick(r() > 0.5 ? gate.fields.filter((x) => x.k === gate.req) : gate.fields);
          const v = f.opts ? pick([...f.opts, '', 'غير موجود']) : f.t === 'date' ? pick(['2026-10-23', '']) : String(pick(TEXTS) ?? '');
          field(L, gate, f.k).value = v;
          sim.type(f.k, v);
        } else if (op === 'save') {
          const wasEditing = sim.editId;
          const before = L.state.alerts.length;
          await click(L, gate, 'save');
          const err = sim.save(() => data[gate.key][0] && data[gate.key][0].id);
          assert.equal(L.state.alerts.length - before, err ? 1 : 0, 'تنبيه الحقل الإجباري');
          if (err) assert.equal(L.state.alerts[L.state.alerts.length - 1], err);
          assert.ok(!wasEditing || data[gate.key].length === sim.rows.length);
        } else if (op === 'edit') {
          const id = String(r() > 0.15 && sim.rows.length ? pick(sim.rows).id : 'غير-موجود');
          const scrolled = L.roots[KEY_TO_ROOT[gate.id]].scrolled;
          await click(L, gate, 'edit', id);
          const found = sim.edit(id);
          assert.equal(L.roots[KEY_TO_ROOT[gate.id]].scrolled - scrolled, found ? 1 : 0, 'تمرير الصفحة للاستمارة');
        } else if (op === 'del') {
          const id = String(r() > 0.15 && sim.rows.length ? pick(sim.rows).id : 'غير-موجود');
          L.state.confirmAnswer = r() > 0.3;
          const before = L.state.confirms.length;
          await click(L, gate, 'del', id);
          assert.equal(L.state.confirms.length - before, 1);
          assert.equal(L.state.confirms[L.state.confirms.length - 1], 'حذف هذا السجل؟');
          if (L.state.confirmAnswer) sim.del(id);
        } else if (op === 'search') {
          const v = queryOf(r, sim.rows);
          L.roots[KEY_TO_ROOT[gate.id]].oninput({ target: { dataset: { a: 'q' }, value: v } });
          sim.search(v);
        } else if (op === 'reset') {
          await click(L, gate, 'reset');
          sim.reset();
        } else if (op === 'print') {
          await click(L, gate, 'prt');
          const shown = filterRows(sim.rows, sim.q);
          const ctx = { logo, directorate: directorateOf(profile), institution: profile.institution, today: NOW.toLocaleDateString('ar-MA') };
          assert.equal(L.els.pgReportContent.innerHTML, reportHtml(gate.print, gate.fields, shown, ctx), 'صفحة المعاينة');
          const t = printTitle(gate.print);
          assert.equal(L.els.pgPrintTitle.textContent, t.text);
          assert.equal(L.els.pgPrintTitle.dataset.f, t.file);
          assert.ok(L.classes.has('open'), 'النافذة مفتوحة');
          assert.equal(L.modal.parentNode, L.act, 'النافذة نُقلت داخل البوابة النشطة');
        }
        check(`الخطوة ${step} (${op})`);
      }
    });
  }
}

test('مطابقة للقديم: تعريف البوابات الثلاث (الحقول والمفاتيح والعناوين)', () => {
  const captured = [];
  const patched = legacySrc.replace('function mkGate(o) {', 'function mkGate(o) { __captured.push(o);');
  const L = makeLegacy({ data: { parentCalls: [], parentMeetings: [], followUp: [] }, source: 'var __captured = [];\n' + patched });
  assert.equal(L.ctx.__captured.length, 0);
  L.ctx.initParents(); L.ctx.initFollowup();
  const got = L.ctx.__captured;
  assert.equal(got.length, 3);
  const keys = ['box', 'key', 'req', 'ac', 'imp', 'file', 'print', 'title', 'fields'];
  const pickKeys = (o) => JSON.parse(JSON.stringify(Object.fromEntries(keys.map((k) => [k, o[k]]))));
  for (const g of got) {
    const mine = Object.values(GATES).find((x) => x.box === g.box);
    assert.ok(mine, 'بوابة ' + g.box);
    assert.deepEqual(pickKeys(mine), pickKeys(g));
    assert.equal(typeof g.after, g.box === 'pgFu' ? 'function' : 'undefined');
  }
  // المصفوفة القادمة من vm تنتمي لعالم JS آخر، فنقارن عبر JSON لا بالمرجع
  assert.deepEqual(RES, JSON.parse(JSON.stringify(vm.runInContext('_RES', L.ctx))));
});

test('مطابقة للقديم: بناء الاستمارة الابتدائية (قيم التاريخ والقوائم)', () => {
  const L = makeLegacy({ data: { parentCalls: [], parentMeetings: [], followUp: [] } });
  L.ctx.initParents(); L.ctx.initFollowup();
  for (const gate of Object.values(GATES)) {
    const want = defaultValues(gate, NOW);
    for (const f of gate.fields) assert.equal(field(L, gate, f.k).value, want[f.k], `${gate.id}.${f.k}`);
  }
  assert.equal(defaultValues(GATES.calls, NOW).date, NOW.toISOString().slice(0, 10));
  assert.equal(defaultValues(GATES.calls, NOW).result, RES[0]);
  assert.equal(defaultValues(GATES.fu, NOW).status, 'قيد المتابعة');
});

// ── الاستيراد من Excel ──
function randSheet(r) {
  const pick = (a) => a[Math.floor(r() * a.length)];
  const header = pick([
    ['اسم التلميذ', 'رقم المسار', 'هاتف ولي الأمر'], ['Name', 'Massar', 'Phone'], ['الهاتف', 'الاسم', 'مسار'], ['Nom', 'Code', 'GSM'], ['١', '٢', '٣'], null, null,
  ]);
  const rows = Array.from({ length: Math.floor(r() * 9) }, () => {
    const name = pick(['أحمد بنعلي', ' فاطمة ', 'سارة <b>', '', 'Ali', 'أحمد بنعلي']);
    const phone = pick(['0612345678', '612345678', '06-12-34-56-78', '+212 612 345 678', 612345678, '', 'abc']);
    const massar = pick(['M123456', ' G98 ', '', 55]);
    const cells = header && header[0] === 'الهاتف' ? [phone, name, massar] : [name, massar, phone];
    return cells;
  });
  return header ? [header, ...rows] : rows;
}

for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  test(`مطابقة للقديم: استيراد Excel seed=${seed}`, async () => {
    const r = rngOf(seed * 104729);
    const gate = GATES.calls;
    const initial = Array.from({ length: Math.floor(r() * 4) }, (_, i) => ({ id: 'i' + i, name: i ? 'أحمد بنعلي' : 'Ali', phone: i ? '0612345678' : '', massar: '' }));
    const sheetRows = randSheet(r);
    const data = { parentCalls: cloneRows(initial), parentMeetings: [], followUp: [] };
    const L = makeLegacy({ data, tickNow: false, sheetRows });
    L.ctx.initParents();
    const file = { value: 'x' };
    await L.roots.pgCalls.onchange({ target: { dataset: { a: 'file' }, files: [{}], get value() { return file.value; }, set value(v) { file.value = v; } } });
    await L.frs[0].promise;
    const mine = parseImport(gate, cloneRows(initial), sheetRows, NOW.getTime());
    assert.deepEqual(JSON.parse(JSON.stringify(data.parentCalls)), JSON.parse(JSON.stringify(mine.rows)));
    assert.deepEqual(L.state.alerts, ['✅ تم استيراد ' + mine.added + ' سطرًا.']);
  });
}

test('مطابقة للقديم: استيراد ملف تالف يعطي تنبيه الفشل ولا يغيّر السجلات', async () => {
  const data = { parentCalls: [{ id: 'a', name: 'x' }], parentMeetings: [], followUp: [] };
  const L = makeLegacy({ data });
  L.ctx.XLSX.read = () => { throw new Error('bad'); };
  L.ctx.initParents();
  await L.roots.pgCalls.onchange({ target: { dataset: { a: 'file' }, files: [{}], value: 'x' } });
  await L.frs[0].promise;
  assert.deepEqual(L.state.alerts, ['❌ تعذّرت قراءة الملف.']);
  assert.equal(data.parentCalls.length, 1);
});

// ── المعاينة المباشرة (حالات حدّية) ──
test('مطابقة للقديم: المعاينة بلا سجلات وبشعار وبدونه وبمؤسسة ناقصة', async () => {
  for (const [profile, logo] of [[{}, LOGO], [{}, ''], [{ institution: 'م', school: 'د' }, LOGO]]) {
    for (const gate of Object.values(GATES)) {
      const data = { parentCalls: [], parentMeetings: [], followUp: [] };
      const L = makeLegacy({ data, profile, logo });
      L.ctx.initParents(); L.ctx.initFollowup();
      await click(L, gate, 'prt');
      const ctx = { logo, directorate: directorateOf(profile), institution: profile.institution, today: NOW.toLocaleDateString('ar-MA') };
      assert.equal(L.els.pgReportContent.innerHTML, reportHtml(gate.print, gate.fields, [], ctx));
    }
  }
});

test('مطابقة للقديم: شارة المتابعة = عدد السجلات غير المعالَجة', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const r = rngOf(seed);
    const rows = Array.from({ length: Math.floor(r() * 12) }, (_, i) => randRow(r, GATES.fu, i));
    const data = { parentCalls: [], parentMeetings: [], followUp: rows };
    const L = makeLegacy({ data });
    L.ctx.updateFollowBadge();
    const n = followCount(rows);
    assert.equal(L.els.fuBadge.textContent, n);
    assert.equal(L.els.fuBadge.style.display, n ? 'inline-flex' : 'none');
  }
  assert.equal(followCount(undefined), 0);
});

// ── خصائص منطقنا نفسه (لا مرجع قديم لها) ──
test('saveRows وremoveRow لا يعدّلان المصفوفة المُدخلة (المخزن يعتمد على مرجع جديد)', () => {
  const rows = Object.freeze([Object.freeze({ id: '1', name: 'أ' }), Object.freeze({ id: 2, name: 'ب' })]);
  const added = saveRows(rows, { name: 'ج' }, null, () => '9');
  assert.deepEqual(added.map((x) => x.id), ['9', '1', 2]);
  const edited = saveRows(rows, { name: 'د' }, '2');
  assert.deepEqual(edited.map((x) => x.name), ['أ', 'د']);
  assert.equal(edited[0], rows[0], 'غير المعدَّل يبقى المرجع نفسه');
  assert.deepEqual(removeRow(rows, 2).map((x) => x.id), ['1']);
  assert.equal(rows.length, 2);
  // تعديل سجل حُذف في الأثناء: لا يُنشئ سجلاً جديداً (كالقديم الذي كان يعدّل {} مؤقتاً)
  assert.deepEqual(saveRows(rows, { name: 'س' }, 'مفقود').map((x) => x.name), ['أ', 'ب']);
});

test('البحث يطابق على JSON السجل كله (يشمل أسماء الحقول والمعرّف) كما في القديم', () => {
  const rows = [{ id: '77', name: 'أحمد' }, { id: '88', name: 'سارة' }];
  assert.equal(filterRows(rows, 'name').length, 2);
  assert.equal(filterRows(rows, '77').length, 1);
  assert.equal(filterRows(rows, 'أحمد').length, 1);
  assert.equal(filterRows(rows, '').length, 2);
});

test('معرّف السجل الجديد: الوقت ثم رقم عشوائي من 0 إلى 98', () => {
  for (let i = 0; i < 50; i++) assert.match(makeRecordId(), /^\d{13}\d{1,2}$/);
});

test('التهريب: الجدول يهرّب علامة الاقتباس والمعاينة لا تهرّبها (فرق القديم محفوظ)', () => {
  assert.equal(esc('a"b<c>&'), 'a&quot;b&lt;c&gt;&amp;');
  assert.equal(iEsc('a"b<c>&'), 'a"b&lt;c&gt;&amp;');
  assert.equal(esc(null), '');
  assert.equal(iEsc(undefined), '');
});
