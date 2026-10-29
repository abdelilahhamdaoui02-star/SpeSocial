// ما كان script-10.js يفعله بالصفحة لاسم الوزارة والمديرية والمؤسسة وقوائم الأقسام وإعدادات المنصة (الخطوة 43).
// الخطوة 5: لم يبقَ شيء منها على window؛ الجلسة والبوابات وقائمة التلاميذ تستدعيها عبر getInstitution() باستيراد مباشر.
// env: { doc, win, storage(), cloudReady() → Promise|null، siteConfigApi() → { get() }|null (services/cloud)، getProfile(), getDbList(), getCustomList(), CustomEventCtor } — يُحقن لتسهيل الاختبار.
import {
  INSTITUTION_FIELD_IDS, ministryOf, directorateOf, institutionOf, directorateTexts,
  siteConfigDetail, levelOptionsHtml, importedClassesOf,
} from './institutionLogic.js';
import { getCloudReady, getSiteConfigApi } from '../services/cloud.js';
import { getBridge } from '../session/sessionBridge.js';

export const SITE_CFG_KEY = 'site:cfg';

export function createInstitution(env) {
  const { doc, win } = env;
  let siteCfg = {};

  const profile = () => { try { return env.getProfile() || {}; } catch { return {}; } };
  const setAll = (sel, fn) => doc.querySelectorAll(sel).forEach(fn);

  const getMinistry = () => ministryOf(siteCfg);
  const getDirectorate = () => directorateOf(profile());
  const getInstitutionName = () => institutionOf(profile());

  // يحفظ النص الأصلي في data-def أول مرة ويعود إليه عند فراغ القيمة
  function setTxt(el, v) {
    if (!el) return;
    if (el.dataset.def === undefined) el.dataset.def = el.textContent;
    el.textContent = (v || '').trim() || el.dataset.def;
  }

  function updateDirectorateUI() {
    const t = directorateTexts(getMinistry(), getDirectorate());
    setAll('.dynamic-directorate', (el) => { el.textContent = t.dir; });
    const greetSub = doc.getElementById('portalGreetingSub');
    if (greetSub) greetSub.textContent = t.greetSub;
    setAll('.pm-directorate', (el) => { el.textContent = t.dir; });
    setAll('.dynamic-dir-kingdom', (el) => { el.textContent = t.kingdom; });
    setAll('.dynamic-dir-sub2', (el) => { el.textContent = t.sub2; });
    setAll('.dynamic-dir-sub3', (el) => { el.textContent = t.sub3; });
    setAll('.dynamic-dir-oh-sub', (el) => { el.textContent = t.ohSub; });
  }

  function applySiteConfig(cfg) {
    siteCfg = cfg || {};
    setAll('.dyn-ministry', (e) => { e.textContent = getMinistry(); });
    setAll('.hp-sub, .auth-title', (e) => setTxt(e, siteCfg.platform));
    // بلاطات الصفحة الرئيسية وبطاقة الأخبار والميزاجور يرسمها React → نبلغها بالأسماء المخصّصة وإعدادات الأخبار والإشعار
    win.dispatchEvent(new env.CustomEventCtor('legacy:site-config', { detail: siteConfigDetail(siteCfg) }));
    try { updateDirectorateUI(); } catch (e) { /* كما في القديم */ }
  }

  async function loadSiteConfig() {
    try { const c = env.storage().getItem(SITE_CFG_KEY); if (c) applySiteConfig(JSON.parse(c)); } catch (e) { /* لا شيء */ }
    try {
      await env.cloudReady();
      const api = env.siteConfigApi();
      const d = api && await api.get();
      if (d && d.json) {
        try { env.storage().setItem(SITE_CFG_KEY, d.json); } catch (e) { /* لا شيء */ }
        applySiteConfig(JSON.parse(d.json));
      }
    } catch (e) { /* لا شيء */ }
  }

  function getImportedClasses() {
    let list = [];
    try { const db = env.getDbList(); if (db && db.length) list = db; } catch (e) { /* لا شيء */ }
    if (!list.length) { try { list = env.getCustomList(); } catch (e) { list = []; } }
    return importedClassesOf(null, list);
  }

  function applyInstitutionEverywhere() {
    const name = getInstitutionName();
    INSTITUTION_FIELD_IDS.forEach((id) => { const el = doc.getElementById(id); if (el) el.value = name; });
  }

  const buildLevelOptions = () => levelOptionsHtml(getImportedClasses());

  // تحديث قوائم الأقسام «القديمة» فقط: قوائم React (data-react-level) ونوافذ abm تدير خياراتها بنفسها
  function updateAllLevelSelects() {
    setAll('select.level-select:not(.abm-select):not([data-react-level])', (el) => {
      const currentVal = el.value;
      el.innerHTML = buildLevelOptions();
      if (currentVal) {
        let opt = null;
        try { opt = el.querySelector(`option[value="${currentVal}"]`); } catch (e) { /* قيمة بعلامات اقتباس */ }
        if (opt) el.value = currentVal;
      }
    });
  }

  return {
    getMinistry, getDirectorate, getInstitutionName, updateDirectorateUI, applySiteConfig, loadSiteConfig,
    getImportedClasses, applyInstitutionEverywhere, buildLevelOptions, updateAllLevelSelects,
    getSiteConfig: () => siteCfg,
  };
}

let store = null;
function browserEnv() {
  const bridge = () => getBridge() || {};
  return {
    doc: document,
    win: window,
    storage: () => window.localStorage,
    cloudReady: () => getCloudReady(),
    siteConfigApi: () => getSiteConfigApi(),
    getProfile: () => (bridge().getProfile ? bridge().getProfile() : {}),
    getDbList: () => (window.StudentDb ? window.StudentDb.list() : []),
    getCustomList: () => (bridge().getStudentsRaw ? bridge().getStudentsRaw() : []),
    CustomEventCtor: CustomEvent,
  };
}
export const getInstitution = () => store || (store = createInstitution(browserEnv()));
