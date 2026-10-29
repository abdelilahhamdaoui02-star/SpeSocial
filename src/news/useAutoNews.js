import { useEffect, useMemo, useState } from 'react';
import { autoSettings, loadAutoNews } from './newsFeed.js';

const getStorage = () => { try { return window.localStorage; } catch (e) { return null; } };

// أخبار Google التلقائية: كاش 24 ساعة، وإلغاء الجلب الجاري عند تغيّر الإعدادات أو إزالة البطاقة.
export function useAutoNews(cfg) {
  const settings = useMemo(() => autoSettings(cfg), [cfg]);
  const sig = settings ? settings.sig : '';
  const [auto, setAuto] = useState([]);

  // نُعيد التشغيل فقط عند تغيّر توقيع الإعدادات (الكلمات/العدد/الوسيط)، لا عند تعديل العناصر اليدوية
  useEffect(() => {
    setAuto([]);
    if (!settings) return undefined;
    const ctrl = new AbortController();
    loadAutoNews(cfg, {
      storage: getStorage(),
      fetchFn: (url, opts) => fetch(url, opts),
      signal: ctrl.signal,
      onCached: (items) => { if (!ctrl.signal.aborted) setAuto(items); },
    }).then((r) => { if (!ctrl.signal.aborted && r.items) setAuto(r.items); }).catch(() => {});
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  return auto;
}
