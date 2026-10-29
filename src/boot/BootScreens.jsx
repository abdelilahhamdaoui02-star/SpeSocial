import { useBootState, openFirebaseSetup, reloadPage } from './bootStore.js';
import './boot.css';

// شاشات الحالة عند الإقلاع (كانت تُبنى كنصوص HTML في script-11.js): تحميل، لا يوجد اتصال، إعداد Firebase، فشل الاتصال.
// الطبقات (z-index) كما كانت: التحميل 99999 فوق الانقطاع 99998 فوق شاشتي Firebase 99997.
export default function BootScreens() {
  const s = useBootState();
  return (
    <>
      {s.loading && (
        <div id="appLoadingScreen" className="boot-screen boot-loading">
          <div className="boot-emoji">🔥</div>
          <div id="appLoadingMsg" className="boot-loading-msg">{s.loadingMsg}</div>
          <div className="boot-spinner" />
        </div>
      )}

      {s.offline && (
        <div id="appOfflineScreen" className="boot-screen boot-offline">
          <div className="boot-emoji boot-emoji-xl">📡</div>
          <div className="boot-offline-title">لا يوجد اتصال بالإنترنت</div>
          <div className="boot-offline-text">
            هذا التطبيق يتطلب اتصالاً بالإنترنت للعمل.<br />
            تأكد من اتصالك ثم أعد المحاولة.
          </div>
          <button type="button" className="boot-btn-gold" onClick={reloadPage}>🔄 إعادة المحاولة</button>
        </div>
      )}

      {s.required && (
        <div id="appFirebaseRequiredScreen" className="boot-screen boot-fb">
          <div className="boot-card boot-card-lg">
            <div className="boot-emoji">🔥</div>
            <div className="boot-card-title">إعداد Firebase مطلوب</div>
            <div className="boot-card-text boot-card-text-lg">
              لاستخدام التطبيق على جميع أجهزتك، يجب إعداد Firebase مرة واحدة فقط.
            </div>
            <div className="boot-steps">
              <strong>📋 خطوات سريعة:</strong>
              <ol>
                <li>اذهب إلى <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">console.firebase.google.com</a></li>
                <li>أنشئ مشروعاً جديداً ← أضف تطبيق ويب</li>
                <li>انسخ كائن firebaseConfig</li>
                <li>انقر الزر أدناه والصق الكود</li>
                <li>فعّل Firestore Database بوضع test mode</li>
              </ol>
            </div>
            <button type="button" className="boot-btn-orange boot-btn-block" onClick={openFirebaseSetup}>⚙️ إعداد Firebase الآن</button>
          </div>
        </div>
      )}

      {s.error && (
        <div id="appFirebaseErrorScreen" className="boot-screen boot-fb">
          <div className="boot-card boot-card-md">
            <div className="boot-emoji">❌</div>
            <div className="boot-card-title boot-card-title-err">فشل الاتصال بـ Firebase</div>
            <div className="boot-card-text">
              تأكد من صحة إعدادات Firebase وأن Firestore Database مُفعَّل بوضع <strong>test mode</strong>.
            </div>
            <div className="boot-col">
              <button type="button" className="boot-btn-orange boot-btn-sm" onClick={openFirebaseSetup}>🔧 مراجعة إعدادات Firebase</button>
              <button type="button" className="boot-btn-outline" onClick={reloadPage}>🔄 إعادة المحاولة</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
