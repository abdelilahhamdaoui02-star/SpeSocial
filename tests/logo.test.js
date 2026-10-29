// اختبار مطابقة المرحلة 15: نشغّل handleLogoUpload القديمة (المجمَّدة) ونقارن بـ processLogoFile الجديدة.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { processLogoFile, validateLogoFile, logoSize, keepsAlpha, logoView, LOGO_MSG } from '../src/settings/logoLogic.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/logo.step14.js', import.meta.url), 'utf8');

// بيئة مزيّفة مشتركة: تسجّل ما يُرسم على اللوحة وما يُنبَّه به
function makeEnv(file) {
  const log = { alerts: [], draws: [], canvases: [] };
  class FakeReader {
    readAsDataURL() { if (file.readError) this.onerror(); else this.onload({ target: { result: file.dataUrl } }); }
  }
  class FakeImage {
    set src(v) { this._src = v; if (file.badImage) this.onerror(); else { this.naturalWidth = file.dims[0]; this.naturalHeight = file.dims[1]; this.onload(); } }
  }
  const createCanvas = (w, h) => {
    const c = {
      width: w, height: h,
      getContext: () => ({
        set fillStyle(v) { log.draws.push(['fillStyle', v]); },
        fillRect: (...a) => log.draws.push(['fillRect', ...a]),
        drawImage: (_i, ...a) => log.draws.push(['drawImage', ...a]),
      }),
      toDataURL: (...a) => `OUT|${a.join(',')}|${c.width}x${c.height}`,
    };
    log.canvases.push(c);
    return c;
  };
  return { log, FakeReader, FakeImage, createCanvas };
}

async function runLegacy(file) {
  const e = makeEnv(file);
  const saved = [];
  const ctx = vm.createContext({
    FileReader: e.FakeReader, Image: e.FakeImage, __saved: saved, console,
    alert: (m) => e.log.alerts.push(m),
    document: { createElement: () => { const c = e.createCanvas(0, 0); return new Proxy(c, { set(t, k, v) { t[k] = v; return true; } }); } },
  });
  vm.runInContext(legacySrc, ctx);
  const input = { files: [file], value: 'x' };
  vm.runInContext('handleLogoUpload', ctx)(input);
  return { saved: saved[0] ?? null, log: e.log, inputValue: input.value };
}

async function runMine(file) {
  const e = makeEnv(file);
  const out = await processLogoFile(file, {
    FileReader: e.FakeReader, Image: e.FakeImage, alert: (m) => e.log.alerts.push(m),
    createCanvas: (w, h) => { const c = e.createCanvas(0, 0); c.width = w; c.height = h; return c; },
  });
  return { saved: out, log: e.log };
}

const mk = (type, size, dims, extra = {}) => ({ type, size, dims, dataUrl: `data:${type};base64,AAA`, ...extra });

const cases = {
  'نوع غير مدعوم': mk('image/gif', 1000, [10, 10]),
  'كبير جداً': mk('image/png', 9 * 1024 * 1024, [10, 10]),
  'SVG بلا تصغير': mk('image/svg+xml', 500, [0, 0]),
  'JPG عريض يُصغَّر': mk('image/jpeg', 2000, [2800, 1400]),
  'PNG عريض يحفظ الشفافية': mk('image/png', 2000, [3000, 1000]),
  'WEBP صغير': mk('image/webp', 2000, [300, 200]),
  'JPEG بعرض 1400 بالضبط': mk('image/jpeg', 2000, [1400, 900]),
  'فشل قراءة الملف': mk('image/png', 2000, [10, 10], { readError: true }),
  'تعذّر فتح الصورة': mk('image/png', 2000, [10, 10], { badImage: true }),
};

for (const [name, file] of Object.entries(cases)) {
  test(`مطابقة رفع الشعار: ${name}`, async () => {
    const old = await runLegacy(file);
    const mine = await runMine(file);
    assert.equal(mine.saved, old.saved);
    assert.deepEqual(mine.log.alerts, old.log.alerts);
    assert.deepEqual(mine.log.draws, old.log.draws);
    assert.equal(old.inputValue, '');
  });
}

test('تصغير الأبعاد والشفافية', () => {
  assert.deepEqual(logoSize(2800, 1400), { w: 1400, h: 700 });
  assert.deepEqual(logoSize(1400, 900), { w: 1400, h: 900 });
  assert.deepEqual(logoSize(1401, 1000), { w: 1400, h: 999 });
  assert.equal(keepsAlpha('image/png'), true);
  assert.equal(keepsAlpha('image/webp'), true);
  assert.equal(keepsAlpha('image/jpeg'), false);
});

test('التحقق من الملف', () => {
  assert.equal(validateLogoFile({ type: 'image/gif', size: 1 }), LOGO_MSG.badType);
  assert.equal(validateLogoFile({ type: 'image/jpeg', size: 8 * 1024 * 1024 }), null);
  assert.equal(validateLogoFile({ type: 'image/jpeg', size: 8 * 1024 * 1024 + 1 }), LOGO_MSG.tooBig);
});

test('عرض الشعار في الإعدادات (نصوص applyLogo القديمة)', () => {
  assert.deepEqual(logoView(null), { src: '', text: 'لم يتم رفع شعار بعد', custom: false, canRemove: false });
  assert.equal(logoView({ custom: true, src: 'x' }).text, '✅ شعار المؤسسة مُفعّل في التقارير');
  assert.equal(logoView({ custom: true, src: 'x' }).canRemove, true);
  const d = logoView({ custom: false, src: 'y' });
  assert.equal(d.text, 'الشعار الحالي: الافتراضي (الوزارة) — ارفع شعار مؤسستك لاستبداله');
  assert.equal(d.canRemove, false);
});

test('حدث الشعار يرسله logoStore (منذ المرحلة 34) والكود القديم لا يلمس عناصر الإعدادات', () => {
  const store = fs.readFileSync(new URL('../src/settings/logoStore.js', import.meta.url), 'utf8');
  const src = fs.readFileSync(new URL('./fixtures/legacy.script-10.step46.js', import.meta.url), 'utf8');
  assert.ok(store.includes("legacy:logo-changed"));
  for (const id of ['logoPreviewBox', 'logoStatusText', 'removeLogoBtn', 'logoUploadInput']) assert.ok(!src.includes(id), id);
  assert.ok(!src.includes('function handleLogoUpload'));
});
