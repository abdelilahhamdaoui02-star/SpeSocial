import { createToastStore } from './toastLogic.js';

// مخزن واحد للتطبيق كله؛ تقرؤه ToastHost، وتكتب فيه أي بوابة بـshowToast
export const toastStore = createToastStore();
export const showToast = (message, type) => toastStore.show(message, type);
