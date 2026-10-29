// نسخة مجمَّدة من كود «سجل التلميذ (مقابلات وإدماج)» القديم (script-10.js قبل المرحلة 32) — مرجع اختبار المطابقة فقط

// ======= سجل مقابلات التلميذ =======
// حفظ بيانات السجل المفتوح لاستخدامها في التحميل والطباعة
let _currentHistoryEntries = [];
let _currentHistoryName = '';
let _currentHistoryType = 'interview';

function openStudentHistory(studentName, currentId) {
  const archive = getArchive();
  _currentHistoryEntries = archive
    .filter(e => (e.studentName||'').trim().toLowerCase() === studentName.trim().toLowerCase())
    .sort((a, b) => (a.interviewDate||'').localeCompare(b.interviewDate||''));
  _currentHistoryName = studentName;
  _currentHistoryType = 'interview';
  const _ttl = document.getElementById('studentHistoryModalTitle'); if (_ttl) _ttl.textContent = '📋 سجل مقابلات التلميذ(ة)';

  const pColor = {'عاجلة':'#dc2626','عالية':'#c2410c','متوسطة':'#d97706','عادية':'#16a34a'};
  const pBg    = {'عاجلة':'#fee2e2','عالية':'#fff7ed','متوسطة':'#fffbeb','عادية':'#f0fdf4'};

  const tableRows = _currentHistoryEntries.map((e, idx) => {
    const isCurrent = e.id === currentId;
    const rowBg = isCurrent ? '#eff6ff' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc');
    const priorityBadge = (e.priority && e.priority !== '—')
      ? `<span style="background:${pBg[e.priority]||'#f1f5f9'};color:${pColor[e.priority]||'#64748b'};border:1px solid ${pColor[e.priority]||'#cbd5e1'};border-radius:10px;padding:2px 8px;font-size:0.68rem;font-weight:700;white-space:nowrap;">● ${e.priority}</span>`
      : '<span style="color:#94a3b8;">—</span>';
    return `<tr style="background:${rowBg};${isCurrent?'outline:2px solid #3b82f6;outline-offset:-2px;':''}">
      <td style="text-align:center;color:#94a3b8;font-size:0.73rem;padding:9px 8px;">${idx+1}${isCurrent?'<br><span style="background:#3b82f6;color:white;border-radius:6px;padding:0 5px;font-size:0.60rem;">●</span>':''}</td>
      <td style="text-align:center;font-weight:700;color:#1e293b;padding:9px 10px;white-space:nowrap;">📅 ${e.interviewDate||'—'}</td>
      <td style="padding:9px 10px;max-width:140px;">${e.subject||'—'}</td>
      <td style="text-align:center;padding:9px 8px;">${priorityBadge}</td>
      <td style="padding:9px 10px;font-size:0.75rem;color:#475569;max-width:180px;">${e.currentStatus||'—'}</td>
      <td style="padding:9px 10px;font-size:0.74rem;color:#475569;max-width:200px;">${e.summary ? (e.summary.slice(0,100)+(e.summary.length>100?'…':'')) : '—'}</td>
      <td style="text-align:center;white-space:nowrap;padding:9px 8px;">
        <div style="display:flex;gap:4px;justify-content:center;">
          <button onclick="closeStudentHistoryModal();iLoadEntry(${e.id});" style="background:linear-gradient(135deg,#2563a8,#1d4ed8);color:white;border:none;border-radius:5px;padding:3px 9px;cursor:pointer;font-size:0.70rem;font-family:'Cairo',sans-serif;font-weight:700;" title="تعديل">✏️</button>
          <button onclick="if(confirm('حذف هذه المقابلة؟')){deleteFromArchive(${e.id},true);closeStudentHistoryModal();}" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;border:none;border-radius:5px;padding:3px 9px;cursor:pointer;font-size:0.70rem;font-family:'Cairo',sans-serif;font-weight:700;" title="حذف">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  const table = `<div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-family:'Cairo',sans-serif;font-size:0.78rem;direction:rtl;">
      <thead>
        <tr style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;">
          <th style="padding:10px 8px;font-weight:700;text-align:center;white-space:nowrap;">#</th>
          <th style="padding:10px 10px;font-weight:700;text-align:center;white-space:nowrap;">📅 التاريخ</th>
          <th style="padding:10px 10px;font-weight:700;text-align:right;">📌 الموضوع</th>
          <th style="padding:10px 10px;font-weight:700;text-align:center;white-space:nowrap;">الأولوية</th>
          <th style="padding:10px 10px;font-weight:700;text-align:right;">📊 الحالة</th>
          <th style="padding:10px 10px;font-weight:700;text-align:right;">ملخص المقابلة</th>
          <th style="padding:10px 10px;font-weight:700;text-align:center;white-space:nowrap;">الإجراءات</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>`;

  document.getElementById('studentHistoryModalName').textContent = studentName;
  document.getElementById('studentHistoryModalCount').textContent = `${_currentHistoryEntries.length} مقابلات`;
  document.getElementById('studentHistoryModalBody').innerHTML = _currentHistoryEntries.length
    ? table
    : '<div style="text-align:center;color:#94a3b8;padding:30px;">لا توجد مقابلات.</div>';
  document.getElementById('studentHistoryModal').style.display = 'flex';
}

function closeStudentHistoryModal() {
  const m = document.getElementById('studentHistoryModal');
  if (m) m.style.display = 'none';
}

function printStudentHistory() {
  if (!_currentHistoryEntries.length) return;
  const logoSrc = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? MINISTRY_LOGO_B64 : '';
  const isR = _currentHistoryType === 'reintegration';
  const first = _currentHistoryEntries[0];
  const school = first.school || 'المؤسسة التعليمية';
  const logoHtml = logoSrc ? `<img src="${logoSrc}" style="width:100%;height:auto;max-height:155px;display:block;object-fit:contain;">` : '';
  const rows = isR ? _currentHistoryEntries.map((e, i) => `<tr>
    <td style="text-align:center;">${i+1}</td>
    <td style="text-align:center;white-space:nowrap;">${e.reintegrationDate||'—'}</td>
    <td style="text-align:center;">${e.absenceDuration||'—'}</td>
    <td>${(e.procedures||[]).join(' / ')||'—'}</td>
    <td style="text-align:center;">${e.priority||'—'}</td>
    <td>${e.currentStatus||'—'}</td>
    <td>${e.recommendation||'—'}</td>
  </tr>`).join('') : _currentHistoryEntries.map((e, i) => `<tr>
    <td style="text-align:center;">${i+1}</td>
    <td style="text-align:center;white-space:nowrap;">${e.interviewDate||'—'}</td>
    <td>${e.subject||'—'}</td>
    <td style="text-align:center;">${e.priority||'—'}</td>
    <td>${e.currentStatus||'—'}</td>
    <td>${e.summary||'—'}</td>
    <td style="text-align:center;">${e.nextFollowup||'—'}</td>
  </tr>`).join('');
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
    <title>${isR ? 'سجل إعادة الإدماج' : 'سجل مقابلات'}: ${_currentHistoryName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Cairo',sans-serif;padding:26px 30px;color:#1e293b;direction:rtl;background:white;}
      .report-header{text-align:center;padding-bottom:8px;border-bottom:2px solid black;margin-bottom:14px;}
      .logo-wrap{width:100%;margin-bottom:5px;line-height:0;}
      .nrh-dir{font-family:'Amiri',serif;font-size:0.78rem;font-weight:700;color:black;margin-bottom:2px;}
      .nrh-school{font-family:'Amiri',serif;font-size:0.85rem;font-weight:700;color:black;margin-bottom:4px;}
      .nrh-title{font-family:'Amiri',serif;font-size:1.25rem;font-weight:900;color:black;border-top:1px solid #bbb;padding-top:6px;margin-top:5px;}
      .meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:0.80rem;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:10px;}
      .meta span strong{color:#1e293b;}
      table{width:100%;border-collapse:collapse;font-size:0.77rem;font-family:'Cairo',sans-serif;}
      thead tr{background:#1e293b;color:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      th{padding:8px 10px;text-align:right;font-weight:700;}
      td{padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top;}
      tr:nth-child(even) td{background:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .footer-sig{margin-top:40px;display:flex;justify-content:space-between;}
      .sig-block{text-align:center;font-size:0.80rem;color:#1e293b;}
      .sig-line{width:140px;border-bottom:1.5px solid #333;margin:0 auto 6px;}
      @media print{body{padding:12px 18px;}@page{margin:0;size:A4 portrait;}-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    </style></head><body>
    <div class="report-header">
      <div class="logo-wrap">${logoHtml}</div>
      <div class="nrh-dir">مديرية الحي الحسني</div>
      <div class="nrh-school">${school}</div>
      <div class="nrh-title">${isR ? 'سجل ملفات إعادة الإدماج المدرسي' : 'سجل المقابلات الفردية'}</div>
    </div>
    <div class="meta">
      <span>اسم التلميذ(ة): <strong>${_currentHistoryName}</strong></span>
      <span>${isR ? 'عدد الملفات' : 'عدد المقابلات'}: <strong>${_currentHistoryEntries.length}</strong></span>
      <span>تاريخ الطباعة: <strong>${new Date().toLocaleDateString('ar-MA')}</strong></span>
    </div>
    <table>
      <thead><tr>${isR ? '<th>#</th><th>تاريخ الإدماج</th><th>مدة الانقطاع</th><th>الإجراءات</th><th>الاولوية</th><th>الحالة</th><th>التوصية</th>' : '<th>#</th><th>التاريخ</th><th>الموضوع</th><th>الاولوية</th><th>الحالة</th><th>ملخص المقابلة</th><th>المتابعة القادمة</th>'}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer-sig">
      <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
      <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
    </div>
  </body></html>`;
  const w = window.open('','_blank','width=950,height=680');
  w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>w.print(),700);
}

// ======= سجل ملفات إعادة الإدماج للتلميذ (نفس نافذة سجل المقابلات) =======
function rOpenStudentHistory(studentName, currentId) {
  _currentHistoryEntries = getRArchive()
    .filter(e => (e.studentName||'').trim().toLowerCase() === studentName.trim().toLowerCase())
    .sort((a, b) => (a.reintegrationDate||'').localeCompare(b.reintegrationDate||''));
  _currentHistoryName = studentName;
  _currentHistoryType = 'reintegration';
  const ttl = document.getElementById('studentHistoryModalTitle'); if (ttl) ttl.textContent = '📋 سجل ملفات إعادة الإدماج للتلميذ(ة)';
  const pColor = {'عاجلة':'#dc2626','عالية':'#c2410c','متوسطة':'#d97706','عادية':'#16a34a'};
  const pBg    = {'عاجلة':'#fee2e2','عالية':'#fff7ed','متوسطة':'#fffbeb','عادية':'#f0fdf4'};
  const tableRows = _currentHistoryEntries.map((e, idx) => {
    const isCurrent = e.id === currentId;
    const rowBg = isCurrent ? '#eff6ff' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc');
    const badge = (e.priority && e.priority !== '—')
      ? `<span style="background:${pBg[e.priority]||'#f1f5f9'};color:${pColor[e.priority]||'#64748b'};border:1px solid ${pColor[e.priority]||'#cbd5e1'};border-radius:10px;padding:2px 8px;font-size:0.68rem;font-weight:700;white-space:nowrap;">● ${e.priority}</span>`
      : '<span style="color:#94a3b8;">—</span>';
    return `<tr style="background:${rowBg};${isCurrent?'outline:2px solid #3b82f6;outline-offset:-2px;':''}">
      <td style="text-align:center;color:#94a3b8;font-size:0.73rem;padding:9px 8px;">${idx+1}${isCurrent?'<br><span style="background:#3b82f6;color:white;border-radius:6px;padding:0 5px;font-size:0.60rem;">●</span>':''}</td>
      <td style="text-align:center;font-weight:700;color:#1e293b;padding:9px 10px;white-space:nowrap;">📅 ${e.reintegrationDate||'—'}</td>
      <td style="text-align:center;padding:9px 10px;">${e.absenceDuration||'—'}</td>
      <td style="padding:9px 10px;font-size:0.74rem;color:#475569;max-width:220px;">${(e.procedures||[]).join(' / ')||'—'}</td>
      <td style="text-align:center;padding:9px 8px;">${badge}</td>
      <td style="padding:9px 10px;font-size:0.75rem;color:#475569;">${e.currentStatus||'—'}</td>
      <td style="text-align:center;white-space:nowrap;padding:9px 8px;">
        <div style="display:flex;gap:4px;justify-content:center;">
          <button onclick="closeStudentHistoryModal();rLoadEntry(${e.id});" style="background:linear-gradient(135deg,#2563a8,#1d4ed8);color:white;border:none;border-radius:5px;padding:3px 9px;cursor:pointer;font-size:0.70rem;font-family:'Cairo',sans-serif;font-weight:700;" title="تعديل">✏️</button>
          <button onclick="if(confirm('حذف هذا الملف؟')){deleteREntry(${e.id},true);closeStudentHistoryModal();}" style="background:linear-gradient(135deg,#dc2626,#b91c1c);color:white;border:none;border-radius:5px;padding:3px 9px;cursor:pointer;font-size:0.70rem;font-family:'Cairo',sans-serif;font-weight:700;" title="حذف">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  const table = `<div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-family:'Cairo',sans-serif;font-size:0.78rem;direction:rtl;">
      <thead><tr style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;">
        <th style="padding:10px 8px;font-weight:700;text-align:center;">#</th>
        <th style="padding:10px 10px;font-weight:700;text-align:center;white-space:nowrap;">📅 تاريخ الإدماج</th>
        <th style="padding:10px 10px;font-weight:700;text-align:center;">مدة الانقطاع</th>
        <th style="padding:10px 10px;font-weight:700;text-align:right;">الإجراءات</th>
        <th style="padding:10px 10px;font-weight:700;text-align:center;">الأولوية</th>
        <th style="padding:10px 10px;font-weight:700;text-align:right;">📊 الحالة</th>
        <th style="padding:10px 10px;font-weight:700;text-align:center;">إجراء</th>
      </tr></thead>
      <tbody>${tableRows}</tbody>
    </table></div>`;
  document.getElementById('studentHistoryModalName').textContent = studentName;
  document.getElementById('studentHistoryModalCount').textContent = `${_currentHistoryEntries.length} ملفات`;
  document.getElementById('studentHistoryModalBody').innerHTML = _currentHistoryEntries.length ? table : '<div style="text-align:center;color:#94a3b8;padding:30px;">لا توجد ملفات.</div>';
  document.getElementById('studentHistoryModal').style.display = 'flex';
}
