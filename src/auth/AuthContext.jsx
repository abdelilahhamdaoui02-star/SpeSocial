import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { getSession } from '../session/installSession.js';
import { getSessionStore } from '../session/sessionStore.js';

// حالة الجلسة يملكها مخزن الجلسة (src/session/sessionStore.js) — هنا نقرؤها فقط ونوفّرها للمكوّنات:
//  booting   → التطبيق القديم لم يُنهِ الفحص التلقائي بعد (شاشة الدخول ظاهرة خلف شاشة التحميل كما كان)
//  signedOut → لا توجد جلسة، نعرض شاشة الدخول
//  signedIn  → مستخدم معتمد، نخفي شاشة الدخول
//  hidden    → شاشة "لا يوجد اتصال" تغطي كل شيء
const AuthContext = createContext(null);

export function AuthProvider({ children, store = getSessionStore() }) {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  const value = useMemo(() => ({
    ...state,
    // الخروج (تأكيد + تنظيف البيانات) في src/session؛ عند نجاحه يتغيّر مخزن الجلسة فتتبدّل هذه الحالة
    logout: () => getSession().flow.logout(),
  }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth يجب أن يُستعمل داخل <AuthProvider>');
  return ctx;
}
