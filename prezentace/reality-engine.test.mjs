import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { migrationSeries, sharedScale } from './reality-engine.mjs';

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
  for (const metric of ['pp', 'persons']) {
    const scale = sharedScale(series, metric);
    assert.ok(scale.min < 0 && scale.max > 0);
    assert.ok(scale.ticks.includes(0));
    for (const company of series) for (const point of company.points) {
      assert.ok(point[metric] >= scale.min && point[metric] <= scale.max);
    }
  }
});

test('an incomplete series fails explicitly instead of plotting a misleading chart', () => {
  const invalid = structuredClone(source);
  invalid.firmy[0].data.pop();
  assert.throws(() => migrationSeries(invalid), /Neúplná/);
});
