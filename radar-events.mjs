// Presentation annotations supplied by the project owner. They do not alter migration data.
export const eventStyles = {
  region: {color:'#8f1838', ink:'#8f1838', label:'Globální událost', shortLabel:'Globální', hatchAngle:135},
  municipality: {color:'#e2666b', ink:'#bd3c43', label:'Lokální událost', shortLabel:'Lokální', hatchAngle:45}
};

export const migrationEvents = [
  {
    id: 'schengen-2007', scope: 'region', place: 'Ústecký kraj',
    startYear: 2007, endYear: 2007, date: '2007',
    title: 'Vstup ČR do Schengenského prostoru',
    description: [
      'Otevření hranic v tomto roce zásadně proměnilo celostátní migrační statistiky ve dvou hlavních směrech:',
      'Legalizace dosavadních pobytů: Zrušení hraničních kontrol motivovalo mnoho cizinců k narovnání jejich statusu. Zcela nestandardních 27 % všech migrantů za rok 2007 bylo úředně zaregistrováno až během prosince, což představovalo hromadné zapsání osob, které se do té doby na území zdržovaly nelegálně.',
      'Pracovní migrace: Otevřený evropský prostor odstartoval prudký a dlouhodobý nárůst přílivu nových cizinců migrujících za prací.',
      'Neověřeno: Došlo k systémové změně při započítávání migrantů z cizích zemí.'
    ].join('\n\n')
  },
  {
    id: 'ukraine-2022', scope: 'region', place: 'Ústecký kraj',
    startYear: 2022, endYear: 2024, date: '2022–2024',
    title: 'Krize na Ukrajině',
    description: 'Migrace obyvatel Ukrajiny v souvislosti s tamní válečnou krizí.'
  },
  {
    id: 'litomerice-garrison', scope: 'municipality', code: '564567', place: 'Litoměřice',
    startYear: 2005, endYear: 2006, date: '2003/2004',
    title: 'Zrušení vojenské posádky',
    description: [
      'V rámci plné profesionalizace a restrukturalizace Armády ČR byla litoměřická vojenská posádka v letech 2003–2004 definitivně zrušena.',
      'Důsledek pro vystěhovalectví: Uzavření posádky vyvolalo jednorázový masivní odchod vojáků z povolání, občanských zaměstnanců armády a jejich rodin, kteří byli převeleni do jiných měst.'
    ].join('\n\n')
  },
  {
    id: 'bilina-2013', scope: 'municipality', code: '567451', place: 'Bílina',
    startYear: 2013, endYear: 2013, date: '2013',
    title: 'Rozmach „obchodu s chudobou“',
    description: [
      'V tomto období začali realitní spekulanti masivně skupovat extrémně levné byty v severočeských lokalitách. V Bílině se to týkalo především sídlišť jako Teplické Předměstí nebo Za Chlumem.',
      'Cílené sestěhovávání: Do těchto bytů spekulanti v letech 2012 a 2013 cíleně přistěhovávali sociálně slabé občany z jiných krajů ČR, aby na ně mohli čerpat od státu neúměrně vysoké doplatky na bydlení.',
      'Důsledek: Rok 2013 představoval v Bílině absolutní vrchol této řízené migrace. Městské statistiky a kroniky z tohoto roku zaznamenaly obrovský a nepřirozený přírůstek obyvatel stěhováním, který vedl k prudkému zhoršení bezpečnostní a sociální situace ve městě.'
    ].join('\n\n')
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
