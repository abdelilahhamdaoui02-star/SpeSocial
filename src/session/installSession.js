// يركّب طبقة الجلسة والتخزين (الخطوة 47): كل ما كان في script-10.js وscript-15.js وscript-16.js من تخزين ودخول وخروج وأرشيفات.
// يُستدعى مرة واحدة من LegacyApp قبل رسم الواجهة؛ الأسماء العامة على window تبقى لبوابات React وأزرار HTML (وجسر الجلسة sessionBridge للمخزن).
import * as state from './sessionState.js';
import { appData, COLLECTION_KEYS, resetAppData } from './sessionState.js';
import { createStorageLayer, createSessionMemo, browserLocal } from './storageLayer.js';
import { createUserData } from './userData.js';
import { createSessionFlow } from './sessionFlow.js';
import { createPanels } from './panels.js';
import { createArchives } from './archives.js';
import { createWeeklyBridge } from './weeklyBridge.js';
import { StudentDb } from '../students/studentDb.js';
import { WeeklyReport } from '../weekly/weeklyReport.js';
import { WeeklyPrint } from '../weekly/weeklyPrint.js';
import { pgExportXlsx } from '../gates/pgExportXlsx.js';
import { dispatchOTP } from '../auth/otpDispatch.js';
import { getSessionStore } from './sessionStore.js';
import { setBridge } from './sessionBridge.js';
import { getCloudStorage, getFbAuth, getCloudReady, getCloudStatus } from '../services/cloud.js';
import { getLogo } from '../settings/logoStore.js';
import { initLogoFromStorage } from '../settings/logoStore.js';
import { showToast } from '../ui/toast.js';
import { getInstitution } from '../institution/institutionStore.js';
import { closeProfile } from '../profile/profileWindow.js';

let api = null;

function build() {
  const local = browserLocal();
  const emit = (name, detail) => window.dispatchEvent(detail === undefined ? new Event(name) : new CustomEvent(name, { detail }));
  const toast = (msg, type) => showToast(msg, type);
  // دوال المؤسسة تُستدعى باستيراد مباشر (كانت على window)؛ الدالة تُقرأ عند الاستدعاء لا عند البناء
  const institution = {
    loadSiteConfig: () => getInstitution().loadSiteConfig(),
    updateDirectorateUI: () => getInstitution().updateDirectorateUI(),
    updateAllLevelSelects: () => getInstitution().updateAllLevelSelects(),
    applyInstitutionEverywhere: () => getInstitution().applyInstitutionEverywhere(),
  };
  const schedule = (fn, ms) => setTimeout(fn, ms);

  const storage = createStorageLayer({
    isCloud: state.isCloud,
    cloud: () => getCloudStorage(),
    local,
    toast,
    warn: (...a) => console.warn(...a),
  });
  const memo = createSessionMemo(local);
  const userData = createUserData({
    state, appData, collectionKeys: COLLECTION_KEYS, storage, local, StudentDb, emit, toast,
    warn: (...a) => console.warn(...a), error: (...a) => console.error(...a), log: (...a) => console.log(...a),
    isCloud: state.isCloud, updateAllLevelSelects: institution.updateAllLevelSelects, schedule,
  });
  const panels = createPanels({ doc: document, initLogo: initLogoFromStorage, status: getCloudStatus, emit });
  const flow = createSessionFlow({
    state, resetAppData, userData, storage, memo, local, StudentDb, doc: document,
    isOnline: () => navigator.onLine, fbAuth: () => getFbAuth(), session: getSessionStore(),
    confirm: (m) => window.confirm(m), emit, institution, schedule, warn: (...a) => console.warn(...a),
    getCustomStudents: userData.getCustomStudents, fbUpdateStatus: panels.fbUpdateStatus,
  });
  const archives = createArchives({ appData, getUser: state.getUser, saveUserKey: userData.saveUserKey, doc: document, now: () => new Date() });
  const weekly = createWeeklyBridge({
    appData, archives, WeeklyReport, WeeklyPrint, local, emit, updateDashboardStats: flow.updateDashboardStats, saveUserKey: userData.saveUserKey,
    getLogo,
    now: () => new Date(),
  });
  return {
    local, emit, storage, userData, flow, panels, archives, weekly,
    // التصدير وإرسال رمز الهاتف (كانتا pgExportXlsx وdispatchOTP على window)
    pgExportXlsx: (o, rows) => pgExportXlsx(o, rows, { win: window, doc: document, profile: state.getProfile }),
    dispatchOTP: (phone, code, statusElId) => dispatchOTP(phone, code, statusElId, { doc: document }),
  };
}

export const getSession = () => api || (api = build());

// الجسر الذي يقرؤه مخزن React (src/store) وبقية الوحدات — كان window.__legacyBridge في script-10.js
function makeBridge(s) {
  return {
    setCloud: (v) => state.setCloud(v),
    startSession: (name) => s.flow.startSession(name),
    getUser: () => state.getUser(),
    getProfile: () => state.getProfile(),
    getAppData: () => appData,
    getStudents: () => StudentDb.list(),
    getStudentsRaw: () => s.userData.getCustomStudents(),
    // يكتب مجموعة كاملة ثم يحفظها بمسار saveUserKey فيصل الإشعار لكل المشتركين
    saveCollection(key, items) {
      if (!(key in appData)) throw new Error('مجموعة غير معروفة: ' + key);
      appData[key] = items;
      return s.userData.saveUserKey(key);
    },
    saveStudents: (list) => s.userData.saveCustomStudents(list),
    saveProfile: (patch, opts) => s.flow.saveProfile(patch, opts),
    // جسر الأرشيفات لنافذة معاينة التقرير الأسبوعي (كان window.wprBridge)
    weeklyBridge: s.weekly.wprBridge,
  };
}

export function installSession() {
  const s = getSession();
  setBridge(makeBridge(s));
  // الخطوة 52: لم يبقَ من الجلسة والتخزين والأرشيفات والتقرير الأسبوعي شيء على window — كلها على getSession() وتستدعيها الوحدات باستيراد مباشر:
  //   s.flow (الدخول والخروج وإحصائيات اللوحة)، s.panels (الإعدادات وإعداد Firebase)، s.archives (autoLogTask وأرشيفات الأقسام)،
  //   s.weekly (wkReportHtml وwprBridge وشارة الأسبوع)، s.userData (saveUserKey وloadUserData…)، s.pgExportXlsx، s.dispatchOTP.
  // Escape يغلق نافذة الحساب الشخصي (closeProfile مستوردة من profileWindow؛ لا تفعل شيئاً إن لم تكن النافذة في الصفحة)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { try { closeProfile(); } catch { /* النافذة غير موجودة */ } } });
}

// ما كان يجري عند DOMContentLoaded وload بعد تحميل السكربتات القديمة: شارة الأسبوع، الشعار، وحالة Firebase قبل الدخول
export function afterLegacyReady() {
  const s = getSession();
  // وضع التخزين السحابي يُضبط حين يجهز Firebase (كان IIFE في أعلى script-10.js). هنا لا في installSession لأن main.jsx يبدأ Firebase بعد تقييم الوحدات المستوردة؛
  // والإقلاع وشاشة الدخول يضبطانه أيضاً
  const ready = getCloudReady();
  if (ready) {
    Promise.resolve(ready)
      .then((ok) => state.setCloud(!!ok && !!getCloudStorage()))
      .catch(() => state.setCloud(false));
  }
  setTimeout(() => s.weekly.wpInitMainBadge(), 100);
  setTimeout(() => { try { initLogoFromStorage(); } catch { /* لا شيء */ } }, 200);
  setTimeout(async () => {
    if (ready) { try { await ready; } catch { /* لا شيء */ } }
    s.panels.fbUpdateStatus();
  }, 1200);
}
