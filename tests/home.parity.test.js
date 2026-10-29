// اختبار مطابقة: نشغّل script-23.js القديم (نسخة المرحلة 6 المجمَّدة) في بيئة معزولة،
// ونقارن أرقام البطاقات ونص SVG المخطط الذي يرسمه بما تنتجه دوال src/home/homeStats.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { msUntilNextMidnight, KPI_SOURCES, computeMonth, buildChart, CHART, offsetTag, MONTHS, formatWeekRange } from '../src/home/homeStats.js';

const legacySrc = fs.readFileSync(new URL('./fixtures/script-23.step6.js', import.meta.url), 'utf8');

function makeData(seed) {
  let x = seed;
  const rnd = () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296; };
  const day = () => `2026-${String(8 + Math.floor(rnd() * 4)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 28)).padStart(2, '0')}`;
  const mk = (n, f) => Array.from({ length: n }, () => f(day()));
  return {
    interviewArchive: mk(Math.floor(rnd() * 30), (d) => ({ interviewDate: d + 'T10:00' })),
    reintegrationArchive: mk(Math.floor(rnd() * 12), (d) => ({ reintegrationDate: d })),
    absenceArchive: mk(Math.floor(rnd() * 40), (d) => ({ recordDate: d })),
    violenceArchive: mk(Math.floor(rnd() * 10), (d) => ({ reportDate: d })),
    workshopsArchive: mk(Math.floor(rnd() * 15), (d) => ({ date: d })),
    specialNeedsArchive: mk(Math.floor(rnd() * 8), (d) => (rnd() > 0.5 ? { date: d } : { recordDate: d })),
    vigilanceCases: mk(Math.floor(rnd() * 6), (d) => ({ date: d })),
    pdAssocArchive: mk(Math.floor(rnd() * 5), (d) => ({ date: d })),
    pdHealthArchive: mk(Math.floor(rnd() * 5), (d) => ({ date: d })),
    // سجلات بلا تاريخ صالح يجب تجاهلها في الحالتين
  };
}

function runLegacy(data, today, off) {
  const els = {};
  const el = (id) => (els[id] ??= { id, textContent: '', innerHTML: '', style: {}, classList: { _s: new Set(), add() {}, remove() {}, toggle(c, on) { on ? this._s.add(c) : this._s.delete(c); } } });
  class FixedDate extends Date { constructor(...a) { a.length ? super(...a) : super(today.getTime()); } }
  const win = { _hpOff: off, addEventListener() {} };
  const ctx = vm.createContext({
    window: win, Date: FixedDate, console, appData: data,
    document: { getElementById: el, body: { classList: { toggle() {} } } },
    MutationObserver: class { observe() {} },
  });
  vm.runInContext(legacySrc, ctx);
  win.hpRender();
  return els;
}

// يحوّل نموذج المخطط إلى نص SVG بنفس صياغة الكود القديم لمقارنته حرفياً
function modelToLegacyString(model) {
  const { W, H, L, R, T } = CHART;
  const { grid, weeks, ph } = buildChart(model);
  const F = 'style="font-family:Cairo,sans-serif"';
  let o = '';
  grid.forEach((g) => {
    o += `<line x1="${L}" x2="${W - R}" y1="${g.y}" y2="${g.y}" stroke="#e6ecf6" stroke-width="1"/>`;
    o += `<text x="${L - 8}" y="${g.y + 4}" text-anchor="end" font-size="12" fill="#6b7a99" ${F}>${g.value}</text>`;
  });
  o += `<line x1="${L}" x2="${L}" y1="${T}" y2="${T + ph}" stroke="#e6ecf6"/>`;
  weeks.forEach((w) => {
    if (w.isNow) o += `<rect x="${w.band.x}" y="${w.band.y}" width="${w.band.w}" height="${w.band.h}" rx="8" fill="#2f6fe4" opacity=".07"/>`;
    w.bars.forEach((b) => {
      o += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.r}" fill="${b.color}"><title>${b.title}</title></rect>`;
      if (b.showValue) o += `<text x="${b.x + b.w / 2}" y="${b.y - 4}" text-anchor="middle" font-size="${b.valueSize}" font-weight="800" fill="#1b2a4a" ${F}>${b.v}</text>`;
    });
    o += `<text x="${w.cx}" y="${H - 24}" text-anchor="middle" font-size="13" ${w.isNow ? 'font-weight="800" fill="#1f4fd8"' : 'fill="#44536f"'} ${F}>${w.title}</text>`;
    o += `<text x="${w.cx}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#7b88a6" ${F}>${w.range}</text>`;
  });
  return o;
}

const TODAYS = [new Date(2026, 9, 23), new Date(2026, 8, 1), new Date(2026, 10, 30), new Date(2027, 0, 5)];

for (const [ti, today] of TODAYS.entries()) {
  for (const off of [-3, -1, 0, 1, 2]) {
    for (const seed of [1, 7, 42]) {
      test(`مطابقة للقديم: today#${ti} off=${off} seed=${seed}`, () => {
        const data = makeData(seed);
        const legacy = runLegacy(data, today, off);
        const model = computeMonth(data, off, today);
        KPI_SOURCES.forEach((src, i) => {
          assert.equal(String(model.cols[i].month), String(legacy[src.id].textContent), src.id);
        });
        assert.equal(model.label, legacy.hpWeekLabel.textContent);
        assert.equal(offsetTag(off), legacy.hpWeekTag.textContent);
        assert.equal(modelToLegacyString(model), legacy.hpChart.innerHTML);
        assert.equal(model.grand === 0, legacy.hpChartWrap.classList._s.has('is-empty'));
      });
    }
  }
}

test('شهر بلا بيانات يعطي أصفاراً ورسماً فارغاً', () => {
  const m = computeMonth({}, 0, new Date(2026, 9, 23));
  assert.equal(m.grand, 0);
  assert.ok(m.cols.every((c) => c.month === 0));
});

test('مجموعات مفقودة أو غير مصفوفات لا تكسر الحساب', () => {
  const m = computeMonth({ interviewArchive: null, absenceArchive: 'x', violenceArchive: [null && 1, { reportDate: 5 }] }, 0, new Date(2026, 9, 23));
  assert.equal(m.grand, 0);
});

test('صياغة نص الأسبوع المحدد', () => {
  assert.equal(formatWeekRange('2026-10-19', '2026-10-25'), 'الاثنين 2026-10-19  →  الأحد 2026-10-25');
  assert.equal(formatWeekRange('', ''), '—');
});

test('أسماء الأشهر 12', () => assert.equal(MONTHS.length, 12));

test('الوقت حتى منتصف الليل التالي (يعبر حدود الشهر)', () => {
  assert.equal(msUntilNextMidnight(new Date(2026, 9, 23, 23, 59, 0)), 61000);
  assert.equal(msUntilNextMidnight(new Date(2026, 9, 31, 23, 0, 0)), 3601000);
});
