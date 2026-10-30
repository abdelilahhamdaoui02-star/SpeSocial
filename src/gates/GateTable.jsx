import { useEffect, useMemo, useRef, useState } from 'react';
import { useCollection } from '../store/hooks.js';
import { getState } from '../store/legacyStore.js';
import { getSession } from '../session/installSession.js';
import {
  tableModel, filterRows, defaultValues, editValues, readDraft, validateDraft, saveRows, findRow, removeRow, parseImport, NO_RECORDS_TEXT,
} from './gateLogic.js';
import { openReport } from './printModal.js';
import { acSetup } from '../autocomplete/studentAutocomplete.js';

// دائماً من المخزن لحظة النقر (لا من آخر رسم) حتى لا نقرأ نسخة قديمة عند نقرتين متتاليتين
const currentRows = (gate) => getState().collections[gate.key] ?? [];

// جدول + استمارة لبوابة واحدة (اتصال هاتفي / مقابلات أولياء / متابعة).
// الحقول غير متحكَّم بها (uncontrolled) عن قصد: الإكمال التلقائي القديم acSetup/acFillField يكتب في عناصر الإدخال
// مباشرة بـ element.value (اسم التلميذ ← رقم المسار والقسم)، وحقل متحكَّم به كان سيتجاهل تلك الكتابة.
export default function GateTable({ gate, active, hidden = false }) {
  const [rows, setRows] = useCollection(gate.key);
  const [qRaw, setQRaw] = useState('');
  const q = qRaw.trim();
  const refs = useRef({});
  const rootRef = useRef(null);
  const fileRef = useRef(null);
  const editId = useRef(null);

  const model = useMemo(() => tableModel(gate, rows, q), [gate, rows, q]);

  const fillForm = (values) => {
    for (const f of gate.fields) { const el = refs.current[f.k]; if (el) el.value = values[f.k]; }
  };
  const resetForm = () => { editId.current = null; fillForm(defaultValues(gate)); };

  // عند فتح البوابة: تفريغ الاستمارة والبحث (كان القديم يعيد بناء الاستمارة في كل فتح) وربط الإكمال التلقائي
  useEffect(() => {
    if (!active) return;
    resetForm();
    setQRaw('');
    acSetup(gate.ac);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async () => {
    const d = readDraft(gate, (k) => refs.current[k].value);
    const err = validateDraft(gate, d);
    if (err) { alert(err); return; }
    try {
      await setRows(saveRows(currentRows(gate), d, editId.current));
    } catch (e) {
      console.error(e);
      alert('❌ فشل حفظ البيانات');
      return; // نُبقي ما كتبه المستخدم في الاستمارة
    }
    resetForm();
  };

  const edit = (id) => {
    const r = findRow(currentRows(gate), id);
    if (!r) return;
    editId.current = String(id);
    fillForm(editValues(gate, r));
    if (rootRef.current) rootRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  const del = async (id) => {
    if (!confirm('حذف هذا السجل؟')) return;
    try { await setRows(removeRow(currentRows(gate), id)); } catch (e) { console.error(e); alert('❌ فشل حفظ البيانات'); }
  };

  // حقول لا تظهر في الطباعة (تبقى في الاستمارة والجدول وExcel)
  const HIDE_IN_PRINT = ['massar', 'school'];
  const print = () => openReport(gate.print, gate.fields.filter((f) => gate.id !== 'calls' || !HIDE_IN_PRINT.includes(f.k)), filterRows(currentRows(gate), q));
  // التصدير إلى Excel (ExcelJS وشعار الوزارة) من طبقة الجلسة؛ لا يعتمد على حالة React
  const exportXlsx = () => { getSession().pgExportXlsx(gate, filterRows(currentRows(gate), q)); };

  const onImport = (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = async () => {
      try {
        const X = window.XLSX;
        const wb = X.read(new Uint8Array(fr.result), { type: 'array' });
        const sheetRows = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
        const { rows: next, added } = parseImport(gate, currentRows(gate), sheetRows);
        await setRows(next);
        alert('✅ تم استيراد ' + added + ' سطرًا.');
      } catch (er) {
        alert('❌ تعذّرت قراءة الملف.');
      }
    };
    fr.readAsArrayBuffer(file);
    input.value = '';
  };

  const field = (f) => {
    const id = gate.box + '_' + f.k;
    if (f.opts) {
      return (
        <select data-k={f.k} ref={(el) => { refs.current[f.k] = el; }}>
          {f.opts.map((x) => <option key={x}>{x}</option>)}
        </select>
      );
    }
    if (f.t === 'area') return <textarea rows="2" data-k={f.k} ref={(el) => { refs.current[f.k] = el; }} />;
    const input = <input type={f.t || 'text'} id={id} data-k={f.k} ref={(el) => { refs.current[f.k] = el; }} />;
    // حقل الاسم: نرسم غلاف الإكمال التلقائي وقائمته مسبقاً، فلا يضطر acSetup لنقل العنصر في DOM يملكه React
    if (gate.ac && id === gate.ac.nameId) {
      return (
        <div className="student-autocomplete-wrapper">
          {input}
          <div className="student-autocomplete-dropdown" id={id + '_dropdown'} />
        </div>
      );
    }
    return input;
  };

  return (
    <div id={gate.box} ref={rootRef} style={hidden ? { display: 'none' } : undefined}>
      <div className="pg-card">
        <h3>{gate.title}</h3>
        <div className="pg-grid">
          {gate.fields.map((f) => (
            <div className={'pg-f' + (f.wide ? ' wide' : '')} key={f.k}>
              <label>{f.l}</label>
              {field(f)}
            </div>
          ))}
        </div>
        <div className="pg-act">
          <button type="button" className="pg-btn" onClick={save}>💾 حفظ</button>
          <button type="button" className="pg-btn gray" onClick={resetForm}>إلغاء</button>
          {gate.imp ? (
            <>
              <button type="button" className="pg-btn green" onClick={() => fileRef.current && fileRef.current.click()}>📥 استيراد أرقام من Excel</button>
              <input type="file" hidden accept=".xlsx,.xls,.csv" ref={fileRef} onChange={onImport} />
            </>
          ) : null}
          <button type="button" className="pg-btn gray" onClick={exportXlsx}>📤 تصدير Excel</button>
          {gate.print ? <button type="button" className="pg-btn" onClick={print}>🖨️ معاينة وطباعة</button> : null}
          <input className="pg-q" placeholder="🔍 بحث..." value={qRaw} onChange={(e) => setQRaw(e.target.value)} />
        </div>
      </div>
      <div className="pg-card">
        <div className="pg-scroll">
          <table className="pg-tbl">
            <thead>
              <tr>
                <th>#</th>
                {gate.fields.map((f) => <th key={f.k}>{f.l}</th>)}
                <th />
              </tr>
            </thead>
            <tbody>
              {model.length ? model.map((row) => (
                <tr key={String(row.id) + ':' + row.n}>
                  <td>{row.n}</td>
                  {row.cells.map((c, i) => (
                    <td key={gate.fields[i].k}>
                      {c.badge === null ? c.text : <span className={'pg-st s' + c.badge}>{c.text}</span>}
                    </td>
                  ))}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" className="pg-btn sm" onClick={() => edit(row.id)}>✏️</button>{' '}
                    <button type="button" className="pg-btn sm red" onClick={() => del(row.id)}>🗑</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={gate.fields.length + 2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{NO_RECORDS_TEXT}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
