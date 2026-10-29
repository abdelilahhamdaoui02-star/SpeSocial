import { getLogo } from '../settings/logoStore.js';
import { getInstitution } from '../institution/institutionStore.js';
// تصدير جداول بوابتي التواصل مع الأولياء والمتابعة إلى Excel (RTL، شعار، ترويسة، توقيعات) — منقول حرفياً من pgExportXlsx/pgImgSize في script-10.js (الخطوة 47).
// ExcelJS وXLSX ما زالتا من CDN (تُنقلان إلى npm في الخطوة 48)، والشعار والمديرية والملف الشخصي تُقرأ كما كانت.
//   env: { win, doc, profile() → الملف الشخصي }
export function pgImgSize(src, win = window) {
  return new Promise((res) => {
    if (typeof win.Image === 'undefined') return res({ w: 520, h: 97 });
    const im = new win.Image();
    im.onload = () => res({ w: im.naturalWidth || 520, h: im.naturalHeight || 97 });
    im.onerror = () => res({ w: 520, h: 97 });
    im.src = src;
  });
}

export async function pgExportXlsx(o, rows, env) {
  const win = (env && env.win) || window;
  const doc = (env && env.doc) || document;
  const userProfile = env && env.profile ? env.profile() : {};
  const F = o.fields, n = F.length + 1, title = o.print || o.file;
  const inst = (userProfile && userProfile.institution) || 'المؤسسة التعليمية';
  let dir = ''; try { dir = (env && env.directorate ? env.directorate() : getInstitution().getDirectorate()) || ''; } catch { /* لا شيء */ }
  const dateStr = new Date().toLocaleDateString('ar-MA');
  if (!win.ExcelJS) { // احتياطي: تصدير مبسّط باتجاه من اليمين لليسار
    const XLSX = win.XLSX;
    const ws = XLSX.utils.json_to_sheet(rows.map((r) => Object.fromEntries(F.map((f) => [f.l, r[f.k] || '']))));
    ws['!cols'] = F.map((f) => ({ wch: f.t === 'area' ? 45 : 22 }));
    const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, 'السجل'); XLSX.writeFile(wb, o.file + '.xlsx');
    return;
  }
  const ExcelJS = win.ExcelJS;
  // ── عرض الأعمدة (الخط العربي أعرض من اللاتيني ⇒ معامل 1.3) ──
  const wid = [6].concat(F.map((f) => {
    let mx = f.l.length; for (const r of rows) { const L = String(r[f.k] || '').length; if (L > mx) mx = L; }
    return f.t === 'area' ? 52 : Math.min(Math.max(Math.ceil(mx * 1.3) + 6, 15), 34);
  }));
  const totalPx = wid.reduce((s, w) => s + Math.round(w * 7 + 5), 0);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('السجل', { views: [{ rightToLeft: true, showGridLines: false }], pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.6, header: 0.3, footer: 0.3 } }, headerFooter: { oddFooter: '&C&"Arial,Regular"&9&P / &N' } });
  wid.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  const FONT = 'Arial', thin = { style: 'thin', color: { argb: 'FF94A3B8' } }, bd = { top: thin, left: thin, bottom: thin, right: thin };
  const line = (r, text, size, bold, color, h) => { ws.mergeCells(r, 1, r, n); const c = ws.getCell(r, 1); c.value = text; c.font = { name: FONT, size, bold, color: { argb: color } }; c.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' }; ws.getRow(r).height = h; };
  // ── 1) الشعار (كما في الطباعة) ──
  ws.getRow(1).height = 20;
  const logo = (env && env.logo ? env.logo() : getLogo()) || '';
  const ext = /^data:image\/[\w.+-]+;base64,\/9j\//.test(logo) ? 'jpeg' : /^data:image\/[\w.+-]+;base64,iVBOR/.test(logo) ? 'png' : /^data:image\/[\w.+-]+;base64,R0lGOD/.test(logo) ? 'gif' : '';
  if (ext) {
    try {
      const sz = await pgImgSize(logo, win); let lh = 100, lw = lh * sz.w / sz.h; if (lw > totalPx - 20) { lw = totalPx - 20; lh = lw * sz.h / sz.w; }
      let x = (totalPx - lw) / 2, col = 0; while (col < n - 1 && x >= Math.round(wid[col] * 7 + 5)) { x -= Math.round(wid[col] * 7 + 5); col++; }
      ws.addImage(wb.addImage({ base64: logo, extension: ext }), { tl: { col: col + x / Math.round(wid[col] * 7 + 5), row: 0.08 }, ext: { width: lw, height: lh }, editAs: 'oneCell' });
      ws.getRow(1).height = Math.ceil(lh * 0.75) + 8;
    } catch (e) { console.warn('logo', e); }
  }
  line(2, dir, 12, true, 'FF000000', 22); line(3, inst, 12, true, 'FF000000', 22);
  line(4, title, 16, true, 'FF1A3A5C', 30);
  line(5, 'عدد السجلات: ' + rows.length + ' — بتاريخ ' + dateStr, 10, false, 'FF475569', 20);
  ws.getRow(6).height = 6;
  // ── 2) رأس الجدول ──
  const HR = 7, hr = ws.getRow(HR); hr.height = 28;
  ['#'].concat(F.map((f) => f.l)).forEach((h, i) => { const c = hr.getCell(i + 1); c.value = h; c.font = { name: FONT, size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A5C' } }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'rtl' }; c.border = bd; });
  // ── 3) الصفوف ──
  rows.forEach((r, i) => {
    const vals = F.map((f) => String(r[f.k] || '')), row = ws.addRow([i + 1].concat(vals));
    let lines = 1; vals.forEach((v, j) => { const per = Math.max(wid[j + 1] * 0.85, 8), L = v.split('\n').reduce((t, p) => t + Math.max(1, Math.ceil(p.length / per)), 0); if (L > lines) lines = L; });
    row.height = Math.max(24, lines * 17 + 7);
    row.eachCell({ includeEmpty: true }, (c, ci) => {
      const f = F[ci - 2], isText = f && (f.t === 'area' || (!f.t && !f.opts && f.k !== 'massar' && f.k !== 'cls' && f.k !== 'cin'));
      c.font = { name: FONT, size: 11 }; c.border = bd; c.numFmt = '@';
      c.alignment = isText ? { horizontal: 'right', vertical: 'middle', wrapText: true, indent: 1, readingOrder: 'rtl' } : { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: ci === 1 ? 'ltr' : 'rtl' };
      if (i % 2) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    });
  });
  if (!rows.length) { const r = ws.addRow(['لا توجد سجلات.']); ws.mergeCells(r.number, 1, r.number, n); r.getCell(1).alignment = { horizontal: 'center' }; r.getCell(1).font = { name: FONT, size: 11, color: { argb: 'FF64748B' } }; r.height = 26; }
  // ── 4) التوقيعات ──
  const sr = ws.rowCount + 3, half = Math.max(1, Math.floor(n / 2));
  ws.mergeCells(sr, 1, sr, half); ws.mergeCells(sr, half + 1, sr, n);
  [[1, 'المختص الاجتماعي'], [half + 1, 'مدير المؤسسة']].forEach(([c, t]) => { const x = ws.getCell(sr, c); x.value = t; x.font = { name: FONT, size: 11, bold: true }; x.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rtl' }; });
  ws.getRow(sr).height = 24;
  ws.views = [{ rightToLeft: true, showGridLines: false, state: 'frozen', ySplit: HR }];
  ws.autoFilter = { from: { row: HR, column: 1 }, to: { row: HR, column: n } };
  ws.pageSetup.printTitlesRow = HR + ':' + HR; ws.pageSetup.printArea = 'A1:' + ws.getColumn(n).letter + sr;
  const buf = await wb.xlsx.writeBuffer();
  const a = doc.createElement('a'); a.href = win.URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  a.download = o.file + '.xlsx'; doc.body.appendChild(a); a.click(); a.remove(); setTimeout(() => win.URL.revokeObjectURL(a.href), 3000);
}
