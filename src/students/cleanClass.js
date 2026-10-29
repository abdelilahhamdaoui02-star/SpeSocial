// تنظيف قيمة القسم: تجاهل كلمات العناوين وأسماء الأوراق الافتراضية — وحدة ES منقولة من cleanClassValue في script-10.js.
// تُسجَّل أيضاً على window لأن كود الاستيراد القديم (script-10) ما زال يناديها بالاسم العام.
export function cleanClassValue(v) {
  v = String(v == null ? '' : v).trim();
  if (!v) return '';
  if (/^(القسم|قسم|الفوج|الفصل|المستوى|classe|class|niveau|[-—–.:]+)$/i.test(v)) return '';
  if (/^(sheet|feuil|feuille|ورقة)\s*\d*$/i.test(v)) return '';
  return v;
}

if (typeof window !== 'undefined') window.cleanClassValue = cleanClassValue;
