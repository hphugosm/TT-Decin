# TT – Děčín · Stěhování obcí Ústeckého kraje

Hackathonový projekt týmu TT Děčín zkoumá migraci v obcích Ústeckého kraje. Spojuje interaktivní mapy a prezentaci se třemi analytickými tématy: podobností vývoje sousedních obcí, odhadem migrace roku 2022 podle předchozích let a souvislostí firemních investic se stěhováním.

## Rychlé odkazy

- [Migrační mapa](https://hphugosm.github.io/TT-Decin/mapa/) — přistěhování, vystěhování a saldo jednotlivých obcí v čase.
- [Atlas migračních klastrů](https://hphugosm.github.io/TT-Decin/klastry/) — geograficky souvislé skupiny obcí s podobným vývojem.
- [Prezentace](https://hphugosm.github.io/TT-Decin/prezentace/) — jedenáct snímků s živými mapami, hypotézou a výsledným porovnáním.
- [Výsledky analýzy migrace 2022](reports/migration_2022/RESULTS.md) — odhady, historické ověření a porovnání s rokem 2022.

## Co kde najdete

| Část | Obsah | Dokumentace |
| --- | --- | --- |
| Migrační mapa | `mapa/`, společné moduly `radar*.mjs` a data v `data/`; výběr obcí, časová osa, bodové grafy a import CSV | [Návod a metodika mapy](RADAR_README.md) |
| Atlas klastrů | `klastry/`; prohlížení čtyř předpočítaných profilů podobnosti, členů skupin a jejich vývoje | [Ovládání a interpretace klastrů](klastry/README.md) |
| Výpočet klastrů | `vyber-migracnich-klastru/`; zdrojový algoritmus, vstupy, výsledky, grafy a kontroly | [Metoda a přepočítání](vyber-migracnich-klastru/README.md) |
| Analýza migrace 2022 | Zprávy a grafy v `reports/migration_2022/`, tabulky v `results/migration_2022/`, konfigurace a auditní logy v `logs/migration_2022/` | [Výsledky](reports/migration_2022/RESULTS.md), [metodika](reports/migration_2022/METHODOLOGY.md), [datový slovník](reports/migration_2022/DATA_DICTIONARY.md), [doplněk k roku 2021 a ukrajinské migraci](reports/migration_2022/BONUS_2021.md) |
| Firemní investice a migrace | `hypoteza/`; šest firemních záměrů, okolí 15/20/50 km, agregovaná data, grafy a kontrola výpočtů | [Otázka, zdroje a závěry](hypoteza/README.md) |
| Prezentace | `prezentace/`; rozcestník, snímky, vložené mapy a grafy firemních případů | [Pořadí, ovládání a technické podrobnosti](prezentace/README.md), [Brand Bible](BRAND_BIBLE.md) |

Výstupy analýzy 2022 byly sloučeny z větve `analysis/migration-2022` do `main`. Všechny části uvedené výše jsou nyní dostupné v hlavní větvi.

## Spuštění map a prezentace

Pro prohlížení aplikací stačí Python 3 a moderní prohlížeč. Z kořene staženého repozitáře spusťte:

```sh
python3 -m http.server 8778 --bind 127.0.0.1
```

Potom otevřete:

- mapu: http://127.0.0.1:8778/mapa/
- klastry: http://127.0.0.1:8778/klastry/
- prezentaci: http://127.0.0.1:8778/prezentace/

Tyto aplikace používají přiložená data a nepotřebují instalaci balíčků ani sestavení. Místní server slouží k jejich prohlížení; analytické modely nepřepočítává. Kořenová stránka přesměruje na mapu se zachováním parametrů a fragmentu URL.

## Základní ovládání

V migrační mapě kliknutí na obec přiblíží její území a zobrazí graf a statistiky. Druhé kliknutí vrátí krajský pohled. Časová osa mění rok; nastavení vybírá přistěhování, vystěhování nebo saldo a způsob zobrazení. Saldo je přistěhování minus vystěhování; narození a úmrtí do něj nepatří. Importované CSV se zpracovává místně v prohlížeči.

Vyhlazení ke kraji (shrinkage) omezuje prudké výkyvy podílů zejména u malých obcí tím, že je přibližuje krajské míře. Sílu určuje konstanta K v rozsahu 0–5 000, výchozí je 500; při K = 0 se nevyhlazuje. Původní počty v kartách zůstávají zachované. Vzorec, jednotky a víceletá okna vysvětluje [metodika mapy](RADAR_README.md).

V atlasu klastrů posuvník vybírá jeden ze čtyř předpočítaných profilů podobnosti. Změna roku mění zobrazené hodnoty, nikoli členství skupin. V prezentaci fungují šipky ← / →, Esc pro návrat do rozcestníku a F pro celou obrazovku; volba „Prohlídka dat“ nabízí odkazy na GitHub, obě mapy a prezentaci. Další ovládání popisuje [dokumentace prezentace](prezentace/README.md).

## Analytické otázky a čtení výsledků

**Které obce se vyvíjejí podobně?** Hledání klastrů porovnává změny přistěhování a vystěhování a vyžaduje geografickou souvislost skupiny. Nálezy jsou průzkumné; podobný vývoj sám nedokládá stěhování mezi členy skupiny ani společnou příčinu. [Výsledky a kontroly stability](vyber-migracnich-klastru/README.md).

**Jak by vypadal rok 2022 při pokračování předchozího vývoje?** Analýza sestavuje jednoroční scénář z historie 2000–2021 a následně jej porovnává se skutečností 2022. Odchylka od scénáře sama neurčuje účinek války ani počet uprchlíků. Přesnost modelů se hodnotí na dřívějších letech. [Výsledky](reports/migration_2022/RESULTS.md) a [definice zdrojů](reports/migration_2022/SOURCE_NOTES.md).

**Souvisí firemní investice s růstem migrace?** Průzkum šesti záměrů nenašel přesvědčivý společný efekt napříč případy. Výsledek závisí na firmě, období a vymezení okolí. Rok záměru není doloženým rokem otevření závodu a samotné grafy neprokazují kauzální vztah. [Podklady a omezení](hypoteza/README.md).

## Data a jejich rozdílné definice

Výchozí panel migrační mapy obsahuje 354 obcí, roky 2000–2025 a 9 204 záznamů. Zdrojem jsou údaje ČSÚ; geografický podklad vychází z ČÚZK/RÚIAN. Současné hranice nejsou rekonstrukcí historických hranic. [Zdroje, licence a omezení mapových dat](data/radar-provenance.md).

Jednotlivé části používají různé populační základy:

| Část | Populační základ |
| --- | --- |
| Migrační mapa | Stav k 1. lednu pozorovaného roku |
| Atlas a výpočet klastrů | Stav k 1. červenci (`pocet_obyvatel_1_7`) |
| Samostatný průzkum v `hypoteza/` | Stav k 31. prosinci stejného roku podle dodaného datasetu |
| Modely migrace 2022 | Pouze populační údaje z předchozího roku; přesné okamžiky uvádí [datový slovník](reports/migration_2022/DATA_DICTIONARY.md) |

Při porovnávání výstupů je potřeba zachovat jejich definice a jednotky. Součty příchodů a odchodů mezi obcemi zahrnují i pohyby uvnitř kraje; krajské toky přes jeho hranici představují jinou veličinu. Chybějící hodnoty se automaticky nepovažují za nulu.

## Co lze spustit a přepočítat

- **Mapy a prezentace:** fungují přímo z přiložených souborů přes místní server uvedený výše.
- **Výpočet klastrů:** zdrojový kód, vstupy a seznam závislostí jsou v `vyber-migracnich-klastru/`. Je potřeba Python 3.11+ a instalace příslušných balíčků; postup včetně rychlých kontrol a úplného přepočtu je v [návodu](vyber-migracnich-klastru/README.md). Rozsáhlé generované výsledky vznikají až přepočtem.
- **Průzkum firemních záměrů:** přiložené agregované tabulky a odkazy lze ověřit příkazem `python3 hypoteza/overit.py`, bez dalších balíčků. Rozsah kontroly popisuje [dokumentace](hypoteza/README.md).
- **Modely migrace 2022:** repozitář obsahuje výsledky, metodiku, konfigurace, zdrojové hashe a logy. Trénovací kód, modelové checkpointy a úplné místní prostředí součástí nejsou. Úplný přepočet proto vyžaduje původní místní projekt; [metodika](reports/migration_2022/METHODOLOGY.md) uchovává záznam jeho spuštění.

Také `prepare_radar.py` a některé starší příkazy v dokumentaci odkazují na původní vývojový projekt a vstupy. Pro spuštění přiložených aplikací platí postup v tomto README.

## Ověření a další dokumentace

Z kořene repozitáře, s nainstalovaným Node.js, lze spustit testy migrační mapy a výpočtů grafů prezentace:

```sh
node --test tests/radar-*.test.mjs prezentace/reality-engine.test.mjs
```

Jde o kontroly aplikace a výpočtů, nikoli o opětovné natrénování modelů migrace 2022. [Protokol mapy](reports/radar-verification.md), [kontroly klastrů](vyber-migracnich-klastru/reports/OVERENI.md) a [analytický validační záznam](logs/migration_2022/validation.json) dokumentují své vlastní rozsahy ověření.

GitHub Pages publikuje `main` z kořene repozitáře; `.nojekyll` zachovává statické soubory bez zpracování Jekyllem. Další kontext: [rozhodnutí o mapě](docs/MIGRATION_RADAR_DECISIONS.md), [backlog](docs/MIGRATION_RADAR_BACKLOG.md) a [vizuální styl](BRAND_BIBLE.md).
