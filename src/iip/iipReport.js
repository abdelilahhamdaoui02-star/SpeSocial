// تقرير البرنامج التدخلي الفردي (HTML نصي) + منحنى التقدم SVG. منقولان حرفياً من script-36.js القديم؛
// الفرق الوحيد أن اسم المؤسسة والمختص والشعار صارت تُمرَّر معاملاً بدل قراءتها من متغيرات عامة.
import { MODELS, DOM } from './iipData.js';

const esc=v=>String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export { esc };

export function chartSvg(S,print){
  const P=S.filter(s=>s.scale!==''&&s.scale!=null&&!isNaN(+s.scale));if(P.length<2)return print?'':'<div class="iip-hint">يظهر منحنى التقدم بعد تسجيل جلستين مقيّمتين على الأقل.</div>';
  const W=520,H=160,L=30,B=24,n=P.length,x=i=>L+(W-L-10)*i/(n-1),y=v=>H-B-(H-B-12)*(+v)/10;
  const pts=P.map((s,i)=>x(i)+','+y(s.scale)).join(' ');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:560px;display:block;margin:10px auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px"><text x="4" y="14" font-size="10" fill="#475569">التقدّم (0–10)</text>${[0,5,10].map(v=>`<line x1="${L}" x2="${W-10}" y1="${y(v)}" y2="${y(v)}" stroke="#e2e8f0"/><text x="4" y="${y(v)+3}" font-size="9" fill="#64748b">${v}</text>`).join('')}<polyline points="${pts}" fill="none" stroke="#14909a" stroke-width="2.5"/>${P.map((s,i)=>`<circle cx="${x(i)}" cy="${y(s.scale)}" r="4" fill="#0f5e63"/><text x="${x(i)-3}" y="${H-8}" font-size="9" fill="#475569">${i+1}</text>`).join('')}</svg>`}

export function reportHtml(p, { school, spec, logo }) {
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
  if(p.sessions.length)h+='<table class="wk-table-report"><thead><tr>'+th('#',0.4)+th('التاريخ',1.2)+th('المدة',0.7)+th('المحور',2)+th('التقنيات',1.8)+th('المهمة',1.8)+th('التقدم',0.8)+th('الاستجابة والملاحظات',2.4)+th('الخطوة التالية',1.8)+'</tr></thead><tbody>'+p.sessions.map((x,i)=>`<tr><td>${i+1}</td><td>${V(x.date)}</td><td>${V(x.dur)}</td><td>${V(x.focus)}</td><td>${V(x.tech)}</td><td>${V(x.task)}</td><td>${V(x.scale)}</td><td>${V(x.resp)}</td><td>${V(x.next)}</td></tr>`).join('')+'</tbody></table>'+chartSvg(p.sessions,true);
  else h+=kv([['الجلسات','لم تُسجَّل جلسات بعد']]);
  h+=ST('6. التقويم')+kv([['النتيجة',rv.outcome||'قيد التنفيذ','تاريخ المراجعة',rv.date],['المؤشرات البعدية','غياب/شهر: '+dash(po.abs)+' | وقائع/أسبوع: '+dash(po.inc)+' | رفاه: '+dash(po.well)+'/10'],['الخلاصة والتوصيات',rv.notes]]);
  h+='<div class="sig-wrap"><div class="sig-block"><div class="sig-line"></div>المختص الاجتماعي</div><div class="sig-block"><div class="sig-line"></div>الحارس العام</div><div class="sig-block"><div class="sig-line"></div>مدير المؤسسة</div></div>';
  return h}
