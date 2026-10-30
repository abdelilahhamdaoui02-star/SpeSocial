// منطق بوابتي «التواصل مع الأولياء» و«المتابعة وتتبع الحالات» — دوال نقية (لا DOM ولا window ولا مخزن).
// منقول من mkGate / pgPrintReportInner / معالج الاستيراد / updateFollowBadge في script-10.js.
// النسخة القديمة المجمَّدة في tests/fixtures/pg.step10.js، ويقارن بها tests/gates.parity.test.js.

// ── التهريب: القديم يستعمل دالتين مختلفتين، ونحافظ على الفرق حرفياً ──
// _esc: خلايا الجدول على الشاشة (تهرّب علامة الاقتباس المزدوجة أيضاً)
export const esc = (v) => String(v == null ? '' : v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// iEsc: صفحة المعاينة والطباعة (لا تهرّب علامة الاقتباس)
export const iEsc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const RES = ['لم يتم الاتصال بعد', 'تم الرد', 'لم يرد', 'رقم خاطئ / خارج الخدمة', 'طلب معاودة الاتصال', 'وعد بالحضور'];

export const DONE_STATUS = 'تمت المعالجة';
export const NO_RECORDS_TEXT = 'لا توجد سجلات.';

// ── تعريف البوابات الثلاث (منقول حرفياً من initParents / initFollowup) ──
// tool: معرّف البوابة في openTool؛ box: بادئة معرّفات الحقول (pgCalls_name …) وعليها يعتمد الإكمال التلقائي القديم acSetup
export const GATES = {
  calls: {
    id: 'calls', tool: 'parents',
    box: 'pgCalls', key: 'parentCalls', req: 'name', ac: { nameId: 'pgCalls_name', massarId: 'pgCalls_massar', levelId: 'pgCalls_cls', schoolId: 'pgCalls_school' }, imp: 1,    file: 'الاتصال-بالأولياء', print: 'سجل الاتصال الهاتفي بأولياء الأمور', title: '📞 سجل الاتصال الهاتفي بأولياء الأمور',
    fields: [
      { k: 'name', l: 'اسم التلميذ' }, { k: 'massar', l: 'رقم المسار' }, { k: 'phone', l: 'هاتف ولي الأمر', t: 'tel' }, { k: 'time', l: 'وقت الاتصال', t: 'time' },
      { k: 'name', l: 'اسم التلميذ' }, { k: 'massar', l: 'رقم المسار' }, { k: 'cls', l: 'القسم' }, { k: 'school', l: 'المؤسسة' }, { k: 'phone', l: 'هاتف ولي الأمر', t: 'tel' }, { k: 'time', l: 'وقت الاتصال', t: 'time' },    ],
  },
  meet: {
    id: 'meet', tool: 'parents',
    box: 'pgMeet', key: 'parentMeetings', req: 'student', ac: { nameId: 'pgMeet_student', levelId: 'pgMeet_cls' },
    file: 'مقابلات-الأولياء', print: 'سجل مقابلات أولياء الأمور', title: '🤝 مقابلة مع ولي أمر',
    fields: [
      { k: 'student', l: 'الاسم الكامل للتلميذ' }, { k: 'cls', l: 'القسم' }, { k: 'parent', l: 'الاسم الكامل لولي الأمر' }, { k: 'cin', l: 'رقم البطاقة الوطنية' },
      { k: 'job', l: 'المهنة' }, { k: 'date', l: 'تاريخ المقابلة', t: 'date' }, { k: 'subject', l: 'موضوع المقابلة', t: 'area', wide: 1 },
    ],
  },
  fu: {
    id: 'fu', tool: 'followup',
    box: 'pgFu', key: 'followUp', req: 'name', ac: { nameId: 'pgFu_name', massarId: 'pgFu_massar', levelId: 'pgFu_cls' },
    file: 'سجل-المتابعة', print: 'سجل المتابعة وتتبع الحالات', title: '🔔 تتبع الحالات',
    fields: [
      { k: 'name', l: 'اسم التلميذ' }, { k: 'massar', l: 'رقم المسار' }, { k: 'cls', l: 'القسم' },
      { k: 'status', l: 'الحالة', opts: ['قيد المتابعة', 'تعثر / يستدعي تدخلًا', 'تحسن', DONE_STATUS], badge: 1 },
      { k: 'date', l: 'تاريخ المتابعة', t: 'date' }, { k: 'note', l: 'ملاحظة المتابعة', t: 'area', wide: 1 },
    ],
  },
};

// ── البحث ──
// القديم يطابق على JSON.stringify(السجل كله): فيطابق أسماء الحقول والمعرّف أيضاً، لا القيم فقط. نبقي ذلك كما هو.
export const matchesQuery = (row, q) => !q || JSON.stringify(row).indexOf(q) !== -1;
export const filterRows = (rows, q) => rows.filter((r) => matchesQuery(r, q));

// ── الجدول ──
// رقم لون الشارة: موقع القيمة في خيارات الحقل، والقيمة المجهولة تأخذ الأول، ثم باقي القسمة على 4
export const badgeIndex = (field, value) => Math.max(field.opts.indexOf(value), 0) % 4;

// نموذج الجدول: كل صف { id, n, cells:[{text, badge}] } — n ترقيم الصفوف بعد التصفية (يبدأ من 1)
export function tableModel(gate, rows, q) {
  return filterRows(rows, q).map((r, i) => ({
    id: r.id,
    n: i + 1,
    cells: gate.fields.map((f) => {
      const v = r[f.k] || '';
      return { text: String(v), badge: f.badge ? badgeIndex(f, v) : null };
    }),
  }));
}

// ── الاستمارة ──
// القيم الابتدائية بعد «إلغاء» أو الحفظ: تاريخ اليوم للتواريخ، وأول خيار للقوائم، وفارغ لغير ذلك
// (القديم يحسب تاريخ اليوم بـ toISOString أي بالتوقيت العالمي UTC؛ نبقي ذلك)
export function defaultValues(gate, now = new Date()) {
  const out = {};
  for (const f of gate.fields) out[f.k] = f.t === 'date' ? now.toISOString().slice(0, 10) : (f.opts ? f.opts[0] : '');
  return out;
}

// قيم الاستمارة عند التعديل
export function editValues(gate, row) {
  const out = {};
  for (const f of gate.fields) out[f.k] = row[f.k] || '';
  return out;
}

// قراءة المسودة من الحقول مع قصّ الفراغات
export function readDraft(gate, getValue) {
  const d = {};
  for (const f of gate.fields) d[f.k] = String(getValue(f.k)).trim();
  return d;
}

// null إن كانت المسودة صالحة، وإلا نص التنبيه
export function validateDraft(gate, d) {
  if (d[gate.req]) return null;
  return '⚠️ الحقل «' + gate.fields.find((f) => f.k === gate.req).l + '» إجباري.';
}

export const makeRecordId = () => Date.now() + '' + Math.floor(Math.random() * 99);

// حفظ مسودة: تعديل في مكانه إن وُجد editId، وإلا سجل جديد في أول القائمة. تُعيد مصفوفة جديدة ولا تعدّل المدخلة.
export function saveRows(rows, draft, editId, makeId = makeRecordId) {
  if (editId) return rows.map((r) => (String(r.id) === String(editId) ? Object.assign({}, r, draft) : r));
  return [Object.assign({ id: makeId() }, draft), ...rows];
}

export const findRow = (rows, id) => rows.find((x) => String(x.id) === String(id));
export const removeRow = (rows, id) => rows.filter((x) => String(x.id) !== String(id));

// ── الاستيراد من Excel (بوابة الاتصال فقط) ──
// sheetRows: صفوف الورقة الأولى كما تعيدها XLSX.utils.sheet_to_json(..., { header: 1, defval: '' })
// تُعيد { rows, added }: السجلات الجديدة تُضاف في نهاية القائمة (لا أولها)، وتُتجاهل المكررة (الاسم + الهاتف) حتى داخل الملف نفسه.
export function parseImport(gate, existing, sheetRows, now = Date.now()) {
  const h = (sheetRows[0] || []).map((x) => String(x));
  const hasH = h.some((x) => /[^\d\s]/.test(x) && /(اسم|مسار|هاتف|phone|name|massar|tel)/i.test(x));
  const ix = (re) => { const i = h.findIndex((x) => re.test(x)); return hasH ? i : -1; };
  let cn = ix(/اسم|name|nom/i);
  let cm = ix(/مسار|massar|code/i);
  let cp = ix(/هاتف|phone|tel|gsm|mobile|رقم/i);
  if (cn < 0) cn = 0;
  if (cm < 0) cm = 1;
  if (cp < 0) cp = 2;
  const firstResult = gate.fields.find((f) => f.k === 'result').opts[0];
  const rows = existing.slice();
  let n = 0;
  sheetRows.slice(hasH ? 1 : 0).forEach((r) => {
    const name = String(r[cn] || '').trim();
    let ph = String(r[cp] || '').replace(/\D/g, '');
    if (ph.length === 9) ph = '0' + ph;
    if (!name && !ph) return;
    if (rows.some((x) => x.name === name && x.phone === ph)) return;
    rows.push({ id: now + '' + n++, name, massar: String(r[cm] || '').trim(), phone: ph, time: '', result: firstResult, notes: '', date: '' });
  });
  return { rows, added: n };
}

// ── المعاينة والطباعة ──
// ctx: { logo, directorate, institution, today } تُحقن من الخارج (الشعار من window، والمديرية من الملف الشخصي، والتاريخ من الساعة)
export function reportHtml(title, fields, rows, ctx) {
  const th = 'padding:6px 8px;text-align:center;border:1px solid #000;background:#fff;color:#000;font-weight:800;-webkit-print-color-adjust:exact;print-color-adjust:exact;';
  const td = 'padding:5px 8px;border:1px solid #cbd5e1;vertical-align:top;overflow-wrap:anywhere;';
  const body = rows.length
    ? rows.map((r, i) => '<tr><td style="' + td + 'text-align:center;">' + (i + 1) + '</td>' + fields.map((f) => '<td style="' + td + '">' + (iEsc(r[f.k]) || '—') + '</td>').join('') + '</tr>').join('')
    : '<tr><td colspan="' + (fields.length + 1) + '" style="' + td + 'text-align:center;">' + NO_RECORDS_TEXT + '</td></tr>';
  const logo = ctx.logo || '';
  return '<div class="new-report-header"><div class="nrh-logo">' + (logo ? '<img id="ministry-logo-img" src="' + logo + '" alt="شعار الوزارة" style="width:100%;height:auto;max-height:160px;object-fit:contain;display:block;background:white;">' : '') + '</div>' +
    '<div class="nrh-dir">' + iEsc(ctx.directorate) + '</div><div class="nrh-school">' + iEsc(ctx.institution || 'المؤسسة التعليمية') + '</div><div class="nrh-title">' + iEsc(title) + '</div></div>' +
    '<div class="report-section-title">عدد السجلات: ' + rows.length + ' — بتاريخ ' + ctx.today + '</div>' +
    '<table class="proc-table-report" style="width:100%;border-collapse:collapse;font-size:0.8rem;font-family:\'Cairo\',sans-serif;"><thead><tr><th style="' + th + 'width:4%;">#</th>' + fields.map((f) => '<th style="' + th + '">' + f.l + '</th>').join('') + '</tr></thead><tbody>' + body + '</tbody></table>' +
    '<div class="signatures"><div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div><div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div></div>';
}

// عنوان نافذة المعاينة، واسم الملف الافتراضي عند التصدير إلى Word (الفراغات ← _)
export function printTitle(title) {
  return { text: '📄 ' + title, file: title.replace(/\s+/g, '_') };
}

// اسم المديرية: school في الملف الشخصي وإلا الافتراضي (كما في getDirectorate القديمة)
export const directorateOf = (profile) => (profile && profile.school) ? profile.school : 'مديرية الحي الحسني';

// ── شارة المتابعة على بلاطة البوابة ──
export const followCount = (rows) => (rows || []).filter((r) => r.status !== DONE_STATUS).length;
