import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getCloudStorage } from '../services/cloud.js';
import { getSession } from '../session/installSession.js';
import {
  FIELDS, PLACEHOLDERS, PASTE_PLACEHOLDER, MSG, MSG_COLORS, RELOAD_DELAY_MS,
  emptyValues, isFieldValid, loadSavedValues, parseConfigText, saveConfig, runConnectionTest,
  clearConfig, statusView, browserStorage,
} from './firebaseSetupLogic.js';
import { useFirebaseStatus } from './useFirebaseStatus.js';

const EMPTY_MSG = { text: '', kind: 'info' };
const keysTrue = (keys) => Object.fromEntries(keys.map((k) => [k, true]));

function FirebaseSetupUI() {
  const status = useFirebaseStatus();
  const v = statusView(status);

  const [values, setValues] = useState(emptyValues);
  const [valid, setValid] = useState({});
  const [invalid, setInvalid] = useState({});
  const [paste, setPaste] = useState('');
  const [msg, setMsg] = useState(EMPTY_MSG);
  const reloadTimer = useRef(null);

  // openFirebaseSetup القديمة تُبلغنا بالفتح فنقرأ الإعداد المحفوظ (كما كانت fbLoadCurrentConfig)
  useEffect(() => {
    const onOpen = () => {
      const saved = loadSavedValues(browserStorage(window));
      setValues((x) => ({ ...x, ...saved }));
      setValid((x) => ({ ...x, ...keysTrue(Object.keys(saved)) }));
      setMsg(EMPTY_MSG);
    };
    window.addEventListener('legacy:firebase-setup-open', onOpen);
    return () => {
      window.removeEventListener('legacy:firebase-setup-open', onOpen);
      clearTimeout(reloadTimer.current);
    };
  }, []);

  const onField = (f) => (e) => {
    const val = e.target.value;
    setValues((x) => ({ ...x, [f]: val }));
    setValid((x) => ({ ...x, [f]: isFieldValid(val) }));
    setInvalid((x) => ({ ...x, [f]: false }));
  };

  const onParse = () => {
    const r = parseConfigText(paste);
    const found = Object.keys(r.values);
    if (found.length) {
      setValues((x) => ({ ...x, ...r.values }));
      setValid((x) => ({ ...x, ...keysTrue(found) }));
    }
    setMsg(r.message);
  };

  const onSave = () => {
    const r = saveConfig(browserStorage(window), values);
    if (r.status === 'invalid') setInvalid((x) => ({ ...x, ...keysTrue(r.invalid) }));
    setMsg(r.message);
    if (r.status === 'saved') {
      clearTimeout(reloadTimer.current);
      reloadTimer.current = setTimeout(() => window.location.reload(), RELOAD_DELAY_MS);
    }
  };

  const onTest = async () => {
    setMsg({ text: MSG.testing, kind: 'info' });
    const r = await runConnectionTest(getCloudStorage() || undefined);
    setMsg(r.message);
    if (r.ok) getSession().panels.fbUpdateStatus();
  };

  const onClear = () => {
    if (!clearConfig(browserStorage(window), (m) => window.confirm(m))) return;
    window.alert(MSG.cleared);
    window.location.reload();
  };

  const close = () => getSession().panels.closeFirebaseSetup();

  return (
    <div className="fb-setup-box">
      <div className="fb-setup-header">
        <h3>🔥 إعداد Firebase — التخزين السحابي</h3>
        <button type="button" className="fb-setup-close" onClick={close}>✕</button>
      </div>
      <div className="fb-setup-body">

        <div id="fbSetupStatus" className={v.className}>
          <span id="fbSetupStatusIcon">{v.icon}</span>
          <span id="fbSetupStatusText">{v.text}</span>
        </div>

        <div className="fb-steps">
          <strong>📋 خطوات إعداد Firebase (مرة واحدة فقط):</strong>
          <ol>
            <li>اذهب إلى <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">console.firebase.google.com</a></li>
            <li>أنشئ مشروعاً جديداً ← اختر اسماً ← أكمل الإنشاء</li>
            <li>من الصفحة الرئيسية ← أضف تطبيق ويب (<code>&lt;/&gt;</code>)</li>
            <li>انسخ كائن <code>firebaseConfig</code> والصقه أدناه</li>
            <li>من القائمة الجانبية: <strong>Build ← Firestore Database ← Create</strong></li>
            <li>اختر <strong>Start in test mode</strong> ← أكمل</li>
          </ol>
        </div>

        <div className="fb-paste-zone">
          <div className="fb-paste-label">📋 الصق كود firebaseConfig هنا (الطريقة السريعة):</div>
          <div style={{ fontSize: '0.72rem', color: '#78350f', marginBottom: 4 }}>يمكنك لصق الكود كاملاً — سيتم استخراج القيم تلقائياً</div>
          <textarea id="fbPasteArea" placeholder={PASTE_PLACEHOLDER} spellCheck={false} value={paste} onChange={(e) => setPaste(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button type="button" className="fb-parse-btn" onClick={onParse}>⚡ استخراج تلقائي</button>
            <button type="button" className="fb-clear-btn" onClick={() => setPaste('')}>🗑 مسح</button>
          </div>
        </div>

        <div className="fb-section-title">✏️ أو أدخل القيم يدوياً:</div>
        {FIELDS.map((f) => (
          <div className="fb-field" key={f}>
            <label>{f}</label>
            <input
              type="text" id={'fb_' + f} placeholder={PLACEHOLDERS[f]} dir="ltr"
              className={[valid[f] ? 'valid' : '', invalid[f] ? 'invalid' : ''].filter(Boolean).join(' ') || undefined}
              value={values[f]} onChange={onField(f)}
            />
          </div>
        ))}

        <button type="button" className="fb-save-btn" onClick={onSave}>💾 حفظ الإعداد وإعادة التشغيل</button>
        <button type="button" className="fb-test-btn" id="fbTestBtn" onClick={onTest} style={{ display: v.showTest ? '' : 'none' }}>🔗 اختبار الاتصال</button>
        <div className="fb-msg" id="fbMsg" style={msg.text ? { color: MSG_COLORS[msg.kind] } : undefined}>{msg.text}</div>

        <div style={{ marginTop: 16, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 12, fontSize: '0.74rem', color: '#166534', lineHeight: 1.8 }}>
          🔒 <strong>الأمان:</strong> يُخزَّن الإعداد في متصفحك المحلي فقط. لا يُرسَل لأي جهة خارجية. قواعد Firestore الافتراضية (test mode) مناسبة للاستخدام الداخلي.
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button type="button" onClick={onClear} style={{ background: 'none', border: 'none', color: '#dc2626', fontFamily: 'Cairo,sans-serif', fontSize: '0.76rem', cursor: 'pointer', textDecoration: 'underline' }}>
            🗑 حذف إعداد Firebase والعودة للوضع المحلي
          </button>
        </div>
      </div>
    </div>
  );
}

// الحاوية #firebaseSetupModal تبقى من HTML القديم (فئة open تضيفها openFirebaseSetup القديمة)
export default function FirebaseSetupModal({ mount }) {
  return mount ? createPortal(<FirebaseSetupUI />, mount) : null;
}
