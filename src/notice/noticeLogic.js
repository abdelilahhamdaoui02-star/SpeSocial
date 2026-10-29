// الميزاجور: إشعار التحديث الذي ينشره المسؤول (site_config/main → notice) ويظهر في الصفحة الرئيسية.
// منقول من renderSiteNotice القديمة (script-10.js) بنفس شروط الإظهار والنصوص.

export const NOTICE_DISMISSED_KEY = 'site:notice:dismissed';
export const NOTICE_DEFAULT_TITLE = 'ميزاجور';

// معرّف آخر إشعار أغلقه المستخدم ('' إن لم يوجد أو تعذّر القراءة)
export function readDismissed(storage) {
  try { return storage.getItem(NOTICE_DISMISSED_KEY) || ''; } catch { return ''; }
}

export function saveDismissed(storage, id) {
  try { storage.setItem(NOTICE_DISMISSED_KEY, id); } catch {}
}

// null = مخفي؛ وإلا ما يُعرض: { level, title, text, date }
export function noticeView(notice, dismissedId) {
  const n = notice || {};
  if (!n.on || !(n.text || n.title) || dismissedId === n.id) return null;
  return {
    level: n.level || 'info',
    title: n.title || NOTICE_DEFAULT_TITLE,
    text: n.text || '',
    date: n.date || '',
  };
}
