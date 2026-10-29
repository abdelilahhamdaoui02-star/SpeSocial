// قائمة التلاميذ في الذاكرة (STUDENT_DB سابقاً) — وحدة ES تملك المصفوفة وتعرض دوالاً للتعديل.
// المصفوفة واحدة طوال عمر الصفحة (لا تُستبدل، تُعدَّل في مكانها) كي يبقى أي مرجع إليها صالحاً:
// الجسر __legacyBridge.getStudents والمتجر (src/store) والإكمال التلقائي. تُسجَّل على window:
//   window.StudentDb  ← الدوال لكود الاستيراد والإعدادات القديم (script-10/11)
//   window.STUDENT_DB ← نفس المصفوفة للقراءة القديمة (typeof STUDENT_DB)
// الحفظ في localStorage/Firebase ما زال من الكود القديم (saveCustomStudents)؛ هذه الدوال تلمس الذاكرة فقط ولا تُطلق أحداثاً.

const DB = [];

// صيغة عنصر القائمة من سجل مخزَّن (name أو fullName)
const nameOf = (s) => (s && (s.name || s.fullName)) || '';
function entry(s, { withName = false } = {}) {
  const name = nameOf(s);
  const e = {
    fullName: name,
    firstName: name.split(' ')[0] || '',
    lastName: name.split(' ').slice(1).join(' ') || '',
    class: (s && s.class) || '', gender: (s && s.gender) || '', massar: (s && s.massar) || '', dob: (s && s.dob) || '',
    family: (s && s.family) || '', given: (s && s.given) || '',
  };
  return withName ? { fullName: name, name, ...e } : e;
}

export const StudentDb = {
  list: () => DB,
  count: () => DB.length,
  snapshotJson: () => JSON.stringify(DB),
  clear() { DB.length = 0; },
  // يستبدل القائمة كلها بسجلات مخزَّنة (يتجاهل ما بلا اسم) — بنية name+fullName كما كانت عند الاستبدال
  replaceFromCustom(list) {
    DB.length = 0;
    (list || []).forEach((s) => { if (nameOf(s)) DB.push(entry(s, { withName: true })); });
  },
  // يستبدل بالسجلات كما هي (استعادة النسخة الاحتياطية)
  replaceRaw(list) { DB.length = 0; (list || []).forEach((s) => DB.push(s)); },
  // يضيف ما ليس موجوداً بالاسم الكامل (الأسماء الفارغة تُتجاهل)
  mergeCustom(list) {
    (list || []).forEach((s) => {
      const name = nameOf(s);
      if (name && !DB.find((b) => b.fullName === name)) DB.push(entry(s));
    });
  },
  // إن كانت القائمة فارغة تُملأ من السجلات المعطاة
  fillIfEmpty(list) { if (DB.length === 0) StudentDb.mergeCustom(list); },
  // حذف كل من اسمه ضمن names (name أو fullName)
  removeByNames(names) {
    for (let i = DB.length - 1; i >= 0; i--) {
      if ((names || []).includes(DB[i].name || DB[i].fullName || '')) DB.splice(i, 1);
    }
  },
  // حذف أول سجل بهذا الاسم
  removeByName(name) {
    const i = DB.findIndex((s) => s.name === name || s.fullName === name);
    if (i !== -1) DB.splice(i, 1);
  },
};

if (typeof window !== 'undefined') { window.StudentDb = StudentDb; window.STUDENT_DB = DB; }
export default StudentDb;
