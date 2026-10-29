// منطق «ملف الحالة الشامل» — دوال نقية بلا DOM ولا React، منقولة من script-24.js (نسخة المرحلة 9).
// تأخذ المجموعات من المخزن (collections) بدل دوال getArchive القديمة، وتُختبر بمطابقة مباشرة مع الكود القديم.

export const MIN_QUERY = 2;   // أقل عدد أحرف (بعد التطبيع) للبحث
export const MAX_PICKS = 30;  // أقصى عدد تلاميذ في قائمة الاختيار

export function esc(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// تطبيع الاسم للمطابقة: توحيد الألف والتاء المربوطة والياء، وضغط المسافات
export function nz(v) {
  return String(v == null ? '' : v).replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه')
    .replace(/[يى]/g, 'ي').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function clean(v) {
  if (Array.isArray(v)) v = v.filter(Boolean).join(' • ');
  if (v == null) return '';
  v = String(v).trim();
  return (v === '—' || v === '-') ? '' : v;
}

export function isoDate(v) { return /^\d{4}-\d{2}-\d{2}/.test(v || '') ? v.slice(0, 10) : ''; }

// ── رصد السلوك: نفس حساب bmStats القديم للملاحظات في آخر 7 أيام (التواريخ بتوقيت UTC كما في bmIso) ──
const bmIso = (d) => d.toISOString().slice(0, 10);
const bmAgo = (today, n) => { const d = new Date(today.getTime()); d.setDate(d.getDate() - n); return bmIso(d); };
const bmTierLbl = (t) => (String(t).includes('+') ? 'المستويان 2 و3' : 'المستوى ' + t);

function behaviorRows(files, today) {
  const t = bmIso(today), d7 = bmAgo(today, 6);
  return files.map((f) => {
    const p = f.plan || {};
    const cur = f.obs.filter((o) => o.date >= d7 && o.date <= t);
    const cc = cur.filter((o) => o.kind === 'con');
    const pos = cur.filter((o) => o.kind === 'pos');
    const last = f.obs.length ? f.obs.map((o) => o.date).sort().pop() : f.addedAt;
    return { id: f.id, studentName: f.studentName, massar: f.massar, school: f.school, level: f.level, date: last, tier: f.tier, cc: cc.length, pos: pos.length, goal: p.goal, review: p.review, reason: f.reason };
  });
}

// خلية اليقظة: القديم يرجع [] بلا مستخدم، ويجرّب localStorage إن كانت المجموعة فارغة في الذاكرة
function vigilanceRows(collections, ctx) {
  if (!ctx.user) return [];
  const raw = collections.vigilanceCases;
  if (Array.isArray(raw) && raw.length > 0) return raw;
  try {
    const ls = ctx.storage && ctx.storage.getItem(ctx.user + ':vigilanceCases');
    if (ls) {
      const parsed = JSON.parse(ls);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) { /* كالقديم: نتجاهل */ }
  return Array.isArray(raw) ? raw : [];
}

// المصادر السبعة + الثامن (السلوك). get تأخذ (collections, ctx) وتعيد مصفوفة.
export const SOURCES = [
  { key: 'interview', label: 'المقابلات الفردية', icon: '🗂', color: '#1a3a5c',
    get: (c) => c.interviewArchive, date: (e) => e.interviewDate,
    fields: (e) => [['الموضوع', e.subject], ['الأولوية', e.priority], ['الوضعية الحالية', e.currentStatus],
      ['الملخص', e.summary], ['ملاحظات الأخصائي', e.specialistNotes], ['الإجراءات', e.procedures],
      ['التوصية', e.recommendation], ['المتابعة المقبلة', e.nextFollowup]] },
  { key: 'reint', label: 'الإدماج المدرسي', icon: '📋', color: '#16a34a',
    get: (c) => c.reintegrationArchive, date: (e) => e.reintegrationDate,
    fields: (e) => [['مدة الغياب', e.absenceDuration], ['الأسباب', e.causes], ['الإجراءات', e.procedures],
      ['الأولوية', e.priority], ['الوضعية الحالية', e.currentStatus], ['التوصية', e.recommendation],
      ['المتابعة المقبلة', e.nextFollowup]] },
  { key: 'absence', label: 'ملفات الغياب', icon: '🚨', color: '#d97706',
    get: (c) => c.absenceArchive, date: (e) => e.recordDate,
    fields: (e) => [['مجموع الساعات', e.totalHours], ['ساعات غير مبررة', e.unjustifiedHours],
      ['عدد الأيام', e.totalDays], ['الأسباب', e.causes], ['الإجراءات', e.procedures], ['الأولوية', e.priority],
      ['الوضعية الحالية', e.currentStatus], ['التوصية', e.recommendation], ['المتابعة المقبلة', e.nextFollowup]] },
  { key: 'violence', label: 'حالات العنف', icon: '🛡️', color: '#dc2626',
    get: (c) => c.violenceArchive, date: (e) => e.reportDate,
    fields: (e) => [['الشخص المعنِّف', e.aggName], ['القسم (المعنِّف)', e.aggLevel], ['نوع العنف', e.types], ['المكان', e.location],
      ['الوصف', e.description], ['الأولوية', e.priority],
      ['التوصية', e.recommendation]] },
  { key: 'contacts', label: 'الاتصالات والأولياء', icon: '📞', color: '#0d9488',
    get: (c) => c.contactsArchive, date: (e) => e.date,
    fields: (e) => [['نوع الاتصال', e.type], ['ولي الأمر', e.parentName], ['الهاتف', e.parentPhone],
      ['السبب', e.reason], ['الملخص', e.summary], ['النتيجة', e.result], ['الإجراءات', e.actions],
      ['الأولوية', e.priority]] },
  { key: 'special', label: 'وضعية الإعاقة', icon: '♿', color: '#2563eb',
    get: (c) => c.specialNeedsArchive, date: (e) => e.recordDate,
    fields: (e) => [['الفئة', e.category], ['التشخيص', e.diagnosis], ['تقرير طبي', e.hasReport],
      ['الإحالة', e.referral], ['الإجراءات', e.actions], ['التفاصيل', e.actionsDetails], ['التكييفات', e.adaptations],
      ['الملخص', e.summary], ['التوصية', e.recommendation], ['المتابعة المقبلة', e.nextFollowup]] },
  { key: 'vigilance', label: 'خلية اليقظة', icon: '🚨', color: '#7c3aed',
    get: (c, ctx) => vigilanceRows(c, ctx), date: (e) => e.date,
    fields: (e) => [['الصنف', e.category], ['الإجراءات', e.actions], ['الأولوية', e.priority],
      ['الحالة', e.status], ['ملاحظات', e.notes], ['المتابعة المقبلة', e.nextFollowup],
      ['عدد سجلات التتبع', (e.trackingLogs && e.trackingLogs.length) ? String(e.trackingLogs.length) : '']] },
  { key: 'behavior', label: 'رصد السلوك', icon: '🧭', color: '#0e8f98',
    get: (c, ctx) => behaviorRows(Array.isArray(c.behaviorFiles) ? c.behaviorFiles : [], ctx.today),
    date: (e) => e.date,
    fields: (e) => [['سبب الإدراج', e.reason], ['مستوى الدعم', bmTierLbl(e.tier)], ['ملاحظات مقلقة (7 أيام)', String(e.cc)],
      ['ملاحظات إيجابية (7 أيام)', String(e.pos)], ['هدف الخطة', e.goal], ['تاريخ المراجعة', e.review]] },
];

// كالقديم: أي خطأ في قراءة مصدر يجعله فارغاً ولا يوقف بقية المصادر
function safeRows(src, collections, ctx) {
  try { const r = src.get(collections, ctx); return Array.isArray(r) ? r : []; } catch (e) { return []; }
}

// تجميع كل السجلات حسب اسم التلميذ المطبَّع. تعيد كائناً { [مفتاح]: مجموعة } بترتيب الإدراج نفسه.
export function buildGroups(collections, ctx) {
  const groups = {};
  SOURCES.forEach((src) => {
    safeRows(src, collections || {}, ctx).forEach((e) => {
      if (!e || !e.studentName) return;
      const k = nz(e.studentName);
      if (!k) return;
      const g = groups[k] || (groups[k] = { key: k, name: e.studentName, massar: '', school: '', level: '', records: {}, total: 0 });
      if (!g.massar && clean(e.massar)) g.massar = clean(e.massar);
      if (!g.school && clean(e.school)) g.school = clean(e.school);
      if (!g.level && clean(e.level)) g.level = clean(e.level);
      (g.records[src.key] = g.records[src.key] || []).push(e);
      g.total++;
    });
  });
  return groups;
}

// نتيجة البحث: { kind: 'short' | 'none' | 'one' | 'many', ... }
export function searchCases(groups, qRaw) {
  const q = nz(qRaw);
  if (q.length < MIN_QUERY) return { kind: 'short' };
  const rawLow = String(qRaw == null ? '' : qRaw).trim().toLowerCase();
  let found = Object.keys(groups).map((k) => groups[k]).filter((g) =>
    g.key.indexOf(q) !== -1 || (g.massar && g.massar.toLowerCase().indexOf(rawLow) === 0));
  if (!found.length) return { kind: 'none', query: qRaw };
  const exact = found.filter((g) => g.key === q);
  if (exact.length === 1) found = exact;
  if (found.length === 1) return { kind: 'one', group: found[0] };
  found.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  return { kind: 'many', total: found.length, picks: found.slice(0, MAX_PICKS) };
}

function sortRecords(src, list) {
  return list.slice().sort((a, b) => {
    const da = isoDate(src.date(a)), db = isoDate(src.date(b));
    return db.localeCompare(da) || ((b.id || 0) - (a.id || 0));
  });
}

// نموذج عرض الملف: بيانات صافية يرسمها React على الشاشة ويحوّلها fileHtml إلى نص للطباعة
export function fileModel(g) {
  let urgent = 0;
  SOURCES.forEach((s) => {
    (g.records[s.key] || []).forEach((e) => { if (/عاجل|عالي|مرتفع/.test(clean(e.priority))) urgent++; });
  });
  const chips = SOURCES.map((s) => ({ key: s.key, icon: s.icon, label: s.label, color: s.color, n: (g.records[s.key] || []).length }));
  const meta = [];
  if (g.massar) meta.push({ label: 'رقم مسار', value: g.massar });
  if (g.level) meta.push({ label: 'المستوى', value: g.level });
  if (g.school) meta.push({ label: 'المؤسسة', value: g.school });
  const sections = [];
  SOURCES.forEach((s) => {
    const list = sortRecords(s, g.records[s.key] || []);
    if (!list.length) return;
    sections.push({
      key: s.key, icon: s.icon, label: s.label, color: s.color, count: list.length,
      records: list.map((e) => ({
        date: clean(s.date(e)) || clean(e.savedAt) || 'بدون تاريخ',
        rows: s.fields(e).map((f) => [f[0], clean(f[1])]).filter((r) => r[1]),
      })),
    });
  });
  return { name: g.name, meta, chips, urgent, sections };
}

export const EMPTY_FILE_TEXT = 'لا توجد سجلات لهذا التلميذ.';
export const NO_DETAILS_TEXT = 'لا توجد تفاصيل إضافية';

// نص HTML للملف (للطباعة فقط) — مطابق حرفياً لمخرجات fileHtml القديمة
export function fileHtml(model) {
  const chips = model.chips.map((c) =>
    '<span class="cf-chip" style="' + (c.n ? 'background:' + c.color + ';color:#fff;' : 'background:#f1f5f9;color:#94a3b8;') + '">' +
    c.icon + ' ' + esc(c.label) + ': ' + c.n + '</span>').join('');
  const head = '<div class="cf-head"><div class="cf-name">' + esc(model.name) + '</div>' +
    '<div class="cf-meta">' + model.meta.map((m) => '<span>' + m.label + ': <b>' + esc(m.value) + '</b></span>').join('') + '</div>' +
    '<div class="cf-chips">' + chips + '</div>' +
    (model.urgent ? '<div class="cf-urgent">⚠️ ' + model.urgent + ' سجل(ات) ذات أولوية عاجلة / عالية</div>' : '') + '</div>';
  const body = model.sections.map((s) =>
    '<div class="cf-sec"><div class="cf-sec-title" style="background:' + s.color + ';">' + s.icon + ' ' + esc(s.label) +
    ' <span class="cf-count">' + s.count + '</span></div>' +
    s.records.map((r) => {
      const rows = r.rows.map((f) => '<div class="cf-row"><span class="cf-k">' + esc(f[0]) + '</span><span class="cf-v">' + esc(f[1]) + '</span></div>').join('');
      return '<div class="cf-rec" style="border-right:4px solid ' + s.color + ';">' +
        '<div class="cf-rec-date">📅 ' + esc(r.date) + '</div>' +
        (rows || '<div class="cf-row"><span class="cf-v" style="color:#94a3b8;">' + NO_DETAILS_TEXT + '</span></div>') + '</div>';
    }).join('') + '</div>').join('');
  return head + (body || '<div class="cf-empty">' + EMPTY_FILE_TEXT + '</div>');
}

export const CF_CSS =
  '.cf-head{background:#f0fdfa;border:1.5px solid #5eead4;border-radius:12px;padding:14px 16px;margin:12px 0;}' +
  '.cf-name{font-size:1.25rem;font-weight:800;color:#0f766e;margin-bottom:6px;}' +
  '.cf-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:.85rem;color:#334155;margin-bottom:8px;}' +
  '.cf-chips{display:flex;flex-wrap:wrap;gap:6px;}' +
  '.cf-chip{border-radius:20px;padding:3px 11px;font-size:.76rem;font-weight:700;}' +
  '.cf-urgent{margin-top:10px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:8px;padding:6px 10px;font-size:.82rem;font-weight:700;}' +
  '.cf-sec{margin:14px 0;}' +
  '.cf-sec-title{color:#fff;font-weight:800;padding:8px 14px;border-radius:10px 10px 0 0;font-size:.95rem;}' +
  '.cf-count{background:rgba(255,255,255,.28);border-radius:20px;padding:0 9px;margin-right:6px;font-size:.8rem;}' +
  '.cf-rec{background:#fff;border:1px solid #e2e8f0;border-top:0;padding:10px 14px;}' +
  '.cf-rec-date{font-size:.78rem;font-weight:700;color:#64748b;margin-bottom:6px;}' +
  '.cf-row{display:flex;gap:10px;padding:3px 0;font-size:.85rem;line-height:1.7;}' +
  '.cf-k{min-width:130px;color:#64748b;font-weight:700;}.cf-v{flex:1;color:#1e293b;white-space:pre-wrap;}' +
  '.cf-empty{padding:26px;text-align:center;color:#64748b;background:#f8fafc;border-radius:10px;}' +
  '.cf-pick{display:flex;align-items:center;gap:10px;padding:10px 14px;margin:6px 0;background:#fff;border:1.5px solid #cbd5e1;' +
  'border-radius:10px;cursor:pointer;font-weight:700;color:#1a3a5c;}.cf-pick:hover{background:#eff6ff;border-color:#60a5fa;}';

// صفحة الطباعة الكاملة (تُكتب في نافذة جديدة). logo: data URL أو ''، today: نص التاريخ المعروض.
export function buildPrintHtml(model, { logo = '', today = '' } = {}) {
  const logoTag = logo ? '<img src="' + logo + '" style="height:60px;">' : '';
  return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>ملف الحالة — ' + esc(model.name) + '</title>' +
    '<style>@import url("https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap");' +
    'body{font-family:"Cairo",Arial,sans-serif;margin:0;padding:18px 26px;color:#1e293b;}' +
    '.ph{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0f766e;padding-bottom:10px;margin-bottom:6px;}' +
    '.ph h1{margin:0;font-size:1.15rem;color:#0f766e;}.ph small{color:#64748b;}' +
    '.cf-sec,.cf-rec{page-break-inside:avoid;}' +
    '@media print{body{padding:0;}-webkit-print-color-adjust:exact;print-color-adjust:exact;}' + CF_CSS + '</style></head><body>' +
    '<div class="ph"><div>' + logoTag + '</div><div style="text-align:center;"><h1>ملف الحالة الشامل</h1>' +
    '<small>وثيقة سرية – للاستعمال الرسمي فقط</small></div><div><small>تاريخ الطباعة: ' + esc(today) + '</small></div></div>' +
    fileHtml(model) +
    '</body></html>';
}
