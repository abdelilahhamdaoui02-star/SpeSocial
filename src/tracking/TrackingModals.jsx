import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCollection } from '../store/hooks.js';
import { showToast } from '../ui/toast.js';
import { printLogoImg } from '../settings/logoLogic.js';
import { addTrackingLog, TRACK_RESULTS } from '../specialneeds/specialNeedsLogic.js';
import {
  ARCHIVE_COLLECTIONS, ARCHIVE_TYPES, NOTIF_SECTIONS, STATUS_BG, STATUS_COLOR, TRACK_TYPE_LABELS,
  actionChips, bellCount, filterRows, getAllNotifs, getAllTrackingLogs, groupNotifs, longDate,
  monthOptions, relativeLabel, sessionSummary, trackingKpis,
} from './trackingLogic.js';
import { buildTrackingPrintHtml } from './trackingPrint.js';
import { closeTracking, openNotifications, openTrackingTable, useTrackingView } from './trackingStore.js';
import { getLogo } from '../settings/logoStore.js';

const FONT = "'Cairo',sans-serif";
const logo = () => getLogo();
const todayIso = () => new Date().toISOString().slice(0, 10);

// الأرشيفات الخمسة دفعة واحدة (من المخزن) + دوال حفظ كل نوع
function useArchives() {
  const [interview, setInterview] = useCollection(ARCHIVE_COLLECTIONS.interview);
  const [reintegration, setReintegration] = useCollection(ARCHIVE_COLLECTIONS.reintegration);
  const [absence, setAbsence] = useCollection(ARCHIVE_COLLECTIONS.absence);
  const [specialNeeds, setSpecialNeeds] = useCollection(ARCHIVE_COLLECTIONS.specialNeeds);
  const [violence, setViolence] = useCollection(ARCHIVE_COLLECTIONS.violence);
  const archives = useMemo(
    () => ({ interview, reintegration, absence, specialNeeds, violence }),
    [interview, reintegration, absence, specialNeeds, violence],
  );
  const setters = { interview: setInterview, reintegration: setReintegration, absence: setAbsence, specialNeeds: setSpecialNeeds, violence: setViolence };
  return { archives, setters };
}

// ══════════ جرس الإشعارات (يُرسم داخل شريط البحث العلوي) ══════════
export function NotifBell({ mount }) {
  const { archives } = useArchives();
  const counts = useMemo(() => {
    const { allItems, today } = getAllNotifs(archives);
    return groupNotifs(allItems, today).counts;
  }, [archives]);
  if (!mount) return null;
  const n = bellCount(counts);
  return createPortal(
    <button type="button" id="notifBell" className="visible" title="الإشعارات ومواعيد المتابعة" aria-label="الإشعارات" onClick={openNotifications}>
      🔔{n > 0 && <span className="bell-badge">{n > 9 ? '9+' : n}</span>}
    </button>,
    mount,
  );
}

// أزرار الدخول من بوابة «المتابعة وتتبع الحالات»
export function TrackingLinks() {
  const btn = (bg) => ({ background: bg, color: 'white', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: FONT, fontSize: '0.82rem', fontWeight: 700 });
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '0 0 14px', direction: 'rtl' }}>
      <button type="button" onClick={openNotifications} style={btn('linear-gradient(135deg,#1a3a5c,#2563a8)')}>🔔 الإشعارات ومواعيد المتابعة</button>
      <button type="button" onClick={openTrackingTable} style={btn('linear-gradient(135deg,#0f766e,#14b8a6)')}>📅 جدول التتبع الشهري</button>
    </div>
  );
}

// ══════════ هيكل النافذة المشترك ══════════
function Shell({ title, subtitle, headBg, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.65)', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div role="dialog" aria-label={title} style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: wide ? 1180 : 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.35)', overflow: 'hidden', direction: 'rtl', fontFamily: FONT }}>
        <div style={{ background: headBg, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ color: 'white', fontSize: '1rem', fontWeight: 800 }}>{title}</div>
            {subtitle && <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button type="button" aria-label="إغلاق" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ overflow: 'auto', padding: 16, flex: 1, background: '#f8fafc' }}>{children}</div>
        {footer && <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', background: 'white', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

const FIELD = { width: '100%', padding: '7px 9px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: FONT, fontSize: '0.8rem', background: 'white', boxSizing: 'border-box' };
const LBL = { fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 };
const ghostBtn = { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontFamily: FONT, fontSize: '0.82rem', fontWeight: 700 };

// ══════════ الإشعارات ══════════
function FollowupForm({ item, onSave, onCancel }) {
  const [f, setF] = useState({ date: todayIso(), result: '', note: '', by: '', nextDate: '' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <div style={{ background: '#f0fdfa', border: '1.5px solid #99f6e4', borderRadius: 10, padding: 12, marginTop: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 8 }}>
        <div><label style={LBL}>📅 تاريخ المتابعة *</label><input type="date" style={FIELD} value={f.date} onChange={set('date')} /></div>
        <div>
          <label style={LBL}>📊 النتيجة *</label>
          <select style={FIELD} value={f.result} onChange={set('result')}>
            <option value="">-- اختر --</option>
            {TRACK_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><label style={LBL}>👤 المتابِع</label><input type="text" style={FIELD} value={f.by} onChange={set('by')} /></div>
        <div><label style={LBL}>📅 الموعد القادم</label><input type="date" style={FIELD} value={f.nextDate} onChange={set('nextDate')} /></div>
      </div>
      <div style={{ marginTop: 8 }}><label style={LBL}>📝 ملاحظات</label><textarea style={{ ...FIELD, minHeight: 54, resize: 'vertical' }} value={f.note} onChange={set('note')} /></div>
      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 6 }}>حدّد «الموعد القادم» كي يتحدّث الإشعار؛ وإلا يبقى موعده الحالي.</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button type="button" onClick={() => onSave(item, f)} style={{ ...ghostBtn, background: '#0f766e', color: 'white', border: 'none' }}>💾 حفظ المتابعة</button>
        <button type="button" onClick={onCancel} style={ghostBtn}>إلغاء</button>
      </div>
    </div>
  );
}

function NotificationsModal() {
  const { archives, setters } = useArchives();
  const [openId, setOpenId] = useState(null);
  const { allItems, today } = useMemo(() => getAllNotifs(archives), [archives]);
  const { groups, counts, total } = useMemo(() => groupNotifs(allItems, today), [allItems, today]);

  const save = async (item, form) => {
    const res = addTrackingLog(archives[item.archiveType] || [], item.id, form);
    if (!res) { showToast('⚠️ لم يُعثر على السجل', 'warning'); return; }
    if (res.error) { showToast(res.error === 'date' ? '⚠️ يرجى تحديد تاريخ المتابعة.' : '⚠️ يرجى اختيار نتيجة المتابعة.', 'warning'); return; }
    try {
      await setters[item.archiveType](res.archive);
      setOpenId(null);
      showToast('✅ تم تسجيل جلسة المتابعة', 'success');
    } catch (err) {
      showToast('⚠️ تعذّر حفظ المتابعة — حاول مرة أخرى', 'warning');
    }
  };

  const kpi = (val, lbl, color) => (
    <div className="notif-kpi"><div className="nk-val" style={{ color }}>{val}</div><div className="nk-lbl">{lbl}</div></div>
  );

  return (
    <Shell
      title="🔔 الإشعارات ومواعيد المتابعة" subtitle={`${total} موعد متابعة مسجّل`} headBg="linear-gradient(135deg,#1a3a5c,#2563a8)"
      onClose={closeTracking}
      footer={(
        <>
          <button type="button" onClick={openTrackingTable} style={{ ...ghostBtn, background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: 'white', border: 'none' }}>📅 جدول التتبع الشهري</button>
          <button type="button" onClick={closeTracking} style={ghostBtn}>إغلاق</button>
        </>
      )}
    >
      <div className="notif-kpi-row">
        {kpi(counts.overdue, 'متأخرة', '#7c3aed')}
        {kpi(counts.today, 'اليوم', '#dc2626')}
        {kpi(counts.soon, 'خلال 3 أيام', '#d97706')}
        {kpi(counts.upcoming, 'لاحقاً', '#2563a8')}
      </div>
      {total === 0 && <div className="notif-empty">🎉 لا توجد مواعيد متابعة مسجّلة.</div>}
      {NOTIF_SECTIONS.map((sec) => groups[sec.key].length > 0 && (
        <div className="notif-section" key={sec.key}>
          <div className="notif-section-title">{sec.title}<span className="notif-badge-count">{groups[sec.key].length}</span></div>
          <div className="notif-list">
            {groups[sec.key].map((it) => {
              const k = it.archiveType + ':' + it.id;
              return (
                <div className="notif-item" key={k} style={{ flexWrap: 'wrap' }}>
                  <span className={`notif-dot ${sec.key}`} />
                  <div className="notif-content">
                    <div className="notif-student">{it.student || '—'}</div>
                    <div className="notif-meta">{it.icon} {it.type}{it.school ? ' · ' + it.school : ''}{it.priority && it.priority !== '—' ? ' · ● ' + it.priority : ''}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div className={`notif-date ${sec.key}`}>📅 {it.dateStr}</div>
                    <div className="notif-meta">{relativeLabel(it, today)}</div>
                  </div>
                  <button type="button" onClick={() => setOpenId(openId === k ? null : k)} style={{ ...ghostBtn, padding: '5px 12px', fontSize: '0.74rem' }}>➕ تسجيل متابعة</button>
                  {openId === k && <div style={{ flexBasis: '100%' }}><FollowupForm item={it} onSave={save} onCancel={() => setOpenId(null)} /></div>}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Shell>
  );
}

// ══════════ جدول التتبع الشهري ══════════
const TH = (extra) => ({ padding: '10px 12px', textAlign: 'right', fontWeight: 700, ...extra });

function TrackingTableModal() {
  const { archives } = useArchives();
  const [month, setMonth] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');

  const allRows = useMemo(() => getAllTrackingLogs(archives), [archives]);
  const months = useMemo(() => monthOptions(allRows), [allRows]);
  const rows = useMemo(() => filterRows(allRows, { month, type, search }), [allRows, month, type, search]);
  const k = trackingKpis(rows);

  const print = () => {
    const printRows = filterRows(allRows, { month, type, search }, { forPrint: true });
    const html = buildTrackingPrintHtml({ rows: printRows, monthFilter: month, logoHtml: printLogoImg(logo(), 90) });
    const w = window.open('', '_blank');
    if (!w) { showToast('⚠️ تعذّر فتح نافذة الطباعة — اسمح بالنوافذ المنبثقة', 'warning'); return; }
    w.document.write(html); w.document.close(); w.focus();
    setTimeout(() => w.print(), 600);
  };

  const kpiCell = (val, lbl, color, last) => (
    <div style={{ padding: 12, textAlign: 'center', borderLeft: last ? 'none' : '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{val}</div>
      <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>{lbl}</div>
    </div>
  );

  return (
    <Shell
      wide title="📅 جدول التتبع الشهري الشامل" subtitle={`${rows.length} سجل تتبع · آخر تحديث: ${longDate()}`} headBg="linear-gradient(135deg,#0a1f3d,#1a3a5c)"
      onClose={closeTracking}
      footer={(
        <>
          <button type="button" onClick={print} style={{ ...ghostBtn, background: 'linear-gradient(135deg,#0f766e,#0d9488)', color: 'white', border: 'none' }}>🖨️ طباعة / PDF</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={openNotifications} style={ghostBtn}>🔔 الإشعارات</button>
            <button type="button" onClick={closeTracking} style={ghostBtn}>إغلاق</button>
          </div>
        </>
      )}
    >
      <style>{'.trk-row:hover td{background:#eff6ff !important}'}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10, marginBottom: 12 }}>
        <select style={FIELD} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="الشهر">
          <option value="">📅 كل الأشهر</option>
          {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select style={FIELD} value={type} onChange={(e) => setType(e.target.value)} aria-label="النوع">
          <option value="">📂 كل الأنواع</option>
          {ARCHIVE_TYPES.map((t) => <option key={t} value={t}>{TRACK_TYPE_LABELS[t]}</option>)}
        </select>
        <input type="text" dir="rtl" style={FIELD} placeholder="🔍 بحث بالاسم أو الملاحظة أو الإجراء..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
        {kpiCell(k.total, 'إجمالي جلسات التتبع', '#1a3a5c')}
        {kpiCell(k.improved, 'تحسن / مستقر', '#16a34a')}
        {kpiCell(k.pending, 'لا يزال قيد المتابعة', '#d97706')}
        {kpiCell(k.needsAttn, 'يستدعي تدخلاً', '#dc2626', true)}
      </div>

      {rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b', fontSize: '0.85rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📂</div>لا توجد سجلات تتبع للمعايير المحددة.
        </div>
      ) : (
        <div style={{ overflow: 'auto', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: FONT }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg,#0a1f3d,#1a3a5c)', color: 'white', position: 'sticky', top: 0, zIndex: 2 }}>
                <th style={TH({ textAlign: 'center', minWidth: 32, padding: '10px 8px' })}>#</th>
                <th style={TH({ minWidth: 120 })}>👤 التلميذ(ة)</th>
                <th style={TH({ minWidth: 90 })}>📂 النوع</th>
                <th style={TH({ minWidth: 95 })}>📅 تاريخ التتبع</th>
                <th style={TH({ minWidth: 140 })}>📊 نتيجة المتابعة</th>
                <th style={TH({ minWidth: 160 })}>📝 ملخص الجلسة</th>
                <th style={TH({ minWidth: 160 })}>الإجراءات المتخذة</th>
                <th style={TH({ minWidth: 90 })}>👤 المتابِع</th>
                <th style={TH({ minWidth: 90 })}>📅 الموعد القادم</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => {
                const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
                const color = STATUS_COLOR[r.trackResult];
                const chips = actionChips(r);
                const summary = sessionSummary(r);
                return (
                  <tr key={r.archiveType + r.entryId + r.logId + idx} className="trk-row" style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '9px 8px', textAlign: 'center', color: '#94a3b8', fontWeight: 600, background: bg }}>{idx + 1}</td>
                    <td style={{ padding: '9px 12px', background: bg }}>
                      <div style={{ fontWeight: 700, color: '#1a3a5c', fontSize: '0.82rem' }}>{r.studentName}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>{r.school} {r.level && r.level !== '—' ? '· ' + r.level : ''}</div>
                      {r.priority && r.priority !== '—' && <div style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: 700, marginTop: 1 }}>● {r.priority}</div>}
                    </td>
                    <td style={{ padding: '9px 12px', background: bg }}>
                      <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 7px', fontSize: '0.72rem', fontWeight: 700, color: '#475569' }}>{r.typeIcon} {r.typeLabel}</span>
                    </td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1a3a5c', whiteSpace: 'nowrap', background: bg }}>📅 {r.trackDate}</td>
                    <td style={{ padding: '9px 12px', background: bg }}>
                      <span style={{ background: STATUS_BG[r.trackResult] || '#f1f5f9', color: color || '#475569', border: `1px solid ${color || '#cbd5e1'}40`, borderRadius: 8, padding: '3px 8px', fontSize: '0.73rem', fontWeight: 700 }}>{r.trackResult || '—'}</span>
                    </td>
                    <td style={{ padding: '9px 12px', color: '#374151', maxWidth: 180, background: bg }}>
                      <div title={r.trackNote} style={{ fontSize: '0.75rem', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{summary}</div>
                    </td>
                    <td style={{ padding: '9px 12px', color: '#374151', maxWidth: 180, background: bg }}>
                      {chips.length
                        ? chips.map((a, i) => <span key={a + i} style={{ display: 'inline-block', background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 5, padding: '2px 6px', fontSize: '0.67rem', color: '#3730a3', fontWeight: 600, margin: '1px 2px' }}>{a}</span>)
                        : <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>}
                    </td>
                    <td style={{ padding: '9px 12px', color: '#475569', fontSize: '0.75rem', whiteSpace: 'nowrap', background: bg }}>{r.trackBy !== '—' ? r.trackBy : '—'}</td>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', background: bg }}>
                      {r.nextDate && r.nextDate !== '—'
                        ? <span style={{ color: '#0f766e', fontWeight: 700, fontSize: '0.75rem' }}>📅 {r.nextDate}</span>
                        : <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

// يُركَّب مرة واحدة في LegacyApp؛ يرسم النافذة المفتوحة فقط
export default function TrackingModals() {
  const view = useTrackingView();
  if (view === 'notifications') return <NotificationsModal />;
  if (view === 'table') return <TrackingTableModal />;
  return null;
}
