import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCollection, useCurrentPortal } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import {
  TAB_ASSOC, TAB_HEALTH, CHIP_PANELS, FIELD_IDS, REF_FIELDS, STATE_FIELDS, AC_CFGS, ARCHIVE_KEY, ARCHIVE_META, URGENCY_OPTIONS, MSG,
  todayIso, blankFields, blankProcs, blankTeachers, fillEmptyDates, formFromEntry, buildEntry, upsertEntry, deleteEntry, filterArchive,
  dfmt, chipOn, toggleChipText, syncTypeValue, reportHtml,
} from './printdocsLogic.js';
import { openPreview } from '../preview/previewStore.js';
import { acSetup } from '../autocomplete/studentAutocomplete.js';
import { showToast } from '../ui/toast.js';
import { getLogo } from '../settings/logoStore.js';
import { getInstitution } from '../institution/institutionStore.js';

const currentArchive = (n) => getState().collections[ARCHIVE_KEY[n]] ?? [];
const instName = () => { try { return getInstitution().getInstitutionName(); } catch (e) { return ''; } };
const logo = () => getLogo();
const dirName = () => { const el = document.querySelector('.dynamic-directorate'); const t = el ? el.textContent.trim() : ''; return t || 'مديرية الحي الحسني'; };
const toast = (m, type) => showToast(m, type || 'success');
const pick = (obj, ids) => { const o = {}; ids.forEach((id) => { o[id] = obj[id] ?? ''; }); return o; };
const stateFieldsOf = (n, today) => pick(blankFields(n, today), STATE_FIELDS[n]);

const THEME = {
  3: { grad: 'linear-gradient(90deg,#5b21b6,#7c3aed)', badgeBg: '#faf5ff', badgeFg: '#5b21b6', line: '#7c3aed', title: '#5b21b6', btn: 'linear-gradient(135deg,#5b21b6,#7c3aed)' },
  4: { grad: 'linear-gradient(90deg,#b91c1c,#dc2626)', badgeBg: '#fff1f2', badgeFg: '#b91c1c', line: '#b91c1c', title: '#b91c1c', btn: 'linear-gradient(135deg,#b91c1c,#dc2626)' },
};

const CELL_INPUT = { width: '100%', border: 'none', padding: '7px 10px', fontFamily: "'Cairo',sans-serif", fontSize: '0.8rem', outline: 'none', background: 'transparent', textAlign: 'center' };
const TEACHER_INPUT = { width: '100%', border: 'none', padding: '3px 6px', fontFamily: "'Cairo',sans-serif", fontSize: '0.8rem', outline: 'none', background: 'transparent', textAlign: 'center' };
const ADD_BTN = { marginTop: 6, background: '#fff5f5', border: '1.5px dashed #b91c1c', color: '#b91c1c', borderRadius: 8, padding: '4px 14px', fontFamily: "'Cairo',sans-serif", fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' };
const TH_HEALTH = { padding: '9px 12px', border: '1px solid #dc2626', textAlign: 'right', fontWeight: 700 };
const TH_TEACH = { padding: '8px 12px', border: '1px solid #dc2626', textAlign: 'center', fontWeight: 700 };
const TABLE_BASE = { width: '100%', borderCollapse: 'collapse', fontFamily: "'Cairo',sans-serif", fontSize: '0.82rem' };
const HEAD_ROW = { background: 'linear-gradient(90deg,#b91c1c,#dc2626)', color: 'white', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' };
const SIG_BOX = { border: '1px dashed var(--border)', borderRadius: 8, padding: 14 };
const ARCH_BTN = { border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: "'Cairo',sans-serif", fontWeight: 700, color: '#fff' };

function Section({ n, tab, title, children }) {
  const t = THEME[tab];
  return (
    <div className="section-card">
      <div className="section-header" style={{ background: t.grad }}><span className="step-badge" style={{ background: t.badgeBg, color: t.badgeFg }}>{n}</span> {title}</div>
      <div className="section-body">{children}</div>
    </div>
  );
}

function Letterhead({ tab, title, sub }) {
  const t = THEME[tab];
  return (
    <div className="pd-letterhead">
      <div style={{ textAlign: 'center', borderBottom: '2px solid ' + t.line, paddingBottom: 10, marginBottom: 14 }}>
        <div style={{ fontFamily: "'Amiri',serif", fontSize: '1.3rem', fontWeight: 700, color: t.title }}>{title}</div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{sub}</div>
      </div>
    </div>
  );
}

// لوحة اقتراحات قابلة للجمع: النقر يضيف الجملة إلى الحقل أو يحذفها (pdChips القديمة)
function Chips({ panel, text, onToggle, onClear }) {
  return (
    <div className="pd-chips pd-no-print" id={panel.box}>
      {panel.groups.map(([title, items]) => (
        <Fragment key={title}>
          <div className="pd-chip-title">{title}</div>
          {items.map(([lbl, txt]) => (
            <button key={lbl} type="button" className={'pd-chip' + (chipOn(text, txt) ? ' on' : '')} data-lbl={lbl} data-txt={txt} onClick={() => onToggle(txt)}>{lbl}</button>
          ))}
        </Fragment>
      ))}
      <button type="button" className="pd-chip pd-chip-clear" onClick={onClear}>✕ مسح النص</button>
    </div>
  );
}

function ArchivePanel({ n, archive, open, onToggle, search, onSearch, onClear, onLoad, onPreview, onDelete }) {
  const meta = ARCHIVE_META[n];
  const rows = filterArchive(archive, search);
  return (
    <div className="archive-panel pd-no-print" style={{ marginTop: 6 }}>
      <div className="archive-header" onClick={onToggle}>
        <div className="archive-header-left"><span>🗄️</span><span>سجل الأرشيف — {n === TAB_ASSOC ? 'ملفات الإحالة إلى الجمعيات' : 'ملفات الإخبار الصحي'}</span><span className="archive-badge" id={'pdArch' + n + 'Count'}>{archive.length}</span></div>
        <span id={'pdArch' + n + 'Arrow'}>{open ? '▲' : '▼'}</span>
      </div>
      <div className={'archive-body' + (open ? ' open' : '')} id={'pdArch' + n + 'Body'}>
        <div className="archive-search">
          <input type="text" id={'pdArch' + n + 'Search'} placeholder="🔍 ابحث باسم التلميذ(ة)..." value={search} onChange={(e) => onSearch(e.target.value)} />
          <button type="button" className="btn-sm btn-sm-danger" onClick={onClear}>🗑 مسح الأرشيف</button>
        </div>
        <div id={'pdArch' + n + 'List'}>
          {!rows.length ? (
            <div className="archive-empty">{search.trim() ? '🔍 لا توجد نتائج.' : <>📂 لا توجد ملفات محفوظة بعد.<br /><small>اضغط "حفظ في الأرشيف" لإضافة الملف الحالي.</small></>}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="archive-table">
                <thead><tr><th>#</th><th>اسم التلميذ(ة)</th><th>{meta.extraHead}</th><th>التاريخ</th><th>الاستعجالية</th><th>رقم الوثيقة</th><th>إجراء</th></tr></thead>
                <tbody>
                  {rows.map((e, i) => (
                    <tr key={e.id}>
                      <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>{i + 1}</td>
                      <td><strong style={{ color: meta.color }}>{meta.icon}{e.studentName}</strong></td>
                      <td>{e.extra || '—'}</td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>📅 {dfmt(e.date)}</td>
                      <td style={{ textAlign: 'center' }}>{e.urgency || '—'}</td>
                      <td style={{ textAlign: 'center' }}>{e.ref || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                          <button type="button" style={{ ...ARCH_BTN, background: 'linear-gradient(135deg,#2563a8,#1d4ed8)' }} title="تحميل للتعديل" onClick={() => onLoad(e.id)}>✏️</button>
                          <button type="button" style={{ ...ARCH_BTN, background: 'linear-gradient(135deg,#0f766e,#0d9488)' }} title="معاينة وطباعة" onClick={() => onPreview(e.id)}>🖨️</button>
                          <button type="button" style={{ ...ARCH_BTN, background: 'linear-gradient(135deg,#991b1b,#dc2626)' }} title="حذف" onClick={() => onDelete(e.id)}>🗑</button>
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
  );
}

function PrintdocsBody({ hero, mount }) {
  const active = useCurrentPortal() === 'printdocs';
  const [assocArchive, setAssocArchive] = useCollection(ARCHIVE_KEY[3]);
  const [healthArchive, setHealthArchive] = useCollection(ARCHIVE_KEY[4]);
  const archives = { 3: assocArchive, 4: healthArchive };
  const setters = { 3: setAssocArchive, 4: setHealthArchive };
  const refs = useRef({});

  const [tab, setTab] = useState(TAB_ASSOC);
  const [fields, setFields] = useState(() => { const t = todayIso(); return { 3: stateFieldsOf(3, t), 4: stateFieldsOf(4, t) }; });
  const [health, setHealth] = useState({ type: '', typeAuto: null, procs: blankProcs(), teachers: blankTeachers() });
  const [edit, setEdit] = useState({ 3: null, 4: null });
  const [open, setOpen] = useState({ 3: false, 4: false });
  const [search, setSearch] = useState({ 3: '', 4: '' });

  const ref = (id) => (el) => { refs.current[id] = el; };
  const bind = (n, id) => ({ id, value: fields[n][id], onChange: (e) => { const v = e.target.value; setFields((f) => ({ ...f, [n]: { ...f[n], [id]: v } })); } });
  const upd = (map, n, v) => ({ ...map, [n]: v });

  // pdInit القديمة: عند فتح البوابة نعود للتبويب الأول ونملأ تواريخ اليوم الفارغة، ونفعّل الإكمال التلقائي
  useEffect(() => {
    if (!active) return;
    setTab(TAB_ASSOC);
    setFields((f) => ({ 3: pick(fillEmptyDates(3, f[3]), STATE_FIELDS[3]), 4: pick(fillEmptyDates(4, f[4]), STATE_FIELDS[4]) }));
    try { AC_CFGS.forEach((cfg) => acSetup(cfg)); } catch (e) { console.error(e); }
  }, [active]);

  // النموذج كاملاً: حقول React + حقول الإكمال التلقائي (تُقرأ من DOM) + جداول التبويب الرابع
  const readForm = (n) => {
    const out = {};
    FIELD_IDS[n].forEach((id) => { out[id] = REF_FIELDS[n].includes(id) ? (refs.current[id] ? refs.current[id].value : '') : fields[n][id]; });
    const form = { fields: out };
    if (n === TAB_HEALTH) { form.type = health.type; form.procs = health.procs; form.teachers = health.teachers; }
    return form;
  };
  const applyForm = (n, form) => {
    REF_FIELDS[n].forEach((id) => { if (refs.current[id]) refs.current[id].value = form.fields[id] ?? ''; });
    setFields((f) => ({ ...f, [n]: pick(form.fields, STATE_FIELDS[n]) }));
    if (n === TAB_HEALTH) setHealth({ type: form.type, typeAuto: null, procs: form.procs, teachers: form.teachers });
  };
  const persist = (n, next) => setters[n](next).catch((e) => { console.error(e); alert('❌ فشل حفظ البيانات'); });

  const clearTab = (n) => {
    const blank = { ...blankFields(n, todayIso()) };
    const school = FIELD_IDS[n].find((id) => /-school$/.test(id));
    blank[school] = instName();
    REF_FIELDS[n].forEach((id) => { if (refs.current[id]) refs.current[id].value = blank[id]; });
    setFields((f) => ({ ...f, [n]: pick(blank, STATE_FIELDS[n]) }));
    if (n === TAB_HEALTH) setHealth({ type: '', typeAuto: null, procs: blankProcs(), teachers: blankTeachers() });
    setSearch((s) => upd(s, n, ''));
    setEdit((e) => upd(e, n, null));
  };

  const save = (n) => {
    const entry = buildEntry(n, readForm(n));
    if (!entry) { alert(MSG.NAME_FIRST); return; }
    const r = upsertEntry(currentArchive(n), entry, edit[n]);
    persist(n, r.archive);
    setEdit((e) => upd(e, n, null));
    setOpen((o) => upd(o, n, true));
    toast(r.updated ? MSG.UPDATED(r.entry.studentName) : MSG.SAVED(r.entry.studentName));
  };

  const generate = (n, form = readForm(n)) => {
    openPreview('printdocs', reportHtml(n, form, { logo: logo(), dir: dirName() }), { title: MSG.MODAL_TITLE[n], word: MSG.WORD_FILE[n] });
  };

  const loadEntry = (n, id) => {
    const e = currentArchive(n).find((x) => x.id === id);
    if (!e) return;
    applyForm(n, formFromEntry(n, e));
    setEdit((s) => upd(s, n, id));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const previewEntry = (n, id) => {
    const e = currentArchive(n).find((x) => x.id === id);
    if (!e) return;
    const form = formFromEntry(n, e);
    applyForm(n, form);
    setEdit((s) => upd(s, n, id));
    generate(n, form);
  };
  const delEntry = (n, id) => {
    if (!confirm(MSG.CONFIRM_DELETE)) return;
    persist(n, deleteEntry(currentArchive(n), id));
    setEdit((s) => (s[n] === id ? upd(s, n, null) : s));
  };
  const clearArchive = (n) => {
    const cur = currentArchive(n);
    if (!cur.length) { alert(MSG.EMPTY_ARCHIVE); return; }
    if (!confirm(MSG.CONFIRM_CLEAR_ARCHIVE(cur.length))) return;
    persist(n, []);
    setEdit((s) => upd(s, n, null));
  };

  // اقتراحات الحالة الصحية: تعدّل الوصف وتزامن «نوع الحالة» تلقائياً (syncType القديمة)
  const setDesc = (desc) => {
    setFields((f) => ({ ...f, 4: { ...f[4], 'pd4-health-desc': desc } }));
    setHealth((h) => { const r = syncTypeValue(h.type, h.typeAuto, desc); return { ...h, type: r.type, typeAuto: r.auto }; });
  };
  const toggleIn = (n, id) => (txt) => setFields((f) => ({ ...f, [n]: { ...f[n], [id]: toggleChipText(f[n][id], txt) } }));
  const clearIn = (n, id) => () => setFields((f) => ({ ...f, [n]: { ...f[n], [id]: '' } }));

  const setList = (key, i, v) => setHealth((h) => ({ ...h, [key]: h[key].map((x, j) => (j === i ? v : x)) }));
  const tabStyle = (n) => ({
    flex: 1, padding: '11px 6px', border: 'none', fontFamily: "'Cairo',sans-serif", fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
    background: tab === n ? 'rgba(255,255,255,0.22)' : 'transparent',
    borderBottom: '3px solid ' + (tab === n ? '#7fd8ff' : 'transparent'),
    color: tab === n ? '#ffffff' : 'rgba(255,255,255,0.55)',
    fontWeight: tab === n ? 800 : 700,
  });
  const pill = { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: '0.68rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 };
  const urgency = (n) => (
    <select {...bind(n, 'pd' + n + '-urgency')}>
      <option value="">— اختر —</option>
      {URGENCY_OPTIONS[n].map((o) => <option key={o}>{o}</option>)}
    </select>
  );
  const archiveProps = (n) => ({
    n, archive: archives[n], open: open[n], onToggle: () => setOpen((o) => upd(o, n, !o[n])),
    search: search[n], onSearch: (v) => setSearch((s) => upd(s, n, v)), onClear: () => clearArchive(n),
    onLoad: (id) => loadEntry(n, id), onPreview: (id) => previewEntry(n, id), onDelete: (id) => delEntry(n, id),
  });
  const buttons = (n) => (
    <div className="btn-row pd-no-print">
      <button type="button" className="btn btn-outline" onClick={() => clearTab(n)}>🗑️ مسح البيانات</button>
      <button type="button" className="btn btn-success" onClick={() => save(n)}>🗄️ حفظ في الأرشيف</button>
      <button type="button" className="btn" style={{ background: THEME[n].btn, color: 'white' }} onClick={() => generate(n)}>👁️ معاينة وإنشاء الوثيقة</button>
    </div>
  );

  return (
    <>
      {/* شريط البوابة: عنوان + تبويبان (خلفيته وحشوته في #mountPrintdocsHero بـbody.html) */}
      {createPortal(<>
        <div style={{ position: 'absolute', top: -50, left: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,169,74,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 18 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(200,169,74,0.15)', border: '2px solid rgba(200,169,74,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>🏥</div>
          <div>
            <div style={{ fontFamily: "'Amiri',serif", fontSize: '1.3rem', color: '#f0d97a', fontWeight: 700, marginBottom: 4 }}>بوابة الإحالة والإخبار الصحي</div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>نماذج رسمية جاهزة للطباعة — املأها يدوياً أو إلكترونياً</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <span style={pill}>🏛️ إحالة لجمعية</span>
              <span style={pill}>🏥 إخبار صحي</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, overflow: 'hidden', background: 'rgba(255,255,255,0.07)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <button type="button" id="pdTab3" onClick={() => setTab(TAB_ASSOC)} style={tabStyle(3)}>🏛️ إحالة لجمعية</button>
          <button type="button" id="pdTab4" onClick={() => setTab(TAB_HEALTH)} style={tabStyle(4)}>🏥 إخبار صحي</button>
        </div>
      </>, hero)}

      {/* النماذج (الحاوية .main-container نفسها هي #mountPrintdocs) */}
      {createPortal(<>
        {/* ══ التبويب 3 — نموذج الإحالة إلى جمعية ══ (يبقى مرسوماً ومخفياً كالقديم لتبقى بياناته وحقول الإكمال التلقائي) */}
        <div id="pdPanel3" style={{ display: tab === TAB_ASSOC ? 'block' : 'none' }}>
          <Letterhead tab={3} title="نموذج الإحالة إلى جمعية" sub="Fiche d'orientation vers une association" />

          <Section n="1" tab={3} title="بيانات الإحالة">
            <div className="form-grid cols-3">
              <div className="form-group"><label>📅 تاريخ الإحالة</label><input type="date" {...bind(3, 'pd3-date')} /></div>
              <div className="form-group"><label>🔢 رقم الإحالة</label><input type="text" placeholder="إ.ج / ٢٠٢٥ - " {...bind(3, 'pd3-ref')} /></div>
              <div className="form-group"><label>⚡ درجة الاستعجالية</label>{urgency(3)}</div>
            </div>
          </Section>

          <Section n="2" tab={3} title="بيانات المستفيد">
            <div className="form-grid">
              <div className="form-group"><label>👤 الاسم الكامل</label><input ref={ref('pd3-name')} type="text" id="pd3-name" placeholder="ابدأ بالكتابة للبحث في قائمة التلاميذ..." autoComplete="off" defaultValue="" /></div>
              <div className="form-group"><label>📆 تاريخ الازدياد</label><input ref={ref('pd3-dob')} type="date" id="pd3-dob" defaultValue="" /></div>
              <div className="form-group"><label>🏫 المؤسسة التعليمية</label><input ref={ref('pd3-school')} type="text" id="pd3-school" placeholder="اسم المؤسسة" defaultValue="" /></div>
              <div className="form-group"><label>🎓 القسم</label><input ref={ref('pd3-level')} type="text" id="pd3-level" placeholder="القسم" defaultValue="" /></div>
              <div className="form-group"><label>👨‍👩‍👦 اسم الولي</label><input type="text" placeholder="اسم الولي" {...bind(3, 'pd3-parent')} /></div>
              <div className="form-group"><label>📞 هاتف الولي</label><input type="tel" placeholder="06XXXXXXXX" dir="ltr" {...bind(3, 'pd3-phone')} /></div>
            </div>
          </Section>

          <Section n="3" tab={3} title="بيانات الجمعية المُحال إليها">
            <div className="form-grid">
              <div className="form-group"><label>🏛️ اسم الجمعية</label><input type="text" placeholder="الاسم الكامل للجمعية" {...bind(3, 'pd3-assoc')} /></div>
              <div className="form-group"><label>📍 العنوان</label><input type="text" placeholder="العنوان الكامل" {...bind(3, 'pd3-assoc-addr')} /></div>
              <div className="form-group"><label>📞 هاتف الجمعية</label><input type="tel" placeholder="رقم الهاتف" dir="ltr" {...bind(3, 'pd3-assoc-phone')} /></div>
            </div>
          </Section>

          <Section n="4" tab={3} title="سبب الإحالة والوضعية">
            <div className="form-grid cols-1">
              <div className="form-group">
                <label>📝 ملخص الوضعية وأسباب الإحالة</label>
                <Chips panel={CHIP_PANELS.reason} text={fields[3]['pd3-reason']} onToggle={toggleIn(3, 'pd3-reason')} onClear={clearIn(3, 'pd3-reason')} />
                <textarea rows={4} className="large" placeholder="وصف مفصّل للوضعية والمشكلة التي دعت إلى الإحالة..." {...bind(3, 'pd3-reason')} />
              </div>
              <div className="form-group">
                <label>🛠️ الإجراءات السابقة المتخذة داخل المؤسسة</label>
                <Chips panel={CHIP_PANELS.prev} text={fields[3]['pd3-prev-actions']} onToggle={toggleIn(3, 'pd3-prev-actions')} onClear={clearIn(3, 'pd3-prev-actions')} />
                <textarea rows={3} placeholder="ما تم اتخاذه من إجراءات قبل قرار الإحالة..." {...bind(3, 'pd3-prev-actions')} />
              </div>
            </div>
          </Section>

          <Section n="5" tab={3} title="التواريخ والتوقيعات">
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group"><label>📅 تاريخ استلام الجمعية للإحالة</label><input type="date" {...bind(3, 'pd3-ref-date')} /></div>
            </div>
          </Section>

          {buttons(3)}
          <ArchivePanel {...archiveProps(3)} />
        </div>

        {/* ══ التبويب 4 — وثيقة إخبار بحالة صحية ══ */}
        <div id="pdPanel4" style={{ display: tab === TAB_HEALTH ? 'block' : 'none' }}>
          <Letterhead tab={4} title="وثيقة إخبار بحالة صحية" sub="Document de notification de situation de santé" />

          <Section n="1" tab={4} title="بيانات الوثيقة">
            <div className="form-grid cols-3">
              <div className="form-group"><label>تاريخ الإخبار</label><input type="date" {...bind(4, 'pd4-date')} /></div>
              <div className="form-group"><label>رقم الوثيقة</label><input type="text" placeholder="و.ص / ٢٠٢٥ - " {...bind(4, 'pd4-ref')} /></div>
              <div className="form-group"><label>درجة الاستعجالية</label>{urgency(4)}</div>
            </div>
          </Section>

          <Section n="2" tab={4} title="بيانات التلميذ(ة)">
            <div className="form-grid">
              <div className="form-group"><label>الاسم الكامل للتلميذ(ة)</label><input ref={ref('pd4-name')} type="text" id="pd4-name" placeholder="ابدأ بالكتابة للبحث في قائمة التلاميذ..." autoComplete="off" defaultValue="" /></div>
              <div className="form-group"><label>تاريخ الازدياد</label><input ref={ref('pd4-dob')} type="date" id="pd4-dob" defaultValue="" /></div>
              <div className="form-group"><label>المؤسسة التعليمية</label><input ref={ref('pd4-school')} type="text" id="pd4-school" placeholder="اسم المؤسسة الكاملة" defaultValue="" /></div>
              <div className="form-group"><label>المستوى</label><input type="text" placeholder="مثال: الثالثة إعدادي" {...bind(4, 'pd4-grade')} /></div>
              <div className="form-group"><label>القسم</label><input ref={ref('pd4-level')} type="text" id="pd4-level" placeholder="مثال: 3/2" defaultValue="" /></div>
              <div className="form-group"><label>رمز مسار</label><input ref={ref('pd4-massar')} type="text" id="pd4-massar" placeholder="G123456789" defaultValue="" /></div>
            </div>
          </Section>

          <Section n="3" tab={4} title="الحالة الصحية">
            <div className="form-grid cols-1" style={{ marginBottom: 12 }}>
              <div className="form-group">
                <label>وصف الحالة الصحية بشكل مفصّل</label>
                <Chips panel={CHIP_PANELS.health} text={fields[4]['pd4-health-desc']}
                  onToggle={(txt) => setDesc(toggleChipText(fields[4]['pd4-health-desc'], txt))} onClear={() => setDesc('')} />
                <textarea rows={6} className="large" placeholder="وصف دقيق للحالة الصحية المُشار إليها، والأعراض والمدة..." style={{ minHeight: 110 }} {...bind(4, 'pd4-health-desc')} />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#b91c1c', marginBottom: 8 }}>نوع الحالة والإجراءات اللازمة داخل القسم:</div>
              <table id="pd4-health-table" style={TABLE_BASE}>
                <thead>
                  <tr style={HEAD_ROW}>
                    <th style={{ ...TH_HEALTH, width: '35%' }}>نوع الحالة</th>
                    <th style={{ ...TH_HEALTH, width: '65%' }}>الإجراءات التي يجب أن تستفيد منها الحالة داخل القسم</th>
                  </tr>
                </thead>
                <tbody id="pd4-health-tbody">
                  {health.procs.map((v, i) => (
                    <tr key={i} style={i % 2 === 1 ? { background: '#fff5f5' } : undefined}>
                      {i === 0 && (
                        <td rowSpan={health.procs.length} style={{ border: '1px solid #fecaca', padding: 0, verticalAlign: 'middle', textAlign: 'center' }}>
                          <textarea style={{ ...CELL_INPUT, fontSize: '0.8rem', resize: 'none', minHeight: 90 }} placeholder="نوع الحالة..." value={health.type} onChange={(e) => { const t = e.target.value; setHealth((h) => ({ ...h, type: t })); }} />
                        </td>
                      )}
                      <td style={{ border: '1px solid #fecaca', padding: 0, textAlign: 'center' }}>
                        <input type="text" style={CELL_INPUT} placeholder={i < 3 ? 'الإجراء ' + (i + 1) + '...' : 'الإجراء المطلوب...'} value={v} onChange={(e) => setList('procs', i, e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" className="pd-no-print" style={ADD_BTN} onClick={() => setHealth((h) => ({ ...h, procs: [...h.procs, ''] }))}>+ إضافة إجراء</button>
            </div>
          </Section>

          <Section n="4" tab={4} title="توقيعات الأساتذة">
            <table style={TABLE_BASE}>
              <thead>
                <tr style={{ ...HEAD_ROW }}>
                  <th style={{ ...TH_TEACH, width: '55%' }}>اسم الأستاذ(ة)</th>
                  <th style={{ ...TH_TEACH, width: '45%' }}>التوقيع</th>
                </tr>
              </thead>
              <tbody id="pd4-teachers-tbody">
                {health.teachers.map((v, i) => (
                  <tr key={i} style={{ height: 36, ...(i % 2 === 1 ? { background: '#fff5f5' } : null) }}>
                    <td style={{ border: '1px solid #fecaca', padding: '4px 8px', textAlign: 'center' }}>
                      <input type="text" style={TEACHER_INPUT} placeholder="الاسم الكامل..." value={v} onChange={(e) => setList('teachers', i, e.target.value)} />
                    </td>
                    <td style={{ border: '1px solid #fecaca' }} />
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="pd-no-print" style={ADD_BTN} onClick={() => setHealth((h) => ({ ...h, teachers: [...h.teachers, ''] }))}>+ إضافة أستاذ(ة)</button>
          </Section>

          <Section n="5" tab={4} title="التوقيعات والختم">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 4 }}>
              <div style={{ ...SIG_BOX, minHeight: 70 }}><div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b91c1c', marginBottom: 6 }}>المختص الاجتماعي</div></div>
              <div style={{ ...SIG_BOX, minHeight: 70 }}><div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b91c1c', marginBottom: 6 }}>مدير المؤسسة</div></div>
            </div>
          </Section>

          {buttons(4)}
          <ArchivePanel {...archiveProps(4)} />
        </div>
      </>, mount)}
    </>
  );
}

// المرحلة 24: بوابة الإحالة والإخبار الصحي — تُرسم داخل عنصرين في صفحة toolPrintdocs القديمة:
// #mountPrintdocsHero (شريط العنوان والتبويبان) و#mountPrintdocs (النماذج)، وكلاهما ابن مباشر لـ.tool-page لتنطبق عليهما قواعد العرض.
// شريط العودة ونافذة المعاينة (#pdPrintModal) بقيا في body.html لارتباط الطباعة وWord بمعرّفاتها
export default function PrintdocsPortal({ hero, mount }) {
  if (!hero || !mount) return null;
  return <PrintdocsBody hero={hero} mount={mount} />;
}
