// نسخة مجمَّدة من كود «البحث العام عن تلميذ» القديم (script-10.js قبل المرحلة 32) — مرجع اختبار المطابقة فقط

// ======= GLOBAL STUDENT SEARCH =======
function globalSearchStudents(query) {
  const dropdown = document.getElementById('globalSearchDropdown');
  if (!dropdown) return;
  const q = (query || '').trim();
  if (q.length < 2) { dropdown.style.display = 'none'; return; }

  const norm = (v) => (v||'').replace(/[أإآا]/g,'ا').replace(/[ةه]/g,'ه').replace(/[يى]/g,'ي').toLowerCase();

  // Merge STUDENT_DB + customStudents for full search
  const customList = getCustomStudents ? getCustomStudents() : [];
  const customMapped = customList.map(s => ({
    fullName: s.name || s.fullName || '', class: s.class || '', gender: s.gender || '', massar: s.massar || '', _fromCustom: true
  }));
  const dbBase = StudentDb.list();
  // إذا كان STUDENT_DB فارغاً أعد تحميله من customStudents
  StudentDb.fillIfEmpty(customMapped);
  // Merge: add custom ones not already in STUDENT_DB
  const allDb = [...dbBase];
  customMapped.forEach(c => {
    if (c.fullName && !allDb.find(s => norm(s.fullName) === norm(c.fullName))) allDb.push(c);
  });

  // Search in merged list
  const dbResults = allDb.filter(s => {
    return norm(s.fullName).includes(norm(q)) || (s.massar||'').toLowerCase().startsWith(q.toLowerCase());
  }).slice(0, 8);

  // Search in archives
  const archiveResults = [];
  const allArchive = [
    ...(getArchive ? getArchive() : []).map(e => ({name: e.studentName, school: e.school, type:'مقابلة', icon:'🗂', color:'#1a3a5c'})),
    ...(getRArchive ? getRArchive() : []).map(e => ({name: e.studentName, school: e.school, type:'إدماج', icon:'📋', color:'#16a34a'})),
    ...(getAbArchive ? getAbArchive() : []).map(e => ({name: e.studentName, school: e.school, type:'غياب', icon:'🚨', color:'#d97706'})),
    ...(getVioArchive ? getVioArchive() : []).map(e => ({name: e.studentName, school: e.school, type:'عنف', icon:'🛡️', color:'#dc2626'})),
  ];
  const seenNames = new Set();
  allArchive.forEach(e => {
    if (norm(e.name).includes(norm(q)) && !seenNames.has(e.name)) {
      seenNames.add(e.name); archiveResults.push(e);
    }
  });

  if (!dbResults.length && !archiveResults.length) {
    dropdown.innerHTML = '<div style="padding:12px 14px;color:#64748b;font-size:0.82rem;text-align:center;">🔍 لا توجد نتائج</div>';
    dropdown.style.display = 'block'; return;
  }

  let html = '';
  if (dbResults.length) {
    html += `<div style="padding:6px 12px;font-size:0.7rem;font-weight:700;color:#94a3b8;background:#f8fafc;border-bottom:1px solid #e2e8f0;">👥 من قاعدة التلاميذ</div>`;
    html += dbResults.map(s => `
      <div onclick="globalSearchSelect('${(s.fullName||'').replace(/'/g,"\\'")}','${(s.class||'')}','casefile')"
        style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;transition:background 0.15s;"
        onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background=''">
        <span style="font-size:1rem;">${s.gender==='أنثى'?'👩':'👦'}</span>
        <span style="flex:1;font-weight:700;color:#1a3a5c;font-size:0.84rem;">${s.fullName}</span>
        <span style="background:#eff6ff;color:#1a3a5c;border-radius:6px;padding:1px 7px;font-size:0.7rem;font-weight:700;">${s.class||''}</span>
        <span style="font-size:0.68rem;color:#94a3b8;">${s.massar||''}</span>
      </div>`).join('');
  }
  if (archiveResults.length) {
    html += `<div style="padding:6px 12px;font-size:0.7rem;font-weight:700;color:#94a3b8;background:#f8fafc;border-bottom:1px solid #e2e8f0;border-top:1px solid #e2e8f0;">🗄 من الأرشيف</div>`;
    html += archiveResults.slice(0,5).map(e => `
      <div onclick="globalSearchSelect('${(e.name||'').replace(/'/g,"\\'")}','','casefile')"
        style="padding:9px 14px;cursor:pointer;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:10px;transition:background 0.15s;"
        onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background=''">
        <span>${e.icon}</span>
        <span style="flex:1;font-weight:700;color:${e.color};font-size:0.84rem;">${e.name}</span>
        <span style="background:#f1f5f9;color:#64748b;border-radius:6px;padding:1px 7px;font-size:0.7rem;">${e.type}</span>
      </div>`).join('');
  }
  dropdown.innerHTML = html;
  dropdown.style.display = 'block';
}

function globalSearchSelect(name, cls, dest) {
  const input = document.getElementById('globalSearchInput');
  const dropdown = document.getElementById('globalSearchDropdown');
  if (input) input.value = '';
  if (dropdown) dropdown.style.display = 'none';
  // Navigate to case file and search
  openTool('casefile');
  // بوابة ملف الحالة مكوّن React: نرسل له الاسم بحدث
  window.dispatchEvent(new CustomEvent('legacy:casefile-search', { detail: { name } }));
}

// Close global search dropdown on outside click
document.addEventListener('click', e => {
  const bar = document.getElementById('globalSearchBar');
  if (bar && !bar.contains(e.target)) {
    const dd = document.getElementById('globalSearchDropdown');
    if (dd) dd.style.display = 'none';
  }
});
