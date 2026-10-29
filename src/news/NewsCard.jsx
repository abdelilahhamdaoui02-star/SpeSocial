import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSiteNews } from '../store/hooks.js';
import { useAutoNews } from './useAutoNews.js';
import { NEWS_MS, badgeClass, badgeText, buildNewsList, metaOf, safeUrl } from './newsFeed.js';

// هل التبويب مخفي؟ (يتوقف التمرير التلقائي حينها)
function usePageHidden() {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return hidden;
}

export function NewsSlide({ item }) {
  const url = safeUrl(item.url);
  const meta = metaOf(item);
  const Tag = url ? 'a' : 'div';
  const link = url ? { href: url, target: '_blank', rel: 'noopener noreferrer' } : {};
  return (
    <Tag className="hp-news-item hp-news-slide" {...link}>
      <span className={'hp-news-badge ' + badgeClass(item)}>{badgeText(item)}</span>
      <div className="hp-news-body">
        <b>{item.title}</b>
        {item.text ? <p>{item.text}</p> : null}
        {meta ? <small>{meta}</small> : null}
      </div>
    </Tag>
  );
}

// محتوى البطاقة (عرض فقط، مُصدَّر منفصلاً ليسهل اختباره). الحاوية .hp-news-card تبقى في HTML القديم.
export function NewsCardBody({ list, cur, onStep, epoch = 0 }) {
  const many = list.length > 1;
  return (
    <>
      <div className="hp-news-head">
        <div className="hp-chart-title">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2z" /><path d="M19 9h1a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2M8 9h7M8 13h7M8 16h4" /></svg>
          <span>أخبار وقوانين المختصين</span>
        </div>
        <div className="hp-news-tabs">
          {many && (
            <>
              <button type="button" className="hp-news-nb" aria-label="السابق" onClick={() => onStep(-1)}>›</button>
              <span className="hp-news-cnt">{`${cur + 1} / ${list.length}`}</span>
              <button type="button" className="hp-news-nb" aria-label="التالي" onClick={() => onStep(1)}>‹</button>
            </>
          )}
        </div>
      </div>
      <div className="hp-news-scroll">
        <div className="hp-news-list">
          {list.length
            ? <NewsSlide key={cur} item={list[cur]} />
            : <div className="hp-news-empty">لا توجد مستجدات منشورة حالياً.</div>}
        </div>
      </div>
      {/* تغيير key يعيد تشغيل أنيميشن الشريط (5 ثوانٍ) من الصفر */}
      <div className="hp-news-prog" style={many ? undefined : { display: 'none' }}><i key={`${cur}:${epoch}`} /></div>
    </>
  );
}

export default function NewsCard({ mount }) {
  const cfg = useSiteNews();
  const auto = useAutoNews(cfg);
  const list = useMemo(() => buildNewsList(cfg, auto), [cfg, auto]);
  const len = list.length;

  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const hidden = usePageHidden();
  const paused = hover || focus;
  const cur = idx < len ? idx : 0; // إن قصُرت القائمة نعود للأول

  // إيقاف مؤقت عند مرور الفأرة أو وجود تركيز داخل البطاقة؛ الحاوية من HTML القديم فنربط عليها أحداثاً أصلية
  useEffect(() => {
    if (!mount) return undefined;
    const pairs = [
      ['mouseenter', () => setHover(true)], ['mouseleave', () => setHover(false)],
      ['focusin', () => setFocus(true)], ['focusout', () => setFocus(false)],
    ];
    pairs.forEach(([n, h]) => mount.addEventListener(n, h));
    return () => pairs.forEach(([n, h]) => mount.removeEventListener(n, h));
  }, [mount]);

  // فئة paused على الحاوية يقرؤها CSS القديم لإيقاف شريط التقدّم
  useEffect(() => {
    if (!mount) return undefined;
    mount.classList.toggle('paused', paused);
    return () => mount.classList.remove('paused');
  }, [mount, paused]);

  // إعادة تشغيل الشريط عند الاستئناف أو تغيّر القائمة
  useEffect(() => { setEpoch((e) => e + 1); }, [paused, hidden, list]);

  // التمرير التلقائي: مؤقّت واحد لكل عنصر؛ يتوقف عند الإيقاف المؤقت أو إخفاء التبويب أو وجود عنصر واحد
  useEffect(() => {
    if (paused || hidden || len < 2) return undefined;
    const t = setTimeout(() => setIdx((i) => ((i < len ? i : 0) + 1) % len), NEWS_MS);
    return () => clearTimeout(t);
  }, [paused, hidden, len, cur, epoch]);

  const step = useCallback((d) => {
    if (!len) return;
    setIdx((i) => (((i < len ? i : 0) + d) % len + len) % len);
  }, [len]);

  if (!mount) return null;
  return createPortal(<NewsCardBody list={list} cur={cur} onStep={step} epoch={epoch} />, mount);
}
