
(function(){
  var pl=document.getElementById('portalLanding');
  function sync(){ document.body.classList.toggle('on-home', !!pl && pl.style.display==='block'); }
  if(pl){ new MutationObserver(sync).observe(pl,{attributes:true,attributeFilter:['style']}); sync(); }

  // شعار الوزارة
  var lg=document.getElementById('hpMinistryLogo');
  if(lg && typeof DEFAULT_MINISTRY_LOGO_B64!=='undefined' && DEFAULT_MINISTRY_LOGO_B64) lg.src=DEFAULT_MINISTRY_LOGO_B64;
  else if(lg) lg.style.display='none';

  // الموسم الدراسي
  var now=new Date(), y=now.getMonth()>=8 ? now.getFullYear() : now.getFullYear()-1;
  var se=document.getElementById('hpSeason');
  if(se) se.innerHTML='موسم <bdi dir="ltr">'+y+'/'+(y+1)+'</bdi>';

  function iso(d){ var m=d.getMonth()+1, dd=d.getDate(); return d.getFullYear()+'-'+(m<10?'0':'')+m+'-'+(dd<10?'0':'')+dd; }
  function list(fn,key){
    try{ if(fn && typeof window[fn]==='function'){ var r=window[fn](); if(Array.isArray(r)) return r; } }catch(e){}
    try{ if(typeof appData!=='undefined' && Array.isArray(appData[key])) return appData[key]; }catch(e){}
    return [];
  }
  function niceStep(v){ var c=[1,2,5,10,20,25,50,100,200,500,1000]; for(var i=0;i<c.length;i++) if(c[i]>=v) return c[i]; return Math.ceil(v/1000)*1000; }

  // ===== مؤشرات الأسبوع: كل البوابات باستثناء الإحصاء البياني وملف الحالة الشامل =====
  function dOf(v){ if(typeof v!=='string') return ''; var m=v.match(/^(\d{4}-\d{2}-\d{2})/); return m?m[1]:''; }
  function one(f){ return function(e){ return [f(e)]; }; }
  var HP_SRC=[
    {id:'statInterviews',   lbl:'مقابلات',          col:'#2f6fe4', get:function(){return list('getArchive','interviewArchive');},        dates:one(function(e){return e.interviewDate;})},
    {id:'statReintegration',lbl:'إدماج مدرسي',      col:'#6366f1', get:function(){return list('getRArchive','reintegrationArchive');},  dates:one(function(e){return e.reintegrationDate;})},
    {id:'statAbsence',      lbl:'غياب',             col:'#e08e0b', get:function(){return list('getAbArchive','absenceArchive');},       dates:one(function(e){return e.recordDate;})},
    {id:'statViolence',     lbl:'عنف',              col:'#e5584f', get:function(){return list('getVioArchive','violenceArchive');},     dates:one(function(e){return e.reportDate;})},
    {id:'statWorkshops',    lbl:'ورشات وأنشطة',     col:'#0e9fa8', get:function(){return list('getWorkshopsArchive','workshopsArchive');}, dates:one(function(e){return e.date;})},
    {id:'statSpecNeeds',    lbl:'إعاقة',            col:'#8b5cf6', get:function(){return list('getSnArchive','specialNeedsArchive');},  dates:one(function(e){return e.date||e.recordDate;})},
    {id:'statVigilance',    lbl:'خلية اليقظة',      col:'#db2777', get:function(){return list('vigGetArchive','vigilanceCases');},      dates:one(function(e){return e.date;})},
    {id:'statReferral',     lbl:'إحالة وإخبار صحي', col:'#a16207', get:function(){ return list('','pdAssocArchive').concat(list('','pdHealthArchive')); }, dates:one(function(e){return e.date;})}
  ];
  var MONTHS=['يناير','فبراير','مارس','أبريل','ماي','يونيو','يوليوز','غشت','شتنبر','أكتوبر','نونبر','دجنبر'];
  window._hpOff=window._hpOff||0;   // إزاحة الشهر (0 = الشهر الحالي)
  window.hpWeekShift=function(n){ window._hpOff=(window._hpOff||0)+n; hpRender(); };
  window.hpWeekReset=function(){ window._hpOff=0; hpRender(); };

  function hpRender(){
    var svg=document.getElementById('hpChart'); if(!svg) return;
    var today=new Date(); today.setHours(0,0,0,0);
    var off=window._hpOff||0, todayIso=iso(today);
    var first=new Date(today.getFullYear(),today.getMonth()+off,1), last=new Date(first.getFullYear(),first.getMonth()+1,0);

    // أسابيع الشهر (الاثنين → الأحد، مقصوصة على حدود الشهر)
    var wins=[], cur=new Date(first);
    while(cur<=last){
      var dw=(cur.getDay()+6)%7;
      var end=new Date(cur); end.setDate(cur.getDate()+(6-dw)); if(end>last) end=new Date(last);
      wins.push({from:iso(cur),to:iso(end),a:cur.getDate(),z:end.getDate()});
      cur=new Date(end); cur.setDate(cur.getDate()+1);
    }
    var mFrom=iso(first), mTo=iso(last);

    // عنوان الشهر
    var lEl=document.getElementById('hpWeekLabel'); if(lEl) lEl.textContent=MONTHS[first.getMonth()]+' '+first.getFullYear();
    var tag=document.getElementById('hpWeekTag'); if(tag) tag.textContent = off===0 ? 'هذا الشهر' : (off===-1 ? 'الشهر الماضي' : (off===1 ? 'الشهر المقبل' : (off<0 ? 'قبل '+(-off)+' أشهر' : 'بعد '+off+' أشهر')));
    var nowB=document.getElementById('hpWeekNow'); if(nowB) nowB.style.display = off===0 ? 'none' : '';
    var ttl=document.getElementById('hpChartTitle'); if(ttl) ttl.textContent='مؤشرات الشهر حسب الأسبوع';

    // الحساب
    var cols=HP_SRC.map(function(src){
      var arr=src.get()||[], perWk=wins.map(function(){return 0;}), month=0;
      arr.forEach(function(e){
        var ds=(src.dates(e)||[]).map(dOf).filter(Boolean);
        wins.forEach(function(w,k){ if(ds.some(function(x){return x>=w.from&&x<=w.to;})) perWk[k]++; });
        if(ds.some(function(x){return x>=mFrom&&x<=mTo;})) month++;
      });
      var el=document.getElementById(src.id);
      if(el){ el.textContent=month; el.classList.remove('stat-loading'); }
      return {src:src, perWk:perWk, month:month};
    });

    // دليل الألوان
    var lg=document.getElementById('hpLegend');
    if(lg) lg.innerHTML=HP_SRC.map(function(s){ return '<span><i style="background:'+s.col+'"></i>'+s.lbl+'</span>'; }).join('');

    // الرسم: أعمدة متجاورة لكل بوابة داخل كل أسبوع (البوابات التي لها نشاط في هذا الشهر فقط)
    var active=cols.filter(function(c){ return c.month>0; });
    var mx=0, grand=0;
    cols.forEach(function(c){ c.perWk.forEach(function(v){ if(v>mx) mx=v; grand+=v; }); });
    var GN=5, step=niceStep(Math.max(1,Math.ceil(Math.max(mx,5)/GN))), top=step*GN;
    var W=720,H=235,L=38,R=10,T=18,B=44, pw=W-L-R, ph=H-T-B, N=wins.length, gw=pw/N, gap=3;
    var n=Math.max(1,active.length);
    var bw=Math.max(5,Math.min(26,(gw-16-(n-1)*gap)/n)), grp=n*bw+(n-1)*gap;
    var o='';
    for(var g=0;g<=GN;g++){
      var yy=T+ph-(ph*g/GN);
      o+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+yy+'" y2="'+yy+'" stroke="#e6ecf6" stroke-width="1"/>';
      o+='<text x="'+(L-8)+'" y="'+(yy+4)+'" text-anchor="end" font-size="12" fill="#6b7a99" style="font-family:Cairo,sans-serif">'+(step*g)+'</text>';
    }
    o+='<line x1="'+L+'" x2="'+L+'" y1="'+T+'" y2="'+(T+ph)+'" stroke="#e6ecf6"/>';
    wins.forEach(function(w,k){
      var isNow=(todayIso>=w.from&&todayIso<=w.to), cx=L+k*gw+gw/2, x0=cx-grp/2;
      if(isNow) o+='<rect x="'+(L+k*gw+2)+'" y="'+T+'" width="'+(gw-4)+'" height="'+ph+'" rx="8" fill="#2f6fe4" opacity=".07"/>';
      active.forEach(function(c,ci){
        var v=c.perWk[k]; if(!v) return;
        var h=ph*Math.min(v,top)/top, x=x0+ci*(bw+gap), y=T+ph-h;
        o+='<rect x="'+x+'" y="'+y+'" width="'+bw+'" height="'+h+'" rx="'+Math.min(4,bw/2)+'" fill="'+c.src.col+'"><title>الأسبوع '+(k+1)+' ('+w.from+' → '+w.to+') — '+c.src.lbl+': '+v+'</title></rect>';
        if(bw>=9) o+='<text x="'+(x+bw/2)+'" y="'+(y-4)+'" text-anchor="middle" font-size="'+(bw>=11?11:9)+'" font-weight="800" fill="#1b2a4a" style="font-family:Cairo,sans-serif">'+v+'</text>';
      });
      o+='<text x="'+cx+'" y="'+(H-24)+'" text-anchor="middle" font-size="13" '+(isNow?'font-weight="800" fill="#1f4fd8"':'fill="#44536f"')+' style="font-family:Cairo,sans-serif">الأسبوع '+(k+1)+'</text>';
      o+='<text x="'+cx+'" y="'+(H-8)+'" text-anchor="middle" font-size="11" fill="#7b88a6" style="font-family:Cairo,sans-serif">'+w.a+' – '+w.z+'/'+(first.getMonth()+1)+'</text>';
    });
    svg.innerHTML=o;
    var wrap=document.getElementById('hpChartWrap');
    if(wrap) wrap.classList.toggle('is-empty', grand===0);
  }
  window.hpRender=hpRender;

  // ربط التحديث مع دالة الإحصائيات الأصلية
  function hook(){
    if(typeof window.updateDashboardStats==='function' && !window.updateDashboardStats.__hp){
      var orig=window.updateDashboardStats;
      var w=function(){ var r=orig.apply(this,arguments); try{hpRender();}catch(e){console.warn('hpRender',e);} return r; };
      w.__hp=true; window.updateDashboardStats=w;
    }
  }
  hook();
  hpRender();
  window.addEventListener('load',function(){ hook(); hpRender(); });
  var _gb=window.goBack;
  if(typeof _gb==='function'){ window.goBack=function(){ var r=_gb.apply(this,arguments); try{ if(typeof updateDashboardStats==='function') updateDashboardStats(); }catch(e){} return r; }; }
})();
