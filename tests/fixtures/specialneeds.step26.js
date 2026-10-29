// نسخة مجمَّدة من كود «وضعية إعاقة وصعوبات التعلم» القديم (script-16.js قبل المرحلة 26) — مرجع اختبار المطابقة فقط
// ══════════════════════════════════════════════════════════════
let snInitialized = false;

// v18: كانت initSpecialNeeds تستدعي هذه الدالة دون تعريف، فتتوقف الأداة قبل تحديث إحصاءاتها
function updateBbAvatars() {
  try {
    const name = (typeof userProfile !== 'undefined' && userProfile && userProfile.fullName) || (typeof currentUser !== 'undefined' ? currentUser : '') || '';
    const initials = name ? String(name).charAt(0).toUpperCase() : '؟';
    document.querySelectorAll('.bb-avatar').forEach(el => el.textContent = initials);
    document.querySelectorAll('.bb-name').forEach(el => el.textContent = name || 'الحساب');
  } catch (e) {}
}

function initSpecialNeeds() {
  if (snInitialized) return;
  snInitialized = true;
  setTimeout(initAllAutocomplete, 50);
  const today = new Date().toISOString().slice(0,10);
  const rec = document.getElementById('sn_recordDate');
  if (rec) rec.value = today;
  renderSnArchive();
  updateBbAvatars();
}


// ══ جدول الإجراءات المتخذة — بوابة الإعاقة وصعوبات التعلم (نفس شكل المقابلات الفردية) ══
const SN_PROCS = [
  { key:'listening', name:'جلسة استماع مع التلميذ' },
  { key:'parent', name:'تواصل مع ولي الأمر' },
  { key:'admin', name:'تنسيق مع الإدارة' },
  { key:'teachers', name:'تنسيق مع هيئة التدريس' },
  { key:'psych', name:'إحالة على أخصائي نفسي' },
  { key:'doctor', name:'إحالة على طبيب متخصص' },
  { key:'classenv', name:'تكييف بيئة الفصل' },
  { key:'support', name:'دعم تربوي متخصص' },
  { key:'solidarity', name:'إحالة على مصالح التضامن' },
  { key:'institutions', name:'إشراك مؤسسات الدعم الاجتماعي' },
  { key:'council', name:'اجتماع مجلس القسم' }
];
function snProcDetails() {
  const rows = [];
  document.querySelectorAll('#sn-summary-table tbody tr').forEach(tr => {
    const cb = tr.querySelector('input[type=checkbox]');
    const dEl = tr.querySelector('input[type=date]'); const nEl = tr.querySelector('.iproc-note');
    const date = dEl ? dEl.value : ''; const notes = nEl ? nEl.value.trim() : '';
    if (tr.dataset.custom) {
      const nm = tr.querySelector('.iproc-name'); const name = nm ? nm.value.trim() : '';
      if (name) rows.push({ custom:true, name:name, date:date, notes:notes });
    } else if (cb && cb.checked) {
      const p = SN_PROCS.find(x => x.key === tr.dataset.key);
      if (p) rows.push({ key:p.key, name:p.name, date:date, notes:notes });
    }
  });
  return rows;
}
function snTblAddRow() {
  const tbody = document.querySelector('#sn-summary-table tbody'); if (!tbody) return null;
  const tr = document.createElement('tr'); tr.dataset.custom = '1';
  tr.innerHTML = '<td class="c"><input type="checkbox"></td>' +
    '<td><div class="iproc-namewrap"><input type="text" class="iproc-name" placeholder="اسم الإجراء..." oninput="iAutoCheck(this)"><button type="button" class="iproc-del" title="حذف" onclick="this.closest(\'tr\').remove()">✕</button></div></td>' +
    '<td><input type="date" oninput="iAutoCheck(this)" onchange="iAutoCheck(this)"></td>' +
    '<td><input type="text" class="iproc-note" placeholder="ملاحظات..." oninput="iAutoCheck(this)"></td>';
  tbody.appendChild(tr);
  return tr;
}
function snResetProcTable() {
  document.querySelectorAll('#sn-summary-table tbody tr[data-custom]').forEach(tr => tr.remove());
  document.querySelectorAll('#sn-summary-table input').forEach(el => { if (el.type === 'checkbox') el.checked = false; else el.value = ''; });
}
function snRestoreProcRows(entry) {
  snResetProcTable();
  let rows = entry.procedureRows;
  if (!rows) {
    rows = (entry.actions || []).map(n => { const p = SN_PROCS.find(x => x.name === n); return p ? { key:p.key, date:'', notes:'' } : { custom:true, name:n, date:'', notes:'' }; });
    if (entry.actionsDetails) rows.push({ custom:true, name:'تفاصيل الدعم المقدم', date:'', notes:entry.actionsDetails });
  }
  rows.forEach(r => {
    let tr;
    if (r.custom) { tr = snTblAddRow(); if (tr) tr.querySelector('.iproc-name').value = r.name || ''; }
    else tr = document.querySelector('#sn-summary-table tbody tr[data-key="' + r.key + '"]');
    if (!tr) return;
    tr.querySelector('input[type=date]').value = r.date || '';
    tr.querySelector('.iproc-note').value = r.notes || '';
    tr.querySelector('input[type=checkbox]').checked = true;
  });
}

// ── مساعدات القراءة ──
function snVal(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function snGetRadio(name) { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? el.value : ''; }
function snGetChecked(name) { return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value); }

// ── مسح النموذج ──
function snClearAll() {
  if (!confirm('هل أنت متأكد من مسح جميع البيانات؟')) return;
  document.querySelectorAll('#toolSpecialNeeds input[type=text], #toolSpecialNeeds input[type=date], #toolSpecialNeeds input[type=tel], #toolSpecialNeeds textarea').forEach(el => el.value = '');
  document.querySelectorAll('#toolSpecialNeeds input[type=radio], #toolSpecialNeeds input[type=checkbox]').forEach(el => el.checked = false);
  const schoolEl = document.getElementById('sn_school'); if (schoolEl) schoolEl.value = (userProfile && userProfile.institution) ? userProfile.institution : getInstitutionName();
  snResetProcTable();
  document.getElementById('sn_recordDate').value = new Date().toISOString().slice(0,10);
  snInitialized = false; initSpecialNeeds();
}

// ── الأرشيف ──
function getSnArchive() { return appData.specialNeedsArchive || []; }
function saveSnArchive(data) { appData.specialNeedsArchive = data; saveUserKey('specialNeedsArchive'); }

function snSaveToArchive() {
  const studentName = snVal('sn_studentName');
  if (!studentName) { alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
  const category = snGetRadio('sn_category');
  if (!category) { alert('⚠️ يرجى تحديد تصنيف الوضعية.'); return; }
  const entry = {
    id: Date.now(), savedAt: new Date().toLocaleString('ar-MA'),
    studentName,
    massar: snVal('sn_studentMassar') || '—',
    school: snVal('sn_school') || '—',
    level: snVal('sn_level') || '—',
    gender: snGetRadio('sn_gender') || '—',
    parentPhone: snVal('sn_parentPhone') || '—',
    recordDate: snVal('sn_recordDate') || '—',
    category,
    diagnosis: snVal('sn_diagnosis') || '—',
    hasReport: snGetRadio('sn_has_report') || '—',
    referral: snGetRadio('sn_referral') || '—',
    actions: snProcDetails().map(r => r.name),
    actionsDetails: '',
    procedureRows: snProcDetails(),
    adaptations: snGetChecked('sn_adaptations'),
    currentStatus: snGetRadio('sn_current_status') || '—',
    recommendation: snVal('sn_recommendation') || ''
  };
  const archive = getSnArchive();
  archive.unshift(entry);
  saveSnArchive(archive);
  renderSnArchive();
  const body = document.getElementById('snArchiveBody');
  if (body && !body.classList.contains('open')) { body.classList.add('open'); document.getElementById('snArchiveArrow').textContent = '▲'; }
  autoLogTask('أخرى', 'وضعية إعاقة — ' + studentName, studentName, entry.school, `${category}`, 'مُنجز', entry.recordDate !== '—' ? entry.recordDate : undefined);
}

function toggleSnArchive() {
  const body = document.getElementById('snArchiveBody');
  const arrow = document.getElementById('snArchiveArrow');
  body.classList.toggle('open');
  arrow.textContent = body.classList.contains('open') ? '▲' : '▼';
}

function renderSnArchive() {
  const archive = getSnArchive();
  const search = (document.getElementById('snArchiveSearch')?.value || '').trim().toLowerCase();
  const list = document.getElementById('snArchiveList');
  const countEl = document.getElementById('snArchiveCount');
  const statsEl = document.getElementById('snArchiveStats');
  if (!countEl) return;
  countEl.textContent = archive.length;
  const urgent = archive.filter(e => e.priority === 'عاجلة').length;
  if (statsEl) statsEl.innerHTML = `<div class="archive-stat">♿ إجمالي الملفات: <strong>${archive.length}</strong></div>${urgent ? `<div class="archive-stat" style="background:#fee2e2;border-color:#fca5a5;color:#dc2626;">🔴 حالات عاجلة: <strong>${urgent}</strong></div>` : ''}`;
  const filtered = search ? archive.filter(e => (e.studentName||'').toLowerCase().includes(search) || (e.category||'').toLowerCase().includes(search)) : archive;
  if (!filtered.length) {
    list.innerHTML = `<div class="archive-empty">${search ? '🔍 لا توجد نتائج.' : '📂 لا توجد ملفات محفوظة بعد.<br><small>اضغط "حفظ في الأرشيف" لإضافة الملف الحالي.</small>'}</div>`;
    return;
  }
  const pColor = {'عاجلة':'#dc2626','عالية':'#c2410c','متوسطة':'#d97706','عادية':'#16a34a'};
  const pBg    = {'عاجلة':'#fee2e2','عالية':'#fff7ed','متوسطة':'#fffbeb','عادية':'#f0fdf4'};
  list.innerHTML = `<div style="overflow-x:auto;"><table class="archive-table">
    <thead><tr><th>#</th><th>اسم التلميذ(ة)</th><th>المؤسسة</th><th>المستوى</th><th>نوع الوضعية</th><th>تاريخ الفتح</th><th>الأولوية</th><th>الحالة</th><th>التتبع</th><th>الإجراءات</th></tr></thead>
    <tbody>${filtered.map((e,idx) => {
      const logs = e.trackingLogs || [];
      const lastLog = logs.length ? logs[logs.length-1] : null;
      return `<tr>
      <td style="text-align:center;color:var(--text-muted);font-size:0.75rem;">${idx+1}</td>
      <td><strong style="color:#1d4ed8;">♿ ${e.studentName}</strong></td>
      <td>${e.school}</td>
      <td style="text-align:center;">${e.level}</td>
      <td><span style="background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;border-radius:10px;padding:2px 8px;font-size:0.72rem;font-weight:700;">${e.category}</span></td>
      <td style="text-align:center;white-space:nowrap;">📅 ${e.recordDate}</td>
      <td style="text-align:center;">${(e.priority && e.priority !== '—') ? `<span style="background:${pBg[e.priority]||'#f1f5f9'};color:${pColor[e.priority]||'#64748b'};border:1px solid ${pColor[e.priority]||'#cbd5e1'};border-radius:12px;padding:2px 9px;font-size:0.72rem;font-weight:700;">● ${e.priority}</span>` : '—'}</td>
      <td style="text-align:center;font-size:0.75rem;">${e.currentStatus}</td>
      <td style="text-align:center;">
        <button onclick="snOpenTrackingCard(${e.id})" style="background:linear-gradient(135deg,#0f766e,#14b8a6);color:white;border:none;border-radius:6px;padding:4px 9px;cursor:pointer;font-size:0.72rem;font-family:'Cairo',sans-serif;font-weight:700;white-space:nowrap;">
          📋 التتبع <span style="background:rgba(255,255,255,0.25);border-radius:10px;padding:1px 6px;margin-right:3px;">${logs.length}</span>
        </button>
        ${lastLog ? `<div style="font-size:0.65rem;color:#0f766e;margin-top:2px;">آخر: ${lastLog.date}</div>` : ''}
      </td>
      <td style="white-space:nowrap;"><div style="display:flex;gap:5px;justify-content:center;">
        <button class="btn-sm" style="background:linear-gradient(135deg,#1d4ed8,#2563eb);color:white;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:0.72rem;font-family:'Cairo',sans-serif;font-weight:700;" onclick="snLoadEntry(${e.id})">✏️ تعديل</button>
        <button class="btn-sm btn-sm-danger" onclick="deleteSnEntry(${e.id})">🗑</button>
      </div></td>
    </tr>`;}).join('')}</tbody>
  </table></div>`;
}

function deleteSnEntry(id) {
  if (!confirm('حذف هذا الملف؟')) return;
  saveSnArchive(getSnArchive().filter(e => e.id !== id));
  renderSnArchive();
}

function clearSnArchive() {
  const archive = getSnArchive();
  if (!archive.length) { alert('📂 الأرشيف فارغ بالفعل.'); return; }
  if (!confirm(`⚠️ تحذير: سيتم حذف جميع ملفات وضعيات الإعاقة (${archive.length} ملف) نهائياً.\n\nهل أنت متأكد؟`)) return;
  saveSnArchive([]);
  renderSnArchive();
}

function snLoadEntry(id) {
  const entry = getSnArchive().find(e => e.id === id);
  if (!entry) return;
  document.getElementById('sn_studentName').value = entry.studentName || '';
  document.getElementById('sn_studentMassar').value = entry.massar || '';
  document.getElementById('sn_school').value = entry.school || '';
  document.getElementById('sn_parentPhone').value = entry.parentPhone || '';
  document.getElementById('sn_recordDate').value = entry.recordDate || '';
  document.getElementById('sn_diagnosis').value = entry.diagnosis !== '—' ? entry.diagnosis : '';
  snRestoreProcRows(entry);
  document.getElementById('sn_recommendation').value = entry.recommendation || '';
  // Level select
  const lv = document.getElementById('sn_level');
  if (lv) { for (let o of lv.options) { if (o.value === entry.level) { lv.value = entry.level; break; } } }
  // Radios
  ['sn_gender','sn_category','sn_has_report','sn_referral','sn_current_status'].forEach(name => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(r => { r.checked = r.value === entry[name.replace('sn_','').replace('_','').replace('hasreport','hasReport').replace('has_report','hasReport').replace('current_status','currentStatus').replace('next_followup','nextFollowup')]; });
  });
  // Fix radio mapping
  const radioMap = { sn_gender:'gender', sn_category:'category', sn_has_report:'hasReport', sn_referral:'referral', sn_current_status:'currentStatus' };
  Object.entries(radioMap).forEach(([name, key]) => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(r => { r.checked = r.value === entry[key]; });
  });
  // Checkboxes
  ['sn_adaptations'].forEach(name => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(cb => { cb.checked = (entry.adaptations||[]).includes(cb.value); });
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  // Show edit bar
  let bar = document.getElementById('snEditBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'snEditBar';
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:linear-gradient(135deg,#1d4ed8,#2563eb);color:white;padding:12px 20px;border-radius:10px;margin-bottom:12px;';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;font-size:0.88rem;font-weight:700;">
        <span style="font-size:1.2rem;">✏️</span><span>وضع التعديل — تم تحميل الملف. عدّل ما تريد ثم احفظ.</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="snUpdateEntry()" style="background:#fcd34d;color:#1a3a5c;border:none;border-radius:8px;padding:8px 16px;font-family:'Cairo',sans-serif;font-size:0.84rem;font-weight:800;cursor:pointer;">💾 حفظ التعديلات</button>
        <button onclick="snCancelEdit()" style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);border-radius:8px;padding:8px 14px;font-family:'Cairo',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;">✕ إلغاء</button>
      </div>`;
    const container = document.querySelector('#toolSpecialNeeds .main-container');
    if (container) container.insertBefore(bar, container.firstChild);
  }
  bar.style.display = 'flex';
  bar.dataset.editId = id;
}

function snCancelEdit() {
  const b = document.getElementById('snEditBar'); if (b) b.style.display = 'none';
  snClearAll();
}

function snUpdateEntry() {
  const bar = document.getElementById('snEditBar');
  const id = bar ? parseInt(bar.dataset.editId) : null;
  if (!id) return;
  const studentName = snVal('sn_studentName');
  if (!studentName) { alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
  const updatedEntry = {
    id, savedAt: new Date().toLocaleString('ar-MA') + ' (معدَّل)',
    studentName,
    massar: snVal('sn_studentMassar') || '—',
    school: snVal('sn_school') || '—',
    level: snVal('sn_level') || '—',
    gender: snGetRadio('sn_gender') || '—',
    parentPhone: snVal('sn_parentPhone') || '—',
    recordDate: snVal('sn_recordDate') || '—',
    category: snGetRadio('sn_category') || '—',
    diagnosis: snVal('sn_diagnosis') || '—',
    hasReport: snGetRadio('sn_has_report') || '—',
    referral: snGetRadio('sn_referral') || '—',
    actions: snProcDetails().map(r => r.name),
    actionsDetails: '',
    procedureRows: snProcDetails(),
    adaptations: snGetChecked('sn_adaptations'),
    currentStatus: snGetRadio('sn_current_status') || '—',
    recommendation: snVal('sn_recommendation') || ''
  };
  const archive = getSnArchive();
  const idx = archive.findIndex(e => e.id === id);
  if (idx !== -1) archive[idx] = updatedEntry; else archive.unshift(updatedEntry);
  saveSnArchive(archive);
  renderSnArchive();
  const b = document.getElementById('snEditBar'); if (b) b.style.display = 'none';
  snClearAll();
  const body = document.getElementById('snArchiveBody');
  if (body && !body.classList.contains('open')) { body.classList.add('open'); document.getElementById('snArchiveArrow').textContent = '▲'; }
  alert(`✅ تم تحديث ملف التلميذ(ة) "${studentName}" بنجاح.`);
}

// ── توليد التقرير (نفس قالب تقرير المقابلة الفردية) ──
function snGenerateReport() {
  const studentName = snVal('sn_studentName');
  if (!studentName) { alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
  const category = snGetRadio('sn_category');
  const adaptations = snGetChecked('sn_adaptations');
  const E = iEsc;
  const V = id => E(snVal(id)) || '—';
  const R = name => E(snGetRadio(name)) || '—';

  const procRows = snProcDetails().map(r => `<tr>
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

  const tblStyle = `style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;margin-bottom:10px;"`;
  const reco = snVal('sn_recommendation');

  document.getElementById('snReportContent').innerHTML = `
 <div class="new-report-header">
 <div class="nrh-logo">
 <img id="ministry-logo-img" src="" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;">
 </div>
 <div class="nrh-dir">${E(getDirectorate())}</div>
 <div class="nrh-school">${snVal('sn_school') ? E(snVal('sn_school')) : 'المؤسسة التعليمية'}</div>
 <div class="nrh-title">تقرير متابعة التلميذ(ة) في وضعية إعاقة / صعوبات التعلم</div>
 </div>
 <div class="report-section-title">معلومات التلميذ(ة)</div>
 <table class="info-table-report" ${tblStyle}><tbody>
   <tr><td class="info-lbl">الاسم الكامل:</td><td class="info-val">${E(studentName)}</td><td class="info-lbl">رقم المسار:</td><td class="info-val">${V('sn_studentMassar')}</td></tr>
   <tr><td class="info-lbl">المؤسسة التعليمية:</td><td class="info-val">${V('sn_school')}</td><td class="info-lbl">القسم:</td><td class="info-val">${V('sn_level')}</td></tr>
   <tr><td class="info-lbl">الجنس:</td><td class="info-val" colspan="3">${R('sn_gender')}</td></tr>
   <tr><td class="info-lbl">هاتف الولي:</td><td class="info-val">${V('sn_parentPhone')}</td><td class="info-lbl">تاريخ فتح الملف:</td><td class="info-val">${V('sn_recordDate')}</td></tr>
   <tr><td class="info-lbl">تصنيف الوضعية:</td><td class="info-val">${E(category) || '—'}</td><td class="info-lbl">تقرير طبي / نفسي:</td><td class="info-val">${R('sn_has_report')}</td></tr>
   <tr><td class="info-lbl">مصدر الإحالة:</td><td class="info-val" colspan="3">${R('sn_referral')}</td></tr>
   <tr><td class="info-lbl">وصف الوضعية / التشخيص:</td><td class="info-val" colspan="3">${V('sn_diagnosis')}</td></tr>
 </tbody></table>
 ${procedures ? `<div class="report-section-title">الإجراءات المتخذة</div>${procedures}` : ''}
 ${adaptations.length ? `<div class="report-section-title">التكيفات البيداغوجية المعتمدة</div><div class="report-summary-block">${E(adaptations.join(' / '))}</div>` : ''}
 <div class="report-section-title">الخلاصة والتوصيات</div>
 <table class="info-table-report" ${tblStyle}><tbody>
   <tr><td class="info-lbl">الحالة الراهنة:</td><td class="info-val" colspan="3">${R('sn_current_status')}</td></tr>
   <tr><td class="info-lbl">التوصية الختامية:</td><td class="info-val" colspan="3">${E(reco) || '—'}</td></tr>
 </tbody></table>
 <div class="signatures">
 <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
 <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
 </div>
 `;
  document.getElementById('snPrintModal').classList.add('open');
  document.querySelectorAll('#ministry-logo-img').forEach(function(img){ if(typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) img.src = MINISTRY_LOGO_B64; });
  // ✅ حفظ تلقائي في الأرشيف عند إنشاء التقرير
  snSaveToArchiveSilent();
}

function snSaveToArchiveSilent() {
  const _origAlert = window.alert;
  window.alert = function() {};
  try { snSaveToArchive(); } catch(e) {}
  window.alert = _origAlert;
}
// ══════════════════════════════════════════════════════════════
let _snTrackingCurrentId = null;

function snOpenTrackingCard(id) {
  const entry = getSnArchive().find(e => e.id === id);
  if (!entry) return;
  _snTrackingCurrentId = id;
  document.getElementById('snTrackingStudentName').textContent =
    `♿ ${entry.studentName} — ${entry.category} — ${entry.school}`;
  // Set today as default date
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('snTrackDate').value = today;
  document.getElementById('snTrackResult').value = '';
  document.getElementById('snTrackNote').value = '';
  document.getElementById('snTrackBy').value = '';
  document.getElementById('snTrackNextDate').value = entry.nextFollowup && entry.nextFollowup !== '—' ? entry.nextFollowup : '';
  snRenderTrackingTable(entry);
  const modal = document.getElementById('snTrackingModal');
  modal.style.display = 'flex';
}

function snRenderTrackingTable(entry) {
  const logs = entry.trackingLogs || [];
  const countEl = document.getElementById('snTrackCount');
  if (countEl) countEl.textContent = `${logs.length} جلسة`;
  const container = document.getElementById('snTrackingTable');
  if (!container) return;
  if (!logs.length) {
    container.innerHTML = '<div style="text-align:center;color:#64748b;font-size:0.82rem;padding:24px;background:#f8fafc;border-radius:10px;border:2px dashed #cbd5e1;">📂 لم تُسجَّل أي جلسة متابعة بعد.<br><small>استخدم النموذج أعلاه لإضافة أول جلسة.</small></div>';
    return;
  }
  const statusColor = {
    '✅ تحسن ملحوظ': '#16a34a',
    '🟢 وضعية مستقرة': '#16a34a',
    '🔶 لا يزال قيد المتابعة': '#d97706',
    '🔴 تراجع — يستدعي تدخلاً': '#dc2626',
    '🏛️ تمت الإحالة': '#7c3aed',
    '✔️ انتهت المتابعة': '#0f766e'
  };
  const statusBg = {
    '✅ تحسن ملحوظ': '#f0fdf4',
    '🟢 وضعية مستقرة': '#f0fdf4',
    '🔶 لا يزال قيد المتابعة': '#fffbeb',
    '🔴 تراجع — يستدعي تدخلاً': '#fef2f2',
    '🏛️ تمت الإحالة': '#f5f3ff',
    '✔️ انتهت المتابعة': '#f0fdfa'
  };
  container.innerHTML = `<div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:0.79rem;font-family:'Cairo',sans-serif;">
      <thead>
        <tr style="background:linear-gradient(135deg,#0f2744,#1a3a5c);color:white;">
          <th style="padding:9px 10px;text-align:right;border-radius:0;">#</th>
          <th style="padding:9px 10px;text-align:right;">📅 التاريخ</th>
          <th style="padding:9px 10px;text-align:right;">📊 نتيجة المتابعة</th>
          <th style="padding:9px 10px;text-align:right;">📝 الملاحظات</th>
          <th style="padding:9px 10px;text-align:right;">👤 المتابِع</th>
          <th style="padding:9px 10px;text-align:right;">📅 الموعد القادم</th>
          <th style="padding:9px 10px;text-align:center;">حذف</th>
        </tr>
      </thead>
      <tbody>
        ${[...logs].reverse().map((log, idx) => `
        <tr style="background:${idx%2===0?'#ffffff':'#f8fafc'};border-bottom:1px solid #e2e8f0;">
          <td style="padding:8px 10px;color:#64748b;text-align:center;">${logs.length - idx}</td>
          <td style="padding:8px 10px;white-space:nowrap;font-weight:700;color:#1a3a5c;">📅 ${log.date}</td>
          <td style="padding:8px 10px;">
            <span style="background:${statusBg[log.result]||'#f1f5f9'};color:${statusColor[log.result]||'#475569'};border:1px solid ${statusColor[log.result]||'#cbd5e1'}40;border-radius:10px;padding:3px 9px;font-size:0.72rem;font-weight:700;white-space:nowrap;">
              ${log.result || '—'}
            </span>
          </td>
          <td style="padding:8px 10px;max-width:180px;color:#374151;">${log.note || '<span style="color:#94a3b8;">—</span>'}</td>
          <td style="padding:8px 10px;color:#374151;">${log.by || '<span style="color:#94a3b8;">—</span>'}</td>
          <td style="padding:8px 10px;white-space:nowrap;color:#0f766e;">${log.nextDate ? `📅 ${log.nextDate}` : '<span style="color:#94a3b8;">—</span>'}</td>
          <td style="padding:8px 10px;text-align:center;">
            <button onclick="snDeleteTrackingLog('${log.id}')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:0.72rem;">🗑</button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

function snAddTrackingLog() {
  const date = document.getElementById('snTrackDate').value;
  const result = document.getElementById('snTrackResult').value;
  if (!date) { alert('⚠️ يرجى اختيار تاريخ المتابعة.'); return; }
  if (!result) { alert('⚠️ يرجى اختيار نتيجة المتابعة.'); return; }
  const note = document.getElementById('snTrackNote').value.trim();
  const by = document.getElementById('snTrackBy').value.trim();
  const nextDate = document.getElementById('snTrackNextDate').value;
  const log = {
    id: Date.now().toString(),
    date,
    result,
    note,
    by,
    nextDate,
    savedAt: new Date().toLocaleString('ar-MA')
  };
  const archive = getSnArchive();
  const idx = archive.findIndex(e => e.id === _snTrackingCurrentId);
  if (idx === -1) return;
  if (!archive[idx].trackingLogs) archive[idx].trackingLogs = [];
  archive[idx].trackingLogs.push(log);
  // Update nextFollowup on main record
  if (nextDate) archive[idx].nextFollowup = nextDate;
  saveSnArchive(archive);
  renderSnArchive();
  snRenderTrackingTable(archive[idx]);
  // Clear form
  document.getElementById('snTrackResult').value = '';
  document.getElementById('snTrackNote').value = '';
  document.getElementById('snTrackBy').value = '';
  document.getElementById('snTrackNextDate').value = '';
  alert(`✅ تم تسجيل جلسة المتابعة بنجاح.`);
}

function snDeleteTrackingLog(logId) {
  if (!confirm('حذف هذه الجلسة من سجل المتابعة؟')) return;
  const archive = getSnArchive();
  const idx = archive.findIndex(e => e.id === _snTrackingCurrentId);
  if (idx === -1) return;
  archive[idx].trackingLogs = (archive[idx].trackingLogs || []).filter(l => l.id !== logId);
  saveSnArchive(archive);
  renderSnArchive();
  snRenderTrackingTable(archive[idx]);
}

function snDownloadTrackingCard() {
  const archive = getSnArchive();
  const entry = archive.find(e => e.id === _snTrackingCurrentId);
  if (!entry) return;
  const logs = entry.trackingLogs || [];
  const date = new Date().toLocaleDateString('ar-MA', {year:'numeric',month:'long',day:'numeric'});
  const statusColor = {
    '✅ تحسن ملحوظ':'#16a34a','🟢 وضعية مستقرة':'#16a34a',
    '🔶 لا يزال قيد المتابعة':'#d97706','🔴 تراجع — يستدعي تدخلاً':'#dc2626',
    '🏛️ تمت الإحالة':'#7c3aed','✔️ انتهت المتابعة':'#0f766e'
  };
  const statusBg = {
    '✅ تحسن ملحوظ':'#f0fdf4','🟢 وضعية مستقرة':'#f0fdf4',
    '🔶 لا يزال قيد المتابعة':'#fffbeb','🔴 تراجع — يستدعي تدخلاً':'#fef2f2',
    '🏛️ تمت الإحالة':'#f5f3ff','✔️ انتهت المتابعة':'#f0fdfa'
  };
  const rowsHtml = logs.length
    ? [...logs].map((log, idx) => `
      <tr style="background:${idx%2===0?'#ffffff':'#f8fafc'};">
        <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:center;color:#64748b;">${idx+1}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-weight:700;color:#1a3a5c;white-space:nowrap;">📅 ${log.date}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;">
          <span style="background:${statusBg[log.result]||'#f1f5f9'};color:${statusColor[log.result]||'#475569'};border:1px solid ${statusColor[log.result]||'#cbd5e1'}40;border-radius:8px;padding:3px 8px;font-size:0.78rem;font-weight:700;">${log.result||'—'}</span>
        </td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;color:#374151;">${log.note||'—'}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;color:#374151;">${log.by||'—'}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;color:#0f766e;">${log.nextDate ? '📅 ' + log.nextDate : '—'}</td>
      </tr>`).join('')
    : `<tr><td colspan="6" style="padding:20px;text-align:center;color:#64748b;border:1px solid #e2e8f0;">لم تُسجَّل أي جلسة متابعة بعد.</td></tr>`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>بطاقة متابعة — ${entry.studentName}</title>
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
      ${printLogoImg(90)}
    </div>
    <h1 style="text-align:center;">📋 بطاقة المتابعة والتتبع الفردية</h1>
    <p style="text-align:center;">التلميذ(ة): <strong>${entry.studentName}</strong> — بتاريخ: ${date}</p>
  </div>
  <div class="info-grid">
    <div class="info-cell"><div class="info-label">اسم التلميذ(ة)</div><div class="info-value">♿ ${entry.studentName}</div></div>
    <div class="info-cell"><div class="info-label">رقم مسار</div><div class="info-value">${entry.massar||'—'}</div></div>
    <div class="info-cell"><div class="info-label">القسم</div><div class="info-value">${entry.level||'—'}</div></div>
    <div class="info-cell"><div class="info-label">المؤسسة</div><div class="info-value">${entry.school||'—'}</div></div>
    <div class="info-cell"><div class="info-label">نوع الوضعية</div><div class="info-value">${entry.category||'—'}</div></div>
    <div class="info-cell"><div class="info-label">تاريخ فتح الملف</div><div class="info-value">📅 ${entry.recordDate||'—'}</div></div>
    <div class="info-cell"><div class="info-label">الحالة الراهنة</div><div class="info-value">${entry.currentStatus||'—'}</div></div>
    <div class="info-cell"><div class="info-label">درجة الأولوية</div><div class="info-value">${entry.priority||'—'}</div></div>
    <div class="info-cell"><div class="info-label">المتابعة القادمة</div><div class="info-value">${entry.nextFollowup||'—'}</div></div>
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

  const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = entry.studentName.replace(/\s+/g,'_');
  a.download = `بطاقة_متابعة_${safeName}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// تنزيل بطاقة المتابعة بصيغة متوافقة مع Microsoft Word (.doc)
function snDownloadTrackingCardWord() {
  const archive = getSnArchive();
  const entry = archive.find(e => e.id === _snTrackingCurrentId);
  if (!entry) { alert('يرجى اختيار بطاقة تلميذ أولاً.'); return; }
  const logs = entry.trackingLogs || [];
  const esc = value => String(value == null || value === '' ? '—' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const today = new Date().toLocaleDateString('ar-MA', {year:'numeric',month:'long',day:'numeric'});
  const info = [
    ['اسم التلميذ(ة)', entry.studentName], ['رقم مسار', entry.massar],
    ['القسم', entry.level], ['المؤسسة', entry.school],
    ['نوع الوضعية', entry.category], ['تاريخ فتح الملف', entry.recordDate],
    ['الحالة الراهنة', entry.currentStatus], ['درجة الأولوية', entry.priority],
    ['المتابعة القادمة', entry.nextFollowup]
  ];
  const infoRows = info.map(([label, value]) =>
    `<tr><th>${esc(label)}</th><td>${esc(value)}</td></tr>`).join('');
  const logRows = logs.length ? logs.map((log, i) =>
    `<tr><td>${i+1}</td><td>${esc(log.date)}</td><td>${esc(log.result)}</td><td>${esc(log.note)}</td><td>${esc(log.by)}</td><td>${esc(log.nextDate)}</td></tr>`
  ).join('') : '<tr><td colspan="6" style="text-align:center">لم تُسجَّل أي جلسة متابعة بعد.</td></tr>';
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>بطاقة متابعة - ${esc(entry.studentName)}</title>
  <style>@page{size:A4;margin:15mm}body{font-family:Arial,sans-serif;direction:rtl;text-align:right;color:#172033;font-size:11pt}h1{text-align:center;background:#0f766e;color:#fff;padding:14px;font-size:17pt}h2{color:#0f766e;border-bottom:2px solid #99f6e4;padding-bottom:6px;font-size:13pt}table{width:100%;border-collapse:collapse;margin:10px 0 18px}td,th{border:1.5px solid #000;padding:7px;text-align:right;vertical-align:top}th{background:#eef4fb;width:25%}thead th{background:#1a3a5c;color:#fff;width:auto}tr{page-break-inside:avoid}.signatures{margin-top:35px;display:table;width:100%}.signatures div{display:table-cell;text-align:center;width:50%;padding:15px}.line{border-top:1px solid #222;margin:22px 15px 6px}.footer{text-align:center;margin-top:20px;color:#64748b;font-size:9pt}</style></head><body dir="rtl">
  <h1>بطاقة المتابعة والتتبع الفردية</h1><p style="text-align:center">التلميذ(ة): <strong>${esc(entry.studentName)}</strong> — تاريخ إعداد البطاقة: ${esc(today)}</p>
  <h2>المعلومات الأساسية</h2><table><tbody>${infoRows}</tbody></table>
  <h2>سجل جلسات المتابعة (${logs.length} جلسة)</h2><table><thead><tr><th>#</th><th>تاريخ المتابعة</th><th>نتيجة المتابعة</th><th>الملاحظات</th><th>المتابع</th><th>الموعد القادم</th></tr></thead><tbody>${logRows}</tbody></table>
  <div class="signatures"><div><div class="line"></div>المختص الاجتماعي</div><div><div class="line"></div>مدير المؤسسة</div></div><div class="footer">أدوات التوثيق — المختص الاجتماعي © 2026</div></body></html>`;
  const blob = new Blob(['\ufeff', html], {type:'application/msword;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = String(entry.studentName || 'تلميذ').replace(/[\\/:*?"<>|]+/g, '').trim().replace(/\s+/g, '_');
  a.href = url; a.download = `بطاقة_متابعة_${safeName || 'تلميذ'}.doc`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
