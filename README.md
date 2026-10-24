# TT – Děčín · Migrační radar

Interaktivní mapa migrace v obcích Ústeckého kraje, bodové grafy a import CSV. Rozhraní je česky.

**Mapa:** https://hphugosm.github.io/TT-Decin/mapa/

**Samostatná mapa migračních klastrů:** https://hphugosm.github.io/TT-Decin/klastry/ — geograficky souvislé skupiny obcí s podobným vývojem, čtyři profily podobnosti a porovnání členů v čase. [Metodika, zdroje a ovládání](klastry/README.md).

**Prezentace – Stěhování obcí Ústeckého kraje:** https://hphugosm.github.io/TT-Decin/prezentace/

Původní adresa https://hphugosm.github.io/TT-Decin/ přesměruje na mapu se zachováním parametrů a fragmentu URL. Prezentace má vlastní rozcestník a šest snímků. Ovládání: ← →, Esc zpět na rozcestník, F celá obrazovka. Vedená prohlídka je zatím připravený úvod.

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

Pátý snímek obsahuje živou mapu z `mapa/` v jednom zachovaném iframe. Šipky ← → přepínají snímky i po kliknutí do mapy; v textových polích, posuvnících a otevřených dialozích zůstává jejich běžné ovládání. Rok lze měnit časovou osou mapy. Výběr obce, rok i nastavení se při návratu zachovají; přehrávání mapy se při odchodu pozastaví. Časovač a navigace prezentace zůstávají viditelné.

Šestý snímek „Hypotéza“ představuje šest poptávek firem po zaměstnancích. Tři animované kroky vysvětlují předpoklad: firma hledá zaměstnance → lidé se stěhují do obce → roste poptávka po bytech. Červený bod značí vznik poptávky po zaměstnancích a animovaná křivka očekávaný růst migračního salda. Jde o ilustrační schéma bez naměřených hodnot, nikoli o výsledek analýzy. Animace se při návratu opakuje a respektuje omezený pohyb.
