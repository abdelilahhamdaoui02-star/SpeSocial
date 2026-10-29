import { createPortal } from 'react-dom';
import { useWeekRange } from '../store/hooks.js';
import { formatWeekRange } from './homeStats.js';
import { printWeeklyReport } from '../weekly/weeklyPrint.js';
import { getSession } from '../session/installSession.js';

// نوافذ اختيار الأسبوع ومعاينة التقرير ما زالت من الكود القديم (تُحوَّل في مرحلة لاحقة)؛ نستدعي دوالها فقط.
const callLegacy = (name) => () => { if (typeof window[name] === 'function') window[name](); };
const openPicker = callLegacy('openWeekPickerModal');
const openPreview = callLegacy('openWeeklyReportPreview');

// طباعة التقرير للأسبوع المحدد مباشرة (ومنها «حفظ كـ PDF»): HTML التقرير من weekly.wkReportHtml (يقرأ الأرشيفات)، والطباعة من الوحدة الجديدة
export const printRange = (from, to) => {
  if (!from || !to) return false;
  printWeeklyReport(getSession().weekly.wkReportHtml(from, to));
  return true;
};

// محتوى بطاقة التقرير (مُصدَّر منفصلاً ليسهل اختباره)
export function ReportCardBody({ range, onPrint = () => printRange(range.from, range.to) }) {
  return (
    <div className="hp-report-in">
      <div className="hp-report-info">
        <div className="hp-report-ico">
          <svg className="" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>
        </div>
        <div>
          <div className="hp-report-t">التقرير الأسبوعي الشامل</div>
          <div className="hp-report-s">المقابلات · الإدماج · الغياب · العنف · سجل المهام</div>
          <div id="mainWeekRangeBadge" onClick={openPicker} title="انقر لتغيير الأسبوع">
            <span>📅 الأسبوع المحدد:</span><span id="mainWeekRangeText">{formatWeekRange(range.from, range.to)}</span><span>✎</span>
          </div>
        </div>
      </div>
      <div className="hp-report-btns">
        <button type="button" className="hp-btn b-blue" onClick={openPreview}>
          <svg className="" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>معاينة وتعديل
        </button>
        <button type="button" className="hp-btn b-blue" onClick={onPrint} title="طباعة التقرير أو حفظه PDF">
          <svg className="" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /></svg>طباعة / PDF
        </button>
      </div>
    </div>
  );
}

export default function WeeklyReportCard({ mount }) {
  const range = useWeekRange();
  if (!mount) return null;
  return createPortal(<ReportCardBody range={range} />, mount);
}
