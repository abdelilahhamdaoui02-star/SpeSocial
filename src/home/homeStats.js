// منطق الصفحة الرئيسية الحسابي (بطاقات الإحصائيات + مخطط الشهر) — دوال نقية بلا DOM ولا React،
// منقولة من hpRender في script-23.js القديم بنفس القواعد: أسابيع الشهر من الاثنين إلى الأحد
// مقصوصة على حدود الشهر، وكل سجل يُحسب مرة واحدة لكل أسبوع يقع فيه تاريخه.
// icon: كود SVG ثابت من عندنا (منقول حرفياً من HTML القديم) وليس إدخال مستخدم.

export const MONTHS = ['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];
export const DAY_NAMES = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

export const KPI_SOURCES = [
  {
    id: "statInterviews",
    keys: ["interviewArchive"],
    chartLabel: "مقابلات",
    label: "مقابلات",
    color: "#2f6fe4",
    cls: "k-blue",
    icon: "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h6\"/></svg>",
    date: (e) => e.interviewDate,
  },
  {
    id: "statReintegration",
    keys: ["reintegrationArchive"],
    chartLabel: "إدماج مدرسي",
    label: "إدماج مدرسي",
    color: "#6366f1",
    cls: "k-indigo",
    icon: "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4\"/></svg>",
    date: (e) => e.reintegrationDate,
  },
  {
    id: "statAbsence",
    keys: ["absenceArchive"],
    chartLabel: "غياب",
    label: "حالات غياب",
    color: "#e08e0b",
    cls: "k-amber",
    icon: "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"9\" cy=\"8\" r=\"3.5\"/><path d=\"M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6\"/><circle cx=\"17.5\" cy=\"9\" r=\"2.5\"/><path d=\"M17 14c2.8 0 4.7 1.9 4.7 5\"/></svg>",
    date: (e) => e.recordDate,
  },
  {
    id: "statViolence",
    keys: ["violenceArchive"],
    chartLabel: "عنف",
    label: "حالات عنف",
    color: "#e5584f",
    cls: "k-coral",
    icon: "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z\"/></svg>",
    date: (e) => e.reportDate,
  },
  {
    id: "statWorkshops",
    keys: ["workshopsArchive"],
    chartLabel: "ورشات وأنشطة",
    label: "ورشات وأنشطة",
    color: "#0e9fa8",
    cls: "k-teal",
    icon: "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"9\"/><circle cx=\"12\" cy=\"12\" r=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"1.4\"/></svg>",
    date: (e) => e.date,
  },
  {
    id: "statSpecNeeds",
    keys: ["specialNeedsArchive"],
    chartLabel: "إعاقة",
    label: "وضعيات إعاقة",
    color: "#8b5cf6",
    cls: "k-violet",
    icon: "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"5\" r=\"2\"/><path d=\"M5 9h14M12 9v6M9 21l3-6 3 6\"/></svg>",
    date: (e) => e.date || e.recordDate,
  },
  {
    id: "statVigilance",
    keys: ["vigilanceCases"],
    chartLabel: "خلية اليقظة",
    label: "خلية اليقظة",
    color: "#db2777",
    cls: "k-rose",
    icon: "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>",
    date: (e) => e.date,
  },
  {
    id: "statReferral",
    keys: ["pdAssocArchive", "pdHealthArchive"],
    chartLabel: "إحالة وإخبار صحي",
    label: "إحالات وإخبار صحي",
    color: "#a16207",
    cls: "k-brown",
    icon: "<svg class=\"\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M7 9V3h10v6\"/><rect x=\"3\" y=\"9\" width=\"18\" height=\"8\" rx=\"2\"/><path d=\"M7 14h10v7H7z\"/></svg>",
    date: (e) => e.date,
  },
];

const pad = (n) => (n < 10 ? '0' : '') + n;
export const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

// يقتطع YYYY-MM-DD من بداية النص، وإلا ''
export function dateOf(v) {
  if (typeof v !== 'string') return '';
  const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

export function niceStep(v) {
  const c = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000];
  for (let i = 0; i < c.length; i++) if (c[i] >= v) return c[i];
  return Math.ceil(v / 1000) * 1000;
}

export function seasonStartYear(now = new Date()) {
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
}

export function offsetTag(off) {
  if (off === 0) return 'هذا الشهر';
  if (off === -1) return 'الشهر الماضي';
  if (off === 1) return 'الشهر المقبل';
  return off < 0 ? 'قبل ' + (-off) + ' أشهر' : 'بعد ' + off + ' أشهر';
}

// أسابيع الشهر (الاثنين → الأحد، مقصوصة على حدود الشهر)
export function monthWindows(first, last) {
  const wins = [];
  let cur = new Date(first);
  while (cur <= last) {
    const dw = (cur.getDay() + 6) % 7;
    let end = new Date(cur);
    end.setDate(cur.getDate() + (6 - dw));
    if (end > last) end = new Date(last);
    wins.push({ from: iso(cur), to: iso(end), a: cur.getDate(), z: end.getDate() });
    cur = new Date(end);
    cur.setDate(cur.getDate() + 1);
  }
  return wins;
}

const asList = (v) => (Array.isArray(v) ? v : []);

// collections: كائن المجموعات من المخزن (appData)؛ off: إزاحة الشهر؛ today: تاريخ اليوم (للاختبار)
export function computeMonth(collections, off = 0, today = new Date()) {
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const first = new Date(t.getFullYear(), t.getMonth() + off, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const wins = monthWindows(first, last);
  const mFrom = iso(first);
  const mTo = iso(last);

  const cols = KPI_SOURCES.map((src) => {
    const arr = src.keys.reduce((acc, k) => acc.concat(asList(collections[k])), []);
    const perWk = wins.map(() => 0);
    let month = 0;
    arr.forEach((e) => {
      if (!e || typeof e !== 'object') return; // سجل تالف: نتجاهله بدل أن يتعطل الحساب
      const d = dateOf(src.date(e));
      if (!d) return;
      wins.forEach((w, k) => { if (d >= w.from && d <= w.to) perWk[k]++; });
      if (d >= mFrom && d <= mTo) month++;
    });
    return { src, perWk, month };
  });

  let mx = 0;
  let grand = 0;
  cols.forEach((c) => c.perWk.forEach((v) => { if (v > mx) mx = v; grand += v; }));
  return { first, last, wins, cols, mx, grand, todayIso: iso(t), label: MONTHS[first.getMonth()] + ' ' + first.getFullYear() };
}

// هندسة المخطط (نفس الأبعاد والأرقام في الكود القديم)
export const CHART = { W: 720, H: 235, L: 38, R: 10, T: 18, B: 44, GN: 5, gap: 3 };

export function buildChart(model) {
  const { W, H, L, R, T, B, GN, gap } = CHART;
  const { wins, cols, mx, todayIso, first } = model;
  const active = cols.filter((c) => c.month > 0);
  const step = niceStep(Math.max(1, Math.ceil(Math.max(mx, 5) / GN)));
  const top = step * GN;
  const pw = W - L - R;
  const ph = H - T - B;
  const gw = pw / wins.length;
  const n = Math.max(1, active.length);
  const bw = Math.max(5, Math.min(26, (gw - 16 - (n - 1) * gap) / n));
  const grp = n * bw + (n - 1) * gap;

  const grid = [];
  for (let g = 0; g <= GN; g++) grid.push({ y: T + ph - (ph * g) / GN, value: step * g });

  const weeks = wins.map((w, k) => {
    const isNow = todayIso >= w.from && todayIso <= w.to;
    const cx = L + k * gw + gw / 2;
    const x0 = cx - grp / 2;
    const bars = [];
    active.forEach((c, ci) => {
      const v = c.perWk[k];
      if (!v) return;
      const h = (ph * Math.min(v, top)) / top;
      const x = x0 + ci * (bw + gap);
      bars.push({
        key: c.src.id, x, y: T + ph - h, w: bw, h, r: Math.min(4, bw / 2), v, color: c.src.color,
        title: 'الأسبوع ' + (k + 1) + ' (' + w.from + ' → ' + w.to + ') — ' + c.src.chartLabel + ': ' + v,
        showValue: bw >= 9, valueSize: bw >= 11 ? 11 : 9,
      });
    });
    return {
      k, isNow, cx, bars,
      band: { x: L + k * gw + 2, y: T, w: gw - 4, h: ph },
      title: 'الأسبوع ' + (k + 1),
      range: w.a + ' – ' + w.z + '/' + (first.getMonth() + 1),
    };
  });
  return { grid, weeks, ph };
}

// نص الأسبوع المحدد في بطاقة التقرير (منقول من wpUpdateMainBadge)
export function formatWeekRange(from, to) {
  if (!from || !to) return '—';
  const df = new Date(from + 'T12:00:00');
  const dt = new Date(to + 'T12:00:00');
  return DAY_NAMES[df.getDay()] + ' ' + from + '  →  ' + DAY_NAMES[dt.getDay()] + ' ' + to;
}

// مللي ثانية حتى منتصف الليل التالي (+ثانية أمان)
export function msUntilNextMidnight(now = new Date()) {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return next.getTime() - now.getTime();
}
