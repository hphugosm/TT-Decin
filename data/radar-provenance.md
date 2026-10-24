# Původ dat Migračního radaru

Export obsahuje skutečná data ČSÚ: **9 204 řádků, 354 obcí, 2000–2025**. V každém roce jsou dostupné oba migrační toky i kladná populace pro všechny obce současného územního výběru. Nejnovější úplný rok je 2025. Úplnost se vztahuje na tuto definici výběru, nikoli na historicky neměnné hranice.

## Reprodukce a kontrakt

Z kořene projektu spusťte `python3 ustek_analytics/prepare_radar.py`. Příprava geometrie vyžaduje Shapely 2.2+ (`python3 -m pip install "shapely>=2.2"`). Běžné spuštění aplikace Shapely nepotřebuje. Skript vytvoří pouze `radar-data.json` a `radar-geography.json`, originály zachová. Vstupy a jejich SHA-256 jsou součástí `meta.inputs`. Export je deterministický, bez imputace, modelování a syntetických měření.

- `outputs/ustecky_kraj_ml_data/municipality_year_panel.csv` → `records`: `code`, `name`, `year`, `incoming`, `outgoing`, `population`. Populace pochází výhradně ze sloupce `populace_1_1`, nikoli ze stavů jiného roku. Kategorie celkem; věkové podskupiny se nepřičítají.
- `outputs/ustecky_kraj_ml_data/municipality_boundaries_current.geojson` → standardní GeoJSON FeatureCollection. `feature.id` je textový kód obce, vlastnosti `code`, `name`; souřadnice EPSG:4326 (délka, šířka). Kódy výběru pocházejí z tohoto podkladu, ne z čísla pevně zadaného v aplikaci.
- Původní jednotlivé sešity a přímé URL jsou v `outputs/ustecky_kraj_ml_data/sources/demography/sources.csv`; původní GML dotazy a podklady v `sources/geography/` téhož balíčku.

Skript kontroluje jedinečnost obec × rok, přesnou shodu kódů s geometrií, konečné nezáporné celočíselné počty a shodu dodaného salda s I − E. Prázdná měření převádí na `null`. `meta.coverage` uvádí kontrolu každého roku; `meta.latestCompleteYear` nejnovější úplný rok.

## ČSÚ: populace, migrace, území a licence

[Databáze demografických údajů za obce ČR](https://csu.gov.cz/databaze-demografickych-udaju-za-obce-cr) poskytuje ověřený původní zdroj obecních počtů, včetně roku 2025. [Oficiální vysvětlivky](https://csu.gov.cz/vysvetlivky-k-databazi) potvrzují stav populace k 1. lednu, zahraniční migraci v přistěhovalých/vystěhovalých, používání posledního platného kódu obce v celé historii a aktuálního okresního zařazení. Tyto stránky byly ověřeny 24. 10. 2026.

Procentní míra v radaru je vlastní výpočet `100 × události / populace k 1. 1.`; nejde o oficiální hrubou demografickou míru na střední stav. Střední stav v použitém panelu není dostupný; nebyl dopočten z koncových stavů. Přistěhování/vystěhování jsou roční obecní toky, jejich krajské součty zahrnují i přesuny mezi obcemi kraje. Nelze je zaměňovat za toky přes hranici kraje.

[Podmínky ČSÚ](https://csu.gov.cz/podminky_pro_vyuzivani_a_dalsi_zverejnovani_statistickych_udaju_csu) určují CC BY 4.0 a požadují označit upravená a odvozená data. Tento normalizovaný export a analytické přepočty jsou upravenými/odvozenými daty; nejde o nezměněnou publikaci ČSÚ.

Časová omezení převzatá z doloženého auditu datového balíčku: sčítání 2001, 2011, 2021 přerušují návaznost stavů; od 2022 mění definici populace zahrnutí držitelů dočasné ochrany. Územní změny nejsou migrací. Historické počty nejsou přepočteny na konstantní hranice. Převod části Hradiště účinný 1. 1. 2016 je v demografickém zdroji zachycen jako územní změna v řádku 2015. Originální balíček obsahuje příslušné příznaky; radar je neskrývá v tvrzení o historické srovnatelnosti.

## ČÚZK/RÚIAN: hranice

Oficiální [INSPIRE AU WFS ČÚZK](https://services.cuzk.gov.cz/wfs/inspire-au-wfs.asp) byl v původním datovém balíčku stažen 2026-10-23T23:14:00Z, tj. **24. 10. 2026 místního času**. Jde o aktuální stav služby v okamžiku stažení. Datum číselníku 1. 1. 2026 se nesmí vydávat za referenční datum všech hranic. Verze jednotlivých objektů `begin_lifespan_version` jsou v původním GeoJSON v rozsahu 2021-09-02 až 2026-10-20; jde o časy verzí objektů, nikoli důkaz historických hranic v každém roce analýzy.

Použitý podklad má 354 skutečných polygonů/multipolygonů. Originální audit `sources/geography/verification.json` ověřil platnost, uzavřené prstence a absenci překryvů (Shapely 2.2.0). Export používá topologické zjednodušení společných hranic `shapely.coverage_simplify` s tolerancí 0,0015 stupně (v souřadnicích EPSG:4326). Všechny obce zůstávají zachovány. Shapely 2.2.0 při nové přípravě ověřilo platnou coverage před i po zjednodušení a platnost, nenulovou plochu a neprázdnost všech 354 výsledných geometrií. Katastrální přesnost není cílem tohoto mapového podkladu. Geometrie je připravena z doloženého aktuálního oficiálního podkladu, ne ze staršího zjednodušeného souboru. Originální podklad o velikosti 7 MB zůstává zachován.

Licence hranic: původní katalog uvádí veřejnou bezúplatnou službu a [podmínky ČÚZK](https://www.cuzk.cz/Predpisy/Podminky-poskytovani-prostor-dat-a-sitovych-sluzeb.aspx), standardní CC licenci neověřuje. Proto zde hranicím nepřisuzujeme licenci ČSÚ. Automatické online otevření metadat geoportálu při tomto kroku selhalo; původ, čas a provedené kontroly jsou doloženy místními manifesty, nikoli novým stažením nebo nově ověřenou licencí.

Detail obyvatel doplněn z téhož nezměněného zdrojového CSV: `populationStart = populace_1_1`, `populationEnd = populace_31_12`. Rozdíl obou stavů zahrnuje všechny vlivy, nejen migraci.
