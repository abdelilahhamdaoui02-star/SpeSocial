// نسخة مجمَّدة من كود الأخبار القديم (script-10.js في المرحلة 8) — للمقارنة في tests/news.parity.test.js فقط.
// ══════ أخبار وقوانين المختصين (الصفحة الرئيسية) ══════
const _NW_LBL = { news: 'خبر', law: 'قانون', circ: 'مذكرة', google: 'Google' };
const _NW_MS = 5000, _NW_CACHE = 'site:gnews:v1', _NW_DAY = 24 * 60 * 60 * 1000;
let _nwIdx = 0, _nwTimer = null, _nwPaused = false, _nwList = [], _nwAuto = [], _nwBound = false, _nwLoading = false;
function _nwUrl(u) { u = String(u == null ? '' : u).trim(); return /^https?:\/\//i.test(u) ? u : ''; }
function _nwBuild() {
  const cfg = (SITE_CFG && SITE_CFG.news) || {};
  const all = (cfg.items || []).filter(i => i && i.title);
  const man = all.filter(i => i.type !== 'google').map((x, i) => [x, i])
    .sort((a, b) => ((b[0].pinned ? 1 : 0) - (a[0].pinned ? 1 : 0)) || (a[1] - b[1])).map(x => x[0]);
  const goo = all.filter(i => i.type === 'google');
  const seen = new Set(), out = [];
  man.concat(goo, _nwAuto).forEach(i => { const k = String(i.title || '').trim(); if (!k || seen.has(k)) return; seen.add(k); out.push(i); });
  return out;
}
function _nwProgRestart() {
  const pr = document.getElementById('hpNewsProg'); if (!pr) return;
  pr.style.animation = 'none'; void pr.offsetWidth; pr.style.animation = '';
  pr.parentNode.style.display = _nwList.length > 1 ? '' : 'none';
}
function _nwTick() {
  clearInterval(_nwTimer); _nwTimer = null;
  if (_nwList.length < 2) return;
  _nwTimer = setInterval(() => {
    if (_nwPaused || document.hidden) return;
    _nwIdx = (_nwIdx + 1) % _nwList.length; nwShow();
  }, _NW_MS);
}
function nwStep(d) { if (!_nwList.length) return; _nwIdx = (_nwIdx + d + _nwList.length) % _nwList.length; nwShow(); }
function nwShow() {
  const box = document.getElementById('hpNewsList'), ctl = document.getElementById('hpNewsTabs');
  if (!box || !ctl) return;
  box.innerHTML = ''; ctl.innerHTML = '';
  if (!_nwList.length) {
    const e = document.createElement('div'); e.className = 'hp-news-empty'; e.textContent = 'لا توجد مستجدات منشورة حالياً.'; box.appendChild(e);
    _nwProgRestart(); clearInterval(_nwTimer); return;
  }
  const it = _nwList[_nwIdx], url = _nwUrl(it.url), el = document.createElement(url ? 'a' : 'div');
  el.className = 'hp-news-item hp-news-slide';
  if (url) { el.href = url; el.target = '_blank'; el.rel = 'noopener noreferrer'; }
  const bd = document.createElement('span'); bd.className = 'hp-news-badge t-' + (_NW_LBL[it.type] ? it.type : 'news');
  bd.textContent = (it.pinned ? '📌 ' : '') + (_NW_LBL[it.type] || 'خبر');
  const body = document.createElement('div'); body.className = 'hp-news-body';
  const h = document.createElement('b'); h.textContent = it.title; body.appendChild(h);
  if (it.text) { const p = document.createElement('p'); p.textContent = it.text; body.appendChild(p); }
  const meta = [it.source, it.date].filter(Boolean).join(' · ');
  if (meta) { const s = document.createElement('small'); s.textContent = meta; body.appendChild(s); }
  el.appendChild(bd); el.appendChild(body); box.appendChild(el);
  if (_nwList.length > 1) {
    const mk = (txt, d, lbl) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'hp-news-nb'; b.textContent = txt; b.setAttribute('aria-label', lbl); b.onclick = () => { nwStep(d); _nwTick(); }; return b; };
    const cnt = document.createElement('span'); cnt.className = 'hp-news-cnt'; cnt.textContent = (_nwIdx + 1) + ' / ' + _nwList.length;
    ctl.appendChild(mk('›', -1, 'السابق')); ctl.appendChild(cnt); ctl.appendChild(mk('‹', 1, 'التالي'));
  }
  _nwProgRestart();
}
function renderHomeNews() {
  const card = document.getElementById('hpNewsCard'); if (!card) return;
  if (!_nwBound) {
    _nwBound = true;
    const setP = v => { _nwPaused = v; card.classList.toggle('paused', v); if (!v) { _nwProgRestart(); _nwTick(); } };
    card.addEventListener('mouseenter', () => setP(true)); card.addEventListener('mouseleave', () => setP(false));
    card.addEventListener('focusin', () => setP(true)); card.addEventListener('focusout', () => setP(false));
  }
  _nwList = _nwBuild();
  if (_nwIdx >= _nwList.length) _nwIdx = 0;
  nwShow(); _nwTick();
}
// ── جلب أخبار Google تلقائياً مرة كل 24 ساعة (عبر الوسيط المحفوظ في لوحة الأدمين) ──
function _nwParseRss(xml) {
  const d = new DOMParser().parseFromString(xml, 'text/xml');
  if (d.querySelector('parsererror')) return [];
  return Array.prototype.map.call(d.querySelectorAll('item'), it => {
    const g = s => { const e = it.querySelector(s); return e ? e.textContent.trim() : ''; };
    let title = g('title'); const src = g('source');
    if (src && title.slice(-(src.length + 3)) === ' - ' + src) title = title.slice(0, -(src.length + 3));
    let ds = ''; try { const p = g('pubDate'); if (p) ds = new Date(p).toLocaleDateString('ar-MA'); } catch (e) {}
    return { type: 'google', title: title, url: g('link'), source: src || 'Google News', date: ds, auto: true };
  }).filter(x => x.title && _nwUrl(x.url));
}
async function nwAutoLoad() {
  const cfg = (SITE_CFG && SITE_CFG.news) || {};
  const px = _nwUrl(cfg.proxy), kws = (cfg.keywords || []).map(s => String(s).trim()).filter(Boolean).slice(0, 8);
  if (cfg.auto === false || !px || !kws.length) { if (_nwAuto.length) { _nwAuto = []; renderHomeNews(); } return; }
  if (_nwLoading) return;
  const per = Math.min(10, Math.max(1, parseInt(cfg.perKeyword, 10) || 5));
  const sig = kws.join('|') + '#' + per + '#' + px;
  let c = null; try { c = JSON.parse(localStorage.getItem(_NW_CACHE) || 'null'); } catch (e) {}
  if (c && c.sig === sig && Array.isArray(c.items)) {
    _nwAuto = c.items; renderHomeNews();
    if (Date.now() - c.t < _NW_DAY) return;
  }
  _nwLoading = true;
  try {
    const lists = [];
    for (const kw of kws) {
      try {
        const rss = 'https://news.google.com/rss/search?q=' + encodeURIComponent(kw) + '&hl=ar&gl=MA&ceid=MA:ar';
        const ctrl = new AbortController(), tm = setTimeout(() => ctrl.abort(), 15000);
        const r = await fetch(px + encodeURIComponent(rss), { signal: ctrl.signal }); clearTimeout(tm);
        if (r.ok) lists.push(_nwParseRss(await r.text()).slice(0, per));
      } catch (e) {}
    }
    const out = [], seen = new Set();
    for (let i = 0; out.length < 24; i++) {
      let any = false;
      lists.forEach(l => { if (i < l.length) { any = true; const k = l[i].title; if (!seen.has(k) && out.length < 24) { seen.add(k); out.push(l[i]); } } });
      if (!any) break;
    }
    if (out.length) {
      _nwAuto = out; try { localStorage.setItem(_NW_CACHE, JSON.stringify({ t: Date.now(), sig: sig, items: out })); } catch (e) {}
      renderHomeNews();
    }
  } finally { _nwLoading = false; }
}
