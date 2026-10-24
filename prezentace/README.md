# Prezentace – Stěhování obcí Ústeckého kraje

[Otevřít veřejnou prezentaci](https://hphugosm.github.io/TT-Decin/prezentace/) · [Přehled celého projektu](../README.md) · [Vizuální styl](../BRAND_BIBLE.md)

Prezentace má rozcestník a jedenáct snímků. Propojuje přehled dat, vysvětlení migrace, živé mapy, hypotézu firemních investic a její porovnání s pozorovaným vývojem. Druhá volba rozcestníku „Prohlídka dat“ nabízí funkční odkazy na GitHub, migrační mapu, atlas klastrů a živou prezentaci.

## Spuštění a ovládání

Z kořene repozitáře spusťte:

```sh
python3 -m http.server 8778 --bind 127.0.0.1
```

Otevřete http://127.0.0.1:8778/prezentace/. Instalace balíčků ani sestavení nejsou potřeba.

- **← / →** nebo tlačítka dole: předchozí a další snímek.
- **Esc:** návrat do rozcestníku.
- **F:** celá obrazovka.
- Časovač se spouští kliknutím a lze jej pozastavit. Navigace a časovač zůstávají viditelné i u map.
- Ve vložených mapách funguje vlastní výběr obcí, roků i nastavení. Formuláře, posuvníky a otevřené dialogy si zachovávají své klávesové ovládání.

## Pořadí snímků

| Snímek | Obsah |
| --- | --- |
| 1 | 354 obcí: jeden ukazatel, jedna hodnota, jedna obec, jeden rok |
| 2 | Společný průnik dostupných dat 2018–2024 |
| 3 | Krize na Ukrajině a časové vymezení |
| 4 | Jak číst migraci: přistěhovalí, vystěhovalí a saldo |
| 5 | Živá mapa: absolutní počty lidí |
| 6 | Živá mapa: migrace v poměru k obyvatelům obce |
| 7 | Živý atlas migračních klastrů |
| 8 | Hypotéza: pracovní příležitosti, stěhování a bydlení |
| 9 | Realita: šest firemních záměrů a migrace v okolí |
| 10 | Návrat k relativní migrační mapě |
| 11 | Závěr našeho výzkumu |

## Výklad a omezení

Čtvrtý snímek „Jak číst migraci“ vysvětluje přistěhovalé, vystěhovalé a migrační saldo. Ilustrační příklad 10 příchodů − 7 odchodů = +3 není skutečným měřením žádné obce. Narození a úmrtí nejsou součástí migračního salda. Animace respektuje systémové nastavení omezeného pohybu.

Osmý snímek „Hypotéza“ představuje šest poptávek firem po zaměstnancích. Tři animované kroky vysvětlují předpoklad: firma hledá zaměstnance → lidé se stěhují do obce → roste poptávka po bytech. Červený bod značí vznik poptávky po zaměstnancích a animovaná křivka očekávaný růst migračního salda. Jde o ilustrační schéma bez naměřených hodnot, nikoli o výsledek analýzy. Animace se při návratu opakuje a respektuje omezený pohyb.

Devátý snímek „Realita“ zobrazuje šest samostatných bodových grafů v okně nejvýše tří let před záměrem a pěti let po něm. Nemak má jen dva dostupné předchozí roky (data od 2000); prázdný rok 1999 nedoplňujeme. Červené body jsou bez textových popisků a mají shodnou vodorovnou pozici v každém grafu. Červený bod označuje rok investičního záměru, nikoli doložený začátek náboru. Přechod 8 → 9 nechá obsah hypotézy rozpadnout dolů a odhalí realitu; zpětná navigace, opakované přepínání i omezený pohyb jsou ošetřeny. Společný přepínač mění odchylku od krajské míry v procentních bodech / osobách; všech šest grafů má stejné měřítko a detail každého roku. Vstupní součty jsou v `prezentace/data/company-migration.json`, výpočty v `prezentace/reality-engine.mjs`. Okruhy do 50 km se překrývají a nesčítají se mezi firmami. Závěr je vizuální, ne statistický test nulové korelace. Kontrola výpočtů: `node --test prezentace/reality-engine.test.mjs`.

Jedenáctý, závěrečný snímek „Závěr našeho výzkumu“ staví na sdělení „Budoucnost nelze předvídat dokonale. Její odchylky ale můžeme měřit.“ Tři bloky s animovanými ikonami rozlišují kraj (stabilnější trend), obec (větší vliv náhody) a krizi (zlom historického trendu).

## Vložené mapy a přechody

Cesty v následujícím technickém popisu jsou uvedené od kořene repozitáře.

Pátý snímek obsahuje živou mapu z `mapa/?unit=absolute` s absolutními počty lidí, šestý její samostatnou kopii z `mapa/?unit=rate` s migrací v poměru k obyvatelům obce. Jde o výchozí jednotky; každá mapa zachovává vlastní další nastavení, výběr i rok. Parametr `unit` se použije jen při prvním načtení dat. Samostatná mapa bez parametru nadále začíná v populačním podílu. Sedmý snímek obsahuje web `klastry/`, osmý hypotézu, devátý realitu a desátý znovu mapu bez klastrů ve stejném zachovaném iframe jako šestý snímek. Jedenáctý snímek je závěr. Šipky ← → přepínají snímky i po kliknutí do vložených map; formuláře, posuvníky a dialogy si zachovávají vlastní ovládání. Přehrávání se při odchodu pozastaví. Časovač i navigace zůstávají viditelné. Vložené weby se přednačítají vždy o snímek dopředu a iframe se nepřesouvají ani znovu nenačítají. Přechody kolem map, rychlá navigace i omezený pohyb jsou ošetřeny.

Přechody 5 ↔ 6 mezi mapovými jednotkami a 6 ↔ 7 mezi relativní mapou a klastry používají jednu dočasnou SVG vrstvu s obrysy 354 obcí. Barvy obcí přecházejí do barev skupin a zobrazení se plynule dorovná podle kamery cílové mapy; panely se prolnou bez vodorovného odsunutí. Iframe se nekopírují ani znovu nenačítají. Při rychlé navigaci, změně velikosti nebo zapnutí omezeného pohybu se vrstva odstraní a původní mapy znovu odkryjí.

## Podklady a ověření

Hlavní soubory jsou [index.html](index.html), [app.js](app.js) a [styles.css](styles.css). Podklady firemních grafů jsou v [data/company-migration.json](data/company-migration.json); jejich výpočty v [reality-engine.mjs](reality-engine.mjs). Širší průzkum firem, zdroje a citlivost na velikost okolí popisuje [dokumentace hypotézy](../hypoteza/README.md).

Z kořene repozitáře lze ověřit výpočty grafů:

```sh
node --test prezentace/reality-engine.test.mjs
```
