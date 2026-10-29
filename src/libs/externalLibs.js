// المكتبات الخارجية الأربع (كانت تُحمَّل من CDN عبر scripts.manifest.json) صارت من npm (الخطوة 48).
// الكود يقرؤها بأسمائها العامة على window (window.docx / Chart / XLSX / ExcelJS) كما كان، فتُسجَّل هنا بعد التحميل.
// التحميل كسول ومتوازٍ (import ديناميكي) فتخرج كل مكتبة في ملف منفصل ولا تثقل الصفحة عند أول فتح.
// نسخ مثبَّتة بنفس أرقام CDN القديمة: docx 9.6.1 وChart.js 4.4.1 وxlsx 0.18.5 وexceljs 4.4.0.

export const LIB_LOADERS = {
  docx: async () => import('docx'),
  Chart: async () => {
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables); // نسخة CDN (UMD) كانت تسجّل كل المقاييس والعناصر تلقائياً
    return Chart;
  },
  XLSX: async () => import('xlsx'),
  ExcelJS: async () => (await import('exceljs')).default,
};

let loading = null;

// يحمّل المكتبات ويسجّلها على win؛ يحلّ دائماً (فشل مكتبة لا يعطّل بقية التطبيق، كما كان فشل سكربت CDN)
export function loadExternalLibs(win = window, loaders = LIB_LOADERS) {
  if (loading) return loading;
  loading = Promise.all(Object.entries(loaders).map(async ([name, load]) => {
    try {
      win[name] = await load();
    } catch (err) {
      console.error('فشل تحميل المكتبة:', name, err);
    }
  })).then(() => undefined);
  return loading;
}

export const resetExternalLibsForTests = () => { loading = null; };
