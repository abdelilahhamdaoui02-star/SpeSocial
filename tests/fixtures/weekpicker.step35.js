// مجمَّد من script-10.js قبل الخطوة 35 (نافذة اختيار الأسبوع)
// ======= WEEK PICKER MODAL =======
function openWeekPickerModal() {
  wpSetThisWeek();
  document.getElementById('weekPickerModal').style.display = 'flex';
}
function closeWeekPickerModal() {
  document.getElementById('weekPickerModal').style.display = 'none';
}

function wpGetWeekRange(offsetWeeks) {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0) ? -6 : 1 - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff + (offsetWeeks * 7));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    from: mon.toISOString().slice(0,10),
    to:   sun.toISOString().slice(0,10)
  };
}

function wpSetDates(from, to) {
  document.getElementById('wpFromDate').value = from;
  document.getElementById('wpToDate').value   = to;
  wpUpdatePreview(from, to);
}

function wpSetThisWeek()   { const r = wpGetWeekRange(0);  wpSetDates(r.from, r.to); }
function wpSetLastWeek()   { const r = wpGetWeekRange(-1); wpSetDates(r.from, r.to); }
function wpSetWeekBefore() { const r = wpGetWeekRange(-2); wpSetDates(r.from, r.to); }

function wpSyncToDate() {
  const from = document.getElementById('wpFromDate').value;
  if (!from) return;
  const d = new Date(from + 'T12:00:00');
  d.setDate(d.getDate() + 6);
  const to = d.toISOString().slice(0,10);
  document.getElementById('wpToDate').value = to;
  wpUpdatePreview(from, to);
}

function wpUpdatePreview(from, to) {
  const el = document.getElementById('wpPreview');
  if (!from || !to) { el.style.display = 'none'; return; }
  const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const df = new Date(from + 'T12:00:00');
  const dt = new Date(to   + 'T12:00:00');
  const diffDays = Math.round((dt - df) / 86400000) + 1;
  el.style.display = 'block';
  el.innerHTML = `${dayNames[df.getDay()]} ${from}  →  ${dayNames[dt.getDay()]} ${to} &nbsp;|&nbsp; ${diffDays} أيام`;
}

function wpGenerateReport() {
  const from = document.getElementById('wpFromDate').value;
  const to   = document.getElementById('wpToDate').value;
  if (!from || !to) { alert('⚠️ يرجى تحديد تاريخ البداية والنهاية.'); return; }
  if (from > to) { alert('⚠️ تاريخ البداية يجب أن يكون قبل تاريخ النهاية.'); return; }
  // Save selected week and update the badge on main page
  try { localStorage.setItem('wp:selectedFrom', from); localStorage.setItem('wp:selectedTo', to); } catch {}
  wpUpdateMainBadge(from, to);
  closeWeekPickerModal();
  openWeeklyReportPreview();
}

function wpUpdateMainBadge(from, to) {
  // شارة الأسبوع في بطاقة التقرير صارت مكوّن React (src/home/WeeklyReportCard.jsx)؛ نرسل لها الأسبوع المحدد
  window.dispatchEvent(new CustomEvent('legacy:week-range', { detail: { from, to } }));
}

function wpInitMainBadge() {
  let from, to;
  try { from = localStorage.getItem('wp:selectedFrom'); to = localStorage.getItem('wp:selectedTo'); } catch {}
  if (!from || !to) { const r = wpGetWeekRange(0); from = r.from; to = r.to; }
  wpUpdateMainBadge(from, to);
}
