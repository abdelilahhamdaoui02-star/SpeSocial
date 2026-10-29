import { useMemo, useRef, useState } from 'react';
import { Msg, DraftNote } from './ui.jsx';
import { useDraft, useMsg } from './hooks.js';
import { NW_TYPES } from './adminConfig.js';
import {
  EMPTY_NEWS_FORM, validateNewsForm, saveNewsItem, moveNews, togglePin, removeNews, approveCandidates,
  newsSettingsFromCfg, validateNewsSettings, applyNewsSettings, parseKeywords,
} from './siteLogic.js';
import { fetchCandidates } from './newsFetch.js';

const fail = (e) => { const m = (e && e.message) || 'فشل الحفظ'; return m.indexOf('⚠️') === 0 ? m : '❌ ' + m; };

// 📰 أخبار وقوانين المختصين + 🌐 أخبار Google
export default function NewsCard({ cfg, save }) {
  const items = useMemo(() => (cfg.news && Array.isArray(cfg.news.items) ? cfg.news.items : []), [cfg]);
  const form = useDraft('newsForm', EMPTY_NEWS_FORM);
  const f = form.value;
  const setF = (k, v) => form.set((x) => ({ ...x, [k]: v }));
  const sv = useMemo(() => newsSettingsFromCfg(cfg), [cfg]);
  const st = useDraft('newsSettings', sv);
  const s = st.value;
  const setS = (k, v) => st.set((x) => ({ ...x, [k]: v }));

  const [busy, setBusy] = useState(false);
  const [msg, say] = useMsg();
  const [kwMsg, sayKw] = useMsg();
  const [fetching, setFetching] = useState(false);
  const [cands, setCands] = useState([]);
  const cardRef = useRef(null);
  const titleRef = useRef(null);

  async function persist(mutate, okText, sayFn = say) {
    setBusy(true);
    try { await save(mutate); sayFn(okText, 'ok'); return true; }
    catch (e) { sayFn(fail(e), 'err'); return false; }
    finally { setBusy(false); }
  }

  async function onPublish() {
    const err = validateNewsForm(f); if (err) return say(err, 'err');
    const ok = await persist((c) => { saveNewsItem(c, f); },
      f.editId ? '✅ تم حفظ التعديل.' : '✅ تم النشر — يظهر في الصفحة الرئيسية للمستخدمين.');
    if (ok) form.clear(); // لا نمسح النموذج إلا بعد نجاح الحفظ فعلاً
  }
  function startEdit(it) {
    form.set({ editId: it.id, type: it.type || 'news', title: it.title || '', text: it.text || '', url: it.url || '', source: it.source || '', pinned: !!it.pinned });
    if (cardRef.current && cardRef.current.scrollIntoView) cardRef.current.scrollIntoView({ behavior: 'smooth' });
    if (titleRef.current) titleRef.current.focus();
  }

  async function onSaveKw() {
    const err = validateNewsSettings(s); if (err) return sayKw(err, 'err');
    const ok = await persist((c) => applyNewsSettings(c, s), '✅ تم حفظ إعدادات أخبار Google.', sayKw);
    if (ok) st.clear();
  }
  async function onFetch() {
    const kws = parseKeywords(s.keywords);
    if (!kws.length) return sayKw('⚠️ أضف كلمة مفتاحية واحدة على الأقل.', 'err');
    const per = Math.min(10, Math.max(1, parseInt(s.count, 10) || 5));
    setFetching(true); setCands([]); sayKw('⏳ جارٍ جلب الأخبار...');
    const { cands: list, errs } = await fetchCandidates({ kws, per, proxy: s.proxy, existing: items });
    setFetching(false); setCands(list);
    sayKw((list.length ? '✅ تم جلب ' + list.length + ' خبرًا جديدًا — اعتمد ما يناسب المختصين.' : 'لا توجد أخبار جديدة.') + (errs.length ? ' ⚠️ ' + errs.join(' | ') : ''),
      errs.length && !list.length ? 'err' : (errs.length ? 'warn' : 'ok'));
  }
  async function approve(list) {
    if (!list.length) return;
    const ok = await persist((c) => approveCandidates(c, list), '✅ تم اعتماد ' + list.length + ' — يظهر في تبويب «أخبار Google» بالصفحة الرئيسية.');
    if (ok) setCands((prev) => prev.filter((c) => list.indexOf(c) === -1));
  }

  return (
    <div className="card" ref={cardRef}>
      <h2>📰 أخبار وقوانين المختصين (تظهر في الصفحة الرئيسية)</h2>
      <div className="row">
        <div className="field"><label>النوع</label>
          <select value={f.type} onChange={(e) => setF('type', e.target.value)}>
            <option value="news">📰 خبر</option><option value="law">⚖️ قانون / نص مؤطِّر</option><option value="circ">📄 مذكرة / تعميم</option>
          </select></div>
        <div className="field"><label>العنوان</label>
          <input type="text" ref={titleRef} placeholder="مثال: مذكرة وزارية حول مراقبة التغيبات" value={f.title} onChange={(e) => setF('title', e.target.value)} /></div>
      </div>
      <div className="field"><label>ملخص (اختياري)</label>
        <textarea style={{ minHeight: 70 }} placeholder="سطر أو سطران يلخصان الخبر أو النص القانوني..." value={f.text} onChange={(e) => setF('text', e.target.value)} /></div>
      <div className="row">
        <div className="field"><label>رابط المصدر (اختياري)</label>
          <input type="text" className="ltr" placeholder="https://..." value={f.url} onChange={(e) => setF('url', e.target.value)} /></div>
        <div className="field"><label>الجهة / المصدر (اختياري)</label>
          <input type="text" placeholder="مثال: وزارة التربية الوطنية" value={f.source} onChange={(e) => setF('source', e.target.value)} /></div>
      </div>
      <label className="chk"><input type="checkbox" checked={!!f.pinned} onChange={(e) => setF('pinned', e.target.checked)} /> 📌 تثبيت في أعلى القائمة</label>
      <DraftNote dirty={form.dirty} onDiscard={form.clear} />
      <div className="actions">
        <button className="btn" type="button" disabled={busy} onClick={onPublish}>{f.editId ? '💾 حفظ التعديل' : '💾 نشر'}</button>
        {f.editId && <button className="btn gray" type="button" onClick={form.clear}>إلغاء التعديل</button>}
      </div>
      <Msg m={msg} />
      <div className="table-scroll"><table>
        <thead><tr><th>#</th><th>النوع</th><th>العنوان</th><th>التاريخ</th><th>إجراءات</th></tr></thead>
        <tbody>
          {!items.length && <tr><td colSpan="5" className="empty">لا توجد عناصر منشورة.</td></tr>}
          {items.map((it, i) => (
            <tr key={it.id || i}>
              <td>{i + 1}</td>
              <td>{(it.pinned ? '📌 ' : '') + (NW_TYPES[it.type] || NW_TYPES.news)}</td>
              <td style={{ fontWeight: 700 }}>{it.title || ''}</td>
              <td>{it.date || '—'}</td>
              <td><div className="actions">
                <button type="button" className="btn ic gray" title="تقديم" disabled={busy} onClick={() => persist((c) => { moveNews(c, it.id, -1); }, '✅ تم تغيير الترتيب.')}>↑</button>
                <button type="button" className="btn ic gray" title="تأخير" disabled={busy} onClick={() => persist((c) => { moveNews(c, it.id, 1); }, '✅ تم تغيير الترتيب.')}>↓</button>
                <button type="button" className={'btn ic ' + (it.pinned ? 'amber' : 'gray')} title="تثبيت" disabled={busy} onClick={() => persist((c) => togglePin(c, it.id), '✅ تم تحديث التثبيت.')}>📌</button>
                {it.type !== 'google' && <button type="button" className="btn ic gray" title="تعديل" onClick={() => startEdit(it)}>✏️</button>}
                <button type="button" className="btn ic red" title="حذف" disabled={busy}
                  onClick={() => { if (window.confirm('حذف هذا العنصر؟')) persist((c) => removeNews(c, it.id), '✅ تم الحذف.'); }}>🗑</button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table></div>

      <hr className="nw-hr" />
      <h2>🌐 أخبار Google (جلب ثم مراجعة واعتماد)</h2>
      <div className="field"><label>الكلمات المفتاحية <span className="sub">(كلمة أو عبارة في كل سطر، حتى 8)</span></label>
        <textarea style={{ minHeight: 80 }} placeholder={'التوجيه المدرسي\nالإرشاد النفسي بالمدرسة\nوزارة التربية الوطنية مذكرة'} value={s.keywords} onChange={(e) => setS('keywords', e.target.value)} /></div>
      <div className="row">
        <div className="field"><label>عدد الأخبار لكل كلمة (1–10)</label>
          <input type="text" className="ltr" value={s.count} onChange={(e) => setS('count', e.target.value)} /></div>
        <div className="field"><label>عنوان وسيط مخصص (اختياري)</label>
          <input type="text" className="ltr" placeholder="https://my-worker.workers.dev/?url=" value={s.proxy} onChange={(e) => setS('proxy', e.target.value)} />
          <div className="hint">يُجرَّب أولاً إن وُجد، ثم وسطاء عامون. لا تنشر هنا أي مفاتيح سرية.</div></div>
      </div>
      <label className="chk"><input type="checkbox" checked={!!s.auto} onChange={(e) => setS('auto', e.target.checked)} /> 🔄 تحديث تلقائي يومي: تجلب الصفحة الرئيسية أخبار Google بنفسها مرة كل 24 ساعة وتعرضها فوراً بدون اعتماد (يتطلب كلمات مفتاحية ووسيطاً محفوظين).</label>
      <DraftNote dirty={st.dirty} onDiscard={st.clear} />
      <div className="actions">
        <button className="btn" type="button" disabled={fetching} onClick={onFetch}>🔎 جلب الأخبار الآن</button>
        <button className="btn gray" type="button" disabled={busy} onClick={onSaveKw}>💾 حفظ الإعدادات</button>
        {cands.length > 0 && <button className="btn amber" type="button" disabled={busy} onClick={() => approve(cands.slice())}>✅ اعتماد الكل</button>}
      </div>
      <Msg m={kwMsg} />
      <div>
        {cands.map((c) => (
          <div className="nw-c" key={c.url}>
            <div>
              <b>{c.title}</b>
              <small>{[c.source, c.date, '🔎 ' + c.kw].filter(Boolean).join(' · ')}</small>{' '}
              <a href={c.url} target="_blank" rel="noopener noreferrer">فتح الخبر ↗</a>
            </div>
            <div className="actions">
              <button type="button" className="btn sm" disabled={busy} onClick={() => approve([c])}>✅ اعتماد</button>
              <button type="button" className="btn sm gray" onClick={() => setCands((prev) => prev.filter((x) => x !== c))}>تجاهل</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
