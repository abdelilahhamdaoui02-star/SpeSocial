// منطق نقي لاسم الوزارة والمديرية والمؤسسة وقوائم الأقسام وإعدادات المنصة — منقول من script-10.js (الخطوة 43).
// بلا DOM: ما يلمس الصفحة في institutionStore.js.
import { classOptions } from '../settings/studentsLogic.js';

export const DEFAULT_MINISTRY = 'وزارة التربية الوطنية والتعليم الأولي والرياضة';
export const DEFAULT_DIRECTORATE = 'مديرية الحي الحسني';

// حقول «المؤسسة» في البوابات (تُملأ باسم المؤسسة من الملف الشخصي)
export const INSTITUTION_FIELD_IDS = ['i_school', 'r_school', 'ab_school', 'tl_school', 'vio_school', 'ws_school', 'sn_school', 'vig_school', 'pd3-school', 'pd4-school'];

export const LEVEL_PLACEHOLDER_EMPTY = '<option value="">— استورد لائحة التلاميذ لتظهر الأقسام —</option>';

export const ministryOf = (cfg) => ((cfg && cfg.ministry) || '').trim() || DEFAULT_MINISTRY;
export const directorateOf = (profile) => (profile && profile.school) ? profile.school : DEFAULT_DIRECTORATE;
export const institutionOf = (profile) => (profile && profile.institution) ? profile.institution : '';

// نصوص المديرية في أجزاء الواجهة المختلفة (updateDirectorateUI القديمة)
export function directorateTexts(ministry, dir) {
  const sub2 = `${ministry} — ${dir}`;
  return {
    dir,
    greetSub: `المختص الاجتماعي · ${dir}`,
    kingdom: `المملكة المغربية — ${ministry} — ${dir}`,
    sub2,
    sub3: `🏛 ${sub2}`,
    ohSub: `${dir} — المصلحة الاجتماعية`,
  };
}

// تفاصيل حدث legacy:site-config (ما يحتاجه React: أسماء البوابات وإعدادات الأخبار والإشعار)
export function siteConfigDetail(cfg) {
  const c = cfg || {};
  return { gates: c.gates || {}, news: c.news || {}, notice: c.notice || {} };
}

const escAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// خيارات قوائم الأقسام: أقسام لائحة التلاميذ المستوردة فقط (الأقسام اليدوية القديمة كانت معطّلة وحُذفت)
export function levelOptionsHtml(importedClasses) {
  if (importedClasses && importedClasses.length) {
    return '<option value="">— اختر القسم —</option><optgroup label="📥 أقسام لائحة التلاميذ">' +
      importedClasses.map((c) => `<option value="${escAttr(c)}">${escAttr(c)}</option>`).join('') + '</optgroup>';
  }
  return LEVEL_PLACEHOLDER_EMPTY;
}

// أقسام اللائحة: الذاكرة إن امتلأت وإلا المخزَّنة (نفس classOptions المختبَرة في الخطوة 36)
export const importedClassesOf = classOptions;
