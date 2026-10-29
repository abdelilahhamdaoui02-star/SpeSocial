// مخزن الإقلاع الوحيد للتطبيق: تقرؤه BootScreens، ويشغّله LegacyApp بعد تحميل السكربتات القديمة
// (كان script-11.js يشغّل نفس التسلسل عند DOMContentLoaded).
import { useSyncExternalStore } from 'react';
import { createBoot } from './bootLogic.js';
import { setCloud } from '../session/sessionState.js';
import { getSession } from '../session/installSession.js';
import { getCloudReady, getCloudStorage, isFirebaseConfigured } from '../services/cloud.js';
import { getSessionStore } from '../session/sessionStore.js';

function browserDeps() {
  return {
    isOnline: () => navigator.onLine,
    get firebaseReady() { return getCloudReady(); },
    hasStorage: () => !!getCloudStorage(),
    // وضع التخزين السحابي صار في src/session/sessionState.js (الخطوة 47)
    setCloud: (v) => setCloud(v),
    isConfigured: () => isFirebaseConfigured(),
    // الدخول التلقائي وبثّ حالة Firebase صارا في src/session (الخطوة 47)
    tryAutoLogin: () => getSession().flow.tryAutoLogin(),
    session: getSessionStore(),
    updateStatus: () => getSession().panels.fbUpdateStatus(),
    reload: () => window.location.reload(),
  };
}

let boot = null;
const get = () => boot || (boot = createBoot(browserDeps()));

export const useBootState = () => {
  const b = get();
  return useSyncExternalStore(b.subscribe, b.getSnapshot);
};

let started = false;
// يشغّل الإقلاع مرة واحدة ويراقب الاتصال (قطع → شاشة «لا اتصال»، عودة → إعادة تحميل)
export function startBoot() {
  if (started) return Promise.resolve();
  started = true;
  const b = get();
  window.addEventListener('offline', () => b.showOffline());
  window.addEventListener('online', () => b.onOnline());
  return b.start();
}

export const openFirebaseSetup = () => getSession().panels.openFirebaseSetup();
export const reloadPage = () => window.location.reload();
