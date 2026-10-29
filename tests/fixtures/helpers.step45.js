function toggleProc(id, cb) {
  const el = document.getElementById(id);
  if (!el) return;
  if (cb.checked) el.classList.add('open');
  else el.classList.remove('open');
}

// ======= HELPERS =======
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function getRadio(name) { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? el.value : ''; }
function getChecked(name) { return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value); }

// دالة مساعدة: تُنشئ حقل تقرير فقط إذا كانت القيمة غير فارغة وغير "—"
function rField(label, value, spanCols) {
  if (!value || value === '—' || value.trim() === '') return '';
  const span = spanCols ? ` style="grid-column:span ${spanCols}"` : '';
  return `<div class="report-field"${span}><span class="lbl">${label}</span><span class="val">${value}</span></div>`;
}


function iEsc(t) { return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function iAutoCheck(inp) {
  const tr = inp.closest('tr'); if (!tr) return;
  const cb = tr.querySelector('input[type=checkbox]');
  if (cb && inp.value.trim()) cb.checked = true;
}
// الطباعة: وضع خاص بتقرير المقابلة (هوامش + تمركز)
