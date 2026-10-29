import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { globalSearch } from './searchLogic.js';
import { openPortal } from '../navigation.js';
import { useCollection, useStudents } from '../store/hooks.js';
import { getStudentsRaw } from '../store/legacyStore.js';
import { CASEFILE_SEARCH_EVENT } from '../casefile/CasefilePortal.jsx';

const FONT = "'Cairo',sans-serif";

const S = {
  input: (focused) => ({
    width: '100%', background: focused ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.18)',
    border: '1.5px solid ' + (focused ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)'),
    borderRadius: 22, padding: '8px 20px', fontFamily: FONT, fontSize: '0.88rem', color: 'white', outline: 'none', transition: 'all 0.2s',
  }),
  dropdown: {
    position: 'absolute', top: 'calc(100% + 6px)', right: 0, left: 0, zIndex: 9999, background: 'white', border: '1.5px solid #bdd4f7',
    borderRadius: 10, boxShadow: '0 8px 24px rgba(26,58,92,0.2)', maxHeight: 320, overflowY: 'auto',
  },
  head: { padding: '6px 12px', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  row: (hover) => ({ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s', background: hover ? '#eff6ff' : '' }),
  pill: { background: '#eff6ff', color: '#1a3a5c', borderRadius: 6, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 },
};

function Row({ onPick, children }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onPick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={S.row(hover)}>
      {children}
    </div>
  );
}

function Results({ result, onPick }) {
  if (!result.students.length && !result.archive.length) {
    return <div style={{ padding: '12px 14px', color: '#64748b', fontSize: '0.82rem', textAlign: 'center' }}>🔍 لا توجد نتائج</div>;
  }
  return (
    <>
      {result.students.length > 0 && (
        <>
          <div style={S.head}>👥 من قاعدة التلاميذ</div>
          {result.students.map((s, i) => (
            <Row key={s.fullName + i} onPick={() => onPick(s.fullName)}>
              <span style={{ fontSize: '1rem' }}>{s.gender === 'أنثى' ? '👩' : '👦'}</span>
              <span style={{ flex: 1, fontWeight: 700, color: '#1a3a5c', fontSize: '0.84rem' }}>{s.fullName}</span>
              <span style={S.pill}>{s.class || ''}</span>
              <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{s.massar || ''}</span>
            </Row>
          ))}
        </>
      )}
      {result.archive.length > 0 && (
        <>
          <div style={{ ...S.head, borderTop: '1px solid #e2e8f0' }}>🗄 من الأرشيف</div>
          {result.archive.map((e, i) => (
            <Row key={e.name + i} onPick={() => onPick(e.name)}>
              <span>{e.icon}</span>
              <span style={{ flex: 1, fontWeight: 700, color: e.color, fontSize: '0.84rem' }}>{e.name}</span>
              <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: 6, padding: '1px 7px', fontSize: '0.7rem' }}>{e.type}</span>
            </Row>
          ))}
        </>
      )}
    </>
  );
}

// البحث العام في الشريط العلوي. الحاوية #globalSearchBar تبقى من HTML القديم (يُظهر شريطَها الأب authEnterApp بعد الدخول).
export default function GlobalSearch({ mount }) {
  const students = useStudents();
  const [interviews] = useCollection('interviewArchive');
  const [reintegrations] = useCollection('reintegrationArchive');
  const [absences] = useCollection('absenceArchive');
  const [violences] = useCollection('violenceArchive');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const box = useRef(null);

  // المخصَّصون (STUDENTS المخزَّنة) تتغير مع قائمة التلاميذ نفسها، فنعيد قراءتها عندها فقط
  const customStudents = useMemo(() => getStudentsRaw(), [students]);
  const result = useMemo(
    () => (open ? globalSearch({ students, customStudents, collections: { interviewArchive: interviews, reintegrationArchive: reintegrations, absenceArchive: absences, violenceArchive: violences }, query }) : null),
    [open, students, customStudents, interviews, reintegrations, absences, violences, query],
  );

  // النقر خارج الشريط يغلق القائمة
  useEffect(() => {
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', onDown);
    return () => document.removeEventListener('click', onDown);
  }, []);

  // الاختيار: نفرّغ الحقل ونفتح ملف الحالة ثم نرسل له الاسم (بوابة ملف الحالة تستمع لهذا الحدث)
  const pick = (name) => {
    setQuery('');
    setOpen(false);
    openPortal('casefile');
    window.dispatchEvent(new CustomEvent(CASEFILE_SEARCH_EVENT, { detail: { name } }));
  };

  if (!mount) return null;
  return createPortal(
    <div ref={box}>
      <input
        type="text" id="globalSearchInput" dir="rtl" value={query}
        placeholder="🔍 ابحث عن تلميذ بالاسم أو رقم مسار..."
        style={S.input(focused)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {result && <div id="globalSearchDropdown" style={S.dropdown}><Results result={result} onPick={pick} /></div>}
    </div>,
    mount,
  );
}
