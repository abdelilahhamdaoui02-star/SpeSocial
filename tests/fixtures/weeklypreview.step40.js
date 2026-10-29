// مجمَّد من script-10.js قبل الخطوة 40 (نافذة معاينة وتعديل التقرير الأسبوعي وتعديل السجل وحذفه) — للمطابقة فقط
// ══════════════════════════════════════════════════════════
//  openWeeklyReportPreview — معاينة وتعديل التقرير الأسبوعي
// ══════════════════════════════════════════════════════════
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

  // جمع صفوف المعاينة صار في src/weekly/weeklyReport.js (WeeklyReport.buildPreviewRows)
  _wprAllRows = WeeklyReport.buildPreviewRows(wkCollections(), fromDate, toDate);

  _wprCurrentTab = 'all';
  wprUpdateTabStyles('all');
  wprRenderStats();
  wprRenderTable();

  // فتح النافذة
  var modal = document.getElementById('weeklyPreviewModal');
  modal.style.display = 'flex';
}

function wprClose() {
  document.getElementById('weeklyPreviewModal').style.display = 'none';
}

function wprCloseEdit() {
  document.getElementById('wprEditModal').style.display = 'none';
}

function wprShowTab(tab) {
  _wprCurrentTab = tab;
  wprUpdateTabStyles(tab);
  wprRenderTable();
}

function wprUpdateTabStyles(active) {
  ['all','interview','reintegration','absence','violence','workshop','specNeeds'].forEach(function(t) {
    var btn = document.getElementById('wpr_tab_' + t);
    if (!btn) return;
    if (t === active) {
      btn.style.borderBottom = '3px solid #1a3a5c';
      btn.style.color = '#1a3a5c';
      btn.style.fontWeight = '800';
    } else {
      btn.style.borderBottom = '3px solid transparent';
      btn.style.color = '#64748b';
      btn.style.fontWeight = '700';
    }
  });
}

function wprGetFiltered() {
  if (_wprCurrentTab === 'all') return _wprAllRows;
  return _wprAllRows.filter(r => r._type === _wprCurrentTab);
}

function wprRenderStats() {
  var statsEl = document.getElementById('wpr_stats');
  if (!statsEl) return;
  var total = _wprAllRows.length;
  var byType = {};
  _wprAllRows.forEach(r => { byType[r._type] = (byType[r._type]||0)+1; });
  var labels = { interview:'مقابلات', reintegration:'إدماج', absence:'غياب', violence:'عنف', workshop:'ورشات', specNeeds:'إعاقة' };
  var colors = { interview:'#1a3a5c', reintegration:'#0f766e', absence:'#d97706', violence:'#dc2626', workshop:'#7c3aed', specNeeds:'#0891b2' };
  var html = '<div style="display:flex;align-items:center;gap:6px;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 14px;min-width:90px;"><div style="font-size:1.3rem;font-weight:800;color:#1a3a5c;">' + total + '</div><div style="font-size:0.7rem;color:#64748b;font-weight:700;">إجمالي</div></div>';
  Object.keys(byType).forEach(function(t) {
    html += '<div style="display:flex;align-items:center;gap:6px;background:#fff;border:1.5px solid ' + (colors[t]||'#e2e8f0') + '33;border-radius:10px;padding:8px 14px;min-width:90px;">' +
      '<div style="font-size:1.3rem;font-weight:800;color:' + (colors[t]||'#475569') + ';">' + byType[t] + '</div>' +
      '<div style="font-size:0.7rem;color:#64748b;font-weight:700;">' + (labels[t]||t) + '</div></div>';
  });
  statsEl.innerHTML = html;
}

function wprRenderTable() {
  var area = document.getElementById('wpr_tableArea');
  if (!area) return;
  var rows = wprGetFiltered();
  if (!rows.length) {
    area.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;font-size:0.88rem;">📂 لا توجد سجلات لهذه الفترة في هذا القسم</div>';
    return;
  }
  var pBadge = function(p) { return p==='عاجلة'?'🔴':p==='عالية'?'🟠':p==='متوسطة'?'🟡':p==='عادية'?'🟢':'—'; };
  var stBg = function(s) { return s==='مُنجز'||s==='منتهية'||s==='مُغلق'?'#dcfce7':s==='قيد المتابعة'||s==='جارية'?'#fef9c3':'#f1f5f9'; };
  var stClr = function(s) { return s==='مُنجز'||s==='منتهية'||s==='مُغلق'?'#166534':s==='قيد المتابعة'||s==='جارية'?'#854d0e':'#475569'; };

  var trs = rows.map(function(r, i) {
    var status = r[r._statusField] || '—';
    return '<tr style="border-bottom:1px solid #e2e8f0;">' +
      '<td style="padding:8px 10px;text-align:center;color:#94a3b8;font-size:0.75rem;">' + (i+1) + '</td>' +
      '<td style="padding:8px 10px;font-size:0.78rem;color:#475569;white-space:nowrap;">' + (r._date||'—') + '</td>' +
      '<td style="padding:8px 10px;font-weight:700;color:#1a3a5c;font-size:0.82rem;">' + (r.studentName||r.title||'—') + '</td>' +
      '<td style="padding:8px 10px;font-size:0.75rem;color:#64748b;">' + (r.school||'—') + '</td>' +
      '<td style="padding:8px 10px;font-size:0.75rem;">' + r._label + '</td>' +
      '<td style="padding:8px 10px;text-align:center;">' +
        '<span style="background:' + stBg(status) + ';color:' + stClr(status) + ';border-radius:20px;padding:2px 10px;font-size:0.72rem;font-weight:700;">' + status + '</span>' +
      '</td>' +
      '<td style="padding:8px 10px;text-align:center;font-size:0.8rem;">' + pBadge(r.priority||'') + ' ' + (r.priority&&r.priority!=='—'?r.priority:'') + '</td>' +
      '<td style="padding:8px 10px;text-align:center;font-size:0.75rem;color:#475569;white-space:nowrap;">' + (r.nextFollowup||'—') + '</td>' +
      '<td style="padding:8px 10px;text-align:center;">' +
        '<div style="display:flex;gap:5px;justify-content:center;">' +
        '<button onclick="wprOpenEdit(' + i + ')" style="background:linear-gradient(135deg,#1a3a5c,#2563a8);color:white;border:none;border-radius:7px;padding:5px 12px;cursor:pointer;font-family:Cairo,sans-serif;font-size:0.75rem;font-weight:700;">✏️ تعديل</button>' +
        '<button onclick="wprDeleteRow(' + i + ', this)" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;border:none;border-radius:7px;padding:5px 10px;cursor:pointer;font-family:Cairo,sans-serif;font-size:0.75rem;font-weight:700;">🗑</button>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }).join('');

  area.innerHTML =
    '<div style="overflow-x:auto;">' +
    '<table style="width:100%;border-collapse:collapse;font-family:Cairo,sans-serif;">' +
    '<thead><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">' +
    '<th style="padding:9px 10px;text-align:center;font-size:0.75rem;color:#475569;font-weight:700;width:32px;">#</th>' +
    '<th style="padding:9px 10px;text-align:right;font-size:0.75rem;color:#475569;font-weight:700;white-space:nowrap;">التاريخ</th>' +
    '<th style="padding:9px 10px;text-align:right;font-size:0.75rem;color:#475569;font-weight:700;">اسم التلميذ(ة)</th>' +
    '<th style="padding:9px 10px;text-align:right;font-size:0.75rem;color:#475569;font-weight:700;">المؤسسة</th>' +
    '<th style="padding:9px 10px;text-align:right;font-size:0.75rem;color:#475569;font-weight:700;">نوع الملف</th>' +
    '<th style="padding:9px 10px;text-align:center;font-size:0.75rem;color:#475569;font-weight:700;white-space:nowrap;">الحالة</th>' +
    '<th style="padding:9px 10px;text-align:center;font-size:0.75rem;color:#475569;font-weight:700;">الأولوية</th>' +
    '<th style="padding:9px 10px;text-align:center;font-size:0.75rem;color:#475569;font-weight:700;white-space:nowrap;">المتابعة</th>' +
    '<th style="padding:9px 10px;text-align:center;font-size:0.75rem;color:#475569;font-weight:700;">الإجراءات</th>' +
    '</tr></thead><tbody>' + trs + '</tbody></table></div>';
}

var _wprEditIndex = -1;

function wprOpenEdit(idx) {
  var rows = wprGetFiltered();
  var r = rows[idx];
  if (!r) return;
  _wprEditIndex = _wprAllRows.indexOf(r);
  if (_wprEditIndex === -1) _wprEditIndex = idx;

  var priorities = ['عاجلة','عالية','متوسطة','عادية','—'];
  var prioOpts = priorities.map(function(p){ return '<option value="' + p + '"' + (r.priority===p?' selected':'') + '>' + p + '</option>'; }).join('');

  var statuses = ['مُنجز','قيد المتابعة','جارية','منتهية','مُغلق','أخرى'];
  var curStatus = r[r._statusField] || '';
  var statusOpts = statuses.map(function(s){ return '<option value="' + s + '"' + (curStatus===s?' selected':'') + '>' + s + '</option>'; }).join('');
  if (!statuses.includes(curStatus) && curStatus) statusOpts = '<option value="' + curStatus + '" selected>' + curStatus + '</option>' + statusOpts;

  // ── دالة مساعدة لبناء حقل إدخال ──
  var inpStyle = 'width:100%;padding:8px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-family:Cairo,sans-serif;font-size:0.85rem;box-sizing:border-box;';
  var lblStyle = 'font-size:0.82rem;font-weight:700;color:#475569;display:block;margin-bottom:4px;';
  var sectionStyle = 'background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px;margin-top:4px;';
  var sectionTitleStyle = 'font-size:0.78rem;font-weight:800;color:#1a3a5c;margin-bottom:10px;display:flex;align-items:center;gap:6px;';

  // ── حقول ديناميكية حسب نوع السجل ──
  var dynamicFields = '';

  if (r._type === 'interview' || r._type === 'reintegration' || r._type === 'absence' || r._type === 'specNeeds') {
    dynamicFields +=
      '<div style="' + sectionStyle + '">' +
      '<div style="' + sectionTitleStyle + '">📋 معلومات إضافية — ' + r._label + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div><label style="' + lblStyle + '">القسم</label>' +
      '<input id="wpr_ed_level" value="' + (r.level||'') + '" placeholder="مثال: السادس ابتدائي أ" style="' + inpStyle + '"></div>' +
      '<div><label style="' + lblStyle + '">الجنس</label>' +
      '<select id="wpr_ed_gender" style="' + inpStyle + '">' +
      '<option value="">— اختر —</option>' +
      ['ذكر','أنثى'].map(function(g){ return '<option value="'+g+'"'+(r.gender===g?' selected':'')+'>'+g+'</option>'; }).join('') +
      '</select></div>' +
      '</div></div>';
  }

  if (r._type === 'interview') {
    var iPrioOpts = ['عاجلة','عالية','متوسطة','عادية','—'].map(function(p){ return '<option value="'+p+'"'+(r.priority===p?' selected':'')+'>'+p+'</option>'; }).join('');
    dynamicFields +=
      '<div style="' + sectionStyle + 'margin-top:10px;">' +
      '<div style="' + sectionTitleStyle + '">🗂 تفاصيل المقابلة</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div><label style="' + lblStyle + '">سبب المقابلة</label>' +
      '<input id="wpr_ed_reason" value="' + (r.reason||r.interviewReason||'') + '" placeholder="سبب المقابلة" style="' + inpStyle + '"></div>' +
      '<div><label style="' + lblStyle + '">وضعية الحالة</label>' +
      '<input id="wpr_ed_caseStatus" value="' + (r.caseStatus||r.status||'') + '" placeholder="وضعية الحالة" style="' + inpStyle + '"></div>' +
      '</div></div>';
  }

  if (r._type === 'contact' || r._type === 'parentSession') {
    var contactTypes = ['مكالمة هاتفية','رسالة نصية','بريد إلكتروني','جلسة استماع مع ولي الأمر','اجتماع ثلاثي','أخرى'];
    var ctTypeOpts = contactTypes.map(function(t){ return '<option value="'+t+'"'+(r.type===t?' selected':'')+'>'+t+'</option>'; }).join('');
    dynamicFields +=
      '<div style="' + sectionStyle + '">' +
      '<div style="' + sectionTitleStyle + '">📞 تفاصيل التواصل</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div><label style="' + lblStyle + '">نوع التواصل</label>' +
      '<select id="wpr_ed_ctType" style="' + inpStyle + '">' +
      '<option value="">— اختر —</option>' + ctTypeOpts +
      '</select></div>' +
      '<div><label style="' + lblStyle + '">مع من</label>' +
      '<input id="wpr_ed_ctWith" value="' + (r.contactWith||r.with||'') + '" placeholder="ولي الأمر، الأستاذ..." style="' + inpStyle + '"></div>' +
      '</div>' +
      '<div style="margin-top:10px;"><label style="' + lblStyle + '">نتيجة / خلاصة التواصل</label>' +
      '<textarea id="wpr_ed_ctResult" rows="2" style="' + inpStyle + 'resize:vertical;">' + (r.result||r.summary||'') + '</textarea></div>' +
      '</div>';
  }

  if (r._type === 'workshop') {
    dynamicFields +=
      '<div style="' + sectionStyle + '">' +
      '<div style="' + sectionTitleStyle + '">🎓 تفاصيل الورشة / النشاط</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div><label style="' + lblStyle + '">نوع النشاط</label>' +
      '<input id="wpr_ed_wsType" value="' + (r.type||r.activityType||'') + '" placeholder="نوع النشاط" style="' + inpStyle + '"></div>' +
      '<div><label style="' + lblStyle + '">عدد المشاركين</label>' +
      '<input id="wpr_ed_wsParticipants" type="number" value="' + (r.participants||r.participantsCount||'') + '" placeholder="عدد المشاركين" style="' + inpStyle + '"></div>' +
      '</div>' +
      '<div style="margin-top:10px;"><label style="' + lblStyle + '">الأقسام المستهدفة</label>' +
      '<input id="wpr_ed_wsClasses" value="' + (r.classes||'') + '" placeholder="مثال: 1APIC-1، 2APIC-3، ..." style="' + inpStyle + '"></div>' +
      '<div style="margin-top:10px;"><label style="' + lblStyle + '">نتيجة / ملاحظات الورشة</label>' +
      '<textarea id="wpr_ed_wsResult" rows="2" style="' + inpStyle + 'resize:vertical;">' + (r.result||'') + '</textarea></div>' +
      '</div>';
  }
  if (r._type === 'violence') {
    var vioStatuses = ['جارية','تحت المراقبة','مُغلقة','محالة','أخرى'];
    var vioStOpts = vioStatuses.map(function(s){ return '<option value="'+s+'"'+(r.status===s?' selected':'')+'>'+s+'</option>'; }).join('');
    dynamicFields +=
      '<div style="' + sectionStyle + '">' +
      '<div style="' + sectionTitleStyle + '">🛡️ تفاصيل حالة العنف</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div><label style="' + lblStyle + '">نوع العنف</label>' +
      '<input id="wpr_ed_vioCategory" value="' + (r.category||r.violenceType||'') + '" placeholder="نوع العنف" style="' + inpStyle + '"></div>' +
      '<div><label style="' + lblStyle + '">وضعية الحالة</label>' +
      '<select id="wpr_ed_vioStatus" style="' + inpStyle + '">' +
      '<option value="">— اختر —</option>' + vioStOpts +
      '</select></div>' +
      '</div>' +
      '<div style="margin-top:10px;"><label style="' + lblStyle + '">الإجراءات المتخذة</label>' +
      '<textarea id="wpr_ed_vioActions" rows="2" style="' + inpStyle + 'resize:vertical;">' + (r.actions||'') + '</textarea></div>' +
      '</div>';
  }

  if (r._type === 'absence') {
    dynamicFields +=
      '<div style="' + sectionStyle + 'margin-top:10px;">' +
      '<div style="' + sectionTitleStyle + '">🚨 تفاصيل ملف الغياب</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
      '<div><label style="' + lblStyle + '">عدد أيام الغياب</label>' +
      '<input id="wpr_ed_abDays" type="number" value="' + (r.absenceDays||r.days||'') + '" placeholder="عدد الأيام" style="' + inpStyle + '"></div>' +
      '<div><label style="' + lblStyle + '">نوع الغياب</label>' +
      '<input id="wpr_ed_abType" value="' + (r.absenceType||r.type||'') + '" placeholder="مبرر / غير مبرر" style="' + inpStyle + '"></div>' +
      '</div></div>';
  }

  if (r._type === 'specNeeds') {
    dynamicFields +=
      '<div style="' + sectionStyle + 'margin-top:10px;">' +
      '<div style="' + sectionTitleStyle + '">♿ تفاصيل وضعية الإعاقة</div>' +
      '<div><label style="' + lblStyle + '">نوع الإعاقة / التشخيص</label>' +
      '<input id="wpr_ed_snDiag" value="' + (r.diagnosis||r.disabilityType||'') + '" placeholder="التشخيص أو نوع الإعاقة" style="' + inpStyle + '"></div>' +
      '<div style="margin-top:10px;"><label style="' + lblStyle + '">الإجراءات والدعم المقدَّم</label>' +
      '<textarea id="wpr_ed_snActions" rows="2" style="' + inpStyle + 'resize:vertical;">' + (r.actions||r.support||'') + '</textarea></div>' +
      '</div>';
  }

  var fieldsHtml =
    '<div><label style="' + lblStyle + '">اسم التلميذ(ة)</label>' +
    '<input id="wpr_ed_name" value="' + (r.studentName||r.title||'') + '" style="width:100%;padding:8px 12px;border:1.5px solid #cbd5e1;border-radius:8px;font-family:Cairo,sans-serif;font-size:0.88rem;box-sizing:border-box;"></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
    '<div><label style="' + lblStyle + '">المؤسسة</label>' +
    '<input id="wpr_ed_school" value="' + (r.school||'') + '" style="' + inpStyle + '"></div>' +
    '<div><label style="' + lblStyle + '">التاريخ</label>' +
    '<input id="wpr_ed_date" type="date" value="' + (r[r._dateField]||'') + '" style="' + inpStyle + '"></div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
    '<div><label style="' + lblStyle + '">الحالة الراهنة</label>' +
    '<select id="wpr_ed_status" style="' + inpStyle + '">' + statusOpts + '</select></div>' +
    '<div><label style="' + lblStyle + '">الأولوية</label>' +
    '<select id="wpr_ed_priority" style="' + inpStyle + '">' + prioOpts + '</select></div>' +
    '</div>' +
    '<div><label style="' + lblStyle + '">المتابعة القادمة</label>' +
    '<input id="wpr_ed_followup" type="date" value="' + (r.nextFollowup||'') + '" style="' + inpStyle + '"></div>' +
    dynamicFields +
    '<div style="margin-top:4px;"><label style="' + lblStyle + '">ملاحظات</label>' +
    '<textarea id="wpr_ed_notes" rows="3" style="' + inpStyle + 'resize:vertical;">' + (r.notes||'') + '</textarea></div>';

  document.getElementById('wprEditFields').innerHTML = fieldsHtml;
  var modal = document.getElementById('wprEditModal');
  modal.style.display = 'flex';
}

function wprSaveEdit() {
  if (_wprEditIndex < 0 || _wprEditIndex >= _wprAllRows.length) return;
  var r = _wprAllRows[_wprEditIndex];

  var newName     = document.getElementById('wpr_ed_name').value.trim();
  var newSchool   = document.getElementById('wpr_ed_school').value.trim();
  var newDate     = document.getElementById('wpr_ed_date').value;
  var newStatus   = document.getElementById('wpr_ed_status').value;
  var newPriority = document.getElementById('wpr_ed_priority').value;
  var newFollowup = document.getElementById('wpr_ed_followup').value;
  var newNotes    = document.getElementById('wpr_ed_notes').value.trim();

  // ── قراءة الحقول الديناميكية حسب نوع السجل ──
  var getVal = function(id) { var el = document.getElementById(id); return el ? el.value.trim() : null; };

  var dynFields = {};

  if (r._type === 'interview' || r._type === 'reintegration' || r._type === 'absence' || r._type === 'specNeeds') {
    var lvl = getVal('wpr_ed_level');
    var gdr = getVal('wpr_ed_gender');
    if (lvl !== null) dynFields.level = lvl;
    if (gdr !== null) dynFields.gender = gdr;
  }
  if (r._type === 'interview') {
    var rsn = getVal('wpr_ed_reason');
    var cst = getVal('wpr_ed_caseStatus');
    if (rsn !== null) { dynFields.reason = rsn; dynFields.interviewReason = rsn; }
    if (cst !== null) { dynFields.caseStatus = cst; }
  }
  if (r._type === 'contact' || r._type === 'parentSession') {
    var ctt = getVal('wpr_ed_ctType');
    var ctw = getVal('wpr_ed_ctWith');
    var ctr = getVal('wpr_ed_ctResult');
    if (ctt !== null) dynFields.type = ctt;
    if (ctw !== null) { dynFields.contactWith = ctw; dynFields.with = ctw; }
    if (ctr !== null) { dynFields.result = ctr; dynFields.summary = ctr; }
  }
  if (r._type === 'workshop') {
    var wst = getVal('wpr_ed_wsType');
    var wsp = getVal('wpr_ed_wsParticipants');
    var wsr = getVal('wpr_ed_wsResult');
    var wsc = getVal('wpr_ed_wsClasses');
    if (wst !== null) { dynFields.type = wst; dynFields.activityType = wst; }
    if (wsp !== null) { dynFields.participants = wsp; dynFields.participantsCount = wsp; }
    if (wsr !== null) dynFields.result = wsr;
    if (wsc !== null) dynFields.classes = wsc;
  }
  if (r._type === 'violence') {
    var vct = getVal('wpr_ed_vioCategory');
    var vst = getVal('wpr_ed_vioStatus');
    var vac = getVal('wpr_ed_vioActions');
    if (vct !== null) { dynFields.category = vct; dynFields.violenceType = vct; }
    if (vst !== null) dynFields.status = vst;
    if (vac !== null) dynFields.actions = vac;
  }
  if (r._type === 'absence') {
    var abd = getVal('wpr_ed_abDays');
    var abt = getVal('wpr_ed_abType');
    if (abd !== null) { dynFields.absenceDays = abd; dynFields.days = abd; }
    if (abt !== null) { dynFields.absenceType = abt; dynFields.type = abt; }
  }
  if (r._type === 'specNeeds') {
    var snd = getVal('wpr_ed_snDiag');
    var sna = getVal('wpr_ed_snActions');
    if (snd !== null) { dynFields.diagnosis = snd; dynFields.disabilityType = snd; }
    if (sna !== null) { dynFields.actions = sna; dynFields.support = sna; }
  }

  // تحديث الصف المحلي
  r.studentName        = newName;
  if (r._type === 'workshop') r.title = newName;
  r.school             = newSchool;
  r[r._dateField]      = newDate;
  r._date              = newDate;
  r[r._statusField]    = newStatus;
  r.priority           = newPriority;
  r.nextFollowup       = newFollowup;
  r.notes              = newNotes;
  for (var dk in dynFields) { if (dynFields.hasOwnProperty(dk)) r[dk] = dynFields[dk]; }

  // حفظ في الأرشيف الفعلي
  var arcFns = {
    interview:     { get: function(){ return typeof getArchive     === 'function' ? getArchive()     : []; }, save: function(a){ if(typeof saveArchive     === 'function') saveArchive(a);     } },
    reintegration: { get: function(){ return typeof getRArchive    === 'function' ? getRArchive()    : []; }, save: function(a){ if(typeof saveRArchive    === 'function') saveRArchive(a);    } },
    absence:       { get: function(){ return typeof getAbArchive   === 'function' ? getAbArchive()   : []; }, save: function(a){ if(typeof saveAbArchive   === 'function') saveAbArchive(a);   } },
    violence:      { get: function(){ return typeof getVioArchive  === 'function' ? getVioArchive()  : []; }, save: function(a){ if(typeof saveVioArchive  === 'function') saveVioArchive(a);  } },
    workshop:      { get: function(){ return (appData && appData.workshopsArchive) ? appData.workshopsArchive : []; }, save: function(a){ if(appData){ appData.workshopsArchive=a; if(typeof saveUserKey==='function') saveUserKey('workshopsArchive'); } } },
    specNeeds:     { get: function(){ return typeof getSnArchive   === 'function' ? getSnArchive()   : []; }, save: function(a){ if(typeof saveSnArchive   === 'function') saveSnArchive(a);   } },
    contact:       { get: function(){ return typeof getCtArchive   === 'function' ? getCtArchive()   : []; }, save: function(a){ if(typeof saveCtArchive   === 'function') saveCtArchive(a);   } },
    parentSession: { get: function(){ return typeof getCtArchive   === 'function' ? getCtArchive()   : []; }, save: function(a){ if(typeof saveCtArchive   === 'function') saveCtArchive(a);   } }
  };
  var fns = arcFns[r._type];
  if (fns) {
    var arc = fns.get();
    var idx2 = -1;
    for (var ii=0; ii<arc.length; ii++) { if (arc[ii].id == r.id) { idx2 = ii; break; } }
    if (idx2 !== -1) {
      arc[idx2].studentName     = newName;
      if (r._type === 'workshop') arc[idx2].title = newName;
      arc[idx2].school          = newSchool;
      arc[idx2][r._dateField]   = newDate;
      arc[idx2][r._statusField] = newStatus;
      arc[idx2].priority        = newPriority;
      arc[idx2].nextFollowup    = newFollowup;
      arc[idx2].notes           = newNotes;
      for (var dk2 in dynFields) { if (dynFields.hasOwnProperty(dk2)) arc[idx2][dk2] = dynFields[dk2]; }
      fns.save(arc);
    }
  }

  wprCloseEdit();
  wprRenderStats();
  wprRenderTable();
  // تنبيه بسيط
  var toast = document.createElement('div');
  toast.textContent = '✅ تم حفظ التعديلات بنجاح';
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#166534;color:#fff;border-radius:10px;padding:10px 24px;font-family:Cairo,sans-serif;font-size:0.88rem;font-weight:700;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
  document.body.appendChild(toast);
  setTimeout(function(){ toast.remove(); }, 2500);
}

function wprDeleteRow(idx, btn) {
  var rows = wprGetFiltered();
  var r = rows[idx];
  if (!r) return;

  var label = r._label || 'السجل';
  var name  = r.studentName || r.title || '';
  var confirmMsg = '⚠️ هل تريد حذف هذا السجل نهائياً من الأرشيف؟\n\nالنوع: ' + label + (name ? '\nالاسم: ' + name : '') + '\nالتاريخ: ' + (r._date || '—');
  if (!confirm(confirmMsg)) return;

  // حذف من _wprAllRows
  var globalIdx = _wprAllRows.indexOf(r);
  if (globalIdx !== -1) _wprAllRows.splice(globalIdx, 1);

  // حذف من الأرشيف الفعلي
  var arcFns = {
    interview:     { get: function(){ return typeof getArchive    === 'function' ? getArchive()    : []; }, save: function(a){ if(typeof saveArchive    === 'function') saveArchive(a);    } },
    reintegration: { get: function(){ return typeof getRArchive   === 'function' ? getRArchive()   : []; }, save: function(a){ if(typeof saveRArchive   === 'function') saveRArchive(a);   } },
    absence:       { get: function(){ return typeof getAbArchive  === 'function' ? getAbArchive()  : []; }, save: function(a){ if(typeof saveAbArchive  === 'function') saveAbArchive(a);  } },
    violence:      { get: function(){ return typeof getVioArchive === 'function' ? getVioArchive() : []; }, save: function(a){ if(typeof saveVioArchive === 'function') saveVioArchive(a); } },
    workshop:      { get: function(){ return (appData && appData.workshopsArchive) ? appData.workshopsArchive : []; }, save: function(a){ if(appData){ appData.workshopsArchive=a; if(typeof saveUserKey==='function') saveUserKey('workshopsArchive'); } } },
    specNeeds:     { get: function(){ return typeof getSnArchive  === 'function' ? getSnArchive()  : []; }, save: function(a){ if(typeof saveSnArchive  === 'function') saveSnArchive(a);  } },
    contact:       { get: function(){ return typeof getCtArchive  === 'function' ? getCtArchive()  : []; }, save: function(a){ if(typeof saveCtArchive  === 'function') saveCtArchive(a);  } }
  };
  var fns = arcFns[r._type];
  if (fns && r.id) {
    var arc = fns.get();
    var i2 = -1;
    for (var ii = 0; ii < arc.length; ii++) { if (arc[ii].id == r.id) { i2 = ii; break; } }
    if (i2 !== -1) { arc.splice(i2, 1); fns.save(arc); }
  }

  if (typeof updateDashboardStats === 'function') updateDashboardStats();

  wprRenderStats();
  wprRenderTable();

  var toast = document.createElement('div');
  toast.textContent = '🗑️ تم حذف السجل بنجاح';
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#b91c1c;color:#fff;border-radius:10px;padding:10px 24px;font-family:Cairo,sans-serif;font-size:0.88rem;font-weight:700;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
  document.body.appendChild(toast);
  setTimeout(function(){ toast.remove(); }, 2500);
}

function wprDeleteFromEdit() {
  if (_wprEditIndex < 0 || _wprEditIndex >= _wprAllRows.length) return;
  var r = _wprAllRows[_wprEditIndex];
  var label = r._label || 'السجل';
  var name  = r.studentName || r.title || '';
  if (!confirm('⚠️ هل تريد حذف هذا السجل نهائياً؟\n\nالنوع: ' + label + (name ? '\nالاسم: ' + name : '') + '\nالتاريخ: ' + (r._date || '—'))) return;
  wprCloseEdit();
  // استدعاء wprDeleteRow بالمؤشر العالمي
  var globalIdx = _wprAllRows.indexOf(r);
  if (globalIdx !== -1) {
    // حذف من الأرشيف
    var arcFns = {
      interview:     { get: function(){ return typeof getArchive    === 'function' ? getArchive()    : []; }, save: function(a){ if(typeof saveArchive    === 'function') saveArchive(a);    } },
      reintegration: { get: function(){ return typeof getRArchive   === 'function' ? getRArchive()   : []; }, save: function(a){ if(typeof saveRArchive   === 'function') saveRArchive(a);   } },
      absence:       { get: function(){ return typeof getAbArchive  === 'function' ? getAbArchive()  : []; }, save: function(a){ if(typeof saveAbArchive  === 'function') saveAbArchive(a);  } },
      violence:      { get: function(){ return typeof getVioArchive === 'function' ? getVioArchive() : []; }, save: function(a){ if(typeof saveVioArchive === 'function') saveVioArchive(a); } },
      workshop:      { get: function(){ return (appData && appData.workshopsArchive) ? appData.workshopsArchive : []; }, save: function(a){ if(appData){ appData.workshopsArchive=a; if(typeof saveUserKey==='function') saveUserKey('workshopsArchive'); } } },
      specNeeds:     { get: function(){ return typeof getSnArchive  === 'function' ? getSnArchive()  : []; }, save: function(a){ if(typeof saveSnArchive  === 'function') saveSnArchive(a);  } },
      contact:       { get: function(){ return typeof getCtArchive  === 'function' ? getCtArchive()  : []; }, save: function(a){ if(typeof saveCtArchive  === 'function') saveCtArchive(a);  } },
      parentSession: { get: function(){ return typeof getCtArchive  === 'function' ? getCtArchive()  : []; }, save: function(a){ if(typeof saveCtArchive  === 'function') saveCtArchive(a);  } }
    };
    var fns = arcFns[r._type];
    if (fns && r.id) {
      var arc = fns.get();
      var i2 = arc.findIndex(function(e){ return e.id == r.id; });
      if (i2 !== -1) { arc.splice(i2, 1); fns.save(arc); }
    }
    _wprAllRows.splice(globalIdx, 1);
    if (typeof updateDashboardStats === 'function') updateDashboardStats();
    wprRenderStats();
    wprRenderTable();
    var toast = document.createElement('div');
    toast.textContent = '🗑️ تم حذف السجل بنجاح';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#b91c1c;color:#fff;border-radius:10px;padding:10px 24px;font-family:Cairo,sans-serif;font-size:0.88rem;font-weight:700;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
    document.body.appendChild(toast);
    setTimeout(function(){ toast.remove(); }, 2500);
  }
}

