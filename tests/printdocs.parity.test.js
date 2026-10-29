// اختبار مطابقة «بوابة الإحالة والإخبار الصحي» (المرحلة 24): نشغّل الكود القديم المجمَّد (tests/fixtures/printdocs.step24.js:
// script-09 + كتلة PRINT DOCS من script-10 + script-28 + script-30) في vm مع DOM مُحاكى،
// ونقارن نتائجه بدوال src/printdocs/printdocsLogic.js على بيانات عشوائية بذرة ثابتة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as P from '../src/printdocs/printdocsLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/printdocs.step24.js', import.meta.url), 'utf8');
const NOW = new Date(2026, 9, 26, 11, 30);
const TODAY = P.todayIso(NOW);
const J = (x) => JSON.parse(JSON.stringify(x));
function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }
const pick = (r, a) => a[Math.floor(r() * a.length)];
const unesc = (t) => String(t).replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');

const DATE_IDS = ['pd3-date', 'pd3-dob', 'pd3-ref-date', 'pd4-date', 'pd4-dob'];
const SELECT_IDS = ['pd3-urgency', 'pd4-urgency'];
const TEXTAREA_IDS = ['pd3-reason', 'pd3-prev-actions', 'pd4-health-desc'];
const ARCH_KEY = { 3: 'pdAssocArchive', 4: 'pdHealthArchive' };

// ── DOM مُحاكى بالقدر الذي يستعمله الكود القديم ──
function makeDom({ dir = 'مديرية الحي الحسني' } = {}) {
  const els = {};
  const classes = () => {
    const s = new Set();
    return { add: (c) => s.add(c), remove: (c) => s.delete(c), contains: (c) => s.has(c), toggle: (c, f) => { const on = f === undefined ? !s.has(c) : !!f; if (on) s.add(c); else s.delete(c); return on; } };
  };
  const mk = (id, extra = {}) => {
    const attrs = {}, listeners = {};
    return {
      id, value: '', style: {}, dataset: {}, textContent: '', innerHTML: '', classList: classes(), _listeners: listeners,
      getAttribute: (k) => (k in attrs ? attrs[k] : null), setAttribute: (k, v) => { attrs[k] = String(v); }, removeAttribute: (k) => { delete attrs[k]; },
      addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn); }, ...extra,
    };
  };
  const fields = {};
  for (const n of [3, 4]) {
    P.FIELD_IDS[n].forEach((id) => {
      fields[id] = mk(id);
      if (SELECT_IDS.includes(id)) Object.defineProperty(fields[id], 'selectedIndex', { set() { fields[id].value = ''; }, get: () => 0 });
    });
  }
  const search = { 3: mk('pdArch3Search'), 4: mk('pdArch4Search') };
  const makeRow = (nInputs = 0) => {
    const r = { style: {}, inputs: Array.from({ length: nInputs }, () => ({ value: '' })) };
    Object.defineProperty(r, 'innerHTML', { set(h) { r.inputs = Array.from({ length: (String(h).match(/<input/g) || []).length }, () => ({ value: '' })); }, get: () => '' });
    return r;
  };
  const typeTa = mk('pd4-type-textarea');
  const mkTbody = (n) => {
    const tb = { rows: Array.from({ length: n }, () => makeRow(1)) };
    tb.querySelectorAll = (sel) => {
      if (sel === 'tr') return tb.rows.slice();
      if (sel === 'input[type="text"]') return tb.rows.flatMap((r) => r.inputs);
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    };
    tb.appendChild = (tr) => tb.rows.push(tr);
    return tb;
  };
  const healthTb = mkTbody(P.MIN_PROCS); healthTb.querySelector = (sel) => { if (sel === 'textarea') return typeTa; throw new Error('محدِّد غير مُحاكى: ' + sel); };
  const teachTb = mkTbody(P.MIN_TEACHERS);
  const isDate = (id) => DATE_IDS.includes(id), isSel = (id) => SELECT_IDS.includes(id);
  const panel = (n) => ({
    classList: classes(), style: {},
    querySelectorAll(sel) {
      const own = P.FIELD_IDS[n].map((id) => fields[id]);
      if (sel === 'input[id],textarea[id],select[id]') return [...own, search[n]];
      if (sel === 'input[type="text"],input[type="tel"],textarea') {
        const t = [...own.filter((e) => !isDate(e.id) && !isSel(e.id)), search[n]];
        if (n === 4) t.push(typeTa, ...healthTb.querySelectorAll('input[type="text"]'), ...teachTb.querySelectorAll('input[type="text"]'));
        return t;
      }
      if (sel === 'input[type="date"]') return own.filter((e) => isDate(e.id));
      if (sel === 'select') return own.filter((e) => isSel(e.id));
      if (sel === 'input[type="checkbox"],input[type="radio"]' || sel === '.pd1-xbox') return [];
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
  });
  // لوحات الاقتراحات: نحلّل innerHTML الذي يبنيه القديم إلى أزرار قابلة للنقر
  const parseBtns = (html) => {
    const out = [];
    const re = /<button type="button" class="([^"]*)"([^>]*)>/g;
    let m;
    while ((m = re.exec(html))) {
      const attrs = {}; const ar = /data-(\w+)="([^"]*)"/g; let a;
      while ((a = ar.exec(m[2]))) attrs[a[1]] = unesc(a[2]);
      const cl = classes(); m[1].split(/\s+/).forEach((c) => cl.add(c));
      const b = { attrs, classList: cl, getAttribute: (k) => (k.replace(/^data-/, '') in attrs ? attrs[k.replace(/^data-/, '')] : null) };
      b.closest = (sel) => (sel === '.pd-chip' ? b : null);
      out.push(b);
    }
    return out;
  };
  const chipBox = (id) => {
    const box = mk(id); let html = ''; box._btns = [];
    Object.defineProperty(box, 'innerHTML', { get: () => html, set(h) { html = h; box._btns = parseBtns(h); } });
    box.querySelectorAll = (sel) => {
      if (sel === '.pd-chip[data-txt]') return box._btns.filter((b) => b.attrs.txt !== undefined);
      if (sel === '.pd-chip.on[data-lbl]') return box._btns.filter((b) => b.attrs.lbl !== undefined && b.classList.contains('on'));
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    };
    return box;
  };
  const boxes = { 'pd4-health-chips': chipBox('pd4-health-chips'), 'pd3-reason-chips': chipBox('pd3-reason-chips'), 'pd3-prev-chips': chipBox('pd3-prev-chips') };
  const named = {
    pdPanel3: panel(3), pdPanel4: panel(4), pdTab3: mk('pdTab3'), pdTab4: mk('pdTab4'), pdArch3Search: search[3], pdArch4Search: search[4],
    'pd4-health-tbody': healthTb, 'pd4-teachers-tbody': teachTb, ...boxes,
    pdArch3Count: mk('pdArch3Count'), pdArch4Count: mk('pdArch4Count'), pdArch3List: mk('pdArch3List'), pdArch4List: mk('pdArch4List'),
    pdArch3Body: mk('pdArch3Body'), pdArch4Body: mk('pdArch4Body'), pdArch3Arrow: mk('pdArch3Arrow'), pdArch4Arrow: mk('pdArch4Arrow'),
    pdReportContent: mk('pdReportContent'), pdModalTitle: mk('pdModalTitle'), pdPrintModal: mk('pdPrintModal'),
  };
  const document = {
    getElementById: (id) => (id in fields ? fields[id] : id in named ? named[id] : (els[id] ??= mk(id))),
    createElement: () => makeRow(0),
    querySelector: (sel) => (sel === '.dynamic-directorate' ? { textContent: dir } : null),
    querySelectorAll(sel) {
      if (sel === '#toolPrintdocs input[type="date"]') return DATE_IDS.map((id) => fields[id]);
      if (sel === '#pdPrintModal #ministry-logo-img') return [];
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
    title: '',
  };
  return { fields, search, typeTa, healthTb, teachTb, boxes, named, document, makeRow };
}

function makeLegacy({ archive3 = [], archive4 = [], dir } = {}) {
  const dom = makeDom({ dir });
  let tick = 0;
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } static now() { return NOW.getTime() + (tick++); } }
  const log = { alerts: [], confirms: [], toasts: [], saves: [] };
  const appData = { pdAssocArchive: archive3, pdHealthArchive: archive4 };
  const sandbox = {
    console, Date: FixedDate, document: dom.document, setTimeout: () => 0, appData,
    alert: (m) => log.alerts.push(m), confirm: (m) => { log.confirms.push(m); return true; },
    saveUserKey: (k) => log.saves.push(k), showToast: (m, t) => log.toasts.push([m, t]),
  };
  sandbox.window = sandbox;
  sandbox.scrollTo = () => {};
  const ctx = vm.createContext(sandbox);
  vm.runInContext(legacySrc, ctx);
  return { ctx, dom, log, appData, run: (code) => vm.runInContext(code, ctx) };
}

// ── مولّد بيانات ──
const NAMES = ['  أحمد بنعلي ', 'فاطمة <b>الزهراء</b>', 'يوسف & المرابط', 'سارة', 'ليلى "الصغيرة"'];
const TXT = ['', ' ', 'نص عادي', ' نص بمسافات ', 'سطر\nثان', 'a<b>c', 'x & y', '"اقتباس"'];
function randForm(r, n, { name = true } = {}) {
  const t = (a) => pick(r, a);
  const f = P.blankFields(n, TODAY);
  P.FIELD_IDS[n].forEach((id) => {
    if (DATE_IDS.includes(id)) f[id] = t(['', '2026-10-20', '2026-10-24', '2025-01-05']);
    else if (SELECT_IDS.includes(id)) f[id] = t(['', ...P.URGENCY_OPTIONS[n]]);
    else f[id] = t(TXT);
  });
  f[P.NAME_ID[n]] = name ? t(NAMES) : t(['', '  ']);
  if (n === 3) f['pd3-assoc'] = t(['', 'جمعية الأمل', ' جمعية <i> ']);
  const form = { fields: f };
  if (n === 4) {
    const cnt = (min, extra) => min + Math.floor(r() * (extra + 1));
    form.type = t(['', 'الربو', ' ربو / سكري ', 'a<b']);
    form.procs = Array.from({ length: cnt(3, 3) }, () => t(['', ' ', 'الجلوس في الصف الأول', 'ترك القسم عند الحاجة', 'x & y']));
    form.teachers = Array.from({ length: cnt(8, 3) }, () => t(['', ' ', 'أ. محمد', ' أ. فاطمة ', 'أ. <س>']));
  }
  return form;
}
function applyToLegacy(dom, n, form) {
  P.FIELD_IDS[n].forEach((id) => { dom.fields[id].value = form.fields[id]; });
  if (n === 4) {
    dom.typeTa.value = form.type;
    dom.healthTb.rows = form.procs.map((v) => { const row = dom.makeRow(1); row.inputs[0].value = v; return row; });
    dom.teachTb.rows = form.teachers.map((v) => { const row = dom.makeRow(1); row.inputs[0].value = v; return row; });
  }
}
function readLegacy(dom, n) {
  const fields = {};
  P.FIELD_IDS[n].forEach((id) => { fields[id] = dom.fields[id].value; });
  const form = { fields };
  if (n === 4) {
    form.type = dom.typeTa.value;
    form.procs = dom.healthTb.querySelectorAll('input[type="text"]').map((i) => i.value);
    form.teachers = dom.teachTb.querySelectorAll('input[type="text"]').map((i) => i.value);
  }
  return form;
}
const noSearch = (entry) => { const e = J(entry); delete e.fields.pdArch3Search; delete e.fields.pdArch4Search; return e; };

// ── الجداول الثابتة ──
test('مطابقة للقديم: قوائم الاقتراحات (حالات/تفاصيل/أسباب/إجراءات) حرفياً', () => {
  const L = makeLegacy();
  const parse = (box) => {
    const out = []; let cur = null;
    for (const m of box._btns ? [] : []) void m;
    const re = /<div class="pd-chip-title">(.*?)<\/div>|<button type="button" class="pd-chip" data-lbl="(.*?)" data-txt="(.*?)">/g;
    let m;
    while ((m = re.exec(box.innerHTML))) {
      if (m[1] !== undefined) { cur = [unesc(m[1]), []]; out.push(cur); } else cur[1].push([unesc(m[2]), unesc(m[3])]);
    }
    return out;
  };
  for (const [key, panel] of Object.entries(P.CHIP_PANELS)) {
    assert.deepEqual(J(panel.groups), parse(L.dom.boxes[panel.box]), 'لوحة ' + key);
  }
  assert.equal(P.HEALTH_COND.length, 18);
  assert.equal(P.REASON.length, 13);
});


// علامات تصدير Word المضافة عمداً (pd-line / pd-table-report / data-w / data-h / data-bold) لا وجود لها في القديم؛ نزيلها قبل المقارنة الحرفية.
const stripWordMarks = (h) => h
  .replace(/ class="pd-line"/g, '').replace(/ class="pd-table-report"/g, '')
  .replace(/ data-(?:w|h|bold)="[^"]*"/g, '')
  .replace(/<(tr|td|div)( class="pd-line")?( data-bold="0")?/g, '<$1');

// ── التقرير ──
for (const n of [3, 4]) {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    test(`مطابقة للقديم: pdGenerate(${n}) — نص التقرير والعنوان seed=${seed}`, () => {
      const r = rngOf(seed * 131 + n);
      const L = makeLegacy({ dir: seed % 2 ? 'مديرية <اختبار>' : 'مديرية الحي الحسني' });
      for (let step = 0; step < 10; step++) {
        const form = randForm(r, n, { name: r() < 0.8 });
        applyToLegacy(L.dom, n, form);
        L.run(`pdGenerate(${n})`);
        const dir = L.dom.document.querySelector('.dynamic-directorate').textContent;
        assert.equal(L.dom.named.pdReportContent.innerHTML, stripWordMarks(P.reportHtml(n, form, { logo: '', dir })), 'خطوة ' + step);
        assert.equal(L.dom.named.pdModalTitle.textContent, P.MSG.MODAL_TITLE[n]);
        assert.ok(L.dom.named.pdPrintModal.classList.contains('open'));
      }
    });
  }
}
test('التقرير يهرّب HTML ولا يُدرج وسوماً خاماً', () => {
  const f = P.blankForm(4); f.fields['pd4-name'] = '<script>alert(1)</script>'; f.type = '<img src=x>'; f.procs = ['<b>x</b>']; f.teachers = ['<i>t</i>'];
  const html = P.reportHtml(4, f, {});
  assert.ok(!html.includes('<script>') && !html.includes('<img src=x>') && !html.includes('<b>x</b>') && !html.includes('<i>t</i>'));
  assert.ok(html.includes('&lt;script&gt;'));
});

// القديم لا يُنقص صفوف جدولي الإجراءات والأساتذة عند تحميل سجل (يزيدها فقط)، فتبقى صفوف فارغة من سجل سابق؛ الجديد يرسم الصفوف بعدد السجل بالضبط.
// لذا نعيد الجدولين إلى حالتهما الأولية (3 و8) قبل التحميل ليكون الفرق الوحيد بينهما هو هذا السلوك المقصود.
const freshRows = (L) => { L.dom.healthTb.rows = Array.from({ length: P.MIN_PROCS }, () => L.dom.makeRow(1)); L.dom.teachTb.rows = Array.from({ length: P.MIN_TEACHERS }, () => L.dom.makeRow(1)); };

// ── الحفظ والتعديل والحذف ──
for (const n of [3, 4]) {
  for (const seed of [1, 2, 3, 4, 5]) {
    test(`مطابقة للقديم: سلسلة حفظ/تحميل/تحديث/حذف/مسح للتبويب ${n} seed=${seed}`, () => {
      const r = rngOf(seed * 977 + n);
      const L = makeLegacy();
      const key = ARCH_KEY[n];
      let mine = [], mineEdit = null;
      for (let step = 0; step < 30; step++) {
        const act = r();
        if (act < 0.55 || !mine.length) { // حفظ
          const form = randForm(r, n, { name: r() < 0.85 });
          applyToLegacy(L.dom, n, form);
          const before = L.log.alerts.length;
          L.run(`pdSaveToArchive(${n})`);
          const entry = P.buildEntry(n, form, { id: 1, now: NOW });
          if (!entry) {
            assert.equal(L.log.alerts.length, before + 1); assert.equal(L.log.alerts.at(-1), P.MSG.NAME_FIRST);
          } else {
            const wasEdit = mineEdit;
            const res = P.upsertEntry(mine, entry, mineEdit);
            // معرّف السجل الجديد يأتي من Date.now في القديم؛ نقرؤه منه
            const legacyArr = L.appData[key];
            const newId = res.updated ? wasEdit : legacyArr[0].id;
            mine = res.archive.map((x) => (x === res.entry ? { ...x, id: newId } : x));
            mineEdit = null;
          }
        } else if (act < 0.75) { // تحميل للتعديل
          const target = pick(r, mine);
          freshRows(L);
          L.run(`pdLoadEntry(${n},${target.id})`);
          assert.deepEqual(J(readLegacy(L.dom, n)), J(P.formFromEntry(n, target, TODAY)), 'استعادة الحقول');
          mineEdit = target.id;
        } else if (act < 0.85) { // معاينة
          const target = pick(r, mine);
          freshRows(L);
          L.run(`pdPreviewEntry(${n},${target.id})`);
          assert.equal(L.dom.named.pdReportContent.innerHTML, stripWordMarks(P.reportHtml(n, P.formFromEntry(n, target, TODAY), { logo: '', dir: 'مديرية الحي الحسني' })));
          mineEdit = target.id;
        } else if (act < 0.93) { // حذف
          const target = pick(r, mine);
          L.run(`pdDeleteEntry(${n},${target.id})`);
          mine = P.deleteEntry(mine, target.id);
          if (mineEdit === target.id) mineEdit = null;
        } else if (act < 0.97) { // مسح الأرشيف
          L.run(`pdClearArch(${n})`);
          mine = []; mineEdit = null;
        } else { // مسح بيانات التبويب يُنهي وضع التعديل
          L.run(`pdClearTab(${n})`);
          mineEdit = null;
        }
        const gotA = L.appData[key].map((x) => noSearch(x)), wantA = mine.map((x) => noSearch(x));
        if (JSON.stringify(gotA) !== JSON.stringify(wantA)) {
          const why = gotA.length !== wantA.length ? 'الطول ' + gotA.length + ' ≠ ' + wantA.length : 'اختلاف في محتوى ' + gotA.findIndex((x, i) => JSON.stringify(x) !== JSON.stringify(wantA[i]));
          assert.fail('الأرشيف بعد الخطوة ' + step + ' (فعل=' + act.toFixed(2) + '): ' + why + '\n' + JSON.stringify(gotA.map((x) => x.id)) + '\n' + JSON.stringify(wantA.map((x) => x.id)));
        }
      }
    });
  }
}

test('الأرشيف: كل سجل محفوظ يُستعاد كما حُفظ (ذهاباً وإياباً)', () => {
  const r = rngOf(42);
  for (const n of [3, 4]) {
    for (let i = 0; i < 20; i++) {
      const form = randForm(r, n);
      const entry = P.buildEntry(n, form, { id: 5, now: NOW });
      assert.deepEqual(J(P.formFromEntry(n, entry, TODAY)), J(form));
    }
  }
});

test('الحفظ: حقول السجل بترتيب DOM القديم ومن غير حقل بحث الأرشيف', () => {
  const form = randForm(rngOf(7), 3);
  const entry = P.buildEntry(3, form, { id: 1, now: NOW });
  assert.deepEqual(Object.keys(entry.fields), P.FIELD_IDS[3]);
  assert.ok(!('pdArch3Search' in entry.fields));
  assert.equal(entry.extra, form.fields['pd3-assoc']);
  const e4 = P.buildEntry(4, randForm(rngOf(8), 4), { id: 1, now: NOW });
  assert.equal(e4.extra, e4.type);
});

// ── عرض الأرشيف والبحث ──
for (const n of [3, 4]) {
  test(`مطابقة للقديم: pdRenderArch(${n}) — العدد والترتيب والخلايا والبحث`, () => {
    const r = rngOf(500 + n);
    const arr = Array.from({ length: 9 }, (_, i) => ({ ...P.buildEntry(n, randForm(r, n), { id: 1000 + i, now: NOW }) }));
    const L = makeLegacy({ archive3: n === 3 ? arr : [], archive4: n === 4 ? arr : [] });
    const cells = (html) => html.split('</tr>').filter((x) => x.includes('<strong')).map((row) => [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((m) => unesc(m[1].replace(/<[^>]+>/g, ''))));
    for (const q of ['', 'أحمد', ' سارة ', 'ZZZ', 'ليلى', 'b']) {
      L.dom.search[n].value = q;
      L.run(`pdRenderArch(${n})`);
      assert.equal(L.dom.named['pdArch' + n + 'Count'].textContent, arr.length);
      const rows = P.filterArchive(arr, q);
      const html = L.dom.named['pdArch' + n + 'List'].innerHTML;
      if (!rows.length) { assert.ok(html.includes(q.trim() ? 'لا توجد نتائج' : 'لا توجد ملفات محفوظة بعد'), 'رسالة الفراغ «' + q + '»'); continue; }
      const got = cells(html);
      assert.equal(got.length, rows.length, 'عدد الصفوف «' + q + '»');
      rows.forEach((e, i) => {
        const c = got[i];
        assert.ok(c[1].endsWith(e.studentName), 'الاسم');
        assert.equal(c[2], e.extra || '—');
        assert.equal(c[3], '📅 ' + P.dfmt(e.date));
        assert.equal(c[4], e.urgency || '—');
        assert.equal(c[5], e.ref || '—');
      });
    }
  });
}
test('dfmt: صيغة التاريخ في الأرشيف', () => {
  assert.equal(P.dfmt('2026-10-24'), '24/10/2026');
  assert.equal(P.dfmt(''), '—');
  assert.equal(P.dfmt(undefined), '—');
  assert.equal(P.dfmt('نص'), 'نص');
});

// ── الاقتراحات (chips) ──
test('مطابقة للقديم: نقرات الاقتراحات وتزامن «نوع الحالة» (التبويب 4)', () => {
  for (const seed of [1, 2, 3, 4]) {
    const r = rngOf(seed * 313);
    const L = makeLegacy();
    const box = L.dom.boxes['pd4-health-chips'], desc = L.dom.fields['pd4-health-desc'], typeTa = L.dom.typeTa;
    let text = '', type = '', lastAuto = null;
    const allTxt = [...P.HEALTH_COND, ...P.HEALTH_DET];
    const click = (btn) => box._listeners.click[0]({ target: btn });
    for (let step = 0; step < 60; step++) {
      const a = r();
      if (a < 0.7) {
        const [lbl, txt] = pick(r, allTxt);
        click(box._btns.find((b) => b.attrs.lbl === lbl));
        text = P.toggleChipText(text, txt);
        const s = P.syncTypeValue(type, lastAuto, text); type = s.type; lastAuto = s.auto;
      } else if (a < 0.78) {
        click(box._btns.find((b) => b.attrs.clear));
        text = '';
        const s = P.syncTypeValue(type, lastAuto, text); type = s.type; lastAuto = s.auto;
      } else if (a < 0.9) { // المستخدم يعدّل «نوع الحالة» يدوياً
        type = pick(r, ['', 'نوع يدوي', ' مرض ']); typeTa.value = type;
      } else { // المستخدم يكتب الوصف يدوياً (حدث input يزامن الألوان فقط)
        text = pick(r, ['', 'نص حر', allTxt[0][1] + '\n' + allTxt[3][1]]); desc.value = text;
        desc._listeners.input.forEach((fn) => fn());
      }
      assert.equal(desc.value, text, 'الوصف خطوة ' + step);
      assert.equal(typeTa.value, type, 'نوع الحالة خطوة ' + step);
      for (const [lbl, txt] of allTxt) {
        const b = box._btns.find((x) => x.attrs.lbl === lbl);
        assert.equal(b.classList.contains('on'), P.chipOn(text, txt), 'تفعيل «' + lbl + '»');
      }
    }
  }
});
test('مطابقة للقديم: اقتراحات الإحالة (الأسباب والإجراءات السابقة)', () => {
  for (const [boxId, targetId, items] of [['pd3-reason-chips', 'pd3-reason', P.REASON], ['pd3-prev-chips', 'pd3-prev-actions', P.PREV]]) {
    const r = rngOf(99);
    const L = makeLegacy();
    const box = L.dom.boxes[boxId], ta = L.dom.fields[targetId];
    let text = '';
    for (let step = 0; step < 40; step++) {
      if (r() < 0.85) { const [lbl, txt] = pick(r, items); box._listeners.click[0]({ target: box._btns.find((b) => b.attrs.lbl === lbl) }); text = P.toggleChipText(text, txt); }
      else { box._listeners.click[0]({ target: box._btns.find((b) => b.attrs.clear) }); text = ''; }
      assert.equal(ta.value, text);
    }
  }
});
test('toggleChipText: يضيف في سطر جديد ويحذف أول ظهور فقط', () => {
  assert.equal(P.toggleChipText('', 'أ'), 'أ');
  assert.equal(P.toggleChipText('أ  \n', 'ب'), 'أ\nب');
  assert.equal(P.toggleChipText('أ\nب\nج', 'ب'), 'أ\nج');
  assert.equal(P.toggleChipText('أ', 'أ'), '');
});

// ── مسح التبويب وفتح البوابة ──
for (const n of [3, 4]) {
  test(`مطابقة للقديم: pdClearTab(${n}) — القيم الافتراضية (باستثناء المؤسسة)`, () => {
    const r = rngOf(8 + n);
    const L = makeLegacy();
    applyToLegacy(L.dom, n, randForm(r, n));
    L.run(`pdClearTab(${n})`);
    const got = readLegacy(L.dom, n), want = P.blankForm(n, TODAY);
    const school = 'pd' + n + '-school';
    assert.equal(got.fields[school], ''); // القديم يتركها فارغة؛ الجديد يعيد اسم المؤسسة من الملف الشخصي (كالمقابلات)
    delete got.fields[school]; delete want.fields[school];
    assert.deepEqual(got.fields, want.fields);
    if (n === 4) { assert.equal(got.type, ''); assert.ok(got.procs.every((v) => v === '')); assert.ok(got.teachers.every((v) => v === '')); }
  });
}
test('مطابقة للقديم: pdInit — تواريخ اليوم تُملأ إن كانت فارغة فقط (وبلا الازدياد/الاستلام)', () => {
  const r = rngOf(3);
  for (let i = 0; i < 12; i++) {
    const L = makeLegacy();
    const f3 = randForm(r, 3).fields, f4 = randForm(r, 4).fields;
    DATE_IDS.forEach((id) => { L.dom.fields[id].value = (id.startsWith('pd3') ? f3 : f4)[id]; });
    L.run('pdInit()');
    assert.deepEqual(J(P.fillEmptyDates(3, f3, TODAY)), Object.fromEntries(P.FIELD_IDS[3].map((id) => [id, DATE_IDS.includes(id) ? L.dom.fields[id].value : f3[id]])));
    assert.deepEqual(J(P.fillEmptyDates(4, f4, TODAY)), Object.fromEntries(P.FIELD_IDS[4].map((id) => [id, DATE_IDS.includes(id) ? L.dom.fields[id].value : f4[id]])));
  }
});
test('blankFields: التاريخ اليوم إلا الازدياد وتاريخ الاستلام', () => {
  const f3 = P.blankFields(3, '2026-10-26');
  assert.equal(f3['pd3-date'], '2026-10-26'); assert.equal(f3['pd3-dob'], ''); assert.equal(f3['pd3-ref-date'], '');
  const f4 = P.blankFields(4, '2026-10-26');
  assert.equal(f4['pd4-date'], '2026-10-26'); assert.equal(f4['pd4-dob'], '');
});
test('الحقول: التي يملكها React لا تتقاطع مع حقول الإكمال التلقائي', () => {
  for (const n of [3, 4]) {
    assert.deepEqual([...P.REF_FIELDS[n], ...P.STATE_FIELDS[n]].sort(), [...P.FIELD_IDS[n]].sort());
  }
  assert.deepEqual(P.AC_CFGS.map((c) => c.nameId), ['pd3-name', 'pd4-name']);
});
