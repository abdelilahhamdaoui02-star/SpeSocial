import { useState } from 'react';
import { Msg } from './ui.jsx';
import { useMsg } from './hooks.js';

// بوابة الأدمين: البريد وكلمة المرور
export default function GateLogin({ booting, onLogin }) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, say] = useMsg();

  async function submit(e) {
    e.preventDefault();
    if (!email.trim() || !pwd) return say('⚠️ أدخل البريد وكلمة المرور.', 'err');
    setBusy(true); say('⏳ جارٍ التحقق...');
    try { await onLogin(email.trim(), pwd); say(''); }
    catch (err) { say('❌ ' + ((err && err.message) || 'خطأ'), 'err'); setBusy(false); }
  }

  return (
    <div className="card gate">
      <div className="emblem">🛡️</div>
      <h1 className="center">لوحة تحكم الأدمين</h1>
      <div className="sub center" style={{ marginBottom: 16 }}>سجّل الدخول بحساب الأدمين</div>

      {booting ? <div className="msg">⏳ جارٍ استعادة الجلسة...</div> : (
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="gEmail">📧 بريد الأدمين</label>
            <input type="text" id="gEmail" className="ltr" autoComplete="username" placeholder="admin@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="gPwd">🔒 كلمة مرور الأدمين</label>
            <div className="pwd-wrap">
              <input type={show ? 'text' : 'password'} id="gPwd" autoComplete="current-password"
                value={pwd} onChange={(e) => setPwd(e.target.value)} />
              <button className="eye" type="button" onClick={() => setShow((s) => !s)}>👁</button>
            </div>
          </div>
          <button className="btn" style={{ width: '100%' }} type="submit" disabled={busy}>دخول</button>
          <div className="hint" style={{ marginTop: 10 }}>حساب الأدمين يُنشأ مرة واحدة من Firebase Console (انظر ملف التعليمات).</div>
        </form>
      )}
      <Msg m={msg} />
    </div>
  );
}
