// إرسال رمز التحقق من الهاتف — منقول من sendOTPViaWhatsApp/sendOTPViaSMS/dispatchOTP في script-10.js (الخطوة 47).
// توليد الرمز وفحصه والعدّاد التنازلي في src/profile (profileLogic.js وProfileModal.jsx)؛ هنا الإرسال فقط.
// ملاحظة: دالتا authSendOTP/authVerifyOTP للتسجيل حُذفتا لأن نموذج التسجيل لم يعد موجوداً (الحسابات يُنشئها المسؤول).

// مفتاح CallMeBot (واتساب). يحتاج تفعيلاً مرة واحدة: أرسل "I allow callmebot to send me messages" إلى +34644600695 ثم ضع المفتاح هنا.
export const CALLMEBOT_APIKEY = 'YOUR_CALLMEBOT_APIKEY';

export const normalizePhone = (phone) => String(phone).replace(/^0/, '212').replace(/[\s\-+]/g, '');

export const whatsappMessage = (code) =>
  `🔐 SpeSocial\nرمز التحقق الخاص بك:\n*${code}*\nصالح لمدة دقيقتين. لا تشاركه مع أحد.`;

export const whatsappUrl = (phone, code, apikey = CALLMEBOT_APIKEY) =>
  `https://api.callmebot.com/whatsapp.php?phone=${normalizePhone(phone)}&text=${encodeURIComponent(whatsappMessage(code))}&apikey=${apikey}`;

export const STATUS = {
  sending: '⏳ جارٍ إرسال رمز التحقق...',
  whatsapp: '✅ تم إرسال الرمز عبر واتساب 📱',
  sms: '✅ تم إرسال الرمز عبر SMS 📨',
};

export const fallbackHtml = (code) =>
  `⚠️ <span style="color:#92400e;font-size:0.75rem;">لم يكتمل الإرسال التلقائي — رمزك: <strong style="font-size:1rem;letter-spacing:3px;color:#1a3a5c;">${code}</strong><br><small>لتفعيل الإرسال التلقائي: أرسل "I allow callmebot to send me messages" لـ +34644600695 على واتساب، ثم أدخل الـ API key في الكود.</small></span>`;

// deps: { doc, fetch, apikey? } — يرجع { channel, success }
export async function sendOTPViaWhatsApp(phone, code, deps = {}) {
  const f = deps.fetch || ((...a) => fetch(...a));
  try {
    // no-cors: الاستجابة معتمة، فلا يفشل الطلب إلا عند انقطاع الشبكة
    await f(whatsappUrl(phone, code, deps.apikey), { method: 'GET', mode: 'no-cors' });
    return { channel: 'whatsapp', success: true };
  } catch (e) {
    return { channel: 'whatsapp', success: false };
  }
}

// مكان ربط مزوّد SMS (لم يُربَط بعد)
export async function sendOTPViaSMS() {
  return { channel: 'sms', success: false };
}

// يكتب حالة الإرسال في العنصر statusElId (إن وُجد): واتساب ثم SMS ثم عرض الرمز على الشاشة (وضع التطوير)
export async function dispatchOTP(phone, code, statusElId, deps = {}) {
  const doc = deps.doc || document;
  const el = doc.getElementById(statusElId);
  if (el) el.textContent = STATUS.sending;

  const wa = await (deps.sendWhatsApp || sendOTPViaWhatsApp)(phone, code, deps);
  if (wa.success) { if (el) el.textContent = STATUS.whatsapp; return; }

  const sms = await (deps.sendSMS || sendOTPViaSMS)(phone, code, deps);
  if (sms.success) { if (el) el.textContent = STATUS.sms; return; }

  if (el) el.innerHTML = fallbackHtml(code);
}
