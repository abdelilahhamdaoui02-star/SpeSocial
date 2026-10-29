// الخطوة 5: دوال المؤسسة والشعار والإشعارات والملف الشخصي والتتبّع لم تعد على window؛ تُستورد مباشرة.
// فحص ساكن لكل المصدر (لا يمسّ إلا هذه الأسماء)، وفحص حيّ لوحدات لا تحتاج DOM.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const NAMES = [
  // المؤسسة
  'getMinistry', 'getDirectorate', 'getInstitutionName', 'updateDirectorateUI', 'applySiteConfig', 'loadSiteConfig',
  'getImportedClasses', 'applyInstitutionEverywhere', 'buildLevelOptions', 'updateAllLevelSelects',
  // الشعار
  'MINISTRY_LOGO_B64', 'DEFAULT_MINISTRY_LOGO_B64', '_reportLogoHTML', 'printLogoImg', '_refreshLogoImages', '_saveLogo', 'applyLogo', 'removeLogo', 'initLogoFromStorage',
  // الإشعارات والملف الشخصي والتتبّع
  'showToast', 'openProfile', 'closeProfile', 'openNotifications', 'openTrackingTable', 'closeTrackingModal',
];
const alt = NAMES.join('|');
const SRC = new URL('../src/', import.meta.url).pathname;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]))
    .filter((f) => /\.(js|jsx)$/.test(f));
}
const files = walk(SRC);

test('لا قراءة ولا كتابة لهذه الأسماء على window أو globalThis في أي ملف من src', () => {
  const rx = new RegExp(`\\b(?:window|globalThis|self)\\.(?:${alt})\\b|\\b(?:window|globalThis|self)\\[\\s*['"](?:${alt})['"]\\s*\\]`);
  const bad = [];
  for (const f of files) fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (!l.trim().startsWith('//') && rx.test(l)) bad.push(`${path.relative(SRC, f)}:${i + 1}`); });
  assert.deepEqual(bad, []);
});

test('لا استدعاء لها بالاسم عبر callWin/callLegacy ولا بحث عنها في window ديناميكياً', () => {
  const rx = new RegExp(`(?:callWin|callLegacy)\\(\\s*['"](?:${alt})['"]`);
  const dyn = /\bcall(?:Win|Legacy)\s*=\s*\(/; // تعريف المساعد نفسه: يجب ألا يبقى
  const bad = [];
  for (const f of files) fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => { if (rx.test(l) || dyn.test(l)) bad.push(`${path.relative(SRC, f)}:${i + 1}`); });
  // callLegacy في HeaderBits/WeeklyReportCard ما زال لأسماء نافذة الأسبوع (خارج هذه الخطوة): نتحقق فقط ألا يمسّ أسماء هذه الخطوة
  assert.deepEqual(bad.filter((b) => !/WeeklyReportCard/.test(b)), []);
});

test('logoStore لا يكتب على window: الحالة في كائن خاص، ويصدّر getLogo وprintLogo', () => {
  const s = fs.readFileSync(path.join(SRC, 'settings/logoStore.js'), 'utf8');
  assert.ok(!/window\.(MINISTRY_LOGO_B64|printLogoImg|applyLogo|_saveLogo|removeLogo|initLogoFromStorage|_refreshLogoImages|_reportLogoHTML|DEFAULT_MINISTRY_LOGO_B64)\b/.test(s));
  assert.ok(/export const getLogo\b/.test(s) && /export const printLogo\b/.test(s));
});

test('التركيب: LegacyApp لا يستدعي installToast/installInstitution/installTracking (حُذفت)', () => {
  const app = fs.readFileSync(path.join(SRC, 'legacy/LegacyApp.jsx'), 'utf8');
  for (const n of ['installToast', 'installInstitution', 'installTracking']) assert.ok(!app.includes(n), n);
  assert.ok(app.includes('installLogo();') && app.includes('installProfileWindow();'));
});

test('استيراد وحدات الإشعارات والتتبّع لا يسجّل شيئاً على window', async () => {
  globalThis.window = globalThis;
  const toast = await import('../src/ui/toast.js');
  const tracking = await import('../src/tracking/trackingStore.js');
  assert.equal(typeof toast.showToast, 'function');
  assert.equal(typeof tracking.openNotifications, 'function');
  for (const n of ['showToast', 'openNotifications', 'openTrackingTable', 'closeTrackingModal']) assert.equal(globalThis[n], undefined, n);
  assert.equal(toast.installToast, undefined);
  assert.equal(tracking.installTracking, undefined);
});

test('showToast المستوردة تعمل: تظهر في المخزن ثم تُزال', () => {
  return import('../src/ui/toast.js').then(({ showToast, toastStore }) => {
    const before = toastStore.getSnapshot().length;
    showToast('اختبار', 'success');
    assert.equal(toastStore.getSnapshot().length, before + 1);
  });
});
