
// ── حالات العنف: انتقلت إلى React (src/violence). تبقى دالتا القراءة/الحفظ فقط لأن التقرير الأسبوعي في script-10.js يقرأ الأرشيف بهما ──
function getVioArchive() { return appData.violenceArchive || []; }
function saveVioArchive(data) { appData.violenceArchive = data; saveUserKey('violenceArchive'); }

// ── الورشات والأنشطة: انتقلت إلى React (src/workshops). يبقى هنا appData.workshopsArchive نفسه فقط لأن التقرير الأسبوعي والإحصاء في script-10.js يقرآنه ──

// (_markEmptyFields و_waitLogoThenPrint انتقلتا إلى React: src/print/printHelpers.js؛ وiDirectPrint حُذفت لأنها لا تُستدعى)

// ══════════════════════════════════════════════════════════════

// (أرشيف المقابلات الفردية وتحميل/تعديل سجلاته انتقلا إلى React: src/interview)

// ─────────────────────────────────────────────
//  3) أرشيف التلاميذ الأكثر غياباً
// ─────────────────────────────────────────────
// (أرشيف التلاميذ الأكثر غياباً وتحميل/تعديل ملفاته انتقلا إلى React: src/absence)

// (بوابة «التلاميذ الأكثر غياباً» وأرشيفها واستيراد الغياب الشهري في React: src/absence)
// بقيت هنا الدالتان getAbArchive/saveAbArchive (كانتا في script-11.js الذي حُذف في الخطوة 42) لأن التقرير الأسبوعي في script-10.js يقرؤهما
function getAbArchive() { return appData.absenceArchive; }
function saveAbArchive(data) { appData.absenceArchive = data; saveUserKey('absenceArchive'); }

// ── (v18) أداة «الاتصالات وجلسات الأولياء» حُذفت لإعادة بنائها ──
// تبقى دالتا قراءة/حفظ البيانات فقط حتى لا تتعطل التقارير والإحصاء التي تقرأ سجلات الاتصالات القديمة.
function getCtArchive() { return appData.contactsArchive || []; }
function saveCtArchive(data) { appData.contactsArchive = data; saveUserKey('contactsArchive'); }

// ══════════════════════════════════════════════════════════════
//  ♿ وضعية إعاقة وصعوبات التعلم — صارت بوابة React (src/specialneeds).
//  بقي هنا جسر القراءة/الحفظ فقط: التقرير الأسبوعي وملف الحالة في script-10.js يستدعيان getSnArchive/saveSnArchive بالاسم.
// ══════════════════════════════════════════════════════════════
function getSnArchive() { return appData.specialNeedsArchive || []; }
function saveSnArchive(data) { appData.specialNeedsArchive = data; saveUserKey('specialNeedsArchive'); }


// ══════════════════════════════════════════════════════════
//  🚨 خلية اليقظة — صارت بوابة React (src/vigilance).
//  بقي هنا جسر القراءة فقط: التقرير الأسبوعي في script-10.js يستدعي vigGetArchive بالاسم.
// ══════════════════════════════════════════════════════════
function vigGetArchive() {
  if (!currentUser) return [];
  const raw = appData.vigilanceCases;
  return Array.isArray(raw) ? raw : [];
}
