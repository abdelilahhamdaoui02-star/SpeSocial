// منطق بوابة «حالات العنف» — دوال بحتة بلا DOM، منقولة حرفياً من كتلة العنف في script-16.js القديم.
// بقيت في الكود القديم عمداً: getVioArchive وsaveVioArchive (يقرؤهما التقرير الأسبوعي والجدول الشهري في script-10.js)
// وautoLogTask (سجل المهام). اختبار المطابقة: tests/violence.parity.test.js.

// الإجراءات الخمسة الثابتة (المفتاح = data-key في الجدول القديم)
export const VIO_PROCS = [
  { key: 'listening', name: 'جلسة استماع مع الضحية', label: '🗣️ جلسة استماع مع الضحية', ph: 'مدة الجلسة وملخصها...' },
  { key: 'parent', name: 'التواصل مع ولي الأمر', label: '👨‍👩‍👧 التواصل مع ولي الأمر', ph: 'طريقة التواصل واستجابة ولي الأمر...' },
  { key: 'admin', name: 'إخبار وتنسيق مع إدارة المؤسسة', label: '🏫 إخبار وتنسيق مع إدارة المؤسسة', ph: 'الجهة المُخبَرة (المدير، الحارس العام...)' },
  { key: 'external', name: 'إحالة إلى جهات خارجية مختصة', label: '🏛️ إحالة إلى جهات خارجية مختصة', ph: 'الجهة المُحال إليها ووضعية الإحالة...' },
  { key: 'mediation', name: 'وساطة وإصلاح ذات البين', label: '🤝 وساطة وإصلاح ذات البين', ph: 'الحاضرون ونتيجة الوساطة...' },
];

// الخيارات بترتيب ظهورها في النموذج: getChecked القديمة تُرجع القيم بترتيب الـDOM لا بترتيب النقر
export const TYPE_OPTIONS = [
  ['عنف جسدي', '🤜 جسدي'], ['عنف لفظي / نفسي', '💬 لفظي / نفسي'], ['عنف إلكتروني (تنمر رقمي)', '📱 إلكتروني'], ['عنف أسري', '🏠 أسري'],
  ['تحرش', '⚠️ تحرش'], ['إقصاء واستبعاد اجتماعي', '🚫 إقصاء اجتماعي'], ['ابتزاز', '💸 ابتزاز'], ['غير محدد', '❓ غير محدد'],
];
export const LOCATION_OPTIONS = [
  ['داخل الفصل', '🏫 داخل الفصل'], ['فناء المؤسسة', '🏟 الفناء'], ['خارج المؤسسة', '🚶 خارج المؤسسة'], ['المنزل', '🏠 المنزل'], ['الفضاء الرقمي', '📱 الفضاء الرقمي'],
];
export const SOURCE_OPTIONS = [
  ['التلميذ(ة) نفسه(ا)', '🧒 التلميذ(ة)'], ['ولي الأمر', '👨‍👩 ولي الأمر'], ['أستاذ', '👨‍🏫 أستاذ'], ['إدارة المؤسسة', '🏫 الإدارة'], ['زميل للضحية', '👤 زميل'], ['رصد مباشر من المختص', '👁 رصد مباشر'],
];
export const PRIORITY_OPTIONS = [['عادية', '🟢 عادية'], ['متوسطة', '🟡 متوسطة'], ['عالية', '🟠 عالية'], ['عاجلة', '🔴 عاجلة']];
export const PRIO_COLORS = { 'عاجلة': '#dc2626', 'عالية': '#d97706', 'متوسطة': '#ca8a04', 'عادية': '#16a34a' };

export const MSG = {
  NAME_FIRST: '⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.',
  CONFIRM_CLEAR_ALL: 'هل أنت متأكد من مسح جميع البيانات؟',
  CONFIRM_DELETE: 'حذف هذا الملف؟',
  EMPTY_ARCHIVE: '📂 الأرشيف فارغ بالفعل.',
  EMPTY_LIST: '📂 لا توجد ملفات محفوظة بعد.',
  CONFIRM_CLEAR_ARCHIVE: (n) => `⚠️ تحذير: سيتم حذف جميع ملفات العنف المدرسي (${n} ملف) نهائياً.\n\nهل أنت متأكد من المسح الكامل؟`,
  UPDATED: (name) => `✅ تم تحديث ملف حالة العنف لـ "${name}" في الأرشيف بنجاح.`,
};

export const iEsc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const todayIso = (d = new Date()) => d.toISOString().slice(0, 10);

// ── جدول الإجراءات ──
// صف = { key?, custom, name, checked, date, notes }؛ الخمسة الثابتة أولاً ثم المضافة بالترتيب (كإلحاق tbody القديم)
export const blankProcRows = () => VIO_PROCS.map((p) => ({ key: p.key, custom: false, name: p.name, checked: false, date: '', notes: '' }));
export const newCustomRow = () => ({ custom: true, name: '', checked: false, date: '', notes: '' });

// iAutoCheck القديمة: الكتابة في خانة تحدّد مربع الصف (ولا تُلغي التحديد أبداً)
export function editProcRow(rows, idx, field, value) {
  return rows.map((r, i) => {
    if (i !== idx) return r;
    const next = { ...r, [field]: value };
    if (field !== 'checked' && String(value).trim()) next.checked = true;
    return next;
  });
}

// vioProcDetails: المخصَّص يُحفظ إن كان له اسم (حتى بلا تحديد)، والثابت إن كان محدداً
export function procDetails(rows) {
  const out = [];
  rows.forEach((r) => {
    const date = r.date || '';
    const notes = (r.notes || '').trim();
    if (r.custom) {
      const name = (r.name || '').trim();
      if (name) out.push({ custom: true, name, date, notes });
    } else if (r.checked) {
      const p = VIO_PROCS.find((x) => x.key === r.key);
      if (p) out.push({ key: p.key, name: p.name, date, notes });
    }
  });
  return out;
}

// vioRestoreProcRows: يعيد الجدول فارغاً ثم يملأ؛ الصفوف المحمَّلة كلها محدَّدة، والمفتاح المجهول يُتجاهل
export function restoreProcRows(saved) {
  const rows = blankProcRows();
  (saved || []).forEach((r) => {
    if (r.custom) { rows.push({ custom: true, name: r.name || '', checked: true, date: r.date || '', notes: r.notes || '' }); return; }
    const row = rows.find((x) => !x.custom && x.key === r.key);
    if (!row) return;
    row.date = r.date || '';
    row.notes = r.notes || '';
    row.checked = true;
  });
  return rows;
}

// ── النموذج ──
// form: نصوص الحقول كما في DOM (تُقصّ هنا كـval القديمة) + types/sources/location/priority + procRows
export const blankForm = (date = '', school = '') => ({
  studentName: '', level: '', massar: '', aggName: '', aggLevel: '', aggMassar: '', reportDate: date, school, parentPhone: '',
  description: '', recommendation: '', types: [], sources: [], location: '', priority: '', procRows: blankProcRows(),
});

const v = (x) => String(x == null ? '' : x).trim();
// القيم المحدَّدة بترتيب الخيارات في النموذج (getChecked القديمة)
export const inDomOrder = (options, selected) => options.map((o) => o[0]).filter((x) => (selected || []).includes(x));

function entryFrom(f, id, savedAt) {
  const studentName = v(f.studentName);
  return {
    id, savedAt,
    studentName, massar: v(f.massar) || '—',
    aggName: v(f.aggName) || '—', aggLevel: v(f.aggLevel) || '—', aggMassar: v(f.aggMassar) || '—',
    school: v(f.school) || '—', level: v(f.level) || '—',
    parentPhone: v(f.parentPhone) || '—',
    reportDate: v(f.reportDate) || '—',
    types: inDomOrder(TYPE_OPTIONS, f.types), severity: '—',
    location: f.location || '—',
    description: v(f.description),
    currentStatus: '—',
    priority: f.priority || '—',
    recommendation: v(f.recommendation),
    nextFollowup: '—',
    procRows: procDetails(f.procRows || []),
  };
}

// vioSaveToArchive: null إن غاب الاسم؛ وإلا { entry, archive } (الجديد في الأول)
export function saveEntry(archive, f, now = new Date()) {
  if (!v(f.studentName)) return null;
  const entry = entryFrom(f, now.getTime(), now.toLocaleString('ar-MA'));
  return { entry, archive: [entry, ...archive] };
}

// معاملات autoLogTask بعد كل حفظ
export function taskLogArgs(entry) {
  return ['أخرى', 'حالة عنف — ' + entry.studentName, entry.studentName, entry.school, `نوع العنف: ${(entry.types || []).join(' / ')}`, 'مُنجز', entry.reportDate !== '—' ? entry.reportDate : undefined];
}

// vioUpdateEntry: يستبدل بالمعرّف، وإن لم يوجد يُضاف في الأول (كالقديم)؛ null إن غاب الاسم أو المعرّف
export function updateEntry(archive, id, f, now = new Date()) {
  if (!id || !v(f.studentName)) return null;
  const entry = entryFrom(f, id, now.toLocaleString('ar-MA') + ' (معدَّل)');
  const idx = archive.findIndex((e) => e.id === id);
  const next = archive.slice();
  if (idx !== -1) next[idx] = entry; else next.unshift(entry);
  return { entry, archive: next };
}

const dash = (x) => (x && x !== '—' ? x : '');

// vioLoadEntry: قيم الحقول من سجل محفوظ (الشرطة «—» تصير فارغة). مصادر الإبلاغ لا تُمسّ (لا تُحفظ في السجل)
export function formFromEntry(e) {
  return {
    studentName: e.studentName || '', massar: dash(e.massar), aggName: dash(e.aggName), aggLevel: dash(e.aggLevel), aggMassar: dash(e.aggMassar),
    school: dash(e.school), level: dash(e.level), parentPhone: dash(e.parentPhone), reportDate: dash(e.reportDate),
    description: e.description || '', recommendation: e.recommendation || '',
    // القيمة غير المطابقة لأي خيار (مثل «—») لا تحدّد شيئاً، فيقرأها القديم فارغة
    location: LOCATION_OPTIONS.some((o) => o[0] === e.location) ? e.location : '',
    priority: PRIORITY_OPTIONS.some((o) => o[0] === e.priority) ? e.priority : '',
    types: e.types || [], procRows: restoreProcRows(e.procRows),
  };
}

// بحث الأرشيف: باسم التلميذ فقط (القديم يستدعي studentName.toLowerCase مباشرة)
export function filterArchive(archive, search) {
  const s = String(search || '').trim().toLowerCase();
  return s ? archive.filter((e) => e.studentName.toLowerCase().includes(s)) : archive;
}

export function deleteEntry(archive, id) { return archive.filter((e) => e.id !== id); }

// ── التقرير (vioGenerateReport) ──
const TBL = "width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;margin-bottom:10px;";

// ctx.logo: شعار الوزارة (القديم يضع src فارغاً ثم يملؤه بعد الإدراج، فالنتيجة النهائية واحدة)
export function reportHtml(f, ctx = {}) {
  const studentName = v(f.studentName);
  const types = inDomOrder(TYPE_OPTIONS, f.types);
  const sources = inDomOrder(SOURCE_OPTIONS, f.sources);
  const procRowsData = procDetails(f.procRows || []);
  const procRows = procRowsData.map((r) => `<tr>
      <td style="font-weight:700;color:#1a3a5c;">${iEsc(r.name)}</td>
      <td style="white-space:nowrap;text-align:center;">${iEsc(r.date) || '—'}</td>
      <td>${iEsc(r.notes) || '—'}</td>
    </tr>`).join('');
  const procedures = procRows ? `<table class="proc-table-report" style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;">
    <thead>
      <tr style="background:#1a3a5c;color:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <th style="padding:6px 10px;text-align:right;border:1px solid #0f2a4a;width:36%;">اسم الإجراء</th>
        <th style="padding:6px 10px;text-align:center;border:1px solid #0f2a4a;width:16%;">التاريخ</th>
        <th style="padding:6px 10px;text-align:right;border:1px solid #0f2a4a;">الملاحظات</th>
      </tr>
    </thead>
    <tbody>${procRows}</tbody>
  </table>` : '';

  const V = (x) => iEsc(v(x)) || '—';
  const incRows = [];
  if (types.length) incRows.push(`<tr><td class="info-lbl">نوع العنف:</td><td class="info-val" colspan="3">${iEsc(types.join(' / '))}</td></tr>`);
  const loc = f.location || '';
  if (loc) incRows.push(`<tr><td class="info-lbl">مكان الحادثة:</td><td class="info-val" colspan="3">${iEsc(loc)}</td></tr>`);
  if (sources.length) incRows.push(`<tr><td class="info-lbl">مصدر الإبلاغ:</td><td class="info-val" colspan="3">${iEsc(sources.join(' / '))}</td></tr>`);
  const hasAgg = v(f.aggName) || v(f.aggLevel) || v(f.aggMassar);
  const priority = f.priority || '';

  return `
 <div class="new-report-header">
 <div class="nrh-logo">
 <img id="ministry-logo-img" src="${ctx.logo || ''}" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;">
 </div>

 <div class="nrh-dir">مديرية الحي الحسني</div>
 <div class="nrh-school">${iEsc(v(f.school)) || 'المؤسسة التعليمية'}</div>
 <div class="nrh-title">تقرير التدخل في حالة عنف مدرسي</div>
 </div>

 <div class="report-section-title">معلومات الشخص الذي تعرّض للعنف</div>
 <table class="info-table-report" style="${TBL}"><tbody>
   <tr><td class="info-lbl">الاسم الكامل:</td><td class="info-val">${iEsc(studentName)}</td><td class="info-lbl">رقم المسار:</td><td class="info-val">${V(f.massar)}</td></tr>
   <tr><td class="info-lbl">المؤسسة التعليمية:</td><td class="info-val">${V(f.school)}</td><td class="info-lbl">القسم:</td><td class="info-val">${V(f.level)}</td></tr>
   <tr><td class="info-lbl">هاتف الولي:</td><td class="info-val">${V(f.parentPhone)}</td><td class="info-lbl">تاريخ الإخبار:</td><td class="info-val">${V(f.reportDate)}</td></tr>
 </tbody></table>

 ${hasAgg ? `<div class="report-section-title">معلومات الشخص المعنِّف</div>
 <table class="info-table-report" style="${TBL}"><tbody>
   <tr><td class="info-lbl">الاسم الكامل:</td><td class="info-val">${V(f.aggName)}</td><td class="info-lbl">رقم المسار:</td><td class="info-val">${V(f.aggMassar)}</td></tr>
   <tr><td class="info-lbl">القسم:</td><td class="info-val" colspan="3">${V(f.aggLevel)}</td></tr>
 </tbody></table>` : ''}

 ${incRows.length ? `<div class="report-section-title">معلومات الحادثة</div>
 <table class="info-table-report" style="${TBL}"><tbody>${incRows.join('')}</tbody></table>` : ''}

 ${v(f.description) ? `<div class="report-section-title">وصف الحادثة</div><div class="report-summary-block">${iEsc(v(f.description))}</div>` : ''}

 ${procRows ? `<div class="report-section-title">الإجراءات المتخذة</div>${procedures}` : ''}

 <div class="report-section-title">الخلاصة والتوصيات</div>
 <table class="info-table-report" style="${TBL}"><tbody>
   <tr><td class="info-lbl">درجة الأولوية:</td><td class="info-val" colspan="3">${iEsc(priority) || '—'}</td></tr>
   <tr><td class="info-lbl">التوصية الختامية:</td><td class="info-val" colspan="3">${V(f.recommendation)}</td></tr>
 </tbody></table>

 <div class="signatures">
 <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
 <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
 </div>

 `;
}
