import { MIN_DEFAULT, GATES, NW_MAX, NW_GOOGLE_MAX, USER_RE, RESERVED } from './adminConfig.js';

export const clone = (o) => JSON.parse(JSON.stringify(o));
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const dateAr = (d = new Date()) => d.toLocaleDateString('ar-MA');

// نص json المحفوظ ← كائن. النص التالف يُرمى (لا نعتبره فارغًا حتى لا نمسح الإعدادات).
export function parseSiteJson(raw) {
  if (!raw) return {};
  let p;
  try { p = JSON.parse(raw); } catch { throw new Error('إعدادات المنصة المحفوظة على الخادم تالفة — لن أكتب فوقها. أصلحها من Firebase Console.'); }
  return isObj(p) ? p : {};
}

// ── الأسماء ──
export function namesFromCfg(cfg) {
  const gates = {};
  GATES.forEach(([id]) => { gates[id] = ((cfg.gates || {})[id]) || ''; });
  return { ministry: cfg.ministry || MIN_DEFAULT, platform: cfg.platform || '', gates };
}
export function applyNames(cfg, f) {
  const g = isObj(cfg.gates) ? { ...cfg.gates } : {};
  GATES.forEach(([id]) => {
    const v = String((f.gates || {})[id] || '').trim();
    if (v) g[id] = v; else delete g[id];
  });
  const m = String(f.ministry || '').trim();
  cfg.ministry = (m && m !== MIN_DEFAULT) ? m : '';
  cfg.platform = String(f.platform || '').trim();
  cfg.gates = g;
}

// ── الميزاجور ──
export function noticeFromCfg(cfg) {
  const n = cfg.notice || {};
  return { title: n.title || '', text: n.text || '', level: n.level || 'info' };
}
export const validateNotice = (f) => (!String(f.title || '').trim() && !String(f.text || '').trim() ? '⚠️ اكتب عنوانًا أو نصًا.' : '');
export function publishNotice(cfg, f, now = new Date()) {
  cfg.notice = { on: true, id: String(now.getTime()), title: String(f.title || '').trim(), text: String(f.text || '').trim(), level: f.level || 'info', date: dateAr(now) };
}
export function stopNotice(cfg) { if (cfg.notice) cfg.notice.on = false; }

// ── الأخبار ──
export const nwUrl = (u) => { u = String(u || '').trim(); return /^https?:\/\//i.test(u) ? u : ''; };
export function newsData(cfg) {
  if (!isObj(cfg.news)) cfg.news = {};
  if (!Array.isArray(cfg.news.items)) cfg.news.items = [];
  if (!Array.isArray(cfg.news.keywords)) cfg.news.keywords = [];
  return cfg.news;
}
export const EMPTY_NEWS_FORM = { editId: null, type: 'news', title: '', text: '', url: '', source: '', pinned: false };
export function validateNewsForm(f) {
  if (!String(f.title || '').trim()) return '⚠️ العنوان إجباري.';
  const url = String(f.url || '').trim();
  if (url && !nwUrl(url)) return '⚠️ الرابط يجب أن يبدأ بـ http:// أو https://';
  return '';
}
// يعيد 'add' أو 'edit'، ويرمي عند بلوغ الحد
export function saveNewsItem(cfg, f, now = new Date()) {
  const n = newsData(cfg);
  const data = { type: f.type || 'news', title: f.title.trim(), text: String(f.text || '').trim(), url: String(f.url || '').trim(), source: String(f.source || '').trim(), pinned: !!f.pinned };
  if (f.editId) {
    const it = n.items.find((x) => x.id === f.editId);
    if (!it) throw new Error('العنصر الذي تعدّله لم يعد موجودًا (ربما حُذف).');
    Object.assign(it, data);
    return 'edit';
  }
  if (n.items.length >= NW_MAX) throw new Error('⚠️ بلغت الحد الأقصى (' + NW_MAX + ' عنصرًا). احذف بعض العناصر القديمة.');
  n.items.unshift({ ...data, id: 'n' + now.getTime(), date: dateAr(now) });
  return 'add';
}
export function moveNews(cfg, id, d) {
  const a = newsData(cfg).items, i = a.findIndex((x) => x.id === id), j = i + d;
  if (i < 0 || j < 0 || j >= a.length) return false;
  [a[i], a[j]] = [a[j], a[i]]; return true;
}
export function togglePin(cfg, id) { const it = newsData(cfg).items.find((x) => x.id === id); if (it) it.pinned = !it.pinned; }
export function removeNews(cfg, id) { const n = newsData(cfg); n.items = n.items.filter((x) => x.id !== id); }

export function approveCandidates(cfg, list, nowMs = Date.now()) {
  const n = newsData(cfg);
  list.forEach((c, k) => {
    n.items.unshift({ id: 'g' + (nowMs + k), type: 'google', title: c.title, text: '', url: c.url, source: c.source || 'Google News', date: c.date || dateAr(), pinned: false });
  });
  let g = 0; // الحد الأقصى لأخبار Google والإجمالي: يُحذف الأقدم
  n.items = n.items.filter((x) => { if (x.type !== 'google') return true; g++; return g <= NW_GOOGLE_MAX; });
  if (n.items.length > NW_MAX) n.items.length = NW_MAX;
}

export const parseKeywords = (text) => String(text || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 8);
export const parseCount = (v) => { const c = parseInt(v, 10); return (c >= 1 && c <= 10) ? c : 5; };
export function newsSettingsFromCfg(cfg) {
  const n = isObj(cfg.news) ? cfg.news : {};
  return { keywords: (Array.isArray(n.keywords) ? n.keywords : []).join('\n'), count: String(n.perKeyword || 5), proxy: n.proxy || '', auto: n.auto !== false };
}
export function validateNewsSettings(s) {
  const px = String(s.proxy || '').trim();
  return px && !nwUrl(px) ? '⚠️ عنوان الوسيط يجب أن يبدأ بـ https://' : '';
}
export function applyNewsSettings(cfg, s) {
  const n = newsData(cfg);
  n.keywords = parseKeywords(s.keywords); n.perKeyword = parseCount(s.count);
  n.proxy = String(s.proxy || '').trim(); n.auto = !!s.auto;
}

// ── الحسابات ──
export const validUsername = (s) => USER_RE.test(s) && RESERVED.indexOf(s) === -1;
export function userHint(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return { text: 'حروف إنجليزية صغيرة وأرقام فقط (2–30)، يُسمح بـ _ - .', color: '' };
  return validUsername(s) ? { text: '✅ اسم صالح', color: 'var(--ok)' } : { text: '⚠️ حروف إنجليزية وأرقام فقط، بدون مسافات أو رموز (وغير محجوز)', color: 'var(--warn)' };
}
export function randomPwd(cryptoImpl = globalThis.crypto) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(10); cryptoImpl.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}
export function filterUsers(users, q) {
  const s = String(q || '').trim().toLowerCase();
  return users.filter((u) => !s || u.username.toLowerCase().indexOf(s) !== -1).sort((a, b) => (a.username < b.username ? -1 : 1));
}
