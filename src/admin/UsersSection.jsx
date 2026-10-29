import { useState } from 'react';
import { Msg } from './ui.jsx';
import { useMsg } from './hooks.js';
import { validUsername, userHint, randomPwd, filterUsers } from './siteLogic.js';

// ➕ إنشاء حساب جديد
export function CreateUserCard({ api, users, onCreated }) {
  const [name, setName] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, say] = useMsg();
  const hint = userHint(name);

  async function create() {
    const n = name.trim().toLowerCase();
    if (!validUsername(n)) return say('⚠️ اسم الحساب غير صالح أو محجوز.', 'err');
    if (pwd.length < 6) return say('⚠️ كلمة المرور 6 أحرف على الأقل.', 'err');
    if (users.some((u) => u.username === n)) return say('❌ اسم الحساب "' + n + '" معتمد مسبقًا.', 'err');
    setBusy(true); say('⏳ جارٍ الإنشاء...');
    try {
      await api.createUser(n, pwd);
      say('✅ تم إنشاء واعتماد الحساب «' + n + '». كلمة المرور: ' + pwd, 'ok');
      setName(''); setPwd('');
      await onCreated();
    } catch (e) { say('❌ ' + ((e && e.message) || 'فشل الإنشاء'), 'err'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h2>➕ إنشاء حساب جديد</h2>
      <div className="row">
        <div className="field">
          <label>👤 اسم الحساب</label>
          <input type="text" className="ltr" placeholder="مثال: abde05" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="hint" style={hint.color ? { color: hint.color } : undefined}>{hint.text}</div>
        </div>
        <div className="field">
          <label>🔒 كلمة المرور (6 أحرف على الأقل)</label>
          <div className="pwd-wrap">
            <input type="text" className="ltr" autoComplete="off" value={pwd} onChange={(e) => setPwd(e.target.value)} />
            <button className="eye" type="button" title="توليد كلمة مرور" onClick={() => setPwd(randomPwd())}>🎲</button>
          </div>
          <div className="hint">تظهر هنا بوضوح لتنسخها وتسلّمها للمستخدم.</div>
        </div>
      </div>
      <button className="btn" type="button" disabled={busy} onClick={create}>✅ إنشاء الحساب</button>
      <Msg m={msg} />
    </div>
  );
}

// نافذة: حذف حساب
function DeleteModal({ user, onClose, onConfirm }) {
  const [withData, setWithData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, say] = useMsg();
  async function confirm() {
    setBusy(true);
    try { await onConfirm(user, withData); }
    catch (e) { say('❌ ' + ((e && e.message) || 'فشل الحذف'), 'err'); setBusy(false); }
  }
  return (
    <div className="modal-bg">
      <div className="modal">
        <h2>🗑 حذف الحساب: <span className="ltr" style={{ display: 'inline-block' }}>{user.username}</span></h2>
        <div className="sub">يُسحب اعتماد الحساب فورًا فلا يستطيع الوصول إلى أي بيانات. (يبقى سجل الدخول في Firebase Authentication — يمكنك حذفه من Console.)</div>
        <label className="chk"><input type="checkbox" checked={withData} onChange={(e) => setWithData(e.target.checked)} /> حذف بياناته أيضًا (الأرشيف، الملفات، الملف الشخصي) — لا يمكن التراجع</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn red" type="button" disabled={busy} onClick={confirm}>تأكيد الحذف</button>
          <button className="btn gray" type="button" onClick={onClose}>إلغاء</button>
        </div>
        <Msg m={msg} />
      </div>
    </div>
  );
}

// 👥 الحسابات المعتمدة
export function UsersCard({ api, users, msg, say, reload }) {
  const [q, setQ] = useState('');
  const [target, setTarget] = useState(null);
  const list = filterUsers(users, q);

  async function toggle(u) {
    try {
      await api.setUserActive(u, !u.active);
      say('✅ تم ' + (u.active ? 'إيقاف' : 'تفعيل') + ' الحساب «' + u.username + '».', 'ok');
      await reload();
    } catch (e) { say('❌ ' + ((e && e.message) || 'فشل'), 'err'); }
  }
  async function doDelete(u, withData) {
    await api.deleteUser(u, withData);
    setTarget(null);
    say('✅ تم سحب اعتماد الحساب «' + u.username + '».', 'ok');
    await reload();
  }

  return (
    <div className="card">
      <h2>👥 الحسابات المعتمدة <span className="badge">{users.length}</span></h2>
      <div className="toolbar">
        <input type="text" placeholder="🔍 بحث باسم الحساب..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn sm gray" type="button" onClick={() => reload(true)}>🔄 تحديث</button>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>#</th><th>اسم الحساب</th><th>الحالة</th><th>تاريخ الإنشاء</th><th>إجراءات</th></tr></thead>
          <tbody>
            {!list.length && <tr><td colSpan="5" className="empty">لا توجد حسابات معتمدة.</td></tr>}
            {list.map((u, i) => {
              let d = '—'; try { if (u.created) d = new Date(u.created).toLocaleDateString('ar-MA'); } catch { /* تاريخ غير صالح */ }
              return (
                <tr key={u.uid}>
                  <td>{i + 1}</td>
                  <td className="u">{u.username}</td>
                  <td>{u.active ? '✅ مفعّل' : '⏸ موقوف'}</td>
                  <td>{d}</td>
                  <td><div className="actions">
                    <button type="button" className="btn sm amber" onClick={() => toggle(u)}>{u.active ? '⏸ إيقاف' : '▶ تفعيل'}</button>
                    <button type="button" className="btn sm red" onClick={() => setTarget(u)}>🗑 حذف</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Msg m={msg} />
      {target && <DeleteModal user={target} onClose={() => setTarget(null)} onConfirm={doDelete} />}
    </div>
  );
}
