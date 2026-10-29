// نسخة مجمَّدة من بوابتي «التواصل مع الأولياء» و«المتابعة» كما كانتا في script-10.js قبل المرحلة 11
// (من mkGate حتى updateFollowBadge). تُستعمل في tests/gates.parity.test.js كمرجع للمقارنة فقط — لا تُحمَّل في التطبيق.
// ═══ بوابات: التواصل مع الأولياء + المتابعة + الصورة الشخصية ═══
const _esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function mkGate(o) {
  const root = document.getElementById(o.box); let editId = null, q = '';
  const arr = () => appData[o.key] || (appData[o.key] = []);
  const val = k => root.querySelector('[data-k="' + k + '"]');
  function reset() { editId = null; o.fields.forEach(f => { const e = val(f.k); e.value = f.t === 'date' ? new Date().toISOString().slice(0, 10) : (f.opts ? f.opts[0] : ''); }); }
  function cell(f, r) { const v = r[f.k] || ''; if (!f.badge) return _esc(v); const i = o.fields.find(x => x.k === f.k).opts.indexOf(v); return '<span class="pg-st s' + Math.max(i, 0) % 4 + '">' + _esc(v) + '</span>'; }
  function draw() {
    const rows = arr().filter(r => !q || JSON.stringify(r).indexOf(q) !== -1);
    root.querySelector('tbody').innerHTML = rows.length ? rows.map((r, i) => '<tr><td>' + (i + 1) + '</td>' + o.fields.map(f => '<td>' + cell(f, r) + '</td>').join('') + '<td style="white-space:nowrap"><button class="pg-btn sm" data-a="edit" data-id="' + r.id + '">✏️</button> <button class="pg-btn sm red" data-a="del" data-id="' + r.id + '">🗑</button></td></tr>').join('') : '<tr><td colspan="' + (o.fields.length + 2) + '" style="text-align:center;color:var(--text-muted)">لا توجد سجلات.</td></tr>';
  }
  function build() {
    root.innerHTML = '<div class="pg-card"><h3>' + o.title + '</h3><div class="pg-grid">' + o.fields.map(f => '<div class="pg-f' + (f.wide ? ' wide' : '') + '"><label>' + f.l + '</label>' + (f.opts ? '<select data-k="' + f.k + '">' + f.opts.map(x => '<option>' + x + '</option>').join('') + '</select>' : f.t === 'area' ? '<textarea rows="2" data-k="' + f.k + '"></textarea>' : '<input type="' + (f.t || 'text') + '" id="' + o.box + '_' + f.k + '" data-k="' + f.k + '">') + '</div>').join('') + '</div><div class="pg-act"><button class="pg-btn" data-a="save">💾 حفظ</button><button class="pg-btn gray" data-a="reset">إلغاء</button>' + (o.imp ? '<button class="pg-btn green" data-a="imp">📥 استيراد أرقام من Excel</button><input type="file" hidden accept=".xlsx,.xls,.csv" data-a="file">' : '') + '<button class="pg-btn gray" data-a="exp">📤 تصدير Excel</button>' + (o.print ? '<button class="pg-btn" data-a="prt">🖨️ معاينة وطباعة</button>' : '') + '<input class="pg-q" placeholder="🔍 بحث..." data-a="q"></div></div><div class="pg-card"><div class="pg-scroll"><table class="pg-tbl"><thead><tr><th>#</th>' + o.fields.map(f => '<th>' + f.l + '</th>').join('') + '<th></th></tr></thead><tbody></tbody></table></div></div>';
    reset();
    root.onclick = async e => {
      const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a, id = b.dataset.id;
      if (a === 'reset') reset();
      else if (a === 'imp') root.querySelector('[data-a=file]').click();
      else if (a === 'save') {
        const d = {}; o.fields.forEach(f => d[f.k] = val(f.k).value.trim());
        if (!d[o.req]) return alert('⚠️ الحقل «' + o.fields.find(f => f.k === o.req).l + '» إجباري.');
        if (editId) Object.assign(arr().find(r => String(r.id) === String(editId)) || {}, d); else arr().unshift(Object.assign({ id: Date.now() + '' + Math.floor(Math.random() * 99) }, d));
        await saveUserKey(o.key); reset(); draw(); o.after && o.after();
      } else if (a === 'edit') { const r = arr().find(x => String(x.id) === id); if (!r) return; editId = id; o.fields.forEach(f => val(f.k).value = r[f.k] || ''); root.scrollIntoView({ behavior: 'smooth' }); }
      else if (a === 'del') { if (!confirm('حذف هذا السجل؟')) return; appData[o.key] = arr().filter(x => String(x.id) !== id); await saveUserKey(o.key); draw(); o.after && o.after(); }
      else if (a === 'prt') pgPrintReport(o.print, o.fields, arr().filter(r => !q || JSON.stringify(r).indexOf(q) !== -1));
      else if (a === 'exp') pgExportXlsx(o, arr().filter(r => !q || JSON.stringify(r).indexOf(q) !== -1));
    };
    root.oninput = e => { if (e.target.dataset.a === 'q') { q = e.target.value.trim(); draw(); } };
    root.onchange = e => { if (e.target.dataset.a !== 'file' || !e.target.files[0]) return; const fr = new FileReader(); fr.onload = async () => {
      try {
        const rows = XLSX.utils.sheet_to_json(XLSX.read(new Uint8Array(fr.result), { type: 'array' }).Sheets[XLSX.read(new Uint8Array(fr.result), { type: 'array' }).SheetNames[0]], { header: 1, defval: '' });
        const h = (rows[0] || []).map(x => String(x)); const hasH = h.some(x => /[^\d\s]/.test(x) && /(اسم|مسار|هاتف|phone|name|massar|tel)/i.test(x));
        const ix = re => { const i = h.findIndex(x => re.test(x)); return hasH ? i : -1; };
        let cn = ix(/اسم|name|nom/i), cm = ix(/مسار|massar|code/i), cp = ix(/هاتف|phone|tel|gsm|mobile|رقم/i);
        if (cn < 0) cn = 0; if (cm < 0) cm = 1; if (cp < 0) cp = 2;
        let n = 0; rows.slice(hasH ? 1 : 0).forEach(r => {
          const name = String(r[cn] || '').trim(); let ph = String(r[cp] || '').replace(/\D/g, ''); if (ph.length === 9) ph = '0' + ph;
          if (!name && !ph) return; if (arr().some(x => x.name === name && x.phone === ph)) return;
          arr().push({ id: Date.now() + '' + n++, name, massar: String(r[cm] || '').trim(), phone: ph, time: '', result: o.fields.find(f => f.k === 'result').opts[0], notes: '', date: '' });
        });
        await saveUserKey(o.key); draw(); alert('✅ تم استيراد ' + n + ' سطرًا.');
      } catch (er) { alert('❌ تعذّرت قراءة الملف.'); }
    }; fr.readAsArrayBuffer(e.target.files[0]); e.target.value = ''; };
    if (o.ac && typeof acSetup === 'function') acSetup(o.ac);
    draw();
  }
  return { refresh: build };
}
const _pg = {};
const _RES = ['لم يتم الاتصال بعد', 'تم الرد', 'لم يرد', 'رقم خاطئ / خارج الخدمة', 'طلب معاودة الاتصال', 'وعد بالحضور'];
function initParents() {
  if (!_pg.calls) {
    _pg.calls = mkGate({ box: 'pgCalls', key: 'parentCalls', req: 'name', ac: { nameId: 'pgCalls_name', massarId: 'pgCalls_massar' }, imp: 1, file: 'الاتصال-بالأولياء', print: 'سجل الاتصال الهاتفي بأولياء الأمور', title: '📞 سجل الاتصال الهاتفي بأولياء الأمور', fields: [
      { k: 'name', l: 'اسم التلميذ' }, { k: 'massar', l: 'رقم المسار' }, { k: 'phone', l: 'هاتف ولي الأمر', t: 'tel' }, { k: 'time', l: 'وقت الاتصال', t: 'time' },
      { k: 'result', l: 'نتيجة الاتصال', opts: _RES }, { k: 'date', l: 'تاريخ الاتصال', t: 'date' }, { k: 'notes', l: 'ملاحظات', t: 'area', wide: 1 }] });
    _pg.meet = mkGate({ box: 'pgMeet', key: 'parentMeetings', req: 'student', ac: { nameId: 'pgMeet_student', levelId: 'pgMeet_cls' }, file: 'مقابلات-الأولياء', print: 'سجل مقابلات أولياء الأمور', title: '🤝 مقابلة مع ولي أمر', fields: [
      { k: 'student', l: 'الاسم الكامل للتلميذ' }, { k: 'cls', l: 'القسم' }, { k: 'parent', l: 'الاسم الكامل لولي الأمر' }, { k: 'cin', l: 'رقم البطاقة الوطنية' },
      { k: 'job', l: 'المهنة' }, { k: 'date', l: 'تاريخ المقابلة', t: 'date' }, { k: 'subject', l: 'موضوع المقابلة', t: 'area', wide: 1 }] });
  }
  _pg.calls.refresh(); _pg.meet.refresh();
}
function pgTab(n, btn) { btn.parentNode.querySelectorAll('button').forEach(b => b.classList.remove('on')); btn.classList.add('on'); document.getElementById('pgCalls').style.display = n ? 'none' : ''; document.getElementById('pgMeet').style.display = n ? '' : 'none'; }
function initFollowup() {
  if (!_pg.fu) _pg.fu = mkGate({ box: 'pgFu', key: 'followUp', req: 'name', ac: { nameId: 'pgFu_name', massarId: 'pgFu_massar', levelId: 'pgFu_cls' }, file: 'سجل-المتابعة', print: 'سجل المتابعة وتتبع الحالات', after: updateFollowBadge, title: '🔔 تتبع الحالات', fields: [
    { k: 'name', l: 'اسم التلميذ' }, { k: 'massar', l: 'رقم المسار' }, { k: 'cls', l: 'القسم' }, { k: 'status', l: 'الحالة', opts: ['قيد المتابعة', 'تعثر / يستدعي تدخلًا', 'تحسن', 'تمت المعالجة'], badge: 1 },
    { k: 'date', l: 'تاريخ المتابعة', t: 'date' }, { k: 'note', l: 'ملاحظة المتابعة', t: 'area', wide: 1 }] });
  _pg.fu.refresh();
}


function pgImgSize(src) {
  return new Promise(res => {
    if (typeof Image === 'undefined') return res({ w: 520, h: 97 });
    const im = new Image(); im.onload = () => res({ w: im.naturalWidth || 520, h: im.naturalHeight || 97 }); im.onerror = () => res({ w: 520, h: 97 }); im.src = src;
  });
}
async function pgExportXlsx(o, rows) {
  const F = o.fields, n = F.length + 1, title = o.print || o.file;
  const inst = (userProfile && userProfile.institution) || 'المؤسسة التعليمية', dir = getDirectorate();
  const dateStr = new Date().toLocaleDateString('ar-MA');
  if (!window.ExcelJS) { // احتياطي: تصدير مبسّط باتجاه من اليمين لليسار
    const ws = XLSX.utils.json_to_sheet(rows.map(r => Object.fromEntries(F.map(f => [f.l, r[f.k] || '']))));
    ws['!cols'] = F.map(f => ({ wch: f.t === 'area' ? 45 : 22 })); const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, 'السجل'); XLSX.writeFile(wb, o.file + '.xlsx'); return;
  }
  // ── عرض الأعمدة (الخط العربي أعرض من اللاتيني ⇒ معامل 1.3) ──
  const wid = [6].concat(F.map(f => {
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
  const logo = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? MINISTRY_LOGO_B64 : '';
  const ext = /^data:image\/[\w.+-]+;base64,\/9j\//.test(logo) ? 'jpeg' : /^data:image\/[\w.+-]+;base64,iVBOR/.test(logo) ? 'png' : /^data:image\/[\w.+-]+;base64,R0lGOD/.test(logo) ? 'gif' : '';
  if (ext) {
    try {
      const sz = await pgImgSize(logo); let lh = 100, lw = lh * sz.w / sz.h; if (lw > totalPx - 20) { lw = totalPx - 20; lh = lw * sz.h / sz.w; }
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
  ['#'].concat(F.map(f => f.l)).forEach((h, i) => { const c = hr.getCell(i + 1); c.value = h; c.font = { name: FONT, size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A5C' } }; c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true, readingOrder: 'rtl' }; c.border = bd; });
  // ── 3) الصفوف ──
  rows.forEach((r, i) => {
    const vals = F.map(f => String(r[f.k] || '')), row = ws.addRow([i + 1].concat(vals));
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
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  a.download = o.file + '.xlsx'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function pgPrintReport(title, fields, rows) {
  try { pgPrintReportInner(title, fields, rows); } catch (e) { console.error(e); alert('❌ تعذّر فتح المعاينة: ' + (e && e.message || e)); }
}
function pgPrintReportInner(title, fields, rows) {
  const th = 'padding:6px 8px;text-align:center;border:1px solid #000;background:#fff;color:#000;font-weight:800;-webkit-print-color-adjust:exact;print-color-adjust:exact;';
  const td = 'padding:5px 8px;border:1px solid #cbd5e1;vertical-align:top;overflow-wrap:anywhere;';
  const body = rows.length ? rows.map((r, i) => '<tr><td style="' + td + 'text-align:center;">' + (i + 1) + '</td>' + fields.map(f => '<td style="' + td + '">' + (iEsc(r[f.k]) || '—') + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + (fields.length + 1) + '" style="' + td + 'text-align:center;">لا توجد سجلات.</td></tr>';
  const logo = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? MINISTRY_LOGO_B64 : '';
  document.getElementById('pgReportContent').innerHTML =
    '<div class="new-report-header"><div class="nrh-logo">' + (logo ? '<img id="ministry-logo-img" src="' + logo + '" alt="شعار الوزارة" style="width:100%;height:auto;max-height:160px;object-fit:contain;display:block;background:white;">' : '') + '</div>' +
    '<div class="nrh-dir">' + iEsc(getDirectorate()) + '</div><div class="nrh-school">' + iEsc((userProfile && userProfile.institution) || 'المؤسسة التعليمية') + '</div><div class="nrh-title">' + iEsc(title) + '</div></div>' +
    '<div class="report-section-title">عدد السجلات: ' + rows.length + ' — بتاريخ ' + new Date().toLocaleDateString('ar-MA') + '</div>' +
    '<table class="proc-table-report" style="width:100%;border-collapse:collapse;font-size:0.8rem;font-family:\'Cairo\',sans-serif;"><thead><tr><th style="' + th + 'width:4%;">#</th>' + fields.map(f => '<th style="' + th + '">' + f.l + '</th>').join('') + '</tr></thead><tbody>' + body + '</tbody></table>' +
    '<div class="signatures"><div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div><div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div></div>';
  const t = document.getElementById('pgPrintTitle'); t.textContent = '📄 ' + title; t.dataset.f = title.replace(/\s+/g, '_');
  const m = document.getElementById('pgPrintModal'), act = document.querySelector('.tool-page.active');
  if (act && m.parentNode !== act) act.appendChild(m); // داخل البوابة النشطة كبقية النوافذ ⇒ لا صفحة فارغة عند الطباعة
  m.classList.add('open');
}
function pgDoPrint() {
  document.documentElement.classList.add('i-print-mode');
  try { window.print(); } catch (e) { alert('❌ تعذّرت الطباعة: ' + e.message); }
  setTimeout(() => { if (!document.querySelector('#pgPrintModal.open')) document.documentElement.classList.remove('i-print-mode'); }, 1500);
}
function pgClosePrint() { document.getElementById('pgPrintModal').classList.remove('open'); }
function updateFollowBadge() { const n = (appData.followUp || []).filter(r => r.status !== 'تمت المعالجة').length; const b = document.getElementById('fuBadge'); if (b) { b.textContent = n; b.style.display = n ? 'inline-flex' : 'none'; } }
