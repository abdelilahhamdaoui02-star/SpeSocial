import { useEffect, useMemo, useRef, useState } from 'react';
import { getSession } from '../session/installSession.js';
import { createPortal } from 'react-dom';
import { useCollection, useCurrentPortal, useCurrentUser, useProfile, useStudents } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import {
  SN_KEY, SN_PROCS, GENDER_OPTIONS, CATEGORY_OPTIONS, HAS_REPORT_OPTIONS, REFERRAL_OPTIONS, ADAPTATION_OPTIONS, CURRENT_STATUS_OPTIONS,
  DIAGNOSIS_CHIPS, RECOMMENDATION_CHIPS, TRACK_RESULTS, TRACK_COLOR, TRACK_BG, P_COLOR, P_BG, MSG,
  todayIso, toggleIn, blankProcRows, newCustomRow, editProcRow, saveEntry, taskLogArgs, updateEntry, formFromEntry, archiveStats,
  filterArchive, deleteEntry, addTrackingLog, deleteTrackingLog, defaultNextDate, reportHtml, trackingCardHtml, trackingCardWordHtml,
  trackingCardFileName, trackingCardWordFileName,
} from './specialNeedsLogic.js';
import { downloadHtml, downloadWordDoc } from './specialNeedsPrint.js';
import { openPreview } from '../preview/previewStore.js';
import { acSetup } from '../autocomplete/studentAutocomplete.js';
import { cleanClassValue } from '../students/cleanClass.js';
import { getLogo } from '../settings/logoStore.js';
import { getInstitution } from '../institution/institutionStore.js';

// الإكمال التلقائي للتلاميذ ما زال من الكود القديم (acSetup): يكتب في حقول البوابة مباشرة (المسار والمؤسسة والقسم والجنس)
const AC_CFG = { nameId: 'sn_studentName', massarId: 'sn_studentMassar', schoolId: 'sn_school', levelId: 'sn_level', genderName: 'sn_gender', phoneId: 'sn_parentPhone' };// حقول النص غير المتحكَّم بها (يكتب فيها الإكمال التلقائي وapplyInstitutionEverywhere مباشرة في DOM) → معرّفاتها القديمة
const TEXT_IDS = {
  studentName: 'sn_studentName', massar: 'sn_studentMassar', school: 'sn_school', parentPhone: 'sn_parentPhone',
  recordDate: 'sn_recordDate', diagnosis: 'sn_diagnosis', recommendation: 'sn_recommendation',
};

const currentArchive = () => getState().collections[SN_KEY] ?? [];
const instName = () => { try { return getInstitution().getInstitutionName(); } catch (e) { return ''; } };
const directorate = () => {
  try { return getInstitution().getDirectorate(); } catch (e) { /* لا شيء */ }
  const p = getState().profile || {};
  return p.school ? p.school : 'مديرية الحي الحسني';
};
const logo = () => getLogo();
const cleanClass = cleanClassValue;
const schoolDefault = () => { const p = getState().profile || {}; return p.institution ? p.institution : instName(); };

const FONT = "'Cairo',sans-serif";
const SEL = { width: '100%', padding: '7px 11px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: FONT, fontSize: '0.875rem', color: 'var(--text)', background: '#fafbfc', direction: 'rtl' };
const HEAD_BG = 'linear-gradient(90deg,#1d4ed8,#2563eb)';

function Section({ n, title, children }) {
  return (
    <div className="section-card">
      <div className="section-header" style={{ background: HEAD_BG }}>
        <span className="step-badge" style={{ background: '#bfdbfe', color: '#1d4ed8' }}>{n}</span> {title}
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

// أزرار الاقتراحات السريعة (appendSuggest القديمة): تُلحق النص في سطر جديد وتركّز الحقل
function Chips({ items, onPick }) {
  return (
    <div className="suggest-chips" style={{ marginTop: 6 }}>
      {items.map(([lbl, txt]) => <button key={lbl} type="button" className="suggest-chip" onClick={() => onPick(txt)}>{lbl}</button>)}
    </div>
  );
}

// ── بطاقة المتابعة والتتبع ──
const T_INPUT = { width: '100%', padding: '8px 10px', border: '1.5px solid #99f6e4', borderRadius: 8, fontFamily: FONT, fontSize: '0.82rem', background: 'white', boxSizing: 'border-box' };
const T_LABEL = { fontSize: '0.75rem', fontWeight: 600, color: '#0f766e', display: 'block', marginBottom: 4 };

function TrackingModal({ entry, onClose, onAdd, onDelete, onDownload, onWord }) {
  const [date, setDate] = useState(() => todayIso());
  const [result, setResult] = useState('');
  const [note, setNote] = useState('');
  const [by, setBy] = useState('');
  const [nextDate, setNextDate] = useState(() => defaultNextDate(entry));
  const logs = entry.trackingLogs || [];

  const add = () => {
    if (onAdd({ date, result, note, by, nextDate })) { setResult(''); setNote(''); setBy(''); setNextDate(''); }
  };
  const th = (extra) => ({ padding: '9px 10px', textAlign: 'right', ...extra });

  return createPortal(
    <div id="snTrackingModal" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 700, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div id="snTrackingBox" style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', direction: 'rtl', fontFamily: FONT }}>
        <div style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white', padding: '18px 24px', borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>📋 بطاقة المتابعة والتتبع</div>
            <div id="snTrackingStudentName" style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: 3 }}>{`♿ ${entry.studentName} — ${entry.category} — ${entry.school}`}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onDownload} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: 8, padding: '7px 13px', cursor: 'pointer', fontFamily: FONT, fontSize: '0.8rem', fontWeight: 700 }}>⬇️ تحميل البطاقة</button>
            <button type="button" onClick={onWord} style={{ background: '#166534', border: '1px solid rgba(255,255,255,0.35)', color: 'white', borderRadius: 8, padding: '7px 13px', cursor: 'pointer', fontFamily: FONT, fontSize: '0.8rem', fontWeight: 700 }}>📝 تحميل Word</button>
            <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '1.3rem', cursor: 'pointer', borderRadius: 8, padding: '4px 10px' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '18px 20px', background: '#f0fdfa', borderBottom: '2px solid #99f6e4' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f766e', marginBottom: 10 }}>➕ إضافة جلسة متابعة جديدة</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={T_LABEL}>📅 تاريخ المتابعة *</label>
              <input type="date" id="snTrackDate" style={T_INPUT} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label style={T_LABEL}>📊 نتيجة المتابعة *</label>
              <select id="snTrackResult" style={T_INPUT} value={result} onChange={(e) => setResult(e.target.value)}>
                <option value="">-- اختر النتيجة --</option>
                {TRACK_RESULTS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={T_LABEL}>📝 ملاحظات المتابعة</label>
            <textarea id="snTrackNote" placeholder="اكتب ملاحظاتك حول هذه الجلسة..." style={{ ...T_INPUT, resize: 'vertical', minHeight: 60 }} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={T_LABEL}>👤 اسم المتابِع</label>
              <input type="text" id="snTrackBy" placeholder="اسم المختص / المعلم..." style={T_INPUT} value={by} onChange={(e) => setBy(e.target.value)} />
            </div>
            <div>
              <label style={T_LABEL}>📅 موعد المتابعة القادمة</label>
              <input type="date" id="snTrackNextDate" style={T_INPUT} value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
            </div>
          </div>
          <button type="button" onClick={add} style={{ marginTop: 12, background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white', border: 'none', borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontFamily: FONT, fontSize: '0.84rem', fontWeight: 700, width: '100%' }}>💾 حفظ جلسة المتابعة</button>
        </div>

        <div style={{ padding: '18px 20px', flex: 1 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a3a5c', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🗂️ سجل جلسات المتابعة</span>
            <span id="snTrackCount" style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 12, padding: '2px 10px', fontSize: '0.72rem' }}>{logs.length} جلسة</span>
          </div>
          <div id="snTrackingTable">
            {!logs.length ? (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.82rem', padding: 24, background: '#f8fafc', borderRadius: 10, border: '2px dashed #cbd5e1' }}>
                📂 لم تُسجَّل أي جلسة متابعة بعد.<br /><small>استخدم النموذج أعلاه لإضافة أول جلسة.</small>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.79rem', fontFamily: FONT }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(135deg,#0f2744,#1a3a5c)', color: 'white' }}>
                      <th style={th()}>#</th><th style={th()}>📅 التاريخ</th><th style={th()}>📊 نتيجة المتابعة</th><th style={th()}>📝 الملاحظات</th>
                      <th style={th()}>👤 المتابِع</th><th style={th()}>📅 الموعد القادم</th><th style={th({ textAlign: 'center' })}>حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...logs].reverse().map((log, idx) => (
                      <tr key={log.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 10px', color: '#64748b', textAlign: 'center' }}>{logs.length - idx}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', fontWeight: 700, color: '#1a3a5c' }}>📅 {log.date}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ background: TRACK_BG[log.result] || '#f1f5f9', color: TRACK_COLOR[log.result] || '#475569', border: `1px solid ${TRACK_COLOR[log.result] || '#cbd5e1'}40`, borderRadius: 10, padding: '3px 9px', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{log.result || '—'}</span>
                        </td>
                        <td style={{ padding: '8px 10px', maxWidth: 180, color: '#374151' }}>{log.note || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                        <td style={{ padding: '8px 10px', color: '#374151' }}>{log.by || <span style={{ color: '#94a3b8' }}>—</span>}</td>
                        <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: '#0f766e' }}>{log.nextDate ? `📅 ${log.nextDate}` : <span style={{ color: '#94a3b8' }}>—</span>}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button type="button" onClick={() => onDelete(log.id)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.72rem' }}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SpecialNeedsBody() {
  const active = useCurrentPortal() === 'specialneeds';
  const [archive, setArchive] = useCollection(SN_KEY);
  const students = useStudents();
  const user = useCurrentUser();
  const profile = useProfile();
  const f = useRef({});
  const inited = useRef(false); // snInitialized القديمة: تاريخ فتح الملف = اليوم عند أول فتح (وبعد «تفريغ النموذج»)
  const rootRef = useRef(null);

  // خيارات تتحكّم بها React (الأخرى نصوص يكتب فيها الإكمال التلقائي مباشرة)
  const [category, setCategory] = useState('');
  const [hasReport, setHasReport] = useState('');
  const [referral, setReferral] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');
  const [adaptations, setAdaptations] = useState([]);
  const [procRows, setProcRows] = useState(blankProcRows);
  const [editId, setEditId] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [trackId, setTrackId] = useState(null);

  const ref = (k) => (el) => { f.current[k] = el; };
  const classes = useMemo(() => {
    const set = new Set();
    students.forEach((s) => { const c = cleanClass(s && s.class); if (c) set.add(c); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
  }, [students]);

  // الجنس: أزرار راديو يكتب فيها الإكمال التلقائي مباشرة، فنقرؤها ونكتبها من DOM
  const genderEls = () => (rootRef.current ? rootRef.current.querySelectorAll('input[name="sn_gender"]') : []);
  const gender = () => { const el = rootRef.current && rootRef.current.querySelector('input[name="sn_gender"]:checked'); return el ? el.value : ''; };
  const setGender = (val) => genderEls().forEach((el) => { el.checked = !!val && el.value === val; });

  const readForm = () => {
    const o = {};
    for (const k of Object.keys(TEXT_IDS)) o[k] = f.current[k] ? f.current[k].value : '';
    o.level = f.current.level ? f.current.level.value : '';
    return { ...o, gender: gender(), category, hasReport, referral, currentStatus, adaptations, procRows };
  };
  const writeText = (vals) => { for (const k of Object.keys(TEXT_IDS)) if (f.current[k]) f.current[k].value = vals[k] || ''; };
  const persist = (next) => setArchive(next).catch((e) => { console.error(e); alert('❌ فشل حفظ البيانات'); });

  const setToday = () => { if (f.current.recordDate) f.current.recordDate.value = todayIso(); };

  // initSpecialNeeds القديمة: عند فتح البوابة
  useEffect(() => {
    if (!active) return;
    try { acSetup(AC_CFG); } catch (e) { console.error(e); }
    if (!inited.current) { inited.current = true; setToday(); }
    if (f.current.school && !f.current.school.value) f.current.school.value = schoolDefault();
  }, [active]);

  // updateBbAvatars القديمة: اسم الحساب وحرفه الأول في شريط العودة
  useEffect(() => {
    if (!active) return;
    const name = (profile && profile.fullName) || user || '';
    const initials = name ? String(name).charAt(0).toUpperCase() : '؟';
    document.querySelectorAll('.bb-avatar').forEach((el) => { el.textContent = initials; });
    document.querySelectorAll('.bb-name').forEach((el) => { el.textContent = name || 'الحساب'; });
  }, [active, profile, user]);

  // snClearAll القديمة: تمسح الحقول والخيارات والجدول وتعيد المؤسسة والتاريخ.
  // (انحراف صغير: القديمة كانت تترك القسم المختار؛ هنا يُفرَّغ مع بقية النموذج)
  const wipe = () => {
    writeText({});
    if (f.current.level) f.current.level.selectedIndex = 0;
    setGender('');
    setCategory(''); setHasReport(''); setReferral(''); setCurrentStatus(''); setAdaptations([]);
    setProcRows(blankProcRows());
    if (f.current.school) f.current.school.value = schoolDefault();
    setToday();
  };
  const clearAll = () => {
    if (!confirm(MSG.CONFIRM_CLEAR_ALL)) return;
    wipe();
    inited.current = true;
  };

  const doSave = (silent) => {
    const r = saveEntry(currentArchive(), readForm());
    if (r.error) { if (!silent) alert(r.error === 'name' ? MSG.NAME_FIRST : MSG.CATEGORY_FIRST); return; }
    persist(r.archive);
    setArchiveOpen(true);
    try { getSession().archives.autoLogTask(...taskLogArgs(r.entry)); } catch (e) { if (!silent) console.error(e); }
  };

  const generateReport = () => {
    const form = readForm();
    if (!String(form.studentName || '').trim()) { alert(MSG.NAME_FIRST); return; }
    openPreview('specialneeds', reportHtml(form, { logo: logo(), directorate: directorate() }));
    // ✅ حفظ تلقائي في الأرشيف عند إنشاء التقرير (صامت؛ ولا يحفظ إن غاب التصنيف)
    try { doSave(true); } catch (e) { console.error(e); }
  };

  const loadEntry = (id) => {
    const e = currentArchive().find((x) => x.id === id);
    if (!e) return;
    const v = formFromEntry(e);
    writeText(v);
    // القسم: يتغيّر فقط إن وُجد خيار مطابق في القائمة (كالقديم)
    const lv = f.current.level;
    if (lv && Array.from(lv.options).some((o) => o.value === v.level)) lv.value = v.level;
    setGender(v.gender);
    setCategory(v.category); setHasReport(v.hasReport); setReferral(v.referral); setCurrentStatus(v.currentStatus);
    setAdaptations(v.adaptations); setProcRows(v.procRows);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { /* لا شيء */ }
    setEditId(id);
  };

  // snCancelEdit القديمة: تخفي الشريط ثم تستدعي snClearAll (بتأكيدها)
  const cancelEdit = () => { setEditId(null); clearAll(); };

  const updateCurrent = () => {
    if (!editId) return;
    const form = readForm();
    const r = updateEntry(currentArchive(), editId, form);
    if (!r) return;
    if (r.error) { alert(MSG.NAME_FIRST); return; }
    persist(r.archive);
    setEditId(null);
    clearAll();
    setArchiveOpen(true);
    alert(MSG.UPDATED(String(form.studentName).trim()));
  };

  const del = (id) => {
    if (!confirm(MSG.CONFIRM_DELETE)) return;
    persist(deleteEntry(currentArchive(), id));
  };
  const clearArchive = () => {
    const cur = currentArchive();
    if (!cur.length) { alert(MSG.EMPTY_ARCHIVE); return; }
    if (!confirm(MSG.CONFIRM_CLEAR_ARCHIVE(cur.length))) return;
    persist([]);
  };

  // ── بطاقة التتبع ──
  const trackEntry = trackId != null ? archive.find((e) => e.id === trackId) : null;
  const addLog = (input) => {
    const r = addTrackingLog(currentArchive(), trackId, input);
    if (!r) return false;
    if (r.error) { alert(r.error === 'date' ? MSG.TRACK_DATE : MSG.TRACK_RESULT); return false; }
    persist(r.archive);
    alert(MSG.TRACK_SAVED);
    return true;
  };
  const delLog = (logId) => {
    if (!confirm(MSG.CONFIRM_DELETE_LOG)) return;
    const r = deleteTrackingLog(currentArchive(), trackId, logId);
    if (r) persist(r.archive);
  };
  const downloadCard = () => {
    const e = currentArchive().find((x) => x.id === trackId);
    if (!e) return;
    downloadHtml(trackingCardHtml(e, { logo: logo(), now: new Date() }), trackingCardFileName(e));
  };
  const downloadCardWord = () => {
    const e = currentArchive().find((x) => x.id === trackId);
    if (!e) { alert(MSG.NO_CARD); return; }
    downloadWordDoc(trackingCardWordHtml(e, { now: new Date() }), trackingCardWordFileName(e));
  };

  const appendTo = (key, text) => {
    const el = f.current[key];
    if (!el) return;
    el.value = el.value.trim() ? el.value.trimEnd() + '\n' + text : text;
    el.focus();
  };

  const rowSet = (i, field, value) => setProcRows((rows) => editProcRow(rows, i, field, value));
  const filtered = filterArchive(archive, search);
  const st = archiveStats(archive);

  return (
    <div ref={rootRef}>
      {editId != null && (
        <div id="snEditBar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: 'white', padding: '12px 20px', borderRadius: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 700 }}>
            <span style={{ fontSize: '1.2rem' }}>✏️</span><span>وضع التعديل — تم تحميل الملف. عدّل ما تريد ثم احفظ.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={updateCurrent} style={{ background: '#fcd34d', color: '#1a3a5c', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: FONT, fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer' }}>💾 حفظ التعديلات</button>
            <button type="button" onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '8px 14px', fontFamily: FONT, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>✕ إلغاء</button>
          </div>
        </div>
      )}

      <div className="info-box" style={{ background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' }}>
        ♿ <span>هذه البوابة مخصصة لتوثيق ومتابعة ملفات التلاميذ في وضعية إعاقة، أو في حالة صحية خاصة، أو الذين يعانون من صعوبات التعلم — مع تسجيل الإجراءات والدعم المقدم.</span>
      </div>

      <Section n="١" title="معلومات التلميذ(ة)">
        <div className="form-grid">
          <div className="form-group"><label>اسم التلميذ(ة) الكامل *</label><input ref={ref('studentName')} type="text" id="sn_studentName" placeholder="الاسم الكامل للتلميذ(ة)" autoComplete="off" /></div>
          <div className="form-group"><label>رقم مسار</label><input ref={ref('massar')} type="text" id="sn_studentMassar" placeholder="رقم مسار" readOnly style={{ background: '#f0f4ff', color: '#1a3a5c', fontWeight: 700 }} /></div>
          <div className="form-group"><label>المؤسسة التعليمية</label><input ref={ref('school')} type="text" id="sn_school" defaultValue="" /></div>
          <div className="form-group"><label>القسم</label>
            <select ref={ref('level')} id="sn_level" className="level-select" data-react-level="1" style={SEL} defaultValue="">
              {classes.length ? (
                <>
                  <option value="">— اختر القسم —</option>
                  <optgroup label="📥 أقسام لائحة التلاميذ">{classes.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>
                </>
              ) : <option value="">— استورد لائحة التلاميذ لتظهر الأقسام —</option>}
            </select>
          </div>
          <div className="form-group"><label>الجنس</label>
            <div className="radio-group">
              {GENDER_OPTIONS.map(([val, lbl]) => <label key={val}><input type="radio" name="sn_gender" value={val} /> {lbl}</label>)}
            </div>
          </div>
          <div className="form-group"><label>هاتف ولي الأمر</label><input ref={ref('parentPhone')} type="tel" id="sn_parentPhone" placeholder="06XXXXXXXX" /></div>
          <div className="form-group"><label>تاريخ فتح الملف</label><input ref={ref('recordDate')} type="date" id="sn_recordDate" /></div>
        </div>
      </Section>

      <Section n="٢" title="نوع الوضعية">
        <div className="form-grid">
          <div className="form-group col-span-2">
            <label>تصنيف الوضعية *</label>
            <div style={{ overflowX: 'auto' }}>
              <table id="sn-category-table" className="iproc-table sn-cat-table">
                <thead><tr><th style={{ width: '9%', textAlign: 'center' }}>✓</th><th>نوع الوضعية</th></tr></thead>
                <tbody>
                  {CATEGORY_OPTIONS.map(([val, lbl]) => (
                    <tr key={val} onClick={() => setCategory(val)}>
                      <td className="c"><input type="radio" name="sn_category" value={val} checked={category === val} onChange={() => setCategory(val)} /></td>
                      <td className="nm">{lbl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="form-group col-span-2">
            <label>وصف الوضعية / التشخيص الطبي أو التربوي</label>
            <textarea ref={ref('diagnosis')} id="sn_diagnosis" placeholder="اكتب وصفاً مختصراً للوضعية الصحية أو التشخيص الطبي / التربوي..." style={{ minHeight: 65 }} />
            <Chips items={DIAGNOSIS_CHIPS} onPick={(t) => appendTo('diagnosis', t)} />
          </div>
          <div className="form-group"><label>هل يتوفر تقرير طبي أو نفسي؟</label>
            <div className="radio-group">
              {HAS_REPORT_OPTIONS.map(([val, lbl]) => <label key={val}><input type="radio" name="sn_has_report" value={val} checked={hasReport === val} onChange={() => setHasReport(val)} /> {lbl}</label>)}
            </div>
          </div>
          <div className="form-group"><label>مصدر الإحالة</label>
            <div className="radio-group">
              {REFERRAL_OPTIONS.map(([val, lbl]) => <label key={val}><input type="radio" name="sn_referral" value={val} checked={referral === val} onChange={() => setReferral(val)} /> {lbl}</label>)}
            </div>
          </div>
        </div>
      </Section>

      <Section n="٣" title="الإجراءات المتخذة">
        <div className="form-grid">
          <div className="form-group col-span-2">
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>حدّد الإجراء المتخذ ثم أدخل <strong>التاريخ</strong> و<strong>الملاحظات</strong> (تُحدَّد الخانة تلقائياً عند الكتابة).</div>
            <div style={{ overflowX: 'auto' }}>
              <table id="sn-summary-table" className="iproc-table">
                <thead>
                  <tr>
                    <th style={{ width: '7%', textAlign: 'center' }}>✓</th>
                    <th style={{ width: '34%' }}>اسم الإجراء</th>
                    <th style={{ width: '18%', textAlign: 'center' }}>التاريخ</th>
                    <th>الملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {procRows.map((r, i) => {
                    const p = r.custom ? null : SN_PROCS.find((x) => x.key === r.key);
                    return (
                      <tr key={r.custom ? 'c' + i : r.key} data-key={r.custom ? undefined : r.key} data-custom={r.custom ? '1' : undefined}>
                        <td className="c"><input type="checkbox" id={r.custom ? undefined : 'sn_chk_' + r.key} checked={r.checked} onChange={(e) => rowSet(i, 'checked', e.target.checked)} /></td>
                        {r.custom ? (
                          <td>
                            <div className="iproc-namewrap">
                              <input type="text" className="iproc-name" placeholder="اسم الإجراء..." value={r.name} onChange={(e) => rowSet(i, 'name', e.target.value)} />
                              <button type="button" className="iproc-del" title="حذف" onClick={() => setProcRows((rows) => rows.filter((_, j) => j !== i))}>✕</button>
                            </div>
                          </td>
                        ) : <td className="nm">{p.label}</td>}
                        <td><input type="date" id={r.custom ? undefined : 'sn_pdate_' + r.key} value={r.date} onChange={(e) => rowSet(i, 'date', e.target.value)} /></td>
                        <td><input type="text" className="iproc-note" id={r.custom ? undefined : 'sn_pnote_' + r.key} placeholder={r.custom ? 'ملاحظات...' : p.ph} value={r.notes} onChange={(e) => rowSet(i, 'notes', e.target.value)} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button type="button" className="iproc-add" onClick={() => setProcRows((rows) => [...rows, newCustomRow()])}>+ إضافة إجراء آخر</button>
          </div>
          <div className="form-group col-span-2">
            <label>التكيفات البيداغوجية المعتمدة</label>
            <div className="check-group">
              {ADAPTATION_OPTIONS.map(([val, lbl]) => (
                <label key={val}><input type="checkbox" name="sn_adaptations" value={val} checked={adaptations.includes(val)} onChange={() => setAdaptations((a) => toggleIn(a, val))} /> {lbl}</label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section n="٤" title="الخلاصة والتوصيات">
        <div className="form-grid">
          <div className="form-group"><label>الحالة الراهنة</label>
            <div className="radio-group">
              {CURRENT_STATUS_OPTIONS.map(([val, lbl]) => <label key={val}><input type="radio" name="sn_current_status" value={val} checked={currentStatus === val} onChange={() => setCurrentStatus(val)} /> {lbl}</label>)}
            </div>
          </div>
          <div className="form-group col-span-2">
            <label>التوصية الختامية</label>
            <textarea ref={ref('recommendation')} id="sn_recommendation" placeholder="اكتب التوصية الختامية للمختص الاجتماعي..." style={{ minHeight: 65 }} />
            <Chips items={RECOMMENDATION_CHIPS} onPick={(t) => appendTo('recommendation', t)} />
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 18 }}>
          <button type="button" className="btn btn-primary" style={{ background: HEAD_BG }} onClick={generateReport}>📄 معاينة التقرير وطباعته</button>
          <button type="button" className="btn btn-success" onClick={() => doSave(false)}>🗄️ حفظ في الأرشيف</button>
          <button type="button" className="btn btn-outline" onClick={clearAll}>🔄 تفريغ النموذج</button>
        </div>
      </Section>

      <div className="archive-panel" style={{ borderColor: '#93c5fd' }}>
        <div className="archive-header" onClick={() => setArchiveOpen((o) => !o)} style={{ background: HEAD_BG }}>
          <div className="archive-header-left"><span>🗄️</span><span>سجل الأرشيف — التلاميذ في وضعية إعاقة وصعوبات التعلم</span><span className="archive-badge" id="snArchiveCount">{archive.length}</span></div>
          <span id="snArchiveArrow">{archiveOpen ? '▲' : '▼'}</span>
        </div>
        <div className={'archive-body' + (archiveOpen ? ' open' : '')} id="snArchiveBody">
          <div className="archive-stats" id="snArchiveStats">
            <div className="archive-stat">♿ إجمالي الملفات: <strong>{st.total}</strong></div>
            {st.urgent > 0 && <div className="archive-stat" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>🔴 حالات عاجلة: <strong>{st.urgent}</strong></div>}
          </div>
          <div className="archive-search">
            <input type="text" id="snArchiveSearch" placeholder="🔍 ابحث باسم التلميذ أو نوع الوضعية..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="btn-sm btn-sm-danger" onClick={clearArchive}>🗑 مسح الأرشيف</button>
          </div>
          <div id="snArchiveList">
            {!filtered.length ? (
              <div className="archive-empty">
                {search.trim() ? '🔍 لا توجد نتائج.' : <>📂 لا توجد ملفات محفوظة بعد.<br /><small>اضغط "حفظ في الأرشيف" لإضافة الملف الحالي.</small></>}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="archive-table">
                  <thead><tr><th>#</th><th>اسم التلميذ(ة)</th><th>المؤسسة</th><th>المستوى</th><th>نوع الوضعية</th><th>تاريخ الفتح</th><th>الأولوية</th><th>الحالة</th><th>التتبع</th><th>الإجراءات</th></tr></thead>
                  <tbody>
                    {filtered.map((e, idx) => {
                      const logs = e.trackingLogs || [];
                      const lastLog = logs.length ? logs[logs.length - 1] : null;
                      const hasPriority = e.priority && e.priority !== '—';
                      return (
                        <tr key={e.id}>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{idx + 1}</td>
                          <td><strong style={{ color: '#1d4ed8' }}>♿ {e.studentName}</strong></td>
                          <td>{e.school}</td>
                          <td style={{ textAlign: 'center' }}>{e.level}</td>
                          <td><span style={{ background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 10, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>{e.category}</span></td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>📅 {e.recordDate}</td>
                          <td style={{ textAlign: 'center' }}>
                            {hasPriority ? <span style={{ background: P_BG[e.priority] || '#f1f5f9', color: P_COLOR[e.priority] || '#64748b', border: `1px solid ${P_COLOR[e.priority] || '#cbd5e1'}`, borderRadius: 12, padding: '2px 9px', fontSize: '0.72rem', fontWeight: 700 }}>● {e.priority}</span> : '—'}
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.75rem' }}>{e.currentStatus}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button type="button" onClick={() => setTrackId(e.id)} style={{ background: 'linear-gradient(135deg,#0f766e,#14b8a6)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: FONT, fontWeight: 700, whiteSpace: 'nowrap' }}>
                              📋 التتبع <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 10, padding: '1px 6px', marginRight: 3 }}>{logs.length}</span>
                            </button>
                            {lastLog && <div style={{ fontSize: '0.65rem', color: '#0f766e', marginTop: 2 }}>آخر: {lastLog.date}</div>}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                              <button type="button" className="btn-sm" onClick={() => loadEntry(e.id)} style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: FONT, fontWeight: 700 }}>✏️ تعديل</button>
                              <button type="button" className="btn-sm btn-sm-danger" onClick={() => del(e.id)}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {trackEntry && (
        <TrackingModal key={trackEntry.id} entry={trackEntry} onClose={() => setTrackId(null)} onAdd={addLog} onDelete={delLog} onDownload={downloadCard} onWord={downloadCardWord} />
      )}
    </div>
  );
}

// المرحلة 26: وضعية إعاقة وصعوبات التعلم — تُرسم داخل #mountSpecialNeeds في صفحة toolSpecialNeeds القديمة؛
// شريط العودة ونافذة المعاينة (#snPrintModal) بقيا في body.html لارتباط الطباعة وWord بمعرّفاتها. نافذة التتبع تُرسم في document.body.
export default function SpecialNeedsPortal({ mount }) {
  if (!mount) return null;
  return createPortal(<SpecialNeedsBody />, mount);
}
