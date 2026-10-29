// دورة الجلسة: الدخول التلقائي ودخول التطبيق والخروج وحفظ الملف الشخصي وصورة المستخدم — منقولة من
// tryAutoLogin/authEnterApp/authLogout/applyPhoto/updateDashboardStats/__legacyBridge.saveProfile في script-10.js (الخطوة 47).
//   deps: { state: { getUser, setUser, getProfile, setProfile, isCloud }, resetAppData(), userData, storage: { set }, memo: { save, clear },
//           local, StudentDb, doc, isOnline(), fbAuth() → services/cloud، confirm(msg), session: { entered(user), loggedOut() } (مخزن الجلسة)،
//           emit(name, detail?), institution: { loadSiteConfig, updateDirectorateUI, updateAllLevelSelects, applyInstitutionEverywhere }، schedule(fn, ms), warn, getCustomStudents(), fbUpdateStatus() }
export const LOGOUT_CONFIRM = 'هل تريد تسجيل الخروج؟\nستبقى بياناتك محفوظة ويمكنك الدخول مجدداً.';
export const NOTE_CLOUD = '☁️ وضع Firebase Firestore — بياناتك محفوظة في السحابة ومتاحة من أي جهاز';
export const NOTE_LOCAL = '💾 وضع التخزين المحلي — يرجى إعداد Firebase للتخزين السحابي';

export function createSessionFlow(d) {
  const byId = (id) => d.doc.getElementById(id);
  const all = (sel) => Array.from(d.doc.querySelectorAll(sel));

  function applyPhoto() {
    const p = d.state.getProfile() && d.state.getProfile().photo;
    all('#profileInfoAvatar,#userInitial,.bb-avatar').forEach((e) => {
      e.style.backgroundImage = p ? 'url("' + p + '")' : '';
      e.style.backgroundSize = 'cover';
      e.style.backgroundPosition = 'center';
      e.style.color = p ? 'transparent' : '';
      if (p) e.style.borderRadius = '50%';
    });
  }

  // بطاقات الإحصائيات والمخطط صارت مكوّنات React تقرأ من المخزن؛ نكتفي بإبلاغها بإعادة القراءة
  function updateDashboardStats() {
    try { d.emit('legacy:stats-refresh'); } catch (e) { d.warn('Dashboard stats error:', e); }
  }

  function enterApp() {
    const user = d.state.getUser();
    const profile = d.state.getProfile();
    // قائمة هذا المستخدم حُمِّلت في loadUserData؛ نُعلم المخزن بتغيّرها بعد الدخول
    if (user) d.emit('legacy:students-changed');
    d.session.entered(user);
    // إظهار البوابة الرئيسية: تتولاه حالة التنقل (nav/navStore) عبر مخزن الجلسة
    d.institution.loadSiteConfig();
    applyPhoto();
    const bar = byId('userBar');
    if (bar) bar.classList.add('visible');
    const searchBar = byId('searchNotifBar');
    if (searchBar) searchBar.style.display = 'flex';
    const displayName = profile.fullName || user;
    const initials = String(displayName || '').charAt(0).toUpperCase();
    all('.bb-avatar').forEach((el) => { el.textContent = initials; });
    all('.bb-name').forEach((el) => { el.textContent = displayName; });
    d.emit('legacy:sync-status', { cloud: !!d.state.isCloud() });
    const note = byId('authStorageNote');
    if (note) note.textContent = d.state.isCloud() ? NOTE_CLOUD : NOTE_LOCAL;
    d.memo.save(user);
    // نؤخر التحديثات لضمان اكتمال تحميل البيانات والإعدادات من Firebase
    d.schedule(() => { try { const c = d.getCustomStudents(); if (c.length) d.StudentDb.mergeCustom(c); } catch { /* لا شيء */ } }, 500);
    d.schedule(updateDashboardStats, 800);
    d.schedule(updateDashboardStats, 2500);
    d.schedule(() => d.institution.updateDirectorateUI(), 250);
    d.schedule(() => d.institution.updateAllLevelSelects(), 300);
    [900, 2500].forEach((ms) => d.schedule(() => { try { d.institution.updateAllLevelSelects(); d.institution.applyInstitutionEverywhere(); } catch { /* لا شيء */ } }, ms));
    d.schedule(() => d.fbUpdateStatus(), 800);
  }

  // يضبط المستخدم ثم يحمّل بياناته ثم يدخل التطبيق (كان __legacyBridge.startSession)
  async function startSession(name) {
    d.state.setUser(name);
    await d.userData.loadUserData();
    enterApp();
  }

  // الدخول التلقائي من جلسة Firebase المحفوظة
  async function tryAutoLogin() {
    const auth = d.fbAuth();
    if (!d.isOnline() || !d.state.isCloud() || !auth) return false;
    try {
      const name = await auth.restore();
      if (!name) return false;
      await startSession(name);
      return true;
    } catch { return false; }
  }

  function logout() {
    if (!d.confirm(LOGOUT_CONFIRM)) return;
    const user = d.state.getUser();
    // تنظيف قائمة التلاميذ من الذاكرة واللوكال ستوراج قبل الخروج
    if (user) d.local.remove('app:customStudents:' + user);
    d.local.remove('app:customStudents');
    d.StudentDb.clear();
    try { const auth = d.fbAuth(); if (auth) Promise.resolve(auth.logout()).catch(() => {}); } catch { /* لا شيء */ }
    d.memo.clear();
    d.state.setUser(null);
    d.state.setProfile({});
    d.resetAppData();
    const bar = byId('userBar');
    if (bar) bar.classList.remove('visible');
    const searchBar = byId('searchNotifBar');
    if (searchBar) searchBar.style.display = 'none';
    // شاشة الدخول والتنقل والمخزن والملف الشخصي تتبع مخزن الجلسة: تظهر الشاشة وتُفرَّغ الحقول والبيانات
    d.session.loggedOut();
  }

  // حفظ الملف الشخصي من نافذة React. patch.photo === null يحذف الصورة؛ effects=false للحفظ الصامت (مثل التحقق من الهاتف)
  async function saveProfile(patch, opts) {
    const profile = d.state.getProfile();
    Object.keys(patch || {}).forEach((k) => { if (patch[k] === null) delete profile[k]; else profile[k] = patch[k]; });
    await d.storage.set(d.state.getUser() + ':profile', JSON.stringify(profile), true);
    d.emit('legacy:profile-changed');
    if (!opts || opts.effects !== false) {
      d.institution.updateDirectorateUI();
      d.institution.updateAllLevelSelects();
      d.institution.applyInstitutionEverywhere();
      applyPhoto();
    }
  }

  return { applyPhoto, updateDashboardStats, enterApp, startSession, tryAutoLogin, logout, saveProfile };
}
