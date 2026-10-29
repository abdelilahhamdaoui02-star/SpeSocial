import { nwUrl } from './siteLogic.js';

// جلب RSS عبر وسطاء (المتصفح لا يستطيع طلب Google News مباشرة بسبب CORS)
async function nwGet(url, fetchImpl) {
  const ctrl = new AbortController(), tm = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await (fetchImpl || globalThis.fetch.bind(globalThis))(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } finally { clearTimeout(tm); }
}

export function nwParse(xml, parser = new DOMParser()) {
  const d = parser.parseFromString(xml, 'text/xml');
  if (d.querySelector('parsererror')) throw new Error('XML');
  return Array.prototype.map.call(d.querySelectorAll('item'), (it) => {
    const g = (s) => { const e = it.querySelector(s); return e ? e.textContent.trim() : ''; };
    let title = g('title'); const src = g('source');
    if (src && title.slice(-(src.length + 3)) === ' - ' + src) title = title.slice(0, -(src.length + 3));
    return { title, url: g('link'), source: src, pub: g('pubDate') };
  }).filter((x) => x.title && nwUrl(x.url));
}

export async function nwFetchRss(kw, proxy, fetchImpl) {
  const rss = 'https://news.google.com/rss/search?q=' + encodeURIComponent(kw) + '&hl=ar&gl=MA&ceid=MA:ar';
  const tries = [];
  if (nwUrl(proxy)) tries.push(proxy.trim() + encodeURIComponent(rss));
  tries.push('https://api.allorigins.win/raw?url=' + encodeURIComponent(rss));
  tries.push('https://corsproxy.io/?' + encodeURIComponent(rss));
  for (const t of tries) {
    try { const list = nwParse(await nwGet(t, fetchImpl)); if (list.length) return list; } catch { /* نجرّب التالي */ }
  }
  try {
    const j = JSON.parse(await nwGet('https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rss), fetchImpl));
    if (j.items && j.items.length) return j.items.map((x) => ({ title: x.title, url: x.link, source: x.author || '', pub: x.pubDate })).filter((x) => nwUrl(x.url));
  } catch { /* نفشل بالرسالة أدناه */ }
  throw new Error('تعذّر جلب «' + kw + '» — جرّب لاحقًا أو أضف وسيطًا مخصصًا.');
}

// يرجع { cands, errs } بدون تكرار مع المنشور حاليًا
export async function fetchCandidates({ kws, per, proxy, existing, fetchImpl }) {
  const seen = {}; existing.forEach((x) => { seen[(x.title || '').trim()] = 1; if (x.url) seen[x.url] = 1; });
  const cands = [], errs = [];
  for (const kw of kws) {
    try {
      (await nwFetchRss(kw, proxy, fetchImpl)).slice(0, per).forEach((x) => {
        if (seen[x.title] || seen[x.url]) return;
        seen[x.title] = seen[x.url] = 1;
        let ds = ''; try { if (x.pub) ds = new Date(x.pub).toLocaleDateString('ar-MA'); } catch { /* تاريخ غير صالح */ }
        cands.push({ title: x.title, url: x.url, source: x.source, date: ds, kw });
      });
    } catch (e) { errs.push(e.message); }
  }
  return { cands, errs };
}
