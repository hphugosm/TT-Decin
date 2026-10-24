import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {eventsForYear,eventHighlights,migrationEvents,eventsForTerritory} from '../radar-events.mjs';
import {regionBoundarySegments} from '../radar-map.mjs';

test('four annotations activate only in their specified calendar years',()=>{
  assert.equal(migrationEvents.length,4);
  for(const year of [2000,2002,2008,2012,2014,2021,2025])assert.deepEqual(eventsForYear(year),[]);
  for(const year of [2022,2023,2024])assert.deepEqual(eventHighlights(year),{region:true,codes:[]});
  assert.deepEqual(eventHighlights(2013),{region:false,codes:['567451']});
});

test('Litoměřice is one 2005–2006 event; the description retains the earlier garrison departure',()=>{
  for(const year of [2003,2004])assert.deepEqual(eventsForYear(year),[]);
  for(const year of [2005,2006]){
    assert.deepEqual(eventHighlights(year),{region:false,codes:['564567']});
    const [event]=eventsForTerritory(year,'564567');
    assert.equal(event.id,'litomerice-garrison');
    assert.equal(event.startYear,2005);assert.equal(event.endYear,2006);
    assert.match(event.description,/v letech 2003–2004 definitivně zrušena/);
    assert.match(event.description,/Důsledek pro vystěhovalectví:/);
  }
  assert.equal(migrationEvents.filter(event=>event.id==='litomerice-garrison').length,1);
  assert.deepEqual(eventHighlights(2007),{region:true,codes:[]});
  assert.deepEqual(eventsForYear(2007).map(event=>event.id),['schengen-2007']);
});

test('region outline excludes the shared border between neighbouring municipalities',()=>{
  const geometry={features:[
    {geometry:{type:'Polygon',coordinates:[[[0,0],[1,0],[1,1],[0,1],[0,0]]]}},
    {geometry:{type:'MultiPolygon',coordinates:[[[[1,0],[2,0],[2,1],[1,1],[1,0]]]]}}
  ]};
  const boundary=regionBoundarySegments(geometry);
  assert.equal(boundary.length,6);
  assert.equal(boundary.some(edge=>edge.every(point=>point[0]===1)),false);
});

test('actual regional outline is closed and all local annotations resolve to real polygons',()=>{
  const geometry=JSON.parse(readFileSync(new URL('../data/radar-geography.json',import.meta.url)));
  const names=new Map(geometry.features.map(f=>[f.properties.code,f.properties.name]));
  for(const event of migrationEvents.filter(e=>e.scope==='municipality'))assert.equal(names.get(event.code),event.place);
  const boundary=regionBoundarySegments(geometry),degree=new Map();
  assert.ok(boundary.length>0);
  for(const edge of boundary)for(const point of edge){const key=point.join(',');degree.set(key,(degree.get(key)||0)+1);}
  assert.ok([...degree.values()].every(count=>count===2),'Each outer boundary vertex must have two neighbouring segments.');
});

test('chart annotations respect the displayed territory and retain global events',()=>{
  assert.deepEqual(eventsForTerritory(2007).map(event=>event.id),['schengen-2007']);
  for(const year of [2003,2004,2005,2006,2013])assert.deepEqual(eventsForTerritory(year),[]);
  assert.deepEqual(eventsForTerritory(2007,'564567').map(event=>event.id),['schengen-2007']);
  assert.deepEqual(eventsForTerritory(2007,'567451').map(event=>event.id),['schengen-2007']);
  assert.equal(eventsForTerritory(2013,'567451').length,1);
  assert.deepEqual(eventsForTerritory(2013,'564567'),[]);
  assert.deepEqual(eventsForTerritory(2005,'567451'),[]);
  for(const year of [2022,2023,2024]){
    assert.deepEqual(eventsForTerritory(year).map(event=>event.id),['ukraine-2022']);
    assert.equal(eventsForTerritory(year,'564567').length,1);
  }
  assert.deepEqual(eventsForTerritory(2025),[]);
});
