// حالة الجلسة في الذاكرة — كانت currentUser وuserProfile وappData وSTORAGE_IS_CLOUD في script-10.js (الخطوة 47).
// وحدة ES واحدة تملكها؛ appData كائن واحد طوال عمر الصفحة (يُعدَّل في مكانه) كي يبقى أي مرجع إليه صالحاً.

// مجموعات بيانات المستخدم التي تُحمَّل من التخزين وتُحفَظ باسم «<المستخدم>:<المفتاح>»
export const COLLECTION_KEYS = [
  'parentCalls', 'parentMeetings', 'followUp', 'interviewArchive', 'reintegrationArchive', 'absenceArchive',
  'taskLog', 'violenceArchive', 'contactsArchive', 'workshopsArchive', 'specialNeedsArchive', 'vigilanceCases',
  'behaviorFiles', 'pdAssocArchive', 'pdHealthArchive',
];

export const appData = {};
COLLECTION_KEYS.forEach((k) => { appData[k] = []; });

const state = { user: null, profile: {}, cloud: false };

export const getUser = () => state.user;
export const setUser = (name) => { state.user = name; };
export const getProfile = () => state.profile;
export const setProfile = (p) => { state.profile = p || {}; };
export const isCloud = () => state.cloud;
export const setCloud = (v) => { state.cloud = !!v; };

// يفرّغ كل المجموعات عند الخروج (القديم كان يفرّغ عشراً منها فقط ويترك العنف والإعاقة والاتصالات بالأولياء؛ كلها تُستبدل عند الدخول التالي)
export function resetAppData() {
  COLLECTION_KEYS.forEach((k) => { appData[k] = []; });
}
