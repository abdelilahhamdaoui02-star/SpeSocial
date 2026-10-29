// مجمَّد من script-10.js قبل المرحلة 34 (تطبيق الشعار وحفظه)
window._reportLogoHTML = null;

// شعار المؤسسة لأي نافذة/وثيقة طباعة — يُؤخذ تلقائياً من الشعار الفعّال (شعار المؤسسة المرفوع، وإلا الافتراضي)
function printLogoImg(maxH) {
  var src = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? MINISTRY_LOGO_B64 : '';
  if (!src) return '';
  return '<div style="text-align:center;line-height:0;margin:0 0 8px;"><img src="' + src + '" alt="شعار المؤسسة" style="max-width:100%;width:100%;max-height:' + (maxH || 110) + 'px;object-fit:contain;display:block;margin:0 auto;"></div>';
}

function _refreshLogoImages() {
  document.querySelectorAll('#ministry-logo-img').forEach(function(img){ img.src = MINISTRY_LOGO_B64; });
}

// رفع الشعار (التحقق والتصغير) صار في React: src/settings/LogoSection.jsx + logoLogic.js، ويستدعي _saveLogo أدناه

function _saveLogo(dataUrl) {
  let stored = true;
  try { localStorage.setItem('app:institutionLogo', dataUrl); } catch (err) { stored = false; }
  applyLogo(dataUrl, true);
  if (!stored) alert('⚠️ تم تطبيق الشعار لهذه الجلسة فقط (تعذّر حفظه في المتصفح لأن حجمه كبير).');
  else if (typeof showToast === 'function') { try { showToast('✅ تم حفظ شعار المؤسسة'); } catch (e) {} }
}

function applyLogo(dataUrl, isCustom) {
  // الشعار المختار يصبح هو الشعار المستعمل في رأس جميع التقارير والطباعة
  MINISTRY_LOGO_B64 = dataUrl;
  window._reportLogoHTML = `<img src="${dataUrl}" alt="شعار المؤسسة" style="width:100%;height:auto;display:block;margin:0;">`;
  _refreshLogoImages();
  // معاينة الشعار وحالته وزر الحذف في الإعدادات يرسمها React (تصلها من هذا الحدث)
  window.dispatchEvent(new CustomEvent('legacy:logo-changed', { detail: { custom: !!isCustom, src: dataUrl } }));
}

function removeLogo() {
  try { localStorage.removeItem('app:institutionLogo'); } catch (e) {}
  applyLogo(DEFAULT_MINISTRY_LOGO_B64, false);
}

function initLogoFromStorage() {
  try {
    const saved = localStorage.getItem('app:institutionLogo');
    if (saved) { applyLogo(saved, true); return; }
  } catch (e) {}
  applyLogo(DEFAULT_MINISTRY_LOGO_B64, false);
}
