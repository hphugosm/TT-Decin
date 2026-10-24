// Presentation annotations supplied by the project owner. They do not alter migration data.
export const migrationEvents = [
  {
    id: 'schengen-2007', scope: 'region', place: 'Ústecký kraj',
    startYear: 2007, endYear: 2007, date: '2007',
    title: 'Vstup do Schengenu',
    description: 'Migrace za prací a změna systému.'
  },
  {
    id: 'ukraine-2022', scope: 'region', place: 'Ústecký kraj',
    startYear: 2022, endYear: 2024, date: '2022–2024',
    title: 'Válka na Ukrajině',
    description: 'Migrace obyvatel Ukrajiny v souvislosti s válkou.'
  },
  {
    id: 'litomerice-garrison', scope: 'municipality', code: '564567', place: 'Litoměřice',
    startYear: 2005, endYear: 2006, date: '2003/2004',
    title: 'Zrušení vojenské posádky',
    description: 'Nárůst vystěhovalých; odchod vojenské posádky proběhl v letech 2003/2004.'
  },
  {
    id: 'bilina-2013', scope: 'municipality', code: '567451', place: 'Bílina',
    startYear: 2013, endYear: 2013, date: '2013',
    title: 'Rozmach „obchodu s chudobou“',
    description: 'Rozmach „obchodu s chudobou“ v Bílině a okolních obcích.'
  }
];

export function eventsForYear(year) {
  return migrationEvents
    .filter(event => year >= event.startYear && year <= event.endYear)
    .map(event => ({...event, year, description: event.yearNotes?.[year] ?? event.description}));
}

export function eventHighlights(year) {
  const active = eventsForYear(year);
  return {
    region: active.some(event => event.scope === 'region'),
    codes: [...new Set(active.filter(event => event.scope === 'municipality').map(event => event.code))]
  };
}

export function eventsForTerritory(year, code = null) {
  return eventsForYear(year).filter(event => event.scope === 'region' || (code != null && event.code === String(code)));
}
