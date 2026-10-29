// قراءة/حفظ أرشيفات الأقسام وسجل المهام والتسجيل التلقائي — منقولة من script-10.js وscript-15.js وscript-16.js (الخطوة 47).
// الواجهات صارت React؛ بقيت هذه الدوال لأن بوابات React والتقرير الأسبوعي تستدعيها بأسمائها العامة على window.
//   deps: { appData, getUser(), saveUserKey(key), now() → Date }
export function createArchives(d) {
  const A = d.appData;
  // كما في القديم: يكتب في الذاكرة ثم يحفظ دون انتظار ولا قيمة مُرجَعة (saveUserKey لا ترفض أبداً)
  const save = (key, data) => { A[key] = data; d.saveUserKey(key); };

  // ── التسجيل التلقائي للمهام عند كل إجراء ──
  const tlGetTasks = () => A.taskLog;
  function tlSaveTasks(data) { A.taskLog = data; d.saveUserKey('taskLog'); }

  function autoLogTask(type, title, target, school, notes, result, workDate) {
    const today = d.now();
    // تاريخ الإنجاز الفعلي إن مُرِّر، وإلا تاريخ اليوم
    const dateStr = (workDate && /^\d{4}-\d{2}-\d{2}$/.test(workDate)) ? workDate : today.toISOString().slice(0, 10);
    const task = {
      id: today.getTime(),
      date: dateStr, // تاريخ الإنجاز الفعلي — يُستخدم في الإحصاء
      savedAt: today.toLocaleString('ar-MA'), // تاريخ التسجيل في النظام — للأرشيف فقط
      time: today.toTimeString().slice(0, 5),
      school: school || '',
      type,
      nature: 'تسجيل أوتوماتيكي',
      title: title || '',
      target: target || '',
      notes: notes || '',
      result: result || 'مُنجز',
      duration: 0,
      auto: true,
    };
    const tasks = tlGetTasks();
    tasks.unshift(task);
    tlSaveTasks(tasks);
  }

  // يضيف سطراً إلى حقل نصي (أزرار الاقتراحات القديمة)
  function appendSuggest(id, text) {
    const el = (d.doc || document).getElementById(id);
    if (!el) return;
    el.value = el.value.trim() ? el.value.trimEnd() + '\n' + text : text;
    el.focus();
  }

  return {
    tlGetTasks, tlSaveTasks, autoLogTask, appendSuggest,
    getArchive: () => A.interviewArchive,
    saveArchive: (data) => save('interviewArchive', data),
    getRArchive: () => A.reintegrationArchive,
    saveRArchive: (data) => save('reintegrationArchive', data),
    getAbArchive: () => A.absenceArchive,
    saveAbArchive: (data) => save('absenceArchive', data),
    getCtArchive: () => A.contactsArchive || [],
    saveCtArchive: (data) => save('contactsArchive', data),
    getSnArchive: () => A.specialNeedsArchive || [],
    saveSnArchive: (data) => save('specialNeedsArchive', data),
    getVioArchive: () => A.violenceArchive || [],
    saveVioArchive: (data) => save('violenceArchive', data),
    vigGetArchive: () => {
      if (!d.getUser()) return [];
      const raw = A.vigilanceCases;
      return Array.isArray(raw) ? raw : [];
    },
  };
}
