import { useState, useSyncExternalStore } from 'react';
import { getSession } from '../session/installSession.js';
import { createPortal } from 'react-dom';
import { getWeeklyPreview, subscribeWeeklyPreview, closeWeeklyPreview, setPreviewTab, openEditRow, closeEditRow, saveEditRow, deleteRow } from './weeklyPreviewStore.js';
import { openWeekPicker } from '../weekpicker/weekPickerStore.js';
import { printWeeklyReport, exportWeeklyWord } from '../weekly/weeklyPrint.js';
import {
  TABS, TYPE_LABELS, TYPE_COLORS, PRIORITIES, filterRows, statsOf, priorityBadge, priorityText, statusBg, statusColor, rowStatus,
  statusOptions, initialForm, dynamicSections,
} from './weeklyPreviewLogic.js';

const useWeeklyPreview = () => useSyncExternalStore(subscribeWeeklyPreview, getWeeklyPreview);

const F = "'Cairo',sans-serif";
const inp = { width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: F, fontSize: '0.85rem', boxSizing: 'border-box' };
const lbl = { fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 };
const sectionBox = { background: '#f0f7ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: 14, marginTop: 4 };
const sectionTitle = { fontSize: '0.78rem', fontWeight: 800, color: '#1a3a5c', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 };
const th = { padding: '9px 10px', fontSize: '0.75rem', color: '#475569', fontWeight: 700 };
const td = { padding: '8px 10px' };

// طباعة التقرير وتحميل Word للأسبوع المعروض: HTML التقرير من wkReportHtml القديمة (تقرأ الأرشيفات فتعكس أي تعديل أو حذف تمّ هنا)
const reportHtml = (from, to) => getSession().weekly.wkReportHtml(from, to);
function printReport(from, to) {
  if (!from) return;
  const html = reportHtml(from, to);
  if (html != null) printWeeklyReport(html);
}
async function downloadWord(from, to) {
  if (!from) return;
  const html = reportHtml(from, to);
  if (html != null) await exportWeeklyWord(html, from, to);
}

function StatCard({ value, label, color, border }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid ' + (border || '#e2e8f0'), borderRadius: 10, padding: '8px 14px', minWidth: 90 }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function Stats({ rows }) {
  const { total, byType } = statsOf(rows);
  return (
    <div id="wpr_stats" style={{ display: 'flex', gap: 10, padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', alignItems: 'stretch' }}>
      <StatCard value={total} label="إجمالي" color="#1a3a5c" />
      {byType.map(({ type, count }) => (
        <StatCard key={type} value={count} label={TYPE_LABELS[type] || type} color={TYPE_COLORS[type] || '#475569'} border={(TYPE_COLORS[type] || '#e2e8f0') + '33'} />
      ))}
    </div>
  );
}

function Table({ rows }) {
  if (!rows.length) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: '0.88rem' }}>📂 لا توجد سجلات لهذه الفترة في هذا القسم</div>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: F }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ ...th, textAlign: 'center', width: 32 }}>#</th>
            <th style={{ ...th, textAlign: 'right', whiteSpace: 'nowrap' }}>التاريخ</th>
            <th style={{ ...th, textAlign: 'right' }}>اسم التلميذ(ة)</th>
            <th style={{ ...th, textAlign: 'right' }}>المؤسسة</th>
            <th style={{ ...th, textAlign: 'right' }}>نوع الملف</th>
            <th style={{ ...th, textAlign: 'center', whiteSpace: 'nowrap' }}>الحالة</th>
            <th style={{ ...th, textAlign: 'center' }}>الأولوية</th>
            <th style={{ ...th, textAlign: 'center', whiteSpace: 'nowrap' }}>المتابعة</th>
            <th style={{ ...th, textAlign: 'center' }}>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const status = rowStatus(r);
            return (
              <tr key={r.id != null ? r._type + ':' + r.id : 'i' + i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ ...td, textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>{i + 1}</td>
                <td style={{ ...td, fontSize: '0.78rem', color: '#475569', whiteSpace: 'nowrap' }}>{r._date || '—'}</td>
                <td style={{ ...td, fontWeight: 700, color: '#1a3a5c', fontSize: '0.82rem' }}>{r.studentName || r.title || '—'}</td>
                <td style={{ ...td, fontSize: '0.75rem', color: '#64748b' }}>{r.school || '—'}</td>
                <td style={{ ...td, fontSize: '0.75rem' }}>{r._label}</td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={{ background: statusBg(status), color: statusColor(status), borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{status}</span>
                </td>
                <td style={{ ...td, textAlign: 'center', fontSize: '0.8rem' }}>{priorityBadge(r.priority || '')} {priorityText(r.priority)}</td>
                <td style={{ ...td, textAlign: 'center', fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap' }}>{r.nextFollowup || '—'}</td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                    <button type="button" onClick={() => openEditRow(r)} style={{ background: 'linear-gradient(135deg,#1a3a5c,#2563a8)', color: 'white', border: 'none', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontFamily: F, fontSize: '0.75rem', fontWeight: 700 }}>✏️ تعديل</button>
                    <button type="button" aria-label="حذف" onClick={() => deleteRow(r)} style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: 'white', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontFamily: F, fontSize: '0.75rem', fontWeight: 700 }}>🗑</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Field({ field, value, onChange }) {
  const common = { id: 'wpr_ed_' + field.key, value, style: inp, onChange: (e) => onChange(field.key, e.target.value) };
  let control;
  if (field.kind === 'select') {
    control = (
      <select {...common}>
        <option value="">{field.blank}</option>
        {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  } else if (field.kind === 'textarea') {
    control = <textarea {...common} rows={field.rows || 2} style={{ ...inp, resize: 'vertical' }} />;
  } else {
    control = <input {...common} type={field.kind === 'number' ? 'number' : 'text'} placeholder={field.placeholder} />;
  }
  return (
    <div style={field.full ? { gridColumn: '1 / -1' } : undefined}>
      <label style={lbl} htmlFor={common.id}>{field.label}</label>
      {control}
    </div>
  );
}

function EditBody({ row }) {
  // كل فتح لنافذة التعديل = تركيب جديد (key = editSeq)، فيبدأ النموذج من قيم السجل
  const [form, setForm] = useState(() => initialForm(row));
  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const sections = dynamicSections(row._type, row._label);

  return (
    <div id="wprEditModal" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9500, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 540, direction: 'rtl', fontFamily: F, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#1a3a5c' }}>✏️ تعديل السجل</h3>
          <button type="button" aria-label="إغلاق" onClick={closeEditRow} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>✕</button>
        </div>
        <div id="wprEditFields" style={{ display: 'grid', gap: 14 }}>
          <div>
            <label style={lbl} htmlFor="wpr_ed_name">اسم التلميذ(ة)</label>
            <input id="wpr_ed_name" value={form.name} onChange={(e) => change('name', e.target.value)} style={{ ...inp, fontSize: '0.88rem' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl} htmlFor="wpr_ed_school">المؤسسة</label>
              <input id="wpr_ed_school" value={form.school} onChange={(e) => change('school', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl} htmlFor="wpr_ed_date">التاريخ</label>
              <input id="wpr_ed_date" type="date" value={form.date} onChange={(e) => change('date', e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl} htmlFor="wpr_ed_status">الحالة الراهنة</label>
              <select id="wpr_ed_status" value={form.status} onChange={(e) => change('status', e.target.value)} style={inp}>
                {statusOptions(row[row._statusField] || '').map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl} htmlFor="wpr_ed_priority">الأولوية</label>
              <select id="wpr_ed_priority" value={form.priority} onChange={(e) => change('priority', e.target.value)} style={inp}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl} htmlFor="wpr_ed_followup">المتابعة القادمة</label>
            <input id="wpr_ed_followup" type="date" value={form.followup} onChange={(e) => change('followup', e.target.value)} style={inp} />
          </div>
          {sections.map((s, i) => (
            <div key={s.id} style={{ ...sectionBox, marginTop: i === 0 ? 4 : 10 }}>
              <div style={sectionTitle}>{s.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: s.cols === 2 ? '1fr 1fr' : '1fr', gap: s.cols === 2 ? 12 : 10 }}>
                {s.fields.map((f) => <Field key={f.key} field={f} value={form[f.key]} onChange={change} />)}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 4 }}>
            <label style={lbl} htmlFor="wpr_ed_notes">ملاحظات</label>
            <textarea id="wpr_ed_notes" rows={3} value={form.notes} onChange={(e) => change('notes', e.target.value)} style={{ ...inp, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => deleteRow(row, { fromEdit: true })} style={{ background: 'linear-gradient(135deg,#dc2626,#b91c1c)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: F, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>🗑️ حذف السجل</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={closeEditRow} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', borderRadius: 8, padding: '9px 18px', fontFamily: F, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>إلغاء</button>
            <button type="button" onClick={() => saveEditRow(form)} style={{ background: 'linear-gradient(135deg,#1a3a5c,#2563a8)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: F, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>💾 حفظ التعديلات</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewBody({ state }) {
  const { from, to, rows, tab, editing, editSeq } = state;
  const visible = filterRows(rows, tab);
  return (
    <>
      <div id="weeklyPreviewModal" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
        <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 980, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', direction: 'rtl', fontFamily: F, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg,#0a1f3d,#1a3a5c)', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(200,169,74,0.2)', border: '1px solid rgba(200,169,74,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>📊</div>
              <div>
                <div style={{ color: '#f0d97a', fontWeight: 800, fontSize: '0.95rem' }}>معاينة وتعديل التقرير الأسبوعي</div>
                <div id="wpr_weekLabel" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', marginTop: 2 }}>{from} — {to}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button type="button" onClick={openWeekPicker} style={{ background: 'linear-gradient(135deg,#0e8f98,#0a6c75)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: F, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>📅 تغيير الأسبوع</button>
              <button type="button" aria-label="إغلاق" onClick={closeWeeklyPreview} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>✕</button>
            </div>
          </div>

          <Stats rows={rows} />

          <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', overflowX: 'auto', background: '#fff' }}>
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <button key={t.id} id={'wpr_tab_' + t.id} type="button" onClick={() => setPreviewTab(t.id)}
                  style={{ padding: '11px 18px', border: 'none', background: 'transparent', borderBottom: '3px solid ' + (active ? '#1a3a5c' : 'transparent'), color: active ? '#1a3a5c' : '#64748b', fontFamily: F, fontSize: '0.82rem', fontWeight: active ? 800 : 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {t.label}
                </button>
              );
            })}
          </div>

          <div id="wpr_tableArea" style={{ padding: '16px 20px', minHeight: 200 }}>
            <Table rows={visible} />
          </div>

          <div style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>💡 انقر على ✏️ لتعديل أو 🗑 لحذف أي سجل</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={closeWeeklyPreview} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', borderRadius: 8, padding: '8px 18px', fontFamily: F, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>إغلاق</button>
              <button type="button" onClick={() => printReport(from, to)} style={{ background: 'linear-gradient(135deg,#1a3a5c,#2563a8)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontFamily: F, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>🖨️ طباعة</button>
              <button type="button" onClick={() => downloadWord(from, to)} style={{ background: '#1d6f42', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontFamily: F, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>📝 تحميل Word</button>
            </div>
          </div>
        </div>
      </div>
      {editing && <EditBody key={editSeq} row={editing} />}
    </>
  );
}

export default function WeeklyPreviewModal() {
  const state = useWeeklyPreview();
  if (!state.open || typeof document === 'undefined') return null;
  return createPortal(<PreviewBody state={state} />, document.body);
}
