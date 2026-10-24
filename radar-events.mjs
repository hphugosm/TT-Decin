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
    startYear: 2003, endYear: 2007, date: '2003/2004',
    title: 'Zrušení vojenské posádky',
    description: 'Na přelomu let 2003 a 2004 armáda opustila město.',
    yearNotes: {
      2005: 'Nárůst vystěhovalých; odchod vojenské posádky proběhl v letech 2003/2004.',
      2006: 'Nárůst vystěhovalých; odchod vojenské posádky proběhl v letech 2003/2004.',
      2007: 'Výrazný nárůst přistěhovalých oproti krajskému průměru; odchod posádky v letech 2003/2004.'
    }
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
  return eventsForYear(year).filter(event => code == null || event.scope === 'region' || event.code === String(code));
}
