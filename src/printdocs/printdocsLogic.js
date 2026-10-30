// المنطق الخالص لـ«بوابة الإحالة والإخبار الصحي» (printdocs) — منقول من script-09/10/28/30 القديمة بلا تغيير في السلوك.
// تبويبان: 3 = نموذج الإحالة إلى جمعية (pdAssocArchive) ، 4 = وثيقة إخبار بحالة صحية (pdHealthArchive).
// شكل «النموذج» المتداول هنا: { fields: { [معرّف الحقل القديم]: قيمة }, type, procs, teachers }
// (type/procs/teachers للتبويب 4 فقط: نوع الحالة، إجراءات القسم، أسماء الأساتذة).

export const TAB_ASSOC = 3;
export const TAB_HEALTH = 4;

// ───────── خيارات الملء (حرفياً من script-30.js) ─────────
export const HEALTH_COND = [
  ['الربو', 'يعاني التلميذ(ة) من الربو وضيق التنفس، وتزداد الأعراض عند بذل مجهود بدني أو التعرض للغبار والبرد.'],
  ['السكري', 'يعاني التلميذ(ة) من داء السكري ويحتاج إلى مراقبة منتظمة لمستوى السكر وتناول وجبات خفيفة في أوقات محددة.'],
  ['الصرع', 'يعاني التلميذ(ة) من الصرع وقد تظهر لديه نوبات تشنجية مفاجئة تستدعي احتياطات خاصة داخل القسم.'],
  ['الحساسية', 'يعاني التلميذ(ة) من حساسية (غذائية / موسمية / جلدية) قد تظهر على شكل طفح جلدي أو ضيق في التنفس.'],
  ['أمراض القلب', 'يعاني التلميذ(ة) من مرض في القلب ويُمنع من الجهد البدني الشديد ويتطلب مراقبة مستمرة.'],
  ['فقر الدم والإرهاق', 'يعاني التلميذ(ة) من فقر الدم ويظهر عليه التعب والإرهاق وشحوب في الوجه وصعوبة في التركيز.'],
  ['ضعف البصر', 'يعاني التلميذ(ة) من ضعف في البصر ويجد صعوبة في قراءة السبورة من مسافة بعيدة.'],
  ['ضعف السمع', 'يعاني التلميذ(ة) من ضعف في السمع ويحتاج إلى الجلوس قرب الأستاذ(ة) ووضوح في الشرح.'],
  ['صداع ودوار', 'يشتكي التلميذ(ة) من صداع متكرر ودوار يؤثران على انتباهه وتحصيله الدراسي.'],
  ['اضطرابات هضمية', 'يعاني التلميذ(ة) من اضطرابات في الجهاز الهضمي (آلام في البطن / قيء / إسهال) تستدعي الخروج المتكرر.'],
  ['أمراض جلدية', 'يعاني التلميذ(ة) من مرض جلدي يستدعي عناية ونظافة خاصة وقد يؤثر على اندماجه داخل القسم.'],
  ['إصابة أو كسر', 'تعرض التلميذ(ة) لإصابة (كسر / التواء / جرح) تحد من حركته وتستلزم رعاية خاصة داخل المؤسسة.'],
  ['عملية جراحية', 'خضع التلميذ(ة) لعملية جراحية ويمر بفترة نقاهة تتطلب تخفيف المجهود ومتابعة طبية.'],
  ['مرض مزمن', 'يعاني التلميذ(ة) من مرض مزمن يتطلب علاجاً ومتابعة طبية منتظمة.'],
  ['مرض معدٍ', 'يعاني التلميذ(ة) من مرض معدٍ يتطلب أخذ الاحتياطات اللازمة ومراعاة مدة الانقطاع الموصى بها طبياً.'],
  ['اضطراب نفسي', 'تظهر على التلميذ(ة) علامات اضطراب نفسي (قلق / انطواء / حزن مستمر) تستدعي مواكبة نفسية واجتماعية.'],
  ['اضطراب النطق', 'يعاني التلميذ(ة) من اضطراب في النطق يؤثر على مشاركته الشفهية داخل القسم.'],
  ['سوء التغذية', 'تظهر على التلميذ(ة) علامات سوء التغذية ونحافة ملحوظة وضعف في النشاط.'],
];
export const HEALTH_DET = [
  ['منذ أيام', 'ظهرت الأعراض منذ بضعة أيام.'],
  ['منذ أسابيع', 'ظهرت الأعراض منذ بضعة أسابيع.'],
  ['منذ أشهر', 'ظهرت الأعراض منذ عدة أشهر.'],
  ['منذ سنوات', 'الحالة قائمة منذ سنوات.'],
  ['أعراض متكررة', 'الأعراض متكررة وتظهر بشكل متقطع.'],
  ['شهادة طبية', 'أدلى الولي بشهادة طبية تؤكد الحالة.'],
  ['بدون شهادة طبية', 'لم تُدلَ بعد بشهادة طبية، ويُرجى إحضارها.'],
  ['يتابع العلاج', 'يتابع العلاج بانتظام تحت إشراف طبيب مختص.'],
  ['تؤثر على التحصيل', 'تؤثر الحالة على الانتباه والتحصيل الدراسي وعلى انتظام الحضور.'],
  ['تحتاج مراقبة', 'تحتاج الحالة إلى مراقبة مستمرة من طرف الأساتذة والإدارة.'],
];
export const REASON = [
  ['صعوبات التعلم', 'يعاني التلميذ(ة) من صعوبات في التعلم وتأخر دراسي ملحوظ يستدعي دعماً تربوياً متخصصاً.'],
  ['الغياب المتكرر', 'يسجل التلميذ(ة) غياباً متكرراً وغير مبرر يهدد استمراره في الدراسة.'],
  ['خطر الهدر المدرسي', 'التلميذ(ة) معرّض لخطر الانقطاع عن الدراسة والهدر المدرسي.'],
  ['وضعية أسرية صعبة', 'يعيش التلميذ(ة) وضعية أسرية صعبة (تفكك أسري / فقدان أحد الوالدين / نزاعات).'],
  ['هشاشة اجتماعية واقتصادية', 'تعاني أسرة التلميذ(ة) من هشاشة اجتماعية واقتصادية وتحتاج إلى مساعدة (لوازم مدرسية / تغذية / نقل).'],
  ['العنف أو سوء المعاملة', 'تعرض التلميذ(ة) لعنف أو سوء معاملة ويحتاج إلى حماية ومواكبة نفسية واجتماعية.'],
  ['التنمر', 'يتعرض التلميذ(ة) للتنمر من طرف زملائه ويحتاج إلى دعم نفسي واجتماعي.'],
  ['سلوك عدواني', 'يُسجَّل لدى التلميذ(ة) سلوك عدواني واضطراب في الانضباط يتطلب تدخلاً متخصصاً.'],
  ['دعم نفسي واجتماعي', 'يحتاج التلميذ(ة) إلى دعم نفسي واجتماعي بسبب القلق والانطواء وضعف الثقة بالنفس.'],
  ['احتياجات خاصة / إعاقة', 'التلميذ(ة) في وضعية إعاقة أو لديه احتياجات خاصة تستلزم تكفلاً من جمعية مختصة.'],
  ['وضعية صحية', 'يعاني التلميذ(ة) من وضعية صحية تستدعي تكفلاً وعلاجاً خارج المؤسسة.'],
  ['سلوكيات محفوفة بالمخاطر', 'تظهر على التلميذ(ة) سلوكيات محفوفة بالمخاطر (تدخين / مخدرات / صحبة سيئة) تستدعي التوعية والمواكبة.'],
  ['التوجيه والإدماج المهني', 'يحتاج التلميذ(ة) إلى توجيه وتكوين مهني أو إدماج في برنامج للفرصة الثانية.'],
];
export const PREV = [
  ['مقابلة فردية', 'أُجريت مقابلة فردية مع التلميذ(ة) من طرف المختص الاجتماعي.'],
  ['استدعاء الولي', 'تم استدعاء ولي الأمر وعقد جلسة معه.'],
  ['اتصال هاتفي', 'تم الاتصال هاتفياً بولي الأمر.'],
  ['جلسة مع الأساتذة', 'عُقدت جلسة مع الفريق التربوي لتدارس وضعية التلميذ(ة).'],
  ['تتبع داخل المؤسسة', 'تم تتبع الحالة داخل المؤسسة بتنسيق مع الأساتذة والإدارة.'],
  ['زيارة منزلية', 'تم القيام بزيارة منزلية للتعرف على ظروف التلميذ(ة).'],
  ['خلية اليقظة', 'عُرضت الحالة على خلية اليقظة بالمؤسسة.'],
  ['لم تنجح الإجراءات', 'لم تسفر الإجراءات المتخذة عن تحسن، مما استدعى الإحالة.'],
];

// لوحات الاقتراحات: box = معرّف الحاوية القديم، target = معرّف الحقل الذي تُكتب فيه الجمل
export const CHIP_PANELS = {
  health: { box: 'pd4-health-chips', target: 'pd4-health-desc', syncType: true, groups: [['اختر الحالة الصحية (يمكن اختيار أكثر من حالة):', HEALTH_COND], ['تفاصيل إضافية:', HEALTH_DET]] },
  reason: { box: 'pd3-reason-chips', target: 'pd3-reason', groups: [['اختر سبب الإحالة (يمكن اختيار أكثر من سبب):', REASON]] },
  prev: { box: 'pd3-prev-chips', target: 'pd3-prev-actions', groups: [['الإجراءات المتخذة:', PREV]] },
};
const COND_LABELS = new Set(HEALTH_COND.map((c) => c[0]));

// ───────── الحقول ─────────
export const FIELD_IDS = {
  3: ['pd3-date', 'pd3-ref', 'pd3-urgency', 'pd3-name', 'pd3-dob', 'pd3-school', 'pd3-level', 'pd3-parent', 'pd3-phone',
    'pd3-assoc', 'pd3-assoc-addr', 'pd3-assoc-phone', 'pd3-reason', 'pd3-prev-actions', 'pd3-ref-date'],
  4: ['pd4-date', 'pd4-ref', 'pd4-urgency', 'pd4-name', 'pd4-dob', 'pd4-school', 'pd4-grade', 'pd4-level', 'pd4-massar', 'pd4-health-desc'],
};
// حقول يكتب فيها الإكمال التلقائي وapplyInstitutionEverywhere مباشرة في DOM → لا يملكها React (تُقرأ بالمرجع)
export const REF_FIELDS = {
  3: ['pd3-name', 'pd3-dob', 'pd3-school', 'pd3-level'],
  4: ['pd4-name', 'pd4-dob', 'pd4-school', 'pd4-level', 'pd4-massar'],
};
export const STATE_FIELDS = {
  3: FIELD_IDS[3].filter((id) => !REF_FIELDS[3].includes(id)),
  4: FIELD_IDS[4].filter((id) => !REF_FIELDS[4].includes(id)),
};
export const AC_CFGS = [
  { nameId: 'pd3-name', massarId: 'pd3-massar', schoolId: 'pd3-school', levelId: 'pd3-level', dobId: 'pd3-dob', phoneId: 'pd3-phone' },
  { nameId: 'pd4-name', massarId: 'pd4-massar', schoolId: 'pd4-school', levelId: 'pd4-level', dobId: 'pd4-dob' }, ];
export const ARCHIVE_KEY = { 3: 'pdAssocArchive', 4: 'pdHealthArchive' };
export const NAME_ID = { 3: 'pd3-name', 4: 'pd4-name' };
export const ARCHIVE_META = {
  3: { label: 'نموذج الإحالة إلى جمعية', color: '#5b21b6', extraHead: 'الجمعية', icon: '🏛️ ' },
  4: { label: 'وثيقة إخبار بحالة صحية', color: '#b91c1c', extraHead: 'نوع الحالة', icon: '🏥 ' },
};
export const URGENCY_OPTIONS = {
  3: ['🔴 عاجلة جداً', '🟠 عاجلة', '🟡 عادية'],
  4: ['عاجلة جداً', 'عاجلة', 'عادية'],
};
export const MIN_PROCS = 3;
export const MIN_TEACHERS = 8;

export const MSG = {
  NAME_FIRST: '⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.',
  SAVED: (name) => '✅ تم حفظ ملف "' + name + '" في الأرشيف.',
  UPDATED: (name) => '✅ تم تحديث ملف "' + name + '" في الأرشيف.',
  LOADED: '✏️ تم تحميل الملف — عدّل ثم اضغط "حفظ في الأرشيف" لتحديثه.',
  CONFIRM_DELETE: 'حذف هذا الملف من الأرشيف؟',
  EMPTY_ARCHIVE: '📂 الأرشيف فارغ بالفعل.',
  CONFIRM_CLEAR_ARCHIVE: (n) => '⚠️ سيتم حذف جميع الملفات (' + n + ' ملف) نهائياً.\n\nهل أنت متأكد من المسح الكامل؟',
  MODAL_TITLE: { 3: '📄 نموذج الإحالة إلى جمعية', 4: '📄 وثيقة إخبار بحالة صحية' },
  WORD_FILE: { 3: 'نموذج_الإحالة_إلى_جمعية', 4: 'وثيقة_إخبار_بحالة_صحية' },
};

// ───────── أدوات نصية ─────────
export const todayIso = (now = new Date()) => now.toISOString().split('T')[0]; // كما في pdInit/pdClearTab القديمتين (UTC)
const NO_DEFAULT_DATE = /-(dob|ref-date)$/; // تاريخ الازدياد وتاريخ استلام الجمعية يبدآن فارغين

export function E(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
export function clean(t) { return String(t || '').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').trim(); }
export function fmtDateReport(t) { t = String(t || '').trim(); const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? (m[3] + '/' + m[2] + '/' + m[1]) : t; }
// أرشيف: يترك القيمة كما هي إن لم تكن بصيغة ISO، وإن كانت فارغة يعرض «—»
export function dfmt(d) { const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? (m[3] + '/' + m[2] + '/' + m[1]) : (d || '—'); }
function dash(t) { t = String(t || '').trim(); return t ? E(t) : '—'; }
function dots(t, n) { t = String(t || '').trim(); return t ? E(t) : new Array((n || 30) + 1).join('.'); }

// ───────── حالة النموذج ─────────
export function blankFields(n, today = todayIso()) {
  const f = {};
  FIELD_IDS[n].forEach((id) => { f[id] = /-date$/.test(id) && !NO_DEFAULT_DATE.test(id) ? today : ''; });
  return f;
}
export const blankProcs = () => new Array(MIN_PROCS).fill('');
export const blankTeachers = () => new Array(MIN_TEACHERS).fill('');
export function blankForm(n, today = todayIso()) {
  const form = { fields: blankFields(n, today) };
  if (n === TAB_HEALTH) { form.type = ''; form.procs = blankProcs(); form.teachers = blankTeachers(); }
  return form;
}
// pdInit: عند فتح البوابة تُملأ تواريخ اليوم الفارغة فقط (غير الازدياد/الاستلام)
export function fillEmptyDates(n, fields, today = todayIso()) {
  const out = { ...fields };
  FIELD_IDS[n].forEach((id) => { if (/-date$/.test(id) && !out[id] && !NO_DEFAULT_DATE.test(id)) out[id] = today; });
  return out;
}

const grow = (arr, min) => { const a = (arr || []).map((v) => (v == null ? '' : String(v))); while (a.length < min) a.push(''); return a; };

// نموذج من سجل محفوظ (restore القديمة: مسح ثم ملء الحقول المحفوظة)
export function formFromEntry(n, entry, today = todayIso()) {
  const saved = (entry && entry.fields) || {};
  const form = blankForm(n, today);
  Object.keys(saved).forEach((id) => { if (id in form.fields) form.fields[id] = saved[id] == null ? '' : String(saved[id]); });
  if (n === TAB_HEALTH) {
    form.teachers = grow(entry.teachers, MIN_TEACHERS);
    form.procs = grow(entry.procs, MIN_PROCS);
    form.type = entry.type || '';
  }
  return form;
}

// ───────── الأرشيف ─────────
export function collectEntry(n, form) {
  // الحقول بترتيب DOM القديم؛ (القديم كان يلتقط معها حقل بحث الأرشيف عن غير قصد — لا نحفظه)
  const fields = {};
  FIELD_IDS[n].forEach((id) => { fields[id] = form.fields[id] == null ? '' : form.fields[id]; });
  const e = { fields };
  if (n === TAB_HEALTH) { e.teachers = (form.teachers || []).slice(); e.type = form.type || ''; e.procs = (form.procs || []).slice(); }
  return e;
}

// null إن لم يُدخَل اسم (يعرض الاستدعاء رسالة NAME_FIRST)
export function buildEntry(n, form, { id = Date.now(), now = new Date() } = {}) {
  const name = String(form.fields[NAME_ID[n]] || '').trim();
  if (!name) return null;
  const data = collectEntry(n, form), f = data.fields;
  const entry = {
    id, savedAt: now.toLocaleString('ar-MA'), studentName: name,
    date: (n === TAB_ASSOC ? f['pd3-date'] : f['pd4-date']) || '', ref: (n === TAB_ASSOC ? f['pd3-ref'] : f['pd4-ref']) || '',
    urgency: clean(n === TAB_ASSOC ? f['pd3-urgency'] : f['pd4-urgency']),
    extra: n === TAB_ASSOC ? (f['pd3-assoc'] || '') : (data.type || ''),
    fields: data.fields,
  };
  if (n === TAB_HEALTH) { entry.teachers = data.teachers; entry.type = data.type; entry.procs = data.procs; }
  return entry;
}

// حفظ: إن كان editId موجوداً في الأرشيف حُدِّث السجل بنفس المعرّف، وإلا يُضاف في الأول
export function upsertEntry(archive, entry, editId) {
  const arr = (archive || []).slice();
  let updated = false;
  if (editId) {
    const ix = arr.findIndex((x) => x.id === editId);
    if (ix > -1) { entry = { ...entry, id: editId }; arr[ix] = entry; updated = true; }
  }
  if (!updated) arr.unshift(entry);
  return { archive: arr, updated, entry };
}
export const deleteEntry = (archive, id) => (archive || []).filter((x) => x.id !== id);
export function filterArchive(archive, q) {
  const s = String(q || '').trim().toLowerCase();
  const arr = archive || [];
  return s ? arr.filter((e) => String(e.studentName || '').toLowerCase().indexOf(s) > -1) : arr;
}

// ───────── لوحات الاقتراحات (chips) ─────────
export const chipOn = (text, chipText) => String(text || '').indexOf(chipText) > -1;
// النقر على اقتراح: إن كانت الجملة موجودة تُحذف (أول ظهور) وإلا تُضاف في سطر جديد
export function toggleChipText(v, txt) {
  v = String(v || '');
  if (v.indexOf(txt) > -1) return v.replace(txt, '').replace(/\n{2,}/g, '\n').replace(/^\s+|\s+$/g, '');
  v = v.replace(/\s+$/, '');
  return v ? (v + '\n' + txt) : txt;
}
// نوع الحالة التلقائي: تسميات الحالات الصحية (لا التفاصيل) التي نصها موجود في الوصف، بترتيب الجدول
export function autoTypeLabels(desc) {
  return HEALTH_COND.filter((c) => chipOn(desc, c[1]) && COND_LABELS.has(c[0])).map((c) => c[0]).join(' / ');
}
// syncType القديمة: يُستبدل نوع الحالة بالتلقائي فقط إن كان فارغاً أو ما زال هو نفسه القيمة التلقائية السابقة
export function syncTypeValue(current, lastAuto, desc) {
  const auto = autoTypeLabels(desc);
  const cur = String(current || '');
  if (!cur.trim() || lastAuto === cur) return { type: auto, auto };
  return { type: cur, auto: lastAuto };
}

// ───────── التقرير (script-28.js) ─────────
const V = (fields, id) => String((fields && fields[id]) == null ? '' : fields[id]).trim();
const row = (a, b, c, d) => (c === undefined
  ? '<tr><td class="info-lbl">' + a + '</td><td class="info-val" colspan="3">' + b + '</td></tr>'
  : '<tr><td class="info-lbl">' + a + '</td><td class="info-val">' + b + '</td><td class="info-lbl">' + c + '</td><td class="info-val">' + d + '</td></tr>');
const tbl = (rows) => '<table class="info-table-report" style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:\'Cairo\',sans-serif;margin-bottom:10px;"><tbody>' + rows.join('') + '</tbody></table>';
const block = (t) => '<div class="report-summary-block">' + E(t) + '</div>';
function head(school, title, ctx) {
  return '<div class="new-report-header">'
    + '<div class="nrh-logo"><img id="ministry-logo-img" src="' + (ctx.logo || '') + '" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;"></div>'
    + '<div class="nrh-dir">' + E(ctx.dir || 'مديرية الحي الحسني') + '</div>'
    + '<div class="nrh-school">' + (school ? E(school) : 'المؤسسة التعليمية') + '</div>'
    + '<div class="nrh-title">' + title + '</div></div>';
}
function sigBlock() {
  const box = (a) => '<td data-w="50" data-bold="1" style="width:50%;border:1px solid #cbd5e1;vertical-align:top;padding:10px 12px;height:95px;"><div style="font-weight:700;color:#1a3a5c;margin-bottom:4px;">' + a + '</div></td>';
  return '<div class="report-section-title">التوقيعات والختم</div>'
    + '<table class="pd-table-report" style="width:100%;border-collapse:separate;border-spacing:10px 0;margin-top:6px;page-break-inside:avoid;font-family:\'Cairo\',sans-serif;font-size:0.82rem;"><tbody><tr data-h="75">'
    + box('المختص الاجتماعي') + box('مدير المؤسسة') + '</tr></tbody></table>';
}

function buildAssoc(form, ctx) {
  const f = form.fields;
  let h = head(V(f, 'pd3-school'), 'نموذج الإحالة إلى جمعية', ctx);
  h += '<div class="report-section-title">بيانات الإحالة</div>' + tbl([
    row('تاريخ الإحالة:', dash(fmtDateReport(V(f, 'pd3-date'))), 'رقم الإحالة:', dash(V(f, 'pd3-ref'))),
    row('درجة الاستعجالية:', dash(clean(V(f, 'pd3-urgency')))),
  ]);
  h += '<div class="report-section-title">بيانات المستفيد</div>' + tbl([
    row('الاسم الكامل:', dash(V(f, 'pd3-name')), 'تاريخ الازدياد:', dash(fmtDateReport(V(f, 'pd3-dob')))),
    row('المؤسسة التعليمية:', dash(V(f, 'pd3-school')), 'القسم:', dash(V(f, 'pd3-level'))),
    row('اسم الولي:', dash(V(f, 'pd3-parent')), 'هاتف الولي:', '<span dir="ltr">' + dash(V(f, 'pd3-phone')) + '</span>'),
  ]);
  h += '<div class="report-section-title">بيانات الجمعية المُحال إليها</div>' + tbl([
    row('اسم الجمعية:', dash(V(f, 'pd3-assoc')), 'هاتف الجمعية:', '<span dir="ltr">' + dash(V(f, 'pd3-assoc-phone')) + '</span>'),
    row('العنوان:', dash(V(f, 'pd3-assoc-addr'))),
  ]);
  h += '<div class="report-section-title">سبب الإحالة والوضعية</div>' + block(V(f, 'pd3-reason') || '—');
  const pa = V(f, 'pd3-prev-actions');
  if (pa) h += '<div class="report-section-title">الإجراءات السابقة المتخذة داخل المؤسسة</div>' + block(pa);
  const rd = V(f, 'pd3-ref-date');
  if (rd) h += tbl([row('تاريخ استلام الجمعية للإحالة:', dash(fmtDateReport(rd)))]);
  h += sigBlock();
  return h;
}

function healthLetter(f) {
  const td = 'padding:2px 6px;vertical-align:top;';
  const lbl = td + 'font-weight:800;white-space:nowrap;width:1%;';
  const refs = [
    'المادة 15 مرسوم رقم <span dir="ltr">140-24-2</span> / في شأن النظام الأساسي لموظفي وزارة التربية الوطنية',
    'المشروع رقم 04 من القانون الإطار <span dir="ltr">17/51</span>؛',
    'المذكرة رقم <span dir="ltr">042.21</span>، بشأن تكييف المراقبة المستمرة لفائدة التلميذات والتلاميذ في وضعية إعاقة بالتعليم الابتدائي في ضوء البرنامج الوطني للتربية الدامجة.',
  ].map((x) => '<div class="pd-line" data-bold="0">- ' + x + '</div>').join('');
  return '<div style="direction:rtl;text-align:right;font-family:\'Cairo\',sans-serif;font-size:0.88rem;font-weight:700;line-height:1.9;margin:8px 0 12px;">'
    + '<table style="width:100%;border-collapse:collapse;"><tbody>'
    + '<tr class="pd-line"><td style="' + lbl + '">من السيد:</td><td style="' + td + 'text-align:center;">المختص الاجتماعي</td></tr>'
    + '<tr class="pd-line"><td style="' + td + '"></td><td style="' + td + 'text-align:center;">تحت إشراف: السيد مدير المؤسسة</td></tr>'
    + '</tbody></table>'
    + '<div class="pd-line" style="margin:12px 6px 10px;">إلى السيدات والسادة أساتذة التلميذ(ة): ' + dots(V(f, 'pd4-name'), 40)
    + ' &nbsp;&nbsp; المستوى: ' + dots(V(f, 'pd4-grade'), 14) + ' &nbsp;&nbsp; القسم: ' + dots(V(f, 'pd4-level'), 14) + '</div>'
    + '<table style="width:100%;border-collapse:collapse;"><tbody>'
    + '<tr class="pd-line"><td style="' + lbl + 'font-size:0.95rem;">الموضــوع :</td><td style="' + td + 'font-size:0.95rem;">إخبار في شأن الوضعية الصحية للتلميذ</td></tr>'
    + '<tr><td class="pd-line" style="' + lbl + '">المرجــــع :</td><td style="' + td + '">' + refs + '</td></tr>'
    + '</tbody></table></div>';
}

function teachersBlock(teachers) {
  const names = (teachers || []).map((v) => String(v == null ? '' : v).trim());
  while (names.length < MIN_TEACHERS) names.push('');
  const cell = 'border:1px solid #cbd5e1;padding:4px 10px;';
  const rows = names.map((nm, i) => '<tr style="height:30px;" data-h="28"><td data-w="8" style="' + cell + 'width:8%;text-align:center;">' + (i + 1) + '</td><td data-w="52" style="' + cell + '">' + E(nm) + '</td><td data-w="40" style="border:1px solid #cbd5e1;width:40%;"></td></tr>').join('');
  return '<div class="report-section-title">توقيعات الأساتذة</div>'
    + '<table class="pd-table-report" style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:\'Cairo\',sans-serif;margin-bottom:10px;page-break-inside:avoid;">'
    + '<thead><tr style="background:#1a3a5c;color:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;">'
    + '<th data-w="8" style="padding:6px 10px;border:1px solid #0f2a4a;width:8%;">#</th>'
    + '<th data-w="52" style="padding:6px 10px;border:1px solid #0f2a4a;">اسم الأستاذ(ة)</th>'
    + '<th data-w="40" style="padding:6px 10px;border:1px solid #0f2a4a;width:40%;">التوقيع</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function buildHealth(form, ctx) {
  const f = form.fields;
  let h = head(V(f, 'pd4-school'), 'إخبار بحالة صحية', ctx);
  h += healthLetter(f);
  h += tbl([
    row('تاريخ الإخبار:', dash(fmtDateReport(V(f, 'pd4-date'))), 'رقم الوثيقة:', dash(V(f, 'pd4-ref'))),
    row('تاريخ الازدياد:', dash(fmtDateReport(V(f, 'pd4-dob'))), 'رمز مسار:', dash(V(f, 'pd4-massar'))),
    row('درجة الاستعجالية:', dash(clean(V(f, 'pd4-urgency')))),
  ]);
  h += '<div class="report-section-title">وصف الحالة</div>' + block(V(f, 'pd4-health-desc') || '—');
  const type = String(form.type || '').trim();
  const procs = (form.procs || []).map((v) => String(v == null ? '' : v).trim()).filter(Boolean);
  if (type || procs.length) {
    const list = procs.length ? ('<ol class="pd-proc-list">' + procs.map((x) => '<li>' + E(x) + '</li>').join('') + '</ol>') : '—';
    h += '<div class="report-section-title">نوع الحالة والإجراءات اللازمة داخل القسم</div>'
      + '<table class="proc-table-report" style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:\'Cairo\',sans-serif;margin-bottom:10px;">'
      + '<thead><tr style="background:#1a3a5c;color:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;">'
      + '<th style="padding:6px 10px;text-align:center;border:1px solid #0f2a4a;width:35%;">نوع الحالة</th>'
      + '<th style="padding:6px 10px;text-align:right;border:1px solid #0f2a4a;">الإجراءات التي يجب أن تستفيد منها الحالة داخل القسم</th></tr></thead>'
      + '<tbody><tr><td style="text-align:center;font-weight:700;color:#1a3a5c;border:1px solid #cbd5e1;padding:6px 10px;">' + (type ? E(type) : '—') + '</td>'
      + '<td style="border:1px solid #cbd5e1;padding:6px 10px;">' + list + '</td></tr></tbody></table>';
  }
  h += teachersBlock(form.teachers);
  h += sigBlock();
  return h;
}

// ctx: { logo, dir } — الشعار واسم المديرية يأتيان من الصفحة (MINISTRY_LOGO_B64 و.dynamic-directorate)
export function reportHtml(n, form, ctx = {}) {
  return n === TAB_ASSOC ? buildAssoc(form, ctx) : buildHealth(form, ctx);
}
