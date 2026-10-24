// Each supplied row is already a sum for a fixed 50 km area. Never sum areas.
export function migrationSeries(source) {
  if (source.kraj.length !== 26 || source.firmy.length !== 6) throw new Error('Neúplná vstupní data.');
  const valid = (population, balance) => Number.isFinite(population) && population > 0 && Number.isFinite(balance);
  return source.firmy.map(company => {
    if (company.data.length !== 26 || !Number.isInteger(company.rok_zameru) || company.rok_zameru < 2000 || company.rok_zameru > 2025) throw new Error('Neúplná řada firmy.');
    const points = company.data.map(([population, balance], index) => {
      const [year, regionPopulation, regionBalance] = source.kraj[index];
      if (year !== 2000 + index || !valid(population, balance) || !valid(regionPopulation, regionBalance)) throw new Error('Neplatná roční hodnota.');
      const rate = 100 * balance / population;
      const regionRate = 100 * regionBalance / regionPopulation;
      const expected = population * regionBalance / regionPopulation;
      return { year, population, balance, rate, regionRate, expected, pp: rate - regionRate, persons: balance - expected, event: year === company.rok_zameru };
    });
    return { ...company, points };
  });
}

export function sharedScale(series, metric) {
  if (!['pp', 'persons'].includes(metric)) throw new Error('Neznámý ukazatel.');
  const values = series.flatMap(company => company.points.map(point => point[metric]));
  const low = Math.min(0, ...values), high = Math.max(0, ...values);
  const spread = high - low || 1;
  const roughStep = spread / 5;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const step = [1, 2, 2.5, 5, 10].find(value => value * power >= roughStep) * power;
  const min = Math.floor((low - spread * .04) / step) * step;
  const max = Math.ceil((high + spread * .04) / step) * step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, i) => Number((min + i * step).toPrecision(12)));
  return { min, max, ticks };
}
