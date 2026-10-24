# Atlas migračních klastrů Ústeckého kraje

Samostatná aplikace pro 354 obcí a období 2000–2025. Zdrojový vstup je `index.html` v tomto adresáři. Produkční sestavení z kořene projektu:

```sh
python3 ustek_analytics/build_clusters.py
python3 -m http.server 8777
```

Místní adresa: http://127.0.0.1:8777/dist/migration-clusters/. Veřejná adresa: https://hphugosm.github.io/TT-Decin/klastry/.

Pro samostatnou kopii na GitHubu stačí z kořene repozitáře spustit `python3 -m http.server 8778 --bind 127.0.0.1` a otevřít http://127.0.0.1:8778/klastry/. Příkazy sestavení výše patří k původnímu vývojovému projektu.

## Ovládání

Kliknutí na obec vybere její skupinu a přiblíží celé její území; nezařazená obec zobrazí vlastní řadu. Druhé kliknutí na tutéž vybranou obec nebo tlačítko návratu obnoví krajský pohled. Skupinu lze vybrat také ze seznamu. Vyhledávání obcí rozpoznává začátek názvu bez diakritiky nebo kód obce; Enter vybere výsledek. Výběr obce, jejíž skupinu skrývá filtr, obnoví viditelnost skupin od dvou členů bez filtru stability.

Kliknutí na člena v přehledu nebo legendě zvýrazní jeho body; další kliknutí zvýraznění zruší. Mapa nabízí posun, přiblížení a oddálení. Mapa i graf se dají rozbalit přes celé okno; Esc vrátí původní rozložení. Časová osa, šipky, přehrávání nebo kliknutí do grafu mění rok. **Rok nemění členství ani barvy skupin**, které vycházejí z celého období.

Nastavení přepíná profil podobnosti, minimální velikost skupiny, filtr stabilnějších nálezů a ukazatel grafu. Výchozí je rozšířený profil `extended`: nejméně 60% shoda směru změn každé dvojice a obě korelace nejméně 0,15. Zobrazuje přistěhování, skupiny od dvou obcí, bez filtru stability a podíl obyvatel. V tomto profilu mají skupiny až šest obcí pro přistěhování a čtyři pro vystěhování. Detail skupiny obsahuje dvojice, stabilitu a export všech členů a jejich ročních hodnot do CSV (UTF-8, středník).

## Profily a počty

Počty jsou pro všechny skupiny profilu před filtry. P = přistěhování, V = vystěhování. Procento označuje minimální shodu směru meziročních změn každé dvojice obcí ve společných informativních přechodech; není to přesnost modelu ani pravděpodobnost správnosti skupiny. Korelační práh platí současně pro Pearsonovu i Spearmanovu korelaci každé dvojice. Seznam v nastavení postupuje od nejpřísnějších 70 % přes 65 % ke dvěma variantám 60 % s rozdílnými korelačními prahy. Přepnutí vybírá již uložené výsledky a data nepřepočítává; profily nemusí být vzájemně vnořené.

| Profil | Shoda směrů / korelace | Skupiny P / V | Zařazené obce P / V | Nezařazené P / V | Stabilnější skupiny P / V |
| --- | --- | --- | --- | --- | --- |
| Původní (`balanced`) | ≥ 70 % / ≥ 0,40 | 21 / 11 | 42 / 22 | 312 / 332 | 1 / 0 |
| Mírnější (`relaxed`) | ≥ 65 % / ≥ 0,30 | 38 / 35 | 79 / 73 | 275 / 281 | 2 / 0 |
| Volnější (`loose`) | ≥ 60 % / ≥ 0,20 | 83 / 63 | 181 / 139 | 173 / 215 | 4 / 1 |
| Rozšířený (`extended`) | ≥ 60 % / ≥ 0,15 | 86 / 71 | 193 / 157 | 161 / 197 | 2 / 1 |

Původní profil obsahuje jen dvojice. Největší skupina má v mírnějším profilu 3 členy, ve volnějším 4 a v rozšířeném 6 pro přistěhování a 4 pro vystěhování. Šedá na mapě zahrnuje jak skutečně nezařazené obce (`UNASSIGNED`), tak členy skupin skrytých filtrem; legenda uvádí oba počty odděleně.

## Metoda a čtení grafu

Skupina tvoří souvislé území přes společné úseky hranic; dotyk v rohu nestačí. Každá dvojice musí splnit podobnost alespoň ve 12 společných informativních změnách, i když nemusí přímo sousedit. Korelace pracují s robustně upravenými změnami modelové řady, proto se nemusí rovnat korelaci původních podílů v grafu. Přistěhování používá empirické Bayesovo vyhlazení, vystěhování původní míry. Profily jsou dodané výsledky průzkumu a nemusí být vzájemně vnořené.

Retence celé skupiny udává podíl 59 blokových a 59 Poissonových opakování, v nichž všichni členové zůstali spolu, případně jako součást větší skupiny. Nejde o pravděpodobnost správnosti ani o průměr stability jednotlivých dvojic. Všechny nálezy jsou průzkumné; podobný vývoj nedokazuje přesuny mezi členy ani příčinu migrace.

Graf používá pouze body bez spojnic. Barvy skupin na mapě i členů v legendě jsou kategoriální, ne škála intenzity. Svislá přerušovaná čára a větší body označují zvolený rok. Osa hodnot vychází ze všech let aktuálně zobrazených řad, nikoli pouze z vybraného roku.

- **Podíl obyvatel:** původní počet / populace × 100; dodaná míra na 1 000 obyvatel se pro zobrazení procent dělí deseti.
- **Modelovaná změna:** kalendářně zarovnaný první rozdíl modelové míry, po dělení deseti v procentních bodech; první rok je prázdný.
- **Počet migrantů:** původní počet osob za kalendářní rok.

Populace je `pocet_obyvatel_1_7`, stav k **1. červenci**, podle přiložené dokumentace ČSÚ OBY01B01. Tento jmenovatel je třeba odlišovat od populačních údajů používaných v jiných pohledech Migračního radaru. Krajský podíl je poměr součtu pohybů a součtu populace, nikoli průměr obecních procent. U vybrané skupiny se při podílu přidává šedá krajská reference. Bez výběru graf ukazuje krajský součet nebo krajskou míru; u modelované změny medián obcí. Součty přistěhování i vystěhování zahrnují pohyby uvnitř kraje. Chybějící hodnoty se nedoplňují.

## Zdroje a reprodukovatelnost

Vstup: `delivery/Migrace_Ustecky_kraj_KOMPLET_2026-10-24.zip`, SHA-256:

```text
99e6fef49f61c50fee455d5d7d353f6e7cf89a97239106103c364835968d9c26
```

Uvnitř prefixu `Migrace_Ustecky_kraj_KOMPLET_2026-10-24/` se čtou pouze tyto položky:

- `results/temporal_dashboard.json`
- `results/local_migration_groups.json`
- `results/local_migration_relaxed_groups.json`
- `results/local_migration_loose_groups.json`
- `results/local_migration_extended_groups.json`
- `results/analysis_manifest.json`
- `ustek_analytics/data/radar-geography.json`
- `audit_dcuk1_2026-10-23/sources/dokumentace_uloha1_hlavni_dataset.docx`

[Provenience](data/provenance.json) uvádí SHA-256 i velikost každé položky, identifikátory analýz, jednotky a kontroly konzistence. Datum balíčku 24. 10. 2026 a datum auditního adresáře 23. 10. 2026 nejsou potvrzenými daty publikace nebo stažení původních dat.

[Skupiny](data/clusters.json) uchovávají čtyři předpočítané profily, [roční řady](data/series.json) populaci, počty, míry, modelované míry a změny. Příprava vybírá povolené položky ZIP, kontroluje 354 unikátních kódů, 26 zarovnaných let, členství, shodný základ modelů a konečné nebo prázdné hodnoty. Analytické hodnoty kopíruje bez zaokrouhlení, nového odhadu modelu či imputace; kód z archivu nespouští. Prohlížeč pouze vybírá a zobrazuje dodané výsledky.
