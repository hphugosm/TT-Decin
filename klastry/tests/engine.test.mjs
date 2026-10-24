import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {valuesFor,completeSum,aggregate,visibleGroups,searchTowns,chartSeries} from '../engine.mjs';

const readData=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const {profiles}=await readData('clusters');
const {municipalities:towns,years}=await readData('series');
const town=(id,population,raw,rate,delta)=>({id,name:id,population,immigration:{raw,rate,delta}});

test('per-1000 rates become percentages and model differences become percentage points, preserving missing values',()=>{
 const t=town('x',[],[12,0,null],[120,0,null],[-10,null,25]);
 assert.deepEqual(valuesFor(t,'immigration','rate'),[12,0,null]);
 assert.deepEqual(valuesFor(t,'immigration','delta'),[-1,null,2.5]);
 assert.deepEqual(valuesFor(t,'immigration','raw'),[12,0,null]);
});

test('complete totals distinguish missing inputs from observed zero',()=>{
 assert.equal(completeSum([0,0]),0);
 assert.equal(completeSum([3,0,2]),5);
 for(const values of [[],[3,null],[undefined,2],[Infinity,1],[NaN]])assert.equal(completeSum(values),null);
 const partial=[town('a',[100],[10]),town('b',[null],[2])];
 assert.deepEqual(aggregate(partial,'immigration',0),{population:null,raw:12,rate:null});
});

test('group percentage uses combined population rather than an average of municipality percentages',()=>{
 const group=[town('a',[100],[10],[100]),town('b',[900],[0],[0])];
 assert.deepEqual(aggregate(group,'immigration',0),{population:1000,raw:10,rate:1});
 assert.notEqual(aggregate(group,'immigration',0).rate,5);
 assert.equal(aggregate([town('zero',[0],[0])],'immigration',0).rate,null);
});

test('archive profiles and display filters retain their independently computed membership',()=>{
 const expected={balanced:[[21,0,1],[11,0,0]],relaxed:[[38,3,2],[35,3,0]],loose:[[83,14,4],[63,11,1]],extended:[[86,17,2],[71,12,1]]};
 for(const [profile,counts] of Object.entries(expected)){
  for(const [index,mode] of ['immigration','emigration'].entries()){
   const source=profiles[profile].modes[mode];
   const before=JSON.stringify(source.memberships);
   assert.equal(visibleGroups(source).length,counts[index][0],`${profile}/${mode} all`);
   assert.equal(visibleGroups(source,{minSize:3}).length,counts[index][1],`${profile}/${mode} 3+`);
   assert.equal(visibleGroups(source,{stableOnly:true}).length,counts[index][2],`${profile}/${mode} stable`);
   // Years affect charts only: filtering exposes the same stored group objects.
   for(const year of [years[0],years.at(-1)]){
    assert.deepEqual(visibleGroups(source,{minSize:2,year}).map(g=>g.id),visibleGroups(source).map(g=>g.id));
   }
   assert.equal(JSON.stringify(source.memberships),before);
  }
 }
 assert.equal(visibleGroups(profiles.extended.modes.immigration,{minSize:5}).length,1);
 assert.equal(visibleGroups(profiles.extended.modes.emigration,{minSize:5}).length,0);
});

test('Czech prefix search accepts omitted accents, codes and duplicate municipality names',()=>{
 assert.ok(searchTowns(towns,'dec').some(t=>t.name==='Děčín'));
 assert.ok(searchTowns(towns,'  USTI ').some(t=>t.name==='Ústí nad Labem'));
 assert.deepEqual(searchTowns(towns,'Blatno').map(t=>t.id).sort(),['562998','566004']);
 assert.deepEqual(searchTowns(towns,'562998').map(t=>t.id),['562998']);
 assert.deepEqual(searchTowns(towns,''),[]);
 assert.deepEqual(searchTowns(towns,'nad Labem'),[]);
});

test('selected raw counts never share a chart with the much larger regional count',()=>{
 const selected=[towns.find(t=>t.id==='562998')];
 const raw=chartSeries(towns,selected,'immigration','raw',years,true);
 assert.equal(raw.length,1);
 assert.equal(raw[0].id,selected[0].id);
 assert.deepEqual(raw[0].values,selected[0].immigration.raw);
 const rate=chartSeries(towns,selected,'immigration','rate',years,true);
 assert.equal(rate.length,2);
 assert.equal(rate[1].id,'region');
 assert.equal(rate[1].values[0],100*towns.reduce((s,t)=>s+t.immigration.raw[0],0)/towns.reduce((s,t)=>s+t.population[0],0));
 const regionalRaw=chartSeries(towns,[],'immigration','raw',years,false);
 assert.equal(regionalRaw[0].values[0],towns.reduce((s,t)=>s+t.immigration.raw[0],0));
 assert.equal(chartSeries(towns,selected,'immigration','delta',years,true).length,1);
});

test('saved exemplar stability is reported faithfully for both the pair and six-municipality group',()=>{
 const pair=profiles.balanced.modes.immigration.groups.find(g=>g.member_ids.includes('563102')&&g.member_ids.includes('563129'));
 assert.ok(pair);
 assert.equal(pair.member_ids.length,2);
 assert.equal(pair.stable,true);
 assert.ok(pair.quality.block_pair_stability>.8&&pair.quality.poisson_pair_stability>.8);
 const six=profiles.extended.modes.immigration.groups.find(g=>g.id==='XIMM-077');
 assert.deepEqual([...six.member_ids].sort(),['567027','567337','567451','567558','567701','567779']);
 assert.equal(six.quality.block_group_stability,0);
 assert.equal(six.quality.poisson_group_stability,0);
 assert.equal(six.stable,false);
 assert.equal(six.status,'exploratory');
});
