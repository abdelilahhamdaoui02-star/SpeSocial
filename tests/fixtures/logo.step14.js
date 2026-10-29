// نسخة مجمَّدة من handleLogoUpload القديمة (قبل المرحلة 15) — للمقارنة فقط
function handleLogoUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  if (!/^image\/(png|jpe?g|svg\+xml|webp)$/.test(file.type)) {
    alert('⚠️ صيغة غير مدعومة. استعمل JPG أو PNG أو SVG أو WEBP.');
    input.value = ''; return;
  }
  if (file.size > 8 * 1024 * 1024) {
    alert('⚠️ حجم الصورة كبير جداً. الحد الأقصى 8MB.');
    input.value = ''; return;
  }
  const reader = new FileReader();
  reader.onerror = function() { alert('⚠️ تعذّرت قراءة الملف.'); };
  reader.onload = function(ev) {
    const dataUrl = ev.target.result;
    if (file.type === 'image/svg+xml') { _saveLogo(dataUrl); return; }
    // تصغير الصورة تلقائياً (حتى 1400px عرضاً) لتخفيف حجم التخزين والطباعة
    const img = new Image();
    img.onerror = function() { alert('⚠️ تعذّر فتح الصورة.'); };
    img.onload = function() {
      const MAXW = 1400;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > MAXW) { h = Math.round(h * MAXW / w); w = MAXW; }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      const keepAlpha = (file.type === 'image/png' || file.type === 'image/webp');
      if (!keepAlpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
      ctx.drawImage(img, 0, 0, w, h);
      _saveLogo(keepAlpha ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.92));
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
  input.value = '';
}


function _saveLogo(d){ __saved.push(d); }
