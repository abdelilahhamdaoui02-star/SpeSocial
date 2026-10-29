// مساعدات الطباعة — المرحلة 46. صارت هنا بدل ثلاثة أجزاء قديمة:
//  1) script-37.js كاملاً: تحويل شبكات .report-grid إلى جدول مضغوط بأربعة أعمدة داخل نوافذ الطباعة.
//  2) script-16.js: _markEmptyFields و_waitLogoThenPrint (و iDirectPrint التي لم يعد يستدعيها أحد).
//  3) script-10.js: مستمعا beforeprint/afterprint اللذان يفعّلان وضع الطباعة i-print-mode.
// السلوك منقول حرفياً؛ كل دالة تقبل document اختيارياً ليسهل اختبارها بلا متصفح.

// ───────── 1) الجدول المضغوط (كان script-37.js) ─────────

export function isFullField(field) {
  const st = field.getAttribute('style') || '';
  return /grid-column\s*:\s*span\s*([2-9])/.test(st);
}

function tr(cells) { return '<tr>' + cells + '</tr>'; }
function lbl(f) { const e = f.querySelector('.lbl'); return e ? e.innerHTML : ''; }
function val(f) { const e = f.querySelector('.val'); return e ? e.innerHTML : ''; }

// يبني صفوف الجدول (HTML) من قائمة الحقول: حقل عريض = صف كامل، وغيره يُزاوَج مع الذي يليه
export function buildCompactRows(fields) {
  const rows = [];
  let pending = null;
  const flush = () => {
    if (!pending) return;
    rows.push(tr('<td class="info-lbl">' + lbl(pending) + '</td><td class="info-val" colspan="3">' + val(pending) + '</td>'));
    pending = null;
  };
  fields.forEach((f) => {
    if (isFullField(f)) {
      flush();
      rows.push(tr('<td class="info-lbl">' + lbl(f) + '</td><td class="info-val" colspan="3">' + val(f) + '</td>'));
      return;
    }
    if (!pending) { pending = f; return; }
    rows.push(tr('<td class="info-lbl">' + lbl(pending) + '</td><td class="info-val">' + val(pending) + '</td>' +
                 '<td class="info-lbl">' + lbl(f) + '</td><td class="info-val">' + val(f) + '</td>'));
    pending = null;
  });
  flush();
  return rows;
}

export const COMPACT_TABLE_STYLE = "width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;margin-bottom:10px;";

export function convertGrid(grid, doc = document) {
  const fields = Array.prototype.filter.call(grid.querySelectorAll(':scope > .report-field'), (f) =>
    !f.classList.contains('empty-field') && f.querySelector('.lbl'));
  if (!fields.length) { grid.setAttribute('data-compact', '1'); return; }
  const rows = buildCompactRows(fields);
  const table = doc.createElement('table');
  table.className = 'info-table-report';
  table.setAttribute('data-compact', '1');
  table.setAttribute('style', COMPACT_TABLE_STYLE);
  table.innerHTML = '<tbody>' + rows.join('') + '</tbody>';
  grid.parentNode.replaceChild(table, grid);
}

export function compactAllGrids(doc = document) {
  doc.querySelectorAll('.print-modal .report-grid:not([data-compact])').forEach((g) => convertGrid(g, doc));
}

// ───────── 2) وسم الحقول الفارغة وانتظار الشعار قبل الطباعة (كانا في script-16.js) ─────────

export function markEmptyFields(doc = document) {
  doc.querySelectorAll('.print-modal.open .report-field').forEach((field) => {
    const valEl = field.querySelector('.val');
    if (!valEl) return;
    const txt = valEl.textContent.trim();
    if (txt === '—' || txt === '' || txt === '-') field.classList.add('empty-field');
    else field.classList.remove('empty-field');
  });
}

export function waitLogoThenPrint(env = {}) {
  const doc = env.document || document;
  const doPrint = env.print || (() => window.print());
  const later = env.setTimeout || ((fn, ms) => setTimeout(fn, ms));
  markEmptyFields(doc);
  const imgs = doc.querySelectorAll('.print-modal.open #ministry-logo-img');
  let loaded = 0;
  const total = imgs.length;
  if (total === 0) { later(() => doPrint(), 200); return; }
  imgs.forEach((img) => {
    if (img.complete && img.naturalHeight > 0) { loaded++; if (loaded >= total) doPrint(); }
    else {
      img.onload = () => { loaded++; if (loaded >= total) doPrint(); };
      img.onerror = () => { loaded++; if (loaded >= total) doPrint(); };
      // ضمان تشغيل الطباعة حتى لو لم تُطلق أي أحداث
      later(() => { if (loaded < total) { loaded = total; doPrint(); } }, 800);
    }
  });
}

// ───────── 3) وضع الطباعة (كان في script-10.js) ─────────

export const PRINT_MODAL_SELECTOR = '#interviewPrintModal.open, #snPrintModal.open, #reintegrationPrintModal.open, #absencePrintModal.open, #vioPrintModal.open, #wsPrintModal.open, #pdPrintModal.open, #pgPrintModal.open';

export function createPrintMode(doc = document) {
  let origTitle = null;
  return {
    before() {
      if (doc.querySelector(PRINT_MODAL_SELECTOR)) {
        doc.documentElement.classList.add('i-print-mode');
        if (origTitle === null) origTitle = doc.title;
        doc.title = ' ';
      }
    },
    after() {
      doc.documentElement.classList.remove('i-print-mode');
      if (origTitle !== null) { doc.title = origTitle; origTitle = null; }
    },
  };
}

// ───────── التركيب ─────────

let installed = false;

export function installPrintHelpers() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  // الأسماء العامة ما زالت تُستدعى من PreviewHost ومن شيفرات الطباعة
  window._markEmptyFields = () => markEmptyFields();
  window._waitLogoThenPrint = () => waitLogoThenPrint();

  const mode = createPrintMode();
  // الترتيب كما كان: وضع الطباعة (script-10) ثم الجدول المضغوط (script-37)
  window.addEventListener('beforeprint', () => mode.before());
  window.addEventListener('afterprint', () => mode.after());

  window.addEventListener('beforeprint', () => compactAllGrids());
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; compactAllGrids(); });
  }).observe(document.body, { childList: true, subtree: true });
  compactAllGrids();
}
