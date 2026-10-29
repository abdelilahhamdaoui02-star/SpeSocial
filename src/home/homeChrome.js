// ما كان script-23.js يفعله بالصفحة الرئيسية خارج البطاقات:
//  1) فئة on-home على <body>: تتبع الآن حالة التنقل (useOnHomeClass أدناه) بدل مراقبة style لـ#portalLanding
//  2) شعار الوزارة في ترويسة الصفحة الرئيسية (#hpMinistryLogo): الشعار الافتراضي أو إخفاؤه إن لم يوجد
import { useEffect } from 'react';
import { useCurrentPortal, useEntered } from '../store/hooks.js';

// الصفحة الرئيسية ظاهرة = دخل المستخدم ولا توجد بوابة مفتوحة (تعتمد عليها أنماط كثيرة: body.on-home)
export const isOnHome = ({ entered, current }) => !!entered && !current;

export function syncOnHome(doc, state) {
  doc.body.classList.toggle('on-home', isOnHome(state));
}

export function useOnHomeClass() {
  const current = useCurrentPortal();
  const entered = useEntered();
  useEffect(() => { syncOnHome(document, { entered, current }); }, [entered, current]);
}

export function installHomeChrome({ doc, defaultLogo }) {
  const lg = doc.getElementById('hpMinistryLogo');
  if (lg && defaultLogo) lg.src = defaultLogo;
  else if (lg) lg.style.display = 'none';
}
