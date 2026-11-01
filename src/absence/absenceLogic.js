// منطق بوابة «التلاميذ الأكثر غياباً» — دوال بحتة بلا DOM، منقولة من كتلة الغياب في script-11.js وabLoadEntry/abUpdateEntry في script-16.js.
// بقيت في الكود القديم عمداً: getAbArchive/saveAbArchive (يقرؤهما التقرير الأسبوعي في script-10.js؛ أما الجدول الشهري والإشعارات فصارا في src/tracking)،
// وcloseAbModal (زر الإغلاق في نافذة التقرير)، وautoLogTask.
// اختبار المطابقة: tests/absence.parity.test.js.

// arch = الاسم المختصر الذي يُحفظ في entry.procedures؛ name = الاسم الكامل في التقرير؛ label/ph = ما يظهر في الجدول
export const AB_PROCS = [
  { key: 'listening', arch: 'جلسة استماع', name: 'جلسة الاستماع مع التلميذ(ة)', label: '🎧 جلسة الاستماع مع التلميذ(ة)', ph: 'المُجري، ملخص الجلسة، النتيجة...' },
  { key: 'parent_call', arch: 'اتصال بولي الأمر', name: 'اتصال هاتفي بولي الأمر', label: '📞 اتصال هاتفي بولي الأمر', ph: 'المتصل به، موضوع الاتصال، النتيجة...' },
  { key: 'parent_visit', arch: 'استدعاء ولي الأمر', name: 'استدعاء ولي الأمر إلى المؤسسة', label: '🏫 استدعاء ولي الأمر إلى المؤسسة', ph: 'الجهة المستدعية، ملاحظات اللقاء، النتيجة...' },
  { key: 'commitment', arch: 'وثيقة التزام', name: 'توقيع التزام من التلميذ و/أو ولي الأمر', label: '✍️ توقيع التزام من التلميذ و/أو ولي الأمر', ph: 'الطرف الموقّع، مضمون الالتزام...' },
  { key: 'warning', arch: 'إشعار رسمي', name: 'إشعار رسمي / إنذار بالغياب', label: '📨 إشعار رسمي / إنذار بالغياب', ph: 'نوع الإشعار (أول / ثانٍ / إنذار رسمي)، استجابة ولي الأمر...' },
  { key: 'followup', arch: 'متابعة ميدانية', name: 'متابعة ميدانية ورصد التطور', label: '🔄 متابعة ميدانية ورصد التطور', ph: 'مدة المتابعة، نتائج المتابعة، تطور وضعية الغياب...' },
];

// الخيارات بترتيب النموذج: getChecked القديمة تُرجع القيم بترتيب الـDOM لا بترتيب النقر
export const PATTERN_OPTIONS = [
  ['غياب متواصل', '🔴 متواصل'], ['غياب متقطع', '🟠 متقطع'], ['أيام بعينها', '📅 أيام بعينها'], ['غياب صباحي', '🌅 صباحي'], ['عشوائي', '🔀 عشوائي'],
];
export const CAUSE_OPTIONS = [
  ['أسباب أسرية', '🏠 أسرية'], ['أسباب صحية', '🏥 صحية'], ['أسباب اقتصادية', '💰 اقتصادية'], ['أسباب نفسية', '🧠 نفسية'], ['صعوبات دراسية', '📚 دراسية'],
  ['تأثير الأقران', '👥 الأقران'], ['بُعد المؤسسة', '🚌 مسافة'], ['رفض المدرسة', '🚫 رفض المدرسة'], ['غير محدد', '❓ غير محدد'],
];
export const GENDER_OPTIONS = [['ذكر', 'ذكر'], ['أنثى', 'أنثى']];
export const FAMILY_OPTIONS = [['مستقر', 'مستقر'], ['طلاق', 'طلاق'], ['ترمل', 'ترمل'], ['انفصال', 'انفصال']];
export const SEMESTER_OPTIONS = [['الدورة الأولى', 'الدورة الأولى'], ['الدورة الثانية', 'الدورة الثانية']];
export const PRIORITY_OPTIONS = [['عادية', '🟢 عادية'], ['متوسطة', '🟡 متوسطة'], ['عالية', '🟠 عالية'], ['عاجلة', '🔴 عاجلة']];
// ألوان شارة الأولوية في جدول الأرشيف
export const P_COLOR = { 'عاجلة': '#dc2626', 'عالية': '#d97706', 'متوسطة': '#ca8a04', 'عادية': '#16a34a' };

// الاقتراحات الجاهزة (كانت أزرار onclick="appendSuggest(...)")
export const CONTEXT_CHIPS = [
  ['⚠️ تجاوز العتبة', 'يُسجَّل التلميذ(ة) ضمن قائمة الأكثر غياباً هذا الفصل؛ إذ تجاوز(ت) عتبة الغيابات المقررة في النظام الداخلي للمؤسسة.'],
  ['🔴 غيابات غير مبررة', 'رُصدت غيابات متكررة وغير مبررة لدى التلميذ(ة)، لا تقابلها مسوّغات واضحة من ولي الأمر؛ مما يستوجب تدخل المختص الاجتماعي.'],
  ['🏠 ظروف أسرية هشة', 'تبيّن أن الغياب مرتبط بوضعية أسرية هشة؛ إذ تُؤثر الظروف المنزلية تأثيراً مباشراً على انتظام حضور التلميذ(ة).'],
  ['📝 قلق امتحاني', 'يُلاحظ توافق الغيابات مع فترات الاختبارات والفروض الكتابية، مما يُرجَّح معه وجود قلق امتحاني أو صعوبات تعلمية.'],
];
export const REC_CHIPS = [
  ['🔄 متابعة دورية مستمرة', 'يُوصى بمواصلة المتابعة الدورية للتلميذ(ة) من قِبل المختص الاجتماعي وأساتذة المادة، مع رصد أي غياب جديد والتدخل الفوري.'],
  ['🏫 إحالة لمجلس الأساتذة', 'يُقترح إحالة الحالة إلى مجلس الأساتذة لبحث أسباب الغياب المتكرر، واتخاذ الإجراءات التربوية اللازمة بصفة جماعية.'],
  ['🚨 تدخل عاجل متعدد الأطراف', 'يُوصى بالتدخل العاجل وإشراك جميع الشركاء (الأسرة، الإدارة، المرشد التربوي) لوضع خطة تدخل مندمجة لمعالجة ظاهرة الغياب.'],
  ['📚 تسجيل في أنشطة الدعم', 'يُوصى بتسجيل التلميذ(ة) في أنشطة الدعم والإدماج التربوي لتعزيز الإحساس بالانتماء المدرسي وتحفيزه(ها) على الحضور.'],
  ['🤝 اجتماع ثلاثي أسرة/إدارة/مختص', 'يُقترح عقد اجتماع ثلاثي يجمع الأسرة والإدارة والمختص الاجتماعي للتداول في ظاهرة الغياب ووضع آليات عملية للتتبع.'],
  ['✅ تحسن ومتابعة شهرية', 'لوحظ تحسن ملحوظ في وضعية الحضور إثر الإجراءات المتخذة؛ يُوصى بمواصلة المتابعة الشهرية لضمان الاستمرارية.'],
];
// appendSuggest القديمة
export const appendSuggestion = (current, text) => (String(current).trim() ? String(current).trimEnd() + '\n' + text : text);

export const MSG = {
  NAME_FIRST: '⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.',
  CONFIRM_CLEAR_ALL: 'هل أنت متأكد من مسح جميع البيانات؟',
  CONFIRM_DELETE: 'هل تريد حذف هذا الملف من أرشيف الغياب؟',
  EMPTY_ARCHIVE: '📂 الأرشيف فارغ بالفعل.',
  EMPTY_CSV: '⚠️ الأرشيف فارغ.',
  CONFIRM_CLEAR_ARCHIVE: (n) => `⚠️ تحذير: سيتم حذف جميع ملفات الغياب (${n} ملف) نهائياً.\n\nهل أنت متأكد من المسح الكامل؟`,
  UPDATED: (name) => `✅ تم تحديث ملف غياب "${name}" في الأرشيف بنجاح.`,
  PICK_CLASS: '⚠️ اختر القسم أولاً.',
  NO_IMPORTED: 'لا توجد ملفات مستوردة للحذف.',
  CONFIRM_DELETE_CLASS: (cls, all, view) => `🗑 هل تريد حذف ملف القسم ${cls} ${all ? 'لكل الأشهر' : 'لشهر ' + view} نهائياً؟\nلا يمكن التراجع عن هذا الإجراء.`,
  CONFIRM_DELETE_ALL: '🗑 هل تريد حذف جميع الملفات المستوردة (كل الأقسام وكل الأشهر) نهائياً؟\nلا يمكن التراجع عن هذا الإجراء.',
  DELETED_CLASS: (name) => `✅ تم حذف ملف القسم ${name} نهائياً.`,
  DELETED_ALL: '✅ تم حذف جميع الملفات المستوردة نهائياً.',
  READING: '⏳ جاري قراءة الملفات...',
  NO_XLSX: '❌ مكتبة قراءة Excel غير محمّلة. أعد تحميل الصفحة وتأكد من الاتصال.',
};

// iEsc القديمة: & < > فقط
export const iEsc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const v = (x) => String(x == null ? '' : x).trim();
const dash = (x) => (x && x !== '—' ? x : '');
export const inDomOrder = (options, selected) => options.map((o) => o[0]).filter((x) => (selected || []).includes(x));
const oneOf = (options, x) => (options.some((o) => o[0] === x) ? x : '');

// acNormalize القديمة (script-15.js): توحيد الألف والهاء والياء لمطابقة الأسماء
export const acNormalize = (str) => (str || '').trim().replace(/\s+/g, ' ').replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه').replace(/[يى]/g, 'ي');

// ── جدول الإجراءات ──
export const blankProcRows = () => AB_PROCS.map((p) => ({ key: p.key, custom: false, checked: false, date: '', notes: '' }));
export const newCustomRow = () => ({ custom: true, name: '', checked: false, date: '', notes: '' });

// iAutoCheck القديمة: الكتابة تحدّد الصف ولا تُلغي التحديد أبداً
export function editProcRow(rows, idx, field, value) {
  return rows.map((r, i) => {
    if (i !== idx) return r;
    const next = { ...r, [field]: value };
    if (field !== 'checked' && String(value).trim()) next.checked = true;
    return next;
  });
}

// abProcDetails: المخصَّص يُحفظ إن كان له اسم (ولو بلا تحديد)، والثابت إن كان محدداً
export function procDetails(rows) {
  const out = [];
  (rows || []).forEach((r) => {
    const date = r.date || '';
    const notes = v(r.notes);
    if (r.custom) {
      const name = v(r.name);
      if (name) out.push({ custom: true, name, date, notes });
    } else if (r.checked) {
      const p = AB_PROCS.find((x) => x.key === r.key);
      if (p) out.push({ key: p.key, name: p.name, date, notes });
    }
  });
  return out;
}
// abProcNames: الأسماء المختصرة المحفوظة في entry.procedures
export const procNames = (rows) => procDetails(rows).map((r) => (r.custom ? r.name : (AB_PROCS.find((x) => x.key === r.key) || {}).arch));

// abRestoreProcRows القديمة: تحذف المخصَّصة وتُلغي تحديد الثابتة وتمسح تاريخها وملاحظاتها، ثم تُعيد المحفوظ فقط
function restoreRows(current, saved) {
  const rows = (current || blankProcRows()).filter((r) => !r.custom).map((r) => ({ ...r, checked: false, date: '', notes: '' }));
  (saved || []).forEach((r) => {
    if (r.custom) { rows.push({ custom: true, name: r.name || '', checked: true, date: r.date || '', notes: r.notes || '' }); return; }
    const row = rows.find((x) => x.key === r.key);
    if (!row) return;
    row.date = r.date || ''; row.notes = r.notes || ''; row.checked = true;
  });
  return rows;
}
// abLoadEntry: بلا procedureRows (ملفات قديمة) يُعاد الجدول فارغاً ثم تُحدَّد الثابتة بأسمائها المختصرة
export function procRowsForLoad(entry, current) {
  if (entry.procedureRows && entry.procedureRows.length) return restoreRows(current, entry.procedureRows);
  const rows = blankProcRows();
  (entry.procedures || []).forEach((p) => { const def = AB_PROCS.find((x) => x.arch === p); const row = def && rows.find((x) => x.key === def.key); if (row) row.checked = true; });
  return rows;
}

// ── النموذج والسجل ──
// form: نصوص الحقول كما في DOM + gender/family/semester/priority + causes[] + patterns[] + procRows
// الحقول الإضافية (justifiedHours/family/firstAbsenceDate/lastPresenceDate/patterns/contextNotes) تُحفظ الآن لتعود عند التعديل؛
// القديم كان يتجاهلها، وكان abUpdateEntry يُسقط justifiedDays/unjustifiedDays أيضاً.
function entryFrom(f, id, savedAt) {
  return {
    id, savedAt,
    recordDate: v(f.recordDate) || new Date().toISOString().slice(0, 10),
    studentName: v(f.studentName), massar: v(f.massar) || '—',
    school: v(f.school) || '—', level: v(f.level) || '—',
    gender: f.gender || '—', semester: f.semester || '—',
    parentPhone: v(f.parentPhone) || '—',
    totalHours: v(f.totalHours) || '—',
    unjustifiedHours: v(f.unjustifiedHours) || '—',
    totalDays: v(f.totalDays) || '—',
    justifiedDays: v(f.justifiedDays) || '—', unjustifiedDays: v(f.unjustifiedDays) || '—',
    causes: inDomOrder(CAUSE_OPTIONS, f.causes), procedures: procNames(f.procRows), procedureRows: procDetails(f.procRows),
    currentStatus: '—',
    priority: f.priority || '—',
    recommendation: v(f.recommendation) || '',
    nextFollowup: '—',
    justifiedHours: v(f.justifiedHours) || '—',
    family: f.family || '—',
    firstAbsenceDate: v(f.firstAbsenceDate) || '—', lastPresenceDate: v(f.lastPresenceDate) || '—',
    patterns: inDomOrder(PATTERN_OPTIONS, f.patterns),
    contextNotes: v(f.contextNotes),
  };
}

// abSaveToArchive(+Silent): null إن غاب الاسم؛ وإلا { entry, archive }
export function saveEntry(archive, f, now = new Date()) {
  if (!v(f.studentName)) return null;
  const entry = entryFrom(f, now.getTime(), now.toLocaleString('ar-MA'));
  return { entry, archive: [entry, ...archive] };
}
export function taskLogArgs(entry) {
  return ['أخرى', 'ملف غياب — ' + entry.studentName, entry.studentName, entry.school, `إجمالي الساعات: ${entry.totalHours} — غير مبررة: ${entry.unjustifiedHours}`, 'مُنجز', entry.recordDate !== '—' ? entry.recordDate : undefined];
}
// abUpdateEntry: يستبدل بالمعرّف وإلا يُضاف في الأول؛ null إن غاب المعرّف أو الاسم
export function updateEntry(archive, id, f, now = new Date()) {
  if (!id || !v(f.studentName)) return null;
  const entry = entryFrom(f, id, now.toLocaleString('ar-MA') + ' (معدَّل)');
  const idx = archive.findIndex((e) => e.id === id);
  const next = archive.slice();
  if (idx !== -1) next[idx] = entry; else next.unshift(entry);
  return { entry, archive: next };
}
export const deleteEntry = (archive, id) => archive.filter((e) => e.id !== id);

// abLoadEntry: تحميل كامل للنموذج؛ ما لم يحفظه السجل القديم يعود فارغاً بدل أن يبقى فيه نص تلميذ سابق
export function loadValues(e) {
  const t = (x) => (x == null ? '' : dash(String(x)));
  return {
    text: {
      studentName: e.studentName || '', massar: t(e.massar), school: t(e.school), level: t(e.level), parentPhone: t(e.parentPhone),
      recordDate: e.recordDate || '',
      totalHours: t(e.totalHours), justifiedHours: t(e.justifiedHours), unjustifiedHours: t(e.unjustifiedHours),
      totalDays: t(e.totalDays), justifiedDays: t(e.justifiedDays), unjustifiedDays: t(e.unjustifiedDays),
      firstAbsenceDate: t(e.firstAbsenceDate), lastPresenceDate: t(e.lastPresenceDate),
      contextNotes: e.contextNotes || '', recommendation: e.recommendation || '',
    },
    gender: oneOf(GENDER_OPTIONS, e.gender), semester: oneOf(SEMESTER_OPTIONS, e.semester), priority: oneOf(PRIORITY_OPTIONS, e.priority),
    family: oneOf(FAMILY_OPTIONS, e.family),
    causes: inDomOrder(CAUSE_OPTIONS, e.causes), patterns: inDomOrder(PATTERN_OPTIONS, e.patterns),
  };
}

// ── الأرشيف: البحث والعدّ ──
// renderAbArchive: يبحث في الاسم والمؤسسة، ويُبقي ترتيب الحفظ (الأحدث أولاً)
export function filterArchive(archive, search) {
  const s = String(search || '').trim().toLowerCase();
  return (s ? archive.filter((e) => String(e.studentName || '').toLowerCase().includes(s) || String(e.school || '').toLowerCase().includes(s)) : archive).slice();
}
export const urgentCount = (archive) => archive.filter((e) => e.priority === 'عاجلة').length;

// exportAbArchiveCSV: السلسلة كاملة (BOM + رؤوس + صفوف) واسم الملف
// تصحيح: القديم كان يضع رأس «الحالة» بلا عمود مقابل له فتنزاح الأولوية والتوصية وتاريخ الحفظ عموداً؛ أُزيل الرأس الزائد.
export function archiveCsv(archive) {
  const headers = ['#', 'اسم التلميذ(ة)', 'رقم مسار', 'المؤسسة', 'المستوى', 'الجنس', 'إجمالي الساعات', 'غير مبررة', 'عدد الأيام', 'الأسباب', 'الإجراءات', 'الأولوية', 'التوصية', 'تاريخ الحفظ'];
  const rows = archive.map((e, i) => [i + 1, e.studentName, e.massar, e.school, e.level, e.gender, e.totalHours, e.unjustifiedHours, e.totalDays, (e.causes || []).join(' / '), (e.procedures || []).join(' / '), e.priority, e.recommendation, e.savedAt].map((c) => `"${String(c || '').replace(/"/g, '""')}"`));
  return '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\n');
}
export const csvFileName = (d = new Date()) => `ارشيف_التلاميذ_الاكثر_غيابا_${d.toISOString().slice(0, 10)}.csv`;

// ── التقرير (abGenerateReport) ──
// rField القديمة: حقل بلا قيمة (أو «—») لا يظهر. القيم تُهرَّب هنا (القديم كان يدرجها خاماً في innerHTML)
function field(label, value, span) {
  if (!value || value === '—' || String(value).trim() === '') return '';
  const st = span ? ` style="grid-column:span ${span}"` : '';
  return `<div class="report-field"${st}><span class="lbl">${label}</span><span class="val">${iEsc(value)}</span></div>`;
}
const stat = (label, value, unit) => (v(value) ? `<div class="report-field"><span class="lbl">${label}</span><span class="val">${iEsc(v(value))} ${unit}</span></div>` : '');

export function reportHtml(f, ctx = {}) {
  const studentName = v(f.studentName) || 'غير مُحدد';
  const causes = inDomOrder(CAUSE_OPTIONS, f.causes);
  const patterns = inDomOrder(PATTERN_OPTIONS, f.patterns);
  const rows = procDetails(f.procRows).map((r) => `<tr>
      <td style="font-weight:700;color:#1a3a5c;">${iEsc(r.name)}</td>
      <td style="white-space:nowrap;text-align:center;">${iEsc(r.date) || '—'}</td>
      <td>${iEsc(r.notes) || '—'}</td>
    </tr>`).join('');
  const procedures = rows ? `<table class="proc-table-report" style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;">
    <thead>
      <tr style="background:#1a3a5c;color:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <th style="padding:6px 10px;text-align:right;border:1px solid #0f2a4a;width:36%;">اسم الإجراء</th>
        <th style="padding:6px 10px;text-align:center;border:1px solid #0f2a4a;width:16%;">التاريخ</th>
        <th style="padding:6px 10px;text-align:right;border:1px solid #0f2a4a;">الملاحظات</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>` : '<p style="color:#64748b;font-size:0.82rem;">لم يتم اختيار أي إجراء.</p>';
  const priority = f.priority || '';

  return `
 <div class="new-report-header">
 <div class="nrh-logo">
 <img id="ministry-logo-img" src="${ctx.logo || ''}" alt="شعار الوزارة" style="   width:100%;height:auto;max-height:230px;;object-fit:contain;display:block;background:white;">
 </div>
 
 <div class="nrh-dir">مديرية الحي الحسني</div>
 <div class="nrh-school">${iEsc(v(f.school)) || 'المؤسسة التعليمية'}</div>
 <div class="nrh-title">تتبع وضعية التلاميذ الأكثر غياباً</div>
 </div>
 
 <div class="report-section-title">معلومات التلميذ(ة)</div>
 <div class="report-grid">
 ${field('الاسم الكامل:', studentName)}
 ${field('رقم مسار:', v(f.massar))}
 ${field('القسم:', v(f.level))}
 ${field('الجنس:', f.gender || '')}
 ${field('الوضع الأسري:', f.family || '')}
 ${field('هاتف الولي:', v(f.parentPhone))}
 ${field('الدورة الدراسية:', f.semester || '')}
 ${field('تاريخ رصد الحالة:', v(f.recordDate))}
 </div>
 <div class="report-section-title">إحصاءات الغياب</div>
 <div class="report-grid">
 ${stat('إجمالي الساعات:', f.totalHours, 'سا')}
 ${stat('غيابات مبررة:', f.justifiedHours, 'سا')}
 ${stat('غير مبررة:', f.unjustifiedHours, 'سا')}
 ${stat('إجمالي الأيام:', f.totalDays, 'يوماً')}
 ${stat('أيام مبررة:', f.justifiedDays, 'يوماً')}
 ${stat('أيام غير مبررة:', f.unjustifiedDays, 'يوماً')}
 ${field('أول غياب:', v(f.firstAbsenceDate))}
 ${field('آخر حضور:', v(f.lastPresenceDate))}
 ${patterns.length ? `<div class="report-field" style="grid-column:span 2"><span class="lbl">نمط الغياب:</span><span class="val">${iEsc(patterns.join(' / '))}</span></div>` : ''}
 ${causes.length ? `<div class="report-field" style="grid-column:span 2"><span class="lbl">الأسباب المُرصودة:</span><span class="val">${iEsc(causes.join(' / '))}</span></div>` : ''}
 ${field('ملاحظات:', v(f.contextNotes), 2)}
 </div>
 <div class="report-section-title">الإجراءات المتخذة</div>
 ${procedures}
 <div class="report-section-title">الخلاصة والتوصيات</div>
 <table class="info-table-report" style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;margin-bottom:10px;"><tbody>
   <tr><td class="info-lbl">درجة الأولوية:</td><td class="info-val" colspan="3">${iEsc(priority) || '—'}</td></tr>
   <tr><td class="info-lbl">التوصية الختامية:</td><td class="info-val" colspan="3">${iEsc(v(f.recommendation)) || '—'}</td></tr>
 </tbody></table>
 <div class="signatures">
 <div class="sig-block"><div class="sig-line"></div>الحارس العام</div>
 
 <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
 <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
 </div>
 

 `;
}

// ══════════════ استيراد الغياب الشهري من Excel ══════════════
// البنية المخزَّنة: { 'YYYY-MM': [ { n: الاسم, m: مسار, c: القسم, th, jh, uh, td, jd, ud } ] }
// th/jh/uh = ساعات (مجموع/مبررة/غير مبررة)، td/jd/ud = أيام. المفتاح المحلي: app:abMonthly:<المستخدم> وسحابياً <المستخدم>:abMonthly.
export const abmKey = (user) => 'app:abMonthly:' + (user || '');
export const abmCloudKey = (user) => user + ':abMonthly';
export const NUM_FIELDS = ['th', 'jh', 'uh', 'td', 'jd', 'ud'];

const MONTHS = { 'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'ابريل': 4, 'ماي': 5, 'يونيو': 6, 'يوليوز': 7, 'غشت': 8, 'شتنبر': 9, 'أكتوبر': 10, 'اكتوبر': 10, 'نونبر': 11, 'دجنبر': 12 };

// قارئ نموذج «ملخص الغياب الشهري» (ملف لكل قسم): الترويسة في الأعلى، ثم جدول الأيام 1..31، ثم المجموع
// أعمدة المجموع بالترتيب: يوم (غير مبرر) | يوم (مبرر) | ساعة (غير مبرر) | ساعة (مبرر)
export function abmParse(rows) {
  const N = (x) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim();
  const hi = rows.findIndex((r) => r.some((c) => N(c) === 'رقم التلميذ'));
  if (hi < 0) return null;
  const after = (row, c) => { for (let k = c + 1; k < row.length; k++) if (N(row[k])) return N(row[k]); return ''; };
  let cls = '', school = '', month = '', year = '';
  rows.slice(0, hi).forEach((r) => r.forEach((c, i) => {
    const t = N(c);
    if (/^القسم/.test(t)) cls = after(r, i);
    else if (/^مؤسسة/.test(t)) school = after(r, i);
    else if (/^الشهر/.test(t)) month = after(r, i);
    else if (/السنة الدراسية/.test(t)) year = after(r, i);
  }));
  const H = rows[hi].map(N), cMas = H.indexOf('رقم التلميذ'), cTot = H.indexOf('المجموع');
  const cFam = H.findIndex((h) => /^النسب/.test(h)), cName = H.findIndex((h) => /^(الإسم|الاسم)/.test(h));
  const days = [], hrs = [];
  (rows[hi + 1] || []).map(N).forEach((t, i) => { if (i >= cTot && cTot >= 0) { if (t === 'يوم') days.push(i); if (t === 'ساعة') hrs.push(i); } });
  if (cTot < 0 || days.length < 2 || hrs.length < 2) return null;
  const m = MONTHS[month], ys = year.match(/(\d{4})\D+(\d{4})/);
  const key = m && ys ? (m >= 9 ? ys[1] : ys[2]) + '-' + String(m).padStart(2, '0') : '';
  const num = (x) => parseFloat(String(x).replace(',', '.')) || 0;
  const list = [];
  for (let r = hi + 2; r < rows.length; r++) {
    const row = rows[r], mas = N(row[cMas]), n = (N(row[cFam]) + ' ' + N(row[cName])).trim();
    if (!mas || !n) continue;
    const ud = num(row[days[0]]), jd = num(row[days[1]]), uh = num(row[hrs[0]]), jh = num(row[hrs[1]]);
    if (ud + jd + uh + jh) list.push({ n, m: mas, c: cls, th: uh + jh, jh, uh, td: ud + jd, jd, ud });
  }
  return { cls, school, key, list };
}

// abmImport (بعد قراءة الملفات): results = [{ f: اسم الملف, ds: [نتائج abmParse لكل ورقة] }]
// يستبدل بيانات القسم نفسه في الشهر نفسه ويُبقي بقية الأقسام. fallbackKey = قيمة حقل الشهر عند تعذّر استنتاجه من الملف.
export function mergeImports(data, results, fallbackKey) {
  const next = {};
  Object.keys(data || {}).forEach((k) => { next[k] = (data[k] || []).slice(); });
  const lines = [], bad = []; let school = '', total = 0;
  results.forEach(({ f, ds }) => {
    if (!ds.length) { bad.push(f); return; }
    ds.forEach((d) => {
      const key = d.key || fallbackKey;
      next[key] = (next[key] || []).filter((o) => o.c !== d.cls).concat(d.list);
      lines.push(`• ${d.cls} — ${key} — ${d.list.length} تلميذ(ة)`); total += d.list.length; school = school || d.school;
    });
  });
  return { data: next, lines, bad, school, total };
}
export function importMessage({ lines, bad, total }) {
  const ok = lines.length > 0;
  const text = (ok ? `✅ تم استيراد ${lines.length} قسم(أقسام) — ${total} تلميذ(ة) لديهم غيابات. اختر القسم من القائمة لعرض ملفه.\n${lines.join('\n')}` : '❌ لم يتم التعرف على أي ملف.')
    + (bad.length ? `\n⚠️ ملفات غير مطابقة للنموذج (ملف قسم واحد): ${bad.join('، ')}` : '');
  return { ok, text };
}

// كل الأقسام المستوردة مهما كان الشهر
export const classesOf = (data) => [...new Set(Object.keys(data || {}).sort().flatMap((k) => (data[k] || []).map((o) => o.c || '—')))].sort();
// الأشهر المتوفرة لهذا القسم (أو كلها بلا قسم محدد)
export const monthsFor = (data, cls) => Object.keys(data || {}).sort().filter((k) => !cls || (data[k] || []).some((o) => (o.c || '—') === cls));
// اختيار الفترة المعروضة: المحفوظ إن بقي صالحاً، وإلا شهر الحقل، وإلا آخر شهر
export function resolveView(months, current, monthValue) {
  if (months.includes(current) || (current === '*' && months.length > 1)) return current;
  return months.includes(monthValue) ? monthValue : (months[months.length - 1] || '');
}
// صفوف الجدول: القسم المحدد فقط، تُجمَع الأشهر بالاسم عند «تراكمي»، ثم تُرشَّح بالبحث وتُرتَّب بالساعات فالأيام
export function viewRows(data, { cls, view, months, query }) {
  const norm = (x) => acNormalize(x || '').toLowerCase();
  const rows = [];
  (view === '*' ? months : [view]).forEach((k) => ((data || {})[k] || []).forEach((o) => {
    if ((o.c || '—') !== cls) return;
    const x = rows.find((y) => norm(y.n) === norm(o.n));
    if (x) NUM_FIELDS.forEach((q) => { x[q] += o[q]; }); else rows.push({ ...o });
  }));
  const q = norm(query);
  return rows.filter((o) => !q || norm(o.n).includes(q)).sort((a, b) => b.th - a.th || b.td - a.td);
}
export const MAX_ROWS = 300;

// abmDeleteClass: يحذف القسم من الشهر المحدد (أو كل الأشهر عند «تراكمي») ويُسقط الأشهر التي فرغت
export function deleteClass(data, cls, view) {
  const next = {};
  const keys = view === '*' ? Object.keys(data) : [view];
  Object.keys(data).forEach((k) => {
    const list = keys.includes(k) ? (data[k] || []).filter((o) => (o.c || '—') !== cls) : (data[k] || []).slice();
    if (!keys.includes(k) || list.length) next[k] = list;
  });
  return next;
}

// abmFill: القيم التي تُكتب في النموذج من صف الجدول
export function fillValues(o, student) {
  const db = student || {};
  return {
    student: { fullName: o.n, massar: o.m || db.massar || '', class: o.c || db.class || '', gender: db.gender || '' },
    // القديم يكتب `v || ''`: الصفر يترك الحقل فارغاً
    numbers: { totalHours: o.th || '', justifiedHours: o.jh || '', unjustifiedHours: o.uh || '', totalDays: o.td || '', justifiedDays: o.jd || '', unjustifiedDays: o.ud || '' },
  };
}
