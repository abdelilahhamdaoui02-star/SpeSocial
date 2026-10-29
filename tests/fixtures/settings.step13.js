// نسخة مجمَّدة من دوال المظهر في script-10.js قبل المرحلة 14 (للمقارنة فقط)
function applyDarkMode(enabled) {
  document.body.classList.toggle('dark-mode', enabled);
  try { localStorage.setItem('app:darkMode', enabled ? '1' : '0'); } catch(e) {}
}

function applyFontSize(size, btn) {
  const sizes = { small: '18px', medium: '25px', large: '30px', xlarge: '36px' };
  const labels = { small: 'صغير', medium: 'متوسط', large: 'كبير', xlarge: 'كبير+' };
  document.body.style.fontSize = sizes[size] || '25px';
  document.querySelectorAll('.fs-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const lbl = document.getElementById('fontSizeLabel');
  if (lbl) lbl.textContent = labels[size] || 'متوسط';
  try { localStorage.setItem('app:fontSize', size); } catch(e) {}
}

function applyColorTheme(primary, light, swatch) {
  document.documentElement.style.setProperty('--primary', primary);
  document.documentElement.style.setProperty('--primary-light', light);
  document.documentElement.style.setProperty('--header-bg', `linear-gradient(135deg, ${primary}cc 0%, ${primary} 50%, ${light} 100%)`);
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  if (swatch) swatch.classList.add('active');
  try { localStorage.setItem('app:colorPrimary', primary); localStorage.setItem('app:colorLight', light); } catch(e) {}
}

function loadAppSettings() {
  try {
    const dark = localStorage.getItem('app:darkMode');
    if (dark === '1') { document.body.classList.add('dark-mode'); }
    const fs = localStorage.getItem('app:fontSize');
    if (fs) {
      const sizes = { small: '18px', medium: '25px', large: '30px', xlarge: '36px' };
      document.body.style.fontSize = sizes[fs] || '25px';
    }
    const cp = localStorage.getItem('app:colorPrimary');
    const cl = localStorage.getItem('app:colorLight');
    if (cp && cl) {
      document.documentElement.style.setProperty('--primary', cp);
      document.documentElement.style.setProperty('--primary-light', cl);
      document.documentElement.style.setProperty('--header-bg', `linear-gradient(135deg, ${cp}cc 0%, ${cp} 50%, ${cl} 100%)`);
    }
  } catch(e) {}
}

