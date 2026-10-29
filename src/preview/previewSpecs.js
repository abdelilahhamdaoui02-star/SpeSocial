// مواصفات نوافذ المعاينة العشر التي كانت مكتوبة يدوياً في body.html (قبل المرحلة 27).
// المعرّفات (id وbody) باقية كما كانت لأن CSS الطباعة (style-06/26) وbeforeprint في script-10 وexportToWord مربوطة بها.
// title/word: القيمتان الافتراضيتان؛ بوابتا الوثائق والسجلات تمرّران عنواناً واسم ملف Word لكل فتح (titleId يوسم h3 كالقديم).
export const PREVIEWS = {
  interview: { id: 'interviewPrintModal', body: 'iReportContent', title: '📄 تقرير المقابلة الفردية', word: 'تقرير_المقابلة_الفردية' },
  reintegration: { id: 'reintegrationPrintModal', body: 'rReportContent', title: '📄 تقرير إعادة الإدماج المدرسي', word: 'تقرير_إعادة_الإدماج' },
  absence: { id: 'absencePrintModal', body: 'abReportContent', title: '📄 تقرير تتبع التلميذ الأكثر غياباً', word: 'تقرير_الغياب' },
  violence: { id: 'vioPrintModal', body: 'vioReportContent', title: '🛡️ تقرير التدخل في حالة عنف', word: 'تقرير_العنف' },
  workshops: { id: 'wsPrintModal', body: 'wsReportContent', title: '🎯 تقرير الورشة / النشاط التربوي', word: 'تقرير_الورشة' },
  specialneeds: { id: 'snPrintModal', body: 'snReportContent', title: '♿ تقرير وضعية إعاقة / صعوبات التعلم', word: 'تقرير_الإعاقة' },
  tasklog: { id: 'tlPrintModal', body: 'tlReportContent', title: '📄 التقرير الأسبوعي للمختص الاجتماعي', word: 'التقرير_الأسبوعي', maxWidth: 820, printLabel: '🖨️ طباعة / PDF' },
  stats: { id: 'stPrintModal', body: 'stReportContent', title: '📊 التقرير الإحصائي البياني', word: 'التقرير_الإحصائي', maxWidth: 860 },
  printdocs: { id: 'pdPrintModal', body: 'pdReportContent', titleId: 'pdModalTitle', title: '📄 معاينة الوثيقة', word: 'وثيقة', print: 'logo' },
  gate: { id: 'pgPrintModal', body: 'pgReportContent', titleId: 'pgPrintTitle', title: '📄 معاينة السجل', word: 'السجل', print: 'gate', wordLabel: '📄 تحميل Word', plainWord: true },
};
