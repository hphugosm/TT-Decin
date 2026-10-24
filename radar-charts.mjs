import {derivedValue, metricLabel, unitLabel} from './radar-engine.mjs';
import {eventsForTerritory} from './radar-events.mjs?v=garrison-2005-2006';
const metricColors={incoming:'#173da5',outgoing:'#de7524',balance:'#d3a600'};
const NS='http://www.w3.org/2000/svg', finite=Number.isFinite;
let chartSequence=0;
const fmt=n=>finite(n)?new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:n&&Math.abs(n)<1?Math.min(6,2-Math.floor(Math.log10(Math.abs(n)))):2}).format(n):'nedostupné';
function node(tag,attrs={},text){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!=null)e.textContent=text;return e;}
function add(parent,tag,attrs,text){const e=node(tag,attrs,text);parent.append(e);return e;}
function setup(svg,height,label){svg.replaceChildren();svg.setAttribute('viewBox',`0 0 1000 ${height}`);svg.setAttribute('role','group');svg.setAttribute('aria-label',label);svg.style.width='100%';svg.style.removeProperty('height');add(svg,'title',{},label);}
function line(svg,x1,y1,x2,y2,attrs={}){return add(svg,'line',{x1,y1,x2,y2,stroke:'#dce2ed','stroke-width':1,'aria-hidden':'true',...attrs});}
function label(svg,x,y,text,attrs={}){return add(svg,'text',{x,y,fill:'#536078','font-size':12,'font-family':'system-ui, sans-serif',...attrs},text);}
function name(ds,code){return code==null?'Obce Ústeckého kraje':ds.names?.get(String(code))||ds.records.find(r=>r.code===String(code))?.name||String(code);}
function ranges(result){const d=result?.detail||{},w=d.window||1,yr=d.afterYear??d.endYear;const shrinkage=d.shrinkage?` · shrinkage K = ${fmt(d.shrinkage.constant)}`:'';const window=y=>w===1?`${y}`:`${y-w+1}–${y}`;return d.beforeYear!=null?`${window(yr)} minus ${window(d.beforeYear)} (B − A)${shrinkage}`:`${window(yr)}${w>1?' · průměrná roční hodnota':''}${shrinkage}`;}
function activate(e,callback){e.addEventListener('click',callback);e.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();callback();}});}
function point(svg,{x,y,r=4,color='#173DA5',title,attrs={},onClick,onHover,selected=false,reference=false}){const g=add(svg,'g',{...attrs,tabindex:0,role:onClick?'button':'img','aria-label':title,style:'cursor:pointer;outline-offset:3px'});add(g,'title',{},title);add(g,'circle',{cx:x,cy:y,r:Math.max(r,9),fill:'transparent','data-hit-target':'true'});add(g,'circle',{cx:x,cy:y,r,fill:color,opacity:reference?.65:.88,stroke:selected?'#101d3b':reference?'#68798e':'#fff','stroke-width':selected?3:1,'data-mark':'true'});if(onClick)activate(g,onClick);if(onHover){g.addEventListener('mouseenter',()=>onHover(attrs['data-code']));g.addEventListener('mouseleave',()=>onHover(null));g.addEventListener('focus',()=>onHover(attrs['data-code']));g.addEventListener('blur',()=>onHover(null));}return g;}
function extent(values,{nonnegative=false}={}){let lo=Math.min(0,...values),hi=Math.max(0,...values);if(lo===hi)hi=lo+1;const pad=(hi-lo)*.08;return [nonnegative?0:lo-pad,hi+pad];}
export function renderTimeChart(svg,{dataset:ds,settings,selectedCode=null,year,onYear}){
 const width=Math.max(300,svg.clientWidth||1000),height=Math.max(140,svg.clientHeight||245);
 setup(svg,height,'Vývoj v čase · jednotlivé roční body bez spojnic');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);if(!ds?.calendarYears?.length)return {note:'Nahrajte data pro zobrazení časového grafu.',count:0};
 const local=ds.calendarYears.map(y=>({year:y,result:derivedValue(ds,selectedCode,y,settings)}));
 const showReference=selectedCode!=null&&['rate','deviation'].includes(settings.unit);
 const reference=showReference?ds.calendarYears.map(y=>({year:y,result:derivedValue(ds,null,y,settings)})):[];
 const flows=settings.metric==='balance'?['incoming','outgoing'].map(metric=>({metric,points:ds.calendarYears.map(y=>({year:y,result:derivedValue(ds,selectedCode,y,{...settings,metric})}))})):[];
 const eventYears=new Map(ds.calendarYears.map(yr=>[yr,eventsForTerritory(yr,selectedCode)]).filter(([,events])=>events.length));
 const left=65,right=width-24,top=width<600?44:28;
 const yearGap=(right-left)/(ds.maxYear-ds.minYear||1),rotateYears=eventYears.size>0&&yearGap<34,bottom=height-(rotateYears?66:48);
 const vals=[...local,...reference,...flows.flatMap(flow=>flow.points)].map(p=>p.result.value).filter(finite),[lo,hi]=extent(vals);
 const x=y=>left+(y-ds.minYear)/(ds.maxYear-ds.minYear||1)*(right-left),y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);
 const eventTitle=(yr,events)=>`${yr} · ${events.map(event=>`${event.place}: ${event.title}. ${event.description}`).join('\n')}`;
 if(eventYears.size){
  const patternId=`radar-event-hatch-${++chartSequence}`,defs=add(svg,'defs');
  const pattern=add(defs,'pattern',{id:patternId,width:8,height:8,patternUnits:'userSpaceOnUse'});
  add(pattern,'rect',{width:8,height:8,fill:'#d33438','fill-opacity':.035});
  add(pattern,'path',{d:'M-2 2L2 -2M0 8L8 0M6 10L10 6',fill:'none',stroke:'#d33438','stroke-opacity':.3,'stroke-width':1});
  const bands=add(svg,'g',{class:'chart-event-bands','pointer-events':'none','aria-hidden':'true'});
  const periods=new Map([...eventYears.values()].flat().map(event=>[event.id,event]));
  for(const event of periods.values()){
   const start=Math.max(ds.minYear,event.startYear),end=Math.min(ds.maxYear,event.endYear);
   // Annual points sit at the centres of year-wide bins; clip edge bins to the plot.
   const x1=Math.max(left,x(start-.5)),x2=Math.min(right,x(end+.5));
   add(bands,'rect',{class:'chart-event-band','data-event':event.id,'data-start-year':start,'data-end-year':end,x:x1,y:top,width:x2-x1,height:Math.max(0,bottom-top),fill:`url(#${patternId})`,stroke:'#d33438','stroke-opacity':.55,'stroke-width':1});
  }
 }
 for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;line(svg,left,y(v),right,y(v));label(svg,left-10,y(v)+4,fmt(v),{'text-anchor':'end'});}line(svg,left,y(0),right,y(0),{stroke:'#a4afc0'});
 if(!eventYears.has(year))line(svg,x(year),top,x(year),bottom,{stroke:'#173DA5','stroke-dasharray':'4 4'});
 for(const [yr,events] of eventYears){
  const marker=add(svg,'g',{class:'chart-event-marker','data-event-year':yr,tabindex:0,role:'button','aria-label':`Událost ${eventTitle(yr,events)}`});
  add(marker,'title',{},eventTitle(yr,events));
  add(marker,'rect',{x:x(yr)-Math.min(7,yearGap/2),y:top-14,width:Math.min(14,yearGap),height:bottom-top+16,fill:'transparent'});
  add(marker,'circle',{cx:x(yr),cy:top-7,r:5.5,fill:'#d33438',stroke:yr===year?'#8e2529':'none','stroke-width':2,'aria-hidden':'true'});
  label(marker,x(yr),top-4,'!',{'text-anchor':'middle',fill:'#fff','font-size':9,'font-weight':750,'data-fixed-size':'true','aria-hidden':'true'});
  activate(marker,()=>{onYear?.(yr);svg.querySelector(`.chart-event-marker[data-event-year="${yr}"]`)?.focus();});
 }
 const step=Math.max(1,Math.ceil(ds.calendarYears.length/Math.max(3,Math.floor((right-left)/50))));
 for(const yr of ds.calendarYears){
  const events=eventYears.get(yr),tick=add(svg,'g',{class:events?'chart-year-tick event-year':'chart-year-tick','data-year':yr,tabindex:0,role:'button','aria-label':events?`Vybrat rok ${eventTitle(yr,events)}`:`Vybrat rok ${yr}`});
  const hitWidth=Math.min(26,yearGap),baseline=bottom+(rotateYears?16:21);
  add(tick,'rect',{x:x(yr)-hitWidth/2,y:bottom+3,width:hitWidth,height:rotateYears?46:27,fill:'transparent'});
  if(events)add(tick,'title',{},eventTitle(yr,events));
  const regular=((yr-ds.minYear)%step===0&&ds.maxYear-yr>=step*.6)||yr===ds.maxYear;
  const clearOfEvents=rotateYears||![...eventYears.keys()].some(eventYear=>Math.abs(x(eventYear)-x(yr))<32);
  if(events||(regular&&clearOfEvents))label(tick,x(yr),baseline,yr,{'text-anchor':rotateYears?'end':'middle',fill:events?'#c32930':yr===year?'#173DA5':'#536078','font-weight':events?700:400,'font-size':rotateYears?9.5:width<600?10:11,'data-fixed-size':'true',...(rotateYears?{transform:`rotate(-60 ${x(yr)} ${baseline})`}:{})});
  activate(tick,()=>onYear?.(yr));
 }
 for(const [series,points] of [['reference',reference],['local',local]])for(const p of points){if(!finite(p.result.value))continue;const referenceValue=series==='local'&&showReference?derivedValue(ds,null,p.year,settings).value:null;const detail=p.result.detail||{};const partials=[detail.after||p.result,detail.before].filter(Boolean).filter(v=>v.detail?.partial).map(v=>{const d=v.detail;return `${d.startYear}–${d.endYear}: ${(d.annual||[]).map(a=>`${a.year} ${a.coverage?.[settings.metric]??0}/${a.expected} obcí`).join(', ')}`;});const title=`${name(ds,series==='reference'?null:selectedCode)} · ${metricLabel(settings.metric)} · ${p.year}: ${fmt(p.result.value)} ${unitLabel(settings)} · ${ranges(p.result)}${showReference&&series==='local'?` · krajská reference ve stejném režimu: ${fmt(referenceValue)} ${unitLabel(settings)}`:''}${partials.length?` · NEÚPLNÝ součet dostupných obcí · ${partials.join('; ')}`:''}`;point(svg,{x:x(p.year),y:y(p.result.value),r:p.year===year?6:4,color:series==='reference'?'#8798ad':metricColors[settings.metric],reference:series==='reference',selected:p.year===year&&series==='local',title,attrs:{'data-year':p.year,'data-series':series,'data-metric':settings.metric,'data-value':p.result.value,...(selectedCode&&series==='local'?{'data-code':selectedCode}:{})},onClick:()=>onYear?.(p.year)});}
 for(const flow of flows)for(const p of flow.points){if(!finite(p.result.value))continue;point(svg,{x:x(p.year),y:y(p.result.value),r:p.year===year?5:3.5,color:metricColors[flow.metric],selected:p.year===year,title:`${name(ds,selectedCode)} · ${metricLabel(flow.metric)} · ${p.year}: ${fmt(p.result.value)} ${unitLabel(settings)} · ${ranges(p.result)}`,attrs:{'data-year':p.year,'data-series':flow.metric,'data-metric':flow.metric,'data-value':p.result.value,...(selectedCode?{'data-code':selectedCode}:{})},onClick:()=>onYear?.(p.year)});}
 const mode=settings.mode==='yoy'?'Meziroční změna':settings.mode==='difference'?`B − A (A = ${settings.baseYear})`:'Hodnota';
 label(svg,left,12,width<600?`${metricLabel(settings.metric)} · ${mode}`:`${metricLabel(settings.metric)} · ${unitLabel(settings)} · ${mode}`,{'font-size':width<600?10:11});if(width<600)label(svg,left,26,unitLabel(settings),{'font-size':10});
 for(const text of svg.querySelectorAll('text'))if(!text.hasAttribute('data-fixed-size'))text.setAttribute('font-size',width<600?10:11);
 let note=showReference?'Slabší body zobrazují krajskou referenci se stejným časovým oknem a režimem.':selectedCode&&settings.unit==='absolute'?'Přímé porovnání obce s krajskou referencí je dostupné v procentech obyvatel obce.':settings.unit==='share'&&!selectedCode?'Celý kraj odpovídá 100 %; změna tohoto celku je 0 procentních bodů.':settings.unit==='deviation'&&!selectedCode?'Odchylka kraje od vlastní reference je 0.':'Chybějící roky zůstávají bez bodu.';
 if(flows.length)note='Modře přistěhovalí, oranžově vystěhovalí, fialově saldo. '+(showReference?'Šedé body jsou krajská reference salda. ':'')+'Všechny řady používají stejnou jednotku, shrinkage a časový režim. Chybějící hodnoty zůstávají bez bodů.';
 return {note,count:local.filter(p=>finite(p.result.value)).length,referenceCount:reference.filter(p=>finite(p.result.value)).length,domain:[lo,hi],eventCount:eventYears.size,activeEvents:eventYears.get(year)||[]};
}
