// منطق التنقل بين البوابات — بيانات ودوال بحتة بلا DOM، منقولة من كتلة «PORTAL NAVIGATION» في script-10.js.

// معرّف البوابة → معرّف عنصرها في body.html
export const TOOL_DOM_IDS = Object.freeze({
  interview: 'toolInterview', reintegration: 'toolReintegration',
  absence: 'toolAbsence', iip: 'toolIip', tasklog: 'toolTasklog', stats: 'toolStats',
  casefile: 'toolCasefile',
  violence: 'toolViolence', workshops: 'toolWorkshops',
  specialneeds: 'toolSpecialNeeds', vigilance: 'toolVigilance',
  printdocs: 'toolPrintdocs', behavior: 'toolBehavior', parents: 'toolParents', followup: 'toolFollowup',
});

export const ALL_TOOL_DOM_IDS = Object.freeze(Object.values(TOOL_DOM_IDS));

export const toolDomId = (tool) => (Object.prototype.hasOwnProperty.call(TOOL_DOM_IDS, tool) ? TOOL_DOM_IDS[tool] : '');

// العناوين الافتراضية (تظهر في tooltip البطاقات المجمَّدة)
export const TOOL_TITLES = Object.freeze({
  interview:     '🗂 المقابلات الفردية',
  reintegration: '📋 الإدماج المدرسي',
  absence:       '🚨 التلاميذ الأكثر غياباً',
  iip:           '🧩 البرنامج التدخلي الفردي',
  tasklog:       '📝 سجل المهام اليومي',
  stats:         '📊 الإحصاء البياني',
  casefile:      '📁 ملف الحالة الشامل',
  violence:      '🛡️ التدخل في حالات العنف',
  workshops:     '🎯 الورشات والأنشطة',
  specialneeds:  '♿ التلاميذ في وضعية إعاقة',
  vigilance:     '🚨 خلية اليقظة — الحالات الحرجة',
  printdocs:     '🏥 بوابة الإحالة والإخبار الصحي',
  behavior:      '🧭 رصد السلوك — الدعم وخطة التدخل',
  parents:       '📞 التواصل مع أولياء الأمور',
  followup:      '🔔 المتابعة وتتبع الحالات',
});

// بطاقات الشريط المجمَّد (بالترتيب نفسه؛ سجل المهام غير موجود فيه كما كان)
export const FROZEN_NAV = Object.freeze([
  { key: 'interview',     icon: '🗂',  label: 'المقابلات' },
  { key: 'reintegration', icon: '📋',  label: 'الإدماج' },
  { key: 'absence',       icon: '🚨',  label: 'الغياب' },
  { key: 'iip',           icon: '🧩',  label: 'البرنامج التدخلي' },
  { key: 'stats',         icon: '📊',  label: 'الإحصاء' },
  { key: 'casefile',      icon: '📁',  label: 'ملف الحالة' },
  { key: 'violence',      icon: '🛡️',  label: 'العنف' },
  { key: 'workshops',     icon: '🎯',  label: 'الورشات' },
  { key: 'specialneeds',  icon: '♿',  label: 'الإعاقة' },
  { key: 'vigilance',     icon: '🚨',  label: 'خلية اليقظة' },
  { key: 'printdocs',     icon: '🏥',  label: 'الإحالة والإخبار' },
  { key: 'behavior',      icon: '🧭',  label: 'رصد السلوك' },
  { key: 'parents',       icon: '📞',  label: 'الأولياء' },
  { key: 'followup',      icon: '🔔',  label: 'المتابعة' },
]);

// التسمية المعروضة على البطاقة: المخصّصة من الأدمين إن وُجدت وإلا الافتراضية
export const frozenLabel = (item, custom) => ((custom || '').trim() || item.label);

// العنوان (tooltip): أول كلمة من الافتراضي (الأيقونة) + الاسم المخصّص، وإلا العنوان الافتراضي كاملاً
export function portalTitle(key, custom) {
  const def = TOOL_TITLES[key] || '';
  const n = (custom || '').trim();
  return n ? def.split(' ')[0] + ' ' + n : def;
}
