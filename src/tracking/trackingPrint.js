// صفحة طباعة «سجلات التتبع والمواكبة الفردية» (بطاقة لكل تلميذ) — نص HTML كامل بلا DOM.
// منقولة من downloadMonthlyTrackingTable القديمة. الفرق الوحيد المقصود: القيم النصية تمرّ عبر esc
// (القديم كان يحقن اسم التلميذ والملاحظات في HTML كما هي، فيكسر الصفحة أو ينفّذ شيفرة إن احتوت < أو &).
import { esc } from '../history/historyLogic.js';
import { groupByStudent, stripEmoji, trackingKpis, monthLabelOf } from './trackingLogic.js';

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', sans-serif; background: white; color: #000; font-size: 9pt; }
  .page-header { background: #1a3a5c; color: white; padding: 8px 14px; text-align: center; margin-bottom: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page-header .ministry { font-size: 6.5pt; opacity: 0.8; margin-bottom: 3px; }
  .page-header h1 { font-size: 10.5pt; font-weight: 800; color: #f0d97a; margin-bottom: 3px; }
  .page-header .period { font-size: 7pt; opacity: 0.85; }
  .kpi-bar { display: flex; border: 0.5px solid #999; overflow: hidden; margin: 0 0 10px; }
  .kpi-bar .k { flex: 1; padding: 5px 4px; text-align: center; border-left: 0.5px solid #999; }
  .kpi-bar .k:last-child { border-left: none; }
  .kpi-bar .kv { font-size: 12pt; font-weight: 800; color: #000; line-height: 1; }
  .kpi-bar .kl { font-size: 6pt; color: #000; font-weight: 600; margin-top: 2px; }
  .content { padding: 0; }
  .student-card { page-break-inside: avoid; margin-bottom: 10px; }
  @media print {
    @page { size: A4; margin: 0; }
    body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .student-card { page-break-inside: avoid; }
  }
`;

const CELL = 'padding:3px 6px;border:0.5px solid #999;color:#000;font-size:7.5pt;';
const TH = 'padding:3px 5px;text-align:right;font-size:7pt;font-weight:700;border:0.5px solid #2d4f72;';

function studentCard(s, si) {
  const inf = s.info;
  const lastResult = stripEmoji(s.logs[s.logs.length - 1]?.trackResult || '—');
  const logRows = s.logs.map((lg, li) => `
      <tr style="background:${li % 2 === 0 ? '#fff' : '#f5f5f5'};">
        <td style="${CELL}text-align:center;">${li + 1}</td>
        <td style="${CELL}font-weight:700;white-space:nowrap;">${esc(lg.trackDate)}</td>
        <td style="${CELL}font-weight:700;">${esc(stripEmoji(lg.trackResult) || '—')}</td>
        <td style="${CELL}">${esc(lg.trackNote !== '—' ? lg.trackNote : '—')}</td>
        <td style="${CELL}word-break:break-word;white-space:normal;">${esc(lg.trackBy !== '—' ? lg.trackBy : '—')}</td>
        <td style="${CELL}font-weight:700;white-space:nowrap;">${esc(lg.nextDate !== '—' ? lg.nextDate : '—')}</td>
      </tr>`).join('');

  return `
    <div class="student-card">
      <div style="background:#1a3a5c;padding:6px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="background:#c8a94a;color:#000;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:8pt;font-weight:800;flex-shrink:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;">${si + 1}</div>
          <div>
            <div style="color:#fff;font-size:9pt;font-weight:800;">${esc(inf.studentName)}</div>
            <div style="color:rgba(255,255,255,0.8);font-size:6.5pt;margin-top:1px;">${esc(stripEmoji(inf.typeLabel))} &nbsp;|&nbsp; ${esc(inf.school)}${inf.level !== '—' ? esc(' — ' + inf.level) : ''}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
          ${inf.priority !== '—' ? `<span style="background:rgba(255,255,255,0.2);color:#fff;border-radius:3px;padding:2px 6px;font-size:6.5pt;font-weight:700;">${esc(inf.priority)}</span>` : ''}
          <span style="background:rgba(255,255,255,0.9);color:#000;border-radius:3px;padding:2px 6px;font-size:6.5pt;font-weight:700;">${esc(lastResult)}</span>
          <span style="background:rgba(255,255,255,0.15);color:#fff;border-radius:3px;padding:2px 6px;font-size:6.5pt;">${s.logs.length} جلسة</span>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-family:'Cairo',sans-serif;table-layout:fixed;border:0.5px solid #999;">
        <colgroup>
          <col style="width:20px">
          <col style="width:65px">
          <col style="width:95px">
          <col>
          <col style="width:80px">
          <col style="width:75px">
        </colgroup>
        <thead>
          <tr style="background:#1a3a5c;color:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
            <th style="${TH}text-align:center;">#</th>
            <th style="${TH}">تاريخ التتبع</th>
            <th style="${TH}">نتيجة المتابعة</th>
            <th style="${TH}">ملخص الجلسة</th>
            <th style="${TH}">المتابع</th>
            <th style="${TH}">الموعد القادم</th>
          </tr>
        </thead>
        <tbody>${logRows}</tbody>
      </table>
      <div style="display:flex;justify-content:space-around;padding:5px 16px 4px;border:0.5px solid #999;border-top:none;background:#fafafa;gap:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #000;margin-bottom:3px;margin-top:12px;"></div>
          <span style="font-size:6pt;color:#000;">المختص الاجتماعي</span>
        </div>
        <div style="flex:1;text-align:center;">
          <div style="border-top:1px solid #000;margin-bottom:3px;margin-top:12px;"></div>
          <span style="font-size:6pt;color:#000;">مدير المؤسسة</span>
        </div>
      </div>
    </div>`;
}

// rows: الصفوف بعد الفلترة (بخيار forPrint)، monthFilter: 'YYYY-MM' أو ''، logoHtml: ناتج printLogoImg(logo, 90)
export function buildTrackingPrintHtml({ rows, monthFilter = '', logoHtml = '' }) {
  const monthLabel = monthLabelOf(monthFilter);
  const total = trackingKpis(rows, { forPrint: true }).total;
  const students = groupByStudent(rows);
  const cards = students.map(studentCard).join('');
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>سجلات التتبع — ${esc(monthLabel)}</title>
<style>${STYLE}</style>
</head>
<body>
  <div style="padding:6px 14px 0;">${logoHtml}</div>
  <div class="page-header">
    <h1>سجلات التتبع والمواكبة الفردية</h1>
    <div class="period">الفترة: ${esc(monthLabel)} &nbsp;|&nbsp; ${total} جلسة تتبع &nbsp;|&nbsp; ${students.length} تلميذ(ة)</div>
  </div>

  <div class="content">${rows.length ? cards : '<div style="text-align:center;padding:30px;color:#000;">لا توجد سجلات تتبع للفترة المحددة.</div>'}</div>
</body></html>`;
}
