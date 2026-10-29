import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppState, useCurrentPortal } from '../store/hooks.js';
import {
  ymOf, monthRange, shiftMonth, monthWeeks, filterTasks, summarize, resultCounts, pct, chartConfigs,
  svgToPng, reportModel, reportHtml, RESULT_LABELS, RESULT_COLORS, EMPTY_REPORT_ALERT, NO_DATA_TEXT,
} from './statsLogic.js';
import { openStatsReport } from './reportModal.js';

const KPI_COLORS = ['#1a3a5c', '#16a34a', '#d97706', '#7c3aed'];
const CHART_IDS = ['stChartType', 'stChartTrend', 'stChartResult'];

const browserEnv = () => ({
  Image,
  createCanvas: (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; },
});

function Kpis({ sum }) {
  const kpis = [
    { label: 'إجمالي المهام', value: sum.total, icon: '📋' },
    { label: 'المهام المُنجزة', value: sum.done, icon: '✅' },
    { label: 'وقت العمل (د)', value: sum.mins, icon: '⏱' },
    { label: 'أيام النشاط', value: sum.days, icon: '📅' },
  ];
  return (
    <div id="stKpiCards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
      {kpis.map((k, i) => (
        <div key={k.label} style={{ background: 'white', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '16px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: 4 }}>{k.icon}</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: KPI_COLORS[i] }}>{k.value}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{k.label}</div>
        </div>
      ))}
    </div>
  );
}

function ResultLegend({ tasks, total }) {
  if (!total) return <p style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center', padding: 20 }}>{NO_DATA_TEXT}</p>;
  const counts = resultCounts(tasks);
  return RESULT_LABELS.map((r, i) => (
    <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 14, height: 14, borderRadius: 3, background: RESULT_COLORS[i], flexShrink: 0 }} />
      <div style={{ fontSize: '0.82rem' }}><strong style={{ color: RESULT_COLORS[i] }}>{counts[i]}</strong> {r} ({pct(counts[i], total)}%)</div>
    </div>
  ));
}

function StatsBody() {
  const { collections } = useAppState();
  const portal = useCurrentPortal();
  const [ym, setYm] = useState(() => ymOf(new Date()));
  const [school, setSchool] = useState('');
  const [tick, setTick] = useState(0);
  const refs = { stChartType: useRef(null), stChartTrend: useRef(null), stChartResult: useRef(null) };
  const charts = useRef({});

  // القديم كان يعيد ضبط الشهر على «هذا الشهر» عند كل فتح للبوابة (وتبقى خانة المؤسسة كما هي)
  useEffect(() => { if (portal === 'stats') setYm(ymOf(new Date())); }, [portal]);

  const range = monthRange(ym);
  // يُعاد الحساب تلقائياً مع أي تغيّر في المخزن (بديل script-33 الذي كان يعترض saveUserKey)
  const tasks = useMemo(() => {
    try { return filterTasks(collections, { from: range.from, to: range.to, school }); } catch (e) { console.error(e); return []; }
  }, [collections, range.from, range.to, school]);
  const wins = useMemo(() => monthWeeks(range.from, range.to), [range.from, range.to]);
  const sum = useMemo(() => summarize(tasks), [tasks]);

  // الرسوم الحية: لا تُبنى إلا والبوابة ظاهرة (Chart.js يقيس حجم الحاوية)
  useEffect(() => {
    const destroyAll = () => { Object.values(charts.current).forEach((c) => c.destroy()); charts.current = {}; };
    if (portal !== 'stats') return undefined;
    const Chart = window.Chart;
    if (!Chart) return undefined;
    Chart.defaults.color = '#000';
    Chart.defaults.font.weight = '700';
    destroyAll();
    if (!sum.total) {
      CHART_IDS.forEach((id) => { const cv = refs[id].current; if (cv) cv.getContext('2d').clearRect(0, 0, cv.width, cv.height); });
      return undefined;
    }
    const cfg = chartConfigs(tasks, wins);
    CHART_IDS.forEach((id) => { if (refs[id].current) charts.current[id] = new Chart(refs[id].current, cfg[id]); });
    return destroyAll;
  }, [portal, tasks, wins, sum.total, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateReport = async () => {
    if (!tasks.length) { alert(EMPTY_REPORT_ALERT); return; }
    const model = reportModel(tasks, { ym, from: range.from, to: range.to });
    const pngs = await Promise.all(model.charts.map((ch) => svgToPng(ch, browserEnv())));
    openStatsReport(reportHtml(model, pngs));
  };
  const openWeekly = () => { if (typeof window.openWeeklyReportPreview === 'function') window.openWeeklyReportPreview(); };

  return (
    <>
      <div className="info-box">
        💡 <span>يعرض هذا القسم رسوماً بيانية تفاعلية لنشاطك الشهري (موزعاً حسب أسابيع الشهر) وهي مرتبطة مباشرة بأرشيفات جميع البوابات (المقابلات، الإدماج، الغياب، العنف، الورشات، الإعاقة، الإحالة والإخبار الصحي) فتعكس آخر الإضافات والتعديلات والحذف. يمكنك تحميل التقرير أو طباعته.</span>
      </div>

      <div className="section-card">
        <div className="section-header"><span className="step-badge">١</span> اختيار الشهر</div>
        <div className="section-body">
          <div className="form-grid">
            <div className="form-group">
              <label>📆 الشهر</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-outline" type="button" onClick={() => setYm((v) => shiftMonth(v, -1))} title="الشهر السابق">›</button>
                <strong id="stMonthLabel" style={{ minWidth: 130, textAlign: 'center', fontSize: '1rem', color: '#1a3a5c' }}>{range.label}</strong>
                <button className="btn btn-outline" type="button" onClick={() => setYm((v) => shiftMonth(v, 1))} title="الشهر التالي">‹</button>
                <button className="btn btn-outline" type="button" onClick={() => setYm(ymOf(new Date()))}>هذا الشهر</button>
              </div>
            </div>
            <div className="form-group">
              <label>🏫 المؤسسة (اختياري)</label>
              <input type="text" id="st_school_filter" placeholder="تصفية بالمؤسسة..." value={school} onChange={(e) => setSchool(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" type="button" onClick={() => setTick((n) => n + 1)}>🔄 تحديث الرسوم</button>
          </div>
        </div>
      </div>

      <Kpis sum={sum} />

      <div className="section-card">
        <div className="section-header">📊 توزيع المهام حسب النوع</div>
        <div className="section-body" style={{ padding: 12 }}><canvas id="stChartType" height="320" ref={refs.stChartType} /></div>
      </div>

      <div className="section-card">
        <div className="section-header">📈 تطور النشاط حسب أسابيع الشهر</div>
        <div className="section-body" style={{ padding: 12 }}><canvas id="stChartTrend" height="200" ref={refs.stChartTrend} /></div>
      </div>

      <div className="section-card">
        <div className="section-header">✅ نسب النتائج والإنجاز</div>
        <div className="section-body" style={{ padding: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <canvas id="stChartResult" height="200" style={{ maxWidth: 280 }} ref={refs.stChartResult} />
          <div id="stResultLegend" style={{ flex: 1, minWidth: 180 }}><ResultLegend tasks={tasks} total={sum.total} /></div>
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn btn-primary" type="button" onClick={generateReport}>📄 إنشاء تقرير مفصّل</button>
        <button className="btn btn-success" type="button" onClick={openWeekly} style={{ background: 'linear-gradient(135deg,#1a3a5c,#2563a8)', color: 'white', border: 'none' }}>👁️ معاينة وتعديل التقرير الأسبوعي</button>
      </div>
    </>
  );
}

export default function StatsPortal({ mount }) {
  return mount ? createPortal(<StatsBody />, mount) : null;
}
