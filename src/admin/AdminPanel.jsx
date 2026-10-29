import { useCallback, useEffect, useState } from 'react';
import { useMsg, useSiteConfig } from './hooks.js';
import NoticeCard from './NoticeCard.jsx';
import NewsCard from './NewsCard.jsx';
import NamesCard from './NamesCard.jsx';
import { CreateUserCard, UsersCard } from './UsersSection.jsx';

// لوحة الإدارة بعد الدخول
export default function AdminPanel({ api, onLogout }) {
  const site = useSiteConfig(api, true);
  const [users, setUsers] = useState([]);
  const [lMsg, sayL] = useMsg();

  const loadUsers = useCallback(async (manual) => {
    try { setUsers(await api.listUsers()); if (manual === true) sayL('✅ تم التحديث.', 'ok'); }
    catch (e) { sayL('❌ فشل تحميل الحسابات: ' + ((e && e.message) || ''), 'err'); }
  }, [api, sayL]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  return (
    <div>
      <header>
        <div>
          <h1>🛡️ إدارة الحسابات</h1>
          <div className="sub">فقط الحسابات المعتمدة هنا تستطيع الدخول وقراءة/كتابة البيانات (تفرضه قواعد Firestore).</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="status"><span className="dot on" /> متصل</span>
          <button className="btn sm red" type="button" onClick={onLogout}>خروج</button>
        </div>
      </header>

      {site.status === 'ready' && (
        <>
          <NoticeCard cfg={site.cfg} save={site.save} />
          <NewsCard cfg={site.cfg} save={site.save} />
          <NamesCard cfg={site.cfg} save={site.save} />
        </>
      )}
      {site.status === 'error' && (
        <div className="card">
          <h2>⚠️ تعذّر تحميل إعدادات المنصة</h2>
          <div className="msg err">{site.error}</div>
          <div className="hint">أخفيتُ بطاقات الإعدادات عمدًا حتى لا يُكتب شيء فوق إعدادات لم تُقرأ. لن يضيع شيء مما كتبته سابقًا.</div>
          <div className="actions" style={{ marginTop: 10 }}><button className="btn" type="button" onClick={site.reload}>🔄 إعادة المحاولة</button></div>
        </div>
      )}
      {(site.status === 'loading' || site.status === 'idle') && <div className="card"><div className="empty">⏳ جارٍ تحميل إعدادات المنصة...</div></div>}

      <CreateUserCard api={api} users={users} onCreated={loadUsers} />
      <UsersCard api={api} users={users} msg={lMsg} say={sayL} reload={loadUsers} />
    </div>
  );
}
