# Migrační radar Ústeckého kraje

Lokální průzkum skutečné obecní migrace s importem CSV, mapou a dvěma bodovými grafy. Aplikace běží bez CDN, mapových dlaždic a instalace npm balíčků. Původní časový atlas zůstává na `temporal-clusters.html`.

## Spuštění a produkční sestavení

Z kořene projektu (Python 3.10+):

```sh
python3 ustek_analytics/serve.py --port 8777
```

Otevřete http://127.0.0.1:8777/ustek_analytics/temporal.html. Soubory nelze spolehlivě otevírat přes `file://`, protože aplikace načítá místní JSON a ES moduly přes HTTP.

```sh
python3 ustek_analytics/build_radar.py
python3 -m http.server 8778 --bind 127.0.0.1 --directory dist/migration-radar
```

Produkční stránka je http://127.0.0.1:8778/. Build kopíruje pouze radar, jeho moduly, styly, data a dokumentaci. Validuje klíče obec × rok, geometrii, číselné hodnoty a při dostupném Node také syntaxi modulů. `manifest.json` uvádí SHA-256 všech přibalených souborů (kromě sebe). Žádný statistický model se při buildu nespouští. `prepare_radar.py` je přiložen pro dohledání přípravy; jeho případné spuštění vyžaduje původní zdrojové soubory v repozitáři a Shapely ≥ 2.2. Provoz ani build tuto knihovnu nepotřebují.

## Ovládání a import

Klik na souhrnnou kartu volí přistěhovalé, vystěhovalé nebo saldo. Nastavení obsahuje jednotku, časové okno, režim a barvy. Výběr obce kliknutím na mapu, hledáním nebo druhým grafem zachovává rok a nastavení a pozastaví přehrávání. Kliknutí obec plynule přiblíží a současně přepne její časový graf a pravý statistický panel. Přejezd myší po mapě nezobrazuje tooltip ani nemění detail; výběr zůstává až do dalšího kliknutí nebo návratu na kraj. V Nastavení → Jednotka mapy a časového grafu jsou volby migrace / populace obce (%), migrace / populace kraje (%) a odchylky od kraje (procentní body). Druhé kliknutí na stejnou vybranou obec v mapě plynule oddálí na celý kraj a obnoví krajský graf i statistiku; rok a nastavení zůstávají zachovány. Stejně funguje tlačítko Zpět na kraj. Časová osa řídí rok B; při rozdílu zůstává A pevné. Časový graf používá samostatné body, kliknutím lze změnit rok.

Nahrajte či přetáhněte CSV, zkontrolujte náhled a potvrďte mapování. Preferovaný formát:

```csv
kod_obce;nazev_obce;rok;pristehovali;vystehovali;pocet_obyvatel
```

Kód musí odpovídat geometrii; název není náhradním identifikátorem. Jsou podporovány běžné oddělovače, UTF-8/BOM a ruční volba Windows-1250 či oddělovače pro české soubory. Česká desetinná čárka se může vyskytovat v poli odděleném středníkem. Jednoznačný klíč je obec × rok. Pokud data obsahují kategorie a „celkem“, vyberte jednu celkovou kategorii; nesčítejte celek s částmi. Prázdné pole není nula. Import kontroluje duplicity, záporné či nečíselné počty, populaci, neznámé kódy a pokrytí. Při chybě zůstávají předchozí platná data. Zpracování CSV probíhá v prohlížeči.

## Výpočty

I = přistěhovalí, E = vystěhovalí, S = I − E, P = populace. Absolutní údaj je počet. Místní míra je 100 × I/P (obdobně E/S), podíl I/E je 100 × místní počet / součet obcí kraje. Podíl na celkovém saldu není definovanou volbou. Příspěvek používá 100 × místní počet / krajskou populaci. Obě populační jednotky jsou procentní. Odchylka odečítá krajskou procentní míru od místní procentní míry, výsledkem jsou procentní body (nikoli relativní procentní rozdíl).

Krajská reference je poměr součtů, nikoli průměr obecních měr. Očekávaný rozsah kraje vždy určuje celý ověřený číselník geometrie, nikoli pouze obce přítomné v importu. Částečný import je viditelně označen jako neúplný. Populace a události musí pokrývat stejné území a období. Neúplný součet je označený; bez úplného pokrytí se úplná krajská míra nezobrazuje. Krajské I/E zahrnují přesuny uvnitř kraje, proto jsou to pohyby do/z obcí, nikoli přes hranici kraje.

Shrinkage v nastavení používá `w = P / (P + K)` a `r* = w × r + (1 − w) × R`. K lze posouvat nebo zadat číslem od 0 do 5 000 obyvatel; výchozí hodnota je 500. K = 0 obnoví původní míry. R je původní populačně vážená krajská míra stejného roku. Stejné K platí pro I/E/S, proto je zachováno saldo I − E. Jde o nastavitelnou regularizaci podle původní aplikace, nikoli odhad empirical Bayes. Shrinkage vyžaduje úplnou krajskou referenci a kladnou místní populaci; chybějící údaj nenahrazuje.

U jednotky populace obce je výsledkem r*, u odchylky r* − R. U podílu vůči populaci kraje se upravený počet `r* × P / 100` dělí původní populací kraje. Upravené obecní počty se nemusejí sečíst na původní krajský počet. Krajská reference, horní karty, absolutní jednotka a podíl na počtu pohybů zůstávají původní. Osy scatteru vždy používají místní míry se stejným K. Detail barvy vypisuje pro každý rok váhu, původní míru, referenci a upravenou míru.

Časové seskupení je samostatná volitelná funkce. Shrinkage se provádí v každém roce zvlášť a potom se roční upravené míry váží ročními populacemi. Okno 3/5 let vyžaduje všechna kalendářní léta končící zvoleným rokem. Počet je součet / délka okna; při K = 0 je míra 100 × součet událostí / součet populací. Chybějící rok okno zneplatní. Karty ponechávají původní roční počty, upravené hodnoty uvádí mapa a výpočetní detail.

Hodnota zobrazí výslednou veličinu. Meziroční změna odečítá výsledek bezprostředně předchozího kalendářního roku. Rozdíl roků odečítá A od B, včetně B < A a A = B. Rozdíl podílů i procentních měr má jednotku procentní bod. Při vyhlazení se porovnávají celá koncová okna.

Graf přistěhování × vystěhování drží obě osy v procentech populace obce i při jiné jednotce mapy; u odchylek a změn používá procentní body. Používá stejné okno a režim; při odchylce odečítá reference obou kanálů. Barva přebírá metriku mapy, plocha bubliny populaci koncového roku. Diagonála znamená rovnost obou souřadnic. Časový graf i krajská reference mají výhradně body bez spojnic; chybějící údaje bod nemají.

Barevné rozsahy platí pro celé období nastavení. Výchozí neutrální pásmo je 0 a kontrast 2 (zvýšený monotónní převod intenzity). Neutrální pásmo a kontrast mění pouze barvu, nikoli čísla nebo souřadnice. Výpočet „Proč má obec tuto barvu?“ vychází ze stejných odvozených dat jako mapa.

## Skutečné podklady a jejich omezení

Výchozí data: ČSÚ, Databáze demografických údajů za obce ČR, místní panel 354 obcí × 2000–2025 (9 204 záznamů). Populace je stav **k 1. lednu**; vlastní míry nejsou standardní demografické míry vůči střednímu stavu. Sčítání a změna definice populace od roku 2022 ovlivňují srovnatelnost.

Geometrie: skutečné polygony ČÚZK/RÚIAN INSPIRE Administrative Units, aktuální stav služby při stažení 24. 10. 2026 místního času, EPSG:4326. Polygony jsou společně topologicky zjednodušeny pomocí Shapely 2.2 `coverage_simplify`, tolerance 0,0015°; ověřena návaznost sdílených hranic a validita všech 354 obcí. Tento snapshot není rekonstrukcí historických hranic a historický panel není harmonizován na neměnné území. ČSÚ licence CC BY 4.0; pro geometrii viz podmínky ČÚZK, standardní CC licence nebyla ověřena. Úplné zdroje, hashe a metodická upozornění: [datová provenance](data/radar-provenance.md).

## Ověření a další práce

```sh
node --test ustek_analytics/tests/radar-*.test.mjs
node ustek_analytics/tests/radar_browser.cjs
node ustek_analytics/tests/radar_shrinkage_browser.cjs
python3 ustek_analytics/build_radar.py
```

Numerické testy používají výslovně syntetické obce A/B, nikoli demonstrační výsledky skutečných obcí. Browserová kontrola ověřuje reálné ovladače a propojené stavy; vyžaduje dostupné browserové testovací prostředí. Při ověření 24. 10. 2026 prošlo 30 numerických/importních testů a 80 regresních browserových kontrol při K = 0 plus 19 cílených kontrol shrinkage. Produkční build uspěl nad 9 204 záznamy a 354 polygony. [Protokol ověření](reports/radar-verification.md) odkazuje na surový výstup a snímky; měření platí pro konkrétní testovací prostředí.

Viz [rozhodnutí z 24. 10. 2026](docs/MIGRATION_RADAR_DECISIONS.md) a [backlog odložených B/E/F, D/H a případné stabilizace malých obcí](docs/MIGRATION_RADAR_BACKLOG.md). Produkční build upraví tyto odkazy na přibalenou složku `docs`. Archivní časový atlas je dostupný pouze v původním repozitáři; samostatný produkční balíček obsahuje radar.

## Obyvatelé v detailu obce

Detail mapy uvádí skutečný počet obyvatel k 1. 1. a 31. 12. zvoleného roku a jejich rozdíl. Ve výchozím panelu jde o sloupce `populace_1_1` a `populace_31_12` ČSÚ, exportované jako `populationStart` a `populationEnd`. Rozdíl není pouze migrační saldo: zahrnuje přirozenou měnu a případné územní úpravy. Shrinkage tyto počty nemění. U CSV jsou oba stavy volitelné samostatné sloupce; bez doloženého koncového stavu se zobrazí „Údaj chybí“. Konec roku se neodhaduje z migrace ani ze začátku následujícího roku.

## Barvy a řady migračního salda

Přistěhování používá modrou a vystěhování oranžovou v mapě, legendě, kartách i grafech. U salda mapa kombinuje oranžovou pro záporné a modrou pro kladné hodnoty. U záporných změn či odchylek jednotlivých kanálů se zachovává jejich odstín; znaménko ukazuje číselná legenda. Časový graf salda obsahuje tři samostatné bodové řady: modré příchody, oranžové odchody a fialové saldo. Šedá krajská reference patří saldu. Všechny řady sdílejí jednotku, shrinkage, okno a režim změny; osa zahrnuje jejich celý rozsah. Chybějící údaj zůstává bez bodu a řady nemají spojnice.
