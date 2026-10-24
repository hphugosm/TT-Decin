import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { migrationSeries, eventWindow, sharedScale } from './reality-engine.mjs';

const source = JSON.parse(readFileSync(new URL('./data/company-migration.json', import.meta.url), 'utf8'));
const series = migrationSeries(source);

test('all six event-year deviations match the supplied independent check values', () => {
  const expected = [-.110025483, -.082292119, .010983397, .016852826, -.012328370, -.056997343];
  series.forEach((company, index) => {
    assert.equal(company.points.length, 26);
    assert.deepEqual(company.points.map(point => point.year), Array.from({ length: 26 }, (_, i) => 2000 + i));
    const events = company.points.filter(point => point.event);
    assert.equal(events.length, 1);
    assert.ok(Math.abs(events[0].pp - expected[index]) < 1e-9);
  });
  assert.equal(series[1].plan_je_maximum, true);
});

test('regional reference is population-scaled once, not subtracted as a count', () => {
  const sameAsRegion = { kraj: source.kraj, firmy: source.firmy.map(company => ({ ...company, data: source.kraj.map(([, population, balance]) => [population, balance]) })) };
  for (const company of migrationSeries(sameAsRegion)) {
    for (const point of company.points) {
      assert.equal(point.pp, 0);
      assert.ok(Math.abs(point.persons) < 1e-9);
    }
  }
  for (const company of series) for (const point of company.points) {
    assert.ok(Math.abs(point.pp / 100 * point.population - point.persons) < 1e-8);
  }
});

test('one domain contains every observation in each display unit, including zero', () => {
  const visibleSeries = eventWindow(series);
  for (const metric of ['pp', 'persons']) {
    const scale = sharedScale(visibleSeries, metric);
    assert.ok(scale.min < 0 && scale.max > 0);
    assert.ok(scale.ticks.includes(0));
    for (const company of visibleSeries) for (const point of company.points) {
      assert.ok(point[metric] >= scale.min && point[metric] <= scale.max);
    }
  }
});

test('event windows include the intention and only the available three years before / five after', () => {
  const visible = eventWindow(series);
  assert.deepEqual(visible.map(company => company.points.length), [9, 9, 9, 8, 9, 9]);
  assert.deepEqual(visible.map(company => [company.points[0].year, company.points.at(-1).year]), [[2003, 2011], [2003, 2011], [2011, 2019], [2000, 2007], [2000, 2008], [2000, 2008]]);
  visible.forEach((company, index) => {
    assert.equal(company.windowEnd - company.windowStart, 8);
    assert.equal(company.rok_zameru - company.windowStart, 3);
    assert.equal(company.points.filter(point => point.event).length, 1);
    company.points.forEach(point => assert.strictEqual(point, series[index].points.find(original => original.year === point.year)));
    assert.equal(series[index].points.length, 26);
  });
  assert.equal(visible[3].windowStart, 1999);
  assert.equal(visible[3].points.some(point => point.year === 1999), false);
});

test('an incomplete series fails explicitly instead of plotting a misleading chart', () => {
  const invalid = structuredClone(source);
  invalid.firmy[0].data.pop();
  assert.throws(() => migrationSeries(invalid), /Neúplná/);
});
