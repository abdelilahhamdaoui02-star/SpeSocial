// نسخة مجمَّدة من دوال الحساب الشخصي في script-10.js قبل المرحلة 13 (للمقارنة فقط — لا تُحمَّل في التطبيق)
function openProfile() {
  document.getElementById('profileFullName').value = userProfile.fullName || '';
  document.getElementById('profileTitle').value = userProfile.title || '';
  document.getElementById('profileSchool').value = userProfile.school || '';
  document.getElementById('profileInstitution').value = userProfile.institution || '';
  const cycleEl = document.getElementById('profileCycle'); if (cycleEl) cycleEl.value = userProfile.cycle || 'college';
  document.getElementById('profilePhone').value = userProfile.phone || '';
  document.getElementById('profileEmail').value = userProfile.email || '';
  document.getElementById('profileOldPwd').value = '';
  document.getElementById('profileNewPwd').value = '';
  document.getElementById('profileNewPwd2').value = '';
  document.getElementById('profileMsg').textContent = '';
  updateProfileBanner();
  document.getElementById('profileModal').classList.add('open');
  document.getElementById('profileModal').scrollTop = 0;
  const btn = document.getElementById('profileCloseFixed'); if(btn) btn.style.display='flex';
}

function updateProfileBanner() {
  const name = document.getElementById('profileFullName').value || currentUser || '—';
  const title = document.getElementById('profileTitle').value || '—';
  const school = document.getElementById('profileSchool').value || '—';
  const institution = (document.getElementById('profileInstitution')?.value) || '';
  const phone = document.getElementById('profilePhone').value || '';
  document.getElementById('profileInfoAvatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('profileInfoName').textContent = name;
  document.getElementById('profileInfoTitle').innerHTML = `<span>💼</span><span>${title}</span>`;
  document.getElementById('profileInfoSchool').innerHTML = `<span>🏛️</span><span>${school}</span>${institution ? `<br><span style='font-size:0.78rem;opacity:0.85;'>🏫 ${institution}</span>` : ''}`;
  document.getElementById('profileInfoPhone').innerHTML = phone ? `<span>📱</span><span dir="ltr">${phone}</span>` : '';
  const badge = document.getElementById('profileSecurityBadge');
  if (badge) badge.style.display = userProfile.phoneVerified ? 'inline-flex' : 'none';
  applyPhoto();
}

function closeProfile() { document.getElementById('profileModal').classList.remove('open'); const btn = document.getElementById('profileCloseFixed'); if(btn) btn.style.display='none'; }

async function saveProfile() {
  userProfile.fullName = document.getElementById('profileFullName').value.trim();
  userProfile.title = document.getElementById('profileTitle').value.trim();
  userProfile.school = document.getElementById('profileSchool').value.trim();
  userProfile.institution = (document.getElementById('profileInstitution')?.value || '').trim();
  userProfile.cycle = (document.getElementById('profileCycle')?.value || 'college');
  userProfile.phone = document.getElementById('profilePhone').value.trim();
  userProfile.email = document.getElementById('profileEmail')?.value.trim() || '';
  await storageSet(currentUser + ':profile', JSON.stringify(userProfile), true);
  window.dispatchEvent(new Event('legacy:profile-changed'));
  updateProfileBanner();
  updateDirectorateUI();
  updateAllLevelSelects();
  applyInstitutionEverywhere();
  const msg = document.getElementById('profileMsg');
  msg.textContent = '✅ تم حفظ البيانات الشخصية بنجاح.'; msg.style.color = '#16a34a';
  setTimeout(() => { msg.textContent = ''; }, 2500);
}

async function changePassword() {
  const oldPwd = document.getElementById('profileOldPwd').value;
  const newPwd = document.getElementById('profileNewPwd').value;
  const newPwd2 = document.getElementById('profileNewPwd2').value;
  const msg = document.getElementById('profileMsg');
  msg.style.color = '#dc2626';
  if (!oldPwd || !newPwd || !newPwd2) { msg.textContent = '⚠️ يرجى ملء جميع حقول تغيير كلمة المرور.'; return; }
  if (newPwd.length < 6) { msg.textContent = '⚠️ كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.'; return; }
  if (newPwd !== newPwd2) { msg.textContent = '❌ كلمتا المرور الجديدتان غير متطابقتين.'; return; }
  try {
    await window._fbAuth.changePassword(oldPwd, newPwd);
    document.getElementById('profileOldPwd').value = '';
    document.getElementById('profileNewPwd').value = '';
    document.getElementById('profileNewPwd2').value = '';
    msg.style.color = '#16a34a'; msg.textContent = '✅ تم تغيير كلمة المرور بنجاح.';
  } catch(e) {
    const c = (e && e.code) || '';
    msg.textContent = (c === 'auth/invalid-credential' || c === 'auth/wrong-password')
      ? '❌ كلمة المرور الحالية غير صحيحة.'
      : '❌ خطأ: ' + (e.message || 'حاول مجدداً.');
  }
}

// ── OTP / Phone Verification ──
let _otpCode = '';
let _otpTimer = null;
let _otpPhone = '';

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function startOTPCountdown(elId, seconds) {
  const el = document.getElementById(elId);
  if (!el) return;
  let s = seconds;
  if (_otpTimer) clearInterval(_otpTimer);
  _otpTimer = setInterval(() => {
    const m = Math.floor(s/60), sec = s%60;
    el.textContent = `⏱ صلاحية الرمز: ${m}:${sec.toString().padStart(2,'0')}`;
    s--;
    if (s < 0) {
      clearInterval(_otpTimer);
      _otpCode = '';
      el.textContent = '⚠️ انتهت صلاحية الرمز. اضغط إرسال مجدداً.';
    }
  }, 1000);
}

// Send OTP via WhatsApp (CallMeBot free API) or fallback SMS hint
async function sendOTPViaWhatsApp(phone, code) {
  // CallMeBot WhatsApp API (free, requires one-time activation by user)
  // User must first send "I allow callmebot to send me messages" to +34 644 600 695
  const msg = encodeURIComponent(`🔐 منصة التوثيق المهني\nرمز التحقق الخاص بك:\n*${code}*\nصالح لمدة دقيقتين. لا تشاركه مع أحد.`);
  const apikey = 'YOUR_CALLMEBOT_APIKEY'; // يحتاج تفعيل مرة واحدة
  // Normalize phone: remove leading 0, add country code 212 for Morocco
  let normalizedPhone = phone.replace(/^0/, '212').replace(/[\s\-+]/g,'');
  const url = `https://api.callmebot.com/whatsapp.php?phone=${normalizedPhone}&text=${msg}&apikey=${apikey}`;

  try {
    // Try WhatsApp via CallMeBot
    const resp = await fetch(url, { method: 'GET', mode: 'no-cors' });
    return { channel: 'whatsapp', success: true };
  } catch(e) {
    return { channel: 'whatsapp', success: false };
  }
}

async function sendOTPViaSMS(phone, code) {
  // SMS via fast2sms or similar — replace with your provider
  // This is a placeholder — integrate your SMS API here
  return { channel: 'sms', success: false };
}

async function dispatchOTP(phone, code, statusElId) {
  const el = document.getElementById(statusElId);
  if (el) el.textContent = '⏳ جارٍ إرسال رمز التحقق...';

  // Try WhatsApp first
  const waResult = await sendOTPViaWhatsApp(phone, code);
  if (waResult.success) {
    if (el) el.textContent = '✅ تم إرسال الرمز عبر واتساب 📱';
    return;
  }

  // Fallback: SMS
  const smsResult = await sendOTPViaSMS(phone, code);
  if (smsResult.success) {
    if (el) el.textContent = '✅ تم إرسال الرمز عبر SMS 📨';
    return;
  }

  // Final fallback: show in UI (dev mode only)
  if (el) el.innerHTML = `⚠️ <span style="color:#92400e;font-size:0.75rem;">لم يكتمل الإرسال التلقائي — رمزك: <strong style="font-size:1rem;letter-spacing:3px;color:#1a3a5c;">${code}</strong><br><small>لتفعيل الإرسال التلقائي: أرسل "I allow callmebot to send me messages" لـ +34644600695 على واتساب، ثم أدخل الـ API key في الكود.</small></span>`;
}

function authSendOTP() {
  const phone = document.getElementById('authRegPhone')?.value.trim();
  if (!phone || phone.length < 8) { alert('⚠️ يرجى إدخال رقم هاتف صحيح أولاً.'); return; }
  _otpPhone = phone;
  _otpCode = generateOTP();
  document.getElementById('authOTPSection').style.display = 'block';
  startOTPCountdown('authOTPCountdown', 120);
  dispatchOTP(phone, _otpCode, 'authOTPCountdown');
  const btn = document.getElementById('authSendOTPBtn');
  if (btn) { btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 30000); }
}

function authVerifyOTP() {
  const input = document.getElementById('authOTPInput')?.value.trim();
  if (!_otpCode) { alert('⚠️ الرمز منتهي الصلاحية. اضغط إرسال مجدداً.'); return; }
  if (input === _otpCode) {
    _otpCode = '';
    if (_otpTimer) clearInterval(_otpTimer);
    document.getElementById('authOTPCountdown').textContent = '✅ تم التحقق بنجاح!';
    document.getElementById('authOTPSection').style.display = 'none';
    const btn = document.getElementById('authSendOTPBtn');
    if (btn) { btn.textContent = '✅ مُحقَّق'; btn.style.background = '#16a34a'; btn.disabled = true; }
  } else {
    alert('❌ الرمز غير صحيح. تحقق من رسالة واتساب أو SMS وأعد المحاولة.');
  }
}

function profileSendOTP() {
  const phone = document.getElementById('profilePhone')?.value.trim();
  if (!phone || phone.length < 8) { alert('⚠️ يرجى إدخال رقم هاتف صحيح أولاً.'); return; }
  _otpPhone = phone;
  _otpCode = generateOTP();
  document.getElementById('profileOTPSection').style.display = 'block';
  startOTPCountdown('profileOTPCountdown', 120);
  dispatchOTP(phone, _otpCode, 'profileOTPCountdown');
  const btn = document.getElementById('profileSendOTPBtn');
  if (btn) { btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 30000); }
}

async function profileVerifyOTP() {
  const input = document.getElementById('profileOTPInput')?.value.trim();
  if (!_otpCode) { alert('⚠️ الرمز منتهي الصلاحية. اضغط إرسال مجدداً.'); return; }
  if (input === _otpCode) {
    _otpCode = '';
    if (_otpTimer) clearInterval(_otpTimer);
    userProfile.phoneVerified = true;
    userProfile.phone = document.getElementById('profilePhone').value.trim();
    await storageSet(currentUser + ':profile', JSON.stringify(userProfile), true);
    document.getElementById('profileOTPSection').style.display = 'none';
    document.getElementById('profileOTPCountdown').textContent = '';
    const btn = document.getElementById('profileSendOTPBtn');
    if (btn) { btn.textContent = '✅ مُحقَّق'; btn.style.background = '#16a34a'; btn.disabled = true; }
    updateProfileBanner();
    const msg = document.getElementById('profileMsg');
    if (msg) { msg.style.color = '#16a34a'; msg.textContent = '✅ تم التحقق من رقم الهاتف وحفظه.'; }
  } else {
    alert('❌ الرمز غير صحيح. تحقق من رسالة واتساب أو SMS.');
  }
}

