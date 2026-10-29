import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminApi, memoryStore } from '../src/admin/adminApi.js';
import { sameValue, readDraft, writeDraft, clearDraft } from '../src/admin/draftStore.js';
import {
  parseSiteJson, namesFromCfg, applyNames, publishNotice, stopNotice, saveNewsItem, moveNews, removeNews,
  approveCandidates, newsData, validateNewsForm, userHint, validUsername, randomPwd, filterUsers,
  applyNewsSettings, newsSettingsFromCfg, EMPTY_NEWS_FORM,
} from '../src/admin/siteLogic.js';
import { MIN_DEFAULT, NW_MAX, NW_GOOGLE_MAX } from '../src/admin/adminConfig.js';

// ── خادم Firestore/Identity وهمي ──
function fakeServer({ siteJson = null, failGet = 0, ignorePatch = false, patchStatus = 200 } = {}) {
  const st = { site: siteJson, patches: [], gets: 0, failGet, extra: 'keep-me' };
  const res = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  const fetchImpl = async (url, opt = {}) => {
    const u = String(url), m = opt.method || 'GET';
    if (u.includes('signInWithPassword')) return res(200, { idToken: 'T', refreshToken: 'R', localId: 'admin1', expiresIn: '3600' });
    if (u.includes('securetoken')) return res(200, { id_token: 'T', refresh_token: 'R', user_id: 'admin1', expires_in: '3600' });
    if (u.includes('/documents/admins/')) return res(200, { fields: {} });
    if (u.includes('/documents/site_config/main')) {
      if (m === 'GET') {
        st.gets++;
        if (st.failGet > 0) { st.failGet--; return res(500, { error: { message: 'INTERNAL' } }); }
        return st.site === null ? res(404, { error: { message: 'NOT_FOUND' } }) : res(200, { fields: { json: { stringValue: st.site }, other: { stringValue: st.extra } } });
      }
      st.patches.push({ url: u, body: JSON.parse(opt.body) });
      if (patchStatus !== 200) return res(patchStatus, { error: { message: 'PERMISSION_DENIED' } });
      if (!ignorePatch) st.site = JSON.parse(opt.body).fields.json.stringValue;
      return res(200, {});
    }
    return res(404, {});
  };
  return { st, fetchImpl };
}
async function loggedIn(server) {
  const api = createAdminApi({ cfg: { apiKey: 'k', projectId: 'p' }, fetchImpl: server.fetchImpl, sessionStore: memoryStore() });
  await api.signIn('a@b.c', 'x'); await api.verifyAdmin();
  return api;
}

test('الحفظ يدمج مع آخر نسخة من الخادم ولا يمسح الإعدادات الأخرى', async () => {
  const server = fakeServer({ siteJson: JSON.stringify({ ministry: 'وزارة س', platform: 'منصة ص', news: { items: [{ id: 'n1', title: 'خبر' }] } }) });
  const api = await loggedIn(server);
  // الواجهة تعرض حالة قديمة، لكن الحفظ يقرأ الأحدث أولاً: الإشعار فقط يتغير
  await api.saveSite((c) => publishNotice(c, { title: 'ت', text: 'ن', level: 'warn' }));
  const saved = JSON.parse(server.st.site);
  assert.equal(saved.ministry, 'وزارة س');
  assert.equal(saved.platform, 'منصة ص');
  assert.equal(saved.news.items.length, 1);
  assert.equal(saved.notice.on, true);
});

test('حفظ الأسماء يُثبَّت ويُقرأ مجددًا كما كُتب (لا يعود للقديم)', async () => {
  const server = fakeServer({ siteJson: JSON.stringify({ ministry: '', platform: 'قديم' }) });
  const api = await loggedIn(server);
  const f = namesFromCfg({}); f.ministry = 'وزارة جديدة'; f.platform = 'منصة جديدة'; f.gates.interview = 'مقابلات';
  const { cfg } = await api.saveSite((c) => applyNames(c, f));
  assert.equal(cfg.ministry, 'وزارة جديدة');
  const again = await api.readSite();
  assert.equal(again.cfg.platform, 'منصة جديدة');
  assert.equal(again.cfg.gates.interview, 'مقابلات');
});

test('لا كتابة إطلاقًا إذا فشلت قراءة الإعدادات الحالية (حماية من المسح)', async () => {
  const server = fakeServer({ siteJson: JSON.stringify({ ministry: 'م' }), failGet: 1 });
  const api = await loggedIn(server);
  await assert.rejects(() => api.saveSite((c) => { c.platform = 'x'; }));
  assert.equal(server.st.patches.length, 0);
  assert.equal(JSON.parse(server.st.site).ministry, 'م');
});

test('وثيقة تالفة: يُرفض الحفظ بدل اعتبارها فارغة', async () => {
  const server = fakeServer({ siteJson: '{not json' });
  const api = await loggedIn(server);
  await assert.rejects(() => api.saveSite((c) => { c.platform = 'x'; }), /تالفة/);
  assert.equal(server.st.patches.length, 0);
});

test('إذا لم يُثبِّت الخادم الكتابة يظهر خطأ صريح بدل نجاح كاذب', async () => {
  const server = fakeServer({ siteJson: JSON.stringify({ platform: 'قديم' }), ignorePatch: true });
  const api = await loggedIn(server);
  await assert.rejects(() => api.saveSite((c) => { c.platform = 'جديد'; }), /لم يُثبَّت/);
});

test('رفض القواعد (403) يُرمى مع تلميح قاعدة site_config', async () => {
  const server = fakeServer({ siteJson: '{}', patchStatus: 403 });
  const api = await loggedIn(server);
  await assert.rejects(() => api.saveSite((c) => { c.platform = 'x'; }), /site_config/);
});

test('الوثيقة غير الموجودة (404) تُنشأ، والكتابة بقناع حقول محدد', async () => {
  const server = fakeServer({ siteJson: null });
  const api = await loggedIn(server);
  await api.saveSite((c) => { c.platform = 'أول مرة'; });
  assert.match(server.st.patches[0].url, /updateMask\.fieldPaths=json/);
  assert.equal(JSON.parse(server.st.site).platform, 'أول مرة');
});

test('حفظان متتاليان بسرعة لا يدوس أحدهما الآخر', async () => {
  const server = fakeServer({ siteJson: '{}' });
  const api = await loggedIn(server);
  await Promise.all([
    api.saveSite((c) => { c.platform = 'P'; }),
    api.saveSite((c) => { c.ministry = 'M'; }),
  ]);
  const s = JSON.parse(server.st.site);
  assert.equal(s.platform, 'P'); assert.equal(s.ministry, 'M');
});

// ── المسودات ──
function fakeStorage() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
test('المسودة تُحفظ وتُقرأ وتُمسح', () => {
  const s = fakeStorage();
  assert.equal(readDraft('names', s), null);
  writeDraft('names', { ministry: 'م', gates: { a: 'ب' } }, s);
  assert.deepEqual(readDraft('names', s), { ministry: 'م', gates: { a: 'ب' } });
  clearDraft('names', s); assert.equal(readDraft('names', s), null);
  assert.ok(sameValue({ a: 1 }, { a: 1 })); assert.ok(!sameValue({ a: 1 }, { a: 2 }));
});

// ── الأسماء والإشعار ──
test('applyNames: الاسم الافتراضي يُخزَّن فارغًا، والبوابات الفارغة تُحذف، والمجهولة تبقى', () => {
  const c = { gates: { interview: 'قديم', legacyGate: 'يبقى' } };
  applyNames(c, { ministry: MIN_DEFAULT, platform: '  منصة  ', gates: { interview: '', absence: ' غياب ' } });
  assert.equal(c.ministry, ''); assert.equal(c.platform, 'منصة');
  assert.deepEqual(c.gates, { legacyGate: 'يبقى', absence: 'غياب' });
  assert.equal(namesFromCfg({}).ministry, MIN_DEFAULT);
});
test('الميزاجور: نشر وإيقاف', () => {
  const c = {}; publishNotice(c, { title: ' ع ', text: 'ن', level: 'urgent' }, new Date(1000));
  assert.deepEqual([c.notice.on, c.notice.id, c.notice.title, c.notice.level], [true, '1000', 'ع', 'urgent']);
  stopNotice(c); assert.equal(c.notice.on, false);
});

// ── الأخبار ──
test('الأخبار: إضافة وتعديل وترتيب وحذف حسب المعرّف', () => {
  const c = {};
  saveNewsItem(c, { ...EMPTY_NEWS_FORM, title: 'أ' }, new Date(1));
  saveNewsItem(c, { ...EMPTY_NEWS_FORM, title: 'ب' }, new Date(2));
  assert.deepEqual(c.news.items.map((x) => x.title), ['ب', 'أ']);
  const idA = c.news.items[1].id;
  assert.equal(saveNewsItem(c, { ...EMPTY_NEWS_FORM, editId: idA, title: 'أ٢' }), 'edit');
  assert.equal(moveNews(c, idA, -1), true); assert.equal(c.news.items[0].title, 'أ٢');
  assert.equal(moveNews(c, idA, -1), false);
  removeNews(c, idA); assert.equal(c.news.items.length, 1);
  assert.throws(() => saveNewsItem(c, { ...EMPTY_NEWS_FORM, editId: 'nope', title: 'x' }), /لم يعد موجودًا/);
});
test('الأخبار: الحد الأقصى والتحقق', () => {
  const c = { news: { items: Array.from({ length: NW_MAX }, (_, i) => ({ id: 'n' + i, type: 'news' })) } };
  assert.throws(() => saveNewsItem(c, { ...EMPTY_NEWS_FORM, title: 'x' }), /الحد الأقصى/);
  assert.match(validateNewsForm({ title: '' }), /العنوان/);
  assert.match(validateNewsForm({ title: 'x', url: 'ftp://a' }), /http/);
  assert.equal(validateNewsForm({ title: 'x', url: 'https://a.b' }), '');
});
test('اعتماد أخبار Google يحترم حد 40 وحد 80', () => {
  const c = { news: { items: Array.from({ length: NW_GOOGLE_MAX }, (_, i) => ({ id: 'g' + i, type: 'google' })) } };
  approveCandidates(c, [{ title: 'جديد', url: 'https://x.y', source: '', date: '' }], 5000);
  const g = c.news.items.filter((x) => x.type === 'google');
  assert.equal(g.length, NW_GOOGLE_MAX); assert.equal(c.news.items[0].title, 'جديد'); assert.equal(c.news.items[0].source, 'Google News');
});
test('إعدادات الأخبار: تحويل ذهابًا وإيابًا', () => {
  const c = {}; applyNewsSettings(c, { keywords: ' أ \n\nب', count: '99', proxy: ' https://p/?url= ', auto: false });
  assert.deepEqual(c.news.keywords, ['أ', 'ب']); assert.equal(c.news.perKeyword, 5); assert.equal(c.news.auto, false);
  assert.deepEqual(newsSettingsFromCfg(c), { keywords: 'أ\nب', count: '5', proxy: 'https://p/?url=', auto: false });
  assert.deepEqual(newsData({}).items, []);
});

// ── الحسابات ──
test('أسماء الحسابات وكلمات المرور', () => {
  assert.ok(validUsername('abde05')); assert.ok(!validUsername('Admin')); assert.ok(!validUsername('admin')); assert.ok(!validUsername('a'));
  assert.match(userHint('abde05').text, /صالح/); assert.match(userHint('bad name').text, /⚠️/); assert.equal(userHint('').color, '');
  const pw = randomPwd({ getRandomValues: (a) => { a.fill(7); return a; } }); assert.equal(pw.length, 10);
  const list = filterUsers([{ username: 'b' }, { username: 'a' }, { username: 'ab' }], 'a');
  assert.deepEqual(list.map((u) => u.username), ['a', 'ab']);
  assert.deepEqual(parseSiteJson(''), {}); assert.deepEqual(parseSiteJson('[1]'), {});
});
