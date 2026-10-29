// منطق بوابة «رصد السلوك» — دوال نقية (لا DOM ولا window ولا مخزن ولا alert).
// منقول حرفياً من script-18.js (النسخة القديمة المجمَّدة في tests/fixtures/behavior.step18.js،
// ويقارن بها tests/behavior.parity.test.js). كل دالة كانت تقرأ الوقت الحالي صارت تأخذ now،
// وكل دالة كانت تقرأ ملفاً أو سياقاً من الصفحة صارت تأخذه معاملاً.
// شكل البيانات المحفوظة في appData.behaviorFiles لم يتغير.

export const BM_KEY = 'behaviorFiles';
const vigEsc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const BM_CON = [['عراك أو دفع زميل','violence'],['ألفاظ مسيئة أو شتم','violence'],['سخرية أو تنمر على زميل','violence'],['رفع الصوت أو مشادة كلامية','interview'],['عزلة عن الأقران أثناء الاستراحة','vigilance'],['تأخر عن الدخول بعد الرنين','absence'],['التواجد خارج القسم أثناء الحصة','absence'],['محاولة الخروج من المؤسسة أو تسلق السور','vigilance'],['إتلاف ممتلكات أو تخريب','violence'],['عدم الامتثال لتوجيهات الحراسة','interview'],['اللعب العنيف أو الخطير','violence'],['حيازة أو استعمال مواد ممنوعة','vigilance'],['أخرى','interview']];
export const BM_POS = ['اللعب الجماعي والتعاون مع الأقران','مساعدة زميل','حل خلاف بالحوار','الامتثال لتوجيهات الحراسة','الاعتذار أو المبادرة بالصلح','الدخول في الوقت بعد الرنين','المشاركة في أنشطة الساحة','أخرى'];
export const BM_PORTALS = { interview:'المقابلة الفردية', violence:'العنف', absence:'الغياب', vigilance:'خلية اليقظة' };
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
export const BM_TIER_ACTIONS = {
  '2': ['لقاء أسبوعي قصير مع التلميذ(ة) لمراجعة الجدول الأسبوعي','اتفاق مع الأستاذ(ة) على سلوك بديل واضح وتعزيزه فورًا','تواصل دوري مع الأسرة وإخبارها بالتطور'],
  '3': ['وضع خطة تدخل فردية مكتوبة بهدف قابل للقياس وتاريخ مراجعة','لقاءات أسبوعية متعددة مع إشراك الأسرة والإدارة','النظر في الإحالة إلى خلية اليقظة أو بوابة المقابلات/العنف']
};
export const BM_GOALS_SUG = {
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
export const BM_GOALS_DEF = ['خفض السلوكات المقلقة الملاحظة في الساحة إلى أقل من 3 أسبوعيًا خلال 3 أسابيع','تسجيل 3 سلوكات إيجابية على الأقل أسبوعيًا خلال 3 أسابيع','تحقيق السلوكات المنتظرة في الاستراحات 4 أيام من 5 خلال أسبوعين'];

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
export function bmTierLbl(t) { return String(t).includes('+') ? 'المستويان 2 و3' : 'المستوى ' + t; }
export function bmGoals(f) {
  const d = ['احترام قواعد الساحة','التعاون مع الأقران','الامتثال لتوجيهات الحراسة'];
  return [0,1,2].map(i => (f && f.plan && f.plan.goals && f.plan.goals[i]) || d[i]);
}
export function bmWordKey(v) { return String(v || '').trim().replace(/\s+/g, ' ').replace(/[أإآا]/g,'ا').replace(/[ةه]/g,'ه').replace(/[يى]/g,'ي').toLowerCase().split(' ').filter(Boolean).sort().join(' '); }
export function bmEvFind(f, date) { return f && Array.isArray(f.evals) ? f.evals.find(e => e.date === date) : null; }
export function bmEvLatest(f) { return f && Array.isArray(f.evals) && f.evals.length ? f.evals.slice().sort((a, b) => a.date < b.date ? 1 : -1)[0] : null; }
export function bmEvLvName(v) { const l = BM_EV_LV.find(x => x[0] === v); return l ? l[2] + ' ' + l[1] : '—'; }
export function bmEvListHtml(f) {
  const e = bmEvLatest(f); if (!e) return '';
  const flag = lv => BM_EV_DIMS.filter(d => e.dims[d.k] && e.dims[d.k].lv === lv).map(d => d.l.replace(/^\S+\s/, ''));
  const red = flag('2'), amb = flag('1');
  return '<div style="font-size:0.78rem;margin-top:6px;color:#334155;"><strong>⚡ آخر تقييم سريع (' + vigEsc(e.date) + '):</strong> ' +
    (red.length ? '<span style="color:#dc2626;">مقلق: ' + red.map(vigEsc).join('، ') + '</span> ' : '') +
    (amb.length ? '<span style="color:#d97706;">يحتاج متابعة: ' + amb.map(vigEsc).join('، ') + '</span>' : '') +
    (!red.length && !amb.length ? '<span style="color:#16a34a;">لا مؤشرات مقلقة</span>' : '') + '</div>';
}
export function bmEvReportHtml(f) {
  const e = bmEvLatest(f); if (!e) return '';
  const rows = BM_EV_DIMS.filter(d => e.dims[d.k]).map(d => { const v = e.dims[d.k]; return '<tr><td>' + d.l.replace(/^\S+\s/, '') + '</td><td>' + bmEvLvName(v.lv) + '</td><td>' + vigEsc([].concat(v.items || [], v.note ? [v.note] : []).join(' — ') || '—') + '</td></tr>'; }).join('');
  return '<div class="report-section-title" style="font-size:10pt;">التقييم السريع (' + vigEsc(e.date) + ')</div><table class="wk-table-report"><thead><tr><th style="width:16%">البُعد</th><th style="width:18%">التقدير</th><th>الملاحظات</th></tr></thead><tbody>' + rows + '</tbody></table>' + (e.note ? '<div style="font-size:9pt;margin-bottom:8px;">ملاحظة عامة: ' + vigEsc(e.note) + '</div>' : '');
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
  if (f.tier === '2' && cc.length >= 4 && pc.length >= 4) alerts.push('استمرار السلوكات المقلقة أسبوعين متتاليين (' + pc.length + ' ثم ' + cc.length + ') — فكّر في الانتقال إلى المستوى 3');
  if (f.plan && f.plan.review && f.plan.review <= t) alerts.push('حان موعد مراجعة الخطة (' + f.plan.review + ')');
  { const ev = (f.evals || []).filter(e => e.date >= d7 && e.date <= t).sort((a, b) => a.date < b.date ? 1 : -1)[0];
    if (ev) { const red = BM_EV_DIMS.filter(d => ev.dims[d.k] && ev.dims[d.k].lv === '2').map(d => d.l.replace(/^\S+\s/, ''));
      if (red.length >= 2) { alerts.push('تقييم سريع بتاريخ ' + ev.date + ': ' + red.length + ' أبعاد مقلقة (' + red.join('، ') + ')'); portals.add('vigilance'); } } }
  if (alerts.length) cc.forEach(o => { if (o.portal && (o.sev >= 2 || cc.length >= 3)) portals.add(o.portal); });
  return { cur, cc, pc, pos: cur.filter(o => o.kind === 'pos'), top, alerts, portals: Array.from(portals) };
}


// ── اقتراح مستوى الدعم: (الملف، نص سبب الإدراج) ← { tier, why } ──
export function bmTierAdvice(f, reasonTxt, now = new Date()) {
  const why = []; let tier = '2';
  const hasData = f && f.obs.length;
  if (hasData) {
    const s = bmStats(f, now), cc = s.cc.length, pc = s.pc.length;
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

// ── البحث عن التلميذ والملف (كانت bmFindStudent وbmFindCur تقرآن الحقول من الصفحة) ──
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
// ملف متابعة جديد كما كانت تبنيه bmEnsureCur (المعرّف والتاريخ يأتيان من الخارج)
export function bmNewFile({ name, massar, school, level, tier, reason, strengths }, now = new Date(), id = Date.now()) {
  return { id, studentName: name, massar: massar || '—', school: school || '', level: level || '—', tier: tier || '2',
    reason: reason || '', strengths: strengths || '', addedAt: bmIso(now), status: 'متابعة', obs: [], gridRows: [], plan: null };
}

// ── الجدول الأسبوعي: عمليات لا تغيّر الأصل (القديم كان يعدّل الملف في مكانه) ──
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
// تحذف آخر علامة أُضيفت من الجدول في هذه الخانة؛ تعيد null إن لم توجد (القديم ينبّه بـ alert)
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

// ── مستوى الدعم ──
export function bmTierNames() { return { '2': 'المستوى 2 — دعم موجَّه', '3': 'المستوى 3 — دعم مكثف' }; }
// بطاقة الاقتراح: cur هو المستوى المعتمد حالياً ("2" أو "3" أو "2+3")
export function bmTierSuggest(f, reasonTxt, cur, now = new Date()) {
  const a = bmTierAdvice(f, reasonTxt, now), c = String(cur || '2');
  return { tier: a.tier, why: a.why, actions: BM_TIER_ACTIONS[a.tier], name: bmTierNames()[a.tier], same: c.split('+').includes(a.tier), multi: c.includes('+') };
}
export function bmApplyTierTo(cur, t, add) {
  const c = String(cur || '2');
  return add ? Array.from(new Set(c.split('+').concat(t))).sort().join('+') : t;
}

// ── الأهداف القابلة للقياس والاستراتيجيات ──
export function bmGoalSuggest(f, now = new Date()) {
  const list = [];
  const add = g => { if (g && !list.includes(g)) list.push(g); };
  if (f) {
    const s = bmStats(f, now), freq = {};
    f.obs.filter(o => o.kind === 'con').forEach(o => freq[o.beh] = (freq[o.beh] || 0) + 1);
    Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).forEach(([beh]) => {
      const n = s.cc.filter(o => o.beh === beh).length;
      if (n >= 2) add('خفض عدد مرات «' + beh + '» من ' + n + ' إلى ' + Math.max(1, Math.floor(n / 2)) + ' أسبوعيًا خلال 3 أسابيع');
      add(BM_GOALS_SUG[beh]);
    });
  }
  BM_GOALS_DEF.forEach(add);
  return list.slice(0, 6);
}
export function bmStratSuggest(f) {
  const freq = {}; (f ? f.obs : []).filter(o => o.kind === 'con').forEach(o => freq[o.beh] = (freq[o.beh] || 0) + 1);
  const tops = Object.entries(freq).sort((a,b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
  let list = []; tops.forEach(b => (BM_STRAT[b] || []).forEach(s => { if (!list.includes(s)) list.push(s); }));
  if (!list.length) list = BM_STRAT_DEF;
  return { list, tops };
}
// إضافة استراتيجية إلى نص الخطة (سطر جديد، بلا تكرار) — تعيد النص كما هو إن كانت موجودة
export function bmAppendStrategy(text, s) {
  if (!s) return text;
  if (String(text).split('\n').map(x => x.trim()).includes(s)) return text;
  return (String(text).trim() ? String(text).trim() + '\n' : '') + s;
}

// ── التقييم السريع ──
export function bmEvCounts(levels) { // levels: { psy:'0'|'1'|'2'|'' , ... }
  const c = { '0': 0, '1': 0, '2': 0 };
  BM_EV_DIMS.forEach(d => { const v = levels[d.k]; if (v === '0' || v === '1' || v === '2') c[v]++; });
  return c;
}
export function bmEvSummaryText(counts, saved) {
  const n = counts['0'] + counts['1'] + counts['2'];
  return n ? ('🟢 ' + counts['0'] + ' · 🟡 ' + counts['1'] + ' · 🔴 ' + counts['2']) + (saved ? ' — محفوظ' : '') : (saved ? 'محفوظ' : 'اضغط للتقييم');
}
// dims: { psy:{lv,items,note}, ... } ← يُحتفظ بالبعد إن كان له تقدير أو بنود أو ملاحظة (كـ bmEvCollect)
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
export const bmDelObsOf = (f, oid) => ({ ...f, obs: f.obs.filter(o => String(o.id) !== String(oid)) });
export const bmCloseFile = (f) => ({ ...f, status: 'أُغلق' });
export const bmReopenFile = (f) => ({ ...f, status: 'متابعة' });
export const bmPlanOf = ({ goal, goals, review, strategies, resp, result }) => ({ goal, goals, review, strategies, resp, result });

// ── بطاقة كل تلميذ في قائمة المتابعة (كانت bmRender تبني HTML نصياً) ──
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

export function bmBuildReport(allFiles, onlyId, ctx = {}) {
  const now = ctx.now || new Date(), week = ctx.week || bmMonday(null, now);
  const files = allFiles.filter(f => onlyId ? String(f.id) === String(onlyId) : f.status !== 'أُغلق');
  if (!files.length) return '';
  const school = String(ctx.school || '').trim() || 'المؤسسة التعليمية';
  const spec = ctx.spec || '';
  const logo = ctx.logo || '';
  const d7 = bmAgo(6, now), t = bmIso(now);
  const blocks = files.map(f => {
    const s = bmStats(f, now);
    const obs = f.obs.filter(o => o.date >= d7 && o.date <= t).sort((a,b) => a.date < b.date ? -1 : 1);
    const rows = obs.length ? obs.map((o,i) => '<tr><td>' + (i+1) + '</td><td>' + vigEsc(o.date) + '</td><td>' + (o.kind === 'pos' ? 'إيجابي' : 'مقلق') + '</td><td>' + vigEsc(o.beh) + '</td><td>' + vigEsc(o.place || '—') + '</td><td>' + (o.kind === 'con' ? o.sev : '—') + '</td><td>' + vigEsc(o.by || '—') + '</td><td>' + vigEsc(o.ctx || '—') + '</td></tr>').join('') : '<tr><td colspan="8">لا ملاحظات خلال الأسبوع</td></tr>';
    const g = bmGoals(f);
    const p = f.plan || {};
    return '<div class="report-section-title">' + vigEsc(f.studentName) + ' — ' + vigEsc(f.level) + ' — ' + bmTierLbl(f.tier) + '</div>' +
      '<table class="wk-table-report"><thead><tr><th>ملاحظات مقلقة</th><th>ملاحظات إيجابية</th><th>الأسبوع الماضي (مقلقة)</th><th>علامات الجدول الأسبوعي (×)</th></tr></thead><tbody><tr><td>' + s.cc.length + '</td><td>' + s.pos.length + '</td><td>' + s.pc.length + '</td><td>' + bmWeekCount(f, week) + '</td></tr></tbody></table>' +
      '<table class="wk-table-report"><thead><tr><th>#</th><th>التاريخ</th><th>النوع</th><th>السلوك الملاحَظ</th><th>المكان</th><th>الشدة</th><th>الراصد</th><th>السياق</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      bmGridReportHtml(f, week) + bmEvReportHtml(f) +
      (p.goal || p.strategies ? '<table class="wk-table-report"><tbody><tr><th style="width:18%">الهدف</th><td>' + vigEsc(p.goal || '—') + '</td></tr><tr><th>الاستراتيجيات</th><td>' + vigEsc(p.strategies || '—').replace(/\n/g, ' • ') + '</td></tr><tr><th>المسؤولون</th><td>' + vigEsc(p.resp || '—').replace(/\n/g, ' • ') + '</td></tr><tr><th>المراجعة</th><td>' + vigEsc(p.review || '—') + (p.result ? ' — ' + vigEsc(p.result) : '') + '</td></tr></tbody></table>' : '');
  }).join('');
  return '<div class="new-report-header"><div class="nrh-logo">' + (logo ? '<img src="' + logo + '" alt="شعار الوزارة">' : '') + '</div><div class="nrh-dir">مديرية الحي الحسني</div><div class="nrh-school">' + vigEsc(school) + '</div><div class="nrh-title">التقرير الأسبوعي لرصد السلوك (' + d7 + ' → ' + t + ')</div></div>' +
    (spec ? '<div class="report-summary-block" style="text-align:center;">المختص(ة) الاجتماعي(ة): ' + vigEsc(spec) + '</div>' : '') + blocks +
    '<div class="sig-wrap"><div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div><div class="sig-block"><div class="sig-line"></div>الحارس العام</div><div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div></div>';
}


export function bmGridReportHtml(f, w) {
  const rows = bmGridRows(f, w); if (!rows.length) return '';
  const ds = bmWeekDates(w);
  const body = rows.map(r => '<tr><td>' + vigEsc(r.beh) + (r.kind === 'pos' ? ' (إيجابي)' : '') + '</td>' + ds.map(d => { const n = bmCellCount(f, d, r); return '<td style="text-align:center;font-weight:800;">' + (n ? bmMarks(n) : '') + '</td>'; }).join('') + '<td style="text-align:center;font-weight:800;">' + ds.reduce((a, d) => a + bmCellCount(f, d, r), 0) + '</td></tr>').join('');
  return '<div class="report-section-title" style="font-size:10pt;">الجدول الأسبوعي (' + bmFmt(ds[0]) + ' ← ' + bmFmt(ds[5]) + ')</div><table class="wk-table-report"><thead><tr><th style="width:28%">السلوك الملاحَظ</th>' + ds.map((d, i) => '<th style="text-align:center;">' + BM_DAYS[i] + '<br>' + bmFmt(d) + '</th>').join('') + '<th style="text-align:center;">المجموع</th></tr></thead><tbody>' + body + '</tbody></table>';
}

