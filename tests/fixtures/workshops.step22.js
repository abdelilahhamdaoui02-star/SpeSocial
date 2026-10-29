// نسخة مجمَّدة من كود «الورشات والأنشطة» القديم (script-16.js قبل المرحلة 22) — مرجع اختبار المطابقة فقط
function wsSaveToArchive() {
  const title = document.getElementById('ws_title') ? document.getElementById('ws_title').value.trim() : '';
  if (!title) { alert('⚠️ يرجى إدخال عنوان الورشة أو النشاط أولاً.'); return; }
  const getV = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const getR = name => { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? el.value : '—'; };
  const getCh = name => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
  const entry = {
    id: Date.now(),
    savedAt: new Date().toLocaleString('ar-MA'),
    title,
    type: getR('ws_type'),
    theme: getCh('ws_theme'),
    school: getV('ws_school') || '—',
    date: getV('ws_date') || '—',
    duration: getV('ws_duration') || '—',
    place: getR('ws_place'),
    organizer: getCh('ws_organizer'),
    target: getCh('ws_target'),
    males: getV('ws_males') || '0',
    females: getV('ws_females') || '0',
    classes: (_wsSelectedClasses && _wsSelectedClasses.length ? _wsSelectedClasses.join('، ') : getV('ws_classes')) || '—',
    objectives: getV('ws_objectives') || '—',
    summary: getV('ws_summary') || '—',
    tools: getCh('ws_tools'),
    result: getR('ws_result'),
    notes: getV('ws_notes') || '',
    photos: (window._wsPhotos || []).slice()
  };
  if (!appData.workshopsArchive) appData.workshopsArchive = [];
  appData.workshopsArchive.unshift(entry);
  if (typeof saveUserKey === 'function') saveUserKey('workshopsArchive');
  if (typeof renderWsArchive === 'function') renderWsArchive();
  const body = document.getElementById('wsArchiveBody');
  if (body && !body.classList.contains('open')) {
    body.classList.add('open');
    const arrow = document.getElementById('wsArchiveArrow');
    if (arrow) arrow.textContent = '▲';
  }
  const badge = document.getElementById('wsArchiveCount');
  if (badge) badge.textContent = appData.workshopsArchive.length;
  alert(`✅ تم حفظ الورشة "${title}" في الأرشيف بنجاح.`);
}

function wsSaveToArchiveSilent() {
  const _origAlert = window.alert;
  window.alert = function() {};
  try { wsSaveToArchive(); } catch(e) {}
  window.alert = _origAlert;
}

function wsGenerateReport() {
  const V = id => { const el = document.getElementById(id); return el ? iEsc(el.value.trim()) : ''; };
  const title = V('ws_title');
  if (!title) { alert('⚠️ يرجى إدخال عنوان الورشة أو النشاط أولاً.'); return; }
  const R = name => { const el = document.querySelector('input[name="' + name + '"]:checked'); return el ? iEsc(el.value) : ''; };
  const C = name => [...document.querySelectorAll('input[name="' + name + '"]:checked')].map(el => iEsc(el.value)).join(' / ');
  const D = x => x || '—';
  const males = parseInt(document.getElementById('ws_males').value) || 0;
  const females = parseInt(document.getElementById('ws_females').value) || 0;
  const classes = (typeof _wsSelectedClasses !== 'undefined' && _wsSelectedClasses && _wsSelectedClasses.length)
    ? iEsc(_wsSelectedClasses.join('، ')) : V('ws_classes');
  const tblStyle = 'width:100%;border-collapse:collapse;font-size:0.82rem;font-family:\'Cairo\',sans-serif;margin-bottom:10px;';
  const row4 = (l1, v1, l2, v2) => `<tr><td class="info-lbl">${l1}</td><td class="info-val">${D(v1)}</td><td class="info-lbl">${l2}</td><td class="info-val">${D(v2)}</td></tr>`;
  const row1 = (l, v) => `<tr><td class="info-lbl">${l}</td><td class="info-val" colspan="3">${D(v)}</td></tr>`;

  document.getElementById('wsReportContent').innerHTML = `
 <div class="new-report-header">
 <div class="nrh-logo">
 <img id="ministry-logo-img" src="" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;">
 </div>
 <div class="nrh-dir">مديرية الحي الحسني</div>
 <div class="nrh-school">${V('ws_school') || 'المؤسسة التعليمية'}</div>
 <div class="nrh-title">تقرير عن ورشة / نشاط تربوي</div>
 </div>

 <div class="report-section-title">معلومات الورشة / النشاط</div>
 <table class="info-table-report" style="${tblStyle}"><tbody>
   ${row1('العنوان:', title)}
   ${row4('نوع النشاط:', R('ws_type'), 'تاريخ الإنجاز:', V('ws_date'))}
   ${row4('مدة النشاط:', V('ws_duration') ? V('ws_duration') + ' ساعة' : '', 'مكان الإنجاز:', R('ws_place'))}
   ${row1('محور النشاط:', C('ws_theme'))}
   ${row1('الجهة المنظِّمة:', C('ws_organizer'))}
 </tbody></table>

 <div class="report-section-title">الفئة المستهدفة والمشاركون</div>
 <table class="info-table-report" style="${tblStyle}"><tbody>
   ${row1('الفئة المستهدفة:', C('ws_target'))}
   ${row4('عدد الذكور:', String(males), 'عدد الإناث:', String(females))}
   ${row4('إجمالي المشاركين:', String(males + females), 'الأقسام / المجموعات:', classes)}
 </tbody></table>

 ${V('ws_objectives') ? `<div class="report-section-title">الأهداف المرجوة</div><div class="report-summary-block">${V('ws_objectives')}</div>` : ''}
 ${V('ws_summary') ? `<div class="report-section-title">ملخص مجريات النشاط</div><div class="report-summary-block">${V('ws_summary')}</div>` : ''}
 ${C('ws_tools') ? `<div class="report-section-title">الوسائل والأدوات المستخدمة</div><div class="report-summary-block">${C('ws_tools')}</div>` : ''}

 <div class="report-section-title">الخلاصة وتقييم النتائج</div>
 <table class="info-table-report" style="${tblStyle}"><tbody>
   ${row1('نتيجة النشاط العامة:', R('ws_result'))}
   ${row1('الملاحظات والتوصيات:', V('ws_notes'))}
 </tbody></table>

 <div class="signatures">
 <div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div>
 <div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div>
 </div>
 ${wsPhotosReportHtml(title)}
 `;
  document.getElementById('wsPrintModal').classList.add('open');
  document.querySelectorAll('#ministry-logo-img').forEach(function(img){ if(typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) img.src = MINISTRY_LOGO_B64; });
  // ✅ حفظ تلقائي في الأرشيف عند إنشاء التقرير (دون تكرار نفس الورشة)
  const _dt = (document.getElementById('ws_date') || {}).value || '—';
  const _t = document.getElementById('ws_title').value.trim();
  const _exists = (appData.workshopsArchive || []).some(e => e.title === _t && e.date === _dt);
  if (!_exists) wsSaveToArchiveSilent();
  else {
    const _ex = (appData.workshopsArchive || []).find(e => e.title === _t && e.date === _dt);
    if (_ex && (window._wsPhotos || []).length) {
      _ex.photos = (window._wsPhotos || []).slice();
      if (typeof saveUserKey === 'function') saveUserKey('workshopsArchive');
    }
  }
}

// ══════════════════════════════════════════════════════════════
// 🎓 WORKSHOPS ARCHIVE — دوال أرشيف الورشات والأنشطة
// ══════════════════════════════════════════════════════════════
let wsInitialized = false;

// ══════════════════════════════════════════════════════════════
//  🎓 اختيار الأقسام لبوابة الورشات (select + chips)
// ══════════════════════════════════════════════════════════════
let _wsSelectedClasses = [];

function wsRenderChips() {
  const chipsDiv = document.getElementById('ws_chips');
  const hidden   = document.getElementById('ws_classes');
  if (!chipsDiv) return;
  chipsDiv.innerHTML = _wsSelectedClasses.map(cls =>
    `<span style="display:inline-flex;align-items:center;gap:4px;background:#92400e;color:white;border-radius:20px;padding:3px 10px;font-size:0.75rem;font-weight:700;">` +
    `${cls}<span onclick="wsRemoveClass('${cls}')" style="cursor:pointer;font-size:0.85rem;margin-right:2px;">✕</span></span>`
  ).join('');
  if (hidden) hidden.value = _wsSelectedClasses.join('، ');
}

window.wsAddClassFromSelect = function() {
  const sel = document.getElementById('ws_classes_select');
  if (!sel || !sel.value) return;
  if (!_wsSelectedClasses.includes(sel.value)) {
    _wsSelectedClasses.push(sel.value);
    wsRenderChips();
  }
  sel.value = '';
};

window.wsRemoveClass = function(cls) {
  _wsSelectedClasses = _wsSelectedClasses.filter(c => c !== cls);
  wsRenderChips();
};

function wsInitClassesPicker() {
  _wsSelectedClasses = [];
  const sel = document.getElementById('ws_classes_select');
  if (!sel) return;
  sel.innerHTML = buildLevelOptions(16);
  wsRenderChips();
}

function wsSetClassesFromString(str) {
  _wsSelectedClasses = (str && str !== '—')
    ? str.split(/[،,]+/).map(s => s.trim()).filter(Boolean)
    : [];
  const sel = document.getElementById('ws_classes_select');
  if (sel) sel.value = '';
  wsRenderChips();
}

function initWorkshops() {
  if (wsInitialized) return;
  wsInitialized = true;
  renderWsArchive();
  // تعيين تاريخ اليوم تلقائياً
  const dateEl = document.getElementById('ws_date');
  if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0,10);
  // تعيين المؤسسة من الملف الشخصي
  const schoolEl = document.getElementById('ws_school');
  if (schoolEl && !schoolEl.value && typeof userProfile !== 'undefined' && userProfile && userProfile.institution) {
    schoolEl.value = userProfile.institution;
  }
  // تهيئة اختيار الأقسام
  wsInitClassesPicker();
}

function renderWsArchive() {
  const archive = appData.workshopsArchive || [];
  const search  = (document.getElementById('wsArchiveSearch')?.value || '').trim().toLowerCase();
  const list    = document.getElementById('wsArchiveList');
  const countEl = document.getElementById('wsArchiveCount');
  if (!list) return;
  if (countEl) countEl.textContent = archive.length;

  const filtered = search
    ? archive.filter(e =>
        (e.title||'').toLowerCase().includes(search)  ||
        (e.school||'').toLowerCase().includes(search) ||
        (e.type||'').toLowerCase().includes(search))
    : archive;

  if (!filtered.length) {
    list.innerHTML = `<div class="archive-empty">${search
      ? '🔍 لا توجد نتائج تطابق البحث.'
      : '📂 لا توجد ورشات محفوظة بعد.<br><small>اضغط "حفظ في الأرشيف" لإضافة الورشة الحالية.</small>'
    }</div>`;
    return;
  }

  const resultColors = {
    'ناجح بامتياز': '#16a34a', 'ناجح': '#15803d',
    'متوسط': '#d97706', 'يحتاج تحسيناً': '#dc2626'
  };
  const typeIcons = {
    'ورشة توعوية':'🎯','نشاط تربوي':'🎨',
    'برنامج جماعي':'👥','حصة إرشادية':'📢',
    'رحلة تربوية':'🚌','أخرى':'📌'
  };

  list.innerHTML = `<div style="overflow-x:auto;"><table class="archive-table">
    <thead><tr>
      <th>#</th><th>عنوان الورشة</th><th>النوع</th>
      <th>المؤسسة</th><th>التاريخ</th><th>الحضور</th><th>النتيجة</th><th>إجراء</th>
    </tr></thead>
    <tbody>${filtered.map((e,i) => {
      const males   = parseInt(e.males)||0;
      const females = parseInt(e.females)||0;
      const total   = males + females;
      return `<tr>
        <td style="text-align:center;color:#64748b;font-size:0.75rem;">${i+1}</td>
        <td><strong style="color:#92400e;">${typeIcons[e.type]||'🎓'} ${e.title||'—'}</strong></td>
        <td style="font-size:0.78rem;">${e.type||'—'}</td>
        <td style="font-size:0.78rem;">${e.school&&e.school!=='—'?e.school:'—'}</td>
        <td style="text-align:center;white-space:nowrap;font-size:0.78rem;">📅 ${e.date&&e.date!=='—'?e.date:'—'}</td>
        <td style="text-align:center;font-size:0.78rem;">👤 ${total}</td>
        <td><span style="background:${resultColors[e.result]||'#64748b'};color:white;border-radius:10px;padding:2px 8px;font-size:0.7rem;font-weight:700;white-space:nowrap;">${e.result||'—'}</span></td>
        <td><div style="display:flex;gap:5px;justify-content:center;">
          <button class="btn-sm" style="background:linear-gradient(135deg,#92400e,#d97706);color:white;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:0.72rem;font-family:'Cairo',sans-serif;font-weight:700;" onclick="wsLoadEntry(${e.id})">✏️ تعديل</button>
          <button class="btn-sm btn-sm-danger" onclick="deleteWsEntry(${e.id})">🗑</button>
        </div></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ══════════════════════════════════════════════════════════════
//  📷 صور النشاط — استيراد / ضغط / عرض / إدراج في التقرير
// ══════════════════════════════════════════════════════════════
window._wsPhotos = window._wsPhotos || [];
var WS_MAX_PHOTOS = 12;

function wsCompressImage(file) {
  return new Promise(function (resolve, reject) {
    var fr = new FileReader();
    fr.onerror = reject;
    fr.onload = function () {
      var img = new Image();
      img.onerror = reject;
      img.onload = function () {
        var MAX = 1000, w = img.naturalWidth, h = img.naturalHeight;
        var r = Math.min(1, MAX / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * r)), ch = Math.max(1, Math.round(h * r));
        var c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

async function wsAddPhotos(files) {
  var list = Array.from(files || []).filter(function (f) { return f.type && f.type.indexOf('image/') === 0; });
  if (!list.length) { alert('⚠️ يرجى اختيار ملفات صور فقط.'); return; }
  var room = WS_MAX_PHOTOS - window._wsPhotos.length;
  if (room <= 0) { alert('⚠️ بلغتَ الحد الأقصى (' + WS_MAX_PHOTOS + ' صورة).'); return; }
  var skipped = list.length - room;
  list = list.slice(0, room);
  var failed = 0;
  for (var i = 0; i < list.length; i++) {
    try { window._wsPhotos.push(await wsCompressImage(list[i])); }
    catch (e) { failed++; }
  }
  wsRenderPhotos();
  var msg = [];
  if (skipped > 0) msg.push('تم تجاهل ' + skipped + ' صورة لتجاوز الحد الأقصى (' + WS_MAX_PHOTOS + ').');
  if (failed > 0) msg.push('تعذّرت قراءة ' + failed + ' صورة.');
  if (msg.length) alert('⚠️ ' + msg.join('\n'));
}

function wsRemovePhoto(i) {
  window._wsPhotos.splice(i, 1);
  wsRenderPhotos();
}

function wsClearPhotos() {
  if (!window._wsPhotos.length) return;
  if (!confirm('هل تريد حذف جميع صور النشاط؟')) return;
  window._wsPhotos = [];
  wsRenderPhotos();
}

function wsRenderPhotos() {
  var grid = document.getElementById('wsPhotoGrid');
  var bar = document.getElementById('wsPhotoBar');
  var cnt = document.getElementById('wsPhotoCount');
  var p = window._wsPhotos || [];
  if (cnt) cnt.textContent = p.length;
  if (bar) bar.style.display = p.length ? 'flex' : 'none';
  if (!grid) return;
  grid.innerHTML = p.map(function (src, i) {
    return '<div style="position:relative;display:inline-block;border:1px solid #d97706;border-radius:6px;overflow:hidden;background:#fff;line-height:0;">' +
      '<img src="' + src + '" alt="صورة ' + (i + 1) + '" style="height:110px;width:auto;max-width:220px;display:block;">' +
      '<button type="button" onclick="wsRemovePhoto(' + i + ')" title="حذف الصورة" style="position:absolute;top:4px;left:4px;width:24px;height:24px;border:none;border-radius:50%;background:rgba(220,38,38,.92);color:#fff;font-size:.8rem;cursor:pointer;line-height:1;">✕</button>' +
      '<span style="position:absolute;bottom:4px;right:4px;background:rgba(0,0,0,.55);color:#fff;border-radius:10px;padding:0 7px;font-size:.68rem;font-weight:700;line-height:1.5;">' + (i + 1) + '</span>' +
      '</div>';
  }).join('');
  wsEnsureRatios();
}

// نسب أبعاد الصور (عرض/ارتفاع) تُحسب مسبقاً لتأطير كل صورة وفق شكلها الحقيقي
window._wsRatios = window._wsRatios || {};
function wsEnsureRatios() {
  (window._wsPhotos || []).forEach(function (src) {
    if (window._wsRatios[src]) return;
    var im = new Image();
    im.onload = function () { if (im.naturalWidth && im.naturalHeight) window._wsRatios[src] = im.naturalWidth / im.naturalHeight; };
    im.src = src;
  });
}

// توزيع تلقائي: صفوف متوازنة بنفس ترتيب الإدراج، كل صورة بإطارها الطبيعي، وتملأ صفحة واحدة
function wsLayoutPhotos(ratios) {
  var N = ratios.length, W = 170, H = 232, G = 3;
  var cap = N === 1 ? 200 : 120;
  var best = null;
  for (var n = 1; n <= N; n++) {
    // تقسيم متتالٍ إلى n صفوف يقلّل أكبر مجموع نسب (لتتقارب ارتفاعات الصفوف)
    var pre = [0]; ratios.forEach(function (r) { pre.push(pre[pre.length - 1] + r); });
    var INF = 1e9, dp = [], cut = [];
    for (var k = 0; k <= n; k++) { dp.push(new Array(N + 1).fill(INF)); cut.push(new Array(N + 1).fill(0)); }
    dp[0][0] = 0;
    for (var k2 = 1; k2 <= n; k2++) for (var i = k2; i <= N; i++) for (var j = k2 - 1; j < i; j++) {
      var v = Math.max(dp[k2 - 1][j], pre[i] - pre[j]);
      if (v < dp[k2][i]) { dp[k2][i] = v; cut[k2][i] = j; }
    }
    var rows = [], e = N;
    for (var kk = n; kk >= 1; kk--) { var st = cut[kk][e]; rows.unshift(ratios.slice(st, e).map(function (r, idx) { return { r: r, i: st + idx }; })); e = st; }
    var rowH = rows.map(function (row) {
      var S = row.reduce(function (a, x) { return a + x.r; }, 0);
      return (W - (row.length - 1) * G) / S;
    });
    var T = rowH.reduce(function (a, h) { return a + h; }, 0) + (rows.length - 1) * G;
    var sc = Math.min(1, H / T, cap / Math.max.apply(null, rowH));
    var area = 0;
    rows.forEach(function (row, ri) { row.forEach(function (x) { var h = rowH[ri] * sc; area += h * h * x.r; }); });
    if (!best || area > best.area) best = { area: area, rows: rows, rowH: rowH, sc: sc };
  }
  return best.rows.map(function (row, ri) {
    var h = best.rowH[ri] * best.sc;
    return row.map(function (x) { return { i: x.i, w: +(h * x.r).toFixed(2), h: +h.toFixed(2) }; });
  });
}

// كتلة الصور داخل التقرير: صفحة مستقلة (فاصل صفحة)، كل صورة مؤطّرة بحدودها الفعلية
function wsPhotosReportHtml(title) {
  var p = window._wsPhotos || [];
  if (!p.length) return '';
  var ratios = p.map(function (src) { return window._wsRatios[src] || (4 / 3); });
  var layout = wsLayoutPhotos(ratios);
  var rowsHtml = layout.map(function (row) {
    return '<div class="ws-photo-row" style="display:flex;justify-content:center;align-items:flex-start;gap:3mm;margin-bottom:3mm;break-inside:avoid;page-break-inside:avoid;">' +
      row.map(function (x) {
        return '<div class="ws-photo-item" data-w="' + x.w + '" data-h="' + x.h + '" style="width:' + x.w + 'mm;height:' + x.h + 'mm;flex:none;box-sizing:border-box;border:0.3mm solid #555;overflow:hidden;line-height:0;">' +
          '<img src="' + p[x.i] + '" alt="" style="width:100%;height:100%;display:block;object-fit:fill;"></div>';
      }).join('') + '</div>';
  }).join('');
  return '<div class="ws-photos-page" style="break-before:page;page-break-before:always;margin-top:24px;direction:rtl;">' +
    '<div class="ws-photos-title" style="text-align:center;font-weight:800;font-size:1rem;margin:0 0 8px;padding-bottom:6px;border-bottom:2px solid #000;">صور النشاط' + (title ? ' — ' + title : '') + '</div>' +
    rowsHtml + '</div>';
}

// ══ دوال التعديل — workshops edit functions ══

function wsLoadEntry(id) {
  const entry = (appData.workshopsArchive||[]).find(e => e.id === id);
  if (!entry) return;

  // تمرير الصفحة للأعلى
  const container = document.querySelector('#toolWorkshops .main-container');
  if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  const setV = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = (v && v !== '—') ? v : ''; };
  const clearR   = name => document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.checked = false);
  const setR     = (name, v) => { if (!v || v==='—') return; const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; };
  const setChecks = (name, vals) => {
    document.querySelectorAll(`input[name="${name}"]`).forEach(el => el.checked = false);
    (vals||[]).forEach(v => { const el = document.querySelector(`input[name="${name}"][value="${v}"]`); if (el) el.checked = true; });
  };

  // حقول نصية
  setV('ws_title',     entry.title);
  setV('ws_school',    entry.school);
  setV('ws_date',      entry.date);
  setV('ws_duration',  entry.duration);
  setV('ws_males',     entry.males);
  setV('ws_females',   entry.females);
  // تحميل الأقسام في القائمة المتعددة
  if (typeof wsSetClassesFromString === 'function') wsSetClassesFromString(entry.classes || '');
  setV('ws_objectives',entry.objectives);
  setV('ws_summary',   entry.summary);
  setV('ws_notes',     entry.notes);

  // أزرار الاختيار الفردي
  clearR('ws_type');       setR('ws_type',       entry.type);
  clearR('ws_place');      setR('ws_place',      entry.place);
  clearR('ws_result');     setR('ws_result',     entry.result);

  // مربعات الاختيار المتعدد
  setChecks('ws_theme',     entry.theme);
  setChecks('ws_organizer', entry.organizer);
  setChecks('ws_target',    entry.target);
  setChecks('ws_tools',     entry.tools);

  // تحديث عداد المشاركين
  const totalEl = document.getElementById('ws_total_count');
  if (totalEl) totalEl.textContent = (parseInt(entry.males)||0) + (parseInt(entry.females)||0);

  window._wsPhotos = Array.isArray(entry.photos) ? entry.photos.slice() : [];
  wsRenderPhotos();

  wsShowEditBar(id);
}

function wsShowEditBar(id) {
  let bar = document.getElementById('wsEditBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'wsEditBar';
    bar.style.cssText = 'position:sticky;top:0;z-index:200;background:linear-gradient(135deg,#92400e,#d97706);color:white;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-bottom:3px solid #fde68a;';
    bar.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;font-size:0.88rem;font-weight:700;">
        <span style="font-size:1.2rem;">✏️</span>
        <span>وضع التعديل — تم تحميل الورشة. عدّل ما تريد ثم احفظ.</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button onclick="wsUpdateEntry()" style="background:#fde68a;color:#92400e;border:none;border-radius:8px;padding:8px 16px;font-family:'Cairo',sans-serif;font-size:0.84rem;font-weight:800;cursor:pointer;">💾 حفظ التعديلات</button>
        <button onclick="wsCancelEdit()" style="background:rgba(255,255,255,0.2);color:white;border:1px solid rgba(255,255,255,0.4);border-radius:8px;padding:8px 14px;font-family:'Cairo',sans-serif;font-size:0.82rem;font-weight:700;cursor:pointer;">✕ إلغاء</button>
      </div>`;
    const container = document.querySelector('#toolWorkshops .main-container');
    if (container) container.insertBefore(bar, container.firstChild);
  }
  bar.style.display = 'flex';
  bar.dataset.editId = id;
}

function wsHideEditBar() {
  const b = document.getElementById('wsEditBar');
  if (b) b.style.display = 'none';
}

function wsCancelEdit() {
  wsHideEditBar();
  window._wsPhotos = []; wsRenderPhotos();
  // تفريغ الحقول
  document.querySelectorAll('#toolWorkshops input[type=text], #toolWorkshops input[type=date], #toolWorkshops input[type=number], #toolWorkshops textarea').forEach(el => el.value = '');
  document.querySelectorAll('#toolWorkshops input[type=radio], #toolWorkshops input[type=checkbox]').forEach(el => el.checked = false);
  const dateEl = document.getElementById('ws_date');
  if (dateEl) dateEl.value = new Date().toISOString().slice(0,10);
  const totalEl = document.getElementById('ws_total_count');
  if (totalEl) totalEl.textContent = '0';
}

function wsUpdateEntry() {
  const bar = document.getElementById('wsEditBar');
  const id  = bar ? parseInt(bar.dataset.editId) : null;
  if (!id) return;

  const title = document.getElementById('ws_title')?.value.trim();
  if (!title) { alert('⚠️ يرجى إدخال عنوان الورشة أولاً.'); return; }

  const getV  = elId => { const el = document.getElementById(elId); return el ? el.value.trim() : ''; };
  const getR  = name => { const el = document.querySelector(`input[name="${name}"]:checked`); return el ? el.value : '—'; };
  const getCh = name => [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);

  const updatedEntry = {
    id,
    savedAt:    new Date().toLocaleString('ar-MA') + ' (معدَّل)',
    title,
    type:       getR('ws_type'),
    theme:      getCh('ws_theme'),
    school:     getV('ws_school')    || '—',
    date:       getV('ws_date')      || '—',
    duration:   getV('ws_duration')  || '—',
    place:      getR('ws_place'),
    organizer:  getCh('ws_organizer'),
    target:     getCh('ws_target'),
    males:      getV('ws_males')     || '0',
    females:    getV('ws_females')   || '0',
    classes:    getV('ws_classes')   || '—',
    objectives: getV('ws_objectives')|| '—',
    summary:    getV('ws_summary')   || '—',
    tools:      getCh('ws_tools'),
    result:     getR('ws_result'),
    notes:      getV('ws_notes')     || '',
    photos:     (window._wsPhotos || []).slice()
  };

  const archive = appData.workshopsArchive || [];
  const idx = archive.findIndex(e => e.id === id);
  if (idx !== -1) archive[idx] = updatedEntry; else archive.unshift(updatedEntry);
  appData.workshopsArchive = archive;
  if (typeof saveUserKey === 'function') saveUserKey('workshopsArchive');

  renderWsArchive();
  wsHideEditBar();
  wsCancelEdit();

  // فتح الأرشيف إذا كان مغلقاً
  const body = document.getElementById('wsArchiveBody');
  if (body && !body.classList.contains('open')) {
    body.classList.add('open');
    const arrow = document.getElementById('wsArchiveArrow');
    if (arrow) arrow.textContent = '▲';
  }
  alert(`✅ تم تحديث الورشة "${title}" بنجاح.`);
}

function deleteWsEntry(id) {
  if (!confirm('هل تريد حذف هذه الورشة نهائياً؟')) return;
  appData.workshopsArchive = (appData.workshopsArchive||[]).filter(e => e.id !== id);
  if (typeof saveUserKey === 'function') saveUserKey('workshopsArchive');
  renderWsArchive();
}

function clearWsArchive() {
  if (!confirm('هل أنت متأكد من مسح جميع الورشات المحفوظة؟')) return;
  appData.workshopsArchive = [];
  if (typeof saveUserKey === 'function') saveUserKey('workshopsArchive');
  renderWsArchive();
}

function toggleWsArchive() {
  const body  = document.getElementById('wsArchiveBody');
  const arrow = document.getElementById('wsArchiveArrow');
  if (!body) return;
  const isOpen = body.classList.toggle('open');
  if (arrow) arrow.textContent = isOpen ? '▲' : '▼';
  if (isOpen) renderWsArchive();
}

function wsClearAll() {
  if (!confirm('هل أنت متأكد من تفريغ النموذج الحالي؟')) return;
  document.querySelectorAll('#toolWorkshops input[type=text], #toolWorkshops input[type=date], #toolWorkshops input[type=number], #toolWorkshops textarea').forEach(el => el.value = '');
  document.querySelectorAll('#toolWorkshops input[type=radio], #toolWorkshops input[type=checkbox]').forEach(el => el.checked = false);
  const dateEl = document.getElementById('ws_date');
  if (dateEl) dateEl.value = new Date().toISOString().slice(0,10);
  const schoolEl = document.getElementById('ws_school');
  if (schoolEl && typeof userProfile !== 'undefined' && userProfile && userProfile.institution) {
    schoolEl.value = userProfile.institution;
  }
  window._wsPhotos = []; wsRenderPhotos();
  wsInitialized = false;
  initWorkshops();

}
