// منطق بوابة «الورشات والأنشطة التربوية» — دوال بحتة بلا DOM، منقولة حرفياً من كتلة الورشات في script-16.js القديم.
// بقي في الكود القديم عمداً: appData.workshopsArchive نفسه (يقرؤه التقرير الأسبوعي والجدول الشهري والإحصاء في script-10.js)،
// وappendSuggest العامة، وexportToWord (نافذة المعاينة #wsPrintModal بقيت في body.html).
// اختبار المطابقة: tests/workshops.parity.test.js.

export const WS_MAX_PHOTOS = 12;

// الخيارات بترتيب ظهورها في النموذج: getCh القديمة تُرجع القيم بترتيب الـDOM لا بترتيب النقر
export const TYPE_OPTIONS = [
  ['ورشة توعوية', '🎯 ورشة توعوية'], ['نشاط تربوي', '🎨 نشاط تربوي'], ['برنامج جماعي', '👥 برنامج جماعي'],
  ['حصة إرشادية', '📢 حصة إرشادية'], ['رحلة تربوية', '🚌 رحلة تربوية'], ['أخرى', '📌 أخرى'],
];
export const THEME_OPTIONS = [
  ['الوقاية من العنف', '🛡️ الوقاية من العنف'], ['الصحة النفسية', '🧠 الصحة النفسية'], ['التوجيه المدرسي', '🎓 التوجيه المدرسي'],
  ['مهارات الحياة', '✨ مهارات الحياة'], ['التعاون والتضامن', '🤝 التعاون والتضامن'], ['الوقاية من الإدمان', '⚠️ الوقاية من الإدمان'],
  ['ثقافة المواطنة', '🌍 ثقافة المواطنة'], ['أخرى', '📌 أخرى'],
];
export const PLACE_OPTIONS = [
  ['قاعة متعددة الاستخدامات', '🏫 قاعة متعددة'], ['داخل الفصل', '📚 داخل الفصل'], ['فناء المؤسسة', '🏟 الفناء'], ['خارج المؤسسة', '🌳 خارج المؤسسة'],
];
export const ORGANIZER_OPTIONS = [
  ['المختص الاجتماعي', '👤 المختص الاجتماعي'], ['المرشد التربوي', '🧑‍🏫 المرشد التربوي'], ['الإدارة', '🏛️ الإدارة'], ['شراكة خارجية', '🤝 شراكة خارجية'],
];
export const TARGET_OPTIONS = [
  ['تلاميذ المستوى الأول', '📚 المستوى الأول'], ['تلاميذ المستوى الثاني', '📗 المستوى الثاني'], ['تلاميذ المستوى الثالث', '📘 المستوى الثالث'],
  ['أولياء الأمور', '👨‍👩 أولياء الأمور'], ['الأساتذة', '👨‍🏫 الأساتذة'], ['جميع التلاميذ', '👥 جميع التلاميذ'],
];
export const TOOL_OPTIONS = [
  ['عرض PowerPoint', '💻 عرض PowerPoint'], ['فيديو توعوي', '🎬 فيديو توعوي'], ['مطويات وملصقات', '📄 مطويات وملصقات'], ['لعب أدوار', '🎭 لعب أدوار'],
  ['عمل جماعي في مجموعات', '👥 عمل في مجموعات'], ['نقاش مفتوح', '💬 نقاش مفتوح'], ['استمارة تقييم', '📝 استمارة تقييم'],
];
export const RESULT_OPTIONS = [
  ['ناجح بامتياز', '🏆 ناجح بامتياز'], ['ناجح', '✅ ناجح'], ['متوسط', '🔶 متوسط'], ['يحتاج تحسيناً', '🔄 يحتاج تحسيناً'],
];
export const RESULT_COLORS = { 'ناجح بامتياز': '#16a34a', 'ناجح': '#15803d', 'متوسط': '#d97706', 'يحتاج تحسيناً': '#dc2626' };
export const TYPE_ICONS = { 'ورشة توعوية': '🎯', 'نشاط تربوي': '🎨', 'برنامج جماعي': '👥', 'حصة إرشادية': '📢', 'رحلة تربوية': '🚌', 'أخرى': '📌' };

// أزرار الاقتراحات السريعة تحت الحقول النصية الثلاثة
export const OBJECTIVE_CHIPS = [
  ['🛡️ الوقاية من العنف', 'تحسيس التلاميذ بمخاطر العنف المدرسي وأهمية الوقاية منه وتعزيز ثقافة الحوار واللاعنف.'],
  ['🤝 تعزيز التواصل', 'تقوية مهارات التواصل والتعاون الإيجابي بين التلاميذ وتنمية روح الانتماء للمجموعة التربوية.'],
  ['🎓 التوجيه الدراسي', 'تعريف التلاميذ بالتخصصات والمسالك الدراسية المتاحة ومساعدتهم على بناء مشروعهم الشخصي.'],
  ['🧠 الصحة النفسية', 'تزويد التلاميذ بمهارات التعامل مع الضغوط النفسية والتحكم في المشاعر السلبية وتعزيز الصحة النفسية.'],
];
export const SUMMARY_CHIPS = [
  ['📊 عرض + مجموعات', 'انطلقت الورشة بعرض تقديمي حول الموضوع، ثم تقسيم التلاميذ إلى مجموعات عمل صغيرة، وختمت بجلسة نقاش ومشاركة جماعية.'],
  ['✅ تفاعل إيجابي', 'جرى النشاط في أجواء إيجابية وتفاعلية، حيث أبدى التلاميذ اهتماماً ومشاركة فعّالة خلال جميع مراحل النشاط.'],
  ['🎬 وسائط بصرية', 'تضمّن النشاط عروضاً بالصور والفيديو، وتمارين عملية، ووزّعت على المشاركين مطويات توعوية في الختام.'],
];
export const NOTES_CHIPS = [
  ['🔄 تكرار النشاط', 'يُوصى بتكرار هذا النشاط مع باقي الأقسام نظراً للاستجابة الإيجابية التي لقيها من التلاميذ.'],
  ['📅 إدراج في المخطط السنوي', 'يُقترح إدراج هذا النوع من الأنشطة ضمن المخطط السنوي للمختص الاجتماعي بصفة منتظمة.'],
  ['👨‍👩 إشراك أولياء الأمور', 'يُنصح بإشراك أولياء الأمور في النسخة القادمة من هذا النشاط لتعزيز أثره التربوي.'],
];

export const MSG = {
  TITLE_FIRST: '⚠️ يرجى إدخال عنوان الورشة أو النشاط أولاً.',
  TITLE_FIRST_UPDATE: '⚠️ يرجى إدخال عنوان الورشة أولاً.',
  CONFIRM_DELETE: 'هل تريد حذف هذه الورشة نهائياً؟',
  CONFIRM_CLEAR_ARCHIVE: 'هل أنت متأكد من مسح جميع الورشات المحفوظة؟',
  CONFIRM_CLEAR_PHOTOS: 'هل تريد حذف جميع صور النشاط؟',
  SAVED: (title) => `✅ تم حفظ الورشة "${title}" في الأرشيف بنجاح.`,
  UPDATED: (title) => `✅ تم تحديث الورشة "${title}" بنجاح.`,
  ONLY_IMAGES: '⚠️ يرجى اختيار ملفات صور فقط.',
  PHOTOS_FULL: '⚠️ بلغتَ الحد الأقصى (' + WS_MAX_PHOTOS + ' صورة).',
  EMPTY_LIST: '📂 لا توجد ورشات محفوظة بعد.',
  EMPTY_HINT: 'اضغط "حفظ في الأرشيف" لإضافة الورشة الحالية.',
  NO_RESULTS: '🔍 لا توجد نتائج تطابق البحث.',
};

export const iEsc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const todayIso = (d = new Date()) => d.toISOString().slice(0, 10);

const v = (x) => String(x == null ? '' : x).trim();
// القيم المحدَّدة بترتيب الخيارات في النموذج (getCh القديمة)
export const inDomOrder = (options, selected) => options.map((o) => o[0]).filter((x) => (selected || []).includes(x));

// ── النموذج ──
// form: نصوص الحقول كما في DOM (تُقصّ هنا كـgetV القديمة) + type/place/result + themes/organizers/targets/tools + classes + photos
export const blankForm = (date = '', school = '') => ({
  title: '', school, date, duration: '', males: '', females: '', objectives: '', summary: '', notes: '',
  type: '', place: '', result: '', themes: [], organizers: [], targets: [], tools: [], classes: [], photos: [],
});

// ── الأقسام (chips) ──
export const CLASS_SEP = '، ';
// wsAddClassFromSelect: القيمة الفارغة أو المكرَّرة لا تُضاف
export const addClass = (list, value) => (!value || list.includes(value) ? list : [...list, value]);
export const removeClass = (list, cls) => list.filter((c) => c !== cls);
// wsSetClassesFromString: «—» والفارغ يعنيان لا أقسام؛ الفاصل «،» أو «,»
export const classesFromString = (str) => (str && str !== '—' ? str.split(/[،,]+/).map((s) => s.trim()).filter(Boolean) : []);

// ── السجل ──
function entryFrom(f, id, savedAt) {
  return {
    id, savedAt,
    title: v(f.title),
    type: f.type || '—',
    theme: inDomOrder(THEME_OPTIONS, f.themes),
    school: v(f.school) || '—',
    date: v(f.date) || '—',
    duration: v(f.duration) || '—',
    place: f.place || '—',
    organizer: inDomOrder(ORGANIZER_OPTIONS, f.organizers),
    target: inDomOrder(TARGET_OPTIONS, f.targets),
    males: v(f.males) || '0',
    females: v(f.females) || '0',
    classes: v((f.classes || []).join(CLASS_SEP)) || '—',
    objectives: v(f.objectives) || '—',
    summary: v(f.summary) || '—',
    tools: inDomOrder(TOOL_OPTIONS, f.tools),
    result: f.result || '—',
    notes: v(f.notes),
    photos: (f.photos || []).slice(),
  };
}

// wsSaveToArchive: null إن غاب العنوان؛ وإلا { entry, archive } (الجديد في الأول)
export function saveEntry(archive, f, now = new Date()) {
  if (!v(f.title)) return null;
  const entry = entryFrom(f, now.getTime(), now.toLocaleString('ar-MA'));
  return { entry, archive: [entry, ...archive] };
}

// wsUpdateEntry: يستبدل بالمعرّف، وإن لم يوجد يُضاف في الأول (كالقديم)؛ null إن غاب العنوان أو المعرّف
export function updateEntry(archive, id, f, now = new Date()) {
  if (!id || !v(f.title)) return null;
  const entry = entryFrom(f, id, now.toLocaleString('ar-MA') + ' (معدَّل)');
  const idx = archive.findIndex((e) => e.id === id);
  const next = archive.slice();
  if (idx !== -1) next[idx] = entry; else next.unshift(entry);
  return { entry, archive: next };
}

// الحفظ التلقائي عند إنشاء التقرير (الجزء الأخير من wsGenerateReport):
// ورشة بالعنوان والتاريخ نفسيهما موجودة → لا سجل جديد، وتُحدَّث صورها فقط إن وُجدت صور؛ وإلا حفظ صامت
export function autoSaveOnReport(archive, f, now = new Date()) {
  const t = v(f.title);
  const dt = f.date || '—'; // القديم يقرأ قيمة حقل التاريخ نفسها بلا قصّ
  const found = archive.find((e) => e.title === t && e.date === dt);
  if (!found) return saveEntry(archive, f, now);
  if ((f.photos || []).length) {
    const entry = { ...found, photos: f.photos.slice() };
    return { entry, archive: archive.map((e) => (e === found ? entry : e)) };
  }
  return { entry: found, archive };
}

const dash = (x) => (x && x !== '—' ? x : '');
const only = (options, val) => (options.some((o) => o[0] === val) ? val : '');

// wsLoadEntry: قيم الحقول من سجل محفوظ (الشرطة «—» تصير فارغة؛ والقيمة غير المطابقة لأي خيار لا تحدّد شيئاً)
export function formFromEntry(e) {
  return {
    title: dash(e.title), school: dash(e.school), date: dash(e.date), duration: dash(e.duration),
    males: dash(e.males), females: dash(e.females),
    objectives: dash(e.objectives), summary: dash(e.summary), notes: dash(e.notes),
    type: only(TYPE_OPTIONS, e.type), place: only(PLACE_OPTIONS, e.place), result: only(RESULT_OPTIONS, e.result),
    themes: inDomOrder(THEME_OPTIONS, e.theme), organizers: inDomOrder(ORGANIZER_OPTIONS, e.organizer),
    targets: inDomOrder(TARGET_OPTIONS, e.target), tools: inDomOrder(TOOL_OPTIONS, e.tools),
    classes: classesFromString(e.classes || ''),
    photos: Array.isArray(e.photos) ? e.photos.slice() : [],
  };
}

// initWorkshops (أول فتح فقط): تاريخ اليوم إن كان الحقل فارغاً، والمؤسسة من الملف الشخصي إن كانت فارغة وكان لها اسم
export function initFields(date, school, inst, now = new Date()) {
  return { date: date || todayIso(now), school: !school && inst ? inst : school };
}

// wsCancelEdit: تفرَّغ كل الحقول (حتى المؤسسة) والخيارات والصور ويُعاد تاريخ اليوم؛ وأقسام chips لا تُمسّ (كالقديم)
export const formAfterCancel = (f, now = new Date()) => ({ ...blankForm(todayIso(now), ''), classes: f.classes });

export const totalOf = (e) => (parseInt(e.males) || 0) + (parseInt(e.females) || 0);

// بحث الأرشيف: بالعنوان أو المؤسسة أو النوع (renderWsArchive القديمة)
export function filterArchive(archive, search) {
  const s = String(search || '').trim().toLowerCase();
  return s
    ? archive.filter((e) => (e.title || '').toLowerCase().includes(s) || (e.school || '').toLowerCase().includes(s) || (e.type || '').toLowerCase().includes(s))
    : archive;
}

export function deleteEntry(archive, id) { return archive.filter((e) => e.id !== id); }

// appendSuggest القديمة (script-15.js): تُلحَق الجملة في سطر جديد
export const appendSuggest = (current, text) => (String(current).trim() ? String(current).trimEnd() + '\n' + text : text);

// ── الصور ──
// wsAddPhotos: خطة الإضافة قبل الضغط. count = عدد الصور الحالية، files = [{ type }]
export function photoAddPlan(count, files) {
  const list = Array.from(files || []).filter((f) => f.type && f.type.indexOf('image/') === 0);
  if (!list.length) return { kind: 'none', alert: MSG.ONLY_IMAGES };
  const room = WS_MAX_PHOTOS - count;
  if (room <= 0) return { kind: 'full', alert: MSG.PHOTOS_FULL };
  const skipped = list.length - room;
  return { kind: 'ok', files: list.slice(0, room), skipped: skipped > 0 ? skipped : 0 };
}
// رسالة ما بعد الإضافة (تُهمَل إن لم يكن هناك ما يُقال)
export function photoAddMessage(skipped, failed) {
  const msg = [];
  if (skipped > 0) msg.push('تم تجاهل ' + skipped + ' صورة لتجاوز الحد الأقصى (' + WS_MAX_PHOTOS + ').');
  if (failed > 0) msg.push('تعذّرت قراءة ' + failed + ' صورة.');
  return msg.length ? '⚠️ ' + msg.join('\n') : '';
}

// wsLayoutPhotos: توزيع تلقائي: صفوف متوازنة بنفس ترتيب الإدراج، كل صورة بإطارها الطبيعي، وتملأ صفحة واحدة
export function layoutPhotos(ratios) {
  const N = ratios.length, W = 170, H = 232, G = 3;
  const cap = N === 1 ? 200 : 120;
  let best = null;
  for (let n = 1; n <= N; n++) {
    // تقسيم متتالٍ إلى n صفوف يقلّل أكبر مجموع نسب (لتتقارب ارتفاعات الصفوف)
    const pre = [0]; ratios.forEach((r) => { pre.push(pre[pre.length - 1] + r); });
    const INF = 1e9, dp = [], cut = [];
    for (let k = 0; k <= n; k++) { dp.push(new Array(N + 1).fill(INF)); cut.push(new Array(N + 1).fill(0)); }
    dp[0][0] = 0;
    for (let k2 = 1; k2 <= n; k2++) for (let i = k2; i <= N; i++) for (let j = k2 - 1; j < i; j++) {
      const val = Math.max(dp[k2 - 1][j], pre[i] - pre[j]);
      if (val < dp[k2][i]) { dp[k2][i] = val; cut[k2][i] = j; }
    }
    const rows = []; let e = N;
    for (let kk = n; kk >= 1; kk--) { const st = cut[kk][e]; rows.unshift(ratios.slice(st, e).map((r, idx) => ({ r, i: st + idx }))); e = st; }
    const rowH = rows.map((row) => {
      const S = row.reduce((a, x) => a + x.r, 0);
      return (W - (row.length - 1) * G) / S;
    });
    const T = rowH.reduce((a, h) => a + h, 0) + (rows.length - 1) * G;
    const sc = Math.min(1, H / T, cap / Math.max.apply(null, rowH));
    let area = 0;
    rows.forEach((row, ri) => { row.forEach((x) => { const h = rowH[ri] * sc; area += h * h * x.r; }); });
    if (!best || area > best.area) best = { area, rows, rowH, sc };
  }
  return best.rows.map((row, ri) => {
    const h = best.rowH[ri] * best.sc;
    return row.map((x) => ({ i: x.i, w: +(h * x.r).toFixed(2), h: +h.toFixed(2) }));
  });
}

// wsPhotosReportHtml: كتلة الصور داخل التقرير — صفحة مستقلة (فاصل صفحة)، كل صورة مؤطّرة بحدودها الفعلية.
// ratios: { [src]: عرض/ارتفاع } تُحسب مسبقاً؛ الغائب يُعامَل 4/3 كالقديم. الأصناف وdata-w/data-h يعتمد عليها تصدير Word (script-05.js)
export function photosReportHtml(title, photos, ratios = {}) {
  const p = photos || [];
  if (!p.length) return '';
  const rs = p.map((src) => ratios[src] || (4 / 3));
  const layout = layoutPhotos(rs);
  const rowsHtml = layout.map((row) => '<div class="ws-photo-row" style="display:flex;justify-content:center;align-items:flex-start;gap:3mm;margin-bottom:3mm;break-inside:avoid;page-break-inside:avoid;">' +
    row.map((x) => '<div class="ws-photo-item" data-w="' + x.w + '" data-h="' + x.h + '" style="width:' + x.w + 'mm;height:' + x.h + 'mm;flex:none;box-sizing:border-box;border:0.3mm solid #555;overflow:hidden;line-height:0;">' +
      '<img src="' + p[x.i] + '" alt="" style="width:100%;height:100%;display:block;object-fit:fill;"></div>').join('') + '</div>').join('');
  return '<div class="ws-photos-page" style="break-before:page;page-break-before:always;margin-top:24px;direction:rtl;">' +
    '<div class="ws-photos-title" style="text-align:center;font-weight:800;font-size:1rem;margin:0 0 8px;padding-bottom:6px;border-bottom:2px solid #000;">صور النشاط' + (title ? ' — ' + title : '') + '</div>' +
    rowsHtml + '</div>';
}

// ── التقرير (wsGenerateReport) ──
const TBL = "width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;margin-bottom:10px;";

// ctx.logo: شعار الوزارة (القديم يضع src فارغاً ثم يملؤه بعد الإدراج، فالنتيجة النهائية واحدة)؛ ctx.ratios: نسب أبعاد الصور
export function reportHtml(f, ctx = {}) {
  const V = (x) => iEsc(v(x));
  const R = (x) => (x ? iEsc(x) : '');
  const C = (options, sel) => inDomOrder(options, sel).map((x) => iEsc(x)).join(' / ');
  const D = (x) => x || '—';
  const title = V(f.title);
  const males = parseInt(f.males) || 0;
  const females = parseInt(f.females) || 0;
  const classes = (f.classes || []).length ? iEsc((f.classes || []).join(CLASS_SEP)) : '';
  const row4 = (l1, v1, l2, v2) => `<tr><td class="info-lbl">${l1}</td><td class="info-val">${D(v1)}</td><td class="info-lbl">${l2}</td><td class="info-val">${D(v2)}</td></tr>`;
  const row1 = (l, val) => `<tr><td class="info-lbl">${l}</td><td class="info-val" colspan="3">${D(val)}</td></tr>`;
  const tools = C(TOOL_OPTIONS, f.tools);

  return `
 <div class="new-report-header">
 <div class="nrh-logo">
 <img id="ministry-logo-img" src="${ctx.logo || ''}" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;">
 </div>
 <div class="nrh-dir">مديرية الحي الحسني</div>
 <div class="nrh-school">${V(f.school) || 'المؤسسة التعليمية'}</div>
 <div class="nrh-title">تقرير عن ورشة / نشاط تربوي</div>
 </div>

 <div class="report-section-title">معلومات الورشة / النشاط</div>
 <table class="info-table-report" style="${TBL}"><tbody>
   ${row1('العنوان:', title)}
   ${row4('نوع النشاط:', R(f.type), 'تاريخ الإنجاز:', V(f.date))}
   ${row4('مدة النشاط:', V(f.duration) ? V(f.duration) + ' ساعة' : '', 'مكان الإنجاز:', R(f.place))}
   ${row1('محور النشاط:', C(THEME_OPTIONS, f.themes))}
   ${row1('الجهة المنظِّمة:', C(ORGANIZER_OPTIONS, f.organizers))}
 </tbody></table>

 <div class="report-section-title">الفئة المستهدفة والمشاركون</div>
 <table class="info-table-report" style="${TBL}"><tbody>
   ${row1('الفئة المستهدفة:', C(TARGET_OPTIONS, f.targets))}
   ${row4('عدد الذكور:', String(males), 'عدد الإناث:', String(females))}
   ${row4('إجمالي المشاركين:', String(males + females), 'الأقسام / المجموعات:', classes)}
 </tbody></table>

 ${V(f.objectives) ? `<div class="report-section-title">الأهداف المرجوة</div><div class="report-summary-block">${V(f.objectives)}</div>` : ''}
 ${V(f.summary) ? `<div class="report-section-title">ملخص مجريات النشاط</div><div class="report-summary-block">${V(f.summary)}</div>` : ''}
 ${tools ? `<div class="report-section-title">الوسائل والأدوات المستخدمة</div><div class="report-summary-block">${tools}</div>` : ''}

 <div class="report-section-title">الخلاصة وتقييم النتائج</div>
 <table class="info-table-report" style="${TBL}"><tbody>
   ${row1('نتيجة النشاط العامة:', R(f.result))}
   ${row1('الملاحظات والتوصيات:', V(f.notes))}
 </tbody></table>

 <div class="signatures">
 <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
 <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
 </div>
 ${photosReportHtml(title, f.photos, ctx.ratios)}
 `;
}
