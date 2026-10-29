import LegacyApp from './legacy/LegacyApp.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import LoginScreen from './auth/LoginScreen.jsx';

// المرحلة 3: شاشة الدخول والجلسة أصبحتا مكوّنات React.
// بقية التطبيق (LegacyApp) ما زالت كما هي، وتتواصل مع الدخول عبر أحداث window وجسر صغير.
export default function App() {
  return (
    <AuthProvider>
      <LoginScreen />
      <LegacyApp />
    </AuthProvider>
  );
}
