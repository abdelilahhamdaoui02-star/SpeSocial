// تحميل بيانات المستخدم وحفظ مجموعاتها وقائمة تلاميذه — منقولة من loadUserData/saveUserKey/saveCustomStudents/getCustomStudents في script-10.js (الخطوة 47).
//   deps: { state: { getUser, setProfile }, appData, collectionKeys, storage: { get, set }, local, StudentDb,
//           emit(name, detail?), toast(msg, type), warn, error, log, updateAllLevelSelects() (قوائم الأقسام من src/institution), schedule(fn, ms) }
export function createUserData(d) {
  const customKey = () => { const u = d.state.getUser(); return u ? 'app:customStudents:' + u : 'app:customStudents'; };

  async function loadUserData() {
    const user = d.state.getUser();
    // تحميل متوازي بدلاً من المتسلسل — أسرع بكثير
    await Promise.all(d.collectionKeys.map(async (key) => {
      try {
        const v = await d.storage.get(user + ':' + key, true);
        d.appData[key] = v ? JSON.parse(v) : [];
      } catch { d.appData[key] = []; }
    }));
    try {
      const v = await d.storage.get(user + ':profile', true);
      d.state.setProfile(v ? JSON.parse(v) : {});
    } catch { d.state.setProfile({}); }
    // قائمة التلاميذ الخاصة بهذا المستخدم
    try {
      const v = await d.storage.get(user + ':customStudents', true);
      if (v) {
        const list = JSON.parse(v);
        d.local.set('app:customStudents:' + user, JSON.stringify(list));
        d.StudentDb.replaceFromCustom(list);
      } else {
        // لا توجد قائمة في Firebase — نفرّغ الذاكرة وlocalStorage لهذا المستخدم
        d.local.remove('app:customStudents:' + user);
        d.StudentDb.clear();
      }
    } catch { /* تُترك القائمة كما هي */ }
    d.emit('legacy:data-loaded');
  }

  async function saveUserKey(key) {
    const user = d.state.getUser();
    if (!user) return false;
    try {
      const jsonStr = JSON.stringify(d.appData[key]);
      // البيانات في الذاكرة صارت محدَّثة الآن؛ نُبلغ واجهة React فوراً دون انتظار اكتمال الحفظ السحابي
      d.emit('legacy:data-changed', { key });
      if (jsonStr.length > 800000) d.toast('⚠️ حجم البيانات كبير — فكر في أرشفة السجلات القديمة', 'warning');
      await d.storage.set(user + ':' + key, jsonStr, true);
      d.emit('legacy:data-changed', { key });
      if (d.isCloud()) d.log('✅ تم الحفظ السحابي: ' + user + ':' + key + ' (' + Math.round(jsonStr.length / 1024) + 'KB)');
      else d.warn('⚠️ حُفظ محلياً فقط: ' + user + ':' + key);
      return true;
    } catch (e) {
      d.error('❌ فشل الحفظ:', e);
      d.toast('❌ فشل حفظ البيانات — تحقق من اتصالك بالإنترنت', 'error');
      return false;
    }
  }

  function getCustomStudents() {
    try { const v = d.local.get(customKey()); return v ? JSON.parse(v) : []; } catch { return []; }
  }

  function saveCustomStudents(list) {
    const user = d.state.getUser();
    d.local.set(customKey(), JSON.stringify(list));
    if (user) d.storage.set(user + ':customStudents', JSON.stringify(list), true).catch(() => {});
    // تحديث الذاكرة مباشرة
    try { d.StudentDb.replaceFromCustom(list); } catch { /* لا شيء */ }
    // قوائم الأقسام من اللائحة الجديدة، وعداد التلاميذ في لوحة القيادة
    try { d.updateAllLevelSelects(); } catch { /* لا شيء */ }
    // عدّاد التلاميذ في لوحة القيادة (نفس ما يبثّه updateDashboardStats)
    d.schedule(() => { try { d.emit('legacy:stats-refresh'); } catch (e) { d.warn('Dashboard stats error:', e); } }, 100);
    d.emit('legacy:students-changed');
  }

  return { loadUserData, saveUserKey, getCustomStudents, saveCustomStudents };
}
