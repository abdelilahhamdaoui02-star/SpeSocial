// منطق نقي لشريط المستخدم وتاريخ اللوحة (منقول من authEnterApp وinitDashDate القديمين).
import { DAY_NAMES, MONTHS } from '../home/homeStats.js';

// الاسم المعروض: الاسم الكامل من الملف الشخصي وإلا اسم الدخول
export const displayName = (profile, user) => (profile && profile.fullName) || user || '';

// الحرف في الأفاتار؛ «؟» حين لا يوجد مستخدم
export function initialOf(profile, user) {
  const n = displayName(profile, user);
  return n ? n.charAt(0).toUpperCase() : '؟';
}

export function syncLabel(cloud) {
  return cloud ? '☁️ Firebase' : '💾 محلي';
}

// { day: 'الجمعة', full: '23 أكتوبر 2026' }
export function dateParts(now = new Date()) {
  return { day: DAY_NAMES[now.getDay()], full: `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}` };
}
