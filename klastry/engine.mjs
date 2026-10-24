export const PROFILE_LABELS={balanced:'Původní',relaxed:'Mírnější',loose:'Volnější',extended:'Rozšířený'};
export const MODES={immigration:{label:'Přistěhování',color:'#173da5'},emigration:{label:'Vystěhování',color:'#de7524'}};
export const METRICS={rate:{label:'Podíl obyvatel',unit:'% obyvatel',factor:.1},delta:{label:'Modelovaná meziroční změna',unit:'procentních bodů',factor:.1},raw:{label:'Počet migrantů',unit:'osob',factor:1}};
export const finite=v=>typeof v==='number'&&Number.isFinite(v);
export const format=(n,d=1)=>finite(n)?n.toLocaleString('cs-CZ',{maximumFractionDigits:d}):'—';
export const percent=n=>finite(n)?`${format(n*100,0)} %`:'—';
export const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('cs').trim();
export function visibleGroups(mode,{minSize=2,stableOnly=false}={}){
 return mode.groups.filter(g=>g.member_ids.length>=minSize&&(!stableOnly||g.stable)).sort((a,b)=>b.member_ids.length-a.member_ids.length||Number(b.stable)-Number(a.stable)||b.quality.agreement-a.quality.agreement||a.id.localeCompare(b.id));
}
export function groupColor(group){
 let hash=0;for(const char of [...group.member_ids].sort().join('-'))hash=(hash*31+char.charCodeAt(0))>>>0;
 return `hsl(${hash%360} 48% 51%)`;
}
export const MEMBER_COLORS=['#173da5','#de7524','#278b85','#9056a4','#b28b13','#b9486a'];
export function completeSum(values){return values.length&&values.every(finite)?values.reduce((a,b)=>a+b,0):null;}
export function aggregate(towns,mode,yearIndex){
 const population=completeSum(towns.map(t=>t.population[yearIndex])),raw=completeSum(towns.map(t=>t[mode].raw[yearIndex]));
 return {population,raw,rate:finite(raw)&&finite(population)&&population>0?100*raw/population:null};
}
export function valuesFor(town,mode,metric){return town[mode][metric].map(v=>finite(v)?v*METRICS[metric].factor:null);}
export function median(values){const a=values.filter(finite).sort((a,b)=>a-b);return a.length?a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2:null;}
export function chartSeries(towns,selectedTowns,mode,metric,years,hasSelection){
 if(!hasSelection){
  if(metric==='delta')return [{id:'median',name:'Medián obcí kraje',color:MODES[mode].color,values:years.map((_,i)=>median(towns.map(t=>valuesFor(t,mode,metric)[i])))}];
  return [{id:'region',name:metric==='raw'?'Součet obcí kraje':'Míra obcí kraje',color:MODES[mode].color,values:years.map((_,i)=>aggregate(towns,mode,i)[metric])}];
 }
 const series=selectedTowns.map((town,i)=>({id:town.id,name:town.name,color:MEMBER_COLORS[i%MEMBER_COLORS.length],values:valuesFor(town,mode,metric)}));
 if(metric==='rate')series.push({id:'region',name:'Průměr kraje',color:'#8798ad',values:years.map((_,i)=>aggregate(towns,mode,i).rate)});
 return series;
}
export function searchTowns(towns,query){
 const q=normalize(query);if(!q)return [];
 return towns.filter(t=>normalize(t.name).startsWith(q)||t.id.startsWith(q)).sort((a,b)=>a.name.localeCompare(b.name,'cs')||a.id.localeCompare(b.id));
}
