import { useMemo, useState } from 'react';
import { Msg, DraftNote } from './ui.jsx';
import { useDraft, useMsg } from './hooks.js';
import { GATES } from './adminConfig.js';
import { namesFromCfg, applyNames } from './siteLogic.js';

// 🏛 اسم الوزارة واسم المنصة وأسماء البوابات
export default function NamesCard({ cfg, save }) {
  const server = useMemo(() => namesFromCfg(cfg), [cfg]);
  const d = useDraft('names', server);
  const f = d.value;
  const [busy, setBusy] = useState(false);
  const [msg, say] = useMsg();
  const setField = (k, v) => d.set((x) => ({ ...x, [k]: v }));
  const setGate = (id, v) => d.set((x) => ({ ...x, gates: { ...x.gates, [id]: v } }));

  async function onSave() {
    setBusy(true); say('⏳ جارٍ الحفظ...');
    try {
      await save((c) => applyNames(c, f)); // تُقرأ الإعدادات الحالية من الخادم ثم تُعدَّل الأسماء فقط
      d.clear();
      say('✅ تم حفظ الأسماء على الخادم — تظهر عند فتح المنصة أو تحديثها.', 'ok');
    } catch (e) { say('❌ ' + ((e && e.message) || 'فشل الحفظ') + ' — تعديلاتك ما زالت محفوظة هنا، أعد المحاولة.', 'err'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card">
      <h2>🏛 الأسماء الظاهرة في المنصة</h2>
      <div className="field"><label>اسم الوزارة</label>
        <input type="text" value={f.ministry} onChange={(e) => setField('ministry', e.target.value)} /></div>
      <div className="field"><label>اسم المنصة (العنوان تحت اسم المديرية)</label>
        <input type="text" value={f.platform} onChange={(e) => setField('platform', e.target.value)} /></div>
      <label>أسماء البوابات <span className="sub">(اتركها فارغة لاستعمال الاسم الافتراضي)</span></label>
      <div className="gates">
        {GATES.map(([id, label]) => (
          <div key={id}>
            <label>{label}</label>
            <input type="text" placeholder={label} value={(f.gates && f.gates[id]) || ''} onChange={(e) => setGate(id, e.target.value)} />
          </div>
        ))}
      </div>
      <DraftNote dirty={d.dirty} onDiscard={d.clear} />
      <div className="actions" style={{ marginTop: 14 }}>
        <button className="btn" type="button" disabled={busy} onClick={onSave}>💾 حفظ الأسماء</button>
      </div>
      <Msg m={msg} />
    </div>
  );
}
