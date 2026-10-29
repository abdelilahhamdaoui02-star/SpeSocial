
// ======= TASK LOG (TOOL 3) =======
function tlGetTasks() { return appData.taskLog; }
function tlSaveTasks(d) { appData.taskLog = d; saveUserKey('taskLog'); }

// ======= AUTO-LOG: تسجيل أوتوماتيكي عند كل إجراء =======
function autoLogTask(type, title, target, school, notes, result, workDate) {
  const today = new Date();
  // إذا تم تمرير تاريخ الإنجاز الفعلي، نستخدمه — وإلا نستخدم تاريخ اليوم
  const dateStr = (workDate && /^\d{4}-\d{2}-\d{2}$/.test(workDate)) ? workDate : today.toISOString().slice(0,10);
  const timeStr = today.toTimeString().slice(0,5);
  const savedAtStr = today.toLocaleString('ar-MA');
  const task = {
    id: Date.now(),
    date: dateStr,              // تاريخ الإنجاز الفعلي — يُستخدم في الإحصاء
    savedAt: savedAtStr,        // تاريخ التسجيل في النظام — للأرشيف فقط
    time: timeStr,
    school: school || '',
    type: type,
    nature: 'تسجيل أوتوماتيكي',
    title: title || '',
    target: target || '',
    notes: notes || '',
    result: result || 'مُنجز',
    duration: 0,
    auto: true
  };
  const tasks = tlGetTasks();
  tasks.unshift(task);
  tlSaveTasks(tasks);
}

function appendSuggest(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = el.value.trim() ? el.value.trimEnd() + '\n' + text : text;
  el.focus();
}

// (واجهة سجل المهام وتقريره الأسبوعي انتقلا إلى React: src/tasklog. بقي هنا ما تستدعيه أدوات أخرى: autoLogTask وtlGetTasks وtlSaveTasks وappendSuggest)

// (بوابة الإحصاء البياني انتقلت إلى React: src/stats)

// Init stats on load
// App is initialized by authEnterApp() after login

// ======= STUDENT DATABASE & AUTOCOMPLETE =======
// ===== STUDENTS LIST (1524 students) =====
const STUDENTS = [];
// (STUDENT_DB انتقلت إلى src/students/studentDb.js؛ تعدَّل عبر window.StudentDb وتُقرأ من window.STUDENT_DB)

function acNormalize(str) {
  return (str||'').trim().replace(/\s+/g,' ')
    .replace(/[أإآا]/g,'ا').replace(/[ةه]/g,'ه').replace(/[يى]/g,'ي');
}

// (acSearch وacFillField وacSetup وacSelect وAUTOCOMPLETE_FIELDS وinitAllAutocomplete انتقلت إلى src/autocomplete/studentAutocomplete.js؛ تُسجَّل على window)

