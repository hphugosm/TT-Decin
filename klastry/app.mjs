import {PROFILE_LABELS,MODES,METRICS,MEMBER_COLORS,format,percent,normalize,visibleGroups,groupColor,aggregate,chartSeries,searchTowns} from './engine.mjs';
import {createClusterMap} from './map.mjs';
import {renderClusterChart} from './chart.mjs';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const expandIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3H3v6M15 3h6v6M3 15v6h6M21 15v6h-6"/></svg>';
const DEFAULT_PROFILE='extended';
const PROFILE_ORDER=['balanced','relaxed','loose','extended'];
let profiles,seriesData,towns,townIndex,map,provenance,timer=null,chartFrame=0,expanded=null,inertNodes=[],lastExpandButton=null;
const state={profile:DEFAULT_PROFILE,mode:'immigration',minSize:2,stableOnly:false,metric:'rate',year:2025,group:null,code:null};
const modeData=()=>profiles[state.profile].modes[state.mode];
const groups=()=>visibleGroups(modeData(),state);
const selectedGroup=()=>modeData().groups.find(g=>g.id===state.group)||null;
const selectedTowns=()=>selectedGroup()?.member_ids.map(id=>townIndex.get(id))||(state.code?[townIndex.get(state.code)]:towns);
const swatch=color=>`<i class="swatch" style="--swatch:${color}" aria-hidden="true"></i>`;
const stat=(value,label)=>`<div class="stat"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;
function openDialog(id){pause();$(id).showModal();}
function initProfileOptions(){
 $('profile-options').innerHTML=PROFILE_ORDER.map(key=>{const p=profiles[key].modes[state.mode].parameters;return `<label class="profile-option"><input type="radio" name="profile" value="${key}" aria-describedby="profile-help"><span><span class="profile-title"><strong>${percent(p.min_agreement)}</strong><span>${PROFILE_LABELS[key]}${key===DEFAULT_PROFILE?' · výchozí':''}</span></span><small>Obě korelace alespoň ${format(p.min_pearson,2)}</small><small data-profile-count="${key}"></small></span></label>`;}).join('');
}
function syncSettings(){for(const [id,value] of [['min-size',state.minSize],['chart-metric',state.metric]])$(id).value=value;document.querySelectorAll('[name="profile"]').forEach(input=>input.checked=input.value===state.profile);$('stable-only').checked=state.stableOnly;}
function updateProfileCounts(){
 document.querySelectorAll('[data-profile-count]').forEach(el=>{const list=profiles[el.dataset.profileCount].modes[state.mode].groups,maxSize=Math.max(0,...list.map(g=>g.member_ids.length));el.textContent=`${list.length} skupin · až ${maxSize} ${maxSize>=5?'obcí':'obce'}`;});
}
function pause(){clearInterval(timer);timer=null;$('play').textContent='▶ Přehrát';$('play').setAttribute('aria-label','Přehrát časovou osu');}
function play(){pause();$('play').textContent='Ⅱ Pozastavit';$('play').setAttribute('aria-label','Pozastavit časovou osu');timer=setInterval(()=>stepYear(1,false),1000/Number($('speed').value));}
function setYear(year,stop=true){if(stop)pause();state.year=Math.min(seriesData.years.at(-1),Math.max(seriesData.years[0],Number(year)));render();}
function stepYear(step,stop=true){let i=seriesData.years.indexOf(state.year);setYear(seriesData.years[(i+step+seriesData.years.length)%seriesData.years.length],stop);}
function resetSelection(){pause();state.group=null;state.code=null;$('town-search').value='';closeSearch();render();map.reset();}
function pickGroup(id){const g=modeData().groups.find(g=>g.id===id);if(!g)return;pause();state.group=id;state.code=null;render();map.fit(g.member_ids);}
function pickTown(code){
 if(!townIndex.has(code))return;
 if(state.code===code){resetSelection();return;}
 pause();const gid=modeData().memberships[code],g=modeData().groups.find(g=>g.id===gid);
 if(g&&!groups().some(x=>x.id===gid)){state.minSize=2;state.stableOnly=false;syncSettings();}
 state.group=g?.id||null;state.code=code;render();map.fit(g?.member_ids||[code]);
}
function pickMember(code){state.code=state.code===code?null:code;render();}
function changeAnalysis(){pause();state.group=null;state.code=null;$('town-search').value='';closeSearch();syncSettings();render();map.reset();}
function render(){
 updateProfileCounts();
 const visible=groups(),g=selectedGroup(),chosen=selectedTowns(),hasSelection=Boolean(g||state.code),i=seriesData.years.indexOf(state.year),totals=aggregate(chosen,state.mode,i);
 const title=g?g.name:state.code?townIndex.get(state.code).name:'Ústecký kraj';
 $('territory-title').textContent=title;$('territory-title').classList.toggle('long-title',title.length>35);
 $('map-territory').textContent=g?`${g.member_ids.length} obce · ${g.member_ids.length>4?'skupina':g.name}`:title;
 if(g&&g.member_ids.length>=5)$('map-territory').textContent=`${g.member_ids.length} obcí · skupina`;
 $('overview-label').textContent=g?(g.stable?'STABILNĚJŠÍ PRŮZKUMNÁ SKUPINA':'PRŮZKUMNÁ SKUPINA'):state.code?'OBEC BEZ SKUPINY':'MIGRAČNÍ KLASTRY · '+PROFILE_LABELS[state.profile].toLocaleUpperCase('cs');
 $('population').textContent=`${format(totals.population,0)} obyvatel`;$('population').title='Počet obyvatel k 1. červenci vybraného roku';
 for(const id of ['map-year','year-label','detail-year'])$(id).textContent=state.year;$('year').value=state.year;
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
 if(g){
  $('stats').innerHTML=stat(String(g.member_ids.length),'obcí ve skupině')+stat(percent(g.quality.agreement),'průměrná shoda směrů')+stat(format(g.quality.min_pearson,2),'nejnižší korelace r');
  $('selection-info').innerHTML=`<div class="members-chips">${chosen.map((t,j)=>`<button data-member="${t.id}" aria-pressed="${state.code===t.id}">${swatch(MEMBER_COLORS[j%MEMBER_COLORS.length])}${esc(t.name)}</button>`).join('')}</div><p style="margin-top:8px">Retence celé skupiny: ${percent(g.quality.block_group_stability)} bloková · ${percent(g.quality.poisson_group_stability)} Poissonova.</p>`;
 }else if(state.code){
  $('stats').innerHTML=stat(format(totals.raw,0),MODES[state.mode].label.toLocaleLowerCase('cs'))+stat(format(totals.rate,2)+' %','obyvatel obce')+stat('—','bez přiřazené skupiny');
  $('selection-info').textContent=`V profilu „${PROFILE_LABELS[state.profile]}“ tato obec není přiřazena ke skupině. Její vlastní vývoj je zobrazen v grafu.`;
 }else{
  $('stats').innerHTML=stat(String(visible.length),'zobrazených skupin')+stat(String(visible.reduce((n,x)=>n+x.member_ids.length,0)),'obcí ve skupinách')+stat(String(visible.filter(x=>x.stable).length),'stabilnějších skupin');
  $('selection-info').textContent=visible.length?'Klikněte na barevnou obec a prohlédněte si celou skupinu.':'Žádná skupina nesplňuje zvolený filtr. Nastavení lze změnit vpravo nahoře.';
 }
 $('detail-open').hidden=!g;$('groups-open').textContent=`Vybrat skupinu · ${visible.length}`;
 $('map-empty').hidden=Boolean(visible.length||hasSelection);
 const unassigned=Object.values(modeData().memberships).filter(x=>x==='UNASSIGNED').length;
 const hidden=towns.length-unassigned-visible.reduce((n,x)=>n+x.member_ids.length,0);
 $('map-legend').innerHTML=`<span class="legend-key">${swatch(g?groupColor(g):'#498d9b')}${g?'Vybraná skupina':`${visible.length} barevných skupin`}</span><span class="legend-key">${swatch('#d6dfeb')}${unassigned} nezařazených${hidden?` · ${hidden} skrytých filtrem`:''}</span>`;
 map.update({memberships:new Map(Object.entries(modeData().memberships)),colors:new Map(modeData().groups.map(x=>[x.id,groupColor(x)])),visibleIds:new Set(visible.map(x=>x.id)),selectedGroup:state.group,selectedCode:state.code,names:new Map(towns.map(t=>[t.id,t.name]))});
 $('footer-summary').textContent=`${PROFILE_LABELS[state.profile]} profil · ${MODES[state.mode].label} · skupiny 2000–2025 · populace k 1. 7.`;
 $('metric-help').textContent=state.metric==='delta'?'Změna vybrané modelové míry proti předchozímu roku. Přistěhování je empiricky vyhlazené, vystěhování používá původní míry.':state.metric==='raw'?'Původní roční počty; velikost obcí ovlivňuje jejich výši.':'Původní roční počet / populace k 1. červenci × 100.';
 if($('groups-dialog').open)renderGroupList();if($('detail-dialog').open)renderDetail();
 drawChart();
}
function drawChart(){cancelAnimationFrame(chartFrame);chartFrame=requestAnimationFrame(()=>{
 const chosen=selectedTowns(),hasSelection=Boolean(state.group||state.code);
 const data=chartSeries(towns,chosen,state.mode,state.metric,seriesData.years,hasSelection);
 $('chart-unit').textContent=state.metric==='delta'?'Změna modelu · p. b.':METRICS[state.metric].unit;
 renderClusterChart($('time-chart'),{years:seriesData.years,year:state.year,series:data,unit:METRICS[state.metric].unit,selectedCode:state.code,onYear:setYear});
 $('chart-legend').innerHTML=data.map(s=>townIndex.has(s.id)&&state.group?`<button data-member="${s.id}" aria-pressed="${state.code===s.id}">${swatch(s.color)}${esc(s.name)}</button>`:`<span class="legend-key">${swatch(s.color)}${esc(s.name)}</span>`).join('');
 });}
function closeSearch(){$('search-results').hidden=true;$('town-search').setAttribute('aria-expanded','false');}
function showSearch(){
 const q=$('town-search').value,results=searchTowns(towns,q);if(!normalize(q)){closeSearch();return;}
 $('search-results').innerHTML=results.length?results.map(t=>`<button data-town="${t.id}"><span>${esc(t.name)}</span><small>${esc(t.district)} · ${modeData().memberships[t.id]==='UNASSIGNED'?'bez skupiny':'ve skupině'}</small></button>`).join(''):'<p>Žádná obec nezačíná tímto názvem.</p>';
 $('search-results').hidden=false;$('town-search').setAttribute('aria-expanded','true');
}
function renderGroupList(){
 const q=normalize($('group-search').value),visible=groups().filter(g=>normalize(g.name+' '+g.id).includes(q));
 $('groups-context').textContent=`${PROFILE_LABELS[state.profile]} profil · ${MODES[state.mode].label}`;
 $('group-list').innerHTML=visible.length?visible.map(g=>`<button class="group-card" data-group="${g.id}" aria-pressed="${state.group===g.id}">${swatch(groupColor(g))}<span><strong>${esc(g.name)}</strong><small>${g.stable?'Stabilnější průzkumný nález':'Průzkumný nález'} · shoda ${percent(g.quality.agreement)} · min. r ${format(g.quality.min_pearson,2)}</small></span><span>${g.member_ids.length} obcí</span></button>`).join(''):'<p class="empty-list">Žádná skupina neodpovídá hledání nebo nastaveným filtrům.</p>';
}
function renderDetail(){
 const g=selectedGroup();if(!g){$('detail-dialog').close();return;}
 const q=g.quality,index=seriesData.years.indexOf(state.year),p=modeData().parameters;
 $('detail-title').textContent=g.name;
 $('group-detail').innerHTML=`<span class="badge">${PROFILE_LABELS[state.profile]} profil</span><span class="badge">${MODES[state.mode].label}</span><span class="badge">${g.stable?'Stabilnější průzkumný nález':'Průzkumný nález'}</span><p class="detail-description">${g.member_ids.length} obcí tvoří souvislé území. Největší vzdálenost mezi středy: <strong>${format(q.diameter_km,2)} km</strong>. Podobnost vychází ze změn v období 2000–2025, nikoli pouze z roku ${state.year}.</p><div class="detail-members">${g.member_ids.map((id,j)=>{const t=townIndex.get(id);return `<div class="member-detail" style="--member-color:${MEMBER_COLORS[j%MEMBER_COLORS.length]}"><strong>${esc(t.name)}</strong><small>${state.year} · ${format(t.population[index],0)} obyvatel k 1. 7.<br>${MODES[state.mode].label}: ${format(t[state.mode].raw[index],0)} osob · ${format(t[state.mode].rate[index]===null?null:t[state.mode].rate[index]/10,2)} %</small></div>`;}).join('')}</div><h3>Jak podobný je jejich vývoj</h3><div class="quality-grid"><div><strong>${percent(q.agreement)}</strong><span>Průměrná shoda směru změn</span></div><div><strong>${format(q.min_pearson,3)}</strong><span>Nejslabší Pearsonova korelace</span></div><div><strong>${format(q.min_spearman,3)}</strong><span>Nejslabší Spearmanova korelace</span></div></div><h3>Jak často se zachová celá skupina</h3><div class="quality-grid"><div><strong>${percent(q.block_group_stability)}</strong><span>Bloková opakování</span></div><div><strong>${percent(q.poisson_group_stability)}</strong><span>Poissonova opakování</span></div><div><strong>${format(p.stability_repetitions,0)}</strong><span>Opakování každého typu</span></div></div><p class="detail-description">Jde o podíl opakování, v nichž všichni členové zůstali spolu, případně ve větší skupině. Není to pravděpodobnost správnosti nálezu.${q.block_group_stability===0&&q.poisson_group_stability===0?' <strong>Celá tato skupina se nezachovala ani v jednom opakování obou kontrol.</strong>':''}</p><h3>Každá dvojice obcí</h3><div class="table-wrap"><table><thead><tr><th>Dvojice</th><th>Společná hranice</th><th>Shoda směru</th><th>Pearson r</th><th>Spearman ρ</th><th>Změn</th></tr></thead><tbody>${g.pairs.map(pair=>`<tr><td>${esc(pair.name_a)} – ${esc(pair.name_b)}</td><td>${pair.adjacent?'Ano':'Přes další členy'}</td><td>${percent(pair.agreement)}</td><td>${format(pair.pearson,3)}</td><td>${format(pair.spearman,3)}</td><td>${format(pair.informative_years,0)}</td></tr>`).join('')}</tbody></table></div><p class="detail-description">Každá dvojice splňuje shodu směrů alespoň ${percent(p.min_agreement)}, Pearsonovu korelaci alespoň ${format(p.min_pearson,2)} a Spearmanovu alespoň ${format(p.min_spearman,2)}. Korelace používají robustně upravené změny modelové řady; nemusí se rovnat korelaci původních podílů z grafu.</p><button id="export-group" class="download">↓ Stáhnout členy a roční hodnoty (CSV)</button>`;
}
function exportGroup(){
 const g=selectedGroup();if(!g)return;
 const rows=[['skupina','profil','smer','kod_obce','nazev_obce','rok','populace_1_7','pocet','podil_procent','modelovana_zmena_procentni_body']];
 for(const id of g.member_ids){const t=townIndex.get(id);seriesData.years.forEach((year,i)=>rows.push([g.id,state.profile,state.mode,id,t.name,year,t.population[i],t[state.mode].raw[i],t[state.mode].rate[i]===null?null:t[state.mode].rate[i]/10,t[state.mode].delta[i]===null?null:t[state.mode].delta[i]/10]));}
 const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 const url=URL.createObjectURL(new Blob(['\ufeff'+rows.map(row=>row.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=`${g.id}-${state.mode}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function toggleExpanded(id){
 const same=expanded===id;
 if(expanded){$(expanded).classList.remove('expanded');inertNodes.forEach(n=>n.inert=false);inertNodes=[];document.body.classList.remove('has-expanded');const b=document.querySelector(`[data-expand="${expanded}"]`);b.setAttribute('aria-label',b.dataset.originalLabel);b.setAttribute('aria-pressed','false');expanded=null;lastExpandButton?.focus();}
 if(!same){expanded=id;lastExpandButton=document.querySelector(`[data-expand="${id}"]`);$(id).classList.add('expanded');document.body.classList.add('has-expanded');lastExpandButton.setAttribute('aria-label','Vrátit do základního rozložení');lastExpandButton.setAttribute('aria-pressed','true');for(let child=$(id);child.parentElement&&child!==document.querySelector('main');child=child.parentElement){for(const sibling of child.parentElement.children)if(sibling!==child&&!sibling.inert){sibling.inert=true;inertNodes.push(sibling);}}lastExpandButton.focus();}
 drawChart();
}
function bind(){
 document.querySelectorAll('[data-expand]').forEach(b=>{b.innerHTML=expandIcon;b.dataset.originalLabel=b.getAttribute('aria-label');b.setAttribute('aria-pressed','false');b.onclick=()=>toggleExpanded(b.dataset.expand);});
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
 $('back-region').onclick=resetSelection;$('zoom-in').onclick=()=>map.zoomBy(1.35);$('zoom-out').onclick=()=>map.zoomBy(1/1.35);
 $('previous').onclick=()=>stepYear(-1);$('next').onclick=()=>stepYear(1);$('play').onclick=()=>timer?pause():play();$('speed').onchange=()=>{if(timer)play();};$('year').oninput=e=>setYear(e.target.value);
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{if(state.mode!==b.dataset.mode){state.mode=b.dataset.mode;changeAnalysis();}});
 $('settings-open').onclick=()=>openDialog('settings-dialog');$('method-open').onclick=()=>openDialog('method-dialog');
 $('groups-open').onclick=()=>{$('group-search').value='';renderGroupList();openDialog('groups-dialog');};$('group-search').oninput=renderGroupList;
 $('detail-open').onclick=()=>{renderDetail();openDialog('detail-dialog');};
 $('profile-options').onchange=e=>{if(e.target.name==='profile'){state.profile=e.target.value;changeAnalysis();}};$('min-size').onchange=e=>{state.minSize=Number(e.target.value);changeAnalysis();};$('stable-only').onchange=e=>{state.stableOnly=e.target.checked;changeAnalysis();};
 $('chart-metric').onchange=e=>{state.metric=e.target.value;render();};$('settings-reset').onclick=()=>{Object.assign(state,{profile:DEFAULT_PROFILE,minSize:2,stableOnly:false,metric:'rate'});changeAnalysis();};
 $('clear-filters').onclick=()=>{state.minSize=2;state.stableOnly=false;changeAnalysis();};
 $('town-search').oninput=showSearch;$('town-search').onfocus=()=>{if($('town-search').value)showSearch();};
 $('town-search').onkeydown=e=>{if(e.key==='Enter'){const results=searchTowns(towns,e.target.value),exact=results.find(t=>normalize(t.name)===normalize(e.target.value));const t=exact||results[0];if(t){e.preventDefault();pickTown(t.id);e.target.value=t.name;closeSearch();}}else if(e.key==='ArrowDown'){e.preventDefault();$('search-results').querySelector('button')?.focus();}else if(e.key==='Escape')closeSearch();};
 $('search-results').onkeydown=e=>{const buttons=[...$('search-results').querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}else if(e.key==='Escape'){closeSearch();$('town-search').focus();}};
 document.addEventListener('click',e=>{
  const town=e.target.closest('[data-town]');if(town){pickTown(town.dataset.town);$('town-search').value=townIndex.get(town.dataset.town).name;closeSearch();}
  if(!e.target.closest('.search'))closeSearch();
  const group=e.target.closest('[data-group]');if(group){pickGroup(group.dataset.group);$('groups-dialog').close();}
  const member=e.target.closest('[data-member]');if(member)pickMember(member.dataset.member);
  if(e.target.closest('#export-group'))exportGroup();
 });
 document.addEventListener('keydown',e=>{if(e.defaultPrevented)return;if(e.key==='Escape'&&expanded&&!document.querySelector('dialog[open]')){e.preventDefault();toggleExpanded(expanded);return;}if(document.querySelector('dialog[open]')||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName))return;if(e.key===' '){e.preventDefault();timer?pause():play();}else if(e.key==='ArrowLeft'){e.preventDefault();stepYear(-1);}else if(e.key==='ArrowRight'){e.preventDefault();stepYear(1);}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
 new ResizeObserver(drawChart).observe($('chart-wrap'));
}
async function init(){try{
 const fetchJSON=async name=>{const response=await fetch(`data/${name}.json`);if(!response.ok)throw Error(`${name}: HTTP ${response.status}`);return response.json();};
 const [clusterData,annual,geo,source]=await Promise.all(['clusters','series','geography','provenance'].map(fetchJSON));
 profiles=clusterData.profiles;seriesData=annual;provenance=source;towns=annual.municipalities;townIndex=new Map(towns.map(t=>[t.id,t]));
 if(Object.values(profiles).some(p=>p.meta.base_analysis_id!==annual.meta.analysis_id))throw Error('Neshodná verze ročních dat a skupin.');
 const query=new URLSearchParams(location.search);if(PROFILE_LABELS[query.get('profile')])state.profile=query.get('profile');if(MODES[query.get('mode')])state.mode=query.get('mode');if([2,3,4,5].includes(Number(query.get('min_size'))))state.minSize=Number(query.get('min_size'));
 state.year=annual.years.includes(Number(query.get('year')))?Number(query.get('year')):annual.years.at(-1);
 $('year').min=annual.years[0];$('year').max=annual.years.at(-1);$('year-ticks').innerHTML=annual.years.filter((_,i)=>i%5===0||i===annual.years.length-1).map(y=>`<span>${y}</span>`).join('');
 $('provenance-note').textContent=`Podkladem je dodaný balíček z 24. 10. 2026: ${towns.length} obcí, ${annual.years.length} let. Populace je stav k 1. červenci. Výsledky modelů zůstaly beze změny.`;
 $('workspace').hidden=false;$('loading').hidden=true;
 map=createClusterMap($('map'),geo,{onSelect:pickTown});initProfileOptions();syncSettings();bind();render();
 const target=query.get('group');if(target&&groups().some(g=>g.id===target))pickGroup(target);
 }catch(error){$('loading').hidden=false;$('loading').textContent='Mapu se nepodařilo načíst. Obnovte stránku nebo spusťte místní server. '+error.message;$('workspace').hidden=true;console.error(error);}}
init();
