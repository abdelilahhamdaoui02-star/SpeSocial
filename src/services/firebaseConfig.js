// إعداد Firebase — منقول من script-01.js القديم بنفس القيم.
// ملاحظة: مفتاح apiKey الخاص بتطبيقات الويب ليس سرّاً، والحماية الحقيقية تأتي من
// قواعد Firestore ومن تقييد المفتاح بـ HTTP referrers في Google Cloud.
export const DEFAULT_CONFIG = {
  apiKey:            "AIzaSyDAoVZOaTaGIY6jFm5U4FPvPscLSksW2Fk",
  authDomain:        "spesocial-f0d40.firebaseapp.com",
  projectId:         "spesocial-f0d40",
  storageBucket:     "spesocial-f0d40.firebasestorage.app",
  messagingSenderId: "749090667654",
  appId:             "1:749090667654:web:b454a62bba1c24ecabe507"
};

// الإعداد المحفوظ من نافذة «إعداد Firebase» (يبقى يعمل كما كان)
export function loadConfig() {
  try {
    const saved = localStorage.getItem('app:firebase:config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId && !parsed.apiKey.startsWith('REPLACE')) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export const FIREBASE_CONFIG = loadConfig();

export const isFirebaseConfigured = () =>
  !!(
    FIREBASE_CONFIG.apiKey &&
    !FIREBASE_CONFIG.apiKey.startsWith('REPLACE') &&
    FIREBASE_CONFIG.projectId &&
    !FIREBASE_CONFIG.projectId.startsWith('REPLACE')
  );
