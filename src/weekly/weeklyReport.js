// منطق التقرير الأسبوعي النقي — جمع صفوف الأسبوع من الأرشيفات وبناء HTML التقرير. دوال بلا DOM ولا React،
// منقولة من script-10.js القديم (wkBuildRows وwkReportHtml والجزء الذي يبني _wprAllRows في openWeeklyReportPreview)
// بنفس القواعد والترتيب حرفياً. تأخذ الأرشيفات كوسيط (collections) فتعمل على بيانات المستخدم دون لمس window.
// تُسجَّل على window.WeeklyReport ليستدعيها الكود القديم (script-10)؛ buildPreviewRows تستدعيها نافذة المعاينة React (src/weeklypreview) مباشرة.

export const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// مفاتيح collections: interviewArchive وreintegrationArchive وabsenceArchive وspecialNeedsArchive وviolenceArchive وworkshopsArchive
// + (الخطوة 38) parentCalls وparentMeetings: بوابة الاتصال بالأولياء (الهاتف والمقابلات)
const arr = (x) => (Array.isArray(x) ? x : []);
const within = (d, from, to) => d >= from && d <= to;

// تاريخ ملف الغياب: recordDate وإلا أول 10 خانات من savedAt
const absenceDate = (e) => e.recordDate || (e.savedAt || '').slice(0, 10);

// الملفات الستة التي تقع تواريخها داخل [from, to] (المقارنة نصية على YYYY-MM-DD كما في القديم)
export function collectWeek(c, from, to) {
  return {
    interviews: arr(c.interviewArchive).filter((e) => within(e.interviewDate || '', from, to)),
    reintegrations: arr(c.reintegrationArchive).filter((e) => within(e.reintegrationDate || '', from, to)),
    absences: arr(c.absenceArchive).filter((e) => within(absenceDate(e), from, to)),
    specNeeds: arr(c.specialNeedsArchive).filter((e) => within(e.date || '', from, to)),
    violence: arr(c.violenceArchive).filter((e) => within(e.reportDate || '', from, to)),
    workshops: arr(c.workshopsArchive).filter((e) => within(e.date || '', from, to)),
    calls: arr(c.parentCalls).filter((e) => within(e.date || '', from, to)),
    meetings: arr(c.parentMeetings).filter((e) => within(e.date || '', from, to)),
  };
}

// ── صفوف التقرير الموحَّد (wkBuildRows) ──
const rColor = (r) => (r === 'مُنجز' ? '#166534' : r === 'قيد المتابعة' ? '#854d0e' : '#475569');
const rBg = (r) => (r === 'مُنجز' ? '#dcfce7' : r === 'قيد المتابعة' ? '#fef9c3' : '#f1f5f9');

// موضوع صف الاتصال: نتيجة المكالمة ثم الملاحظات إن وُجدت (لا حقل «موضوع» في سجل الاتصال)
const callSubject = (e) => [e.result, e.notes].filter((x) => x && String(x).trim()).join(' — ') || '—';

export function buildRows(c, from, to) {
  const w = collectWeek(c, from, to);
  const rows = [];

  w.interviews.forEach((e) => rows.push({
    id: e.id, archiveType: 'interview', date: e.interviewDate || '', name: e.studentName || '—', school: e.school || '—', level: e.level || '—',
    type: 'مقابلة فردية 🗂', subject: e.subject || '—', result: e.currentStatus || '—', priority: e.priority || '—', nextFollowup: e.nextFollowup || '—',
    resultClr: '#0f766e', resultBg: '#ccfbf1',
  }));
  w.reintegrations.forEach((e) => rows.push({
    id: e.id, archiveType: 'reintegration', date: e.reintegrationDate || '', name: e.studentName || '—', school: e.school || '—', level: e.level || '—',
    type: 'إدماج مدرسي 📋', subject: e.reason || '—', result: e.currentStatus || '—', priority: e.priority || '—', nextFollowup: e.nextFollowup || '—',
    resultClr: rColor(e.currentStatus), resultBg: rBg(e.currentStatus),
  }));
  w.absences.forEach((e) => rows.push({
    id: e.id, archiveType: 'absence', date: e.recordDate || (e.savedAt || '').slice(0, 10) || '', name: e.studentName || '—', school: e.school || '—', level: e.level || '—',
    type: 'ملف غياب 🚨', subject: `${e.totalHours || 0}س / غير مبرر: ${e.unjustifiedHours || 0}س`, result: e.currentStatus || '—', priority: e.priority || '—', nextFollowup: e.nextFollowup || '—',
    resultClr: rColor(e.currentStatus), resultBg: rBg(e.currentStatus),
  }));
  w.specNeeds.forEach((e) => rows.push({
    id: e.id, archiveType: 'specialNeeds', date: e.date || '', name: e.studentName || '—', school: e.school || '—', level: e.level || '—',
    type: 'وضعية إعاقة ♿', subject: e.disabilityType || '—', result: e.currentStatus || '—', priority: e.priority || '—', nextFollowup: e.nextFollowup || '—',
    resultClr: rColor(e.currentStatus), resultBg: rBg(e.currentStatus),
  }));
  w.violence.forEach((e) => rows.push({
    id: e.id, archiveType: 'violence', date: e.reportDate || '', name: e.studentName || '—', school: e.school || '—', level: e.level || '—',
    type: 'حالة عنف 🛡️', subject: e.category || '—', result: e.status || '—', priority: e.priority || '—', nextFollowup: e.nextFollowup || '—',
    resultClr: rColor(e.status), resultBg: rBg(e.status),
  }));
  w.workshops.forEach((e) => rows.push({
    id: e.id, archiveType: 'workshop', date: e.date || '', name: e.title || '—', school: e.school || '—', level: '—',
    type: 'ورشة/نشاط 🎓', subject: (e.theme && e.theme.length ? e.theme.join(' / ') : (e.type || '—')), result: e.result || '—', priority: e.priority || '—', nextFollowup: e.nextDate || '—',
    resultClr: rColor(e.result), resultBg: rBg(e.result),
  }));

  // بوابة الاتصال (الخطوة 38): لا حقل «مستوى» ولا «أولوية» ولا «متابعة» فيها، فتُملأ بـ«—» كما تفعل الورشات
  w.calls.forEach((e) => rows.push({
    id: e.id, archiveType: 'parentCall', date: e.date || '', name: e.name || '—', school: '—', level: '—',
    type: 'اتصال بولي الأمر 📞', subject: callSubject(e), result: e.result || '—', priority: '—', nextFollowup: '—',
    resultClr: rColor(e.result), resultBg: rBg(e.result),
  }));
  w.meetings.forEach((e) => rows.push({
    id: e.id, archiveType: 'parentMeeting', date: e.date || '', name: e.student || '—', school: '—', level: e.cls || '—',
    type: 'مقابلة ولي أمر 🤝', subject: e.subject || '—', result: '—', priority: '—', nextFollowup: '—',
    resultClr: rColor(), resultBg: rBg(),
  }));

  rows.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return rows;
}

// ── صفوف نافذة المعاينة والتعديل (_wprAllRows): نسخة من كل سجل مع حقول تعريفية. ترتيب الإدراج هنا يختلف عن buildRows (العنف قبل الورشات والإعاقة آخراً)
// لأن الفرز ثابت: عند تساوي التاريخ يبقى هذا الترتيب كما كان في القديم.
const withMeta = (meta, e) => Object.assign({}, meta, e);

export function buildPreviewRows(c, from, to) {
  const w = collectWeek(c, from, to);
  const rows = [];
  w.interviews.forEach((e) => rows.push(withMeta({ _type: 'interview', _label: 'مقابلة فردية 🗂', _date: e.interviewDate || '', _dateField: 'interviewDate', _statusField: 'currentStatus' }, e)));
  w.reintegrations.forEach((e) => rows.push(withMeta({ _type: 'reintegration', _label: 'إدماج مدرسي 🔄', _date: e.reintegrationDate || '', _dateField: 'reintegrationDate', _statusField: 'currentStatus' }, e)));
  w.absences.forEach((e) => rows.push(withMeta({ _type: 'absence', _label: 'ملف غياب 🚨', _date: e.recordDate || (e.savedAt || '').slice(0, 10) || '', _dateField: 'recordDate', _statusField: 'currentStatus' }, e)));
  w.violence.forEach((e) => rows.push(withMeta({ _type: 'violence', _label: 'حالة عنف 🛡️', _date: e.reportDate || '', _dateField: 'reportDate', _statusField: 'status' }, e)));
  w.workshops.forEach((e) => rows.push(withMeta({ _type: 'workshop', _label: 'ورشة/نشاط 🎓', _date: e.date || '', _dateField: 'date', _statusField: 'result' }, e)));
  w.specNeeds.forEach((e) => rows.push(withMeta({ _type: 'specNeeds', _label: 'وضعية إعاقة ♿', _date: e.date || '', _dateField: 'date', _statusField: 'currentStatus' }, e)));
  rows.sort((a, b) => (a._date || '').localeCompare(b._date || ''));
  return rows;
}

// ── HTML التقرير للطباعة وWord (wkReportHtml) ──
const EMOJI = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu;
const clean = (v) => String(v == null || v === '' ? '—' : v).replace(EMOJI, '').replace(/\s+/g, ' ').trim() || '—';
const esc = (v) => clean(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const isDone = (r) => r === 'مُنجز' || r === 'منتهية' || r === 'مُغلق';
const isPend = (r) => r === 'قيد المتابعة' || r === 'جارية';

// rows من buildRows؛ logo: شعار الوزارة (base64) أو '' فلا تُرسم الصورة
export function buildReportHtml(rows, from, to, logo = '') {
  const total = rows.length;
  const done = rows.filter((r) => isDone(r.result)).length;
  const pending = rows.filter((r) => isPend(r.result)).length;
  const other = total - done - pending;
  const byType = {};
  rows.forEach((r) => { const t = clean(r.type); byType[t] = (byType[t] || 0) + 1; });
  const typeRows = Object.entries(byType).sort((a, b) => b[1] - a[1]);

  const bodyRows = total
    ? rows.map((r, i) => {
      const d = r.date ? clean(r.date) + ' ' + (DAY_NAMES[new Date(r.date + 'T12:00:00').getDay()] || '') : '—';
      return `<tr><td>${i + 1}</td><td>${esc(d)}</td><td>${esc(r.name)}</td><td>${esc(r.level)}</td><td>${esc(r.type)}</td><td>${esc(r.subject)}</td></tr>`;
    }).join('')
    : '<tr><td>—</td><td>—</td><td>لا توجد ملفات محفوظة لهذه الفترة</td><td>—</td><td>—</td><td>—</td></tr>';
  const mainTable = `
    <table class="wk-table-report"><thead><tr>
      <th data-w="0.6">#</th><th data-w="1.8">التاريخ</th><th data-w="3">اسم التلميذ(ة)</th>
      <th data-w="1.5">المستوى</th><th data-w="2.2">نوع الملف</th><th data-w="4">الموضوع / التفاصيل</th>
    </tr></thead><tbody>${bodyRows}</tbody></table>`;

  const typeTable = total ? `
    <div class="report-section-title">حصيلة الملفات حسب النوع</div>
    <table class="wk-table-report"><thead><tr><th data-w="3">نوع الملف</th><th data-w="1">العدد</th><th data-w="1">النسبة</th></tr></thead><tbody>` +
    typeRows.map(([t, c]) => `<tr><td>${esc(t)}</td><td>${c}</td><td>${Math.round(c / total * 100)}%</td></tr>`).join('') +
    '</tbody></table>' : '';

  return `
    <div class="new-report-header">
      <div class="nrh-logo">${logo ? `<img src="${logo}" alt="شعار الوزارة">` : ''}</div>
      <div class="nrh-dir">مديرية الحي الحسني</div>
      <div class="nrh-school">الفترة: ${from} — ${to}</div>
      <div class="nrh-title">التقرير الأسبوعي الشامل للمختص الاجتماعي</div>
    </div>
    <div class="report-section-title">ملخص الأسبوع</div>
    <table class="wk-table-report"><thead><tr><th data-w="1">إجمالي المهام</th><th data-w="1">المُنجزة</th><th data-w="1">قيد المتابعة</th><th data-w="1">أخرى</th></tr></thead>
      <tbody><tr><td>${total}</td><td>${done}</td><td>${pending}</td><td>${other}</td></tr></tbody></table>
    <div class="report-section-title">سجل المهام الأسبوعي — المقابلات والإدماج والغياب والعنف والإعاقة والورشات والاتصال بالأولياء</div>
    ${mainTable}
    ${typeTable}
    <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
    <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>`;
}

export const WeeklyReport = { collectWeek, buildRows, buildPreviewRows, buildReportHtml };
if (typeof window !== 'undefined') window.WeeklyReport = WeeklyReport;
