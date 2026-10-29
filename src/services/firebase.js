// خدمة Firebase — بديل script-01.js القديم (كان يُحمَّل من روابط gstatic).
// المنطق منقول حرفياً: نفس الدخول، ونفس التخزين (localStorage + Firestore)، ونفس أسماء المجموعات.
// كل ما كان على window (التخزين والدخول والحالة والإعدادات) صار في services/cloud.js.
import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs,
} from 'firebase/firestore';
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider,
} from 'firebase/auth';
import { FIREBASE_CONFIG, isFirebaseConfigured } from './firebaseConfig.js';
import { registerCloud, setCloudReady, setCloudStatus, setCloudConfigured, STATUS } from './cloud.js';

const EMAIL_DOMAIN = '@vigilance.app';

let db = null;
let auth = null;

const notReady = () => {
  const err = new Error('Firebase غير جاهز بعد');
  err.code = 'app/firebase-not-ready';
  return err;
};

function sanitizeKey(key) {
  return key.replace(/\//g, '__SLASH__').replace(/:/g, '__COLON__').replace(/\s/g, '__SPACE__');
}

const lsGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const lsSet = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
const lsRemove = (key) => { try { localStorage.removeItem(key); } catch {} };

async function approvedUsername(uid) {
  const snap = await getDoc(doc(db, 'allowed_users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (d.active === false || !d.username) return null;
  return d.username;
}

// ── الدخول: نفس واجهة window._fbAuth القديمة ──
export const fbAuth = {
  login: async (username, password) => {
    if (!auth) throw notReady();
    const cred = await signInWithEmailAndPassword(auth, username + EMAIL_DOMAIN, password);
    let name = null;
    try { name = await approvedUsername(cred.user.uid); } catch { name = null; }
    if (!name) {
      try { await signOut(auth); } catch {}
      const err = new Error('not-approved');
      err.code = 'app/not-approved';
      throw err;
    }
    return name;
  },

  restore: () => new Promise((resolve) => {
    if (!auth) return resolve(null);
    const un = onAuthStateChanged(auth, async (user) => {
      un();
      if (!user) return resolve(null);
      try {
        const n = await approvedUsername(user.uid);
        if (!n) { try { await signOut(auth); } catch {} return resolve(null); }
        resolve(n);
      } catch { resolve(null); }
    });
  }),

  logout: () => {
    if (!auth) throw notReady();
    return signOut(auth);
  },

  changePassword: async (oldPwd, newPwd) => {
    if (!auth) throw notReady();
    const user = auth.currentUser;
    if (!user) throw new Error('الجلسة منتهية، أعد تسجيل الدخول.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, oldPwd));
    await updatePassword(user, newPwd);
  },

  isSignedIn: () => !!(auth && auth.currentUser),
};

// ── التخزين: نفس واجهة window.storage القديمة (localStorage فوري + Firestore) ──
export const storage = {
  get: async (key, shared = false) => {
    try {
      const colName = shared ? 'shared' : 'user_data';
      const snap = await getDoc(doc(db, colName, sanitizeKey(key)));
      if (snap.exists()) {
        const value = snap.data().value;
        lsSet(key, value);
        return { key, value, shared };
      }
      const lv = lsGet(key);
      if (lv !== null) return { key, value: lv, shared };
      return null;
    } catch (err) {
      console.warn('Firebase GET error:', err);
      const lv = lsGet(key);
      if (lv !== null) return { key, value: lv, shared };
      return null;
    }
  },

  set: async (key, value, shared = false) => {
    // حفظ محلي فوري — يكتمل قبل Firebase
    lsSet(key, value);
    const colName = shared ? 'shared' : 'user_data';
    const ref = doc(db, colName, sanitizeKey(key));
    // merge:true لتقليل حجم الكتابة وتفادي استبدال الوثيقة كاملة
    await setDoc(ref, { value, updatedAt: new Date().toISOString(), key }, { merge: true });
    return { key, value, shared };
  },

  delete: async (key, shared = false) => {
    lsRemove(key);
    try {
      const colName = shared ? 'shared' : 'user_data';
      await deleteDoc(doc(db, colName, sanitizeKey(key)));
      return { key, deleted: true, shared };
    } catch (err) {
      console.warn('Firebase DELETE error:', err);
      return { key, deleted: true, shared };
    }
  },

  list: async (prefix = '', shared = false) => {
    try {
      const colName = shared ? 'shared' : 'user_data';
      const colRef = collection(db, colName);
      const q = prefix
        ? query(colRef, where('key', '>=', prefix), where('key', '<', prefix + '\uf8ff'))
        : query(colRef);
      const snap = await getDocs(q);
      const keys = snap.docs.map((d) => d.data().key || d.id);
      return { keys, prefix, shared };
    } catch (err) {
      console.warn('Firebase LIST error:', err);
      return { keys: [], prefix, shared };
    }
  },

  testConnection: async () => {
    try {
      if (!auth || !auth.currentUser) return true; // لا يمكن الاختبار قبل الدخول
      const snap = await getDoc(doc(db, 'allowed_users', auth.currentUser.uid));
      return snap.exists();
    } catch { return false; }
  },
};

export const siteConfig = {
  get: async () => {
    try {
      const sn = await getDoc(doc(db, 'site_config', 'main'));
      return sn.exists() ? sn.data() : null;
    } catch { return null; }
  },
};

// ── التهيئة: تُرجع true عند النجاح (نفس سلوك firebaseInit القديم) ──
async function firebaseInit() {
  if (!isFirebaseConfigured()) {
    console.warn('⚠️ Firebase غير مُهيأ — يعمل في الوضع المحلي فقط');
    setCloudStatus(STATUS.notConfigured);
    return false;
  }
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);

    // كل الخدمات تُسجَّل في services/cloud.js (لا شيء على window)
    registerCloud({ storage, auth: fbAuth, siteConfig });
    setCloudStatus(STATUS.connected);
    console.log('✅ Firebase Firestore متصل — وضع التخزين السحابي نشط');
    return true;
  } catch (err) {
    setCloudStatus(STATUS.error);
    console.error('❌ خطأ في تهيئة Firebase:', err);
    return false;
  }
}

// تُستدعى مرة واحدة من main.jsx قبل رسم React وقبل تحميل السكربتات القديمة
let readyPromise = null;
export function installFirebase() {
  if (readyPromise) return readyPromise;
  setCloudConfigured(isFirebaseConfigured);
  readyPromise = firebaseInit();
  setCloudReady(readyPromise);
  return readyPromise;
}

export const firebaseReady = () => installFirebase();
