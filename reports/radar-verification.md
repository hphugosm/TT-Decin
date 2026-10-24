# Ověření Migračního radaru — 24. 10. 2026

Nad skutečným místním panelem ČSÚ (9 204 záznamů, 354 obcí, 2000–2025) a oddělenými syntetickými příklady prošlo **30 numerických a importních testů**, **80 regresních browserových kontrol** a **19 cílených kontrol shrinkage**. Samostatný produkční build úspěšně zvalidoval dataset a polygony a vytvořil balíček `dist/migration-radar` s kontrolními součty SHA-256.

## Reprodukce

Z kořene repozitáře:

```sh
python3 ustek_analytics/serve.py --port 8777
```

V dalším terminálu:

```sh
node --test ustek_analytics/tests/radar-*.test.mjs
node ustek_analytics/tests/radar_browser.cjs
node ustek_analytics/tests/radar_shrinkage_browser.cjs
python3 ustek_analytics/build_radar.py
python3 -m http.server 8778 --bind 127.0.0.1 --directory dist/migration-radar
```

Zdrojová stránka: http://127.0.0.1:8777/ustek_analytics/temporal.html. Produkční stránka: http://127.0.0.1:8778/. Finální browserová sada skutečně proběhla proti produkčnímu sestavení na `http://127.0.0.1:8777/dist/migration-radar/index.html` (pole `testedURL` v JSON). Pro opakování na samostatném produkčním serveru lze nastavit `RADAR_URL=http://127.0.0.1:8778/`. Browserová sada potřebuje Node a Playwright/Chromium; aplikace samotná je nepotřebuje.

## Rozsah a výsledky

Numerické a importní testy ověřují vážené krajské reference, výpočty I/E/S, expozice časových oken, změny a odchylky, mezery v letech, nezávislé kanály při chybějícím údaji, rozpoznání CSV, kategorie a validační chyby. Aritmetické příklady A/B jsou výslovně syntetické testovací záznamy.

Browserová kontrola začíná skutečným datasetem a pokračuje oddělenou syntetickou fixture. Ověřuje mapové polygony a jejich zachování při změně roku, hledání bez diakritiky, zachování kamery a nastavení výběrem obce, oba grafy bez spojnic, režimy změny a B minus A, tříleté okno, vysvětlení výpočtu, změny barev bez změny souřadnic a import přes skutečný průvodce. Nový import zastaví staré přehrávání; neplatný soubor nezmění platná data. Chybějící údaje nevytvářejí nulové body. Zaznamenaný běh neměl runtime chyby, selhané síťové požadavky ani externí požadavky.

[Surový JSON všech 80 kontrol, časů a rozměrů](radar-browser-validation.json) uvádí `passed: true`, prázdná pole `errors`, `failed` a `external`. Rozložení notebooku bylo testováno v šířce 1 366 px, mobilní v šířce 390 px, bez vodorovného přetečení. Finální snímky časového grafu i scatteru byly vizuálně prohlédnuty na notebooku i mobilu; nebyla zjištěna známá blokující chyba rozhraní.

Navazující změna na procenta ověřuje skutečné kliknutí na polygon, průběžné snímky plynulého zoomu a synchronizaci výběru s časovým grafem a pravým panelem. Přejezd myší nepřepíná detail a polygony nemají nativní tooltip. Volby podílů v nastavení používají populaci obce, respektive kraje; odchylka je rozdíl procentních měr v procentních bodech. U skutečných Jenčic jsou ověřeny malé nenulové podíly pod 0,01 % v tooltipu grafu, pravém panelu i přístupném popisku mapy.

Regresní browserová sada nastavuje K = 0 pro kontrolu původních aritmetických příkladů. [Samostatné ověření shrinkage](radar-shrinkage-validation.json) má 19 úspěšných kontrol: výchozí K = 500, posuvník i číselný vstup, nezávislý výpočet na skutečných datech Děčína, synchronizace mapy a grafů, zachování původních karet a výběru, návrat K = 0, reset a mobilní rozložení. Bez runtime chyb. Numerické testy navíc ověřují rozdíly a časová okna, saldo I − E, neúplnou referenci, nulovou populaci a rozlišení konstant v cache.

Aktuální časy načtení a vykreslování jsou v surovém JSON regresní sady. Jde o interní měření při K = 0 v konkrétním browserovém prostředí, nikoli záruku odezvy na jiném počítači nebo úplný benchmark interakční latence.

Při předchozím ověření původního časového atlasu prošlo sedm skupin scénářů a jedenáct exportních URL, 354 validních mapových cest, bez runtime chyb a externích požadavků (`temporal-browser-validation.json` v původním repozitáři). Pro navazující změnu radaru se tato sada znovu nespouštěla; její kontroly nejsou zahrnuty v počtu 80 kontrol radaru.

Zůstávají metodická omezení dat: populace je stav k 1. lednu, nikoli střední stav; historická data nejsou harmonizována na neměnné hranice a současná geometrie nereprezentuje ověřené historické hranice. Podrobnosti uvádí [provenance](../data/radar-provenance.md).

## Vizuální záznam

- [Shrinkage — nastavení konstanty](radar-shrinkage-settings.png)
- [Shrinkage — vybraný Děčín s K = 500](radar-shrinkage-map.png)

- [Notebook — poslední uložený snímek](radar-laptop.png)
- [Mobil — poslední uložený snímek](radar-mobile.png)
- [Notebook — scatter](radar-scatter.png)
- [Mobil — scatter](radar-mobile-scatter.png)
- [Vybraný Děčín, 2025 — procentní míra a propojený detail](radar-selected-percent.png)

Snímky a JSON představují konkrétní běh testů; pokud se mění rozhraní, je nutné sadu znovu spustit. Testy původního časového atlasu používají samostatnou stránku `temporal-clusters.html`; jejich výsledek není zahrnut v počtech kontrol radaru.
