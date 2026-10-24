import test from 'node:test';
import assert from 'node:assert/strict';
import {createDataset,baseValue,derivedValue,scatterPoint,colorDomain} from '../radar-engine.mjs';
const rows=[['A',2020,100,10,4],['B',2020,900,18,27],['A',2021,200,20,12],['B',2021,800,24,16],['A',2022,100,30,10],['B',2022,900,18,27]].map(([code,year,population,incoming,outgoing])=>({code,year,population,incoming,outgoing}));
const d=createDataset(rows,['A','B']);
const s={metric:'incoming',unit:'rate',shrinkage:500};
const value=(code,year,extra={},data=d)=>derivedValue(data,code,year,{...s,...extra}).value;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
test('K=500 hand calculation, K=0 exact original, and large K approaches region',()=>{
 close(value('A',2020),4);close(value('A',2020,{shrinkage:0}),10);close(value(null,2020),2.8);
 close(value('A',2020,{unit:'deviation'}),1.2);close(value('A',2020,{unit:'contribution'}),.4);
 assert.ok(Math.abs(value('A',2020,{shrinkage:1e9})-2.8)<.000001);
 close(baseValue(d,'A',2020,s).detail.shrinkage.annual[0].weight,1/6);
});
test('shrinkage preserves I minus E and scatter identity, including negative balance',()=>{
 for(const code of ['A','B'])for(const unit of ['rate','deviation','contribution']){
  close(value(code,2020,{unit,metric:'balance'}),value(code,2020,{unit})-value(code,2020,{unit,metric:'outgoing'}));
 }
 const p=scatterPoint(d,'A',2020,{...s,metric:'balance'});close(p.x,4);close(p.y,3.25);close(p.x-p.y,.75);close(p.colorValue,.75);
 assert.ok(value('B',2020,{metric:'balance'})<0);
});
test('multi-year shrinkage is annual then population weighted; comparisons subtract final values',()=>{
 const expected=(4*100+6*200+9*100)/400;
 close(value('A',2022,{window:3}),expected);
 close(value('A',2021,{mode:'yoy'}),2);
 close(value('A',2022,{mode:'difference',baseYear:2020}),5);
 close(value('A',2020,{mode:'difference',baseYear:2022}),-5);
 close(value('A',2022,{mode:'difference',baseYear:2022}),0);
 close(value('A',2021,{unit:'deviation',mode:'yoy'}),.4);
 assert.equal(value('A',2021,{window:3}),null);
});
test('missing data is never replaced by shrinkage prior and independent channels remain usable',()=>{
 for(const change of [{population:0},{population:null},{incoming:null}]){
  const data=createDataset(rows.map(r=>r.code==='B'&&r.year===2020?{...r,...change}:r),['A','B']);
  assert.equal(value('A',2020,{},data),null);close(value('A',2020,{shrinkage:0},data),10);
 }
 const data=createDataset(rows.map(r=>r.code==='B'&&r.year===2020?{...r,outgoing:null}:r),['A','B']);
 close(value('A',2020,{},data),4);assert.equal(value('A',2020,{metric:'balance'},data),null);
});
test('raw counts and shares remain observed; domain cache distinguishes constants',()=>{
 close(value('A',2020,{unit:'absolute'}),10);close(value('A',2020,{unit:'share'}),100*10/28);
 assert.notDeepEqual(colorDomain(d,s),colorDomain(d,{...s,shrinkage:0}));
 for(const shrinkage of [-1,NaN,Infinity])assert.equal(value('A',2020,{shrinkage}),null);
});
