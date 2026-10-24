# TT – Děčín · Migrační radar

Interaktivní mapa migrace v obcích Ústeckého kraje, bodové grafy a import CSV. Rozhraní je česky.

**Mapa:** https://hphugosm.github.io/TT-Decin/mapa/

**Samostatná mapa migračních klastrů:** https://hphugosm.github.io/TT-Decin/klastry/ — geograficky souvislé skupiny obcí s podobným vývojem, čtyři profily podobnosti a porovnání členů v čase. [Metodika, zdroje a ovládání](klastry/README.md).

**Prezentace – Stěhování obcí Ústeckého kraje:** https://hphugosm.github.io/TT-Decin/prezentace/

Původní adresa https://hphugosm.github.io/TT-Decin/ přesměruje na mapu se zachováním parametrů a fragmentu URL. Prezentace má vlastní rozcestník a jedenáct snímků. Ovládání: ← →, Esc zpět na rozcestník, F celá obrazovka. Vedená prohlídka je zatím připravený úvod.

**Vizuální styl pro prezentace:** [Brand Bible – barvy, písmo a pravidla použití](BRAND_BIBLE.md)

## Spuštění

Repozitář obsahuje samostatnou statickou aplikaci; není potřeba instalovat balíčky ani spouštět build.

```sh
python3 -m http.server 8778 --bind 127.0.0.1
```

Otevřete mapu http://127.0.0.1:8778/mapa/ nebo prezentaci http://127.0.0.1:8778/prezentace/. Mapové rozhraní je v `mapa/index.html`; jeho `<base href="../">` načítá společné soubory `radar.css`, moduly `radar*.mjs` a `data/` z kořene repozitáře. Prezentace je samostatná v `prezentace/index.html`, `prezentace/styles.css` a `prezentace/app.js`. Kořenový `index.html` zajišťuje přesměrování na mapu.

## Ovládání

Kliknutí na obec ji plynule přiblíží a zobrazí její graf a statistiku. Druhé kliknutí vrátí celý kraj. V nastavení jsou procentní podíly vůči populaci obce či kraje a odchylka od krajské míry v procentních bodech.

Shrinkage používá `w = P/(P+K)` a `r* = w*r + (1-w)*R`. Konstantu K lze měnit od 0 do 5 000; výchozí je 500, nula vrací původní míry. Původní počty v kartách jsou zachované.

## Data

Výchozí veřejný panel ČSÚ: 354 obcí, 2000–2025, 9 204 záznamů. Populace je stav k 1. lednu. Geometrie je aktuální podklad ČÚZK/RÚIAN, nikoli rekonstrukce historických hranic. Importované CSV se zpracovává místně v prohlížeči.

[Zdroje, licence a omezení dat](data/radar-provenance.md) · [Metodika a podrobný návod](RADAR_README.md) · [Rozhodnutí](docs/MIGRATION_RADAR_DECISIONS.md) · [Backlog](docs/MIGRATION_RADAR_BACKLOG.md).

`RADAR_README.md` a protokoly zachovávají také příkazy původního vývojového projektu. Pro tento samostatný repozitář platí spuštění výše. `prepare_radar.py` dokumentuje původní přípravu dat a potřebuje původní vstupy, které nejsou součástí tohoto balíčku.

## Ověření

```sh
node --test tests/radar-*.test.mjs
```

[Přehled provedených kontrol](reports/radar-verification.md). GitHub Pages publikuje větev `main` z kořene repozitáře; `.nojekyll` zachovává statické soubory bez Jekyll zpracování.

Čtvrtý snímek „Jak číst migraci“ vysvětluje přistěhovalé, vystěhovalé a migrační saldo. Ilustrační příklad 10 příchodů − 7 odchodů = +3 není skutečným měřením žádné obce. Narození a úmrtí nejsou součástí migračního salda. Animace respektuje systémové nastavení omezeného pohybu.

Pátý snímek obsahuje živou mapu z `mapa/?unit=absolute` s absolutními počty lidí, šestý její samostatnou kopii z `mapa/?unit=rate` s migrací v poměru k obyvatelům obce. Jde o výchozí jednotky; každá mapa zachovává vlastní další nastavení, výběr i rok. Parametr `unit` se použije jen při prvním načtení dat. Samostatná mapa bez parametru nadále začíná v populačním podílu. Sedmý snímek obsahuje web `klastry/`, osmý hypotézu, devátý realitu a desátý znovu mapu bez klastrů ve stejném zachovaném iframe jako šestý snímek. Jedenáctý snímek je závěr. Šipky ← → přepínají snímky i po kliknutí do vložených map; formuláře, posuvníky a dialogy si zachovávají vlastní ovládání. Přehrávání se při odchodu pozastaví. Časovač i navigace zůstávají viditelné. Vložené weby se přednačítají vždy o snímek dopředu a iframe se nepřesouvají ani znovu nenačítají. Přechody kolem map, rychlá navigace i omezený pohyb jsou ošetřeny.

Osmý snímek „Hypotéza“ představuje šest poptávek firem po zaměstnancích. Tři animované kroky vysvětlují předpoklad: firma hledá zaměstnance → lidé se stěhují do obce → roste poptávka po bytech. Červený bod značí vznik poptávky po zaměstnancích a animovaná křivka očekávaný růst migračního salda. Jde o ilustrační schéma bez naměřených hodnot, nikoli o výsledek analýzy. Animace se při návratu opakuje a respektuje omezený pohyb.

Devátý snímek „Realita“ zobrazuje šest samostatných bodových grafů v okně nejvýše tří let před záměrem a pěti let po něm. Nemak má jen dva dostupné předchozí roky (data od 2000); prázdný rok 1999 nedoplňujeme. Červené body jsou bez textových popisků a mají shodnou vodorovnou pozici v každém grafu. Červený bod označuje rok investičního záměru, nikoli doložený začátek náboru. Přechod 8 → 9 nechá obsah hypotézy rozpadnout dolů a odhalí realitu; zpětná navigace, opakované přepínání i omezený pohyb jsou ošetřeny. Společný přepínač mění odchylku od krajské míry v procentních bodech / osobách; všech šest grafů má stejné měřítko a detail každého roku. Vstupní součty jsou v `prezentace/data/company-migration.json`, výpočty v `prezentace/reality-engine.mjs`. Okruhy do 50 km se překrývají a nesčítají se mezi firmami. Závěr je vizuální, ne statistický test nulové korelace. Kontrola výpočtů: `node --test prezentace/reality-engine.test.mjs`.

Přechody 5 ↔ 6 mezi mapovými jednotkami a 6 ↔ 7 mezi relativní mapou a klastry používají jednu dočasnou SVG vrstvu s obrysy 354 obcí. Barvy obcí přecházejí do barev skupin a zobrazení se plynule dorovná podle kamery cílové mapy; panely se prolnou bez vodorovného odsunutí. Iframe se nekopírují ani znovu nenačítají. Při rychlé navigaci, změně velikosti nebo zapnutí omezeného pohybu se vrstva odstraní a původní mapy znovu odkryjí.

Jedenáctý, závěrečný snímek „Závěr našeho výzkumu“ staví na sdělení „Budoucnost nelze předvídat dokonale. Její odchylky ale můžeme měřit.“ Tři bloky s animovanými ikonami rozlišují kraj (stabilnější trend), obec (větší vliv náhody) a krizi (zlom historického trendu).
