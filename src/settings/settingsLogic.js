// منطق نافذة الإعدادات (المظهر): منقول من applyDarkMode / applyFontSize / applyColorTheme / loadAppSettings القديمة.

export const KEYS = { dark: 'app:darkMode', font: 'app:fontSize', primary: 'app:colorPrimary', light: 'app:colorLight' };

// [المعرّف، الحرف على الزر، النص تحت الحرف (وهو نفسه تسمية الحجم)، عنوان الزر]
export const FONT_SIZES = [
  ['small', 'ص', 'صغير', 'صغير'],
  ['medium', 'أ', 'متوسط', 'متوسط'],
  ['large', 'A', 'كبير', 'كبير'],
  ['xlarge', 'A+', 'كبير+', 'كبير جداً'],
];
export const FONT_PX = { small: '18px', medium: '25px', large: '30px', xlarge: '36px' };
export const FONT_LABELS = { small: 'صغير', medium: 'متوسط', large: 'كبير', xlarge: 'كبير+' };
export const DEFAULT_FONT = 'medium';

// [اللون الرئيسي، الفاتح، العنوان]
export const THEMES = [
  ['#1a3a5c', '#2563a8', 'أزرق كحلي (الافتراضي)'],
  ['#166534', '#16a34a', 'أخضر'],
  ['#7c3aed', '#8b5cf6', 'بنفسجي'],
  ['#9f1239', '#e11d48', 'أحمر داكن'],
  ['#0f766e', '#0d9488', 'فيروزي'],
  ['#92400e', '#d97706', 'بني ذهبي'],
];

export const fontPx = (size) => FONT_PX[size] || '25px';
export const fontLabel = (size) => FONT_LABELS[size] || 'متوسط';
export const headerBg = (primary, light) => `linear-gradient(135deg, ${primary}cc 0%, ${primary} 50%, ${light} 100%)`;

const safeGet = (storage, k) => { try { return storage.getItem(k); } catch (e) { return null; } };
const safeSet = (storage, k, v) => { try { storage.setItem(k, v); } catch (e) { /* التخزين ممتلئ أو ممنوع */ } };

// القيم المحفوظة؛ الحقول الفارغة تعني «لم يُغيَّر شيء بعد»
export function readAppearance(storage) {
  return {
    dark: safeGet(storage, KEYS.dark) === '1',
    font: safeGet(storage, KEYS.font) || '',
    primary: safeGet(storage, KEYS.primary) || '',
    light: safeGet(storage, KEYS.light) || '',
  };
}

export function applyDark(doc, storage, enabled) {
  doc.body.classList.toggle('dark-mode', enabled);
  safeSet(storage, KEYS.dark, enabled ? '1' : '0');
}

export function applyFont(doc, storage, size) {
  doc.body.style.fontSize = fontPx(size);
  safeSet(storage, KEYS.font, size);
}

function setTheme(doc, primary, light) {
  const s = doc.documentElement.style;
  s.setProperty('--primary', primary);
  s.setProperty('--primary-light', light);
  s.setProperty('--header-bg', headerBg(primary, light));
}

export function applyTheme(doc, storage, primary, light) {
  setTheme(doc, primary, light);
  safeSet(storage, KEYS.primary, primary);
  safeSet(storage, KEYS.light, light);
}

// عند بدء التطبيق (loadAppSettings): يطبّق ما هو محفوظ فقط
export function applyStoredAppearance(doc, storage) {
  const a = readAppearance(storage);
  if (a.dark) doc.body.classList.add('dark-mode');
  if (a.font) doc.body.style.fontSize = fontPx(a.font);
  if (a.primary && a.light) setTheme(doc, a.primary, a.light);
  return a;
}

// السمة المحددة في الواجهة: المحفوظة إن وُجدت وإلا الأولى (الافتراضية)
export const activeThemeIndex = (primary) => {
  const i = THEMES.findIndex((t) => t[0] === primary);
  return i < 0 ? 0 : i;
};

// حالة Firebase في الإعدادات (نصوص settingsFbStatus القديمة)
export function fbStatusView(status) {
  if (status === 'connected') return { kind: 'ok', text: '✅ Firebase متصل — البيانات تتزامن بين جميع الأجهزة', style: { background: '#f0fdf4', borderColor: '#86efac', color: '#166534' } };
  if (status === 'error') return { kind: 'err', text: '❌ خطأ في الاتصال — تحقق من إعداد Firebase', style: { background: '#fff1f2', borderColor: '#fca5a5', color: '#991b1b' } };
  return { kind: 'warn', text: '⚠️ Firebase غير مُعدّ — البيانات محلية فقط', style: { background: '#fffbeb', borderColor: '#fcd34d', color: '#92400e' } };
}
