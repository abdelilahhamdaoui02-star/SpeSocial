// نسخة مجمَّدة حرفياً من كتلة «الإشعارات وجدول التتبع الشهري» في script-10.js قبل الخطوة 45 (للمطابقة فقط، لا تُحمَّل في التطبيق).
// ── Notifications ──
function getAllNotifs() {
  const today = new Date(); today.setHours(0,0,0,0);
  const allItems = [];
  getArchive().forEach(e => {
    if (e.nextFollowup && e.nextFollowup !== '—') {
      const d = new Date(e.nextFollowup); d.setHours(0,0,0,0);
      if (!isNaN(d)) allItems.push({ date: d, dateStr: e.nextFollowup, student: e.studentName, school: e.school, type: 'مقابلة فردية', icon: '🗂', priority: e.priority, id: e.id, archiveType: 'interview' });
    }
  });
  getRArchive().forEach(e => {
    if (e.nextFollowup && e.nextFollowup !== '—') {
      const d = new Date(e.nextFollowup); d.setHours(0,0,0,0);
      if (!isNaN(d)) allItems.push({ date: d, dateStr: e.nextFollowup, student: e.studentName, school: e.school, type: 'إدماج مدرسي', icon: '📋', priority: e.priority, id: e.id, archiveType: 'reintegration' });
    }
  });
  getAbArchive().forEach(e => {
    if (e.nextFollowup && e.nextFollowup !== '—') {
      const d = new Date(e.nextFollowup); d.setHours(0,0,0,0);
      if (!isNaN(d)) allItems.push({ date: d, dateStr: e.nextFollowup, student: e.studentName, school: e.school, type: 'ملف غياب', icon: '🚨', priority: e.priority, id: e.id, archiveType: 'absence' });
    }
  });
  (getSnArchive ? getSnArchive() : []).forEach(e => {
    if (e.nextFollowup && e.nextFollowup !== '—') {
      const d = new Date(e.nextFollowup); d.setHours(0,0,0,0);
      if (!isNaN(d)) allItems.push({ date: d, dateStr: e.nextFollowup, student: e.studentName, school: e.school, type: 'وضعية إعاقة', icon: '♿', priority: e.priority, id: e.id, archiveType: 'specialNeeds' });
    }
  });
  (getVioArchive ? getVioArchive() : []).forEach(e => {
    if (e.nextFollowup && e.nextFollowup !== '—') {
      const d = new Date(e.nextFollowup); d.setHours(0,0,0,0);
      if (!isNaN(d)) allItems.push({ date: d, dateStr: e.nextFollowup, student: e.studentName, school: e.school, type: 'حالة عنف', icon: '🛡️', priority: e.priority, id: e.id, archiveType: 'violence' });
    }
  });
  return { allItems, today };
}


function notifGetArchive(type) {
  if (type === 'interview')    return getArchive();
  if (type === 'reintegration') return getRArchive();
  if (type === 'absence')      return getAbArchive();
  if (type === 'specialNeeds') return getSnArchive ? getSnArchive() : [];
  if (type === 'violence')     return getVioArchive ? getVioArchive() : [];
  return [];
}

function notifSaveArchive(type, data) {
  if (type === 'interview')    { saveArchive(data); return; }
  if (type === 'reintegration') { saveRArchive(data); return; }
  if (type === 'absence')      { saveAbArchive(data); return; }
  if (type === 'specialNeeds') { if (saveSnArchive) saveSnArchive(data); return; }
  if (type === 'violence') {
    if (window.appData) { appData.violenceArchive = data; if (window.saveUserKey) saveUserKey('violenceArchive'); }
    return;
  }
}

function notifGetLogs(archiveType, entryId) {
  if (!archiveType || !entryId) return [];
  const arc = notifGetArchive(archiveType);
  const entry = arc.find(e => e.id === entryId);
  return entry ? (entry.trackingLogs || []) : [];
}

// ══════════════════════════════════════════════════════════════
//  جدول التتبع الشهري الشامل
// ══════════════════════════════════════════════════════════════

function getAllTrackingLogs() {
  const types = ['interview','reintegration','absence','specialNeeds','violence'];
  const typeLabels = {
    interview: 'مقابلة فردية',
    reintegration: 'إعادة الإدماج',
    absence: 'الغياب',
    specialNeeds: 'الاحتياجات الخاصة',
    violence: 'العنف المدرسي'
  };
  const typeIcons = {
    interview: '🗂️', reintegration: '🔄', absence: '⚠️',
    specialNeeds: '♿', violence: '🛡️'
  };
  const rows = [];
  types.forEach(type => {
    const arc = notifGetArchive(type);
    arc.forEach(entry => {
      const logs = entry.trackingLogs || [];
      logs.forEach(log => {
        rows.push({
          archiveType: type,
          typeLabel: typeLabels[type] || type,
          typeIcon: typeIcons[type] || '📋',
          entryId: entry.id,
          studentName: entry.studentName || '—',
          school: entry.school || '—',
          level: entry.level || '—',
          priority: entry.priority || '—',
          trackDate: log.date || '—',
          trackResult: log.result || '—',
          trackNote: log.note || '—',
          trackBy: log.by || '—',
          trackActions: (entry.procedures || []).join('، ') || '—',
          nextDate: log.nextDate || '—',
          savedAt: log.savedAt || '—',
          logId: log.id,
          summary: entry.summary || entry.specialistNotes || '—'
        });
      });
    });
  });
  // Sort by trackDate desc
  rows.sort((a,b) => {
    if (a.trackDate === '—') return 1;
    if (b.trackDate === '—') return -1;
    return b.trackDate.localeCompare(a.trackDate);
  });
  return rows;
}

function populateMonthFilter() {
  const rows = getAllTrackingLogs();
  const months = new Set();
  rows.forEach(r => {
    if (r.trackDate && r.trackDate !== '—' && r.trackDate.length >= 7) {
      months.add(r.trackDate.slice(0,7));
    }
  });
  const sel = document.getElementById('trackTableMonthFilter');
  if (!sel) return;
  const current = sel.value;
  sel.innerHTML = '<option value="">📅 كل الأشهر</option>';
  const sorted = [...months].sort().reverse();
  sorted.forEach(m => {
    const [y, mo] = m.split('-');
    const label = new Date(+y, +mo-1, 1).toLocaleDateString('ar-MA', {year:'numeric', month:'long'});
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = label;
    sel.appendChild(opt);
  });
  if (current) sel.value = current;
}

function renderTrackingTable() {
  populateMonthFilter();
  let rows = getAllTrackingLogs();
  const monthFilter = (document.getElementById('trackTableMonthFilter')?.value || '');
  const typeFilter  = (document.getElementById('trackTableTypeFilter')?.value || '');
  const search      = (document.getElementById('trackTableSearch')?.value || '').trim().toLowerCase();

  if (monthFilter) rows = rows.filter(r => r.trackDate.startsWith(monthFilter));
  if (typeFilter)  rows = rows.filter(r => r.archiveType === typeFilter);
  if (search)      rows = rows.filter(r =>
    r.studentName.toLowerCase().includes(search) ||
    r.trackNote.toLowerCase().includes(search) ||
    r.trackActions.toLowerCase().includes(search) ||
    r.summary.toLowerCase().includes(search) ||
    r.trackBy.toLowerCase().includes(search)
  );

  // KPIs
  const total = rows.length;
  const improved  = rows.filter(r => r.trackResult.includes('تحسن') || r.trackResult.includes('مستقرة')).length;
  const needsAttn = rows.filter(r => r.trackResult.includes('تراجع') || r.trackResult.includes('متأخرة')).length;
  const pending   = rows.filter(r => r.trackResult.includes('قيد المتابعة')).length;
  const kpis = document.getElementById('trackTableKpis');
  if (kpis) {
    kpis.innerHTML = `
      <div style="padding:12px;text-align:center;border-left:1px solid #e2e8f0;">
        <div style="font-size:1.5rem;font-weight:800;color:#1a3a5c;">${total}</div>
        <div style="font-size:0.68rem;color:#64748b;font-weight:600;">إجمالي جلسات التتبع</div>
      </div>
      <div style="padding:12px;text-align:center;border-left:1px solid #e2e8f0;">
        <div style="font-size:1.5rem;font-weight:800;color:#16a34a;">${improved}</div>
        <div style="font-size:0.68rem;color:#64748b;font-weight:600;">تحسن / مستقر</div>
      </div>
      <div style="padding:12px;text-align:center;border-left:1px solid #e2e8f0;">
        <div style="font-size:1.5rem;font-weight:800;color:#d97706;">${pending}</div>
        <div style="font-size:0.68rem;color:#64748b;font-weight:600;">لا يزال قيد المتابعة</div>
      </div>
      <div style="padding:12px;text-align:center;">
        <div style="font-size:1.5rem;font-weight:800;color:#dc2626;">${needsAttn}</div>
        <div style="font-size:0.68rem;color:#64748b;font-weight:600;">يستدعي تدخلاً</div>
      </div>`;
  }

  const countEl = document.getElementById('trackTableCount');
  if (countEl) countEl.textContent = `${total} سجل تتبع`;
  const lastUpd = document.getElementById('trackTableLastUpdate');
  if (lastUpd) lastUpd.textContent = new Date().toLocaleDateString('ar-MA', {year:'numeric',month:'long',day:'numeric'});

  const container = document.getElementById('trackingTableContainer');
  if (!container) return;

  if (!rows.length) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:#64748b;font-size:0.85rem;"><div style="font-size:2.5rem;margin-bottom:10px;">📂</div>لا توجد سجلات تتبع للمعايير المحددة.</div>`;
    return;
  }

  const sColor = {'✅ تحسن ملحوظ':'#16a34a','🟢 وضعية مستقرة':'#16a34a','🔶 لا يزال قيد المتابعة':'#d97706','🔴 تراجع — يستدعي تدخلاً':'#dc2626','🏛️ تمت الإحالة':'#7c3aed','✔️ انتهت المتابعة':'#0f766e'};
  const sBg   = {'✅ تحسن ملحوظ':'#f0fdf4','🟢 وضعية مستقرة':'#f0fdf4','🔶 لا يزال قيد المتابعة':'#fffbeb','🔴 تراجع — يستدعي تدخلاً':'#fef2f2','🏛️ تمت الإحالة':'#f5f3ff','✔️ انتهت المتابعة':'#f0fdfa'};

  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:0.78rem;font-family:'Cairo',sans-serif;">
      <thead>
        <tr style="background:linear-gradient(135deg,#0a1f3d,#1a3a5c);color:white;position:sticky;top:0;z-index:2;">
          <th style="padding:10px 8px;text-align:center;font-weight:700;min-width:32px;">#</th>
          <th style="padding:10px 12px;text-align:right;font-weight:700;min-width:120px;">👤 التلميذ(ة)</th>
          <th style="padding:10px 12px;text-align:right;font-weight:700;min-width:90px;">📂 النوع</th>
          <th style="padding:10px 12px;text-align:right;font-weight:700;min-width:95px;">📅 تاريخ التتبع</th>
          <th style="padding:10px 12px;text-align:right;font-weight:700;min-width:140px;">📊 نتيجة المتابعة</th>
          <th style="padding:10px 12px;text-align:right;font-weight:700;min-width:160px;">📝 ملخص الجلسة</th>
          <th style="padding:10px 12px;text-align:right;font-weight:700;min-width:160px;">الإجراءات المتخذة</th>
          <th style="padding:10px 12px;text-align:right;font-weight:700;min-width:90px;">👤 المتابِع</th>
          <th style="padding:10px 12px;text-align:right;font-weight:700;min-width:90px;">📅 الموعد القادم</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((r, idx) => `
          <tr style="background:${idx%2===0?'#ffffff':'#f8fafc'};border-bottom:1px solid #e2e8f0;transition:background 0.15s;" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='${idx%2===0?'#ffffff':'#f8fafc'}'">
            <td style="padding:9px 8px;text-align:center;color:#94a3b8;font-weight:600;">${idx+1}</td>
            <td style="padding:9px 12px;">
              <div style="font-weight:700;color:#1a3a5c;font-size:0.82rem;">${r.studentName}</div>
              <div style="font-size:0.68rem;color:#64748b;margin-top:2px;">${r.school} ${r.level && r.level!=='—' ? '· '+r.level : ''}</div>
              ${r.priority && r.priority!=='—' ? `<div style="font-size:0.65rem;color:#d97706;font-weight:700;margin-top:1px;">● ${r.priority}</div>` : ''}
            </td>
            <td style="padding:9px 12px;">
              <span style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:3px 7px;font-size:0.72rem;font-weight:700;color:#475569;">${r.typeIcon} ${r.typeLabel}</span>
            </td>
            <td style="padding:9px 12px;font-weight:700;color:#1a3a5c;white-space:nowrap;">📅 ${r.trackDate}</td>
            <td style="padding:9px 12px;">
              <span style="background:${sBg[r.trackResult]||'#f1f5f9'};color:${sColor[r.trackResult]||'#475569'};border:1px solid ${sColor[r.trackResult]||'#cbd5e1'}40;border-radius:8px;padding:3px 8px;font-size:0.73rem;font-weight:700;">${r.trackResult||'—'}</span>
            </td>
            <td style="padding:9px 12px;color:#374151;max-width:180px;">
              <div style="font-size:0.75rem;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;" title="${r.trackNote}">${r.trackNote!=='—'?r.trackNote:(r.summary!=='—'?r.summary:'—')}</div>
            </td>
            <td style="padding:9px 12px;color:#374151;max-width:180px;">
              ${r.trackActions && r.trackActions!=='—'
                ? r.trackActions.split('، ').map(a=>`<span style="display:inline-block;background:#f0f4ff;border:1px solid #c7d2fe;border-radius:5px;padding:2px 6px;font-size:0.67rem;color:#3730a3;font-weight:600;margin:1px 2px;">${a}</span>`).join('')
                : '<span style="color:#94a3b8;font-size:0.75rem;">—</span>'}
            </td>
            <td style="padding:9px 12px;color:#475569;font-size:0.75rem;white-space:nowrap;">${r.trackBy!=='—'?r.trackBy:'—'}</td>
            <td style="padding:9px 12px;white-space:nowrap;">
              ${r.nextDate && r.nextDate!=='—'
                ? `<span style="color:#0f766e;font-weight:700;font-size:0.75rem;">📅 ${r.nextDate}</span>`
                : '<span style="color:#94a3b8;font-size:0.75rem;">—</span>'}
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function downloadMonthlyTrackingTable() {
  let rows = getAllTrackingLogs();
  const monthFilter = (document.getElementById('trackTableMonthFilter')?.value || '');
  const typeFilter  = (document.getElementById('trackTableTypeFilter')?.value || '');
  const search      = (document.getElementById('trackTableSearch')?.value || '').trim().toLowerCase();

  if (monthFilter) rows = rows.filter(r => r.trackDate.startsWith(monthFilter));
  if (typeFilter)  rows = rows.filter(r => r.archiveType === typeFilter);
  if (search)      rows = rows.filter(r =>
    r.studentName.toLowerCase().includes(search) ||
    r.trackNote.toLowerCase().includes(search) ||
    r.trackActions.toLowerCase().includes(search)
  );

  const date = new Date().toLocaleDateString('ar-MA', {year:'numeric',month:'long',day:'numeric'});
  let monthLabel = 'كل الأشهر';
  if (monthFilter) {
    const [y, mo] = monthFilter.split('-');
    monthLabel = new Date(+y, +mo-1, 1).toLocaleDateString('ar-MA', {year:'numeric', month:'long'});
  }

  const sColor = {'✅ تحسن ملحوظ':'#16a34a','🟢 وضعية مستقرة':'#16a34a','🔶 لا يزال قيد المتابعة':'#d97706','🔴 تراجع — يستدعي تدخلاً':'#dc2626','🏛️ تمت الإحالة':'#7c3aed','✔️ انتهت المتابعة':'#0f766e'};
  const sBg   = {'✅ تحسن ملحوظ':'#f0fdf4','🟢 وضعية مستقرة':'#f0fdf4','🔶 لا يزال قيد المتابعة':'#fffbeb','🔴 تراجع — يستدعي تدخلاً':'#fef2f2','🏛️ تمت الإحالة':'#f5f3ff','✔️ انتهت المتابعة':'#f0fdfa'};

  const total    = rows.length;
  const improved = rows.filter(r => r.trackResult.includes('تحسن') || r.trackResult.includes('مستقرة')).length;
  const needsAttn= rows.filter(r => r.trackResult.includes('تراجع')).length;
  const pending  = rows.filter(r => r.trackResult.includes('قيد المتابعة')).length;

  // ── Group rows by student ──
  const byStudent = {};
  rows.forEach(r => {
    const key = r.studentName + '||' + r.archiveType + '||' + r.entryId;
    if (!byStudent[key]) byStudent[key] = { info: r, logs: [] };
    byStudent[key].logs.push(r);
  });

  // helper: strip emojis
  function stripEmoji(str) {
    return (str||'').replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F300}-\u{1F9FF}]|[\u2702-\u27B0]|[\uD83C-\uDBFF\uDC00-\uDFFF]|[✅✔️🔶🔴🟢🟣🏛️📅📊📝⚙️👤📂📋🔔⚠️🛡️♿🗂️🔄]/gu, '').trim();
  }

  // ── Build one card per student ──
  const studentCards = Object.values(byStudent).map((s, si) => {
    const inf = s.info;
    const lastResult = stripEmoji(s.logs[s.logs.length - 1]?.trackResult || '—');

    const logRows = s.logs.map((lg, li) => `
      <tr style="background:${li%2===0?'#fff':'#f5f5f5'};">
        <td style="padding:3px 6px;border:0.5px solid #999;text-align:center;color:#000;font-size:7.5pt;">${li+1}</td>
        <td style="padding:3px 6px;border:0.5px solid #999;font-weight:700;color:#000;white-space:nowrap;font-size:7.5pt;">${lg.trackDate}</td>
        <td style="padding:3px 6px;border:0.5px solid #999;color:#000;font-size:7.5pt;font-weight:700;">${stripEmoji(lg.trackResult)||'—'}</td>
        <td style="padding:3px 6px;border:0.5px solid #999;color:#000;font-size:7.5pt;">${lg.trackNote!=='—'?lg.trackNote:'—'}</td>
        <td style="padding:3px 6px;border:0.5px solid #999;color:#000;font-size:7.5pt;word-break:break-word;white-space:normal;">${lg.trackBy!=='—'?lg.trackBy:'—'}</td>
        <td style="padding:3px 6px;border:0.5px solid #999;color:#000;font-weight:700;font-size:7.5pt;white-space:nowrap;">${lg.nextDate!=='—'?lg.nextDate:'—'}</td>
      </tr>`).join('');

    return `
    <div class="student-card">
      <!-- Student header -->
      <div style="background:#1a3a5c;padding:6px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="background:#c8a94a;color:#000;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:8pt;font-weight:800;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;">${si+1}</div>
          <div>
            <div style="color:#fff;font-size:9pt;font-weight:800;">${inf.studentName}</div>
            <div style="color:rgba(255,255,255,0.8);font-size:6.5pt;margin-top:1px;">${stripEmoji(inf.typeLabel)} &nbsp;|&nbsp; ${inf.school}${inf.level!=='—'?' — '+inf.level:''}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
          ${inf.priority!=='—'?`<span style="background:rgba(255,255,255,0.2);color:#fff;border-radius:3px;padding:2px 6px;font-size:6.5pt;font-weight:700;">${inf.priority}</span>`:''}
          <span style="background:rgba(255,255,255,0.9);color:#000;border-radius:3px;padding:2px 6px;font-size:6.5pt;font-weight:700;">${lastResult}</span>
          <span style="background:rgba(255,255,255,0.15);color:#fff;border-radius:3px;padding:2px 6px;font-size:6.5pt;">${s.logs.length} جلسة</span>
        </div>
      </div>
      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;font-family:'Cairo',sans-serif;table-layout:fixed;border:0.5px solid #999;">
        <colgroup>
          <col style="width:20px">
          <col style="width:65px">
          <col style="width:95px">
          <col>
          <col style="width:80px">
          <col style="width:75px">
        </colgroup>
        <thead>
          <tr style="background:#1a3a5c;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
            <th style="padding:3px 5px;text-align:center;font-size:7pt;font-weight:700;border:0.5px solid #2d4f72;">#</th>
            <th style="padding:3px 5px;text-align:right;font-size:7pt;font-weight:700;border:0.5px solid #2d4f72;">تاريخ التتبع</th>
            <th style="padding:3px 5px;text-align:right;font-size:7pt;font-weight:700;border:0.5px solid #2d4f72;">نتيجة المتابعة</th>
            <th style="padding:3px 5px;text-align:right;font-size:7pt;font-weight:700;border:0.5px solid #2d4f72;">ملخص الجلسة</th>
            <th style="padding:3px 5px;text-align:right;font-size:7pt;font-weight:700;border:0.5px solid #2d4f72;">المتابع</th>
            <th style="padding:3px 5px;text-align:right;font-size:7pt;font-weight:700;border:0.5px solid #2d4f72;">الموعد القادم</th>
          </tr>
        </thead>
        <tbody>${logRows}</tbody>
      </table>
      <!-- Signature strip -->
      <div style="display:flex;justify-content:space-around;padding:5px 16px 4px;border:0.5px solid #999;border-top:none;background:#fafafa;gap:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #000;margin-bottom:3px;margin-top:12px;"></div>
          <span style="font-size:6pt;color:#000;">المختص الاجتماعي</span>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #000;margin-bottom:3px;margin-top:12px;"></div>
          <span style="font-size:6pt;color:#000;">مدير المؤسسة</span>
        </div>
      </div>
    </div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>سجلات التتبع — ${monthLabel}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', sans-serif; background: white; color: #000; font-size: 9pt; }
  .page-header { background: #1a3a5c; color: white; padding: 8px 14px; text-align: center; margin-bottom: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page-header .ministry { font-size: 6.5pt; opacity: 0.8; margin-bottom: 3px; }
  .page-header h1 { font-size: 10.5pt; font-weight: 800; color: #f0d97a; margin-bottom: 3px; }
  .page-header .period { font-size: 7pt; opacity: 0.85; }
  .kpi-bar { display: flex; border: 0.5px solid #999; overflow: hidden; margin: 0 0 10px; }
  .kpi-bar .k { flex: 1; padding: 5px 4px; text-align: center; border-left: 0.5px solid #999; }
  .kpi-bar .k:last-child { border-left: none; }
  .kpi-bar .kv { font-size: 12pt; font-weight: 800; color: #000; line-height: 1; }
  .kpi-bar .kl { font-size: 6pt; color: #000; font-weight: 600; margin-top: 2px; }
  .content { padding: 0; }
  .student-card { page-break-inside: avoid; margin-bottom: 10px; }
  @media print {
    @page { size: A4; margin: 0; }
    body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .student-card { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div style="padding:6px 14px 0;">${printLogoImg(90)}</div>
  <div class="page-header">
    <h1>سجلات التتبع والمواكبة الفردية</h1>
    <div class="period">الفترة: ${monthLabel} &nbsp;|&nbsp; ${total} جلسة تتبع &nbsp;|&nbsp; ${Object.keys(byStudent).length} تلميذ(ة)</div>
  </div>

  <div class="content">${rows.length ? studentCards : '<div style="text-align:center;padding:30px;color:#000;">لا توجد سجلات تتبع للفترة المحددة.</div>'}</div>
</body></html>`;

  const printWin = window.open('', '_blank');
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => { printWin.print(); }, 600);
}

