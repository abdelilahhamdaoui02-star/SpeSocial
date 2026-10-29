// نسخة مجمَّدة من كود «الإدماج المدرسي» القديم (script-10.js وscript-16.js قبل المرحلة 20) — مرجع اختبار المطابقة فقط
function rField(label, value, spanCols) {
  if (!value || value === '—' || value.trim() === '') return '';
  const span = spanCols ? ` style="grid-column:span ${spanCols}"` : '';
  return `<div class="report-field"${span}><span class="lbl">${label}</span><span class="val">${value}</span></div>`;
}

// ======= REINTEGRATION TOOL =======
let reintegrationInitialized = false;

const R_SUGG = {
  r_contextNotes: [
    ["🏥 ظروف صحية", "أفادت الأسرة بأن التلميذ(ة) توقف(ت) عن التمدرس بسبب ظروف صحية طارئة استوجبت التوقف عن الدراسة لفترة من الزمن."],
    ["🏠 أوضاع أسرية", "تبيّن أن الانقطاع مرتبط بأوضاع أسرية صعبة أثّرت سلبًا على انتظام التلميذ(ة) في الحضور."],
    ["📚 صعوبات دراسية", "صرّح(ت) التلميذ(ة) بأنه(ا) قرّر(ت) الانقطاع بسبب شعوره(ا) بعدم القدرة على مواكبة الدروس والتحصيل الدراسي."],
  ],
  r_support_details: [
    ["📘 دعم أسبوعي", "سُجّل(ت) التلميذ(ة) في برنامج الدعم التربوي، يُعقد مرتين أسبوعياً بهدف سدّ الثغرات المتراكمة في المواد الأساسية."],
  ],
  r_followup_notes: [
    ["✅ إدماج ناجح", "أبدى(أبدت) التلميذ(ة) تكيّفاً إيجابياً مع الوسط المدرسي خلال فترة المتابعة، وانتظام في الحضور والمشاركة في الأنشطة."],
    ["⚠️ متابعة مستمرة", "لا يزال(لا تزال) التلميذ(ة) يحتاج(تحتاج) إلى دعم ومتابعة مستمرة، مع وجود بعض التذبذب في الحضور والمشاركة."],
  ],
  r_recommendation: [
    ["🔄 متابعة دورية", "يُوصى باستمرار المتابعة الدورية للتلميذ(ة) من قِبل المختص الاجتماعي والمرشد التربوي لضمان استقرار وضعيته(ا)."],
    ["🏛️ إشراك مؤسسات", "يُقترح إشراك مؤسسات الدعم الاجتماعي للتكفل بالوضعية الأسرية التي تُعدّ من الأسباب الجوهرية للصعوبات المُرصودة."],
    ["🚨 تدخل عاجل", "يُوصى بالتدخل العاجل وإحالة الملف إلى الجهات المختصة نظراً لخطورة الوضعية."],
  ],
};

function initReintegration() {
  try { renderRArchive(); } catch(e) { console.error(e); }
  if (reintegrationInitialized) return;
  reintegrationInitialized = true;
  setTimeout(initAllAutocomplete, 50);

  // Textarea suggest chips
  document.querySelectorAll('#toolReintegration textarea[data-suggest]').forEach(textarea => {
    const field = textarea.dataset.suggest;
    const suggs = R_SUGG[field];
    if (!suggs) return;
    const wrapper = document.createElement('div'); wrapper.className = 'suggest-chips-wrapper';
    const lbl = document.createElement('div'); lbl.className = 'suggest-chips-label'; lbl.innerHTML = '💡 اقتراحات جاهزة:';
    const chipsRow = document.createElement('div'); chipsRow.className = 'suggest-chips';
    suggs.forEach(s => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'suggest-chip'; btn.textContent = s[0];
      btn.onclick = () => { const el = document.getElementById(textarea.id); if (el) { el.value = el.value.trim() ? el.value.trimEnd() + '\n' + s[1] : s[1]; el.focus(); } };
      chipsRow.appendChild(btn);
    });
    wrapper.appendChild(lbl); wrapper.appendChild(chipsRow);
    textarea.parentNode.insertBefore(wrapper, textarea.nextSibling);
  });

}

const R_PROCS = [
  { key:'listening',    arch:'جلسة الاستماع',     name:'جلسة الاستماع مع التلميذ(ة)' },
  { key:'parent_call',  arch:'اتصال بولي الأمر',  name:'اتصال هاتفي بولي الأمر' },
  { key:'parent_visit', arch:'استدعاء ولي الأمر', name:'استدعاء ولي الأمر إلى المؤسسة' },
  { key:'commitment',   arch:'وثيقة التزام',      name:'توقيع التزام من التلميذ و/أو ولي الأمر' },
  { key:'support',      arch:'برنامج الدعم',      name:'تسجيل في برنامج الدعم التربوي' },
  { key:'followup',     arch:'متابعة ميدانية',    name:'متابعة ميدانية بعد الإدماج' }
];
function rProcDetails() {
  const rows = [];
  document.querySelectorAll('#r-summary-table tbody tr').forEach(tr => {
    const cb = tr.querySelector('input[type=checkbox]');
    const dEl = tr.querySelector('input[type=date]'); const nEl = tr.querySelector('.iproc-note');
    const date = dEl ? dEl.value : ''; const notes = nEl ? nEl.value.trim() : '';
    if (tr.dataset.custom) {
      const nm = tr.querySelector('.iproc-name'); const name = nm ? nm.value.trim() : '';
      if (name) rows.push({ custom:true, name:name, date:date, notes:notes });
    } else if (cb && cb.checked) {
      const p = R_PROCS.find(x => x.key === tr.dataset.key);
      if (p) rows.push({ key:p.key, name:p.name, date:date, notes:notes });
    }
  });
  return rows;
}
function rProcNames() {
  return rProcDetails().map(r => r.custom ? r.name : (R_PROCS.find(x => x.key === r.key) || {}).arch);
}
function rTblAddRow() {
  const tbody = document.querySelector('#r-summary-table tbody'); if (!tbody) return null;
  const tr = document.createElement('tr'); tr.dataset.custom = '1';
  tr.innerHTML = '<td class="c"><input type="checkbox"></td>' +
    '<td><div class="iproc-namewrap"><input type="text" class="iproc-name" placeholder="اسم الإجراء..." oninput="iAutoCheck(this)"><button type="button" class="iproc-del" title="حذف" onclick="this.closest(\'tr\').remove()">✕</button></div></td>' +
    '<td><input type="date" oninput="iAutoCheck(this)" onchange="iAutoCheck(this)"></td>' +
    '<td><input type="text" class="iproc-note" placeholder="ملاحظات..." oninput="iAutoCheck(this)"></td>';
  tbody.appendChild(tr);
  return tr;
}
function rResetProcTable() {
  document.querySelectorAll('#r-summary-table tbody tr[data-custom]').forEach(tr => tr.remove());
  document.querySelectorAll('#r-summary-table input').forEach(el => { if (el.type === 'checkbox') el.checked = false; else el.value = ''; });
}
function rRestoreProcRows(rows) {
  document.querySelectorAll('#r-summary-table tbody tr[data-custom]').forEach(tr => tr.remove());
  document.querySelectorAll('#r-summary-table tbody tr[data-key] input[type=date], #r-summary-table tbody tr[data-key] .iproc-note').forEach(i => i.value = '');
  (rows || []).forEach(r => {
    let tr;
    if (r.custom) { tr = rTblAddRow(); if (tr) tr.querySelector('.iproc-name').value = r.name || ''; }
    else tr = document.querySelector('#r-summary-table tbody tr[data-key="' + r.key + '"]');
    if (!tr) return;
    tr.querySelector('input[type=date]').value = r.date || '';
    tr.querySelector('.iproc-note').value = r.notes || '';
    tr.querySelector('input[type=checkbox]').checked = true;
  });
}

function rGenerateReport() {
  const studentName = val('r_studentName') || 'غير مُحدد';
  const causes = getChecked('r_cause');
  const procRows = rProcDetails().map(r => `<tr>
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
  const priority = getRadio('r_priority');

  document.getElementById('rReportContent').innerHTML = `
 <div class="new-report-header">
 <div class="nrh-logo">
 <img id="ministry-logo-img" src="" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;">
 </div>
 
 <div class="nrh-dir">مديرية الحي الحسني</div>
 <div class="nrh-school">${val('r_school') || 'المؤسسة التعليمية'}</div>
 <div class="nrh-title">تتبع إعادة الإدماج المدرسي</div>
 </div>
 
 <div class="report-section-title">معلومات التلميذ(ة)</div>
 <div class="report-grid">
 ${rField('الاسم الكامل:', studentName)}
 ${rField('رقم مسار:', val('r_studentMassar'))}
 ${rField('القسم:', val('r_level'))}
 ${rField('الجنس:', getRadio('r_gender'))}
 ${rField('الوضع الأسري:', getRadio('r_family'))}
 ${rField('هاتف الولي:', val('r_parentPhone'))}
 ${rField('تاريخ إعادة الإدماج:', val('r_reintegrationDate'))}
 ${rField('الدورة الدراسية:', getRadio('r_semester'))}
 </div>
 <div class="report-section-title">سياق الانقطاع</div>
 <div class="report-grid">
 ${rField('بداية الانقطاع:', val('r_absenceStart'))}
 ${rField('مدة الانقطاع:', val('r_absenceDuration'))}
 ${causes.length ? `<div class="report-field" style="grid-column:span 2"><span class="lbl">الأسباب الظاهرة:</span><span class="val">${causes.join(' / ')}</span></div>` : ''}
 ${rField('ملاحظات:', val('r_contextNotes'), 2)}
 </div>
 ${procedures ? `<div class="report-section-title">الإجراءات المتخذة</div>${procedures}` : ''}
 <div class="report-section-title">الخلاصة والتوصيات</div>
 <table class="info-table-report" style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;margin-bottom:10px;"><tbody>
  <tr><td class="info-lbl">درجة الأولوية:</td><td class="info-val" colspan="3">${iEsc(priority) || '—'}</td></tr>
   <tr><td class="info-lbl">التوصية الختامية:</td><td class="info-val" colspan="3">${iEsc(val('r_recommendation')) || '—'}</td></tr>
 </tbody></table>
 <div class="signatures">
 <div class="sig-block"><div class="sig-line"></div>الحارس العام</div>
 
 <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
 <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
 </div>
 `;
  document.getElementById('reintegrationPrintModal').classList.add('open');
  document.querySelectorAll('#ministry-logo-img').forEach(function(img){ if(typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) img.src = MINISTRY_LOGO_B64; });
  // ✅ حفظ تلقائي في الأرشيف عند إنشاء التقرير
  rSaveToArchiveSilent();
}

function rSaveToArchiveSilent() {
  const studentName = val('r_studentName');
  if (!studentName) return;
  const procedures = rProcNames();
  const entry = {
    id: Date.now(), savedAt: new Date().toLocaleString('ar-MA'),
    studentName, massar: val('r_studentMassar') || '—',
    school: val('r_school') || '—', level: val('r_level') || '—',
    reintegrationDate: val('r_reintegrationDate') || '—',
    gender: getRadio('r_gender') || '—', semester: getRadio('r_semester') || '—',
    absenceDuration: val('r_absenceDuration') || '—',
    causes: getChecked('r_cause'), procedures, procedureRows: rProcDetails(),
    currentStatus: '—',
    priority: getRadio('r_priority') || '—',
    recommendation: val('r_recommendation') || '',
    nextFollowup: '—'
  };
  const archive = getRArchive(); archive.unshift(entry); saveRArchive(archive);
  renderRArchive(); updateDashboardStats();
  const body = document.getElementById('rArchiveBody');
  if (body) { body.classList.add('open'); const arr = document.getElementById('rArchiveArrow'); if (arr) arr.textContent = '▲'; }
  autoLogTask('مقابلة فردية', 'إدماج مدرسي — ' + studentName, studentName, entry.school, 'إدماج مدرسي: ' + (entry.causes||[]).join(' / '), 'مُنجز', entry.reintegrationDate !== '—' ? entry.reintegrationDate : undefined);
}

function closeRModal() { document.getElementById('reintegrationPrintModal').classList.remove('open'); }

function rClearAll() {
  if (!confirm('هل أنت متأكد من مسح جميع البيانات؟')) return;
  document.querySelectorAll('#toolReintegration input[type=text], #toolReintegration input[type=date], #toolReintegration input[type=tel], #toolReintegration input[type=number], #toolReintegration textarea').forEach(el => el.value = '');
  document.querySelectorAll('#toolReintegration input[type=radio], #toolReintegration input[type=checkbox]').forEach(el => el.checked = false);
  document.querySelectorAll('#toolReintegration .procedure-details').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('#toolReintegration select').forEach(el => el.selectedIndex = 0);
  const schoolEl = document.getElementById('r_school'); if (schoolEl) schoolEl.value = (userProfile && userProfile.institution) ? userProfile.institution : getInstitutionName();
  rResetProcTable();
}

// ======= REINTEGRATION ARCHIVE =======
const R_ARCHIVE_KEY = 'reintegrationArchive_v1';
function getRArchive() { return appData.reintegrationArchive; }
function saveRArchive(data) { appData.reintegrationArchive = data; saveUserKey('reintegrationArchive'); }

function rSaveToArchive() {
  const studentName = val('r_studentName');
  if (!studentName) { alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
  const procedures = rProcNames();
  const entry = {
    id: Date.now(), savedAt: new Date().toLocaleString('ar-MA'),
    studentName, massar: val('r_studentMassar') || '—',
    school: val('r_school') || '—', level: val('r_level') || '—',
    reintegrationDate: val('r_reintegrationDate') || '—',
    gender: getRadio('r_gender') || '—', semester: getRadio('r_semester') || '—',
    absenceDuration: val('r_absenceDuration') || '—',
    causes: getChecked('r_cause'), procedures, procedureRows: rProcDetails(),
    currentStatus: '—',
    priority: getRadio('r_priority') || '—',
    recommendation: val('r_recommendation') || '',
    nextFollowup: '—'
  };
  const archive = getRArchive(); archive.unshift(entry); saveRArchive(archive);
  renderRArchive(); updateDashboardStats();
  const body = document.getElementById('rArchiveBody'); body.classList.add('open'); document.getElementById('rArchiveArrow').textContent = '▲';
  autoLogTask('مقابلة فردية', 'إدماج مدرسي — ' + studentName, studentName, entry.school, 'إدماج مدرسي: ' + (entry.causes||[]).join(' / '), 'مُنجز', entry.reintegrationDate !== '—' ? entry.reintegrationDate : undefined);
}

function toggleRArchive() {
  const body = document.getElementById('rArchiveBody'); const arrow = document.getElementById('rArchiveArrow');
  body.classList.toggle('open'); const isOpen = body.classList.contains('open'); arrow.textContent = isOpen ? '▲' : '▼';
  if (isOpen) { try { renderRArchive(); } catch(e) { console.error(e); } }
}

function renderRArchive() {
  const archive = getRArchive();
  const search = (document.getElementById('rArchiveSearch')?.value || '').trim().toLowerCase();
  const list = document.getElementById('rArchiveList');
  const countEl = document.getElementById('rArchiveCount');
  const statsEl = document.getElementById('rArchiveStats');
  if (!countEl) return;
  countEl.textContent = archive.length;
  const urgent = archive.filter(e => e.priority === 'عاجلة').length;
  statsEl.innerHTML = `<div class="archive-stat">📁 إجمالي الملفات: <strong>${archive.length}</strong></div>${urgent ? `<div class="archive-stat" style="background:#fee2e2;border-color:#fca5a5;color:#dc2626;">🔴 حالات عاجلة: <strong>${urgent}</strong></div>` : ''}`;
  const filtered = (search ? archive.filter(e => (e.studentName||'').toLowerCase().includes(search) || (e.school||'').toLowerCase().includes(search)) : archive).slice();
  // ترتيب حسب تاريخ الإدماج (الأحدث أولاً) مثل باقي سجلات الأرشيف
  filtered.sort((a, b) => {
    const da = (a.reintegrationDate && a.reintegrationDate !== '—') ? a.reintegrationDate : '';
    const db = (b.reintegrationDate && b.reintegrationDate !== '—') ? b.reintegrationDate : '';
    return db.localeCompare(da) || ((b.id || 0) - (a.id || 0));
  });

  if (!filtered.length) { list.innerHTML = `<div class="archive-empty">${search ? '🔍 لا توجد نتائج.' : '📂 لا توجد ملفات محفوظة بعد.<br><small>اضغط "حفظ في الأرشيف" لإضافة الملف الحالي.</small>'}</div>`; return; }
  const pColor = {'عاجلة':'#dc2626','عالية':'#c2410c','متوسطة':'#d97706','عادية':'#16a34a'};
  const pBg = {'عاجلة':'#fee2e2','عالية':'#fff7ed','متوسطة':'#fffbeb','عادية':'#f0fdf4'};
  // حساب عدد ملفات الإدماج لكل تلميذ
  const studentCount = {};
  archive.forEach(e => {
    const key = (e.studentName || '').trim().toLowerCase();
    if (key) studentCount[key] = (studentCount[key] || 0) + 1;
  });
  list.innerHTML = `<div style="overflow-x:auto;"><table class="archive-table"><thead><tr><th>#</th><th>اسم التلميذ(ة)</th><th>المؤسسة</th><th>المستوى</th><th>📅 تاريخ الإدماج</th><th>مدة الانقطاع</th><th>الأولوية</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody>${filtered.map((e,idx) => { const sKey = (e.studentName||'').trim().toLowerCase(); const count = studentCount[sKey]||1; const hasMultiple = count > 1; return `<tr><td style="text-align:center;color:var(--text-muted);font-size:0.75rem;">${idx+1}</td><td><strong style="color:var(--primary);">👤 ${e.studentName}</strong>${hasMultiple ? `<br><span style="background:#ede9fe;color:#7c3aed;border:1px solid #c4b5fd;border-radius:10px;padding:1px 7px;font-size:0.68rem;font-weight:700;">🔁 ${count} ملفات</span>` : ''}</td><td>${e.school||'—'}</td><td style="text-align:center;">${e.level||'—'}</td><td style="text-align:center;white-space:nowrap;">📅 ${e.reintegrationDate||'—'}</td><td style="text-align:center;">${e.absenceDuration||'—'}</td><td style="text-align:center;">${e.priority && e.priority !== '—' ? `<span style="background:${pBg[e.priority]||'#f1f5f9'};color:${pColor[e.priority]||'#64748b'};border:1px solid ${pColor[e.priority]||'#cbd5e1'};border-radius:12px;padding:2px 9px;font-size:0.72rem;font-weight:700;">● ${e.priority}</span>` : '—'}</td><td style="text-align:center;font-size:0.75rem;">${e.currentStatus||'—'}</td><td style="white-space:nowrap;"><div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap;">${hasMultiple ? `<button class="btn-sm" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:0.72rem;font-family:'Cairo',sans-serif;font-weight:700;" onclick="rOpenStudentHistory('${(e.studentName||'').replace(/'/g,"\\'")}',${e.id})" title="سجل جميع ملفات الإدماج">📋 السجل</button>` : ''}<button class="btn-sm" style="background:linear-gradient(135deg,#2563a8,#1d4ed8);color:white;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:0.72rem;font-family:'Cairo',sans-serif;font-weight:700;" onclick="rLoadEntry(${e.id})" title="تحميل للتعديل">✏️ تعديل</button><button class="btn-sm btn-sm-danger" onclick="deleteREntry(${e.id})" title="حذف">🗑</button></div></td></tr>`; }).join('')}</tbody></table></div>`;
}

function deleteREntry(id, skipConfirm) {
  if (!skipConfirm && !confirm('هل تريد حذف هذا الملف من أرشيف الإدماج المدرسي؟')) return;
  saveRArchive(getRArchive().filter(e => e.id !== id)); renderRArchive(); updateDashboardStats();
}

function clearRArchive() {
  const archive = getRArchive();
  if (!archive.length) { alert('📂 الأرشيف فارغ بالفعل.'); return; }
  if (!confirm(`⚠️ تحذير: سيتم حذف جميع ملفات الإدماج المدرسي (${archive.length} ملف) نهائياً.\n\nهل أنت متأكد من المسح الكامل؟`)) return;
  saveRArchive([]); renderRArchive(); updateDashboardStats();
}

function exportRArchiveCSV() {
  const archive = getRArchive();
  if (!archive.length) { alert('⚠️ الأرشيف فارغ.'); return; }
  const headers = ['#','اسم التلميذ(ة)','رقم مسار','المؤسسة','المستوى','الجنس','تاريخ الإدماج','مدة الانقطاع','الإجراءات','درجة الأولوية','التوصية','تاريخ الحفظ'];
  const rows = archive.map((e,i) => [i+1,e.studentName,e.massar,e.school,e.level,e.gender,e.reintegrationDate,e.absenceDuration,e.procedures.join(' / '),e.priority,e.recommendation,e.savedAt].map(c=>`"${String(c||'').replace(/"/g,'""')}"`));
  const csv = '\uFEFF' + [headers.map(h=>`"${h}"`).join(','), ...rows.map(r=>r.join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download = `ارشيف_الادماج_المدرسي_${new Date().toISOString().slice(0,10)}.csv`; a.click();
}

function rLoadEntry(id) {
  const entry = getRArchive().find(e => e.id === id);
  if (!entry) return;
  document.querySelector('#toolReintegration .main-container')?.scrollTo(0,0);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const setV = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  setV('r_studentName',      entry.studentName);
  setV('r_studentMassar',    entry.massar   !== '—' ? entry.massar   : '');
  setV('r_school',           entry.school   !== '—' ? entry.school   : '');
  setV('r_level',            entry.level    !== '—' ? entry.level    : '');
  setV('r_reintegrationDate', entry.reintegrationDate !== '—' ? entry.reintegrationDate : '');
  setV('r_absenceDuration',  entry.absenceDuration !== '—' ? entry.absenceDuration : '');
  setV('r_recommendation',   entry.recommendation);

  const clearG = name => document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.checked = false);
  const setR   = (name, v) => { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; };
  const setChecks = (name, vals) => { clearG(name); (vals||[]).forEach(v => { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; }); };
  clearG('r_gender');   setR('r_gender',   entry.gender);
  clearG('r_semester'); setR('r_semester', entry.semester);
  clearG('r_priority'); setR('r_priority', entry.priority);
  setChecks('r_cause', entry.causes);

  const procMap = {
    'جلسة الاستماع':    'r_chk_listening',
    'اتصال بولي الأمر': 'r_chk_parent_call',
    'استدعاء ولي الأمر':'r_chk_parent_visit',
    'وثيقة التزام':     'r_chk_commitment',
    'برنامج الدعم':     'r_chk_support',
    'متابعة ميدانية':   'r_chk_followup'
  };
  if (entry.procedureRows && entry.procedureRows.length) {
    rRestoreProcRows(entry.procedureRows);
  } else {
    rResetProcTable();
    (entry.procedures || []).forEach(p => { if (procMap[p]) { const el = document.getElementById(procMap[p]); if (el) el.checked = true; } });
  }

  rShowEditBar(id);
}

function rShowEditBar(id) {
  let bar = document.getElementById('rEditBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'rEditBar';
    bar.style.cssText = 'position:sticky;top:0;z-index:200;background:linear-gradient(135deg,#1d4ed8,#2563a8);color:white;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-bottom:3px solid #fcd34d;';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;font-size:0.88rem;font-weight:700;">
        <span style="font-size:1.2rem;">✏️</span>
        <span>وضع التعديل — تم تحميل بيانات ملف الإدماج. عدّل ما تريد ثم احفظ.</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="rUpdateEntry()" style="background:#fcd34d;color:#1a3a5c;border:none;border-radius:8px;padding:8px 16px;font-family:'Cairo',sans-serif;font-size:0.84rem;font-weight:800;cursor:pointer;">💾 حفظ التعديلات</button>
        <button onclick="rCancelEdit()" style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);border-radius:8px;padding:8px 14px;font-family:'Cairo',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;">✕ إلغاء</button>
      </div>`;
    const container = document.querySelector('#toolReintegration .main-container');
    if (container) container.insertBefore(bar, container.firstChild);
  }
  bar.style.display = 'flex';
  bar.dataset.editId = id;
}

function rHideEditBar() { const b = document.getElementById('rEditBar'); if (b) b.style.display = 'none'; }

function rCancelEdit() {
  rHideEditBar();
  document.querySelectorAll('#toolReintegration input[type=text], #toolReintegration input[type=date], #toolReintegration input[type=tel], #toolReintegration input[type=number], #toolReintegration textarea').forEach(el => el.value = '');
  document.querySelectorAll('#toolReintegration input[type=radio], #toolReintegration input[type=checkbox]').forEach(el => el.checked = false);
  document.querySelectorAll('#toolReintegration .procedure-details').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('#toolReintegration select').forEach(el => el.selectedIndex = 0);
  rResetProcTable();
}

function rUpdateEntry() {
  const bar = document.getElementById('rEditBar');
  const id = bar ? parseInt(bar.dataset.editId) : null;
  if (!id) return;
  const studentName = val('r_studentName');
  if (!studentName) { alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
  const procedures = rProcNames();
  const updatedEntry = {
    id, savedAt: new Date().toLocaleString('ar-MA') + ' (معدَّل)',
    studentName, massar: val('r_studentMassar') || '—',
    school: val('r_school') || '—', level: val('r_level') || '—',
    reintegrationDate: val('r_reintegrationDate') || '—',
    gender: getRadio('r_gender') || '—', semester: getRadio('r_semester') || '—',
    absenceDuration: val('r_absenceDuration') || '—',
    causes: getChecked('r_cause'), procedures, procedureRows: rProcDetails(),
    currentStatus: '—',
    priority: getRadio('r_priority') || '—',
    recommendation: val('r_recommendation') || '', nextFollowup: '—'
  };
  const archive = getRArchive();
  const idx = archive.findIndex(e => e.id === id);
  if (idx !== -1) archive[idx] = updatedEntry; else archive.unshift(updatedEntry);
  saveRArchive(archive);
  renderRArchive();
  rHideEditBar();
  rCancelEdit();
  const body = document.getElementById('rArchiveBody');
  if (body && !body.classList.contains('open')) { body.classList.add('open'); document.getElementById('rArchiveArrow').textContent = '▲'; }
  alert(`✅ تم تحديث ملف الإدماج لـ "${studentName}" في الأرشيف بنجاح.`);
}
