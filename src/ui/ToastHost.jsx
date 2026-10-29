import { useSyncExternalStore } from 'react';
import { toastStore } from './toast.js';
import { TOAST_FADE_MS, toastColors } from './toastLogic.js';

// يرسم الإشعارات الظاهرة أسفل الشاشة؛ عند تعدد الإشعارات تتراصف بدل أن تتراكب فوق بعضها
export default function ToastHost() {
  const items = useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot);
  if (!items.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', pointerEvents: 'none' }}>
      {items.map((t) => {
        const c = toastColors(t.type);
        return (
          <div
            key={t.id}
            role="status"
            style={{
              background: c.bg, border: '2px solid ' + c.border, color: c.color, padding: '12px 22px', borderRadius: 12,
              fontFamily: "'Cairo', sans-serif", fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              direction: 'rtl', transition: `opacity ${TOAST_FADE_MS}ms`, opacity: t.leaving ? 0 : 1, maxWidth: '90vw', textAlign: 'center',
            }}
          >
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
