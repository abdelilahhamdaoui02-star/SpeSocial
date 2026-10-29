// منطق شعار المؤسسة في الإعدادات: منقول من handleLogoUpload القديمة (التحقق ثم التصغير)،
// ومعاينة الشعار وحالته (كانتا تُكتبان في DOM داخل applyLogo).

export const LOGO_TYPES = /^image\/(png|jpe?g|svg\+xml|webp)$/;
export const LOGO_MAX_BYTES = 8 * 1024 * 1024;
export const LOGO_MAX_W = 1400;

export const LOGO_MSG = {
  badType: '⚠️ صيغة غير مدعومة. استعمل JPG أو PNG أو SVG أو WEBP.',
  tooBig: '⚠️ حجم الصورة كبير جداً. الحد الأقصى 8MB.',
  readFail: '⚠️ تعذّرت قراءة الملف.',
  openFail: '⚠️ تعذّر فتح الصورة.',
  none: 'لم يتم رفع شعار بعد',
  custom: '✅ شعار المؤسسة مُفعّل في التقارير',
  default: 'الشعار الحالي: الافتراضي (الوزارة) — ارفع شعار مؤسستك لاستبداله',
};

// رسالة الخطأ أو null
export function validateLogoFile(file) {
  if (!LOGO_TYPES.test(file.type)) return LOGO_MSG.badType;
  if (file.size > LOGO_MAX_BYTES) return LOGO_MSG.tooBig;
  return null;
}

// تصغير الصورة بالعرض فقط (حتى 1400px) مع حفظ النسبة
export function logoSize(w, h) {
  if (w > LOGO_MAX_W) return { w: LOGO_MAX_W, h: Math.round((h * LOGO_MAX_W) / w) };
  return { w, h };
}

export const keepsAlpha = (type) => type === 'image/png' || type === 'image/webp';

// يعيد صورة الشعار كـ data URL بعد التحقق والتصغير، أو null بعد تنبيه المستخدم بالخطأ.
// env يحقن أدوات المتصفح لتسهيل الاختبار: { FileReader, Image, createCanvas(w, h), alert }
export function processLogoFile(file, env) {
  return new Promise((resolve) => {
    const err = validateLogoFile(file);
    if (err) { env.alert(err); resolve(null); return; }
    const reader = new env.FileReader();
    reader.onerror = () => { env.alert(LOGO_MSG.readFail); resolve(null); };
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      if (file.type === 'image/svg+xml') { resolve(dataUrl); return; }
      const img = new env.Image();
      img.onerror = () => { env.alert(LOGO_MSG.openFail); resolve(null); };
      img.onload = () => {
        const { w, h } = logoSize(img.naturalWidth, img.naturalHeight);
        const c = env.createCanvas(w, h);
        const ctx = c.getContext('2d');
        const keep = keepsAlpha(file.type);
        if (!keep) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(keep ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.92));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

// ما يظهر في الإعدادات؛ logo = null قبل أن يصل أول حدث من الكود القديم
export function logoView(logo) {
  if (!logo) return { src: '', text: LOGO_MSG.none, custom: false, canRemove: false };
  return { src: logo.src, text: logo.custom ? LOGO_MSG.custom : LOGO_MSG.default, custom: !!logo.custom, canRemove: !!logo.custom };
}

// printLogoImg القديمة: شعار المؤسسة لأي وثيقة طباعة (logo = الشعار الفعّال، فارغ → لا شيء)
export function printLogoImg(logo, maxH) {
  if (!logo) return '';
  return '<div style="text-align:center;line-height:0;margin:0 0 8px;"><img src="' + logo + '" alt="شعار المؤسسة" style="max-width:100%;width:100%;max-height:' + (maxH || 110) + 'px;object-fit:contain;display:block;margin:0 auto;"></div>';
}
