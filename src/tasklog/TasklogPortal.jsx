import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useCollection, useCurrentPortal, useProfile } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import {
  TL_TYPES, TYPE_ICONS, RESULTS, NATURE_SUGGESTIONS, NOTE_SUGGESTIONS, EMPTY_LIST_TEXT, EMPTY_REPORT_ALERT,
  validateForm, makeTask, addTask, editTask, deleteTask, filterTasks, weekRange, monthRange, statsOf, groupByDate, buildReport, appendText,
} from './tasklogLogic.js';
import { openTaskReport } from './reportModal.js';

// دائماً من المخزن لحظة الحدث لا من آخر رسم
const currentTasks = () => getState().collections.taskLog ?? [];
const currentInterviews = () => getState().collections.interviewArchive ?? [];

const rowInput = { border: '1px solid #e2e8f0', borderRadius: 5, padding: '3px 6px', fontSize: '0.78rem', width: '100%', fontFamily: "'Cairo',sans-serif" };

// حقل نصي يحفظ عند حدث change الأصلي (الخروج من الحقل أو Enter) لا عند كل ضغطة مفتاح، كالقديم (onchange)
function CommitInput({ value, onCommit, ...rest }) {
  const ref = useRef(null);
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;
  useEffect(() => {
    const el = ref.current;
    const on = () => commitRef.current(el.value);
    el.addEventListener('change', on);
    return () => el.removeEventListener('change', on);
  }, []);
  // إن تغيّرت القيمة من الخارج (مثلاً بعد مزامنة سحابية) نحدّث الحقل
  useEffect(() => { if (ref.current && ref.current.value !== value) ref.current.value = value; }, [value]);
  return <input ref={ref} type="text" defaultValue={value} {...rest} />;
}

function TaskRow({ task, onEdit, onDelete }) {
  return (
    <tr id={'tl-row-' + task.id}>
      <td style={{ whiteSpace: 'nowrap', minWidth: 110 }}>
        <input type="date" value={task.date || ''} onChange={(e) => onEdit(task.id, 'date', e.target.value)}
          style={{ ...rowInput, padding: '3px 5px', fontSize: '0.75rem' }} />
      </td>
      <td style={{ minWidth: 160 }}>
        <select value={task.type} onChange={(e) => onEdit(task.id, 'type', e.target.value)} style={rowInput}>
          {TL_TYPES.map((tp) => <option key={tp} value={tp}>{(TYPE_ICONS[tp] || '') + ' ' + tp}</option>)}
        </select>
      </td>
      <td style={{ minWidth: 140 }}>
        <CommitInput value={task.title || ''} onCommit={(v) => onEdit(task.id, 'title', v)} placeholder="اسم المهمة..." style={rowInput} />
      </td>
      <td style={{ textAlign: 'center' }}>
        <button type="button" onClick={() => onDelete(task.id)} title="حذف"
          style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1rem' }}>🗑</button>
      </td>
    </tr>
  );
}

function TasklogBody() {
  const active = useCurrentPortal() === 'tasklog';
  const [tasks, setTasks] = useCollection('taskLog');
  const institution = useProfile().institution || '';
  // القائمة المعروضة لقطة من المعرّفات تُؤخذ عند أحداث «إعادة الرسم» فقط (فتح البوابة، تطبيق، إضافة، حذف، تعديل تاريخ)،
  // فلا يختفي صف عُدِّل نوعه أو اسمه تحت تصفية نشطة، ولا تتبدّل القائمة وحدها عند تسجيل أدوات أخرى مهاماً — كالقديم
  const [shownIds, setShownIds] = useState([]);
  const [open, setOpen] = useState(true);
  const [arrow, setArrow] = useState('▼'); // القديم: السهم ▼ في البداية والنافذة مفتوحة، ثم ▲ ▼ بعد كل نقرة
  const [justAdded, setJustAdded] = useState(false);
  const f = useRef({});
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const ref = (k) => (el) => { f.current[k] = el; };
  const radio = (name) => { const el = document.querySelector('#toolTasklog input[name="' + name + '"]:checked'); return el ? el.value : ''; };
  const readFilter = () => ({ from: f.current.from.value, to: f.current.to.value, type: f.current.ftype.value, result: f.current.fresult.value });
  const readForm = () => ({
    date: f.current.date.value, time: f.current.time.value, school: f.current.school.value, type: radio('tl_type'),
    nature: f.current.nature.value, title: f.current.title.value, target: f.current.target.value, notes: f.current.notes.value,
    result: radio('tl_result'), duration: f.current.duration.value,
  });

  const commit = (filter = readFilter()) => setShownIds(filterTasks(currentTasks(), filter).map((t) => t.id));
  const persist = (next) => setTasks(next).catch((e) => { console.error(e); alert('❌ فشل حفظ البيانات'); });

  // اسم المؤسسة في حقل المؤسسة: القديم يكتبه applyInstitutionEverywhere مباشرة في #tl_school عند الدخول وتغيّر الملف الشخصي
  useEffect(() => { if (f.current.school) f.current.school.value = institution; }, [institution]);

  // فتح البوابة = إعادة رسم القائمة بالتصفية الحالية (حقول التصفية نفسها تبقى كما تركها المستخدم)
  useEffect(() => { if (active) commit(); }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearForm = () => {
    for (const k of ['date', 'time', 'school', 'nature', 'title', 'target', 'notes', 'duration']) f.current[k].value = '';
    document.querySelectorAll('#toolTasklog input[name="tl_type"], #toolTasklog input[name="tl_result"]').forEach((el) => { el.checked = false; });
  };

  const add = () => {
    const form = readForm();
    const err = validateForm(form);
    if (err) { alert(err); return; }
    persist(addTask(currentTasks(), makeTask(form)));
    commit();
    clearForm();
    setJustAdded(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 1500);
  };

  const setRange = (r) => {
    f.current.from.value = r.from; f.current.to.value = r.to; f.current.ftype.value = ''; f.current.fresult.value = '';
  };
  const clearFilter = () => {
    f.current.from.value = ''; f.current.to.value = ''; f.current.ftype.value = ''; f.current.fresult.value = '';
    commit();
  };

  const edit = (id, field, value) => {
    const cur = currentTasks();
    const next = editTask(cur, id, field, value);
    if (next === cur) return;
    persist(next);
    if (field === 'date') commit(); // لإعادة ترتيب المجموعات
  };
  const del = (id) => {
    if (!confirm('حذف هذه المهمة؟')) return;
    persist(deleteTask(currentTasks(), id));
    commit();
  };
  const clearAll = () => {
    if (!confirm('هل أنت متأكد من حذف جميع المهام المسجلة؟')) return;
    persist([]);
    commit();
  };

  const report = () => {
    const fl = readFilter();
    const res = buildReport(filterTasks(currentTasks(), fl), currentInterviews(), fl.from, fl.to);
    if (!res) { alert(EMPTY_REPORT_ALERT); return; }
    openTaskReport(res.html);
  };
  const weeklyReport = () => { setRange(weekRange(new Date(), 0)); commit(); report(); };

  const toggle = () => { const next = !open; setOpen(next); setArrow(next ? '▲' : '▼'); };

  const shown = useMemo(() => {
    const byId = new Map();
    for (const t of tasks) if (!byId.has(t.id)) byId.set(t.id, t);
    return shownIds.map((id) => byId.get(id)).filter(Boolean);
  }, [tasks, shownIds]);
  const st = statsOf(shown);
  const groups = useMemo(() => groupByDate(shown), [shown]);

  return (
    <>
      <div className="info-box">
        💡 <span>سجّل مهامك اليومية بشكل منظم: ورشات، جلسات إنصات، اتصالات، اجتماعات... ثم أنشئ تقريراً أسبوعياً شاملاً للطباعة أو الأرشفة.</span>
      </div>

      <div className="section-card">
        <div className="section-header"><span className="step-badge">١</span> إضافة مهمة جديدة</div>
        <div className="section-body">
          <div className="form-grid">
            <div className="form-group"><label>📅 التاريخ *</label><input type="date" id="tl_date" ref={ref('date')} /></div>
            <div className="form-group"><label>🕐 الساعة</label><input type="time" id="tl_time" placeholder="HH:MM" ref={ref('time')} /></div>
            <div className="form-group"><label>🏫 المؤسسة التعليمية</label><input type="text" id="tl_school" placeholder="الثانوية الإعدادية المختار السوسي" defaultValue="" ref={ref('school')} /></div>
            <div className="form-group col-span-2">
              <label>نوع المهمة *</label>
              <div className="radio-group" style={{ flexWrap: 'wrap', gap: 8 }}>
                {TL_TYPES.map((tp) => (
                  <label key={tp}><input type="radio" name="tl_type" value={tp} /> {TYPE_ICONS[tp] + ' ' + tp}</label>
                ))}
              </div>
            </div>
            <div className="form-group"><label>📌 العنوان / الموضوع</label><input type="text" id="tl_title" placeholder="مثال: ورشة الحضور والغياب، جلسة مع محمد..." ref={ref('title')} /></div>
            <div className="form-group"><label>👤 المعني(ون) بالمهمة</label><input type="text" id="tl_target" placeholder="اسم التلميذ أو ولي الأمر أو الجهة..." ref={ref('target')} /></div>
            <div className="form-group col-span-2">
              <label>🧩 طبيعة المهمة الخاصة بالمختص الاجتماعي</label>
              <input type="text" id="tl_nature" placeholder="اكتب طبيعة المهمة أو اختر اقتراحاً..." ref={ref('nature')} />
              <div style={{ marginTop: 6 }}>
                <div className="suggest-chips-label">💡 اقتراحات جاهزة:</div>
                <div className="suggest-chips">
                  {NATURE_SUGGESTIONS.map((s) => (
                    <button key={s} type="button" className="suggest-chip" onClick={() => { f.current.nature.value = s; }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-group col-span-2">
              <label>📝 تفاصيل / ملاحظات</label>
              <textarea id="tl_notes" placeholder="اكتب تفاصيل المهمة، ما تم، والنتيجة..." style={{ minHeight: 75 }} ref={ref('notes')} />
              <div style={{ marginTop: 6 }}>
                <div className="suggest-chips-label">💡 اقتراحات جاهزة:</div>
                <div className="suggest-chips">
                  {NOTE_SUGGESTIONS.map((s) => (
                    <button key={s.label} type="button" className="suggest-chip"
                      onClick={() => { const el = f.current.notes; el.value = appendText(el.value, s.text); el.focus(); }}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>النتيجة</label>
              <div className="radio-group">
                <label><input type="radio" name="tl_result" value="مُنجز" /> ✅ مُنجز</label>
                <label><input type="radio" name="tl_result" value="قيد المتابعة" /> 🔄 قيد المتابعة</label>
                <label><input type="radio" name="tl_result" value="لم يكتمل" /> ❌ لم يكتمل</label>
              </div>
            </div>
            <div className="form-group"><label>⏱ المدة (بالدقائق)</label><input type="number" id="tl_duration" placeholder="مثال: 45" min="5" max="480" ref={ref('duration')} /></div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={add}>{justAdded ? '✅ تمت الإضافة!' : '➕ إضافة المهمة للسجل'}</button>
            <button type="button" className="btn btn-outline" onClick={clearForm}>🗑 مسح النموذج</button>
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header"><span className="step-badge">٢</span> عرض وتصفية السجل</div>
        <div className="section-body">
          <div className="form-grid">
            <div className="form-group"><label>📅 من تاريخ</label><input type="date" id="tl_filter_from" ref={ref('from')} /></div>
            <div className="form-group"><label>📅 إلى تاريخ</label><input type="date" id="tl_filter_to" ref={ref('to')} /></div>
            <div className="form-group">
              <label>نوع المهمة</label>
              <select id="tl_filter_type" ref={ref('ftype')} defaultValue="">
                <option value="">— الكل —</option>
                {TL_TYPES.map((tp) => <option key={tp}>{tp}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>النتيجة</label>
              <select id="tl_filter_result" ref={ref('fresult')} defaultValue="">
                <option value="">— الكل —</option>
                {RESULTS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button type="button" className="btn btn-outline" onClick={() => setRange(weekRange(new Date(), 0))}>📅 هذا الأسبوع</button>
            <button type="button" className="btn btn-outline" onClick={() => setRange(weekRange(new Date(), -1))}>📅 الأسبوع الماضي</button>
            <button type="button" className="btn btn-outline" onClick={() => setRange(monthRange(new Date()))}>📆 هذا الشهر</button>
            <button type="button" className="btn btn-outline" onClick={clearFilter}>× إلغاء التصفية</button>
            <button type="button" className="btn btn-primary" onClick={() => commit()}>🔍 تطبيق</button>
          </div>
        </div>
      </div>

      <div className="archive-panel">
        <div className="archive-header" onClick={toggle}>
          <div className="archive-header-left">
            <span>📋</span>
            <span>سجل المهام المسجلة</span>
            <span className="archive-badge" id="tlTaskCount">{tasks.length}</span>
          </div>
          <span id="tlPanelArrow">{arrow}</span>
        </div>
        <div className={'archive-body' + (open ? ' open' : '')} id="tlTaskBody">
          <div className="archive-stats" id="tlStats">
            <div className="archive-stat">📋 إجمالي: {st.total}</div>
            <div className="archive-stat" style={{ color: '#16a34a' }}>✅ مُنجز: {st.done}</div>
            <div className="archive-stat" style={{ color: '#d97706' }}>🔄 متابعة: {st.pending}</div>
            <div className="archive-stat">⏱ {st.mins} دقيقة</div>
          </div>
          <div id="tlTaskList">
            {!shown.length ? <div className="archive-empty">{EMPTY_LIST_TEXT}</div> : groups.map((g) => (
              <div style={{ marginBottom: 12 }} key={g.date}>
                <div style={{ background: 'linear-gradient(90deg,var(--primary),var(--primary-light))', color: 'white', padding: '7px 14px', borderRadius: '6px 6px 0 0', fontSize: '0.85rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📅 {g.dayName} — {g.date}</span>
                  <span style={{ background: 'rgba(200,169,74,0.85)', color: '#0f2744', borderRadius: 10, padding: '2px 10px', fontSize: '0.78rem' }}>{g.tasks.length} مهام</span>
                </div>
                <table className="archive-table" style={{ borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 110 }}>📅 التاريخ</th>
                      <th style={{ minWidth: 160 }}>📌 نوع المهمة</th>
                      <th style={{ minWidth: 140 }}>✏️ اسم المهمة</th>
                      <th style={{ width: 36 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {g.tasks.map((t) => <TaskRow key={t.id} task={t} onEdit={edit} onDelete={del} />)}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-danger" onClick={clearAll}>🗑 حذف كل السجل</button>
        <button type="button" className="btn btn-outline" onClick={weeklyReport}>📄 تقرير أسبوعي ←</button>
        {/* openWeekPickerModal: تقرير «أسبوع محدد» ما زال في الكود القديم (script-10.js) */}
        <button type="button" className="btn btn-primary" onClick={() => window.openWeekPickerModal && window.openWeekPickerModal()}>📅 تقرير بأسبوع محدد</button>
      </div>
    </>
  );
}

export default function TasklogPortal({ mount }) {
  return mount ? createPortal(<TasklogBody />, mount) : null;
}
