// منطق نافذة «معاينة وتعديل التقرير الأسبوعي» — دوال نقية بلا DOM ولا React، منقولة من openWeeklyReportPreview
// وwprOpenEdit وwprSaveEdit وwprDeleteRow القديمة في script-10.js (الخطوة 40) بنفس القواعد حرفياً.
// مفاتيح النموذج (form) هي نفسها معرّفات الحقول القديمة بلا البادئة wpr_ed_ (name وschool وwsType ...)،
// فيسهل مقارنتها بالقديم في اختبار المطابقة.

// ── الأقسام (التبويبات) والألوان ──
export const TABS = [
  { id: 'all', label: '📋 كل الملفات' },
  { id: 'interview', label: '🗂 مقابلات' },
  { id: 'reintegration', label: '🔄 إدماج' },
  { id: 'absence', label: '🚨 غياب' },
  { id: 'violence', label: '🛡️ عنف' },
  { id: 'workshop', label: '🎓 ورشات' },
  { id: 'specNeeds', label: '♿ إعاقة' },
  { id: 'parents', label: '📞 الأولياء' },
];

  export const TYPE_LABELS = { interview: 'مقابلات', reintegration: 'إدماج', absence: 'غياب', violence: 'عنف', workshop: 'ورشات', specNeeds: 'إعاقة', parentCall: 'اتصالات الأولياء', parentMeeting: 'مقابلات الأولياء' };
  export const TYPE_COLORS = { interview: '#1a3a5c', reintegration: '#0f766e', absence: '#d97706', violence: '#dc2626', workshop: '#7c3aed', specNeeds: '#0891b2', parentCall: '#be185d', parentMeeting: '#9d174d' };

export const PRIORITIES = ['عاجلة', 'عالية', 'متوسطة', 'عادية', '—'];
export const STATUSES = ['مُنجز', 'قيد المتابعة', 'جارية', 'منتهية', 'مُغلق', 'أخرى'];
export const GENDERS = ['ذكر', 'أنثى'];
export const VIOLENCE_STATUSES = ['جارية', 'تحت المراقبة', 'مُغلقة', 'محالة', 'أخرى'];

// ── نطاق الأسبوع ──
// المحفوظ في المتصفح (wp:selectedFrom/To) وإلا الأسبوع الحالي من الاثنين إلى الأحد. toISOString كما في القديم تماماً.
export function resolveRange(storage, now = new Date()) {
  let from = null;
  let to = null;
  try { from = storage.getItem('wp:selectedFrom'); to = storage.getItem('wp:selectedTo'); } catch (e) { /* التخزين غير متاح */ }
  if (!from || !to) {
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const mon = new Date(now); mon.setDate(now.getDate() + diff);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    from = mon.toISOString().slice(0, 10);
    to = sun.toISOString().slice(0, 10);
  }
  return { from, to };
}

// ── التصفية والإحصاء ──
  export const filterRows = (rows, tab) => (tab === 'all' ? rows : tab === 'parents' ? rows.filter((r) => r._type === 'parentCall' || r._type === 'parentMeeting') : rows.filter((r) => r._type === tab));

// الإجمالي ثم عدد كل نوع بترتيب أول ظهور في الصفوف (كما كانت wprRenderStats تفعل)
export function statsOf(rows) {
  const counts = [];
  const seen = {};
  rows.forEach((r) => {
    if (seen[r._type] == null) { seen[r._type] = counts.length; counts.push({ type: r._type, count: 0 }); }
    counts[seen[r._type]].count += 1;
  });
  return { total: rows.length, byType: counts };
}

// ── شارات الجدول ──
export const priorityBadge = (p) => (p === 'عاجلة' ? '🔴' : p === 'عالية' ? '🟠' : p === 'متوسطة' ? '🟡' : p === 'عادية' ? '🟢' : '—');
const DONE = ['مُنجز', 'منتهية', 'مُغلق'];
const PENDING = ['قيد المتابعة', 'جارية'];
export const statusBg = (s) => (DONE.includes(s) ? '#dcfce7' : PENDING.includes(s) ? '#fef9c3' : '#f1f5f9');
export const statusColor = (s) => (DONE.includes(s) ? '#166534' : PENDING.includes(s) ? '#854d0e' : '#475569');
// نص الأولوية بجانب الشارة: يُخفى إن كان فارغاً أو «—»
export const priorityText = (p) => (p && p !== '—' ? p : '');

// خلية الحالة في الجدول
export const rowStatus = (r) => r[r._statusField] || '—';

// ── نموذج التعديل ──
// الحالة الراهنة: إن كانت قيمة غريبة تُضاف في أول القائمة. وإن كانت فارغة يعرض المتصفح أول خيار («مُنجز») — نُبقي ذلك للمطابقة.
export function statusOptions(cur) {
  return cur && !STATUSES.includes(cur) ? [cur, ...STATUSES] : STATUSES;
}
const initialStatus = (cur) => (cur || STATUSES[0]);
// الأولوية خارج القائمة (أو فارغة): يعرض المتصفح أول خيار («عاجلة»)
const initialPriority = (p) => (PRIORITIES.includes(p) ? p : PRIORITIES[0]);

const EXTRA_TYPES = ['interview', 'reintegration', 'absence', 'specNeeds'];

// الأقسام الديناميكية حسب نوع السجل. كل حقل: key وlabel وkind (text/number/select/textarea) وplaceholder/options
// وinit(r) القيمة الابتدائية. write(v) يعيد الحقول التي تُكتب في السجل (الحقول المكرَّرة بأسماء بديلة كما في القديم).
export function dynamicSections(type, label) {
  const sections = [];
  if (EXTRA_TYPES.includes(type)) {
    sections.push({
      id: 'extra', title: '📋 معلومات إضافية — ' + label, cols: 2, fields: [
        { key: 'level', label: 'القسم', kind: 'text', placeholder: 'مثال: السادس ابتدائي أ', init: (r) => r.level || '', write: (v) => ({ level: v }) },
        { key: 'gender', label: 'الجنس', kind: 'select', options: GENDERS, blank: '— اختر —', init: (r) => (GENDERS.includes(r.gender) ? r.gender : ''), write: (v) => ({ gender: v }) },
      ],
    });
  }
  if (type === 'interview') {
    sections.push({
      id: 'interview', title: '🗂 تفاصيل المقابلة', cols: 2, fields: [
        { key: 'reason', label: 'سبب المقابلة', kind: 'text', placeholder: 'سبب المقابلة', init: (r) => r.reason || r.interviewReason || '', write: (v) => ({ reason: v, interviewReason: v }) },
        { key: 'caseStatus', label: 'وضعية الحالة', kind: 'text', placeholder: 'وضعية الحالة', init: (r) => r.caseStatus || r.status || '', write: (v) => ({ caseStatus: v }) },
      ],
    });
  }
  if (type === 'workshop') {
    sections.push({
      id: 'workshop', title: '🎓 تفاصيل الورشة / النشاط', cols: 2, fields: [
        { key: 'wsType', label: 'نوع النشاط', kind: 'text', placeholder: 'نوع النشاط', init: (r) => r.type || r.activityType || '', write: (v) => ({ type: v, activityType: v }) },
        { key: 'wsParticipants', label: 'عدد المشاركين', kind: 'number', placeholder: 'عدد المشاركين', init: (r) => String(r.participants || r.participantsCount || ''), write: (v) => ({ participants: v, participantsCount: v }) },
        { key: 'wsClasses', label: 'الأقسام المستهدفة', kind: 'text', full: true, placeholder: 'مثال: 1APIC-1، 2APIC-3، ...', init: (r) => r.classes || '', write: (v) => ({ classes: v }) },
        { key: 'wsResult', label: 'نتيجة / ملاحظات الورشة', kind: 'textarea', rows: 2, full: true, init: (r) => r.result || '', write: (v) => ({ result: v }) },
      ],
    });
  }
  if (type === 'violence') {
    sections.push({
      id: 'violence', title: '🛡️ تفاصيل حالة العنف', cols: 2, fields: [
        { key: 'vioCategory', label: 'نوع العنف', kind: 'text', placeholder: 'نوع العنف', init: (r) => r.category || r.violenceType || '', write: (v) => ({ category: v, violenceType: v }) },
        { key: 'vioStatus', label: 'وضعية الحالة', kind: 'select', options: VIOLENCE_STATUSES, blank: '— اختر —', init: (r) => (VIOLENCE_STATUSES.includes(r.status) ? r.status : ''), write: (v) => ({ status: v }) },
        { key: 'vioActions', label: 'الإجراءات المتخذة', kind: 'textarea', rows: 2, full: true, init: (r) => r.actions || '', write: (v) => ({ actions: v }) },
      ],
    });
  }
  if (type === 'absence') {
    sections.push({
      id: 'absence', title: '🚨 تفاصيل ملف الغياب', cols: 2, fields: [
        { key: 'abDays', label: 'عدد أيام الغياب', kind: 'number', placeholder: 'عدد الأيام', init: (r) => String(r.absenceDays || r.days || ''), write: (v) => ({ absenceDays: v, days: v }) },
        { key: 'abType', label: 'نوع الغياب', kind: 'text', placeholder: 'مبرر / غير مبرر', init: (r) => r.absenceType || r.type || '', write: (v) => ({ absenceType: v, type: v }) },
      ],
    });
  }
  if (type === 'specNeeds') {
    sections.push({
      id: 'specNeeds', title: '♿ تفاصيل وضعية الإعاقة', cols: 1, fields: [
        { key: 'snDiag', label: 'نوع الإعاقة / التشخيص', kind: 'text', placeholder: 'التشخيص أو نوع الإعاقة', init: (r) => r.diagnosis || r.disabilityType || '', write: (v) => ({ diagnosis: v, disabilityType: v }) },
        { key: 'snActions', label: 'الإجراءات والدعم المقدَّم', kind: 'textarea', rows: 2, init: (r) => r.actions || r.support || '', write: (v) => ({ actions: v, support: v }) },
      ],
    });
  }
  return sections;
}

const dynamicFields = (row) => dynamicSections(row._type, row._label).flatMap((s) => s.fields);

// القيم الابتدائية للنموذج (ما كانت wprOpenEdit تضعه في الحقول)
export function initialForm(row) {
  const form = {
    name: row.studentName || row.title || '',
    school: row.school || '',
    date: row[row._dateField] || '',
    status: initialStatus(row[row._statusField] || ''),
    priority: initialPriority(row.priority),
    followup: row.nextFollowup || '',
    notes: row.notes || '',
  };
  dynamicFields(row).forEach((f) => { form[f.key] = f.init(row); });
  return form;
}

// ما يُكتب في السجل عند «حفظ التعديلات» (wprSaveEdit): الأساسيات مقصوصة الفراغات (الاسم والمؤسسة والملاحظات فقط)
// ثم الحقول الديناميكية فوقها (فتغلب على الأساسية إن تعارضت، كحالة العنف والورشة). patch يُطبَّق على سجل الأرشيف،
// وللصف المعروض يُضاف إليه _date.
export function buildPatch(row, form) {
  const patch = {
    studentName: String(form.name).trim(),
    school: String(form.school).trim(),
    [row._dateField]: form.date,
    [row._statusField]: form.status,
    priority: form.priority,
    nextFollowup: form.followup,
    notes: String(form.notes).trim(),
  };
  if (row._type === 'workshop') patch.title = patch.studentName;
  dynamicFields(row).forEach((f) => Object.assign(patch, f.write(String(form[f.key]).trim())));
  return patch;
}

// الصف المعروض بعد التعديل (نسخة جديدة)
export const applyToRow = (row, form) => ({ ...row, ...buildPatch(row, form), _date: form.date });

// ── الأرشيف الفعلي ──
// bridge: { get(type) → مصفوفة الأرشيف، save(type, مصفوفة) } — يوفّره جسر الجلسة (weeklyBridge) لأن appData ثابت غير ظاهر للوحدات.
// المعرّف يُقارن بـ == كما في القديم (id رقمي أو نصي). بلا معرّف لا نلمس الأرشيف حتى لا يُعدَّل سجل آخر بلا معرّف.
const hasId = (row) => row.id != null && row.id !== '';
const indexById = (arc, id) => arc.findIndex((e) => e.id == id);

export function updateArchive(bridge, row, patch) {
  if (!bridge || !hasId(row)) return false;
  const arc = bridge.get(row._type);
  const i = indexById(arc, row.id);
  if (i === -1) return false;
  Object.assign(arc[i], patch);
  bridge.save(row._type, arc);
  return true;
}

export function removeFromArchive(bridge, row) {
  if (!bridge || !hasId(row)) return false;
  const arc = bridge.get(row._type);
  const i = indexById(arc, row.id);
  if (i === -1) return false;
  arc.splice(i, 1);
  bridge.save(row._type, arc);
  return true;
}

// نص تأكيد الحذف
export function deleteMessage(row, { fromArchive = true } = {}) {
  const name = row.studentName || row.title || '';
  return '⚠️ هل تريد حذف هذا السجل نهائياً' + (fromArchive ? ' من الأرشيف' : '') + '؟\n\nالنوع: ' + (row._label || 'السجل') + (name ? '\nالاسم: ' + name : '') + '\nالتاريخ: ' + (row._date || '—');
}
