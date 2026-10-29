// طباعة تقرير رصد السلوك (A4 أفقي) وتصديره إلى Word — منقولتان من bmPrint وbmWord القديمتين في script-18.js.
// نص CSS أدناه منقول حرفياً من bmPrint.
import { callExportToWord } from '../export/wordExport.js';

export const PRINT_CSS = `@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    @page { size: A4 landscape; margin: 0; } * { box-sizing: border-box; } html, body { margin: 0; }
    body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; color: #000; padding: 0 12mm; font-size: 10pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    table.pg { width: 100%; border-collapse: collapse; } table.pg > thead > tr > td, table.pg > tfoot > tr > td { padding: 0; border: 0; height: 9mm; } table.pg > tbody > tr > td { padding: 0; border: 0; }
    .nrh-logo { text-align: center; line-height: 0; } .nrh-logo img { width: 100%; max-height: 120px; object-fit: contain; }
    .nrh-dir, .nrh-school { text-align: center; font-weight: 700; font-size: 11pt; margin: 2px 0; }
    .nrh-title { text-align: center; font-weight: 900; font-size: 15pt; margin: 6px 0 4px; padding-top: 6px; border-top: 1.5px solid #000; }
    .report-section-title { font-weight: 800; font-size: 11pt; margin: 12px 0 6px; break-after: avoid; } .report-summary-block { text-align: center; font-size: 9.5pt; margin-bottom: 4px; }
    table.wk-table-report { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    table.wk-table-report th, table.wk-table-report td { border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; text-align: right; vertical-align: middle; }
    table.wk-table-report th { background: #d9d9d9; font-weight: 800; } table.wk-table-report thead { display: table-header-group; } table.wk-table-report tr { break-inside: avoid; }
    .sig-wrap { display: flex; justify-content: space-around; margin-top: 30px; break-inside: avoid; } .sig-block { text-align: center; font-weight: 700; font-size: 10pt; min-width: 160px; } .sig-line { height: 40px; border-bottom: 1.5px solid #000; margin-bottom: 6px; }`;

// المستند الذي يُكتب في إطار الطباعة: جدول بترويسة وتذييل فارغين يحجزان هامشاً في كل صفحة (كما في vigPrintInFrame القديمة)
export function buildPrintDocument(body) {
  return '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title> </title><style>' + PRINT_CSS + '</style></head><body>' +
    '<table class="pg"><thead><tr><td></td></tr></thead><tbody><tr><td>' + body + '</td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>';
}

export function printBehaviorReport(body) {
  const old = document.getElementById('bmPrintFrame'); if (old) old.remove();
  const fr = document.createElement('iframe');
  fr.id = 'bmPrintFrame';
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(fr);
  const d = fr.contentWindow.document;
  d.open(); d.write(buildPrintDocument(body)); d.close();
  let printed = false;
  const go = () => {
    if (printed) return; printed = true;
    try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { console.warn(e); }
    setTimeout(() => fr.remove(), 60000);
  };
  // ننتظر الشعار والخط قبل الطباعة (بحد أقصى 2.5 ثانية)
  const img = d.querySelector('.nrh-logo img');
  const logoReady = new Promise((res) => { if (!img || img.complete) return res(); img.onload = res; img.onerror = res; });
  const fontsReady = (d.fonts && d.fonts.ready) ? d.fonts.ready.catch(() => {}) : Promise.resolve();
  Promise.race([Promise.all([logoReady, fontsReady]), new Promise((r) => setTimeout(r, 2500))]).then(() => setTimeout(go, 150));
}

// exportToWord القديمة تقرأ العنصر بمعرّفه من الصفحة، فنضع التقرير في عنصر مخفي ثم نزيله
export async function exportBehaviorWord(html, isoToday) {
  const host = document.createElement('div');
  host.id = 'bmReportContent'; host.setAttribute('data-landscape', '1');
  host.style.cssText = 'position:absolute;left:-99999px;top:0;width:1000px;';
  host.innerHTML = html; document.body.appendChild(host);
  try { await callExportToWord('bmReportContent', 'تقرير_رصد_السلوك_' + isoToday); }
  finally { host.remove(); }
}
