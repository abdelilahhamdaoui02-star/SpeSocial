import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { noticeView, readDismissed, saveDismissed } from './noticeLogic.js';

const storage = () => { try { return window.localStorage; } catch { return null; } };
const read = () => { const s = storage(); return s ? readDismissed(s) : ''; };

function SiteNoticeUI() {
  // applySiteConfig القديمة ترسل legacy:site-config عند كل تحميل/تحديث لإعدادات المنصة
  const [state, setState] = useState({ notice: null, dismissed: read() });

  useEffect(() => {
    const onCfg = (e) => setState({ notice: (e.detail && e.detail.notice) || null, dismissed: read() });
    window.addEventListener('legacy:site-config', onCfg);
    return () => window.removeEventListener('legacy:site-config', onCfg);
  }, []);

  const v = noticeView(state.notice, state.dismissed);
  if (!v) return null;

  const dismiss = () => {
    const s = storage();
    if (s) saveDismissed(s, state.notice.id);
    setState((x) => ({ ...x, dismissed: x.notice.id }));
  };

  return (
    <div id="siteNotice" className={'site-notice lv-' + v.level}>
      <div className="sn-ico">📢</div>
      <div className="sn-body"><b>{v.title}</b><p>{v.text}</p><small>{v.date}</small></div>
      <button type="button" aria-label="إغلاق" onClick={dismiss}>✕</button>
    </div>
  );
}

export default function SiteNotice({ mount }) {
  return mount ? createPortal(<SiteNoticeUI />, mount) : null;
}
