// صفحة طباعة «سجل التلميذ» (تُفتح في نافذة جديدة) — نص HTML كامل بلا DOM.
import { esc } from './historyLogic.js';

const STYLE = `
      @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Cairo',sans-serif;padding:26px 30px;color:#1e293b;direction:rtl;background:white;}
      .report-header{text-align:center;padding-bottom:8px;border-bottom:2px solid black;margin-bottom:14px;}
      .logo-wrap{width:100%;margin-bottom:5px;line-height:0;}
      .nrh-dir{font-family:'Amiri',serif;font-size:0.78rem;font-weight:700;color:black;margin-bottom:2px;}
      .nrh-school{font-family:'Amiri',serif;font-size:0.85rem;font-weight:700;color:black;margin-bottom:4px;}
      .nrh-title{font-family:'Amiri',serif;font-size:1.25rem;font-weight:900;color:black;border-top:1px solid #bbb;padding-top:6px;margin-top:5px;}
      .meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:0.80rem;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:10px;}
      .meta span strong{color:#1e293b;}
      table{width:100%;border-collapse:collapse;font-size:0.77rem;font-family:'Cairo',sans-serif;}
      thead tr{background:#1e293b;color:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      th{padding:8px 10px;text-align:right;font-weight:700;}
      td{padding:7px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top;}
      tr:nth-child(even) td{background:#f8fafc;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
      .footer-sig{margin-top:40px;display:flex;justify-content:space-between;}
      .sig-block{text-align:center;font-size:0.80rem;color:#1e293b;}
      .sig-line{width:140px;border-bottom:1.5px solid #333;margin:0 auto 6px;}
      @media print{body{padding:12px 18px;}@page{margin:0;size:A4 portrait;}-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    `;

const dash = (v) => esc(v || '—');
const C = 'style="text-align:center;"';
const CN = 'style="text-align:center;white-space:nowrap;"';

function rowsOf(type, entries) {
  if (type === 'reintegration') {
    return entries.map((e, i) => `<tr>
    <td ${C}>${i + 1}</td>
    <td ${CN}>${dash(e.reintegrationDate)}</td>
    <td ${C}>${dash(e.absenceDuration)}</td>
    <td>${esc((e.procedures || []).join(' / ') || '—')}</td>
    <td ${C}>${dash(e.priority)}</td>
    <td>${dash(e.currentStatus)}</td>
    <td>${dash(e.recommendation)}</td>
  </tr>`).join('');
  }
  return entries.map((e, i) => `<tr>
    <td ${C}>${i + 1}</td>
    <td ${CN}>${dash(e.interviewDate)}</td>
    <td>${dash(e.subject)}</td>
    <td ${C}>${dash(e.priority)}</td>
    <td>${dash(e.currentStatus)}</td>
    <td>${dash(e.summary)}</td>
    <td ${C}>${dash(e.nextFollowup)}</td>
  </tr>`).join('');
}

const HEAD = {
  reintegration: '<th>#</th><th>تاريخ الإدماج</th><th>مدة الانقطاع</th><th>الإجراءات</th><th>الاولوية</th><th>الحالة</th><th>التوصية</th>',
  interview: '<th>#</th><th>التاريخ</th><th>الموضوع</th><th>الاولوية</th><th>الحالة</th><th>ملخص المقابلة</th><th>المتابعة القادمة</th>',
};

// entries: سجلات التلميذ مرتبة؛ logo: data URL أو ''؛ now: تاريخ الطباعة؛ directorate: يبقى الاسم القديم افتراضياً
export function buildHistoryPrintHtml({ type, entries, name, logo = '', now = new Date(), directorate = 'مديرية الحي الحسني' }) {
  const isR = type === 'reintegration';
  const school = (entries[0] && entries[0].school) || 'المؤسسة التعليمية';
  const logoHtml = logo ? `<img src="${esc(logo)}" style="width:100%;height:auto;max-height:155px;display:block;object-fit:contain;">` : '';
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8">
    <title>${isR ? 'سجل إعادة الإدماج' : 'سجل مقابلات'}: ${esc(name)}</title>
    <style>${STYLE}</style></head><body>
    <div class="report-header">
      <div class="logo-wrap">${logoHtml}</div>
      <div class="nrh-dir">${esc(directorate)}</div>
      <div class="nrh-school">${esc(school)}</div>
      <div class="nrh-title">${isR ? 'سجل ملفات إعادة الإدماج المدرسي' : 'سجل المقابلات الفردية'}</div>
    </div>
    <div class="meta">
      <span>اسم التلميذ(ة): <strong>${esc(name)}</strong></span>
      <span>${isR ? 'عدد الملفات' : 'عدد المقابلات'}: <strong>${entries.length}</strong></span>
      <span>تاريخ الطباعة: <strong>${now.toLocaleDateString('ar-MA')}</strong></span>
    </div>
    <table>
      <thead><tr>${isR ? HEAD.reintegration : HEAD.interview}</tr></thead>
      <tbody>${rowsOf(type, entries)}</tbody>
    </table>
    <div class="footer-sig">
      <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
      <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
    </div>
  </body></html>`;
}
