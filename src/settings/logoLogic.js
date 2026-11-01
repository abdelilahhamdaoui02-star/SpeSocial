// منطق شعار المؤسسة في الإعدادات: منقول من handleLogoUpload القديمة (التحقق ثم التصغير)،
// ومعاينة الشعار وحالته (كانتا تُكتبان في DOM داخل applyLogo).

export const LOGO_TYPES = /^image\/(png|jpe?g|svg\+xml|webp)$/;
export const LOGO_MAX_BYTES = 8 * 1024 * 1024;
export const LOGO_MAX_W = 1400;
// الشعار يُحفظ الآن في Firebase، وحدّ الوثيقة الواحدة فيه نحو 1MB: لا نقبل نصاً (data URL) أطول من هذا
export const LOGO_CLOUD_MAX = 900000;

export const LOGO_MSG = {
  tooBigCloud: '⚠️ الشعار كبير جداً للحفظ في السحابة. اختر صورة أصغر أو بجودة أقل.',
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
      if (file.type === 'image/svg+xml') {
        if (dataUrl.length > LOGO_CLOUD_MAX) { env.alert(LOGO_MSG.tooBigCloud); resolve(null); return; }
        resolve(dataUrl);
        return;
      }
      const img = new env.Image();
      img.onerror = () => { env.alert(LOGO_MSG.openFail); resolve(null); };
      img.onload = () => {
        const keep = keepsAlpha(file.type);
        const render = (w, h, quality) => {
          const c = env.createCanvas(w, h);
          const ctx = c.getContext('2d');
          if (!keep) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
          ctx.drawImage(img, 0, 0, w, h);
          return keep ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', quality);
        };
        let { w, h } = logoSize(img.naturalWidth, img.naturalHeight);
        let out = render(w, h, 0.92);
        // تصغير تدريجي (20% في كل مرة) حتى يلائم حدّ التخزين السحابي؛ لا يعمل إلا للصور الكبيرة جداً
        for (let i = 0; i < 6 && out.length > LOGO_CLOUD_MAX; i++) {
          w = Math.max(1, Math.round(w * 0.8)); h = Math.max(1, Math.round(h * 0.8));
          out = render(w, h, 0.85);
        }
        if (out.length > LOGO_CLOUD_MAX) { env.alert(LOGO_MSG.tooBigCloud); resolve(null); return; }
        resolve(out);
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
  // الشعار ترويسة بعرض الصفحة كاملاً بهامش صغير (6px أعلى و8px جانبين)؛ الارتفاع يتبع نسبة الصورة
  return '<div style="margin:6px 8px 8px;line-height:0;"><img src="' + logo + '" alt="شعار المؤسسة" style="width:100%;height:auto;max-height:230px;object-fit:contain;display:block;"></div>';
}
