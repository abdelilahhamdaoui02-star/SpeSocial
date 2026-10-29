import { useEffect, useMemo, useRef, useState } from 'react';
import { getSession } from '../session/installSession.js';
import { createPortal } from 'react-dom';
import { useCollection, useCurrentPortal, useStudents } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import {
  R_PROCS, CAUSE_OPTIONS, GENDER_OPTIONS, FAMILY_OPTIONS, SEMESTER_OPTIONS, PRIORITY_OPTIONS, P_COLOR, P_BG, R_SUGG, R_REC_CHIPS, MSG,
  appendSuggestion, blankProcRows, newCustomRow, editProcRow, procRowsForLoad, saveEntry, taskLogArgs, updateEntry, deleteEntry, loadValues,
  filterArchive, sortArchive, studentCounts, countFor, urgentCount, archiveCsv, csvFileName, reportHtml,
} from './reintegrationLogic.js';
import { openPreview } from '../preview/previewStore.js';
import { openReintegrationHistory, registerHistoryActions } from '../history/history.js';
import { acSetup } from '../autocomplete/studentAutocomplete.js';
import { cleanClassValue } from '../students/cleanClass.js';
import { getLogo } from '../settings/logoStore.js';
import { getInstitution } from '../institution/institutionStore.js';

// الإكمال التلقائي ما زال من الكود القديم (acSetup)؛ يكتب في حقول البوابة مباشرة، ومنها الجنس (genderName)
const AC_CFG = { nameId: 'r_studentName', massarId: 'r_studentMassar', schoolId: 'r_school', levelId: 'r_level', genderName: 'r_gender' };
// حقول لا يملكها React (يكتب فيها الإكمال التلقائي وapplyInstitutionEverywhere وupdateAllLevelSelects مباشرة) → معرّفاتها القديمة
const TEXT_IDS = {
  studentName: 'r_studentName', massar: 'r_studentMassar', school: 'r_school', level: 'r_level', reintegrationDate: 'r_reintegrationDate',
  parentPhone: 'r_parentPhone', absenceDuration: 'r_absenceDuration', absenceStart: 'r_absenceStart',
  contextNotes: 'r_contextNotes', recommendation: 'r_recommendation',
};
// نفس نمط قوائم الأقسام في بقية البوابات (class="level-select")
const SEL = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 11px', fontFamily: "'Cairo',sans-serif", fontSize: '0.875rem', color: 'var(--text)', background: '#fafbfc', direction: 'rtl', width: '100%' };

const currentArchive = () => getState().collections.reintegrationArchive ?? [];
const instName = () => { try { return getInstitution().getInstitutionName(); } catch (e) { return ''; } };
const logo = () => getLogo();
const refreshStats = () => { try { getSession().flow.updateDashboardStats(); } catch (e) { console.error(e); } };
const cleanClass = cleanClassValue;
const toggleIn = (list, x) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

function Section({ n, title, children }) {
  return (
    <div className="section-card">
      <div className="section-header"><span className="step-badge">{n}</span> {title}</div>
      <div className="section-body">{children}</div>
    </div>
  );
}

function Chips({ items, onPick, label }) {
  return (
    <div className="suggest-chips-wrapper">
      <div className="suggest-chips-label">{label}</div>
      <div className="suggest-chips">
        {items.map(([lbl, text]) => <button key={lbl} type="button" className="suggest-chip" onClick={() => onPick(text)}>{lbl}</button>)}
      </div>
    </div>
  );
}

function ReintegrationBody({ mount }) {
  const active = useCurrentPortal() === 'reintegration';
  const [archive, setArchive] = useCollection('reintegrationArchive');
  const students = useStudents();
  const f = useRef({});
  const api = useRef({});
  const [causes, setCauses] = useState([]);
  const [family, setFamily] = useState('');
  const [semester, setSemester] = useState('');
  const [priority, setPriority] = useState('');
  const [procRows, setProcRows] = useState(blankProcRows);
  const [editId, setEditId] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [search, setSearch] = useState('');

  const ref = (k) => (el) => { f.current[k] = el; };
  // قائمة الأقسام: أقسام لائحة التلاميذ المستوردة فقط (كـbuildLevelOptions القديمة)
  const classes = useMemo(() => {
    const set = new Set();
    students.forEach((s) => { const c = cleanClass(s && s.class); if (c) set.add(c); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
  }, [students]);

  const gender = () => { const el = mount.querySelector('input[name="r_gender"]:checked'); return el ? el.value : ''; };
  const setGender = (val) => mount.querySelectorAll('input[name="r_gender"]').forEach((el) => { el.checked = !!val && el.value === val; });
  const readText = () => {
    const o = {};
    for (const k of Object.keys(TEXT_IDS)) o[k] = f.current[k] ? f.current[k].value : '';
    return o;
  };
  const writeText = (vals) => { for (const k of Object.keys(vals)) if (f.current[k]) f.current[k].value = vals[k]; };
  const readForm = () => ({ ...readText(), gender: gender(), family, semester, priority, causes, procRows });
  const persist = (next) => setArchive(next).catch((e) => { console.error(e); alert('❌ فشل حفظ البيانات'); });

  useEffect(() => {
    if (!active) return;
    try { acSetup(AC_CFG); } catch (e) { console.error(e); }
  }, [active]);

  // مسح كل الحقول والخيارات وجدول الإجراءات (rCancelEdit القديمة): القائمة تعود إلى أول خيار
  const wipe = () => {
    Object.keys(TEXT_IDS).forEach((k) => { const el = f.current[k]; if (!el) return; if (el.tagName === 'SELECT') el.selectedIndex = 0; else el.value = ''; });
    setGender('');
    setCauses([]); setFamily(''); setSemester(''); setPriority('');
    setProcRows(blankProcRows());
  };
  const clearAll = () => {
    if (!confirm(MSG.CONFIRM_CLEAR_ALL)) return;
    wipe();
    if (f.current.school) f.current.school.value = instName();
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
    openPreview('reintegration', reportHtml(readForm(), { logo: logo() }));
    doSave(true);
  };

  const loadEntry = (id) => {
    const e = currentArchive().find((x) => x.id === id);
    if (!e) return;
    try { document.querySelector('#toolReintegration .main-container')?.scrollTo(0, 0); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { /* لا شيء */ }
    const v = loadValues(e);
    writeText(v.text);
    setGender(v.gender); setSemester(v.semester); setPriority(v.priority); setCauses(v.causes);
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
  const suggest = (k) => (text) => { const el = f.current[k]; if (el) { el.value = appendSuggestion(el.value, text); el.focus(); } };

  // نافذة «سجل التلميذ» (src/history) تستدعي تعديل/حذف ملف من هنا عبر التسجيل، لا عبر window
  api.current = { loadEntry, del };
  useEffect(() => registerHistoryActions('reintegration', {
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

  return (
    <>
      {editId != null && (
        <div id="rEditBar" style={{ position: 'sticky', top: 0, zIndex: 200, background: 'linear-gradient(135deg,#1d4ed8,#2563a8)', color: 'white', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', borderBottom: '3px solid #fcd34d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 700 }}>
            <span style={{ fontSize: '1.2rem' }}>✏️</span>
            <span>وضع التعديل — تم تحميل بيانات ملف الإدماج. عدّل ما تريد ثم احفظ.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={updateCurrent} style={{ background: '#fcd34d', color: '#1a3a5c', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: "'Cairo',sans-serif", fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer' }}>💾 حفظ التعديلات</button>
            <button type="button" onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '8px 14px', fontFamily: "'Cairo',sans-serif", fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>✕ إلغاء</button>
          </div>
        </div>
      )}

      <div className="info-box">💡 <span>هذا النموذج مخصص لتتبع التلاميذ الذين أُعيد إدماجهم في المنظومة التربوية، مع رصد جميع الإجراءات المتخذة قبل وأثناء وبعد عملية الإدماج.</span></div>

      <Section n="١" title="معلومات التلميذ(ة)">
        <div className="form-grid">
          <div className="form-group"><label>اسم التلميذ(ة) الكامل *</label><input ref={ref('studentName')} type="text" id="r_studentName" placeholder="الاسم الكامل" /></div>
          <div className="form-group"><label>رقم مسار التلميذ</label><input ref={ref('massar')} type="text" id="r_studentMassar" placeholder="رقم مسار" /></div>
          <div className="form-group"><label>المؤسسة التعليمية</label><input ref={ref('school')} type="text" id="r_school" placeholder="الثانوية الإعدادية المختار السوسي" defaultValue="" /></div>
          <div className="form-group"><label>القسم</label>
            <select ref={ref('level')} id="r_level" className="level-select" data-react-level="1" style={SEL} defaultValue="">
              {classes.length ? (
                <>
                  <option value="">— اختر القسم —</option>
                  <optgroup label="📥 أقسام لائحة التلاميذ">{classes.map((c) => <option key={c} value={c}>{c}</option>)}</optgroup>
                </>
              ) : <option value="">— استورد لائحة التلاميذ لتظهر الأقسام —</option>}
            </select>
          </div>
          <div className="form-group"><label>تاريخ إعادة الإدماج *</label><input ref={ref('reintegrationDate')} type="date" id="r_reintegrationDate" /></div>
          <div className="form-group"><label>رقم هاتف ولي الأمر</label><input ref={ref('parentPhone')} type="tel" id="r_parentPhone" placeholder="06XXXXXXXX" /></div>
        </div>
        <div className="divider" />
        <div className="form-grid cols-3">
          <div className="form-group"><label>الجنس</label>
            <div className="radio-group">
              {GENDER_OPTIONS.map(([val, lbl]) => <label key={val}><input type="radio" name="r_gender" value={val} /> {lbl}</label>)}
            </div>
          </div>
          <div className="form-group"><label>الوضع الأسري</label><div className="radio-group">{radios('r_family', FAMILY_OPTIONS, family, setFamily)}</div></div>
          <div className="form-group"><label>الدورة الدراسية</label><div className="radio-group">{radios('r_semester', SEMESTER_OPTIONS, semester, setSemester)}</div></div>
        </div>
      </Section>

      <Section n="٢" title="سياق الانقطاع وإعادة الإدماج">
        <div className="form-grid">
          <div className="form-group"><label>مدة الانقطاع</label><input ref={ref('absenceDuration')} type="text" id="r_absenceDuration" placeholder="مثال: شهران / فصل دراسي" /></div>
          <div className="form-group"><label>تاريخ بداية الانقطاع</label><input ref={ref('absenceStart')} type="date" id="r_absenceStart" /></div>
          <div className="form-group col-span-2"><label>أسباب الانقطاع</label>
            <div className="check-group">
              {CAUSE_OPTIONS.map(([val, lbl]) => (
                <label key={val}><input type="checkbox" name="r_cause" value={val} checked={causes.includes(val)} onChange={() => setCauses((c) => toggleIn(c, val))} /> {lbl}</label>
              ))}
            </div>
          </div>
          <div className="form-group col-span-2"><label>معطيات مختصرة حول وضعية الانقطاع</label>
            <textarea ref={ref('contextNotes')} id="r_contextNotes" placeholder="اكتب معطيات مختصرة..." />
            <Chips items={R_SUGG.contextNotes} onPick={suggest('contextNotes')} label="💡 اقتراحات جاهزة:" />
          </div>
        </div>
      </Section>

      <Section n="٣" title="الإجراءات المتخذة">
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>حدّد الإجراء المتخذ ثم أدخل <strong>التاريخ</strong> و<strong>الملاحظات</strong> (تُحدَّد الخانة تلقائياً عند الكتابة).</div>
        <div style={{ overflowX: 'auto' }}>
          <table id="r-summary-table" className="iproc-table">
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
                const p = r.custom ? null : R_PROCS.find((x) => x.key === r.key);
                return (
                  <tr key={r.custom ? 'c' + i : r.key} data-key={r.custom ? undefined : r.key} data-custom={r.custom ? '1' : undefined}>
                    <td className="c"><input type="checkbox" id={r.custom ? undefined : 'r_chk_' + r.key} checked={r.checked} onChange={(e) => rowSet(i, 'checked', e.target.checked)} /></td>
                    {r.custom ? (
                      <td>
                        <div className="iproc-namewrap">
                          <input type="text" className="iproc-name" placeholder="اسم الإجراء..." value={r.name} onChange={(e) => rowSet(i, 'name', e.target.value)} />
                          <button type="button" className="iproc-del" title="حذف" onClick={() => setProcRows((rows) => rows.filter((_, j) => j !== i))}>✕</button>
                        </div>
                      </td>
                    ) : <td className="nm">{p.label}</td>}
                    <td><input type="date" id={r.custom ? undefined : 'r_pdate_' + r.key} value={r.date} onChange={(e) => rowSet(i, 'date', e.target.value)} /></td>
                    <td><input type="text" className="iproc-note" id={r.custom ? undefined : 'r_pnote_' + r.key} placeholder={r.custom ? 'ملاحظات...' : p.ph} value={r.notes} onChange={(e) => rowSet(i, 'notes', e.target.value)} /></td>
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
          <div className="form-group"><label>درجة الأولوية</label><div className="radio-group">{radios('r_priority', PRIORITY_OPTIONS, priority, setPriority)}</div></div>
          <div className="form-group col-span-2">
            <label>التوصية الختامية / الملخص الجاهز</label>
            <textarea ref={ref('recommendation')} id="r_recommendation" placeholder="اكتب التوصية الختامية أو اختر من الاقتراحات الجاهزة أدناه..." />
            <Chips items={R_SUGG.recommendation} onPick={suggest('recommendation')} label="💡 اقتراحات جاهزة:" />
            <div className="suggest-chips-label" style={{ marginTop: 8 }}>💡 اقتراحات جاهزة قابلة للتعديل:</div>
            <div className="suggest-chips">
              {R_REC_CHIPS.map(([lbl, text]) => <button key={lbl} type="button" className="suggest-chip" onClick={() => suggest('recommendation')(text)}>{lbl}</button>)}
            </div>
          </div>
        </div>
      </Section>

      <div className="btn-row">
        <button type="button" className="btn btn-danger" onClick={clearAll}>🗑 مسح الكل</button>
        <button type="button" className="btn btn-success" onClick={() => doSave(false)}>🗄️ حفظ في الأرشيف</button>
        <button type="button" className="btn btn-primary" onClick={generateReport}>📄 إنشاء التقرير ←</button>
      </div>

      <div className="archive-panel" style={{ marginTop: 6 }}>
        <div className="archive-header" onClick={() => setArchiveOpen((o) => !o)}>
          <div className="archive-header-left"><span>🗄️</span><span>سجل الأرشيف — ملفات إعادة الإدماج</span><span className="archive-badge" id="rArchiveCount">{archive.length}</span></div>
          <span id="rArchiveArrow">{archiveOpen ? '▲' : '▼'}</span>
        </div>
        <div className={'archive-body' + (archiveOpen ? ' open' : '')} id="rArchiveBody">
          <div className="archive-stats" id="rArchiveStats">
            <div className="archive-stat">📁 إجمالي الملفات: <strong>{archive.length}</strong></div>
            {urgent ? <div className="archive-stat" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#dc2626' }}>🔴 حالات عاجلة: <strong>{urgent}</strong></div> : null}
          </div>
          <div className="archive-search">
            <input type="text" id="rArchiveSearch" placeholder="🔍 ابحث باسم التلميذ أو المؤسسة..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="btn-sm btn-sm-outline" onClick={exportCsv}>📊 تصدير Excel</button>
            <button type="button" className="btn-sm btn-sm-danger" onClick={clearArchive}>🗑 مسح الأرشيف</button>
          </div>
          <div id="rArchiveList">
            {!shown.length ? (
              <div className="archive-empty">{search.trim() ? '🔍 لا توجد نتائج.' : <>📂 لا توجد ملفات محفوظة بعد.<br /><small>اضغط "حفظ في الأرشيف" لإضافة الملف الحالي.</small></>}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="archive-table">
                  <thead><tr><th>#</th><th>اسم التلميذ(ة)</th><th>المؤسسة</th><th>المستوى</th><th>📅 تاريخ الإدماج</th><th>مدة الانقطاع</th><th>الأولوية</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
                  <tbody>
                    {shown.map((e, idx) => {
                      const count = countFor(counts, e);
                      const multi = count > 1;
                      return (
                        <tr key={e.id}>
                          <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{idx + 1}</td>
                          <td>
                            <strong style={{ color: 'var(--primary)' }}>👤 {e.studentName}</strong>
                            {multi && <><br /><span style={{ background: '#ede9fe', color: '#7c3aed', border: '1px solid #c4b5fd', borderRadius: 10, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 700 }}>🔁 {count} ملفات</span></>}
                          </td>
                          <td>{e.school || '—'}</td>
                          <td style={{ textAlign: 'center' }}>{e.level || '—'}</td>
                          <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>📅 {e.reintegrationDate || '—'}</td>
                          <td style={{ textAlign: 'center' }}>{e.absenceDuration || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            {e.priority && e.priority !== '—'
                              ? <span style={{ background: P_BG[e.priority] || '#f1f5f9', color: P_COLOR[e.priority] || '#64748b', border: '1px solid ' + (P_COLOR[e.priority] || '#cbd5e1'), borderRadius: 12, padding: '2px 9px', fontSize: '0.72rem', fontWeight: 700 }}>● {e.priority}</span>
                              : '—'}
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '0.75rem' }}>{e.currentStatus || '—'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
                              {multi && (
                                <button type="button" className="btn-sm" title="سجل جميع ملفات الإدماج" onClick={() => openReintegrationHistory(e.studentName, e.id)}
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

// المرحلة 20: الإدماج المدرسي — يُرسم داخل #mountReintegration في صفحة toolReintegration القديمة؛
// شريط العودة ونافذة المعاينة (#reintegrationPrintModal) بقيا في body.html لارتباط الطباعة وWord بمعرّفاتها
export default function ReintegrationPortal({ mount }) {
  if (!mount) return null;
  return createPortal(<ReintegrationBody mount={mount} />, mount);
}
