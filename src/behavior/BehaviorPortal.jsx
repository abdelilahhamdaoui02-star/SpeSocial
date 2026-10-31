import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCollection, useCurrentPortal, useProfile, useStudents } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import * as B from './behaviorLogic.js';
import { printBehaviorReport, exportBehaviorWord } from './behaviorPrint.js';
import { acFillField, acSetup } from '../autocomplete/studentAutocomplete.js';
import { cleanClassValue } from '../students/cleanClass.js';
import { openPortal } from '../navigation.js';
import { getLogo } from '../settings/logoStore.js';
import { getInstitution } from '../institution/institutionStore.js';

// الإكمال التلقائي للتلاميذ ما زال من الكود القديم (acSetup/acFillField)؛ نمرّر له حقول البوابة نفسها
const AC_CFG = { nameId: 'bm_name', massarId: 'bm_massar', schoolId: 'bm_school', levelId: 'bm_level' };
const EMPTY = [];
const EMPTY_EV = () => ({ dims: {}, note: '' });
const SEL = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 11px', fontFamily: "'Cairo',sans-serif", fontSize: '0.875rem', color: 'var(--text)', background: '#fafbfc', direction: 'rtl', width: '100%' };
const IV_STATUS_COLOR = { 'مقترح': '#64748b', 'قيد التنفيذ': '#d97706', 'أُنجز': '#16a34a' };

// دائماً من المخزن لحظة الحدث لا من آخر رسم
const getFiles = () => getState().collections.behaviorFiles ?? EMPTY;
const say = (m) => window.alert(m);
const ask = (m) => window.confirm(m);
const logo = () => getLogo();
const cleanClass = cleanClassValue;
const instName = () => { try { return getInstitution().getInstitutionName(); } catch (e) { return ''; } };

// ── أزرار صغيرة بنفس أنماط القديم ──
const chipStyle = { background: '#f0fdf4', color: '#166534', border: '1.5px solid #bbf7d0', borderRadius: 20, padding: '3px 12px', fontFamily: "'Cairo',sans-serif", fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', margin: 2 };
const Chip = ({ onClick, children }) => <button type="button" onClick={onClick} style={chipStyle}>{children}</button>;
const sugBox = { marginTop: 6, background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: 10, padding: '8px 12px' };
const cardBtn = (bg, color, border) => ({ background: bg, color, border: '1px solid ' + border, borderRadius: 8, padding: '5px 12px', fontFamily: "'Cairo',sans-serif", fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' });

// ── التقييم النفسي (التقييم السريع سابقًا) ──
function EvalDim({ d, v, onChange }) {
  const set = (patch) => onChange({ lv: '', items: [], note: '', ...v, ...patch });
  const items = v.items || [];
  return (
    <div className="bm-ev-dim">
      <div className="bm-ev-t">{d.l}</div>
      <div className="radio-group">
        {B.BM_EV_LV.map((l) => (
          <label key={l[0]}><input type="radio" name={'bm_ev_' + d.k} value={l[0]} checked={v.lv === l[0]} onChange={() => set({ lv: l[0] })} /> {l[2]} {l[1]}</label>
        ))}
      </div>
      <div className="radio-group">
        {d.items.map((it) => (
          <label key={it}><input type="checkbox" name={'bm_ev_' + d.k + '_i'} value={it} checked={items.includes(it)}
            onChange={(e) => set({ items: e.target.checked ? items.concat([it]) : items.filter((x) => x !== it) })} /> {it}</label>
        ))}
      </div>
      <input type="text" id={'bm_ev_' + d.k + '_n'} placeholder="ملاحظة (اختياري)" value={v.note || ''} onChange={(e) => set({ note: e.target.value })} />
    </div>
  );
}

// ── سطر في جدول التدخل: نص الإجراء يُحفظ عند مغادرة الحقل، والبقية عند التغيير ──
function IvRow({ it, i, onPatch, onDel }) {
  const [txt, setTxt] = useState(it.action);
  useEffect(() => { setTxt(it.action); }, [it.action]);
  const respOpts = B.BM_IV_RESP.includes(it.resp) || !it.resp ? B.BM_IV_RESP : B.BM_IV_RESP.concat([it.resp]);
  return (
    <tr>
      <td style={{ textAlign: 'center' }}>{i + 1}</td>
      <td>
        <textarea value={txt} style={{ ...SEL, minHeight: 44, resize: 'vertical' }}
          onChange={(e) => setTxt(e.target.value)}
          onBlur={() => { const v = txt.trim(); if (!v) setTxt(it.action); else if (v !== it.action) onPatch(it.id, { action: v }); }} />
      </td>
      <td>
        <select style={SEL} value={it.resp || respOpts[0]} onChange={(e) => onPatch(it.id, { resp: e.target.value })}>
          {respOpts.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </td>
      <td><input type="date" style={SEL} value={it.date || ''} onChange={(e) => onPatch(it.id, { date: e.target.value })} /></td>
      <td>
        <select style={{ ...SEL, color: IV_STATUS_COLOR[it.status] || 'var(--text)', fontWeight: 700 }} value={it.status || B.BM_IV_STATUS[0]} onChange={(e) => onPatch(it.id, { status: e.target.value })}>
          {B.BM_IV_STATUS.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </td>
      <td style={{ textAlign: 'center' }}><button type="button" onClick={() => onDel(it)} title="حذف الإجراء" style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1rem' }}>✕</button></td>
    </tr>
  );
}

function BehaviorBody() {
  const active = useCurrentPortal() === 'behavior';
  const [files, setFiles] = useCollection('behaviorFiles');
  const profile = useProfile();
  const students = useStudents();
  const dbReady = students.length > 0;

  const nameRef = useRef(null);
  const massarRef = useRef(null);
  const schoolRef = useRef(null);
  const levelRef = useRef(null);
  const pickerRef = useRef(null);
  const timer = useRef(null);
  const seq = useRef(0);
  const hadFile = useRef(false);

  // الاسم والمسار والمؤسسة حقول غير متحكَّم بها: الإكمال التلقائي القديم يكتب فيها مباشرة بلا أحداث، فنقرؤها عند الحاجة
  const [ident, setIdent] = useState({ name: '', massar: '', level: '' });
  const [startDate, setStartDate] = useState(() => B.bmLIso(new Date()));
  const [week, setWeek] = useState(() => B.bmMonday());
  const [evOpen, setEvOpen] = useState(true);
  const [evDate, setEvDate] = useState(() => B.bmLIso(new Date()));
  const [evForm, setEvForm] = useState(EMPTY_EV);
  const [gk, setGk] = useState('con');
  const [gsel, setGsel] = useState('');
  const [gother, setGother] = useState('');
  const [ivText, setIvText] = useState('');
  const [q, setQ] = useState('');

  const readIdent = () => {
    const v = {
      name: ((nameRef.current && nameRef.current.value) || '').trim(),
      massar: ((massarRef.current && massarRef.current.value) || '').trim(),
      level: ((levelRef.current && levelRef.current.value) || '').trim(),
    };
    setIdent((p) => (p.name === v.name && p.massar === v.massar && p.level === v.level ? p : v));
    return v;
  };
  const later = () => { clearTimeout(timer.current); timer.current = setTimeout(readIdent, 250); };
  useEffect(() => () => clearTimeout(timer.current), []);

  const curFile = useMemo(() => B.bmFindCurFile(files, ident.name, ident.massar), [files, ident.name, ident.massar]);
  const foundStudent = useMemo(() => B.bmFindStudentIn(students, ident.massar, ident.name), [students, ident.massar, ident.name]);

  // ── القسم وتلاميذه ──
  const levels = useMemo(() => {
    const seen = {}, vals = [];
    students.forEach((s) => { const c = cleanClass(s.class); if (c && !seen[B.bmNz(c)]) { seen[B.bmNz(c)] = 1; vals.push(c); } });
    vals.sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
    return vals;
  }, [students]);
  const levelOptions = ident.level && !levels.includes(ident.level) ? levels.concat([ident.level]) : levels;
  const stuList = useMemo(() => {
    if (!ident.level) return [];
    const out = [];
    students.forEach((s, i) => { if (B.bmNz(cleanClass(s.class)) === B.bmNz(ident.level)) out.push([i, s]); });
    return out;
  }, [students, ident.level]);
  const stuValue = foundStudent && stuList.some(([, s]) => s === foundStudent) ? String(students.indexOf(foundStudent)) : '';

  const fillFrom = (s) => {
    acFillField(AC_CFG, s);
    const lv = cleanClass(s.class);
    setIdent({ name: String(s.fullName || '').trim(), massar: String(s.massar || '').trim(), level: lv || ident.level });
  };
  const pickStudent = (i) => { if (i === '') return; const s = students[+i]; if (s) fillFrom(s); };

  // ── فتح البوابة: أسبوع اليوم، المؤسسة من الملف الشخصي، تفعيل الإكمال التلقائي ──
  useEffect(() => {
    if (!active) return;
    setWeek(B.bmMonday());
    if (schoolRef.current && !schoolRef.current.value) schoolRef.current.value = profile.institution || profile.school || '';
    readIdent();
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    try { acSetup(AC_CFG); } catch (e) { console.error(e); }
  }, [active, students.length]);

  // ── تاريخ بداية الرصد: يُحمَّل من الملف عند تغيّره، ويعود لليوم عند الانتقال إلى تلميذ بلا ملف ──
  const loadKey = curFile ? 'f' + curFile.id : 'n:' + B.bmNz(ident.name);
  useEffect(() => {
    if (curFile) { setStartDate(B.bmStartOf(curFile) || B.bmLIso(new Date())); hadFile.current = true; }
    else if (hadFile.current) { setStartDate(B.bmLIso(new Date())); hadFile.current = false; }
  }, [loadKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const onStartDate = (e) => {
    const v = e.target.value; setStartDate(v);
    if (curFile && v) commit(getFiles().map((x) => (x.id === curFile.id ? B.bmSetStart(x, v) : x)));
  };

  // ── التقييم النفسي: يُحمَّل المحفوظ عند تغيّر التلميذ أو التاريخ ──
  const evKey = B.bmNz(ident.name) + '|' + evDate;
  useEffect(() => {
    const ev = B.bmEvFind(curFile, evDate);
    const dims = {};
    if (ev && ev.dims) Object.keys(ev.dims).forEach((k) => { const v = ev.dims[k] || {}; dims[k] = { lv: v.lv || '', items: v.items || [], note: v.note || '' }; });
    setEvForm({ dims, note: ev ? (ev.note || '') : '' });
  }, [evKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const evSaved = !!B.bmEvFind(curFile, evDate);
  const evLevels = {};
  B.BM_EV_DIMS.forEach((d) => { evLevels[d.k] = (evForm.dims[d.k] || {}).lv || ''; });

  // ── إيجاد الملف الحالي أو إنشاؤه — تعيد { files, file, created } أو null بعد تنبيه ──
  const ensureFile = () => {
    const v = readIdent();
    const files0 = getFiles();
    const f = B.bmFindCurFile(files0, v.name, v.massar);
    if (f) return { files: files0, file: f, created: false };
    if (!v.name) { say('⚠️ اختر التلميذ(ة) أولاً (اكتب الاسم أو اختر من القسم).'); return null; }
    const db = getState().students;
    let level = v.level;
    if (db.length > 0) {
      const st = B.bmFindStudentIn(db, v.massar, v.name);
      if (!st) { say('⚠️ هذا الاسم غير موجود في لائحة التلاميذ.\nاكتب أول حروف الاسم أو رقم مسار ثم اختر التلميذ(ة) من القائمة التي تظهر.'); return null; }
      fillFrom(st);
      level = cleanClass(st.class) || level;
    }
    const nf = B.bmNewFile({
      name: v.name, massar: ((massarRef.current && massarRef.current.value) || '').trim(),
      school: ((schoolRef.current && schoolRef.current.value) || '').trim(), level,
      startDate: startDate || B.bmLIso(new Date()),
    }, new Date(), Date.now());
    return { files: [nf].concat(files0), file: nf, created: true };
  };
  const commit = (next) => Promise.resolve(setFiles(next)).catch((e) => { console.error(e); say('❌ فشل حفظ البيانات'); });
  const withFile = (r, nf) => commit(r.files.map((x) => (x.id === nf.id ? nf : x)));

  // ── الإدراج ──
  const onEnroll = () => {
    if (curFile) { say('ℹ️ هذا التلميذ(ة) مُدرج فعلًا في قائمة المتابعة.'); return; }
    const r = ensureFile(); if (!r) return;
    commit(r.files);
  };

  // ── الجدول الأسبوعي ──
  const dates = B.bmWeekDates(week);
  const rows = B.bmGridRows(curFile, week);
  const gridSug = useMemo(() => B.bmGridSuggest(curFile, week), [curFile, week]);
  const gOptions = gk === 'pos' ? B.BM_POS : B.BM_CON.map((x) => x[0]);
  const gVal = gOptions.includes(gsel) ? gsel : gOptions[0];
  const pushRow = (kind, beh) => {
    const r = ensureFile(); if (!r) return false;
    const res = B.bmPushRowTo(r.file, kind, beh, week);
    if (res.dup) { say('ℹ️ هذا السلوك موجود فعلًا في الجدول.'); return false; }
    withFile(r, res.file);
    return true;
  };
  const onAddRow = () => {
    let beh = gVal; if (!beh) { say('⚠️ اختر السلوك.'); return; }
    if (beh === 'أخرى') { beh = gother.trim(); if (!beh) { say('⚠️ صف السلوك كما رُصد.'); return; } }
    if (pushRow(gk, beh)) setGother('');
  };
  const delRow = (row) => { if (!curFile) return; withFile({ files: getFiles() }, B.bmDelRowFrom(curFile, row)); };
  const mark = (row, di, delta) => {
    const date = dates[di];
    const r = ensureFile(); if (!r) return;
    let nf;
    if (delta > 0) nf = B.bmAddMark(r.file, row, date, Date.now() * 100 + (++seq.current % 100));
    else {
      nf = B.bmRemoveMark(r.file, row, date);
      if (!nf) { say('ℹ️ لا توجد علامة مضافة من الجدول في هذه الخانة؛ الملاحظات القديمة تُحذف من قائمة المتابعة أسفل الصفحة.'); return; }
    }
    withFile(r, nf);
  };

  // ── التقييم النفسي: الحفظ ──
  const onEvSave = () => {
    if (!evDate) { say('⚠️ حدّد التاريخ.'); return; }
    const { dims, n } = B.bmEvCollectFrom(evForm.dims);
    if (!n) { say('⚠️ قيِّم بُعدًا واحدًا على الأقل.'); return; }
    const r = ensureFile(); if (!r) return;
    withFile(r, B.bmEvUpsert(r.file, evDate, dims, evForm.note.trim(), Date.now()));
  };

  // ── جدول التدخل: إجراءات مقترحة ──
  const ivs = (curFile && curFile.interventions) || EMPTY;
  const ivSug = useMemo(() => {
    const s = B.bmStratSuggest(curFile);
    const have = ((curFile && curFile.interventions) || []).map((x) => String(x.action).trim());
    return { tops: s.tops, list: s.list.filter((a) => !have.includes(a)) };
  }, [curFile]);
  const addIv = (action) => {
    const a = String(action || '').trim(); if (!a) { say('⚠️ اكتب الإجراء.'); return false; }
    const r = ensureFile(); if (!r) return false;
    const res = B.bmIvAdd(r.file, a, Date.now() * 100 + (++seq.current % 100));
    if (res.dup) { say('ℹ️ هذا الإجراء موجود فعلًا في الجدول.'); return false; }
    withFile(r, res.file);
    return true;
  };
  const onAddIvCustom = () => { if (addIv(ivText)) setIvText(''); };
  const patchIv = (id, patch) => { if (!curFile) return; commit(getFiles().map((x) => (x.id === curFile.id ? B.bmIvUpdate(x, id, patch) : x))); };
  const delIv = (it) => { if (!curFile || !ask('حذف هذا الإجراء من الجدول؟')) return; commit(getFiles().map((x) => (x.id === curFile.id ? B.bmIvDel(x, it.id) : x))); };

  // ── قائمة المتابعة ──
  const list = useMemo(() => B.bmListRows(files, q.trim(), new Date()), [files, q]);
  const onOpen = (f) => {
    if (nameRef.current) nameRef.current.value = f.studentName;
    if (massarRef.current) massarRef.current.value = f.massar === '—' ? '' : f.massar;
    setIdent((p) => ({ name: String(f.studentName || '').trim(), massar: f.massar === '—' ? '' : String(f.massar || '').trim(), level: f.level && f.level !== '—' ? f.level : p.level }));
    if (pickerRef.current && pickerRef.current.scrollIntoView) pickerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const onClose = (f) => { if (!ask('إنهاء متابعة «' + f.studentName + '»؟ يبقى الملف محفوظًا ويخرج من القوائم النشطة.')) return; commit(getFiles().map((x) => (x.id === f.id ? B.bmCloseFile(x) : x))); };
  const onReopen = (f) => commit(getFiles().map((x) => (x.id === f.id ? B.bmReopenFile(x) : x)));
  const onDelete = (f) => { if (!ask('حذف ملف «' + f.studentName + '» نهائيًا بكل ملاحظاته وإجراءاته؟')) return; commit(getFiles().filter((x) => String(x.id) !== String(f.id))); };
  const onDelObs = (f, oid) => { if (!ask('حذف هذه الملاحظة؟')) return; commit(getFiles().map((x) => (x.id === f.id ? B.bmDelObsOf(x, oid) : x))); };

  // ── الطباعة وWord ──
  const reportCtx = () => ({ school: profile.school || instName() || '', spec: profile.fullName || '', logo: logo(), week, now: new Date() });
  const onPrint = (id) => {
    const body = B.bmBuildReport(getFiles(), id, reportCtx());
    if (!body) { say('لا توجد ملفات متابعة لإنشاء التقرير.'); return; }
    printBehaviorReport(body);
  };
  const onWord = async (id) => {
    const body = B.bmBuildReport(getFiles(), id, reportCtx());
    if (!body) { say('لا توجد ملفات متابعة لإنشاء التقرير.'); return; }
    try { await exportBehaviorWord(body, B.bmIso(new Date())); } catch (e) { console.error(e); say('تعذّر إنشاء ملف Word. حاول مرة أخرى.'); }
  };

  // ── الجدول: المجاميع ──
  const tot = { con: dates.map(() => 0), pos: dates.map(() => 0) };
  const bodyRows = rows.map((r) => {
    const rowTotal = dates.reduce((a, d) => a + B.bmCellCount(curFile, d, r), 0);
    const counts = dates.map((d, di) => { const n = B.bmCellCount(curFile, d, r); tot[r.kind][di] += n; return n; });
    return { r, rowTotal, counts };
  });
  const hasPos = rows.some((r) => r.kind === 'pos'), hasCon = rows.some((r) => r.kind === 'con');
  const sum = (a) => a.reduce((x, y) => x + y, 0);

  return (
    <>
      {/* 1) معطيات التلميذ (مرتبطة بلائحة التلاميذ) */}
      <div className="section-card" style={{ overflow: 'visible', position: 'relative', zIndex: 5 }}>
        <div className="section-header" style={{ borderRadius: 'inherit', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}><span className="step-badge"></span>التلميذ(ة) — من لائحة التلاميذ</div>
        <div className="section-body">
          <div className="form-grid" id="bmPicker" ref={pickerRef} onInput={later} onChange={later} onBlur={later} onClick={later}>
            <div className="form-group"><label> اسم التلميذ(ة) *</label><input type="text" id="bm_name" ref={nameRef} placeholder="اكتب أول حروف الاسم أو رقم مسار" autoComplete="off" /></div>
            <div className="form-group"><label> رقم مسار</label><input type="text" id="bm_massar" ref={massarRef} placeholder="يُملأ تلقائيًا من اللائحة" /></div>
            <div className="form-group"><label> المؤسسة</label><input type="text" id="bm_school" ref={schoolRef} placeholder="المؤسسة" /></div>
            <div className="form-group"><label> القسم</label>
              <select id="bm_level" ref={levelRef} className="level-select" style={SEL} value={ident.level} onChange={(e) => setIdent((p) => ({ ...p, level: e.target.value }))}>
                <option value="">— اختر القسم —</option>
                {levelOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group"><label> تاريخ بداية الرصد</label><input type="date" id="bm_start" value={startDate} onChange={onStartDate} /></div>
            <div className="form-group"><label> أو اختر من تلاميذ القسم</label>
              <select id="bm_stu" className="level-select abm-select" value={stuValue} onChange={(e) => pickStudent(e.target.value)}>
                {!ident.level
                  ? <option value="">— اختر القسم أولاً —</option>
                  : <option value="">{'— ' + stuList.length + ' تلميذ(ة) في هذا القسم —'}</option>}
                {stuList.map(([i, s]) => {
                  const f = files.find((x) => x.status !== 'أُغلق' && ((s.massar && x.massar === s.massar) || x.studentName === s.fullName));
                  return <option key={i} value={String(i)}>{(f ? '★ ' : '') + s.fullName}</option>;
                })}
              </select>
            </div>
            <div className="form-group col-span-2" id="bmCurBadge">
              {ident.name && dbReady && !foundStudent && (
                <div style={{ fontSize: '0.78rem', color: '#991b1b', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 8, padding: '6px 12px' }}>❌ الاسم غير موجود في لائحة التلاميذ — اختر من القائمة المنسدلة.</div>
              )}
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button className="btn btn-primary" onClick={onEnroll}> إدراج في قائمة المتابعة</button>
          </div>
        </div>
      </div>

      {/* 2) الجدول الأسبوعي للسلوكات */}
      <div className="section-card">
        <div className="section-header"><span className="step-badge"></span>الجدول الأسبوعي للسلوكات (الاثنين ← السبت)</div>
        <div className="section-body">
          <div className="bm-week-bar">
            <button type="button" className="bm-wk-btn" onClick={() => setWeek(B.bmAddDays(week, -7))}>→ الأسبوع السابق</button>
            <input type="date" id="bm_week_date" value={week} onChange={(e) => { if (e.target.value) setWeek(B.bmMonday(e.target.value)); }} title="اختر أي يوم لعرض أسبوعه" />
            <button type="button" className="bm-wk-btn" onClick={() => setWeek(B.bmMonday())}>الأسبوع الحالي</button>
            <button type="button" className="bm-wk-btn" onClick={() => setWeek(B.bmAddDays(week, 7))}>الأسبوع التالي ←</button>
            <span id="bm_week_label" className="bm-week-label">{'من ' + B.bmFmt(dates[0]) + ' إلى ' + B.bmFmt(dates[5]) + ' (' + dates[0].slice(0, 4) + ')'}</span>
          </div>
          <div className="bm-grid-wrap" id="bmGridBox">
            {!rows.length ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 22, fontSize: '0.84rem' }}>
                {ident.name ? 'لا توجد سلوكات في الجدول بعد — أضف سلوكًا من الأسفل.' : 'اختر التلميذ(ة) أولاً ثم أضف السلوكات التي تريد رصدها.'}
              </div>
            ) : (
              <table className="bm-grid">
                <thead><tr><th>السلوك الملاحَظ</th>{dates.map((d, i) => <th key={d}>{B.BM_DAYS[i]}<small>{B.bmFmt(d)}</small></th>)}<th>المجموع</th></tr></thead>
                <tbody>
                  {bodyRows.map(({ r, rowTotal, counts }) => (
                    <tr key={B.bmRowKey(r)}>
                      <td className="bm-beh">
                        <span className="bm-k" style={{ background: r.kind === 'pos' ? '#16a34a' : '#dc2626' }}></span>{r.beh}
                        {rowTotal === 0 && <button type="button" onClick={() => delRow(r)} title="إزالة السطر">✕</button>}
                      </td>
                      {counts.map((n, di) => (
                        <td className="bm-cell" key={di}>
                          <div className="bm-cell-in">
                            <button type="button" className={'bm-x ' + (n ? (r.kind === 'pos' ? 'on-pos' : 'on-con') : '')} onClick={() => mark(r, di, 1)} title="إضافة علامة">{n ? B.bmMarks(n) : '+'}</button>
                            {n > 0 && <button type="button" className="bm-m" onClick={() => mark(r, di, -1)} title="حذف آخر علامة">−</button>}
                          </div>
                        </td>
                      ))}
                      <td><strong>{rowTotal}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {hasCon && <tr><td className="bm-beh" style={{ color: '#b91c1c' }}>مجموع السلوكات المقلقة</td>{tot.con.map((v, i) => <td key={i}>{v}</td>)}<td>{sum(tot.con)}</td></tr>}
                  {hasPos && <tr><td className="bm-beh" style={{ color: '#15803d' }}>مجموع السلوكات الإيجابية</td>{tot.pos.map((v, i) => <td key={i}>{v}</td>)}<td>{sum(tot.pos)}</td></tr>}
                </tfoot>
              </table>
            )}
          </div>
          <div id="bmGridSug">
            {gridSug && (
              <div className="bm-tier-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
                <strong>💡 {gridSug.title}:</strong><br />
                {gridSug.list.map((b) => <Chip key={b} onClick={() => pushRow('con', b)}>{b}</Chip>)}
              </div>
            )}
          </div>
          <div className="form-grid" style={{ marginTop: 8 }}>
            <div className="form-group">
              <label> إضافة سلوك إلى الجدول</label>
              <div className="radio-group">
                <label><input type="radio" name="bm_gk" value="con" checked={gk === 'con'} onChange={() => { setGk('con'); setGsel(''); }} /> سلوك مقلق</label>
                <label><input type="radio" name="bm_gk" value="pos" checked={gk === 'pos'} onChange={() => { setGk('pos'); setGsel(''); }} /> سلوك إيجابي</label>
              </div>
            </div>
            <div className="form-group"><label> السلوك</label>
              <select id="bm_gsel" className="level-select abm-select" value={gVal} onChange={(e) => setGsel(e.target.value)}>
                {gOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group col-span-2" id="bm_gother_wrap" style={{ display: gVal === 'أخرى' ? '' : 'none' }}><label> صف السلوك كما رُصد</label>
              <input type="text" id="bm_gother" placeholder="مثال: ينام في الحصة" value={gother} onChange={(e) => setGother(e.target.value)} />
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 10 }}><button className="btn btn-primary" onClick={onAddRow}> إضافة السلوك إلى الجدول</button></div>
        </div>
      </div>

      {/* 3) التقييم النفسي (مباشرة بعد أسبوع الرصد) */}
      <div className="section-card">
        <div className="section-header"><span className="step-badge"></span>التقييم النفسي</div>
        <div className="section-body">
          <div className="form-grid">
            <div className="form-group"><label> التاريخ *</label><input type="date" id="bm_ev_date" value={evDate} onChange={(e) => setEvDate(e.target.value)} /></div>
          </div>
          <button type="button" className={'bm-ev-toggle' + (evOpen ? ' open' : '')} id="bmEvToggle" onClick={() => setEvOpen((o) => !o)}>
            <span>🧠 التقييم النفسي للتلميذ(ة)</span>
            <span id="bmEvSum" className="bm-ev-sum">{B.bmEvSummaryText(B.bmEvCounts(evLevels), evSaved)}</span>
            <span id="bmEvChev" className="bm-ev-chev">▾</span>
          </button>
          {evOpen && (
            <div id="bmEvBody" style={{ display: 'block', marginTop: 12 }}>
              {B.BM_EV_DIMS.map((d) => (
                <EvalDim key={d.k} d={d} v={evForm.dims[d.k] || {}}
                  onChange={(nv) => setEvForm((f) => ({ ...f, dims: { ...f.dims, [d.k]: nv } }))} />
              ))}
              <div className="form-group" style={{ marginBottom: 10 }}><label> ملاحظة عامة</label>
                <textarea id="bm_ev_note" style={{ minHeight: 50 }} placeholder="انطباع عام موجز" value={evForm.note} onChange={(e) => setEvForm((f) => ({ ...f, note: e.target.value }))} />
              </div>
              <div className="btn-row"><button className="btn btn-primary" onClick={onEvSave}> حفظ التقييم</button></div>
            </div>
          )}
        </div>
      </div>

      {/* 4) جدول التدخل عبر إجراءات مقترحة */}
      <div className="section-card">
        <div className="section-header"><span className="step-badge"></span>جدول التدخل — إجراءات مقترحة</div>
        <div className="section-body">
          <div className="bm-grid-wrap" id="bmIvBox">
            {!ivs.length ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 22, fontSize: '0.84rem' }}>
                {ident.name ? 'لا توجد إجراءات في الجدول بعد — اختر من الإجراءات المقترحة أو أضف إجراءً.' : 'اختر التلميذ(ة) أولاً ثم أضف إجراءات التدخل.'}
              </div>
            ) : (
              <table className="bm-grid">
                <thead><tr><th style={{ width: '5%' }}>#</th><th>الإجراء</th><th style={{ width: '18%' }}>المسؤول</th><th style={{ width: '16%' }}>تاريخ التنفيذ</th><th style={{ width: '14%' }}>الحالة</th><th style={{ width: '5%' }}></th></tr></thead>
                <tbody>
                  {ivs.map((it, i) => <IvRow key={it.id} it={it} i={i} onPatch={patchIv} onDel={delIv} />)}
                </tbody>
              </table>
            )}
          </div>
          {ivSug.list.length > 0 && (
            <div id="bmIvSug" style={sugBox}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0369a1', marginBottom: 4 }}>💡 إجراءات مقترحة{ivSug.tops.length ? ' حسب أكثر السلوكات تسجيلًا' : ''} (اضغط للإضافة إلى الجدول):</div>
              {ivSug.list.map((s) => <Chip key={s} onClick={() => addIv(s)}>{s}</Chip>)}
            </div>
          )}
          <div className="form-grid" style={{ marginTop: 10 }}>
            <div className="form-group col-span-2"><label> إضافة إجراء آخر</label>
              <input type="text" id="bm_iv_text" value={ivText} onChange={(e) => setIvText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAddIvCustom(); } }} placeholder="مثال: لقاء مع الأسرة لتحديد اتفاق سلوكي" />
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 10 }}><button className="btn btn-primary" onClick={onAddIvCustom}> إضافة الإجراء إلى الجدول</button></div>
        </div>
      </div>

      {/* 5) ملفات المتابعة */}
      <div className="section-card">
        <div className="section-header">
          <span className="step-badge"></span><span>قائمة المتابعة والملخص الأسبوعي</span>
          <span id="bmCount" style={{ marginRight: 'auto', background: 'rgba(255,255,255,0.25)', borderRadius: 20, padding: '1px 10px', fontSize: '0.82rem', fontWeight: 800 }}>{list.activeCount}</span>
        </div>
        <div className="archive-body open">
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="text" id="bmSearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder=" بحث بالاسم..." style={{ flex: 1, minWidth: 160, padding: '7px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontFamily: "'Cairo',sans-serif", fontSize: '0.84rem' }} />
            <button onClick={() => onPrint()} style={{ background: 'linear-gradient(135deg,#991b1b,#dc2626)', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: "'Cairo',sans-serif", fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}> طباعة التقرير الأسبوعي</button>
            <button onClick={() => onWord()} style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: "'Cairo',sans-serif", fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}> تحميل Word</button>
          </div>
          <div id="bmList" style={{ padding: '10px 14px' }}>
            {!list.items.length && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 22, fontSize: '0.85rem' }}>لا يوجد تلاميذ في قائمة المتابعة بعد.</div>}
            {list.items.map(({ file: f, stats: s, closed, trend, weekMarks, recent }) => (
              <div key={f.id} style={{ border: '1.5px solid ' + (closed ? '#e2e8f0' : '#cbd5e1'), borderRadius: 12, padding: '12px 14px', marginBottom: 10, background: closed ? '#f8fafc' : '#fff', opacity: closed ? 0.75 : 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{f.studentName}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{f.level}</span>
                  {B.bmStartOf(f) && <span style={{ fontSize: '0.72rem', color: '#64748b' }}>· بداية الرصد: {B.bmStartOf(f)}</span>}
                  {closed && <span style={{ fontSize: '0.72rem', color: '#64748b' }}>· أُغلقت المتابعة</span>}
                </div>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.8rem', marginTop: 8 }}>
                  <span>مقلقة (7 أيام): <strong>{s.cc.length}</strong> {trend > 0 ? <span style={{ color: '#dc2626' }}>↑ {trend}</span> : trend < 0 ? <span style={{ color: '#16a34a' }}>↓ {Math.abs(trend)}</span> : <span style={{ color: '#64748b' }}>= ثابت</span>}</span>
                  <span>إيجابية: <strong style={{ color: '#16a34a' }}>{s.pos.length}</strong></span>
                  <span>علامات الجدول (هذا الأسبوع): <strong>{weekMarks}</strong></span>
                  <span>الإجراءات: <strong>{B.bmIvOf(f).length}</strong></span>
                  {s.top.length > 0 && <span>الأكثر تكرارًا: {s.top.map((t) => t[0] + ' (' + t[1] + ')').join('، ')}</span>}
                </div>
                <div dangerouslySetInnerHTML={{ __html: B.bmEvListHtml(f) }} />
                {s.alerts.length > 0 && (
                  <div style={{ background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: 8, padding: '8px 12px', marginTop: 8, fontSize: '0.78rem', color: '#9a3412', lineHeight: 1.8 }}>
                    <strong>🔔 تنبيه:</strong> {s.alerts.join(' · ')}
                    {s.portals.length > 0 && (
                      <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span>إحالة مقترحة:</span>
                        {s.portals.map((p) => <button key={p} onClick={() => openPortal(p)} style={{ background: '#e08e0b', color: 'white', border: 'none', borderRadius: 6, padding: '2px 10px', fontFamily: "'Cairo',sans-serif", fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}>{B.BM_PORTALS[p]}</button>)}
                      </div>
                    )}
                  </div>
                )}
                {recent.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {recent.map((o) => (
                      <div key={o.id} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.76rem', padding: '3px 0', borderBottom: '1px dashed #e2e8f0' }}>
                        <span style={{ color: o.kind === 'pos' ? '#16a34a' : '#dc2626' }}>{o.kind === 'pos' ? '＋' : '−'}</span>
                        <span style={{ color: '#64748b' }}>{o.date}</span>
                        <span style={{ flex: 1 }}>{o.beh}{o.place ? ' · ' + o.place : ''}{o.kind === 'con' ? ' · شدة ' + o.sev : ''}</span>
                        <button onClick={() => onDelObs(f, o.id)} title="حذف" style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  <button onClick={() => onOpen(f)} style={cardBtn('#dcfce7', '#166534', '#86efac')}>✎ فتح الملف</button>
                  <button onClick={() => onPrint(f.id)} style={cardBtn('#fee2e2', '#991b1b', '#fca5a5')}>🖨️ طباعة</button>
                  <button onClick={() => onWord(f.id)} style={cardBtn('#dbeafe', '#1e40af', '#93c5fd')}>📄 Word</button>
                  {closed
                    ? <button onClick={() => onReopen(f)} style={cardBtn('#dcfce7', '#166534', '#86efac')}>↺ إعادة فتح</button>
                    : <button onClick={() => onClose(f)} style={cardBtn('#f1f5f9', '#334155', '#cbd5e1')}>إنهاء المتابعة</button>}
                  <button onClick={() => onDelete(f)} style={cardBtn('#fee2e2', '#dc2626', '#fca5a5')}>🗑️ حذف</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// المرحلة 18: رصد السلوك — يُرسم داخل #mountBehavior في صفحة toolBehavior القديمة (شريط العودة بقي في body.html)
export default function BehaviorPortal({ mount }) {
  if (!mount) return null;
  return createPortal(<BehaviorBody />, mount);
}
