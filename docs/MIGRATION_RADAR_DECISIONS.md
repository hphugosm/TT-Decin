# Migrační radar — rozhodnutí z 24. 10. 2026

## Schválený rozsah

Migrační radar rozšiřuje existující lokální statickou aplikaci. Vstupní stránka je `ustek_analytics/temporal.html`; původní časový atlas je zachován jako `temporal-clusters.html`. Publikování webu není součástí tohoto kroku.

Aktivní funkce jsou **A** (vysvětlení barvy ze společných výpočtů), **C** (Hodnota, Meziroční změna, Rozdíl roků B minus A) a **G** (bodový graf přistěhování × vystěhování propojený s mapou). Výběr obce zachovává analytické nastavení a pozastaví přehrávání.

**Časový graf má výhradně jednotlivé body bez datových spojnic.** Platí také pro krajskou referenci a vyhlazené hodnoty. Totéž platí pro druhý bodový graf: žádné trajektorie ani stopy. Povolené jsou pouze vodicí osy, mřížka, nula, značka roku a diagonála X = Y.

## Metodika

- Saldo S = I − E je dostupné pouze se známými oběma členy. Chybějící údaj není nula.
- Krajská procentní míra je 100 × součet událostí / součet populací stejného území a období. Prostý průměr obecních měr se nepoužívá. Výběr obce benchmark nemění. Očekávaný rozsah kraje vždy určuje celý ověřený číselník geometrie; částečný import se nesmí stát novým úplným krajem a je označen jako neúplný.
- Součty I/E znamenají pohyby do/z obcí kraje včetně vnitrokrajských přesunů. Nejsou přeshraničními toky kraje.
- Časové okno je 1, 3 nebo 5 úplných po sobě jdoucích let končících rokem výběru. Absolutní hodnota je průměrný roční počet, míra je poměr součtů událostí a populačních expozic. Neúplné okno je nedostupné.
- Režim změny se aplikuje až na výsledné veličiny. Meziroční změna vyžaduje rok t−1; rozdíl roků je B minus A, včetně A = B a B < A. Změna podílu je v procentních bodech.
- Graf I × E vždy používá obě souřadnice v procentech populace obce (změny a odchylky v procentních bodech) se shodným oknem a režimem; barva přebírá metriku mapy. Plocha bubliny odpovídá populaci koncového roku.
- Barevný rozsah je pevný pro celé období daného nastavení, podepsané veličiny jsou symetrické kolem nuly. Neutrální pásmo a kontrast mění pouze barvu. Nejde o test statistické významnosti.
- Import běží lokálně v prohlížeči; neplatný import nesmí nahradit dosavadní platná data. Jednoznačný klíč je kód obce × rok po výběru kategorie. Celek a jeho části se nesčítají.

## Data a omezení

Skutečný výchozí panel ČSÚ má 9 204 záznamů pro 354 obcí v letech 2000–2025. Populace je **stav k 1. lednu**, proto jde o vlastní přepočty vůči tomuto stavu, nikoli standardní míry vůči střednímu stavu. Úplnost označuje dostupnost kanálů pro aktuální číselník, ne územní neměnnost.

Geometrie je aktuální snapshot polygonů ČÚZK/RÚIAN INSPIRE AU stažený 24. 10. 2026 místního času (23. 10. 2026 23:14 UTC), EPSG:4326. Historické hranice 2000–2025 nebyly rekonstruovány. Geometrie byla topologicky zjednodušena společně pomocí Shapely 2.2 `coverage_simplify` s tolerancí 0,0015°; ověřena návaznost sdílených hranic a validita všech 354 polygonů. Datum číselníku 1. 1. 2026 není referenčním datem hranic.

Sčítání 2001/2011/2021 a změna vymezení populace od 2022 ovlivňují srovnatelnost. Územní korekce nejsou migrace. Podrobné zdroje, licence, kontrolní součty a omezení uvádí `ustek_analytics/data/radar-provenance.md`. ČSÚ uvádí CC BY 4.0; standardní CC licence geometrie nebyla ověřena, platí připojené podmínky ČÚZK.

## Ověření

Reprodukovatelné příkazy a rozlišení numerických testů, browserové kontroly a produkčního buildu jsou v `ustek_analytics/RADAR_README.md`. Samotná existence těchto příkazů není potvrzením jejich úspěšného běhu; aktuální výsledky patří do předání konkrétního sestavení.

## Navazující změna uživatele — 24. 10. 2026

- Detail obce se na mapě aktivuje kliknutím, nikoli přejezdem myši. Kliknutí spouští plynulý zoom a synchronizuje vybranou obec s grafem a pravým panelem; myš výběr nepřepisuje. Mapa nemá hover tooltipy. Druhé kliknutí na stejný polygon vrací celý kraj s plynulým oddálením a krajskými statistikami; rok i analytické nastavení zůstávají zachovány. Klávesnice Enter/mezerník odpovídá kliknutí.
- Původní populační přepočty na 1 000 byly nahrazeny procenty: `100 × migrace / populace obce` a `100 × migrace obce / populace kraje`. Obě volby platí pro I, E i saldo. Na následné přání uživatele byly zkratky u mapy odstraněny; oba podíly i odchylka zůstávají v Nastavení → Jednotka mapy a časového grafu.
- Odchylka od kraje zůstává rozdílem místní a vážené krajské míry. Po převodu měr na procenta je její jednotkou procentní bod; nejde o dělení krajskou mírou ani relativní procentní změnu.
- V mapě, grafu, referenci, neutrálním pásmu a vysvětlení se používá stejná stupnice. Původní roční počty v kartách se nemění. Podíl na počtu krajských pohybů zůstává samostatnou dosavadní jednotkou.

## Nastavitelný shrinkage — potvrzení uživatele 24. 10. 2026

Uživatel výslovně potvrdil původní vzorec `r* = w r + (1−w) R`, `w = P/(P+K)` a požádal o nastavitelnou konstantu. Tím nahrazuje původní odložení shrinkage v zadání. V nastavení je posuvník a číselný vstup K 0–5 000, výchozí 500; nula vypíná shrinkage. Referencí je původní vážená krajská míra stejného roku. Časové seskupení zůstává samostatně označené a volitelné. Pro okna se nejprve upraví jednotlivé roky a potom váží jejich populacemi. Stejná konstanta platí pro oba migrační kanály a saldo, pro mapu i oba grafy. Původní počty v kartách a krajská reference se nemění. Absolutní jednotka a podíl na počtu krajských pohybů zůstávají původní; podíl vůči krajské populaci používá upravený místní počet. Detail vypisuje roční váhy a míry. Nejde o automatický EB fit.

## Detail populace — 24. 10. 2026

Na přání uživatele detail nahrazuje kód obce a nápovědu opakovaného kliknutí skutečnými stavy k 1. 1. a 31. 12. vybraného roku a rozdílem. Zdrojový panel obsahuje oba stavy pro 9 204 řádků. Počty se neshrinkují a konečný stav se neodvozuje pouze z migrace. Import podporuje oba volitelné sloupce; chybějící stav se neodhaduje.

## Barvy migračních kanálů — 24. 10. 2026

Uživatel sjednotil příchody na modrou a odchody na oranžovou v mapě a grafech. Saldo mapy zachovává divergující oranžovo-modrou stupnici. V časovém grafu salda požaduje souběžné řady příchodů a odchodů; saldo je fialové, krajská reference salda šedá. Nejde o samostatný rozkladový panel D: jde o tři bodové řady ve stávajícím grafu. Všechny používají shodný výpočet a zůstávají bez spojnic.

## Hledání nad mapou — 24. 10. 2026

Vyhledávání je přes celou šířku pod třemi kartami a nad mapou. Návrhy odpovídají začátku názvu bez ohledu na diakritiku, nemají limit 12 výsledků a delší seznam se posouvá. Přesná shoda je první; Enter vybere obec a spustí existující plynulé přiblížení i propojení detailů.

## Odstranění druhého grafu — 24. 10. 2026

Na výslovné přání uživatele byl graf Přistěhování × vystěhování včetně přepínací záložky a vykreslování odstraněn. Aktuální rozhraní obsahuje pouze časový bodový graf; při saldu nadále zobrazuje příchody, odchody a saldo ve třech barvách. Toto rozhodnutí nahrazuje předchozí schválení funkce G.
