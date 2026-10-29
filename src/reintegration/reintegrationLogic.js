// منطق بوابة «الإدماج المدرسي» — دوال بحتة بلا DOM، منقولة من كتلة الإدماج في script-10.js وrLoadEntry/rUpdateEntry في script-16.js.
// بقيت في الكود القديم عمداً: getRArchive/saveRArchive (يقرؤهما التقرير الأسبوعي والجدول الشهري والتتبع في script-10.js)،
// (نافذة «سجل التلميذ» المشتركة انتقلت إلى src/history، وتستدعي تعديل/حذف الملف بتسجيل من البوابة لا عبر window)، وautoLogTask.
// اختبار المطابقة: tests/reintegration.parity.test.js.

// arch = الاسم المختصر الذي يُحفظ في entry.procedures؛ name = الاسم الكامل في التقرير؛ label/ph = ما يظهر في الجدول
export const R_PROCS = [
  { key: 'listening', arch: 'جلسة الاستماع', name: 'جلسة الاستماع مع التلميذ(ة)', label: '🎧 جلسة الاستماع مع التلميذ(ة)', ph: 'المُجري، ملخص الجلسة...' },
  { key: 'parent_call', arch: 'اتصال بولي الأمر', name: 'اتصال هاتفي بولي الأمر', label: '📞 اتصال هاتفي بولي الأمر', ph: 'المتصل به، موضوع الاتصال...' },
  { key: 'parent_visit', arch: 'استدعاء ولي الأمر', name: 'استدعاء ولي الأمر إلى المؤسسة', label: '🏫 استدعاء ولي الأمر إلى المؤسسة', ph: 'الجهة المستدعية، ملاحظات اللقاء...' },
  { key: 'commitment', arch: 'وثيقة التزام', name: 'توقيع التزام من التلميذ و/أو ولي الأمر', label: '✍️ توقيع التزام من التلميذ و/أو ولي الأمر', ph: 'الطرف الموقّع، مضمون الالتزام...' },
  { key: 'support', arch: 'برنامج الدعم', name: 'تسجيل في برنامج الدعم التربوي', label: '📚 تسجيل في برنامج الدعم التربوي', ph: 'المواد المعنية، تفاصيل الدعم...' },
  { key: 'followup', arch: 'متابعة ميدانية', name: 'متابعة ميدانية بعد الإدماج', label: '🔄 متابعة ميدانية بعد الإدماج', ph: 'نتائج المتابعة، وضعية الإدماج...' },
];

// الخيارات بترتيب النموذج: getChecked القديمة تُرجع القيم بترتيب الـDOM لا بترتيب النقر
export const CAUSE_OPTIONS = [
  ['أسباب صحية', '🏥 صحية'], ['ظروف أسرية', '🏠 أسرية'], ['صعوبات دراسية', '📚 دراسية'], ['أسباب اقتصادية', '💰 اقتصادية'], ['أسباب نفسية', '🧠 نفسية'],
  ['مشكلة علائقية', '🤝 علائقية'], ['بُعد المؤسسة', '🚌 بُعد المؤسسة'], ['تأثير الأقران', '👥 تأثير الأقران'], ['غير محدد', '❓ غير محدد'],
];
export const GENDER_OPTIONS = [['ذكر', 'ذكر'], ['أنثى', 'أنثى']];
export const FAMILY_OPTIONS = [['مستقر', 'مستقر'], ['طلاق', 'طلاق'], ['ترمل', 'ترمل'], ['انفصال', 'انفصال']];
export const SEMESTER_OPTIONS = [['الدورة الأولى', 'الدورة الأولى'], ['الدورة الثانية', 'الدورة الثانية']];
export const PRIORITY_OPTIONS = [['عادية', '🟢 عادية'], ['متوسطة', '🟡 متوسطة'], ['عالية', '🟠 عالية'], ['عاجلة', '🔴 عاجلة']];
export const P_COLOR = { 'عاجلة': '#dc2626', 'عالية': '#c2410c', 'متوسطة': '#d97706', 'عادية': '#16a34a' };
export const P_BG = { 'عاجلة': '#fee2e2', 'عالية': '#fff7ed', 'متوسطة': '#fffbeb', 'عادية': '#f0fdf4' };

// الاقتراحات الجاهزة تحت حقلين نصيين (initReintegration القديمة) — تُضاف إلى النص بسطر جديد
export const R_SUGG = {
  contextNotes: [
    ['🏥 ظروف صحية', 'أفادت الأسرة بأن التلميذ(ة) توقف(ت) عن التمدرس بسبب ظروف صحية طارئة استوجبت التوقف عن الدراسة لفترة من الزمن.'],
    ['🏠 أوضاع أسرية', 'تبيّن أن الانقطاع مرتبط بأوضاع أسرية صعبة أثّرت سلبًا على انتظام التلميذ(ة) في الحضور.'],
    ['📚 صعوبات دراسية', 'صرّح(ت) التلميذ(ة) بأنه(ا) قرّر(ت) الانقطاع بسبب شعوره(ا) بعدم القدرة على مواكبة الدروس والتحصيل الدراسي.'],
  ],
  recommendation: [
    ['🔄 متابعة دورية', 'يُوصى باستمرار المتابعة الدورية للتلميذ(ة) من قِبل المختص الاجتماعي والمرشد التربوي لضمان استقرار وضعيته(ا).'],
    ['🏛️ إشراك مؤسسات', 'يُقترح إشراك مؤسسات الدعم الاجتماعي للتكفل بالوضعية الأسرية التي تُعدّ من الأسباب الجوهرية للصعوبات المُرصودة.'],
    ['🚨 تدخل عاجل', 'يُوصى بالتدخل العاجل وإحالة الملف إلى الجهات المختصة نظراً لخطورة الوضعية.'],
  ],
};
// الأزرار الستة الثابتة تحت التوصية (كانت تستدعي appendSuggest)
export const R_REC_CHIPS = [
  ['🔄 متابعة دورية مستمرة', 'يُوصى باستمرار المتابعة الدورية للتلميذ(ة) من قِبل المختص الاجتماعي والمرشد التربوي لضمان استقرار وضعيته(ا) ومواصلة مساره(ا) الدراسي بانتظام.'],
  ['🏛️ إشراك مؤسسات الدعم', 'يُقترح إشراك مؤسسات الدعم الاجتماعي للتكفل بالوضعية الأسرية التي تُعدّ من الأسباب الجوهرية للصعوبات المُرصودة، مع وضع خطة تدخل متكاملة.'],
  ['🚨 تدخل عاجل وإحالة فورية', 'يُوصى بالتدخل العاجل وإحالة الملف إلى الجهات المختصة نظراً لخطورة الوضعية، مع تعبئة جميع الشركاء التربويين والاجتماعيين.'],
  ['✅ إدماج ناجح ومتابعة شهرية', 'تم إدماج التلميذ(ة) بنجاح؛ يُوصى بمواصلة المتابعة الشهرية لضمان الاستمرارية، والتواصل الدوري مع ولي الأمر والأساتذة للتحقق من انتظام الحضور.'],
  ['📚 تسجيل في الدعم التربوي', 'يُوصى بتسجيل التلميذ(ة) في برنامج الدعم التربوي لسدّ الثغرات التعلمية المتراكمة، مع متابعة نتائجه(ا) بشكل دوري من قِبل المختص الاجتماعي.'],
  ['🤝 اجتماع ثلاثي أسرة/إدارة/مختص', 'يُقترح عقد اجتماع ثلاثي يجمع الأسرة والإدارة والمختص الاجتماعي للتداول في مستجدات الوضعية وتحديد الإجراءات المستقبلية الملائمة.'],
];
// appendSuggest القديمة
export const appendSuggestion = (current, text) => (String(current).trim() ? String(current).trimEnd() + '\n' + text : text);

export const MSG = {
  NAME_FIRST: '⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.',
  CONFIRM_CLEAR_ALL: 'هل أنت متأكد من مسح جميع البيانات؟',
  CONFIRM_DELETE: 'هل تريد حذف هذا الملف من أرشيف الإدماج المدرسي؟',
  EMPTY_ARCHIVE: '📂 الأرشيف فارغ بالفعل.',
  EMPTY_CSV: '⚠️ الأرشيف فارغ.',
  CONFIRM_CLEAR_ARCHIVE: (n) => `⚠️ تحذير: سيتم حذف جميع ملفات الإدماج المدرسي (${n} ملف) نهائياً.\n\nهل أنت متأكد من المسح الكامل؟`,
  UPDATED: (name) => `✅ تم تحديث ملف الإدماج لـ "${name}" في الأرشيف بنجاح.`,
};

// iEsc القديمة: & < > فقط
export const iEsc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const v = (x) => String(x == null ? '' : x).trim();
const dash = (x) => (x && x !== '—' ? x : '');
export const inDomOrder = (options, selected) => options.map((o) => o[0]).filter((x) => (selected || []).includes(x));
const oneOf = (options, x) => (options.some((o) => o[0] === x) ? x : '');

// ── جدول الإجراءات ──
export const blankProcRows = () => R_PROCS.map((p) => ({ key: p.key, custom: false, checked: false, date: '', notes: '' }));
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

// rProcDetails: المخصَّص يُحفظ إن كان له اسم (ولو بلا تحديد)، والثابت إن كان محدداً
export function procDetails(rows) {
  const out = [];
  (rows || []).forEach((r) => {
    const date = r.date || '';
    const notes = v(r.notes);
    if (r.custom) {
      const name = v(r.name);
      if (name) out.push({ custom: true, name, date, notes });
    } else if (r.checked) {
      const p = R_PROCS.find((x) => x.key === r.key);
      if (p) out.push({ key: p.key, name: p.name, date, notes });
    }
  });
  return out;
}
// rProcNames: الأسماء المختصرة المحفوظة في entry.procedures
export const procNames = (rows) => procDetails(rows).map((r) => (r.custom ? r.name : (R_PROCS.find((x) => x.key === r.key) || {}).arch));

// rRestoreProcRows القديمة: تحذف المخصَّصة وتمسح تاريخ/ملاحظات الثابتة، لكنها لا تُلغي تحديد الثابتة (سلوك قديم محفوظ)
function restoreRows(current, saved) {
  const rows = (current || blankProcRows()).filter((r) => !r.custom).map((r) => ({ ...r, date: '', notes: '' }));
  (saved || []).forEach((r) => {
    if (r.custom) { rows.push({ custom: true, name: r.name || '', checked: true, date: r.date || '', notes: r.notes || '' }); return; }
    const row = rows.find((x) => x.key === r.key);
    if (!row) return;
    row.date = r.date || ''; row.notes = r.notes || ''; row.checked = true;
  });
  return rows;
}
// rLoadEntry: بلا procedureRows (ملفات قديمة) يُعاد الجدول فارغاً ثم تُحدَّد الثابتة بأسمائها المختصرة
export function procRowsForLoad(entry, current) {
  if (entry.procedureRows && entry.procedureRows.length) return restoreRows(current, entry.procedureRows);
  const rows = blankProcRows();
  (entry.procedures || []).forEach((p) => { const def = R_PROCS.find((x) => x.arch === p); const row = def && rows.find((x) => x.key === def.key); if (row) row.checked = true; });
  return rows;
}

// ── النموذج والسجل ──
// form: نصوص الحقول كما في DOM + gender/family/semester/priority + causes[] + procRows
function entryFrom(f, id, savedAt) {
  return {
    id, savedAt,
    studentName: v(f.studentName), massar: v(f.massar) || '—',
    school: v(f.school) || '—', level: v(f.level) || '—',
    reintegrationDate: v(f.reintegrationDate) || '—',
    gender: f.gender || '—', semester: f.semester || '—',
    absenceDuration: v(f.absenceDuration) || '—',
    causes: inDomOrder(CAUSE_OPTIONS, f.causes), procedures: procNames(f.procRows), procedureRows: procDetails(f.procRows),
    currentStatus: '—',
    priority: f.priority || '—',
    recommendation: v(f.recommendation) || '',
    nextFollowup: '—',
  };
}

// rSaveToArchive(+Silent): null إن غاب الاسم؛ وإلا { entry, archive }
export function saveEntry(archive, f, now = new Date()) {
  if (!v(f.studentName)) return null;
  const entry = entryFrom(f, now.getTime(), now.toLocaleString('ar-MA'));
  return { entry, archive: [entry, ...archive] };
}
export function taskLogArgs(entry) {
  return ['مقابلة فردية', 'إدماج مدرسي — ' + entry.studentName, entry.studentName, entry.school, 'إدماج مدرسي: ' + (entry.causes || []).join(' / '), 'مُنجز', entry.reintegrationDate !== '—' ? entry.reintegrationDate : undefined];
}
// rUpdateEntry: يستبدل بالمعرّف وإلا يُضاف في الأول؛ null إن غاب المعرّف أو الاسم
export function updateEntry(archive, id, f, now = new Date()) {
  if (!id || !v(f.studentName)) return null;
  const entry = entryFrom(f, id, now.toLocaleString('ar-MA') + ' (معدَّل)');
  const idx = archive.findIndex((e) => e.id === id);
  const next = archive.slice();
  if (idx !== -1) next[idx] = entry; else next.unshift(entry);
  return { entry, archive: next };
}
export const deleteEntry = (archive, id) => archive.filter((e) => e.id !== id);

// rLoadEntry: لا تُحمَّل إلا الحقول المحفوظة في السجل؛ وضعية الأسرة وهاتف الولي وبداية الانقطاع وملاحظات السياق لا تُمسّ (لا تُحفظ فيه)
export function loadValues(e) {
  return {
    text: {
      studentName: e.studentName || '', massar: dash(e.massar), school: dash(e.school), level: dash(e.level),
      reintegrationDate: dash(e.reintegrationDate), absenceDuration: dash(e.absenceDuration), recommendation: e.recommendation || '',
    },
    gender: oneOf(GENDER_OPTIONS, e.gender), semester: oneOf(SEMESTER_OPTIONS, e.semester), priority: oneOf(PRIORITY_OPTIONS, e.priority),
    causes: inDomOrder(CAUSE_OPTIONS, e.causes),
  };
}

// ── الأرشيف: البحث والترتيب والعدّ ──
export function filterArchive(archive, search) {
  const s = String(search || '').trim().toLowerCase();
  return (s ? archive.filter((e) => (e.studentName || '').toLowerCase().includes(s) || (e.school || '').toLowerCase().includes(s)) : archive).slice();
}
// ترتيب حسب تاريخ الإدماج (الأحدث أولاً) ثم المعرّف
export function sortArchive(list) {
  const d = (e) => (e.reintegrationDate && e.reintegrationDate !== '—' ? e.reintegrationDate : '');
  return list.slice().sort((a, b) => d(b).localeCompare(d(a)) || ((b.id || 0) - (a.id || 0)));
}
export function studentCounts(archive) {
  const c = {};
  archive.forEach((e) => { const k = (e.studentName || '').trim().toLowerCase(); if (k) c[k] = (c[k] || 0) + 1; });
  return c;
}
export const countFor = (counts, e) => counts[(e.studentName || '').trim().toLowerCase()] || 1;
export const urgentCount = (archive) => archive.filter((e) => e.priority === 'عاجلة').length;

// exportRArchiveCSV: السلسلة كاملة (BOM + رؤوس + صفوف) واسم الملف
export function archiveCsv(archive) {
  const headers = ['#', 'اسم التلميذ(ة)', 'رقم مسار', 'المؤسسة', 'المستوى', 'الجنس', 'تاريخ الإدماج', 'مدة الانقطاع', 'الإجراءات', 'درجة الأولوية', 'التوصية', 'تاريخ الحفظ'];
  const rows = archive.map((e, i) => [i + 1, e.studentName, e.massar, e.school, e.level, e.gender, e.reintegrationDate, e.absenceDuration, (e.procedures || []).join(' / '), e.priority, e.recommendation, e.savedAt].map((c) => `"${String(c || '').replace(/"/g, '""')}"`));
  return '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\n');
}
export const csvFileName = (d = new Date()) => `ارشيف_الادماج_المدرسي_${d.toISOString().slice(0, 10)}.csv`;

// ── التقرير (rGenerateReport) ──
// rField القديمة: حقل بلا قيمة (أو «—») لا يظهر. القيم تُهرَّب هنا (القديم كان يدرجها خاماً في innerHTML)
function field(label, value, span) {
  if (!value || value === '—' || String(value).trim() === '') return '';
  const st = span ? ` style="grid-column:span ${span}"` : '';
  return `<div class="report-field"${st}><span class="lbl">${label}</span><span class="val">${iEsc(value)}</span></div>`;
}

export function reportHtml(f, ctx = {}) {
  const studentName = v(f.studentName) || 'غير مُحدد';
  const causes = inDomOrder(CAUSE_OPTIONS, f.causes);
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
  </table>` : '';
  const priority = f.priority || '';

  return `
 <div class="new-report-header">
 <div class="nrh-logo">
 <img id="ministry-logo-img" src="${ctx.logo || ''}" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;">
 </div>
 
 <div class="nrh-dir">مديرية الحي الحسني</div>
 <div class="nrh-school">${iEsc(v(f.school)) || 'المؤسسة التعليمية'}</div>
 <div class="nrh-title">تتبع إعادة الإدماج المدرسي</div>
 </div>
 
 <div class="report-section-title">معلومات التلميذ(ة)</div>
 <div class="report-grid">
 ${field('الاسم الكامل:', studentName)}
 ${field('رقم مسار:', v(f.massar))}
 ${field('القسم:', v(f.level))}
 ${field('الجنس:', f.gender || '')}
 ${field('الوضع الأسري:', f.family || '')}
 ${field('هاتف الولي:', v(f.parentPhone))}
 ${field('تاريخ إعادة الإدماج:', v(f.reintegrationDate))}
 ${field('الدورة الدراسية:', f.semester || '')}
 </div>
 <div class="report-section-title">سياق الانقطاع</div>
 <div class="report-grid">
 ${field('بداية الانقطاع:', v(f.absenceStart))}
 ${field('مدة الانقطاع:', v(f.absenceDuration))}
 ${causes.length ? `<div class="report-field" style="grid-column:span 2"><span class="lbl">الأسباب الظاهرة:</span><span class="val">${iEsc(causes.join(' / '))}</span></div>` : ''}
 ${field('ملاحظات:', v(f.contextNotes), 2)}
 </div>
 ${procedures ? `<div class="report-section-title">الإجراءات المتخذة</div>${procedures}` : ''}
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
