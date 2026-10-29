// مجمَّد من script-10.js قبل الخطوة 37 (جمع صفوف التقرير الأسبوعي وبناء HTML)
var _wprCurrentTab = 'all';
var _wprAllRows    = [];

function openWeeklyReportPreview() {
  // جمع نطاق الأسبوع المحدد — نفس طريقة wpGenerateReport
  var fromDate, toDate;
  try {
    fromDate = localStorage.getItem('wp:selectedFrom');
    toDate   = localStorage.getItem('wp:selectedTo');
  } catch(e) {}
  if (!fromDate || !toDate) {
    // fallback: الأسبوع الحالي (اثنين → أحد)
    var now = new Date();
    var day = now.getDay();
    var diff = (day === 0) ? -6 : 1 - day;
    var mon = new Date(now); mon.setDate(now.getDate() + diff);
    var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    var fmt = function(d){ return d.toISOString().slice(0,10); };
    fromDate = fmt(mon);
    toDate   = fmt(sun);
  }

  window._wprFrom = fromDate; window._wprTo = toDate;
  // تسمية الأسبوع
  var labelEl = document.getElementById('wpr_weekLabel');
  if (labelEl) labelEl.textContent = fromDate + ' — ' + toDate;

  // جمع البيانات من الأرشيف
  var interviews     = (typeof getArchive === 'function' ? getArchive() : []).filter(function(e){ return (e.interviewDate||'') >= fromDate && (e.interviewDate||'') <= toDate; });
  var reintegrations = (typeof getRArchive === 'function' ? getRArchive() : []).filter(function(e){ return (e.reintegrationDate||'') >= fromDate && (e.reintegrationDate||'') <= toDate; });
  var absences       = (typeof getAbArchive === 'function' ? getAbArchive() : []).filter(function(e){ var d=(e.recordDate||(e.savedAt||'').slice(0,10)); return d>=fromDate&&d<=toDate; });
  var violence       = (typeof getVioArchive === 'function' ? getVioArchive() : []).filter(function(e){ return (e.reportDate||'') >= fromDate && (e.reportDate||'') <= toDate; });
  var workshops      = (appData && appData.workshopsArchive ? appData.workshopsArchive : []).filter(function(e){ return (e.date||'') >= fromDate && (e.date||'') <= toDate; });
  var specNeeds      = (typeof getSnArchive === 'function' ? getSnArchive() : []).filter(function(e){ return (e.date||'') >= fromDate && (e.date||'') <= toDate; });

  _wprAllRows = [];
  interviews.forEach(function(e){
    var row = { _type:'interview', _label:'مقابلة فردية 🗂', _date:e.interviewDate||'', _dateField:'interviewDate', _statusField:'currentStatus' };
    for (var k in e) { if (e.hasOwnProperty(k)) row[k] = e[k]; }
    _wprAllRows.push(row);
  });
  reintegrations.forEach(function(e){
    var row = { _type:'reintegration', _label:'إدماج مدرسي 🔄', _date:e.reintegrationDate||'', _dateField:'reintegrationDate', _statusField:'currentStatus' };
    for (var k in e) { if (e.hasOwnProperty(k)) row[k] = e[k]; }
    _wprAllRows.push(row);
  });
  absences.forEach(function(e){
    var row = { _type:'absence', _label:'ملف غياب 🚨', _date:e.recordDate||(e.savedAt||'').slice(0,10)||'', _dateField:'recordDate', _statusField:'currentStatus' };
    for (var k in e) { if (e.hasOwnProperty(k)) row[k] = e[k]; }
    _wprAllRows.push(row);
  });
  violence.forEach(function(e){
    var row = { _type:'violence', _label:'حالة عنف 🛡️', _date:e.reportDate||'', _dateField:'reportDate', _statusField:'status' };
    for (var k in e) { if (e.hasOwnProperty(k)) row[k] = e[k]; }
    _wprAllRows.push(row);
  });
  workshops.forEach(function(e){
    var row = { _type:'workshop', _label:'ورشة/نشاط 🎓', _date:e.date||'', _dateField:'date', _statusField:'result' };
    for (var k in e) { if (e.hasOwnProperty(k)) row[k] = e[k]; }
    _wprAllRows.push(row);
  });
  specNeeds.forEach(function(e){
    var row = { _type:'specNeeds', _label:'وضعية إعاقة ♿', _date:e.date||'', _dateField:'date', _statusField:'currentStatus' };
    for (var k in e) { if (e.hasOwnProperty(k)) row[k] = e[k]; }
    _wprAllRows.push(row);
  });
  _wprAllRows.sort(function(a,b){ return (a._date||'').localeCompare(b._date||''); });

  _wprCurrentTab = 'all';
  wprUpdateTabStyles('all');
  wprRenderStats();
  wprRenderTable();

  // فتح النافذة
  var modal = document.getElementById('weeklyPreviewModal');
  modal.style.display = 'flex';
}


function wkBuildRows(fromDate, toDate) {
  // ── جمع المهام من الأرشيف فقط (المحفوظة) ──
  const interviews   = getArchive().filter(e => (e.interviewDate||'') >= fromDate && (e.interviewDate||'') <= toDate);
  const reintegrations = (typeof getRArchive === 'function' ? getRArchive() : []).filter(e => (e.reintegrationDate||'') >= fromDate && (e.reintegrationDate||'') <= toDate);
  const absences     = (typeof getAbArchive === 'function' ? getAbArchive() : []).filter(e => { const d=(e.recordDate||(e.savedAt||'').slice(0,10)); return d>=fromDate&&d<=toDate; });
  const specNeeds    = (typeof getSnArchive === 'function' ? getSnArchive() : []).filter(e => (e.date||'') >= fromDate && (e.date||'') <= toDate);
  const violenceCases= (typeof getVioArchive === 'function' ? getVioArchive() : []).filter(e => (e.reportDate||'') >= fromDate && (e.reportDate||'') <= toDate);
  const workshops    = (appData && appData.workshopsArchive ? appData.workshopsArchive : []).filter(e => (e.date||'') >= fromDate && (e.date||'') <= toDate);

  // ── بناء صفوف موحدة من الأرشيف فقط ──
  const rows = [];

  const rColor = r => r==='مُنجز'?'#166534':r==='قيد المتابعة'?'#854d0e':'#475569';
  const rBg    = r => r==='مُنجز'?'#dcfce7':r==='قيد المتابعة'?'#fef9c3':'#f1f5f9';
  const pBadge = p => p==='عاجلة'?'🔴':p==='عالية'?'🟠':p==='متوسطة'?'🟡':'🟢';

  interviews.forEach(e => rows.push({
    id: e.id, archiveType: 'interview',
    date: e.interviewDate||'',
    name: e.studentName||'—',
    school: e.school||'—',
    level: e.level||'—',
    type: 'مقابلة فردية 🗂',
    subject: e.subject||'—',
    result: e.currentStatus||'—',
    priority: e.priority||'—',
    nextFollowup: e.nextFollowup||'—',
    resultClr:'#0f766e', resultBg:'#ccfbf1'
  }));

  reintegrations.forEach(e => rows.push({
    id: e.id, archiveType: 'reintegration',
    date: e.reintegrationDate||'',
    name: e.studentName||'—',
    school: e.school||'—',
    level: e.level||'—',
    type: 'إدماج مدرسي 📋',
    subject: e.reason||'—',
    result: e.currentStatus||'—',
    priority: e.priority||'—',
    nextFollowup: e.nextFollowup||'—',
    resultClr: rColor(e.currentStatus), resultBg: rBg(e.currentStatus)
  }));

  absences.forEach(e => rows.push({
    id: e.id, archiveType: 'absence',
    date: e.recordDate||(e.savedAt||'').slice(0,10)||'',
    name: e.studentName||'—',
    school: e.school||'—',
    level: e.level||'—',
    type: 'ملف غياب 🚨',
    subject: `${e.totalHours||0}س / غير مبرر: ${e.unjustifiedHours||0}س`,
    result: e.currentStatus||'—',
    priority: e.priority||'—',
    nextFollowup: e.nextFollowup||'—',
    resultClr: rColor(e.currentStatus), resultBg: rBg(e.currentStatus)
  }));

  specNeeds.forEach(e => rows.push({
    id: e.id, archiveType: 'specialNeeds',
    date: e.date||'',
    name: e.studentName||'—',
    school: e.school||'—',
    level: e.level||'—',
    type: 'وضعية إعاقة ♿',
    subject: e.disabilityType||'—',
    result: e.currentStatus||'—',
    priority: e.priority||'—',
    nextFollowup: e.nextFollowup||'—',
    resultClr: rColor(e.currentStatus), resultBg: rBg(e.currentStatus)
  }));

  violenceCases.forEach(e => rows.push({
    id: e.id, archiveType: 'violence',
    date: e.reportDate||'',
    name: e.studentName||'—',
    school: e.school||'—',
    level: e.level||'—',
    type: 'حالة عنف 🛡️',
    subject: e.category||'—',
    result: e.status||'—',
    priority: e.priority||'—',
    nextFollowup: e.nextFollowup||'—',
    resultClr: rColor(e.status), resultBg: rBg(e.status)
  }));

  workshops.forEach(e => rows.push({
    id: e.id, archiveType: 'workshop',
    date: e.date||'',
    name: e.title||'—',
    school: e.school||'—',
    level: '—',
    type: 'ورشة/نشاط 🎓',
    subject: (e.theme&&e.theme.length ? e.theme.join(' / ') : (e.type||'—')),
    result: e.result||'—',
    priority: e.priority||'—',
    nextFollowup: e.nextDate||'—',
    resultClr: rColor(e.result), resultBg: rBg(e.result)
  }));

  rows.sort((a,b) => (a.date||'').localeCompare(b.date||''));
  return rows;
}

function wkReportHtml(fromDate, toDate) {
  const rows = wkBuildRows(fromDate, toDate);
  const clean = v => String(v == null || v === '' ? '—' : v).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').replace(/\s+/g,' ').trim() || '—';
  const esc = v => clean(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const isDone = r => r==='مُنجز'||r==='منتهية'||r==='مُغلق';
  const isPend = r => r==='قيد المتابعة'||r==='جارية';
  const total = rows.length;
  const done = rows.filter(r => isDone(r.result)).length;
  const pending = rows.filter(r => isPend(r.result)).length;
  const other = total - done - pending;
  const byType = {};
  rows.forEach(r => { const t = clean(r.type); byType[t] = (byType[t]||0)+1; });
  const typeRows = Object.entries(byType).sort((a,b)=>b[1]-a[1]);
  const logo = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? MINISTRY_LOGO_B64 : '';
  const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

  const bodyRows = total ? rows.map((r,i) => {
      const d = r.date ? clean(r.date) + ' ' + (dayNames[new Date(r.date+'T12:00:00').getDay()]||'') : '—';
      return `<tr><td>${i+1}</td><td>${esc(d)}</td><td>${esc(r.name)}</td><td>${esc(r.level)}</td><td>${esc(r.type)}</td><td>${esc(r.subject)}</td></tr>`;
    }).join('')
    : `<tr><td>—</td><td>—</td><td>لا توجد ملفات محفوظة لهذه الفترة</td><td>—</td><td>—</td><td>—</td></tr>`;
  const mainTable = `
    <table class="wk-table-report"><thead><tr>
      <th data-w="0.6">#</th><th data-w="1.8">التاريخ</th><th data-w="3">اسم التلميذ(ة)</th>
      <th data-w="1.5">المستوى</th><th data-w="2.2">نوع الملف</th><th data-w="4">الموضوع / التفاصيل</th>
    </tr></thead><tbody>${bodyRows}</tbody></table>`;

  const typeTable = total ? `
    <div class="report-section-title">حصيلة الملفات حسب النوع</div>
    <table class="wk-table-report"><thead><tr><th data-w="3">نوع الملف</th><th data-w="1">العدد</th><th data-w="1">النسبة</th></tr></thead><tbody>` +
    typeRows.map(([t,c]) => `<tr><td>${esc(t)}</td><td>${c}</td><td>${Math.round(c/total*100)}%</td></tr>`).join('') +
    `</tbody></table>` : '';

  return `
    <div class="new-report-header">
      <div class="nrh-logo">${logo ? `<img src="${logo}" alt="شعار الوزارة">` : ''}</div>
      <div class="nrh-dir">مديرية الحي الحسني</div>
      <div class="nrh-school">الفترة: ${fromDate} — ${toDate}</div>
      <div class="nrh-title">التقرير الأسبوعي الشامل للمختص الاجتماعي</div>
    </div>
    <div class="report-section-title">ملخص الأسبوع</div>
    <table class="wk-table-report"><thead><tr><th data-w="1">إجمالي المهام</th><th data-w="1">المُنجزة</th><th data-w="1">قيد المتابعة</th><th data-w="1">أخرى</th></tr></thead>
      <tbody><tr><td>${total}</td><td>${done}</td><td>${pending}</td><td>${other}</td></tr></tbody></table>
    <div class="report-section-title">سجل المهام الأسبوعي — المقابلات والإدماج والغياب والعنف والإعاقة والورشات</div>
    ${mainTable}
    ${typeTable}
    <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
    <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>`;
}

