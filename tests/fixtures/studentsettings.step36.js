// مجمَّد من script-10.js وscript-11.js قبل الخطوة 36 (قسم قائمة التلاميذ في الإعدادات)
// اقتراحات القسم في نموذج الإضافة: أقسام اللائحة الحالية، والكتابة الحرة مسموحة لقسم جديد
function fillNewStudentClassList() {
  const dl = document.getElementById('newStudentClassList');
  if (!dl) return;
  dl.innerHTML = getImportedClasses().map(c => '<option value="' + String(c).replace(/"/g, '&quot;') + '"></option>').join('');
}

function addStudentToList() {
  const family = document.getElementById('newStudentFamily')?.value.trim() || '';
  const given = document.getElementById('newStudentGiven')?.value.trim() || '';
  const name = (family + ' ' + given).trim();
  const cls = (document.getElementById('newStudentClass')?.value || '').trim();
  const gender = document.getElementById('newStudentGender')?.value;
  const massar = (document.getElementById('newStudentMassar')?.value || '').trim();
  const dob = StudentList.normalizeDob(document.getElementById('newStudentDob')?.value || '');
  const msg = document.getElementById('settingsStudentMsg');
  if (!name || name.length < 3) { if(msg){msg.style.color='#dc2626';msg.textContent='⚠️ أدخل اسماً كاملاً (3 أحرف على الأقل)';} return; }

  // Add to STUDENTS array if accessible
  const newStudent = { name, family, given, class: cls||'', gender: gender||'', massar, dob };
  try {
    if (typeof STUDENTS !== 'undefined') {
      // check no duplicate
      if (!STUDENTS.some(s => s.name === name)) { STUDENTS.push(newStudent); }
    }
  } catch(e) {}

  // Also save to custom list
  const custom = getCustomStudents();
  if (!custom.some(s => s.name === name)) { custom.push(newStudent); saveCustomStudents(custom); }

  // Immediately inject into STUDENT_DB for search
  try {
    StudentDb.mergeCustom([newStudent]);
  } catch(e) {}

  if (msg) { msg.style.color='#16a34a'; msg.textContent=`✅ تمت إضافة "${name}" للقائمة.`; }
  ['newStudentFamily', 'newStudentGiven', 'newStudentMassar', 'newStudentDob'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  try { updateAllLevelSelects(); fillNewStudentClassList(); } catch(e) {}
  window.dispatchEvent(new Event('legacy:students-changed'));
  setTimeout(() => { if(msg) msg.textContent=''; }, 3000);
}

function searchStudentInSettings() {
  const q = document.getElementById('delStudentSearch')?.value.trim().toLowerCase();
  const container = document.getElementById('settingsStudentResults');
  const bar = document.getElementById('bulkActionBar');
  if (!container) return;
  if (!q || q.length < 1) {
    container.innerHTML = '';
    if (bar) bar.style.display = 'none';
    return;
  }

  const custom = getCustomStudents();
  const list = StudentDb.list();
  const allStudents = [...custom, ...list.filter(s => !custom.some(c => c.name === s.name || c.fullName === s.name))];
  const found = allStudents.filter(s => {
    const name = s.name || s.fullName || '';
    const cls  = s.class || '';
    return name.toLowerCase().includes(q) || cls.toLowerCase().includes(q);
  });

  if (!found.length) {
    container.innerHTML = '<div style="font-size:0.78rem;color:var(--text-muted);padding:8px;">لا توجد نتائج.</div>';
    if (bar) bar.style.display = 'none';
    return;
  }

  if (bar) bar.style.display = 'flex';
  updateBulkBar();

  const limit = Math.min(found.length, 50);
  container.innerHTML = found.slice(0, limit).map((s, i) => {
    const name = s.name || s.fullName || '';
    const safeName = name.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--border);border-radius:6px;margin-bottom:4px;background:white;font-size:0.8rem;">
      <input type="checkbox" class="student-select-cb" data-name="${safeName}" onchange="updateBulkBar()" style="width:15px;height:15px;accent-color:#dc2626;cursor:pointer;flex-shrink:0;">
      <span style="flex:1;color:var(--primary);font-weight:600;">${name}</span>
      <span style="color:var(--text-muted);font-size:0.72rem;white-space:nowrap;">${s.class||''} ${s.gender||''}</span>
    </div>`;
  }).join('') + (found.length > limit ? `<div style="font-size:0.74rem;color:#64748b;text-align:center;padding:6px;">... و ${found.length - limit} نتيجة إضافية. دقق البحث للتضييق.</div>` : '');
}

function updateBulkBar() {
  const cbs = document.querySelectorAll('.student-select-cb');
  const checked = document.querySelectorAll('.student-select-cb:checked');
  const label = document.getElementById('selectedCountLabel');
  const delBtn = document.getElementById('deleteSelectedBtn');
  const selectAll = document.getElementById('selectAllStudents');
  if (label) label.textContent = checked.length + ' محدد(ة)';
  if (delBtn) delBtn.style.display = checked.length > 0 ? 'inline-block' : 'none';
  if (selectAll) selectAll.checked = cbs.length > 0 && checked.length === cbs.length;
}

function toggleSelectAllStudents(cb) {
  document.querySelectorAll('.student-select-cb').forEach(c => c.checked = cb.checked);
  updateBulkBar();
}

function deleteSelectedStudents() {
  const checked = document.querySelectorAll('.student-select-cb:checked');
  if (!checked.length) return;
  const names = Array.from(checked).map(c => c.dataset.name);
  if (!confirm(`🗑 هل تريد حذف ${names.length} تلميذ(ة) من القائمة؟\n\n${names.slice(0,5).join('\n')}${names.length > 5 ? '\n...' : ''}`)) return;

  let custom = getCustomStudents();
  custom = custom.filter(s => !names.includes(s.name) && !names.includes(s.fullName));
  saveCustomStudents(custom);

  StudentDb.removeByNames(names);

  const msg = document.getElementById('settingsStudentMsg');
  if (msg) { msg.style.color = '#dc2626'; msg.textContent = `✅ تم حذف ${names.length} تلميذ(ة) بنجاح.`; }
  searchStudentInSettings();
}

function removeStudentFromCustom(name, btn) {
  if (!confirm(`هل تريد حذف "${name}" من القائمة؟`)) return;
  let custom = getCustomStudents();
  custom = custom.filter(s => s.name !== name);
  saveCustomStudents(custom);
  try {
    StudentDb.removeByName(name);
  } catch(e) {}
  if (btn) btn.closest('div[style]').remove();
}



function checkStudentBackupAvailable() {
  const backupKey = currentUser ? 'app:customStudents_backup:' + currentUser : 'app:customStudents_backup';
  try {
    const backup = localStorage.getItem(backupKey);
    const date   = localStorage.getItem(backupKey + ':date') || '';
    const count  = localStorage.getItem(backupKey + ':count') || '0';
    const box    = document.getElementById('restoreBackupBox');
    const info   = document.getElementById('restoreBackupInfo');
    if (box && backup && JSON.parse(backup).length > 0) {
      box.style.display = 'block';
      if (info) info.textContent = `📅 آخر نسخة: ${date} — ${count} تلميذ(ة)`;
    } else if (box) {
      box.style.display = 'none';
    }
  } catch(e) {}
}

function restoreStudentBackup() {
  const backupKey = currentUser ? 'app:customStudents_backup:' + currentUser : 'app:customStudents_backup';
  const count = localStorage.getItem(backupKey + ':count') || '0';
  const date  = localStorage.getItem(backupKey + ':date') || '';
  if (!confirm(`↩️ هل تريد استعادة القائمة السابقة؟\n\n📋 ${count} تلميذ(ة) — ${date}\n\nسيتم استبدال القائمة الحالية بالقائمة المحفوظة.`)) return;
  try {
    const backup = localStorage.getItem(backupKey);
    if (!backup) { alert('لا توجد نسخة احتياطية.'); return; }
    const list = JSON.parse(backup);
    if (!list.length) { alert('النسخة الاحتياطية فارغة.'); return; }
    StudentDb.replaceRaw(list);
    saveCustomStudents(list);
    localStorage.removeItem(backupKey);
    localStorage.removeItem(backupKey + ':date');
    localStorage.removeItem(backupKey + ':count');
    const box = document.getElementById('restoreBackupBox');
    if (box) box.style.display = 'none';
    const msg = document.getElementById('settingsStudentMsg');
    if (msg) { msg.style.color = '#1d4ed8'; msg.textContent = `✅ تمت الاستعادة بنجاح — ${list.length} تلميذ(ة).`; }
  } catch(e) { alert('خطأ أثناء الاستعادة.'); }
}

function clearAllStudents() {
  const count = StudentDb.count();
  if (!confirm(`⚠️ هل أنت متأكد من حذف جميع التلاميذ (${count} تلميذ) من قاعدة البيانات نهائياً؟\n\nملاحظة: الأرشيف والسجلات لن تُحذف.`)) return;
  StudentDb.clear();
  try {
    // حذف بجميع المفاتيح الممكنة
    localStorage.removeItem('app:customStudents');
    if (currentUser) {
      localStorage.removeItem('app:customStudents:' + currentUser);
      storageSet(currentUser + ':customStudents', '[]', true).catch(() => {});
    }
  } catch(e) {}
  const msg = document.getElementById('settingsStudentMsg');
  if (msg) { msg.style.color = '#16a34a'; msg.textContent = `✅ تم حذف جميع التلاميذ (${count}). يمكنك الآن إضافتهم يدوياً.`; }
}
