// التنقل بين البوابات (واجهة قصيرة فوق nav/navStore.js). لم يعد هنا أي لمس لـDOM ولا أسماء على window:
// كانت openTool وgoBack على window لأزرار HTML القديم، وصار كل شيء مكوّنات React تستدعي هذه الدوال مباشرة.
import { getNavStore } from './nav/navStore.js';

export const openPortal = (id) => getNavStore().openPortal(id);
export const goHome = () => getNavStore().goHome();

// يربط حالة التنقل بحدثي الدخول والخروج القادمين من الجلسة؛ يُستدعى مرة واحدة عند تحميل LegacyApp
export const installNavigation = () => getNavStore().install();
