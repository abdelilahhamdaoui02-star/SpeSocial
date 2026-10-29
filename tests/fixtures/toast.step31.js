// نسخة مجمَّدة من كود «showToast» القديم (script-10.js قبل المرحلة 32) — مرجع اختبار المطابقة فقط

function showToast(message, type) {
  const toast = document.createElement('div');
  toast.textContent = message;
  const colors = {
    warning: { bg: '#fff7ed', border: '#f97316', color: '#9a3412' },
    error:   { bg: '#fef2f2', border: '#dc2626', color: '#7f1d1d' },
    success: { bg: '#f0fdf4', border: '#16a34a', color: '#14532d' },
  };
  const c = colors[type] || colors.success;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
    background: c.bg, border: '2px solid ' + c.border, color: c.color,
    padding: '12px 22px', borderRadius: '12px', fontFamily: "'Cairo', sans-serif",
    fontSize: '0.88rem', fontWeight: '700', zIndex: '99999',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)', direction: 'rtl',
    transition: 'opacity 0.4s', opacity: '1', maxWidth: '90vw', textAlign: 'center'
  });
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 4000);
}
