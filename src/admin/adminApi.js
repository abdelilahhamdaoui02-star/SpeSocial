import { EMAIL_DOMAIN, DATA_KEYS } from './adminConfig.js';
import { parseSiteJson, clone } from './siteLogic.js';

const RT_KEY = 'admin:rt';
// نكتب حقول الإعدادات الثلاثة فقط (لا نمسح أي حقل آخر في الوثيقة)
const SITE_MASK = '&updateMask.fieldPaths=json&updateMask.fieldPaths=updatedAt&updateMask.fieldPaths=updatedBy';
const SITE_RULES_HINT = ' — تأكد من إضافة قاعدة site_config في Firestore Rules.';

export function sanitizeKey(k) { return k.replace(/\//g, '__SLASH__').replace(/:/g, '__COLON__').replace(/\s/g, '__SPACE__'); }

const str = (v) => ({ stringValue: v });

export function errMsg(r) {
  const m = (r.data && r.data.error && r.data.error.message) || ('HTTP ' + r.status);
  const map = {
    EMAIL_NOT_FOUND: 'البريد غير موجود.', INVALID_PASSWORD: 'كلمة المرور غير صحيحة.',
    INVALID_LOGIN_CREDENTIALS: 'البريد أو كلمة المرور غير صحيحة.', USER_DISABLED: 'الحساب معطّل.',
    EMAIL_EXISTS: 'هذا الاسم موجود في Firebase Authentication مسبقًا.',
    OPERATION_NOT_ALLOWED: 'طريقة الدخول بالبريد وكلمة المرور غير مفعّلة في Firebase Authentication.',
    ADMIN_ONLY_OPERATION: 'إنشاء الحسابات معطّل في إعدادات Firebase (User actions). أعد تفعيله مؤقتًا.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'محاولات كثيرة، حاول لاحقًا.',
  };
  const key = String(m).split(' ')[0].split(':')[0];
  if (map[key]) return map[key];
  if (r.status === 403) return 'رفض الخادم الطلب (403). السبب كما أرسله Firebase: «' + m + '»';
  return m;
}

export function memoryStore() {
  const m = new Map();
  return { get: (k) => (m.has(k) ? m.get(k) : null), set: (k, v) => { m.set(k, v); }, remove: (k) => { m.delete(k); } };
}
export function browserSessionStore() {
  return {
    get: (k) => { try { return window.sessionStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { window.sessionStorage.setItem(k, v); } catch { /* التخزين غير متاح */ } },
    remove: (k) => { try { window.sessionStorage.removeItem(k); } catch { /* التخزين غير متاح */ } },
  };
}

// واجهة الأدمين فوق REST الخاص بـ Firebase (نفس سلوك admin.js القديم)
export function createAdminApi({ cfg, fetchImpl, sessionStore = memoryStore(), timeoutMs = 15000 }) {
  const FS = 'https://firestore.googleapis.com/v1/projects/' + cfg.projectId + '/databases/(default)/documents';
  const IDT = 'https://identitytoolkit.googleapis.com/v1/accounts:';
  const emptySession = () => ({ idToken: null, refreshToken: null, uid: null, exp: 0 });
  let session = emptySession();
  const doFetch = (u, o) => (fetchImpl ? fetchImpl(u, o) : globalThis.fetch(u, o));

  async function http(url, opt) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res;
    try { res = await doFetch(url, Object.assign({ signal: ctrl.signal }, opt)); }
    catch (e) { throw new Error(e && e.name === 'AbortError' ? 'انتهت مهلة الاتصال.' : 'تعذّر الوصول إلى Firebase (تحقق من الإنترنت).'); }
    finally { clearTimeout(timer); }
    let data = null; try { data = await res.json(); } catch { /* جسم فارغ */ }
    return { status: res.status, ok: res.ok, data: data || {} };
  }

  function setSession(idToken, refreshToken, uid, expiresIn) {
    session = { idToken, refreshToken, uid, exp: Date.now() + (parseInt(expiresIn || '3600', 10) - 60) * 1000 };
    sessionStore.set(RT_KEY, refreshToken);
  }
  async function refresh() {
    const rt = session.refreshToken || sessionStore.get(RT_KEY);
    if (!rt) throw new Error('انتهت الجلسة، سجّل الدخول من جديد.');
    const r = await http('https://securetoken.googleapis.com/v1/token?key=' + encodeURIComponent(cfg.apiKey), {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(rt),
    });
    if (!r.ok) throw new Error('انتهت الجلسة، سجّل الدخول من جديد.');
    setSession(r.data.id_token, r.data.refresh_token, r.data.user_id, r.data.expires_in);
  }
  async function token() { if (!session.idToken || Date.now() > session.exp) await refresh(); return session.idToken; }

  async function fs(method, path, body, query) {
    const url = FS + '/' + path + '?key=' + encodeURIComponent(cfg.apiKey) + (query || '');
    const headers = { Authorization: 'Bearer ' + (await token()) };
    if (body) headers['Content-Type'] = 'application/json';
    // no-store: لا نقرأ نسخة قديمة من ذاكرة المتصفح أبدًا
    return http(url, { method, headers, cache: 'no-store', body: body ? JSON.stringify(body) : undefined });
  }

  // ── الدخول ──
  async function signIn(email, password) {
    const r = await http(IDT + 'signInWithPassword?key=' + encodeURIComponent(cfg.apiKey), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    if (!r.ok) throw new Error(errMsg(r));
    setSession(r.data.idToken, r.data.refreshToken, r.data.localId, r.data.expiresIn);
  }
  async function verifyAdmin() {
    const r = await fs('GET', 'admins/' + session.uid);
    if (r.status === 404) throw new Error('هذا الحساب ليس أدمين. معرّف حسابك (UID) هو: ' + session.uid + ' — يجب أن تكون في مجموعة admins وثيقة باسم هذا المعرّف بالضبط. تأكد أيضًا أنك تدخل بنفس البريد الذي نسخت منه المعرّف.');
    if (!r.ok) throw new Error(errMsg(r) + ' (معرّف حسابك UID: ' + session.uid + ')');
  }
  const hasStoredSession = () => !!sessionStore.get(RT_KEY);
  async function restore() { await refresh(); await verifyAdmin(); }
  function clearSession() { session = emptySession(); sessionStore.remove(RT_KEY); }

  // ── إعدادات المنصة: site_config/main (حقل json) ──
  // قراءة طازجة من الخادم. لا نُرجع {} إلا إذا كانت الوثيقة غير موجودة فعلاً (404)؛
  // أي خطأ آخر يُرمى حتى لا نكتب فوق إعدادات لم نستطع قراءتها.
  async function readSite() {
    const r = await fs('GET', 'site_config/main');
    if (r.status === 404) return { cfg: {}, raw: '', exists: false };
    if (!r.ok) throw new Error(errMsg(r));
    const raw = r.data.fields && r.data.fields.json ? r.data.fields.json.stringValue || '' : '';
    return { cfg: parseSiteJson(raw), raw, exists: true };
  }

  // قراءة ← تعديل ← كتابة ← قراءة تحقق. تُنفَّذ الطلبات بالتتابع حتى لا يدوس بعضها بعضًا.
  let queue = Promise.resolve();
  function saveSite(mutate) {
    const run = queue.then(() => doSaveSite(mutate));
    queue = run.catch(() => {});
    return run;
  }
  async function doSaveSite(mutate) {
    const latest = await readSite();
    const next = clone(latest.cfg);
    mutate(next);
    const json = JSON.stringify(next);
    const w = await fs('PATCH', 'site_config/main', { fields: { json: str(json), updatedAt: str(new Date().toISOString()), updatedBy: str(session.uid || '') } }, SITE_MASK);
    if (!w.ok) throw new Error(errMsg(w) + SITE_RULES_HINT);
    const back = await readSite();
    if (back.raw !== json) throw new Error('لم يُثبَّت الحفظ على الخادم (القراءة بعد الكتابة لا تطابق ما أُرسل). تحقق من قواعد Firestore ثم أعد المحاولة.');
    return { cfg: back.cfg };
  }

  // ── الحسابات ──
  async function listUsers() {
    const all = []; let pageToken = '';
    do {
      const r = await fs('GET', 'allowed_users', null, '&pageSize=300' + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : ''));
      if (!r.ok) throw new Error(errMsg(r));
      (r.data.documents || []).forEach((d) => {
        const f = d.fields || {};
        all.push({
          uid: d.name.split('/').pop(),
          username: f.username ? f.username.stringValue : '',
          active: f.active ? f.active.booleanValue !== false : true,
          created: f.created ? f.created.stringValue : '',
        });
      });
      pageToken = r.data.nextPageToken || '';
    } while (pageToken);
    return all;
  }
  async function createUser(name, pwd) {
    // 1) حساب المصادقة عبر REST (لا يغيّر جلسة الأدمين)
    const r = await http(IDT + 'signUp?key=' + encodeURIComponent(cfg.apiKey), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: name + EMAIL_DOMAIN, password: pwd, returnSecureToken: false }),
    });
    if (!r.ok) throw new Error(errMsg(r));
    // 2) اعتماده في القائمة المسموحة
    const w = await fs('PATCH', 'allowed_users/' + r.data.localId, { fields: {
      username: str(name), active: { booleanValue: true }, created: str(new Date().toISOString()), createdBy: str(session.uid || ''),
    } });
    if (!w.ok) throw new Error(errMsg(w));
  }
  async function setUserActive(u, active) {
    const w = await fs('PATCH', 'allowed_users/' + u.uid, { fields: { active: { booleanValue: !!active } } }, '&updateMask.fieldPaths=active');
    if (!w.ok) throw new Error(errMsg(w));
  }
  async function deleteUser(u, withData) {
    const d = await fs('DELETE', 'allowed_users/' + u.uid);
    if (!d.ok) throw new Error(errMsg(d));
    if (withData) {
      await Promise.all(DATA_KEYS.map((k) => fs('DELETE', 'shared/' + encodeURIComponent(sanitizeKey(u.username + ':' + k))).catch(() => {})));
    }
  }

  return { signIn, verifyAdmin, restore, hasStoredSession, clearSession, readSite, saveSite, listUsers, createUser, setUserActive, deleteUser, uid: () => session.uid };
}
