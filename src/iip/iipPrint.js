// طباعة تقرير البرنامج التدخلي الفردي (A4 عمودي) وتصديره إلى Word — منقولتان من iipPrint القديمة وزر Word.
import { PRINT_CSS } from './iipData.js';
import { wordFileName } from './iipLogic.js';
import { callExportToWord } from '../export/wordExport.js';

// المستند الذي يُكتب في إطار الطباعة: جدول بترويسة وتذييل فارغين يحجزان هامش 9مم في كل صفحة
export function buildPrintDocument(body) {
  return '<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title> </title><style>@page{size:A4 portrait;margin:0}table.pg{width:100%;border-collapse:collapse}table.pg>thead td,table.pg>tfoot td{height:9mm;padding:0;border:0}table.pg>tbody>tr>td{padding:0;border:0}</style><style>'
    + PRINT_CSS + '</style></head><body><table class="pg"><thead><tr><td></td></tr></thead><tbody><tr><td>' + body
    + '</td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>';
}

export function printReport(body) {
  const old = document.getElementById('iipPrintFrame'); if (old) old.remove();
  const fr = document.createElement('iframe');
  fr.id = 'iipPrintFrame';
  fr.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;visibility:hidden;';
  document.body.appendChild(fr);
  const d = fr.contentWindow.document; d.open(); d.write(buildPrintDocument(body)); d.close();
  let done = false;
  const go = () => {
    if (done) return; done = true;
    try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { console.warn(e); }
    setTimeout(() => fr.remove(), 60000);
  };
  // ننتظر الشعار قبل الطباعة (بحد أقصى 2.5 ثانية)
  const img = d.querySelector('.nrh-logo img');
  const ready = new Promise((r) => { if (!img || img.complete) return r(); img.onload = r; img.onerror = r; });
  Promise.race([ready, new Promise((r) => setTimeout(r, 2500))]).then(() => setTimeout(go, 200));
}

// exportToWord القديمة تقرأ العنصر بمعرّفه من الصفحة، فنضع التقرير في عنصر مخفي ثم نزيله
export function exportReportWord(html, studentName) {
  const h = document.createElement('div');
  h.id = 'iipReportContent';
  h.style.cssText = 'position:absolute;left:-99999px;top:0;width:1000px;';
  h.innerHTML = html;
  document.body.appendChild(h);
  return Promise.resolve(callExportToWord('iipReportContent', wordFileName(studentName))).finally(() => h.remove());
}
