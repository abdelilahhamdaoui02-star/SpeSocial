import { memo, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import * as rate from './rateLimit.js';
import { fbAuth, firebaseReady } from '../services/firebase.js';
import FirebaseTrigger from '../firebase-setup/FirebaseTrigger.jsx';
import { setCloud } from '../session/sessionState.js';
import { getSession } from '../session/installSession.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ينتظر اتصال Firebase حتى 5 ثوانٍ (كما كان في authDoLogin القديم)
async function waitForFirebase() {
  let waited = 0;
  while (waited <= 5000) {
    try {
      if (await firebaseReady()) return true;
    } catch {}
    await sleep(300);
    waited += 300;
  }
  return false;
}

// enterApp (src/session) يكتب في هذا العنصر → فارغ وثابت
const StorageNote = memo(function StorageNote() {
  return <div className="auth-storage-note" id="authStorageNote"></div>;
});

const usernameStyle = {
  border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 14px', width: '100%',
  fontFamily: "'Cairo',sans-serif", fontSize: '0.88rem', textAlign: 'left',
};

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState({ text: '', color: '' });
  const [loading, setLoading] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const fail = (text, color = '#dc2626') => setError({ text, color });

  function showLockout(mins) {
    fail(`🔒 تم إغلاق الدخول مؤقتاً بسبب كثرة المحاولات. انتظر ${mins} دقيقة وحاول مجدداً.`);
    setBusy(true);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      const m = rate.isLocked();
      if (m === false) {
        clearInterval(timer.current);
        fail('✅ يمكنك المحاولة مجدداً.', '#16a34a');
        setBusy(false);
      } else {
        fail(`🔒 تم إغلاق الدخول مؤقتاً. انتظر ${m} دقيقة.`);
      }
    }, 10000);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (busy) return;
    const rawInput = username.trim().toLowerCase();
    setError({ text: '', color: '' });

    const locked = rate.isLocked();
    if (locked !== false) return showLockout(locked);

    if (!navigator.onLine) return fail('📡 لا يوجد اتصال بالإنترنت. تأكد من الاتصال وأعد المحاولة.', '');
    if (!rawInput || !password) return fail('⚠️ يرجى ملء جميع الحقول.', '');
    if (!/^[a-z0-9_\-.]{2,30}$/.test(rawInput)) {
      return fail('⚠️ اسم الحساب يجب أن يحتوي على حروف إنجليزية وأرقام فقط.', '');
    }

    setBusy(true);
    try {
      setLoading('⏳ جارٍ الاتصال بـ Firebase...');
      if (!(await waitForFirebase())) {
        return fail('🔥 Firebase غير متصل. يرجى إعداد Firebase أولاً من الزر أدناه.', '');
      }
      setCloud(true);

      setLoading('⏳ جارٍ التحقق...');
      let verifiedName;
      try {
        verifiedName = await fbAuth.login(rawInput, password);
      } catch (err) {
        const code = (err && err.code) || '';
        if (code === 'auth/network-request-failed') return fail('📡 تعذّر الاتصال. تحقق من الإنترنت وأعد المحاولة.');
        if (code === 'auth/too-many-requests') return fail('🔒 تم تعليق المحاولات مؤقتًا بسبب كثرتها. حاول لاحقًا.');
        const attempts = rate.recordFailure();
        const left = rate.remaining();
        if (code === 'app/not-approved') fail('⛔ هذا الحساب غير مفعّل. تواصل مع المسؤول.');
        else if (left <= 0) fail('🔒 تم إغلاق الدخول لمدة 15 دقيقة بسبب كثرة المحاولات الفاشلة.');
        else if (attempts >= rate.WARN_AT) fail(`❌ اسم الحساب أو كلمة المرور غير صحيحة. تبقّى لك ${left} محاولة قبل الإغلاق.`, '#d97706');
        else fail('❌ اسم الحساب أو كلمة المرور غير صحيحة.', '');
        return;
      }

      rate.reset();
      setLoading('📥 جارٍ تحميل بياناتك...');
      // يضبط المستخدم، يحمّل بياناته، ثم يدخل التطبيق (src/session) فيرسل الحدث legacy:entered فتختفي هذه الشاشة
      await getSession().flow.startSession(verifiedName);
    } catch (err) {
      console.error(err);
      fail('❌ خطأ في تسجيل الدخول: ' + ((err && err.message) || 'حاول مجدداً.'), '');
    } finally {
      setLoading('');
      if (rate.isLocked() === false) setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="auth-field">
        <label>👤 اسم الحساب</label>
        <input
          type="text" id="authUsername" placeholder="مثال: abde05" autoComplete="username" dir="ltr"
          style={usernameStyle} value={username} onChange={(e) => setUsername(e.target.value)}
        />
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
          أدخل اسم الحساب الخاص بك (حروف وأرقام فقط)
        </div>
      </div>
      <div className="auth-field">
        <label>🔒 كلمة المرور</label>
        <div className="auth-pwd-wrap">
          <input
            type={showPwd ? 'text' : 'password'} id="authPassword" placeholder="أدخل كلمة المرور"
            autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
          />
          <button className="auth-eye" type="button" title="إظهار/إخفاء" onClick={() => setShowPwd((v) => !v)}>
            {showPwd ? '🙈' : '👁'}
          </button>
        </div>
      </div>
      <button className="auth-btn" id="authLoginBtn" type="submit" disabled={busy}>🔐 تسجيل الدخول</button>
      <div className="auth-error" id="authError" style={error.color ? { color: error.color } : undefined}>{error.text}</div>
      <div className="auth-loading" id="authLoading">{loading}</div>
    </form>
  );
}

export default function LoginScreen() {
  const { status, logoutCount } = useAuth();
  // نُخفيها عند الدخول، وعند ظهور شاشة "لا يوجد اتصال"
  const hidden = status === 'signedIn' || status === 'hidden';

  return (
    <div id="authOverlay" className={hidden ? 'hidden' : ''}>
      <div className="auth-box">
        <div className="auth-emblem">🎓</div>
        <div className="auth-title">SpeSocial</div>
        <div className="auth-sub" style={{ display: 'none' }}>المختص الاجتماعي — وزارة التربية الوطنية</div>

        {/* key يفرّغ الحقول بعد كل تسجيل خروج */}
        <div id="authLoginForm"><LoginForm key={logoutCount} /></div>

        <div style={{ textAlign: 'center', fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 12 }}>
          🔒 الحسابات تُنشأ من طرف المسؤول فقط — للحصول على حساب تواصل مع المسؤول.
        </div>
        <StorageNote />
        <FirebaseTrigger />
        <div className="auth-storage-note" style={{ marginTop: 10 }}>نسيت كلمة المرور؟ تواصل مع المسؤول.</div>

        <a
          className="wa-help"
          href="https://wa.me/212700810987?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D8%8C%20%D8%A3%D9%88%D8%A7%D8%AC%D9%87%20%D9%85%D8%B4%D9%83%D9%84%D8%A9%20%D9%81%D9%8A%20%D8%AA%D8%B3%D8%AC%D9%8A%D9%84%20%D8%A7%D9%84%D8%AF%D8%AE%D9%88%D9%84"
          target="_blank" rel="noopener noreferrer" aria-label="تواصل معنا عبر واتساب"
        >
          <span className="wa-ico">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.16-.48-.29z" />
            </svg>
          </span>
          <span>واجهت مشكلة؟ تواصل معي مباشرة عبر واتساب</span>
        </a>
      </div>
    </div>
  );
}
