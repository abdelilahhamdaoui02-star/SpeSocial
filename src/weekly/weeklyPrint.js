// طباعة التقرير الأسبوعي (A4 أفقي، ومنها «حفظ كـ PDF» من المتصفح) وتصديره إلى Word — منقولتان من
// printWeeklyReportForRange وdownloadWeeklyReportWordForRange القديمتين في script-10.js (الخطوة 39).
// PRINT_CSS منقول حرفياً من القديم. دوال البناء نقية؛ وحدها printWeeklyReport وexportWeeklyWord تلمسان DOM.
import { callExportToWord } from '../export/wordExport.js';

export const PRINT_CSS = `
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; color: #000; padding: 10mm 12mm; font-size: 10pt; }
    .nrh-logo { text-align: center; line-height: 0; }
    .nrh-logo img { width: 100%; max-height: 120px; object-fit: contain; }
    .nrh-dir, .nrh-school { text-align: center; font-weight: 700; font-size: 11pt; margin: 2px 0; }
    .nrh-title { text-align: center; font-weight: 900; font-size: 15pt; margin: 6px 0 4px; padding-top: 6px; border-top: 1.5px solid #000; }
    .report-section-title { font-weight: 800; font-size: 11pt; margin: 12px 0 6px; }
    .report-summary-block { white-space: pre-line; font-size: 10pt; margin-bottom: 6px; line-height: 1.7; }
    table.wk-table-report { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    table.wk-table-report th, table.wk-table-report td { border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; text-align: right; vertical-align: middle; }
    table.wk-table-report th { background: #d9d9d9; font-weight: 800; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    table.wk-table-report tr { page-break-inside: avoid; }
    .sig-wrap { display: flex; justify-content: space-around; margin-top: 30px; }
    .sig-block { text-align: center; font-weight: 700; font-size: 10pt; min-width: 160px; }
    .sig-line { height: 40px; border-bottom: 1.5px solid #000; margin-bottom: 6px; }`;

// تغليف كتلتي التوقيع (آخر ما في HTML التقرير) بحاوية واحدة تضعهما جنباً إلى جنب
export const wrapSignatures = (html) => html.replace(/(<div class="sig-block">[\s\S]*<\/div>)\s*$/, '<div class="sig-wrap">$1</div>');

// المستند الكامل الذي يُكتب في إطار الطباعة
export function buildPrintDocument(html) {
  return '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title> </title><style>' + PRINT_CSS + '</style></head><body>' + wrapSignatures(html) + '</body></html>';
}

// معرّف الإطار القديم نفسه حتى لا يتكرر إطاران إن نوديت الدالتان القديمة والجديدة
const FRAME_ID = 'wkPrintFrame';

export function printWeeklyReport(html) {
  const old = document.getElementById(FRAME_ID); if (old) old.remove();
  const fr = document.createElement('iframe');
  fr.id = FRAME_ID;
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(fr);
  const d = fr.contentWindow.document;
  d.open(); d.write(buildPrintDocument(html)); d.close();
  const go = () => {
    try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { console.warn(e); }
    setTimeout(() => fr.remove(), 60000);
  };
  // كما في القديم: ننتظر الشعار إن لم يكتمل، وإلا نطبع بعد 300 مللي ثانية
  const img = d.querySelector('.nrh-logo img');
  if (img && !img.complete) { img.onload = go; img.onerror = go; } else { setTimeout(go, 300); }
  return fr;
}

export const wordFileName = (from, to) => 'التقرير_الأسبوعي_' + from + '_إلى_' + to;

// exportToWord القديمة تقرأ العنصر بمعرّفه من الصفحة، فنضع التقرير في عنصر مخفي ثم نزيله
export async function exportWeeklyWord(html, from, to) {
  const host = document.createElement('div');
  host.id = 'wkReportContent';
  host.setAttribute('data-landscape', '1');
  host.style.cssText = 'position:absolute;left:-99999px;top:0;width:1000px;';
  host.innerHTML = html;
  document.body.appendChild(host);
  try { await callExportToWord('wkReportContent', wordFileName(from, to)); }
  finally { host.remove(); }
}

export const WeeklyPrint = { PRINT_CSS, wrapSignatures, buildPrintDocument, printWeeklyReport, exportWeeklyWord, wordFileName };
if (typeof window !== 'undefined') window.WeeklyPrint = WeeklyPrint;
