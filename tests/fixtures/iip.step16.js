
(function(){
const $=id=>document.getElementById(id);
const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const usr=()=>{try{return typeof currentUser!=='undefined'&&currentUser||''}catch(e){return ''}};
const KEY=()=>'app:iip:'+usr();
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

/* ---------- مكتبة النماذج التدخلية (مستمدة من الممارسة الدولية للعمل الاجتماعي المدرسي) ---------- */
const MODELS={
sfbt:{n:'العلاج المركّز على الحلول (SFBT)',en:'Solution-Focused Brief Therapy',o:'طوّره ستيف دي شازر وإنسو كيم بيرغ (العمل الاجتماعي الأسري المختصر). يركّز على المستقبل ونقاط القوة لا على تحليل المشكلة.',tier:'المستوى 2–3',sess:'3 إلى 6 جلسات',
 fit:'تلاميذ صعبو الانخراط، تعثر دراسي، سلوك، قلق خفيف، رفض الذهاب للمدرسة.',
 steps:['بناء التحالف وتحديد «الهدف المفضَّل» بلغة التلميذ(ة)','سؤال المعجزة: كيف ستكون الحياة المدرسية لو اختفت المشكلة؟','البحث عن الاستثناءات: متى تكون المشكلة أقل أو غائبة؟','أسئلة التدرّج (0–10): أين أنت الآن؟ وما الذي يرفعك درجة واحدة؟','الثناء ومنح مهمة صغيرة: لاحظ ما ينجح وكرّره','في كل جلسة لاحقة: ما الذي تحسّن منذ آخر لقاء؟'],
 tech:['سؤال المعجزة','أسئلة الاستثناء','أسئلة التدرّج','أسئلة المواجهة (Coping)','رسالة ختام: ثناء + مهمة'],
 ind:'درجة التدرّج، عدد الاستثناءات الملاحظة، تحقق الهدف المفضَّل.',
 ev:'أظهر تحليل تلوي حديث (9 تجارب) أثراً كبيراً لصالح SFBT في مشكلات المراهقين المدرسية، مع التحفظ على صغر العينات.'},
mi:{n:'المقابلة التحفيزية (MI)',en:'Motivational Interviewing',o:'أسلوب حواري تعاوني (ميلر ورولنيك) يعزز الدافعية الداخلية للتغيير ويقلل المقاومة.',tier:'المستوى 2–3',sess:'2 إلى 5 جلسات',
 fit:'التغيب المتكرر، الهدر المدرسي، التردد في تغيير سلوك، المراهقون الرافضون للمساعدة.',
 steps:['الانخراط: بناء علاقة دون أحكام','التركيز: الاتفاق على موضوع التغيير','الاستحضار: استخراج «حديث التغيير» (الأسباب، القدرة، الاستعداد)','التخطيط: خطوة واضحة وممكنة بموافقة التلميذ(ة)'],
 tech:['OARS: أسئلة مفتوحة، تأكيد، إصغاء عاكس، تلخيص','مقياس الأهمية والثقة (0–10)','الموازنة بين إيجابيات وسلبيات التغيير','استخراج الحديث التحفيزي'],
 ind:'مقياس الأهمية/الثقة، التزام التلميذ(ة) بالخطوة، انخفاض الغياب.',
 ev:'من الممارسات القائمة على الأدلة المعتمدة في المدارس ضمن الدروس الجامعية للعمل الاجتماعي المدرسي.'},
cbt:{n:'العلاج المعرفي السلوكي المكيَّف مدرسياً (CBT)',en:'Cognitive-Behavioral Therapy',o:'يربط الأفكار بالانفعالات والسلوك ويدرّب على مهارات بديلة (آرون بيك).',tier:'المستوى 2–3',sess:'6 إلى 10 جلسات',
 fit:'القلق والمزاج المنخفض، الغضب والعدوانية، ضعف تقدير الذات، التنمر (ضحية/معتدٍ).',
 steps:['التثقيف النفسي: مثلث الفكرة—الشعور—السلوك','رصد الأفكار التلقائية بسجل يومي','تحدّي الأفكار السلبية واستبدالها بأخرى واقعية','تدريب على مهارات: الاسترخاء، حل المشكلات، التواصل الحازم','تعريض تدريجي للمواقف الصعبة + تعزيز','منع الانتكاس وتثبيت المكتسبات'],
 tech:['سجل الأفكار','سلّم التعريض التدريجي','الاسترخاء والتنفس','لعب الأدوار','واجبات بين الجلسات'],
 ind:'درجات القلق/الغضب (0–10)، عدد الوقائع، استعمال المهارة.',
 ev:'مُدرج ضمن الممارسات الفعّالة الأساسية للأخصائيين الاجتماعيين المدرسيين.'},
tcp:{n:'الممارسة المرتكزة على المهام (Task-Centered)',en:'Task-Centered Practice',o:'نموذج قصير المدى (ريد وإبشتاين) يحوّل المشكلة إلى مهام ملموسة قابلة للإنجاز.',tier:'المستوى 2',sess:'6 إلى 8 جلسات',
 fit:'مشكلات عملية: التنظيم، الواجبات، علاقة مع أستاذ، التكيف مع مدرسة جديدة، اضطراب الروتين.',
 steps:['تحديد 1–3 مشكلات مستهدفة بالاتفاق','صياغة هدف عام ثم مهام فرعية','التخطيط للمهمة: متى؟ أين؟ مع من؟ ما العائق؟','التنفيذ ثم المراجعة في الجلسة التالية','تعديل المهام أو إغلاق المشكلة'],
 tech:['عقد المهام','تفكيك المهمة إلى خطوات','التدرّب القبلي','مراجعة العوائق'],
 ind:'نسبة المهام المنجزة، تقلّص المشكلة المستهدفة.',
 ev:'نموذج كلاسيكي في العمل الاجتماعي ثبتت فائدته في التدخلات القصيرة.'},
cico:{n:'تسجيل الدخول والخروج (CICO)',en:'Check-In / Check-Out',o:'تدخل من المستوى 2 ضمن نظام الدعم متعدد المستويات (MTSS/PBIS): مرشد بالغ يلتقي التلميذ(ة) صباحاً ومساءً مع بطاقة سلوك يومية.',tier:'المستوى 2',sess:'يومي (5 دقائق) لمدة 4–8 أسابيع',
 fit:'سلوكات مزعجة متكررة، ضعف الانضباط، غياب بسيط، حاجة إلى حضور بالغ داعم.',
 steps:['اختيار 2–3 توقعات سلوكية إيجابية (محددة وقابلة للقياس)','لقاء صباحي: ترحيب، مراجعة البطاقة والهدف اليومي','تنقيط الأستاذ(ة) لكل حصة (0–2) مع تغذية راجعة','لقاء مسائي: جمع النقاط وتعزيز الإنجازات','إرسال البطاقة للأسرة وتوقيعها','تقليص الدعم تدريجياً عند بلوغ الهدف (مثلاً 80% من النقاط)'],
 tech:['بطاقة السلوك اليومية','التعزيز الإيجابي','تغذية راجعة فورية','تواصل أسري يومي'],
 ind:'نسبة النقاط اليومية، عدد الوقائع/الأسبوع، الحضور.',
 ev:'تدخل مدرسي واسع الاستعمال ضمن المنظومات متعددة المستويات.'},
tic:{n:'التدخل المراعي للصدمة (Trauma-Informed)',en:'Trauma-Informed / TF-CBT',o:'يقوم على السلامة، الثقة، التمكين، وتجنب إعادة الإيذاء؛ ويستلهم من مكونات TF-CBT.',tier:'المستوى 3',sess:'8 إلى 12 جلسة (مع شريك صحي)',
 fit:'العنف، سوء المعاملة، فقدان، تغيّر مفاجئ في السلوك أو الانتباه، فرط اليقظة.',
 steps:['ضمان السلامة وإشراك ولي أمر داعم','التثقيف النفسي حول ردود فعل الصدمة','مهارات التنظيم الانفعالي والاسترخاء','معالجة الأفكار حول الحدث بتدرّج وبإيقاع التلميذ(ة)','تعزيز السلامة والمعنى والعلاقات الداعمة','التنسيق مع الصحة النفسية والحماية'],
 tech:['منطقة الأمان','تنظيم الانفعال','سرد تدريجي (حسب الاستعداد)','خطة سلامة'],
 ind:'أعراض الاستثارة والتجنب، الشعور بالأمان (0–10)، الانتظام الدراسي.',
 ev:'أُدرج ضمن الممارسات المدرسية المعتمدة؛ لا يغني عن إحالة طبية/نفسية عند الحاجة.'},
wrap:{n:'إدارة الحالة والرعاية المحيطة (Wraparound)',en:'Case Management / Wraparound',o:'تنسيق خدمات الأسرة والمدرسة والمجتمع حول التلميذ(ة) وفق منظور النظم البيئية.',tier:'المستوى 3',sess:'متابعة شهرية + اجتماعات فريق',
 fit:'حالات معقدة متعددة العوامل: فقر، تفكك أسري، هدر، إعاقة، خطر على الطفل.',
 steps:['تقييم شامل للنظم (أسرة، مدرسة، حي، خدمات)','تكوين فريق رعاية: أسرة + مدرسة + شركاء','خطة موحّدة بأهداف وأدوار ومواعيد','تعبئة الموارد (دعم اجتماعي، صحة، جمعيات)','اجتماعات مراجعة دورية وتعديل الخطة','انتقال تدريجي إلى الاستقلال'],
 tech:['الخريطة البيئية (Ecomap)','الجينوغرام','اجتماع الفريق','اتفاقية شراكة'],
 ind:'عدد الخدمات المفعَّلة، حضور الأسرة، استقرار الانتظام الدراسي.',
 ev:'يتكامل مع مقاربة المستويات الثلاثة (MTSS) والنظرية البيئية.'},
crisis:{n:'التدخل في الأزمات (نموذج روبرتس ذو 7 مراحل)',en:'Crisis Intervention',o:'تدخل فوري قصير لاستعادة التوازن بعد حدث حاد (عنف، فقدان، تهديد بإيذاء النفس).',tier:'عاجل',sess:'1 إلى 3 جلسات + متابعة',
 fit:'حدث صادم، رد فعل حاد، فقدان، تهديد بالإيذاء.',
 steps:['تقييم الخطورة والسلامة الفورية','إقامة اتصال داعم','تحديد المشكلات الرئيسية','التعامل مع المشاعر وتفريغها','استكشاف البدائل','وضع خطة عمل','المتابعة خلال 24–72 ساعة ثم أسبوع'],
 tech:['تقييم الخطورة','التهدئة','خطة سلامة','الإحالة العاجلة'],
 ind:'زوال الخطر، استعادة الأداء الوظيفي، تفعيل شبكة دعم.',
 ev:'عند وجود خطر على الحياة: إشعار الأسرة والإدارة وإحالة فورية للجهات المختصة.'}
};
const DOM={
abs:['الغياب والانقطاع',['mi','sfbt','cico','wrap']],
beh:['السلوك والانضباط',['cico','cbt','tcp','sfbt']],
vio:['العنف والتنمر',['cbt','tic','wrap','crisis']],
emo:['القلق والحالة الانفعالية',['cbt','sfbt','tic']],
fam:['صعوبات أسرية',['wrap','tcp','sfbt']],
acad:['التعثر الدراسي',['sfbt','mi','tcp','cico']],
drop:['خطر الهدر المدرسي',['mi','wrap','cico','sfbt']],
loss:['أزمة أو فقدان',['crisis','tic','sfbt']],
adapt:['التكيف والإدماج (بما فيه الإعاقة)',['tcp','wrap','cico']]
};

/* ---------- الحالة والتخزين ---------- */
let ALL=[],cur=null,t;
const blank=()=>({id:'iip_'+Date.now(),opened:today(),status:'نشط',domain:'',models:[],primary:'',goals:[{}],sessions:[],referral:{},consent:{},assess:{},baseline:{},roles:{},schedule:{},review:{},post:{},strategies:''});
function load(){try{ALL=JSON.parse(localStorage.getItem(KEY())||'[]')}catch(e){ALL=[]}}
function store(){try{localStorage.setItem(KEY(),JSON.stringify(ALL))}catch(e){msg('تعذّر الحفظ: مساحة التخزين ممتلئة',1)}}
function msg(m,e){const x=$('iip_msg');if(x){x.textContent=m;x.style.color=e?'#b91c1c':'#0f766e'}}
function gp(o,p){return p.split('.').reduce((a,k)=>a==null?a:a[k],o)}
function sp(o,p,v){const a=p.split('.');let x=o;a.slice(0,-1).forEach(k=>x=x[k]||(x[k]={}));x[a[a.length-1]]=v}
function save(quiet){
  sync();
  if(!cur.studentName||!cur.studentName.trim()){if(!quiet)msg('⚠️ أدخل اسم التلميذ(ة) أولاً',1);return false}
  cur.updated=new Date().toISOString();
  const i=ALL.findIndex(x=>x.id===cur.id);if(i<0)ALL.unshift(JSON.parse(JSON.stringify(cur)));else ALL[i]=JSON.parse(JSON.stringify(cur));
  store();archive();if(!quiet)msg('✅ تم حفظ البرنامج');return true}
const later=()=>{clearTimeout(t);t=setTimeout(()=>save(true),700)};


/* طباعة A4 عمودية: إطار بحجم الورقة (210×297مم) */
function iipPrint(body){
  const old=document.getElementById('iipPrintFrame');if(old)old.remove();
  const fr=document.createElement('iframe');fr.id='iipPrintFrame';
  fr.style.cssText='position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;visibility:hidden;';
  document.body.appendChild(fr);
  const d=fr.contentWindow.document;d.open();
  d.write('<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title> </title><style>@page{size:A4 portrait;margin:0}table.pg{width:100%;border-collapse:collapse}table.pg>thead td,table.pg>tfoot td{height:9mm;padding:0;border:0}table.pg>tbody>tr>td{padding:0;border:0}</style><style>'+CSS+'</style></head><body><table class="pg"><thead><tr><td></td></tr></thead><tbody><tr><td>'+body+'</td></tr></tbody><tfoot><tr><td></td></tr></tfoot></table></body></html>');
  d.close();
  let done=false;const go=()=>{if(done)return;done=true;try{fr.contentWindow.focus();fr.contentWindow.print()}catch(e){console.warn(e)}setTimeout(()=>fr.remove(),60000)};
  const img=d.querySelector('.nrh-logo img');
  const ready=new Promise(r=>{if(!img||img.complete)return r();img.onload=r;img.onerror=r});
  Promise.race([ready,new Promise(r=>setTimeout(r,2500))]).then(()=>setTimeout(go,200));
}
/* ---------- واجهة ---------- */
function fill(){
  document.querySelectorAll('#toolIip [data-k]').forEach(el=>{const v=gp(cur,el.dataset.k);
    if(el.type==='checkbox')el.checked=!!v;else el.value=v==null?'':v});
  $('iip_domain').value=cur.domain||'';
  models();goals();sess();archive();progress();sugg();injectSG();msg('')}
function domSel(){$('iip_domain').innerHTML='<option value="">— اختر —</option>'+Object.keys(DOM).map(k=>`<option value="${k}">${DOM[k][0]}</option>`).join('')}
function models(){
  const rec=cur.domain&&DOM[cur.domain]?DOM[cur.domain][1]:[];
  $('iip_models').innerHTML=Object.keys(MODELS).map(k=>{const m=MODELS[k],on=cur.models.includes(k),pr=cur.primary===k;
    return `<div class="iip-m ${on?'on':''}" data-act="pick" data-m="${k}"><div class="iip-mh"><b>${m.n}</b>${rec.includes(k)?'<span class="iip-star">⭐ موصى به</span>':''}</div><div class="iip-me">${m.en} · ${m.tier}</div><div class="iip-mf">${m.fit}</div>${on?`<div class="iip-pri">${pr?'✔ نموذج رئيسي':'<u data-act="primary" data-m="'+k+'">اجعله رئيسياً</u>'}</div>`:''}</div>`}).join('');
  $('iip_mdetail').innerHTML=cur.models.map(k=>{const m=MODELS[k];
    return `<div class="iip-d"><h4>${m.n}${cur.primary===k?' — (رئيسي)':''}</h4><p>${m.o}</p><div class="iip-cols"><div><b>المراحل / الخطوات</b><ol>${m.steps.map(s=>'<li>'+s+'</li>').join('')}</ol></div><div><b>التقنيات</b><ul>${m.tech.map(s=>'<li>'+s+'</li>').join('')}</ul><b>الوتيرة المقترحة</b><p>${m.sess}</p><b>مؤشرات التتبع</b><p>${m.ind}</p><div class="iip-ev">📚 ${m.ev}</div></div></div></div>`}).join('')}
function goals(){setTimeout(injectSG,0);
  $('iip_goals').innerHTML=cur.goals.map((g,i)=>`<div class="iip-g"><div class="iip-gh">الهدف ${i+1}<button type="button" class="iip-x" data-act="delgoal" data-i="${i}">✕</button></div><div class="iip-grid">
  <label class="iip-w3">الهدف (محدد، قابل للقياس، واقعي، زمني)<input data-g="${i}.text" value="${esc(g.text)}"></label>
  <label class="iip-w2">مؤشر القياس<input data-g="${i}.ind" value="${esc(g.ind)}"></label><label>القيمة الحالية<input data-g="${i}.base" value="${esc(g.base)}"></label>
  <label>القيمة المستهدفة<input data-g="${i}.target" value="${esc(g.target)}"></label><label>الأجل<input type="date" data-g="${i}.due" value="${esc(g.due)}"></label>
  <label>مستوى التحقق<select data-g="${i}.done" class="iip-sel">${['','لم يبدأ','في تقدّم','تحقق جزئياً','تحقق'].map(o=>`<option ${g.done===o?'selected':''}>${o}</option>`).join('')}</select></label></div></div>`).join('')}
function sess(){
  const S=cur.sessions;
  $('iip_sess').innerHTML=S.length?'<tr><th>#</th><th>التاريخ</th><th>المدة</th><th>المحور</th><th>التقنيات</th><th>المهمة</th><th>التقدم</th><th>ملاحظات</th><th>التالي</th><th></th></tr>'+S.map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.date)}</td><td>${esc(s.dur)}</td><td>${esc(s.focus)}</td><td>${esc(s.tech)}</td><td>${esc(s.task)}</td><td><b>${esc(s.scale)}</b></td><td>${esc(s.resp)}</td><td>${esc(s.next)}</td><td><button type="button" class="iip-x" data-act="delsess" data-i="${i}">✕</button></td></tr>`).join(''):'<tr><td class="iip-empty">لا توجد جلسات مسجلة بعد.</td></tr>';
  $('iip_chart').innerHTML=chart(S,false);progress()}
function chart(S,print){
  const P=S.filter(s=>s.scale!==''&&s.scale!=null&&!isNaN(+s.scale));if(P.length<2)return print?'':'<div class="iip-hint">يظهر منحنى التقدم بعد تسجيل جلستين مقيّمتين على الأقل.</div>';
  const W=520,H=160,L=30,B=24,n=P.length,x=i=>L+(W-L-10)*i/(n-1),y=v=>H-B-(H-B-12)*(+v)/10;
  const pts=P.map((s,i)=>x(i)+','+y(s.scale)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:560px;display:block;margin:10px auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px"><text x="4" y="14" font-size="10" fill="#475569">التقدّم (0–10)</text>${[0,5,10].map(v=>`<line x1="${L}" x2="${W-10}" y1="${y(v)}" y2="${y(v)}" stroke="#e2e8f0"/><text x="4" y="${y(v)+3}" font-size="9" fill="#64748b">${v}</text>`).join('')}<polyline points="${pts}" fill="none" stroke="#14909a" stroke-width="2.5"/>${P.map((s,i)=>`<circle cx="${x(i)}" cy="${y(s.scale)}" r="4" fill="#0f5e63"/><text x="${x(i)-3}" y="${H-8}" font-size="9" fill="#475569">${i+1}</text>`).join('')}</svg>`}
function progress(){
  const S=cur.sessions,sc=S.filter(s=>s.scale!==''&&!isNaN(+s.scale)).map(s=>+s.scale),tot=+gp(cur,'schedule.total')||0;
  const d=sc.length>1?sc[sc.length-1]-sc[0]:null,b=cur.baseline||{},p=cur.post||{};
  const df=(a,z)=>a!==''&&a!=null&&z!==''&&z!=null?(' ('+(z-a>0?'+':'')+(z-a)+')'):'';
  $('iip_progress').innerHTML=`<span>📅 الجلسات: <b>${S.length}${tot?' / '+tot:''}</b></span>`+(d!=null?`<span>📈 تغيّر التقدم: <b>${d>0?'+':''}${d}</b></span>`:'')+(p.abs!==undefined&&p.abs!==''?`<span>الغياب: ${b.abs||0} ← ${p.abs}${df(b.abs,p.abs)}</span>`:'')+(p.inc!==undefined&&p.inc!==''?`<span>الوقائع: ${b.inc||0} ← ${p.inc}${df(b.inc,p.inc)}</span>`:'')+(p.well!==undefined&&p.well!==''?`<span>الرفاه: ${b.well||0} ← ${p.well}${df(b.well,p.well)}</span>`:'')}
function archive(){
  $('iip_arch').innerHTML=ALL.length?'<table class="iip-t"><tr><th>التلميذ(ة)</th><th>القسم</th><th>المجال</th><th>النموذج الرئيسي</th><th>الجلسات</th><th>الحالة</th><th></th></tr>'+ALL.map(p=>`<tr><td>${esc(p.studentName)}</td><td>${esc(p.level)}</td><td>${esc(p.domain&&DOM[p.domain]?DOM[p.domain][0]:'')}</td><td>${esc(p.primary&&MODELS[p.primary]?MODELS[p.primary].n:'')}</td><td>${p.sessions.length}</td><td>${esc(p.status)}</td><td style="white-space:nowrap"><button type="button" class="iip-btn" data-act="open" data-id="${p.id}">فتح</button> <button type="button" class="iip-btn dng" data-act="del" data-id="${p.id}">حذف</button></td></tr>`).join('')+'</table>':'<div class="iip-empty">لا توجد برامج محفوظة.</div>'}

/* ---------- التقرير (نفس هيكل تقارير البوابات الأخرى ليعمل مع الطباعة وWord) ---------- */
function report(){
  const p=cur,sc=(typeof userProfile!=='undefined'&&userProfile)||{},school=((sc.institution||sc.school||'')+'').trim()||((typeof getInstitutionName==='function'&&getInstitutionName())||'المؤسسة التعليمية'),spec=sc.fullName||'';
  const logo=(typeof MINISTRY_LOGO_B64!=='undefined'&&MINISTRY_LOGO_B64)?MINISTRY_LOGO_B64:'';
  const V=v=>esc((v==null||v==='')?'—':v);
  const ST=t=>`<div class="report-section-title">${t}</div>`;
  const kv=rows=>'<table class="info-table-report"><tbody>'+rows.map(r=>r.length===4?`<tr><td class="info-lbl">${r[0]}</td><td>${V(r[1])}</td><td class="info-lbl">${r[2]}</td><td>${V(r[3])}</td></tr>`:`<tr><td class="info-lbl">${r[0]}</td><td colspan="3">${V(r[1])}</td></tr>`).join('')+'</tbody></table>';
  const th=(t,w)=>`<th data-w="${w}">${t}</th>`;
  const dn=DOM[p.domain]?DOM[p.domain][0]:'';
  const ms=p.models.map(k=>MODELS[k].n+(p.primary===k?' (رئيسي)':'')).join(' + ');
  const a=p.assess||{},b=p.baseline||{},po=p.post||{},sch=p.schedule||{},rf=p.referral||{},cn=p.consent||{},rv=p.review||{},ro=p.roles||{};
  const gs=p.goals.filter(g=>g.text);
  const dash=x=>(x==null||x==='')?'—':x;
  let h=`<div class="new-report-header"><div class="nrh-logo">${logo?`<img src="${logo}" alt="">`:''}</div><div class="nrh-dir">مديرية الحي الحسني</div><div class="nrh-school">${esc(school)}</div><div class="nrh-title">البرنامج التدخلي الفردي</div></div>`;
  if(spec)h+=`<div class="report-summary-block" style="text-align:center;">المختص(ة) الاجتماعي(ة): ${esc(spec)}</div>`;
  h+=ST('1. معطيات التلميذ(ة)')+kv([['الاسم',p.studentName,'رقم مسار',p.massar],['القسم',p.level,'تاريخ فتح البرنامج',p.opened],['مصدر الإحالة',rf.source,'سبب الإحالة',rf.reason],['الموافقات',[cn.parent?'ولي الأمر':'',cn.student?'التلميذ(ة)':'',cn.conf?'شرح حدود السرية':''].filter(Boolean).join('، ')]]);
  h+=ST('2. التقييم الأولي')+kv([['مجال التدخل',dn],['وصف المشكلة',a.problem],['نقاط القوة',a.strengths],['عوامل الخطر',a.risks,'عوامل الحماية',a.protect],['الأسرة',a.family,'المدرسة والأقران',a.school],['المجتمع والجهات الأخرى',a.community],['المؤشرات القاعدية','غياب/شهر: '+dash(b.abs)+' | وقائع/أسبوع: '+dash(b.inc)+' | رفاه: '+dash(b.well)+'/10 | دافعية: '+dash(b.mot)+'/10']]);
  h+=ST('3. النموذج التدخلي')+kv([['النماذج المعتمدة',ms],['الوتيرة',[sch.freq,sch.dur?sch.dur+' د':'',sch.total?sch.total+' جلسة':'',sch.start?'ابتداءً من '+sch.start:''].filter(Boolean).join(' · ')]]);
  h+=ST('4. الأهداف والخطة');
  if(gs.length)h+='<table class="wk-table-report"><thead><tr>'+th('#',0.4)+th('الهدف',3)+th('مؤشر القياس',1.6)+th('الحالي',1)+th('المستهدف',1)+th('الأجل',1.2)+th('التحقق',1.2)+'</tr></thead><tbody>'+gs.map((g,i)=>`<tr><td>${i+1}</td><td>${V(g.text)}</td><td>${V(g.ind)}</td><td>${V(g.base)}</td><td>${V(g.target)}</td><td>${V(g.due)}</td><td>${V(g.done)}</td></tr>`).join('')+'</tbody></table>';
  h+=kv([['الاستراتيجيات والإجراءات',p.strategies],['دور التلميذ(ة)',ro.student,'دور الأسرة',ro.family],['الأساتذة والحراسة',ro.teachers,'شركاء خارجيون',ro.partners]]);
  h+=ST('5. سجل الجلسات');
  if(p.sessions.length)h+='<table class="wk-table-report"><thead><tr>'+th('#',0.4)+th('التاريخ',1.2)+th('المدة',0.7)+th('المحور',2)+th('التقنيات',1.8)+th('المهمة',1.8)+th('التقدم',0.8)+th('الاستجابة والملاحظات',2.4)+th('الخطوة التالية',1.8)+'</tr></thead><tbody>'+p.sessions.map((x,i)=>`<tr><td>${i+1}</td><td>${V(x.date)}</td><td>${V(x.dur)}</td><td>${V(x.focus)}</td><td>${V(x.tech)}</td><td>${V(x.task)}</td><td>${V(x.scale)}</td><td>${V(x.resp)}</td><td>${V(x.next)}</td></tr>`).join('')+'</tbody></table>'+chart(p.sessions,true);
  else h+=kv([['الجلسات','لم تُسجَّل جلسات بعد']]);
  h+=ST('6. التقويم')+kv([['النتيجة',rv.outcome||'قيد التنفيذ','تاريخ المراجعة',rv.date],['المؤشرات البعدية','غياب/شهر: '+dash(po.abs)+' | وقائع/أسبوع: '+dash(po.inc)+' | رفاه: '+dash(po.well)+'/10'],['الخلاصة والتوصيات',rv.notes]]);
  h+='<div class="sig-wrap"><div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div><div class="sig-block"><div class="sig-line"></div>الحارس العام</div><div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div></div>';
  return h}
const CSS=`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
@page{size:A4 portrait;margin:0}*{box-sizing:border-box}html,body{margin:0;width:210mm}
body{font-family:'Cairo',Arial,sans-serif;direction:rtl;color:#000;padding:0 12mm;font-size:10pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
table.pg{width:100%;border-collapse:collapse}table.pg>thead>tr>td,table.pg>tfoot>tr>td{padding:0;border:0;height:9mm}table.pg>tbody>tr>td{padding:0;border:0}
.nrh-logo{text-align:center;line-height:0}.nrh-logo img{width:100%;max-height:120px;object-fit:contain}
.nrh-dir,.nrh-school{text-align:center;font-weight:700;font-size:11pt;margin:2px 0}
.nrh-title{text-align:center;font-weight:900;font-size:15pt;margin:6px 0 4px;padding-top:6px;border-top:1.5px solid #000}
.report-section-title{font-weight:800;font-size:11pt;margin:12px 0 6px;break-after:avoid}.report-summary-block{text-align:center;font-size:9.5pt;margin-bottom:4px}
table.info-table-report,table.wk-table-report{width:100%;border-collapse:collapse;margin-bottom:10px}
table.info-table-report td,table.wk-table-report th,table.wk-table-report td{border:1px solid #000;padding:4px 6px;font-size:9pt;text-align:right;vertical-align:top;white-space:pre-line}
table.info-table-report td.info-lbl{background:#eef4fb;font-weight:800;width:16%}table.wk-table-report th{background:#d9d9d9;font-weight:800}
table.wk-table-report thead{display:table-header-group}tr{break-inside:avoid}svg{max-width:100%;height:auto}
.sig-wrap{display:flex;justify-content:space-around;margin-top:30px;break-inside:avoid}.sig-block{text-align:center;font-weight:700;font-size:10pt;min-width:160px}.sig-line{height:40px;border-bottom:1.5px solid #000;margin-bottom:6px}`;


const RSUG=['غياب متكرر وغير مبرر','تأخرات متكررة عن الحصص','تراجع مفاجئ في التحصيل الدراسي','سلوك عدواني تجاه الأقران','تعرّضه للتنمر أو العنف','عزلة وانطواء ملحوظان','علامات قلق أو حزن','ظروف أسرية صعبة (طلاق، وفاة، فقر، مرض)','عدم الانضباط داخل القسم','فقدان الدافعية للدراسة','مؤشرات خطر الهدر المدرسي','صعوبات في التكيف مع المؤسسة','طلب شخصي للمساعدة'];
const PSUG={
abs:['تغيّب التلميذ(ة) خلال الشهر الأخير ... ساعة، منها ... غير مبررة، ويتركز الغياب في (أيام / مواد: ...).','أفاد التلميذ(ة) في المقابلة الأولى أن الغياب مرتبط بـ (المواصلات / الوضع الأسري / العمل / ضعف الرغبة في الدراسة).','لم تُجدِ المراسلات السابقة مع الأسرة ولا الإنذارات الإدارية في الحد من الغياب.'],
beh:['يُسجَّل على التلميذ(ة) سلوك (...) بمعدل ... مرة في الأسبوع، غالباً خلال (حصص مادة ... / الاستراحة).','يشتكي الأساتذة من (...)، بينما يفسّر التلميذ(ة) ذلك بـ (...).','تمت تدخلات تربوية سابقة (تنبيه، استدعاء ولي الأمر) دون استقرار في السلوك.'],
vio:['وقعت واقعة (عنف جسدي / لفظي / إلكتروني) بتاريخ ... بين التلميذ(ة) و(...) في (المكان).','تكرّرت الوقائع، وظهرت على التلميذ(ة) علامات (خوف، تجنب المدرسة، عدوانية).','تم إشعار الإدارة والأسرة، والحاجة قائمة للحماية والمتابعة.'],
emo:['تظهر على التلميذ(ة) علامات (قلق / حزن / بكاء / اضطراب نوم / انسحاب) منذ ...','انعكس ذلك على التركيز والتحصيل والعلاقة بالأقران.','يربط التلميذ(ة) ما يشعر به بـ (...).'],
fam:['تمرّ الأسرة بوضعية (طلاق / وفاة / مرض / هشاشة اقتصادية / نزاع) منذ ...','انعكست هذه الوضعية على انتظام التلميذ(ة) وحالته النفسية.','الأسرة (متعاونة / يصعب التواصل معها) ومستعدة لـ (...).'],
acad:['انخفض معدل التلميذ(ة) من ... إلى ... خصوصاً في (المواد).','يعاني من صعوبات في (...) وينقصه (تنظيم المراجعة / الدعم الأسري).','تتوفر لديه قدرات في (...) لم تُستثمر بعد.'],
drop:['ظهرت مؤشرات خطر الهدر: (غياب متراكم، تأخر دراسي، رغبة في ترك الدراسة، عمل).','عبّر التلميذ(ة) عن رغبته في (...) وعن أسباب ذلك: (...).','تم التواصل مع الأسرة بتاريخ ... وكانت استجابتها (...).'],
loss:['تعرّض التلميذ(ة) لحدث (وفاة / فقدان / حادث ...) بتاريخ ...','ردود الفعل الملاحَظة: (...) وتأثيرها على الأداء المدرسي.','وضعية سلامة التلميذ(ة) الحالية: (مستقرة / مثيرة للقلق) وتم (...).'],
adapt:['التلميذ(ة) (جديد بالمؤسسة / في وضعية إعاقة / ...) ويواجه صعوبات في (التنقل / التواصل / التكيف).','الترتيبات المتوفرة حالياً: (...) والحاجات غير المغطاة: (...).','علاقته بالأقران والأساتذة: (...).']
};
PSUG._=['وصف السلوك أو الوضعية بدقة: متى بدأت؟ كم مرة؟ وفي أي سياق؟','أثر الوضعية على الدراسة والعلاقات والحالة النفسية.','ما تم القيام به سابقاً ونتائجه.'];
function chips(id,arr,target){
  const el=$(id);if(!el)return;
  el.innerHTML=arr.map((t,i)=>`<button type="button" class="iip-chip" data-chip="${target}" data-i="${i}">${esc(t)}</button>`).join('');el._a=arr}
function sugg(){
  chips('iip_rsug',RSUG,'iip_reason');
  chips('iip_psug',PSUG[cur.domain]||PSUG._,'iip_problem')}
function addChip(b){
  const arr=b.parentElement._a,t=arr[+b.dataset.i],el=$(b.dataset.chip);if(!el||!t)return;
  const one=el.tagName==='INPUT';
  if(el.value.indexOf(t)>=0)return;
  el.value=el.value?el.value+(one?'، ':'\n')+t:t;
  sp(cur,el.dataset.k,el.value);later()}

/* ---------- اقتراحات الملء السريع لكل الخانات ---------- */
const iso=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const wk=n=>({t:'بعد '+n+' أسابيع',v:iso(7*n)});
const dm=(o)=>(cur.domain&&o[cur.domain])||[];
const XR={abs:['بُعد المسافة وصعوبة النقل','عمل التلميذ(ة) أو التزامات أسرية','تراكم الغياب دون مبرر'],beh:['ضعف ضبط النفس','رفاق ذوو سلوك مخالف','غياب حدود واضحة في البيت'],vio:['تعرّض سابق للعنف','الخوف من الإبلاغ','وجود الطرف الآخر في نفس القسم'],emo:['اضطراب النوم','أحداث ضاغطة حديثة','عزلة اجتماعية'],fam:['نزاع أسري حاد','هشاشة اقتصادية','غياب أحد الوالدين'],acad:['فجوات تعلّم متراكمة','ضعف تنظيم الوقت','غياب المراجعة المنزلية'],drop:['رسوب سابق','رغبة في العمل','ضغط أسري لترك الدراسة'],loss:['حداد غير معالج','غياب شبكة دعم','احتمال إيذاء النفس (يستدعي تقييماً عاجلاً)'],adapt:['عوائق بيئية وتنظيمية','سخرية أو وصم من الأقران','قلة الترتيبات التيسيرية']};
const XS={abs:['اتفاق حضور مع التلميذ(ة) والأسرة','تتبع يومي للغياب مع الحراسة العامة','مقابلة تحفيزية لاستكشاف أسباب الغياب'],beh:['بطاقة سلوك يومية (دخول/خروج)','عقد سلوكي بأهداف قصيرة','تدريب على ضبط الانفعال'],vio:['خطة حماية وفصل مؤقت بين الطرفين','جلسات وساطة بعد التقييم','إشعار الجهات المختصة وفق المسطرة'],emo:['تدريب على الاسترخاء والتنفس','سجل الأفكار والمشاعر','إحالة للصحة النفسية عند الاقتضاء'],fam:['لقاءات أسرية دورية','ربط الأسرة بخدمات الدعم الاجتماعي','اتفاق شراكة مدرسة–أسرة'],acad:['برنامج دعم في المواد المتعثرة','تعليم تنظيم الوقت وطرق المراجعة','مرافقة من قرين متفوق'],drop:['خطة احتفاظ بالتلميذ(ة) (مرشد، حضور، تحفيز)','توجيه نحو مسار بديل','تعبئة دعم مادي واجتماعي'],loss:['دعم نفسي أولي وخطة سلامة','متابعة بعد 24–72 ساعة ثم أسبوعياً','إشراك الأسرة والإدارة'],adapt:['ترتيبات تيسيرية داخل القسم','تهيئة الأقران للقبول والتعاون','متابعة مع الأسرة والجهات الصحية']};
const SG=[
['[data-k="assess.strengths"]',()=>['علاقة جيدة مع بعض الأقران','لديه موهبة أو هواية (...)','يستجيب للتوجيه حين يشعر بالاهتمام','تقدّم ملحوظ في مادة (...)','روح تعاون واستعداد للمساعدة','يوجد راشد داعم (...)','الاستثناء: لا تظهر المشكلة عندما (...)']],
['[data-k="assess.risks"]',()=>['غياب أو تأخر متكرر','تأخر دراسي','ضعف الدعم الأسري','رفاق سلبيون','ضعف تقدير الذات','صعوبات اقتصادية','تجارب فشل سابقة',...dm(XR)]],
['[data-k="assess.protect"]',()=>['علاقة إيجابية بأستاذ أو حارس','أسرة تتابع الدراسة','صديق داعم','انخراط في نشاط (نادٍ، رياضة)','طموح دراسي واضح','استجابة سابقة للتدخل']],
['[data-k="assess.family"]',()=>['أسرة مستقرة وتتابع الدراسة','أسرة متعاونة بمستوى تعليمي محدود','انفصال الوالدين','وفاة أحد الوالدين','وضع اقتصادي هش','صعوبة التواصل مع الولي','أسلوب تربوي متشدد أو متساهل','إخوة داعمون']],
['[data-k="assess.school"]',()=>['علاقة جيدة بالأساتذة','نزاعات مع بعض الأقران','تنمر أو إقصاء داخل القسم','ضعف الاندماج في القسم','علاقة متوترة مع أحد الأساتذة','مشاركة في الأنشطة الموازية','يجلس في مكان معزول']],
['[data-k="assess.community"]',()=>['لا حاجة حالياً لجهات خارجية','مركز صحي / طبيب نفسي','جمعية محلية للدعم','مصلحة حماية الطفولة','دعم اجتماعي (تيسير، تعاون وطني…)','وحدة الصحة المدرسية','خلية التكفل بالنساء والأطفال']],
['[data-k="baseline.abs"]',()=>['2','4','8','12','20']],
['[data-k="baseline.inc"]',()=>['1','2','3','5']],
['[data-k="baseline.well"]',()=>['3','4','5','6']],
['[data-k="baseline.mot"]',()=>['3','5','7']],
['[data-k="strategies"]',()=>['مقابلات فردية أسبوعية','استدعاء ولي الأمر وإبرام اتفاق','تتبع الغياب يومياً بالتنسيق مع الحراسة','التنسيق مع مجلس القسم','إشراك التلميذ(ة) في نشاط موازٍ','تعيين مرشد لتسجيل الدخول والخروج','دعم دراسي في (...)','إحالة إلى (...)',...dm(XS)]],
['[data-k="roles.student"]',()=>['الالتزام بالحضور','إنجاز المهمة المتفق عليها في كل جلسة','تدوين أفكاره وسلوكه في دفتر','التعبير عن صعوباته للمختص','المشاركة في نشاط (...)']],
['[data-k="roles.family"]',()=>['المتابعة اليومية للحضور','الحضور للمؤسسة عند الاستدعاء','مراقبة الواجبات المنزلية','تعزيز السلوك الإيجابي','اتصال هاتفي أسبوعي بالمختص']],
['[data-k="roles.teachers"]',()=>['تنقيط بطاقة السلوك بعد كل حصة','إشعار المختص بأي غياب فوراً','تعزيز المشاركة الإيجابية','إجلاسه في مكان مناسب','تتبع الغياب والتأخر (الحراسة العامة)']],
['[data-k="roles.partners"]',()=>['مركز صحي','طبيب أو أخصائي نفسي','جمعية محلية','مصلحة حماية الطفولة','الأمن / شرطة الأحداث (للحالات الجسيمة)']],
['[data-k="schedule.start"]',()=>[{t:'اليوم',v:iso(0)},{t:'بعد أسبوع',v:iso(7)},{t:'بعد أسبوعين',v:iso(14)}]],
['[data-k="schedule.dur"]',()=>['15','30','45']],
['[data-k="schedule.total"]',()=>['4','6','8','10']],
['[data-g$=".text"]',()=>['خفض ساعات الغياب إلى ... خلال ... أسابيع','انتظام الحضور بنسبة ... %','خفض الوقائع السلوكية إلى ... في الأسبوع','تحسين المعدل في (المادة) إلى ...','رفع مؤشر الرفاه إلى ... من 10','تطبيق مهارة (...) في ... مواقف','استعادة علاقة إيجابية مع (...)']],
['[data-g$=".ind"]',()=>['ساعات الغياب/الشهر','عدد الوقائع/الأسبوع','درجة الرفاه (0–10)','نسبة نقاط بطاقة السلوك','المعدل في مادة (...)','نسبة المهام المنجزة']],
['[data-g$=".base"]',()=>{const b=cur.baseline||{};return[['abs','غياب'],['inc','وقائع'],['well','رفاه']].filter(x=>b[x[0]]!==undefined&&b[x[0]]!=='').map(x=>({t:x[1]+': '+b[x[0]],v:b[x[0]]}))}],
['[data-g$=".target"]',()=>['انخفاض 50%','انخفاض 30%','صفر','≥ 8/10','≥ 80%']],
['[data-g$=".due"]',()=>[wk(2),wk(4),wk(6),wk(8)]],
['#s_dur',()=>['15','30','45']],
['#s_scale',()=>{const l=cur.sessions.filter(x=>x.scale!==''&&!isNaN(+x.scale)).map(x=>+x.scale).pop();return l==null?['3','5','7']:[l,Math.min(10,l+1),Math.min(10,l+2)].map(String)}],
['#s_focus',()=>['بناء العلاقة والتعارف','تحديد الهدف المفضَّل','مراجعة التقدم منذ آخر لقاء','تدريب على مهارة (...)','معالجة عائق (...)','تقييم وتمهيد للإغلاق']],
['#s_tech',()=>[...(MODELS[cur.primary]?MODELS[cur.primary].tech:[]),'الإصغاء النشط','إعادة الصياغة','لعب الأدوار','التعزيز الإيجابي']],
['#s_task',()=>['حضور جميع الحصص هذا الأسبوع','تدوين موقف إيجابي يومياً','تطبيق مهارة التنفس عند الغضب','التحدث مع الأستاذ(ة) حول (...)','تنفيذ الخطوة الأولى من الخطة','الاحتفاظ بدفتر تتبع']],
['#s_resp',()=>['متجاوب ومتعاون','متحفظ في البداية ثم تفاعل','متردد / مقاوم للتغيير','انفعل خلال الجلسة وهدأ بعد التهدئة','عبّر عن (...)','أنجز المهمة السابقة كاملة','أنجز المهمة السابقة جزئياً']],
['#s_next',()=>['مراجعة المهمة في الجلسة المقبلة','الاتصال بالأسرة','لقاء مع الأستاذ(ة)','رفع وتيرة الجلسات','التمهيد للإغلاق']],
['[data-k="review.date"]',()=>[{t:'اليوم',v:iso(0)},wk(2),wk(4)]],
['[data-k="post.abs"]',()=>['0','2','4','8']],
['[data-k="post.inc"]',()=>['0','1','2','3']],
['[data-k="post.well"]',()=>['5','6','7','8']],
['[data-k="review.notes"]',()=>['تحققت الأهداف الأساسية ويُقترح الإغلاق مع متابعة بعد شهر','تحسّن جزئي ويُقترح تمديد البرنامج ... أسابيع','ضعف الاستجابة ويُقترح تغيير النموذج التدخلي','تُقترح إحالة إلى (...)','استمرار الدعم الأسري والمدرسي مع مراجعة شهرية']]
];
function injectSG(){
  const R=$('toolIip');if(!R)return;
  SG.forEach(([sel,fn],si)=>R.querySelectorAll(sel).forEach(el=>{
    let box=el._sg;
    if(!box||!box.isConnected){
      box=document.createElement('div');box.className='iip-sg';el._sg=box;box.dataset.si=si;
      const host=el.closest('label')||el.parentElement;host.appendChild(box);
      box.innerHTML='<button type="button" class="iip-sgt" data-sgt>💡 اقتراحات للملء السريع</button><div class="iip-chips iip-mini" hidden></div>';
      box._el=el;
    }
  }))}
function openSG(box){
  const el=box._el,fn=SG[+box.dataset.si][1],items=fn().map(x=>typeof x==='string'?{t:x,v:x}:x),list=box.querySelector('.iip-chips');
  if(!items.length){list.innerHTML='<span class="iip-hint" style="margin:0">لا توجد اقتراحات بعد (أدخل المؤشرات القاعدية أولاً).</span>'}
  else list.innerHTML=items.map((x,i)=>`<button type="button" class="iip-chip" data-sgc="${i}">${esc(x.t)}</button>`).join('');
  list._items=items;list.hidden=!list.hidden}
function pickSG(b){
  const list=b.parentElement,box=list.parentElement,el=box._el,it=list._items[+b.dataset.sgc];if(!it)return;
  const short=el.tagName==='SELECT'||el.type==='number'||el.type==='date'||(el.getAttribute('data-g')&&/\.(base|target|due)$/.test(el.dataset.g));
  if(short){el.value=it.v}
  else{const one=el.tagName==='INPUT';if(el.value.indexOf(it.v)>=0)return;el.value=el.value?el.value+(one?'، ':'\n')+it.v:it.v}
  el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}

/* ربط الاسم بلائحة التلاميذ (نفس آلية بقية البوابات) */
let askedFor='';
function acInit(){
  try{
    if(typeof AUTOCOMPLETE_FIELDS!=='undefined'&&!AUTOCOMPLETE_FIELDS.some(c=>c.nameId==='iip_name'))AUTOCOMPLETE_FIELDS.push({nameId:'iip_name',massarId:'iip_massar',levelId:'iip_level'});
    if(typeof acSetup==='function')acSetup({nameId:'iip_name',massarId:'iip_massar',levelId:'iip_level'});
  }catch(e){console.error(e)}
  const n=$('iip_name');if(n&&typeof STUDENT_DB!=='undefined'&&!STUDENT_DB.length)n.placeholder='استورد لائحة التلاميذ أولاً (من الصفحة الرئيسية) أو اكتب الاسم يدوياً'}
function sync(){
  [['iip_name','studentName'],['iip_massar','massar'],['iip_level','level']].forEach(([i,k])=>{const el=$(i);if(el&&el.value!==(cur[k]||''))cur[k]=el.value});
  const key=(cur.massar||cur.studentName||'').trim();
  if(key&&key!==askedFor){askedFor=key;
    const ex=ALL.find(p=>p.id!==cur.id&&p.status==='نشط'&&((p.massar&&p.massar===cur.massar)||(p.studentName&&p.studentName===cur.studentName)));
    if(ex&&confirm('يوجد برنامج نشط لهذا التلميذ(ة). هل تريد فتحه بدل إنشاء برنامج جديد؟')){cur=JSON.parse(JSON.stringify(ex));fill();return}
    later()}}

/* ---------- أحداث ---------- */
function bind(){
  const R=$('toolIip');if(!R||R._b)return;R._b=1;
  R.addEventListener('input',e=>{const el=e.target;
    if(el.dataset.k){sp(cur,el.dataset.k,el.type==='checkbox'?el.checked:el.value);if(/schedule\.total/.test(el.dataset.k))progress();if(/^post\.|^baseline\./.test(el.dataset.k))progress();later()}
    else if(el.dataset.g){const[i,k]=el.dataset.g.split('.');cur.goals[+i][k]=el.value;later()}});
  R.addEventListener('focusout',()=>setTimeout(sync,200));
  R.addEventListener('change',e=>{const el=e.target,a=el.dataset.actChange;
    if(el.dataset.k&&el.type==='checkbox'){sp(cur,el.dataset.k,el.checked);later()}
    if(el.dataset.g){const[i,k]=el.dataset.g.split('.');cur.goals[+i][k]=el.value;later()}
    if(a==='domain'){cur.domain=el.value;models();sugg();later()}});
  R.addEventListener('click',e=>{const sgt=e.target.closest('[data-sgt]');if(sgt){openSG(sgt.parentElement);return}const sgc=e.target.closest('[data-sgc]');if(sgc){pickSG(sgc);return}const ch=e.target.closest('[data-chip]');if(ch){addChip(ch);return}setTimeout(sync,60);const b=e.target.closest('[data-act]');if(!b||b.tagName==='SELECT')return;const a=b.dataset.act;
    if(a==='primary'){e.stopPropagation();cur.primary=b.dataset.m;models();later();return}
    if(a==='pick'){const k=b.dataset.m,i=cur.models.indexOf(k);
      if(i>=0){cur.models.splice(i,1);if(cur.primary===k)cur.primary=cur.models[0]||''}
      else{if(cur.models.length>=2){msg('⚠️ يمكن اختيار نموذجين على الأكثر',1);return}cur.models.push(k);if(!cur.primary)cur.primary=k}
      models();later();return}
    if(a==='addgoal'){cur.goals.push({});goals();return}
    if(a==='delgoal'){cur.goals.splice(+b.dataset.i,1);if(!cur.goals.length)cur.goals=[{}];goals();later();return}
    if(a==='autoplan'){const m=MODELS[cur.primary];if(!m){msg('اختر نموذجاً تدخلياً أولاً',1);return}
      if(cur.strategies&&!confirm('سيُستبدل نص الاستراتيجيات الحالي. متابعة؟'))return;
      cur.strategies='النموذج: '+m.n+'\n'+m.steps.map((s,i)=>(i+1)+'. '+s).join('\n');
      const n=parseInt((m.sess.match(/\d+\s*(?:إلى|–|-)\s*(\d+)/)||[])[1]);if(n&&!cur.schedule.total)cur.schedule.total=n;
      fill();return}
    if(a==='addsess'){const s={date:$('s_date').value||today(),dur:$('s_dur').value||cur.schedule.dur||'',scale:$('s_scale').value,focus:$('s_focus').value,tech:$('s_tech').value,task:$('s_task').value,resp:$('s_resp').value,next:$('s_next').value};
      if(!s.focus&&!s.resp){msg('أدخل محور الجلسة أو الملاحظات',1);return}
      cur.sessions.push(s);['s_dur','s_scale','s_focus','s_tech','s_task','s_resp','s_next'].forEach(i=>$(i).value='');sess();later();msg('');return}
    if(a==='delsess'){cur.sessions.splice(+b.dataset.i,1);sess();later();return}
    if(a==='save'){save();return}
    if(a==='new'){if(cur.studentName&&!confirm('سيتم إغلاق النموذج الحالي (محفوظ تلقائياً). متابعة؟'))return;save(true);cur=blank();fill();return}
    if(a==='open'){const p=ALL.find(x=>x.id===b.dataset.id);if(p){cur=JSON.parse(JSON.stringify(p));fill();window.scrollTo({top:0,behavior:'smooth'})}return}
    if(a==='del'){if(confirm('حذف هذا البرنامج نهائياً؟')){ALL=ALL.filter(x=>x.id!==b.dataset.id);store();if(cur.id===b.dataset.id)cur=blank();fill()}return}
    if(a==='print'){if(!cur.studentName){msg('⚠️ أدخل اسم التلميذ(ة) أولاً',1);return}save(true);iipPrint('<div>'+report()+'</div>');return}
    if(a==='word'){if(!cur.studentName){msg('⚠️ أدخل اسم التلميذ(ة) أولاً',1);return}save(true);const h=document.createElement('div');h.id='iipReportContent';h.style.cssText='position:absolute;left:-99999px;top:0;width:1000px;';h.innerHTML=report();document.body.appendChild(h);
      exportToWord('iipReportContent','برنامج_تدخلي_فردي_'+cur.studentName.replace(/\s+/g,'_')).catch(()=>msg('تعذّر إنشاء ملف Word',1)).finally(()=>h.remove());return}
  })}
window.iipInit=function(){load();if(!cur||!cur.id)cur=blank();domSel();bind();acInit();fill();$('s_date').value=today()};
})();
