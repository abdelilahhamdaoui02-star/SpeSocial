import { useEffect, useMemo, useRef, useState } from 'react';
import { getSession } from '../session/installSession.js';
import { createPortal } from 'react-dom';
import { useCollection, useCurrentPortal, useStudents } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import {
  I_PROCS, GENDER_OPTIONS, FAMILY_OPTIONS, SEMESTER_OPTIONS, PRIORITY_OPTIONS, P_COLOR, P_BG, MSG,
  SUMMARY_GROUPS, NOTE_GROUPS, SUBJECT_SUGG, REC_CHIPS,
  appendSuggestion, summarySuggestionsFor, summaryChipsLabel, usedLines, optionPool, toggleLine,
  blankProcRows, newCustomRow, editProcRow, procRowsForLoad, saveEntry, taskLogArgs, updateEntry, deleteEntry, loadValues,
  filterArchive, sortArchive, studentCounts, countFor, urgentCount, archiveCsv, csvFileName, reportHtml,
} from './interviewLogic.js';
import { openPreview } from '../preview/previewStore.js';
import { openStudentHistory, registerHistoryActions } from '../history/history.js';
import { acSetup } from '../autocomplete/studentAutocomplete.js';
import { cleanClassValue } from '../students/cleanClass.js';
import { getLogo } from '../settings/logoStore.js';
import { referToFollowUp } from '../gates/followLink.js';
// الإكمال التلقائي ما زال من الكود القديم (acSetup)؛ يكتب في حقول البوابة مباشرة، ومنها الجنس (genderName)
const AC_CFG = { nameId: 'i_studentName', massarId: 'i_studentMassar', schoolId: 'i_school', levelId: 'i_level', genderName: 'i_gender', phoneId: 'i_parentPhone' };// حقول لا يملكها React (يكتب فيها الإكمال التلقائي وapplyInstitutionEverywhere وupdateAllLevelSelects مباشرة) → معرّفاتها القديمة
const REF_IDS = { studentName: 'i_studentName', massar: 'i_studentMassar', school: 'i_school', level: 'i_level' };
// نفس نمط قوائم الأقسام في بقية البوابات (class="level-select")
const SEL = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 11px', fontFamily: "'Cairo',sans-serif", fontSize: '0.875rem', color: 'var(--text)', background: '#fafbfc', direction: 'rtl', width: '100%' };

const BLANK_TEXT = { interviewDate: '', subject: '', parentPhone: '', summary: '', specialistNotes: '', recommendation: '' };

const currentArchive = () => getState().collections.interviewArchive ?? [];
const instName = () => { try { return getInstitution().getInstitutionName(); } catch (e) { return ''; } };
const logo = () => getLogo();
const refreshStats = () => { try { getSession().flow.updateDashboardStats(); } catch (e) { console.error(e); } };
const cleanClass = cleanClassValue;

function Section({ n, title, children }) {
  return (
    <div className="section-card">
      <div className="section-header"><span className="step-badge">{n}</span> {title}</div>
      <div className="section-body">{children}</div>
    </div>
  );
}

// لوحة الخيارات القابلة للجمع تحت الملخص والملاحظات (iBuildOptionPanel القديمة): النقر يضيف السطر أو يحذفه من النص
function OptionPanel({ groups, text, setText }) {
  const [active, setActive] = useState(0);
  const [q, setQ] = useState('');
  const pool = optionPool(groups, active, q);
  const cur = usedLines(text);
  const searching = !!q.trim();
  return (
    <div className="iopt-panel">
      <div className="iopt-head">
        <span>💡 اختر ما يناسب — يمكنك الجمع بين عدة خيارات (انقر مرة أخرى للإلغاء)</span>
        <div className="iopt-tools">
          <input type="text" className="iopt-search" placeholder="🔍 بحث في الخيارات..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="button" className="iopt-clear" onClick={() => { if (text.trim() && !confirm(MSG.CONFIRM_CLEAR_TEXT)) return; setText(''); }}>🗑 مسح النص</button>
        </div>
      </div>
      <div className="iopt-tabs" style={{ opacity: searching ? 0.45 : 1 }}>
        {groups.map((g, i) => (
          <button key={g.title} type="button" className={'iopt-tab' + (i === active ? ' active' : '')} onClick={() => { setActive(i); setQ(''); }}>{g.title}</button>
        ))}
      </div>
      <div className="iopt-list">
        {!pool.length ? <div className="iopt-empty">لا توجد خيارات مطابقة.</div> : pool.map((t) => (
          <button key={t} type="button" className={'iopt-item' + (cur.indexOf(t) !== -1 ? ' used' : '')} onClick={() => setText(toggleLine(text, t))}>
            <span className="iopt-mark" /><span>{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function InterviewBody({ mount }) {
  const active = useCurrentPortal() === 'interview';
  const [archive, setArchive] = useCollection('interviewArchive');
  const students = useStudents();
  const f = useRef({});
  const api = useRef({});
  const [txt, setTxt] = useState(BLANK_TEXT);
  const [family, setFamily] = useState('');
  const [semester, setSemester] = useState('');
  const [priority, setPriority] = useState('');
  const [procRows, setProcRows] = useState(blankProcRows);
  const [chipSubject, setChipSubject] = useState('');
  const [editId, setEditId] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [search, setSearch] = useState('');

  const ref = (k) => (el) => { f.current[k] = el; };
  const setT = (k) => (value) => setTxt((t) => ({ ...t, [k]: value }));
  // قائمة الأقسام: أقسام لائحة التلاميذ المستوردة فقط (كـbuildLevelOptions القديمة)
  const classes = useMemo(() => {
    const set = new Set();
    students.forEach((s) => { const c = cleanClass(s && s.class); if (c) set.add(c); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
  }, [students]);

  const gender = () => { const el = mount.querySelector('input[name="i_gender"]:checked'); return el ? el.value : ''; };
  const setGender = (val) => mount.querySelectorAll('input[name="i_gender"]').forEach((el) => { el.checked = !!val && el.value === val; });
  const readRefs = () => {
    const o = {};
    for (const k of Object.keys(REF_IDS)) o[k] = f.current[k] ? f.current[k].value : '';
    return o;
  };
  const readForm = () => ({ ...readRefs(), ...txt, gender: gender(), family, semester, priority, procRows });
  const persist = (next) => setArchive(next).catch((e) => { console.error(e); alert('❌ فشل حفظ البيانات'); });

  useEffect(() => {
    if (!active) return;
    try { acSetup(AC_CFG); } catch (e) { console.error(e); }
  }, [active]);

  // مسح كل الحقول والخيارات وجدول الإجراءات (iCancelEdit القديمة). iClearAll تمسح هاتف الولي أيضاً، أما iCancelEdit فلا تمسحه (حقل tel خارج محدِّدها)
  const wipe = ({ phone }) => {
    Object.keys(REF_IDS).forEach((k) => { const el = f.current[k]; if (!el) return; if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = ''; });
    if (f.current.school) f.current.school.value = instName();
    setGender('');
    setTxt((t) => ({ ...BLANK_TEXT, parentPhone: phone ? '' : t.parentPhone }));
    setFamily(''); setSemester(''); setPriority('');
    setProcRows(blankProcRows());
  };
  const clearAll = () => {
    if (!confirm(MSG.CONFIRM_CLEAR_ALL)) return;
    wipe({ phone: true });
  };

  const doSave = (silent) => {
    const r = saveEntry(currentArchive(), readForm());
    if (!r) { if (!silent) alert(MSG.NAME_FIRST); return; }
    persist(r.archive);
    refreshStats();
    setArchiveOpen(true);
    try { getSession().archives.autoLogTask(...taskLogArgs(r.entry)); } catch (e) { console.error(e); }
  };

  // التقرير يُنشأ حتى بلا اسم («غير مُحدد») ولا يُحفظ حينها؛ وإلا يُحفظ سجل جديد في كل مرة (كالقديم)
  const generateReport = () => {
    openPreview('interview', reportHtml(readForm(), { logo: logo() }));
    doSave(true);
  };

  const loadEntry = (id) => {
    const e = currentArchive().find((x) => x.id === id);
    if (!e) return;
    try { document.querySelector('#toolInterview .main-container')?.scrollTo(0, 0); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { /* لا شيء */ }
    const v = loadValues(e);
    const t = v.text;
    for (const k of Object.keys(REF_IDS)) {
      if (!(k in t) || !f.current[k]) continue; // رقم المسار لا يُحفظ في سجل المقابلة فلا يُمسّ
      f.current[k].value = t[k];
    }
    setTxt((cur) => ({ ...cur, interviewDate: t.interviewDate, subject: t.subject, summary: t.summary, specialistNotes: t.specialistNotes, recommendation: t.recommendation }));
    setGender(v.gender); setSemester(v.semester); setPriority(v.priority);
    setProcRows(procRowsForLoad(e));
    setEditId(id);
  };
  const cancelEdit = () => { setEditId(null); wipe({ phone: false }); };
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

  const del = (id, skipConfirm) => {
    if (!skipConfirm && !confirm(MSG.CONFIRM_DELETE)) return;
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

  // نافذة «سجل التلميذ» (src/history) تستدعي تعديل/حذف سجل من هنا عبر التسجيل، لا عبر window
  api.current = { loadEntry, del };
  useEffect(() => registerHistoryActions('interview', {
    loadEntry: (id) => api.current.loadEntry(id),
    del: (id, skip) => api.current.del(id, skip),
  }), []);

  const rowSet = (i, field, value) => setProcRows((rows) => editProcRow(rows, i, field, value));
  const shown = sortArchive(filterArchive(archive, search));
  const counts = studentCounts(archive);
  const urgent = urgentCount(archive);
  const radios = (name, options, value, set) => options.map(([val, lbl]) => (
    <label key={val}><input type="radio" name={name} value={val} checked={value === val} onChange={() => set(val)} /> {lbl}</label>
  ));
  const summaryChips = summarySuggestionsFor(chipSubject);
  const taRef = useRef({});

  return (
    <>
      {editId != null && (
        <div id="iEditBar" style={{ position: 'sticky', top: 0, zIndex: 200, background: 'linear-gradient(135deg,#1d4ed8,#2563a8)', color: 'white', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', borderBottom: '3px solid #fcd34d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 700 }}>
            <span style={{ fontSize: '1.2rem' }}>✏️</span>
            <span>وضع التعديل — تم تحميل بيانات المقابلة. عدّل ما تريد ثم احفظ.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={updateCurrent} style={{ background: '#fcd34d', color: '#1a3a5c', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: "'Cairo',sans-serif", fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer' }}>💾 حفظ التعديلات</button>
            <button type="button" onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '8px 14px', fontFamily: "'Cairo',sans-serif", fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>✕ إلغاء</button>
          </div>
        </div>
      )}

      <div className="info-box">💡 <span>هذا النموذج مخصص لتوثيق المقابلات الفردية التي يجريها المختص الاجتماعي مع التلاميذ، وتسجيل ملاحظاته والإجراءات المتخذة.</span></div>

      <Section n="١" title="معلومات التلميذ(ة)">
        <div className="form-grid">
          <div className="form-group"><label>اسم التلميذ(ة) الكامل *</label><input ref={ref('studentName')} type="text" id="i_studentName" placeholder="الاسم الكامل" /></div>
          <div className="form-group"><label>رقم مسار التلميذ</label><input ref={ref('massar')} type="text" id="i_studentMassar" placeholder="رقم مسار" readOnly style={{ background: '#f0f4ff', color: '#1a3a5c', fontWeight: 700 }} /></div>
          <div className="form-group"><label>المؤسسة التعليمية</label><input ref={ref('school')} type="text" id="i_school" placeholder="الثانوية الإعدادية المختار السوسي" defaultValue="" /></div>
          <div className="form-group"><label>القسم</label>
            <select ref={ref('level')} id="i_level" className="level-select" data-react-level="1" style={SEL} defaultValue="">
              {classes.length ? (
                <>
                  <option value="">— اختر القسم —</option>
                  <optgroup label="📥 أقسام لائحة التلاميذ">{classes.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>
                </>
              ) : <option value="">— استورد لائحة التلاميذ لتظهر الأقسام —</option>}
            </select>
          </div>
          <div className="form-group"><label>رقم هاتف ولي الأمر</label><input type="tel" id="i_parentPhone" placeholder="06XXXXXXXX" value={txt.parentPhone} onChange={(e) => setT('parentPhone')(e.target.value)} /></div>
          <div className="form-group"><label>📅 تاريخ المقابلة *</label><input type="date" id="i_interviewDate" value={txt.interviewDate} onChange={(e) => setT('interviewDate')(e.target.value)} /></div>
          <div className="form-group">
            <label>📌 موضوع المقابلة *</label>
            <input type="text" id="i_interviewSubject" placeholder="اكتب موضوع المقابلة أو اختر اقتراحاً..." value={txt.subject}
              onChange={(e) => { setT('subject')(e.target.value); setChipSubject(e.target.value); }} />
            <div id="i_interviewSubjectChips" style={{ marginTop: 6 }}>
              <div className="suggest-chips-label">💡 اقتراحات سريعة:</div>
              <div className="suggest-chips">
                {SUBJECT_SUGG.map((s) => <button key={s} type="button" className="suggest-chip" onClick={() => { setT('subject')(s); setChipSubject(s); }}>{s}</button>)}
              </div>
            </div>
          </div>
        </div>
        <div className="divider" />
        <div className="form-grid cols-3">
          <div className="form-group"><label>الجنس</label>
            <div className="radio-group">
              {GENDER_OPTIONS.map(([val, lbl]) => <label key={val}><input type="radio" name="i_gender" value={val} /> {lbl}</label>)}
            </div>
          </div>
          <div className="form-group"><label>الوضع الأسري</label><div className="radio-group">{radios('i_family', FAMILY_OPTIONS, family, setFamily)}</div></div>
          <div className="form-group"><label>الدورة الدراسية</label><div className="radio-group">{radios('i_semester', SEMESTER_OPTIONS, semester, setSemester)}</div></div>
        </div>
      </Section>

      <Section n="٢" title="ملخص المقابلة">
        <div className="form-grid cols-1">
          <div className="form-group">
            <label>ملخص ما دار في المقابلة</label>
            <textarea ref={(el) => { taRef.current.summary = el; }} id="i_interviewSummary" className="large" placeholder="اكتب ملخصاً عن المقابلة أو اختر من الاقتراحات أدناه..." value={txt.summary} onChange={(e) => setT('summary')(e.target.value)} />
            <div className="suggest-chips-label" style={{ marginTop: 8 }} id="i_summaryChipsLabel">{summaryChipsLabel(chipSubject)}</div>
            <div className="suggest-chips" id="i_summaryChips">
              {summaryChips.map((s) => <button key={s[0]} type="button" className="suggest-chip" title={s[1]} onClick={() => { setT('summary')(appendSuggestion(txt.summary, s[1])); setTimeout(() => taRef.current.summary && taRef.current.summary.focus(), 0); }}>{s[0]}</button>)}
            </div>
            <div id="i_summaryBuilder"><OptionPanel groups={SUMMARY_GROUPS} text={txt.summary} setText={setT('summary')} /></div>
          </div>
        </div>
      </Section>

      <Section n="٣" title="ملاحظة المختص الاجتماعي">
        <div className="form-group">
          <label>ملاحظة المختص الاجتماعي <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.72rem' }}>(ملاحظات عملية وخطوات قابلة للتنفيذ)</span></label>
          <textarea id="i_specialist_note_text" className="large" placeholder="اكتب ملاحظاتك العملية: ما الذي سيُنجز؟ ومن يتولاه؟ ومتى؟ — أو اختر من الخيارات أدناه..." value={txt.specialistNotes} onChange={(e) => setT('specialistNotes')(e.target.value)} />
          <div id="i_noteBuilder"><OptionPanel groups={NOTE_GROUPS} text={txt.specialistNotes} setText={setT('specialistNotes')} /></div>
        </div>
      </Section>

      <Section n="٤" title="الإجراءات المتخذة">
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>حدّد الإجراء المتخذ ثم أدخل <strong>التاريخ</strong> و<strong>الملاحظات</strong> (تُحدَّد الخانة تلقائياً عند الكتابة).</div>
        <div style={{ overflowX: 'auto' }}>
          <table id="i-summary-table" className="iproc-table">
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
                const p = r.custom ? null : I_PROCS.find((x) => x.key === r.key);
                return (
                  <tr key={r.custom ? 'c' + i : r.key} data-key={r.custom ? undefined : r.key} data-custom={r.custom ? '1' : undefined}>
                    <td className="c"><input type="checkbox" id={r.custom ? undefined : 'i_chk_' + r.key} checked={r.checked} onChange={(e) => rowSet(i, 'checked', e.target.checked)} /></td>
                    {r.custom ? (
                      <td>
                        <div className="iproc-namewrap">
                          <input type="text" className="iproc-name" placeholder="اسم الإجراء..." value={r.name} onChange={(e) => rowSet(i, 'name', e.target.value)} />
                          <button type="button" className="iproc-del" title="حذف" onClick={() => setProcRows((rows) => rows.filter((_, j) => j !== i))}>✕</button>
                        </div>
                      </td>
                    ) : <td className="nm">{p.label}</td>}
                    <td><input type="date" id={r.custom ? undefined : 'i_pdate_' + r.key} value={r.date} onChange={(e) => rowSet(i, 'date', e.target.value)} /></td>
                    <td><input type="text" className="iproc-note" id={r.custom ? undefined : 'i_pnote_' + r.key} placeholder={r.custom ? 'ملاحظات...' : p.ph} value={r.notes} onChange={(e) => rowSet(i, 'notes', e.target.value)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button type="button" className="iproc-add" onClick={() => setProcRows((rows) => [...rows, newCustomRow()])}>+ إضافة إجراء آخر</button>
      </Section>

      <Section n="٥" title="الخلاصة والتوصيات">
        <div className="form-grid">
          <div className="form-group"><label>درجة الأولوية</label><div className="radio-group">{radios('i_priority', PRIORITY_OPTIONS, priority, setPriority)}</div></div>
          <div className="form-group col-span-2">
            <label>التوصية الختامية</label>
            <textarea ref={(el) => { taRef.current.recommendation = el; }} id="i_recommendation" placeholder="اكتب التوصية الختامية أو اختر من الاقتراحات..." value={txt.recommendation} onChange={(e) => setT('recommendation')(e.target.value)} />
            <div className="suggest-chips-wrapper">
              <div className="suggest-chips-label">💡 اقتراحات جاهزة:</div>
              <div className="suggest-chips">
                {REC_CHIPS.map(([lbl, text]) => <button key={lbl} type="button" className="suggest-chip" onClick={() => { setT('recommendation')(appendSuggestion(txt.recommendation, text)); setTimeout(() => taRef.current.recommendation && taRef.current.recommendation.focus(), 0); }}>{lbl}</button>)}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <div className="btn-row">
        <button type="button" className="btn btn-danger" onClick={clearAll}>🗑 مسح الكل</button>
        <button type="button" className="btn btn-success" onClick={() => doSave(false)}>🗄️ حفظ في الأرشيف</button>
        <button type="button" className="btn btn-primary" onClick={generateReport}>📄 إنشاء التقرير ←</button>
      </div>

      <div className="archive-panel">
        <div className="archive-header" onClick={() => setArchiveOpen((o) => !o)}>
          <div className="archive-header-left"><span>🗄️</span><span>سجل الأرشيف — المقابلات السابقة</span><span className="archive-badge" id="archiveCount">{archive.length}</span></div>
          <span id="archiveArrow">{archiveOpen ? '▲' : '▼'}</span>
        </div>
        <div className={'archive-body' + (archiveOpen ? ' open' : '')} id="archiveBody">
          <div className="archive-stats" id="archiveStats">
            <div className="archive-stat">📁 إجمالي المقابلات: <strong>{archive.length}</strong></div>
            {urgent ? <div className="archive-stat" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>🔴 حالات عاجلة: <strong>{urgent}</strong></div> : null}
          </div>
          <div className="archive-search">
            <input type="text" id="archiveSearch" placeholder="🔍 ابحث باسم التلميذ أو المؤسسة..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="btn-sm btn-sm-outline" onClick={exportCsv}>📊 تصدير Excel</button>
            <button type="button" className="btn-sm btn-sm-danger" onClick={clearArchive}>🗑 مسح الأرشيف</button>
          </div>
          <div id="archiveList">
            {!shown.length ? (
              <div className="archive-empty">{search.trim() ? '🔍 لا توجد نتائج.' : <>📂 لا توجد مقابلات محفوظة بعد.<br /><small>اضغط "حفظ في الأرشيف" لإضافة المقابلة الحالية.</small></>}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="archive-table">
                  <thead><tr><th>#</th><th>اسم التلميذ(ة)</th><th>المؤسسة</th><th>المستوى</th><th>📅 تاريخ المقابلة</th><th>الأولوية</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
                  <tbody>
                    {shown.map((e, idx) => {
                      const count = countFor(counts, e);
                      const multi = count > 1;
                      return (
                        <tr key={e.id}>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{idx + 1}</td>
                          <td>
                            <strong style={{ color: 'var(--primary)' }}>👤 {e.studentName}</strong>
                            {multi && <><br /><span style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd', borderRadius: 10, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700 }}>🔁 {count} مقابلات</span></>}
                          </td>
                          <td>{e.school || '—'}</td>
                          <td style={{ textAlign: 'center' }}>{e.level || '—'}</td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>📅 {e.interviewDate || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            {e.priority && e.priority !== '—'
                              ? <span style={{ background: P_BG[e.priority] || '#f1f5f9', color: P_COLOR[e.priority] || '#64748b', border: '1px solid ' + (P_COLOR[e.priority] || '#cbd5e1'), borderRadius: 12, padding: '2px 9px', fontSize: '0.72rem', fontWeight: 700 }}>● {e.priority}</span>
                              : '—'}
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.75rem' }}>{e.currentStatus || '—'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
                              {multi && (
                                <button type="button" className="btn-sm" title="سجل جميع المقابلات" onClick={() => openStudentHistory(e.studentName, e.id)}
                                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: "'Cairo',sans-serif", fontWeight: 700 }}>📋 السجل</button>
                              )}
                              <button type="button" className="btn-sm" title="تحميل للتعديل" onClick={() => loadEntry(e.id)}
                                style={{ background: 'linear-gradient(135deg,#2563a8,#1d4ed8)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: "'Cairo',sans-serif", fontWeight: 700 }}>✏️ تعديل</button>
                              <button type="button" className="btn-sm btn-sm-danger" title="حذف" onClick={() => del(e.id)}>🗑</button>
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
    </>
  );
}

// المرحلة 23: المقابلات الفردية — يُرسم داخل #mountInterview في صفحة toolInterview القديمة؛
// شريط العودة ونافذة المعاينة (#interviewPrintModal) بقيا في body.html لارتباط الطباعة وWord بمعرّفاتها
export default function InterviewPortal({ mount }) {
  if (!mount) return null;
  return createPortal(<InterviewBody mount={mount} />, mount);
}
