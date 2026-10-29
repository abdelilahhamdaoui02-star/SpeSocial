import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getCloudStatus } from '../services/cloud.js';
import { getSession } from '../session/installSession.js';
import LogoSection from './LogoSection.jsx';
import StudentsSection from './StudentsSection.jsx';
import {
  FONT_SIZES, THEMES, fontLabel, readAppearance, applyDark, applyFont, applyTheme,
  activeThemeIndex, fbStatusView, DEFAULT_FONT,
} from './settingsLogic.js';


function readState() {
  const a = readAppearance(window.localStorage);
  return {
    dark: document.body.classList.contains('dark-mode'),
    font: a.font || DEFAULT_FONT,
    themeIndex: activeThemeIndex(a.primary),
    fb: getCloudStatus() || 'not_configured',
  };
}

function SettingsUI() {
  const [st, setSt] = useState(readState);

  // openSettings القديمة تُبلغنا بالفتح لنقرأ الحالة الحالية (المظهر وحالة Firebase)
  useEffect(() => {
    const onOpen = () => setSt(readState());
    const onSync = (e) => {
      const s = e.detail && e.detail.status;
      if (s) setSt((x) => ({ ...x, fb: s }));
    };
    window.addEventListener('legacy:settings-open', onOpen);
    window.addEventListener('legacy:sync-status', onSync);
    return () => {
      window.removeEventListener('legacy:settings-open', onOpen);
      window.removeEventListener('legacy:sync-status', onSync);
    };
  }, []);

  const setDark = (on) => { applyDark(document, window.localStorage, on); setSt((x) => ({ ...x, dark: on })); };
  const setFont = (size) => { applyFont(document, window.localStorage, size); setSt((x) => ({ ...x, font: size })); };
  const setTheme = (i) => { applyTheme(document, window.localStorage, THEMES[i][0], THEMES[i][1]); setSt((x) => ({ ...x, themeIndex: i })); };
  const fb = fbStatusView(st.fb);

  return (
    <div className="settings-box">
      <div className="settings-header">
        <h3>⚙️ الإعدادات والتخصيص</h3>
        <button className="settings-close" onClick={() => getSession().panels.closeSettings()}>✕</button>
      </div>
      <div className="settings-body">
        <div className="settings-section">
          <div className="settings-section-title">🌙 المظهر</div>
          <div className="settings-toggle-row">
            <span className="settings-toggle-label">🌙 الوضع الليلي (Dark Mode)</span>
            <label className="toggle-switch">
              <input type="checkbox" id="darkModeToggle" checked={st.dark} onChange={(e) => setDark(e.target.checked)} />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">🔤 حجم الخط</div>
          <div className="font-size-row">
            <div className="font-size-label">
              <span>اختر الحجم المناسب للقراءة</span>
              <span id="fontSizeLabel" style={{ color: 'var(--primary-light)', fontWeight: 800 }}>{fontLabel(st.font)}</span>
            </div>
            <div className="font-size-btns">
              {FONT_SIZES.map(([id, glyph, label, title]) => (
                <button key={id} className={'fs-btn' + (st.font === id ? ' active' : '')} onClick={() => setFont(id)} title={title}>
                  {glyph}<br /><small>{label}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">🎨 لون السمة</div>
          <div className="color-theme-row">
            <div className="color-theme-label">اختر اللون الرئيسي للمنصة</div>
            <div className="color-swatches">
              {THEMES.map(([primary, , title], i) => (
                <div key={primary} className={'color-swatch' + (st.themeIndex === i ? ' active' : '')} style={{ background: primary }} onClick={() => setTheme(i)} title={title} />
              ))}
            </div>
          </div>
        </div>

        <LogoSection />

        <div className="settings-section">
          <div className="settings-section-title">🛡️ أمان البيانات</div>
          <div style={{ background: '#ecfdf5', border: '2px solid #86efac', borderRadius: 10, padding: 14, fontSize: '0.82rem', color: '#166534', lineHeight: 1.8 }}>
            ✅ <strong>بياناتك محمية ومحفوظة:</strong><br />
            — يتم تشفير كلمة المرور بـ SHA-256<br />
            — لا يتم حذف أي حساب عند تحديث المنصة<br />
            — البيانات مرتبطة باسم المستخدم الخاص بك<br />
            — يُنصح بتفعيل رقم الهاتف لحماية إضافية
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-section-title">🔥 التخزين السحابي (Firebase)</div>
          <div id="settingsFbStatus" style={{ padding: '10px 14px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, marginBottom: 10, border: '2px solid', ...fb.style }}>{fb.text}</div>
          <button onClick={() => getSession().panels.openFirebaseSetupFromSettings()} style={{ width: '100%', padding: 11, background: 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'Cairo,sans-serif', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}>
            🔥 فتح إعدادات Firebase
          </button>
        </div>

        <StudentsSection />
      </div>
    </div>
  );
}

// الحاوية #settingsModal تبقى من HTML القديم (فئة open تضيفها openSettings القديمة)
export default function SettingsModal({ mount }) {
  return mount ? createPortal(<SettingsUI />, mount) : null;
}
