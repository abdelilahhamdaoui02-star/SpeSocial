// أجزاء خلية اليقظة التي تلمس المتصفح مباشرة: الطباعة الإطارية وتصدير Word وقراءة/كتابة ملفات Excel.
// منقولة من vigPrintInFrame وvigCaseWord وvigDownloadWord وvigImportFromFile/vigExportExcel القديمة في script-16.js.
import { buildPrintDocument } from './vigilanceLogic.js';
import { callExportToWord } from '../export/wordExport.js';

// طباعة إطارية موحّدة: تنتظر الشعار والخط (بحد أقصى 2.5 ثانية) ثم تستدعي window.print
export function printInFrame(frameId, css, bodyHtml) {
  const old = document.getElementById(frameId); if (old) old.remove();
  const fr = document.createElement('iframe');
  fr.id = frameId;
  fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(fr);
  const d = fr.contentWindow.document;
  d.open(); d.write(buildPrintDocument(css, bodyHtml)); d.close();

  let printed = false;
  const go = () => {
    if (printed) return; printed = true;
    try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { console.warn(e); }
    setTimeout(() => fr.remove(), 60000);
  };
  const img = d.querySelector('.nrh-logo img');
  const logoReady = new Promise((res) => { if (!img || img.complete) return res(); img.onload = res; img.onerror = res; });
  const fontsReady = (d.fonts && d.fonts.ready) ? d.fonts.ready.catch(() => {}) : Promise.resolve();
  Promise.race([Promise.all([logoReady, fontsReady]), new Promise((r) => setTimeout(r, 2500))]).then(() => setTimeout(go, 150));
}

// exportToWord القديمة تقرأ العنصر بمعرّفه من الصفحة، فنضع المحتوى في عنصر مخفي ثم نزيله
export async function exportWord(hostId, html, fileName, { landscape = false, width = 800 } = {}) {
  const host = document.createElement('div');
  host.id = hostId;
  if (landscape) host.setAttribute('data-landscape', '1');
  host.style.cssText = 'position:absolute;left:-99999px;top:0;width:' + width + 'px;';
  host.innerHTML = html;
  document.body.appendChild(host);
  try { await callExportToWord(hostId, fileName); } finally { host.remove(); }
}

const xlsx = () => {
  if (!window.XLSX) throw new Error('مكتبة Excel غير جاهزة بعد');
  return window.XLSX;
};

// كتابة ورقة واحدة وتنزيلها: rows مصفوفة صفوف، cols عروض الأعمدة
export function writeSheet(rows, cols, sheetName, fileName) {
  const XLSX = xlsx();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = cols.map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

// قراءة أول ورقة من ملف Excel/CSV كمصفوفة صفوف (header:1)
export function readSheetRows(arrayBuffer) {
  const XLSX = xlsx();
  const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
}
