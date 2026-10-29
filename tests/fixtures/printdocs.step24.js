// نسخة مجمَّدة من كود «بوابة الإحالة والإخبار الصحي» القديم (script-09 + script-28 + script-30 + كتلة PRINT DOCS من script-10 قبل المرحلة 24) — مرجع اختبار المطابقة فقط
// ──────── script-09.js ────────

    function pd4AddHealthRow() {
      var tbody = document.getElementById('pd4-health-tbody');
      var rows = tbody.querySelectorAll('tr');
      var isEven = rows.length % 2 === 1;
      var tr = document.createElement('tr');
      if (isEven) tr.style.background = '#fff5f5';
      tr.innerHTML = '<td style="border:1px solid #fecaca;padding:0;"><input type="text" style="width:100%;border:none;padding:7px 10px;font-family:Cairo,sans-serif;font-size:0.8rem;outline:none;background:transparent;" placeholder="الإجراء المطلوب..."></td>';
      tbody.appendChild(tr);
    }
    function pd4AddProcedureRow() {
      var tbody = document.getElementById('pd4-health-tbody');
      var rows = tbody.querySelectorAll('tr');
      var isEven = rows.length % 2 === 1;
      var tr = document.createElement('tr');
      if (isEven) tr.style.background = '#fff5f5';
      tr.innerHTML = '<td style="border:1px solid #fecaca;padding:0;text-align:center;"><input type="text" style="width:100%;border:none;padding:7px 10px;font-family:Cairo,sans-serif;font-size:0.8rem;outline:none;background:transparent;text-align:center;" placeholder="الإجراء المطلوب..."></td>';
      tbody.appendChild(tr);
    }
    
// ──────── script-10.js (PRINT DOCS PORTAL) ────────
// ======= PRINT DOCS PORTAL =======
function pdShowTab(n) {
  [3,4].forEach(i => {
    const panel = document.getElementById('pdPanel'+i);
    const tab   = document.getElementById('pdTab'+i);
    if (!panel || !tab) return;
    if (i === n) {
      panel.style.display = 'block';
      tab.style.background = 'rgba(255,255,255,0.22)';
      tab.style.borderBottomColor = '#7fd8ff';
      tab.style.color = '#ffffff';
      tab.style.fontWeight = '800';
    } else {
      panel.style.display = 'none';
      tab.style.background = 'transparent';
      tab.style.borderBottomColor = 'transparent';
      tab.style.color = 'rgba(255,255,255,0.55)';
      tab.style.fontWeight = '700';
    }
  });
  // تفعيل الإكمال التلقائي للتبويب المفتوح
  setTimeout(() => {
    if (typeof acSetup !== 'function') return;
    const nameMap = { 3:'pd3-name', 4:'pd4-name' };
    const nameId = nameMap[n];
    const cfg = typeof AUTOCOMPLETE_FIELDS !== 'undefined' && AUTOCOMPLETE_FIELDS.find(c => c.nameId === nameId);
    if (cfg) acSetup(cfg);
  }, 150);
}

function pdPrint(n) {
  // Mark correct panel for printing
  [3,4].forEach(i => {
    const p = document.getElementById('pdPanel'+i);
    if (p) p.classList.remove('pd-printing');
  });
  const target = document.getElementById('pdPanel'+n);
  if (target) target.classList.add('pd-printing');

  // إخفاء عنوان الصفحة من رأس المتصفح عند الطباعة
  const origTitle = document.title;
  document.title = '';

  // إضافة نقط الملء للحقول الفارغة قبل الطباعة
  const dotLine = '............................................................................................................................................................................................................................................';
  const empties = [];
  if (target) {
    target.querySelectorAll('textarea').forEach(el => {
      if (!el.value.trim()) {
        empties.push({ el, type: 'textarea', orig: el.value });
        el.value = dotLine + '\n' + dotLine + '\n' + dotLine;
        el.style.color = '#ccc';
        el.style.fontSize = '0.45rem';
        el.style.letterSpacing = '0.5px';
      }
    });
    target.querySelectorAll('input[type="text"],input[type="tel"]').forEach(el => {
      if (!el.value.trim()) {
        empties.push({ el, type: 'input', orig: el.value });
        el.value = dotLine;
        el.style.color = '#ccc';
        el.style.fontSize = '0.45rem';
        el.style.letterSpacing = '0.5px';
      }
    });
  }

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      // استعادة العنوان والحقول بعد الطباعة
      document.title = origTitle;
      empties.forEach(({ el, orig }) => {
        el.value = orig;
        el.style.color = '';
        el.style.fontSize = '';
        el.style.letterSpacing = '';
      });
      if (target) target.classList.remove('pd-printing');
    }, 800);
  }, 200);
}

function pdToggleX(box) {
  box.classList.toggle('checked');
}

function pdClearTab(n) {
  const panel = document.getElementById('pdPanel'+n);
  if (!panel) return;
  const today = new Date().toISOString().split('T')[0];
  panel.querySelectorAll('input[type="text"],input[type="tel"],textarea').forEach(el => el.value = '');
  panel.querySelectorAll('input[type="date"]').forEach(el => el.value = /-(dob|ref-date)$/.test(el.id) ? '' : today);
  panel.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
  panel.querySelectorAll('input[type="checkbox"],input[type="radio"]').forEach(el => el.checked = false);
  panel.querySelectorAll('.pd1-xbox').forEach(el => el.classList.remove('checked'));
  if (window.pdSyncChips) pdSyncChips();
  if (window.pdResetEdit) pdResetEdit(n);
}

function pdInit() {
  const today = new Date().toISOString().split('T')[0];
  document.querySelectorAll('#toolPrintdocs input[type="date"]').forEach(el => { if (!el.value && !/-(dob|ref-date)$/.test(el.id)) el.value = today; });
  pdShowTab(3);
  if (window.pdRenderArchives) pdRenderArchives();
  // ربط اسم التلميذ بقائمة التلاميذ في جميع التبويبات
  setTimeout(() => {
    if (typeof acSetup === 'function') {
      AUTOCOMPLETE_FIELDS.filter(cfg =>
        ['pd3-name','pd4-name'].includes(cfg.nameId)
      ).forEach(cfg => acSetup(cfg));
    }
  }, 300);
}

// ──────── script-28.js ────────

(function(){
  function E(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function V(id){ var el=document.getElementById(id); return el?String(el.value||'').trim():''; }
  function clean(t){ return String(t||'').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,'').trim(); }
  function D(t){ t=String(t||'').trim(); var m=t.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?(m[3]+'/'+m[2]+'/'+m[1]):t; }
  function dash(t){ t=String(t||'').trim(); return t?E(t):'—'; }
  function dirName(){ var el=document.querySelector('.dynamic-directorate'); var t=el?el.textContent.trim():''; return t||'مديرية الحي الحسني'; }
  function row(a,b,c,d){
    if(c===undefined) return '<tr><td class="info-lbl">'+a+'</td><td class="info-val" colspan="3">'+b+'</td></tr>';
    return '<tr><td class="info-lbl">'+a+'</td><td class="info-val">'+b+'</td><td class="info-lbl">'+c+'</td><td class="info-val">'+d+'</td></tr>';
  }
  function tbl(rows){ return '<table class="info-table-report" style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:\'Cairo\',sans-serif;margin-bottom:10px;"><tbody>'+rows.join('')+'</tbody></table>'; }
  function head(school,title){
    return '<div class="new-report-header">'
      +'<div class="nrh-logo"><img id="ministry-logo-img" src="" alt="شعار الوزارة" style="width:120px;height:120px;object-fit:contain;display:block;background:white;"></div>'
      +'<div class="nrh-dir">'+E(dirName())+'</div>'
      +'<div class="nrh-school">'+(school?E(school):'المؤسسة التعليمية')+'</div>'
      +'<div class="nrh-title">'+title+'</div></div>';
  }
  function block(t){ return '<div class="report-summary-block">'+E(t)+'</div>'; }

  function buildAssoc(){
    var h=head(V('pd3-school'),'نموذج الإحالة إلى جمعية');
    h+='<div class="report-section-title">بيانات الإحالة</div>'+tbl([
      row('تاريخ الإحالة:',dash(D(V('pd3-date'))),'رقم الإحالة:',dash(V('pd3-ref'))),
      row('درجة الاستعجالية:',dash(clean(V('pd3-urgency'))))
    ]);
    h+='<div class="report-section-title">بيانات المستفيد</div>'+tbl([
      row('الاسم الكامل:',dash(V('pd3-name')),'تاريخ الازدياد:',dash(D(V('pd3-dob')))),
      row('المؤسسة التعليمية:',dash(V('pd3-school')),'القسم:',dash(V('pd3-level'))),
      row('اسم الولي:',dash(V('pd3-parent')),'هاتف الولي:','<span dir="ltr">'+dash(V('pd3-phone'))+'</span>')
    ]);
    h+='<div class="report-section-title">بيانات الجمعية المُحال إليها</div>'+tbl([
      row('اسم الجمعية:',dash(V('pd3-assoc')),'هاتف الجمعية:','<span dir="ltr">'+dash(V('pd3-assoc-phone'))+'</span>'),
      row('العنوان:',dash(V('pd3-assoc-addr')))
    ]);
    h+='<div class="report-section-title">سبب الإحالة والوضعية</div>'+block(V('pd3-reason')||'—');
    var pa=V('pd3-prev-actions');
    if(pa) h+='<div class="report-section-title">الإجراءات السابقة المتخذة داخل المؤسسة</div>'+block(pa);
    var rd=V('pd3-ref-date');
    if(rd) h+=tbl([row('تاريخ استلام الجمعية للإحالة:',dash(D(rd)))]);
    h+=sigBlock();
    return h;
  }

  function dots(t,n){ t=String(t||'').trim(); return t?E(t):new Array((n||30)+1).join('.'); }
  function healthLetter(){
    var td='padding:2px 6px;vertical-align:top;';
    var lbl=td+'font-weight:800;white-space:nowrap;width:1%;';
    var refs=[
      'المادة 15 مرسوم رقم <span dir="ltr">140-24-2</span> / في شأن النظام الأساسي لموظفي وزارة التربية الوطنية',
      'المشروع رقم 04 من القانون الإطار <span dir="ltr">17/51</span>؛',
      'المذكرة رقم <span dir="ltr">042.21</span>، بشأن تكييف المراقبة المستمرة لفائدة التلميذات والتلاميذ في وضعية إعاقة بالتعليم الابتدائي في ضوء البرنامج الوطني للتربية الدامجة.'
    ].map(function(x){ return '<div>- '+x+'</div>'; }).join('');
    return '<div style="direction:rtl;text-align:right;font-family:\'Cairo\',sans-serif;font-size:0.88rem;font-weight:700;line-height:1.9;margin:8px 0 12px;">'
      +'<table style="width:100%;border-collapse:collapse;"><tbody>'
      +'<tr><td style="'+lbl+'">من السيد:</td><td style="'+td+'text-align:center;">المختص الاجتماعي</td></tr>'
      +'<tr><td style="'+td+'"></td><td style="'+td+'text-align:center;">تحت إشراف: السيد مدير المؤسسة</td></tr>'
      +'</tbody></table>'
      +'<div style="margin:12px 6px 10px;">إلى السيدات والسادة أساتذة التلميذ(ة): '+dots(V('pd4-name'),40)
      +' &nbsp;&nbsp; المستوى: '+dots(V('pd4-grade'),14)+' &nbsp;&nbsp; القسم: '+dots(V('pd4-level'),14)+'</div>'
      +'<table style="width:100%;border-collapse:collapse;"><tbody>'
      +'<tr><td style="'+lbl+'font-size:0.95rem;">الموضــوع :</td><td style="'+td+'font-size:0.95rem;">إخبار في شأن الوضعية الصحية للتلميذ</td></tr>'
      +'<tr><td style="'+lbl+'">المرجــــع :</td><td style="'+td+'">'+refs+'</td></tr>'
      +'</tbody></table></div>';
  }

  function buildHealth(){
    var h=head(V('pd4-school'),'إخبار بحالة صحية');
    h+=healthLetter();
    h+=tbl([
      row('تاريخ الإخبار:',dash(D(V('pd4-date'))),'رقم الوثيقة:',dash(V('pd4-ref'))),
      row('تاريخ الازدياد:',dash(D(V('pd4-dob'))),'رمز مسار:',dash(V('pd4-massar'))),
      row('درجة الاستعجالية:',dash(clean(V('pd4-urgency'))))
    ]);
    h+='<div class="report-section-title">وصف الحالة</div>'+block(V('pd4-health-desc')||'—');
    var tb=document.getElementById('pd4-health-tbody'), type='', procs=[];
    if(tb){
      var ta=tb.querySelector('textarea'); type=ta?String(ta.value||'').trim():'';
      tb.querySelectorAll('input[type="text"]').forEach(function(i){ var v=String(i.value||'').trim(); if(v) procs.push(v); });
    }
    if(type||procs.length){
      var list=procs.length?('<ol class="pd-proc-list">'+procs.map(function(x){return '<li>'+E(x)+'</li>';}).join('')+'</ol>'):'—';
      h+='<div class="report-section-title">نوع الحالة والإجراءات اللازمة داخل القسم</div>'
        +'<table class="proc-table-report" style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:\'Cairo\',sans-serif;margin-bottom:10px;">'
        +'<thead><tr style="background:#1a3a5c;color:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;">'
        +'<th style="padding:6px 10px;text-align:center;border:1px solid #0f2a4a;width:35%;">نوع الحالة</th>'
        +'<th style="padding:6px 10px;text-align:right;border:1px solid #0f2a4a;">الإجراءات التي يجب أن تستفيد منها الحالة داخل القسم</th></tr></thead>'
        +'<tbody><tr><td style="text-align:center;font-weight:700;color:#1a3a5c;border:1px solid #cbd5e1;padding:6px 10px;">'+(type?E(type):'—')+'</td>'
        +'<td style="border:1px solid #cbd5e1;padding:6px 10px;">'+list+'</td></tr></tbody></table>';
    }
    h+=teachersBlock();
    h+=sigBlock();
    return h;
  }

  function teachersBlock(){
    var tb=document.getElementById('pd4-teachers-tbody'); if(!tb) return '';
    var names=[]; tb.querySelectorAll('input[type="text"]').forEach(function(i){ names.push(String(i.value||'').trim()); });
    while(names.length<8) names.push('');
    var cell='border:1px solid #cbd5e1;padding:4px 10px;';
    var rows=names.map(function(n,i){
      return '<tr style="height:30px;"><td style="'+cell+'width:8%;text-align:center;">'+(i+1)+'</td><td style="'+cell+'">'+E(n)+'</td><td style="border:1px solid #cbd5e1;width:40%;"></td></tr>';
    }).join('');
    return '<div class="report-section-title">توقيعات الأساتذة</div>'
      +'<table style="width:100%;border-collapse:collapse;font-size:0.82rem;font-family:\'Cairo\',sans-serif;margin-bottom:10px;page-break-inside:avoid;">'
      +'<thead><tr style="background:#1a3a5c;color:white;-webkit-print-color-adjust:exact;print-color-adjust:exact;">'
      +'<th style="padding:6px 10px;border:1px solid #0f2a4a;width:8%;">#</th>'
      +'<th style="padding:6px 10px;border:1px solid #0f2a4a;">اسم الأستاذ(ة)</th>'
      +'<th style="padding:6px 10px;border:1px solid #0f2a4a;width:40%;">التوقيع</th></tr></thead><tbody>'+rows+'</tbody></table>';
  }
  function sigBlock(){
    function box(a,b){ return '<td style="width:50%;border:1px solid #cbd5e1;vertical-align:top;padding:10px 12px;height:95px;"><div style="font-weight:700;color:#1a3a5c;margin-bottom:4px;">'+a+'</div></td>'; }
    return '<div class="report-section-title">التوقيعات والختم</div>'
      +'<table style="width:100%;border-collapse:separate;border-spacing:10px 0;margin-top:6px;page-break-inside:avoid;font-family:\'Cairo\',sans-serif;font-size:0.82rem;"><tbody><tr>'
      +box('المختص الاجتماعي')+box('مدير المؤسسة')+'</tr></tbody></table>';
  }

  var _cur=null;
  window.pdGenerate=function(n){
    _cur=n;
    var box=document.getElementById('pdReportContent'); if(!box) return;
    box.innerHTML = (n===3)?buildAssoc():buildHealth();
    document.getElementById('pdModalTitle').textContent = (n===3)?'📄 نموذج الإحالة إلى جمعية':'📄 وثيقة إخبار بحالة صحية';
    document.getElementById('pdPrintModal').classList.add('open');
    document.querySelectorAll('#pdPrintModal #ministry-logo-img').forEach(function(img){
      if(typeof MINISTRY_LOGO_B64!=='undefined' && MINISTRY_LOGO_B64) img.src=MINISTRY_LOGO_B64;
    });
  };
  window.pdCloseModal=function(){ document.getElementById('pdPrintModal').classList.remove('open'); };
  window.pdPrintDoc=function(){
    if(typeof _waitLogoThenPrint==='function') _waitLogoThenPrint(); else window.print();
  };
  window.pdExportWord=function(){
    if(typeof exportToWord==='function') exportToWord('pdReportContent', _cur===4?'وثيقة_إخبار_بحالة_صحية':'نموذج_الإحالة_إلى_جمعية');
  };
})();

// ──────── script-30.js ────────

(function(){
  function $(id){ return document.getElementById(id); }
  function esc(t){ return String(t==null?'':t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function toast(m,type){ if(typeof showToast==='function') showToast(m,type||'success'); else alert(m); }

  /* ───────── خيارات الملء ───────── */
  var HEALTH_COND=[
    ['الربو','يعاني التلميذ(ة) من الربو وضيق التنفس، وتزداد الأعراض عند بذل مجهود بدني أو التعرض للغبار والبرد.'],
    ['السكري','يعاني التلميذ(ة) من داء السكري ويحتاج إلى مراقبة منتظمة لمستوى السكر وتناول وجبات خفيفة في أوقات محددة.'],
    ['الصرع','يعاني التلميذ(ة) من الصرع وقد تظهر لديه نوبات تشنجية مفاجئة تستدعي احتياطات خاصة داخل القسم.'],
    ['الحساسية','يعاني التلميذ(ة) من حساسية (غذائية / موسمية / جلدية) قد تظهر على شكل طفح جلدي أو ضيق في التنفس.'],
    ['أمراض القلب','يعاني التلميذ(ة) من مرض في القلب ويُمنع من الجهد البدني الشديد ويتطلب مراقبة مستمرة.'],
    ['فقر الدم والإرهاق','يعاني التلميذ(ة) من فقر الدم ويظهر عليه التعب والإرهاق وشحوب في الوجه وصعوبة في التركيز.'],
    ['ضعف البصر','يعاني التلميذ(ة) من ضعف في البصر ويجد صعوبة في قراءة السبورة من مسافة بعيدة.'],
    ['ضعف السمع','يعاني التلميذ(ة) من ضعف في السمع ويحتاج إلى الجلوس قرب الأستاذ(ة) ووضوح في الشرح.'],
    ['صداع ودوار','يشتكي التلميذ(ة) من صداع متكرر ودوار يؤثران على انتباهه وتحصيله الدراسي.'],
    ['اضطرابات هضمية','يعاني التلميذ(ة) من اضطرابات في الجهاز الهضمي (آلام في البطن / قيء / إسهال) تستدعي الخروج المتكرر.'],
    ['أمراض جلدية','يعاني التلميذ(ة) من مرض جلدي يستدعي عناية ونظافة خاصة وقد يؤثر على اندماجه داخل القسم.'],
    ['إصابة أو كسر','تعرض التلميذ(ة) لإصابة (كسر / التواء / جرح) تحد من حركته وتستلزم رعاية خاصة داخل المؤسسة.'],
    ['عملية جراحية','خضع التلميذ(ة) لعملية جراحية ويمر بفترة نقاهة تتطلب تخفيف المجهود ومتابعة طبية.'],
    ['مرض مزمن','يعاني التلميذ(ة) من مرض مزمن يتطلب علاجاً ومتابعة طبية منتظمة.'],
    ['مرض معدٍ','يعاني التلميذ(ة) من مرض معدٍ يتطلب أخذ الاحتياطات اللازمة ومراعاة مدة الانقطاع الموصى بها طبياً.'],
    ['اضطراب نفسي','تظهر على التلميذ(ة) علامات اضطراب نفسي (قلق / انطواء / حزن مستمر) تستدعي مواكبة نفسية واجتماعية.'],
    ['اضطراب النطق','يعاني التلميذ(ة) من اضطراب في النطق يؤثر على مشاركته الشفهية داخل القسم.'],
    ['سوء التغذية','تظهر على التلميذ(ة) علامات سوء التغذية ونحافة ملحوظة وضعف في النشاط.']
  ];
  var HEALTH_DET=[
    ['منذ أيام','ظهرت الأعراض منذ بضعة أيام.'],
    ['منذ أسابيع','ظهرت الأعراض منذ بضعة أسابيع.'],
    ['منذ أشهر','ظهرت الأعراض منذ عدة أشهر.'],
    ['منذ سنوات','الحالة قائمة منذ سنوات.'],
    ['أعراض متكررة','الأعراض متكررة وتظهر بشكل متقطع.'],
    ['شهادة طبية','أدلى الولي بشهادة طبية تؤكد الحالة.'],
    ['بدون شهادة طبية','لم تُدلَ بعد بشهادة طبية، ويُرجى إحضارها.'],
    ['يتابع العلاج','يتابع العلاج بانتظام تحت إشراف طبيب مختص.'],
    ['تؤثر على التحصيل','تؤثر الحالة على الانتباه والتحصيل الدراسي وعلى انتظام الحضور.'],
    ['تحتاج مراقبة','تحتاج الحالة إلى مراقبة مستمرة من طرف الأساتذة والإدارة.']
  ];
  var REASON=[
    ['صعوبات التعلم','يعاني التلميذ(ة) من صعوبات في التعلم وتأخر دراسي ملحوظ يستدعي دعماً تربوياً متخصصاً.'],
    ['الغياب المتكرر','يسجل التلميذ(ة) غياباً متكرراً وغير مبرر يهدد استمراره في الدراسة.'],
    ['خطر الهدر المدرسي','التلميذ(ة) معرّض لخطر الانقطاع عن الدراسة والهدر المدرسي.'],
    ['وضعية أسرية صعبة','يعيش التلميذ(ة) وضعية أسرية صعبة (تفكك أسري / فقدان أحد الوالدين / نزاعات).'],
    ['هشاشة اجتماعية واقتصادية','تعاني أسرة التلميذ(ة) من هشاشة اجتماعية واقتصادية وتحتاج إلى مساعدة (لوازم مدرسية / تغذية / نقل).'],
    ['العنف أو سوء المعاملة','تعرض التلميذ(ة) لعنف أو سوء معاملة ويحتاج إلى حماية ومواكبة نفسية واجتماعية.'],
    ['التنمر','يتعرض التلميذ(ة) للتنمر من طرف زملائه ويحتاج إلى دعم نفسي واجتماعي.'],
    ['سلوك عدواني','يُسجَّل لدى التلميذ(ة) سلوك عدواني واضطراب في الانضباط يتطلب تدخلاً متخصصاً.'],
    ['دعم نفسي واجتماعي','يحتاج التلميذ(ة) إلى دعم نفسي واجتماعي بسبب القلق والانطواء وضعف الثقة بالنفس.'],
    ['احتياجات خاصة / إعاقة','التلميذ(ة) في وضعية إعاقة أو لديه احتياجات خاصة تستلزم تكفلاً من جمعية مختصة.'],
    ['وضعية صحية','يعاني التلميذ(ة) من وضعية صحية تستدعي تكفلاً وعلاجاً خارج المؤسسة.'],
    ['سلوكيات محفوفة بالمخاطر','تظهر على التلميذ(ة) سلوكيات محفوفة بالمخاطر (تدخين / مخدرات / صحبة سيئة) تستدعي التوعية والمواكبة.'],
    ['التوجيه والإدماج المهني','يحتاج التلميذ(ة) إلى توجيه وتكوين مهني أو إدماج في برنامج للفرصة الثانية.']
  ];
  var PREV=[
    ['مقابلة فردية','أُجريت مقابلة فردية مع التلميذ(ة) من طرف المختص الاجتماعي.'],
    ['استدعاء الولي','تم استدعاء ولي الأمر وعقد جلسة معه.'],
    ['اتصال هاتفي','تم الاتصال هاتفياً بولي الأمر.'],
    ['جلسة مع الأساتذة','عُقدت جلسة مع الفريق التربوي لتدارس وضعية التلميذ(ة).'],
    ['تتبع داخل المؤسسة','تم تتبع الحالة داخل المؤسسة بتنسيق مع الأساتذة والإدارة.'],
    ['زيارة منزلية','تم القيام بزيارة منزلية للتعرف على ظروف التلميذ(ة).'],
    ['خلية اليقظة','عُرضت الحالة على خلية اليقظة بالمؤسسة.'],
    ['لم تنجح الإجراءات','لم تسفر الإجراءات المتخذة عن تحسن، مما استدعى الإحالة.']
  ];
  var CHIPS=[
    {box:'pd4-health-chips', target:'pd4-health-desc', syncType:true, groups:[['اختر الحالة الصحية (يمكن اختيار أكثر من حالة):',HEALTH_COND],['تفاصيل إضافية:',HEALTH_DET]]},
    {box:'pd3-reason-chips', target:'pd3-reason', groups:[['اختر سبب الإحالة (يمكن اختيار أكثر من سبب):',REASON]]},
    {box:'pd3-prev-chips',   target:'pd3-prev-actions', groups:[['الإجراءات المتخذة:',PREV]]}
  ];
  var CONDSET={}; HEALTH_COND.forEach(function(c){ CONDSET[c[0]]=1; });

  function syncOne(cfg){
    var ta=$(cfg.target), box=$(cfg.box); if(!ta||!box) return;
    var v=ta.value;
    box.querySelectorAll('.pd-chip[data-txt]').forEach(function(b){ b.classList.toggle('on', v.indexOf(b.getAttribute('data-txt'))>-1); });
  }
  function syncType(cfg){
    if(!cfg.syncType) return;
    var tb=$('pd4-health-tbody'); if(!tb) return;
    var ta=tb.querySelector('textarea'); if(!ta) return;
    var labels=[]; $(cfg.box).querySelectorAll('.pd-chip.on[data-lbl]').forEach(function(b){ if(CONDSET[b.getAttribute('data-lbl')]) labels.push(b.getAttribute('data-lbl')); });
    var auto=labels.join(' / ');
    if(!ta.value.trim() || ta.getAttribute('data-auto')===ta.value){ ta.value=auto; ta.setAttribute('data-auto',auto); }
  }
  function toggle(cfg,txt){
    var ta=$(cfg.target); if(!ta) return;
    var v=ta.value;
    if(v.indexOf(txt)>-1){ v=v.replace(txt,'').replace(/\n{2,}/g,'\n').replace(/^\s+|\s+$/g,''); }
    else { v=v.replace(/\s+$/,''); v=v?(v+'\n'+txt):txt; }
    ta.value=v; syncOne(cfg); syncType(cfg);
  }
  function buildChips(){
    CHIPS.forEach(function(cfg){
      var box=$(cfg.box); if(!box||box.getAttribute('data-built')) return;
      box.setAttribute('data-built','1');
      var h='';
      cfg.groups.forEach(function(g){
        h+='<div class="pd-chip-title">'+esc(g[0])+'</div>';
        g[1].forEach(function(it){ h+='<button type="button" class="pd-chip" data-lbl="'+esc(it[0])+'" data-txt="'+esc(it[1])+'">'+esc(it[0])+'</button>'; });
      });
      h+='<button type="button" class="pd-chip pd-chip-clear" data-clear="1">✕ مسح النص</button>';
      box.innerHTML=h;
      box.addEventListener('click',function(e){
        var b=e.target.closest('.pd-chip'); if(!b) return;
        if(b.getAttribute('data-clear')){ var ta=$(cfg.target); if(ta){ ta.value=''; } syncOne(cfg); syncType(cfg); return; }
        toggle(cfg,b.getAttribute('data-txt'));
      });
      var ta=$(cfg.target); if(ta) ta.addEventListener('input',function(){ syncOne(cfg); });
    });
  }
  window.pdSyncChips=function(){ CHIPS.forEach(function(c){ syncOne(c); }); };
  buildChips();

  /* ───────── إضافة أستاذ(ة) ───────── */
  window.pd4AddTeacherRow=function(){
    var tb=$('pd4-teachers-tbody'); if(!tb) return;
    var tr=document.createElement('tr'); tr.style.height='36px';
    if(tb.querySelectorAll('tr').length%2===1) tr.style.background='#fff5f5';
    tr.innerHTML='<td style="border:1px solid #fecaca;padding:4px 8px;text-align:center;"><input type="text" style="width:100%;border:none;padding:3px 6px;font-family:\'Cairo\',sans-serif;font-size:0.8rem;outline:none;background:transparent;text-align:center;" placeholder="الاسم الكامل..."></td><td style="border:1px solid #fecaca;"></td>';
    tb.appendChild(tr);
  };

  /* ───────── الأرشيف ───────── */
  var CFG={
    3:{key:'pdAssocArchive', panel:'pdPanel3', nameId:'pd3-name', label:'نموذج الإحالة إلى جمعية', color:'#5b21b6'},
    4:{key:'pdHealthArchive',panel:'pdPanel4', nameId:'pd4-name', label:'وثيقة إخبار بحالة صحية', color:'#b91c1c'}
  };
  var editId={3:null,4:null};
  function getA(n){ return (window.appData && appData[CFG[n].key]) || []; }
  function saveA(n,arr){ appData[CFG[n].key]=arr; if(typeof saveUserKey==='function') saveUserKey(CFG[n].key); }
  function dfmt(d){ var m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m?(m[3]+'/'+m[2]+'/'+m[1]):(d||'—'); }
  function clean(t){ return String(t||'').replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,'').trim(); }

  function collect(n){
    var panel=$(CFG[n].panel), f={};
    panel.querySelectorAll('input[id],textarea[id],select[id]').forEach(function(el){ f[el.id]=el.value; });
    var e={fields:f};
    if(n===4){
      var tt=$('pd4-teachers-tbody'); e.teachers=[]; if(tt) tt.querySelectorAll('input[type="text"]').forEach(function(i){ e.teachers.push(i.value||''); });
      var hb=$('pd4-health-tbody'); e.type=''; e.procs=[];
      if(hb){ var ta=hb.querySelector('textarea'); e.type=ta?ta.value:''; hb.querySelectorAll('input[type="text"]').forEach(function(i){ e.procs.push(i.value||''); }); }
    }
    return e;
  }
  function restore(n,e){
    if(typeof pdClearTab==='function') pdClearTab(n);
    var f=e.fields||{};
    Object.keys(f).forEach(function(id){ var el=$(id); if(el) el.value=f[id]; });
    if(n===4){
      var tt=$('pd4-teachers-tbody');
      if(tt){ while(tt.querySelectorAll('input[type="text"]').length<(e.teachers||[]).length) pd4AddTeacherRow();
        var ti=tt.querySelectorAll('input[type="text"]'); (e.teachers||[]).forEach(function(v,i){ ti[i].value=v; }); }
      var hb=$('pd4-health-tbody');
      if(hb){ while(hb.querySelectorAll('input[type="text"]').length<(e.procs||[]).length) pd4AddProcedureRow();
        var pi=hb.querySelectorAll('input[type="text"]'); (e.procs||[]).forEach(function(v,i){ pi[i].value=v; });
        var ta=hb.querySelector('textarea'); if(ta){ ta.value=e.type||''; ta.removeAttribute('data-auto'); } }
    }
    pdSyncChips();
  }

  window.pdResetEdit=function(n){ editId[n]=null; };

  window.pdSaveToArchive=function(n){
    var name=($(CFG[n].nameId).value||'').trim();
    if(!name){ alert('⚠️ يرجى إدخال اسم التلميذ(ة) أولاً.'); return; }
    var data=collect(n), f=data.fields;
    var entry={
      id:Date.now(), savedAt:new Date().toLocaleString('ar-MA'), studentName:name,
      date:(n===3?f['pd3-date']:f['pd4-date'])||'', ref:(n===3?f['pd3-ref']:f['pd4-ref'])||'',
      urgency:clean(n===3?f['pd3-urgency']:f['pd4-urgency']),
      extra:(n===3?(f['pd3-assoc']||''):(data.type||'')),
      fields:data.fields, teachers:data.teachers, type:data.type, procs:data.procs
    };
    var arr=getA(n).slice(), upd=false;
    if(editId[n]){ var ix=arr.findIndex(function(x){ return x.id===editId[n]; }); if(ix>-1){ entry.id=editId[n]; arr[ix]=entry; upd=true; } }
    if(!upd) arr.unshift(entry);
    saveA(n,arr); editId[n]=null; pdRenderArch(n);
    var body=$('pdArch'+n+'Body'); if(body && !body.classList.contains('open')){ body.classList.add('open'); $('pdArch'+n+'Arrow').textContent='▲'; }
    toast(upd?('✅ تم تحديث ملف "'+name+'" في الأرشيف.'):('✅ تم حفظ ملف "'+name+'" في الأرشيف.'));
  };

  window.pdToggleArch=function(n){
    var b=$('pdArch'+n+'Body'), a=$('pdArch'+n+'Arrow'); b.classList.toggle('open'); a.textContent=b.classList.contains('open')?'▲':'▼';
  };

  window.pdRenderArch=function(n){
    var cnt=$('pdArch'+n+'Count'), list=$('pdArch'+n+'List'); if(!cnt||!list) return;
    var arr=getA(n); cnt.textContent=arr.length;
    var q=(($('pdArch'+n+'Search')||{}).value||'').trim().toLowerCase();
    var rows=q?arr.filter(function(e){ return String(e.studentName||'').toLowerCase().indexOf(q)>-1; }):arr;
    if(!rows.length){ list.innerHTML='<div class="archive-empty">'+(q?'🔍 لا توجد نتائج.':'📂 لا توجد ملفات محفوظة بعد.<br><small>اضغط "حفظ في الأرشيف" لإضافة الملف الحالي.</small>')+'</div>'; return; }
    var c=CFG[n].color, h3=(n===3?'الجمعية':'نوع الحالة');
    var bs='border:none;border-radius:6px;padding:4px 8px;cursor:pointer;font-size:0.72rem;font-family:\'Cairo\',sans-serif;font-weight:700;color:#fff;';
    list.innerHTML='<div style="overflow-x:auto;"><table class="archive-table"><thead><tr><th>#</th><th>اسم التلميذ(ة)</th><th>'+h3+'</th><th>التاريخ</th><th>الاستعجالية</th><th>رقم الوثيقة</th><th>إجراء</th></tr></thead><tbody>'
      +rows.map(function(e,i){
        return '<tr><td style="text-align:center;color:#64748b;font-size:0.75rem;">'+(i+1)+'</td>'
          +'<td><strong style="color:'+c+';">'+(n===3?'🏛️ ':'🏥 ')+esc(e.studentName)+'</strong></td>'
          +'<td>'+(e.extra?esc(e.extra):'—')+'</td>'
          +'<td style="text-align:center;white-space:nowrap;">📅 '+esc(dfmt(e.date))+'</td>'
          +'<td style="text-align:center;">'+(e.urgency?esc(e.urgency):'—')+'</td>'
          +'<td style="text-align:center;">'+(e.ref?esc(e.ref):'—')+'</td>'
          +'<td><div style="display:flex;gap:5px;justify-content:center;">'
          +'<button style="'+bs+'background:linear-gradient(135deg,#2563a8,#1d4ed8);" onclick="pdLoadEntry('+n+','+e.id+')" title="تحميل للتعديل">✏️</button>'
          +'<button style="'+bs+'background:linear-gradient(135deg,#0f766e,#0d9488);" onclick="pdPreviewEntry('+n+','+e.id+')" title="معاينة وطباعة">🖨️</button>'
          +'<button style="'+bs+'background:linear-gradient(135deg,#991b1b,#dc2626);" onclick="pdDeleteEntry('+n+','+e.id+')" title="حذف">🗑</button>'
          +'</div></td></tr>';
      }).join('')+'</tbody></table></div>';
  };

  window.pdLoadEntry=function(n,id){
    var e=getA(n).find(function(x){ return x.id===id; }); if(!e) return;
    if(typeof pdShowTab==='function') pdShowTab(n);
    restore(n,e); editId[n]=id;
    window.scrollTo({top:0,behavior:'smooth'});
    toast('✏️ تم تحميل الملف — عدّل ثم اضغط "حفظ في الأرشيف" لتحديثه.','info');
  };
  window.pdPreviewEntry=function(n,id){
    var e=getA(n).find(function(x){ return x.id===id; }); if(!e) return;
    if(typeof pdShowTab==='function') pdShowTab(n);
    restore(n,e); editId[n]=id;
    if(typeof pdGenerate==='function') pdGenerate(n);
  };
  window.pdDeleteEntry=function(n,id){
    if(!confirm('حذف هذا الملف من الأرشيف؟')) return;
    saveA(n,getA(n).filter(function(x){ return x.id!==id; }));
    if(editId[n]===id) editId[n]=null;
    pdRenderArch(n);
  };
  window.pdClearArch=function(n){
    var arr=getA(n); if(!arr.length){ alert('📂 الأرشيف فارغ بالفعل.'); return; }
    if(!confirm('⚠️ سيتم حذف جميع الملفات ('+arr.length+' ملف) نهائياً.\n\nهل أنت متأكد من المسح الكامل؟')) return;
    saveA(n,[]); editId[n]=null; pdRenderArch(n);
  };
  window.pdRenderArchives=function(){ pdRenderArch(3); pdRenderArch(4); };
})();
