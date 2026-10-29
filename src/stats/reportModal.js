// نافذة التقرير الإحصائي: صارت من نافذة المعاينة الموحَّدة (src/preview). هنا غلاف يبقي الاسم القديم لاستدعاءات البوابة.
import { openPreview } from '../preview/previewStore.js';

export function openStatsReport(html) {
  openPreview('stats', html);
}
