
/* تحويل شبكات الحقول القديمة (.report-grid) إلى جدول مضغوط بأربعة أعمدة (عنوان | قيمة | عنوان | قيمة)
   في كل نوافذ الطباعة — لاختصار المساحة وتوحيد الشكل مع باقي البوابات */
(function () {
  function isFull(field) {
    var st = field.getAttribute('style') || '';
    return /grid-column\s*:\s*span\s*([2-9])/.test(st);
  }
  function tr(cells) { return '<tr>' + cells + '</tr>'; }
  function lbl(f) { var e = f.querySelector('.lbl'); return e ? e.innerHTML : ''; }
  function val(f) { var e = f.querySelector('.val'); return e ? e.innerHTML : ''; }
  function convert(grid) {
    var fields = Array.prototype.filter.call(grid.querySelectorAll(':scope > .report-field'), function (f) {
      return !f.classList.contains('empty-field') && f.querySelector('.lbl');
    });
    if (!fields.length) { grid.setAttribute('data-compact', '1'); return; }
    var rows = [], pending = null;
    function flush() {
      if (!pending) return;
      rows.push(tr('<td class="info-lbl">' + lbl(pending) + '</td><td class="info-val" colspan="3">' + val(pending) + '</td>'));
      pending = null;
    }
    fields.forEach(function (f) {
      if (isFull(f)) { flush(); rows.push(tr('<td class="info-lbl">' + lbl(f) + '</td><td class="info-val" colspan="3">' + val(f) + '</td>')); return; }
      if (!pending) { pending = f; return; }
      rows.push(tr('<td class="info-lbl">' + lbl(pending) + '</td><td class="info-val">' + val(pending) + '</td>' +
                   '<td class="info-lbl">' + lbl(f) + '</td><td class="info-val">' + val(f) + '</td>'));
      pending = null;
    });
    flush();
    var table = document.createElement('table');
    table.className = 'info-table-report';
    table.setAttribute('data-compact', '1');
    table.setAttribute('style', "width:100%;border-collapse:collapse;font-size:0.82rem;font-family:'Cairo',sans-serif;margin-bottom:10px;");
    table.innerHTML = '<tbody>' + rows.join('') + '</tbody>';
    grid.parentNode.replaceChild(table, grid);
  }
  function run() {
    document.querySelectorAll('.print-modal .report-grid:not([data-compact])').forEach(convert);
  }
  var queued = false;
  new MutationObserver(function () {
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; run(); });
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('beforeprint', run);
  run();
})();
