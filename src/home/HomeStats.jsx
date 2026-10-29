import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppState } from '../store/hooks.js';
import { useToday } from './useToday.js';
import { KPI_SOURCES, CHART, computeMonth, buildChart, offsetTag, seasonStartYear } from './homeStats.js';

const FONT = { fontFamily: 'Cairo,sans-serif' };

// موسم دراسي: «موسم 2026/2027»
function Season({ today }) {
  const y = seasonStartYear(today);
  return <span id="hpSeason">موسم <bdi dir="ltr">{y + '/' + (y + 1)}</bdi></span>;
}

export function WeekNav({ off, label, setOff }) {
  return (
    <div className="hp-week-nav">
      <button type="button" className="hp-wk-btn" onClick={() => setOff(off - 1)} title="الشهر السابق" aria-label="الشهر السابق">›</button>
      <div className="hp-wk-mid"><span className="hp-wk-tag" id="hpWeekTag">{offsetTag(off)}</span><span id="hpWeekLabel">{label}</span></div>
      <button type="button" className="hp-wk-btn" onClick={() => setOff(off + 1)} title="الشهر التالي" aria-label="الشهر التالي">‹</button>
      <button type="button" className="hp-wk-now" id="hpWeekNow" onClick={() => setOff(0)} style={{ display: off === 0 ? 'none' : '' }}>العودة لهذا الشهر</button>
    </div>
  );
}

export function Kpis({ model, ready }) {
  return (
    <div className="hp-kpis">
      {KPI_SOURCES.map((src, i) => (
        <div key={src.id} className={`hp-kpi ${src.cls}`}>
          <span dangerouslySetInnerHTML={{ __html: src.icon }} style={{ display: 'contents' }} />
          <span className={'dash-stat-num' + (ready ? '' : ' stat-loading')} id={src.id}>{ready ? model.cols[i].month : '—'}</span>
          <span className="dash-stat-lbl">{src.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend() {
  return (
    <div className="hp-legend" id="hpLegend">
      {KPI_SOURCES.map((s) => <span key={s.id}><i style={{ background: s.color }} />{s.chartLabel}</span>)}
    </div>
  );
}

export function MonthChart({ model }) {
  const { W, H, L, R, T } = CHART;
  const { grid, weeks, ph } = buildChart(model);
  return (
    <svg id="hpChart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="رسم بياني لمؤشرات الشهر حسب الأسبوع">
      {grid.map((g) => (
        <g key={g.value}>
          <line x1={L} x2={W - R} y1={g.y} y2={g.y} stroke="#e6ecf6" strokeWidth="1" />
          <text x={L - 8} y={g.y + 4} textAnchor="end" fontSize="12" fill="#6b7a99" style={FONT}>{g.value}</text>
        </g>
      ))}
      <line x1={L} x2={L} y1={T} y2={T + ph} stroke="#e6ecf6" />
      {weeks.map((w) => (
        <g key={w.k}>
          {w.isNow && <rect x={w.band.x} y={w.band.y} width={w.band.w} height={w.band.h} rx="8" fill="#2f6fe4" opacity=".07" />}
          {w.bars.map((b) => (
            <g key={b.key}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.r} fill={b.color}><title>{b.title}</title></rect>
              {b.showValue && <text x={b.x + b.w / 2} y={b.y - 4} textAnchor="middle" fontSize={b.valueSize} fontWeight="800" fill="#1b2a4a" style={FONT}>{b.v}</text>}
            </g>
          ))}
          <text x={w.cx} y={H - 24} textAnchor="middle" fontSize="13" {...(w.isNow ? { fontWeight: '800', fill: '#1f4fd8' } : { fill: '#44536f' })} style={FONT}>{w.title}</text>
          <text x={w.cx} y={H - 8} textAnchor="middle" fontSize="11" fill="#7b88a6" style={FONT}>{w.range}</text>
        </g>
      ))}
    </svg>
  );
}

// يرسم ثلاث مناطق داخل HTML القديم (الرأس، البطاقات، المخطط) مع حالة مشتركة واحدة: الشهر المعروض.
// الحاويات الثلاث هي نفس عناصر HTML الأصلية (hp-stats-head / hp-inner / hp-chart-card) فلا يتغير هيكل DOM ولا CSS.
export default function HomeStats({ mounts }) {
  const { collections, ready } = useAppState();
  const [off, setOff] = useState(0);
  const today = useToday();
  const model = useMemo(() => computeMonth(collections, off, today), [collections, off, today]);

  return (
    <>
      {mounts.head && createPortal(
        <>
          <h3 className="hp-panel-title">
            <svg className="" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V11M12 20V4M19 20v-6M3 20h18" /></svg>
            <span>إحصائيات المؤسسة</span>
          </h3>
          <span className="hp-season">
            <svg className="" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16.5" rx="3" /><path d="M8 2.5v4M16 2.5v4M3 10h18M8 14h2M14 14h2M8 17.5h2M14 17.5h2" /></svg>
            <Season today={today} />
          </span>
        </>, mounts.head)}
      {mounts.kpis && createPortal(
        <>
          <WeekNav off={off} label={model.label} setOff={setOff} />
          <Kpis model={model} ready={ready} />
        </>, mounts.kpis)}
      {mounts.chart && createPortal(
        <>
          <div className="hp-chart-title">
            <svg className="" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></svg>
            <span id="hpChartTitle">مؤشرات الشهر حسب الأسبوع</span>
          </div>
          <Legend />
          <div className={'hp-chart-wrap' + (model.grand === 0 ? ' is-empty' : '')} id="hpChartWrap">
            <MonthChart model={model} />
            <div className="hp-chart-empty">لا توجد بيانات مسجلة خلال هذا الشهر</div>
          </div>
        </>, mounts.chart)}
    </>
  );
}
