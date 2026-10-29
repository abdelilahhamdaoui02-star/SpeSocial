// حالة فتح/إغلاق نافذة اختيار الأسبوع. الكود القديم وHTML القديم (بلاطة سجل المهام، بطاقة التقرير)
// ما زالا يستدعيان openWeekPickerModal وcloseWeekPickerModal بأسمائها العامة، فنسجّلهما في installWeekPicker.
import { useSyncExternalStore } from 'react';

let open = false;
const listeners = new Set();
const emit = (v) => { open = v; listeners.forEach((fn) => fn()); };

export const isWeekPickerOpen = () => open;
export const subscribeWeekPicker = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const useWeekPickerOpen = () => useSyncExternalStore(subscribeWeekPicker, isWeekPickerOpen);

export const openWeekPicker = () => emit(true);
export const closeWeekPicker = () => emit(false);

export function installWeekPicker() {
  window.openWeekPickerModal = openWeekPicker;
  window.closeWeekPickerModal = closeWeekPicker;
}
