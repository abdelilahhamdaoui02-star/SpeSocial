// نسخة مجمَّدة من كود «التلاميذ الأكثر غياباً» القديم (script-11.js وscript-16.js قبل المرحلة 21) — مرجع اختبار المطابقة فقط
function rField(label, value, spanCols) {
  if (!value || value === '—' || value.trim() === '') return '';
  const span = spanCols ? ` style="grid-column:span ${spanCols}"` : '';
  return `<div class="report-field"${span}><span class="lbl">${label}</span><span class="val">${value}</span></div>`;
}
function getAbArchive() { return appData.absenceArchive; }
function saveAbArchive(data) { appData.absenceArchive = data; saveUserKey('absenceArchive'); }

let abInitialized = false;

function initAbsence() {
  if (abInitialized) return;
  abInitialized = true;
  setTimeout(initAllAutocomplete, 50);
  const today = new Date().toISOString().slice(0,10);
  document.getElementById('ab_recordDate').value = today;
  renderAbArchive();
}

const AB_PROCS = [
  { key:'listening',    arch:'جلسة استماع',        name:'جلسة الاستماع مع التلميذ(ة)' },
  { key:'parent_call',  arch:'اتصال بولي الأمر',   name:'اتصال هاتفي بولي الأمر' },
  { key:'parent_visit', arch:'استدعاء ولي الأمر',  name:'استدعاء ولي الأمر إلى المؤسسة' },
  { key:'commitment',   arch:'وثيقة التزام',       name:'توقيع التزام من التلميذ و/أو ولي الأمر' },
  { key:'warning',      arch:'إشعار رسمي',         name:'إشعار رسمي / إنذار بالغياب' },
  { key:'followup',     arch:'متابعة ميدانية',     name:'متابعة ميدانية ورصد التطور' }
];
function abProcDetails() {
  const rows = [];
  document.querySelectorAll('#ab-summary-table tbody tr').forEach(tr => {
    const cb = tr.querySelector('input[type=checkbox]');
    const dEl = tr.querySelector('input[type=date]'); const nEl = tr.querySelector('.iproc-note');
    const date = dEl ? dEl.value : ''; const notes = nEl ? nEl.value.trim() : '';
    if (tr.dataset.custom) {
      const nm = tr.querySelector('.iproc-name'); const name = nm ? nm.value.trim() : '';
      if (name) rows.push({ custom:true, name:name, date:date, notes:notes });
    } else if (cb && cb.checked) {
      const p = AB_PROCS.find(x => x.key === tr.dataset.key);
      if (p) rows.push({ key:p.key, name:p.name, date:date, notes:notes });
    }
  });
  return rows;
}
function abProcNames() {
  return abProcDetails().map(r => r.custom ? r.name : (AB_PROCS.find(x => x.key === r.key) || {}).arch);
}
function abTblAddRow() {
  const tbody = document.querySelector('#ab-summary-table tbody'); if (!tbody) return null;
  const tr = document.createElement('tr'); tr.dataset.custom = '1';
  tr.innerHTML = '<td class="c"><input type="checkbox"></td>' +
    '<td><div class="iproc-namewrap"><input type="text" class="iproc-name" placeholder="اسم الإجراء..." oninput="iAutoCheck(this)"><button type="button" class="iproc-del" title="حذف" onclick="this.closest(\'tr\').remove()">✕</button></div></td>' +
    '<td><input type="date" oninput="iAutoCheck(this)" onchange="iAutoCheck(this)"></td>' +
    '<td><input type="text" class="iproc-note" placeholder="ملاحظات..." oninput="iAutoCheck(this)"></td>';
  tbody.appendChild(tr);
  return tr;
}
function abResetProcTable() {
  document.querySelectorAll('#ab-summary-table tbody tr[data-custom]').forEach(tr => tr.remove());
  document.querySelectorAll('#ab-summary-table input').forEach(el => { if (el.type === 'checkbox') el.checked = false; else el.value = ''; });
}
function abRestoreProcRows(rows) {
  document.querySelectorAll('#ab-summary-table tbody tr[data-custom]').forEach(tr => tr.remove());
  document.querySelectorAll('#ab-summary-table tbody tr[data-key] input[type=checkbox]').forEach(i => i.checked = false);
  document.querySelectorAll('#ab-summary-table tbody tr[data-key] input[type=date], #ab-summary-table tbody tr[data-key] .iproc-note').forEach(i => i.value = '');
  (rows || []).forEach(r => {
    let tr;
    if (r.custom) { tr = abTblAddRow(); if (tr) tr.querySelector('.iproc-name').value = r.name || ''; }
    else tr = document.querySelector('#ab-summary-table tbody tr[data-key="' + r.key + '"]');
    if (!tr) return;
    tr.querySelector('input[type=date]').value = r.date || '';
    tr.querySelector('.iproc-note').value = r.notes || '';
    tr.querySelector('input[type=checkbox]').checked = true;
  });
}

function abGenerateReport() {
  const studentName = val('ab_studentName') || 'غير مُحدد';
  const causes = getChecked('ab_cause');
  const patterns = getChecked('ab_pattern');
  const procRows = abProcDetails().map(r => `<tr>
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
  </table>` : '<p style="color:#64748b;font-size:0.82rem;">لم يتم اختيار أي إجراء.</p>';
  const priority = getRadio('ab_priority');

  document.getElementById('abReportContent').innerHTML = `
 <div class="new-report-header">
 <div class="nrh-logo">
 <img id="ministry-logo-img" src="" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;">
 </div>
 
 <div class="nrh-dir">مديرية الحي الحسني</div>
 <div class="nrh-school">${val('ab_school') || 'المؤسسة التعليمية'}</div>
 <div class="nrh-title">تتبع وضعية التلاميذ الأكثر غياباً</div>
 </div>
 
 <div class="report-section-title">معلومات التلميذ(ة)</div>
 <div class="report-grid">
 ${rField('الاسم الكامل:', studentName)}
 ${rField('رقم مسار:', val('ab_studentMassar'))}
 ${rField('القسم:', val('ab_level'))}
 ${rField('الجنس:', getRadio('ab_gender'))}
 ${rField('الوضع الأسري:', getRadio('ab_family'))}
 ${rField('هاتف الولي:', val('ab_parentPhone'))}
 ${rField('الدورة الدراسية:', getRadio('ab_semester'))}
 ${rField('تاريخ رصد الحالة:', val('ab_recordDate'))}
 </div>
 <div class="report-section-title">إحصاءات الغياب</div>
 <div class="report-grid">
 ${val('ab_totalHours') ? `<div class="report-field"><span class="lbl">إجمالي الساعات:</span><span class="val">${val('ab_totalHours')} سا</span></div>` : ''}
 ${val('ab_justifiedHours') ? `<div class="report-field"><span class="lbl">غيابات مبررة:</span><span class="val">${val('ab_justifiedHours')} سا</span></div>` : ''}
 ${val('ab_unjustifiedHours') ? `<div class="report-field"><span class="lbl">غير مبررة:</span><span class="val">${val('ab_unjustifiedHours')} سا</span></div>` : ''}
 ${val('ab_totalDays') ? `<div class="report-field"><span class="lbl">إجمالي الأيام:</span><span class="val">${val('ab_totalDays')} يوماً</span></div>` : ''}
 ${val('ab_justifiedDays') ? `<div class="report-field"><span class="lbl">أيام مبررة:</span><span class="val">${val('ab_justifiedDays')} يوماً</span></div>` : ''}
 ${val('ab_unjustifiedDays') ? `<div class="report-field"><span class="lbl">أيام غير مبررة:</span><span class="val">${val('ab_unjustifiedDays')} يوماً</span></div>` : ''}
 ${rField('أول غياب:', val('ab_firstAbsenceDate'))}
 ${rField('آخر حضور:', val('ab_lastPresenceDate'))}
 ${patterns.length ? `<div class="report-field" style="grid-column:span 2"><span class="lbl">نمط الغياب:</span><span class="val">${patterns.join(' / ')}</span></div>` : ''}
 ${causes.length ? `<div class="report-field" style="grid-column:span 2"><span class="lbl">الأسباب المُرصودة:</span><span class="val">${causes.join(' / ')}</span></div>` : ''}
 ${rField('ملاحظات:', val('ab_contextNotes'), 2)}
 </div>
 <div class="report-section-title">الإجراءات المتخذة</div>
 ${procedures}
 <div class="report-section-title">الخلاصة والتوصيات</div>
 <table class="info-table-report" style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;margin-bottom:10px;"><tbody>
   <tr><td class="info-lbl">درجة الأولوية:</td><td class="info-val" colspan="3">${iEsc(priority) || '—'}</td></tr>
   <tr><td class="info-lbl">التوصية الختامية:</td><td class="info-val" colspan="3">${iEsc(val('ab_recommendation')) || '—'}</td></tr>
 </tbody></table>
 <div class="signatures">
 <div class="sig-block"><div class="sig-line"></div>الحارس العام</div>
 
 <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
 <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
 </div>
 

 `;
  document.getElementById('absencePrintModal').classList.add('open');
  document.querySelectorAll('#ministry-logo-img').forEach(function(img){ if(typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) img.src = MINISTRY_LOGO_B64; });
  // ✅ حفظ تلقائي في الأرشيف عند إنشاء التقرير
  abSaveToArchiveSilent();
}

function abSaveToArchiveSilent() {
  const studentName = val('ab_studentName');
  if (!studentName) return;
  const procedures = abProcNames();
  const entry = {
    id: Date.now(), savedAt: new Date().toLocaleString('ar-MA'),
    recordDate: val('ab_recordDate') || new Date().toISOString().slice(0,10),
    studentName, massar: val('ab_studentMassar') || '—',
    school: val('ab_school') || '—', level: val('ab_level') || '—',
    gender: getRadio('ab_gender') || '—', semester: getRadio('ab_semester') || '—',
    parentPhone: val('ab_parentPhone') || '—',
    totalHours: val('ab_totalHours') || '—',
    unjustifiedHours: val('ab_unjustifiedHours') || '—',
    totalDays: val('ab_totalDays') || '—',
    justifiedDays: val('ab_justifiedDays') || '—', unjustifiedDays: val('ab_unjustifiedDays') || '—',
    causes: getChecked('ab_cause'), procedures, procedureRows: abProcDetails(),
    currentStatus: '—',
    priority: getRadio('ab_priority') || '—',
    recommendation: val('ab_recommendation') || '',
    nextFollowup: '—'
  };
  const archive = getAbArchive(); archive.unshift(entry); saveAbArchive(archive); updateDashboardStats();
  renderAbArchive();
  const body = document.getElementById('abArchiveBody');
  if (body) { body.classList.add('open'); const arr = document.getElementById('abArchiveArrow'); if (arr) arr.textContent = '▲'; }
  autoLogTask('أخرى', 'ملف غياب — ' + studentName, studentName, entry.school, `إجمالي الساعات: ${entry.totalHours} — غير مبررة: ${entry.unjustifiedHours}`, 'مُنجز', entry.recordDate !== '—' ? entry.recordDate : undefined);
}

function closeAbModal() { document.getElementById('absencePrintModal').classList.remove('open'); }

// ======= استيراد الغياب الشهري من Excel =======
let _abm = null, _abmRows = [];
function abmKey() { return 'app:abMonthly:' + (currentUser || ''); }
function abmLoad() {
  if (_abm) return _abm;
  try { _abm = JSON.parse(localStorage.getItem(abmKey()) || 'null'); } catch(e) {}
  if (!_abm) {
    _abm = {};
    if (currentUser) storageGet(currentUser + ':abMonthly', true).then(v => { if (v) { try { _abm = JSON.parse(v.value || v); abmRender(); } catch(e) {} } }).catch(() => {});
  }
  return _abm;
}
function abmSave() {
  try { localStorage.setItem(abmKey(), JSON.stringify(_abm)); } catch(e) {}
  if (currentUser) storageSet(currentUser + ':abMonthly', JSON.stringify(_abm), true).catch(() => {});
}
// قارئ نموذج «ملخص الغياب الشهري» (ملف لكل قسم): الترويسة في الأعلى، ثم جدول الأيام 1..31، ثم المجموع
// أعمدة المجموع بالترتيب: يوم (غير مبرر) | يوم (مبرر) | ساعة (غير مبرر) | ساعة (مبرر)
function abmParse(rows) {
  const N = v => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  const hi = rows.findIndex(r => r.some(c => N(c) === 'رقم التلميذ'));
  if (hi < 0) return null;
  const after = (row, c) => { for (let k = c + 1; k < row.length; k++) if (N(row[k])) return N(row[k]); return ''; };
  let cls = '', school = '', month = '', year = '';
  rows.slice(0, hi).forEach(r => r.forEach((c, i) => {
    const t = N(c);
    if (/^القسم/.test(t)) cls = after(r, i);
    else if (/^مؤسسة/.test(t)) school = after(r, i);
    else if (/^الشهر/.test(t)) month = after(r, i);
    else if (/السنة الدراسية/.test(t)) year = after(r, i);
  }));
  const H = rows[hi].map(N), cMas = H.indexOf('رقم التلميذ'), cTot = H.indexOf('المجموع');
  const cFam = H.findIndex(h => /^النسب/.test(h)), cName = H.findIndex(h => /^(الإسم|الاسم)/.test(h));
  const days = [], hrs = [];
  (rows[hi + 1] || []).map(N).forEach((t, i) => { if (i >= cTot && cTot >= 0) { if (t === 'يوم') days.push(i); if (t === 'ساعة') hrs.push(i); } });
  if (cTot < 0 || days.length < 2 || hrs.length < 2) return null;
  const MONTHS = { 'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'ابريل': 4, 'ماي': 5, 'يونيو': 6, 'يوليوز': 7, 'غشت': 8, 'شتنبر': 9, 'أكتوبر': 10, 'اكتوبر': 10, 'نونبر': 11, 'دجنبر': 12 };
  const m = MONTHS[month], ys = year.match(/(\d{4})\D+(\d{4})/);
  const key = m && ys ? (m >= 9 ? ys[1] : ys[2]) + '-' + String(m).padStart(2, '0') : '';
  const num = v => parseFloat(String(v).replace(',', '.')) || 0;
  const list = [];
  for (let r = hi + 2; r < rows.length; r++) {
    const row = rows[r], mas = N(row[cMas]), n = (N(row[cFam]) + ' ' + N(row[cName])).trim();
    if (!mas || !n) continue;
    const ud = num(row[days[0]]), jd = num(row[days[1]]), uh = num(row[hrs[0]]), jh = num(row[hrs[1]]);
    if (ud + jd + uh + jh) list.push({ n, m: mas, c: cls, th: uh + jh, jh, uh, td: ud + jd, jd, ud });
  }
  return { cls, school, key, list };
}
function abmImport(input) {
  const files = Array.from(input.files || []); if (!files.length) return;
  const msg = document.getElementById('abm_msg'), mon = document.getElementById('abm_month');
  msg.style.color = '#0f766e'; msg.textContent = '⏳ جاري قراءة الملفات...';
  Promise.all(files.map(f => new Promise((res, rej) => {
    const rd = new FileReader();
    rd.onload = e => { try { const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' }); res({ f: f.name, ds: wb.SheetNames.map(sn => abmParse(XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' }))).filter(d => d && d.cls) }); } catch (err) { rej(err); } };
    rd.onerror = rej; rd.readAsArrayBuffer(f);
  }))).then(rs => {
    const data = abmLoad(), lines = [], bad = []; let school = '', tot = 0;
    rs.forEach(({ f, ds }) => {
      if (!ds.length) { bad.push(f); return; }
      ds.forEach(d => {
        const key = d.key || mon.value;
        data[key] = (data[key] || []).filter(o => o.c !== d.cls).concat(d.list);
        lines.push(`• ${d.cls} — ${key} — ${d.list.length} تلميذ(ة)`); tot += d.list.length; school = school || d.school;
      });
    });
    if (lines.length) {
      abmSave();
      try { if (school && !(userProfile && userProfile.institution)) { userProfile.institution = school; window.dispatchEvent(new Event('legacy:profile-changed')); if (currentUser) storageSet(currentUser + ':profile', JSON.stringify(userProfile), true).catch(() => {}); } } catch (e) {}
    }
    msg.style.color = lines.length ? '#16a34a' : '#dc2626';
    msg.textContent = (lines.length ? `✅ تم استيراد ${lines.length} قسم(أقسام) — ${tot} تلميذ(ة) لديهم غيابات. اختر القسم من القائمة لعرض ملفه.\n${lines.join('\n')}` : '❌ لم يتم التعرف على أي ملف.') + (bad.length ? `\n⚠️ ملفات غير مطابقة للنموذج (ملف قسم واحد): ${bad.join('، ')}` : '');
    abmRender();
  }).catch(err => { msg.style.color = '#dc2626'; msg.textContent = '❌ خطأ في قراءة الملفات: ' + err.message; });
  input.value = '';
}
function abmRender() {
  const data = abmLoad(), mon = document.getElementById('abm_month'), sel = document.getElementById('abm_view'), cs = document.getElementById('abm_cls'), tb = document.getElementById('abm_table');
  if (!tb) return;
  if (!mon.value) mon.value = new Date().toISOString().slice(0, 7);
  const keys = Object.keys(data).sort(), curC = cs.value, curM = sel.value;
  // كل الأقسام المستوردة مهما كان الشهر
  const classes = [...new Set(keys.flatMap(k => (data[k] || []).map(o => o.c || '—')))].sort();
  cs.innerHTML = '<option value="">— اختر القسم —</option>' + classes.map(c => `<option value="${c}">${c}</option>`).join('');
  cs.value = classes.includes(curC) ? curC : '';
  // الأشهر المتوفرة لهذا القسم
  const months = keys.filter(k => !cs.value || (data[k] || []).some(o => (o.c || '—') === cs.value));
  sel.innerHTML = months.map(k => `<option value="${k}">${k}</option>`).join('') + (months.length > 1 ? '<option value="*">كل الأشهر (تراكمي)</option>' : '');
  sel.value = months.includes(curM) || (curM === '*' && months.length > 1) ? curM : (months.includes(mon.value) ? mon.value : months[months.length - 1] || '');
  const norm = v => (typeof acNormalize === 'function' ? acNormalize(v) : v || '').toLowerCase();
  let rows = [];
  (sel.value === '*' ? months : [sel.value]).forEach(k => (data[k] || []).forEach(o => {
    if ((o.c || '—') !== cs.value) return;
    const x = rows.find(y => norm(y.n) === norm(o.n));
    if (x) ['th','jh','uh','td','jd','ud'].forEach(q => x[q] += o[q]); else rows.push({ ...o });
  }));
  const q = norm(document.getElementById('abm_search').value);
  rows = rows.filter(o => !q || norm(o.n).includes(q)).sort((a, b) => b.th - a.th || b.td - a.td);
  _abmRows = rows.slice(0, 300);
  tb.innerHTML = rows.length ? '<thead><tr><th>#</th><th>التلميذ(ة)</th><th>القسم</th><th>الساعات</th><th>مبررة</th><th>غير مبررة</th><th>الأيام</th><th>مبررة</th><th>غير مبررة</th><th></th></tr></thead><tbody>' +
    _abmRows.map((o, i) => `<tr><td>${i + 1}</td><td>${o.n}</td><td>${o.c || '—'}</td><td><b>${o.th}</b></td><td>${o.jh}</td><td style="color:#dc2626;font-weight:700;">${o.uh}</td><td><b>${o.td}</b></td><td>${o.jd}</td><td style="color:#dc2626;font-weight:700;">${o.ud}</td><td><button type="button" class="btn-sm btn-sm-outline" onclick="abmFill(${i})">⬇️ تعبئة</button></td></tr>`).join('') + '</tbody>'
    : `<tbody><tr><td style="text-align:center;color:#94a3b8;padding:14px;">${cs.value ? '📂 لا توجد غيابات مستوردة لهذه الفترة.' : '👆 اختر القسم لعرض ملف الغياب الخاص به.'}</td></tr></tbody>`;
}
function abmDeleteClass() {
  const cs = document.getElementById('abm_cls'), sel = document.getElementById('abm_view'), msg = document.getElementById('abm_msg'), data = abmLoad();
  if (!cs.value) { alert('⚠️ اختر القسم أولاً.'); return; }
  const all = sel.value === '*', keys = all ? Object.keys(data) : [sel.value];
  if (!confirm(`🗑 هل تريد حذف ملف القسم ${cs.value} ${all ? 'لكل الأشهر' : 'لشهر ' + sel.value} نهائياً؟\nلا يمكن التراجع عن هذا الإجراء.`)) return;
  const name = cs.value;
  keys.forEach(k => { data[k] = (data[k] || []).filter(o => (o.c || '—') !== name); if (!data[k].length) delete data[k]; });
  abmSave(); abmRender();
  msg.style.color = '#16a34a'; msg.textContent = `✅ تم حذف ملف القسم ${name} نهائياً.`;
}
function abmDeleteAll() {
  const msg = document.getElementById('abm_msg');
  if (!Object.keys(abmLoad()).length) { alert('لا توجد ملفات مستوردة للحذف.'); return; }
  if (!confirm('🗑 هل تريد حذف جميع الملفات المستوردة (كل الأقسام وكل الأشهر) نهائياً؟\nلا يمكن التراجع عن هذا الإجراء.')) return;
  _abm = {}; abmSave(); abmRender();
  msg.style.color = '#16a34a'; msg.textContent = '✅ تم حذف جميع الملفات المستوردة نهائياً.';
}
function abmFill(i) {
  const o = _abmRows[i]; if (!o) return;
  const db = STUDENT_DB.find(s => acNormalize(s.fullName) === acNormalize(o.n)) || {};
  acFillField({ nameId: 'ab_studentName', massarId: 'ab_studentMassar', schoolId: 'ab_school', levelId: 'ab_level', genderName: 'ab_gender' },
    { fullName: o.n, massar: o.m || db.massar || '', class: o.c || db.class || '', gender: db.gender || '' });
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  set('ab_totalHours', o.th); set('ab_justifiedHours', o.jh); set('ab_unjustifiedHours', o.uh);
  set('ab_totalDays', o.td); set('ab_justifiedDays', o.jd); set('ab_unjustifiedDays', o.ud);
  const el = document.getElementById('ab_studentName'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
setTimeout(() => { try { abmRender(); } catch(e) {} }, 1500);

function abClearAll() {
  if (!confirm('هل أنت متأكد من مسح جميع البيانات؟')) return;
  document.querySelectorAll('#toolAbsence input[type=text], #toolAbsence input[type=date], #toolAbsence input[type=tel], #toolAbsence input[type=number], #toolAbsence textarea').forEach(el => el.value = '');
  document.querySelectorAll('#toolAbsence input[type=radio], #toolAbsence input[type=checkbox]').forEach(el => el.checked = false);
  document.querySelectorAll('#toolAbsence .procedure-details').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('#toolAbsence select').forEach(el => el.selectedIndex = 0);
  const schoolEl = document.getElementById('ab_school'); if (schoolEl) schoolEl.value = (userProfile && userProfile.institution) ? userProfile.institution : getInstitutionName();
  document.getElementById('ab_recordDate').value = new Date().toISOString().slice(0,10);
  abResetProcTable();
}

// ======= ABSENCE ARCHIVE =======
const AB_ARCHIVE_KEY = 'absenceArchive_v1';

function abSaveToArchive() {
  const studentName = val('ab_studentName');
  if (!studentName) { alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
  const procedures = abProcNames();
  const entry = {
    id: Date.now(), savedAt: new Date().toLocaleString('ar-MA'),
    recordDate: val('ab_recordDate') || new Date().toISOString().slice(0,10),
    studentName, massar: val('ab_studentMassar') || '—',
    school: val('ab_school') || '—', level: val('ab_level') || '—',
    gender: getRadio('ab_gender') || '—', semester: getRadio('ab_semester') || '—',
    parentPhone: val('ab_parentPhone') || '—',
    totalHours: val('ab_totalHours') || '—',
    unjustifiedHours: val('ab_unjustifiedHours') || '—',
    totalDays: val('ab_totalDays') || '—',
    justifiedDays: val('ab_justifiedDays') || '—', unjustifiedDays: val('ab_unjustifiedDays') || '—',
    causes: getChecked('ab_cause'), procedures, procedureRows: abProcDetails(),
    currentStatus: '—',
    priority: getRadio('ab_priority') || '—',
    recommendation: val('ab_recommendation') || '',
    nextFollowup: '—'
  };
  const archive = getAbArchive(); archive.unshift(entry); saveAbArchive(archive); updateDashboardStats();
  renderAbArchive();
  const body = document.getElementById('abArchiveBody'); body.classList.add('open'); document.getElementById('abArchiveArrow').textContent = '▲';
  autoLogTask('أخرى', 'ملف غياب — ' + studentName, studentName, entry.school, `إجمالي الساعات: ${entry.totalHours} — غير مبررة: ${entry.unjustifiedHours}`, 'مُنجز', entry.recordDate !== '—' ? entry.recordDate : undefined);
}

function toggleAbArchive() {
  const body = document.getElementById('abArchiveBody'); const arrow = document.getElementById('abArchiveArrow');
  body.classList.toggle('open'); arrow.textContent = body.classList.contains('open') ? '▲' : '▼';
}

function renderAbArchive() {
  const archive = getAbArchive();
  const search = (document.getElementById('abArchiveSearch')?.value || '').trim().toLowerCase();
  const list = document.getElementById('abArchiveList');
  const countEl = document.getElementById('abArchiveCount');
  const statsEl = document.getElementById('abArchiveStats');
  if (!countEl) return;
  countEl.textContent = archive.length;
  const urgentCount = archive.filter(e => e.priority === 'عاجلة').length;
  statsEl.innerHTML = `<div class="archive-stat">📁 إجمالي الملفات: <strong>${archive.length}</strong></div>
    ${urgentCount ? `<div class="archive-stat" style="background:#fee2e2;border-color:#fca5a5;color:#dc2626;">🔴 حالات عاجلة: <strong>${urgentCount}</strong></div>` : ''}`;
  const filtered = search ? archive.filter(e => e.studentName.toLowerCase().includes(search) || e.school.toLowerCase().includes(search)) : archive;
  if (!filtered.length) { list.innerHTML = `<div class="archive-empty">${search ? '🔍 لا توجد نتائج.' : '📂 لا توجد ملفات محفوظة بعد.<br><small>اضغط "حفظ في الأرشيف" لإضافة الملف الحالي.</small>'}</div>`; return; }
  const priorityColors = {'عاجلة':'#dc2626','عالية':'#d97706','متوسطة':'#ca8a04','عادية':'#16a34a'};
  list.innerHTML = `<div style="overflow-x:auto;">
    <table class="archive-table">
      <thead><tr>
        <th>#</th><th>اسم التلميذ(ة)</th><th>المؤسسة</th><th>المستوى</th><th>إجمالي الساعات</th><th>غير مبررة</th><th>الإجراءات</th><th>الأولوية</th><th>تاريخ الحفظ</th><th>إجراء</th>
      </tr></thead>
      <tbody>${filtered.map((e,i) => `<tr>
        <td style="text-align:center;font-weight:700;color:#64748b;">${i+1}</td>
        <td><strong style="color:#92400e;">${e.studentName}</strong></td>
        <td>${e.school}</td>
        <td>${e.level}</td>
        <td style="text-align:center;font-weight:700;">${e.totalHours}</td>
        <td style="text-align:center;color:#dc2626;font-weight:700;">${e.unjustifiedHours}</td>
        <td>${e.procedures.map(p=>`<span class="archive-tag">${p}</span>`).join(' ')}</td>
        <td><span style="background:${priorityColors[e.priority]||'#64748b'};color:white;border-radius:10px;padding:2px 8px;font-size:0.7rem;font-weight:700;">${e.priority}</span></td>
        <td style="font-size:0.68rem;color:#64748b;">${e.savedAt}</td>
        <td style="white-space:nowrap;"><div style="display:flex;gap:5px;justify-content:center;"><button class="btn-sm" style="background:linear-gradient(135deg,#2563a8,#1d4ed8);color:white;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:0.72rem;font-family:'Cairo',sans-serif;font-weight:700;" onclick="abLoadEntry(${e.id})" title="تحميل للتعديل">✏️ تعديل</button><button class="btn-sm btn-sm-danger" onclick="deleteAbEntry(${e.id})" title="حذف هذا الملف">🗑</button></div></td>
      </tr>`).join('')}</tbody>
    </table></div>`;
}

function deleteAbEntry(id) {
  if (!confirm('هل تريد حذف هذا الملف من أرشيف الغياب؟')) return;
  saveAbArchive(getAbArchive().filter(e => e.id !== id)); renderAbArchive(); updateDashboardStats();
}

function clearAbArchive() {
  const archive = getAbArchive();
  if (!archive.length) { alert('📂 الأرشيف فارغ بالفعل.'); return; }
  if (!confirm(`⚠️ تحذير: سيتم حذف جميع ملفات الغياب (${archive.length} ملف) نهائياً.\n\nهل أنت متأكد من المسح الكامل؟`)) return;
  saveAbArchive([]); renderAbArchive(); updateDashboardStats();
}

function exportAbArchiveCSV() {
  const archive = getAbArchive();
  if (!archive.length) { alert('⚠️ الأرشيف فارغ.'); return; }
  const headers = ['#','اسم التلميذ(ة)','رقم مسار','المؤسسة','المستوى','الجنس','إجمالي الساعات','غير مبررة','عدد الأيام','الأسباب','الإجراءات','الحالة','الأولوية','التوصية','تاريخ الحفظ'];
  const rows = archive.map((e,i) => [i+1,e.studentName,e.massar,e.school,e.level,e.gender,e.totalHours,e.unjustifiedHours,e.totalDays,(e.causes||[]).join(' / '),e.procedures.join(' / '),e.priority,e.recommendation,e.savedAt].map(c=>`"${String(c||'').replace(/"/g,'""')}"`));
  const csv = '\uFEFF' + [headers.map(h=>`"${h}"`).join(','), ...rows.map(r=>r.join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download = `ارشيف_التلاميذ_الاكثر_غيابا_${new Date().toISOString().slice(0,10)}.csv`; a.click();
}

function abLoadEntry(id) {
  const entry = getAbArchive().find(e => e.id === id);
  if (!entry) return;
  document.querySelector('#toolAbsence .main-container')?.scrollTo(0,0);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const setV = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v || ''; };
  setV('ab_studentName',       entry.studentName);
  setV('ab_studentMassar',     entry.massar !== '—' ? entry.massar : '');
  setV('ab_school',            entry.school !== '—' ? entry.school : '');
  setV('ab_level',             entry.level  !== '—' ? entry.level  : '');
  setV('ab_parentPhone',       entry.parentPhone !== '—' ? entry.parentPhone : '');
  setV('ab_recordDate',        entry.recordDate || '');
  setV('ab_totalHours',        entry.totalHours !== '—' ? entry.totalHours : '');
  setV('ab_unjustifiedHours',  entry.unjustifiedHours !== '—' ? entry.unjustifiedHours : '');
  setV('ab_totalDays',         entry.totalDays !== '—' ? entry.totalDays : '');
  setV('ab_recommendation',    entry.recommendation);

  const clearG = name => document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.checked = false);
  const setR   = (name, v) => { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; };
  const setChecks = (name, vals) => { clearG(name); (vals||[]).forEach(v => { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; }); };
  clearG('ab_gender');   setR('ab_gender',   entry.gender);
  clearG('ab_semester'); setR('ab_semester', entry.semester);
  clearG('ab_priority'); setR('ab_priority', entry.priority);
  setChecks('ab_cause', entry.causes);

  const procMap = {
    'جلسة استماع':       'ab_chk_listening',
    'اتصال بولي الأمر':  'ab_chk_parent_call',
    'استدعاء ولي الأمر': 'ab_chk_parent_visit',
    'وثيقة التزام':      'ab_chk_commitment',
    'إشعار رسمي':        'ab_chk_warning',
    'متابعة ميدانية':    'ab_chk_followup'
  };
  if (entry.procedureRows && entry.procedureRows.length) {
    abRestoreProcRows(entry.procedureRows);
  } else {
    abResetProcTable();
    (entry.procedures || []).forEach(p => { if (procMap[p]) { const el = document.getElementById(procMap[p]); if (el) el.checked = true; } });
  }

  abShowEditBar(id);
}

function abShowEditBar(id) {
  let bar = document.getElementById('abEditBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'abEditBar';
    bar.style.cssText = 'position:sticky;top:0;z-index:200;background:linear-gradient(135deg,#1d4ed8,#2563a8);color:white;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-bottom:3px solid #fcd34d;';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;font-size:0.88rem;font-weight:700;">
        <span style="font-size:1.2rem;">✏️</span>
        <span>وضع التعديل — تم تحميل ملف الغياب. عدّل ما تريد ثم احفظ.</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="abUpdateEntry()" style="background:#fcd34d;color:#1a3a5c;border:none;border-radius:8px;padding:8px 16px;font-family:'Cairo',sans-serif;font-size:0.84rem;font-weight:800;cursor:pointer;">💾 حفظ التعديلات</button>
        <button onclick="abCancelEdit()" style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);border-radius:8px;padding:8px 14px;font-family:'Cairo',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;">✕ إلغاء</button>
      </div>`;
    const container = document.querySelector('#toolAbsence .main-container');
    if (container) container.insertBefore(bar, container.firstChild);
  }
  bar.style.display = 'flex';
  bar.dataset.editId = id;
}

function abHideEditBar() { const b = document.getElementById('abEditBar'); if (b) b.style.display = 'none'; }

function abCancelEdit() {
  abHideEditBar();
  document.querySelectorAll('#toolAbsence input[type=text], #toolAbsence input[type=date], #toolAbsence input[type=tel], #toolAbsence input[type=number], #toolAbsence textarea').forEach(el => el.value = '');
  document.querySelectorAll('#toolAbsence input[type=radio], #toolAbsence input[type=checkbox]').forEach(el => el.checked = false);
  document.querySelectorAll('#toolAbsence .procedure-details').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('#toolAbsence select').forEach(el => el.selectedIndex = 0);
  abResetProcTable();
}

function abUpdateEntry() {
  const bar = document.getElementById('abEditBar');
  const id = bar ? parseInt(bar.dataset.editId) : null;
  if (!id) return;
  const studentName = val('ab_studentName');
  if (!studentName) { alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
  const procedures = abProcNames();
  const updatedEntry = {
    id, savedAt: new Date().toLocaleString('ar-MA') + ' (معدَّل)',
    recordDate: val('ab_recordDate') || new Date().toISOString().slice(0,10),
    studentName, massar: val('ab_studentMassar') || '—',
    school: val('ab_school') || '—', level: val('ab_level') || '—',
    gender: getRadio('ab_gender') || '—', semester: getRadio('ab_semester') || '—',
    parentPhone: val('ab_parentPhone') || '—',
    totalHours: val('ab_totalHours') || '—', unjustifiedHours: val('ab_unjustifiedHours') || '—',
    totalDays: val('ab_totalDays') || '—',
    causes: getChecked('ab_cause'), procedures, procedureRows: abProcDetails(),
    currentStatus: '—',
    priority: getRadio('ab_priority') || '—',
    recommendation: val('ab_recommendation') || '', nextFollowup: '—'
  };
  const archive = getAbArchive();
  const idx = archive.findIndex(e => e.id === id);
  if (idx !== -1) archive[idx] = updatedEntry; else archive.unshift(updatedEntry);
  saveAbArchive(archive);
  renderAbArchive();
  abHideEditBar();
  abCancelEdit();
  const body = document.getElementById('abArchiveBody');
  if (body && !body.classList.contains('open')) { body.classList.add('open'); document.getElementById('abArchiveArrow').textContent = '▲'; }
  alert(`✅ تم تحديث ملف غياب "${studentName}" في الأرشيف بنجاح.`);
}
