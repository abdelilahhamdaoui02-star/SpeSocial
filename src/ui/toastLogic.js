// الإشعارات العابرة (showToast) — منطق بلا DOM، منقول من showToast في script-10.js.
export const TOAST_VISIBLE_MS = 4000; // مدة الظهور قبل بدء التلاشي
export const TOAST_FADE_MS = 400;     // مدة التلاشي قبل الإزالة

export const TOAST_COLORS = Object.freeze({
  warning: { bg: '#fff7ed', border: '#f97316', color: '#9a3412' },
  error:   { bg: '#fef2f2', border: '#dc2626', color: '#7f1d1d' },
  success: { bg: '#f0fdf4', border: '#16a34a', color: '#14532d' },
});

// النوع المجهول أو الفارغ = نجاح (كما كان)
export const toastColors = (type) => TOAST_COLORS[type] || TOAST_COLORS.success;

// مخزن صغير للإشعارات الظاهرة. schedule قابلة للاستبدال في الاختبار.
export function createToastStore({ schedule = (fn, ms) => setTimeout(fn, ms) } = {}) {
  let items = [];
  let seq = 0;
  const listeners = new Set();
  const set = (next) => { items = next; listeners.forEach((fn) => fn()); };

  function show(message, type) {
    const id = ++seq;
    set([...items, { id, message: String(message == null ? '' : message), type: type || 'success', leaving: false }]);
    schedule(() => {
      set(items.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      schedule(() => set(items.filter((t) => t.id !== id)), TOAST_FADE_MS);
    }, TOAST_VISIBLE_MS);
    return id;
  }

  return {
    show,
    getSnapshot: () => items,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  };
}
