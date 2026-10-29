// نسخة مجمَّدة من بوابة «سجل المهام» كما كانت في script-15.js قبل المرحلة 12 (من TL_KEY حتى tlGenerateReport).
// تُستعمل في tests/tasklog.parity.test.js كمرجع للمقارنة فقط — لا تُحمَّل في التطبيق.
// ======= TASK LOG (TOOL 3) =======
const TL_KEY = 'taskLog_v1';
function tlGetTasks() { return appData.taskLog; }
function tlSaveTasks(d) { appData.taskLog = d; saveUserKey('taskLog'); }

// ======= AUTO-LOG: تسجيل أوتوماتيكي عند كل إجراء =======
function autoLogTask(type, title, target, school, notes, result, workDate) {
  const today = new Date();
  // إذا تم تمرير تاريخ الإنجاز الفعلي، نستخدمه — وإلا نستخدم تاريخ اليوم
  const dateStr = (workDate && /^\d{4}-\d{2}-\d{2}$/.test(workDate)) ? workDate : today.toISOString().slice(0,10);
  const timeStr = today.toTimeString().slice(0,5);
  const savedAtStr = today.toLocaleString('ar-MA');
  const task = {
    id: Date.now(),
    date: dateStr,              // تاريخ الإنجاز الفعلي — يُستخدم في الإحصاء
    savedAt: savedAtStr,        // تاريخ التسجيل في النظام — للأرشيف فقط
    time: timeStr,
    school: school || '',
    type: type,
    nature: 'تسجيل أوتوماتيكي',
    title: title || '',
    target: target || '',
    notes: notes || '',
    result: result || 'مُنجز',
    duration: 0,
    auto: true
  };
  const tasks = tlGetTasks();
  tasks.unshift(task);
  tlSaveTasks(tasks);
}

const tlTypeIcons = {
  'مقابلة فردية':'🗂','تقرير غياب':'📋','فتح ملف إدماج':'🔄','تقرير حالة عنف':'🛡️',
  'اتصال بولي الأمر':'📞','جلسة مع ولي الأمر':'🤝','متابعة إعاقة':'♿','تتبع مدرسي':'📊',
  'ورشة تكوينية':'🎓','جلسة إنصات':'🎧','استدعاء ولي الأمر':'🏫','زيارة ميدانية':'🚗',
  'برنامج دعم':'📚','اجتماع مع الإدارة':'🏛️','أخرى':'✏️'
};
const TL_TYPES = Object.keys(tlTypeIcons);
const tlResultColors = { 'مُنجز':'#16a34a','قيد المتابعة':'#d97706','لم يكتمل':'#dc2626' };

function appendSuggest(id, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = el.value.trim() ? el.value.trimEnd() + '\n' + text : text;
  el.focus();
}

function tlAddTask() {
  const date = document.getElementById('tl_date').value;
  const type = document.querySelector('input[name="tl_type"]:checked')?.value;
  if (!date || !type) { alert('⚠️ يرجى تحديد التاريخ ونوع المهمة.'); return; }
  const task = {
    id: Date.now(),
    date,
    time: document.getElementById('tl_time').value || '',
    school: document.getElementById('tl_school').value.trim(),
    type,
    nature: document.getElementById('tl_nature').value.trim(),
    title: document.getElementById('tl_title').value.trim(),
    target: document.getElementById('tl_target').value.trim(),
    notes: document.getElementById('tl_notes').value.trim(),
    result: document.querySelector('input[name="tl_result"]:checked')?.value || '',
    duration: parseInt(document.getElementById('tl_duration').value) || 0
  };
  const tasks = tlGetTasks();
  tasks.unshift(task);
  tlSaveTasks(tasks);
  tlUpdateCount();
  tlRenderLog();
  tlClearForm();
  // Pulse feedback
  const btn = document.querySelector('#toolTasklog .btn-primary');
  if (btn) { btn.textContent = '✅ تمت الإضافة!'; setTimeout(() => btn.textContent = '➕ إضافة المهمة للسجل', 1500); }
}

function tlClearForm() {
  document.getElementById('tl_date').value = '';
  document.getElementById('tl_time').value = '';
  document.getElementById('tl_school').value = '';
  document.getElementById('tl_nature').value = '';
  document.getElementById('tl_title').value = '';
  document.getElementById('tl_target').value = '';
  document.getElementById('tl_notes').value = '';
  document.getElementById('tl_duration').value = '';
  document.querySelectorAll('input[name="tl_type"], input[name="tl_result"]').forEach(el => el.checked = false);
}

function tlGetFiltered() {
  let tasks = tlGetTasks();
  const from = document.getElementById('tl_filter_from').value;
  const to = document.getElementById('tl_filter_to').value;
  const type = document.getElementById('tl_filter_type').value;
  const result = document.getElementById('tl_filter_result').value;
  if (from) tasks = tasks.filter(t => t.date >= from);
  if (to) tasks = tasks.filter(t => t.date <= to);
  if (type) tasks = tasks.filter(t => t.type === type);
  if (result) tasks = tasks.filter(t => t.result === result);
  return tasks;
}

function tlSetThisWeek() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = (day === 0) ? -6 : 1 - day;
  const mon = new Date(now); mon.setDate(now.getDate() + diff);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  document.getElementById('tl_filter_from').value = mon.toISOString().slice(0,10);
  document.getElementById('tl_filter_to').value = sun.toISOString().slice(0,10);
  document.getElementById('tl_filter_type').value = '';
  document.getElementById('tl_filter_result').value = '';
}

function tlSetLastWeek() {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0) ? -6 : 1 - day;
  const mon = new Date(now); mon.setDate(now.getDate() + diff - 7);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  document.getElementById('tl_filter_from').value = mon.toISOString().slice(0,10);
  document.getElementById('tl_filter_to').value = sun.toISOString().slice(0,10);
  document.getElementById('tl_filter_type').value = '';
  document.getElementById('tl_filter_result').value = '';
}

function tlSetThisMonth() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth()+1, 0);
  document.getElementById('tl_filter_from').value = first.toISOString().slice(0,10);
  document.getElementById('tl_filter_to').value = last.toISOString().slice(0,10);
  document.getElementById('tl_filter_type').value = '';
  document.getElementById('tl_filter_result').value = '';
}

function tlClearFilter() {
  document.getElementById('tl_filter_from').value = '';
  document.getElementById('tl_filter_to').value = '';
  document.getElementById('tl_filter_type').value = '';
  document.getElementById('tl_filter_result').value = '';
  tlRenderLog();
}

function tlUpdateCount() {
  document.getElementById('tlTaskCount').textContent = tlGetTasks().length;
}

function tlRenderLog() {
  const tasks = tlGetFiltered();
  const list = document.getElementById('tlTaskList');
  const stats = document.getElementById('tlStats');

  // Stats bar
  const total = tasks.length;
  const done = tasks.filter(t => t.result === 'مُنجز').length;
  const mins = tasks.reduce((s,t) => s + (t.duration || 0), 0);
  stats.innerHTML = `
    <div class="archive-stat">📋 إجمالي: ${total}</div>
    <div class="archive-stat" style="color:#16a34a;">✅ مُنجز: ${done}</div>
    <div class="archive-stat" style="color:#d97706;">🔄 متابعة: ${tasks.filter(t=>t.result==='قيد المتابعة').length}</div>
    <div class="archive-stat">⏱ ${mins} دقيقة</div>`;

  if (!tasks.length) {
    list.innerHTML = '<div class="archive-empty">📂 لا توجد مهام تطابق التصفية المختارة.</div>';
    return;
  }

  // Group by date
  const byDate = {};
  tasks.forEach(t => { if (!byDate[t.date]) byDate[t.date] = []; byDate[t.date].push(t); });
  const sortedDates = Object.keys(byDate).sort((a,b) => b.localeCompare(a));

  /* بناء قائمة أنواع المهام للقائمة المنسدلة */
  const typeOptions = TL_TYPES.map(t => `<option value="${t}">${tlTypeIcons[t]||''} ${t}</option>`).join('');

  list.innerHTML = sortedDates.map(date => {
    const dayTasks = byDate[date];
    const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const d = new Date(date);
    const dayName = dayNames[d.getDay()];
    const rows = dayTasks.map(t => `
      <tr id="tl-row-${t.id}">
        <td style="white-space:nowrap;min-width:110px;">
          <input type="date" value="${t.date||''}"
            style="border:1px solid #e2e8f0;border-radius:5px;padding:3px 5px;font-size:0.75rem;width:100%;font-family:'Cairo',sans-serif;"
            onchange="tlEditField(${t.id},'date',this.value)">
        </td>
        <td style="min-width:160px;">
          <select style="border:1px solid #e2e8f0;border-radius:5px;padding:3px 6px;font-size:0.78rem;width:100%;font-family:'Cairo',sans-serif;"
            onchange="tlEditField(${t.id},'type',this.value)">
            ${TL_TYPES.map(tp => `<option value="${tp}" ${tp===t.type?'selected':''}>${tlTypeIcons[tp]||''} ${tp}</option>`).join('')}
          </select>
        </td>
        <td style="min-width:140px;">
          <input type="text" value="${(t.title||'').replace(/"/g,'&quot;')}"
            placeholder="اسم المهمة..."
            style="border:1px solid #e2e8f0;border-radius:5px;padding:3px 6px;font-size:0.78rem;width:100%;font-family:'Cairo',sans-serif;"
            onchange="tlEditField(${t.id},'title',this.value)">
        </td>
        <td style="text-align:center;">
          <button onclick="tlDeleteTask(${t.id})" style="background:none;border:none;color:#dc2626;cursor:pointer;font-size:1rem;" title="حذف">🗑</button>
        </td>
      </tr>
    `).join('');
    return `
      <div style="margin-bottom:12px;">
        <div style="background:linear-gradient(90deg,var(--primary),var(--primary-light));color:white;padding:7px 14px;border-radius:6px 6px 0 0;font-size:0.85rem;font-weight:700;display:flex;justify-content:space-between;align-items:center;">
          <span>📅 ${dayName} — ${date}</span>
          <span style="background:rgba(200,169,74,0.85);color:#0f2744;border-radius:10px;padding:2px 10px;font-size:0.78rem;">${dayTasks.length} مهام</span>
        </div>
        <table class="archive-table" style="border-radius:0 0 6px 6px;overflow:hidden;">
          <thead><tr>
            <th style="min-width:110px;">📅 التاريخ</th>
            <th style="min-width:160px;">📌 نوع المهمة</th>
            <th style="min-width:140px;">✏️ اسم المهمة</th>
            <th style="width:36px;"></th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join('');

  document.getElementById('tlTaskCount').textContent = tlGetTasks().length;
}

/* ── تعديل حقل مباشر في السجل ── */
function tlEditField(id, field, value) {
  const tasks = tlGetTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  tasks[idx][field] = value;
  tlSaveTasks(tasks);
  /* إعادة رسم فقط إذا تغيّر التاريخ (لإعادة ترتيب المجموعات) */
  if (field === 'date') { tlRenderLog(); tlUpdateCount(); }
}

function tlDeleteTask(id) {
  if (!confirm('حذف هذه المهمة؟')) return;
  const tasks = tlGetTasks().filter(t => t.id !== id);
  tlSaveTasks(tasks);
  tlRenderLog();
  tlUpdateCount();
}

function tlClearAll() {
  if (!confirm('هل أنت متأكد من حذف جميع المهام المسجلة؟')) return;
  tlSaveTasks([]);
  tlRenderLog();
  tlUpdateCount();
}

function toggleTaskLogPanel() {
  const body = document.getElementById('tlTaskBody');
  const arrow = document.getElementById('tlPanelArrow');
  body.classList.toggle('open');
  arrow.textContent = body.classList.contains('open') ? '▲' : '▼';
}

function tlGenerateReport() {
  // جمع كل المهام من المقابلات والاتصالات أيضاً
  const tlTasks = tlGetFiltered();
  const from = document.getElementById('tl_filter_from').value;
  const to   = document.getElementById('tl_filter_to').value;
  const period = from && to ? `${from} — ${to}` : 'كامل السجل';

  const interviews = getArchive().filter(e => {
    const d = e.interviewDate||'';
    return (!from || d >= from) && (!to || d <= to);
  });

  // بناء صفوف موحدة: تاريخ، اسم المهمة، نوع المهمة، نتيجة المهمة
  const rows = [];
  const rColor = r => r==='مُنجز'?'#166534':r==='قيد المتابعة'?'#854d0e':'#475569';
  const rBg    = r => r==='مُنجز'?'#dcfce7':r==='قيد المتابعة'?'#fef9c3':'#f1f5f9';

  tlTasks.forEach(t => rows.push({
    date: t.date||'', name: t.title||'—', type: t.type||'—',
    result: t.result||'—', rc: rColor(t.result), rb: rBg(t.result)
  }));
  interviews.forEach(e => rows.push({
    date: e.interviewDate||'',
    name: e.studentName + (e.subject&&e.subject!=='—'?' — '+e.subject:''),
    type: 'مقابلة فردية', result: e.currentStatus||'—',
    rc: '#0f766e', rb: '#ccfbf1'
  }));

  if (!rows.length) { alert('⚠️ لا توجد مهام لعرضها في التقرير للفترة المختارة.'); return; }

  rows.sort((a,b) => (a.date||'').localeCompare(b.date||''));
  const total   = rows.length;
  const done    = rows.filter(r => r.result==='مُنجز').length;
  const pending = rows.filter(r => r.result==='قيد المتابعة').length;
  const other   = total - done - pending;
  const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

  // ── جدول المهام (3 خانات: التاريخ / نوع المهمة / اسم المهمة) ──
  const tableRows = rows.map((r,i) => {
    const dayN = r.date ? (dayNames[new Date(r.date+'T12:00:00').getDay()]||'') : '';
    const icon = tlTypeIcons[r.type] || '📌';
    return `<tr style="background:${i%2===0?'#f8fafc':'#fff'};">
      <td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:700;color:#1a3a5c;white-space:nowrap;font-size:0.82rem;text-align:center;">
        ${r.date||'—'}<br><span style="font-size:0.65rem;color:#7c3aed;font-weight:700;">${dayN}</span>
      </td>
      <td style="padding:7px 10px;border:1px solid #e2e8f0;text-align:center;">
        <span style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:6px;padding:3px 10px;font-size:0.78rem;font-weight:700;white-space:nowrap;">${icon} ${r.type}</span>
      </td>
      <td style="padding:7px 10px;border:1px solid #e2e8f0;font-size:0.83rem;color:#374151;">${r.name||'—'}</td>
    </tr>`;
  }).join('');

  // ── مبيان شريطي: توزيع حسب النوع ──
  const typeCount = {};
  rows.forEach(r => { typeCount[r.type] = (typeCount[r.type]||0)+1; });
  const typeEntries = Object.entries(typeCount).sort((a,b)=>b[1]-a[1]);
  const maxCount = Math.max(...typeEntries.map(e=>e[1]), 1);
  const barColors = ['#1a3a5c','#0f766e','#1d4ed8','#7c3aed','#dc2626','#d97706','#15803d','#0891b2'];
  const barH=32, barGap=10, labelW=140, chartPad=12, svgW=520, barMaxW=svgW-labelW-60;
  const svgH = typeEntries.length*(barH+barGap)+chartPad*2;

  const barsSVG = typeEntries.map(([type,count],i) => {
    const pct = Math.round(count/total*100);
    const bW = Math.max(22, Math.round((count/maxCount)*barMaxW));
    const y = chartPad + i*(barH+barGap);
    const clr = barColors[i % barColors.length];
    return `
      <rect x="0" y="${y}" width="${svgW}" height="${barH}" fill="${i%2===0?'#f8fafc':'#fff'}"/>
      <text x="${labelW-8}" y="${y+barH/2+5}" text-anchor="end" font-size="11" fill="#1e293b" font-family="Cairo,sans-serif" font-weight="600">${type}</text>
      <rect x="${labelW}" y="${y+4}" width="${barMaxW}" height="${barH-8}" rx="5" fill="#e2e8f0"/>
      <rect x="${labelW}" y="${y+4}" width="${bW}" height="${barH-8}" rx="5" fill="${clr}"/>
      <text x="${labelW+bW+8}" y="${y+barH/2+5}" font-size="11" font-weight="800" fill="${clr}" font-family="Cairo,sans-serif">${count} <tspan font-size="9" font-weight="400" fill="#64748b">(${pct}%)</tspan></text>
    `;
  }).join('');

  // ── مبيان دائري: توزيع النتائج ──
  function donutArc(cx,cy,R,r,a1,a2,color) {
    if(Math.abs(a2-a1)>=359.99) a2=a1+359.98;
    const rad=d=>d*Math.PI/180;
    const s=rad(a1),e=rad(a2);
    const x1=cx+R*Math.cos(s),y1=cy+R*Math.sin(s);
    const x2=cx+R*Math.cos(e),y2=cy+R*Math.sin(e);
    const xi1=cx+r*Math.cos(e),yi1=cy+r*Math.sin(e);
    const xi2=cx+r*Math.cos(s),yi2=cy+r*Math.sin(s);
    const lg=(a2-a1)>180?1:0;
    return `<path d="M${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${xi1},${yi1} A${r},${r} 0 ${lg},0 ${xi2},${yi2} Z" fill="${color}" stroke="white" stroke-width="3"/>`;
  }
  const segs = [{p:done,c:'#16a34a'},{p:pending,c:'#f59e0b'},{p:other,c:'#94a3b8'}].filter(s=>s.p>0);
  let ang=-90;
  const donutPaths = segs.map(s=>{
    const sw=s.p/total*360;
    const arc=donutArc(95,95,88,52,ang,ang+sw,s.c);
    ang+=sw; return arc;
  }).join('');

  document.getElementById('tlReportContent').innerHTML = `
 <div style="font-family:'Cairo',sans-serif;direction:rtl;font-size:14px;">

 <!-- HEADER -->
 <div style="text-align:center;padding:14px 10px 10px;border-top:2px solid black;border-bottom:2px solid black;margin-bottom:12px;background:white;">
 <img id="ministry-logo-img" src="" alt="شعار الوزارة" style="width:100%;height:auto;display:block;margin:0 auto 5px;">
 
 <div style="font-size:0.72rem;color:#333;margin-bottom:0;" class="dynamic-directorate">مديرية الحي الحسني</div>
 <div style="font-size:1.1rem;font-weight:900;color:black;margin-top:8px;border-top:1px solid #ccc;padding-top:6px;">&#x1F4CA; التقرير الأسبوعي الشامل للمختص الاجتماعي</div>
 <div style="font-size:0.75rem;color:#333;margin-top:2px;">&#x1F4C5; الفترة: <strong>${period}</strong> — إجمالي المهام: <strong>${total}</strong></div>
 </div>

 <!-- KPI CARDS -->
 <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
 <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:10px;padding:10px;text-align:center;">
 <div style="font-size:1.7rem;font-weight:900;color:#16a34a;">${done}</div>
 <div style="font-size:0.74rem;color:#166534;font-weight:700;"> مُنجزة</div>
 </div>
 <div style="background:#fffbeb;border:2px solid #fcd34d;border-radius:10px;padding:10px;text-align:center;">
 <div style="font-size:1.7rem;font-weight:900;color:#f59e0b;">${pending}</div>
 <div style="font-size:0.74rem;color:#92400e;font-weight:700;"> قيد المتابعة</div>
 </div>
 <div style="background:#f1f5f9;border:2px solid #cbd5e1;border-radius:10px;padding:10px;text-align:center;">
 <div style="font-size:1.7rem;font-weight:900;color:#64748b;">${other}</div>
 <div style="font-size:0.74rem;color:#475569;font-weight:700;"> أخرى</div>
 </div>
 </div>

 <!-- TASKS TABLE -->
 <div style="border:1.5px solid #cbd5e1;border-radius:8px;overflow:hidden;margin-bottom:14px;">
 <div style="background:linear-gradient(90deg,#0f2744,#1a3a5c);color:white;padding:7px 14px;font-weight:800;font-size:0.85rem;display:flex;justify-content:space-between;align-items:center;">
 <span> سجل المهام الأسبوعي</span>
 <span style="background:rgba(200,169,74,0.9);color:#1a3a5c;border-radius:10px;padding:2px 10px;font-size:0.75rem;font-weight:800;">${total} مهمة</span>
 </div>
 <table style="width:100%;border-collapse:collapse;direction:rtl;">
 <thead><tr style="background:linear-gradient(90deg,#1a3a5c,#2563a8);color:white;">
 <th style="padding:8px 10px;border:1px solid #2563a8;font-size:0.80rem;font-weight:800;text-align:center;width:18%;">📅 التاريخ</th>
 <th style="padding:8px 10px;border:1px solid #2563a8;font-size:0.80rem;font-weight:800;text-align:center;width:30%;">📌 نوع المهمة</th>
 <th style="padding:8px 10px;border:1px solid #2563a8;font-size:0.80rem;font-weight:800;width:52%;">✏️ اسم المهمة / التفاصيل</th>
 </tr></thead>
 <tbody>${tableRows}</tbody>
 </table>
 </div>

 <!-- CHARTS -->
 <div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:16px;">

 <!-- BAR CHART -->
 <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px;">
 <div style="font-size:0.85rem;font-weight:800;color:#1a3a5c;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;"> توزيع المهام حسب النوع</div>
 <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" style="display:block;" xmlns="http://www.w3.org/2000/svg">
 ${barsSVG}
 </svg>
 </div>

 <!-- DONUT CHART -->
 <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:12px;display:flex;flex-direction:column;align-items:center;">
 <div style="font-size:0.85rem;font-weight:800;color:#1a3a5c;margin-bottom:8px;padding-bottom:6px;border-bottom:2px solid #e2e8f0;width:100%;text-align:center;"> توزيع النتائج</div>
 <svg viewBox="0 0 190 190" width="160" height="160" xmlns="http://www.w3.org/2000/svg">
 ${total>0 ? donutPaths : '<circle cx="95" cy="95" r="88" fill="#e2e8f0"/><circle cx="95" cy="95" r="52" fill="white"/>'}
 <circle cx="95" cy="95" r="50" fill="white"/>
 <text x="95" y="88" text-anchor="middle" font-size="26" font-weight="900" fill="#1a3a5c" font-family="Cairo,sans-serif">${total}</text>
 <text x="95" y="108" text-anchor="middle" font-size="11" fill="#64748b" font-family="Cairo,sans-serif">مهمة</text>
 </svg>
 <div style="display:flex;flex-direction:column;gap:6px;width:100%;margin-top:6px;">
 <div style="display:flex;align-items:center;justify-content:space-between;background:#f0fdf4;border-radius:7px;padding:6px 10px;border-right:4px solid #16a34a;">
 <span style="font-size:0.78rem;color:#166534;font-weight:700;"> مُنجزة</span>
 <strong style="font-size:1.1rem;color:#16a34a;">${done}</strong>
 </div>
 <div style="display:flex;align-items:center;justify-content:space-between;background:#fffbeb;border-radius:7px;padding:6px 10px;border-right:4px solid #f59e0b;">
 <span style="font-size:0.78rem;color:#92400e;font-weight:700;"> قيد المتابعة</span>
 <strong style="font-size:1.1rem;color:#f59e0b;">${pending}</strong>
 </div>
 <div style="display:flex;align-items:center;justify-content:space-between;background:#f1f5f9;border-radius:7px;padding:6px 10px;border-right:4px solid #94a3b8;">
 <span style="font-size:0.78rem;color:#475569;font-weight:700;"> أخرى</span>
 <strong style="font-size:1.1rem;color:#64748b;">${other}</strong>
 </div>
 </div>
 </div>
 </div>

 <!-- SIGNATURES -->
 <div style="display:flex;justify-content:space-around;margin-top:20px;border-top:2px solid #1a3a5c;padding-top:16px;">
 <div style="text-align:center;"><div style="width:130px;border-bottom:1.5px solid #334155;margin-bottom:6px;height:38px;"></div><div style="font-size:0.8rem;font-weight:700;color:#1a3a5c;">المختص الاجتماعي</div></div>
 <div style="text-align:center;"><div style="width:130px;border-bottom:1.5px solid #334155;margin-bottom:6px;height:38px;"></div><div style="font-size:0.8rem;font-weight:700;color:#1a3a5c;">مدير المؤسسة</div></div>
 </div>
 </div>
`;
  document.getElementById('tlPrintModal').classList.add('open');
  document.querySelectorAll('#ministry-logo-img').forEach(function(img){ if(typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) img.src = MINISTRY_LOGO_B64; });
}

