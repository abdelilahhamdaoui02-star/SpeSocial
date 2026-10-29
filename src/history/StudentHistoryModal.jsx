import { useMemo, useSyncExternalStore } from 'react';
import { HISTORY_TYPES, clip100, historyEntries, priorityBadge } from './historyLogic.js';
import { buildHistoryPrintHtml } from './historyPrint.js';
import { historyStore } from './history.js';
import { useCollection } from '../store/hooks.js';
import { showToast } from '../ui/toast.js';
import { getLogo } from '../settings/logoStore.js';

const FONT = "'Cairo',sans-serif";
const logo = () => getLogo();

const th = (align, nowrap) => ({ padding: '10px 10px', fontWeight: 700, textAlign: align, whiteSpace: nowrap ? 'nowrap' : undefined });
const iconBtn = (bg) => ({ background: bg, color: 'white', border: 'none', borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontSize: '0.70rem', fontFamily: FONT, fontWeight: 700 });

function Priority({ value }) {
  const b = priorityBadge(value);
  if (!b) return <span style={{ color: '#94a3b8' }}>—</span>;
  return <span style={{ background: b.bg, color: b.color, border: '1px solid ' + b.border, borderRadius: 10, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' }}>● {b.label}</span>;
}

// أعمدة الجدول لكل نوع: [العنوان، المحاذاة، لا التفاف، دالة رسم الخلية]
const COLUMNS = {
  interview: [
    ['📅 التاريخ', 'center', true, (e) => <b style={{ color: '#1e293b' }}>📅 {e.interviewDate || '—'}</b>, { textAlign: 'center', whiteSpace: 'nowrap' }],
    ['📌 الموضوع', 'right', false, (e) => e.subject || '—', { maxWidth: 140 }],
    ['الأولوية', 'center', true, (e) => <Priority value={e.priority} />, { textAlign: 'center' }],
    ['📊 الحالة', 'right', false, (e) => e.currentStatus || '—', { fontSize: '0.75rem', color: '#475569', maxWidth: 180 }],
    ['ملخص المقابلة', 'right', false, (e) => clip100(e.summary), { fontSize: '0.74rem', color: '#475569', maxWidth: 200 }],
  ],
  reintegration: [
    ['📅 تاريخ الإدماج', 'center', true, (e) => <b style={{ color: '#1e293b' }}>📅 {e.reintegrationDate || '—'}</b>, { textAlign: 'center', whiteSpace: 'nowrap' }],
    ['مدة الانقطاع', 'center', false, (e) => e.absenceDuration || '—', { textAlign: 'center' }],
    ['الإجراءات', 'right', false, (e) => (e.procedures || []).join(' / ') || '—', { fontSize: '0.74rem', color: '#475569', maxWidth: 220 }],
    ['الأولوية', 'center', false, (e) => <Priority value={e.priority} />, { textAlign: 'center' }],
    ['📊 الحالة', 'right', false, (e) => e.currentStatus || '—', { fontSize: '0.75rem', color: '#475569' }],
  ],
};
const ACTIONS_HEAD = { interview: 'الإجراءات', reintegration: 'إجراء' };

function HistoryTable({ type, entries, currentId, onEdit, onDelete }) {
  const cols = COLUMNS[type];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT, fontSize: '0.78rem', direction: 'rtl' }}>
        <thead>
          <tr style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white' }}>
            <th style={{ ...th('center'), padding: '10px 8px' }}>#</th>
            {cols.map(([head, align, nowrap]) => <th key={head} style={th(align, nowrap)}>{head}</th>)}
            <th style={th('center', true)}>{ACTIONS_HEAD[type]}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, idx) => {
            const isCurrent = e.id === currentId;
            const bg = isCurrent ? '#eff6ff' : idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            return (
              <tr key={e.id ?? idx} style={{ background: bg, ...(isCurrent ? { outline: '2px solid #3b82f6', outlineOffset: -2 } : {}) }}>
                <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.73rem', padding: '9px 8px' }}>
                  {idx + 1}
                  {isCurrent && <><br /><span style={{ background: '#3b82f6', color: 'white', borderRadius: 6, padding: '0 5px', fontSize: '0.60rem' }}>●</span></>}
                </td>
                {cols.map(([head, , , cell, style]) => <td key={head} style={{ padding: '9px 10px', ...style }}>{cell(e)}</td>)}
                <td style={{ textAlign: 'center', whiteSpace: 'nowrap', padding: '9px 8px' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button type="button" title="تعديل" onClick={() => onEdit(e.id)} style={iconBtn('linear-gradient(135deg,#2563a8,#1d4ed8)')}>✏️</button>
                    <button type="button" title="حذف" onClick={() => onDelete(e.id)} style={iconBtn('linear-gradient(135deg,#dc2626,#b91c1c)')}>🗑</button>
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

// نافذة «سجل التلميذ»: تُفتح من زر «📋 السجل» في بوابتي المقابلات والإدماج
export default function StudentHistoryModal() {
  const { open, type, name, currentId } = useSyncExternalStore(historyStore.subscribe, historyStore.getSnapshot);
  const cfg = HISTORY_TYPES[type];
  const [archive] = useCollection(cfg.collection);
  const entries = useMemo(() => historyEntries(archive, name, type), [archive, name, type]);
  if (!open) return null;

  const close = () => historyStore.close();
  const edit = (id) => { close(); historyStore.run(type, 'loadEntry', id); };
  const remove = (id) => {
    if (!window.confirm(cfg.confirmDelete)) return;
    historyStore.run(type, 'del', id, true); // true: التأكيد تمّ هنا، فلا تسأل البوابة مرة ثانية
    close();
  };
  const print = () => {
    if (!entries.length) return;
    const html = buildHistoryPrintHtml({ type, entries, name, logo: logo() });
    const w = window.open('', '_blank', 'width=950,height=680');
    if (!w) { showToast('⚠️ تعذّر فتح نافذة الطباعة — اسمح بالنوافذ المنبثقة', 'warning'); return; }
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 700);
  };

  return (
    <div
      id="studentHistoryModal"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', overflow: 'hidden', direction: 'rtl' }}>
        <div style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ color: 'white', fontSize: '1rem', fontWeight: 800, fontFamily: FONT }}>{cfg.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontFamily: FONT, marginTop: 3 }}>
              👤 <span style={{ fontWeight: 700 }}>{name}</span>
              &nbsp;·&nbsp;
              <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '1px 10px', fontSize: '0.75rem' }}>{cfg.count(entries.length)}</span>
            </div>
          </div>
          <button type="button" aria-label="إغلاق" onClick={close} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ overflow: 'auto', padding: 16, flex: 1, background: '#f8fafc' }}>
          {entries.length
            ? <HistoryTable type={type} entries={entries} currentId={currentId} onEdit={edit} onDelete={remove} />
            : <div style={{ textAlign: 'center', color: '#94a3b8', padding: 30 }}>{cfg.empty}</div>}
        </div>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 10, flexWrap: 'wrap' }}>
          <button type="button" onClick={print} style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: 'white', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: FONT, fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>طباعة السجل</button>
          <button type="button" onClick={close} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: FONT, fontSize: '0.82rem', fontWeight: 700 }}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}
