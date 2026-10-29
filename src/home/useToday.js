import { useEffect, useState } from 'react';
import { msUntilNextMidnight } from './homeStats.js';

const dayKey = (d) => d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();

// تاريخ اليوم كحالة React: يتغير تلقائياً عند منتصف الليل وعند عودة التبويب للظهور،
// فيتحدّث الشهر المعروض وتمييز الأسبوع الحالي دون إعادة تحميل الصفحة.
export function useToday() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    let timer;
    const tick = () => {
      const now = new Date();
      setToday((prev) => (dayKey(prev) === dayKey(now) ? prev : now));
      timer = setTimeout(tick, msUntilNextMidnight(now));
    };
    timer = setTimeout(tick, msUntilNextMidnight());
    const onVisible = () => { if (!document.hidden) { clearTimeout(timer); tick(); } };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  return today;
}
