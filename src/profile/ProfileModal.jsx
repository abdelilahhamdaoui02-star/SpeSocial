import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getSessionStore } from '../session/sessionStore.js';
import { getFbAuth } from '../services/cloud.js';
import { getBridge } from '../session/sessionBridge.js';
import { getSession } from '../session/installSession.js';
import { useCurrentUser, useProfile } from '../store/hooks.js';
import { closeProfile } from './profileWindow.js';
import {
  CYCLES, MSG, MSG_CLEAR_MS, OTP_SECONDS, OTP_RESEND_MS,
  formFromProfile, bannerOf, patchFromForm, validatePasswordChange, passwordErrorMessage,
  photoCrop, isValidPhone, generateOTP, countdownLabel, checkOTP, avatarStyle,
} from './profileLogic.js';

// الحفظ يمرّ بجسر الكود القديم (يكتب في التخزين ثم يحدّث المديرية والأقسام والصورة في بقية الواجهة)
const saveProfile = (patch, opts) => getBridge().saveProfile(patch, opts);

const EMPTY_PWD = { old: '', n: '', n2: '' };
const EMPTY_MSG = { text: '', ok: false };

const fieldStyle = { padding: '9px 12px', border: '1.5px solid #cbd5e1', borderRadius: 8, fontFamily: "'Cairo', sans-serif", fontSize: '0.9rem', color: '#1e293b', width: '100%', background: '#fafbfc' };

function PwdField({ id, label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="profile-field">
      <label>{label}</label>
      <div className="auth-pwd-wrap">
        <input type={show ? 'text' : 'password'} id={id} placeholder={placeholder} value={value} onChange={onChange} />
        <button className="auth-eye" type="button" onClick={() => setShow((s) => !s)}>{show ? '🙈' : '👁'}</button>
      </div>
    </div>
  );
}

function ProfileUI() {
  const user = useCurrentUser();
  const profile = useProfile();
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => formFromProfile(profile));
  const formRef = useRef(form);
  formRef.current = form;
  const [pwd, setPwd] = useState(EMPTY_PWD);
  const [msg, setMsg] = useState(EMPTY_MSG);
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [sendLocked, setSendLocked] = useState(false);

  const codeRef = useRef('');
  const timerRef = useRef(null);
  const countRef = useRef(null);
  const msgTimer = useRef(null);
  const lockTimer = useRef(null);

  const stopCountdown = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const resetAll = () => {
    stopCountdown();
    codeRef.current = '';
    if (countRef.current) countRef.current.textContent = '';
    setOtpOpen(false);
    setOtpInput('');
  };

  // الفتح والإغلاق يأتيان من openProfile/closeProfile (src/profile/profileWindow.js، تُستدعيان من أزرار كثيرة في الصفحة)
  useEffect(() => {
    const onOpen = () => {
      setForm(formFromProfile(profileRef.current));
      setPwd(EMPTY_PWD);
      setMsg(EMPTY_MSG);
      setOpen(true);
    };
    const onClose = () => setOpen(false);
    const onLogout = () => { setOpen(false); setPwd(EMPTY_PWD); setMsg(EMPTY_MSG); resetAll(); };
    window.addEventListener('legacy:profile-open', onOpen);
    window.addEventListener('legacy:profile-close', onClose);
    const offLogout = getSessionStore().on('loggedout', onLogout);
    return () => {
      window.removeEventListener('legacy:profile-open', onOpen);
      window.removeEventListener('legacy:profile-close', onClose);
      offLogout();
      stopCountdown();
      clearTimeout(msgTimer.current);
      clearTimeout(lockTimer.current);
    };
  }, []);

  const showMsg = (text, ok, clearAfter) => {
    clearTimeout(msgTimer.current);
    setMsg({ text, ok });
    if (clearAfter) msgTimer.current = setTimeout(() => setMsg(EMPTY_MSG), clearAfter);
  };

  const setField = (k) => (e) => { const v = e.target.value; setForm((f) => ({ ...f, [k]: v })); };

  // ── حفظ البيانات (والصورة تحفظ معها القيم المكتوبة، كما كان في pickPhoto القديمة) ──
  const handleSave = async (extra) => {
    await saveProfile({ ...patchFromForm(formRef.current), ...(extra || {}) });
    showMsg(MSG.saved, true, MSG_CLEAR_MS);
  };

  const pickPhoto = (e) => {
    const input = e.target;
    const f = input.files && input.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const { sx, sy, side, size } = photoCrop(im.width, im.height);
        const c = document.createElement('canvas');
        c.width = c.height = size;
        c.getContext('2d').drawImage(im, sx, sy, side, side, 0, 0, size, size);
        handleSave({ photo: c.toDataURL('image/jpeg', 0.85) });
      };
      im.src = r.result;
    };
    r.readAsDataURL(f);
    input.value = '';
  };
  const removePhoto = () => handleSave({ photo: null });

  // ── كلمة المرور ──
  const changePassword = async () => {
    const err = validatePasswordChange(pwd.old, pwd.n, pwd.n2);
    if (err) { showMsg(err, false); return; }
    try {
      await getFbAuth().changePassword(pwd.old, pwd.n);
      setPwd(EMPTY_PWD);
      showMsg(MSG.pwdChanged, true);
    } catch (e) {
      showMsg(passwordErrorMessage(e), false);
    }
  };

  // ── التحقق من الهاتف (الرمز يُنشأ ويُفحص هنا؛ الإرسال يبقى عبر dispatchOTP القديمة) ──
  const startCountdown = (secs) => {
    let s = secs;
    stopCountdown();
    timerRef.current = setInterval(() => {
      const el = countRef.current;
      if (el) el.textContent = countdownLabel(s);
      s--;
      if (s < 0) {
        stopCountdown();
        codeRef.current = '';
        if (el) el.textContent = MSG.otpExpiredLabel;
      }
    }, 1000);
  };

  const sendOTP = () => {
    const phone = form.phone.trim();
    if (!isValidPhone(phone)) { alert(MSG.otpBadPhone); return; }
    codeRef.current = generateOTP();
    setOtpOpen(true);
    setOtpInput('');
    startCountdown(OTP_SECONDS);
    getSession().dispatchOTP(phone, codeRef.current, 'profileOTPCountdown');
    setSendLocked(true);
    clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => setSendLocked(false), OTP_RESEND_MS);
  };

  const verifyOTP = async () => {
    const r = checkOTP(otpInput, codeRef.current);
    if (r === 'expired') { alert(MSG.otpExpiredAlert); return; }
    if (r === 'wrong') { alert(MSG.otpWrongAlert); return; }
    codeRef.current = '';
    stopCountdown();
    await saveProfile({ phone: form.phone.trim(), phoneVerified: true }, { effects: false });
    setOtpOpen(false);
    if (countRef.current) countRef.current.textContent = '';
    showMsg(MSG.phoneSaved, true);
  };

  const b = bannerOf(form, user, profile);
  const phoneVerified = !!profile.phoneVerified && form.phone.trim() === (profile.phone || '');

  return (
    <>
      <button
        id="profileCloseFixed"
        onClick={closeProfile}
        style={{ position: 'fixed', top: 10, left: 10, zIndex: 9999, background: '#dc2626', border: 'none', borderRadius: '50%', width: 42, height: 42, color: 'white', fontSize: '1.4rem', cursor: 'pointer', display: open ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
      >✕</button>
      <div className="profile-box">
        <div className="profile-header">
          <button type="button" className="pf-back" onClick={closeProfile}>→ رجوع</button>
          <h3>👤 الحساب الشخصي</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => getSession().panels.openSettings()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: '5px 12px', color: 'white', fontFamily: "'Cairo',sans-serif", fontSize: '0.78rem', cursor: 'pointer' }}>⚙️ الإعدادات</button>
            <button className="profile-close" onClick={closeProfile}>✕</button>
          </div>
        </div>
        <div className="profile-body">
          <div className="profile-info-banner">
            <div className="profile-info-avatar" id="profileInfoAvatar" style={avatarStyle(profile.photo)}>{b.initial}</div>
            <div className="profile-info-details" style={{ flex: 1 }}>
              <div className="profile-info-name" id="profileInfoName">{b.name}</div>
              <div className="profile-info-title" id="profileInfoTitle"><span>💼</span><span>{b.title}</span></div>
              <div className="profile-info-school" id="profileInfoSchool">
                <span>🏛️</span><span>{b.school}</span>
                {b.institution ? (<><br /><span style={{ fontSize: '0.78rem', opacity: 0.85 }}>🏫 {b.institution}</span></>) : null}
              </div>
              <div className="profile-info-phone" id="profileInfoPhone">
                {b.phone ? (<><span>📱</span><span dir="ltr">{b.phone}</span></>) : null}
              </div>
              <div id="profileSecurityBadge" className="profile-security-badge" style={{ display: b.verified ? 'inline-flex' : 'none' }}>🔒 هاتف مُحقَّق</div>
            </div>
          </div>
          <div className="pp-row">
            <input type="file" id="profilePhotoInput" accept="image/*" hidden onChange={pickPhoto} />
            <button type="button" className="pg-btn" onClick={() => document.getElementById('profilePhotoInput').click()}>📷 الصورة الشخصية</button>
            <button type="button" className="pg-btn gray" onClick={removePhoto}>🗑 حذف</button>
          </div>

          <div className="profile-field">
            <label>الاسم الكامل</label>
            <input type="text" id="profileFullName" placeholder="مثال: أحمد الأمين" value={form.fullName} onChange={setField('fullName')} />
          </div>
          <div className="profile-field">
            <label>المنصب / الوظيفة</label>
            <input type="text" id="profileTitle" placeholder="مثال: مختص اجتماعي" value={form.title} onChange={setField('title')} />
          </div>
          <div className="profile-field">
            <label>🏛️ المديرية الإقليمية</label>
            <input type="text" id="profileSchool" placeholder="مثال: مديرية الحي الحسني" value={form.school} onChange={setField('school')} />
          </div>
          <div className="profile-field">
            <label>🏫 المؤسسة التعليمية</label>
            <input type="text" id="profileInstitution" placeholder="مثال: الثانوية الإعدادية المختار السوسي" value={form.institution} onChange={setField('institution')} />
          </div>
          <div className="profile-field">
            <label>🎓 السلك الدراسي</label>
            <select
              id="profileCycle"
              value={form.cycle}
              onChange={setField('cycle')}
              style={fieldStyle}
            >
              {CYCLES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </div>
          <div className="profile-field">
            <label>📱 رقم الهاتف</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="tel" id="profilePhone" placeholder="06XXXXXXXX" dir="ltr" style={{ flex: 1 }} value={form.phone} onChange={setField('phone')} />
              <button
                type="button"
                className="otp-send-btn"
                id="profileSendOTPBtn"
                onClick={sendOTP}
                disabled={phoneVerified || sendLocked}
                style={{ padding: '9px 12px', fontSize: '0.78rem', ...(phoneVerified ? { background: '#16a34a' } : null) }}
              >{phoneVerified ? '✅ مُحقَّق' : '📤 تحقق'}</button>
            </div>
          </div>
          {/* القسم يبقى في الصفحة دائماً (مخفياً) لأن dispatchOTP القديمة تكتب حالة الإرسال في #profileOTPCountdown */}
          <div id="profileOTPSection" style={{ display: otpOpen ? 'block' : 'none' }}>
            <div className="otp-verify-section">
              <div className="otp-verify-title">🔐 أدخل رمز التحقق المُرسل إلى هاتفك</div>
              <div className="otp-input-row">
                <input type="text" id="profileOTPInput" className="otp-input" placeholder="× × × × × ×" maxLength={6} value={otpInput} onChange={(e) => setOtpInput(e.target.value)} />
                <button type="button" className="otp-verify-btn" onClick={verifyOTP}>✅ تأكيد</button>
              </div>
              <div className="otp-countdown" id="profileOTPCountdown" ref={countRef} />
            </div>
          </div>
          <div className="profile-field">
            <label>✉️ البريد الإلكتروني (اختياري)</label>
            <input type="email" id="profileEmail" placeholder="example@email.com" dir="ltr" value={form.email} onChange={setField('email')} />
          </div>
          <button className="profile-save-btn" onClick={() => handleSave()}>💾 حفظ البيانات الشخصية</button>

          <div className="profile-pwd-section">
            <div className="profile-pwd-title">🔑 تغيير كلمة المرور</div>
            <PwdField id="profileOldPwd" label="كلمة المرور الحالية" placeholder="كلمة المرور الحالية" value={pwd.old} onChange={(e) => setPwd((p) => ({ ...p, old: e.target.value }))} />
            <PwdField id="profileNewPwd" label="كلمة المرور الجديدة (6 أحرف على الأقل)" placeholder="كلمة المرور الجديدة" value={pwd.n} onChange={(e) => setPwd((p) => ({ ...p, n: e.target.value }))} />
            <PwdField id="profileNewPwd2" label="تأكيد كلمة المرور الجديدة" placeholder="تأكيد كلمة المرور" value={pwd.n2} onChange={(e) => setPwd((p) => ({ ...p, n2: e.target.value }))} />
            <button className="profile-save-btn" style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)' }} onClick={changePassword}>🔑 تغيير كلمة المرور</button>
            <div id="profileMsg" style={{ marginTop: 8, fontSize: '0.8rem', minHeight: 20, color: msg.ok ? '#16a34a' : '#dc2626' }}>{msg.text}</div>
          </div>
        </div>
      </div>
    </>
  );
}

// الحاوية #profileModal تبقى في HTML القديم (فئة open تضيفها openProfile في src/profile/profileWindow.js)
export default function ProfileModal({ mount }) {
  return mount ? createPortal(<ProfileUI />, mount) : null;
}
