// نافذة المعاينة والطباعة المشتركة لبوابتي الأولياء والمتابعة: تبني التقرير وتفتح نافذة المعاينة الموحَّدة (src/preview)
// بعنوانه واسم ملف Word، كما كان يفعل pgPrintReportInner القديم.
import { reportHtml, printTitle, directorateOf } from './gateLogic.js';
import { getState } from '../store/legacyStore.js';
import { openPreview } from '../preview/previewStore.js';
import { getLogo } from '../settings/logoStore.js';

export function openReport(title, fields, rows) {
  try {
    const profile = getState().profile || {};
    const html = reportHtml(title, fields, rows, {
      logo: getLogo(),
      directorate: directorateOf(profile),
      institution: profile.institution,
      today: new Date().toLocaleDateString('ar-MA'),
    });
    const info = printTitle(title);
    openPreview('gate', html, { title: info.text, word: info.file });
  } catch (e) {
    console.error(e);
    alert('❌ تعذّر فتح المعاينة: ' + ((e && e.message) || e));
  }
}
