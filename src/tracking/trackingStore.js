// حالة نوافذ «الإشعارات» و«جدول التتبع الشهري». view: null | 'notifications' | 'table'.
// لا شيء منها على window بعد الآن (لم يبقَ للكود القديم وHTML القديم واجهة تستدعيها)؛ تستورد المكوّنات الدوال مباشرة.
import { useSyncExternalStore } from 'react';

let view = null;
const listeners = new Set();
const emit = (v) => { view = v; listeners.forEach((fn) => fn()); };

export const getTrackingView = () => view;
export const subscribeTracking = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const useTrackingView = () => useSyncExternalStore(subscribeTracking, getTrackingView);

export const openNotifications = () => emit('notifications');
export const openTrackingTable = () => emit('table');
export const closeTracking = () => emit(null);
