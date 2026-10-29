import { Fragment, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppState } from '../store/hooks.js';
import { useToday } from '../home/useToday.js';
import { buildGroups, searchCases, fileModel, buildPrintHtml, CF_CSS, EMPTY_FILE_TEXT, NO_DETAILS_TEXT } from './casefileLogic.js';
import { getLogo } from '../settings/logoStore.js';

// حدث يرسله البحث العام (src/search/GlobalSearch.jsx) لفتح ملف تلميذ من نتائجه
export const CASEFILE_SEARCH_EVENT = 'legacy:casefile-search';

function printCaseFile(model) {
  const html = buildPrintHtml(model, {
    logo: getLogo(),
    today: new Date().toLocaleDateString('ar-MA'),
  });
  const w = window.open('', '_blank');
  if (!w) { alert('⚠️ المتصفح منع النافذة المنبثقة. اسمح بالنوافذ المنبثقة لهذه الصفحة ثم أعد المحاولة.'); return; }
  w.document.open(); w.document.write(html); w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* كالقديم */ } }, 700);
}

export function CaseFileView({ model }) {
  return (
    <>
      <div className="cf-head">
        <div className="cf-name">{model.name}</div>
        <div className="cf-meta">
          {model.meta.map((m) => <span key={m.label}>{m.label}: <b>{m.value}</b></span>)}
        </div>
        <div className="cf-chips">
          {model.chips.map((c) => (
            <span key={c.key} className="cf-chip" style={c.n ? { background: c.color, color: '#fff' } : { background: '#f1f5f9', color: '#94a3b8' }}>
              {c.icon} {c.label}: {c.n}
            </span>
          ))}
        </div>
        {model.urgent ? <div className="cf-urgent">⚠️ {model.urgent} سجل(ات) ذات أولوية عاجلة / عالية</div> : null}
      </div>
      {model.sections.length === 0 && <div className="cf-empty">{EMPTY_FILE_TEXT}</div>}
      {model.sections.map((s) => (
        <div className="cf-sec" key={s.key}>
          <div className="cf-sec-title" style={{ background: s.color }}>{s.icon} {s.label} <span className="cf-count">{s.count}</span></div>
          {s.records.map((r, i) => (
            <div className="cf-rec" key={i} style={{ borderRight: '4px solid ' + s.color }}>
              <div className="cf-rec-date">📅 {r.date}</div>
              {r.rows.length === 0 && <div className="cf-row"><span className="cf-v" style={{ color: '#94a3b8' }}>{NO_DETAILS_TEXT}</span></div>}
              {r.rows.map((f, j) => (
                <div className="cf-row" key={j}><span className="cf-k">{f[0]}</span><span className="cf-v">{f[1]}</span></div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

export function SearchResults({ result, onPick }) {
  if (result.kind === 'short') return <div className="cf-empty">🔍 اكتب حرفين على الأقل من اسم التلميذ(ة) لعرض ملفه الشامل.</div>;
  if (result.kind === 'none') {
    return <div className="cf-empty">لا توجد سجلات باسم «{result.query}». تظهر هنا فقط التلاميذ الذين سُجّلت لهم مقابلة أو ملف في إحدى الأدوات.</div>;
  }
  if (result.kind === 'one') return <CaseFileView model={fileModel(result.group)} />;
  return (
    <>
      <div style={{ fontWeight: 700, color: '#475569', margin: '10px 0' }}>وُجد {result.total} تلميذ(ة) — اختر واحداً:</div>
      {result.picks.map((g) => (
        <div className="cf-pick" key={g.key} onClick={() => onPick(g.name)}>
          <span>👤</span>
          <span style={{ flex: 1 }}>{g.name}</span>
          <span style={{ fontSize: '.75rem', color: '#64748b' }}>{g.level}</span>
          <span style={{ fontSize: '.75rem', color: '#0f766e' }}>{g.total} سجل</span>
        </div>
      ))}
    </>
  );
}

function CasefileBody() {
  const { collections, user } = useAppState();
  const today = useToday();
  // البحث يبقى عند إعادة فتح البوابة (كالقديم الذي كان يعيد البحث بالنص المكتوب)
  const [query, setQuery] = useState('');

  useEffect(() => {
    const on = (e) => setQuery((e.detail && e.detail.name) || '');
    window.addEventListener(CASEFILE_SEARCH_EVENT, on);
    return () => window.removeEventListener(CASEFILE_SEARCH_EVENT, on);
  }, []);

  const groups = useMemo(
    () => buildGroups(collections, { user, today, storage: typeof localStorage !== 'undefined' ? localStorage : null }),
    [collections, user, today],
  );
  const result = useMemo(() => searchCases(groups, query), [groups, query]);

  return (
    <Fragment>
      <style>{CF_CSS}</style>
      <div className="info-box" style={{ background: '#f0fdfa', borderColor: '#5eead4', color: '#0f766e' }}>
        📁 <span>ابحث عن تلميذ لعرض ملفه الشامل: جميع المقابلات، ملفات الغياب، وحالات الإدماج المرتبطة به في مكان واحد.</span>
      </div>

      <div className="section-card">
        <div className="section-header" style={{ background: 'linear-gradient(90deg,#0f766e,#0d9488)' }}>
          <span className="step-badge" style={{ background: '#5eead4', color: '#0f766e' }}>١</span> البحث عن تلميذ
        </div>
        <div className="section-body">
          <div className="form-grid">
            <div className="form-group col-span-2">
              <label htmlFor="cf_search">🔍 اسم التلميذ(ة) أو جزء منه</label>
              <input
                type="text" id="cf_search" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="اكتب اسم التلميذ(ة) للبحث في جميع السجلات..."
                style={{ fontSize: '1rem', padding: '10px 14px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {result.kind === 'one' && (
        <div className="btn-row" style={{ marginTop: 8 }} id="cfPrintBtnRow">
          <button type="button" className="btn btn-primary" onClick={() => printCaseFile(fileModel(result.group))}
            style={{ background: 'linear-gradient(135deg,#0f766e,#0d9488)' }}>🖨️ طباعة ملف الحالة</button>
        </div>
      )}

      <div id="cfResultsContainer"><SearchResults result={result} onPick={setQuery} /></div>
    </Fragment>
  );
}

export default function CasefilePortal({ mount }) {
  return mount ? createPortal(<CasefileBody />, mount) : null;
}
