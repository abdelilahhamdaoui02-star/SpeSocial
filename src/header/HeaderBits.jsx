import { createPortal } from 'react-dom';
import { useAppState, useCurrentUser, useProfile, useStudentCount, useSyncCloud } from '../store/hooks.js';
import { useToday } from '../home/useToday.js';
import { getSession } from '../session/installSession.js';
import { dateParts, initialOf, displayName, syncLabel } from './headerLogic.js';
import { openProfile } from '../profile/profileWindow.js';

const openSettings = () => getSession().panels.openSettings();
const logout = () => getSession().flow.logout();

// تاريخ اليوم في اللوحة: يتغير تلقائياً عند منتصف الليل
function HeroDate() {
  const { day, full } = dateParts(useToday());
  return (
    <>
      <strong id="portalDateDay">{day}</strong><span id="portalDateFull">{full}</span>
    </>
  );
}

function StudentCount() {
  const { ready } = useAppState();
  const n = useStudentCount();
  return (
    <>
      عدد التلاميذ: <b id="statStudentCount" className={ready ? undefined : 'stat-loading'}>{ready ? n : '—'}</b>
    </>
  );
}

// شريط المستخدم. الحاوية #userBar تبقى من HTML القديم (تُظهرها/تُخفيها فئة visible من الكود القديم)،
// والأفاتار لا نضع له style: صورة المستخدم يضعها applyPhoto القديم بالمعرّف userInitial.
function UserBar() {
  const user = useCurrentUser();
  const profile = useProfile();
  const cloud = useSyncCloud();
  return (
    <>
      <div className="user-avatar" id="userInitial" onClick={openProfile} title="الحساب الشخصي">{initialOf(profile, user)}</div>
      <div className="user-name" id="userNameDisplay" onClick={openProfile}>{displayName(profile, user)}</div>
      <div className="sync-indicator"><div className="sync-dot" /><span id="syncLabel">{syncLabel(cloud)}</span></div>
      <button id="settingsBtn" className="visible" onClick={openSettings} title="الإعدادات">⚙️</button>
      <button id="logoutBtn" onClick={logout}>خروج</button>
    </>
  );
}

export default function HeaderBits({ mounts }) {
  return (
    <>
      {mounts.date && createPortal(<HeroDate />, mounts.date)}
      {mounts.count && createPortal(<StudentCount />, mounts.count)}
      {mounts.userBar && createPortal(<UserBar />, mounts.userBar)}
    </>
  );
}
