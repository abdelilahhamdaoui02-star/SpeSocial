import { useEffect, useRef, useState } from 'react';
import { getSession } from '../session/installSession.js';
import { createPortal } from 'react-dom';
import { useCollection, useCurrentPortal } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import {
  VIO_PROCS, TYPE_OPTIONS, LOCATION_OPTIONS, SOURCE_OPTIONS, PRIORITY_OPTIONS, PRIO_COLORS, MSG,
  todayIso, blankProcRows, newCustomRow, editProcRow, saveEntry, taskLogArgs, updateEntry, formFromEntry,
  filterArchive, deleteEntry, reportHtml,
} from './violenceLogic.js';
import { openPreview } from '../preview/previewStore.js';
import { acSetup } from '../autocomplete/studentAutocomplete.js';
import { getLogo } from '../settings/logoStore.js';
import { getInstitution } from '../institution/institutionStore.js';

// الإكمال التلقائي للتلاميذ ما زال من الكود القديم (acSetup)؛ نمرّر له حقول البوابة نفسها كما كانت AUTOCOMPLETE_FIELDS تفعل
const AC_CFGS = [
  { nameId: 'vio_studentName', massarId: 'vio_massar', schoolId: 'vio_school', levelId: 'vio_level' },
  { nameId: 'vio_agg_name', massarId: 'vio_agg_massar', levelId: 'vio_agg_level' },
];
// حقول النص غير المتحكَّم بها (يكتب فيها الإكمال التلقائي وapplyInstitutionEverywhere مباشرة في DOM) → معرّفاتها القديمة
const TEXT_IDS = {
  studentName: 'vio_studentName', level: 'vio_level', massar: 'vio_massar',
  aggName: 'vio_agg_name', aggLevel: 'vio_agg_level', aggMassar: 'vio_agg_massar',
  reportDate: 'vio_reportDate', school: 'vio_school', parentPhone: 'vio_parentPhone',
  description: 'vio_description', recommendation: 'vio_recommendation',
};

const currentArchive = () => getState().collections.violenceArchive ?? [];
const instName = () => { try { return getInstitution().getInstitutionName(); } catch (e) { return ''; } };
const logo = () => getLogo();
const refreshStats = () => { try { getSession().flow.updateDashboardStats(); } catch (e) { console.error(e); } };

const toggleIn = (list, x) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

function Section({ n, title, children }) {
  return (
    <div className="section-card">
      <div className="section-header" style={{ background: 'linear-gradient(90deg,#991b1b,#dc2626)' }}>
        <span className="step-badge" style={{ background: '#fca5a5', color: '#991b1b' }}>{n}</span> {title}
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

function ViolenceBody() {
  const active = useCurrentPortal() === 'violence';
  const [archive, setArchive] = useCollection('violenceArchive');
  const f = useRef({});
  const inited = useRef(false); // vioInitialized القديمة: تاريخ الإخبار = اليوم عند أول فتح (وبعد «مسح الكل»)
  const [types, setTypes] = useState([]);
  const [sources, setSources] = useState([]);
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('');
  const [procRows, setProcRows] = useState(blankProcRows);
  const [editId, setEditId] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [search, setSearch] = useState('');

  const ref = (k) => (el) => { f.current[k] = el; };
  const readText = () => {
    const o = {};
    for (const k of Object.keys(TEXT_IDS)) o[k] = f.current[k] ? f.current[k].value : '';
    return o;
  };
  const writeText = (vals) => { for (const k of Object.keys(TEXT_IDS)) if (f.current[k]) f.current[k].value = vals[k] || ''; };
  const readForm = () => ({ ...readText(), types, sources, location, priority, procRows });
  const persist = (next) => setArchive(next).catch((e) => { console.error(e); alert('❌ فشل حفظ البيانات'); });

  // initViolence القديمة
  const initDate = () => { if (f.current.reportDate) f.current.reportDate.value = todayIso(); };
  useEffect(() => {
    if (!active) return;
    AC_CFGS.forEach((cfg) => { try { acSetup(cfg); } catch (e) { console.error(e); } });
    if (!inited.current) { inited.current = true; initDate(); }
  }, [active]);

  // مسح كل الحقول والخيارات وجدول الإجراءات (vioCancelEdit القديمة) — بلا استعادة المؤسسة والتاريخ
  const wipe = () => {
    writeText({});
    setTypes([]); setSources([]); setLocation(''); setPriority('');
    setProcRows(blankProcRows());
  };

  const clearAll = () => {
    if (!confirm(MSG.CONFIRM_CLEAR_ALL)) return;
    wipe();
    if (f.current.school) f.current.school.value = instName();
    inited.current = false; initDate(); inited.current = true; // vioInitialized=false; initViolence()
  };

  const doSave = (silent) => {
    const form = readForm();
    const r = saveEntry(currentArchive(), form);
    if (!r) { if (!silent) alert(MSG.NAME_FIRST); return; }
    persist(r.archive);
    refreshStats();
    setArchiveOpen(true);
    try { getSession().archives.autoLogTask(...taskLogArgs(r.entry)); } catch (e) { if (!silent) console.error(e); }
  };

  const generateReport = () => {
    const form = readForm();
    if (!String(form.studentName || '').trim()) { alert(MSG.NAME_FIRST); return; }
    openPreview('violence', reportHtml(form, { logo: logo() }));
    // ✅ حفظ تلقائي في الأرشيف عند إنشاء التقرير (كالقديم: في كل مرة)
    try { doSave(true); } catch (e) { console.error(e); }
  };

  const loadEntry = (id) => {
    const e = currentArchive().find((x) => x.id === id);
    if (!e) return;
    try { document.querySelector('#toolViolence .main-container')?.scrollTo(0, 0); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { /* لا شيء */ }
    const v = formFromEntry(e);
    writeText(v);
    setLocation(v.location); setPriority(v.priority); setTypes(v.types); setProcRows(v.procRows);
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

  const rowSet = (i, field, value) => setProcRows((rows) => editProcRow(rows, i, field, value));
  const filtered = filterArchive(archive, search);

  return (
    <>
      {editId != null && (
        <div id="vioEditBar" style={{ position: 'sticky', top: 0, zIndex: 200, background: 'linear-gradient(135deg,#991b1b,#dc2626)', color: 'white', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', borderBottom: '3px solid #fcd34d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 700 }}>
            <span style={{ fontSize: '1.2rem' }}>✏️</span>
            <span>وضع التعديل — تم تحميل ملف حالة العنف. عدّل ما تريد ثم احفظ.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={updateCurrent} style={{ background: '#fcd34d', color: '#1a3a5c', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: "'Cairo',sans-serif", fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer' }}>💾 حفظ التعديلات</button>
            <button type="button" onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '8px 14px', fontFamily: "'Cairo',sans-serif", fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>✕ إلغاء</button>
          </div>
        </div>
      )}

      <div className="info-box" style={{ background: '#fff1f2', borderColor: '#fca5a5', color: '#991b1b' }}>
        🛡️ <span>هذا النموذج مخصص لتوثيق حالات العنف المدرسي والأسري والإلكتروني، وتسجيل الإجراءات الوقائية والتنسيق مع المصالح المختصة.</span>
      </div>

      <Section n="١" title="معلومات الشخص المعنِّف والشخص الذي تعرّض للعنف">
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991b1b', marginBottom: 8 }}>🔴 الشخص المعنِّف</div>
        <div className="form-grid cols-3">
          <div className="form-group"><label>الاسم الشخصي والعائلي</label><input ref={ref('aggName')} type="text" id="vio_agg_name" placeholder="الاسم الكامل للشخص المعنِّف" /></div>
          <div className="form-group"><label>القسم</label><input ref={ref('aggLevel')} type="text" id="vio_agg_level" placeholder="مثال: 2APIC-3" /></div>
          <div className="form-group"><label>رقم مسار</label><input ref={ref('aggMassar')} type="text" id="vio_agg_massar" placeholder="رقم مسار الشخص المعنِّف" /></div>
        </div>
        <div className="divider" />
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991b1b', marginBottom: 8 }}>🟠 الشخص الذي تعرّض للعنف</div>
        <div className="form-grid cols-3">
          <div className="form-group"><label>الاسم الشخصي والعائلي *</label><input ref={ref('studentName')} type="text" id="vio_studentName" placeholder="الاسم الكامل" /></div>
          <div className="form-group"><label>القسم</label><input ref={ref('level')} type="text" id="vio_level" placeholder="مثال: 2APIC-3" /></div>
          <div className="form-group"><label>رقم مسار</label><input ref={ref('massar')} type="text" id="vio_massar" placeholder="رقم مسار التلميذ" /></div>
        </div>
        <div className="divider" />
        <div className="form-grid">
          <div className="form-group"><label>تاريخ الإخبار</label><input ref={ref('reportDate')} type="date" id="vio_reportDate" /></div>
          <div className="form-group"><label>المؤسسة التعليمية</label><input ref={ref('school')} type="text" id="vio_school" defaultValue="" placeholder="اسم المؤسسة" /></div>
          <div className="form-group"><label>هاتف ولي الأمر</label><input ref={ref('parentPhone')} type="tel" id="vio_parentPhone" placeholder="06XXXXXXXX" /></div>
        </div>
      </Section>

      <Section n="٢" title="نوع العنف ووصف الحادثة">
        <div className="form-grid">
          <div className="form-group col-span-2">
            <label>نوع العنف (يمكن اختيار أكثر من نوع)</label>
            <div className="check-group">
              {TYPE_OPTIONS.map(([val, lbl]) => (
                <label key={val}><input type="checkbox" name="vio_type" value={val} checked={types.includes(val)} onChange={() => setTypes((t) => toggleIn(t, val))} /> {lbl}</label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label>مكان وقوع الحادثة</label>
            <div className="radio-group">
              {LOCATION_OPTIONS.map(([val, lbl]) => (
                <label key={val}><input type="radio" name="vio_location" value={val} checked={location === val} onChange={() => setLocation(val)} /> {lbl}</label>
              ))}
            </div>
          </div>
          <div className="form-group col-span-2"><label>وصف الحادثة (تفاصيل ما جرى)</label>
            <textarea ref={ref('description')} id="vio_description" style={{ minHeight: 100 }} placeholder="اكتب وصفاً دقيقاً للحادثة كما أُبلغ عنها أو كما رُصدت..." />
          </div>
          <div className="form-group col-span-2"><label>مصدر الإبلاغ</label>
            <div className="check-group">
              {SOURCE_OPTIONS.map(([val, lbl]) => (
                <label key={val}><input type="checkbox" name="vio_report_source" value={val} checked={sources.includes(val)} onChange={() => setSources((s) => toggleIn(s, val))} /> {lbl}</label>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section n="٣" title="الإجراءات المتخذة">
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>حدّد الإجراء المتخذ ثم أدخل <strong>التاريخ</strong> و<strong>الملاحظات</strong> (تُحدَّد الخانة تلقائياً عند الكتابة).</div>
        <div style={{ overflowX: 'auto' }}>
          <table id="vio-summary-table" className="iproc-table">
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
                const p = r.custom ? null : VIO_PROCS.find((x) => x.key === r.key);
                return (
                  <tr key={r.custom ? 'c' + i : r.key} data-key={r.custom ? undefined : r.key} data-custom={r.custom ? '1' : undefined}>
                    <td className="c"><input type="checkbox" id={r.custom ? undefined : 'vio_chk_' + r.key} checked={r.checked} onChange={(e) => rowSet(i, 'checked', e.target.checked)} /></td>
                    {r.custom ? (
                      <td>
                        <div className="iproc-namewrap">
                          <input type="text" className="iproc-name" placeholder="اسم الإجراء..." value={r.name} onChange={(e) => rowSet(i, 'name', e.target.value)} />
                          <button type="button" className="iproc-del" title="حذف" onClick={() => setProcRows((rows) => rows.filter((_, j) => j !== i))}>✕</button>
                        </div>
                      </td>
                    ) : <td className="nm">{p.label}</td>}
                    <td><input type="date" id={r.custom ? undefined : 'vio_pdate_' + r.key} value={r.date} onChange={(e) => rowSet(i, 'date', e.target.value)} /></td>
                    <td><input type="text" className="iproc-note" id={r.custom ? undefined : 'vio_pnote_' + r.key} placeholder={r.custom ? 'ملاحظات...' : p.ph} value={r.notes} onChange={(e) => rowSet(i, 'notes', e.target.value)} /></td>
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
          <div className="form-group"><label>درجة الأولوية</label>
            <div className="radio-group">
              {PRIORITY_OPTIONS.map(([val, lbl]) => (
                <label key={val}><input type="radio" name="vio_priority" value={val} checked={priority === val} onChange={() => setPriority(val)} /> {lbl}</label>
              ))}
            </div>
          </div>
          <div className="form-group col-span-2"><label>التوصية الختامية</label>
            <textarea ref={ref('recommendation')} id="vio_recommendation" placeholder="اكتب التوصية الختامية حول هذه الحالة..." />
          </div>
        </div>
      </Section>

      <div className="btn-row">
        <button type="button" className="btn btn-danger" onClick={clearAll}>🗑 مسح الكل</button>
        <button type="button" className="btn btn-success" onClick={() => doSave(false)}>🗄️ حفظ في الأرشيف</button>
        <button type="button" className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#991b1b,#dc2626)' }} onClick={generateReport}>📄 إنشاء التقرير ←</button>
      </div>

      <div className="archive-panel" style={{ marginTop: 6 }}>
        <div className="archive-header" onClick={() => setArchiveOpen((o) => !o)}>
          <div className="archive-header-left"><span>🗄️</span><span>سجل الأرشيف — ملفات العنف</span><span className="archive-badge" id="vioArchiveCount">{archive.length}</span></div>
          <span id="vioArchiveArrow">{archiveOpen ? '▲' : '▼'}</span>
        </div>
        <div className={'archive-body' + (archiveOpen ? ' open' : '')} id="vioArchiveBody">
          <div className="archive-search">
            <input type="text" id="vioArchiveSearch" placeholder="🔍 ابحث باسم التلميذ..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="btn-sm btn-sm-danger" onClick={clearArchive}>🗑 مسح الأرشيف</button>
          </div>
          <div id="vioArchiveList">
            {!filtered.length ? <div className="archive-empty">{MSG.EMPTY_LIST}</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table className="archive-table">
                  <thead><tr><th>#</th><th>اسم التلميذ(ة)</th><th>المؤسسة</th><th>الشخص المعنِّف</th><th>تاريخ الإخبار</th><th>نوع العنف</th><th>الأولوية</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {filtered.map((e, i) => (
                      <tr key={e.id}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>{i + 1}</td>
                        <td><strong style={{ color: '#991b1b' }}>🛡️ {e.studentName}</strong></td>
                        <td>{e.aggName && e.aggName !== '—' ? e.aggName : '—'}</td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>📅 {e.reportDate}</td>
                        <td>{(e.types || []).map((t, k) => <span key={k}><span className="archive-tag">{t}</span>{' '}</span>)}</td>
                        <td><span style={{ background: PRIO_COLORS[e.priority] || '#64748b', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>{e.priority}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                            <button type="button" className="btn-sm" title="تحميل للتعديل" onClick={() => loadEntry(e.id)}
                              style={{ background: 'linear-gradient(135deg,#2563a8,#1d4ed8)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: "'Cairo',sans-serif", fontWeight: 700 }}>✏️ تعديل</button>
                            <button type="button" className="btn-sm btn-sm-danger" title="حذف" onClick={() => del(e.id)}>🗑</button>
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

// المرحلة 19: حالات العنف — يُرسم داخل #mountViolence في صفحة toolViolence القديمة؛
// شريط العودة ونافذة المعاينة (#vioPrintModal) بقيا في body.html لارتباط الطباعة وWord بمعرّفاتها
export default function ViolencePortal({ mount }) {
  if (!mount) return null;
  return createPortal(<ViolenceBody />, mount);
}
