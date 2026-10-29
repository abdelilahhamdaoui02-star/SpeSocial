// جسر الجلسة (الخطوة 51) — كان window.__legacyBridge. يسجّله installSession مرة واحدة، ويقرؤه المخزن والملف الشخصي والإكمال التلقائي
// والإعدادات والمؤسسة والغياب. وحدة صغيرة بلا استيراد ثقيل كي لا يجرّ المخزن طبقة الجلسة كلها.
let bridge = null;
export const setBridge = (b) => { bridge = b || null; };
export const getBridge = () => bridge; // null قبل التركيب
