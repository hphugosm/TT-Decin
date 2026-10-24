import test from 'node:test';
import assert from 'node:assert/strict';
import {createDataset,populationSummary} from '../radar-engine.mjs';
import {parseCSV,suggestMapping,validateImport} from '../radar-import.mjs';
test('population endpoints are observed, not migration-only estimates or next-year rebases',()=>{
 const rows=[{code:'A',year:2020,population:100,populationStart:100,populationEnd:115,incoming:30,outgoing:5},{code:'A',year:2021,population:90}];
 const d=createDataset(rows,['A'],{populationBasis:'start'});
 assert.deepEqual(populationSummary(d,'A',2020),{start:100,end:115,change:15});
 assert.deepEqual(populationSummary(d,'A',2021),{start:90,end:null,change:null});
 assert.deepEqual(populationSummary(createDataset(rows,['A','B']),'A',2021),{start:null,end:null,change:null});
 assert.deepEqual(populationSummary(createDataset(rows,['A','B']),null,2020),{start:null,end:null,change:null});
});
test('CSV explicitly maps population start and end independently of rate denominator',()=>{
 const table=parseCSV('kod_obce;rok;pristehovali;populace_1_1;populace_31_12\nA;2020;30;100;115');
 const result=validateImport(table,{mapping:suggestMapping(table.headers),expectedCodes:['A']});
 assert.equal(result.ok,true);assert.equal(result.records[0].population,100);
 assert.equal(result.records[0].populationStart,100);assert.equal(result.records[0].populationEnd,115);
});
