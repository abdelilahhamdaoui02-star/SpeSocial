import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useWeekPickerOpen, closeWeekPicker } from './weekPickerStore.js';
import { QUICK_PICKS, weekRange, endFromStart, previewText, validateRange, saveSelectedWeek } from './weekPickerLogic.js';

const F = "'Cairo',sans-serif";
const dateInput = { width: '100%', padding: '8px 10px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: F, fontSize: '0.85rem', color: '#1e293b' };
const dateLabel = { fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 5 };
const sectionTitle = { fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 10 };

function QuickButton({ pick, onPick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={() => onPick(pick.offset)}
      onMouseOver={() => setHover(true)}
      onMouseOut={() => setHover(false)}
      style={{ flex: 1, minWidth: 120, padding: '10px 8px', background: hover ? pick.hover : pick.bg, color: pick.color, border: '2px solid ' + pick.border, borderRadius: 10, fontFamily: F, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
    >{pick.label}</button>
  );
}

function WeekPickerBody() {
  // كل فتح للنافذة = تركيب جديد، فيبدأ على «هذا الأسبوع» (كما كانت openWeekPickerModal تستدعي wpSetThisWeek)
  const [range, setRange] = useState(() => weekRange(0));

  const setPick = (offset) => setRange(weekRange(offset));
  const onFrom = (e) => {
    const from = e.target.value;
    const to = endFromStart(from);
    setRange((r) => ({ from, to: to == null ? r.to : to }));
  };
  const onTo = (e) => setRange((r) => ({ ...r, to: e.target.value }));

  const generate = () => {
    const err = validateRange(range.from, range.to);
    if (err) { alert(err); return; }
    saveSelectedWeek(window.localStorage, range.from, range.to);
    // بطاقة التقرير في الصفحة الرئيسية (React) تسمع هذا الحدث وتعرض الأسبوع المحدد
    window.dispatchEvent(new CustomEvent('legacy:week-range', { detail: { from: range.from, to: range.to } }));
    closeWeekPicker();
    // نافذة معاينة التقرير صارت في React (src/weeklypreview) وتسجّل هذه الدالة العامة؛ إن كانت مفتوحة تُحدَّث بالأسبوع الجديد
    if (typeof window.openWeeklyReportPreview === 'function') window.openWeeklyReportPreview();
  };

  const preview = previewText(range.from, range.to);

  return (
    <div id="weekPickerModal" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden', fontFamily: F }}>
        <div style={{ background: 'linear-gradient(135deg,#0a1f3d,#1a3a5c)', color: 'white', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>اختر الأسبوع</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: 2 }}>حدد الفترة التي تريد إنشاء التقرير لها</div>
          </div>
          <button type="button" aria-label="إغلاق" onClick={closeWeekPicker} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 34, height: 34, color: 'white', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px 0' }}>
          <div style={sectionTitle}>اختيار سريع</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_PICKS.map((p) => <QuickButton key={p.id} pick={p} onPick={setPick} />)}
          </div>
        </div>
        <div style={{ padding: '16px 24px' }}>
          <div style={sectionTitle}>أو حدد تاريخاً يدوياً</div>
          <div style={{ background: '#f8fafc', border: '2px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={dateLabel} htmlFor="wpFromDate">من تاريخ</label>
                <input type="date" id="wpFromDate" value={range.from} onChange={onFrom} style={dateInput} />
              </div>
              <div>
                <label style={dateLabel} htmlFor="wpToDate">إلى تاريخ</label>
                <input type="date" id="wpToDate" value={range.to} onChange={onTo} style={dateInput} />
              </div>
            </div>
            {preview && <div id="wpPreview" style={{ marginTop: 12, background: '#1a3a5c', color: '#f0d97a', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', fontWeight: 700, textAlign: 'center' }}>{preview}</div>}
          </div>
        </div>
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={closeWeekPicker} style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '2px solid #e2e8f0', borderRadius: 10, fontFamily: F, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>إلغاء</button>
          <button type="button" onClick={generate} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#0a1f3d,#1a3a5c)', color: 'white', border: 'none', borderRadius: 10, fontFamily: F, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(26,58,92,0.3)' }}>معاينة التقرير</button>
        </div>
      </div>
    </div>
  );
}

export default function WeekPickerModal() {
  const open = useWeekPickerOpen();
  if (!open || typeof document === 'undefined') return null;
  return createPortal(<WeekPickerBody />, document.body);
}
