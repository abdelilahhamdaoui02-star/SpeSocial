// منطق نقي لنافذة «الحساب الشخصي» (منقول من openProfile / updateProfileBanner / saveProfile /
// changePassword / pickPhoto / profileSendOTP / profileVerifyOTP القديمة في script-10.js).

export const DEFAULT_CYCLE = 'college';

export const CYCLES = [
  ['college', '🔷 إعدادي فقط'],
  ['lycee', '🔶 ثانوي فقط'],
  ['both', '🔷🔶 إعدادي وثانوي'],
  ['primary', '🟢 ابتدائي'],
  ['all', '📚 الكل (إعدادي + ثانوي + ابتدائي)'],
];

export const OTP_SECONDS = 120;       // صلاحية الرمز
export const OTP_RESEND_MS = 30000;   // مهلة إعادة الإرسال
export const PHOTO_SIZE = 240;        // مقاس الصورة الشخصية المحفوظة
export const MSG_CLEAR_MS = 2500;

export const MSG = {
  saved: '✅ تم حفظ البيانات الشخصية بنجاح.',
  pwdMissing: '⚠️ يرجى ملء جميع حقول تغيير كلمة المرور.',
  pwdShort: '⚠️ كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.',
  pwdMismatch: '❌ كلمتا المرور الجديدتان غير متطابقتين.',
  pwdChanged: '✅ تم تغيير كلمة المرور بنجاح.',
  pwdWrong: '❌ كلمة المرور الحالية غير صحيحة.',
  phoneSaved: '✅ تم التحقق من رقم الهاتف وحفظه.',
  otpBadPhone: '⚠️ يرجى إدخال رقم هاتف صحيح أولاً.',
  otpExpiredAlert: '⚠️ الرمز منتهي الصلاحية. اضغط إرسال مجدداً.',
  otpWrongAlert: '❌ الرمز غير صحيح. تحقق من رسالة واتساب أو SMS.',
  otpExpiredLabel: '⚠️ انتهت صلاحية الرمز. اضغط إرسال مجدداً.',
};

// قيم النموذج من الملف المحفوظ (openProfile)
export function formFromProfile(p) {
  const x = p || {};
  return {
    fullName: x.fullName || '',
    title: x.title || '',
    school: x.school || '',
    institution: x.institution || '',
    cycle: x.cycle || DEFAULT_CYCLE,
    phone: x.phone || '',
    email: x.email || '',
  };
}

// ما يظهر في اللافتة العلوية (updateProfileBanner) — يُحسب من قيم النموذج الحالية لا من المحفوظة
export function bannerOf(form, user, profile) {
  const f = form || {};
  const name = f.fullName || user || '—';
  return {
    initial: name.charAt(0).toUpperCase(),
    name,
    title: f.title || '—',
    school: f.school || '—',
    institution: f.institution || '',
    phone: f.phone || '',
    verified: !!(profile && profile.phoneVerified),
  };
}

// ما يُكتب في الملف الشخصي عند الحفظ (saveProfile)
export function patchFromForm(form) {
  const f = form || {};
  return {
    fullName: (f.fullName || '').trim(),
    title: (f.title || '').trim(),
    school: (f.school || '').trim(),
    institution: (f.institution || '').trim(),
    cycle: f.cycle || DEFAULT_CYCLE,
    phone: (f.phone || '').trim(),
    email: (f.email || '').trim(),
  };
}

// تحقق حقول تغيير كلمة المرور؛ يعيد نص الخطأ أو null
export function validatePasswordChange(oldPwd, newPwd, newPwd2) {
  if (!oldPwd || !newPwd || !newPwd2) return MSG.pwdMissing;
  if (newPwd.length < 6) return MSG.pwdShort;
  if (newPwd !== newPwd2) return MSG.pwdMismatch;
  return null;
}

export function passwordErrorMessage(e) {
  const c = (e && e.code) || '';
  if (c === 'auth/invalid-credential' || c === 'auth/wrong-password') return MSG.pwdWrong;
  return '❌ خطأ: ' + ((e && e.message) || 'حاول مجدداً.');
}

// الصورة الشخصية: مربع مقصوص من وسط الصورة (pickPhoto)
export function photoCrop(width, height, size = PHOTO_SIZE) {
  const m = Math.min(width, height);
  return { sx: (width - m) / 2, sy: (height - m) / 2, side: m, size };
}

// ── التحقق من الهاتف (OTP) ──
export const isValidPhone = (phone) => !!phone && phone.length >= 8;

export function generateOTP(rand = Math.random) {
  return Math.floor(100000 + rand() * 900000).toString();
}

export function countdownLabel(seconds) {
  const m = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `⏱ صلاحية الرمز: ${m}:${sec.toString().padStart(2, '0')}`;
}

// 'expired' إن لم يبقَ رمز، 'ok' إن طابق، وإلا 'wrong'
export function checkOTP(input, code) {
  if (!code) return 'expired';
  return String(input || '').trim() === code ? 'ok' : 'wrong';
}

// الحرف الأول للصورة الرمزية بحسب وجود صورة
export function avatarStyle(photo) {
  return photo
    ? { backgroundImage: `url("${photo}")`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'transparent', borderRadius: '50%' }
    : undefined;
}
