import { useEffect, useRef, useState } from 'react';
import { useCurrentUser, useStudents } from '../store/hooks.js';
import { getStudentsRaw, saveStudents } from '../store/legacyStore.js';
import { StudentDb } from '../students/studentDb.js';
import { printStudentList } from '../students/studentList.js';
import { MSG as IMPORT, readFiles, mergeResults, confirmText, commitImport, dobStats, dobLine } from '../students/studentImport.js';
import { exportStudentList, mergeForExport, EMPTY_MSG } from '../students/studentExport.js';
import { getInstitution } from '../institution/institutionStore.js';
import { getBridge } from '../session/sessionBridge.js';
import {
  COLORS, MSG, classOptions, buildNewStudent, addToCustom, addedText, searchStudents, selectedLabel, extraText,
  deleteConfirmText, deletedText, removeNames, readBackupInfo, restoreConfirmText, restoredText, loadBackup, dropBackup,
  clearConfirmText, clearedText, dropCustomKeys,
} from './studentsLogic.js';

const F = "'Cairo',sans-serif";

const inputBase = { border: '1.5px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontFamily: F, fontSize: '0.82rem', direction: 'rtl', background: 'white' };
const grow = (min) => ({ ...inputBase, flex: 1, minWidth: min });
const btn = (bg, extra) => ({ border: 'none', color: 'white', borderRadius: 8, fontFamily: F, fontWeight: 700, cursor: 'pointer', background: bg, ...extra });
const GREEN = 'linear-gradient(135deg,#166534,#16a34a)';
const RED = 'linear-gradient(135deg,#dc2626,#991b1b)';
const card = { background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 10, padding: 14 };
const cardTitle = { fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 10 };
const IMPORT_MSG_STYLE = { fontSize: '0.78rem', marginTop: 6, minHeight: 16, whiteSpace: 'pre-line' };
const IMPORT_BUSY_COLOR = '#0f766e';
const IMPORT_OK_COLOR = '#16a34a';
// قائمة STUDENTS الأساسية (مصفوفة عامّة قديمة، فارغة اليوم) تُضمّ إلى المخزَّنين عند التصدير كما كان
const exportBase = () => []; // القائمة الأساسية القديمة (STUDENTS) فارغة ولم تعد معرَّفة
const EMPTY_FORM = { family: '', given: '', cls: '', massar: '', gender: '', dob: '' };
const NO_BACKUP = { available: false, info: '' };

export default function StudentsSection() {
  const user = useCurrentUser();
  useStudents(); // يعيد الرسم عند تغيّر القائمة (بعد الإضافة والحذف والاستيراد) فتبقى نتائج البحث حيّة
  const [form, setForm] = useState(EMPTY_FORM);
  const [classes, setClasses] = useState([]);
  const [msg, setMsg] = useState({ text: '', color: '' });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]); // فهارس الصفوف المحددة في النتائج الحالية
  const [backup, setBackup] = useState(NO_BACKUP);
  const [importMsg, setImportMsg] = useState({ text: '', color: IMPORT_BUSY_COLOR });
  const fileRef = useRef(null);
  const timer = useRef(null);

  const show = (text, color, clearAfter) => {
    clearTimeout(timer.current);
    setMsg({ text, color });
    if (clearAfter) timer.current = setTimeout(() => setMsg({ text: '', color: '' }), clearAfter);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  // openSettings القديمة تُطلق legacy:settings-open؛ والاستيراد يكتب النسخة الاحتياطية ثم saveStudents يُطلق legacy:students-changed
  useEffect(() => {
    const refresh = () => setBackup(readBackupInfo(window.localStorage, user));
    refresh();
    window.addEventListener('legacy:settings-open', refresh);
    window.addEventListener('legacy:students-changed', refresh);
    return () => {
      window.removeEventListener('legacy:settings-open', refresh);
      window.removeEventListener('legacy:students-changed', refresh);
    };
  }, [user]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const refreshClasses = () => setClasses(classOptions(StudentDb.list(), getStudentsRaw()));

  const addStudent = () => {
    const r = buildNewStudent(form);
    if (r.error) { show(r.error, COLORS.error); return; }
    const { list, changed } = addToCustom(getStudentsRaw(), r.student);
    if (changed) saveStudents(list);
    try { StudentDb.mergeCustom([r.student]); } catch { /* كما في القديم */ }
    show(addedText(r.name), COLORS.ok, 3000);
    setForm((f) => ({ ...f, family: '', given: '', massar: '', dob: '' }));
    try { getInstitution().updateAllLevelSelects(); refreshClasses(); } catch { /* كما في القديم */ }
    window.dispatchEvent(new Event('legacy:students-changed'));
  };

  // ── الاستيراد من Excel/CSV (الخطوة 44: كان importStudentListFromFile في script-10) ──
  const importEnv = () => {
    const bridge = getBridge() || {};
    const inst = getInstitution();
    return {
      storage: window.localStorage, user, StudentDb, saveStudents,
      saveProfile: (patch, opts) => (bridge.saveProfile ? bridge.saveProfile(patch, opts) : Promise.resolve()),
      getInstitutionName: inst.getInstitutionName, applyInstitutionEverywhere: inst.applyInstitutionEverywhere,
      updateAllLevelSelects: inst.updateAllLevelSelects, getImportedClasses: inst.getImportedClasses,
      now: () => new Date().toLocaleString('ar-MA'),
    };
  };

  const importFiles = async (e) => {
    const input = e.target;
    const files = Array.from(input.files || []);
    if (!files.length) return;
    const fail = (text) => setImportMsg({ text, color: COLORS.error });
    setImportMsg({ text: IMPORT.READING, color: IMPORT_BUSY_COLOR });
    try {
      if (!window.XLSX) { fail(IMPORT.NO_XLSX); return; }
      const results = await readFiles(files, window.XLSX);
      const { unique, info, totalSheets } = mergeResults(results);
      if (!unique.length) { fail(IMPORT.NONE); return; }
      if (!window.confirm(confirmText(unique, files.length, totalSheets, info, dobLine(dobStats(unique, results))))) {
        setImportMsg({ text: '', color: IMPORT_BUSY_COLOR });
        return;
      }
      setImportMsg({ text: commitImport(unique, results, files.length, importEnv()), color: IMPORT_OK_COLOR });
    } catch (err) {
      fail(IMPORT.readError(err.message));
    } finally {
      input.value = ''; // ليعمل اختيار الملف نفسه مرة ثانية
    }
  };

  const exportExcel = () => {
    try {
      const r = exportStudentList(mergeForExport(exportBase(), getStudentsRaw()), window.XLSX);
      if (!r.ok) window.alert(r.reason === 'empty' ? EMPTY_MSG : IMPORT.NO_XLSX);
    } catch (err) { window.alert('❌ تعذّر التصدير: ' + err.message); }
  };

  const result = query.trim() ? searchStudents(getStudentsRaw(), StudentDb.list(), query) : { state: 'empty', shown: [], extra: 0 };
  const picked = selected.filter((i) => i < result.shown.length);
  const onQuery = (e) => { setQuery(e.target.value); setSelected([]); };
  const toggleRow = (i) => setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));
  const toggleAll = (on) => setSelected(on ? result.shown.map((_, i) => i) : []);

  const deleteSelected = () => {
    if (!picked.length) return;
    const names = picked.map((i) => result.shown[i].name);
    if (!window.confirm(deleteConfirmText(names))) return;
    saveStudents(removeNames(getStudentsRaw(), names));
    StudentDb.removeByNames(names);
    show(deletedText(names.length), COLORS.deleted);
    setSelected([]);
  };

  const restore = () => {
    const ls = window.localStorage;
    if (!window.confirm(restoreConfirmText(ls, user))) return;
    const r = loadBackup(ls, user);
    if (r.status === 'none') { window.alert(MSG.NO_BACKUP); return; }
    if (r.status === 'empty') { window.alert(MSG.EMPTY_BACKUP); return; }
    if (r.status === 'error') { window.alert(MSG.RESTORE_ERROR); return; }
    try {
      StudentDb.replaceRaw(r.list);
      saveStudents(r.list);
      dropBackup(ls, user);
      setBackup(NO_BACKUP);
      show(restoredText(r.list.length), COLORS.restored);
    } catch { window.alert(MSG.RESTORE_ERROR); }
  };

  const clearAll = () => {
    const count = StudentDb.count();
    if (!window.confirm(clearConfirmText(count))) return;
    saveStudents([]); // يمسح الذاكرة والتخزين المحلي والسحابي ويحدّث الأقسام والعدادات
    StudentDb.clear();
    dropCustomKeys(window.localStorage, user);
    show(clearedText(count), COLORS.cleared);
  };

  const allChecked = result.shown.length > 0 && picked.length === result.shown.length;

  return (
    <div className="settings-section">
      <div className="settings-section-title">👥 قائمة التلاميذ — استيراد وتصدير وتعديل</div>

      <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: 10, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#166534', marginBottom: 8 }}>📥 استيراد لائحة تلاميذ جديدة (Excel)</div>
        <div style={{ fontSize: '0.74rem', color: '#15803d', marginBottom: 10 }}>يدعم ملفات Excel متعددة الأوراق — يتم استيراد <strong>جميع الأوراق</strong> تلقائياً. يكفي وجود عمود الاسم في كل ورقة (القسم والجنس وتاريخ الازدياد اختيارية)</div>
        <input type="file" id="importStudentFile" ref={fileRef} accept=".xlsx,.xls,.csv" multiple style={{ display: 'none' }} onChange={importFiles} />
        <button type="button" onClick={() => fileRef.current && fileRef.current.click()} style={btn(GREEN, { width: '100%', padding: 10, fontSize: '0.82rem' })}>📂 اختيار ملف أو عدة ملفات Excel للاستيراد</button>
        <div id="importStudentMsg" style={{ ...IMPORT_MSG_STYLE, color: importMsg.color }}>{importMsg.text}</div>
      </div>

      <div style={{ ...card, marginBottom: 10 }}>
        <div style={cardTitle}>📤 تصدير وطباعة القائمة الحالية</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={exportExcel} style={btn(GREEN, { flex: 1, padding: 10, fontSize: '0.82rem' })}>📊 تصدير Excel</button>
          <button type="button" onClick={() => printStudentList()} style={btn('linear-gradient(135deg,#7c3aed,#6d28d9)', { flex: 1, padding: 10, fontSize: '0.82rem' })}>🖨️ طباعة اللائحة</button>
        </div>
      </div>

      <div style={card}>
        <div style={cardTitle}>✏️ تعديل مباشر للقائمة</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input type="text" id="newStudentFamily" placeholder="النسب" value={form.family} onChange={setField('family')} style={grow(120)} />
          <input type="text" id="newStudentGiven" placeholder="الاسم الشخصي" value={form.given} onChange={setField('given')} style={grow(120)} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input type="text" id="newStudentClass" list="newStudentClassList" placeholder="القسم (اكتبه أو اختره)" autoComplete="off" value={form.cls} onChange={setField('cls')} onFocus={refreshClasses} style={grow(130)} />
          <datalist id="newStudentClassList">{classes.map((c) => <option key={c} value={c} />)}</datalist>
          <input type="text" id="newStudentMassar" placeholder="رقم مسار" dir="ltr" value={form.massar} onChange={setField('massar')} style={grow(120)} />
          <select id="newStudentGender" value={form.gender} onChange={setField('gender')} style={{ ...inputBase, fontSize: '0.78rem', padding: 8 }}>
            <option value="">الجنس</option>
            <option value="ذكر">ذكر</option>
            <option value="أنثى">أنثى</option>
          </select>
          <input type="date" id="newStudentDob" title="تاريخ الازدياد" value={form.dob} onChange={setField('dob')} style={inputBase} />
        </div>
        <button type="button" onClick={addStudent} style={btn('linear-gradient(135deg,var(--primary),var(--primary-light))', { width: '100%', padding: 9, fontSize: '0.82rem' })}>➕ إضافة تلميذ(ة) للقائمة</button>
        <div id="settingsStudentMsg" style={{ fontSize: '0.78rem', marginTop: 6, minHeight: 18, color: msg.color }}>{msg.text}</div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>🔍 بحث وتحديد للحذف:</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input type="text" id="delStudentSearch" placeholder="اكتب اسم أو قسم للبحث..." value={query} onChange={onQuery} style={{ ...inputBase, flex: 1, fontSize: '0.78rem' }} />
          </div>
          {result.state === 'results' && (
            <div id="bulkActionBar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fef3c7', border: '1.5px solid #fcd34d', borderRadius: 8, padding: '7px 12px', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="selectAllStudents" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#dc2626', cursor: 'pointer' }} />
                <span id="selectedCountLabel" style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e' }}>{selectedLabel(picked.length)}</span>
              </div>
              {picked.length > 0 && (
                <button type="button" id="deleteSelectedBtn" onClick={deleteSelected} style={btn(RED, { padding: '5px 14px', borderRadius: 7, fontSize: '0.76rem' })}>🗑 حذف المحددين</button>
              )}
            </div>
          )}
          <div id="settingsStudentResults" style={{ marginTop: 4, maxHeight: 220, overflowY: 'auto' }}>
            {result.state === 'none' && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: 8 }}>{MSG.NO_RESULTS}</div>}
            {result.state === 'results' && result.shown.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, marginBottom: 4, background: 'white', fontSize: '0.8rem' }}>
                <input type="checkbox" className="student-select-cb" checked={picked.includes(i)} onChange={() => toggleRow(i)} style={{ width: 15, height: 15, accentColor: '#dc2626', cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--primary)', fontWeight: 600 }}>{s.name}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{s.class} {s.gender}</span>
              </div>
            ))}
            {result.state === 'results' && result.extra > 0 && <div style={{ fontSize: '0.74rem', color: '#64748b', textAlign: 'center', padding: 6 }}>{extraText(result.extra)}</div>}
          </div>
        </div>

        {backup.available && (
          <div id="restoreBackupBox" style={{ marginTop: 12, background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: 8, padding: 10 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1d4ed8', marginBottom: 4 }}>↩️ استعادة القائمة السابقة</div>
            <div id="restoreBackupInfo" style={{ fontSize: '0.74rem', color: '#3b82f6', marginBottom: 8 }}>{backup.info}</div>
            <button type="button" onClick={restore} style={btn('linear-gradient(135deg,#1d4ed8,#3b82f6)', { width: '100%', padding: 8, borderRadius: 7, fontSize: '0.78rem' })}>↩️ استعادة القائمة السابقة</button>
          </div>
        )}

        <div style={{ marginTop: 12, background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 10 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>🗑 حذف القائمة كاملاً</div>
          <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: 8 }}>سيتم حذف جميع التلاميذ من قاعدة البيانات. ستظل السجلات والأرشيف محفوظة.</div>
          <button type="button" onClick={clearAll} style={btn(RED, { width: '100%', padding: 8, borderRadius: 7, fontSize: '0.78rem' })}>🗑 حذف قائمة التلاميذ نهائياً وإعادة البدء</button>
        </div>
      </div>
    </div>
  );
}
