// نسخة مجمَّدة من كود «حالات العنف» القديم (script-16.js قبل المرحلة 19) — مرجع اختبار المطابقة فقط
// ======= VIOLENCE TOOL =======
let vioInitialized = false;
function initViolence() {
  if (vioInitialized) return;
  vioInitialized = true;
  setTimeout(initAllAutocomplete, 50);
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('vio_reportDate').value = today;
  renderVioArchive();
}

const VIO_PROCS = [
  { key:'listening', name:'جلسة استماع مع الضحية' },
  { key:'parent', name:'التواصل مع ولي الأمر' },
  { key:'admin', name:'إخبار وتنسيق مع إدارة المؤسسة' },
  { key:'external', name:'إحالة إلى جهات خارجية مختصة' },
  { key:'mediation', name:'وساطة وإصلاح ذات البين' }
];
function vioProcDetails() {
  const out = [];
  document.querySelectorAll('#vio-summary-table tbody tr').forEach(tr => {
    const cb = tr.querySelector('input[type=checkbox]');
    const dEl = tr.querySelector('input[type=date]'); const nEl = tr.querySelector('.iproc-note');
    const date = dEl ? dEl.value : ''; const notes = nEl ? nEl.value.trim() : '';
    if (tr.dataset.custom) {
      const nm = tr.querySelector('.iproc-name'); const name = nm ? nm.value.trim() : '';
      if (name) out.push({ custom:true, name:name, date:date, notes:notes });
    } else if (cb && cb.checked) {
      const p = VIO_PROCS.find(x => x.key === tr.dataset.key);
      if (p) out.push({ key:p.key, name:p.name, date:date, notes:notes });
    }
  });
  return out;
}
function vioTblAddRow() {
  const tbody = document.querySelector('#vio-summary-table tbody'); if (!tbody) return null;
  const tr = document.createElement('tr'); tr.dataset.custom = '1';
  tr.innerHTML = '<td class="c"><input type="checkbox"></td>' +
    '<td><div class="iproc-namewrap"><input type="text" class="iproc-name" placeholder="اسم الإجراء..." oninput="iAutoCheck(this)"><button type="button" class="iproc-del" title="حذف" onclick="this.closest(\'tr\').remove()">✕</button></div></td>' +
    '<td><input type="date" oninput="iAutoCheck(this)" onchange="iAutoCheck(this)"></td>' +
    '<td><input type="text" class="iproc-note" placeholder="ملاحظات..." oninput="iAutoCheck(this)"></td>';
  tbody.appendChild(tr);
  return tr;
}
function vioResetProcTable() {
  document.querySelectorAll('#vio-summary-table tbody tr[data-custom]').forEach(tr => tr.remove());
  document.querySelectorAll('#vio-summary-table input').forEach(el => { if (el.type === 'checkbox') el.checked = false; else el.value = ''; });
}
function vioRestoreProcRows(rows) {
  vioResetProcTable();
  (rows || []).forEach(r => {
    let tr;
    if (r.custom) { tr = vioTblAddRow(); if (tr) tr.querySelector('.iproc-name').value = r.name || ''; }
    else tr = document.querySelector('#vio-summary-table tbody tr[data-key="' + r.key + '"]');
    if (!tr) return;
    tr.querySelector('input[type=date]').value = r.date || '';
    tr.querySelector('.iproc-note').value = r.notes || '';
    tr.querySelector('input[type=checkbox]').checked = true;
  });
}

function vioClearAll() {
  if (!confirm('هل أنت متأكد من مسح جميع البيانات؟')) return;
  document.querySelectorAll('#toolViolence input[type=text], #toolViolence input[type=date], #toolViolence input[type=tel], #toolViolence input[type=number], #toolViolence textarea').forEach(el => el.value = '');
  document.querySelectorAll('#toolViolence input[type=radio], #toolViolence input[type=checkbox]').forEach(el => el.checked = false);
  document.querySelectorAll('#toolViolence .procedure-details').forEach(el => el.classList.remove('open'));
  vioResetProcTable();
  const schoolEl = document.getElementById('vio_school'); if (schoolEl) schoolEl.value = getInstitutionName();
  document.getElementById('vio_reportDate').value = new Date().toISOString().slice(0,10);
  vioInitialized = false; initViolence();
}

function vioSaveToArchive() {
  const studentName = val('vio_studentName');
  if (!studentName) { alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
  const types = getChecked('vio_type');
  const entry = {
    id: Date.now(), savedAt: new Date().toLocaleString('ar-MA'),
    studentName, massar: val('vio_massar') || '—',
    aggName: val('vio_agg_name') || '—', aggLevel: val('vio_agg_level') || '—', aggMassar: val('vio_agg_massar') || '—',
    school: val('vio_school') || '—', level: val('vio_level') || '—',
    parentPhone: val('vio_parentPhone') || '—',
    reportDate: val('vio_reportDate') || '—',
    types, severity: '—',
    location: getRadio('vio_location') || '—',
    description: val('vio_description') || '',
    currentStatus: '—',
    priority: getRadio('vio_priority') || '—',
    recommendation: val('vio_recommendation') || '',
    nextFollowup: '—',
    procRows: vioProcDetails()
  };
  const archive = getVioArchive(); archive.unshift(entry); saveVioArchive(archive); updateDashboardStats();
  renderVioArchive();
  const body = document.getElementById('vioArchiveBody'); body.classList.add('open'); document.getElementById('vioArchiveArrow').textContent = '▲';
  autoLogTask('أخرى', 'حالة عنف — ' + studentName, studentName, entry.school, `نوع العنف: ${(entry.types||[]).join(' / ')}`, 'مُنجز', entry.reportDate !== '—' ? entry.reportDate : undefined);
}

function getVioArchive() { return appData.violenceArchive || []; }
function saveVioArchive(data) { appData.violenceArchive = data; saveUserKey('violenceArchive'); }

function toggleVioArchive() {
  const body = document.getElementById('vioArchiveBody'); const arrow = document.getElementById('vioArchiveArrow');
  body.classList.toggle('open'); arrow.textContent = body.classList.contains('open') ? '▲' : '▼';
}

function renderVioArchive() {
  const archive = getVioArchive();
  const search = (document.getElementById('vioArchiveSearch')?.value || '').trim().toLowerCase();
  const list = document.getElementById('vioArchiveList');
  const countEl = document.getElementById('vioArchiveCount');
  if (!countEl) return;
  countEl.textContent = archive.length;
  const filtered = search ? archive.filter(e => e.studentName.toLowerCase().includes(search)) : archive;
  if (!filtered.length) { list.innerHTML = '<div class="archive-empty">📂 لا توجد ملفات محفوظة بعد.</div>'; return; }
  const sevColors = {'خطيرة - تستوجب تدخلاً فورياً':'#dc2626','عالية':'#d97706','متوسطة':'#ca8a04','منخفضة':'#16a34a'};
  const prioColors = {'عاجلة':'#dc2626','عالية':'#d97706','متوسطة':'#ca8a04','عادية':'#16a34a'};
  list.innerHTML = `<div style="overflow-x:auto;"><table class="archive-table"><thead><tr><th>#</th><th>اسم التلميذ(ة)</th><th>المؤسسة</th><th>الشخص المعنِّف</th><th>تاريخ الإخبار</th><th>نوع العنف</th><th>الأولوية</th><th>إجراء</th></tr></thead><tbody>${
    filtered.map((e,i) => `<tr>
      <td style="text-align:center;color:#64748b;font-size:0.75rem;">${i+1}</td>
      <td><strong style="color:#991b1b;">🛡️ ${e.studentName}</strong></td>
      <td>${e.aggName && e.aggName !== '—' ? e.aggName : '—'}</td>
      <td style="text-align:center;white-space:nowrap;">📅 ${e.reportDate}</td>
      <td>${(e.types||[]).map(t=>`<span class="archive-tag">${t}</span>`).join(' ')}</td>
      <td><span style="background:${prioColors[e.priority]||'#64748b'};color:white;border-radius:10px;padding:2px 8px;font-size:0.7rem;font-weight:700;">${e.priority}</span></td>
      <td><div style="display:flex;gap:5px;justify-content:center;"><button class="btn-sm" style="background:linear-gradient(135deg,#2563a8,#1d4ed8);color:white;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:0.72rem;font-family:'Cairo',sans-serif;font-weight:700;" onclick="vioLoadEntry(${e.id})" title="تحميل للتعديل">✏️ تعديل</button><button class="btn-sm btn-sm-danger" onclick="deleteVioEntry(${e.id})" title="حذف">🗑</button></div></td>
    </tr>`).join('')
  }</tbody></table></div>`;
}

function deleteVioEntry(id) {
  if (!confirm('حذف هذا الملف؟')) return;
  saveVioArchive(getVioArchive().filter(e => e.id !== id)); renderVioArchive(); updateDashboardStats();
}

function clearVioArchive() {
  const archive = getVioArchive();
  if (!archive.length) { alert('📂 الأرشيف فارغ بالفعل.'); return; }
  if (!confirm(`⚠️ تحذير: سيتم حذف جميع ملفات العنف المدرسي (${archive.length} ملف) نهائياً.\n\nهل أنت متأكد من المسح الكامل؟`)) return;
  saveVioArchive([]); renderVioArchive(); updateDashboardStats();
}

function vioGenerateReport() {
  const studentName = val('vio_studentName');
  if (!studentName) { alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
  const types = getChecked('vio_type');
  const sources = getChecked('vio_report_source');

  const procRowsData = vioProcDetails();
  const procRows = procRowsData.map(r => `<tr>
      <td style="font-weight:700;color:#1a3a5c;">${iEsc(r.name)}</td>
      <td style="white-space:nowrap;text-align:center;">${iEsc(r.date) || '—'}</td>
      <td>${iEsc(r.notes) || '—'}</td>
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

  const V = id => iEsc(val(id)) || '—';
  const tblStyle = 'width:100%;border-collapse:collapse;font-size:0.82rem;font-family:\'Cairo\',sans-serif;margin-bottom:10px;';
  const incRows = [];
  if (types.length) incRows.push(`<tr><td class="info-lbl">نوع العنف:</td><td class="info-val" colspan="3">${iEsc(types.join(' / '))}</td></tr>`);
  const loc = getRadio('vio_location');
  if (loc) incRows.push(`<tr><td class="info-lbl">مكان الحادثة:</td><td class="info-val" colspan="3">${iEsc(loc)}</td></tr>`);
  if (sources.length) incRows.push(`<tr><td class="info-lbl">مصدر الإبلاغ:</td><td class="info-val" colspan="3">${iEsc(sources.join(' / '))}</td></tr>`);
  const hasAgg = val('vio_agg_name') || val('vio_agg_level') || val('vio_agg_massar');
  const priority = getRadio('vio_priority');

  document.getElementById('vioReportContent').innerHTML = `
 <div class="new-report-header">
 <div class="nrh-logo">
 <img id="ministry-logo-img" src="" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;">
 </div>

 <div class="nrh-dir">مديرية الحي الحسني</div>
 <div class="nrh-school">${iEsc(val('vio_school')) || 'المؤسسة التعليمية'}</div>
 <div class="nrh-title">تقرير التدخل في حالة عنف مدرسي</div>
 </div>

 <div class="report-section-title">معلومات الشخص الذي تعرّض للعنف</div>
 <table class="info-table-report" style="${tblStyle}"><tbody>
   <tr><td class="info-lbl">الاسم الكامل:</td><td class="info-val">${iEsc(studentName)}</td><td class="info-lbl">رقم المسار:</td><td class="info-val">${V('vio_massar')}</td></tr>
   <tr><td class="info-lbl">المؤسسة التعليمية:</td><td class="info-val">${V('vio_school')}</td><td class="info-lbl">القسم:</td><td class="info-val">${V('vio_level')}</td></tr>
   <tr><td class="info-lbl">هاتف الولي:</td><td class="info-val">${V('vio_parentPhone')}</td><td class="info-lbl">تاريخ الإخبار:</td><td class="info-val">${V('vio_reportDate')}</td></tr>
 </tbody></table>

 ${hasAgg ? `<div class="report-section-title">معلومات الشخص المعنِّف</div>
 <table class="info-table-report" style="${tblStyle}"><tbody>
   <tr><td class="info-lbl">الاسم الكامل:</td><td class="info-val">${V('vio_agg_name')}</td><td class="info-lbl">رقم المسار:</td><td class="info-val">${V('vio_agg_massar')}</td></tr>
   <tr><td class="info-lbl">القسم:</td><td class="info-val" colspan="3">${V('vio_agg_level')}</td></tr>
 </tbody></table>` : ''}

 ${incRows.length ? `<div class="report-section-title">معلومات الحادثة</div>
 <table class="info-table-report" style="${tblStyle}"><tbody>${incRows.join('')}</tbody></table>` : ''}

 ${val('vio_description') ? `<div class="report-section-title">وصف الحادثة</div><div class="report-summary-block">${iEsc(val('vio_description'))}</div>` : ''}

 ${procRows ? `<div class="report-section-title">الإجراءات المتخذة</div>${procedures}` : ''}

 <div class="report-section-title">الخلاصة والتوصيات</div>
 <table class="info-table-report" style="${tblStyle}"><tbody>
   <tr><td class="info-lbl">درجة الأولوية:</td><td class="info-val" colspan="3">${iEsc(priority) || '—'}</td></tr>
   <tr><td class="info-lbl">التوصية الختامية:</td><td class="info-val" colspan="3">${V('vio_recommendation')}</td></tr>
 </tbody></table>

 <div class="signatures">
 <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
 <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
 </div>

 `;
  document.getElementById('vioPrintModal').classList.add('open');
  document.querySelectorAll('#ministry-logo-img').forEach(function(img){ if(typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) img.src = MINISTRY_LOGO_B64; });
  // ✅ حفظ تلقائي في الأرشيف عند إنشاء التقرير
  vioSaveToArchiveSilent();
}

function vioSaveToArchiveSilent() {
  const _origAlert = window.alert;
  window.alert = function() {};
  try { vioSaveToArchive(); } catch(e) {}
  window.alert = _origAlert;
}

function vioLoadEntry(id) {
  const entry = getVioArchive().find(e => e.id === id);
  if (!entry) return;
  document.querySelector('#toolViolence .main-container')?.scrollTo(0,0);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const setV = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  setV('vio_studentName', entry.studentName);
  setV('vio_massar',      entry.massar      !== '—' ? entry.massar      : '');
  setV('vio_agg_name',    entry.aggName     && entry.aggName   !== '—' ? entry.aggName   : '');
  setV('vio_agg_level',   entry.aggLevel    && entry.aggLevel  !== '—' ? entry.aggLevel  : '');
  setV('vio_agg_massar',  entry.aggMassar   && entry.aggMassar !== '—' ? entry.aggMassar : '');
  setV('vio_school',      entry.school      !== '—' ? entry.school      : '');
  setV('vio_level',       entry.level       !== '—' ? entry.level       : '');
  setV('vio_parentPhone', entry.parentPhone !== '—' ? entry.parentPhone : '');
  setV('vio_reportDate',  entry.reportDate  !== '—' ? entry.reportDate  : '');
  setV('vio_description', entry.description);
  setV('vio_recommendation', entry.recommendation);

  const clearG    = name => document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.checked = false);
  const setR      = (name, v) => { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; };
  const setChecks = (name, vals) => { clearG(name); (vals||[]).forEach(v => { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; }); };

  clearG('vio_location'); setR('vio_location', entry.location);
  clearG('vio_priority'); setR('vio_priority', entry.priority);
  setChecks('vio_type', entry.types);
  vioRestoreProcRows(entry.procRows);

  vioShowEditBar(id);
}

function vioShowEditBar(id) {
  let bar = document.getElementById('vioEditBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'vioEditBar';
    bar.style.cssText = 'position:sticky;top:0;z-index:200;background:linear-gradient(135deg,#991b1b,#dc2626);color:white;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-bottom:3px solid #fcd34d;';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;font-size:0.88rem;font-weight:700;">
        <span style="font-size:1.2rem;">✏️</span>
        <span>وضع التعديل — تم تحميل ملف حالة العنف. عدّل ما تريد ثم احفظ.</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="vioUpdateEntry()" style="background:#fcd34d;color:#1a3a5c;border:none;border-radius:8px;padding:8px 16px;font-family:'Cairo',sans-serif;font-size:0.84rem;font-weight:800;cursor:pointer;">💾 حفظ التعديلات</button>
        <button onclick="vioCancelEdit()" style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);border-radius:8px;padding:8px 14px;font-family:'Cairo',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;">✕ إلغاء</button>
      </div>`;
    const container = document.querySelector('#toolViolence .main-container');
    if (container) container.insertBefore(bar, container.firstChild);
  }
  bar.style.display = 'flex';
  bar.dataset.editId = id;
}

function vioHideEditBar() { const b = document.getElementById('vioEditBar'); if (b) b.style.display = 'none'; }

function vioCancelEdit() {
  vioHideEditBar();
  document.querySelectorAll('#toolViolence input[type=text], #toolViolence input[type=date], #toolViolence input[type=tel], #toolViolence input[type=number], #toolViolence textarea').forEach(el => el.value = '');
  document.querySelectorAll('#toolViolence input[type=radio], #toolViolence input[type=checkbox]').forEach(el => el.checked = false);
  document.querySelectorAll('#toolViolence .procedure-details').forEach(el => el.classList.remove('open'));
  vioResetProcTable();
}

function vioUpdateEntry() {
  const bar = document.getElementById('vioEditBar');
  const id = bar ? parseInt(bar.dataset.editId) : null;
  if (!id) return;
  const studentName = val('vio_studentName');
  if (!studentName) { alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
  const updatedEntry = {
    id, savedAt: new Date().toLocaleString('ar-MA') + ' (معدَّل)',
    studentName, massar: val('vio_massar') || '—',
    aggName: val('vio_agg_name') || '—', aggLevel: val('vio_agg_level') || '—', aggMassar: val('vio_agg_massar') || '—',
    school: val('vio_school') || '—', level: val('vio_level') || '—',
    parentPhone: val('vio_parentPhone') || '—', reportDate: val('vio_reportDate') || '—',
    types: getChecked('vio_type'), severity: '—',
    location: getRadio('vio_location') || '—', description: val('vio_description') || '',
    currentStatus: '—',
    priority: getRadio('vio_priority') || '—',
    recommendation: val('vio_recommendation') || '', nextFollowup: '—',
    procRows: vioProcDetails()
  };
  const archive = getVioArchive();
  const idx = archive.findIndex(e => e.id === id);
  if (idx !== -1) archive[idx] = updatedEntry; else archive.unshift(updatedEntry);
  saveVioArchive(archive);
  renderVioArchive();
  vioHideEditBar();
  vioCancelEdit();
  const body = document.getElementById('vioArchiveBody');
  if (body && !body.classList.contains('open')) { body.classList.add('open'); document.getElementById('vioArchiveArrow').textContent = '▲'; }
  alert(`✅ تم تحديث ملف حالة العنف لـ "${studentName}" في الأرشيف بنجاح.`);
}
