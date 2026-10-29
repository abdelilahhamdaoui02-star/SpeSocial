import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCollection, useCurrentPortal, useStudents } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import {
  TYPE_OPTIONS, THEME_OPTIONS, PLACE_OPTIONS, ORGANIZER_OPTIONS, TARGET_OPTIONS, TOOL_OPTIONS, RESULT_OPTIONS,
  RESULT_COLORS, TYPE_ICONS, OBJECTIVE_CHIPS, SUMMARY_CHIPS, NOTES_CHIPS, WS_MAX_PHOTOS, MSG,
  todayIso, addClass, removeClass, initFields, saveEntry, updateEntry, autoSaveOnReport, formFromEntry, formAfterCancel,
  filterArchive, deleteEntry, totalOf, appendSuggest, photoAddPlan, photoAddMessage, reportHtml,
} from './workshopsLogic.js';
import { compressImage, loadRatio } from './photoUtils.js';
import { openPreview } from '../preview/previewStore.js';
import { cleanClassValue } from '../students/cleanClass.js';
import { getLogo } from '../settings/logoStore.js';
import { getInstitution } from '../institution/institutionStore.js';

// حقول النص التي يكتب فيها الكود القديم مباشرة في DOM (applyInstitutionEverywhere تملأ ws_school) → غير متحكَّم بها، ومعرّفاتها القديمة
const TEXT_IDS = {
  title: 'ws_title', school: 'ws_school', date: 'ws_date', duration: 'ws_duration',
  objectives: 'ws_objectives', summary: 'ws_summary', notes: 'ws_notes',
};

const GRAD = 'linear-gradient(90deg,#92400e,#d97706)';
const cleanClass = cleanClassValue;
const currentArchive = () => getState().collections.workshopsArchive ?? [];
const instName = () => { try { return getInstitution().getInstitutionName(); } catch (e) { return ''; } };
const logo = () => getLogo();
const toggleIn = (list, x) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);

// نفس نمط قوائم الأقسام في بقية البوابات (class="level-select")
const SEL = { border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 11px', fontFamily: "'Cairo',sans-serif", fontSize: '0.875rem', color: 'var(--text)', background: '#fafbfc', direction: 'rtl', flex: 1 };
const ADD_BTN = { background: 'linear-gradient(135deg,#92400e,#d97706)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', padding: '7px 14px', fontFamily: "'Cairo',sans-serif", fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' };

function Section({ n, title, children }) {
  return (
    <div className="section-card">
      <div className="section-header" style={{ background: GRAD }}>
        <span className="step-badge" style={{ background: '#fde68a', color: '#92400e' }}>{n}</span> {title}
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}

function Radios({ name, options, value, onChange }) {
  return (
    <div className="radio-group">
      {options.map(([val, lbl]) => (
        <label key={val}><input type="radio" name={name} value={val} checked={value === val} onChange={() => onChange(val)} /> {lbl}</label>
      ))}
    </div>
  );
}

function Checks({ name, options, value, onChange }) {
  return (
    <div className="check-group">
      {options.map(([val, lbl]) => (
        <label key={val}><input type="checkbox" name={name} value={val} checked={value.includes(val)} onChange={() => onChange(toggleIn(value, val))} /> {lbl}</label>
      ))}
    </div>
  );
}

function Chips({ chips, onPick }) {
  return (
    <div className="suggest-chips" style={{ marginTop: 6 }}>
      {chips.map(([lbl, text]) => <button key={lbl} type="button" className="suggest-chip" onClick={() => onPick(text)}>{lbl}</button>)}
    </div>
  );
}

function WorkshopsBody({ mount }) {
  const active = useCurrentPortal() === 'workshops';
  const students = useStudents();
  const [archive, setArchive] = useCollection('workshopsArchive');
  const f = useRef({});
  const inited = useRef(false); // wsInitialized القديمة: التاريخ والمؤسسة عند أول فتح فقط
  const fileInput = useRef(null);
  const ratios = useRef({}); // نسب أبعاد الصور (wsEnsureRatios القديمة)
  const photosRef = useRef([]); // نسخة متزامنة لعدّ الصور أثناء الإضافة غير المتزامنة
  const [type, setType] = useState('');
  const [place, setPlace] = useState('');
  const [result, setResult] = useState('');
  const [themes, setThemes] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [targets, setTargets] = useState([]);
  const [tools, setTools] = useState([]);
  const [males, setMales] = useState('');
  const [females, setFemales] = useState('');
  const [classes, setClasses] = useState([]);
  const [classSel, setClassSel] = useState('');
  const [photos, setPhotos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [search, setSearch] = useState('');

  const ref = (k) => (el) => { f.current[k] = el; };
  // قائمة الأقسام: أقسام لائحة التلاميذ المستوردة فقط (كـbuildLevelOptions القديمة)
  const classOptions = useMemo(() => {
    const set = new Set();
    students.forEach((s) => { const c = cleanClass(s && s.class); if (c) set.add(c); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
  }, [students]);

  const readText = () => {
    const o = {};
    for (const k of Object.keys(TEXT_IDS)) o[k] = f.current[k] ? f.current[k].value : '';
    return o;
  };
  const readForm = () => ({ ...readText(), type, place, result, themes, organizers, targets, tools, males, females, classes, photos });
  const applyForm = (v) => {
    for (const k of Object.keys(TEXT_IDS)) if (f.current[k]) f.current[k].value = v[k] || '';
    setType(v.type); setPlace(v.place); setResult(v.result);
    setThemes(v.themes); setOrganizers(v.organizers); setTargets(v.targets); setTools(v.tools);
    setMales(v.males); setFemales(v.females); setClasses(v.classes);
    setPhotos(v.photos);
  };
  const persist = (next) => setArchive(next).catch((e) => { console.error(e); alert('❌ فشل حفظ البيانات'); });

  // initWorkshops القديمة: تاريخ اليوم والمؤسسة من الملف الشخصي عند أول فتح
  useEffect(() => {
    if (!active || inited.current) return;
    inited.current = true;
    const d = f.current.date, s = f.current.school;
    const init = initFields(d ? d.value : '', s ? s.value : '', instName());
    if (d) d.value = init.date;
    if (s) s.value = init.school;
  }, [active]);

  // الصور: نحسب نسب الأبعاد مسبقاً لتأطير كل صورة وفق شكلها الحقيقي عند الطباعة
  useEffect(() => {
    photosRef.current = photos;
    photos.forEach((src) => {
      if (ratios.current[src]) return;
      loadRatio(src).then((r) => { if (r) ratios.current[src] = r; });
    });
  }, [photos]);

  const doSave = () => {
    const form = readForm();
    const r = saveEntry(currentArchive(), form);
    if (!r) { alert(MSG.TITLE_FIRST); return; }
    persist(r.archive);
    setArchiveOpen(true);
    alert(MSG.SAVED(r.entry.title));
  };

  const generateReport = () => {
    const form = readForm();
    if (!String(form.title).trim()) { alert(MSG.TITLE_FIRST); return; }
    openPreview('workshops', reportHtml(form, { logo: logo(), ratios: ratios.current }));
    // ✅ حفظ تلقائي في الأرشيف عند إنشاء التقرير (دون تكرار نفس الورشة)
    try {
      const before = currentArchive();
      const r = autoSaveOnReport(before, form);
      if (r.archive !== before) {
        persist(r.archive);
        if (r.archive.length > before.length) setArchiveOpen(true);
      }
    } catch (e) { console.error(e); }
  };

  const loadEntry = (id) => {
    const e = currentArchive().find((x) => x.id === id);
    if (!e) return;
    try { mount.scrollTo(0, 0); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { /* لا شيء */ }
    applyForm(formFromEntry(e));
    setEditId(id);
  };

  // wsCancelEdit القديمة: تفرَّغ الحقول (حتى المؤسسة) والصور ويعود تاريخ اليوم؛ أقسام chips تبقى كما هي
  const cancelEdit = () => {
    setEditId(null);
    applyForm(formAfterCancel(readForm()));
    if (f.current.date) f.current.date.value = todayIso();
  };

  const updateCurrent = () => {
    if (!editId) return;
    const form = readForm();
    if (!String(form.title).trim()) { alert(MSG.TITLE_FIRST_UPDATE); return; }
    const r = updateEntry(currentArchive(), editId, form);
    if (!r) return;
    persist(r.archive);
    cancelEdit();
    setArchiveOpen(true);
    alert(MSG.UPDATED(r.entry.title));
  };

  const del = (id) => {
    if (!confirm(MSG.CONFIRM_DELETE)) return;
    persist(deleteEntry(currentArchive(), id));
  };
  const clearArchive = () => {
    if (!confirm(MSG.CONFIRM_CLEAR_ARCHIVE)) return;
    persist([]);
  };

  const suggest = (key, text) => {
    const el = f.current[key];
    if (!el) return;
    el.value = appendSuggest(el.value, text);
    el.focus();
  };

  const addPhotos = async (fileList) => {
    const plan = photoAddPlan(photosRef.current.length, Array.from(fileList || []));
    if (plan.kind !== 'ok') { alert(plan.alert); return; }
    const added = [];
    let failed = 0;
    for (const file of plan.files) {
      try { added.push(await compressImage(file)); } catch (e) { failed++; }
    }
    if (added.length) setPhotos((p) => [...p, ...added]);
    const msg = photoAddMessage(plan.skipped, failed);
    if (msg) alert(msg);
  };
  const clearPhotos = () => {
    if (!photos.length) return;
    if (!confirm(MSG.CONFIRM_CLEAR_PHOTOS)) return;
    setPhotos([]);
  };

  const filtered = filterArchive(archive, search);
  const total = (parseInt(males) || 0) + (parseInt(females) || 0);

  return (
    <>
      {editId != null && (
        <div id="wsEditBar" style={{ position: 'sticky', top: 0, zIndex: 200, background: 'linear-gradient(135deg,#92400e,#d97706)', color: 'white', padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', borderBottom: '3px solid #fde68a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 700 }}>
            <span style={{ fontSize: '1.2rem' }}>✏️</span>
            <span>وضع التعديل — تم تحميل الورشة. عدّل ما تريد ثم احفظ.</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={updateCurrent} style={{ background: '#fde68a', color: '#92400e', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: "'Cairo',sans-serif", fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer' }}>💾 حفظ التعديلات</button>
            <button type="button" onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 8, padding: '8px 14px', fontFamily: "'Cairo',sans-serif", fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>✕ إلغاء</button>
          </div>
        </div>
      )}

      <div className="info-box" style={{ background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' }}>
        🎯 <span>هذه البوابة مخصصة لتخطيط وتوثيق الورشات التوعوية والأنشطة التربوية والبرامج الجماعية المنجزة لفائدة التلاميذ.</span>
      </div>

      <Section n="١" title="معلومات الورشة / النشاط">
        <div className="form-grid">
          <div className="form-group col-span-2">
            <label>عنوان الورشة / النشاط *</label>
            <input ref={ref('title')} type="text" id="ws_title" placeholder="مثال: ورشة الوقاية من العنف المدرسي" />
          </div>
          <div className="form-group">
            <label>نوع النشاط</label>
            <Radios name="ws_type" options={TYPE_OPTIONS} value={type} onChange={setType} />
          </div>
          <div className="form-group">
            <label>محور النشاط</label>
            <Checks name="ws_theme" options={THEME_OPTIONS} value={themes} onChange={setThemes} />
          </div>
        </div>
        <div className="divider" />
        <div className="form-grid">
          <div className="form-group"><label>المؤسسة التعليمية</label><input ref={ref('school')} type="text" id="ws_school" defaultValue="" placeholder="اسم المؤسسة" /></div>
          <div className="form-group"><label>تاريخ الإنجاز</label><input ref={ref('date')} type="date" id="ws_date" /></div>
          <div className="form-group"><label>مدة النشاط (بالساعات)</label><input ref={ref('duration')} type="number" id="ws_duration" placeholder="مثال: 2" min="0.5" step="0.5" /></div>
          <div className="form-group">
            <label>مكان الإنجاز</label>
            <Radios name="ws_place" options={PLACE_OPTIONS} value={place} onChange={setPlace} />
          </div>
          <div className="form-group">
            <label>الجهة المنظِمة</label>
            <Checks name="ws_organizer" options={ORGANIZER_OPTIONS} value={organizers} onChange={setOrganizers} />
          </div>
        </div>
      </Section>

      <Section n="٢" title="الفئة المستهدفة والمشاركون">
        <div className="form-grid">
          <div className="form-group">
            <label>الفئة المستهدفة</label>
            <Checks name="ws_target" options={TARGET_OPTIONS} value={targets} onChange={setTargets} />
          </div>
          <div className="form-group">
            <label>عدد المشاركين</label>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.78rem' }}>ذكور</label>
                <input type="number" id="ws_males" placeholder="0" min="0" style={{ textAlign: 'center' }} value={males} onChange={(e) => setMales(e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: '0.78rem' }}>إناث</label>
                <input type="number" id="ws_females" placeholder="0" min="0" style={{ textAlign: 'center' }} value={females} onChange={(e) => setFemales(e.target.value)} />
              </div>
            </div>
            <div id="ws_total_display" style={{ marginTop: 8, textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#92400e', background: '#fffbeb', borderRadius: 6, padding: 6 }}>
              إجمالي المشاركين: <span id="ws_total_count">{total}</span>
            </div>
          </div>
          <div className="form-group col-span-2">
            <label>الأقسام / المجموعات المشاركة</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select id="ws_classes_select" className="level-select" data-react-level="1" style={SEL} value={classSel} onChange={(e) => setClassSel(e.target.value)}>
                {classOptions.length ? (
                  <>
                    <option value="">— اختر القسم —</option>
                    <optgroup label="📥 أقسام لائحة التلاميذ">
                      {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                  </>
                ) : <option value="">— استورد لائحة التلاميذ لتظهر الأقسام —</option>}
              </select>
              <button type="button" style={ADD_BTN} onClick={() => { setClasses((c) => addClass(c, classSel)); setClassSel(''); }}>+ إضافة</button>
            </div>
            <div id="ws_chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, minHeight: 0 }}>
              {classes.map((cls) => (
                <span key={cls} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#92400e', color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {cls}<span onClick={() => setClasses((c) => removeClass(c, cls))} style={{ cursor: 'pointer', fontSize: '0.85rem', marginRight: 2 }}>✕</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section n="٣" title="محتوى النشاط وسيره">
        <div className="form-grid cols-1">
          <div className="form-group">
            <label>الأهداف المرجوة من النشاط</label>
            <textarea ref={ref('objectives')} id="ws_objectives" style={{ minHeight: 75 }} placeholder="اكتب الأهداف التربوية والوقائية المرجوة من هذا النشاط..." />
            <Chips chips={OBJECTIVE_CHIPS} onPick={(t) => suggest('objectives', t)} />
          </div>
          <div className="form-group">
            <label>ملخص مجريات النشاط</label>
            <textarea ref={ref('summary')} id="ws_summary" style={{ minHeight: 100 }} placeholder="صف كيف جرى النشاط، المحاور المُتناولة، أسلوب العمل (مجموعات، عروض، نقاشات...)..." />
            <Chips chips={SUMMARY_CHIPS} onPick={(t) => suggest('summary', t)} />
          </div>
          <div className="form-group">
            <label>الوسائل والأدوات المستخدمة</label>
            <Checks name="ws_tools" options={TOOL_OPTIONS} value={tools} onChange={setTools} />
          </div>
        </div>
      </Section>

      <Section n="٤" title="التقييم والنتائج والتوصيات">
        <div className="form-grid">
          <div className="form-group">
            <label>نتيجة النشاط العامة</label>
            <Radios name="ws_result" options={RESULT_OPTIONS} value={result} onChange={setResult} />
          </div>
          <div className="form-group col-span-2">
            <label>الملاحظات والتوصيات</label>
            <textarea ref={ref('notes')} id="ws_notes" style={{ minHeight: 75 }} placeholder="اكتب ملاحظاتك ومقترحاتك لتحسين الأنشطة المستقبلية..." />
            <Chips chips={NOTES_CHIPS} onPick={(t) => suggest('notes', t)} />
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 18 }}>
          <button type="button" className="btn btn-primary" style={{ background: 'linear-gradient(135deg,#92400e,#d97706)' }} onClick={generateReport}>📄 معاينة التقرير وطباعته</button>
          <button type="button" className="btn btn-success" onClick={doSave}>🗄️ حفظ في الأرشيف</button>
        </div>
      </Section>

      <Section n="٥" title="📷 صور النشاط">
        <input ref={fileInput} type="file" id="ws_photo_input" accept="image/*" multiple style={{ display: 'none' }}
          onChange={(e) => { addPhotos(e.target.files); e.target.value = ''; }} />
        <div id="wsPhotoDrop" onClick={() => fileInput.current && fileInput.current.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.background = '#fef3c7'; }}
          onDragLeave={(e) => { e.currentTarget.style.background = '#fffbeb'; }}
          onDrop={(e) => { e.preventDefault(); e.currentTarget.style.background = '#fffbeb'; addPhotos(e.dataTransfer.files); }}
          style={{ border: '2px dashed #d97706', background: '#fffbeb', borderRadius: 12, padding: '22px 14px', textAlign: 'center', cursor: 'pointer', color: '#92400e', fontWeight: 700, fontFamily: "'Cairo',sans-serif" }}>
          <div style={{ fontSize: '1.8rem', lineHeight: 1.2 }}>📷</div>
          <div>اضغط لاستيراد صور النشاط أو اسحبها وأفلتها هنا</div>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, opacity: 0.85, marginTop: 4 }}>حتى {WS_MAX_PHOTOS} صورة — تُضغط تلقائياً لتخفيف حجم الأرشيف</div>
        </div>
        <div id="wsPhotoBar" style={{ display: photos.length ? 'flex' : 'none', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 12, fontSize: '0.82rem', fontWeight: 700, color: '#92400e' }}>
          <span>🖼️ عدد الصور: <span id="wsPhotoCount">{photos.length}</span></span>
          <button type="button" className="btn-sm btn-sm-danger" onClick={clearPhotos}>🗑 حذف كل الصور</button>
        </div>
        <div id="wsPhotoGrid" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, alignItems: 'flex-start' }}>
          {photos.map((src, i) => (
            <div key={i} style={{ position: 'relative', display: 'inline-block', border: '1px solid #d97706', borderRadius: 6, overflow: 'hidden', background: '#fff', lineHeight: 0 }}>
              <img src={src} alt={'صورة ' + (i + 1)} style={{ height: 110, width: 'auto', maxWidth: 220, display: 'block' }} />
              <button type="button" title="حذف الصورة" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                style={{ position: 'absolute', top: 4, left: 4, width: 24, height: 24, border: 'none', borderRadius: '50%', background: 'rgba(220,38,38,.92)', color: '#fff', fontSize: '.8rem', cursor: 'pointer', lineHeight: 1 }}>✕</button>
              <span style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 10, padding: '0 7px', fontSize: '.68rem', fontWeight: 700, lineHeight: 1.5 }}>{i + 1}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: '0.76rem', color: '#64748b', lineHeight: 1.8 }}>🖨️ عند الطباعة تُوضع الصور في ورقة مستقلة بعد التقرير، جنباً إلى جنب في صفحة واحدة، دون أي تأثير على صفحة التقرير نفسها.</div>
      </Section>

      <div className="archive-panel" style={{ marginTop: 6 }}>
        <div className="archive-header" onClick={() => setArchiveOpen((o) => !o)}
          style={{ background: GRAD, color: 'white', borderRadius: 'var(--radius) var(--radius) 0 0', padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <div className="archive-header-left" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
            <span>🗄️</span><span>سجل الأرشيف — الورشات والأنشطة</span>
            <span className="archive-badge" id="wsArchiveCount" style={{ background: 'rgba(255,255,255,0.25)', color: 'white', borderRadius: 20, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 800 }}>{archive.length}</span>
          </div>
          <span id="wsArchiveArrow" style={{ color: 'white' }}>{archiveOpen ? '▲' : '▼'}</span>
        </div>
        <div className={'archive-body' + (archiveOpen ? ' open' : '')} id="wsArchiveBody">
          <div className="archive-search">
            <input type="text" id="wsArchiveSearch" placeholder="🔍 ابحث بعنوان الورشة أو المحور..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="btn-sm btn-sm-danger" onClick={clearArchive}>🗑 مسح الأرشيف</button>
          </div>
          <div id="wsArchiveList">
            {!filtered.length ? (
              <div className="archive-empty">{search.trim() ? MSG.NO_RESULTS : <>{MSG.EMPTY_LIST}<br /><small>{MSG.EMPTY_HINT}</small></>}</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="archive-table">
                  <thead><tr><th>#</th><th>عنوان الورشة</th><th>النوع</th><th>المؤسسة</th><th>التاريخ</th><th>الحضور</th><th>النتيجة</th><th>إجراء</th></tr></thead>
                  <tbody>
                    {filtered.map((e, i) => (
                      <tr key={e.id + '-' + i}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem' }}>{i + 1}</td>
                        <td><strong style={{ color: '#92400e' }}>{TYPE_ICONS[e.type] || '🎓'} {e.title || '—'}</strong></td>
                        <td style={{ fontSize: '0.78rem' }}>{e.type || '—'}</td>
                        <td style={{ fontSize: '0.78rem' }}>{e.school && e.school !== '—' ? e.school : '—'}</td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>📅 {e.date && e.date !== '—' ? e.date : '—'}</td>
                        <td style={{ textAlign: 'center', fontSize: '0.78rem' }}>👤 {totalOf(e)}</td>
                        <td><span style={{ background: RESULT_COLORS[e.result] || '#64748b', color: 'white', borderRadius: 10, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{e.result || '—'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                            <button type="button" className="btn-sm" onClick={() => loadEntry(e.id)}
                              style={{ background: 'linear-gradient(135deg,#92400e,#d97706)', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.72rem', fontFamily: "'Cairo',sans-serif", fontWeight: 700 }}>✏️ تعديل</button>
                            <button type="button" className="btn-sm btn-sm-danger" onClick={() => del(e.id)}>🗑</button>
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

// المرحلة 22: الورشات والأنشطة التربوية — يُرسم داخل #mountWorkshops في صفحة toolWorkshops القديمة؛
// شريط العودة ونافذة المعاينة (#wsPrintModal) بقيا في body.html لارتباط الطباعة وWord بمعرّفاتها
export default function WorkshopsPortal({ mount }) {
  if (!mount) return null;
  return createPortal(<WorkshopsBody mount={mount} />, mount);
}
