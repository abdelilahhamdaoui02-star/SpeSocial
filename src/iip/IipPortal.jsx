import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCurrentPortal, useCurrentUser, useProfile, useStudents } from '../store/hooks.js';
import { MODELS, DOM, RSUG, PSUG, buildSuggestions } from './iipData.js';
import { chartSvg, reportHtml } from './iipReport.js';
import {
  MSG, CONFIRM, NO_SUGGESTIONS_TEXT, EMPTY_SESSIONS_TEXT, EMPTY_ARCHIVE_TEXT, DONE_LEVELS, NAME_PLACEHOLDER_EMPTY_DB,
  todayStr, blank, clone, loadAll, storeAll, getPath, setPath, canSave, upsert, findActiveDuplicate, dupKey,
  pickModel, setPrimary, recommendedModels, addGoal, delGoal, setGoalField, autoplan, EMPTY_DRAFT, addSession, delSession,
  progressView, archiveRows, applySuggestion, normalizeItems, reportContext,
} from './iipLogic.js';
import { printReport, exportReportWord } from './iipPrint.js';
import { acSetup } from '../autocomplete/studentAutocomplete.js';
import { getLogo } from '../settings/logoStore.js';

// الإكمال التلقائي للتلاميذ ما زال من الكود القديم (acSetup)؛ نمرّر له حقول البوابة نفسها كما كانت iipInit تفعل
const AC_CFG = { nameId: 'iip_name', massarId: 'iip_massar', levelId: 'iip_level' };
const storage = () => { try { return window.localStorage; } catch (e) { return null; } };
const logo = () => getLogo();

// زر «💡 اقتراحات للملء السريع» تحت كل خانة: يفتح قائمة شرائح تُحسب لحظة الفتح، والنقر على شريحة يدرجها في الخانة
function Sg({ build, kind, value, onChange }) {
  const [open, setOpen] = useState(false);
  const items = open ? normalizeItems(build()) : [];
  return (
    <div className="iip-sg">
      <button type="button" className="iip-sgt" onClick={() => setOpen((o) => !o)}>💡 اقتراحات للملء السريع</button>
      <div className="iip-chips iip-mini" hidden={!open}>
        {open && !items.length && <span className="iip-hint" style={{ margin: 0 }}>{NO_SUGGESTIONS_TEXT}</span>}
        {items.map((it, i) => (
          <button key={i} type="button" className="iip-chip" onClick={() => { const nv = applySuggestion(value, it, kind); if (nv != null) onChange(nv); }}>{it.t}</button>
        ))}
      </div>
    </div>
  );
}

function Chips({ id, items, onPick }) {
  return (
    <div id={id} className="iip-chips">
      {items.map((t, i) => <button key={i} type="button" className="iip-chip" onClick={() => onPick(t)}>{t}</button>)}
    </div>
  );
}

function IipBody() {
  const active = useCurrentPortal() === 'iip';
  const user = useCurrentUser() || '';
  const profile = useProfile();
  const students = useStudents();

  const [cur, setCurState] = useState(() => blank());
  const curRef = useRef(cur);
  const [all, setAllState] = useState([]);
  const allRef = useRef(all);
  const [msg, setMsg] = useState({ text: '', err: false });
  const [draft, setDraft] = useState(() => EMPTY_DRAFT(todayStr()));
  const [fillTick, setFillTick] = useState(0); // يُزاد كلما وجب دفع بيانات التلميذ إلى الحقول غير المتحكَّم بها
  const timer = useRef(null);
  const askedFor = useRef('');
  const userRef = useRef(user);
  const saveRef = useRef(null);
  const nameRef = useRef(null);
  const massarRef = useRef(null);
  const levelRef = useRef(null);

  const setCur = (next) => { curRef.current = next; setCurState(next); };
  const setAll = (next) => { allRef.current = next; setAllState(next); };
  const flash = (text, err = false) => setMsg({ text, err });
  const later = () => { clearTimeout(timer.current); timer.current = setTimeout(() => saveRef.current(true), 700); };
  // كل تعديل على البرنامج يمرّ من هنا: يحدّث الحالة ويجدول الحفظ التلقائي (إلا إن أعاد fn الكائن نفسه)
  const update = (fn, { autosave = true } = {}) => {
    const next = fn(curRef.current);
    if (next === curRef.current) return;
    setCur(next);
    if (autosave) later();
  };

  // ── الحقول الثلاثة غير المتحكَّم بها (الاسم والمسار والقسم): الإكمال التلقائي يكتب فيها مباشرة بلا أحداث، فنقرؤها كما كانت sync القديمة ──
  const readStudentDom = () => {
    let next = curRef.current;
    [[nameRef, 'studentName'], [massarRef, 'massar'], [levelRef, 'level']].forEach(([ref, k]) => {
      const el = ref.current;
      if (el && el.value !== (next[k] || '')) next = { ...next, [k]: el.value };
    });
    if (next !== curRef.current) setCur(next);
  };
  const loadProgram = (p) => { setCur(clone(p)); setFillTick((t) => t + 1); flash(''); };
  const sync = () => {
    readStudentDom();
    const c = curRef.current;
    const key = dupKey(c);
    if (key && key !== askedFor.current) {
      askedFor.current = key;
      const ex = findActiveDuplicate(allRef.current, c);
      if (ex && window.confirm(CONFIRM.OPEN_EXISTING)) { loadProgram(ex); return; }
      later();
    }
  };

  const save = (quiet) => {
    sync();
    const c = curRef.current;
    if (!canSave(c)) { if (!quiet) flash(MSG.NAME_FIRST, true); return false; }
    const r = upsert(allRef.current, c, new Date().toISOString());
    setCur(r.cur);
    setAll(r.all);
    if (!storeAll(storage(), userRef.current, r.all)) flash(MSG.STORAGE_FULL, true);
    else if (!quiet) flash(MSG.SAVED);
    return true;
  };
  saveRef.current = save;

  // تبدّل المستخدم (خروج/دخول بحساب آخر): نبدأ ببرنامج فارغ وأرشيف الحساب الجديد حتى لا يُكتب برنامج مستخدم في أرشيف آخر
  useEffect(() => {
    if (userRef.current === user) return;
    userRef.current = user;
    clearTimeout(timer.current);
    askedFor.current = '';
    setCur(blank());
    setAll(loadAll(storage(), user));
    setFillTick((t) => t + 1);
    flash('');
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearTimeout(timer.current), []);

  // فتح البوابة = iipInit القديمة: إعادة قراءة الأرشيف، إبقاء البرنامج الجاري كما هو، تاريخ الجلسة اليوم
  useEffect(() => {
    if (!active) return;
    setAll(loadAll(storage(), userRef.current));
    if (!curRef.current || !curRef.current.id) setCur(blank());
    setFillTick((t) => t + 1);
    flash('');
    setDraft((d) => ({ ...d, date: todayStr() }));
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const c = curRef.current;
    if (nameRef.current) nameRef.current.value = c.studentName || '';
    if (massarRef.current) massarRef.current.value = c.massar || '';
    if (levelRef.current) levelRef.current.value = c.level || '';
  }, [fillTick]);

  useEffect(() => {
    if (!active) return;
    try { acSetup(AC_CFG); } catch (e) { console.error(e); }
    if (nameRef.current && students.length === 0) nameRef.current.placeholder = NAME_PLACEHOLDER_EMPTY_DB;
  }, [active, students.length]);

  const sugg = (k) => buildSuggestions(curRef.current)[k]();

  // ── حقل مرتبط بمسار في البرنامج (assess.risks …) ──
  const P = (path, o = {}) => {
    const { label, w, area, rows, type = 'text', min, max, ph, id, sk, kind } = o;
    const value = getPath(cur, path) ?? '';
    const set = (v) => update((c) => setPath(c, path, v));
    const onChange = (e) => set(e.target.value);
    const input = area
      ? <textarea id={id} rows={rows} value={value} onChange={onChange} />
      : <input id={id} type={type} min={min} max={max} placeholder={ph} value={value} onChange={onChange} />;
    return (
      <label className={w ? 'iip-w' + w : undefined}>
        {label}{input}
        {sk && <Sg build={() => sugg(sk)} kind={kind || (area ? 'area' : type === 'text' ? 'one' : 'replace')} value={String(value)} onChange={set} />}
      </label>
    );
  };
  const Sel = (path, label, options, o = {}) => {
    const value = getPath(cur, path) ?? '';
    return (
      <label className={o.w ? 'iip-w' + o.w : undefined}>
        {label}
        <select className="iip-sel" id={o.id} value={value} onChange={(e) => update((c) => setPath(c, path, e.target.value))}>
          {options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
        </select>
      </label>
    );
  };
  const Chk = (path, label) => (
    <label><input type="checkbox" checked={!!getPath(cur, path)} onChange={(e) => update((c) => setPath(c, path, e.target.checked))} /> {label}</label>
  );

  // ── إجراءات ──
  const onPickModel = (k) => {
    const r = pickModel(curRef.current, k);
    if (r.error) { flash(r.error, true); return; }
    setCur(r.cur); later();
  };
  const onAutoplan = () => {
    const c = curRef.current;
    const r = autoplan(c);
    if (r.error) { flash(r.error, true); return; }
    if (c.strategies && !window.confirm(CONFIRM.REPLACE_STRATEGIES)) return;
    setCur(r.cur); flash('');
  };
  const onAddSession = () => {
    const r = addSession(curRef.current, draft, todayStr());
    if (r.error) { flash(r.error, true); return; }
    setCur(r.cur);
    setDraft((d) => ({ ...d, dur: '', scale: '', focus: '', tech: '', task: '', resp: '', next: '' }));
    later(); flash('');
  };
  const onNew = () => {
    if (curRef.current.studentName && !window.confirm(CONFIRM.NEW_PROGRAM)) return;
    save(true);
    setCur(blank()); setFillTick((t) => t + 1); flash('');
  };
  const onOpen = (id) => {
    const p = allRef.current.find((x) => x.id === id);
    if (p) { loadProgram(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const onDelete = (id) => {
    if (!window.confirm(CONFIRM.DELETE)) return;
    const next = allRef.current.filter((x) => x.id !== id);
    setAll(next);
    storeAll(storage(), userRef.current, next);
    if (curRef.current.id === id) setCur(blank());
    setFillTick((t) => t + 1); flash('');
  };
  const reportNow = () => {
    if (!curRef.current.studentName) { flash(MSG.NAME_FIRST, true); return null; }
    save(true);
    return reportHtml(curRef.current, reportContext(profile, logo()));
  };
  const onPrint = () => { const h = reportNow(); if (h) printReport('<div>' + h + '</div>'); };
  const onWord = () => {
    const h = reportNow();
    if (h) exportReportWord(h, curRef.current.studentName).catch(() => flash(MSG.WORD_FAILED, true));
  };

  const recs = recommendedModels(cur.domain);
  const draftField = (k, label, o = {}) => {
    const { w, area, rows, type = 'text', min, max, ph, id, sk, kind } = o;
    const set = (v) => setDraft((d) => ({ ...d, [k]: v }));
    const input = area
      ? <textarea id={id} rows={rows} value={draft[k]} onChange={(e) => set(e.target.value)} />
      : <input id={id} type={type} min={min} max={max} placeholder={ph} value={draft[k]} onChange={(e) => set(e.target.value)} />;
    return (
      <label className={w ? 'iip-w' + w : undefined}>
        {label}{input}
        {sk && <Sg build={() => sugg(sk)} kind={kind || (area ? 'area' : type === 'text' ? 'one' : 'replace')} value={draft[k]} onChange={set} />}
      </label>
    );
  };
  const goalField = (g, i, k, label, o = {}) => {
    const { w, type = 'text', kind } = o;
    const set = (v) => update((c) => setGoalField(c, i, k, v));
    return (
      <label className={w ? 'iip-w' + w : undefined}>
        {label}
        <input type={type} value={g[k] ?? ''} onChange={(e) => set(e.target.value)} />
        <Sg build={() => sugg('goal.' + k)} kind={kind} value={String(g[k] ?? '')} onChange={set} />
      </label>
    );
  };

  const prog = progressView(cur);
  const rows = archiveRows(all);

  return (
    <div onBlur={() => setTimeout(sync, 200)} onClick={() => setTimeout(sync, 60)}>
      <div className="iip-note">
        🧭 يعتمد هذا النموذج على مسار التدخل المتدرج المعتمد دولياً في العمل الاجتماعي المدرسي (التقييم ← الهدف ← التدخل ← المتابعة ← التقويم)، ويتيح اختيار نماذج تدخلية قائمة على الأدلة: العلاج المركّز على الحلول، المقابلة التحفيزية، العلاج المعرفي السلوكي، الممارسة المرتكزة على المهام، تسجيل الدخول والخروج، التدخل المراعي للصدمة، إدارة الحالة/الرعاية المحيطة، والتدخل في الأزمات.
      </div>

      {/* 1) التلميذ */}
      <div className="iip-card">
        <h3><span className="iip-n">1</span> التلميذ(ة) والموافقات</h3>
        <div className="iip-grid">
          <label className="iip-w2">اسم التلميذ(ة) * <small className="iip-small">(اكتب أول حروف الاسم أو رقم مسار — تُملأ بقية المعطيات تلقائياً من لائحة التلاميذ)</small>
            <div className="student-autocomplete-wrapper">
              <input ref={nameRef} type="text" id="iip_name" placeholder="الاسم الكامل" onInput={(e) => { const v = e.target.value; update((c) => ({ ...c, studentName: v })); }} />
              <div className="student-autocomplete-dropdown" id="iip_name_dropdown" />
            </div>
          </label>
          <label>رقم مسار<input ref={massarRef} type="text" id="iip_massar" placeholder="تلقائي" onInput={(e) => { const v = e.target.value; update((c) => ({ ...c, massar: v })); }} /></label>
          <label>القسم / المستوى<input ref={levelRef} type="text" id="iip_level" placeholder="تلقائي" onInput={(e) => { const v = e.target.value; update((c) => ({ ...c, level: v })); }} /></label>
          {P('opened', { label: 'تاريخ فتح البرنامج', type: 'date', id: 'iip_open' })}
          {Sel('referral.source', 'مصدر الإحالة', [['', '— اختر —'], ['الأستاذ(ة)', 'الأستاذ(ة)'], ['الإدارة', 'الإدارة'], ['التلميذ(ة) نفسه', 'التلميذ(ة) نفسه'], ['والد(ة) التلميذ(ة)', 'والد(ة) التلميذ(ة)']])}
          {P('referral.reason', { label: 'سبب الإحالة / الوضعية', w: 2, id: 'iip_reason', ph: 'وصف مختصر لسبب الإحالة' })}
          <div className="iip-w4">
            <div className="iip-chips-t">💡 اقتراحات لوصف الحالة (انقر لإضافتها):</div>
            <Chips id="iip_rsug" items={RSUG} onPick={(t) => update((c) => {
              const nv = applySuggestion(getPath(c, 'referral.reason') || '', t, 'one');
              return nv == null ? c : setPath(c, 'referral.reason', nv);
            })} />
          </div>
        </div>
        <div className="iip-checks">
          {Chk('consent.parent', 'موافقة ولي الأمر')}
          {Chk('consent.student', 'رضا التلميذ(ة) وتفهّمه للبرنامج')}
          {Chk('consent.conf', 'شُرحت حدود السرية المهنية')}
        </div>
      </div>

      {/* 2) التقييم */}
      <div className="iip-card">
        <h3><span className="iip-n">2</span> التقييم الأولي (المنظور البيئي)</h3>
        <div className="iip-grid">
          <label className="iip-w2">مجال التدخل الرئيسي
            <select id="iip_domain" className="iip-sel" value={cur.domain || ''} onChange={(e) => update((c) => ({ ...c, domain: e.target.value }))}>
              <option value="">— اختر —</option>
              {Object.keys(DOM).map((k) => <option key={k} value={k}>{DOM[k][0]}</option>)}
            </select>
          </label>
          {P('assess.problem', { label: 'وصف المشكلة (متى؟ أين؟ كم مرة؟ ما أثرها؟)', w: 3, area: true, rows: 3, id: 'iip_problem' })}
          <div className="iip-w3">
            <div className="iip-chips-t">💡 صياغات مقترحة حسب مجال التدخل (انقر للإضافة ثم أكمل الفراغات):</div>
            <Chips id="iip_psug" items={PSUG[cur.domain] || PSUG._} onPick={(t) => update((c) => {
              const nv = applySuggestion(getPath(c, 'assess.problem') || '', t, 'area');
              return nv == null ? c : setPath(c, 'assess.problem', nv);
            })} />
          </div>
          {P('assess.strengths', { label: 'نقاط القوة والموارد (الاستثناءات: متى لا تحدث المشكلة؟)', w: 3, area: true, rows: 2, sk: 'assess.strengths' })}
          {P('assess.risks', { label: 'عوامل الخطر', area: true, rows: 3, sk: 'assess.risks' })}
          {P('assess.protect', { label: 'عوامل الحماية', area: true, rows: 3, sk: 'assess.protect' })}
          {P('assess.family', { label: 'الأسرة', area: true, rows: 3, sk: 'assess.family' })}
          {P('assess.school', { label: 'المدرسة / الأقران', area: true, rows: 3, sk: 'assess.school' })}
          {P('assess.community', { label: 'المجتمع / جهات أخرى (صحة، جمعيات، حماية الطفولة…)', w: 2, area: true, rows: 3, sk: 'assess.community' })}
        </div>
        <div className="iip-sub">المؤشرات القاعدية (قبل التدخل)</div>
        <div className="iip-grid">
          {P('baseline.abs', { label: 'ساعات الغياب/الشهر', type: 'number', min: 0, sk: 'baseline.abs' })}
          {P('baseline.inc', { label: 'وقائع سلوكية/الأسبوع', type: 'number', min: 0, sk: 'baseline.inc' })}
          {P('baseline.well', { label: 'الرفاه النفسي (0-10)', type: 'number', min: 0, max: 10, sk: 'baseline.well' })}
          {P('baseline.mot', { label: 'الدافعية للتغيير (0-10)', type: 'number', min: 0, max: 10, sk: 'baseline.mot' })}
        </div>
      </div>

      {/* 3) النموذج التدخلي */}
      <div className="iip-card">
        <h3><span className="iip-n">3</span> اختيار النموذج التدخلي</h3>
        <div className="iip-hint">⭐ النماذج الموصى بها تظهر حسب «مجال التدخل». يمكن الجمع بين نموذجين على الأكثر (نموذج رئيسي + مكمّل).</div>
        <div id="iip_models" className="iip-models">
          {Object.keys(MODELS).map((k) => {
            const m = MODELS[k]; const on = cur.models.includes(k); const pr = cur.primary === k;
            return (
              <div key={k} className={'iip-m' + (on ? ' on' : '')} onClick={() => onPickModel(k)}>
                <div className="iip-mh"><b>{m.n}</b>{recs.includes(k) && <span className="iip-star">⭐ موصى به</span>}</div>
                <div className="iip-me">{m.en} · {m.tier}</div>
                <div className="iip-mf">{m.fit}</div>
                {on && <div className="iip-pri">{pr ? '✔ نموذج رئيسي' : <u onClick={(e) => { e.stopPropagation(); setCur(setPrimary(curRef.current, k)); later(); }}>اجعله رئيسياً</u>}</div>}
              </div>
            );
          })}
        </div>
        <div id="iip_mdetail">
          {cur.models.map((k) => {
            const m = MODELS[k];
            return (
              <div className="iip-d" key={k}>
                <h4>{m.n}{cur.primary === k ? ' — (رئيسي)' : ''}</h4>
                <p>{m.o}</p>
                <div className="iip-cols">
                  <div><b>المراحل / الخطوات</b><ol>{m.steps.map((s, i) => <li key={i}>{s}</li>)}</ol></div>
                  <div>
                    <b>التقنيات</b><ul>{m.tech.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    <b>الوتيرة المقترحة</b><p>{m.sess}</p>
                    <b>مؤشرات التتبع</b><p>{m.ind}</p>
                    <div className="iip-ev">📚 {m.ev}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4) الخطة */}
      <div className="iip-card">
        <h3><span className="iip-n">4</span> الخطة الفردية (أهداف SMART)</h3>
        <div id="iip_goals">
          {cur.goals.map((g, i) => (
            <div className="iip-g" key={i}>
              <div className="iip-gh">الهدف {i + 1}<button type="button" className="iip-x" onClick={() => { setCur(delGoal(curRef.current, i)); later(); }}>✕</button></div>
              <div className="iip-grid">
                {goalField(g, i, 'text', 'الهدف (محدد، قابل للقياس، واقعي، زمني)', { w: 3, kind: 'one' })}
                {goalField(g, i, 'ind', 'مؤشر القياس', { w: 2, kind: 'one' })}
                {goalField(g, i, 'base', 'القيمة الحالية', { kind: 'replace' })}
                {goalField(g, i, 'target', 'القيمة المستهدفة', { kind: 'replace' })}
                {goalField(g, i, 'due', 'الأجل', { type: 'date', kind: 'replace' })}
                <label>مستوى التحقق
                  <select className="iip-sel" value={g.done ?? ''} onChange={(e) => update((c) => setGoalField(c, i, 'done', e.target.value))}>
                    {DONE_LEVELS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              </div>
            </div>
          ))}
        </div>
        <div className="iip-row">
          <button type="button" className="iip-btn" onClick={() => setCur(addGoal(curRef.current))}>➕ هدف جديد</button>
          <button type="button" className="iip-btn" onClick={onAutoplan}>✨ اقتراح استراتيجيات من النموذج المختار</button>
        </div>
        <div className="iip-grid" style={{ marginTop: 12 }}>
          {P('strategies', { label: 'الاستراتيجيات والإجراءات', w: 3, area: true, rows: 5, sk: 'strategies' })}
          {P('roles.student', { label: 'دور التلميذ(ة)', area: true, rows: 3, sk: 'roles.student' })}
          {P('roles.family', { label: 'دور الأسرة', area: true, rows: 3, sk: 'roles.family' })}
          {P('roles.teachers', { label: 'دور الأساتذة / الحراسة', area: true, rows: 3, sk: 'roles.teachers' })}
          {P('roles.partners', { label: 'شركاء خارجيون', area: true, rows: 2, sk: 'roles.partners' })}
          {P('schedule.start', { label: 'بداية الجلسات', type: 'date', sk: 'schedule.start' })}
          {Sel('schedule.freq', 'الوتيرة', [['', '—'], ['يومياً (دقائق)', 'يومياً (دقائق)'], ['مرتان في الأسبوع', 'مرتان في الأسبوع'], ['أسبوعياً', 'أسبوعياً'], ['كل أسبوعين', 'كل أسبوعين']])}
          {P('schedule.dur', { label: 'مدة الجلسة (د)', type: 'number', min: 5, sk: 'schedule.dur' })}
          {P('schedule.total', { label: 'عدد الجلسات المبرمجة', type: 'number', min: 1, sk: 'schedule.total' })}
        </div>
      </div>

      {/* 5) الجلسات */}
      <div className="iip-card">
        <h3><span className="iip-n">5</span> سجل الجلسات والمتابعة</h3>
        <div className="iip-grid iip-sess">
          {draftField('date', 'التاريخ', { type: 'date', id: 's_date' })}
          {draftField('dur', 'المدة (د)', { type: 'number', min: 5, id: 's_dur', sk: 'sess.dur' })}
          {draftField('scale', 'التقدم (0-10)', { type: 'number', min: 0, max: 10, id: 's_scale', sk: 'sess.scale' })}
          {draftField('focus', 'محور الجلسة', { w: 3, id: 's_focus', sk: 'sess.focus' })}
          {draftField('tech', 'التقنيات المستعملة', { w: 2, id: 's_tech', ph: 'سؤال المعجزة، التدرّج، إعادة الصياغة…', sk: 'sess.tech' })}
          {draftField('task', 'المهمة المتفق عليها', { w: 2, id: 's_task', sk: 'sess.task' })}
          {draftField('resp', 'استجابة التلميذ(ة) وملاحظات', { w: 3, area: true, rows: 2, id: 's_resp', sk: 'sess.resp' })}
          {draftField('next', 'الخطوة التالية', { w: 3, id: 's_next', sk: 'sess.next' })}
        </div>
        <div className="iip-row"><button type="button" className="iip-btn pri" onClick={onAddSession}>➕ إضافة الجلسة</button></div>
        <div className="iip-scroll">
          <table className="iip-t" id="iip_sess">
            <tbody>
              {cur.sessions.length ? (
                <>
                  <tr><th>#</th><th>التاريخ</th><th>المدة</th><th>المحور</th><th>التقنيات</th><th>المهمة</th><th>التقدم</th><th>ملاحظات</th><th>التالي</th><th /></tr>
                  {cur.sessions.map((s, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td><td>{s.date}</td><td>{s.dur}</td><td>{s.focus}</td><td>{s.tech}</td><td>{s.task}</td><td><b>{s.scale}</b></td><td>{s.resp}</td><td>{s.next}</td>
                      <td><button type="button" className="iip-x" onClick={() => { setCur(delSession(curRef.current, i)); later(); }}>✕</button></td>
                    </tr>
                  ))}
                </>
              ) : <tr><td className="iip-empty">{EMPTY_SESSIONS_TEXT}</td></tr>}
            </tbody>
          </table>
        </div>
        <div id="iip_chart" dangerouslySetInnerHTML={{ __html: chartSvg(cur.sessions, false) }} />
      </div>

      {/* 6) التقويم */}
      <div className="iip-card">
        <h3><span className="iip-n">6</span> التقويم والإغلاق</h3>
        <div id="iip_progress" className="iip-prog">
          {prog.map((it) => (it.label ? <span key={it.key}>{it.label}<b>{it.bold}</b></span> : <span key={it.key}>{it.text}</span>))}
        </div>
        <div className="iip-grid">
          {P('review.date', { label: 'تاريخ المراجعة', type: 'date', sk: 'review.date' })}
          {Sel('review.outcome', 'النتيجة', [['', '— قيد التنفيذ —'], ['تحققت الأهداف', 'تحققت الأهداف'], ['تحقق جزئي (تمديد البرنامج)', 'تحقق جزئي (تمديد البرنامج)'], ['لم تتحقق (مراجعة النموذج)', 'لم تتحقق (مراجعة النموذج)'], ['إحالة إلى جهة مختصة', 'إحالة إلى جهة مختصة'], ['انتقال/مغادرة', 'انتقال/مغادرة']])}
          {Sel('status', 'حالة البرنامج', [['نشط', 'نشط'], ['منتهٍ', 'منتهٍ']])}
          {P('post.abs', { label: 'مؤشرات بعدية: غياب/شهر', type: 'number', min: 0, sk: 'post.abs' })}
          {P('post.inc', { label: 'وقائع/أسبوع', type: 'number', min: 0, sk: 'post.inc' })}
          {P('post.well', { label: 'رفاه (0-10)', type: 'number', min: 0, max: 10, sk: 'post.well' })}
          {P('review.notes', { label: 'خلاصة التقويم والتوصيات / المتابعة بعد الإغلاق', w: 3, area: true, rows: 3, sk: 'review.notes' })}
        </div>
        <div className="iip-row" style={{ marginTop: 12 }}>
          <button type="button" className="iip-btn pri" onClick={() => save(false)}>💾 حفظ البرنامج</button>
          <button type="button" className="iip-btn" onClick={onPrint}>🖨 طباعة التقرير</button>
          <button type="button" className="iip-btn" onClick={onWord}>📄 تصدير Word</button>
          <button type="button" className="iip-btn" onClick={onNew}>🆕 برنامج جديد</button>
        </div>
        <div id="iip_msg" className="iip-msg" style={{ color: msg.err ? '#b91c1c' : '#0f766e' }}>{msg.text}</div>
      </div>

      {/* الأرشيف */}
      <div className="iip-card">
        <h3>🗃 أرشيف البرامج الفردية</h3>
        <div id="iip_arch">
          {rows.length ? (
            <table className="iip-t">
              <tbody>
                <tr><th>التلميذ(ة)</th><th>القسم</th><th>المجال</th><th>النموذج الرئيسي</th><th>الجلسات</th><th>الحالة</th><th /></tr>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td><td>{r.level}</td><td>{r.domain}</td><td>{r.primary}</td><td>{r.sessions}</td><td>{r.status}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className="iip-btn" onClick={() => onOpen(r.id)}>فتح</button>{' '}
                      <button type="button" className="iip-btn dng" onClick={() => onDelete(r.id)}>حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="iip-empty">{EMPTY_ARCHIVE_TEXT}</div>}
        </div>
      </div>
    </div>
  );
}

// المرحلة 17: البرنامج التدخلي الفردي — يُرسم داخل #mountIip في صفحة toolIip القديمة (شريط العودة بقي في body.html)
export default function IipPortal({ mount }) {
  if (!mount) return null;
  return createPortal(<IipBody />, mount);
}
