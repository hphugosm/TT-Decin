# Datový kontrakt analytických výsledků

CSV používají UTF-8, čárku, desetinnou tečku a záhlaví na prvním řádku. Kódy obcí/ORP uchovávejte jako text. Prázdná buňka znamená chybějící nebo nepoužitelnou hodnotu, nikdy automaticky nulu. Podrobné soubory obsahují i auditní sloupce; uvedené klíče a definice jsou rozhodující pro navazující zobrazení.

| Soubor v `results/migration_2022/` | Klíč / význam |
|---|---|
| `model_comparison.csv` | scope × metric × model × period × population_group × weighting; historické chyby kandidátů a `SELECTOR` |
| `backtest_predictions.csv` | scope × code × year × metric × model; každý předem vypočtený kandidát, včetně označených fallbacků |
| `selector_backtest.csv` | scope × code × year × metric; skutečně předem vybraný model I/E pro 2015–2021 |
| `selector_backtest_with_balance.csv` | Totéž včetně salda odvozeného z obou vybraných proudů |
| `predictions_2022_region.csv` | metric; skutečné krajské přeshraniční I/E/S, scénář a oddělený předběžný benchmark |
| `predictions_2022_municipalities.csv` | kod_obce × year × metric; 354 obcí × 3 veličiny |
| `evaluation_2022_ORP.csv` | kod_orp × year; pouze saldo pro 16 správních obvodů ORP, nikoli samotná města |
| `municipal_proxy_comparison.csv` | kod_obce; 354 obcí, MV evidenční stav a popisné odchylky |
| `proxy_statistics.csv` | metric × basis × method; počet spárovaných obcí a popisné korelace |
| `uncertainty_scenarios_2022.csv` | scope × code × metric × scenario_year; sedm společných ročních scénářů |
| `orp_joint_scenarios_2022.csv` | kod_orp × scenario_year; agregace celého scénáře před určením mezí |
| `prospective_range_coverage.csv` | scope × code × metric × year; kontrola rozpětí vytvořeného pouze z dřívějších chyb |
| `municipality_diagnostics.csv` | kod_obce; historické charakteristiky, chyby a věcné vysvětlení každé obce |

## Veličiny a znaménka

- `scope`: `region` znamená skutečné toky přes hranici kraje; `municipality` obecní toky. Hrubé toky mezi úrovněmi nesčítejte jako stejné veličiny.
- `metric`: `incoming` přistěhování, `outgoing` vystěhování, `balance` jejich rozdíl. Jde o počty podle migrační statistiky.
- `actual_final`: konečná skutečnost 2022. `predicted_baseline`: zmrazený odhad pokračování dřívějšího vývoje; název neznamená, že musí jít o referenční model.
- `deviation`: `actual_final − predicted_baseline`. V roce 2022 to není pozorovaná chyba kontrafaktuálu bez šoku.
- `signed_error` / `signed_error_prediction_minus_actual`: historická `predikce − skutečnost`, tedy opačné znaménko než odchylka 2022.
- `benchmark_no_DO`: předběžný údaj výslovně bez dočasné ochrany. Nejde o pozorovaný svět bez války. Rozdíl proti predikci je samostatný popisný benchmark.
- `population_lag`: populace dostupná před cílovým rokem; u obcí stav k 1. 1. předchozího roku, u kraje k 31. 12. předchozího roku. Pole `pre2022_population_2021_01_01` v proxy tabulce je výslovně obecní jmenovatel.
- `scale`: předchozí objem použitý pro porovnání a scénáře; obecní I/E používají průměr posledních tří let s dolní mezí 1, kraj průměr celé dostupné historie s dolní mezí 1.

## Modely a historie

`B1` je poslední hodnota, `B2` průměr zvoleného okna; `M1` Holt, `M2` ARIMA, `M3` Theta, `M4` Ridge, `M5` Poisson, `M6` Extra Trees, `M7` gradient boosting. Obecní identifikátory mají navíc čitelný suffix. `SELECTOR` označuje poctivě hodnocený postup výběru. Saldo je vždy odvozené z I/E.

`requested_model` je rodina zvolená podle minulosti, `model` skutečně použitá rodina po případném fallbacku. `local_winner` ignoruje stabilizaci skupinovou chybou; není to vždy použitý model. `fit_status`, `fallback_reason`, `fit_warnings` uchovávají stav fitu. Reference nejsou započítány mezi trénované rodiny.

`backtest_mae` ve finálních evaluačních tabulkách je poctivá historická MAE selektoru 2015–2021 pro danou obec/proud. `backtest_mae_prior` u I/E je minulá chyba vybraného kandidáta použitá v rozhodování (2010–2021 pro finální volbu). Obě veličiny se nesmějí zaměňovat. `n_prior_tests`, `backtest_n` a počty úspěšných fitů uvádějí odlišná, výslovně pojmenovaná pokrytí.

## Nejistota a MV

`range_min` / `range_max` jsou extrema sedmi společných historických scénářů. Nejde o kalibrovaný 95% interval a rozpětí nemusí obsahovat bodovou predikci. Pro součet nejdříve sečtěte `scenario_prediction` se stejným `scenario_year`, až pak určete meze.

`mv_stock` je evidenční **stav**, ne roční tok a ne výlučně ukrajinské občanství. `snapshot_publication_date` označuje publikované datum 31. 12. 2022, nikoli doložený konec dne. `coverage_status=absent_in_source_not_zero` znamená chybějící záznam. Souhrn městských částí je již proveden podle obecního kódu. Stav neodečítejte od I/E a korelace neinterpretujte kauzálně.

`quality_flags`, `benchmark_kind`, `benchmark_status`, `uncertainty_status` a `range_kind` musí zůstat viditelné nebo dostupné v každém navazujícím zobrazení. Počet spárovaných obcí a definici velikosti vzorku nezakrývejte.

## Územní příznaky v diagnostice

`territorial_flag_years` a `territorial_effective_flag_years` uvádějí počet roků trénovací historie s příslušným zdrojovým příznakem územní změny nebo její účinnosti k 1. 1. Nulový počet znamená, že panel příznak neobsahuje; není důkazem úplné historické územní neměnnosti. `explanation_cs` je popis historických charakteristik a chyb, nikoli kauzální vysvětlení.
