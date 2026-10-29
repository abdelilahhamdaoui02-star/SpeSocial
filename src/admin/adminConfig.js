// ثوابت لوحة الأدمين (منقولة من admin.js القديم بنفس القيم)
export const MIN_DEFAULT = 'وزارة التربية الوطنية والتعليم الأولي والرياضة';
export const EMAIL_DOMAIN = '@vigilance.app'; // يجب أن يطابق منصة الدخول الرئيسية
export const USER_RE = /^[a-z0-9_\-.]{2,30}$/;
export const RESERVED = ['auth', 'app', 'admin'];

export const DATA_KEYS = ['interviewArchive', 'reintegrationArchive', 'absenceArchive', 'taskLog', 'violenceArchive', 'contactsArchive', 'workshopsArchive', 'specialNeedsArchive', 'vigilanceCases', 'behaviorFiles', 'pdAssocArchive', 'pdHealthArchive', 'profile', 'customStudents', 'abMonthly', 'parentCalls', 'parentMeetings', 'followUp'];

export const GATES = [
  ['interview', 'المقابلات الفردية'], ['reintegration', 'الإدماج المدرسي'], ['absence', 'التلاميذ الأكثر غياباً'],
  ['iip', 'البرنامج التدخلي الفردي'], ['tasklog', 'سجل المهام اليومي'], ['stats', 'الإحصاء البياني'],
  ['casefile', 'ملف الحالة الشامل'], ['violence', 'حالات العنف'], ['workshops', 'الورشات والأنشطة'],
  ['specialneeds', 'وضعية الإعاقة'], ['vigilance', 'خلية اليقظة'], ['printdocs', 'الإحالة والإخبار الصحي'],
  ['behavior', 'رصد السلوك'], ['parents', 'التواصل مع الأولياء'], ['followup', 'المتابعة'],
];

export const NW_TYPES = { news: '📰 خبر', law: '⚖️ قانون', circ: '📄 مذكرة', google: '🌐 Google' };
export const NW_MAX = 80;
export const NW_GOOGLE_MAX = 40;
