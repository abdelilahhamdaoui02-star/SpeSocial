import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getSessionStore } from '../session/sessionStore.js';
import { PREVIEWS } from './previewSpecs.js';
import { usePreview, closePreview } from './previewStore.js';
import { callExportToWord } from '../export/wordExport.js';
import { useCurrentPortal } from '../store/hooks.js';
import { getLogo } from '../settings/logoStore.js';

const WORD_BTN = { background: '#1d6f42', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "'Cairo',sans-serif", fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 };
const WORD_BTN_PLAIN = { background: '#1d6f42', color: 'white', border: 'none', borderRadius: 8, padding: '9px 18px', fontFamily: "'Cairo',sans-serif", fontWeight: 700, cursor: 'pointer' };
const FOOTER = { padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, justifyContent: 'flex-end' };

// pgDoPrint القديمة: تفعّل وضع طباعة التقارير قبل الطباعة وتزيله بعدها إن أُغلقت النافذة
function printGate() {
  document.documentElement.classList.add('i-print-mode');
  try { window.print(); } catch (e) { alert('❌ تعذّرت الطباعة: ' + e.message); }
  setTimeout(() => { if (!document.querySelector('#pgPrintModal.open')) document.documentElement.classList.remove('i-print-mode'); }, 1500);
}

function print(spec) {
  if (spec.print === 'gate') { printGate(); return; }
  if (spec.print === 'logo' && typeof window._waitLogoThenPrint === 'function') { window._waitLogoThenPrint(); return; }
  window.print();
}

async function word(spec, fileName) {
  try { await callExportToWord(spec.body, fileName); } catch (e) { console.error(e); alert('❌ تعذّر إنشاء ملف Word'); }
}

// الشكل نفسه الذي كان مكتوباً في body.html: print-modal ← modal-box ← (header, body, footer)
export function PreviewModal({ spec, html, title, wordName, onClose, onPrint, onWord }) {
  return (
    <div id={spec.id} className="print-modal open">
      <div className="modal-box" style={spec.maxWidth ? { maxWidth: spec.maxWidth } : undefined}>
        <div className="modal-header">
          <h3 id={spec.titleId} data-f={spec.titleId ? wordName : undefined}>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" id={spec.body} dangerouslySetInnerHTML={{ __html: html }} />
        <div className="modal-footer" style={FOOTER}>
          <button type="button" className="btn btn-outline" onClick={onClose}>إغلاق</button>
          <button type="button" className="btn btn-primary" onClick={onPrint}>{spec.printLabel || '🖨️ طباعة'}</button>
          <button type="button" className="btn btn-success" onClick={onWord} style={spec.plainWord ? WORD_BTN_PLAIN : WORD_BTN}>{spec.wordLabel || '📝 تحميل Word'}</button>
        </div>
      </div>
    </div>
  );
}

// يُركَّب مرة واحدة في LegacyApp
export default function PreviewHost() {
  const st = usePreview();

  // تغيّر البوابة (أو العودة للرئيسية) يغلق المعاينة
  useEffect(() => {
    const off = () => closePreview();
    return getSessionStore().on('loggedout', off);
  }, []);
  const portal = useCurrentPortal();
  const firstPortal = useRef(true);
  useEffect(() => {
    if (firstPortal.current) { firstPortal.current = false; return; } // لا نغلق عند أول رسم
    closePreview();
  }, [portal]);

  // شعار الوزارة: التقارير التي تضع <img id="ministry-logo-img"> بلا مصدر يُملأ بعد الإدراج (كما كانت tlGenerateReport وstGenerateHTMLReport)
  useEffect(() => {
    if (!st) return;
    const src = getLogo();
    if (src) document.querySelectorAll('#ministry-logo-img').forEach((img) => { img.src = src; });
  }, [st]);

  if (!st || !st.host) return null;
  const spec = PREVIEWS[st.key];
  return createPortal(
    <PreviewModal spec={spec} html={st.html} title={st.title} wordName={st.word}
      onClose={closePreview} onPrint={() => print(spec)} onWord={() => word(spec, st.word)} />,
    st.host,
  );
}
