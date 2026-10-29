// اختبار مطابقة الخطوة 47 (2): إرسال رمز الهاتف (dispatchOTP) وتصدير Excel الاحتياطي (pgExportXlsx) مقابل script-10 القديمة.
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, runLegacy } from './helpers/sessionEnv.js';
import { dispatchOTP, sendOTPViaWhatsApp, sendOTPViaSMS, normalizePhone, whatsappUrl, CALLMEBOT_APIKEY } from '../src/auth/otpDispatch.js';
import { pgExportXlsx, pgImgSize } from '../src/gates/pgExportXlsx.js';

const PHONES = ['0612345678', '+212 612-345-678', '212612345678', '06 12 34 56 78'];

for (const phone of PHONES) for (const net of ['ok', 'down']) {
  test(`dispatchOTP ${phone} الشبكة ${net}: النص والعنوان المطلوب يطابقان القديم`, async () => {
    const calls = { L: [], N: [] };
    const mkFetch = (arr) => async (url, opt) => { arr.push([url, JSON.stringify(opt)]); if (net === 'down') throw new Error('offline'); return {}; };
    const eL = makeEnv({}); const L = runLegacy(eL); L.ctx.fetch = mkFetch(calls.L);
    await L.ctx.dispatchOTP(phone, '123456', 'profileOTPCountdown');
    const eN = makeEnv({});
    await dispatchOTP(phone, '123456', 'profileOTPCountdown', { doc: eN.doc, fetch: mkFetch(calls.N) });
    assert.deepEqual(calls.N, calls.L);
    assert.equal(eN.els.profileOTPCountdown.snap(), eL.els.profileOTPCountdown.snap());
    assert.equal(eN.els.profileOTPCountdown.textContent.includes('واتساب'), net === 'ok');
    if (net === 'down') assert.ok(eN.els.profileOTPCountdown.innerHTML.includes('123456'));
  });
}

test('dispatchOTP بلا عنصر الحالة لا يرمي', async () => {
  const eN = makeEnv({});
  await dispatchOTP('0612345678', '111111', 'غير_موجود', { doc: eN.doc, fetch: async () => ({}) });
  await dispatchOTP('0612345678', '111111', 'غير_موجود', { doc: eN.doc, fetch: async () => { throw new Error('x'); } });
});

test('sendOTPViaSMS لم يُربَط بعد (يرجع فشلاً) كما كان', async () => {
  assert.deepEqual(await sendOTPViaSMS('0612345678', '1'), { channel: 'sms', success: false });
});

test('تطبيع الهاتف وعنوان CallMeBot', () => {
  assert.equal(normalizePhone('0612345678'), '212612345678');
  assert.equal(normalizePhone('+212 612-345-678'), '212612345678');
  const u = whatsappUrl('0612345678', '654321');
  assert.ok(u.startsWith('https://api.callmebot.com/whatsapp.php?phone=212612345678&text='));
  assert.ok(u.endsWith('&apikey=' + CALLMEBOT_APIKEY));
});

test('pgExportXlsx (المسار الاحتياطي بلا ExcelJS) يطابق القديم', async () => {
  const gate = { file: 'سجل', print: 'عنوان', fields: [{ k: 'a', l: 'العمود أ' }, { k: 'b', l: 'ب', t: 'area' }] };
  const rows = [{ a: '1', b: 'x' }, { a: '2' }];
  const run = async (kind) => {
    const out = [];
    const fakeX = {
      utils: { json_to_sheet: (r) => { out.push(['sheet', JSON.stringify(r)]); return {}; }, book_new: () => ({}), book_append_sheet: (wb, ws, n) => out.push(['append', n, JSON.stringify(wb.Workbook)]) },
      writeFile: (wb, f) => out.push(['write', f]),
    };
    if (kind === 'legacy') {
      const e = makeEnv({}); const L = runLegacy(e); L.ctx.XLSX = fakeX;
      await L.ctx.pgExportXlsx(gate, rows);
    } else {
      await pgExportXlsx(gate, rows, { win: { XLSX: fakeX }, doc: {}, profile: () => ({}) });
    }
    return out;
  };
  assert.deepEqual(await run('new'), await run('legacy'));
});

test('pgImgSize: بلا Image يرجع القياس الافتراضي، ومع Image يقرأ الأبعاد أو يرجع الافتراضي عند الخطأ', async () => {
  assert.deepEqual(await pgImgSize('x', {}), { w: 520, h: 97 });
  class Ok { set src(v) { this.naturalWidth = 300; this.naturalHeight = 60; setImmediate(() => this.onload()); } }
  class Bad { set src(v) { setImmediate(() => this.onerror()); } }
  assert.deepEqual(await pgImgSize('x', { Image: Ok }), { w: 300, h: 60 });
  assert.deepEqual(await pgImgSize('x', { Image: Bad }), { w: 520, h: 97 });
});
