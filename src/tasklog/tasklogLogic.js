// منطق بوابة «سجل المهام اليومي» — دوال نقية (لا DOM ولا window ولا مخزن).
// منقول من tlAddTask / tlGetFiltered / tlRenderLog / tlEditField / tlDeleteTask / tlGenerateReport في script-15.js
// (النسخة القديمة المجمَّدة في tests/fixtures/tl.step11.js، ويقارن بها tests/tasklog.parity.test.js).
// بقيت في الكود القديم عمداً: autoLogTask وtlGetTasks وtlSaveTasks (تستدعيها أدوات أخرى) وappendSuggest (يستعملها body.html).

export const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const TYPE_ICONS = {
  'مقابلة فردية': '🗂', 'تقرير غياب': '📋', 'فتح ملف إدماج': '🔄', 'تقرير حالة عنف': '🛡️',
  'اتصال بولي الأمر': '📞', 'جلسة مع ولي الأمر': '🤝', 'متابعة إعاقة': '♿', 'تتبع مدرسي': '📊',
  'ورشة تكوينية': '🎓', 'جلسة إنصات': '🎧', 'استدعاء ولي الأمر': '🏫', 'زيارة ميدانية': '🚗',
  'برنامج دعم': '📚', 'اجتماع مع الإدارة': '🏛️', 'أخرى': '✏️',
};
export const TL_TYPES = Object.keys(TYPE_ICONS);
const tlTypeIcons = TYPE_ICONS;
export const RESULTS = ['مُنجز', 'قيد المتابعة', 'لم يكتمل'];

export const NATURE_SUGGESTIONS = [
  'دعم اجتماعي فردي', 'وساطة اجتماعية', 'تشخيص اجتماعي', 'توجيه وإرشاد', 'تنسيق مع شركاء خارجيين',
  'إحالة ومتابعة', 'دعم نفسي اجتماعي', 'تحسيس وتوعية', 'متابعة ميدانية', 'تقييم ورصد',
];
export const NOTE_SUGGESTIONS = [
  { label: '🎧 جلسة إنصات', text: 'تم إجراء جلسة إنصات مع التلميذ(ة) وتم رصد وضعيته(ا) الاجتماعية والنفسية. أبدى(أبدت) تجاوباً إيجابياً مع المختص الاجتماعي.' },
  { label: '📞 اتصال بولي الأمر', text: 'تم التواصل مع ولي الأمر وإبلاغه بوضعية التلميذ(ة) واتخاذ الإجراءات المناسبة بالتنسيق معه.' },
  { label: '🎓 ورشة تكوينية', text: 'عُقدت ورشة تكوينية للتلاميذ حول موضوع الوقاية والصحة النفسية. حضر عدد من التلاميذ وكانت التفاعلات إيجابية.' },
  { label: '🤝 اجتماع مع الإدارة', text: 'تم عقد اجتماع مع إدارة المؤسسة لمناقشة الحالات المستعجلة وتنسيق التدخلات الضرورية.' },
  { label: '🚗 زيارة ميدانية', text: 'أُجريت زيارة ميدانية للأسرة للوقوف على الوضعية الاجتماعية وتعزيز التواصل بين المؤسسة والمنزل.' },
  { label: '🏫 استدعاء ولي الأمر', text: 'تم استدعاء ولي الأمر إلى المؤسسة وعُقد لقاء لمناقشة وضعية التلميذ(ة) وتحديد خطة التدخل المشتركة.' },
];

// كما appendSuggest القديمة: يُضاف النص في سطر جديد إن كان في الحقل شيء
export const appendText = (current, text) => (String(current).trim() ? String(current).trimEnd() + '\n' + text : text);

export const ADD_ALERT = '⚠️ يرجى تحديد التاريخ ونوع المهمة.';
export const EMPTY_LIST_TEXT = '📂 لا توجد مهام تطابق التصفية المختارة.';
export const EMPTY_REPORT_ALERT = '⚠️ لا توجد مهام لعرضها في التقرير للفترة المختارة.';

// ── الإضافة ──
// form: قيم الحقول كما هي في الصفحة (type وresult فارغان إن لم يُختر شيء)
export function validateForm(form) {
  return (!form.date || !form.type) ? ADD_ALERT : null;
}
export function makeTask(form, id = Date.now()) {
  return {
    id,
    date: form.date,
    time: form.time || '',
    school: String(form.school).trim(),
    type: form.type,
    nature: String(form.nature).trim(),
    title: String(form.title).trim(),
    target: String(form.target).trim(),
    notes: String(form.notes).trim(),
    result: form.result || '',
    duration: parseInt(form.duration) || 0,
  };
}
export const addTask = (tasks, task) => [task, ...tasks];

// ── التعديل والحذف ──
// التعديل المباشر يطابق المعرّف بالمساواة الصارمة كالقديم (t.id === id)، ويتجاهل غير الموجود
export function editTask(tasks, id, field, value) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return tasks;
  return tasks.map((t, i) => (i === idx ? { ...t, [field]: value } : t));
}
export const deleteTask = (tasks, id) => tasks.filter((t) => t.id !== id);

// ── التصفية ──
// filter: { from, to, type, result } كلها نصوص (فارغ = بلا تصفية)
export const EMPTY_FILTER = { from: '', to: '', type: '', result: '' };
export function filterTasks(tasks, f) {
  let out = tasks;
  if (f.from) out = out.filter((t) => t.date >= f.from);
  if (f.to) out = out.filter((t) => t.date <= f.to);
  if (f.type) out = out.filter((t) => t.type === f.type);
  if (f.result) out = out.filter((t) => t.result === f.result);
  return out;
}

// الاختصارات الزمنية: القديم يحوّل بـ toISOString أي بالتوقيت العالمي (UTC)؛ نبقي ذلك للمطابقة
const iso = (d) => d.toISOString().slice(0, 10);
// offsetWeeks: 0 هذا الأسبوع، -1 الأسبوع الماضي (الأسبوع من الاثنين إلى الأحد)
export function weekRange(now = new Date(), offsetWeeks = 0) {
  const day = now.getDay();
  const diff = (day === 0) ? -6 : 1 - day;
  const mon = new Date(now); mon.setDate(now.getDate() + diff + offsetWeeks * 7);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { from: iso(mon), to: iso(sun) };
}
export function monthRange(now = new Date()) {
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: iso(first), to: iso(last) };
}

// ── العرض ──
// شريط الإحصاء فوق القائمة
export function statsOf(tasks) {
  return {
    total: tasks.length,
    done: tasks.filter((t) => t.result === 'مُنجز').length,
    pending: tasks.filter((t) => t.result === 'قيد المتابعة').length,
    mins: tasks.reduce((s, t) => s + (t.duration || 0), 0),
  };
}
// تجميع حسب التاريخ، الأحدث أولاً. dayName يكون undefined لتاريخ فارغ أو غير صالح (كالقديم الذي كان يكتب «undefined»)
export function groupByDate(tasks) {
  const byDate = {};
  tasks.forEach((t) => { if (!byDate[t.date]) byDate[t.date] = []; byDate[t.date].push(t); });
  return Object.keys(byDate).sort((a, b) => b.localeCompare(a)).map((date) => ({
    date, dayName: DAY_NAMES[new Date(date).getDay()], tasks: byDate[date],
  }));
}

// ── التقرير الأسبوعي الشامل ──
// tlTasks: المهام بعد التصفية الكاملة؛ interviews: أرشيف المقابلات (يُصفّى هنا بالتاريخ فقط)؛ from/to: حقلا التاريخ كما في الصفحة
// تُعيد { html, total } أو null إن لم توجد أي مهمة (القديم كان ينبّه بـ EMPTY_REPORT_ALERT ويخرج)
// ملاحظة: القالب منقول حرفياً، فيحتفظ بعيوب القديم: الأسماء لا تُهرَّب، ومديرية الترويسة ثابتة «الحي الحسني»
export function buildReport(tlTasks, interviews, from, to) {
  const period = from && to ? `${from} — ${to}` : 'كامل السجل';
  interviews = interviews.filter((e) => {
    const d = e.interviewDate || '';
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

  if (!rows.length) return null;

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

  const html = `
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
  return { html, total };
}
