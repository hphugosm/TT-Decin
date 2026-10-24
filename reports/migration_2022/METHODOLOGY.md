# Metodika: odhad migrace roku 2022 při pokračování předchozího vývoje

## Co experiment zjišťuje

Jednoroční předpovědi z historie 2000–2021 popisují pokračování dřívějšího vývoje. Měřenou predikční schopnost dokládají výhradně historické testy. Skutečnost roku 2022 slouží až k následnému porovnání zmrazeného scénáře. Rozdíl skutečnost minus scénář je **odchylka od očekávaného vývoje**, nikoli automaticky počet uprchlíků ani kauzální efekt války. Dřívější celková migrace již zahrnovala ukrajinské občany.

Jde o retrospektivní experiment s dnes dostupnou datovou verzí. Není to prognóza prokazatelně publikovatelná k 31. 12. 2021. Dostupnost historických čísel neznamená dostupnost jejich dnešní revidované verze v původním čase.

## Jednotky, území a vstupy

- Kraj: skutečné přistěhování a vystěhování přes hranice Ústeckého kraje. Otevřená roční data ČSÚ, filtr `vuzemi_cis=100`, `vuzemi_kod=3069`, indikátory `DEM0009`, `DEM0010`, `DEM0001`. Jednotka je počet migračních událostí dle statistické definice, ne nutně unikátní osoba. Soubory neobsahují věkové/pohlavní dimenze, které by se přičítaly k celku. Schéma, identifikátory, jednotky, úplnost a SHA-256 jsou zaznamenány u zdrojů.
- Obce: 354 kódů současného výběru, 26 let a 9 204 záznamů. Počítá se z původních `incoming`/`outgoing` v `data/radar-data.json`. Uživatelské vyhlazení mapy se nepoužívá. Kontrola proti původnímu CSV ověřuje počty i saldo.
- Počet obyvatel obce v panelu je stav k 1. lednu pozorovaného roku. Každá predikce používá nejvýše jeho hodnotu z roku `t−1`. Krajský populační prediktor je stav k 31. prosinci `t−1`. Nikde se nepoužívá konec či střed roku 2022. Míry jsou vlastní výpočet **na 1 000 předšokových obyvatel**, nikoli oficiální hrubá míra na střední stav.
- Obecní hrubé pohyby zahrnují i přesuny uvnitř kraje/ORP. Nejsou hierarchicky sčitatelné na toky přes hranice vyššího území. Součty obecních I/E jsou vždy označeny „součet obecních pohybů“. Nic se nepřepočítává násilným rescalováním.
- Saldo je vždy `I−E`. Pro agregaci do ORP se používá oficiální historický převodník `1.1.2022`, ověřený také proti `1.1.2023`, s úplným pokrytím všech 354 kódů. Porovnává se pouze saldo, nikoli součet obecních I/E s ORP I/E.

Databáze ČSÚ používá poslední platné obecní kódy a současné okresní zařazení. Současná geometrie není rekonstrukcí hranic. Obecní řady nejsou přepočteny na konstantní hranice. Evidujeme původní územní příznaky, včetně převodu části Hradiště účinného od 1. 1. 2016. Sčítání 2001, 2011 a 2021 narušují návaznost populačních stavů; rozdíly stavů proto nevyužíváme k odvozování migrace. Od roku 2001 se rozšířil sledovaný okruh cizinců, v roce 2005 se změnil administrativní zdroj migrace a v roce 2022 zahrnutí držitelů dočasné ochrany.

Zdroje: [ČSÚ – obecní databáze](https://csu.gov.cz/databaze-demografickych-udaju-za-obce-cr), [vysvětlivky](https://csu.gov.cz/vysvetlivky-k-databazi), [metodika pohybu obyvatelstva](https://csu.gov.cz/pohyb-obyvatelstva-metodika), [roční otevřená data](https://csu.gov.cz/produkty/pohyb-obyvatel), [historické územní číselníky](https://csu.gov.cz/i_zakladni_uzemni_ciselniky_na_uzemi_cr_a_klasifikace_cz_nuts).

## Časové oddělení a skutečný výběr

1. Trénovací soubor obsahuje výhradně 2000–2021 (7 788 obecních řádků). Hodnoty 2022 jsou v oddělené evaluation složce. Roky 2023–2025 byly pouze zkontrolovány jako součást původního souboru a nebyly exportovány do modelových vstupů.
2. Cílové roky 2010–2014 slouží vývoji a malé mřížce konfigurací. Jejich chyby nejsou nezávislým hodnocením zvolených hyperparametrů. Jednoduché obecní časové modely mají pevné úsporné konfigurace; žádná rodina nebyla vyřazena jen kvůli výsledku na kraji.
3. Konfigurace se zapisují a zmrazí před predikcemi 2015–2021. Pro každý cíl `t` se fituje pouze na letech `<t`. Panel se dělí podle celých let současně pro všechny obce. Škálování i kódování obecních efektů se fitují uvnitř trénovacího okna. Každý lag, průměr a trend pochází výhradně z minulosti.
4. Vítěz pro rok `t` se vybírá podle chyb z let `<t`. Nezávisle testované výsledky selektoru jsou pouze 2015–2021. Kandidátní minimum přes stejné hodnocené roky není vydáváno za přesnost selektoru.
5. Pro rok 2022 se použije historie do 2021 a dřívější chyby. Hash konfigurací, kandidátních predikcí, selektoru a jeho predikcí se uloží před výsledkovým spojením se skutečností 2022. Importní kontrola formátu/definic evaluation dat není laděním.

Postup respektuje princip postupného časového testování a oddělení trénovací a testovací chyby, popsaný v [Forecasting: Principles and Practice, kap. 5](https://otexts.com/fpp3/toolbox.html).

## Modelové rodiny

| Kód | Rodina | Kraj | Obce |
|---|---|---|---|
| B1 | Poslední známá hodnota | Reference | Reference |
| B2 | Průměr 3 nebo 5 let | Okno z vývoje | Okno z vývoje |
| M1 | Holt, aditivní tlumený trend | Malá mřížka tlumení | Samostatný fit každé řady |
| M2 | ARIMA bez sezónnosti | Malá mřížka řádů | ARIMA(1,0,0), omezený optimizer |
| M3 | Theta bez sezónnosti | Malá mřížka parametru theta | Samostatný fit, theta 2 |
| M4 | Regularizovaná Ridge autoregrese | Lagy, minulý průměr a trend | Společný panel, lagy, minulý objem/variabilita, obecní efekty |
| M5 | Regularizovaná Poissonova regrese | Počet s minulou populační expozicí | Společný panel, regularizované obecní efekty a minulá populační expozice |
| M6 | Extra Trees | Nepoužito | Společný panel, omezená hloubka a velikost listu |
| M7 | Histogram gradient boosting, Poisson loss | Nepoužito | Mělké stromy, regularizace, bez náhodného validačního dělení |

I/E se fitují odděleně. Saldo se získá rozdílem, samostatný model salda není fitován. Poissonova regrese učí míru s vahou populační expozice a převádí ji zpět na počet násobením předchozí populací. Jde o ekvivalent Poissonovy početní ztráty s fixním offsetem až na konstantu; nejde o tvrzení, že rozptyl reálné migrace musí být roven průměru. Modelové Poissonovy intervaly proto nepoužíváme. Lagy druhého proudu u panelových modelů pocházejí také z dřívějšího roku.

Záporné bodové předpovědi se jednotně ořezávají na nulu ve všech historických i finálních bězích. Není použita transformace cíle `log1p`, tedy ani neopravená exponenciální zpětná transformace. Konstantní či nekonvergující místní řada a neplatná predikce jsou označeny `fallback_B1`. Fallback zachovává pokrytí obtížných roků, ale nepočítá se jako úspěšně fitovaný původní model. Výstupy rozlišují požadovaný model a skutečně použitou referenci.

Přesné konfigurace, verze knihoven, semena a per-fit varování jsou v `logs/migration_2022/`. Mřížky jsou malé záměrně: kraj má pouze 22 ročních pozorování. Neuronová síť není použita.

## Stabilizovaný obecní selektor

Chyba každého minulého obecního testu se vydělí tehdy známým průměrem toku za poslední tři roky, nejméně jednou. Pro obec a proud se počítá:

`score = n/(n+10) × local_scaled_MAE + 10/(n+10) × group_scaled_MAE`.

Skupiny mají předem dané hranice `<1000`, `1000–4999`, `>=5000` podle populace známé před predikcí. Minulé skupinové chyby jsou řazeny podle jejich tehdejší populace, ne populace z roku 2022. Trénovaný model musí zlepšit skóre nejlepší z obou referencí alespoň o 10 %. Při shodě rozhoduje pevné pořadí upřednostňující jednodušší model. Kraj používá stejnou referenční bránu na historické MAE bez obecního skupinového vyhlazení. Čísla 10 a 10 % jsou předem zvolená pracovní pravidla, nikoli statistické zákony.

Výstup uchovává lokálního vítěze, vítěze stabilizovaného skóre, vybraný a skutečně použitý model, referenci, počet předchozích testů, variabilitu chyb, zlepšení skóre a důvod fallbacku. Obce mohou mít různý model i pro oba proudy.

## Metriky a pokrytí

MAE a RMSE jsou v počtech. Podepsaná chyba v historických metrikách je **predikce minus skutečnost**. Odchylka 2022 používá opačný směr **skutečnost minus scénář**. MASE dělí absolutní chybu průměrem absolutních meziročních změn ve skutečně dostupné trénovací historii; při nulovém jmenovateli chybí a nevydává se za nulu. MAPE ani procentní chyby salda nejsou kritériem výběru.

Tabulky oddělují vývoj 2010–2014, hodnocení 2015–2021, předcovidové cíle 2015–2019 a covidové 2020–2021. Uvádějí stejné pokrytí kandidátů, počet testovaných let, úspěšných fitů a fallbacků. Souhrny jsou s rovnou vahou obcí a s vahou minulého objemu, celkem i podle velikostních skupin. U měnících se velikostních skupin je rovná váha normalizována podle počtu pozorování každé obce uvnitř skupiny. Zlepšení proti B1/B2 používá přesně stejné řádky a váhy.

## Nejistota a citlivosti

Hlavní informace o nejistotě je **nekalibrované empirické rozpětí sedmi společných ročních scénářů** z chyb poctivého selektoru 2015–2021. Pro každý historický rok se současně vezme celý vektor obcí i obou proudů. Chyba se škáluje poměrem tehdejšího a finálního minulého objemu a přičte k bodové predikci. Záporné I/E se oříznou na nulu, saldo se pak přepočte. Rok se nevybírá pro každou obec zvlášť.

Salda ORP a součty obcí se agregují uvnitř každého společného scénáře a teprve potom se vezme minimum a maximum. Součet obecních mezí není interval součtu. Krajské I/E nemají sumární vazbu k obecním I/E. Intervaly nejsou označeny jako 80% či 95%: sedm nezávislých let neposkytuje spolehlivý odhad ocasu. Omezena je také představa nezávislosti sousedních ročních šoků. Počet případných opakování by nezvýšil počet nezávislých let.

Prospektivní kontrola rozpětí používá pro každý cíl pouze předchozí chyby selektoru a nejméně tři dostupné roky. Dostupné cíle jsou proto 2018–2021. Historické pokrytí tohoto rozpětí je diagnostika s velmi malým počtem nezávislých let, nikoli důkaz 95% kalibrace.

Krajské citlivosti používají stejné zmrazené konfigurace: start 2001, novější historii od 2010 a predikci z konce 2019 až do 2022 ve třech kalendářních krocích. Vynechané covidové roky se neslepují jako sousední roky. Rekurzivní modely drží populaci na posledním známém stavu. Citlivosti se nevybírají podle skutečnosti 2022.

Obecní citlivosti ponechávají původně vybranou rodinu každé obce a proudu. Přefitují ji na souvislých oknech 2001–2021, 2010–2021 a 2000–2019. Poslední varianta předpovídá tři kalendářní kroky; panelový model se fituje jen jednou a pro další kroky se použije vlastní párová historie předpovězených I/E dané rodiny. Škálovač, obecní efekty a model zůstávají zmrazeny, populace zůstává na posledním dostupném roce 2019. Nevzniká fit na syntetických cílech. Lokální časové modely použijí přímou tříkrokovou prognózu, B1/B2 konstantní víceletou referenci. Jde o citlivost na vynechání covidových hodnot při ponechání konfigurace a volby modelu z hlavního experimentu. Volba rodiny mohla využít chyby do 2021, proto tato varianta není simulací skutečně vybrané prognózy vydané v roce 2019.

Bodové predikce představují očekávané počty a mohou být necelé. Saldo a odchylky se počítají z nezaokrouhlených hodnot; zaokrouhlení v textových tabulkách slouží pouze zobrazení.

## Tři oddělená srovnání 2022

**Konečná skutečnost.** Kraj a obce se připojí až po zmrazení scénáře. Odchylky nejsou testem pozorovaného kontrafaktuálu bez šoku.

**Předběžný benchmark bez DO.** Původní předběžné tabulky výslovně vylučují dočasnou ochranu. Stále obsahují jiné ukrajinské migranty, nepřímé válečné vlivy a jinou datovou revizi. Kraj porovnává shodně definované I/E/S, 16 SO ORP pouze konzistentně agregované saldo. Hodnota ORP není přiřazena městu stejného názvu.

**Obecní podpůrná souvislost.** MV je evidenční stav oprávnění publikovaný pro 31. 12. 2022; interní list uvádí 30 a soubor vznikl ráno 31. 12., proto netvrdíme konec dne. Řádky městských částí se sčítají podle obecního kódu. Z 354 obcí je ve zdroji 273; 81 nepřítomných obcí zůstává chybějících, nikoli nulových. Ukazujeme Pearsonovu a Spearmanovu asociaci v počtech, na předšokovou populaci a po statistické kontrole velikosti a historického objemu. Jde o popisnou prostorovou souvislost na pozorované části obcí. Neúplné pokrytí může ovlivnit výsledek.

MV stav nelze odečíst od ročního toku. ČSÚ má pro zahrnutí DO podmínku platnosti na konci roku a žádosti o prodloužení do konce března 2023. Občanství, země předchozího pobytu a DO jsou odlišné klasifikace. Přímé srovnatelné roční obecní toky podle ukrajinského občanství/DO nejsou v této analýze doloženy. Krajská UA čísla se nerozdělují uměle do obcí. Zdrojové buňky a definice jsou v `SOURCE_NOTES.md`.

## Reprodukce a ochrana mapy

Analýza vznikla ve větvi `analysis/migration-2022` a její zveřejněné výstupy byly 24. 10. 2026 sloučeny do `main`. Zprávy a grafy jsou v `reports/migration_2022/`, výsledkové tabulky v `results/migration_2022/` a konfigurace, zdrojové hashe a auditní logy v `logs/migration_2022/`. Mapa nadále používá své vlastní vstupy; propojení částí repozitáře popisuje [hlavní README](../../README.md).

**Rozsah reprodukovatelnosti:** trénování proběhlo v původním místním projektu. Publikovaný repozitář obsahuje výstupy a auditní podklady; trénovací kód, modelové checkpointy, `venv` a syrové roční archivy součástí nejsou. Jejich hashe umožňují identifikovat použité verze, ale nenahrazují chybějící soubory. Pro úplný přepočet je potřeba původní místní projekt a jeho vstupy. Spuštění statického serveru podle hlavního README pouze zpřístupní aplikace a přiložené soubory.

Následující příkazy jsou záznamem původního místního běhu. Cesty a skripty v nich odkazují na toto prostředí; nejde o příkazy spustitelné ze samotného klonu publikovaného repozitáře.

Místní kořen: `/Users/hugo/Documents/ChatGPT/Děčín Heckathon/migration_2022_local/`. Prostředí `venv` vychází z dodaného Pythonu 3.12; konkrétní nainstalované verze zaznamenává manifest. Každý skript pracuje s cestami odvozenými od vlastního umístění. Pořadí hlavního výpočtu:

```sh
cd '/Users/hugo/Documents/ChatGPT/Děčín Heckathon/migration_2022_local'
venv/bin/python audit_inputs.py
venv/bin/python region_data/acquire_region.py
venv/bin/python publication.py audit
venv/bin/python region_models/run_region.py
venv/bin/python publication.py region
venv/bin/python municipal_models/run.py
venv/bin/python selector/run_selector.py
venv/bin/python municipal_models/sensitivity.py selector/selected_predictions_2022.csv
venv/bin/python municipal_models/sensitivity_covid.py selector/selected_predictions_2022.csv
venv/bin/python publication.py frozen
# Nyní jsou scénáře a jejich hashe zmrazeny; teprve potom porovnání 2022.
venv/bin/python evaluation/prepare_inputs.py
venv/bin/python evaluation/integrate_evaluation.py
venv/bin/python publication.py evaluation
venv/bin/python verify_results.py
MPLCONFIGDIR=mpl-cache venv/bin/python report/build_report.py
# Z existujícího checkoutu ověřit mapu a uchovat výstup.
(cd ../migration_2022_checkout && node --test tests/radar-*.test.mjs) > map_tests.tap
venv/bin/python publication.py final
```

Manifest zaznamenává stejné příkazy i hashe lokálních skriptů. Provedená validace obsahuje 149 kontrol skriptu a dalších 24 nezávislých kontrol finálního zmrazení; doplňkový audit je v validačním JSON označen samostatně. Veřejný repozitář sám o sobě není plně reprodukovatelný bez uvedeného místního kódu. SHA-256 skriptů zaznamenává použitou verzi, nenahrazuje její dostupnost. Spuštění auditního skriptu při reprodukci přepíše analytické auditní logy, proto reprodukci provádějte v nové kopii pracovního adresáře.
