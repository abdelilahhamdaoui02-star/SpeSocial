function _markEmptyFields() {
  // تعليم كل .report-field يحتوي قيمة "—" أو فارغة بـ empty-field
  document.querySelectorAll('.print-modal.open .report-field').forEach(function(field) {
    var valEl = field.querySelector('.val');
    if (!valEl) return;
    var txt = valEl.textContent.trim();
    if (txt === '—' || txt === '' || txt === '-') {
      field.classList.add('empty-field');
    } else {
      field.classList.remove('empty-field');
    }
  });
}

function _waitLogoThenPrint() {
  _markEmptyFields();
  var imgs = document.querySelectorAll('.print-modal.open #ministry-logo-img');
  var loaded = 0, total = imgs.length;
  if (total === 0) { setTimeout(() => window.print(), 200); return; }
  imgs.forEach(function(img) {
    if (img.complete && img.naturalHeight > 0) { loaded++; if (loaded >= total) window.print(); }
    else {
      img.onload  = function() { loaded++; if (loaded >= total) window.print(); };
      img.onerror = function() { loaded++; if (loaded >= total) window.print(); };
      /* ضمان تشغيل الطباعة حتى لو لم تُطلق أي أحداث */
      setTimeout(() => { if (loaded < total) { loaded = total; window.print(); } }, 800);
    }
  });
}
