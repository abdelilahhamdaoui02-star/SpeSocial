import test from 'node:test';
import assert from 'node:assert/strict';
import {
  safeUrl, badgeClass, badgeText, metaOf, buildNewsList, autoSettings, itemFromRss, mergeFeeds,
  parseRss, loadAutoNews, readCache, NEWS_CACHE, NEWS_DAY,
} from '../src/news/newsFeed.js';
import { FakeParser, rssXml } from './helpers/fakeRss.js';

test('safeUrl: http/https فقط', () => {
  assert.equal(safeUrl(' https://a.ma/x '), 'https://a.ma/x');
  assert.equal(safeUrl('HTTP://a.ma'), 'HTTP://a.ma');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('//a.ma'), '');
  assert.equal(safeUrl(null), '');
  assert.equal(safeUrl(undefined), '');
});

test('الشارة: التسمية والفئة والتثبيت والنوع المجهول', () => {
  assert.equal(badgeText({ type: 'law' }), 'قانون');
  assert.equal(badgeText({ type: 'circ', pinned: true }), '📌 مذكرة');
  assert.equal(badgeClass({ type: 'google' }), 't-google');
  assert.equal(badgeText({ type: 'xyz' }), 'خبر');
  assert.equal(badgeClass({ type: 'xyz' }), 't-news');
  assert.equal(badgeText({}), 'خبر');
  // أسماء خصائص الكائن لا تُعامل كأنواع
  assert.equal(badgeClass({ type: 'constructor' }), 't-news');
});

test('metaOf: المصدر والتاريخ', () => {
  assert.equal(metaOf({ source: 'هسبريس', date: '23/10/2026' }), 'هسبريس · 23/10/2026');
  assert.equal(metaOf({ date: 'x' }), 'x');
  assert.equal(metaOf({}), '');
});

test('autoSettings: التعطيل والحدود والتوقيع', () => {
  const base = { proxy: 'https://p.example/?u=', keywords: ['أ', ' ب ', '', 'ج'], perKeyword: 3 };
  assert.deepEqual(autoSettings(base), { px: 'https://p.example/?u=', kws: ['أ', 'ب', 'ج'], per: 3, sig: 'أ|ب|ج#3#https://p.example/?u=' });
  assert.equal(autoSettings({ ...base, auto: false }), null);
  assert.equal(autoSettings({ ...base, proxy: 'ftp://x' }), null);
  assert.equal(autoSettings({ ...base, keywords: [] }), null);
  assert.equal(autoSettings({ ...base, keywords: 'نص' }), null);
  assert.equal(autoSettings(undefined), null);
  assert.equal(autoSettings({ ...base, perKeyword: 99 }).per, 10);
  assert.equal(autoSettings({ ...base, perKeyword: 'x' }).per, 5);
  assert.equal(autoSettings({ ...base, keywords: Array.from({ length: 12 }, (_, i) => 'k' + i) }).kws.length, 8);
});

test('itemFromRss: قص اسم المصدر من العنوان والتاريخ غير الصالح', () => {
  const a = itemFromRss({ title: 'عنوان - هسبريس', source: 'هسبريس', link: 'https://h.ma/1', pubDate: 'Wed, 21 Oct 2026 10:00:00 GMT' });
  assert.equal(a.title, 'عنوان');
  assert.equal(a.source, 'هسبريس');
  assert.equal(a.type, 'google');
  assert.equal(a.auto, true);
  assert.notEqual(a.date, '');
  const b = itemFromRss({ title: 'عنوان', source: '', link: 'https://h.ma/2', pubDate: 'ليس تاريخاً' });
  assert.equal(b.source, 'Google News');
  assert.equal(b.date, '');
  assert.equal(itemFromRss({ title: 'x', source: 'S', link: '', pubDate: '' }).date, '');
});

test('mergeFeeds: تناوب بين الكلمات دون تكرار ويحترم الحد', () => {
  const L = (...t) => t.map((title) => ({ title }));
  assert.deepEqual(mergeFeeds([L('a1', 'a2', 'a3'), L('b1', 'a2', 'b3')]).map((x) => x.title), ['a1', 'b1', 'a2', 'a3', 'b3']);
  assert.deepEqual(mergeFeeds([]), []);
  assert.equal(mergeFeeds([Array.from({ length: 40 }, (_, i) => ({ title: 't' + i }))]).length, 24);
  assert.equal(mergeFeeds([L('a', 'b', 'c')], 2).length, 2);
});

test('parseRss: يتجاهل الأخطاء والعناصر بلا رابط صالح', () => {
  assert.deepEqual(parseRss('ليس XML', FakeParser), []);
  const xml = rssXml([
    { title: 'جيد - ص', link: 'https://x.ma/1', source: 'ص' },
    { title: 'بلا رابط', link: '', source: 'ص' },
    { title: 'رابط سيّئ', link: 'javascript:alert(1)', source: 'ص' },
  ]);
  const out = parseRss(xml, FakeParser);
  assert.equal(out.length, 1);
  assert.equal(out[0].title, 'جيد');
});

test('buildNewsList: المثبّت أولاً ثم الترتيب ثم Google ثم التلقائي دون تكرار', () => {
  const cfg = { items: [
    { type: 'news', title: 'ن1' }, { type: 'law', title: 'ق1', pinned: true }, { type: 'google', title: 'g1' },
    { type: 'circ', title: 'ن1' }, { title: '' }, null, { type: 'news', title: 'ن2', pinned: true },
  ] };
  const out = buildNewsList(cfg, [{ title: 'g1' }, { title: 'a1' }]);
  assert.deepEqual(out.map((x) => x.title), ['ق1', 'ن2', 'ن1', 'g1', 'a1']);
  assert.deepEqual(buildNewsList(undefined, undefined), []);
  assert.deepEqual(buildNewsList({}, []), []);
});

// ── loadAutoNews: سلوك الكاش والإلغاء (المقارنة الحرفية مع الكود القديم في news.parity.test.js) ──
const mkStorage = (init = {}) => {
  const m = { ...init };
  return { m, getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v; } };
};
const CFG = { proxy: 'https://p.example/?u=', keywords: ['تربية'], perKeyword: 2, auto: true };
const okFetch = (calls) => async (url) => {
  calls.push(url);
  return { ok: true, text: async () => rssXml([{ title: 'خبر 1 - م', link: 'https://m.ma/1', source: 'م' }, { title: 'خبر 2', link: 'https://m.ma/2', source: 'م' }, { title: 'خبر 3', link: 'https://m.ma/3', source: 'م' }]) };
};

test('loadAutoNews: معطّل ← لا جلب ولا كاش', async () => {
  const calls = [];
  const r = await loadAutoNews({ ...CFG, auto: false }, { storage: mkStorage(), fetchFn: okFetch(calls), Parser: FakeParser });
  assert.deepEqual(r, { items: [], source: 'off' });
  assert.equal(calls.length, 0);
});

test('loadAutoNews: جلب أول مرة ثم كاش طازج دون جلب', async () => {
  const calls = [];
  const storage = mkStorage();
  const t0 = 1_700_000_000_000;
  const r1 = await loadAutoNews(CFG, { storage, fetchFn: okFetch(calls), Parser: FakeParser, now: () => t0 });
  assert.equal(r1.source, 'network');
  assert.equal(r1.items.length, 2); // perKeyword = 2
  assert.equal(calls.length, 1);
  assert.equal(JSON.parse(storage.m[NEWS_CACHE]).t, t0);
  const seen = [];
  const r2 = await loadAutoNews(CFG, { storage, fetchFn: okFetch(calls), Parser: FakeParser, now: () => t0 + 1000, onCached: (x) => seen.push(x) });
  assert.equal(r2.source, 'cache');
  assert.equal(calls.length, 1);
  assert.equal(seen.length, 1);
});

test('loadAutoNews: كاش قديم يُعرض فوراً ثم يُستبدل بالجلب', async () => {
  const calls = [];
  const sig = autoSettings(CFG).sig;
  const old = [{ type: 'google', title: 'قديم', url: 'https://o.ma' }];
  const storage = mkStorage({ [NEWS_CACHE]: JSON.stringify({ t: 1, sig, items: old }) });
  const seen = [];
  const r = await loadAutoNews(CFG, { storage, fetchFn: okFetch(calls), Parser: FakeParser, now: () => 1 + NEWS_DAY + 5, onCached: (x) => seen.push(x) });
  assert.deepEqual(seen[0], old);
  assert.equal(r.source, 'network');
  assert.equal(calls.length, 1);
  assert.notEqual(r.items[0].title, 'قديم');
});

test('loadAutoNews: توقيع مختلف يتجاهل الكاش', async () => {
  const storage = mkStorage({ [NEWS_CACHE]: JSON.stringify({ t: Date.now(), sig: 'غير', items: [{ title: 'x' }] }) });
  assert.equal(readCache(storage, autoSettings(CFG).sig), null);
  const calls = [];
  const r = await loadAutoNews(CFG, { storage, fetchFn: okFetch(calls), Parser: FakeParser });
  assert.equal(r.source, 'network');
  assert.equal(calls.length, 1);
});

test('loadAutoNews: فشل كل الطلبات ← لا تغيير ولا كتابة كاش', async () => {
  const storage = mkStorage();
  const r = await loadAutoNews(CFG, { storage, fetchFn: async () => { throw new Error('net'); }, Parser: FakeParser });
  assert.deepEqual(r, { items: null, source: 'none' });
  assert.equal(NEWS_CACHE in storage.m, false);
  const r2 = await loadAutoNews(CFG, { storage, fetchFn: async () => ({ ok: false }), Parser: FakeParser });
  assert.equal(r2.source, 'none');
});

test('loadAutoNews: الإلغاء أثناء الجلب لا يكتب الكاش', async () => {
  const storage = mkStorage();
  const ctrl = new AbortController();
  const fetchFn = (url, { signal }) => new Promise((_, rej) => { signal.addEventListener('abort', () => rej(new Error('aborted'))); setTimeout(() => ctrl.abort(), 5); });
  const r = await loadAutoNews(CFG, { storage, fetchFn, Parser: FakeParser, signal: ctrl.signal });
  assert.deepEqual(r, { items: null, source: 'aborted' });
  assert.equal(NEWS_CACHE in storage.m, false);
});

test('loadAutoNews: تخزين غير متاح لا يكسر التدفق', async () => {
  const calls = [];
  const r = await loadAutoNews(CFG, { storage: null, fetchFn: okFetch(calls), Parser: FakeParser });
  assert.equal(r.source, 'network');
  const broken = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  const r2 = await loadAutoNews(CFG, { storage: broken, fetchFn: okFetch(calls), Parser: FakeParser });
  assert.equal(r2.source, 'network');
});
