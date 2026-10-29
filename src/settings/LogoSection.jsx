import { useEffect, useRef, useState } from 'react';
import { processLogoFile, logoView } from './logoLogic.js';
import { saveLogo, removeLogo } from './logoStore.js';

const browserEnv = () => ({
  FileReader,
  Image,
  alert: (m) => window.alert(m),
  createCanvas: (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; },
});

const btnBase = { border: 'none', borderRadius: 8, fontFamily: "'Cairo',sans-serif", fontWeight: 700, cursor: 'pointer', color: 'white' };

export default function LogoSection() {
  // logoStore.applyLogo يطبّق الشعار على التقارير ثم يُبلغنا بالنتيجة عبر الحدث
  const [logo, setLogo] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const onLogo = (e) => setLogo({ custom: !!(e.detail && e.detail.custom), src: (e.detail && e.detail.src) || '' });
    window.addEventListener('legacy:logo-changed', onLogo);
    return () => window.removeEventListener('legacy:logo-changed', onLogo);
  }, []);

  const onPick = async (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    const dataUrl = await processLogoFile(file, browserEnv());
    if (dataUrl) saveLogo(dataUrl);
  };
  const remove = () => removeLogo();

  const v = logoView(logo);
  return (
    <div className="settings-section">
      <div className="settings-section-title">🖼️ شعار المؤسسة في التقارير المطبوعة</div>
      <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: 10, padding: 14, marginBottom: 10 }}>
        <div style={{ fontSize: '0.82rem', color: '#0369a1', fontWeight: 600, marginBottom: 6 }}>📌 يظهر الشعار في رأس جميع التقارير المطبوعة بدلاً من رمز الجامعة الافتراضي</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div id="logoPreviewBox" style={{ width: 64, height: 64, border: '2px solid #93c5fd', borderRadius: 8, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0, overflow: 'hidden' }}>
            {v.src ? <img src={v.src} alt="" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 6 }} /> : '🎓'}
          </div>
          <div style={{ flex: 1 }}>
            <div id="logoStatusText" style={{ fontSize: '0.78rem', color: v.custom ? '#166534' : '#0c4a6e', fontWeight: v.custom ? 700 : undefined, marginBottom: 4 }}>{v.text}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>يدعم: JPG, PNG, SVG, WEBP — الحد الأقصى 8MB (تُصغَّر الصور الكبيرة تلقائياً)</div>
          </div>
        </div>
        <input ref={inputRef} type="file" id="logoUploadInput" accept="image/jpeg,image/png,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={onPick} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => inputRef.current && inputRef.current.click()} style={{ ...btnBase, flex: 1, padding: 9, background: 'linear-gradient(135deg,#0369a1,#0ea5e9)', fontSize: '0.82rem' }}>🖼️ رفع شعار المؤسسة</button>
          {v.canRemove ? <button id="removeLogoBtn" onClick={remove} style={{ ...btnBase, padding: '9px 14px', background: 'linear-gradient(135deg,#dc2626,#991b1b)', fontSize: '0.78rem' }}>🗑 حذف</button> : null}
        </div>
      </div>
    </div>
  );
}
