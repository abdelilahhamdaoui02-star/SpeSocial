// منطق بوابة «وضعية إعاقة وصعوبات التعلم» — دوال بحتة بلا DOM، منقولة من كتلة الإعاقة في script-16.js القديم.
// بقي في الكود القديم عمداً جسر القراءة/الحفظ فقط: getSnArchive وsaveSnArchive (يقرؤهما التقرير الأسبوعي وملف الحالة في script-10.js)
// وautoLogTask (سجل المهام). اختبار المطابقة: tests/specialneeds.parity.test.js.
//
// انحراف مقصود واحد عن القديم (موثَّق في الاختبار): snUpdateEntry القديمة تبني سجلاً جديداً بلا trackingLogs وnextFollowup وpriority،
// فكان تعديل ملف يمحو سجل جلسات المتابعة كله. هنا تُحفظ هذه الحقول من السجل الأصلي.

import { printLogoImg } from '../settings/logoLogic.js';
export const SN_KEY = 'specialNeedsArchive';

// ── خيارات النموذج (بترتيب ظهورها في الصفحة؛ getChecked القديمة تُرجع القيم بترتيب الـDOM لا بترتيب النقر) ──
export const GENDER_OPTIONS = [['ذكر', 'ذكر'], ['أنثى', 'أنثى']];
export const CATEGORY_OPTIONS = [
  ['إعاقة حركية', '♿ إعاقة حركية'], ['إعاقة بصرية', '👁 إعاقة بصرية'], ['إعاقة سمعية', '👂 إعاقة سمعية'], ['إعاقة ذهنية', '🧠 إعاقة ذهنية'],
  ['اضطراب التوحد', '🌀 اضطراب التوحد'], ['إعاقة متعددة', '🔄 إعاقة متعددة'], ['وضعية صحية مزمنة', '🏥 وضعية صحية مزمنة'],
  ['صعوبات التعلم', '📚 صعوبات التعلم'], ['عسر القراءة - الديسلكسيا', '✍️ عسر القراءة'], ['اضطراب نقص الانتباه TDAH', '⚡ اضطراب نقص الانتباه (TDAH)'],
  ['أخرى', '📌 أخرى'],
];
export const HAS_REPORT_OPTIONS = [['نعم — موجود في الملف', '✅ نعم'], ['لا — لم يُقدَّم بعد', '❌ لا'], ['قيد الإنجاز', '⏳ قيد الإنجاز']];
export const REFERRAL_OPTIONS = [
  ['الأسرة', '👨‍👩 الأسرة'], ['الإدارة', '🏫 الإدارة'], ['الأستاذ', '📖 الأستاذ'], ['المرشد التربوي', '🧑‍🏫 المرشد'], ['الصحة المدرسية', '🩺 الصحة المدرسية'], ['ذاتي', '🙋 ذاتي'],
];
export const ADAPTATION_OPTIONS = [
  ['تمديد وقت الاختبار', '⏰ تمديد وقت الاختبار'], ['جلوس في مقدمة الفصل', '🪑 جلوس في مقدمة الفصل'], ['تكييف أوراق الامتحان', '📝 تكييف أوراق الامتحان'],
  ['امتحان شفهي', '🗣️ امتحان شفهي'], ['مرافق للمكفوفين', '👁 مرافق للمكفوفين'], ['تكييف محيط الإعاقة الحركية', '♿ تكييف محيط الإعاقة الحركية'],
  ['دعم لغوي إشاري', '🤟 دعم لغوي إشاري'], ['وثائق مبسّطة', '📄 وثائق مبسّطة'], ['أخرى', '📌 أخرى'],
];
export const CURRENT_STATUS_OPTIONS = [
  ['مستقرة — مندمج في المسار التعليمي', '🟢 مستقرة'], ['قيد المتابعة', '🔶 قيد المتابعة'], ['تحتاج تدخلاً عاجلاً', '🔴 تحتاج تدخلاً عاجلاً'],
  ['محوّلة للجهات المختصة', '🏛️ محوّلة للجهات المختصة'],
];

// الإجراءات الأحد عشر الثابتة (المفتاح = data-key في الجدول القديم، name = SN_PROCS القديمة، label/ph من عرض الجدول)
export const SN_PROCS = [
  { key: 'listening', name: 'جلسة استماع مع التلميذ', label: '🎧 جلسة استماع مع التلميذ', ph: 'مدة الجلسة، أبرز ما دار فيها...' },
  { key: 'parent', name: 'تواصل مع ولي الأمر', label: '📞 تواصل مع ولي الأمر', ph: 'طريقة التواصل وموضوعه...' },
  { key: 'admin', name: 'تنسيق مع الإدارة', label: '🏫 تنسيق مع الإدارة', ph: 'الجهة المنسَّق معها...' },
  { key: 'teachers', name: 'تنسيق مع هيئة التدريس', label: '📖 تنسيق مع هيئة التدريس', ph: 'الأساتذة المعنيون، التكيفات المتفق عليها...' },
  { key: 'psych', name: 'إحالة على أخصائي نفسي', label: '🧠 إحالة على أخصائي نفسي', ph: 'اسم الأخصائي / الجهة...' },
  { key: 'doctor', name: 'إحالة على طبيب متخصص', label: '🩺 إحالة على طبيب متخصص', ph: 'التخصص / الجهة...' },
  { key: 'classenv', name: 'تكييف بيئة الفصل', label: '🏫 تكييف بيئة الفصل', ph: 'نوع التكييف...' },
  { key: 'support', name: 'دعم تربوي متخصص', label: '📚 دعم تربوي متخصص', ph: 'المواد المعنية، وتيرة الدعم...' },
  { key: 'solidarity', name: 'إحالة على مصالح التضامن', label: '🏛️ إحالة على مصالح التضامن', ph: 'الجهة المُحال إليها...' },
  { key: 'institutions', name: 'إشراك مؤسسات الدعم الاجتماعي', label: '🤝 إشراك مؤسسات الدعم الاجتماعي', ph: 'اسم المؤسسة / الجمعية...' },
  { key: 'council', name: 'اجتماع مجلس القسم', label: '📋 اجتماع مجلس القسم', ph: 'تاريخ الاجتماع والقرارات...' },
];

// أزرار الاقتراحات السريعة (appendSuggest القديمة)
export const DIAGNOSIS_CHIPS = [
  ['♿ إعاقة حركية', 'يعاني(تعاني) التلميذ(ة) من إعاقة حركية تحول دون تنقله(ا) باستقلالية، مما يستوجب تهيئة البيئة المدرسية وتكييفها.'],
  ['✍️ عسر القراءة', 'تم تشخيص التلميذ(ة) بعسر القراءة (الديسلكسيا) من قِبَل أخصائي نفسي تربوي، مما يؤثر على تحصيله(ا) الدراسي ويستوجب تكيفات بيداغوجية.'],
  ['⚡ اضطراب TDAH', 'يعاني(تعاني) التلميذ(ة) من اضطراب نقص الانتباه وفرط الحركة (TDAH)، مما ينعكس سلباً على تركيزه(ا) داخل القسم ويستلزم متابعة مستمرة.'],
  ['🏥 وضعية صحية مزمنة', 'يخضع(تخضع) التلميذ(ة) لمتابعة طبية دورية بسبب وضعية صحية مزمنة تؤثر على انتظامه(ا) الدراسي وتستوجب مرونة في التعامل.'],
];
export const RECOMMENDATION_CHIPS = [
  ['🔄 متابعة دورية مع الأسرة', 'يُوصى باستمرار المتابعة الدورية للتلميذ(ة) وضمان توفير التكيفات البيداغوجية اللازمة مع إشراك أسرته في هذه العملية.'],
  ['🏥 إحالة إلى مركز متخصص', 'يُقترح إحالة التلميذ(ة) إلى مركز متخصص في إعادة التأهيل لتقييم احتياجاته(ا) بشكل أدق وتقديم الدعم المناسب.'],
  ['📖 تنسيق مع هيئة التدريس', 'يُنصح بالتنسيق مع هيئة التدريس لضمان تطبيق التكيفات البيداغوجية المعتمدة وتعزيز انخراط التلميذ(ة) في العملية التعليمية.'],
  ['🌍 تفعيل التعليم الدامج', 'يُوصى بتفعيل آليات التعليم الدامج عبر إشراك كافة الأطراف التربوية في رسم خطة متكاملة لدعم التلميذ(ة).'],
];

// نتائج جلسات المتابعة وألوانها (بطاقة التتبع)
export const TRACK_RESULTS = ['✅ تحسن ملحوظ', '🟢 وضعية مستقرة', '🔶 لا يزال قيد المتابعة', '🔴 تراجع — يستدعي تدخلاً', '🏛️ تمت الإحالة', '✔️ انتهت المتابعة'];
export const TRACK_COLOR = {
  '✅ تحسن ملحوظ': '#16a34a', '🟢 وضعية مستقرة': '#16a34a', '🔶 لا يزال قيد المتابعة': '#d97706',
  '🔴 تراجع — يستدعي تدخلاً': '#dc2626', '🏛️ تمت الإحالة': '#7c3aed', '✔️ انتهت المتابعة': '#0f766e',
};
export const TRACK_BG = {
  '✅ تحسن ملحوظ': '#f0fdf4', '🟢 وضعية مستقرة': '#f0fdf4', '🔶 لا يزال قيد المتابعة': '#fffbeb',
  '🔴 تراجع — يستدعي تدخلاً': '#fef2f2', '🏛️ تمت الإحالة': '#f5f3ff', '✔️ انتهت المتابعة': '#f0fdfa',
};
// ألوان الأولوية في جدول الأرشيف (تظهر لسجلات قديمة فيها priority)
export const P_COLOR = { 'عاجلة': '#dc2626', 'عالية': '#c2410c', 'متوسطة': '#d97706', 'عادية': '#16a34a' };
export const P_BG = { 'عاجلة': '#fee2e2', 'عالية': '#fff7ed', 'متوسطة': '#fffbeb', 'عادية': '#f0fdf4' };

export const MSG = {
  NAME_FIRST: '⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.',
  CATEGORY_FIRST: '⚠️ يرجى تحديد تصنيف الوضعية.',
  CONFIRM_CLEAR_ALL: 'هل أنت متأكد من مسح جميع البيانات؟',
  CONFIRM_DELETE: 'حذف هذا الملف؟',
  EMPTY_ARCHIVE: '📂 الأرشيف فارغ بالفعل.',
  CONFIRM_CLEAR_ARCHIVE: (n) => `⚠️ تحذير: سيتم حذف جميع ملفات وضعيات الإعاقة (${n} ملف) نهائياً.\n\nهل أنت متأكد؟`,
  UPDATED: (name) => `✅ تم تحديث ملف التلميذ(ة) "${name}" بنجاح.`,
  TRACK_DATE: '⚠️ يرجى اختيار تاريخ المتابعة.',
  TRACK_RESULT: '⚠️ يرجى اختيار نتيجة المتابعة.',
  TRACK_SAVED: '✅ تم تسجيل جلسة المتابعة بنجاح.',
  CONFIRM_DELETE_LOG: 'حذف هذه الجلسة من سجل المتابعة؟',
  NO_CARD: 'يرجى اختيار بطاقة تلميذ أولاً.',
};

// iEsc القديمة: & < > فقط
export const iEsc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const todayIso = (d = new Date()) => d.toISOString().slice(0, 10);
export const toggleIn = (list, x) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
const v = (x) => String(x == null ? '' : x).trim();
// القيم المحدَّدة بترتيب الخيارات في النموذج (snGetChecked القديمة)
export const inDomOrder = (options, selected) => options.map((o) => o[0]).filter((x) => (selected || []).includes(x));
// القيمة التي تحدّد خياراً موجوداً فقط (القيمة غير المطابقة مثل «—» لا تحدّد شيئاً فيقرأها القديم فارغة)
const optionOrEmpty = (options, value) => (options.some((o) => o[0] === value) ? value : '');

// ── جدول الإجراءات ──
// صف = { key?, custom, name, checked, date, notes }؛ الأحد عشر الثابتة أولاً ثم المضافة بالترتيب (كإلحاق tbody القديم)
export const blankProcRows = () => SN_PROCS.map((p) => ({ key: p.key, custom: false, name: p.name, checked: false, date: '', notes: '' }));
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

// snProcDetails: المخصَّص يُحفظ إن كان له اسم (حتى بلا تحديد)، والثابت إن كان محدداً
export function procDetails(rows) {
  const out = [];
  (rows || []).forEach((r) => {
    const date = r.date || '';
    const notes = (r.notes || '').trim();
    if (r.custom) {
      const name = (r.name || '').trim();
      if (name) out.push({ custom: true, name, date, notes });
    } else if (r.checked) {
      const p = SN_PROCS.find((x) => x.key === r.key);
      if (p) out.push({ key: p.key, name: p.name, date, notes });
    }
  });
  return out;
}

// snRestoreProcRows: يعيد الجدول فارغاً ثم يملأ؛ الصفوف المحمَّلة كلها محدَّدة، والمفتاح المجهول يُتجاهل.
// السجلات الأقدم بلا procedureRows تُشتق من actions (+ actionsDetails صفاً مخصصاً)
export function restoreProcRows(entry) {
  const rows = blankProcRows();
  let saved = entry.procedureRows;
  if (!saved) {
    saved = (entry.actions || []).map((n) => {
      const p = SN_PROCS.find((x) => x.name === n);
      return p ? { key: p.key, date: '', notes: '' } : { custom: true, name: n, date: '', notes: '' };
    });
    if (entry.actionsDetails) saved.push({ custom: true, name: 'تفاصيل الدعم المقدم', date: '', notes: entry.actionsDetails });
  }
  saved.forEach((r) => {
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
// form: نصوص الحقول كما في DOM (تُقصّ هنا كـsnVal القديمة) + gender/category/hasReport/referral/currentStatus + adaptations + procRows
export const blankForm = (recordDate = '', school = '') => ({
  studentName: '', massar: '', school, level: '', gender: '', parentPhone: '', recordDate, category: '', diagnosis: '',
  hasReport: '', referral: '', adaptations: [], currentStatus: '', recommendation: '', procRows: blankProcRows(),
});

function entryFrom(f, id, savedAt, category) {
  const rows = procDetails(f.procRows);
  return {
    id, savedAt,
    studentName: v(f.studentName),
    massar: v(f.massar) || '—',
    school: v(f.school) || '—',
    level: v(f.level) || '—',
    gender: f.gender || '—',
    parentPhone: v(f.parentPhone) || '—',
    recordDate: v(f.recordDate) || '—',
    category,
    diagnosis: v(f.diagnosis) || '—',
    hasReport: f.hasReport || '—',
    referral: f.referral || '—',
    actions: rows.map((r) => r.name),
    actionsDetails: '',
    procedureRows: rows,
    adaptations: inDomOrder(ADAPTATION_OPTIONS, f.adaptations),
    currentStatus: f.currentStatus || '—',
    recommendation: v(f.recommendation),
  };
}

// snSaveToArchive: { error } إن غاب الاسم أو التصنيف؛ وإلا { entry, archive } (الجديد في الأول)
export function saveEntry(archive, f, now = new Date()) {
  if (!v(f.studentName)) return { error: 'name' };
  const category = f.category || '';
  if (!category) return { error: 'category' };
  const entry = entryFrom(f, now.getTime(), now.toLocaleString('ar-MA'), category);
  return { entry, archive: [entry, ...archive] };
}

// معاملات autoLogTask بعد كل حفظ
export function taskLogArgs(entry) {
  return ['أخرى', 'وضعية إعاقة — ' + entry.studentName, entry.studentName, entry.school, `${entry.category}`, 'مُنجز', entry.recordDate !== '—' ? entry.recordDate : undefined];
}

// snUpdateEntry: null إن غاب المعرّف؛ { error:'name' } إن غاب الاسم؛ وإلا يستبدل بالمعرّف (وإن لم يوجد يُضاف في الأول كالقديم).
// التصنيف الفارغ يُحفظ «—» (القديم). يحتفظ بجلسات التتبع والمتابعة القادمة والأولوية من السجل الأصلي (انحراف مقصود عن القديم)
export function updateEntry(archive, id, f, now = new Date()) {
  if (!id) return null;
  if (!v(f.studentName)) return { error: 'name' };
  const idx = archive.findIndex((e) => e.id === id);
  const old = idx !== -1 ? archive[idx] : null;
  const entry = entryFrom(f, id, now.toLocaleString('ar-MA') + ' (معدَّل)', f.category || '—');
  if (old) {
    if (old.trackingLogs !== undefined) entry.trackingLogs = old.trackingLogs;
    if (old.nextFollowup !== undefined) entry.nextFollowup = old.nextFollowup;
    if (old.priority !== undefined) entry.priority = old.priority;
  }
  const next = archive.slice();
  if (idx !== -1) next[idx] = entry; else next.unshift(entry);
  return { entry, archive: next };
}

// snLoadEntry: قيم الحقول من سجل محفوظ. المسار والمؤسسة والهاتف والتاريخ تُحمَّل كما هي (حتى «—»)، أما التشخيص فالشرطة تصير فارغة.
// level يُمرَّر خاماً: القديم يغيّر القائمة فقط إن وُجد خيار مطابق
export function formFromEntry(e) {
  return {
    studentName: e.studentName || '', massar: e.massar || '', school: e.school || '', parentPhone: e.parentPhone || '',
    recordDate: e.recordDate || '', diagnosis: e.diagnosis !== '—' ? (e.diagnosis || '') : '', recommendation: e.recommendation || '',
    level: e.level,
    gender: optionOrEmpty(GENDER_OPTIONS, e.gender),
    category: optionOrEmpty(CATEGORY_OPTIONS, e.category),
    hasReport: optionOrEmpty(HAS_REPORT_OPTIONS, e.hasReport),
    referral: optionOrEmpty(REFERRAL_OPTIONS, e.referral),
    currentStatus: optionOrEmpty(CURRENT_STATUS_OPTIONS, e.currentStatus),
    adaptations: inDomOrder(ADAPTATION_OPTIONS, e.adaptations || []),
    procRows: restoreProcRows(e),
  };
}

// ── الأرشيف ──
// renderSnArchive: العدّاد = كل السجلات، «العاجلة» = priority === 'عاجلة' (حقل لا يكتبه النموذج الحالي لكن قد يوجد في سجلات قديمة)
export const archiveStats = (archive) => ({ total: archive.length, urgent: archive.filter((e) => e.priority === 'عاجلة').length });

// بحث الأرشيف: باسم التلميذ أو التصنيف
export function filterArchive(archive, search) {
  const s = String(search || '').trim().toLowerCase();
  return s ? archive.filter((e) => (e.studentName || '').toLowerCase().includes(s) || (e.category || '').toLowerCase().includes(s)) : archive;
}

export function deleteEntry(archive, id) { return archive.filter((e) => e.id !== id); }

// ── جلسات التتبع (بطاقة المتابعة) ──
// snAddTrackingLog: { error:'date'|'result' } أو null إن غاب السجل أو { archive, entry, log }
export function addTrackingLog(archive, id, input, now = new Date()) {
  const date = input.date || '';
  const result = input.result || '';
  if (!date) return { error: 'date' };
  if (!result) return { error: 'result' };
  const nextDate = input.nextDate || '';
  const log = {
    id: now.getTime().toString(), date, result,
    note: v(input.note), by: v(input.by), nextDate,
    savedAt: now.toLocaleString('ar-MA'),
  };
  const idx = archive.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const entry = { ...archive[idx], trackingLogs: [...(archive[idx].trackingLogs || []), log] };
  if (nextDate) entry.nextFollowup = nextDate;
  const next = archive.slice();
  next[idx] = entry;
  return { archive: next, entry, log };
}

export function deleteTrackingLog(archive, id, logId) {
  const idx = archive.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  const entry = { ...archive[idx], trackingLogs: (archive[idx].trackingLogs || []).filter((l) => l.id !== logId) };
  const next = archive.slice();
  next[idx] = entry;
  return { archive: next, entry };
}

// نتيجة المتابعة القادمة الافتراضية عند فتح البطاقة (snOpenTrackingCard)
export const defaultNextDate = (entry) => (entry.nextFollowup && entry.nextFollowup !== '—' ? entry.nextFollowup : '');

// ── التقرير (snGenerateReport) ──
const TBL = "width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;margin-bottom:10px;";

// ctx.logo: شعار الوزارة (القديم يضع src فارغاً ثم يملؤه بعد الإدراج، فالنتيجة النهائية واحدة)؛ ctx.directorate: اسم المديرية (getDirectorate)
export function reportHtml(f, ctx = {}) {
  const studentName = v(f.studentName);
  const category = f.category || '';
  const adaptations = inDomOrder(ADAPTATION_OPTIONS, f.adaptations);
  const E = iEsc;
  const V = (x) => E(v(x)) || '—';
  const R = (x) => E(x || '') || '—';

  const procRows = procDetails(f.procRows).map((r) => `<tr>
      <td style="font-weight:700;color:#1a3a5c;">${E(r.name)}</td>
      <td style="white-space:nowrap;text-align:center;">${E(r.date) || '—'}</td>
      <td>${E(r.notes) || '—'}</td>
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

  const tblStyle = `style="${TBL}"`;
  const reco = v(f.recommendation);

  return `
 <div class="new-report-header">
 <div class="nrh-logo">
 <img id="ministry-logo-img" src="${ctx.logo || ''}" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;">
 </div>
 <div class="nrh-dir">${E(ctx.directorate)}</div>
 <div class="nrh-school">${v(f.school) ? E(v(f.school)) : 'المؤسسة التعليمية'}</div>
 <div class="nrh-title">تقرير متابعة التلميذ(ة) في وضعية إعاقة / صعوبات التعلم</div>
 </div>
 <div class="report-section-title">معلومات التلميذ(ة)</div>
 <table class="info-table-report" ${tblStyle}><tbody>
   <tr><td class="info-lbl">الاسم الكامل:</td><td class="info-val">${E(studentName)}</td><td class="info-lbl">رقم المسار:</td><td class="info-val">${V(f.massar)}</td></tr>
   <tr><td class="info-lbl">المؤسسة التعليمية:</td><td class="info-val">${V(f.school)}</td><td class="info-lbl">القسم:</td><td class="info-val">${V(f.level)}</td></tr>
   <tr><td class="info-lbl">الجنس:</td><td class="info-val" colspan="3">${R(f.gender)}</td></tr>
   <tr><td class="info-lbl">هاتف الولي:</td><td class="info-val">${V(f.parentPhone)}</td><td class="info-lbl">تاريخ فتح الملف:</td><td class="info-val">${V(f.recordDate)}</td></tr>
   <tr><td class="info-lbl">تصنيف الوضعية:</td><td class="info-val">${E(category) || '—'}</td><td class="info-lbl">تقرير طبي / نفسي:</td><td class="info-val">${R(f.hasReport)}</td></tr>
   <tr><td class="info-lbl">مصدر الإحالة:</td><td class="info-val" colspan="3">${R(f.referral)}</td></tr>
   <tr><td class="info-lbl">وصف الوضعية / التشخيص:</td><td class="info-val" colspan="3">${V(f.diagnosis)}</td></tr>
 </tbody></table>
 ${procedures ? `<div class="report-section-title">الإجراءات المتخذة</div>${procedures}` : ''}
 ${adaptations.length ? `<div class="report-section-title">التكيفات البيداغوجية المعتمدة</div><div class="report-summary-block">${E(adaptations.join(' / '))}</div>` : ''}
 <div class="report-section-title">الخلاصة والتوصيات</div>
 <table class="info-table-report" ${tblStyle}><tbody>
   <tr><td class="info-lbl">الحالة الراهنة:</td><td class="info-val" colspan="3">${R(f.currentStatus)}</td></tr>
   <tr><td class="info-lbl">التوصية الختامية:</td><td class="info-val" colspan="3">${E(reco) || '—'}</td></tr>
 </tbody></table>
 <div class="signatures">
 <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
 <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
 </div>
 `;
}

// ── بطاقة المتابعة: تنزيل HTML وWord ──
const longDate = (now) => now.toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' });

// printLogoImg القديمة صارت في src/settings/logoLogic.js (تُعاد تصديرها هنا لأن هذه الوحدة تستعملها)
export { printLogoImg };

export const trackingCardFileName = (entry) => `بطاقة_متابعة_${String(entry.studentName).replace(/\s+/g, '_')}.html`;
export const trackingCardWordFileName = (entry) => {
  const safe = String(entry.studentName || 'تلميذ').replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '_');
  return `بطاقة_متابعة_${safe || 'تلميذ'}.doc`;
}

export function trackingCardHtml(entry, { logo = '', now = new Date() } = {}) {
  const E = iEsc;
  const logs = entry.trackingLogs || [];
  const date = longDate(now);
  const rowsHtml = logs.length
    ? [...logs].map((log, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:center;color:#64748b;">${idx + 1}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-weight:700;color:#1a3a5c;white-space:nowrap;">📅 ${E(log.date)}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;">
          <span style="background:${TRACK_BG[log.result] || '#f1f5f9'};color:${TRACK_COLOR[log.result] || '#475569'};border:1px solid ${TRACK_COLOR[log.result] || '#cbd5e1'}40;border-radius:8px;padding:3px 8px;font-size:0.78rem;font-weight:700;">${E(log.result) || '—'}</span>
        </td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;color:#374151;">${E(log.note) || '—'}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;color:#374151;">${E(log.by) || '—'}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;color:#0f766e;">${log.nextDate ? '📅 ' + E(log.nextDate) : '—'}</td>
      </tr>`).join('')
    : `<tr><td colspan="6" style="padding:20px;text-align:center;color:#64748b;border:1px solid #e2e8f0;">لم تُسجَّل أي جلسة متابعة بعد.</td></tr>`;
  const cell = (label, value) => `<div class="info-cell"><div class="info-label">${label}</div><div class="info-value">${value}</div></div>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>بطاقة متابعة — ${E(entry.studentName)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; }
  body { font-family: 'Cairo', sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.10); max-width: 900px; margin: 0 auto; overflow: hidden; }
  .card-header { background: linear-gradient(135deg, #0a1f3d, #0f766e); color: white; padding: 24px 28px; }
  .card-header h1 { font-size: 1.1rem; font-weight: 800; margin: 0 0 6px; }
  .card-header p { font-size: 0.78rem; opacity: 0.8; margin: 0; }
  .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-bottom: 2px solid #e2e8f0; }
  .info-cell { padding: 13px 16px; border-left: 1px solid #e2e8f0; }
  .info-cell:last-child { border-left: none; }
  .info-label { font-size: 0.68rem; font-weight: 700; color: #64748b; margin-bottom: 3px; }
  .info-value { font-size: 0.84rem; font-weight: 700; color: #1a3a5c; }
  .table-section { padding: 20px 24px; }
  .table-section h3 { font-size: 0.88rem; font-weight: 800; color: #0f766e; border-bottom: 2px solid #99f6e4; padding-bottom: 8px; margin-bottom: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  thead tr { background: linear-gradient(135deg, #0a1f3d, #1a3a5c); color: white; }
  thead th { padding: 10px 12px; text-align: right; font-weight: 700; border: none; }
  .footer { text-align: center; padding: 16px; font-size: 0.72rem; color: #94a3b8; border-top: 1px solid #e2e8f0; background: #f8fafc; }
  .sigs { display: flex; justify-content: space-around; padding: 24px; border-top: 1px solid #e2e8f0; }
  .sig { text-align: center; flex: 1; }
  .sig-line { border-top: 2px solid #1a3a5c; margin-bottom: 6px; }
  .sig-lbl { font-size: 0.72rem; color: #64748b; }
  @media print { body { padding: 0; } .card { box-shadow: none; } }
</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <div style="text-align:center;margin-bottom:10px;background:#fff;border-radius:8px;padding:6px;">
      ${printLogoImg(logo, 90)}
    </div>
    <h1 style="text-align:center;">📋 بطاقة المتابعة والتتبع الفردية</h1>
    <p style="text-align:center;">التلميذ(ة): <strong>${E(entry.studentName)}</strong> — بتاريخ: ${date}</p>
  </div>
  <div class="info-grid">
    ${cell('اسم التلميذ(ة)', '♿ ' + E(entry.studentName))}
    ${cell('رقم مسار', E(entry.massar) || '—')}
    ${cell('القسم', E(entry.level) || '—')}
    ${cell('المؤسسة', E(entry.school) || '—')}
    ${cell('نوع الوضعية', E(entry.category) || '—')}
    ${cell('تاريخ فتح الملف', '📅 ' + (E(entry.recordDate) || '—'))}
    ${cell('الحالة الراهنة', E(entry.currentStatus) || '—')}
    ${cell('درجة الأولوية', E(entry.priority) || '—')}
    ${cell('المتابعة القادمة', E(entry.nextFollowup) || '—')}
  </div>
  <div class="table-section">
    <h3>🗂️ سجل جلسات المتابعة — (${logs.length} جلسة)</h3>
    <table>
      <thead>
        <tr>
          <th>#</th><th>📅 تاريخ المتابعة</th><th>📊 نتيجة المتابعة</th>
          <th>📝 الملاحظات</th><th>👤 المتابِع</th><th>📅 الموعد القادم</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>
  <div class="sigs">
    <div class="sig"><div class="sig-line"></div><span class="sig-lbl">المختص الاجتماعي</span></div>
    <div class="sig"><div class="sig-line"></div><span class="sig-lbl">مدير المؤسسة</span></div>
  </div>
  <div class="footer">أدوات التوثيق — المختص الاجتماعي © 2026 | تم طباعة هذه البطاقة بتاريخ: ${date}</div>
</div>
</body></html>`;
}

// snDownloadTrackingCardWord: صيغة متوافقة مع Word (.doc)
export function trackingCardWordHtml(entry, { now = new Date() } = {}) {
  const logs = entry.trackingLogs || [];
  const esc = (value) => String(value == null || value === '' ? '—' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const today = longDate(now);
  const info = [
    ['اسم التلميذ(ة)', entry.studentName], ['رقم مسار', entry.massar],
    ['القسم', entry.level], ['المؤسسة', entry.school],
    ['نوع الوضعية', entry.category], ['تاريخ فتح الملف', entry.recordDate],
    ['الحالة الراهنة', entry.currentStatus], ['درجة الأولوية', entry.priority],
    ['المتابعة القادمة', entry.nextFollowup],
  ];
  const infoRows = info.map(([label, value]) => `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`).join('');
  const logRows = logs.length ? logs.map((log, i) =>
    `<tr><td>${i + 1}</td><td>${esc(log.date)}</td><td>${esc(log.result)}</td><td>${esc(log.note)}</td><td>${esc(log.by)}</td><td>${esc(log.nextDate)}</td></tr>`
  ).join('') : '<tr><td colspan="6" style="text-align:center">لم تُسجَّل أي جلسة متابعة بعد.</td></tr>';
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>بطاقة متابعة - ${esc(entry.studentName)}</title>
  <style>@page{size:A4;margin:15mm}body{font-family:Arial,sans-serif;direction:rtl;text-align:right;color:#172033;font-size:11pt}h1{text-align:center;background:#0f766e;color:#fff;padding:14px;font-size:17pt}h2{color:#0f766e;border-bottom:2px solid #99f6e4;padding-bottom:6px;font-size:13pt}table{width:100%;border-collapse:collapse;margin:10px 0 18px}td,th{border:1.5px solid #000;padding:7px;text-align:right;vertical-align:top}th{background:#eef4fb;width:25%}thead th{background:#1a3a5c;color:#fff;width:auto}tr{page-break-inside:avoid}.signatures{margin-top:35px;display:table;width:100%}.signatures div{display:table-cell;text-align:center;width:50%;padding:15px}.line{border-top:1px solid #222;margin:22px 15px 6px}.footer{text-align:center;margin-top:20px;color:#64748b;font-size:9pt}</style></head><body dir="rtl">
  <h1>بطاقة المتابعة والتتبع الفردية</h1><p style="text-align:center">التلميذ(ة): <strong>${esc(entry.studentName)}</strong> — تاريخ إعداد البطاقة: ${esc(today)}</p>
  <h2>المعلومات الأساسية</h2><table><tbody>${infoRows}</tbody></table>
  <h2>سجل جلسات المتابعة (${logs.length} جلسة)</h2><table><thead><tr><th>#</th><th>تاريخ المتابعة</th><th>نتيجة المتابعة</th><th>الملاحظات</th><th>المتابع</th><th>الموعد القادم</th></tr></thead><tbody>${logRows}</tbody></table>
  <div class="signatures"><div><div class="line"></div>المختص الاجتماعي</div><div><div class="line"></div>مدير المؤسسة</div></div><div class="footer">أدوات التوثيق — المختص الاجتماعي © 2026</div></body></html>`;
}
