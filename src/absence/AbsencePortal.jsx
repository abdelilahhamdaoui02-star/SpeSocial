import { useEffect, useMemo, useRef, useState } from 'react';
import { getSession } from '../session/installSession.js';
import { createPortal } from 'react-dom';
import { useCollection, useCurrentPortal, useCurrentUser, useStudents } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import { getBridge } from '../session/sessionBridge.js';
import { useMonthlyData } from './useMonthlyData.js';
import {
  AB_PROCS, PATTERN_OPTIONS, CAUSE_OPTIONS, GENDER_OPTIONS, FAMILY_OPTIONS, SEMESTER_OPTIONS, PRIORITY_OPTIONS, P_COLOR, CONTEXT_CHIPS, REC_CHIPS, MSG, MAX_ROWS,
  appendSuggestion, blankProcRows, newCustomRow, editProcRow, procRowsForLoad, saveEntry, taskLogArgs, updateEntry, deleteEntry, loadValues,
  filterArchive, urgentCount, archiveCsv, csvFileName, reportHtml, acNormalize,
  abmParse, mergeImports, importMessage, classesOf, monthsFor, resolveView, viewRows, deleteClass, fillValues,
} from './absenceLogic.js';
import { openPreview } from '../preview/previewStore.js';
import { acFillField, acSetup } from '../autocomplete/studentAutocomplete.js';
import { cleanClassValue } from '../students/cleanClass.js';
import { getLogo } from '../settings/logoStore.js';
   import { referToFollowUp } from '../gates/followLink.js';

// الإكمال التلقائي ما زال من الكود القديم (acSetup/acFillField)؛ يكتب في حقول البوابة مباشرة بمعرّفاتها القديمة
const AC_CFG = { nameId: 'ab_studentName', massarId: 'ab_studentMassar', schoolId: 'ab_school', levelId: 'ab_level', genderName: 'ab_gender', phoneId: 'ab_parentPhone' };// حقول لا يملكها React (يكتب فيها الإكمال التلقائي وapplyInstitutionEverywhere وتعبئة الاستيراد الشهري مباشرة) → معرّفاتها القديمة
const TEXT_IDS = {
  studentName: 'ab_studentName', massar: 'ab_studentMassar', school: 'ab_school', level: 'ab_level', parentPhone: 'ab_parentPhone', recordDate: 'ab_recordDate',
  totalHours: 'ab_totalHours', justifiedHours: 'ab_justifiedHours', unjustifiedHours: 'ab_unjustifiedHours',
  firstAbsenceDate: 'ab_firstAbsenceDate', lastPresenceDate: 'ab_lastPresenceDate',
  totalDays: 'ab_totalDays', justifiedDays: 'ab_justifiedDays', unjustifiedDays: 'ab_unjustifiedDays',
  contextNotes: 'ab_contextNotes', recommendation: 'ab_recommendation',
};
// نفس نمط قوائم الأقسام في بقية البوابات (class="level-select")
const SEL = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 11px', fontFamily: "'Cairo',sans-serif", fontSize: '0.875rem', color: 'var(--text)', background: '#fafbfc', direction: 'rtl', width: '100%' };
const HEAD_BG = 'linear-gradient(90deg,#92400e,#d97706)';
const MSG_COLOR = { info: '#0f766e', ok: '#16a34a', err: '#dc2626' };

const currentArchive = () => getState().collections.absenceArchive ?? [];
const instName = () => {
  try {
    const p = getState().profile;
    if (p && p.institution) return p.institution;
    return getInstitution().getInstitutionName();
  } catch (e) { return ''; }
};
const logo = () => getLogo();
const refreshStats = () => { try { getSession().flow.updateDashboardStats(); } catch (e) { console.error(e); } };
const cleanClass = cleanClassValue;
const toggleIn = (list, x) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
const today = () => new Date().toISOString().slice(0, 10);

function Section({ n, title, children }) {
  return (
    <div className="section-card">
      <div className="section-header" style={{ background: HEAD_BG }}><span className="step-badge" style={{ background: '#fcd34d', color: '#92400e' }}>{n}</span> {title}</div>
      <div className="section-body">{children}</div>
    </div>
  );
}

function Chips({ items, onPick, label, top = 6 }) {
  return (
    <>
      <div className="suggest-chips-label" style={{ marginTop: top }}>{label}</div>
      <div className="suggest-chips">
        {items.map(([lbl, text]) => <button key={lbl} type="button" className="suggest-chip" onClick={() => onPick(text)}>{lbl}</button>)}
      </div>
    </>
  );
}

// ── استيراد غيابات شهرية من Excel (ملف لكل قسم) ──
function readSheets(file) {
  return new Promise((resolve, reject) => {
    const rd = new FileReader();
    rd.onload = (e) => {
      try {
        const X = window.XLSX;
        const wb = X.read(new Uint8Array(e.target.result), { type: 'array' });
        const ds = wb.SheetNames.map((sn) => abmParse(X.utils.sheet_to_json(wb.Sheets[sn], { header: 1, defval: '' }))).filter((d) => d && d.cls);
        resolve({ f: file.name, ds });
      } catch (err) { reject(err); }
    };
    rd.onerror = () => reject(rd.error || new Error('تعذّرت قراءة الملف'));
    rd.readAsArrayBuffer(file);
  });
}

function MonthlyImport({ onFill }) {
  const user = useCurrentUser();
  const students = useStudents();
  const [data, saveData] = useMonthlyData(user);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [view, setView] = useState('');
  const [cls, setCls] = useState('');
  const [query, setQuery] = useState('');
  const [msg, setMsg] = useState({ kind: 'info', text: '' });

  const classes = useMemo(() => classesOf(data), [data]);
  const effCls = classes.includes(cls) ? cls : '';
  const months = useMemo(() => monthsFor(data, effCls), [data, effCls]);
  const effView = resolveView(months, view, month);
  const rows = useMemo(() => viewRows(data, { cls: effCls, view: effView, months, query }), [data, effCls, effView, months, query]);
  const shown = rows.slice(0, MAX_ROWS);

  const importFiles = async (files) => {
    if (!files.length) return;
    if (!window.XLSX) { setMsg({ kind: 'err', text: MSG.NO_XLSX }); return; }
    setMsg({ kind: 'info', text: MSG.READING });
    try {
      const results = await Promise.all(files.map(readSheets));
      const r = mergeImports(dataRef.current, results, month);
      if (r.lines.length) {
        saveData(r.data);
        // مؤسسة الملف تُحفظ في الملف الشخصي إن لم تكن مُدخلة (كالقديم)
        const bridge = getBridge();
        if (r.school && !(getState().profile || {}).institution && bridge && bridge.saveProfile) {
          try { Promise.resolve(bridge.saveProfile({ institution: r.school }, { effects: false })).catch(() => {}); } catch (e) { /* لا شيء */ }
        }
      }
      const m = importMessage(r);
      setMsg({ kind: m.ok ? 'ok' : 'err', text: m.text });
    } catch (err) { setMsg({ kind: 'err', text: '❌ خطأ في قراءة الملفات: ' + err.message }); }
  };

  const delClass = () => {
    if (!effCls) { alert(MSG.PICK_CLASS); return; }
    const all = effView === '*';
    if (!confirm(MSG.CONFIRM_DELETE_CLASS(effCls, all, effView))) return;
    saveData(deleteClass(dataRef.current, effCls, effView));
    setMsg({ kind: 'ok', text: MSG.DELETED_CLASS(effCls) });
  };
  const delAll = () => {
    if (!Object.keys(dataRef.current).length) { alert(MSG.NO_IMPORTED); return; }
    if (!confirm(MSG.CONFIRM_DELETE_ALL)) return;
    saveData({});
    setMsg({ kind: 'ok', text: MSG.DELETED_ALL });
  };
  const fill = (o) => {
    const db = students.find((s) => acNormalize(s.fullName) === acNormalize(o.n));
    onFill(fillValues(o, db));
  };

  return (
    <div className="section-card">
      <div className="section-header" style={{ background: HEAD_BG }}><span className="step-badge" style={{ background: '#fcd34d', color: '#92400e' }}>📥</span> استيراد غيابات شهرية من Excel</div>
      <div className="section-body">
        <div className="form-grid cols-3">
          <div className="form-group"><label>الشهر (يُقرأ تلقائياً من الملف)</label><input type="month" id="abm_month" value={month} onChange={(e) => setMonth(e.target.value)} /></div>
          <div className="form-group"><label>ملفات الغياب الشهري (ملف لكل قسم)</label>
            <input type="file" id="abm_file" accept=".xlsx,.xls" multiple onChange={(e) => { const files = Array.from(e.target.files || []); e.target.value = ''; importFiles(files); }} />
          </div>
          <div className="form-group"><label>عرض الفترة</label>
            <select id="abm_view" className="level-select abm-select" data-react-level="1" style={SEL} value={effView} onChange={(e) => setView(e.target.value)}>
              {months.map((k) => <option key={k} value={k}>{k}</option>)}
              {months.length > 1 && <option value="*">كل الأشهر (تراكمي)</option>}
            </select>
          </div>
          <div className="form-group"><label>القسم (الملف المستورد)</label>
            <select id="abm_cls" className="level-select abm-select" data-react-level="1" style={SEL} value={effCls} onChange={(e) => setCls(e.target.value)}>
              <option value="">— اختر القسم —</option>
              {classes.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '6px 0' }}>
          <button type="button" className="btn-sm btn-sm-danger" onClick={delClass}>🗑 حذف ملف القسم المحدد</button>
          <button type="button" className="btn-sm btn-sm-danger" onClick={delAll}>🗑 حذف كل الملفات المستوردة</button>
        </div>
        <div id="abm_msg" style={{ fontSize: '0.8rem', fontWeight: 600, margin: '6px 0', whiteSpace: 'pre-line', color: MSG_COLOR[msg.kind] }}>{msg.text}</div>
        <div className="form-group"><input type="text" id="abm_search" placeholder="🔍 ابحث باسم التلميذ أو القسم..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div style={{ overflowX: 'auto', maxHeight: 340, overflowY: 'auto' }}>
          <table className="iproc-table" id="abm_table">
            {rows.length ? (
              <>
                <thead><tr><th>#</th><th>التلميذ(ة)</th><th>القسم</th><th>الساعات</th><th>مبررة</th><th>غير مبررة</th><th>الأيام</th><th>مبررة</th><th>غير مبررة</th><th /></tr></thead>
                <tbody>
                  {shown.map((o, i) => (
                    <tr key={o.n + '|' + o.m + '|' + i}>
                      <td>{i + 1}</td><td>{o.n}</td><td>{o.c || '—'}</td>
                      <td><b>{o.th}</b></td><td>{o.jh}</td><td style={{ color: '#dc2626', fontWeight: 700 }}>{o.uh}</td>
                      <td><b>{o.td}</b></td><td>{o.jd}</td><td style={{ color: '#dc2626', fontWeight: 700 }}>{o.ud}</td>
                      <td><button type="button" className="btn-sm btn-sm-outline" onClick={() => fill(o)}>⬇️ تعبئة</button></td>
                    </tr>
                  ))}
                </tbody>
              </>
            ) : (
              <tbody><tr><td style={{ textAlign: 'center', color: '#94a3b8', padding: 14 }}>{effCls ? '📂 لا توجد غيابات مستوردة لهذه الفترة.' : '👆 اختر القسم لعرض ملف الغياب الخاص به.'}</td></tr></tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function AbsenceBody({ mount }) {
  const active = useCurrentPortal() === 'absence';
  const [archive, setArchive] = useCollection('absenceArchive');
  const students = useStudents();
  const f = useRef({});
  const inited = useRef(false);
  const [causes, setCauses] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [family, setFamily] = useState('');
  const [semester, setSemester] = useState('');
  const [priority, setPriority] = useState('');
  const [procRows, setProcRows] = useState(blankProcRows);
  const [editId, setEditId] = useState(null);
  // معرّف السجل المحفوظ من النموذج الحالي: الحفظ/المعاينة/التقرير تحدّث نفس السجل بدل إضافة سجل جديد في كل ضغطة
  const savedId = useRef(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [search, setSearch] = useState('');

  const ref = (k) => (el) => { f.current[k] = el; };
  // قائمة الأقسام: أقسام لائحة التلاميذ المستوردة فقط (كـbuildLevelOptions القديمة)
  const classes = useMemo(() => {
    const set = new Set();
    students.forEach((s) => { const c = cleanClass(s && s.class); if (c) set.add(c); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
  }, [students]);

  const gender = () => { const el = mount.querySelector('input[name="ab_gender"]:checked'); return el ? el.value : ''; };
  const setGender = (val) => mount.querySelectorAll('input[name="ab_gender"]').forEach((el) => { el.checked = !!val && el.value === val; });
  const readText = () => {
    const o = {};
    for (const k of Object.keys(TEXT_IDS)) o[k] = f.current[k] ? f.current[k].value : '';
    return o;
  };
  const writeText = (vals) => { for (const k of Object.keys(vals)) if (f.current[k] && vals[k] !== undefined) f.current[k].value = vals[k]; };
  const readForm = () => ({ ...readText(), gender: gender(), family, semester, priority, causes, patterns, procRows });
  const persist = (next) => setArchive(next).catch((e) => { console.error(e); alert('❌ فشل حفظ البيانات'); });

  useEffect(() => {
    if (!active) return;
    try { acSetup(AC_CFG); } catch (e) { console.error(e); }
    // initAbsence القديمة: تاريخ رصد الحالة = اليوم عند أول فتح فقط
    if (!inited.current) { inited.current = true; if (f.current.recordDate && !f.current.recordDate.value) f.current.recordDate.value = today(); }
  }, [active]);

  // مسح كل الحقول والخيارات وجدول الإجراءات (abCancelEdit القديمة): القائمة تعود إلى أول خيار
  const wipe = () => {
    savedId.current = null; // نموذج جديد = سجل جديد عند الحفظ التالي
    Object.keys(TEXT_IDS).forEach((k) => { const el = f.current[k]; if (!el) return; if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = ''; });
    setGender('');
    setCauses([]); setPatterns([]); setFamily(''); setSemester(''); setPriority('');
    setProcRows(blankProcRows());
  };
  const clearAll = () => {
    if (!confirm(MSG.CONFIRM_CLEAR_ALL)) return;
    wipe();
    if (f.current.school) f.current.school.value = instName();
    if (f.current.recordDate) f.current.recordDate.value = today();
  };

  const doSave = (silent) => {
    const form = readForm();
    const cur = currentArchive();
    // نفس النموذج (نفس الاسم) يحدّث سجله بدل إضافة سجل جديد في كل ضغطة (حفظ / معاينة / تقرير)
    const same = savedId.current && cur.find((x) => x.id === savedId.current && String(x.studentName || '').trim() === String(form.studentName || '').trim());
    const existingId = editId || (same ? same.id : null);
    if (existingId && cur.some((x) => x.id === existingId)) {
      const u = updateEntry(cur, existingId, form);
      if (!u) { if (!silent) alert(MSG.NAME_FIRST); return; }
      persist(u.archive);
      refreshStats();
      setArchiveOpen(true);
      return;
    }
    const r = saveEntry(cur, form);
    if (!r) { if (!silent) alert(MSG.NAME_FIRST); return; }
    savedId.current = r.entry.id;
    persist(r.archive);
    refreshStats();
    setArchiveOpen(true);
    try { getSession().archives.autoLogTask(...taskLogArgs(r.entry)); } catch (e) { console.error(e); }
  };

  // التقرير يُنشأ حتى بلا اسم («غير مُحدد») ولا يُحفظ حينها؛ وإلا يُحفظ سجل جديد في كل مرة (كالقديم)
  const generateReport = () => {
    openPreview('absence', reportHtml(readForm(), { logo: logo() }));
    doSave(true);
  };

  const loadEntry = (id) => {
    const e = currentArchive().find((x) => x.id === id);
    if (!e) return;
    try { document.querySelector('#toolAbsence .main-container')?.scrollTo(0, 0); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { /* لا شيء */ }
    const v = loadValues(e);
    writeText(v.text);
    setGender(v.gender); setFamily(v.family); setSemester(v.semester); setPriority(v.priority); setCauses(v.causes); setPatterns(v.patterns);
    setProcRows((cur) => procRowsForLoad(e, cur));
    setEditId(id);
  };
  const cancelEdit = () => { setEditId(null); wipe(); };
  const updateCurrent = () => {
    if (!editId) return;
    const form = readForm();
    const name = String(form.studentName || '').trim();
    if (!name) { alert(MSG.NAME_FIRST); return; }
    const r = updateEntry(currentArchive(), editId, form);
    if (!r) return;
    persist(r.archive);
    cancelEdit();
    setArchiveOpen(true);
    alert(MSG.UPDATED(name));
  };

  const del = (id) => {
    if (!confirm(MSG.CONFIRM_DELETE)) return;
    persist(deleteEntry(currentArchive(), id));
    refreshStats();
  };
  const clearArchive = () => {
    const cur = currentArchive();
    if (!cur.length) { alert(MSG.EMPTY_ARCHIVE); return; }
    if (!confirm(MSG.CONFIRM_CLEAR_ARCHIVE(cur.length))) return;
    persist([]);
    refreshStats();
  };
  const exportCsv = () => {
    const cur = currentArchive();
    if (!cur.length) { alert(MSG.EMPTY_CSV); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([archiveCsv(cur)], { type: 'text/csv;charset=utf-8;' }));
    a.download = csvFileName();
    a.click();
  };
  const suggest = (k) => (text) => { const el = f.current[k]; if (el) { el.value = appendSuggestion(el.value, text); el.focus(); } };

  // «⬇️ تعبئة» من جدول الاستيراد الشهري: الاسم والمسار والقسم والجنس عبر acFillField القديمة، ثم الساعات والأيام
  const fillFromMonthly = ({ student, numbers }) => {
    try { acFillField(AC_CFG, student); } catch (e) { console.error(e); }
    const str = {};
    for (const k of Object.keys(numbers)) str[k] = numbers[k] == null ? '' : String(numbers[k]);
    writeText(str);
    const el = f.current.studentName;
    if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const rowSet = (i, field, value) => setProcRows((rows) => editProcRow(rows, i, field, value));
  const shown = filterArchive(archive, search);
  const urgent = urgentCount(archive);
  const radios = (name, options, value, set) => options.map(([val, lbl]) => (
    <label key={val}><input type="radio" name={name} value={val} checked={value === val} onChange={() => set(val)} /> {lbl}</label>
  ));

  return (
    <>
      {editId != null && (
        <div id="abEditBar" style={{ position: 'sticky', top: 0, zIndex: 200, background: 'linear-gradient(135deg,#1d4ed8,#2563a8)', color: 'white', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', borderBottom: '3px solid #fcd34d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 700 }}>
            <span style={{ fontSize: '1.2rem' }}>✏️</span>
            <span>وضع التعديل — تم تحميل ملف الغياب. عدّل ما تريد ثم احفظ.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={updateCurrent} style={{ background: '#fcd34d', color: '#1a3a5c', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: "'Cairo',sans-serif", fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer' }}>💾 حفظ التعديلات</button>
            <button type="button" onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '8px 14px', fontFamily: "'Cairo',sans-serif", fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>✕ إلغاء</button>
          </div>
        </div>
      )}

      <div className="info-box" style={{ background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>💡 <span>هذا النموذج مخصص لتوثيق وضعيات التلاميذ الأكثر غياباً، ورصد أسباب الغياب والإجراءات المتخذة، وحفظ الملفات في الأرشيف لإعداد تقارير رسمية.</span></div>

      <MonthlyImport onFill={fillFromMonthly} />

      <Section n="١" title="معلومات التلميذ(ة)">
        <div className="form-grid">
          <div className="form-group"><label>اسم التلميذ(ة) الكامل *</label><input ref={ref('studentName')} type="text" id="ab_studentName" placeholder="الاسم الكامل" /></div>
          <div className="form-group"><label>رقم مسار التلميذ</label><input ref={ref('massar')} type="text" id="ab_studentMassar" placeholder="رقم مسار" /></div>
          <div className="form-group"><label>المؤسسة التعليمية</label><input ref={ref('school')} type="text" id="ab_school" placeholder="الثانوية الإعدادية المختار السوسي" defaultValue="" /></div>
          <div className="form-group"><label>القسم</label>
            <select ref={ref('level')} id="ab_level" className="level-select" data-react-level="1" style={SEL} defaultValue="">
              {classes.length ? (
                <>
                  <option value="">— اختر القسم —</option>
                  <optgroup label="📥 أقسام لائحة التلاميذ">{classes.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>
                </>
              ) : <option value="">— استورد لائحة التلاميذ لتظهر الأقسام —</option>}
            </select>
          </div>
          <div className="form-group"><label>رقم هاتف ولي الأمر</label><input ref={ref('parentPhone')} type="tel" id="ab_parentPhone" placeholder="06XXXXXXXX" /></div>
          <div className="form-group"><label>تاريخ رصد الحالة</label><input ref={ref('recordDate')} type="date" id="ab_recordDate" /></div>
        </div>
        <div className="divider" />
        <div className="form-grid cols-3">
          <div className="form-group"><label>الجنس</label>
            <div className="radio-group">
              {GENDER_OPTIONS.map(([val, lbl]) => <label key={val}><input type="radio" name="ab_gender" value={val} /> {lbl}</label>)}
            </div>
          </div>
          <div className="form-group"><label>الوضع الأسري</label><div className="radio-group">{radios('ab_family', FAMILY_OPTIONS, family, setFamily)}</div></div>
          <div className="form-group"><label>الدورة الدراسية</label><div className="radio-group">{radios('ab_semester', SEMESTER_OPTIONS, semester, setSemester)}</div></div>
        </div>
      </Section>

      <Section n="٢" title="سياق الغياب وإحصاءاته">
        <div className="form-grid cols-3">
          <div className="form-group"><label>إجمالي ساعات الغياب</label><input ref={ref('totalHours')} type="number" id="ab_totalHours" placeholder="عدد الساعات" min="0" /></div>
          <div className="form-group"><label>الغيابات المبررة (سا)</label><input ref={ref('justifiedHours')} type="number" id="ab_justifiedHours" placeholder="مبررة" min="0" /></div>
          <div className="form-group"><label>الغيابات غير المبررة (سا)</label><input ref={ref('unjustifiedHours')} type="number" id="ab_unjustifiedHours" placeholder="غير مبررة" min="0" /></div>
          <div className="form-group"><label>تاريخ أول غياب مُسجَّل</label><input ref={ref('firstAbsenceDate')} type="date" id="ab_firstAbsenceDate" /></div>
          <div className="form-group"><label>آخر حضور مُسجَّل</label><input ref={ref('lastPresenceDate')} type="date" id="ab_lastPresenceDate" /></div>
          <div className="form-group"><label>عدد أيام الغياب المتراكمة</label><input ref={ref('totalDays')} type="number" id="ab_totalDays" placeholder="عدد الأيام" min="0" /></div>
          <div className="form-group"><label>الأيام المبررة</label><input ref={ref('justifiedDays')} type="number" id="ab_justifiedDays" placeholder="مبررة" min="0" /></div>
          <div className="form-group"><label>الأيام غير المبررة</label><input ref={ref('unjustifiedDays')} type="number" id="ab_unjustifiedDays" placeholder="غير مبررة" min="0" /></div>
        </div>
        <div className="divider" />
        <div className="form-grid">
          <div className="form-group"><label>نمط الغياب</label>
            <div className="check-group">
              {PATTERN_OPTIONS.map(([val, lbl]) => (
                <label key={val}><input type="checkbox" name="ab_pattern" value={val} checked={patterns.includes(val)} onChange={() => setPatterns((c) => toggleIn(c, val))} /> {lbl}</label>
              ))}
            </div>
          </div>
          <div className="form-group"><label>الأسباب المُرصودة</label>
            <div className="check-group">
              {CAUSE_OPTIONS.map(([val, lbl]) => (
                <label key={val}><input type="checkbox" name="ab_cause" value={val} checked={causes.includes(val)} onChange={() => setCauses((c) => toggleIn(c, val))} /> {lbl}</label>
              ))}
            </div>
          </div>
          <div className="form-group col-span-2"><label>معطيات مختصرة حول وضعية الغياب</label>
            <textarea ref={ref('contextNotes')} id="ab_contextNotes" placeholder="اكتب ملاحظات حول وضعية الغياب أو اختر من الاقتراحات أدناه..." />
            <Chips items={CONTEXT_CHIPS} onPick={suggest('contextNotes')} label="💡 اقتراحات جاهزة:" />
          </div>
        </div>
      </Section>

      <Section n="٣" title="الإجراءات المتخذة">
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>حدّد الإجراء المتخذ ثم أدخل <strong>التاريخ</strong> و<strong>الملاحظات</strong> (تُحدَّد الخانة تلقائياً عند الكتابة).</div>
        <div style={{ overflowX: 'auto' }}>
          <table id="ab-summary-table" className="iproc-table">
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
                const p = r.custom ? null : AB_PROCS.find((x) => x.key === r.key);
                return (
                  <tr key={r.custom ? 'c' + i : r.key} data-key={r.custom ? undefined : r.key} data-custom={r.custom ? '1' : undefined}>
                    <td className="c"><input type="checkbox" id={r.custom ? undefined : 'ab_chk_' + r.key} checked={r.checked} onChange={(e) => rowSet(i, 'checked', e.target.checked)} /></td>
                    {r.custom ? (
                      <td>
                        <div className="iproc-namewrap">
                          <input type="text" className="iproc-name" placeholder="اسم الإجراء..." value={r.name} onChange={(e) => rowSet(i, 'name', e.target.value)} />
                          <button type="button" className="iproc-del" title="حذف" onClick={() => setProcRows((rows) => rows.filter((_, j) => j !== i))}>✕</button>
                        </div>
                      </td>
                    ) : <td className="nm">{p.label}</td>}
                    <td><input type="date" id={r.custom ? undefined : 'ab_pdate_' + r.key} value={r.date} onChange={(e) => rowSet(i, 'date', e.target.value)} /></td>
                    <td><input type="text" className="iproc-note" id={r.custom ? undefined : 'ab_pnote_' + r.key} placeholder={r.custom ? 'ملاحظات...' : p.ph} value={r.notes} onChange={(e) => rowSet(i, 'notes', e.target.value)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button type="button" className="iproc-add" onClick={() => setProcRows((rows) => [...rows, newCustomRow()])}>+ إضافة إجراء آخر</button>
      </Section>

      <Section n="٤" title="الخلاصة والتوصيات">
        <div className="form-grid">
          <div className="form-group"><label>درجة الأولوية</label><div className="radio-group">{radios('ab_priority', PRIORITY_OPTIONS, priority, setPriority)}</div></div>
          <div className="form-group col-span-2">
            <label>التوصية الختامية / الملخص الجاهز</label>
            <textarea ref={ref('recommendation')} id="ab_recommendation" placeholder="اكتب التوصية الختامية أو اختر من الاقتراحات الجاهزة أدناه..." />
            <Chips items={REC_CHIPS} onPick={suggest('recommendation')} label="💡 اقتراحات جاهزة قابلة للتعديل:" top={8} />
          </div>
        </div>
      </Section>

      <div className="btn-row">
        <button type="button" className="btn btn-danger" onClick={clearAll}>🗑 مسح الكل</button>
        <button type="button" className="btn btn-success" onClick={() => doSave(false)}>🗄️ حفظ في الأرشيف</button>
        <button type="button" className="btn btn-primary" style={{ background: HEAD_BG }} onClick={generateReport}>📄 إنشاء التقرير ←</button>
      </div>

      <div className="archive-panel" style={{ marginTop: 6 }}>
        <div className="archive-header" onClick={() => setArchiveOpen((o) => !o)}>
          <div className="archive-header-left"><span>🗄️</span><span>سجل الأرشيف — ملفات التلاميذ الأكثر غياباً</span><span className="archive-badge" id="abArchiveCount">{archive.length}</span></div>
          <span id="abArchiveArrow">{archiveOpen ? '▲' : '▼'}</span>
        </div>
        <div className={'archive-body' + (archiveOpen ? ' open' : '')} id="abArchiveBody">
          <div className="archive-stats" id="abArchiveStats">
            <div className="archive-stat">📁 إجمالي الملفات: <strong>{archive.length}</strong></div>
            {urgent ? <div className="archive-stat" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>🔴 حالات عاجلة: <strong>{urgent}</strong></div> : null}
          </div>
          <div className="archive-search">
            <input type="text" id="abArchiveSearch" placeholder="🔍 ابحث باسم التلميذ أو المؤسسة..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="btn-sm btn-sm-outline" onClick={exportCsv}>📊 تصدير CSV</button>
            <button type="button" className="btn-sm btn-sm-danger" onClick={clearArchive}>🗑 مسح الأرشيف</button>
          </div>
          <div id="abArchiveList">
            {!shown.length ? (
              <div className="archive-empty">{search.trim() ? '🔍 لا توجد نتائج.' : <>📂 لا توجد ملفات محفوظة بعد.<br /><small>اضغط "حفظ في الأرشيف" لإضافة الملف الحالي.</small></>}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="archive-table">
                  <thead><tr><th>#</th><th>اسم التلميذ(ة)</th><th>المؤسسة</th><th>المستوى</th><th>إجمالي الساعات</th><th>غير مبررة</th><th>الإجراءات</th><th>الأولوية</th><th>تاريخ الحفظ</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {shown.map((e, i) => (
                      <tr key={e.id}>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>{i + 1}</td>
                        <td><strong style={{ color: '#92400e' }}>{e.studentName}</strong></td>
                        <td>{e.school}</td>
                        <td>{e.level}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{e.totalHours}</td>
                        <td style={{ textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>{e.unjustifiedHours}</td>
                        <td>{(e.procedures || []).map((p, j) => <span key={j} className="archive-tag">{p}</span>)}</td>
                        <td><span style={{ background: P_COLOR[e.priority] || '#64748b', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>{e.priority}</span></td>
                        <td style={{ fontSize: '0.68rem', color: '#64748b' }}>{e.savedAt}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                            <button type="button" className="btn-sm" title="تحميل للتعديل" onClick={() => loadEntry(e.id)}
                              style={{ background: 'linear-gradient(135deg,#2563a8,#1d4ed8)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: "'Cairo',sans-serif", fontWeight: 700 }}>✏️ تعديل</button>
                            <button type="button" className="btn-sm btn-sm-danger" title="حذف هذا الملف" onClick={() => del(e.id)}>🗑</button>
                               <button type="button" className="btn-sm" title="إحالة إلى بوابة المتابعة" onClick={() => referToFollowUp(e, 'absence')}
                               style={{ background: 'linear-gradient(135deg,#d97706,#b45309)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: "'Cairo',sans-serif", fontWeight: 700 }}>🔔 للمتابعة</button>
                          </div>
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
    </>
  );
}

// المرحلة 21: التلاميذ الأكثر غياباً — يُرسم داخل #mountAbsence في صفحة toolAbsence القديمة؛
// شريط العودة ونافذة المعاينة (#absencePrintModal) بقيا في body.html لارتباط الطباعة وWord بمعرّفاتها
export default function AbsencePortal({ mount }) {
  if (!mount) return null;
  return createPortal(<AbsenceBody mount={mount} />, mount);
}
