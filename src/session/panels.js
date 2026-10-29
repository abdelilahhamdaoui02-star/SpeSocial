// نوافذ الإعدادات وإعداد Firebase وبثّ حالة Firebase — منقولة من openSettings/closeSettings/openFirebaseSetup/closeFirebaseSetup/
// fbUpdateStatus/openFirebaseSetupFromSettings في script-10.js (الخطوة 47). المحتوى نفسه يرسمه React؛ هنا فتح الحاوية وإبلاغ المكوّنات.
//   deps: { doc, initLogo() (settings/logoStore)، status() → حالة Firebase (services/cloud)، emit(name, detail?) }
export function createPanels(d) {
  const toggle = (id, open) => { const el = d.doc.getElementById(id); if (el) el.classList[open ? 'add' : 'remove']('open'); };

  // حالة Firebase تُبثّ للرأس والإعدادات وشاشة الدخول (legacy:sync-status)
  function fbUpdateStatus() {
    const status = d.status() || 'not_configured';
    d.emit('legacy:sync-status', { cloud: status === 'connected', status });
  }

  function openSettings() {
    d.emit('legacy:settings-open');
    toggle('settingsModal', true);
    try { d.initLogo(); } catch { /* لا شيء */ }
  }
  const closeSettings = () => toggle('settingsModal', false);

  function openFirebaseSetup() {
    toggle('firebaseSetupModal', true);
    d.emit('legacy:firebase-setup-open');
    fbUpdateStatus();
  }
  const closeFirebaseSetup = () => toggle('firebaseSetupModal', false);

  function openFirebaseSetupFromSettings() {
    closeSettings();
    openFirebaseSetup();
  }

  return { fbUpdateStatus, openSettings, closeSettings, openFirebaseSetup, closeFirebaseSetup, openFirebaseSetupFromSettings };
}
