
// ══════════════════════════════════════════════════════════════
//  🧭 رصد السلوك — دعم متعدد المستويات + الجدول الأسبوعي + خطة تدخل
// ══════════════════════════════════════════════════════════════
const BM_KEY = 'behaviorFiles';
const BM_CON = [['عراك أو دفع زميل','violence'],['ألفاظ مسيئة أو شتم','violence'],['سخرية أو تنمر على زميل','violence'],['رفع الصوت أو مشادة كلامية','interview'],['عزلة عن الأقران أثناء الاستراحة','vigilance'],['تأخر عن الدخول بعد الرنين','absence'],['التواجد خارج القسم أثناء الحصة','absence'],['محاولة الخروج من المؤسسة أو تسلق السور','vigilance'],['إتلاف ممتلكات أو تخريب','violence'],['عدم الامتثال لتوجيهات الحراسة','interview'],['اللعب العنيف أو الخطير','violence'],['حيازة أو استعمال مواد ممنوعة','vigilance'],['أخرى','interview']];
const BM_POS = ['اللعب الجماعي والتعاون مع الأقران','مساعدة زميل','حل خلاف بالحوار','الامتثال لتوجيهات الحراسة','الاعتذار أو المبادرة بالصلح','الدخول في الوقت بعد الرنين','المشاركة في أنشطة الساحة','أخرى'];
const BM_PORTALS = { interview:'المقابلة الفردية', violence:'العنف', absence:'الغياب', vigilance:'خلية اليقظة' };
const BM_STRAT = {
  'عراك أو دفع زميل': ['فصل مؤقت بين الطرفين ثم جلسة وساطة','إخبار الأسرة وتوثيق الواقعة في بوابة العنف','التنسيق مع الحراسة العامة لتكثيف المراقبة وقت الاستراحة'],
  'ألفاظ مسيئة أو شتم': ['تقدير فوري للغة المحترمة','حصة توضيحية لقواعد الاحترام','اتفاق مكتوب مع التلميذ(ة) على سلوك بديل'],
  'سخرية أو تنمر على زميل': ['لقاء فردي مع كل طرف على حدة','إشراكه في دور إيجابي ضمن أنشطة الساحة','المتابعة عبر بوابة العنف وإخبار الأسرة'],
  'رفع الصوت أو مشادة كلامية': ['تعليم عبارة بديلة للتعبير عن الغضب','تدريب على التنفس والعدّ قبل الرد','لقاء قصير لتجديد قواعد التواصل'],
  'عزلة عن الأقران أثناء الاستراحة': ['إشراكه في نشاط جماعي يحبه','ترشيح زميل داعم لمرافقته في الاستراحة','المتابعة عبر خلية اليقظة'],
  'تأخر عن الدخول بعد الرنين': ['مرافقته إلى الصف عند الرنين لمدة أسبوع','التواصل مع الأسرة حول وقت الحضور','تعزيز الدخول في الوقت'],
  'التواجد خارج القسم أثناء الحصة': ['إخبار الحراسة العامة والأستاذ(ة) بالواقعة في اليوم نفسه','لقاء فردي لمعرفة سبب مغادرة القسم','الاتفاق على إشارة لطلب استراحة قصيرة داخل القسم'],
  'محاولة الخروج من المؤسسة أو تسلق السور': ['إخبار الإدارة والأسرة فورًا','تكثيف المراقبة عند المداخل','ربط الملف بخلية اليقظة'],
  'إتلاف ممتلكات أو تخريب': ['المشاركة في إصلاح الضرر','التذكير بقواعد الممتلكات المشتركة'],
  'عدم الامتثال لتوجيهات الحراسة': ['الاتفاق مع الحراسة العامة على توجيه موحَّد وهادئ','تقدير الامتثال فورًا'],
  'اللعب العنيف أو الخطير': ['توجيهه إلى ألعاب منظَّمة وبدائل آمنة','تأطير لعبه بحضور راشد وقت الاستراحة'],
  'حيازة أو استعمال مواد ممنوعة': ['إخبار الإدارة والأسرة وفق المسطرة','إحالة الملف إلى خلية اليقظة']
};
const BM_STRAT_DEF = ['تعزيز إيجابي فوري عند السلوك المطلوب','لقاء أسبوعي قصير لمراجعة الجدول الأسبوعي','الاعتماد على نقاط القوة في المهام'];

function bmGet() { if (!Array.isArray(appData[BM_KEY])) appData[BM_KEY] = []; return appData[BM_KEY]; }
async function bmPersist() { return await saveUserKey(BM_KEY); }
function bmIso(d) { return d.toISOString().slice(0,10); }
function bmAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return bmIso(d); }
function bmOpts(arr) { return arr.map(v => '<option>' + vigEsc(v) + '</option>').join(''); }
function bmV(id) { const e = document.getElementById(id); return e ? e.value.trim() : ''; }
function bmRadio(n) { const e = document.querySelector('input[name="' + n + '"]:checked'); return e ? e.value : ''; }
function bmNz(v) { return String(v || '').replace(/[\s\-_–—]+/g, '').toUpperCase(); }
function bmRadios(id, name, items, onch) {
  const el = document.getElementById(id); if (!el) return;
  el.innerHTML = items.map(v => '<label><input type="radio" name="' + name + '" value="' + vigEsc(v) + '"' + (onch ? ' onchange="' + onch + '"' : '') + '> ' + vigEsc(v) + '</label>').join('');
}
function bmSetRadio(name, val) { document.querySelectorAll('input[name="' + name + '"]').forEach(r => r.checked = (r.value === val)); }
function bmBtn(label, fn) { return '<button type="button" onclick="' + fn + '" style="background:#f0fdf4;color:#166534;border:1.5px solid #bbf7d0;border-radius:20px;padding:3px 12px;font-family:\'Cairo\',sans-serif;font-size:0.74rem;font-weight:700;cursor:pointer;margin:2px;">' + vigEsc(label) + '</button>'; }
function bmSugBox(html) { return html ? '<div style="margin-top:6px;background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:8px 12px;font-size:0.76rem;color:#0369a1;"><strong>💡 اقتراح:</strong> ' + html + '</div>' : ''; }

let _bmWired = false;
function initBehavior() {
  const t = bmIso(new Date());
  const _ed = document.getElementById('bm_ev_date'); if (_ed && !_ed.value) _ed.value = bmLIso(new Date());
  const sc = document.getElementById('bm_school');
  if (sc && !sc.value && userProfile) sc.value = userProfile.institution || userProfile.school || '';
  _bmWeek = bmMonday();
  bmGridSelFill();
  bmFillLevels();
  if (typeof acSetup === 'function' && typeof AUTOCOMPLETE_FIELDS !== 'undefined') {
    const cfg = AUTOCOMPLETE_FIELDS.find(c => c.nameId === 'bm_name'); if (cfg) acSetup(cfg);
  }
  if (!_bmWired) {
    _bmWired = true;
    const nm = document.getElementById('bm_name');
    let tm = null;
    const reload = () => { clearTimeout(tm); tm = setTimeout(() => { bmFillStu(); bmLoadCurrent(); }, 250); };
    nm.addEventListener('input', reload); nm.addEventListener('change', reload); nm.addEventListener('blur', reload);
    document.getElementById('bmPicker').addEventListener('click', reload);
  }
  bmFillStu();
  bmLoadCurrent();
  bmRender();
}

// ── الربط بلائحة التلاميذ ──
function bmDbReady() { return typeof STUDENT_DB !== 'undefined' && Array.isArray(STUDENT_DB) && STUDENT_DB.length > 0; }
function bmWordKey(v) { return String(v || '').trim().replace(/\s+/g, ' ').replace(/[أإآا]/g,'ا').replace(/[ةه]/g,'ه').replace(/[يى]/g,'ي').toLowerCase().split(' ').filter(Boolean).sort().join(' '); }
function bmFindStudent() {
  if (!bmDbReady()) return null;
  const ms = bmV('bm_massar'), k = bmWordKey(bmV('bm_name'));
  if (!k && !ms) return null;
  if (ms) { const m = STUDENT_DB.find(s => s.massar && s.massar === ms && (!k || bmWordKey(s.fullName) === k)); if (m) return m; }
  const list = STUDENT_DB.filter(s => bmWordKey(s.fullName) === k);
  return list.length === 1 ? list[0] : (list.length > 1 && ms ? list.find(s => s.massar === ms) || null : null);
}
function bmFillLevels() {
  const sel = document.getElementById('bm_level'); if (!sel || !bmDbReady()) return;
  const cur = sel.value, seen = {}, vals = [];
  STUDENT_DB.forEach(s => { const c = cleanClassValue(s.class); if (c && !seen[bmNz(c)]) { seen[bmNz(c)] = 1; vals.push(c); } });
  vals.sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
  sel.innerHTML = '<option value="">— اختر القسم —</option>' + vals.map(v => '<option value="' + vigEsc(v) + '">' + vigEsc(v) + '</option>').join('');
  if (cur) { if (![...sel.options].some(o => o.value === cur)) sel.add(new Option(cur, cur)); sel.value = cur; }
}
function bmFillStu() {
  const sel = document.getElementById('bm_stu'); if (!sel) return;
  const lv = bmV('bm_level');
  if (!lv) { sel.innerHTML = '<option value="">— اختر القسم أولاً —</option>'; return; }
  const list = [];
  STUDENT_DB.forEach((s, i) => { if (bmNz(cleanClassValue(s.class)) === bmNz(lv)) list.push([i, s]); });
  const cur = bmFindStudent();
  sel.innerHTML = '<option value="">— ' + list.length + ' تلميذ(ة) في هذا القسم —</option>' + list.map(([i, s]) => {
    const f = bmGet().find(x => x.status !== 'أُغلق' && ((s.massar && x.massar === s.massar) || x.studentName === s.fullName));
    return '<option value="' + i + '"' + (cur && cur === s ? ' selected' : '') + '>' + (f ? '★ ' : '') + vigEsc(s.fullName) + '</option>';
  }).join('');
}
function bmPickStu() {
  const i = bmV('bm_stu'); if (i === '') return;
  const s = STUDENT_DB[+i]; if (!s) return;
  const cfg = AUTOCOMPLETE_FIELDS.find(c => c.nameId === 'bm_name');
  if (cfg) acFillField(cfg, s); else { document.getElementById('bm_name').value = s.fullName; document.getElementById('bm_massar').value = s.massar || ''; }
  bmLoadCurrent();
}
function bmFindCur() {
  const name = bmV('bm_name'), ms = bmV('bm_massar');
  if (!name && !ms) return null;
  return bmGet().find(f => f.status !== 'أُغلق' && ((ms && f.massar === ms) || (name && bmNz(f.studentName) === bmNz(name)))) || null;
}
function bmEnsureCur() {
  let f = bmFindCur(); if (f) return f;
  const name = bmV('bm_name');
  if (!name) { alert('⚠️ اختر التلميذ(ة) أولاً (اكتب الاسم أو اختر من القسم).'); return null; }
  if (bmDbReady()) {
    const st = bmFindStudent();
    if (!st) { alert('⚠️ هذا الاسم غير موجود في لائحة التلاميذ.\nاكتب أول حروف الاسم أو رقم مسار ثم اختر التلميذ(ة) من القائمة التي تظهر.'); return null; }
    const cfg = AUTOCOMPLETE_FIELDS.find(c => c.nameId === 'bm_name');
    if (cfg) acFillField(cfg, st);
  }
  const lv = bmV('bm_level');
  f = { id: Date.now(), studentName: name, massar: bmV('bm_massar') || '—', school: bmV('bm_school'), level: lv || '—', tier: bmTierGet('bm_tier') || '2',
        reason: bmV('bm_reason'), strengths: bmV('bm_strengths'), addedAt: bmIso(new Date()), status: 'متابعة', obs: [], gridRows: [], plan: null };
  bmGet().unshift(f); bmFillStu(); return f;
}
async function bmEnroll() {
  if (bmFindCur()) { alert('ℹ️ هذا التلميذ(ة) مُدرج فعلًا في قائمة المتابعة.'); return; }
  const f = bmEnsureCur(); if (!f) return;
  bmLoadCurrent(); bmRender(); await bmPersist();
}
function bmGoals(f) {
  const d = ['احترام قواعد الساحة','التعاون مع الأقران','الامتثال لتوجيهات الحراسة'];
  return [0,1,2].map(i => (f && f.plan && f.plan.goals && f.plan.goals[i]) || d[i]);
}
function bmFind(id) { return bmGet().find(x => String(x.id) === String(id)); }
function bmFillSelects() { bmFillStu(); }

function bmTierGet(name) { return Array.from(document.querySelectorAll('input[name="' + name + '"]:checked')).map(e => e.value).sort().join('+'); }
function bmTierSet(t) {
  const arr = String(t || '2').split('+');
  ['bm_tier', 'bm_pl_tier'].forEach(n => document.querySelectorAll('input[name="' + n + '"]').forEach(e => { e.checked = arr.includes(e.value); }));
}
function bmTierSync(name) { bmTierSet(bmTierGet(name) || '2'); bmTierSug(); }
function bmTierLbl(t) { return String(t).includes('+') ? 'المستويان 2 و3' : 'المستوى ' + t; }
function bmBadge() {
  const f = bmFindCur(), nm = bmV('bm_name');
  const b = document.getElementById('bmCurBadge');
  const st = bmFindStudent(), dbOk = bmDbReady();
  if (b) b.innerHTML = (nm && dbOk && !st)
    ? '<div style="font-size:0.78rem;color:#991b1b;background:#fef2f2;border:1.5px solid #fca5a5;border-radius:8px;padding:6px 12px;">❌ الاسم غير موجود في لائحة التلاميذ — اختر من القائمة المنسدلة.</div>' : '';
}
function bmLoadCurrent() {
  const f = bmFindCur();
  bmBadge();
  const p = (f && f.plan) || {}, g = p.goals || [];
  bmTierSet((f && f.tier) || bmTierGet('bm_tier') || '2');
  document.getElementById('bm_pl_goal').value = p.goal || '';
  [1,2,3].forEach(i => document.getElementById('bm_pl_g' + i).value = g[i-1] || '');
  document.getElementById('bm_pl_review').value = p.review || '';
  document.getElementById('bm_pl_strat').value = p.strategies || '';
  document.getElementById('bm_pl_resp').value = p.resp || '';
  document.getElementById('bm_pl_result').value = p.result || '';
  bmGridRender(); bmStratSug(); bmGoalSug(); bmTierSug(); bmEvRender();
}

// ── الجدول الأسبوعي ──
const BM_DAYS = ['الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
let _bmWeek = '';
let _bmSeq = 0;
function bmLIso(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function bmMonday(iso) {
  const p = iso ? iso.split('-').map(Number) : null;
  const d = p ? new Date(p[0], p[1]-1, p[2]) : new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return bmLIso(d);
}
function bmAddDays(iso, n) { const p = iso.split('-').map(Number); return bmLIso(new Date(p[0], p[1]-1, p[2] + n)); }
function bmWeekDates(w) { return BM_DAYS.map((_, i) => bmAddDays(w, i)); }
function bmFmt(iso) { const p = iso.split('-'); return p[2] + '/' + p[1]; }
function bmRowKey(r) { return r.kind + '|' + r.beh; }
function bmGridRows(f, w) {
  const rows = [], seen = {};
  const add = r => { const k = bmRowKey(r); if (!seen[k]) { seen[k] = 1; rows.push({ beh: r.beh, kind: r.kind }); } };
  ((f && f.gridRows) || []).forEach(add);
  if (f) { const ds = bmWeekDates(w); f.obs.filter(o => ds.includes(o.date)).forEach(o => add({ beh: o.beh, kind: o.kind })); }
  return rows;
}
function bmCellCount(f, date, r) { return f ? f.obs.filter(o => o.date === date && o.kind === r.kind && o.beh === r.beh).length : 0; }
function bmWeekCount(f, w, kind) {
  const ds = bmWeekDates(w);
  return f.obs.filter(o => ds.includes(o.date) && (!kind || o.kind === kind)).length;
}
function bmMarks(n) { return n <= 5 ? Array(n).fill('X').join(' ') : 'X×' + n; }

function bmGridRender() {
  const box = document.getElementById('bmGridBox'); if (!box) return;
  if (!_bmWeek) _bmWeek = bmMonday();
  const f = bmFindCur(), ds = bmWeekDates(_bmWeek), rows = bmGridRows(f, _bmWeek);
  window._bmGridRows = rows;
  const lab = document.getElementById('bm_week_label'); if (lab) lab.textContent = 'من ' + bmFmt(ds[0]) + ' إلى ' + bmFmt(ds[5]) + ' (' + ds[0].slice(0,4) + ')';
  const wd = document.getElementById('bm_week_date'); if (wd) wd.value = _bmWeek;
  if (!rows.length) {
    box.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:22px;font-size:0.84rem;">' + (bmV('bm_name') ? 'لا توجد سلوكات في الجدول بعد — أضف سلوكًا من الأسفل.' : 'اختر التلميذ(ة) أولاً ثم أضف السلوكات التي تريد رصدها.') + '</div>';
    bmGridSug(); return;
  }
  const tot = { con: ds.map(() => 0), pos: ds.map(() => 0) };
  const body = rows.map((r, ri) => {
    const rowTotal = ds.reduce((a, d) => a + bmCellCount(f, d, r), 0);
    const cells = ds.map((d, di) => {
      const n = bmCellCount(f, d, r); tot[r.kind][di] += n;
      return '<td class="bm-cell"><div class="bm-cell-in"><button type="button" class="bm-x ' + (n ? (r.kind === 'pos' ? 'on-pos' : 'on-con') : '') + '" onclick="bmMark(' + ri + ',' + di + ',1)" title="إضافة علامة">' + (n ? bmMarks(n) : '+') + '</button>' +
        (n ? '<button type="button" class="bm-m" onclick="bmMark(' + ri + ',' + di + ',-1)" title="حذف آخر علامة">−</button>' : '') + '</div></td>';
    }).join('');
    return '<tr><td class="bm-beh"><span class="bm-k" style="background:' + (r.kind === 'pos' ? '#16a34a' : '#dc2626') + ';"></span>' + vigEsc(r.beh) +
      (rowTotal === 0 ? '<button type="button" onclick="bmDelRow(' + ri + ')" title="إزالة السطر">✕</button>' : '') + '</td>' + cells + '<td><strong>' + rowTotal + '</strong></td></tr>';
  }).join('');
  const hasPos = rows.some(r => r.kind === 'pos'), hasCon = rows.some(r => r.kind === 'con');
  const foot = (hasCon ? '<tr><td class="bm-beh" style="color:#b91c1c;">مجموع السلوكات المقلقة</td>' + tot.con.map(v => '<td>' + v + '</td>').join('') + '<td>' + tot.con.reduce((a,b) => a+b, 0) + '</td></tr>' : '') +
    (hasPos ? '<tr><td class="bm-beh" style="color:#15803d;">مجموع السلوكات الإيجابية</td>' + tot.pos.map(v => '<td>' + v + '</td>').join('') + '<td>' + tot.pos.reduce((a,b) => a+b, 0) + '</td></tr>' : '');
  box.innerHTML = '<table class="bm-grid"><thead><tr><th>السلوك الملاحَظ</th>' + ds.map((d, i) => '<th>' + BM_DAYS[i] + '<small>' + bmFmt(d) + '</small></th>').join('') + '<th>المجموع</th></tr></thead><tbody>' + body + '</tbody><tfoot>' + foot + '</tfoot></table>';
  bmGridSug();
}
function bmGridSug() {
  const box = document.getElementById('bmGridSug'); if (!box) return;
  const f = bmFindCur(), rows = bmGridRows(f, _bmWeek), have = rows.map(bmRowKey);
  const freq = {}; (f ? f.obs : []).filter(o => o.kind === 'con').forEach(o => freq[o.beh] = (freq[o.beh] || 0) + 1);
  let list = Object.entries(freq).sort((a,b) => b[1] - a[1]).map(x => x[0]).filter(b => !have.includes('con|' + b)).slice(0, 4);
  let title = 'اقتراح: سلوكات سبق رصدها لهذا التلميذ(ة) — اضغط للإضافة إلى الجدول';
  if (!list.length && !rows.length) { list = ['عراك أو دفع زميل','ألفاظ مسيئة أو شتم','عزلة عن الأقران أثناء الاستراحة','تأخر عن الدخول بعد الرنين']; title = 'اقتراح: سلوكات شائعة للبدء — اضغط للإضافة إلى الجدول'; }
  if (!list.length) { box.innerHTML = ''; return; }
  window._bmGridSugList = list;
  box.innerHTML = '<div class="bm-tier-box" style="background:#f0fdf4;border-color:#bbf7d0;color:#166534;"><strong>💡 ' + title + ':</strong><br>' + list.map((b, i) => bmBtn(b, 'bmAddRowDirect(\'con\',' + i + ')')).join('') + '</div>';
}
function bmGridSelFill() {
  const sel = document.getElementById('bm_gsel'); if (!sel) return;
  const pos = (bmRadio('bm_gk') || 'con') === 'pos';
  sel.innerHTML = bmOpts(pos ? BM_POS : BM_CON.map(x => x[0]));
  bmGridOtherToggle();
}
function bmGridOtherToggle() {
  const w = document.getElementById('bm_gother_wrap'), sel = document.getElementById('bm_gsel');
  if (w && sel) w.style.display = sel.value === 'أخرى' ? '' : 'none';
}
async function bmPushRow(kind, beh) {
  const f = bmEnsureCur(); if (!f) return;
  if (!Array.isArray(f.gridRows)) f.gridRows = [];
  if (bmGridRows(f, _bmWeek).some(r => bmRowKey(r) === kind + '|' + beh)) { alert('ℹ️ هذا السلوك موجود فعلًا في الجدول.'); return; }
  f.gridRows.push({ beh, kind });
  bmGridRender(); bmBadge(); await bmPersist();
}
async function bmAddRow() {
  const kind = bmRadio('bm_gk') || 'con';
  let beh = bmV('bm_gsel'); if (!beh) { alert('⚠️ اختر السلوك.'); return; }
  if (beh === 'أخرى') { beh = bmV('bm_gother'); if (!beh) { alert('⚠️ صف السلوك كما رُصد.'); return; } }
  await bmPushRow(kind, beh);
  const o = document.getElementById('bm_gother'); if (o) o.value = '';
}
async function bmAddRowDirect(kind, i) { const b = (window._bmGridSugList || [])[i]; if (b) await bmPushRow(kind, b); }
async function bmDelRow(ri) {
  const r = (window._bmGridRows || [])[ri], f = bmFindCur(); if (!r || !f) return;
  f.gridRows = (f.gridRows || []).filter(x => bmRowKey(x) !== bmRowKey(r));
  bmGridRender(); await bmPersist();
}
async function bmMark(ri, di, delta) {
  const r = (window._bmGridRows || [])[ri]; if (!r) return;
  const date = bmWeekDates(_bmWeek)[di];
  const isNew = !bmFindCur();
  const f = bmEnsureCur(); if (!f) return;
  if (delta > 0) {
    const known = BM_CON.find(x => x[0] === r.beh);
    f.obs.push({ id: Date.now() * 100 + (++_bmSeq % 100), date, kind: r.kind, beh: r.beh, portal: r.kind === 'con' ? (known ? known[1] : 'interview') : '', place: '', sev: 1, by: '', ctx: '', src: 'grid' });
  } else {
    let idx = -1;
    for (let i = f.obs.length - 1; i >= 0; i--) { const o = f.obs[i]; if (o.src === 'grid' && o.date === date && o.kind === r.kind && o.beh === r.beh) { idx = i; break; } }
    if (idx < 0) { alert('ℹ️ لا توجد علامة مضافة من الجدول في هذه الخانة؛ الملاحظات القديمة تُحذف من قائمة المتابعة أسفل الصفحة.'); return; }
    f.obs.splice(idx, 1);
  }
  if (isNew) bmLoadCurrent(); else { bmGridRender(); bmStratSug(); bmGoalSug(); bmTierSug(); bmBadge(); }
  bmRender(); await bmPersist();
}
function bmWeekShift(n) { _bmWeek = bmAddDays(_bmWeek || bmMonday(), 7 * n); bmGridRender(); }
function bmWeekToday() { _bmWeek = bmMonday(); bmGridRender(); }
function bmWeekJump() { const v = bmV('bm_week_date'); if (v) { _bmWeek = bmMonday(v); bmGridRender(); } }

// ── التقييم السريع ──
const BM_EV_DIMS = [
  { k:'psy',  l:'🧠 النفسية',   items:['يبدو هادئًا ومرتاحًا','يبدو حزينًا أو منعزلًا','يبدو قلقًا أو متوترًا','سريع الانفعال','بكاء ظاهر'] },
  { k:'phy',  l:'💪 الجسدية',   items:['مظهر نظيف ومرتب','مظهر مهمل (ملابس/نظافة)','تعب أو إرهاق ظاهر','آثار إصابة أو كدمات ظاهرة','حركة وحيوية عادية'] },
  { k:'hea',  l:'🩺 الصحية',    items:['لا شكوى صحية','يشتكي من ألم','يتناول دواءً','غياب لأسباب صحية','يحتاج فحصًا طبيًا'] },
  { k:'beh',  l:'🧭 السلوكية',  items:['يحترم القواعد','يتجنب المواجهة','يدخل في خلافات مع الأقران','يرفض التوجيهات','ينعزل عن المجموعة'] },
  { k:'ver',  l:'🗣️ الكلامية',  items:['يتواصل بوضوح','قليل الكلام','ألفاظ مسيئة','نبرة مرتفعة','صعوبة في التعبير'] },
  { k:'edu',  l:'📚 التربوية',  items:['منتظم في الحضور','يتأخر عن الدخول','يشكو صعوبة في الدراسة','يفتقد الأدوات المدرسية','متحمس للدراسة'] }
];
const BM_EV_LV = [['0','عادي','🟢'],['1','يحتاج متابعة','🟡'],['2','مقلق','🔴']];
let _bmEvKey = '';
function bmEvToggle() {
  const b = document.getElementById('bmEvBody'), t = document.getElementById('bmEvToggle'); if (!b) return;
  const open = b.style.display === 'none'; b.style.display = open ? 'block' : 'none'; t.classList.toggle('open', open);
  if (open) bmEvRender();
}
function bmEvFind(f, date) { return f && Array.isArray(f.evals) ? f.evals.find(e => e.date === date) : null; }
function bmEvRender(force) {
  const body = document.getElementById('bmEvBody'); if (!body) return;
  const date = bmV('bm_ev_date'), key = bmNz(bmV('bm_name')) + '|' + date;
  if (!force && key === _bmEvKey && body.innerHTML) { bmEvSum(); return; }
  _bmEvKey = key;
  const ev = bmEvFind(bmFindCur(), date);
  body.innerHTML = BM_EV_DIMS.map(d => {
    const v = ev && ev.dims && ev.dims[d.k] || {};
    return '<div class="bm-ev-dim"><div class="bm-ev-t">' + d.l + '</div>' +
      '<div class="radio-group">' + BM_EV_LV.map(l => '<label><input type="radio" name="bm_ev_' + d.k + '" value="' + l[0] + '"' + (v.lv === l[0] ? ' checked' : '') + ' onchange="bmEvSum()"> ' + l[2] + ' ' + l[1] + '</label>').join('') + '</div>' +
      '<div class="radio-group">' + d.items.map(it => '<label><input type="checkbox" name="bm_ev_' + d.k + '_i" value="' + vigEsc(it) + '"' + ((v.items || []).includes(it) ? ' checked' : '') + '> ' + vigEsc(it) + '</label>').join('') + '</div>' +
      '<input type="text" id="bm_ev_' + d.k + '_n" placeholder="ملاحظة (اختياري)" value="' + vigEsc(v.note || '') + '"></div>';
  }).join('') +
  '<div class="form-group" style="margin-bottom:10px;"><label> ملاحظة عامة</label><textarea id="bm_ev_note" style="min-height:50px;" placeholder="انطباع عام موجز">' + vigEsc(ev ? (ev.note || '') : '') + '</textarea></div>' +
  '<div class="btn-row"><button class="btn btn-primary" onclick="bmEvSave()"> حفظ التقييم</button></div>';
  bmEvSum();
}
function bmEvSum() {
  const el = document.getElementById('bmEvSum'); if (!el) return;
  const c = { '0': 0, '1': 0, '2': 0 };
  BM_EV_DIMS.forEach(d => { const v = bmRadio('bm_ev_' + d.k); if (v !== '') c[v]++; });
  const saved = bmEvFind(bmFindCur(), bmV('bm_ev_date'));
  const n = c['0'] + c['1'] + c['2'];
  el.textContent = n ? ('🟢 ' + c['0'] + ' · 🟡 ' + c['1'] + ' · 🔴 ' + c['2']) + (saved ? ' — محفوظ' : '') : (saved ? 'محفوظ' : 'اضغط للتقييم');
}
function bmEvCollect() {
  const dims = {}; let n = 0;
  BM_EV_DIMS.forEach(d => {
    const lv = bmRadio('bm_ev_' + d.k);
    const items = Array.from(document.querySelectorAll('input[name="bm_ev_' + d.k + '_i"]:checked')).map(e => e.value);
    const note = bmV('bm_ev_' + d.k + '_n');
    if (lv !== '' || items.length || note) { dims[d.k] = { lv, items, note }; n++; }
  });
  return { dims, n };
}
async function bmEvSave() {
  const date = bmV('bm_ev_date'); if (!date) { alert('⚠️ حدّد التاريخ.'); return; }
  const { dims, n } = bmEvCollect();
  if (!n) { alert('⚠️ قيِّم بُعدًا واحدًا على الأقل.'); return; }
  const f = bmEnsureCur(); if (!f) return;
  if (!Array.isArray(f.evals)) f.evals = [];
  f.evals = f.evals.filter(e => e.date !== date);
  f.evals.push({ id: Date.now(), date, dims, note: bmV('bm_ev_note') });
  _bmEvKey = '';
  bmBadge(); bmEvRender(true); bmRender(); await bmPersist();
}
function bmEvLatest(f) { return f && Array.isArray(f.evals) && f.evals.length ? f.evals.slice().sort((a, b) => a.date < b.date ? 1 : -1)[0] : null; }
function bmEvLvName(v) { const l = BM_EV_LV.find(x => x[0] === v); return l ? l[2] + ' ' + l[1] : '—'; }
function bmEvListHtml(f) {
  const e = bmEvLatest(f); if (!e) return '';
  const flag = lv => BM_EV_DIMS.filter(d => e.dims[d.k] && e.dims[d.k].lv === lv).map(d => d.l.replace(/^\S+\s/, ''));
  const red = flag('2'), amb = flag('1');
  return '<div style="font-size:0.78rem;margin-top:6px;color:#334155;"><strong>⚡ آخر تقييم سريع (' + vigEsc(e.date) + '):</strong> ' +
    (red.length ? '<span style="color:#dc2626;">مقلق: ' + red.map(vigEsc).join('، ') + '</span> ' : '') +
    (amb.length ? '<span style="color:#d97706;">يحتاج متابعة: ' + amb.map(vigEsc).join('، ') + '</span>' : '') +
    (!red.length && !amb.length ? '<span style="color:#16a34a;">لا مؤشرات مقلقة</span>' : '') + '</div>';
}
function bmEvReportHtml(f) {
  const e = bmEvLatest(f); if (!e) return '';
  const rows = BM_EV_DIMS.filter(d => e.dims[d.k]).map(d => { const v = e.dims[d.k]; return '<tr><td>' + d.l.replace(/^\S+\s/, '') + '</td><td>' + bmEvLvName(v.lv) + '</td><td>' + vigEsc([].concat(v.items || [], v.note ? [v.note] : []).join(' — ') || '—') + '</td></tr>'; }).join('');
  return '<div class="report-section-title" style="font-size:10pt;">التقييم السريع (' + vigEsc(e.date) + ')</div><table class="wk-table-report"><thead><tr><th style="width:16%">البُعد</th><th style="width:18%">التقدير</th><th>الملاحظات</th></tr></thead><tbody>' + rows + '</tbody></table>' + (e.note ? '<div style="font-size:9pt;margin-bottom:8px;">ملاحظة عامة: ' + vigEsc(e.note) + '</div>' : '');
}

// ── اقتراحات مستوى الدعم ──
const BM_TIER_ACTIONS = {
  '2': ['لقاء أسبوعي قصير مع التلميذ(ة) لمراجعة الجدول الأسبوعي','اتفاق مع الأستاذ(ة) على سلوك بديل واضح وتعزيزه فورًا','تواصل دوري مع الأسرة وإخبارها بالتطور'],
  '3': ['وضع خطة تدخل فردية مكتوبة بهدف قابل للقياس وتاريخ مراجعة','لقاءات أسبوعية متعددة مع إشراك الأسرة والإدارة','النظر في الإحالة إلى خلية اليقظة أو بوابة المقابلات/العنف']
};
function bmTierAdvice(f, reasonTxt) {
  const why = []; let tier = '2';
  const hasData = f && f.obs.length;
  if (hasData) {
    const s = bmStats(f), cc = s.cc.length, pc = s.pc.length;
    const phys = s.cc.some(o => o.beh === 'عراك أو دفع زميل' || o.beh === 'اعتداء جسدي على زميل');
    const up = [];
    if (s.cc.some(o => o.sev === 3)) up.push('رُصدت واقعة بشدة 3 خلال 7 أيام');
    if (phys) up.push('رُصد عراك أو اعتداء جسدي');
    if (cc >= 8) up.push('عدد مرتفع من السلوكات المقلقة (' + cc + ' خلال 7 أيام)');
    if (cc >= 5 && pc >= 5) up.push('استمرار السلوكات المقلقة أسبوعين متتاليين (' + pc + ' ثم ' + cc + ')');
    if (f.tier === '2' && cc >= 4 && pc >= 4) up.push('لم يُحدث الدعم الموجَّه أثرًا بعد أسبوعين (' + pc + ' ثم ' + cc + ')');
    if (up.length) { tier = '3'; why.push(...up); }
    else if (f.tier === '3' && cc <= 1 && pc <= 1) { tier = '2'; why.push('تراجع واضح للسلوكات المقلقة (' + pc + ' ثم ' + cc + ') — يمكن التخفيف إلى دعم موجَّه'); }
    else {
      tier = '2';
      if (cc >= 3) why.push('تكرار متوسط للسلوكات المقلقة (' + cc + ' خلال 7 أيام) — دعم موجَّه كافٍ حاليًا');
      else if (cc === 0 && s.pos.length >= 3 && f.tier === '2') why.push('لا سلوك مقلق هذا الأسبوع و' + s.pos.length + ' سلوكات إيجابية — فكّر في إنهاء المتابعة قريبًا');
      else why.push('عدد محدود من السلوكات المقلقة (' + cc + ' خلال 7 أيام)');
    }
  } else {
    const t = reasonTxt || '';
    const hit = ['اعتداء','عنف','ضرب','إيذاء','تهديد','سلاح','خطير','شديد','إتلاف'].filter(w => t.includes(w));
    if (hit.length) { tier = '3'; why.push('ورد في سبب الإدراج ما يدل على خطورة: «' + hit.join('، ') + '»'); }
    else if (t) why.push('الوصف المدخل لا يشير إلى خطورة فورية — يُبدأ بدعم موجَّه ثم يُراجَع بعد أسبوع من الرصد');
    else why.push('لا معطيات كافية بعد — يُقترح البدء بالمستوى 2 ثم المراجعة بعد أسبوع من الرصد في الجدول');
  }
  return { tier, why };
}
function bmTierSug() {
  const f = bmFindCur(), a = bmTierAdvice(f, bmV('bm_reason'));
  const cur = String(f ? f.tier : (bmTierGet('bm_pl_tier') || '2'));
  const same = cur.split('+').includes(a.tier), multi = cur.includes('+');
  const names = { '2': 'المستوى 2 — دعم موجَّه', '3': 'المستوى 3 — دعم مكثف' };
  const html = '<div class="bm-tier-box"><strong>💡 المستوى المقترح: ' + names[a.tier] + '</strong>' +
    '<ul>' + a.why.map(w => '<li>' + vigEsc(w) + '</li>').join('') + '</ul>' +
    '<div><strong>إجراءات مناسبة:</strong></div><ul>' + BM_TIER_ACTIONS[a.tier].map(x => '<li>' + vigEsc(x) + '</li>').join('') + '</ul>' +
    (same ? '<span style="color:#166534;font-weight:700;">✔ ' + (multi ? 'هذا المستوى ضمن المستويين المعتمدين' : 'هذا هو المستوى المعتمد حاليًا') + '</span>' : bmBtn('اعتمد ' + names[a.tier].split(' — ')[0] + ' فقط', 'bmApplyTier(\'' + a.tier + '\')') + bmBtn('أضِف ' + names[a.tier].split(' — ')[0] + ' إلى المعتمد', 'bmApplyTier(\'' + a.tier + '\',true)')) +
    '</div>';
  ['bm_tier_sug', 'bm_pl_tier_sug'].forEach(id => { const e = document.getElementById(id); if (e) e.innerHTML = html; });
}
async function bmApplyTier(t, add) {
  const f = bmFindCur();
  const cur = String(f ? f.tier : (bmTierGet('bm_pl_tier') || '2'));
  const nt = add ? Array.from(new Set(cur.split('+').concat(t))).sort().join('+') : t;
  bmTierSet(nt);
  if (f) { f.tier = nt; bmRender(); await bmPersist(); }
  bmBadge(); bmTierSug();
}

// ── اقتراحات الأهداف القابلة للقياس ──
const BM_GOALS_SUG = {
  'عراك أو دفع زميل': 'انعدام أي عراك أو دفع في الساحة لمدة أسبوعين متتاليين',
  'ألفاظ مسيئة أو شتم': 'استعمال لغة محترمة مع الأقران 4 أيام من 5 خلال 3 أسابيع',
  'سخرية أو تنمر على زميل': 'انعدام حالات السخرية أو التنمر لمدة 3 أسابيع متتالية',
  'رفع الصوت أو مشادة كلامية': 'حل الخلافات بعبارة بديلة مهذبة في 4 مواقف من 5 خلال أسبوعين',
  'عزلة عن الأقران أثناء الاستراحة': 'المشاركة في لعبة جماعية واحدة على الأقل في 4 استراحات من 5 خلال أسبوعين',
  'تأخر عن الدخول بعد الرنين': 'الدخول إلى الصف مباشرة بعد الرنين 4 أيام من 5 خلال 3 أسابيع',
  'التواجد خارج القسم أثناء الحصة': 'انعدام التواجد خارج القسم أثناء الحصص لمدة 3 أسابيع',
  'محاولة الخروج من المؤسسة أو تسلق السور': 'انعدام محاولات الخروج من المؤسسة لمدة شهر',
  'إتلاف ممتلكات أو تخريب': 'انعدام حالات الإتلاف لمدة 3 أسابيع متتالية',
  'عدم الامتثال لتوجيهات الحراسة': 'الامتثال لتوجيهات الحراسة من أول مرة في 4 مواقف من 5 خلال أسبوعين',
  'اللعب العنيف أو الخطير': 'اللعب بأسلوب آمن في 4 استراحات من 5 خلال أسبوعين',
  'حيازة أو استعمال مواد ممنوعة': 'انعدام أي حيازة أو استعمال لمواد ممنوعة لمدة شهر'
};
const BM_GOALS_DEF = ['خفض السلوكات المقلقة الملاحظة في الساحة إلى أقل من 3 أسبوعيًا خلال 3 أسابيع','تسجيل 3 سلوكات إيجابية على الأقل أسبوعيًا خلال 3 أسابيع','تحقيق السلوكات المنتظرة في الاستراحات 4 أيام من 5 خلال أسبوعين'];
function bmGoalSug() {
  const box = document.getElementById('bm_pl_goal_sug'); if (!box) return;
  const f = bmFindCur(), list = [];
  const add = g => { if (g && !list.includes(g)) list.push(g); };
  if (f) {
    const s = bmStats(f), freq = {};
    f.obs.filter(o => o.kind === 'con').forEach(o => freq[o.beh] = (freq[o.beh] || 0) + 1);
    Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([beh]) => {
      const n = s.cc.filter(o => o.beh === beh).length;
      if (n >= 2) add('خفض عدد مرات «' + beh + '» من ' + n + ' إلى ' + Math.max(1, Math.floor(n / 2)) + ' أسبوعيًا خلال 3 أسابيع');
      add(BM_GOALS_SUG[beh]);
    });
  }
  BM_GOALS_DEF.forEach(add);
  window._bmGoalList = list.slice(0, 6);
  box.innerHTML = '<div style="margin-top:6px;background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:8px 12px;"><div style="font-size:0.74rem;font-weight:700;color:#0369a1;margin-bottom:4px;">💡 أهداف قابلة للقياس مقترحة (اضغط للاعتماد):</div>' + window._bmGoalList.map((g, i) => bmBtn(g, 'bmPickGoal(' + i + ')')).join('') + '</div>';
}
function bmPickGoal(i) { const g = (window._bmGoalList || [])[i]; if (g) document.getElementById('bm_pl_goal').value = g; }

// ── خطة التدخل + اقتراح استراتيجيات ──
function bmStratSug() {
  const f = bmFindCur(), box = document.getElementById('bm_pl_sug'); if (!box) return;
  const freq = {}; (f ? f.obs : []).filter(o => o.kind === 'con').forEach(o => freq[o.beh] = (freq[o.beh] || 0) + 1);
  const tops = Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
  let list = []; tops.forEach(b => (BM_STRAT[b] || []).forEach(s => { if (!list.includes(s)) list.push(s); }));
  if (!list.length) list = BM_STRAT_DEF;
  window._bmSug = list;
  box.innerHTML = '<div style="margin-top:6px;background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:10px;padding:8px 12px;"><div style="font-size:0.74rem;font-weight:700;color:#0369a1;margin-bottom:4px;">💡 استراتيجيات مقترحة' + (tops.length ? ' حسب أكثر السلوكيات تسجيلًا' : '') + ' (اضغط للإضافة):</div>' + list.map((s, i) => bmBtn(s, 'bmAddStrat(' + i + ')')).join('') + '</div>';
}
function bmAddStrat(i) {
  const ta = document.getElementById('bm_pl_strat'), s = (window._bmSug || [])[i]; if (!s) return;
  if (ta.value.split('\n').map(x => x.trim()).includes(s)) return;
  ta.value = (ta.value.trim() ? ta.value.trim() + '\n' : '') + s;
}
async function bmSavePlan() {
  const f = bmEnsureCur(); if (!f) return;
  f.tier = bmTierGet('bm_pl_tier') || f.tier;
  f.plan = { goal: bmV('bm_pl_goal'), goals: [1,2,3].map(i => bmV('bm_pl_g' + i)), review: bmV('bm_pl_review'), strategies: bmV('bm_pl_strat'), resp: bmV('bm_pl_resp'), result: bmV('bm_pl_result') };
  bmLoadCurrent(); bmRender(); await bmPersist();
  alert('✅ حُفظت الخطة.');
}
function bmOpen(id) {
  const f = bmGet().find(x => String(x.id) === String(id)); if (!f) return;
  document.getElementById('bm_name').value = f.studentName;
  document.getElementById('bm_massar').value = f.massar === '—' ? '' : f.massar;
  const lv = document.getElementById('bm_level'); if (lv && f.level && f.level !== '—') { if (![...lv.options].some(o => o.value === f.level)) lv.add(new Option(f.level, f.level)); lv.value = f.level; }
  bmFillStu(); bmLoadCurrent();
  document.getElementById('bmPicker').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function bmClose(id) {
  const f = bmFind(id); if (!f) return;
  if (!confirm('إنهاء متابعة «' + f.studentName + '»؟ يبقى الملف محفوظًا ويخرج من القوائم النشطة.')) return;
  f.status = 'أُغلق'; bmFillSelects(); bmRender(); await bmPersist();
}
async function bmReopen(id) { const f = bmFind(id); if (!f) return; f.status = 'متابعة'; bmFillSelects(); bmRender(); await bmPersist(); }
async function bmDelete(id) {
  const f = bmFind(id); if (!f) return;
  if (!confirm('حذف ملف «' + f.studentName + '» نهائيًا بكل ملاحظاته وخطته؟')) return;
  appData[BM_KEY] = bmGet().filter(x => String(x.id) !== String(id));
  bmFillSelects(); bmRender(); await bmPersist();
}
async function bmDelObs(fid, oid) {
  const f = bmFind(fid); if (!f || !confirm('حذف هذه الملاحظة؟')) return;
  f.obs = f.obs.filter(o => String(o.id) !== String(oid)); bmRender(); await bmPersist();
}

// ── الملخص الأسبوعي والتنبيهات ──
function bmStats(f) {
  const t = bmIso(new Date()), d7 = bmAgo(6), d14 = bmAgo(13);
  const cur = f.obs.filter(o => o.date >= d7 && o.date <= t);
  const prev = f.obs.filter(o => o.date >= d14 && o.date < d7);
  const cc = cur.filter(o => o.kind === 'con'), pc = prev.filter(o => o.kind === 'con');
  const freq = {}; cc.forEach(o => freq[o.beh] = (freq[o.beh] || 0) + 1);
  const top = Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, 3);
  const alerts = [], portals = new Set();
  if (cc.length >= 3) alerts.push('تكرار السلوكيات المقلقة (' + cc.length + ' خلال 7 أيام)');
  if (cc.some(o => o.sev === 3)) { alerts.push('ملاحظة بشدة 3 خلال الأسبوع'); portals.add('vigilance'); }
  if (cc.length >= 2 && cc.length > pc.length) alerts.push('ارتفاع مقارنة بالأسبوع الماضي (' + pc.length + ' ← ' + cc.length + ')');
  if (f.tier === '2' && cc.length >= 4 && pc.length >= 4) alerts.push('استمرار السلوكات المقلقة أسبوعين متتاليين (' + pc.length + ' ثم ' + cc.length + ') — فكّر في الانتقال إلى المستوى 3');
  if (f.plan && f.plan.review && f.plan.review <= t) alerts.push('حان موعد مراجعة الخطة (' + f.plan.review + ')');
  { const ev = (f.evals || []).filter(e => e.date >= d7 && e.date <= t).sort((a, b) => a.date < b.date ? 1 : -1)[0];
    if (ev) { const red = BM_EV_DIMS.filter(d => ev.dims[d.k] && ev.dims[d.k].lv === '2').map(d => d.l.replace(/^\S+\s/, ''));
      if (red.length >= 2) { alerts.push('تقييم سريع بتاريخ ' + ev.date + ': ' + red.length + ' أبعاد مقلقة (' + red.join('، ') + ')'); portals.add('vigilance'); } } }
  if (alerts.length) cc.forEach(o => { if (o.portal && (o.sev >= 2 || cc.length >= 3)) portals.add(o.portal); });
  return { cur, cc, pc, pos: cur.filter(o => o.kind === 'pos'), top, alerts, portals: Array.from(portals) };
}

function bmRender() {
  const all = bmGet();
  const act = all.filter(f => f.status !== 'أُغلق');
  const q = bmV('bmSearch');
  const withStats = act.map(f => [f, bmStats(f)]);
  const cnt = document.getElementById('bmCount'); if (cnt) cnt.textContent = act.length;
  const box = document.getElementById('bmList'); if (!box) return;
  const list = (withStats.concat(all.filter(f => f.status === 'أُغلق').map(f => [f, bmStats(f)]))).filter(x => !q || x[0].studentName.includes(q));
  if (!list.length) { box.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:22px;font-size:0.85rem;">لا يوجد تلاميذ في قائمة المتابعة بعد.</div>'; return; }
  box.innerHTML = list.map(([f, s]) => {
    const closed = f.status === 'أُغلق';
    const trend = s.cc.length - s.pc.length;
    const tr = trend > 0 ? '<span style="color:#dc2626;">↑ ' + trend + '</span>' : trend < 0 ? '<span style="color:#16a34a;">↓ ' + Math.abs(trend) + '</span>' : '<span style="color:#64748b;">= ثابت</span>';
    const recent = f.obs.slice().sort((a,b) => a.date < b.date ? 1 : -1).slice(0, 4).map(o =>
      '<div style="display:flex;gap:6px;align-items:center;font-size:0.76rem;padding:3px 0;border-bottom:1px dashed #e2e8f0;"><span style="color:' + (o.kind === 'pos' ? '#16a34a' : '#dc2626') + ';">' + (o.kind === 'pos' ? '＋' : '−') + '</span><span style="color:#64748b;">' + vigEsc(o.date) + '</span><span style="flex:1;">' + vigEsc(o.beh) + (o.place ? ' · ' + vigEsc(o.place) : '') + (o.kind === 'con' ? ' · شدة ' + o.sev : '') + '</span><button onclick="bmDelObs(' + f.id + ',' + o.id + ')" title="حذف" style="border:none;background:none;color:#dc2626;cursor:pointer;">✕</button></div>').join('');
    const al = s.alerts.length ? '<div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:8px;padding:8px 12px;margin-top:8px;font-size:0.78rem;color:#9a3412;line-height:1.8;"><strong>🔔 تنبيه:</strong> ' + s.alerts.map(vigEsc).join(' · ') +
      (s.portals.length ? '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;"><span>إحالة مقترحة:</span>' + s.portals.map(p => '<button onclick="openTool(\'' + p + '\')" style="background:#e08e0b;color:white;border:none;border-radius:6px;padding:2px 10px;font-family:\'Cairo\',sans-serif;font-size:0.74rem;font-weight:700;cursor:pointer;">' + BM_PORTALS[p] + '</button>').join('') + '</div>' : '') + '</div>' : '';
    return '<div style="border:1.5px solid ' + (closed ? '#e2e8f0' : '#cbd5e1') + ';border-radius:12px;padding:12px 14px;margin-bottom:10px;background:' + (closed ? '#f8fafc' : '#fff') + ';' + (closed ? 'opacity:0.75;' : '') + '">' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><strong style="font-size:0.95rem;">' + vigEsc(f.studentName) + '</strong><span style="font-size:0.75rem;color:#64748b;">' + vigEsc(f.level) + '</span>' +
      '<span style="background:' + (String(f.tier).includes('3') ? '#fef3c7;color:#92400e' : '#cffafe;color:#155e75') + ';border-radius:20px;padding:1px 10px;font-size:0.72rem;font-weight:800;">' + bmTierLbl(f.tier) + '</span>' + (closed ? '<span style="font-size:0.72rem;color:#64748b;">· أُغلقت المتابعة</span>' : '') + '</div>' +
      (f.reason ? '<div style="font-size:0.78rem;color:#475569;margin-top:4px;">' + vigEsc(f.reason) + '</div>' : '') +
      '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:0.8rem;margin-top:8px;"><span>مقلقة (7 أيام): <strong>' + s.cc.length + '</strong> ' + tr + '</span><span>إيجابية: <strong style="color:#16a34a;">' + s.pos.length + '</strong></span><span>علامات الجدول (هذا الأسبوع): <strong>' + bmWeekCount(f, bmMonday()) + '</strong></span>' + (s.top.length ? '<span>الأكثر تكرارًا: ' + s.top.map(t => vigEsc(t[0]) + ' (' + t[1] + ')').join('، ') + '</span>' : '') + '</div>' +
      bmEvListHtml(f) +
      (f.plan && f.plan.goal ? '<div style="font-size:0.78rem;margin-top:6px;color:#1e3a8a;"><strong>الهدف:</strong> ' + vigEsc(f.plan.goal) + (f.plan.review ? ' — المراجعة: ' + vigEsc(f.plan.review) : '') + '</div>' : '') +
      al + (recent ? '<div style="margin-top:8px;">' + recent + '</div>' : '') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;"><button onclick="bmOpen(' + f.id + ')" style="background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:8px;padding:5px 12px;font-family:\'Cairo\',sans-serif;font-size:0.76rem;font-weight:700;cursor:pointer;">✎ فتح الملف</button><button onclick="bmPrint(' + f.id + ')" style="background:#fee2e2;color:#991b1b;border:1px solid #fca5a5;border-radius:8px;padding:5px 12px;font-family:\'Cairo\',sans-serif;font-size:0.76rem;font-weight:700;cursor:pointer;">🖨️ طباعة</button>' +
      '<button onclick="bmWord(' + f.id + ')" style="background:#dbeafe;color:#1e40af;border:1px solid #93c5fd;border-radius:8px;padding:5px 12px;font-family:\'Cairo\',sans-serif;font-size:0.76rem;font-weight:700;cursor:pointer;">📄 Word</button>' +
      (closed ? '<button onclick="bmReopen(' + f.id + ')" style="background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:8px;padding:5px 12px;font-family:\'Cairo\',sans-serif;font-size:0.76rem;font-weight:700;cursor:pointer;">↺ إعادة فتح</button>' : '<button onclick="bmClose(' + f.id + ')" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:8px;padding:5px 12px;font-family:\'Cairo\',sans-serif;font-size:0.76rem;font-weight:700;cursor:pointer;">إنهاء المتابعة</button>') +
      '<button onclick="bmDelete(' + f.id + ')" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:8px;padding:5px 12px;font-family:\'Cairo\',sans-serif;font-size:0.76rem;font-weight:700;cursor:pointer;">🗑️ حذف</button></div></div>';
  }).join('');
}

// ── التقرير الأسبوعي (طباعة / Word) ──
function bmBuildReport(onlyId) {
  const files = bmGet().filter(f => onlyId ? String(f.id) === String(onlyId) : f.status !== 'أُغلق');
  if (!files.length) return '';
  const school = ((userProfile && userProfile.school) || getInstitutionName() || '').trim() || 'المؤسسة التعليمية';
  const spec = (userProfile && userProfile.fullName) ? userProfile.fullName : '';
  const logo = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? MINISTRY_LOGO_B64 : '';
  const d7 = bmAgo(6), t = bmIso(new Date());
  const blocks = files.map(f => {
    const s = bmStats(f);
    const obs = f.obs.filter(o => o.date >= d7 && o.date <= t).sort((a,b) => a.date < b.date ? -1 : 1);
    const rows = obs.length ? obs.map((o,i) => '<tr><td>' + (i+1) + '</td><td>' + vigEsc(o.date) + '</td><td>' + (o.kind === 'pos' ? 'إيجابي' : 'مقلق') + '</td><td>' + vigEsc(o.beh) + '</td><td>' + vigEsc(o.place || '—') + '</td><td>' + (o.kind === 'con' ? o.sev : '—') + '</td><td>' + vigEsc(o.by || '—') + '</td><td>' + vigEsc(o.ctx || '—') + '</td></tr>').join('') : '<tr><td colspan="8">لا ملاحظات خلال الأسبوع</td></tr>';
    const g = bmGoals(f);
    const p = f.plan || {};
    return '<div class="report-section-title">' + vigEsc(f.studentName) + ' — ' + vigEsc(f.level) + ' — ' + bmTierLbl(f.tier) + '</div>' +
      '<table class="wk-table-report"><thead><tr><th>ملاحظات مقلقة</th><th>ملاحظات إيجابية</th><th>الأسبوع الماضي (مقلقة)</th><th>علامات الجدول الأسبوعي (×)</th></tr></thead><tbody><tr><td>' + s.cc.length + '</td><td>' + s.pos.length + '</td><td>' + s.pc.length + '</td><td>' + bmWeekCount(f, _bmWeek || bmMonday()) + '</td></tr></tbody></table>' +
      '<table class="wk-table-report"><thead><tr><th>#</th><th>التاريخ</th><th>النوع</th><th>السلوك الملاحَظ</th><th>المكان</th><th>الشدة</th><th>الراصد</th><th>السياق</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      bmGridReportHtml(f, _bmWeek || bmMonday()) + bmEvReportHtml(f) +
      (p.goal || p.strategies ? '<table class="wk-table-report"><tbody><tr><th style="width:18%">الهدف</th><td>' + vigEsc(p.goal || '—') + '</td></tr><tr><th>الاستراتيجيات</th><td>' + vigEsc(p.strategies || '—').replace(/\n/g, ' • ') + '</td></tr><tr><th>المسؤولون</th><td>' + vigEsc(p.resp || '—').replace(/\n/g, ' • ') + '</td></tr><tr><th>المراجعة</th><td>' + vigEsc(p.review || '—') + (p.result ? ' — ' + vigEsc(p.result) : '') + '</td></tr></tbody></table>' : '');
  }).join('');
  return '<div class="new-report-header"><div class="nrh-logo">' + (logo ? '<img src="' + logo + '" alt="شعار الوزارة">' : '') + '</div><div class="nrh-dir">مديرية الحي الحسني</div><div class="nrh-school">' + vigEsc(school) + '</div><div class="nrh-title">التقرير الأسبوعي لرصد السلوك (' + d7 + ' → ' + t + ')</div></div>' +
    (spec ? '<div class="report-summary-block" style="text-align:center;">المختص(ة) الاجتماعي(ة): ' + vigEsc(spec) + '</div>' : '') + blocks +
    '<div class="sig-wrap"><div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div><div class="sig-block"><div class="sig-line"></div>الحارس العام</div><div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div></div>';
}

function bmGridReportHtml(f, w) {
  const rows = bmGridRows(f, w); if (!rows.length) return '';
  const ds = bmWeekDates(w);
  const body = rows.map(r => '<tr><td>' + vigEsc(r.beh) + (r.kind === 'pos' ? ' (إيجابي)' : '') + '</td>' + ds.map(d => { const n = bmCellCount(f, d, r); return '<td style="text-align:center;font-weight:800;">' + (n ? bmMarks(n) : '') + '</td>'; }).join('') + '<td style="text-align:center;font-weight:800;">' + ds.reduce((a, d) => a + bmCellCount(f, d, r), 0) + '</td></tr>').join('');
  return '<div class="report-section-title" style="font-size:10pt;">الجدول الأسبوعي (' + bmFmt(ds[0]) + ' ← ' + bmFmt(ds[5]) + ')</div><table class="wk-table-report"><thead><tr><th style="width:28%">السلوك الملاحَظ</th>' + ds.map((d, i) => '<th style="text-align:center;">' + BM_DAYS[i] + '<br>' + bmFmt(d) + '</th>').join('') + '<th style="text-align:center;">المجموع</th></tr></thead><tbody>' + body + '</tbody></table>';
}

function bmPrint(id) {
  const body = bmBuildReport(id);
  if (!body) { alert('لا توجد ملفات متابعة لإنشاء التقرير.'); return; }
  const css = `@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    @page { size: A4 landscape; margin: 0; } * { box-sizing: border-box; } html, body { margin: 0; }
    body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; color: #000; padding: 0 12mm; font-size: 10pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    table.pg { width: 100%; border-collapse: collapse; } table.pg > thead > tr > td, table.pg > tfoot > tr > td { padding: 0; border: 0; height: 9mm; } table.pg > tbody > tr > td { padding: 0; border: 0; }
    .nrh-logo { text-align: center; line-height: 0; } .nrh-logo img { width: 100%; max-height: 120px; object-fit: contain; }
    .nrh-dir, .nrh-school { text-align: center; font-weight: 700; font-size: 11pt; margin: 2px 0; }
    .nrh-title { text-align: center; font-weight: 900; font-size: 15pt; margin: 6px 0 4px; padding-top: 6px; border-top: 1.5px solid #000; }
    .report-section-title { font-weight: 800; font-size: 11pt; margin: 12px 0 6px; break-after: avoid; } .report-summary-block { text-align: center; font-size: 9.5pt; margin-bottom: 4px; }
    table.wk-table-report { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    table.wk-table-report th, table.wk-table-report td { border: 1px solid #000; padding: 4px 6px; font-size: 8.5pt; text-align: right; vertical-align: middle; }
    table.wk-table-report th { background: #d9d9d9; font-weight: 800; } table.wk-table-report thead { display: table-header-group; } table.wk-table-report tr { break-inside: avoid; }
    .sig-wrap { display: flex; justify-content: space-around; margin-top: 30px; break-inside: avoid; } .sig-block { text-align: center; font-weight: 700; font-size: 10pt; min-width: 160px; } .sig-line { height: 40px; border-bottom: 1.5px solid #000; margin-bottom: 6px; }`;
  vigPrintInFrame('bmPrintFrame', body, css);
}

async function bmWord(id) {
  const body = bmBuildReport(id);
  if (!body) { alert('لا توجد ملفات متابعة لإنشاء التقرير.'); return; }
  const host = document.createElement('div');
  host.id = 'bmReportContent'; host.setAttribute('data-landscape', '1');
  host.style.cssText = 'position:absolute;left:-99999px;top:0;width:1000px;';
  host.innerHTML = body; document.body.appendChild(host);
  try { await exportToWord('bmReportContent', 'تقرير_رصد_السلوك_' + bmIso(new Date())); }
  catch (e) { console.error(e); alert('تعذّر إنشاء ملف Word. حاول مرة أخرى.'); }
  finally { host.remove(); }
}
