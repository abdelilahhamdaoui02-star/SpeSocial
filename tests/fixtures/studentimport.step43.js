// نسخة مجمَّدة من exportStudentListExcel وimportStudentListFromFile كما كانتا في script-10.js قبل الخطوة 44 (لاختبار المطابقة)
// ======= STUDENT LIST EXCEL EXPORT =======
function exportStudentListExcel() {
  const list = typeof STUDENTS !== 'undefined' ? STUDENTS : [];
  const custom = getCustomStudents();
  const allStudents = [...list, ...custom.filter(c => !list.some(s => s.name === c.name))];
  if (!allStudents.length) { alert('⚠️ القائمة فارغة حالياً.'); return; }

  const wb = XLSX.utils.book_new();

  // Group by class
  const byClass = {};
  allStudents.forEach(s => {
    const cls = s.class || 'غير محدد';
    if (!byClass[cls]) byClass[cls] = [];
    byClass[cls].push(s);
  });

  // Main sheet: all students
  const rows = [['الرقم', 'رقم مسار', 'النسب', 'الاسم', 'القسم', 'الجنس', 'تاريخ الازدياد']];
  allStudents.forEach((s, i) => { const n = StudentList.splitName(s); rows.push([i + 1, s.massar || '', n.family, n.given, s.class || '', s.gender || '', StudentList.formatDob(s.dob)]); });
  const wsAll = XLSX.utils.aoa_to_sheet(rows);
  wsAll['!cols'] = [{wch:8},{wch:15},{wch:22},{wch:22},{wch:15},{wch:10},{wch:14}];
  XLSX.utils.book_append_sheet(wb, wsAll, 'قائمة كاملة');

  // Per-class sheets
  Object.keys(byClass).sort().forEach(cls => {
    const clsRows = [['الرقم', 'رقم مسار', 'النسب', 'الاسم', 'الجنس', 'تاريخ الازدياد']];
    byClass[cls].forEach((s, i) => { const n = StudentList.splitName(s); clsRows.push([i + 1, s.massar || '', n.family, n.given, s.gender || '', StudentList.formatDob(s.dob)]); });
    const wsC = XLSX.utils.aoa_to_sheet(clsRows);
    wsC['!cols'] = [{wch:8},{wch:15},{wch:22},{wch:22},{wch:10},{wch:14}];
    XLSX.utils.book_append_sheet(wb, wsC, cls.replace(/[:\\\/\?\*\[\]]/g, '-').slice(0,31));
  });

  const date = new Date().toLocaleDateString('ar-MA').replace(/\//g,'-');
  XLSX.writeFile(wb, `قائمة_التلاميذ_${date}.xlsx`);
}

// ======= STUDENT LIST IMPORT FROM EXCEL/CSV (multi-file) =======
function importStudentListFromFile(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  const msg = document.getElementById('importStudentMsg');
  msg.style.color = '#0f766e';
  msg.textContent = '⏳ جاري قراءة الملفات...';

  // Helper: parse one file → returns Promise<{students, sheetsInfo, fileName}>
  function parseFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const data = new Uint8Array(e.target.result);
          const wb = XLSX.read(data, { type: 'array' });
          const imported = [];
          const sheetsInfo = [];
          let importedSchool = '';

          wb.SheetNames.forEach(sheetName => {
            const ws = wb.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            if (rows.length < 2) return;

            // ── اكتشاف رأس الجدول (قد لا يكون في الصف الأول) ──
            let headerRowIdx = -1;
            let nameCol = -1, familyCol = -1, genderCol = -1, massarCol = -1, numCol = -1, classCol = -1, dobCol = -1;

            for (let i = 0; i < Math.min(rows.length, 15); i++) {
              const row = rows[i];
              const rowStr = row.map(c => String(c||'').trim());
              // نبحث عن صف يحتوي على كلمات مثل "الإسم" أو "النسب"
              const hasName = rowStr.some(h => h.includes('الإسم') || h.includes('الاسم') || h.includes('nom') || h.includes('name') || h.includes('إسم'));
              const hasFam  = rowStr.some(h => h.includes('النسب') || h.includes('نسب') || h.includes('prénom') || h.includes('prenom'));
              if (hasName || hasFam) {
                headerRowIdx = i;
                rowStr.forEach((h, idx) => {
                  const lh = h.toLowerCase();
                  if (h.includes('النسب') || h.includes('نسب') || lh.includes('prénom') || lh.includes('prenom')) familyCol = idx;
                  if (h.includes('الإسم') || h.includes('الاسم') || h.includes('إسم') || lh.includes('name')) nameCol = idx;
                  if (h.includes('الجنس') || h.includes('النوع') || lh.includes('genre') || lh.includes('gender') || lh.includes('sex')) genderCol = idx;
                  if (h.includes('الرمز') || h.includes('مسار') || lh.includes('massar') || lh.includes('code')) massarCol = idx;
                  if (h.includes('ر.ت') || h === 'رقم' || h === 'رقم التلميذ') numCol = idx;
                  if (h.includes('القسم') || h.includes('الفوج') || lh.includes('classe')) classCol = idx;
                  if (h.includes('الازدياد') || h.includes('الإزدياد') || h.includes('ازدياد') || h.includes('إزدياد') || lh.includes('naissance') || lh.includes('birth') || lh.includes('dob')) dobCol = idx;
                });
                break;
              }
            }

            // إذا لم يوجد رأس واضح — استخدام الطريقة القديمة (الصف الأول كرأس)
            if (headerRowIdx === -1) {
              const header = rows[0].map(h => String(h).trim());
              header.forEach((h, i) => {
                const lh = h.toLowerCase();
                if (lh.includes('اسم') || lh.includes('nom') || lh.includes('name')) nameCol = i;
                if (lh.includes('قسم') || lh.includes('فوج') || lh.includes('classe') || lh.includes('class') || lh.includes('niveau')) classCol = i;
                if (lh.includes('جنس') || lh.includes('genre') || lh.includes('gender') || lh.includes('sex')) genderCol = i;
                if (lh.includes('مسار') || lh.includes('massar') || lh.includes('رقم')) massarCol = i;
                if (lh.includes('ازدياد') || lh.includes('إزدياد') || lh.includes('naissance') || lh.includes('birth') || lh.includes('dob')) dobCol = i;
              });
              if (nameCol === -1) nameCol = 0;
              headerRowIdx = 0;
            }

            // ── قراءة القسم واسم المؤسسة من أعلى الورقة (قبل رأس الجدول) ──
            const metaFind = (keys) => {
              for (let r = 0; r < headerRowIdx; r++) {
                const cells = (rows[r] || []).map(c => String(c == null ? '' : c).trim());
                for (let c = 0; c < cells.length; c++) {
                  const txt = cells[c], low = txt.toLowerCase();
                  if (!txt || !keys.some(k => low.includes(k))) continue;
                  const m = txt.split(/[:：]/);
                  if (m.length > 1 && m.slice(1).join(':').trim()) return m.slice(1).join(':').trim();
                  for (let d = 1; d < cells.length; d++) {
                    const cand = cells[c + d] || cells[c - d] || '';
                    if (cand && !keys.some(k => cand.toLowerCase().includes(k))) return cand;
                  }
                }
              }
              return '';
            };
            const metaClass  = cleanClassValue(metaFind(['القسم', 'الفوج', 'classe']));
            const metaSchool = metaFind(['المؤسسة', 'المؤسّسة', 'مؤسسة', 'établissement', 'etablissement', 'école', 'ecole']);
            if (metaSchool && !importedSchool) importedSchool = metaSchool;

            // ── كشف ذكي للقسم إذا لم يُعثر عليه بالعناوين: البحث عن قيمة تشبه اسم قسم ──
            const looksLikeClass = v => {
              v = String(v == null ? '' : v).trim();
              if (!v || v.length > 40) return false;
              if (/^\d?\s*[A-Za-z]{2,}[\s\-_\/.]*\d{1,2}$/.test(v)) return true;
              return false;
            };
            let metaClass2 = metaClass;
            if (!metaClass2) {
              outer: for (let r = 0; r <= headerRowIdx && r < rows.length; r++) {
                for (const cell of (rows[r] || [])) {
                  const c = String(cell == null ? '' : cell).split(/[:：]/).pop().trim();
                  if (looksLikeClass(c)) { metaClass2 = c; break outer; }
                }
              }
            }
            if (classCol === -1) {
              const sample = rows.slice(headerRowIdx + 1, headerRowIdx + 41);
              const width = Math.max(0, ...sample.map(r => r.length));
              for (let col = 0; col < width; col++) {
                const vals = sample.map(r => String(r[col] == null ? '' : r[col]).trim()).filter(Boolean);
                if (vals.length >= 3 && vals.filter(looksLikeClass).length >= 0.7 * vals.length) { classCol = col; break; }
              }
            }

            let sheetCount = 0;
            for (let i = headerRowIdx + 1; i < rows.length; i++) {
              const row = rows[i];
              // تخطي الصفوف الفارغة أو التي تبدأ بنص (ليست بيانات تلاميذ)
              const firstCell = String(row[0] || '').trim();
              if (!firstCell) continue;

              let fullName = '', famPart = '', givPart = '';
              if (familyCol !== -1 && nameCol !== -1) {
                // الشكل المغربي: النسب + الإسم
                const family = String(row[familyCol] || '').trim();
                const given  = String(row[nameCol]  || '').trim();
                if (family || given) { fullName = (family + ' ' + given).trim(); famPart = family; givPart = given; }
              } else if (nameCol !== -1) {
                fullName = String(row[nameCol] || '').trim();
              } else {
                // fallback: أول خلية غير فارغة
                for (const cell of row) {
                  const v = String(cell || '').trim();
                  if (v && v.length > 2 && isNaN(v)) { fullName = v; break; }
                }
              }

              if (!fullName || fullName.length < 2) continue;

              const gender = genderCol !== -1 ? String(row[genderCol] || '').trim() : '';
              const massar = massarCol !== -1 ? String(row[massarCol] || '').trim() : '';

              const rowClass = classCol !== -1 ? cleanClassValue(row[classCol]) : '';
              const dob = dobCol !== -1 ? StudentList.normalizeDob(row[dobCol]) : '';
              imported.push({
                name: fullName, fullName,
                family: famPart, given: givPart, dob,
                class: rowClass || metaClass2 || cleanClassValue(sheetName),
                gender, massar,
                _sheet: sheetName, _file: file.name
              });
              sheetCount++;
            }
            if (sheetCount > 0) sheetsInfo.push(`${sheetName}: ${sheetCount} تلميذ(ة)`);
          });

          resolve({ students: imported, sheetsInfo, fileName: file.name, sheets: wb.SheetNames.length, school: importedSchool });
        } catch(err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Parse all files then confirm + save
  Promise.all(files.map(parseFile)).then(results => {
    const allStudents = [];
    const allInfo = [];
    let totalSheets = 0;

    results.forEach(r => {
      allStudents.push(...r.students);
      allInfo.push(`📄 ${r.fileName}: ${r.students.length} تلميذ(ة) من ${r.sheets} ورقة`);
      totalSheets += r.sheets;
    });

    // Remove duplicates by name
    const seen = new Set();
    const unique = allStudents.filter(s => {
      if (seen.has(s.name)) return false;
      seen.add(s.name); return true;
    });

    if (!unique.length) {
      msg.style.color = '#dc2626';
      msg.textContent = '❌ لم يتم العثور على أسماء صالحة في أي ملف.';
      return;
    }

    const filesLabel = files.length > 1 ? `\n\n📁 الملفات المُعالجة:\n${allInfo.join('\n')}` : '';
    if (!confirm(`✅ تم اكتشاف ${unique.length} تلميذ(ة) من ${files.length} ملف (${totalSheets} ورقة).${filesLabel}\n\nهل تريد استيرادهم؟\n(سيتم استبدال قائمة التلاميذ الحالية بالقائمة الجديدة)`)) {
      msg.textContent = ''; input.value = ''; return;
    }

    // ── حفظ نسخة احتياطية من القائمة القديمة قبل الاستبدال ──
    try {
      const oldList = StudentDb.snapshotJson();
      const backupKey = currentUser ? 'app:customStudents_backup:' + currentUser : 'app:customStudents_backup';
      localStorage.setItem(backupKey, oldList);
      localStorage.setItem(backupKey + ':date', new Date().toLocaleString('ar-MA'));
      localStorage.setItem(backupKey + ':count', StudentDb.count());
    } catch(e) {}

    // حذف القائمة القديمة بالكامل
    StudentDb.clear();
    saveCustomStudents([]);

    // حفظ الجديدة
    saveCustomStudents(unique);

    // ── اسم المؤسسة: يتغير تلقائياً حسب الملف المستورد ──
    const fileSchool = (results.find(r => r.school) || {}).school || '';
    let schoolNote = '';
    try {
      if (fileSchool) {
        userProfile.institution = fileSchool;
        if (currentUser) storageSet(currentUser + ':profile', JSON.stringify(userProfile), true).catch(() => {});
        window.dispatchEvent(new Event('legacy:profile-changed'));
        schoolNote = `\n🏫 اسم المؤسسة: ${fileSchool}`;
      } else if (!getInstitutionName()) {
        schoolNote = '\n⚠️ لم يُعثر على اسم المؤسسة في الملف — أدخله في «الملف الشخصي» ليُملأ تلقائياً في البوابات.';
      }
      applyInstitutionEverywhere();
    } catch(e) {}

    // ── الأقسام: تتحدّث القوائم تلقائياً من اللائحة المستوردة ──
    let classNote = '';
    try {
      updateAllLevelSelects();
      const cls = getImportedClasses();
      if (cls.length) classNote = `\n📚 الأقسام (${cls.length}): ` + cls.slice(0, 8).join('، ') + (cls.length > 8 ? ' …' : '');
      const noCls = unique.filter(s => !cleanClassValue(s.class)).length;
      if (noCls) classNote += `\n⚠️ ${noCls} تلميذ(ة) بدون قسم — تحقق من وجود عمود أو سطر «القسم» في الملف.`;
    } catch(e) {}

    msg.style.color = '#16a34a';
    msg.style.whiteSpace = 'pre-line';
    msg.textContent = `✅ تم استيراد ${unique.length} تلميذ(ة) من ${files.length} ملف بنجاح!` + schoolNote + classNote;
    input.value = '';
  }).catch(err => {
    msg.style.color = '#dc2626';
    msg.textContent = '❌ خطأ في قراءة الملفات: ' + err.message;
  });
}

