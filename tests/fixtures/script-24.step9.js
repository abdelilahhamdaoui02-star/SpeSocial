
/* ══════════════════════════════════════════════════════════
   v17 — ملف الحالة الشامل (كان مفقوداً: cfRenderSearch / cfPrintFile)
   يجمع كل سجلات التلميذ من جميع الأدوات في عرض واحد قابل للطباعة
   ══════════════════════════════════════════════════════════ */
(function () {
  var _cfCurrent = null;   // الملف المعروض حالياً
  var _cfMatches = [];     // نتائج البحث عند تعدد التلاميذ

  function esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function nz(v) {
    return String(v == null ? '' : v).replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه')
      .replace(/[يى]/g, 'ي').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function arr(fn) { try { var r = fn(); return Array.isArray(r) ? r : []; } catch (e) { return []; } }
  function clean(v) {
    if (Array.isArray(v)) v = v.filter(Boolean).join(' • ');
    if (v == null) return '';
    v = String(v).trim();
    return (v === '—' || v === '-') ? '' : v;
  }
  function isoDate(v) { return /^\d{4}-\d{2}-\d{2}/.test(v || '') ? v.slice(0, 10) : ''; }

  var SOURCES = [
    { key: 'interview', label: 'المقابلات الفردية', icon: '🗂', color: '#1a3a5c',
      get: function () { return getArchive(); }, date: function (e) { return e.interviewDate; },
      fields: function (e) { return [['الموضوع', e.subject], ['الأولوية', e.priority], ['الوضعية الحالية', e.currentStatus],
        ['الملخص', e.summary], ['ملاحظات الأخصائي', e.specialistNotes], ['الإجراءات', e.procedures],
        ['التوصية', e.recommendation], ['المتابعة المقبلة', e.nextFollowup]]; } },
    { key: 'reint', label: 'الإدماج المدرسي', icon: '📋', color: '#16a34a',
      get: function () { return getRArchive(); }, date: function (e) { return e.reintegrationDate; },
      fields: function (e) { return [['مدة الغياب', e.absenceDuration], ['الأسباب', e.causes], ['الإجراءات', e.procedures],
        ['الأولوية', e.priority], ['الوضعية الحالية', e.currentStatus], ['التوصية', e.recommendation],
        ['المتابعة المقبلة', e.nextFollowup]]; } },
    { key: 'absence', label: 'ملفات الغياب', icon: '🚨', color: '#d97706',
      get: function () { return getAbArchive(); }, date: function (e) { return e.recordDate; },
      fields: function (e) { return [['مجموع الساعات', e.totalHours], ['ساعات غير مبررة', e.unjustifiedHours],
        ['عدد الأيام', e.totalDays], ['الأسباب', e.causes], ['الإجراءات', e.procedures], ['الأولوية', e.priority],
        ['الوضعية الحالية', e.currentStatus], ['التوصية', e.recommendation], ['المتابعة المقبلة', e.nextFollowup]]; } },
    { key: 'violence', label: 'حالات العنف', icon: '🛡️', color: '#dc2626',
      get: function () { return getVioArchive(); }, date: function (e) { return e.reportDate; },
      fields: function (e) { return [['الشخص المعنِّف', e.aggName], ['القسم (المعنِّف)', e.aggLevel], ['نوع العنف', e.types], ['المكان', e.location],
        ['الوصف', e.description], ['الأولوية', e.priority],
        ['التوصية', e.recommendation]]; } },
    { key: 'contacts', label: 'الاتصالات والأولياء', icon: '📞', color: '#0d9488',
      get: function () { return getCtArchive(); }, date: function (e) { return e.date; },
      fields: function (e) { return [['نوع الاتصال', e.type], ['ولي الأمر', e.parentName], ['الهاتف', e.parentPhone],
        ['السبب', e.reason], ['الملخص', e.summary], ['النتيجة', e.result], ['الإجراءات', e.actions],
        ['الأولوية', e.priority]]; } },
    { key: 'special', label: 'وضعية الإعاقة', icon: '♿', color: '#2563eb',
      get: function () { return getSnArchive(); }, date: function (e) { return e.recordDate; },
      fields: function (e) { return [['الفئة', e.category], ['التشخيص', e.diagnosis], ['تقرير طبي', e.hasReport],
        ['الإحالة', e.referral], ['الإجراءات', e.actions], ['التفاصيل', e.actionsDetails], ['التكييفات', e.adaptations],
        ['الملخص', e.summary], ['التوصية', e.recommendation], ['المتابعة المقبلة', e.nextFollowup]]; } },
    { key: 'vigilance', label: 'خلية اليقظة', icon: '🚨', color: '#7c3aed',
      get: function () { return vigGetArchive(); }, date: function (e) { return e.date; },
      fields: function (e) { return [['الصنف', e.category], ['الإجراءات', e.actions], ['الأولوية', e.priority],
        ['الحالة', e.status], ['ملاحظات', e.notes], ['المتابعة المقبلة', e.nextFollowup],
        ['عدد سجلات التتبع', (e.trackingLogs && e.trackingLogs.length) ? String(e.trackingLogs.length) : '']]; } },
    { key: 'behavior', label: 'رصد السلوك', icon: '🧭', color: '#0e8f98',
      get: function () { return (typeof bmGet === 'function' ? bmGet() : []).map(function (f) { var st = bmStats(f), p = f.plan || {};
        var last = f.obs.length ? f.obs.map(function (o) { return o.date; }).sort().pop() : f.addedAt;
        return { id: f.id, studentName: f.studentName, massar: f.massar, school: f.school, level: f.level, date: last, tier: f.tier, cc: st.cc.length, pos: st.pos.length, goal: p.goal, review: p.review, reason: f.reason }; }); },
      date: function (e) { return e.date; },
      fields: function (e) { return [['سبب الإدراج', e.reason], ['مستوى الدعم', (typeof bmTierLbl === 'function' ? bmTierLbl(e.tier) : 'المستوى ' + e.tier)], ['ملاحظات مقلقة (7 أيام)', String(e.cc)],
        ['ملاحظات إيجابية (7 أيام)', String(e.pos)], ['هدف الخطة', e.goal], ['تاريخ المراجعة', e.review]]; } }
  ];

  function buildGroups() {
    var groups = {};
    SOURCES.forEach(function (src) {
      arr(src.get).forEach(function (e) {
        if (!e || !e.studentName) return;
        var k = nz(e.studentName);
        if (!k) return;
        var g = groups[k] || (groups[k] = { key: k, name: e.studentName, massar: '', school: '', level: '', records: {}, total: 0 });
        if (!g.massar && clean(e.massar)) g.massar = clean(e.massar);
        if (!g.school && clean(e.school)) g.school = clean(e.school);
        if (!g.level && clean(e.level)) g.level = clean(e.level);
        (g.records[src.key] = g.records[src.key] || []).push(e);
        g.total++;
      });
    });
    return groups;
  }

  function sortRecords(src, list) {
    return list.slice().sort(function (a, b) {
      var da = isoDate(src.date(a)), db = isoDate(src.date(b));
      return db.localeCompare(da) || ((b.id || 0) - (a.id || 0));
    });
  }

  function recordHtml(src, e) {
    var date = clean(src.date(e)) || clean(e.savedAt);
    var rows = src.fields(e).map(function (f) {
      var v = clean(f[1]); if (!v) return '';
      return '<div class="cf-row"><span class="cf-k">' + esc(f[0]) + '</span><span class="cf-v">' + esc(v) + '</span></div>';
    }).join('');
    return '<div class="cf-rec" style="border-right:4px solid ' + src.color + ';">' +
      '<div class="cf-rec-date">📅 ' + esc(date || 'بدون تاريخ') + '</div>' +
      (rows || '<div class="cf-row"><span class="cf-v" style="color:#94a3b8;">لا توجد تفاصيل إضافية</span></div>') + '</div>';
  }

  function fileHtml(g, forPrint) {
    var urgent = 0;
    SOURCES.forEach(function (s) {
      (g.records[s.key] || []).forEach(function (e) { if (/عاجل|عالي|مرتفع/.test(clean(e.priority))) urgent++; });
    });
    var chips = SOURCES.map(function (s) {
      var n = (g.records[s.key] || []).length;
      return '<span class="cf-chip" style="' + (n ? 'background:' + s.color + ';color:#fff;' : 'background:#f1f5f9;color:#94a3b8;') + '">' +
        s.icon + ' ' + esc(s.label) + ': ' + n + '</span>';
    }).join('');
    var head = '<div class="cf-head"><div class="cf-name">' + esc(g.name) + '</div>' +
      '<div class="cf-meta">' +
      (g.massar ? '<span>رقم مسار: <b>' + esc(g.massar) + '</b></span>' : '') +
      (g.level ? '<span>المستوى: <b>' + esc(g.level) + '</b></span>' : '') +
      (g.school ? '<span>المؤسسة: <b>' + esc(g.school) + '</b></span>' : '') + '</div>' +
      '<div class="cf-chips">' + chips + '</div>' +
      (urgent ? '<div class="cf-urgent">⚠️ ' + urgent + ' سجل(ات) ذات أولوية عاجلة / عالية</div>' : '') + '</div>';
    var body = SOURCES.map(function (s) {
      var list = sortRecords(s, g.records[s.key] || []);
      if (!list.length) return '';
      return '<div class="cf-sec"><div class="cf-sec-title" style="background:' + s.color + ';">' + s.icon + ' ' + esc(s.label) +
        ' <span class="cf-count">' + list.length + '</span></div>' +
        list.map(function (e) { return recordHtml(s, e); }).join('') + '</div>';
    }).join('');
    return head + (body || '<div class="cf-empty">لا توجد سجلات لهذا التلميذ.</div>');
  }

  function injectStyle() {
    if (document.getElementById('cfStyleV17')) return;
    var st = document.createElement('style'); st.id = 'cfStyleV17';
    st.textContent =
      '.cf-head{background:#f0fdfa;border:1.5px solid #5eead4;border-radius:12px;padding:14px 16px;margin:12px 0;}' +
      '.cf-name{font-size:1.25rem;font-weight:800;color:#0f766e;margin-bottom:6px;}' +
      '.cf-meta{display:flex;flex-wrap:wrap;gap:14px;font-size:.85rem;color:#334155;margin-bottom:8px;}' +
      '.cf-chips{display:flex;flex-wrap:wrap;gap:6px;}' +
      '.cf-chip{border-radius:20px;padding:3px 11px;font-size:.76rem;font-weight:700;}' +
      '.cf-urgent{margin-top:10px;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:8px;padding:6px 10px;font-size:.82rem;font-weight:700;}' +
      '.cf-sec{margin:14px 0;}' +
      '.cf-sec-title{color:#fff;font-weight:800;padding:8px 14px;border-radius:10px 10px 0 0;font-size:.95rem;}' +
      '.cf-count{background:rgba(255,255,255,.28);border-radius:20px;padding:0 9px;margin-right:6px;font-size:.8rem;}' +
      '.cf-rec{background:#fff;border:1px solid #e2e8f0;border-top:0;padding:10px 14px;}' +
      '.cf-rec-date{font-size:.78rem;font-weight:700;color:#64748b;margin-bottom:6px;}' +
      '.cf-row{display:flex;gap:10px;padding:3px 0;font-size:.85rem;line-height:1.7;}' +
      '.cf-k{min-width:130px;color:#64748b;font-weight:700;}.cf-v{flex:1;color:#1e293b;white-space:pre-wrap;}' +
      '.cf-empty{padding:26px;text-align:center;color:#64748b;background:#f8fafc;border-radius:10px;}' +
      '.cf-pick{display:flex;align-items:center;gap:10px;padding:10px 14px;margin:6px 0;background:#fff;border:1.5px solid #cbd5e1;' +
      'border-radius:10px;cursor:pointer;font-weight:700;color:#1a3a5c;}.cf-pick:hover{background:#eff6ff;border-color:#60a5fa;}';
    document.head.appendChild(st);
  }

  function showPrintRow(on) {
    var r = document.getElementById('cfPrintBtnRow'); if (r) r.style.display = on ? '' : 'none';
  }

  window.cfSelectStudent = function (i) {
    var g = _cfMatches[i]; if (!g) return;
    var inp = document.getElementById('cf_search'); if (inp) inp.value = g.name;
    _cfCurrent = g;
    var box = document.getElementById('cfResultsContainer');
    if (box) box.innerHTML = fileHtml(g);
    showPrintRow(true);
  };

  window.cfRenderSearch = function () {
    injectStyle();
    var box = document.getElementById('cfResultsContainer'); if (!box) return;
    var inp = document.getElementById('cf_search');
    var qRaw = inp ? inp.value : '', q = nz(qRaw);
    _cfCurrent = null; showPrintRow(false);
    if (q.length < 2) {
      box.innerHTML = '<div class="cf-empty">🔍 اكتب حرفين على الأقل من اسم التلميذ(ة) لعرض ملفه الشامل.</div>';
      return;
    }
    var groups = buildGroups();
    var found = Object.keys(groups).map(function (k) { return groups[k]; }).filter(function (g) {
      return g.key.indexOf(q) !== -1 || (g.massar && g.massar.toLowerCase().indexOf(qRaw.trim().toLowerCase()) === 0);
    });
    if (!found.length) {
      box.innerHTML = '<div class="cf-empty">لا توجد سجلات باسم «' + esc(qRaw) + '». ' +
        'تظهر هنا فقط التلاميذ الذين سُجّلت لهم مقابلة أو ملف في إحدى الأدوات.</div>';
      return;
    }
    var exact = found.filter(function (g) { return g.key === q; });
    if (exact.length === 1) found = exact;
    if (found.length === 1) {
      _cfCurrent = found[0]; box.innerHTML = fileHtml(found[0]); showPrintRow(true); return;
    }
    found.sort(function (a, b) { return a.name.localeCompare(b.name, 'ar'); });
    _cfMatches = found.slice(0, 30);
    box.innerHTML = '<div style="font-weight:700;color:#475569;margin:10px 0;">وُجد ' + found.length +
      ' تلميذ(ة) — اختر واحداً:</div>' + _cfMatches.map(function (g, i) {
        return '<div class="cf-pick" onclick="cfSelectStudent(' + i + ')"><span>👤</span><span style="flex:1;">' + esc(g.name) +
          '</span><span style="font-size:.75rem;color:#64748b;">' + esc(g.level) + '</span><span style="font-size:.75rem;color:#0f766e;">' +
          g.total + ' سجل</span></div>';
      }).join('');
  };

  window.cfPrintFile = function () {
    if (!_cfCurrent) { alert('⚠️ اختر تلميذاً أولاً لعرض ملفه ثم اطبعه.'); return; }
    injectStyle();
    var logo = (typeof MINISTRY_LOGO_B64 !== 'undefined' && MINISTRY_LOGO_B64) ? '<img src="' + MINISTRY_LOGO_B64 + '" style="height:60px;">' : '';
    var today = new Date().toLocaleDateString('ar-MA');
    var css = document.getElementById('cfStyleV17').textContent;
    var html = '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>ملف الحالة — ' + esc(_cfCurrent.name) + '</title>' +
      '<style>@import url("https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap");' +
      'body{font-family:"Cairo",Arial,sans-serif;margin:0;padding:18px 26px;color:#1e293b;}' +
      '.ph{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #0f766e;padding-bottom:10px;margin-bottom:6px;}' +
      '.ph h1{margin:0;font-size:1.15rem;color:#0f766e;}.ph small{color:#64748b;}' +
      '.cf-sec,.cf-rec{page-break-inside:avoid;}' +
      '@media print{body{padding:0;}-webkit-print-color-adjust:exact;print-color-adjust:exact;}' + css + '</style></head><body>' +
      '<div class="ph"><div>' + logo + '</div><div style="text-align:center;"><h1>ملف الحالة الشامل</h1>' +
      '<small>وثيقة سرية – للاستعمال الرسمي فقط</small></div><div><small>تاريخ الطباعة: ' + esc(today) + '</small></div></div>' +
      fileHtml(_cfCurrent, true) +
      '</body></html>';
    var w = window.open('', '_blank');
    if (!w) { alert('⚠️ المتصفح منع النافذة المنبثقة. اسمح بالنوافذ المنبثقة لهذه الصفحة ثم أعد المحاولة.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(function () { try { w.focus(); w.print(); } catch (e) {} }, 700);
  };
})();
