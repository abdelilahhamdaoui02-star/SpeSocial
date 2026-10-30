// منطق بوابة «الإحصاء البياني» — دوال نقية منقولة من كتلة st* في script-15.js (المرحلة 15).
// تعمل على مجموعات المخزن (collections) بدل appData، وتُختبر بمطابقة مباشرة مع الكود القديم.

export const ST_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];

export const stIso = (d) => { const m = d.getMonth() + 1, dd = d.getDate(); return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd; };

// 'YYYY-MM' لتاريخ ما
export const ymOf = (d) => d.getFullYear() + '-' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1);

// حدود الشهر وتسميته، أو null إن لم تكن الصيغة YYYY-MM
export function monthRange(ym) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '');
  if (!m) return null;
  const y = +m[1], mo = +m[2];
  return { ym, from: stIso(new Date(y, mo - 1, 1)), to: stIso(new Date(y, mo, 0)), label: ST_MONTHS[mo - 1] + ' ' + y };
}

// الشهر السابق/التالي (k = -1 / +1)؛ إن لم يكن الحالي صالحاً نعود لشهر اليوم كالقديم
export function shiftMonth(ym, k, today = new Date()) {
  const m = /^(\d{4})-(\d{2})$/.exec(ym || '');
  if (!m) return ymOf(today);
  return ymOf(new Date(+m[1], +m[2] - 1 + k, 1));
}

// أسابيع الشهر المختار (الاثنين → الأحد، مقصوصة على حدود الشهر)
export function monthWeeks(f, t) {
  if (!f || !t) return [];
  const first = new Date(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10));
  const last = new Date(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10));
  const wins = []; let cur = new Date(first);
  while (cur <= last) {
    const dw = (cur.getDay() + 6) % 7;
    const end = new Date(cur); end.setDate(cur.getDate() + (6 - dw)); if (end > last) end.setTime(last.getTime());
    wins.push({ from: stIso(cur), to: stIso(end), a: cur.getDate(), z: end.getDate() });
    cur = new Date(end); cur.setDate(cur.getDate() + 1);
  }
  return wins;
}

// مصدر الإحصاء الحيّ: الأرشيفات هي المرجع + المهام اليدوية فقط (c = مجموعات المخزن)
export function liveBaseTasks(c) {
  const okD = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
  const dt = (d, e) => (okD(d) ? d : (e && e.id && !isNaN(+e.id) ? new Date(+e.id).toISOString().slice(0, 10) : ''));
  const out = [];
  const add = (list, prefix, type, mkTitle, dateOf, schoolOf) => (list || []).forEach((e) => out.push({
    id: prefix + '_' + e.id, date: dt(dateOf(e), e),
    school: ((schoolOf ? schoolOf(e) : e.school) || '').replace(/^—$/, ''),
    type, title: mkTitle(e), target: e.studentName || '', notes: '',
    result: 'مُنجز', duration: 0, auto: true, live: true,
  }));
  const A = (k) => (c && c[k]) || [];
  add(A('interviewArchive'), 'iv', 'مقابلة فردية', (e) => (e.subject && e.subject !== '—' ? e.subject : ('مقابلة — ' + (e.studentName || ''))), (e) => e.interviewDate);
  add(A('reintegrationArchive'), 'rg', 'مقابلة فردية', (e) => 'إدماج مدرسي — ' + (e.studentName || ''), (e) => e.reintegrationDate);
  add(A('absenceArchive'), 'ab', 'أخرى', (e) => 'ملف غياب — ' + (e.studentName || ''), (e) => e.recordDate);
  add(A('violenceArchive'), 'vo', 'أخرى', (e) => 'حالة عنف — ' + (e.studentName || ''), (e) => e.reportDate);
  add(A('specialNeedsArchive'), 'sn', 'أخرى', (e) => 'وضعية إعاقة — ' + (e.studentName || ''), (e) => e.recordDate);
  add(A('pdAssocArchive'), 'pa', 'أخرى', (e) => 'إحالة لجمعية — ' + (e.studentName || ''), (e) => e.date, (e) => (e.fields || {})['pd3-school']);
  add(A('pdHealthArchive'), 'ph', 'أخرى', (e) => 'إخبار صحي — ' + (e.studentName || ''), (e) => e.date, (e) => (e.fields || {})['pd4-school']);
  add(A('parentCalls'), 'pc', 'أخرى', (e) => 'اتصال بولي الأمر — ' + (e.name || ''), (e) => e.date);
  add(A('parentMeetings'), 'pm', 'أخرى', (e) => 'مقابلة ولي أمر — ' + (e.student || ''), (e) => e.date);
  const manual = ((c && c.taskLog) || []).filter((t) => !t.auto);
  return manual.concat(out);
}

export const ST_CATS = [
  { label: 'مقابلات فردية وجلسات إنصات', icon: '🗂', color: '#1a3a5c',
    filter: (t) => (t.type === 'مقابلة فردية' || t.type === 'جلسة إنصات')
      && !(t.title || '').startsWith('إدماج مدرسي')
      && !(t.title || '').match(/اتصال هاتفي|جلسة استماع مع ولي|اجتماع ثلاثي|زيارة منزلية/) },
  { label: 'الإدماج المدرسي', icon: '🔄', color: '#0891b2', filter: (t) => (t.title || '').startsWith('إدماج مدرسي') },
  { label: 'ملفات الغياب', icon: '📋', color: '#ea580c', filter: (t) => (t.title || '').startsWith('ملف غياب') },
  { label: 'ورشات وأنشطة', icon: '🎓', color: '#0f766e',
    filter: (t) => t.type === 'ورشة' || ((t.type === 'أخرى') && (t.title || '').startsWith('ورشة/نشاط')) },
  { label: 'حالات العنف', icon: '🛡️', color: '#dc2626', filter: (t) => (t.title || '').startsWith('حالة عنف') },
  { label: 'وضعيات الإعاقة', icon: '♿', color: '#7c3aed', filter: (t) => (t.title || '').startsWith('وضعية إعاقة') },
  { label: 'إحالات لجمعيات', icon: '🏛️', color: '#5b21b6', filter: (t) => (t.title || '').startsWith('إحالة لجمعية') },
  { label: 'إخبار بحالة صحية', icon: '🏥', color: '#b91c1c', filter: (t) => (t.title || '').startsWith('إخبار صحي') },
  { label: 'التواصل مع أولياء الأمور', icon: '📞', color: '#be185d',
    filter: (t) => (t.title || '').startsWith('اتصال بولي الأمر') || (t.title || '').startsWith('مقابلة ولي أمر') },];

export const RESULT_LABELS = ['مُنجز', 'قيد المتابعة', 'لم يكتمل'];
export const RESULT_COLORS = ['#16a34a', '#d97706', '#dc2626'];

// المهام المعروضة: مهام السجل والأرشيفات + الورشات، مقيَّدة بالفترة والمؤسسة
export function filterTasks(c, { from, to, school } = {}) {
  const sch = String(school || '').trim().toLowerCase();
  let tasks = liveBaseTasks(c).filter((t) => !(t.type === 'اتصال بولي الأمر' || t.type === 'جلسة مع ولي الأمر' || t.type === 'استدعاء ولي الأمر'));
  if (from) tasks = tasks.filter((t) => t.date >= from);
  if (to) tasks = tasks.filter((t) => t.date <= to);
  if (sch) tasks = tasks.filter((t) => (t.school || '').toLowerCase().includes(sch));

  function mapCtResult(r) {
    if (!r || r === '—') return 'مُنجز';
    if (r.includes('إيجابية') || r.includes('ناجح')) return 'مُنجز';
    if (r.includes('متوسطة') || r.includes('جزئي') || r.includes('سيُعاد')) return 'قيد المتابعة';
    if (r.includes('سلبية') || r.includes('رفض') || r.includes('يحتاج')) return 'لم يكتمل';
    return 'مُنجز';
  }

  let workshops = (c && c.workshopsArchive) || [];
  if (from) workshops = workshops.filter((e) => (e.date || '') >= from && e.date !== '—');
  if (to) workshops = workshops.filter((e) => (e.date || '') <= to && e.date !== '—');
  if (sch) workshops = workshops.filter((e) => (e.school || '').toLowerCase().includes(sch));
  workshops.forEach((e) => tasks.push({
    id: 'ws_' + e.id,
    date: e.date && e.date !== '—' ? e.date : '',
    school: e.school && e.school !== '—' ? e.school : '',
    type: 'ورشة',
    title: e.title || '',
    result: mapCtResult(e.result),
    duration: parseInt(e.duration) || 0,
    auto: false,
  }));
  return tasks;
}

export function summarize(tasks) {
  return {
    total: tasks.length,
    done: tasks.filter((t) => t.result === 'مُنجز').length,
    mins: tasks.reduce((s, t) => s + (t.duration || 0), 0),
    days: new Set(tasks.map((t) => t.date)).size,
  };
}

export const categoryCounts = (tasks) => ST_CATS.map((c) => tasks.filter(c.filter).length);
export const weekCounts = (tasks, wins) => wins.map((w) => tasks.filter((t) => t.date >= w.from && t.date <= w.to).length);
export const resultCounts = (tasks) => RESULT_LABELS.map((r) => tasks.filter((t) => t.result === r).length);
export const pct = (n, total) => (total ? Math.round(n / total * 100) : 0);

// إعدادات Chart.js الثلاثة (مطابقة للقديم حرفياً)
export function chartConfigs(tasks, wins) {
  return {
    stChartType: {
      type: 'bar',
      data: {
        labels: ST_CATS.map((c) => c.icon + ' ' + c.label),
        datasets: [{ label: 'عدد الأنشطة', data: categoryCounts(tasks), backgroundColor: ST_CATS.map((c) => c.color), borderRadius: 8 }],
      },
      options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } },
    },
    stChartTrend: {
      type: 'line',
      data: {
        labels: wins.map((w, i) => 'الأسبوع ' + (i + 1)),
        datasets: [{ label: 'عدد المهام', data: weekCounts(tasks, wins), borderColor: '#2563a8', backgroundColor: 'rgba(37,99,168,0.1)', fill: true, tension: 0.35, pointRadius: 5, pointBackgroundColor: '#1a3a5c' }],
      },
      options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } },
    },
    stChartResult: {
      type: 'doughnut',
      data: { labels: RESULT_LABELS, datasets: [{ data: resultCounts(tasks), backgroundColor: RESULT_COLORS, borderWidth: 2 }] },
      options: { responsive: true, plugins: { legend: { display: false } }, cutout: '60%' },
    },
  };
}

// ── مبيانات التقرير الشهري (SVG) ──
export const ST_FONT = 'Cairo,Tahoma,Arial,sans-serif';
export function stNiceStep(v) { const c = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000]; for (let i = 0; i < c.length; i++) if (c[i] >= v) return c[i]; return Math.ceil(v / 1000) * 1000; }
export function svgWrap(w, h, inner, defs) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" font-family="' + ST_FONT + '">'
    + (defs ? '<defs>' + defs + '</defs>' : '') + '<rect width="' + w + '" height="' + h + '" fill="#fff"/>' + inner + '</svg>';
}
export function svgBars(labels, vals, colors) {
  const W = 620, rowH = 30, T = 8, LW = 260, H = T + rowH * labels.length + 8;
  const mx = Math.max(1, ...vals), x0 = W - LW - 6, maxLen = x0 - 46;
  let o = '';
  labels.forEach((lb, i) => {
    const y = T + i * rowH, len = Math.round(maxLen * vals[i] / mx);
    o += '<rect x="' + (x0 - maxLen) + '" y="' + (y + 5) + '" width="' + maxLen + '" height="18" rx="5" fill="#eef2f8"/>';
    if (vals[i] > 0) o += '<rect x="' + (x0 - len) + '" y="' + (y + 5) + '" width="' + len + '" height="18" rx="5" fill="' + colors[i] + '"/>';
    o += '<text x="' + (x0 - len - 6) + '" y="' + (y + 19) + '" text-anchor="end" font-size="13" font-weight="800" fill="#1b2a4a">' + vals[i] + '</text>';
    o += '<text x="' + (W - 6) + '" y="' + (y + 19) + '" text-anchor="end" font-size="13" font-weight="700" fill="#1b2a4a">' + lb + '</text>';
  });
  return { svg: svgWrap(W, H, o), w: W, h: H };
}
export function svgLine(labels, subs, vals) {
  const W = 560, H = 230, L = 44, R = 20, T = 26, B = 52, pw = W - L - R, ph = H - T - B, N = vals.length, INS = 52;
  const mx = Math.max(1, ...vals), step = stNiceStep(Math.max(1, Math.ceil(mx / 4))), top = step * 4;
  const px = (i) => (N > 1 ? L + INS + (pw - 2 * INS) * (i / (N - 1)) : L + pw / 2), py = (v) => T + ph - ph * v / top;
  let o = '';
  for (let g = 0; g <= 4; g++) {
    const y = T + ph - ph * g / 4;
    o += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" stroke="#e1e8f3"/>';
    o += '<text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="12" fill="#5b6b88">' + (step * g) + '</text>';
  }
  const pts = vals.map((v, i) => px(i) + ',' + py(v));
  if (N > 1) {
    o += '<polygon points="' + px(0) + ',' + (T + ph) + ' ' + pts.join(' ') + ' ' + px(N - 1) + ',' + (T + ph) + '" fill="#2563a8" opacity=".10"/>';
    o += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#2563a8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
    const x1 = px(N - 2), y1 = py(vals[N - 2]), x2 = px(N - 1), y2 = py(vals[N - 1]), dx = x2 - x1, dy = y2 - y1, L2 = Math.hypot(dx, dy) || 1, ux = dx / L2, uy = dy / L2;
    const tx = x2 - ux * 9, ty = y2 - uy * 9, bx = tx - ux * 13, by = ty - uy * 13;
    o += '<polygon points="' + tx + ',' + ty + ' ' + (bx - uy * 6) + ',' + (by + ux * 6) + ' ' + (bx + uy * 6) + ',' + (by - ux * 6) + '" fill="#2563a8"/>';
  }
  vals.forEach((v, i) => {
    o += '<circle cx="' + px(i) + '" cy="' + py(v) + '" r="5" fill="#1a3a5c" stroke="#fff" stroke-width="2"/>';
    o += '<text x="' + px(i) + '" y="' + (py(v) - 12) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#1b2a4a">' + v + '</text>';
    o += '<text x="' + px(i) + '" y="' + (H - 30) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#1b2a4a">' + labels[i] + '</text>';
    o += '<text x="' + px(i) + '" y="' + (H - 12) + '" text-anchor="middle" font-size="11" fill="#5b6b88">' + subs[i] + '</text>';
  });
  return { svg: svgWrap(W, H, o), w: W, h: H };
}
export function svgDonut(labels, vals, colors, total) {
  const W = 560, H = 210, cx = 150, cy = 105, R = 84, r = 50;
  let o = '', ang = -90;
  const pt = (a, rad) => [cx + rad * Math.cos(a * Math.PI / 180), cy + rad * Math.sin(a * Math.PI / 180)];
  if (total > 0) {
    vals.forEach((v, i) => {
      if (!v) return;
      const sweep = Math.min(359.99, v / total * 360), a1 = ang, a2 = ang + sweep, large = sweep > 180 ? 1 : 0;
      const p1 = pt(a1, R), p2 = pt(a2, R), p3 = pt(a2, r), p4 = pt(a1, r);
      o += '<path d="M' + p1[0] + ' ' + p1[1] + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p2[0] + ' ' + p2[1] + ' L' + p3[0] + ' ' + p3[1] + ' A' + r + ' ' + r + ' 0 ' + large + ' 0 ' + p4[0] + ' ' + p4[1] + ' Z" fill="' + colors[i] + '" stroke="#fff" stroke-width="2"/>';
      ang = a2;
    });
  } else o += '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="#e2e8f0"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#fff"/>';
  o += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="26" font-weight="900" fill="#1a3a5c">' + total + '</text>';
  o += '<text x="' + cx + '" y="' + (cy + 24) + '" text-anchor="middle" font-size="12" fill="#5b6b88">مهمة</text>';
  labels.forEach((lb, i) => {
    const y = 62 + i * 40, pc = total ? Math.round(vals[i] / total * 100) : 0;
    o += '<rect x="520" y="' + (y - 12) + '" width="16" height="16" rx="3" fill="' + colors[i] + '"/>';
    o += '<text x="510" y="' + y + '" text-anchor="end" font-size="14" font-weight="800" fill="#1b2a4a">' + lb + '</text>';
    o += '<text x="510" y="' + (y + 17) + '" text-anchor="end" font-size="12" fill="#5b6b88">' + vals[i] + ' (' + pc + '%)</text>';
  });
  return { svg: svgWrap(W, H, o), w: W, h: H };
}

// SVG → PNG لتظهر في الطباعة وWord. env يحقن أدوات المتصفح: { Image, createCanvas(w, h) }
export function svgToPng(ch, env) {
  return new Promise((res) => {
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ch.svg);
    const img = new env.Image();
    img.onload = () => {
      try {
        const c = env.createCanvas(ch.w * 2, ch.h * 2);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/png'));
      } catch (e) { res(url); }
    };
    img.onerror = () => { res(url); };
    img.src = url;
  });
}

export const EMPTY_REPORT_ALERT = '⚠️ لا توجد بيانات للشهر المختار.';
export const NO_DATA_TEXT = 'لا توجد بيانات للفترة المختارة.';

// المبيانات الثلاثة للتقرير + أرقامه الملخصة
export function reportModel(tasks, { ym, from, to }) {
  const mo = +ym.slice(5, 7), yr = ym.slice(0, 4);
  const monthName = ST_MONTHS[mo - 1] + ' ' + yr;
  const total = tasks.length;
  const wins = monthWeeks(from, to);
  const resVals = resultCounts(tasks);
  const charts = [
    svgBars(ST_CATS.map((c) => c.label), categoryCounts(tasks), ST_CATS.map((c) => c.color)),
    svgLine(wins.map((w, i) => 'الأسبوع ' + (i + 1)), wins.map((w) => w.a + ' – ' + w.z + '/' + mo), weekCounts(tasks, wins)),
    svgDonut(RESULT_LABELS, resVals, RESULT_COLORS, total),
  ];
  return { monthName, period: 'شهر ' + monthName + ' (من ' + from + ' إلى ' + to + ')', ...summarize(tasks), charts };
}

// نص HTML التقرير؛ pngs = صور المبيانات الثلاثة (بعد svgToPng)
export function reportHtml(model, pngs) {
  const chartImg = (i) => `<div style="text-align:center;page-break-inside:avoid;break-inside:avoid;margin:4px 0 12px;"><img class="st-chart-img" src="${pngs[i]}" data-w="${model.charts[i].w}" data-h="${model.charts[i].h}" alt="" style="width:100%;height:auto;max-width:164mm;display:block;margin:0 auto;"></div>`;
  return `
    <div class="new-report-header">
      <div class="nrh-logo"><img id="ministry-logo-img" src="" alt="شعار الوزارة" style="width:100%;height:auto;display:block;"></div>
      <div class="nrh-dir dynamic-directorate">مديرية الحي الحسني</div>
      <div class="nrh-school">الفترة: ${model.period}</div>
      <div class="nrh-title">التقرير الإحصائي الشهري لعمل المختص الاجتماعي</div>
    </div>
    <div class="report-section-title">ملخص النشاط الشهري</div>
    <table class="wk-table-report"><thead><tr><th data-w="1">إجمالي المهام</th><th data-w="1">المُنجزة</th><th data-w="1">وقت العمل (د)</th><th data-w="1">أيام النشاط</th></tr></thead>
      <tbody><tr><td>${model.total}</td><td>${model.done}</td><td>${model.mins}</td><td>${model.days}</td></tr></tbody></table>
    <div class="report-section-title">مبيان 1 — توزيع الأنشطة حسب النوع (أعمدة)</div>
    ${chartImg(0)}
    <div class="report-section-title">مبيان 2 — تطور النشاط حسب أسابيع شهر ${model.monthName}</div>
    ${chartImg(1)}
    <div class="report-section-title">مبيان 3 — نسب النتائج والإنجاز (دائري)</div>
    ${chartImg(2)}
    <div class="wk-sigs"><div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div><div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div></div>
  `;
}
