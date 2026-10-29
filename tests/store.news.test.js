import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window = new EventTarget();
const { setBridge } = await import('../src/session/sessionBridge.js');
setBridge({ getAppData: () => ({}), getUser: () => 'u1', getProfile: () => ({}), getStudents: () => [] });
const { installStore, getState } = await import('../src/store/legacyStore.js');
const { getSessionStore } = await import('../src/session/sessionStore.js');
installStore();
const fire = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));

test('site-config يحفظ إعدادات الأخبار مع أسماء البوابات', () => {
  assert.deepEqual(getState().siteNews, {});
  fire('legacy:site-config', { gates: { portal1: 'س' }, news: { items: [{ title: 'ع' }], keywords: ['ك'] } });
  assert.deepEqual(getState().siteNews, { items: [{ title: 'ع' }], keywords: ['ك'] });
  assert.deepEqual(getState().siteGates, { portal1: 'س' });
});

test('وصول إعدادات مطابقة لا يغيّر المرجع (فلا يُعاد الجلب)', () => {
  const before = getState().siteNews;
  fire('legacy:site-config', { gates: {}, news: { items: [{ title: 'ع' }], keywords: ['ك'] } });
  assert.equal(getState().siteNews, before);
  fire('legacy:site-config', { gates: {}, news: { items: [{ title: 'ع' }, { title: 'ثان' }], keywords: ['ك'] } });
  assert.notEqual(getState().siteNews, before);
  assert.equal(getState().siteNews.items.length, 2);
});

test('حدث بلا news أو بقيمة غير كائن يعطي كائناً فارغاً', () => {
  fire('legacy:site-config', { gates: {} });
  assert.deepEqual(getState().siteNews, {});
  fire('legacy:site-config', { gates: {}, news: 'نص' });
  assert.deepEqual(getState().siteNews, {});
});

test('الخروج يُبقي إعدادات الأخبار (عامة)', () => {
  fire('legacy:site-config', { gates: {}, news: { items: [{ title: 'ع' }] } });
  getSessionStore().loggedOut();
  assert.equal(getState().ready, false);
  assert.deepEqual(getState().siteNews, { items: [{ title: 'ع' }] });
});
