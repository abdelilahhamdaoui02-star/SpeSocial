// أدوات صور الورشات التي تحتاج المتصفح (canvas/Image) — منقولة من wsCompressImage وwsEnsureRatios القديمتين.
// خارج workshopsLogic.js عمداً لأن منطقه بحت ويُختبر في Node بلا DOM.

const MAX_SIDE = 1000;

// يقرأ ملف صورة ويصغّره (أطول ضلع 1000 بكسل) ويحوّله JPEG بجودة 0.72 على خلفية بيضاء، ويعيد data URL
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        const r = Math.min(1, MAX_SIDE / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * r)), ch = Math.max(1, Math.round(h * r));
        const c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve(c.toDataURL('image/jpeg', 0.72));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

// نسبة عرض/ارتفاع صورة (0 إن تعذّر التحميل) — تُستعمل لتأطير الصور في صفحة الطباعة
export function loadRatio(src) {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im.naturalWidth && im.naturalHeight ? im.naturalWidth / im.naturalHeight : 0);
    im.onerror = () => resolve(0);
    im.src = src;
  });
}
