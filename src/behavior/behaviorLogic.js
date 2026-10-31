// منطق بوابة «رصد السلوك» — دوال نقية (لا DOM ولا window ولا مخزن ولا alert).
// البنية الحالية للبوابة: معطيات التلميذ ← الجدول الأسبوعي ← التقييم النفسي ← جدول التدخل (إجراءات مقترحة).
// حُذف: مستوى الدعم، سبب الإدراج، نقاط القوة، وخطة التدخل السلوكي (الهدف/السلوكات المنتظرة/المراجعة...).
// الملفات القديمة المحفوظة قد تحتوي حقول tier/reason/strengths/plan: تبقى في البيانات دون أن تُعرض أو تُحذف.

export const BM_KEY = 'behaviorFiles';
const vigEsc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const BM_CON = [['عراك أو دفع زميل','violence'],['ألفاظ مسيئة أو شتم','violence'],['سخرية أو تنمر على زميل','violence'],['رفع الصوت أو مشادة كلامية','interview'],['عزلة عن الأقران أثناء الاستراحة','vigilance'],['تأخر عن الدخول بعد الرنين','absence'],['التواجد خارج القسم أثناء الحصة','absence'],['محاولة الخروج من المؤسسة أو تسلق السور','vigilance'],['إتلاف ممتلكات أو تخريب','violence'],['عدم الامتثال لتوجيهات الحراسة','interview'],['اللعب العنيف أو الخطير','violence'],['حيازة أو استعمال مواد ممنوعة','vigilance'],['أخرى','interview']];
export const BM_POS = ['اللعب الجماعي والتعاون مع الأقران','مساعدة زميل','حل خلاف بالحوار','الامتثال لتوجيهات الحراسة','الاعتذار أو المبادرة بالصلح','الدخول في الوقت بعد الرنين','المشاركة في أنشطة الساحة','أخرى'];
export const BM_PORTALS = { interview:'المقابلة الفردية', violence:'العنف', absence:'الغياب', vigilance:'خلية اليقظة' };

// الإجراءات المقترحة لكل سلوك مقلق (مصدر اقتراحات جدول التدخل)
export const BM_STRAT = {
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
export const BM_STRAT_DEF = ['تعزيز إيجابي فوري عند السلوك المطلوب','لقاء أسبوعي قصير لمراجعة الجدول الأسبوعي','الاعتماد على نقاط القوة في المهام'];

// جدول التدخل: المسؤولون وحالات التنفيذ
export const BM_IV_RESP = ['المختص الاجتماعي','الأستاذ(ة)','الحارس العام','الإدارة','الأسرة','خلية اليقظة'];
export const BM_IV_STATUS = ['مقترح','قيد التنفيذ','أُنجز'];

export const BM_DAYS = ['الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
export const BM_EV_DIMS = [
  { k:'psy',  l:'🧠 النفسية',   items:['يبدو هادئًا ومرتاحًا','يبدو حزينًا أو منعزلًا','يبدو قلقًا أو متوترًا','سريع الانفعال','بكاء ظاهر'] },
  { k:'phy',  l:'💪 الجسدية',   items:['مظهر نظيف ومرتب','مظهر مهمل (ملابس/نظافة)','تعب أو إرهاق ظاهر','آثار إصابة أو كدمات ظاهرة','حركة وحيوية عادية'] },
  { k:'hea',  l:'🩺 الصحية',    items:['لا شكوى صحية','يشتكي من ألم','يتناول دواءً','غياب لأسباب صحية','يحتاج فحصًا طبيًا'] },
  { k:'beh',  l:'🧭 السلوكية',  items:['يحترم القواعد','يتجنب المواجهة','يدخل في خلافات مع الأقران','يرفض التوجيهات','ينعزل عن المجموعة'] },
  { k:'ver',  l:'🗣️ الكلامية',  items:['يتواصل بوضوح','قليل الكلام','ألفاظ مسيئة','نبرة مرتفعة','صعوبة في التعبير'] },
  { k:'edu',  l:'📚 التربوية',  items:['منتظم في الحضور','يتأخر عن الدخول','يشكو صعوبة في الدراسة','يفتقد الأدوات المدرسية','متحمس للدراسة'] }
];
export const BM_EV_LV = [['0','عادي','🟢'],['1','يحتاج متابعة','🟡'],['2','مقلق','🔴']];

// ── التواريخ (bmIso بتوقيت UTC كما في القديم، وbmLIso بالتوقيت المحلي) ──
export function bmIso(d) { return d.toISOString().slice(0,10); }
export function bmAgo(n, now = new Date()) { const d = new Date(now.getTime()); d.setDate(d.getDate() - n); return bmIso(d); }
export function bmNz(v) { return String(v || '').replace(/[\s\-_–—]+/g, '').toUpperCase(); }
export const bmEsc = vigEsc;
export function bmLIso(d) { return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
export function bmMonday(iso, now = new Date()) {
  const p = iso ? iso.split('-').map(Number) : null;
  const d = p ? new Date(p[0], p[1]-1, p[2]) : new Date(now.getTime());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return bmLIso(d);
}
export function bmAddDays(iso, n) { const p = iso.split('-').map(Number); return bmLIso(new Date(p[0], p[1]-1, p[2] + n)); }
export function bmWeekDates(w) { return BM_DAYS.map((_, i) => bmAddDays(w, i)); }
export function bmFmt(iso) { const p = iso.split('-'); return p[2] + '/' + p[1]; }
export function bmRowKey(r) { return r.kind + '|' + r.beh; }
export function bmGridRows(f, w) {
  const rows = [], seen = {};
  const add = r => { const k = bmRowKey(r); if (!seen[k]) { seen[k] = 1; rows.push({ beh: r.beh, kind: r.kind }); } };
  ((f && f.gridRows) || []).forEach(add);
  if (f) { const ds = bmWeekDates(w); f.obs.filter(o => ds.includes(o.date)).forEach(o => add({ beh: o.beh, kind: o.kind })); }
  return rows;
}
export function bmCellCount(f, date, r) { return f ? f.obs.filter(o => o.date === date && o.kind === r.kind && o.beh === r.beh).length : 0; }
export function bmWeekCount(f, w, kind) {
  const ds = bmWeekDates(w);
  return f.obs.filter(o => ds.includes(o.date) && (!kind || o.kind === kind)).length;
}
export function bmMarks(n) { return n <= 5 ? Array(n).fill('X').join(' ') : 'X×' + n; }
export function bmWordKey(v) { return String(v || '').trim().replace(/\s+/g, ' ').replace(/[أإآا]/g,'ا').replace(/[ةه]/g,'ه').replace(/[يى]/g,'ي').toLowerCase().split(' ').filter(Boolean).sort().join(' '); }
// تاريخ بداية الرصد: الحقل الجديد، وإلا تاريخ الإدراج للملفات القديمة
export function bmStartOf(f) { return (f && (f.startDate || f.addedAt)) || ''; }

// ── التقييم النفسي (التقييم السريع سابقًا) ──
export function bmEvFind(f, date) { return f && Array.isArray(f.evals) ? f.evals.find(e => e.date === date) : null; }
export function bmEvLatest(f) { return f && Array.isArray(f.evals) && f.evals.length ? f.evals.slice().sort((a, b) => a.date < b.date ? 1 : -1)[0] : null; }
export function bmEvLvName(v) { const l = BM_EV_LV.find(x => x[0] === v); return l ? l[2] + ' ' + l[1] : '—'; }
export function bmEvListHtml(f) {
  const e = bmEvLatest(f); if (!e) return '';
  const flag = lv => BM_EV_DIMS.filter(d => e.dims[d.k] && e.dims[d.k].lv === lv).map(d => d.l.replace(/^\S+\s/, ''));
  const red = flag('2'), amb = flag('1');
  return '<div style="font-size:0.78rem;margin-top:6px;color:#334155;"><strong>🧠 آخر تقييم نفسي (' + vigEsc(e.date) + '):</strong> ' +
    (red.length ? '<span style="color:#dc2626;">مقلق: ' + red.map(vigEsc).join('، ') + '</span> ' : '') +
    (amb.length ? '<span style="color:#d97706;">يحتاج متابعة: ' + amb.map(vigEsc).join('، ') + '</span>' : '') +
    (!red.length && !amb.length ? '<span style="color:#16a34a;">لا مؤشرات مقلقة</span>' : '') + '</div>';
}
export function bmEvReportHtml(f) {
  const e = bmEvLatest(f); if (!e) return '';
  const rows = BM_EV_DIMS.filter(d => e.dims[d.k]).map(d => { const v = e.dims[d.k]; return '<tr><td>' + d.l.replace(/^\S+\s/, '') + '</td><td>' + bmEvLvName(v.lv) + '</td><td>' + vigEsc([].concat(v.items || [], v.note ? [v.note] : []).join(' — ') || '—') + '</td></tr>'; }).join('');
  return '<div class="report-section-title" style="font-size:10pt;">التقييم النفسي (' + vigEsc(e.date) + ')</div><table class="wk-table-report"><thead><tr><th style="width:16%">البُعد</th><th style="width:18%">التقدير</th><th>الملاحظات</th></tr></thead><tbody>' + rows + '</tbody></table>' + (e.note ? '<div style="font-size:9pt;margin-bottom:8px;">ملاحظة عامة: ' + vigEsc(e.note) + '</div>' : '');
}

// ── الإحصاء الأسبوعي والتنبيهات ──
export function bmStats(f, now = new Date()) {
  const t = bmIso(now), d7 = bmAgo(6, now), d14 = bmAgo(13, now);
  const cur = f.obs.filter(o => o.date >= d7 && o.date <= t);
  const prev = f.obs.filter(o => o.date >= d14 && o.date < d7);
  const cc = cur.filter(o => o.kind === 'con'), pc = prev.filter(o => o.kind === 'con');
  const freq = {}; cc.forEach(o => freq[o.beh] = (freq[o.beh] || 0) + 1);
  const top = Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, 3);
  const alerts = [], portals = new Set();
  if (cc.length >= 3) alerts.push('تكرار السلوكيات المقلقة (' + cc.length + ' خلال 7 أيام)');
  if (cc.some(o => o.sev === 3)) { alerts.push('ملاحظة بشدة 3 خلال الأسبوع'); portals.add('vigilance'); }
  if (cc.length >= 2 && cc.length > pc.length) alerts.push('ارتفاع مقارنة بالأسبوع الماضي (' + pc.length + ' ← ' + cc.length + ')');
  if (cc.length >= 4 && pc.length >= 4) alerts.push('استمرار السلوكات المقلقة أسبوعين متتاليين (' + pc.length + ' ثم ' + cc.length + ') — راجع الإجراءات في جدول التدخل');
  { const ev = (f.evals || []).filter(e => e.date >= d7 && e.date <= t).sort((a, b) => a.date < b.date ? 1 : -1)[0];
    if (ev) { const red = BM_EV_DIMS.filter(d => ev.dims[d.k] && ev.dims[d.k].lv === '2').map(d => d.l.replace(/^\S+\s/, ''));
      if (red.length >= 2) { alerts.push('تقييم نفسي بتاريخ ' + ev.date + ': ' + red.length + ' أبعاد مقلقة (' + red.join('، ') + ')'); portals.add('vigilance'); } } }
  if (alerts.length) cc.forEach(o => { if (o.portal && (o.sev >= 2 || cc.length >= 3)) portals.add(o.portal); });
  return { cur, cc, pc, pos: cur.filter(o => o.kind === 'pos'), top, alerts, portals: Array.from(portals) };
}

// ── البحث عن التلميذ والملف ──
export function bmFindStudentIn(db, massar, name) {
  if (!Array.isArray(db) || !db.length) return null;
  const ms = massar || '', k = bmWordKey(name);
  if (!k && !ms) return null;
  if (ms) { const m = db.find(s => s.massar && s.massar === ms && (!k || bmWordKey(s.fullName) === k)); if (m) return m; }
  const list = db.filter(s => bmWordKey(s.fullName) === k);
  return list.length === 1 ? list[0] : (list.length > 1 && ms ? list.find(s => s.massar === ms) || null : null);
}
export function bmFindCurFile(files, name, massar) {
  if (!name && !massar) return null;
  return files.find(f => f.status !== 'أُغلق' && ((massar && f.massar === massar) || (name && bmNz(f.studentName) === bmNz(name)))) || null;
}
// ملف متابعة جديد (المعرّف والتاريخ يأتيان من الخارج)
export function bmNewFile({ name, massar, school, level, startDate }, now = new Date(), id = Date.now()) {
  return { id, studentName: name, massar: massar || '—', school: school || '', level: level || '—',
    startDate: startDate || bmLIso(now), addedAt: bmIso(now), status: 'متابعة', obs: [], gridRows: [], interventions: [] };
}

// ── الجدول الأسبوعي: عمليات لا تغيّر الأصل ──
export function bmPushRowTo(f, kind, beh, week) {
  if (bmGridRows(f, week).some(r => bmRowKey(r) === kind + '|' + beh)) return { dup: true, file: f };
  return { dup: false, file: { ...f, gridRows: (Array.isArray(f.gridRows) ? f.gridRows : []).concat([{ beh, kind }]) } };
}
export function bmDelRowFrom(f, row) {
  return { ...f, gridRows: (f.gridRows || []).filter(x => bmRowKey(x) !== bmRowKey(row)) };
}
export function bmAddMark(f, row, date, id) {
  const known = BM_CON.find(x => x[0] === row.beh);
  const o = { id, date, kind: row.kind, beh: row.beh, portal: row.kind === 'con' ? (known ? known[1] : 'interview') : '', place: '', sev: 1, by: '', ctx: '', src: 'grid' };
  return { ...f, obs: f.obs.concat([o]) };
}
// تحذف آخر علامة أُضيفت من الجدول في هذه الخانة؛ تعيد null إن لم توجد
export function bmRemoveMark(f, row, date) {
  let idx = -1;
  for (let i = f.obs.length - 1; i >= 0; i--) { const o = f.obs[i]; if (o.src === 'grid' && o.date === date && o.kind === row.kind && o.beh === row.beh) { idx = i; break; } }
  if (idx < 0) return null;
  return { ...f, obs: f.obs.filter((_, i) => i !== idx) };
}
// اقتراحات السلوكات للجدول: null إن لم يكن هناك اقتراح
export function bmGridSuggest(f, week) {
  const rows = bmGridRows(f, week), have = rows.map(bmRowKey);
  const freq = {}; (f ? f.obs : []).filter(o => o.kind === 'con').forEach(o => freq[o.beh] = (freq[o.beh] || 0) + 1);
  let list = Object.entries(freq).sort((a,b) => b[1] - a[1]).map(x => x[0]).filter(b => !have.includes('con|' + b)).slice(0, 4);
  let title = 'اقتراح: سلوكات سبق رصدها لهذا التلميذ(ة) — اضغط للإضافة إلى الجدول';
  if (!list.length && !rows.length) { list = ['عراك أو دفع زميل','ألفاظ مسيئة أو شتم','عزلة عن الأقران أثناء الاستراحة','تأخر عن الدخول بعد الرنين']; title = 'اقتراح: سلوكات شائعة للبدء — اضغط للإضافة إلى الجدول'; }
  return list.length ? { list, title } : null;
}

// ── التقييم النفسي: الحفظ ──
export function bmEvCounts(levels) { // levels: { psy:'0'|'1'|'2'|'' , ... }
  const c = { '0': 0, '1': 0, '2': 0 };
  BM_EV_DIMS.forEach(d => { const v = levels[d.k]; if (v === '0' || v === '1' || v === '2') c[v]++; });
  return c;
}
export function bmEvSummaryText(counts, saved) {
  const n = counts['0'] + counts['1'] + counts['2'];
  return n ? ('🟢 ' + counts['0'] + ' · 🟡 ' + counts['1'] + ' · 🔴 ' + counts['2']) + (saved ? ' — محفوظ' : '') : (saved ? 'محفوظ' : 'اضغط للتقييم');
}
// dims: { psy:{lv,items,note}, ... } ← يُحتفظ بالبعد إن كان له تقدير أو بنود أو ملاحظة
export function bmEvCollectFrom(input) {
  const dims = {}; let n = 0;
  BM_EV_DIMS.forEach(d => {
    const v = input[d.k] || {};
    const lv = v.lv || '', items = v.items || [], note = (v.note || '').trim();
    if (lv !== '' || items.length || note) { dims[d.k] = { lv, items, note }; n++; }
  });
  return { dims, n };
}
export function bmEvUpsert(f, date, dims, note, id) {
  const evals = (Array.isArray(f.evals) ? f.evals : []).filter(e => e.date !== date);
  evals.push({ id, date, dims, note });
  return { ...f, evals };
}

// ── جدول التدخل (إجراءات مقترحة) ──
// اقتراحات الإجراءات حسب أكثر السلوكات المقلقة تسجيلًا
export function bmStratSuggest(f) {
  const freq = {}; (f ? f.obs : []).filter(o => o.kind === 'con').forEach(o => freq[o.beh] = (freq[o.beh] || 0) + 1);
  const tops = Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
  let list = []; tops.forEach(b => (BM_STRAT[b] || []).forEach(s => { if (!list.includes(s)) list.push(s); }));
  if (!list.length) list = BM_STRAT_DEF;
  return { list, tops };
}
export const bmIvOf = (f) => (f && Array.isArray(f.interventions) ? f.interventions : []);
// إضافة إجراء؛ dup إن كان نفس النص موجودًا
export function bmIvAdd(f, action, id, resp = BM_IV_RESP[0]) {
  const a = String(action || '').trim();
  if (bmIvOf(f).some(x => String(x.action).trim() === a)) return { dup: true, file: f };
  return { dup: false, file: { ...f, interventions: bmIvOf(f).concat([{ id, action: a, resp, date: '', status: BM_IV_STATUS[0] }]) } };
}
export const bmIvUpdate = (f, id, patch) => ({ ...f, interventions: bmIvOf(f).map(x => (String(x.id) === String(id) ? { ...x, ...patch } : x)) });
export const bmIvDel = (f, id) => ({ ...f, interventions: bmIvOf(f).filter(x => String(x.id) !== String(id)) });
export function bmIvReportHtml(f) {
  const iv = bmIvOf(f); if (!iv.length) return '';
  const rows = iv.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + vigEsc(x.action) + '</td><td>' + vigEsc(x.resp || '—') + '</td><td>' + vigEsc(x.date || '—') + '</td><td>' + vigEsc(x.status || '—') + '</td></tr>').join('');
  return '<div class="report-section-title" style="font-size:10pt;">جدول التدخل — إجراءات مقترحة</div><table class="wk-table-report"><thead><tr><th style="width:5%">#</th><th>الإجراء</th><th style="width:18%">المسؤول</th><th style="width:14%">تاريخ التنفيذ</th><th style="width:12%">الحالة</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

export const bmDelObsOf = (f, oid) => ({ ...f, obs: f.obs.filter(o => String(o.id) !== String(oid)) });
export const bmCloseFile = (f) => ({ ...f, status: 'أُغلق' });
export const bmReopenFile = (f) => ({ ...f, status: 'متابعة' });
export const bmSetStart = (f, iso) => ({ ...f, startDate: iso });

// ── بطاقة كل تلميذ في قائمة المتابعة ──
export function bmListRows(all, q, now = new Date(), week = bmMonday(null, now)) {
  const act = all.filter(f => f.status !== 'أُغلق');
  const list = act.concat(all.filter(f => f.status === 'أُغلق')).filter(f => !q || f.studentName.includes(q));
  return {
    activeCount: act.length,
    items: list.map(f => {
      const s = bmStats(f, now), trend = s.cc.length - s.pc.length;
      return {
        file: f, stats: s, closed: f.status === 'أُغلق', trend,
        weekMarks: bmWeekCount(f, week),
        recent: f.obs.slice().sort((a,b) => a.date < b.date ? 1 : -1).slice(0, 4),
      };
    }),
  };
}

// ── التقرير الأسبوعي (طباعة / Word) ──
// ترتيب كل تلميذ: معطيات التلميذ ← الجدول الأسبوعي ← التقييم النفسي ← جدول التدخل
export function bmStudentReportHtml(f) {
  const th = (t, w) => '<th' + (w ? ' style="width:' + w + '"' : '') + '>' + t + '</th>';
  return '<table class="wk-table-report"><tbody>' +
    '<tr>' + th('الاسم الكامل', '14%') + '<td>' + vigEsc(f.studentName) + '</td>' + th('القسم', '10%') + '<td>' + vigEsc(f.level || '—') + '</td>' + th('رقم مسار', '10%') + '<td>' + vigEsc(f.massar || '—') + '</td></tr>' +
    '<tr>' + th('المؤسسة') + '<td colspan="3">' + vigEsc(f.school || '—') + '</td>' + th('تاريخ بداية الرصد') + '<td>' + vigEsc(bmStartOf(f) || '—') + '</td></tr>' +
    '</tbody></table>';
}

export function bmGridReportHtml(f, w) {
  const rows = bmGridRows(f, w); if (!rows.length) return '';
  const ds = bmWeekDates(w);
  const body = rows.map(r => '<tr><td>' + vigEsc(r.beh) + (r.kind === 'pos' ? ' (إيجابي)' : '') + '</td>' + ds.map(d => { const n = bmCellCount(f, d, r); return '<td style="text-align:center;font-weight:800;">' + (n ? bmMarks(n) : '') + '</td>'; }).join('') + '<td style="text-align:center;font-weight:800;">' + ds.reduce((a, d) => a + bmCellCount(f, d, r), 0) + '</td></tr>').join('');
  return '<div class="report-section-title" style="font-size:10pt;">الجدول الأسبوعي (' + bmFmt(ds[0]) + ' ← ' + bmFmt(ds[5]) + ')</div><table class="wk-table-report"><thead><tr><th style="width:28%">السلوك الملاحَظ</th>' + ds.map((d, i) => '<th style="text-align:center;">' + BM_DAYS[i] + '<br>' + bmFmt(d) + '</th>').join('') + '<th style="text-align:center;">المجموع</th></tr></thead><tbody>' + body + '</tbody></table>';
}

export function bmBuildReport(allFiles, onlyId, ctx = {}) {
  const now = ctx.now || new Date(), week = ctx.week || bmMonday(null, now);
  const files = allFiles.filter(f => onlyId ? String(f.id) === String(onlyId) : f.status !== 'أُغلق');
  if (!files.length) return '';
  const school = String(ctx.school || '').trim() || 'المؤسسة التعليمية';
  const spec = ctx.spec || '';
  const logo = ctx.logo || '';
  const d7 = bmAgo(6, now), t = bmIso(now);
  const blocks = files.map(f =>
    '<div class="report-section-title">' + vigEsc(f.studentName) + '</div>' +
    bmStudentReportHtml(f) + bmGridReportHtml(f, week) + bmEvReportHtml(f) + bmIvReportHtml(f)
  ).join('');
  return '<div class="new-report-header"><div class="nrh-logo">' + (logo ? '<img src="' + logo + '" alt="شعار الوزارة">' : '') + '</div><div class="nrh-dir">مديرية الحي الحسني</div><div class="nrh-school">' + vigEsc(school) + '</div><div class="nrh-title">التقرير الأسبوعي لرصد السلوك (' + d7 + ' → ' + t + ')</div></div>' +
    (spec ? '<div class="report-summary-block" style="text-align:center;">المختص(ة) الاجتماعي(ة): ' + vigEsc(spec) + '</div>' : '') + blocks +
    '<div class="sig-wrap"><div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div><div class="sig-block"><div class="sig-line"></div>الحارس العام</div><div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div></div>';
}
