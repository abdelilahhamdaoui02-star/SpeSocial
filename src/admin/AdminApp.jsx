import { useEffect, useRef, useState } from 'react';
import './admin.css';
import { loadConfig } from '../services/firebaseConfig.js';
import { createAdminApi, browserSessionStore } from './adminApi.js';
import GateLogin from './GateLogin.jsx';
import AdminPanel from './AdminPanel.jsx';

// لوحة الأدمين بالكامل مكوّنات React (لا سكربت قديم ولا innerHTML).
// الحالات: boot (استعادة الجلسة) ← login ← panel
export default function AdminApp() {
  const apiRef = useRef(null);
  if (!apiRef.current) apiRef.current = createAdminApi({ cfg: loadConfig(), sessionStore: browserSessionStore() });
  const api = apiRef.current;
  const [phase, setPhase] = useState(() => (api.hasStoredSession() ? 'boot' : 'login'));

  useEffect(() => {
    if (phase !== 'boot') return undefined;
    let off = false;
    api.restore()
      .then(() => { if (!off) setPhase('panel'); })
      .catch(() => { if (!off) setPhase('login'); }); // يبقى على شاشة الدخول
    return () => { off = true; };
  }, [api, phase]);

  async function onLogin(email, pwd) {
    try { await api.signIn(email, pwd); await api.verifyAdmin(); }
    catch (e) { api.clearSession(); throw e; }
    setPhase('panel');
  }
  function onLogout() { api.clearSession(); setPhase('login'); }

  return (
    <div className="wrap">
      {phase === 'panel' ? <AdminPanel api={api} onLogout={onLogout} /> : <GateLogin booting={phase === 'boot'} onLogin={onLogin} />}
    </div>
  );
}
