// اختبار مطابقة «الورشات والأنشطة»: نشغّل كتلة الورشات القديمة (النسخة المجمَّدة للمرحلة 22) في بيئة معزولة بـDOM مُحاكى،
// ونقارن نتائجها بدوال src/workshops/workshopsLogic.js على بيانات عشوائية بذرة ثابتة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as W from '../src/workshops/workshopsLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/workshops.step22.js', import.meta.url), 'utf8');
const template = fs.readFileSync(new URL('./fixtures/workshops.template.step22.html', import.meta.url), 'utf8');
const script10 = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8')
  + '\n' + fs.readFileSync(new URL('./fixtures/helpers.step45.js', import.meta.url), 'utf8'); // + الدوال المساعدة القديمة المجمَّدة (حُذفت من script-10 في المرحلة 46)
const script15 = fs.readFileSync(new URL('./fixtures/legacy.script-15.step46.js', import.meta.url), 'utf8');
const NOW = new Date(2026, 9, 26, 11, 30);
const J = (x) => JSON.parse(JSON.stringify(x));
function rngOf(seed) { let x = seed; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; }; }

// الدوال المساعدة المشتركة تؤخذ من الملفات الحقيقية لا من نسخة مكتوبة هنا
const helperSrc = script10.match(/^function iEsc\(t\).*$/m)[0] + '\n' + script15.match(/function appendSuggest\(id, text\) \{[\s\S]*?\n\}/)[0];

const TEXT_IDS = { title: 'ws_title', school: 'ws_school', date: 'ws_date', duration: 'ws_duration', males: 'ws_males', females: 'ws_females', objectives: 'ws_objectives', summary: 'ws_summary', notes: 'ws_notes' };
const RADIOS = { ws_type: W.TYPE_OPTIONS, ws_place: W.PLACE_OPTIONS, ws_result: W.RESULT_OPTIONS };
const CHECKS = { ws_theme: W.THEME_OPTIONS, ws_organizer: W.ORGANIZER_OPTIONS, ws_target: W.TARGET_OPTIONS, ws_tools: W.TOOL_OPTIONS };

// ── DOM مُحاكى بالقدر الذي تستعمله دوال الورشات القديمة ──
function makeDom() {
  const mk = (extra = {}) => ({ value: '', innerHTML: '', textContent: '', style: {}, dataset: {}, classList: { add() {}, remove() {}, toggle: () => true, contains: () => false }, ...extra });
  const fields = {};
  Object.values(TEXT_IDS).forEach((id) => { fields[id] = mk(); });
  fields.ws_classes = mk();
  fields.ws_classes_select = mk();
  const groups = {};
  for (const [name, opts] of Object.entries(RADIOS)) groups[name] = opts.map((o) => mk({ value: o[0], checked: false, type: 'radio' }));
  for (const [name, opts] of Object.entries(CHECKS)) groups[name] = opts.map((o) => mk({ value: o[0], checked: false, type: 'checkbox' }));
  const els = {};
  const byName = (name) => groups[name] || [];
  const textual = () => Object.keys(TEXT_IDS).map((k) => fields[TEXT_IDS[k]]);
  const container = { scrollTo() {}, insertBefore() {}, firstChild: null };
  const document = {
    getElementById: (id) => fields[id] || (els[id] ??= mk()),
    createElement: () => mk(),
    querySelectorAll(sel) {
      let m;
      if (sel.startsWith('#toolWorkshops input[type=text]')) return textual();
      if (sel.startsWith('#toolWorkshops input[type=radio]')) return Object.values(groups).flat();
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).filter((e) => e.checked);
      if ((m = sel.match(/^input\[name="(\w+)"\]$/))) return byName(m[1]);
      if (sel === '#ministry-logo-img') return [];
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
    querySelector(sel) {
      let m;
      if ((m = sel.match(/^input\[name="(\w+)"\]:checked$/))) return byName(m[1]).find((e) => e.checked) || null;
      if ((m = sel.match(/^input\[name="(\w+)"\]\[value="(.*)"\]$/))) return byName(m[1]).find((e) => e.value === m[2]) || null;
      if (sel === '#toolWorkshops .main-container') return container;
      throw new Error('محدِّد غير مُحاكى: ' + sel);
    },
  };
  return { fields, groups, els, document };
}

function makeLegacy({ archive = [], profile } = {}) {
  const dom = makeDom();
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(NOW.getTime()); } static now() { return NOW.getTime(); } }
  const log = { alerts: [], confirms: [], saves: 0 };
  const appData = { workshopsArchive: archive };
  const sandbox = {
    console, Date: FixedDate, document: dom.document, setTimeout: () => 0, appData, userProfile: profile,
    alert: (m) => log.alerts.push(m), confirm: (m) => { log.confirms.push(m); return true; },
    saveUserKey: () => { log.saves++; },
    buildLevelOptions: () => '<option value="">x</option>',
    MINISTRY_LOGO_B64: '',
    Image: class { set src(x) { this._src = x; } },
  };
  sandbox.window = sandbox; // كالمتصفح: window هو الكائن العام (وwsSaveToArchiveSilent تعتمد على ذلك)
  sandbox.scrollTo = () => {};
  const ctx = vm.createContext(sandbox);
  vm.runInContext(helperSrc, ctx);
  vm.runInContext(legacySrc, ctx);
  return { ctx, dom, log, appData, sandbox, run: (code) => vm.runInContext(code, ctx) };
}

// ── مولّد بيانات ──
const pick = (r, a) => a[Math.floor(r() * a.length)];
const subset = (r, opts) => opts.map((o) => o[0]).filter(() => r() < 0.4);
const CLASSES = ['1APIC-1', '2APIC-3', '3APIC-2', 'TC-1'];
const PHOTO = (i) => 'data:image/jpeg;base64,AAA' + i;
function randForm(r, { title = true } = {}) {
  const t = (arr) => pick(r, arr);
  return {
    title: title ? t(['  ورشة الوقاية ', 'نشاط <b>رياضي</b>', 'ورشة & مهارات', 'ورشة 1']) : t(['', '   ']),
    school: t(['', 'إعدادية الأمل', ' م & م ']), date: t(['', '2026-10-20', '2026-10-24']), duration: t(['', '2', ' 1.5 ']),
    males: t(['', '12', ' 7 ', 'x']), females: t(['', '9', '0', ' 3']),
    objectives: t(['', 'هدف\nسطر ثان', ' <script> ']), summary: t(['', 'ملخص & نص', ' ']), notes: t(['', 'توصية', ' <i> ']),
    type: t(['', ...W.TYPE_OPTIONS.map((o) => o[0])]), place: t(['', ...W.PLACE_OPTIONS.map((o) => o[0])]), result: t(['', ...W.RESULT_OPTIONS.map((o) => o[0])]),
    themes: subset(r, W.THEME_OPTIONS), organizers: subset(r, W.ORGANIZER_OPTIONS), targets: subset(r, W.TARGET_OPTIONS), tools: subset(r, W.TOOL_OPTIONS),
    classes: CLASSES.filter(() => r() < 0.4),
    photos: Array.from({ length: Math.floor(r() * 4) }, (_, i) => PHOTO(i)),
  };
}
const safeEntry = (r, i, over = {}) => ({ ...W.saveEntry([], randForm(r), new Date(NOW.getTime() + i)).entry, id: 1760000000000 + i, ...over });

// تطبيق نموذج على DOM القديم (الحقول والخيارات وأقسام chips والصور)
function applyForm(L, f) {
  for (const [k, id] of Object.entries(TEXT_IDS)) L.dom.fields[id].value = f[k] ?? '';
  const setG = (name, vals) => L.dom.groups[name].forEach((e) => { e.checked = vals.includes(e.value); });
  setG('ws_type', f.type ? [f.type] : []); setG('ws_place', f.place ? [f.place] : []); setG('ws_result', f.result ? [f.result] : []);
  setG('ws_theme', f.themes || []); setG('ws_organizer', f.organizers || []); setG('ws_target', f.targets || []); setG('ws_tools', f.tools || []);
  L.run(`_wsSelectedClasses = ${JSON.stringify(f.classes || [])}; wsRenderChips();`);
  L.sandbox._wsPhotos = (f.photos || []).slice();
}
const checked = (L, name) => L.dom.groups[name].filter((x) => x.checked).map((x) => x.value);
const classesOf = (L) => J(L.run('_wsSelectedClasses'));

// ── الحفظ ──
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  test(`مطابقة للقديم: wsSaveToArchive (السجل والتنبيهات) seed=${seed}`, () => {
    const r = rngOf(seed * 97);
    const L = makeLegacy();
    let mine = [];
    for (let step = 0; step < 12; step++) {
      const f = randForm(r, { title: r() < 0.85 });
      applyForm(L, f);
      const before = L.log.alerts.length;
      L.run('wsSaveToArchive()');
      const res = W.saveEntry(mine, f, NOW);
      assert.equal(L.log.alerts.length, before + 1);
      if (!res) {
        assert.equal(L.log.alerts.at(-1), W.MSG.TITLE_FIRST);
        assert.deepEqual(J(L.appData.workshopsArchive), J(mine));
        continue;
      }
      mine = res.archive;
      assert.equal(L.log.alerts.at(-1), W.MSG.SAVED(String(f.title).trim()));
      assert.deepEqual(J(L.appData.workshopsArchive), J(mine), 'الأرشيف بعد الخطوة ' + step);
    }
  });
}

// ── التقرير ──
for (const seed of [11, 12, 13, 14, 15, 16, 17, 18]) {
  test(`مطابقة للقديم: wsGenerateReport (HTML حرفياً + حفظ تلقائي بلا تكرار) seed=${seed}`, () => {
    const r = rngOf(seed * 53);
    const L = makeLegacy();
    let mine = [];
    const ratios = { [PHOTO(0)]: 1.5, [PHOTO(1)]: 0.75, [PHOTO(2)]: 1, [PHOTO(3)]: 2.2 };
    L.sandbox._wsRatios = ratios;
    for (let step = 0; step < 14; step++) {
      // عناوين وتواريخ من مجموعة صغيرة ليتكرر نفس الاثنين فيُختبر منع التكرار
      const f = { ...randForm(r, { title: r() < 0.9 }), title: pick(r, ['ورشة أ', ' ورشة ب ', 'ورشة <ج>']), date: pick(r, ['2026-10-20', '2026-10-21', '']) };
      if (r() < 0.1) f.title = '  ';
      applyForm(L, f);
      const a0 = L.log.alerts.length;
      L.run('wsGenerateReport()');
      if (!String(f.title).trim()) { assert.equal(L.log.alerts.length, a0 + 1); assert.equal(L.log.alerts.at(-1), W.MSG.TITLE_FIRST); assert.deepEqual(J(L.appData.workshopsArchive), J(mine)); continue; }
      assert.equal(L.dom.els.wsReportContent.innerHTML, W.reportHtml(f, { logo: '', ratios }), 'تقرير الخطوة ' + step);
      mine = W.autoSaveOnReport(mine, f, NOW).archive;
      assert.equal(L.log.alerts.length, a0, 'الحفظ التلقائي صامت');
      assert.deepEqual(J(L.appData.workshopsArchive), J(mine), 'الأرشيف بعد تقرير ' + step);
    }
  });
}

test('التقرير: الشعار يُدرج في src ويبقى الباقي كما هو', () => {
  const f = { ...W.blankForm('2026-10-24', 'م'), title: 'ورشة' };
  assert.equal(W.reportHtml(f, { logo: 'data:image/png;base64,AAA' }), W.reportHtml(f, { logo: '' }).replace('src=""', 'src="data:image/png;base64,AAA"'));
});

// ── التحميل للتعديل ──
for (const seed of [21, 22, 23, 24, 25, 26]) {
  test(`مطابقة للقديم: wsLoadEntry (الحقول والخيارات والأقسام والصور) seed=${seed}`, () => {
    const r = rngOf(seed * 41);
    const archive = Array.from({ length: 6 }, (_, i) => safeEntry(r, i));
    // سجلات بقيم «—» وأنواع مجهولة وأقسام بفواصل مختلفة وأعداد رقمية
    archive.push({ ...archive[0], id: 1760000000100, school: '—', duration: '—', type: '—', place: 'مكان قديم', result: '—', classes: '—', theme: ['محور قديم', 'مهارات الحياة'], photos: undefined });
    archive.push({ ...archive[1], id: 1760000000101, classes: '1APIC-1, 2APIC-3،،  3APIC-2 ', males: '0', females: '—', objectives: '—', notes: '', type: 'نشاط تربوي', tools: ['نقاش مفتوح', 'عرض PowerPoint'] });
    const L = makeLegacy({ archive: J(archive) });
    applyForm(L, { ...randForm(r), classes: ['TC-1'] }); // حالة سابقة يجب أن تُستبدل كلها
    for (const e of archive) {
      L.run(`wsLoadEntry(${e.id})`);
      const want = W.formFromEntry(e);
      for (const [k, id] of Object.entries(TEXT_IDS)) assert.equal(L.dom.fields[id].value, want[k], `${k} للسجل ${e.id}`);
      assert.deepEqual(checked(L, 'ws_type'), want.type ? [want.type] : []);
      assert.deepEqual(checked(L, 'ws_place'), want.place ? [want.place] : []);
      assert.deepEqual(checked(L, 'ws_result'), want.result ? [want.result] : []);
      assert.deepEqual(checked(L, 'ws_theme'), want.themes);
      assert.deepEqual(checked(L, 'ws_organizer'), want.organizers);
      assert.deepEqual(checked(L, 'ws_target'), want.targets);
      assert.deepEqual(checked(L, 'ws_tools'), want.tools);
      assert.deepEqual(classesOf(L), want.classes, 'الأقسام للسجل ' + e.id);
      assert.deepEqual(J(L.sandbox._wsPhotos), want.photos, 'الصور للسجل ' + e.id);
      assert.equal(String(L.dom.els.ws_total_count.textContent), String(W.totalOf(e)), 'إجمالي المشاركين');
      assert.equal(L.dom.els.wsEditBar.dataset.editId, e.id);
    }
  });
}

// ── التحديث والإلغاء ──
for (const seed of [31, 32, 33, 34, 35, 36]) {
  test(`مطابقة للقديم: wsUpdateEntry (الاستبدال/الإضافة/التحقق) وwsCancelEdit seed=${seed}`, () => {
    const r = rngOf(seed * 29);
    const archive = Array.from({ length: 5 }, (_, i) => safeEntry(r, i));
    const L = makeLegacy({ archive: J(archive) });
    let mine = J(archive);
    for (let step = 0; step < 10; step++) {
      const target = r() < 0.8 ? pick(r, mine).id : 999999;
      const f = randForm(r, { title: r() < 0.85 });
      applyForm(L, f);
      L.dom.els.wsEditBar = { ...L.dom.els.wsEditBar, dataset: { editId: String(target) }, style: {} };
      const a0 = L.log.alerts.length;
      L.run('wsUpdateEntry()');
      const res = W.updateEntry(mine, target, f, NOW);
      if (!res) { assert.equal(L.log.alerts.at(-1), W.MSG.TITLE_FIRST_UPDATE); assert.equal(L.log.alerts.length, a0 + 1); }
      else {
        mine = res.archive;
        assert.equal(L.log.alerts.at(-1), W.MSG.UPDATED(String(f.title).trim()));
      }
      assert.deepEqual(J(L.appData.workshopsArchive), J(mine), 'الأرشيف بعد التحديث ' + step);
      if (res) { // wsCancelEdit: كل الحقول والخيارات والصور فارغة، والتاريخ اليوم، والأقسام كما هي
        const want = W.formAfterCancel(f, NOW);
        for (const [k, id] of Object.entries(TEXT_IDS)) assert.equal(L.dom.fields[id].value, want[k], 'بعد الإلغاء: ' + k);
        assert.ok(Object.values(L.dom.groups).flat().every((e) => !e.checked));
        assert.deepEqual(J(L.sandbox._wsPhotos), []);
        assert.deepEqual(classesOf(L), want.classes);
        assert.equal(String(L.dom.els.ws_total_count.textContent), '0');
      }
    }
  });
}

test('wsUpdateEntry: بلا شريط تعديل (معرّف غائب) لا يحدث شيء، ولا تنبيه', () => {
  const L = makeLegacy({ archive: [] });
  applyForm(L, { ...W.blankForm('2026-10-24', 'م'), title: 'ورشة' });
  L.dom.els.wsEditBar = { dataset: {}, style: {}, classList: { add() {}, remove() {}, contains: () => false } };
  L.run('wsUpdateEntry()');
  assert.equal(L.log.alerts.length, 0);
  assert.deepEqual(J(L.appData.workshopsArchive), []);
});

// ── الأرشيف: العرض والبحث والحذف والمسح ──
function parseList(html) {
  const rows = html.split('<tr>').slice(2);
  const cell = (tr) => [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
  const text = (x) => x.replace(/<[^>]+>/g, '').trim();
  return rows.map((tr) => {
    const c = cell(tr);
    return { n: c[0], title: text(c[1]), type: text(c[2]), school: text(c[3]), date: text(c[4]).replace('📅', '').trim(), total: text(c[5]).replace('👤', '').trim(), result: text(c[6]), color: (c[6].match(/background:([^;]+);/) || [])[1] };
  });
}
for (const seed of [41, 42, 43, 44]) {
  test(`مطابقة للقديم: renderWsArchive والبحث seed=${seed}`, () => {
    const r = rngOf(seed * 17);
    const titles = ['ورشة الوقاية', 'نشاط رياضي', 'رحلة إلى الرباط', 'ORIENTATION day', 'برنامج جماعي'];
    const archive = Array.from({ length: 9 }, (_, i) => ({ ...safeEntry(r, i), title: pick(r, titles) + ' ' + i, school: pick(r, ['—', 'إعدادية الأمل', 'ثانوية النور']), result: pick(r, ['ناجح بامتياز', 'ناجح', 'متوسط', 'يحتاج تحسيناً', '—', 'قديم']) }));
    const L = makeLegacy({ archive: J(archive) });
    for (const q of ['', ' ', 'ورشة', 'orientation', '  رحلة ', 'لا يوجد', '3', 'الأمل', 'نشاط تربوي']) {
      L.dom.els.wsArchiveSearch = { value: q };
      L.run('renderWsArchive()');
      assert.equal(L.dom.els.wsArchiveCount.textContent, archive.length);
      const shown = W.filterArchive(archive, q);
      const html = L.dom.els.wsArchiveList.innerHTML;
      if (!shown.length) {
        assert.ok(html.includes(q.trim() ? W.MSG.NO_RESULTS : W.MSG.EMPTY_LIST), 'رسالة الفراغ «' + q + '»');
        continue;
      }
      const mine = shown.map((e, i) => ({
        n: String(i + 1), title: `${W.TYPE_ICONS[e.type] || '🎓'} ${e.title}`, type: e.type || '—', school: e.school && e.school !== '—' ? e.school : '—',
        date: e.date, total: String(W.totalOf(e)), result: e.result, color: W.RESULT_COLORS[e.result] || '#64748b',
      }));
      assert.deepEqual(parseList(html), mine, 'بحث «' + q + '»');
    }
  });
}

test('renderWsArchive: الأرشيف الفارغ يعرض رسالة الفراغ مع التلميح', () => {
  const L = makeLegacy({ archive: [] });
  L.dom.els.wsArchiveSearch = { value: '' };
  L.run('renderWsArchive()');
  const html = L.dom.els.wsArchiveList.innerHTML;
  assert.ok(html.includes(W.MSG.EMPTY_LIST) && html.includes(W.MSG.EMPTY_HINT));
});

test('مطابقة للقديم: deleteWsEntry وclearWsArchive (النصوص والنتائج)', () => {
  const r = rngOf(5);
  const archive = Array.from({ length: 5 }, (_, i) => safeEntry(r, i));
  const L = makeLegacy({ archive: J(archive) });
  L.run(`deleteWsEntry(${archive[2].id})`);
  assert.equal(L.log.confirms.at(-1), W.MSG.CONFIRM_DELETE);
  assert.deepEqual(J(L.appData.workshopsArchive), J(W.deleteEntry(archive, archive[2].id)));
  L.run('clearWsArchive()');
  assert.equal(L.log.confirms.at(-1), W.MSG.CONFIRM_CLEAR_ARCHIVE);
  assert.deepEqual(J(L.appData.workshopsArchive), []);
  L.run('clearWsArchive()'); // القديم يطلب التأكيد حتى لو كان الأرشيف فارغاً (حذف + مسح + مسح = 3 تأكيدات)
  assert.equal(L.log.confirms.length, 3);
  assert.equal(L.log.confirms.at(-1), W.MSG.CONFIRM_CLEAR_ARCHIVE);
});

// ── أول فتح (initWorkshops) ──
test('مطابقة للقديم: initWorkshops (التاريخ والمؤسسة من الملف الشخصي، مرة واحدة)', () => {
  for (const [date, school, inst] of [['', '', 'إعدادية الأمل'], ['2026-01-01', 'م', 'إعدادية الأمل'], ['', 'م', ''], ['', '', ''], ['2026-02-02', '', '']]) {
    const L = makeLegacy({ archive: [], profile: inst ? { institution: inst } : {} });
    L.dom.fields.ws_date.value = date; L.dom.fields.ws_school.value = school;
    L.run('initWorkshops()');
    const want = W.initFields(date, school, inst, NOW);
    assert.equal(L.dom.fields.ws_date.value, want.date);
    assert.equal(L.dom.fields.ws_school.value, want.school);
  }
});

// ── الأقسام (chips) ──
test('مطابقة للقديم: إضافة الأقسام وحذفها وتحميلها من نص', () => {
  const r = rngOf(77);
  const L = makeLegacy();
  let mine = [];
  for (let i = 0; i < 40; i++) {
    const op = pick(r, ['add', 'add', 'add', 'remove', 'set']);
    if (op === 'add') {
      const val = pick(r, ['', ...CLASSES]);
      L.dom.fields.ws_classes_select.value = val;
      L.run('wsAddClassFromSelect()');
      mine = W.addClass(mine, val);
      assert.equal(L.dom.fields.ws_classes_select.value, val ? '' : '', 'القائمة تعود فارغة');
    } else if (op === 'remove') {
      const val = pick(r, CLASSES);
      L.run(`wsRemoveClass(${JSON.stringify(val)})`);
      mine = W.removeClass(mine, val);
    } else {
      const str = pick(r, ['', '—', '1APIC-1، 2APIC-3', '1APIC-1,2APIC-3', ' a ،، b ', undefined]);
      L.sandbox.__s = str;
      L.run('wsSetClassesFromString(__s)');
      mine = W.classesFromString(str);
    }
    assert.deepEqual(classesOf(L), mine, 'خطوة ' + i);
    assert.equal(L.dom.fields.ws_classes.value, mine.join(W.CLASS_SEP));
  }
});

// ── الصور ──
test('مطابقة للقديم: wsAddPhotos (الحد الأقصى والتجاهل والفشل والتنبيهات)', async () => {
  const r = rngOf(31);
  for (let round = 0; round < 25; round++) {
    const L = makeLegacy();
    const start = Math.floor(r() * 13);
    L.sandbox._wsPhotos = Array.from({ length: start }, (_, i) => PHOTO(i));
    L.run('wsCompressImage = function (f) { return f.fail ? Promise.reject(new Error("x")) : Promise.resolve("data:" + f.name); }');
    const files = Array.from({ length: Math.floor(r() * 9) }, (_, i) => ({ type: r() < 0.2 ? 'text/plain' : 'image/png', name: 'f' + i, fail: r() < 0.2 }));
    L.sandbox.__files = files;
    await L.run('wsAddPhotos(__files)');
    // نفس القرارات عبر دوال المنطق الجديدة (ما يفعله المكوّن)
    let mine = Array.from({ length: start }, (_, i) => PHOTO(i));
    const alerts = [];
    const plan = W.photoAddPlan(mine.length, files);
    if (plan.kind !== 'ok') alerts.push(plan.alert);
    else {
      let failed = 0;
      for (const f of plan.files) { if (f.fail) failed++; else mine.push('data:' + f.name); }
      const m = W.photoAddMessage(plan.skipped, failed);
      if (m) alerts.push(m);
    }
    assert.deepEqual(J(L.sandbox._wsPhotos), mine, 'الصور جولة ' + round);
    assert.deepEqual(L.log.alerts, alerts, 'التنبيهات جولة ' + round);
  }
});

test('مطابقة للقديم: wsRemovePhoto وwsClearPhotos', () => {
  const L = makeLegacy();
  L.sandbox._wsPhotos = [PHOTO(0), PHOTO(1), PHOTO(2)];
  L.run('wsRemovePhoto(1)');
  assert.deepEqual(J(L.sandbox._wsPhotos), [PHOTO(0), PHOTO(2)]);
  L.run('wsClearPhotos()');
  assert.equal(L.log.confirms.at(-1), W.MSG.CONFIRM_CLEAR_PHOTOS);
  assert.deepEqual(J(L.sandbox._wsPhotos), []);
  L.run('wsClearPhotos()'); // لا صور → لا تأكيد
  assert.equal(L.log.confirms.length, 1);
});

for (const seed of [51, 52, 53, 54, 55, 56]) {
  test(`مطابقة للقديم: توزيع الصور وكتلة الصور في التقرير seed=${seed}`, () => {
    const r = rngOf(seed * 13);
    const L = makeLegacy();
    for (let n = 1; n <= 12; n++) {
      const ratios = Array.from({ length: n }, () => 0.5 + r() * 2);
      L.sandbox.__ratios = ratios;
      assert.deepEqual(J(L.run('wsLayoutPhotos(__ratios)')), W.layoutPhotos(ratios), 'توزيع ' + n + ' صور');
      const photos = ratios.map((_, i) => PHOTO(i));
      const map = {};
      photos.forEach((p, i) => { if (r() < 0.7) map[p] = ratios[i]; });
      L.sandbox._wsPhotos = photos; L.sandbox._wsRatios = map;
      assert.equal(L.run('wsPhotosReportHtml("عنوان &amp; ورشة")'), W.photosReportHtml('عنوان &amp; ورشة', photos, map), 'كتلة ' + n);
    }
    L.sandbox._wsPhotos = [];
    assert.equal(L.run('wsPhotosReportHtml("x")'), '');
    assert.equal(W.photosReportHtml('x', []), '');
  });
}

test('تصدير Word يعتمد على أصناف كتلة الصور وسمتي data-w/data-h', () => {
  const html = W.photosReportHtml('ع', [PHOTO(0), PHOTO(1)], {});
  for (const needle of ['ws-photos-page', 'ws-photos-title', 'ws-photo-row', 'ws-photo-item', 'data-w="', 'data-h="']) assert.ok(html.includes(needle), needle);
});

// ── الاقتراحات السريعة (appendSuggest) ──
test('مطابقة للقديم: appendSuggest', () => {
  const L = makeLegacy();
  for (const cur of ['', '   ', 'نص', 'نص   \n', '  نص ']) {
    const el = { value: cur, focus() {} };
    L.dom.fields.ws_objectives = el;
    L.run(`appendSuggest('ws_objectives', 'جملة')`);
    assert.equal(el.value, W.appendSuggest(cur, 'جملة'));
  }
});

// ── الخيارات والاقتراحات مطابقة للقالب القديم حرفياً ──
test('الخيارات والتسميات مطابقة لنموذج HTML القديم', () => {
  const groups = { ws_type: W.TYPE_OPTIONS, ws_theme: W.THEME_OPTIONS, ws_place: W.PLACE_OPTIONS, ws_organizer: W.ORGANIZER_OPTIONS, ws_target: W.TARGET_OPTIONS, ws_tools: W.TOOL_OPTIONS, ws_result: W.RESULT_OPTIONS };
  for (const [name, opts] of Object.entries(groups)) {
    const found = [...template.matchAll(new RegExp(`<label><input type="(?:radio|checkbox)" name="${name}" value="([^"]*)">\\s*([^<]*)</label>`, 'g'))].map((m) => [m[1], m[2].trim()]);
    assert.deepEqual(found, opts, name);
  }
});

test('أزرار الاقتراحات السريعة مطابقة للنموذج القديم', () => {
  for (const [id, chips] of [['ws_objectives', W.OBJECTIVE_CHIPS], ['ws_summary', W.SUMMARY_CHIPS], ['ws_notes', W.NOTES_CHIPS]]) {
    const found = [...template.matchAll(new RegExp(`appendSuggest\\('${id}','([^']*)'\\)">([^<]*)</button>`, 'g'))].map((m) => [m[2].trim(), m[1]]);
    assert.deepEqual(found, chips, id);
  }
});

test('الأنواع/الألوان/الأيقونات تغطي كل خيارات النتيجة والنوع', () => {
  for (const [val] of W.RESULT_OPTIONS) assert.ok(W.RESULT_COLORS[val], val);
  for (const [val] of W.TYPE_OPTIONS) assert.ok(W.TYPE_ICONS[val], val);
});

test('الترتيب: الخيارات المتعددة بترتيب النموذج لا بترتيب النقر', () => {
  const f = { ...W.blankForm(), title: 'ورشة', themes: ['ثقافة المواطنة', 'الوقاية من العنف'], tools: ['استمارة تقييم', 'عرض PowerPoint'] };
  const e = W.saveEntry([], f, NOW).entry;
  assert.deepEqual(e.theme, ['الوقاية من العنف', 'ثقافة المواطنة']);
  assert.deepEqual(e.tools, ['عرض PowerPoint', 'استمارة تقييم']);
  assert.ok(W.reportHtml(f).includes('الوقاية من العنف / ثقافة المواطنة'));
});
