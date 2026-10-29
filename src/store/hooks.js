import { useCallback, useSyncExternalStore } from 'react';
import { getState, subscribe, saveCollection } from './legacyStore.js';
import { getNavStore } from '../nav/navStore.js';

const EMPTY_LIST = Object.freeze([]);

// كل بيانات المستخدم دفعة واحدة (للصفحة الرئيسية مثلاً)
export function useAppState() {
  return useSyncExternalStore(subscribe, getState);
}

// مجموعة واحدة، مثل 'violenceArchive' أو 'taskLog'؛ تعيد [setItems] للكتابة
export function useCollection(key) {
  const items = useSyncExternalStore(subscribe, () => getState().collections[key] ?? EMPTY_LIST);
  const setItems = useCallback((next) => saveCollection(key, next), [key]);
  return [items, setItems];
}

// قائمة التلاميذ (STUDENT_DB) — نسخة للقراءة؛ التعديل عبر saveStudents من legacyStore
export function useStudents() {
  return useSyncExternalStore(subscribe, () => getState().students);
}

export function useStudentCount() {
  return useSyncExternalStore(subscribe, () => getState().students.length);
}

export function useCurrentUser() {
  return useSyncExternalStore(subscribe, () => getState().user);
}

// البوابة المفتوحة حالياً (أو null في الصفحة الرئيسية)
export function useCurrentPortal() {
  const nav = getNavStore();
  return useSyncExternalStore(nav.subscribe, () => nav.getState().current, () => null);
}

// هل دخل المستخدم (تُعرض الصفحة الرئيسية فقط بعد الدخول)
export function useEntered() {
  const nav = getNavStore();
  return useSyncExternalStore(nav.subscribe, () => nav.getState().entered, () => false);
}

// التسمية المخصّصة لبوابة من لوحة الأدمين، أو '' إن لم تُخصَّص
export function usePortalLabel(id) {
  return useSyncExternalStore(subscribe, () => (getState().siteGates[id] || '').trim(), () => '');
}

// إعدادات الأخبار من لوحة الأدمين (مرجع ثابت ما لم يتغير المحتوى)
export function useSiteNews() {
  return useSyncExternalStore(subscribe, () => getState().siteNews);
}

// الأسبوع المحدد للتقرير الأسبوعي: { from, to } بصيغة YYYY-MM-DD (فارغان قبل أول إرسال من الكود القديم)
export function useWeekRange() {
  return useSyncExternalStore(subscribe, () => getState().weekRange);
}

export function useProfile() {
  return useSyncExternalStore(subscribe, () => getState().profile);
}

export function useSyncCloud() {
  return useSyncExternalStore(subscribe, () => getState().syncCloud);
}
