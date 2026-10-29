// اختبار مطابقة: نشغّل كود الأخبار القديم (tests/fixtures/news.step8.js، نسخة المرحلة 8 المجمَّدة) في بيئة معزولة
// ونقارن نتائجه بنتائج src/news/newsFeed.js على نفس المدخلات: ترتيب القائمة، دمج الكلمات، الكاش، تحليل RSS.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { buildNewsList, loadAutoNews, autoSettings, NEWS_CACHE, NEWS_DAY } from '../src/news/newsFeed.js';
import { FakeParser, rssXml } from './helpers/fakeRss.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/news.step8.js', import.meta.url), 'utf8');
const plain = (x) => JSON.parse(JSON.stringify(x)); // يزيل فروق «العالَم» بين vm والاختبار

function legacyEnv({ cfg, cache, feeds }) {
  const store = cache ? { [NEWS_CACHE]: JSON.stringify(cache) } : {};
  const calls = [];
  const ctx = vm.createContext({
    SITE_CFG: { news: cfg },
    document: { getElementById: () => null, hidden: false },
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } },
    AbortController, DOMParser: FakeParser, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, console,
    fetch: async (url) => {
      const rss = decodeURIComponent(url.slice(cfg.proxy.length));
      const kw = decodeURIComponent(new URL(rss).searchParams.get('q'));
      calls.push(kw);
      const f = feeds[kw];
      if (f === 'throw') throw new Error('net');
      if (f === 'bad') return { ok: false };
      return { ok: true, text: async () => rssXml(f) };
    },
  });
  vm.runInContext(legacySrc, ctx);
  return { ctx, store, calls };
}

const feedOf = (prefix, n, extra = {}) => Array.from({ length: n }, (_, i) => ({
  title: `${prefix}${i + 1} - ${prefix}-src`, link: `https://${prefix}.ma/${i + 1}`, source: `${prefix}-src`, pubDate: `Wed, 2${i} Oct 2026 10:00:00 GMT`, ...extra,
}));

async function runNew({ cfg, cache, feeds }) {
  const store = cache ? { [NEWS_CACHE]: JSON.stringify(cache) } : {};
  const calls = [];
  const storage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } };
  const fetchFn = async (url) => {
    const rss = decodeURIComponent(url.slice(cfg.proxy.length));
    const kw = decodeURIComponent(new URL(rss).searchParams.get('q'));
    calls.push(kw);
    const f = feeds[kw];
    if (f === 'throw') throw new Error('net');
    if (f === 'bad') return { ok: false };
    return { ok: true, text: async () => rssXml(f) };
  };
  const res = await loadAutoNews(cfg, { storage, fetchFn, Parser: FakeParser });
  return { res, store, calls };
}

const PX = 'https://p.example/?u=';
const scenarios = {
  'جلب كلمتين بالتناوب': { cfg: { proxy: PX, keywords: ['أ', 'ب'], perKeyword: 3 }, feeds: { أ: feedOf('A', 5), ب: feedOf('B', 5) } },
  'عنوان مكرر بين الكلمتين': { cfg: { proxy: PX, keywords: ['أ', 'ب'], perKeyword: 4 }, feeds: { أ: feedOf('A', 4), ب: [...feedOf('A', 2), ...feedOf('B', 2)] } },
  'تجاوز الحد 24': { cfg: { proxy: PX, keywords: ['أ', 'ب', 'ج', 'د'], perKeyword: 10 }, feeds: { أ: feedOf('A', 10), ب: feedOf('B', 10), ج: feedOf('C', 10), د: feedOf('D', 10) } },
  'كلمة تفشل وأخرى تنجح': { cfg: { proxy: PX, keywords: ['أ', 'ب', 'ج'], perKeyword: 2 }, feeds: { أ: 'throw', ب: feedOf('B', 3), ج: 'bad' } },
  'عناصر بلا رابط صالح': { cfg: { proxy: PX, keywords: ['أ'], perKeyword: 5 }, feeds: { أ: [...feedOf('A', 2), { title: 'بلا رابط', link: '', source: 'x' }, { title: 'سيّئ', link: 'javascript:x', source: 'x' }] } },
};

for (const [name, sc] of Object.entries(scenarios)) {
  test(`مطابقة الجلب: ${name}`, async () => {
    const L = legacyEnv(sc);
    await L.ctx.nwAutoLoad();
    const legacyAuto = plain(vm.runInContext('_nwAuto', L.ctx));
    const N = await runNew(sc);
    assert.deepEqual(plain(N.res.items ?? []), legacyAuto);
    assert.deepEqual(N.calls, L.calls);
    const lc = L.store[NEWS_CACHE] && JSON.parse(L.store[NEWS_CACHE]);
    const nc = N.store[NEWS_CACHE] && JSON.parse(N.store[NEWS_CACHE]);
    assert.deepEqual(nc && { sig: nc.sig, items: nc.items }, lc && { sig: lc.sig, items: lc.items });
  });
}

test('مطابقة الكاش: طازج لا يجلب، قديم يجلب، توقيع مختلف يجلب', async () => {
  const cfg = { proxy: PX, keywords: ['أ'], perKeyword: 2 };
  const sig = autoSettings(cfg).sig;
  const feeds = { أ: feedOf('A', 3) };
  const cached = [{ type: 'google', title: 'مخزّن', url: 'https://c.ma', source: 's', date: '', auto: true }];
  for (const [label, cache, expectFetch] of [
    ['طازج', { t: Date.now() - 1000, sig, items: cached }, false],
    ['قديم', { t: Date.now() - NEWS_DAY - 1000, sig, items: cached }, true],
    ['توقيع مختلف', { t: Date.now(), sig: 'x', items: cached }, true],
  ]) {
    const L = legacyEnv({ cfg, cache, feeds });
    await L.ctx.nwAutoLoad();
    const N = await runNew({ cfg, cache, feeds });
    assert.equal(L.calls.length > 0, expectFetch, 'قديم/' + label);
    assert.equal(N.calls.length > 0, expectFetch, 'جديد/' + label);
    const legacyAuto = plain(vm.runInContext('_nwAuto', L.ctx));
    const newAuto = plain(N.res.items ?? (label === 'توقيع مختلف' ? [] : cached));
    if (label !== 'توقيع مختلف') assert.deepEqual(newAuto, legacyAuto, label);
  }
});

test('مطابقة الكاش: فشل الجلب مع كاش قديم يُبقي القديم في الحالتين', async () => {
  const cfg = { proxy: PX, keywords: ['أ'], perKeyword: 2 };
  const cached = [{ type: 'google', title: 'مخزّن', url: 'https://c.ma', source: 's', date: '', auto: true }];
  const cache = { t: 1, sig: autoSettings(cfg).sig, items: cached };
  const feeds = { أ: 'throw' };
  const L = legacyEnv({ cfg, cache, feeds });
  await L.ctx.nwAutoLoad();
  assert.deepEqual(plain(vm.runInContext('_nwAuto', L.ctx)), cached);
  const N = await runNew({ cfg, cache, feeds });
  assert.equal(N.res.items, null); // null = لا تغيير، فتبقى القيمة المعروضة من الكاش
});

test('مطابقة ترتيب القائمة على 200 إعداد عشوائي', () => {
  let x = 7;
  const rnd = () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
  const types = ['news', 'law', 'circ', 'google', undefined];
  for (let n = 0; n < 200; n++) {
    const items = Array.from({ length: Math.floor(rnd() * 12) }, () => ({
      type: types[Math.floor(rnd() * types.length)], title: rnd() < 0.1 ? '' : 'ع' + Math.floor(rnd() * 8), pinned: rnd() < 0.3,
    }));
    const auto = Array.from({ length: Math.floor(rnd() * 6) }, () => ({ type: 'google', title: 'ع' + Math.floor(rnd() * 10), auto: true }));
    const cfg = { items };
    const L = legacyEnv({ cfg: { ...cfg, proxy: PX }, feeds: {} });
    vm.runInContext('_nwAuto = ' + JSON.stringify(auto), L.ctx);
    assert.deepEqual(plain(buildNewsList(cfg, auto)), plain(L.ctx._nwBuild()), 'عيّنة ' + n);
  }
});
