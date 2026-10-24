import test from 'node:test';
import assert from 'node:assert/strict';
import {createDataset,baseValue,derivedValue,scatterPoint} from '../radar-engine.mjs';
import {parseCSV,suggestMapping,inspectCategories,validateImport} from '../radar-import.mjs';
const row=(code,year,incoming,outgoing,population)=>({code,year,incoming,outgoing,population});
const value=(d,code,year,settings)=>baseValue(d,code,year,settings).value;

test('channel completeness is independent in every year of a trailing window',()=>{
  const records=[2020,2021,2022].flatMap(year=>[row('A',year,10,4,100),row('B',year,20,year===2021?null:5,200)]);
  const d=createDataset(records,['A','B']);
  assert.equal(value(d,null,2022,{metric:'incoming',unit:'rate',window:3}),10);
  assert.equal(value(d,null,2022,{metric:'outgoing',unit:'rate',window:3}),null);
  assert.equal(value(d,'A',2022,{metric:'incoming',unit:'deviation',window:3}),0);
  assert.equal(value(d,'A',2022,{metric:'balance',unit:'deviation',window:3}),null);
  assert.equal(scatterPoint(d,'B',2022,{window:3}).available,false);
});

test('changing municipality coverage cannot masquerade as a complete regional reference',()=>{
  const d=createDataset([row('A',2020,10,5,100),row('B',2021,20,10,200),row('A',2022,30,15,100)],['A','B']);
  const partial=baseValue(d,null,2022,{metric:'incoming',unit:'absolute',window:3});
  assert.equal(partial.value,20);
  assert.equal(partial.detail.partial,true);
  assert.equal(value(d,null,2022,{metric:'incoming',unit:'rate',window:3}),null);
  assert.equal(value(d,'A',2022,{metric:'incoming',unit:'share'}),null);
  assert.equal(value(d,'A',2022,{metric:'incoming',unit:'deviation'}),null);
});

test('differences with overlapping windows subtract window rates, retaining exact exposures',()=>{
  const d=createDataset([row('A',2020,10,0,100),row('A',2021,20,0,200),row('A',2022,30,0,100),row('A',2023,40,0,400)],['A']);
  const r=derivedValue(d,'A',2023,{metric:'incoming',unit:'rate',window:3,mode:'yoy'});
  assert.ok(Math.abs(r.value-(100*90/700-100*60/400))<1e-10);
  assert.deepEqual(r.detail.before.detail.years,[2020,2021,2022]);
  assert.deepEqual(r.detail.after.detail.years,[2021,2022,2023]);
});

test('multiple category dimensions select totals without repeated population',()=>{
  const t=parseCSV('kod;rok;pristehovali;vystehovali;pocet_obyvatel;pohlavi;vek\nA;2022;10;5;100;celkem;celkem\nA;2022;4;2;100;muži;celkem\nA;2022;6;3;100;ženy;celkem\nA;2022;3;1;100;celkem;0–14');
  const mapping=suggestMapping(t.headers),cats=inspectCategories(t,mapping);
  assert.equal(cats.length,2);
  const all=validateImport(t,{mapping,expectedCodes:['A']});
  assert.equal(all.ok,false);
  const filters=Object.fromEntries(cats.map(c=>[c.index,c.suggested]));
  const result=validateImport(t,{mapping,filters,expectedCodes:['A']});
  assert.equal(result.ok,true);
  assert.equal(result.records.length,1);
  assert.equal(result.records[0].population,100);
});

test('missing tokens remain null; true zero survives and malformed signed numbers reject',()=>{
  const t=parseCSV('kod;rok;pristehovali;vystehovali;pocet_obyvatel\nA;2022;0;..;1 000\nB;2022;N/A;-;200');
  const result=validateImport(t,{mapping:suggestMapping(t.headers),expectedCodes:['A','B']});
  assert.equal(result.ok,true);
  assert.deepEqual(result.records.map(r=>[r.incoming,r.outgoing,r.population]),[[0,null,1000],[null,null,200]]);
  const bad=parseCSV('kod;rok;pristehovali\nA;2022;1-2');
  assert.equal(validateImport(bad,{mapping:suggestMapping(bad.headers),expectedCodes:['A']}).ok,false);
});

test('delimiter inference ignores quoted punctuation and logical-record newlines',()=>{
  const semicolon=parseCSV('kod;rok;pristehovali;"poznámka,a,b,c,d,e"\nA;2022;1;x');
  assert.equal(semicolon.delimiter,';');
  assert.deepEqual(semicolon.rows,[['A','2022','1','x']]);
  const comma=parseCSV('kod,rok,pristehovali,"poznámka; a; b; c; d; e"\nA,2022,1,x');
  assert.equal(comma.delimiter,',');
  const multiline=parseCSV('\n"název\n; ; ; ;"|kod|rok|pristehovali\n"Obec"|A|2022|1');
  assert.equal(multiline.delimiter,'|');
  assert.equal(multiline.headers[0],'název\n; ; ; ;');
});
