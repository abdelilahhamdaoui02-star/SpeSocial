// منطق نقي لبطاقة «أخبار وقوانين المختصين» (منقول من كود script-10.js القديم، المرحلة 9).
// لا يستورد React ولا يلمس DOM إلا عبر معاملات تُمرَّر (Parser/fetchFn/storage) ليسهل اختباره.

export const NEWS_LABELS = { news: 'خبر', law: 'قانون', circ: 'مذكرة', google: 'Google' };
export const NEWS_MS = 5000;                 // مدة عرض كل خبر
export const NEWS_CACHE = 'site:gnews:v1';   // نفس مفتاح الكود القديم، فيبقى الكاش الموجود صالحاً
export const NEWS_DAY = 24 * 60 * 60 * 1000;
export const NEWS_AUTO_MAX = 24;             // أقصى عدد أخبار Google التلقائية
const FETCH_TIMEOUT = 15000;

const hasLabel = (type) => Object.prototype.hasOwnProperty.call(NEWS_LABELS, type);

// روابط http/https فقط (يمنع javascript: وغيره)
export function safeUrl(u) {
  const s = String(u == null ? '' : u).trim();
  return /^https?:\/\//i.test(s) ? s : '';
}

export const badgeClass = (item) => 't-' + (hasLabel(item.type) ? item.type : 'news');
export const badgeText = (item) => (item.pinned ? '📌 ' : '') + (hasLabel(item.type) ? NEWS_LABELS[item.type] : 'خبر');
export const metaOf = (item) => [item.source, item.date].filter(Boolean).join(' · ');

// القائمة المعروضة: اليدوية (المثبّتة أولاً) ثم عناصر Google المحفوظة ثم التلقائية، دون تكرار العنوان
export function buildNewsList(cfg, auto = []) {
  const c = cfg || {};
  const all = (c.items || []).filter((i) => i && i.title);
  const man = all.filter((i) => i.type !== 'google').map((x, i) => [x, i])
    .sort((a, b) => ((b[0].pinned ? 1 : 0) - (a[0].pinned ? 1 : 0)) || (a[1] - b[1])).map((x) => x[0]);
  const goo = all.filter((i) => i.type === 'google');
  const seen = new Set();
  const out = [];
  man.concat(goo, auto || []).forEach((i) => {
    const k = String(i.title || '').trim();
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(i);
  });
  return out;
}

// إعدادات الجلب التلقائي، أو null إن كان معطّلاً أو ناقصاً (لا وسيط / لا كلمات)
export function autoSettings(cfg) {
  const c = cfg || {};
  const px = safeUrl(c.proxy);
  const kws = (Array.isArray(c.keywords) ? c.keywords : []).map((s) => String(s).trim()).filter(Boolean).slice(0, 8);
  if (c.auto === false || !px || !kws.length) return null;
  const per = Math.min(10, Math.max(1, parseInt(c.perKeyword, 10) || 5));
  return { px, kws, per, sig: kws.join('|') + '#' + per + '#' + px };
}

// عنصر خبر من حقول عنصر RSS خام
export function itemFromRss({ title, source, link, pubDate }) {
  let t = title || '';
  const src = source || '';
  if (src && t.slice(-(src.length + 3)) === ' - ' + src) t = t.slice(0, -(src.length + 3));
  let date = '';
  if (pubDate) {
    const d = new Date(pubDate);
    if (!Number.isNaN(d.getTime())) date = d.toLocaleDateString('ar-MA');
  }
  return { type: 'google', title: t, url: link || '', source: src || 'Google News', date, auto: true };
}

// تحليل RSS؛ Parser افتراضياً DOMParser المتصفح
export function parseRss(xml, Parser = globalThis.DOMParser) {
  const doc = new Parser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) return [];
  return Array.prototype.map.call(doc.querySelectorAll('item'), (it) => {
    const g = (sel) => { const e = it.querySelector(sel); return e ? e.textContent.trim() : ''; };
    return itemFromRss({ title: g('title'), source: g('source'), link: g('link'), pubDate: g('pubDate') });
  }).filter((x) => x.title && safeUrl(x.url));
}

// دمج قوائم الكلمات بالتناوب (الأول من كل كلمة، ثم الثاني…) دون تكرار
export function mergeFeeds(lists, max = NEWS_AUTO_MAX) {
  const out = [];
  const seen = new Set();
  for (let i = 0; out.length < max; i++) {
    let any = false;
    lists.forEach((l) => {
      if (i < l.length) {
        any = true;
        const k = l[i].title;
        if (!seen.has(k) && out.length < max) { seen.add(k); out.push(l[i]); }
      }
    });
    if (!any) break;
  }
  return out;
}

export function readCache(storage, sig) {
  try {
    const c = JSON.parse(storage.getItem(NEWS_CACHE) || 'null');
    return c && c.sig === sig && Array.isArray(c.items) ? c : null;
  } catch (e) { return null; }
}

function writeCache(storage, value) {
  try { storage.setItem(NEWS_CACHE, JSON.stringify(value)); } catch (e) { /* التخزين ممتلئ أو ممنوع */ }
}

// جلب كل الكلمات بالتتابع عبر الوسيط. يعيد null إن أُلغي الطلب (signal)، وإلا مصفوفة (قد تكون فارغة).
export async function fetchAutoNews(settings, { fetchFn, Parser, signal, timeoutMs = FETCH_TIMEOUT }) {
  const lists = [];
  for (const kw of settings.kws) {
    if (signal && signal.aborted) return null;
    const ctrl = new AbortController();
    const onAbort = () => ctrl.abort();
    if (signal) signal.addEventListener('abort', onAbort);
    const tm = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const rss = 'https://news.google.com/rss/search?q=' + encodeURIComponent(kw) + '&hl=ar&gl=MA&ceid=MA:ar';
      const r = await fetchFn(settings.px + encodeURIComponent(rss), { signal: ctrl.signal });
      if (r.ok) lists.push(parseRss(await r.text(), Parser).slice(0, settings.per));
    } catch (e) {
      if (signal && signal.aborted) return null;
    } finally {
      clearTimeout(tm);
      if (signal) signal.removeEventListener('abort', onAbort);
    }
  }
  if (signal && signal.aborted) return null;
  return mergeFeeds(lists);
}

// التدفق الكامل: كاش صالح (يُعرض فوراً عبر onCached) ← إن مضى أكثر من 24 ساعة نجلب من جديد.
// items: مصفوفة جديدة للعرض، أو null = لا تغيير. source: 'off' | 'cache' | 'network' | 'none' | 'aborted'
export async function loadAutoNews(cfg, { storage, fetchFn, Parser, signal, now = Date.now, onCached } = {}) {
  const s = autoSettings(cfg);
  if (!s) return { items: [], source: 'off' };
  const c = storage ? readCache(storage, s.sig) : null;
  if (c) {
    if (onCached) onCached(c.items);
    if (now() - c.t < NEWS_DAY) return { items: c.items, source: 'cache' };
  }
  const out = await fetchAutoNews(s, { fetchFn, Parser, signal });
  if (out === null) return { items: null, source: 'aborted' };
  if (!out.length) return { items: null, source: 'none' };
  if (storage) writeCache(storage, { t: now(), sig: s.sig, items: out });
  return { items: out, source: 'network' };
}
