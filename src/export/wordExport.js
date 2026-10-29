// ══════════════════════════════════════════════════════════
//  📄 exportToWord — تصدير التقرير إلى ملف Word مع دعم RTL
//  وحدة ES (كانت script-05.js). تُسجَّل أيضاً على window
//  لأن الكود القديم (script-10 وغيره) ما زال يناديها بالاسم العام.
//  تقرأ العنصر بمعرّفه من الصفحة وتلتقط الأصناف: report-section-title, report-grid,
//  report-summary-block, info-table-report, proc-table-report, wk-table-report,
//  pd-table-report, pd-line, proc-report-item, st-chart-img, ws-photo-row, sig-block.
// ══════════════════════════════════════════════════════════
import { loadExternalLibs } from '../libs/externalLibs.js';

export async function exportToWord(contentId, fileName) {
  const container = document.getElementById(contentId);
  if (!container) return;
  try {
    // المكتبة من npm (الخطوة 48): تُحمَّل عند الحاجة إن لم تكن حُمِّلت مع الصفحة
    if (typeof window.docx === 'undefined') await loadExternalLibs();
    await exportToWordDocx(container, fileName);
  } catch (err) {
    console.warn('docx export failed, using HTML fallback:', err);
    exportToWordFallback(container, fileName);
  }
}

// بديل يعمل دون إنترنت: ملف .doc (HTML) يفتحه Word مباشرة
function exportToWordFallback(container, fileName) {
  const clone = container.cloneNode(true);
  clone.querySelectorAll('script,button').forEach(function(e){ e.remove(); });
  const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + (fileName||'تقرير') + '</title>' +
    '<style>@page{size:A4;margin:18mm}body{font-family:Arial,sans-serif;direction:rtl;text-align:right;font-size:11pt}table{width:100%;border-collapse:collapse;margin-bottom:8pt}td,th{border:1.5px solid #000;padding:4pt 6pt;font-size:10pt}.info-lbl,th{background:#eef4fb;font-weight:bold}.report-section-title{font-weight:bold;font-size:12pt;margin:10pt 0 4pt}.nrh-title{font-size:16pt;font-weight:bold;text-align:center}.nrh-dir,.nrh-school{text-align:center}.signatures{margin-top:30pt}.sig-block{display:inline-block;width:45%;text-align:center}.sig-line{border-top:1px solid #000;margin:30pt 20pt 4pt}</style></head><body dir="rtl">' + clone.innerHTML + '</body></html>';
  const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = (fileName || 'تقرير') + '.doc';
  document.body.appendChild(a); a.click();
  setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

async function exportToWordDocx(container, fileName) {
  const docx = window.docx; // مكتبة docx من npm تُسجَّلها loadExternalLibs على window

  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
          AlignmentType, WidthType, BorderStyle, ShadingType,
          VerticalAlign, ImageRun, HeightRule } = docx;

  const ARABIC_FONT = 'Arial';
  const PAGE_W = 11906;
  const PAGE_H = 16838;
  const MARGIN  = 720;
  const LAND = container.getAttribute('data-landscape') === '1';
  const CONTENT_W = (LAND ? PAGE_H : PAGE_W) - MARGIN * 2;

  function rtlPara(text, opts) {
    opts = opts || {};
    if (!text || !text.trim()) return new Paragraph({ children: [new TextRun('')] });
    return new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { before: opts.spaceBefore || 40, after: opts.spaceAfter || 40 },
      children: [new TextRun({
        text: text.trim(),
        font: ARABIC_FONT,
        size: opts.size || 22,
        bold: opts.bold || false,
        color: opts.color || '000000',
        rightToLeft: true,
      })]
    });
  }

  function divider() {
    return new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1a3a5c', space: 1 } },
      spacing: { before: 80, after: 80 },
      children: [new TextRun('')]
    });
  }

  function sectionTitle(text) {
    return new Paragraph({
      bidirectional: true,
      alignment: AlignmentType.RIGHT,
      spacing: { before: 160, after: 80 },
      // لا حدود جانبية — العارضة — تُكتب في النص
      children: [new TextRun({
        text: '— ' + text.trim(),
        font: ARABIC_FONT,
        size: 22,
        bold: true,
        color: '000000',
        rightToLeft: true,
      })]
    });
  }

  function fieldRow(label, value) {
    const brd = {
      top:    { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      left:   { style: BorderStyle.SINGLE, size: 12, color: '000000' },
      right:  { style: BorderStyle.SINGLE, size: 12, color: '000000' },
    };
    function mkCell(txt, bold, bg) {
      return new TableCell({
        borders: brd,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        width: { size: Math.floor(CONTENT_W / 2), type: WidthType.DXA },
        shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({
            text: (txt || '—').trim(),
            font: ARABIC_FONT,
            size: 18,
            bold: bold || false,
            color: '000000',
            rightToLeft: true,
          })]
        })]
      });
    }
    return new TableRow({ children: [mkCell(value, false, 'fafbfd'), mkCell(label, true, 'eef2f7')] });
  }

  // خلية جدول عامة (RTL)
  function wCell(txt, bold, bg, width, span, color, keepEmpty) {
    const b = { style: BorderStyle.SINGLE, size: 12, color: '000000' };
    const lines = Array.isArray(txt) ? txt : [txt];
    const paras = lines.map(function(t) {
      const clean = ((t || '').replace(/\s+/g, ' ').trim());
      return new Paragraph({
        bidirectional: true,
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({
          text: clean || (keepEmpty ? '' : '—'),
          font: ARABIC_FONT, size: 18, bold: !!bold,
          color: '000000',
          rightToLeft: true,
        })]
      });
    });
    return new TableCell({
      borders: { top: b, bottom: b, left: b, right: b },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      width: { size: width, type: WidthType.DXA },
      columnSpan: span > 1 ? span : undefined,
      shading: bg ? { fill: bg, type: ShadingType.CLEAR, color: 'auto' } : undefined,
      verticalAlign: VerticalAlign.CENTER,
      children: paras
    });
  }

  const children = [];

  // الشعار
  const logoImg = container.querySelector('.nrh-logo img, .official-logo-wrap img');
  if (logoImg && logoImg.src && logoImg.src.startsWith('data:image')) {
    try {
      const base64 = logoImg.src.split(',')[1];
      const mimeMatch = logoImg.src.match(/data:(image\/\w+);/);
      let imgType = mimeMatch ? mimeMatch[1].replace('image/', '') : 'png';
      if (base64.startsWith('/9j/')) imgType = 'jpg'; else if (base64.startsWith('iVBOR')) imgType = 'png'; else if (imgType === 'jpeg') imgType = 'jpg';
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
        children: [new ImageRun({ data: bytes, transformation: { width: 595, height: 120 }, type: imgType })]
      }));
    } catch(e) { console.warn('Logo:', e); }
  }

  // المديرية والمدرسة والعنوان
  const dir    = container.querySelector('.nrh-dir');
  const school = container.querySelector('.nrh-school');
  const ttl    = container.querySelector('.nrh-title');
  if (dir)    children.push(rtlPara(dir.textContent,    { size: 20, spaceBefore: 20, spaceAfter: 20 }));
  if (school) children.push(rtlPara(school.textContent, { size: 22, spaceBefore: 20, spaceAfter: 20 }));
  if (ttl)    children.push(rtlPara(ttl.textContent,    { size: 28, bold: true, spaceBefore: 60, spaceAfter: 60 }));
  children.push(divider());

  // أقسام التقرير
  const processedGrids = new WeakSet();
  container.querySelectorAll('.report-section-title, .report-grid, .report-summary-block, .proc-report-item, table.info-table-report, table.proc-table-report, table.wk-table-report, table.pd-table-report, .pd-line, img.st-chart-img').forEach(function(el) {
    if (el.classList.contains('report-section-title')) {
      children.push(sectionTitle(el.textContent));

    } else if (el.classList.contains('report-grid')) {
      if (processedGrids.has(el)) return;
      processedGrids.add(el);
      const rows = [];
      el.querySelectorAll('.report-field').forEach(function(field) {
        const lbl = field.querySelector('.lbl');
        const val = field.querySelector('.val');
        if (lbl && val) rows.push(fieldRow(lbl.textContent, val.textContent));
      });
      if (rows.length) {
        children.push(new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [Math.floor(CONTENT_W/2), Math.ceil(CONTENT_W/2)],
          rows: rows,
        }));
        children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } }));
      }

    } else if (el.classList.contains('report-summary-block')) {
      el.textContent.trim().split('\n').filter(function(l){return l.trim();}).forEach(function(line) {
        children.push(rtlPara(line, { size: 20, spaceBefore: 30, spaceAfter: 30 }));
      });
      children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 60 } }));

    } else if (el.classList.contains('info-table-report')) {
      // جدول معلومات (اسم/قيمة × عمودين) — الخلايا تُكتب بترتيب منطقي من اليمين لليسار
      const trs = Array.from(el.querySelectorAll('tr'));
      const wrows = trs.map(function(tr) {
        const tds = Array.from(tr.children);
        const cells = tds.map(function(td) {
          const span = parseInt(td.getAttribute('colspan') || '1', 10);
          const isLbl = td.classList.contains('info-lbl');
          const w = Math.floor(CONTENT_W * (span === 3 ? 0.75 : (isLbl ? 0.18 : 0.32)));
          return wCell(td.textContent, isLbl, isLbl ? 'eef4fb' : 'ffffff', w, span);
        });
        return new TableRow({ children: cells });
      });
      if (wrows.length) {
        children.push(new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: [Math.floor(CONTENT_W*0.18), Math.floor(CONTENT_W*0.32), Math.floor(CONTENT_W*0.18), Math.floor(CONTENT_W*0.32)],
          visuallyRightToLeft: true,
          rows: wrows,
        }));
        children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } }));
      }

    } else if (el.classList.contains('proc-table-report')) {
      // جدول الإجراءات المتخذة (اسم الإجراء / التاريخ / الملاحظات)
      const ncols = el.querySelectorAll('thead th').length || 3;
      const widths = ncols === 2
        ? [Math.floor(CONTENT_W*0.35), Math.ceil(CONTENT_W*0.65)]
        : [Math.floor(CONTENT_W*0.36), Math.floor(CONTENT_W*0.16), Math.floor(CONTENT_W*0.48)];
      const cellTxt = function(td) {
        const lis = td.querySelectorAll('li');
        return lis.length ? Array.from(lis).map(function(li, k){ return (k + 1) + '. ' + li.textContent; }) : td.textContent;
      };
      const prow = function(tr, head) {
        return new TableRow({ tableHeader: !!head, children: Array.from(tr.children).map(function(td, i) {
          return wCell(cellTxt(td), head, head ? 'e5e7eb' : 'ffffff', widths[i] || widths[widths.length - 1], 1, null);
        })});
      };
      const prows = [];
      el.querySelectorAll('thead tr').forEach(function(tr){ prows.push(prow(tr, true)); });
      el.querySelectorAll('tbody tr').forEach(function(tr){ prows.push(prow(tr, false)); });
      if (prows.length) {
        children.push(new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: widths,
          visuallyRightToLeft: true,
          rows: prows,
        }));
        children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } }));
      }

    } else if (el.classList.contains('wk-table-report')) {
      // جدول عام بعدد أعمدة متغيّر (التقرير الأسبوعي) — العمود الأول في أقصى اليمين
      const ths = Array.from(el.querySelectorAll('thead th'));
      const ratios = ths.map(function(th){ return parseFloat(th.getAttribute('data-w')) || 1; });
      const sum = ratios.reduce(function(a,b){ return a+b; }, 0) || 1;
      const widths = ratios.map(function(r){ return Math.floor(CONTENT_W * r / sum); });
      const wrows = [];
      el.querySelectorAll('thead tr').forEach(function(tr){
        wrows.push(new TableRow({ tableHeader: true, children: Array.from(tr.children).map(function(td, i){
          return wCell(td.textContent, true, 'd9d9d9', widths[i], 1, null);
        })}));
      });
      el.querySelectorAll('tbody tr').forEach(function(tr){
        wrows.push(new TableRow({ cantSplit: true, children: Array.from(tr.children).map(function(td, i){
          return wCell(td.textContent, false, 'ffffff', widths[i], 1, null);
        })}));
      });
      if (wrows.length) {
        children.push(new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: widths,
          visuallyRightToLeft: true,
          rows: wrows,
        }));
        children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } }));
      }

    } else if (el.classList.contains('pd-line')) {
      // سطر نصي حر (رسالة الإخبار: من/إلى/الموضوع/المرجع) — خلايا الصف تُدمج بمسافة
      const txt = el.tagName === 'TR'
        ? Array.from(el.children).map(function(c){ return c.textContent.replace(/\s+/g, ' ').trim(); }).filter(Boolean).join('  ')
        : el.textContent.replace(/\s+/g, ' ');
      if (txt.trim()) children.push(rtlPara(txt, { size: 22, bold: el.getAttribute('data-bold') !== '0', spaceBefore: 30, spaceAfter: 30 }));

    } else if (el.classList.contains('pd-table-report')) {
      // جدول عام يحافظ على الخلايا الفارغة (توقيعات الأساتذة / التوقيعات والختم)
      const firstRow = el.querySelector('tr');
      const ratios = Array.from(firstRow.children).map(function(c){ return parseFloat(c.getAttribute('data-w')) || 1; });
      const sum = ratios.reduce(function(a, b){ return a + b; }, 0) || 1;
      const widths = ratios.map(function(r){ return Math.floor(CONTENT_W * r / sum); });
      const trows = [];
      el.querySelectorAll('tr').forEach(function(tr) {
        const head = !!tr.closest('thead');
        const h = parseFloat(tr.getAttribute('data-h'));
        trows.push(new TableRow({
          tableHeader: head, cantSplit: true,
          height: h ? { value: Math.round(h * 15), rule: HeightRule.ATLEAST } : undefined,
          children: Array.from(tr.children).map(function(td, i) {
            return wCell(td.textContent, head || td.hasAttribute('data-bold'), head ? 'e5e7eb' : 'ffffff', widths[i] || widths[widths.length - 1], 1, null, true);
          })
        }));
      });
      if (trows.length) {
        children.push(new Table({
          width: { size: CONTENT_W, type: WidthType.DXA },
          columnWidths: widths,
          visuallyRightToLeft: true,
          rows: trows,
        }));
        children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } }));
      }

    } else if (el.classList.contains('st-chart-img')) {
      try {
        const bin = atob(el.src.split(',')[1]);
        const bytes = new Uint8Array(bin.length);
        for (let q = 0; q < bin.length; q++) bytes[q] = bin.charCodeAt(q);
        const sw = parseFloat(el.getAttribute('data-w')) || 560, sh = parseFloat(el.getAttribute('data-h')) || 220;
        const wpx = 480, hpx = Math.round(wpx * sh / sw);
        children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 100 },
          children: [new ImageRun({ data: bytes, type: 'png', transformation: { width: wpx, height: hpx } })] }));
      } catch (e) { console.warn('chart img:', e); }

    } else if (el.classList.contains('proc-report-item')) {
      const h4 = el.querySelector('h4');
      const p  = el.querySelector('p');
      if (h4) children.push(rtlPara(h4.textContent, { size: 20, bold: true, spaceBefore: 80, spaceAfter: 20 }));
      if (p)  children.push(rtlPara(p.textContent,  { size: 19, spaceBefore: 20, spaceAfter: 40 }));
    }
  });

  // التوقيعات
  const sigBlocks = Array.from(container.querySelectorAll('.sig-block')).filter(function(s){ return s.querySelector('.sig-line'); });
  if (sigBlocks.length) {
    children.push(divider());
    const colW = Math.floor(CONTENT_W / sigBlocks.length);
    const sigCells = sigBlocks.map(function(sb) {
      return new TableCell({
        borders: {
          top:   { style: BorderStyle.NONE },
          left:  { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
          bottom:{ style: BorderStyle.SINGLE, size: 6, color: '1a3a5c' }
        },
        margins: { top: 700, bottom: 60, left: 100, right: 100 },
        width: { size: colW, type: WidthType.DXA },
        children: [new Paragraph({
          bidirectional: true,
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: sb.textContent.replace(/\s+/g,' ').trim(),
            font: ARABIC_FONT, size: 18, bold: true, color: '000000', rightToLeft: true
          })]
        })]
      });
    });
    children.push(new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: Array(sigBlocks.length).fill(colW),
      rows: [new TableRow({ children: sigCells })]
    }));
  }

  // صور النشاط (بوابة الورشات) — صفحة مستقلة بعد التوقيعات، كل صورة بإطارها الفعلي
  const wsPhotoRows = Array.from(container.querySelectorAll('.ws-photo-row'));
  if (wsPhotoRows.length) {
    const ptitle = container.querySelector('.ws-photos-title');
    children.push(new Paragraph({
      pageBreakBefore: true, bidirectional: true, alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: ptitle ? ptitle.textContent : 'صور النشاط', font: ARABIC_FONT, size: 24, bold: true, rightToLeft: true })]
    }));
    const bd = { style: BorderStyle.SINGLE, size: 6, color: '555555' };
    wsPhotoRows.forEach(function (rowEl) {
      const items = Array.from(rowEl.querySelectorAll('.ws-photo-item'));
      const widths = items.map(function (it) { return Math.round(parseFloat(it.getAttribute('data-w')) * 56.69); });
      const total = widths.reduce(function (a, b) { return a + b; }, 0);
      const cells = items.map(function (it, k) {
        const im = it.querySelector('img');
        const wpx = Math.round(parseFloat(it.getAttribute('data-w')) * 3.7795) - 4;
        const hpx = Math.round(parseFloat(it.getAttribute('data-h')) * 3.7795) - 4;
        let kids = [new Paragraph({ children: [new TextRun('')] })];
        try {
          const bin = atob(im.src.split(',')[1]);
          const bytes = new Uint8Array(bin.length);
          for (let q = 0; q < bin.length; q++) bytes[q] = bin.charCodeAt(q);
          kids = [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 },
            children: [new ImageRun({ data: bytes, type: 'jpg', transformation: { width: wpx, height: hpx } })] })];
        } catch (e) { console.warn('ws photo:', e); }
        return new TableCell({
          width: { size: widths[k], type: WidthType.DXA },
          verticalAlign: VerticalAlign.CENTER,
          borders: { top: bd, bottom: bd, left: bd, right: bd },
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          children: kids
        });
      });
      children.push(new Table({
        width: { size: total, type: WidthType.DXA },
        columnWidths: widths,
        alignment: AlignmentType.CENTER,
        visuallyRightToLeft: true,
        rows: [new TableRow({ cantSplit: true, children: cells })]
      }));
      children.push(new Paragraph({ children: [new TextRun('')], spacing: { before: 0, after: 60 } }));
    });
  }

  // بناء الوثيقة
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: ARABIC_FONT, size: 22, rightToLeft: true },
          paragraph: { bidirectional: true, alignment: AlignmentType.RIGHT }
        }
      }
    },
    settings: {
      evenAndOddHeaders: false,
    },
    sections: [{
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H, orientation: LAND ? docx.PageOrientation.LANDSCAPE : undefined },
          margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
        },
        bidiVisual: true,
      },
      children: children.length ? children : [rtlPara('التقرير فارغ')]
    }]
  });

  // استخدام toBlob لأن toBuffer يعتمد على Buffer (Node.js فقط) وهو غير متاح في المتصفح
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (fileName || 'تقرير') + '.docx';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

// المكوّنات تفضّل النسخة المسجّلة على window إن وُجدت (تسهّل الاختبار والتجاوز)، وإلا تستعمل الوحدة مباشرة
export const callExportToWord = (contentId, fileName) => {
  const w = typeof window !== 'undefined' ? window : null;
  return (w && typeof w.exportToWord === 'function' ? w.exportToWord : exportToWord)(contentId, fileName);
};

if (typeof window !== 'undefined') window.exportToWord = exportToWord;
