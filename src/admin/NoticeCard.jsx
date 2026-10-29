import { useMemo, useState } from 'react';
import { Msg, DraftNote } from './ui.jsx';
import { useDraft, useMsg } from './hooks.js';
import { noticeFromCfg, validateNotice, publishNotice, stopNotice } from './siteLogic.js';

// 📢 ميزاجور: إشعار تحديث يظهر في الصفحة الرئيسية
export default function NoticeCard({ cfg, save }) {
  const server = useMemo(() => noticeFromCfg(cfg), [cfg]);
  const d = useDraft('notice', server);
  const f = d.value;
  const [busy, setBusy] = useState(false);
  const [msg, say] = useMsg();
  const set = (k, v) => d.set((x) => ({ ...x, [k]: v }));

  async function run(mutate, okText) {
    setBusy(true); say('⏳ جارٍ الحفظ...');
    try { await save(mutate); say(okText, 'ok'); return true; }
    catch (e) { say('❌ ' + ((e && e.message) || 'فشل الحفظ'), 'err'); return false; }
    finally { setBusy(false); }
  }
  async function onPublish() {
    const err = validateNotice(f); if (err) return say(err, 'err');
    if (await run((c) => publishNotice(c, f), '✅ تم نشر الميزاجور — يظهر للمستخدمين عند فتح المنصة.')) d.clear();
  }
  function onStop() {
    if (!cfg.notice) return say('لا يوجد ميزاجور منشور.', 'warn');
    run((c) => stopNotice(c), '✅ تم إيقاف ظهور الميزاجور.');
  }

  return (
    <div className="card">
      <h2>📢 ميزاجور (إشعار تحديث يظهر في منصة INDEX)</h2>
      <div className="row">
        <div className="field"><label>العنوان</label>
          <input type="text" placeholder="مثال: تحديث جديد للمنصة" value={f.title} onChange={(e) => set('title', e.target.value)} /></div>
        <div className="field"><label>النوع</label>
          <select value={f.level} onChange={(e) => set('level', e.target.value)}>
            <option value="info">ℹ️ معلومة (أزرق)</option><option value="warn">⚠️ تنبيه (برتقالي)</option><option value="urgent">🚨 عاجل (أحمر)</option>
          </select></div>
      </div>
      <div className="field"><label>نص الميزاجور</label>
        <textarea placeholder="اكتب هنا ما تريد أن يقرأه المستخدمون في الصفحة الرئيسية..." value={f.text} onChange={(e) => set('text', e.target.value)} />
        <div className="hint">كل نشر جديد يظهر من جديد حتى لمن أغلق الإشعار السابق.</div></div>
      <DraftNote dirty={d.dirty} onDiscard={d.clear} />
      <div className="actions">
        <button className="btn" type="button" disabled={busy} onClick={onPublish}>📢 نشر الميزاجور</button>
        <button className="btn gray" type="button" disabled={busy} onClick={onStop}>⏹ إيقاف الظهور</button>
      </div>
      {!msg.text && cfg.notice && cfg.notice.on && <div className="msg ok">🟢 الميزاجور ظاهر حاليًا للمستخدمين.</div>}
      <Msg m={msg} />
    </div>
  );
}
