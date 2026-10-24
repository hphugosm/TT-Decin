/** Pure migration arithmetic. Missing observations are never converted to zero. */
const valid = x => typeof x === 'number' && Number.isFinite(x);
const count = x => valid(x) && x >= 0;
const defaults = s => ({metric:'balance',unit:'rate',mode:'value',window:1,shrinkage:0,...s});
export function createDataset(records, expectedCodes, meta={}) {
  const normalized=records.map(r=>({...r,code:String(r.code),year:Number(r.year),incoming:count(r.incoming)?r.incoming:null,outgoing:count(r.outgoing)?r.outgoing:null,population:count(r.population)?r.population:null}));
  const codes=[...new Set((expectedCodes?.length?expectedCodes:normalized.map(r=>r.code)).map(String))].sort();
  const index=new Map();
  for(const r of normalized){if(!Number.isInteger(r.year))throw new Error('Neplatný rok');const key=`${r.code}|${r.year}`;if(index.has(key))throw new Error(`Duplicitní obec a rok: ${key}`);index.set(key,r);}
  const years=[...new Set(normalized.map(r=>r.year))].sort((a,b)=>a-b);
  const minYear=years[0]??null,maxYear=years.at(-1)??null;
  return {records:normalized,codes,years,calendarYears:minYear===null?[]:Array.from({length:maxYear-minYear+1},(_,i)=>minYear+i),minYear,maxYear,meta,index,names:new Map([...normalized].sort((a,b)=>a.year-b.year).filter(r=>r.name).map(r=>[r.code,r.name])),cache:new Map()};
}
export function populationSummary(d,code,year){
  const codes=code==null?d.codes:[String(code)];
  const basis=d.meta.populationBasis;
  const startBasis=basis==='start'||d.meta.populationDate==='01-01';
  const endBasis=basis==='end'||d.meta.populationDate==='12-31';
  const sum=(key,fallback)=>{
    const values=codes.map(c=>{const r=d.index.get(`${c}|${year}`);return count(r?.[key])?r[key]:fallback&&count(r?.population)?r.population:null;});
    return values.length&&values.every(valid)?values.reduce((a,b)=>a+b,0):null;
  };
  const start=sum('populationStart',startBasis),end=sum('populationEnd',endBasis);
  return {start,end,change:valid(start)&&valid(end)?end-start:null};
}
export function rawAnnual(d,code,year){
  const cacheKey=`raw:${code??'REGION'}:${year}`;if(d.cache.has(cacheKey))return d.cache.get(cacheKey);
  const expected=code==null?d.codes.length:1;
  const rows=(code==null?d.codes:[String(code)]).map(c=>d.index.get(`${c}|${year}`)).filter(Boolean);
  const coverage={incoming:0,outgoing:0,balance:0,population:0};
  const sums={incoming:0,outgoing:0,balance:0,population:0};
  for(const r of rows){for(const k of ['incoming','outgoing','population'])if(valid(r[k])){sums[k]+=r[k];coverage[k]++;}if(valid(r.incoming)&&valid(r.outgoing)){sums.balance+=r.incoming-r.outgoing;coverage.balance++;}}
  const result={...Object.fromEntries(Object.keys(sums).map(k=>[k,coverage[k]?sums[k]:null])),coverage,expected,rows:rows.length,complete:Object.values(coverage).every(n=>n===expected),year,code:code==null?null:String(code)};d.cache.set(cacheKey,result);return result;
}
function aggregate(d,code,year,w){
  const cacheKey=`aggregate:${code??'REGION'}:${year}:${w}`;if(d.cache.has(cacheKey))return d.cache.get(cacheKey);
  const years=Array.from({length:w},(_,i)=>year-w+1+i), annual=years.map(y=>rawAnnual(d,code,y));
  const sums={},complete={};
  for(const k of ['incoming','outgoing','balance','population']){complete[k]=annual.every(a=>a.expected>0&&a.coverage[k]===a.expected)&&(k!=='population'||years.every(y=>(code==null?d.codes:[String(code)]).every(c=>(d.index.get(`${c}|${y}`)?.population??0)>0)));sums[k]=annual.every(a=>valid(a[k]))?annual.reduce((n,a)=>n+a[k],0):null;}
  const result={years,annual,sums,complete};d.cache.set(cacheKey,result);return result;
}
export function baseValue(d,code,year,settings={}){
  const s=defaults(settings),w=Number(s.window),metric=s.metric;
  if(![1,3,5].includes(w))return {value:null,reason:'Neplatné časové okno.',detail:{}};
  const local=aggregate(d,code,year,w),region=code==null?local:aggregate(d,null,year,w);
  const detail={metric,unit:s.unit,window:w,years:local.years,startYear:year-w+1,endYear:year,sumI:local.sums.incoming,sumE:local.sums.outgoing,sumS:local.sums.balance,sumP:local.sums.population,region:{sumI:region.sums.incoming,sumE:region.sums.outgoing,sumS:region.sums.balance,sumP:region.sums.population,complete:region.complete,annual:region.annual},raw:rawAnnual(d,code,year),annual:local.annual,complete:local.complete};
  const fail=reason=>({value:null,reason,detail});
  if(!['incoming','outgoing','balance'].includes(metric))return fail('Neplatná metrika.');
  // Municipal windows are strict; regional absolute sums may be partial but must exist in every year.
  if(code!=null?!local.complete[metric]:!valid(local.sums[metric]))return fail('Chybí údaj nebo celý kalendářní rok v požadovaném okně.');
  let events=local.sums[metric];detail.partial=!local.complete[metric];
  const k=Number(s.shrinkage);
  if(!Number.isFinite(k)||k<0)return fail('Konstanta shrinkage musí být nezáporné konečné číslo.');
  if(code!=null&&k>0&&['rate','deviation','contribution'].includes(s.unit)){
    if(!local.complete.population||!region.complete.population||!region.complete[metric])return fail('Shrinkage vyžaduje kladnou populaci obce a úplnou krajskou referenci ve všech letech okna.');
    const annual=local.annual.map((a,i)=>{
      const r=region.annual[i],weight=a.population/(a.population+k),rawRate=100*a[metric]/a.population,reference=100*r[metric]/r.population;
      return {year:a.year,population:a.population,weight,rawRate,reference,adjustedRate:weight*rawRate+(1-weight)*reference};
    });
    events=annual.reduce((sum,a)=>sum+a.adjustedRate*a.population/100,0);
    detail.shrinkage={constant:k,annual,adjustedEvents:events};
  }
  let value;
  if(s.unit==='absolute'){value=events/w;detail.formula='součet událostí / počet let';}
  else if(s.unit==='rate'||s.unit==='deviation'){
    if(!local.complete[metric]||!local.complete.population||!(local.sums.population>0)||local.annual.some(a=>!(a.population>0)))return fail('Chybí úplné pohyby nebo kladná populace pro celé okno.');
    value=100*events/local.sums.population;detail.localRate=value;
    if(s.unit==='deviation'){
      if(!region.complete[metric]||!region.complete.population||!(region.sums.population>0)||region.annual.some(a=>!(a.population>0)))return fail('Není dostupná úplná krajská reference pro stejné území a období.');
      detail.reference=100*region.sums[metric]/region.sums.population;value-=detail.reference;
    }else if(region.complete[metric]&&region.complete.population&&region.sums.population>0)detail.reference=100*region.sums[metric]/region.sums.population;
    detail.formula=s.unit==='rate'?'100 × součet událostí / součet populací':'místní míra − krajská míra';
  }else if(s.unit==='share'){
    if(metric==='balance')return fail('Podíl na saldu není definován.');
    if(!local.complete[metric]||!region.complete[metric]||!(region.sums[metric]>0))return fail('Chybí úplný nebo nenulový krajský součet pohybů.');
    value=100*events/region.sums[metric];detail.denominator=region.sums[metric];detail.formula='100 × místní součet / krajský součet';
  }else if(s.unit==='contribution'){
    if(!local.complete[metric]||!region.complete.population||!(region.sums.population>0)||region.annual.some(a=>!(a.population>0)))return fail('Chybí úplná kladná krajská populace nebo místní pohyby.');
    value=100*events/region.sums.population;detail.denominator=region.sums.population;detail.formula='100 × místní součet / krajské populační expozice';
  }else return fail('Neplatná jednotka.');
  if(detail.shrinkage)detail.formula='Ročně: w = P / (P + K); r* = w × r + (1 − w) × R. '+(w>1?'Víceleté míry jsou průměrem r* váženým roční populací. ':'')+(s.unit==='contribution'?'100 × součet (r* × P / 100) / krajská populační expozice.':s.unit==='deviation'?'Vyhlazená místní míra minus původní krajská míra.':'Výsledkem je vyhlazená místní míra v procentech.');
  return {value,detail};
}
export function derivedValue(d,code,year,settings={}){
  const s=defaults(settings),after=baseValue(d,code,year,s);
  if(s.mode==='value')return {...after,detail:{...after.detail,mode:s.mode,afterYear:year}};
  if(!['yoy','difference'].includes(s.mode))return {value:null,reason:'Neplatný režim.',detail:{}};
  const beforeYear=s.mode==='yoy'?year-1:Number(s.baseYear),before=baseValue(d,code,beforeYear,s);
  return {value:valid(before.value)&&valid(after.value)?after.value-before.value:null,reason:!valid(after.value)?after.reason:!valid(before.value)?before.reason:undefined,detail:{...after.detail,mode:s.mode,before,after,beforeYear,afterYear:year,formula:'B minus A'}};
}
export function colorDomain(d,settings={}){
  const s=defaults(settings),key=JSON.stringify(s);if(d.cache.has(key))return d.cache.get(key);
  const signed=s.metric==='balance'||s.unit==='deviation'||s.mode!=='value';let max=0;
  for(const code of d.codes)for(const year of d.calendarYears){const v=derivedValue(d,code,year,s).value;if(valid(v))max=Math.max(max,Math.abs(v));}
  const domain={min:signed?-(max||1):0,max:max||1,signed};d.cache.set(key,domain);return domain;
}
export function colorFor(value,domain,neutral=0,contrast=1,metric='balance'){
  if(!valid(value))return '#d8dce5';
  const threshold=Math.max(0,Number(neutral)||0);if(Math.abs(value)<=threshold)return '#f2f1ed';
  const extent=Math.max(Math.abs(domain.min),Math.abs(domain.max),threshold+Number.EPSILON);
  const t=Math.pow(Math.min(1,Math.max(0,(Math.abs(value)-threshold)/(extent-threshold))),1/Math.max(.1,Number(contrast)||1));
  const end=metric==='incoming'?(value<0?[110,151,218]:[23,61,165]):metric==='outgoing'?(value<0?[239,178,122]:[222,117,36]):domain.signed&&value<0?[222,117,36]:[23,61,165],start=[242,241,237];
  return `rgb(${start.map((v,i)=>Math.round(v+(end[i]-v)*t)).join(', ')})`;
}
export function scatterPoint(d,code,year,settings={}){
  const s=defaults(settings),axisUnit=s.unit==='deviation'?'deviation':'rate';
  const incoming=derivedValue(d,code,year,{...s,metric:'incoming',unit:axisUnit}),outgoing=derivedValue(d,code,year,{...s,metric:'outgoing',unit:axisUnit});
  const color=derivedValue(d,code,year,s),raw=rawAnnual(d,code,year);
  return {code,x:incoming.value,y:outgoing.value,population:raw.population,colorValue:color.value,incoming,outgoing,color,available:valid(incoming.value)&&valid(outgoing.value),unit:axisUnit};
}
export function metricLabel(metric){return {incoming:'Přistěhovalí',outgoing:'Vystěhovalí',balance:'Migrační saldo'}[metric]??metric;}
export function unitLabel(settings={}){const s=defaults(settings);return {absolute:s.window>1?'osob za rok (průměr)':'osob',rate:s.mode==='value'?'% obyvatel obce':'procentních bodů (obyvatel obce)',share:s.mode==='value'?'%':'procentních bodů',contribution:s.mode==='value'?'% obyvatel kraje':'procentních bodů (obyvatel kraje)',deviation:'procentních bodů od kraje'}[s.unit]??s.unit;}
