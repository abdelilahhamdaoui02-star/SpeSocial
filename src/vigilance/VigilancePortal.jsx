import { useEffect, useMemo, useRef, useState } from 'react';
import { getSession } from '../session/installSession.js';
import { createPortal } from 'react-dom';
import { useCollection, useCurrentPortal, useCurrentUser, useStudents } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import {
  VIG_KEY, VIG_CATEGORIES, PRIORITY_OPTIONS, STATUS_OPTIONS, P_COLOR, P_BG, S_COLOR, S_BG, MSG,
  todayIso, toggleIn, suggestionsFor, editSuggestionsFor, appendLine, getArchive,
  migrateArchive, repairArchive, kpis, archiveStats, sortByDate, filterSort, buildEntry, formFromEntry, applyEdit,
  removeIds, parseImportRows, mergeImport, TEMPLATE_ROWS, TEMPLATE_COLS, TEMPLATE_FILE, SHEET_NAME, EXPORT_COLS,
  exportRows, exportFileName, reportHtml, caseHtml, reportSchool, caseSchool, caseFileName, caseStyles,
  CASE_PRINT_CSS, REPORT_PRINT_CSS,
} from './vigilanceLogic.js';
import { printInFrame, exportWord, writeSheet, readSheetRows } from './vigilancePrint.js';
import { acSetup } from '../autocomplete/studentAutocomplete.js';
import { cleanClassValue } from '../students/cleanClass.js';
import { getLogo } from '../settings/logoStore.js';
import { getInstitution } from '../institution/institutionStore.js';

// الإكمال التلقائي للتلاميذ ما زال من الكود القديم (acSetup): يكتب في حقول البوابة مباشرة (المسار والمؤسسة والقسم)
const AC_CFG = { nameId: 'vig_name', massarId: 'vig_massar', schoolId: 'vig_school', levelId: 'vig_level', genderName: 'vig_gender' };

const instName = () => { try { return getInstitution().getInstitutionName(); } catch (e) { return ''; } };
const logo = () => getLogo();
const refreshStats = () => { try { getSession().flow.updateDashboardStats(); } catch (e) { console.error(e); } };
const cleanClass = cleanClassValue;
const storage = () => { try { return window.localStorage; } catch (e) { return null; } };
const lsGet = (k) => { try { return window.localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) { /* لا شيء */ } };
const lsDel = (k) => { try { window.localStorage.removeItem(k); } catch (e) { /* لا شيء */ } };

// آخر استيراد من Excel (يُحفظ في المتصفح ليتيح «حذف آخر استيراد»)
const LAST = { batch: 'vig:lastImportBatch', count: 'vig:lastImportCount', date: 'vig:lastImportDate' };
const readLastImport = () => {
  const batch = lsGet(LAST.batch);
  return batch ? { batch, count: lsGet(LAST.count) || '0', date: lsGet(LAST.date) || '' } : null;
};

const currentArchive = () => {
  const s = getState();
  return getArchive(s.collections[VIG_KEY], { user: s.user, storage: storage() });
};
const profileNow = () => getState().profile || {};
// المؤسسة الافتراضية للنموذج: من الملف الشخصي (institution ثم school) ثم اسم المؤسسة العام
const schoolDefault = () => { const p = profileNow(); return p.institution ? p.institution : (p.school ? p.school : instName()); };

const FONT = "'Cairo',sans-serif";
const SEL = { width: '100%', padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: FONT, fontSize: '0.85rem', background: 'white', color: 'var(--text)' };
const solid = (bg, extra) => ({ background: bg, color: 'white', border: 'none', borderRadius: 8, fontFamily: FONT, fontWeight: 700, cursor: 'pointer', ...extra });
const GRAD = {
  green: 'linear-gradient(135deg,#166534,#16a34a)', blue: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', blueDark: 'linear-gradient(135deg,#1d4ed8,#2563a8)',
  red: 'linear-gradient(135deg,#991b1b,#dc2626)', redSoft: 'linear-gradient(135deg,#dc2626,#991b1b)', amber: 'linear-gradient(135deg,#92400e,#d97706)',
};

const KPI_DEFS = [
  { key: 'total', lbl: 'إجمالي الحالات', color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', icon: '📋' },
  { key: 'urgent', lbl: 'حالات عاجلة', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: '🔴' },
  { key: 'inProgress', lbl: 'قيد المتابعة', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '🔶' },
  { key: 'resolved', lbl: 'انتهت المتابعة', color: '#16a34a', bg: '#f0fdf4', border: '#86efac', icon: '✅' },
];

function Section({ children, title, headerProps = {}, badge }) {
  return (
    <div className="section-card">
      <div className="section-header" {...headerProps}>
        <span className="step-badge" />
        {badge ? <><span>{title}</span>{badge}</> : title}
      </div>
      {children}
    </div>
  );
}

// تلميحات خطوات ملء النموذج (vigShowEmptyFieldHints) — تظهر ما لم تُعرض اقتراحات فئة
function Hints() {
  const pill = (bg, color, border, text) => (
    <span style={{ background: bg, color, border: '1.5px solid ' + border, borderRadius: 20, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700 }}>{text}</span>
  );
  return (
    <div style={{ marginTop: 8, background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>💡 خطوات ملء النموذج:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {pill('#fff7ed', '#92400e', '#fed7aa', '① ابدأ بكتابة اسم التلميذ(ة) للبحث تلقائياً')}
        {pill('#f0fdf4', '#166534', '#bbf7d0', '② اختر نوع الوضعية لظهور اقتراحات الإجراءات')}
        {pill('#eff6ff', '#1d4ed8', '#bfdbfe', '③ حدد درجة الأولوية والحالة الراهنة')}
      </div>
    </div>
  );
}

// أزرار الاقتراحات الجاهزة (نموذج الإضافة)
function Suggestions({ items, onPick }) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', marginBottom: 6 }}>💡 اقتراحات جاهزة للإجراءات — انقر لإضافة:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map(([lbl, txt]) => (
          <button key={lbl} type="button" onClick={() => onPick(txt)}
            style={{ background: '#fff7ed', color: '#92400e', border: '1.5px solid #fed7aa', borderRadius: 20, padding: '4px 12px', fontFamily: FONT, fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#fffbeb'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#fff7ed'; }}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── نافذة تعديل الحالة ──
const EF_INPUT = { padding: '8px 11px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: FONT, fontSize: '0.86rem', color: '#1e293b', outline: 'none' };
const EF_LABEL = { fontSize: '0.77rem', fontWeight: 700, color: '#475569' };
const EF_COL = { display: 'flex', flexDirection: 'column', gap: 4 };
const CHIP = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontFamily: FONT, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', border: '1.5px solid', transition: 'all 0.15s' };
const focusBorder = (e) => { e.target.style.borderColor = '#3b82f6'; };
const blurBorder = (e) => { e.target.style.borderColor = '#cbd5e1'; };

function EditModal({ edit, setEdit, onSave }) {
  const [flash, setFlash] = useState(null);
  const flashTimer = useRef(null);
  useEffect(() => () => clearTimeout(flashTimer.current), []);
  const { form } = edit;
  const set = (k, v) => setEdit((cur) => ({ ...cur, form: { ...cur.form, [k]: v } }));
  const sugg = editSuggestionsFor(form.categories);
  const append = (field, text) => {
    set(field, appendLine(form[field], text));
    setFlash(field);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 1200);
  };
  const fieldStyle = (name, extra) => ({ ...EF_INPUT, ...extra, borderColor: flash === name ? '#3b82f6' : '#cbd5e1' });
  const text = (k, label, type = 'text') => (
    <div style={EF_COL}>
      <label style={EF_LABEL}>{label}</label>
      <input type={type} id={'vigEdit_' + k} style={EF_INPUT} value={form[k]} onChange={(e) => set(k, e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
    </div>
  );
  const radioChip = (name, value, label, color, bg, checked, onChange) => (
    <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 4, background: bg, border: '1.5px solid ' + color, borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700, color }}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} style={{ accentColor: color }} /> {label}
    </label>
  );
  return createPortal(
    <div id="vigEditModal" style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 680, boxShadow: '0 24px 60px rgba(0,0,0,0.35)', overflow: 'hidden', fontFamily: FONT, maxHeight: '92vh', display: 'flex', flexDirection: 'column', direction: 'rtl' }}>
        <div style={{ background: GRAD.blue, color: 'white', padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>✏️</span>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>تعديل الحالة</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: 2 }}>عدّل البيانات ثم اضغط حفظ</div>
            </div>
          </div>
          <button type="button" onClick={() => setEdit(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 34, height: 34, color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13, overflowY: 'auto' }}>
          {text('name', 'اسم التلميذ(ة) *')}
          {text('massar', 'رمز مسار')}
          {text('date', 'تاريخ المقابلة', 'date')}
          {text('school', 'المؤسسة')}
          {text('level', 'القسم')}
          {text('nextFollowup', 'تاريخ المتابعة القادمة', 'date')}

          <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={EF_LABEL}>نوع الوضعية الحرجة</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {VIG_CATEGORIES.map((c) => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.77rem', fontWeight: 600, color: '#374151' }}>
                  <input type="checkbox" name="vigEditCategory" value={c} checked={form.categories.includes(c)} onChange={() => set('categories', toggleIn(form.categories, c))} style={{ accentColor: '#3b82f6' }} /> {c}
                </label>
              ))}
            </div>
          </div>

          <div style={{ gridColumn: '1/-1', ...EF_COL }}>
            <label style={EF_LABEL}>الإجراءات المتخذة</label>
            {sugg && (
              <div id="vigEditActionsSugg" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', width: '100%', marginBottom: 2 }}>💡 اقتراحات الإجراءات — انقر للإضافة:</span>
                {sugg.actions.map(([lbl, txt]) => (
                  <button key={lbl} type="button" onClick={() => append('actions', txt)} style={{ ...CHIP, background: '#eff6ff', color: '#1d4ed8', borderColor: '#bfdbfe' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#dbeafe'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#eff6ff'; }}>{lbl}</button>
                ))}
              </div>
            )}
            <textarea id="vigEditActions" rows={3} style={fieldStyle('actions', { fontSize: '0.84rem', resize: 'vertical' })} value={form.actions}
              onChange={(e) => set('actions', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={EF_LABEL}>درجة الأولوية</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRIORITY_OPTIONS.map(([val, lbl]) => radioChip('vigEditPriority', val, lbl, P_COLOR[val], P_BG[val], form.priority === val, () => set('priority', val)))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={EF_LABEL}>الحالة الراهنة</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STATUS_OPTIONS.map(([val, lbl]) => radioChip('vigEditStatus', val, lbl, S_COLOR[val], S_BG[val], form.status === val, () => set('status', val)))}
            </div>
          </div>

          <div style={{ gridColumn: '1/-1', ...EF_COL }}>
            <label style={EF_LABEL}>ملاحظات إضافية</label>
            {sugg && (
              <div id="vigEditNotesSugg" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 5 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6366f1', width: '100%', marginBottom: 2 }}>💡 اقتراحات الملاحظات — انقر للإضافة:</span>
                {sugg.notes.map(([lbl, txt]) => (
                  <button key={lbl} type="button" onClick={() => append('notes', txt)} style={{ ...CHIP, background: '#f5f3ff', color: '#5b21b6', borderColor: '#c4b5fd' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#ede9fe'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#f5f3ff'; }}>{lbl}</button>
                ))}
              </div>
            )}
            <textarea id="vigEditNotes" rows={2} style={fieldStyle('notes', { fontSize: '0.84rem', resize: 'vertical' })} value={form.notes}
              onChange={(e) => set('notes', e.target.value)} onFocus={focusBorder} onBlur={blurBorder} />
          </div>
        </div>

        <div style={{ padding: '13px 22px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#f8fafc', flexShrink: 0 }}>
          <button type="button" onClick={() => setEdit(null)} style={{ padding: '9px 20px', background: '#f1f5f9', color: '#475569', border: '2px solid #e2e8f0', borderRadius: 10, fontFamily: FONT, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}>إلغاء</button>
          <button type="button" onClick={onSave} style={{ padding: '9px 24px', background: GRAD.blue, color: 'white', border: 'none', borderRadius: 10, fontFamily: FONT, fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(59,130,246,0.3)' }}>💾 حفظ التعديلات</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── معاينة بطاقة الحالة (طباعة / Word) ──
function CaseModal({ entry, html, onPrint, onWord, onClose }) {
  useEffect(() => {
    const onKey = (ev) => { if (ev.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const css = "#vigCasePreviewBody{font-family:'Cairo',Arial,sans-serif;direction:rtl;color:#000;}" + caseStyles('#vigCasePreviewBody');
  return createPortal(
    <div id="vigCasePreviewModal" onClick={(ev) => { if (ev.target === ev.currentTarget) onClose(); }}
      style={{ display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 8000, alignItems: 'flex-start', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <style>{css}</style>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 900, margin: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', direction: 'rtl', fontFamily: FONT, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#0a1f3d,#1a3a5c)', padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#f0d97a', fontWeight: 800, fontSize: '0.95rem' }}>معاينة بطاقة خلية اليقظة</div>
            <div id="vigCasePreviewName" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginTop: 2 }}>{entry.studentName || ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={onPrint} style={solid(GRAD.red, { padding: '8px 16px', fontSize: '0.8rem' })}>🖨️ طباعة</button>
            <button type="button" onClick={onWord} style={solid(GRAD.blue, { padding: '8px 16px', fontSize: '0.8rem' })}>📄 تحميل Word</button>
            <button type="button" onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: '1rem', fontWeight: 700 }}>✕</button>
          </div>
        </div>
        <div style={{ background: '#e5e7eb', padding: 16 }}>
          <div id="vigCasePreviewBody" style={{ background: '#fff', maxWidth: 760, margin: '0 auto', padding: '12mm 12mm', boxShadow: '0 2px 12px rgba(0,0,0,0.18)' }} dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function VigilanceBody() {
  const active = useCurrentPortal() === 'vigilance';
  const [raw, setRaw] = useCollection(VIG_KEY);
  const user = useCurrentUser();
  const students = useStudents();
  const f = useRef({});      // حقول يكتب فيها الإكمال التلقائي مباشرة: name / massar / school / level
  const actionsRef = useRef(null);
  const ref = (k) => (el) => { f.current[k] = el; };

  const archive = useMemo(() => getArchive(raw, { user, storage: storage() }), [raw, user]);
  const classes = useMemo(() => {
    const set = new Set();
    students.forEach((s) => { const c = cleanClass(s && s.class); if (c) set.add(c); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
  }, [students]);

  // نموذج الإضافة
  const [date, setDate] = useState(() => todayIso());
  const [categories, setCategories] = useState([]);
  const [actions, setActions] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');
  // الأرشيف
  const [archiveOpen, setArchiveOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState('asc'); // 'asc' = الأقدم أولاً | 'desc' = الأحدث أولاً
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState({});
  // النوافذ والرسائل
  const [edit, setEdit] = useState(null);
  const [caseId, setCaseId] = useState(null);
  const [importMsg, setImportMsg] = useState({ text: '', color: '#16a34a' });
  const [lastImport, setLastImport] = useState(readLastImport);
  const [toast, setToast] = useState(null);
  const timers = useRef([]);
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clearTimers, []);

  // إشعار عائم: hold=true يبقى حتى يُستبدل، وإلا يتلاشى بعد ms
  const showToast = (text, bg, { hold = false, ms = 3000 } = {}) => {
    clearTimers();
    setToast({ text, bg, fading: false });
    if (!hold) {
      timers.current.push(setTimeout(() => setToast((t) => (t ? { ...t, fading: true } : t)), ms));
      timers.current.push(setTimeout(() => setToast(null), ms + 400));
    }
  };

  const persist = (next) => setRaw(next); // يعيد وعداً بنجاح الحفظ؛ الواجهة تتحدّث فوراً من المخزن
  const failSafe = async (next, failMsg) => {
    try {
      const ok = await persist(next);
      if (!ok) alert(failMsg);
      return ok;
    } catch (e) { console.error(e); alert(failMsg); return false; }
  };

  // initVigilance القديمة: عند فتح البوابة
  useEffect(() => {
    if (!active) return;
    try { acSetup(AC_CFG); } catch (e) { console.error(e); }
    setDate(todayIso());
    if (f.current.school && !f.current.school.value) {
      const p = profileNow();
      f.current.school.value = p.institution || p.school || '';
    }
    // ترحيل البيانات: تصحيح السجلات التي وُضع فيها نوع الوضعية في حقل الإجراءات
    const m = migrateArchive(currentArchive());
    if (m.changed) { persist(m.archive).catch((e) => console.error(e)); console.info('✅ vigMigrate: تم تصحيح بيانات قديمة تلقائياً'); }
    setLastImport(readLastImport());
  }, [active]);

  // Escape / مسح التحديد عند تغيّر العرض: نُبقي من التحديد ما ما زال ظاهراً
  const filtered = useMemo(() => filterSort(archive, search, sortDir), [archive, search, sortDir]);
  const visibleSelected = useMemo(() => {
    const ids = new Set(filtered.map((e) => e.id));
    return selected.filter((id) => ids.has(id));
  }, [filtered, selected]);
  const allRef = (el) => { if (el) el.indeterminate = visibleSelected.length > 0 && visibleSelected.length < filtered.length; };

  const k = kpis(archive);
  const st = archiveStats(archive);
  const sugg = suggestionsFor(categories);

  // ── النموذج ──
  const clearForm = () => {
    if (f.current.name) f.current.name.value = '';
    if (f.current.massar) f.current.massar.value = '';
    if (f.current.school) f.current.school.value = schoolDefault();
    if (f.current.level) f.current.level.selectedIndex = 0;
    setDate(todayIso()); setActions(''); setNotes(''); setNextFollowup('');
    setCategories([]); setPriority(''); setStatus('');
  };

  const saveEntry = () => {
    const form = {
      name: f.current.name ? f.current.name.value : '', massar: f.current.massar ? f.current.massar.value : '',
      date, school: f.current.school ? f.current.school.value : '', level: f.current.level ? f.current.level.value : '',
      categories, actions, priority, status, notes, nextFollowup,
    };
    const res = buildEntry(form, { now: new Date(), profile: profileNow(), institution: instName() });
    if (res.error) { alert(res.error); return; }
    const name = res.entry.studentName;
    const p = persist([res.entry, ...currentArchive()]);
    refreshStats();
    clearForm();
    showToast(MSG.SAVED_PENDING(name), '#2563eb', { hold: true });
    Promise.resolve(p).then((ok) => showToast(ok ? MSG.SAVED_CLOUD(name) : MSG.SAVED_LOCAL, ok ? '#16a34a' : '#d97706'))
      .catch((e) => { console.error(e); showToast(MSG.SAVED_LOCAL, '#d97706'); });
  };

  const pickSuggestion = (text) => {
    setActions((a) => appendLine(a, text));
    if (actionsRef.current) actionsRef.current.focus();
  };

  // ── الأرشيف ──
  const toggleSort = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
  const toggleSel = (id) => setSelected((cur) => toggleIn(cur, id));
  const toggleAll = () => setSelected(visibleSelected.length === filtered.length ? [] : filtered.map((e) => e.id));

  const del = async (id) => {
    if (!confirm(MSG.CONFIRM_DELETE)) return;
    const ok = await failSafe(removeIds(currentArchive(), [id]), MSG.DELETE_FAIL_FB);
    if (ok) refreshStats();
  };
  const delSelected = async () => {
    const ids = visibleSelected;
    if (!ids.length) return;
    if (!confirm(MSG.CONFIRM_DELETE_SELECTED(ids.length))) return;
    const ok = await failSafe(removeIds(currentArchive(), ids), MSG.DELETE_FAIL);
    setSelected([]);
    if (ok) refreshStats();
  };
  const clearArchive = async () => {
    const cur = currentArchive();
    if (!cur.length) { alert(MSG.ARCHIVE_ALREADY_EMPTY); return; }
    if (!confirm(MSG.CONFIRM_CLEAR_ARCHIVE(cur.length))) return;
    const ok = await failSafe([], MSG.DELETE_FAIL_FB);
    setSelected([]);
    if (ok) refreshStats();
  };
  const repairAll = async () => {
    const cur = currentArchive();
    if (!cur.length) { alert(MSG.EMPTY_ARCHIVE); return; }
    const r = repairArchive(cur);
    await failSafe(r.archive, MSG.DELETE_FAIL);
    alert(r.fixed > 0 ? MSG.REPAIR_DONE(r.fixed) : MSG.REPAIR_NONE);
  };

  // ── التعديل ──
  const openEdit = (id) => {
    const e = currentArchive().find((x) => x.id === id);
    if (e) setEdit({ id, form: formFromEntry(e) });
  };
  const saveEdit = () => {
    const res = applyEdit(currentArchive(), edit.id, edit.form);
    if (res === null) return;
    if (res.error) { alert(res.error); return; }
    const p = persist(res.archive);
    refreshStats();
    setEdit(null);
    Promise.resolve(p).then((ok) => showToast(ok ? MSG.EDIT_SAVED_CLOUD : MSG.EDIT_SAVED_LOCAL, ok ? '#16a34a' : '#d97706', { ms: 2500 }))
      .catch((e) => { console.error(e); showToast(MSG.EDIT_SAVED_LOCAL, '#d97706', { ms: 2500 }); });
  };

  // ── Excel ──
  const downloadTemplate = () => {
    try { writeSheet(TEMPLATE_ROWS, TEMPLATE_COLS, SHEET_NAME, TEMPLATE_FILE); } catch (e) { console.error(e); alert(String(e.message || e)); }
  };
  // التصدير والتقارير بترتيب الجدول الظاهر (القديم كان يرتّب الأرشيف نفسه عند كل عرض)
  const exportExcel = () => {
    const cur = currentArchive();
    if (!cur.length) { alert(MSG.EMPTY_ARCHIVE); return; }
    try { writeSheet(exportRows(sortByDate(cur, sortDir)), EXPORT_COLS, SHEET_NAME, exportFileName()); } catch (e) { console.error(e); alert(String(e.message || e)); }
  };

  const importFile = (ev) => {
    const input = ev.target;
    const file = input.files && input.files[0];
    if (!file) return;
    setImportMsg({ text: MSG.READING, color: '#0f766e' });
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rows = readSheetRows(e.target.result);
        const now = new Date();
        const batchId = 'import_' + now.getTime();
        const res = parseImportRows(rows, { nowMs: now.getTime(), savedAt: now.toLocaleString('ar-MA'), batchId });
        if (res.error) { setImportMsg({ text: res.error, color: '#dc2626' }); return; }
        // حفظ معرّف آخر استيراد
        lsSet(LAST.batch, batchId); lsSet(LAST.count, String(res.imported)); lsSet(LAST.date, now.toLocaleString('ar-MA'));
        await persist(mergeImport(currentArchive(), res.entries));
        refreshStats();
        setLastImport(readLastImport());
        setImportMsg({ text: MSG.IMPORT_OK(res.imported), color: '#16a34a' });
        input.value = '';
      } catch (err) {
        setImportMsg({ text: MSG.IMPORT_ERR(err && err.message), color: '#dc2626' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const deleteLastImport = async () => {
    const last = readLastImport();
    if (!last) { alert(MSG.NO_LAST_IMPORT); return; }
    if (!confirm(MSG.CONFIRM_DELETE_LAST_IMPORT(last.date, last.count))) return;
    const cur = currentArchive();
    const kept = cur.filter((c) => c._importBatch !== last.batch);
    const deleted = cur.length - kept.length;
    await failSafe(kept, MSG.DELETE_FAIL);
    lsDel(LAST.batch); lsDel(LAST.count); lsDel(LAST.date);
    refreshStats();
    setLastImport(readLastImport());
    setImportMsg({ text: MSG.IMPORT_DELETED(deleted), color: '#dc2626' });
  };

  // ── التقارير ──
  const ctxNow = () => ({ profile: profileNow(), formSchool: f.current.school ? f.current.school.value : '', institution: instName() });
  const buildReport = (forWord) => {
    const c = ctxNow();
    return reportHtml(sortByDate(currentArchive(), sortDir), { school: reportSchool(c), profile: c.profile, logo: logo(), forWord });
  };
  const printReport = () => {
    const body = buildReport(false);
    if (!body) { alert(MSG.REPORT_EMPTY); return; }
    printInFrame('vigPrintFrame', REPORT_PRINT_CSS, body);
  };
  const reportWord = async () => {
    const body = buildReport(true);
    if (!body) { alert(MSG.REPORT_EMPTY); return; }
    try { await exportWord('vigReportContent', body, 'تقرير_خلية_اليقظة_' + todayIso(), { landscape: true, width: 1000 }); } catch (err) { console.error(err); alert(MSG.WORD_FAIL); }
  };

  // بطاقة الحالة الفردية
  const caseEntry = caseId == null ? null : archive.find((x) => String(x.id) === String(caseId)) || null;
  const caseBody = (e) => { const c = ctxNow(); return caseHtml(e, { school: caseSchool(e, c), profile: c.profile, logo: logo() }); };
  const casePreviewHtml = useMemo(() => (caseEntry ? caseBody(caseEntry) : ''), [caseEntry, user]); // eslint-disable-line react-hooks/exhaustive-deps
  const casePrint = () => { if (caseEntry) printInFrame('vigCasePrintFrame', CASE_PRINT_CSS, caseBody(caseEntry)); };
  const caseWord = async () => {
    if (!caseEntry) return;
    try { await exportWord('vigCaseContent', caseBody(caseEntry), caseFileName(caseEntry, todayIso()), { width: 800 }); } catch (err) { console.error(err); alert(MSG.WORD_FAIL); }
  };

  const rowBtn = (bg, extra) => ({ background: bg, color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: FONT, ...extra });

  return (
    <>
      {/* KPI إحصائيات الخلية */}
      <div id="vigKpiRow" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {KPI_DEFS.map((d) => (
          <div key={d.key} style={{ background: d.bg, border: '2px solid ' + d.border, borderRadius: 12, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', marginBottom: 2 }}>{d.icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: d.color, lineHeight: 1 }}>{k[d.key]}</div>
            <div style={{ fontSize: '0.68rem', color: d.color, fontWeight: 700, marginTop: 3 }}>{d.lbl}</div>
          </div>
        ))}
      </div>

      {/* استيراد من Excel */}
      <Section title="استيراد حالات من ملف Excel">
        <div className="section-body">
          <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: '0.78rem', color: '#9a3412', lineHeight: 1.8 }}>
            <strong>تنسيق الملف المطلوب:</strong> يجب أن يحتوي الملف على عمود <strong>اسم التلميذ(ة)</strong> أو <strong>الاسم والنسب</strong> — ويستورد أيضاً: <strong>القسم</strong> و<strong>نوع الإجراء</strong> إن وُجدا
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#166534,#16a34a)', color: 'white', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 700, boxShadow: '0 3px 10px rgba(22,101,52,0.3)' }}>
              اختر ملف Excel أو CSV
              <input type="file" id="vigImportFile" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={importFile} />
            </label>
            <button type="button" onClick={downloadTemplate} style={solid(GRAD.blueDark, { padding: '9px 18px', fontSize: '0.84rem' })}>⬇️ تحميل نموذج فارغ</button>
            <span id="vigImportMsg" style={{ fontSize: '0.8rem', color: importMsg.color, fontWeight: 700 }}>{importMsg.text}</span>
          </div>
          {lastImport && (
            <div id="vigLastImportBox" style={{ display: 'flex', marginTop: 12, background: '#fff1f2', border: '1.5px solid #fca5a5', borderRadius: 10, padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b' }}>آخر استيراد من Excel</div>
                <div id="vigLastImportInfo" style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 3 }}>{`📅 ${lastImport.date} — ${lastImport.count} حالة مستوردة`}</div>
              </div>
              <button type="button" onClick={deleteLastImport} style={solid(GRAD.redSoft, { padding: '8px 18px', fontSize: '0.82rem', whiteSpace: 'nowrap' })}>حذف آخر استيراد</button>
            </div>
          )}
        </div>
      </Section>

      {/* إضافة حالة يدوية */}
      <Section title="إضافة حالة حرجة يدوياً">
        <div className="section-body">
          <div className="form-grid">
            <div className="form-group">
              <label>اسم التلميذ(ة) *</label>
              <input ref={ref('name')} type="text" id="vig_name" placeholder="الاسم الكامل (ابدأ بالكتابة للبحث في القائمة...)" autoComplete="off" />
            </div>
            <div className="form-group">
              <label>رقم مسار</label>
              <input ref={ref('massar')} type="text" id="vig_massar" placeholder="رقم مسار التلميذ(ة)" />
            </div>
            <div className="form-group">
              <label>تاريخ المقابلة *</label>
              <input type="date" id="vig_date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>المؤسسة</label>
              <input ref={ref('school')} type="text" id="vig_school" placeholder="الثانوية الإعدادية المختار السوسي" defaultValue="" />
            </div>
            <div className="form-group">
              <label>القسم</label>
              <select ref={ref('level')} id="vig_level" className="level-select" data-react-level="1" style={SEL} defaultValue="">
                {classes.length ? (
                  <>
                    <option value="">— اختر القسم —</option>
                    <optgroup label="📥 أقسام لائحة التلاميذ">{classes.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>
                  </>
                ) : <option value="">— استورد لائحة التلاميذ لتظهر الأقسام —</option>}
              </select>
            </div>
            <div className="form-group col-span-2">
              <label>نوع الوضعية الحرجة *</label>
              <div className="radio-group" style={{ gap: 7 }}>
                {VIG_CATEGORIES.map((c) => (
                  <label key={c}><input type="checkbox" name="vig_category" value={c} checked={categories.includes(c)} onChange={() => setCategories((cur) => toggleIn(cur, c))} /> {c}</label>
                ))}
              </div>
            </div>
            <div className="form-group col-span-2">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                <label style={{ margin: 0 }}>الإجراءات المتخذة *</label>
              </div>
              <textarea ref={actionsRef} id="vig_actions" placeholder="صف الإجراءات التي اتُّخذت لمعالجة هذه الوضعية الحرجة..." style={{ minHeight: 80 }} value={actions} onChange={(e) => setActions(e.target.value)} />
              <div id="vigSuggestContainer">{sugg.length ? <Suggestions items={sugg} onPick={pickSuggestion} /> : <Hints />}</div>
            </div>
            <div className="form-group">
              <label>درجة الأولوية</label>
              <div className="radio-group">
                {PRIORITY_OPTIONS.map(([val, lbl]) => (
                  <label key={val}><input type="radio" name="vig_priority" value={val} checked={priority === val} onChange={() => setPriority(val)} /> {lbl}</label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>الحالة الراهنة</label>
              <div className="radio-group">
                {STATUS_OPTIONS.map(([val, lbl]) => (
                  <label key={val}><input type="radio" name="vig_status" value={val} checked={status === val} onChange={() => setStatus(val)} /> {lbl}</label>
                ))}
              </div>
            </div>
            <div className="form-group col-span-2">
              <label>ملاحظات إضافية</label>
              <textarea id="vig_notes" placeholder="أي ملاحظات أو معطيات إضافية..." style={{ minHeight: 65 }} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="form-group">
              <label>تاريخ المتابعة القادمة</label>
              <input type="date" id="vig_next_followup" value={nextFollowup} onChange={(e) => setNextFollowup(e.target.value)} />
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-primary" onClick={saveEntry}>حفظ الحالة</button>
            <button type="button" className="btn btn-outline" onClick={clearForm}>مسح النموذج</button>
          </div>
        </div>
      </Section>

      {/* أرشيف الحالات الحرجة */}
      <Section
        title="أرشيف الحالات الحرجة"
        headerProps={{ style: { cursor: 'pointer' }, onClick: () => setArchiveOpen((o) => !o) }}
        badge={(
          <>
            <span id="vigArchiveCount" style={{ marginRight: 'auto', background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '1px 10px', fontSize: '0.82rem', fontWeight: 800 }}>{archive.length}</span>
            <span id="vigArchiveArrow" style={{ fontSize: '0.9rem' }}>{archiveOpen ? '▲' : '▼'}</span>
          </>
        )}
      >
        <div id="vigArchiveBody" className={'archive-body' + (archiveOpen ? ' open' : '')}>
          <div className="archive-search" style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="text" id="vigArchiveSearch" placeholder="🔍 بحث بالاسم أو نوع الوضعية..." value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1, padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontFamily: FONT, fontSize: '0.84rem' }} />
              <button type="button" id="vigSortBtn" onClick={toggleSort} title="ترتيب حسب تاريخ المقابلة"
                style={solid('linear-gradient(135deg,#1d4ed8,#3b82f6)', { padding: '7px 13px', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 })}>
                {sortDir === 'asc' ? '📅 التاريخ ↑' : '📅 التاريخ ↓'}
              </button>
            </div>
          </div>

          <div id="vigArchiveStats" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <div className="archive-stat">🚨 الإجمالي: <strong>{st.total}</strong></div>
            {st.urgent > 0 && <div className="archive-stat" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>🔴 عاجلة: <strong>{st.urgent}</strong></div>}
            {st.cats.map(([c, n]) => <div key={c} className="archive-stat" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534', fontSize: '0.68rem' }}>{c}: <strong>{n}</strong></div>)}
          </div>

          <div id="vigArchiveList" style={{ padding: '10px 14px' }}>
            {!filtered.length ? (
              <div className="archive-empty">
                {search.trim() ? '🔍 لا توجد نتائج.' : <>📂 لا توجد حالات محفوظة بعد.<br /><small>أضف حالة جديدة يدوياً أو استورد من Excel.</small></>}
              </div>
            ) : (
              <>
                {visibleSelected.length > 0 && (
                  <div id="vigBulkBar" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
                    <span id="vigBulkCount" style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1d4ed8' }}>{visibleSelected.length} حالة محددة</span>
                    <button type="button" onClick={() => setSelected(filtered.map((e) => e.id))} style={solid('#1d4ed8', { borderRadius: 7, padding: '5px 14px', fontSize: '0.78rem' })}>✅ تحديد الكل</button>
                    <button type="button" onClick={() => setSelected([])} style={solid('#64748b', { borderRadius: 7, padding: '5px 14px', fontSize: '0.78rem' })}>✖ إلغاء التحديد</button>
                    <button type="button" onClick={delSelected} style={solid(GRAD.redSoft, { borderRadius: 7, padding: '5px 16px', fontSize: '0.82rem', marginRight: 'auto' })}>🗑 حذف المحددة</button>
                  </div>
                )}
                <div style={{ overflowX: 'auto' }}>
                  <table className="archive-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36, textAlign: 'center' }}>
                          <input type="checkbox" id="vigCheckAll" ref={allRef} checked={filtered.length > 0 && visibleSelected.length === filtered.length} onChange={toggleAll} style={{ width: 16, height: 16, cursor: 'pointer' }} title="تحديد الكل" />
                        </th>
                        <th>#</th><th>اسم التلميذ(ة)</th><th>تاريخ المقابلة</th><th>المؤسسة</th><th>نوع الوضعية</th>
                        <th>الإجراءات</th><th>الأولوية</th><th>الحالة</th><th>المتابعة</th><th>الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e, idx) => {
                        const acts = e.actions || '';
                        const long = acts.length > 80;
                        const open = !!expanded[e.id];
                        const hasPrio = e.priority && e.priority !== '—';
                        const hasNext = e.nextFollowup && e.nextFollowup !== '—';
                        const toggleActs = () => setExpanded((x) => ({ ...x, [e.id]: !x[e.id] }));
                        const link = { display: 'inline', background: 'none', border: 'none', color: '#2563a8', fontSize: '0.68rem', fontFamily: FONT, cursor: 'pointer', fontWeight: 700, padding: '0 2px' };
                        return (
                          <tr key={e.id} id={'vigRow_' + e.id}>
                            <td style={{ textAlign: 'center' }}><input type="checkbox" className="vigRowCheck" checked={visibleSelected.includes(e.id)} onChange={() => toggleSel(e.id)} style={{ width: 16, height: 16, cursor: 'pointer' }} /></td>
                            <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>{idx + 1}</td>
                            <td><strong style={{ color: '#dc2626' }}>🚨 {e.studentName}</strong></td>
                            <td style={{ whiteSpace: 'nowrap', textAlign: 'center' }}>📅 {e.date}</td>
                            <td>{e.school}</td>
                            <td><span style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: 10, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>{e.category}</span></td>
                            <td style={{ maxWidth: 220, fontSize: '0.74rem', color: '#374151' }}>
                              {long ? (open ? (
                                <span id={'vigActFull_' + e.id}>{acts} <button type="button" onClick={toggleActs} style={link}>▲ طي</button></span>
                              ) : (
                                <span id={'vigActShort_' + e.id}>{acts.slice(0, 80)}<span style={{ color: '#94a3b8' }}>...</span> <button type="button" onClick={toggleActs} style={link} title="عرض الكامل">▼ عرض الكل</button></span>
                              )) : (acts || '—')}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {hasPrio ? <span style={{ background: P_BG[e.priority] || '#f1f5f9', color: P_COLOR[e.priority] || '#64748b', border: '1px solid ' + (P_COLOR[e.priority] || '#cbd5e1'), borderRadius: 12, padding: '2px 9px', fontSize: '0.7rem', fontWeight: 700 }}>● {e.priority}</span> : '—'}
                            </td>
                            <td style={{ textAlign: 'center' }}><span style={{ background: S_BG[e.status] || '#f1f5f9', color: S_COLOR[e.status] || '#64748b', borderRadius: 10, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>{e.status || '—'}</span></td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.74rem', color: '#0f766e' }}>{hasNext ? '📅 ' + e.nextFollowup : '—'}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                                <button type="button" onClick={() => openEdit(e.id)} style={rowBtn(GRAD.blue)} title="تعديل">✏️</button>
                                <button type="button" onClick={() => setCaseId(e.id)} style={rowBtn(GRAD.red)} title="معاينة / طباعة / Word">🖨️</button>
                                <button type="button" onClick={() => del(e.id)} style={rowBtn('#fee2e2', { color: '#dc2626', border: '1px solid #fca5a5' })} title="حذف">🗑</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={exportExcel} style={solid(GRAD.green, { padding: '8px 16px', fontSize: '0.82rem' })}>تصدير Excel</button>
            <button type="button" onClick={printReport} style={solid(GRAD.red, { padding: '8px 16px', fontSize: '0.82rem' })}>طباعة التقرير الشامل</button>
            <button type="button" onClick={reportWord} style={solid(GRAD.blue, { padding: '8px 16px', fontSize: '0.82rem' })} title="تحميل التقرير الشامل بصيغة Word">تحميل Word</button>
            <button type="button" onClick={repairAll} style={solid(GRAD.amber, { padding: '8px 14px', fontSize: '0.82rem' })} title="إصلاح السجلات التي وُضع فيها نوع الوضعية في خانة الإجراءات">إصلاح البيانات</button>
            <button type="button" onClick={clearArchive} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 8, padding: '8px 14px', fontFamily: FONT, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>مسح الأرشيف</button>
          </div>
        </div>
      </Section>

      {edit && <EditModal edit={edit} setEdit={setEdit} onSave={saveEdit} />}
      {caseEntry && <CaseModal entry={caseEntry} html={casePreviewHtml} onPrint={casePrint} onWord={caseWord} onClose={() => setCaseId(null)} />}
      {toast && createPortal(
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: toast.bg, color: 'white', padding: '10px 22px', borderRadius: 10, fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem', zIndex: 99999, boxShadow: '0 4px 18px rgba(0,0,0,0.25)', transition: 'opacity 0.4s', opacity: toast.fading ? 0 : 1 }}>{toast.text}</div>,
        document.body,
      )}
    </>
  );
}

// المرحلة 25: خلية اليقظة — تُرسم داخل #mountVigilance في صفحة toolVigilance القديمة؛
// شريط العودة بقي في body.html. نافذتا التعديل والمعاينة والإشعارات تُرسم في document.body كما كانت نوافذها القديمة.
export default function VigilancePortal({ mount }) {
  if (!mount) return null;
  return createPortal(<VigilanceBody />, mount);
}
