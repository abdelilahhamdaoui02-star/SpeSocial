// سجل خدمات Firebase (الخطوتان 50 و51) — بديل كل ما كان على window: storage و_fbAuth و_firebaseReady و_siteConfig و_firebaseStatus
// و_isFirebaseConfigured و_getFirebaseConfig. firebase.js يسجّل هنا عند التهيئة؛ الجلسة والإقلاع والمؤسسة والإعدادات تقرأ من هنا.
// بلا استيراد لـ firebase ولا window: يُحمَّل في الاختبارات بلا الحزمة.
export const STATUS = Object.freeze({ notConfigured: 'not_configured', connected: 'connected', error: 'error' });

const handle = { storage: null, auth: null, siteConfig: null, ready: null, status: STATUS.notConfigured, configured: () => false };

export const registerCloud = ({ storage, auth, siteConfig }) => {
  handle.storage = storage || null; handle.auth = auth || null; handle.siteConfig = siteConfig || null;
};
export const setCloudReady = (promise) => { handle.ready = promise || null; };
export const setCloudStatus = (s) => { handle.status = s || STATUS.notConfigured; };
export const setCloudConfigured = (fn) => { handle.configured = typeof fn === 'function' ? fn : () => false; };
export const resetCloud = () => {
  handle.storage = null; handle.auth = null; handle.siteConfig = null; handle.ready = null;
  handle.status = STATUS.notConfigured; handle.configured = () => false;
};

export const getCloudStorage = () => handle.storage;     // null قبل نجاح التهيئة أو بلا إعداد
export const getFbAuth = () => handle.auth;
export const getSiteConfigApi = () => handle.siteConfig; // { get() } أو null
export const getCloudReady = () => handle.ready;         // Promise<boolean> | null
export const getCloudStatus = () => handle.status;
export const isFirebaseConfigured = () => !!handle.configured();
