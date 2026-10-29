// أجزاء واجهة صغيرة مشتركة
export function Msg({ m }) {
  return <div className={'msg ' + (m.cls || '')}>{m.text}</div>;
}

// تنبيه المسودة: التعديلات محفوظة محليًا لكنها لم تصل للخادم بعد
export function DraftNote({ dirty, onDiscard }) {
  if (!dirty) return null;
  return (
    <div className="draft-note">
      <span>✏️ لديك تعديلات لم تُحفظ بعد — محفوظة في هذا المتصفح ولن تضيع إن خرجت، لكنها لا تظهر للمستخدمين حتى تضغط «حفظ».</span>
      <button type="button" className="btn sm gray" onClick={onDiscard}>تراجع عنها</button>
    </div>
  );
}
