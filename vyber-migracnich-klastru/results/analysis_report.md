# Časové migrační vzorce obcí Ústeckého kraje

Analýza `a9081db1a25b71e3`; období 2000–2025, 26 pozorovaných roků, nejvýše 25 změn; 354 obcí.

## Globální evidence nepotvrdila statistický objev

**Přistěhovalectví: globální surrogate tail 1.000; evidence není výjimečná vůči zvolenému globálnímu null modelu. Statistický objev se tímto testem nepotvrdil.**

**Odstěhovalectví: globální surrogate tail 1.000; evidence není výjimečná vůči zvolenému globálnímu null modelu. Statistický objev se tímto testem nepotvrdil.**

Skupiny ponechané filtrem robustnosti jsou průzkumné popisy synchronizace. Stabilita sama není statistická významnost. Žádný jednotlivý klastr nemá tímto postupem potvrzenou významnost; globální surrogate tail je navíc aproximativní diagnostikou s omezením použitého null modelu.

## Hlavní zjištění: robustní objev se nepotvrdil

**Přistěhovalectví: nebyla nalezena žádná skupina splňující předem stanovený filtr robustnosti. Všech 354 obcí má ve výsledné konfiguraci UNASSIGNED.**

**Odstěhovalectví: nebyla nalezena žádná skupina splňující předem stanovený filtr robustnosti. Všech 354 obcí má ve výsledné konfiguraci UNASSIGNED.**

Jde o záporný analytický výsledek, nikoli selhání softwaru. Hledání může vytvořit mnoho podobných kandidátních skupin, ale jejich nestabilita neopravňuje k tvrzení společného dlouhodobého vzorce. Prahy jsme nesnížili kvůli vytvoření skupin. Zamítnuté kandidáty lze na mapě prozkoumat pouze jako výslovně označenou průzkumnou vrstvu; nejsou konečnými ověřenými klastry. Nepotvrzení není důkazem, že synchronizované obce neexistují: s dostupnou délkou řad a tímto modelem pro ně nebyla doložena dostatečná robustnost.

## Co výsledek znamená

Klastry popisují synchronizaci změn ve stejných kalendářních letech. Přistěhovalí a odstěhovalí mají samostatné modely a členství. Nejde o skupiny podle absolutního objemu ani o analýzu migračního salda. Jedna obec má v dané verzi a konfiguraci stejné ID ve všech letech; slider pouze čte uložené výsledky. Výsledky jsou průzkumné a synchronizace není důkaz kauzality.

## Metoda a automatická granularita

Hierarchické aglomerativní shlukování používá předem vypočtenou symetrickou vzdálenost mezi kalendářně zarovnanými prvními diferencemi míry migrace na 1 000 obyvatel. Směrová složka porovnává informativní růsty a poklesy; nejistá nula není shoda. Korelační složka kombinuje Pearsonovu a Spearmanovu korelaci robustně škálovaných změn, s převodem `(1-r)/2`; záporná korelace proto zvyšuje vzdálenost. Nedostatečně doložené dvojice mají vzdálenost 1. DTW ani posun kalendáře při shlukování se nepoužívá.

Pro každý směr se porovnává všech 18 kombinací: baseline, EB, reliability × tři váhy směrové složky × average/complete linkage. Každá kombinace hledá řez dendrogramu na nejvýše 32 datově odvozených výškách bez pevného K a bez omezení počtu klastrů. Základní skóre zahrnuje shodu, pokrytí obcí i let, podobnost, oddělení a důkaz nad náhodnou směrovou shodou; penalizuje protichůdné změny a fragmentaci. U každého modelu se posuzují čtyři silné kandidátní řezy pokrývající různé úrovně rozlišení; výběrové skóre přidává `0,20 × blokové ARI + 0,20 × blokové zachování párů + 0,20 × Poissonovo zachování párů`. Osm společných blokových replikací a čtyři společné Poissonovy perturbace počtů porovnávají všech 18 modelů za stejných náhodných změn. Zohlednění obou zdrojů nestability už při výběru omezuje volbu hezky odděleného, ale na drobný početní šum citlivého rozdělení. Zvolený počet je výsledek transparentního cíle, nikoli důkaz jediné přirozené granularity. Loose/balanced/strict jsou uložené konfigurace; makroúroveň je hrubší řez téhož dendrogramu.

## Shrinkage a nejistota

Poisson–Gamma EB používá časově konstantní sdílený prior samostatně pro každý směr. Pro počet Y a expozici E je posterior `Gamma(alpha+Y, beta+E)` ve tvaru shape/rate. Parametry jsou odvozeny momentovou aproximací z meziobecní variability dlouhodobě sdružených sazeb po odečtení odhadovaného Poissonova šumu; beta je omezena na 10–5 000 osoboroků, alpha = mu × beta. Parametry jsou exportovány níže; nejde o ročně měněný regionální prior. Reliability varianta navíc používá ternární směry s prahem modelové nejistoty. Zvolená varianta vyhrála zveřejněné vícekriteriální srovnání, nikoli obecný test nadřazenosti EB.

## Přistěhovalectví

Zvolený model: **shrinkage**, linkage **average**, váha směru **0.85**, výška řezu **0.302**. Automaticky vzniklo **0 mikroklastrů**, 0 makroklastrů; přiřazeno **0** obcí (0.0 %), nepřiřazeno **354**.

| Metrika | Hodnota |
| --- | --- |
| agreement | 0.000 |
| opposite | 0.000 |
| within_similarity | 0.000 |
| separation | 0.000 |
| informative_coverage | 0.000 |
| chance_agreement | 0.500 |
| evidence_statistic | 0.000 |
| silhouette | — |
| fragmentation | 0.000 |
| minimum_group | 0.000 |
| maximum_group | 0.000 |

Kandidátní rozdělení před filtrem: blokové ARI 0.172 (SD 0.038); zachování vnitroklastrových párů 23.9 %; replikací 32. Parametrická Poissonova perturbace: ARI 0.042, zachování párů 5.3 %.

Globální přibližný null tail **1.000**, 39 surrogátů, rozlišení 0.025; pozorovaná evidence 0.256. V každém surrogátu se maximalizuje evidence přes celou rodinu variant, vah, linkage a výšek mřížky řezů; proti tomuto maximu se porovnává evidence skutečně zvoleného modelu. Nejde o test významnosti jednotlivých klastrů.

Uložené konfigurace (kandidátní úroveň je výslovně průzkumná):

| Konfigurace | Ponechané mikro K | Makro K | Přiřazeno | Kandidátní mikro K | Kandidátní makro K | Výška mikro | Výška makro |
| --- | --- | --- | --- | --- | --- | --- | --- |
| loose | 0 | 0 | 0 | 110 | 40 | 0.302 | 0.393 |
| balanced | 0 | 0 | 0 | 110 | 40 | 0.302 | 0.393 |
| strict | 0 | 0 | 0 | 105 | 75 | 0.247 | 0.327 |

Parametry konstantního prioru (alpha shape, beta rate/expozice; mu v událostech na osoborok):

| Parametr | Hodnota |
| --- | --- |
| alpha | 5.137455 |
| beta | 166.026687 |
| mu | 0.030944 |
| between_municipality_variance | 0.000186 |
| exposure_unit | person-year; rates per 1000 residents |
| variance_inflation | 1.000000 |

Před filtrem: 110 kandidátních skupin a 342 přiřazených obcí. Vyřazeno 110 skupin (342 obcí). Skupina se ponechá pouze při zachování párů alespoň 0,50 v blokové i Poissonově perturbaci a mediánu alespoň 8 informativních roků. Členové vyřazených skupin jsou UNASSIGNED. Toto je transparentní filtr robustnosti, nikoli test významnosti. Stejné replikace slouží k filtrování i vykázání stability, takže stabilita ponechaných skupin není nezávislým validačním odhadem. Globální ARI a tail výše hodnotí kandidátní model před filtrem; tabulka skupin níže uvádí ponechané skupiny.

### Porovnání všech kandidátů před filtrem

| Varianta | Váha | Linkage | K | Přiřazeno | Shoda | Opačné | ARI výběru | Blokové páry výběru | Poissonovy páry výběru | Skóre | Vybrán |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | 0.6 | average | 117 | 332 | 0.767 | 0.233 | 0.160 | 0.263 | 0.066 | 0.696 |  |
| baseline | 0.6 | complete | 128 | 344 | 0.767 | 0.233 | 0.162 | 0.225 | 0.051 | 0.691 |  |
| baseline | 0.7 | average | 115 | 337 | 0.767 | 0.233 | 0.176 | 0.263 | 0.061 | 0.704 |  |
| baseline | 0.7 | complete | 130 | 342 | 0.778 | 0.222 | 0.172 | 0.234 | 0.051 | 0.700 |  |
| baseline | 0.85 | average | 119 | 334 | 0.777 | 0.223 | 0.169 | 0.251 | 0.061 | 0.704 |  |
| baseline | 0.85 | complete | 124 | 346 | 0.774 | 0.226 | 0.159 | 0.193 | 0.046 | 0.693 |  |
| shrinkage | 0.6 | average | 113 | 323 | 0.770 | 0.230 | 0.168 | 0.270 | 0.064 | 0.695 |  |
| shrinkage | 0.6 | complete | 127 | 339 | 0.772 | 0.228 | 0.166 | 0.217 | 0.059 | 0.692 |  |
| shrinkage | 0.7 | average | 113 | 329 | 0.774 | 0.226 | 0.172 | 0.263 | 0.066 | 0.703 |  |
| shrinkage | 0.7 | complete | 124 | 337 | 0.776 | 0.224 | 0.164 | 0.217 | 0.056 | 0.694 |  |
| shrinkage | 0.85 | average | 110 | 342 | 0.767 | 0.233 | 0.178 | 0.241 | 0.048 | 0.705 | ano |
| shrinkage | 0.85 | complete | 118 | 348 | 0.767 | 0.233 | 0.157 | 0.183 | 0.041 | 0.690 |  |
| reliability | 0.6 | average | 35 | 70 | 0.992 | 0.008 | 0.096 | 0.250 | 0.093 | 0.572 |  |
| reliability | 0.6 | complete | 32 | 64 | 0.997 | 0.003 | 0.088 | 0.242 | 0.070 | 0.566 |  |
| reliability | 0.7 | average | 35 | 71 | 0.989 | 0.011 | 0.094 | 0.236 | 0.081 | 0.573 |  |
| reliability | 0.7 | complete | 32 | 64 | 0.997 | 0.003 | 0.088 | 0.238 | 0.070 | 0.571 |  |
| reliability | 0.85 | average | 32 | 65 | 0.997 | 0.003 | 0.083 | 0.232 | 0.059 | 0.574 |  |
| reliability | 0.85 | complete | 32 | 64 | 1.000 | 0.000 | 0.084 | 0.223 | 0.062 | 0.573 |  |

Kompletní zkoušené výšky řezů: `cut_search_immigration.csv`.

### Všechny skupiny a jejich kvalita

| ID | Obcí | Shoda | Opačné | Podobnost | Informativní roky (medián) | Blokové páry | Poissonovy páry | Nízká důvěra |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

**Záporný výsledek pro přistěhovalectví: 0 ponechaných skupin.** Kandidátní rozdělení nesplnilo požadavek robustnosti; maximální Poissonovo zachování párů mezi vyřazenými skupinami je 0.250 proti prahu 0,500. Vyřazené skupiny jsou pouze průzkumné kandidáty.

Rozsah maximálních null statistik: 0.258922–0.270709; pozorovaná kandidátní evidence 0.256224. Pozorovaná evidence není výjimečně vysoká vůči zvolenému globálnímu surrogate null; výsledek nepodporuje tvrzení statistického objevu.

### Vyřazené kandidátní skupiny — nejsou potvrzeným objevem

Níže jsou přímo uvedeny blokové i Poissonovy míry zachování párů. Každá skupina selhala alespoň v jednom filtru.

| ID kandidáta | Obcí | Blokové páry | Poissonovy páry | Informativní roky | Obce |
| --- | --- | --- | --- | --- | --- |
| IMM-001 | 2 | 0.312 | 0.100 | 24.5 | Jenčice (505528), Radovesice (565521) |
| IMM-002 | 2 | 0.656 | 0.000 | 25.0 | Janská (530395), Malšovice (562718) |
| IMM-003 | 2 | 0.438 | 0.000 | 25.0 | Doubice (530417), Kostomlaty pod Řípem (565059) |
| IMM-004 | 4 | 0.172 | 0.050 | 25.0 | Miřejovice (530506), Blšany u Loun (542547), Velké Žernoseky (565857), Lišnice (567248) |
| IMM-005 | 3 | 0.292 | 0.133 | 25.0 | Kozly (530557), Mašťov (563218), Mnetěš (565300) |
| IMM-006 | 2 | 0.188 | 0.000 | 24.5 | Želkovice (530565), Libochovany (565156) |
| IMM-007 | 4 | 0.297 | 0.067 | 24.5 | Čeradice (530581), Verneřice (562921), Ctiněves (564672), Třebušín (565792) |
| IMM-008 | 2 | 0.250 | 0.050 | 25.0 | Libočany (530590), Starý Šachov (545538) |
| IMM-009 | 5 | 0.163 | 0.025 | 25.0 | Zálužice (530603), Rumburk (562777), Velký Šenov (562912), Domašín (563048), Libouchec (568058) |
| IMM-010 | 5 | 0.216 | 0.045 | 25.0 | Přestanov (530620), Račetice (546071), Jiříkov (562581), Blatno (562998), Louka u Litvínova (567272) |
| IMM-011 | 2 | 0.250 | 0.050 | 25.0 | Trnovany (542407), Roudnice nad Labem (565555) |
| IMM-012 | 4 | 0.349 | 0.042 | 25.0 | Černouček (542423), Opočno (542555), Pesvice (546062), Korozluky (567221) |
| IMM-013 | 3 | 0.156 | 0.000 | 25.0 | Oleško (542440), Lobendava (545708), Rokle (563331) |
| IMM-014 | 2 | 0.250 | 0.000 | 25.0 | Záluží (542482), Deštnice (566128) |
| IMM-015 | 4 | 0.214 | 0.158 | 25.0 | Malíč (542491), Vysoká Pec (563501), Koštice (566284), Řehlovice (568201) |
| IMM-016 | 3 | 0.167 | 0.067 | 25.0 | Michalovice (542521), Lukavec (565237), Světec (567841) |
| IMM-017 | 4 | 0.214 | 0.025 | 25.0 | Píšťany (542539), Srbská Kamenice (546348), Křesín (565075), Peruc (566551) |
| IMM-018 | 2 | 0.344 | 0.050 | 25.0 | Cítoliby (542571), Kryry (566314) |
| IMM-019 | 4 | 0.234 | 0.017 | 25.0 | Obora (542580), Otvice (563277), Kyškovice (565091), Tisá (568309) |
| IMM-020 | 3 | 0.167 | 0.067 | 25.0 | Černčice (542628), Vrbičany (565903), Lipno (566403) |
| IMM-021 | 2 | 0.469 | 0.050 | 24.0 | Nová Ves (542636), Heřmanov (562483) |
| IMM-022 | 3 | 0.135 | 0.050 | 25.0 | Žerotín (543012), Okounov (563269), Veltěže (566896) |
| IMM-023 | 4 | 0.203 | 0.017 | 25.0 | Staňkovice (543128), Chbany (563081), Lužice (567281), Duchcov (567515) |
| IMM-024 | 3 | 0.198 | 0.067 | 25.0 | Bynovec (544647), Loučná pod Klínovcem (546518), Hrobčice (567566) |
| IMM-025 | 3 | 0.219 | 0.033 | 25.0 | Janov (544680), Bělušice (567051), Mariánské Radčice (567302) |
| IMM-026 | 2 | 0.125 | 0.050 | 25.0 | Labská Stráň (544701), Březno (563013) |
| IMM-027 | 2 | 0.188 | 0.100 | 25.0 | Markvartice (545678), Býčkovice (546780) |
| IMM-028 | 4 | 0.276 | 0.017 | 25.0 | Dobrná (545783), Horní Řepčice (546763), Veliká Ves (563412), Nepomyšl (566501) |
| IMM-029 | 6 | 0.221 | 0.060 | 25.0 | Merboltice (545791), Mikulášovice (562751), Dušníky (564818), Slatina (565601), Žabovřesky nad Ohří (565938), Hora Svaté Kateřiny (567167) |
| IMM-030 | 6 | 0.213 | 0.057 | 25.0 | Dolní Habartice (545856), Chřibská (562530), Hrušovany (563072), Dobříň (564745), Újezdeček (567850), Žalany (567876) |
| IMM-031 | 5 | 0.184 | 0.080 | 25.0 | Františkov nad Ploučnicí (545899), Dolní Poustevna (562441), Kadaň (563102), Klášterec nad Ohří (563129), Bechlín (564575) |
| IMM-032 | 3 | 0.115 | 0.017 | 25.0 | Jimlín (546011), Chraberce (546429), Bitozeves (565997) |
| IMM-033 | 3 | 0.240 | 0.067 | 25.0 | Nezabylice (546160), Křimov (563161), Všehrdy (563471) |
| IMM-034 | 2 | 0.438 | 0.000 | 25.0 | Úherce (546178), Břvany (566063) |
| IMM-035 | 4 | 0.453 | 0.050 | 25.0 | Ryjice (546186), Trmice (553697), Veselé (562939), Žitenice (565962) |
| IMM-036 | 2 | 0.375 | 0.000 | 25.0 | Kunratice (546330), Doksany (564753) |
| IMM-037 | 3 | 0.115 | 0.017 | 25.0 | Kámen (546453), Brňany (564613), Třebívlice (565776) |
| IMM-038 | 7 | 0.198 | 0.064 | 25.0 | Ludvíkovice (546496), Děčín (562335), Boleboř (563005), Most (567027), Teplice (567442), Bílina (567451), Velké Březno (568350) |
| IMM-039 | 4 | 0.333 | 0.075 | 25.0 | Lkáň (546691), Kalek (563111), Lišany (566411), Výškov (566951) |
| IMM-040 | 2 | 0.438 | 0.000 | 25.0 | Sedlec (546721), Stebno (546925) |
| IMM-041 | 3 | 0.250 | 0.100 | 25.0 | Brzánky (546755), Budyně nad Ohří (564656), Podsedice (565415) |
| IMM-042 | 3 | 0.302 | 0.067 | 25.0 | Kamýk (546771), Podbořanský Rohozec (566608), Srbice (567833) |
| IMM-043 | 2 | 0.250 | 0.050 | 24.5 | Chudoslavice (546810), Petrovice (568147) |
| IMM-044 | 2 | 0.125 | 0.000 | 24.0 | Staňkovice (546828), Úštěk (565814) |
| IMM-045 | 4 | 0.333 | 0.025 | 25.0 | Černěves (546852), Libořice (566381), Vrbno nad Lesy (566926), Zubrnice (568384) |
| IMM-046 | 2 | 0.250 | 0.000 | 25.0 | Dobroměřice (546861), Kleneč (565032) |
| IMM-047 | 4 | 0.281 | 0.058 | 25.0 | Líšťany (546879), Domoušice (566152), Havraň (567141), Homole u Panny (567973) |
| IMM-048 | 4 | 0.208 | 0.092 | 25.0 | Vršovice (546887), Jiřetín pod Jedlovou (562572), Bílence (562980), Chotiněves (564966) |
| IMM-049 | 2 | 0.062 | 0.000 | 25.0 | Lukov (546909), Klapý (565024) |
| IMM-050 | 4 | 0.182 | 0.058 | 25.0 | Ústí nad Labem (554804), Jirkov (563099), Smolnice (566721), Krupka (567639) |
| IMM-051 | 2 | 0.219 | 0.100 | 25.0 | Těchlovice (555193), Tuchořice (566853) |
| IMM-052 | 4 | 0.229 | 0.067 | 25.0 | Arnoltice (562343), Hrobce (564893), Počedělice (566586), Bžany (567485) |
| IMM-053 | 4 | 0.219 | 0.083 | 25.0 | Benešov nad Ploučnicí (562351), Malá Veleň (562700), Chodouny (564923), Nové Sedlo (566519) |
| IMM-054 | 2 | 0.125 | 0.050 | 25.0 | Česká Kamenice (562394), Meziboří (567311) |
| IMM-055 | 3 | 0.219 | 0.017 | 25.0 | Dobkovice (562408), Malé Žernoseky (565245), Toužetín (566829) |
| IMM-056 | 5 | 0.222 | 0.075 | 25.0 | Dolní Podluží (562432), Málkov (563200), Lenešice (566322), Růžová (566900), Chuderov (568023) |
| IMM-057 | 4 | 0.177 | 0.042 | 25.0 | Horní Podluží (562505), Radonice (563323), Račiněves (565491), Sulejovice (565695) |
| IMM-058 | 4 | 0.312 | 0.017 | 25.0 | Hřensko (562513), Křešice (565083), Polepy (565431), Dolní Zálezly (567931) |
| IMM-059 | 3 | 0.344 | 0.083 | 25.0 | Huntířov (562521), Polerady (567353), Želenice (567426) |
| IMM-060 | 3 | 0.167 | 0.000 | 25.0 | Jetřichovice (562556), Jílové (562564), Lovečkovice (565211) |
| IMM-061 | 5 | 0.181 | 0.035 | 25.0 | Kytlice (562645), Libědice (563188), Hřivice (566217), Litvínov (567256), Moldava (567728) |
| IMM-062 | 2 | 0.344 | 0.000 | 25.0 | Lipová (562661), Čížkovice (564711) |
| IMM-063 | 3 | 0.333 | 0.050 | 25.0 | Rybniště (562793), Místo (563242), Vrbice (565890) |
| IMM-064 | 2 | 0.094 | 0.000 | 25.0 | Staré Křečany (562823), Přestavlky (565474) |
| IMM-065 | 6 | 0.208 | 0.047 | 25.0 | Šluknov (562858), Valkeřice (562874), Petrohrad (566560), Bečov (567043), Novosedlice (567752), Žim (567884) |
| IMM-066 | 2 | 0.156 | 0.000 | 25.0 | Varnsdorf (562882), Háj u Duchcova (567523) |
| IMM-067 | 2 | 0.312 | 0.050 | 25.0 | Velká Bukovina (562891), Vrskmaň (563463) |
| IMM-068 | 3 | 0.135 | 0.017 | 25.0 | Vilémov (562947), Jeníkov (567582), Malečov (568104) |
| IMM-069 | 4 | 0.156 | 0.067 | 25.0 | Chomutov (562971), Terezín (565717), Úpohlavy (565806), Vědomice (565831) |
| IMM-070 | 3 | 0.271 | 0.150 | 25.0 | Droužkovice (563056), Litoměřice (564567), Tašov (568287) |
| IMM-071 | 2 | 0.312 | 0.050 | 25.0 | Hora Svatého Šebestiána (563064), Postoloprty (566624) |
| IMM-072 | 2 | 0.188 | 0.000 | 25.0 | Kovářská (563137), Spořice (563340) |
| IMM-073 | 4 | 0.214 | 0.050 | 25.0 | Měděnec (563226), Horní Beřkovice (564851), Martiněves (565253), Mšené-lázně (565318) |
| IMM-074 | 3 | 0.125 | 0.133 | 25.0 | Perštejn (563285), Třebenice (565768), Podbořany (566616) |
| IMM-075 | 2 | 0.281 | 0.000 | 25.0 | Pětipsy (563293), Chlumec (568015) |
| IMM-076 | 8 | 0.323 | 0.043 | 25.0 | Strupčice (563358), Černiv (564699), Chotěšov (564940), Ročov (566667), Lom (567264), Obrnice (567337), Kostomlaty pod Milešovkou (567612), Osek (567779) |
| IMM-077 | 4 | 0.240 | 0.025 | 25.0 | Údlice (563382), Libčeves (566349), Lubenec (566438), Očihov (566527) |
| IMM-078 | 6 | 0.206 | 0.070 | 25.0 | Vejprty (563404), Krabčice (565067), Lovosice (565229), Chožov (566241), Panenský Týnec (566535), Žatec (566985) |
| IMM-079 | 4 | 0.208 | 0.050 | 25.0 | Vilémov (563439), Hoštka (564877), Liběšice (565121), Modlany (567710) |
| IMM-080 | 4 | 0.125 | 0.008 | 25.0 | Všestudy (563480), Hlinná (564842), Krásný Dvůr (566306), Vroutek (566934) |
| IMM-081 | 3 | 0.385 | 0.050 | 25.0 | Výsluní (563498), Travčice (565741), Lahošť (567647) |
| IMM-082 | 3 | 0.448 | 0.083 | 25.0 | Bohušovice nad Ohří (564591), Račice (565482), Blatno (566004) |
| IMM-083 | 2 | 0.156 | 0.050 | 25.0 | Brozany nad Ohří (564621), Libotenice (565172) |
| IMM-084 | 2 | 0.031 | 0.100 | 25.0 | Bříza (564648), Levín (565105) |
| IMM-085 | 2 | 0.250 | 0.000 | 25.0 | Děčany (564729), Hostomice (567531) |
| IMM-086 | 2 | 0.125 | 0.050 | 25.0 | Dlažkovice (564737), Vlastislav (565873) |
| IMM-087 | 2 | 0.438 | 0.100 | 25.0 | Drahobuz (564770), Žalhostice (565946) |
| IMM-088 | 2 | 0.156 | 0.050 | 25.0 | Evaň (564834), Hříškov (566195) |
| IMM-089 | 3 | 0.354 | 0.000 | 25.0 | Chodovlice (564931), Mlékojedy (565296), Měcholupy (566454) |
| IMM-090 | 4 | 0.255 | 0.092 | 25.0 | Chotiměř (564958), Bystřany (567477), Ohníč (567761), Habrovany (567957) |
| IMM-091 | 2 | 0.250 | 0.250 | 25.0 | Keblice (565016), Malé Březno (568091) |
| IMM-092 | 3 | 0.198 | 0.033 | 25.0 | Lhotka nad Labem (565113), Louny (565971), Blšany (566021) |
| IMM-093 | 2 | 0.375 | 0.000 | 25.0 | Libkovice pod Řípem (565148), Snědovice (565610) |
| IMM-094 | 5 | 0.397 | 0.060 | 25.0 | Libochovice (565164), Straškov-Vodochody (565679), Štětí (565709), Český Jiřetín (567108), Bořislav (567469) |
| IMM-095 | 2 | 0.406 | 0.050 | 25.0 | Nové Dvory (565342), Brandov (567078) |
| IMM-096 | 2 | 0.188 | 0.050 | 25.0 | Prackovice nad Labem (565458), Proboštov (567787) |
| IMM-097 | 3 | 0.156 | 0.067 | 25.0 | Rochov (565547), Blažim (566012), Slavětín (566713) |
| IMM-098 | 2 | 0.281 | 0.050 | 25.0 | Siřejovice (565598), Nová Ves v Horách (567329) |
| IMM-099 | 2 | 0.281 | 0.000 | 25.0 | Vchynice (565865), Ledvice (567655) |
| IMM-100 | 3 | 0.177 | 0.050 | 25.0 | Vražkov (565881), Malé Březno (567299), Rtyně nad Bílinou (567809) |
| IMM-101 | 3 | 0.271 | 0.050 | 25.0 | Vrutice (565911), Vinařice (566918), Zbrašín (566977) |
| IMM-102 | 2 | 0.219 | 0.100 | 24.5 | Židovice (565954), Skršín (567361) |
| IMM-103 | 2 | 0.594 | 0.100 | 24.5 | Holedeč (566187), Kladruby (567604) |
| IMM-104 | 3 | 0.146 | 0.050 | 25.0 | Chlumčany (566233), Liběšice (566357), Košťany (567621) |
| IMM-105 | 2 | 0.281 | 0.050 | 25.0 | Pnětluky (566578), Horní Jiřetín (567175) |
| IMM-106 | 2 | 0.375 | 0.150 | 25.0 | Raná (566659), Klíny (567191) |
| IMM-107 | 3 | 0.083 | 0.067 | 25.0 | Žiželice (567019), Braňany (567060), Patokryje (567345) |
| IMM-108 | 2 | 0.094 | 0.050 | 25.0 | Hrob (567558), Telnice (568295) |
| IMM-109 | 3 | 0.375 | 0.033 | 25.0 | Měrunice (567698), Zabrušany (567868), Chabařovice (568007) |
| IMM-110 | 2 | 0.125 | 0.000 | 25.0 | Mikulov (567701), Povrly (568155) |

### Nepřiřazené a méně spolehlivé obce

**UNASSIGNED:** Jenčice (505528), Janská (530395), Doubice (530417), Miřejovice (530506), Kozly (530557), Želkovice (530565), Čeradice (530581), Libočany (530590), Zálužice (530603), Přestanov (530620), Trnovany (542407), Černouček (542423), Oleško (542440), Záluží (542482), Malíč (542491), Michalovice (542521), Píšťany (542539), Blšany u Loun (542547), Opočno (542555), Cítoliby (542571), Obora (542580), Černčice (542628), Nová Ves (542636), Žerotín (543012), Staňkovice (543128), Bynovec (544647), Janov (544680), Labská Stráň (544701), Starý Šachov (545538), Markvartice (545678), Lobendava (545708), Dobrná (545783), Merboltice (545791), Dolní Habartice (545856), Františkov nad Ploučnicí (545899), Horní Habartice (545929), Jimlín (546011), Pesvice (546062), Račetice (546071), Nezabylice (546160), Úherce (546178), Ryjice (546186), Kunratice (546330), Srbská Kamenice (546348), Chraberce (546429), Volevčice (546437), Kámen (546453), Ludvíkovice (546496), Loučná pod Klínovcem (546518), Lkáň (546691), Sedlec (546721), Brzánky (546755), Horní Řepčice (546763), Kamýk (546771), Býčkovice (546780), Chudoslavice (546810), Staňkovice (546828), Černěves (546852), Dobroměřice (546861), Líšťany (546879), Vršovice (546887), Brodec (546895), Lukov (546909), Stebno (546925), Dolánky nad Ohří (553646), Trmice (553697), Ústí nad Labem (554804), Těchlovice (555193), Velké Chvojno (555223), Děčín (562335), Arnoltice (562343), Benešov nad Ploučnicí (562351), Česká Kamenice (562394), Dobkovice (562408), Dolní Podluží (562432), Dolní Poustevna (562441), Heřmanov (562483), Horní Podluží (562505), Hřensko (562513), Huntířov (562521), Chřibská (562530), Jetřichovice (562556), Jílové (562564), Jiřetín pod Jedlovou (562572), Jiříkov (562581), Krásná Lípa (562611), Kytlice (562645), Lipová (562661), Malá Veleň (562700), Malšovice (562718), Mikulášovice (562751), Rumburk (562777), Rybniště (562793), Staré Křečany (562823), Šluknov (562858), Valkeřice (562874), Varnsdorf (562882), Velká Bukovina (562891), Velký Šenov (562912), Verneřice (562921), Veselé (562939), Vilémov (562947), Chomutov (562971), Bílence (562980), Blatno (562998), Boleboř (563005), Březno (563013), Černovice (563021), Domašín (563048), Droužkovice (563056), Hora Svatého Šebestiána (563064), Hrušovany (563072), Chbany (563081), Jirkov (563099), Kadaň (563102), Kalek (563111), Klášterec nad Ohří (563129), Kovářská (563137), Křimov (563161), Libědice (563188), Málkov (563200), Mašťov (563218), Měděnec (563226), Místo (563242), Okounov (563269), Otvice (563277), Perštejn (563285), Pětipsy (563293), Kryštofovy Hamry (563315), Radonice (563323), Rokle (563331), Spořice (563340), Strupčice (563358), Údlice (563382), Vejprty (563404), Veliká Ves (563412), Vilémov (563439), Vrskmaň (563463), Všehrdy (563471), Všestudy (563480), Výsluní (563498), Vysoká Pec (563501), Litoměřice (564567), Bechlín (564575), Bohušovice nad Ohří (564591), Brňany (564613), Brozany nad Ohří (564621), Bříza (564648), Budyně nad Ohří (564656), Ctiněves (564672), Černiv (564699), Čížkovice (564711), Děčany (564729), Dlažkovice (564737), Dobříň (564745), Doksany (564753), Drahobuz (564770), Dušníky (564818), Evaň (564834), Hlinná (564842), Horní Beřkovice (564851), Hoštka (564877), Hrobce (564893), Chodouny (564923), Chodovlice (564931), Chotěšov (564940), Chotiměř (564958), Chotiněves (564966), Keblice (565016), Klapý (565024), Kleneč (565032), Kostomlaty pod Řípem (565059), Krabčice (565067), Křesín (565075), Křešice (565083), Kyškovice (565091), Levín (565105), Lhotka nad Labem (565113), Liběšice (565121), Libkovice pod Řípem (565148), Libochovany (565156), Libochovice (565164), Libotenice (565172), Lovečkovice (565211), Lovosice (565229), Lukavec (565237), Malé Žernoseky (565245), Martiněves (565253), Mlékojedy (565296), Mnetěš (565300), Mšené-lázně (565318), Nové Dvory (565342), Ploskovice (565393), Podsedice (565415), Polepy (565431), Prackovice nad Labem (565458), Přestavlky (565474), Račice (565482), Račiněves (565491), Radovesice (565521), Rochov (565547), Roudnice nad Labem (565555), Siřejovice (565598), Slatina (565601), Snědovice (565610), Straškov-Vodochody (565679), Sulejovice (565695), Štětí (565709), Terezín (565717), Travčice (565741), Třebenice (565768), Třebívlice (565776), Třebušín (565792), Úpohlavy (565806), Úštěk (565814), Vědomice (565831), Velemín (565849), Velké Žernoseky (565857), Vchynice (565865), Vlastislav (565873), Vražkov (565881), Vrbice (565890), Vrbičany (565903), Vrutice (565911), Žabovřesky nad Ohří (565938), Žalhostice (565946), Židovice (565954), Žitenice (565962), Louny (565971), Bitozeves (565997), Blatno (566004), Blažim (566012), Blšany (566021), Břvany (566063), Deštnice (566128), Domoušice (566152), Holedeč (566187), Hříškov (566195), Hřivice (566217), Chlumčany (566233), Chožov (566241), Koštice (566284), Krásný Dvůr (566306), Kryry (566314), Lenešice (566322), Libčeves (566349), Liběšice (566357), Libořice (566381), Lipno (566403), Lišany (566411), Lubenec (566438), Měcholupy (566454), Nepomyšl (566501), Nové Sedlo (566519), Očihov (566527), Panenský Týnec (566535), Peruc (566551), Petrohrad (566560), Pnětluky (566578), Počedělice (566586), Podbořanský Rohozec (566608), Podbořany (566616), Postoloprty (566624), Raná (566659), Ročov (566667), Slavětín (566713), Smolnice (566721), Toužetín (566829), Tuchořice (566853), Velemyšleves (566870), Veltěže (566896), Růžová (566900), Vinařice (566918), Vrbno nad Lesy (566926), Vroutek (566934), Výškov (566951), Zbrašín (566977), Žatec (566985), Žiželice (567019), Most (567027), Bečov (567043), Bělušice (567051), Braňany (567060), Brandov (567078), Český Jiřetín (567108), Havraň (567141), Hora Svaté Kateřiny (567167), Horní Jiřetín (567175), Klíny (567191), Korozluky (567221), Lišnice (567248), Litvínov (567256), Lom (567264), Louka u Litvínova (567272), Lužice (567281), Malé Březno (567299), Mariánské Radčice (567302), Meziboří (567311), Nová Ves v Horách (567329), Obrnice (567337), Patokryje (567345), Polerady (567353), Skršín (567361), Želenice (567426), Teplice (567442), Bílina (567451), Bořislav (567469), Bystřany (567477), Bžany (567485), Dubí (567507), Duchcov (567515), Háj u Duchcova (567523), Hostomice (567531), Hrob (567558), Hrobčice (567566), Jeníkov (567582), Kladruby (567604), Kostomlaty pod Milešovkou (567612), Košťany (567621), Krupka (567639), Lahošť (567647), Ledvice (567655), Měrunice (567698), Mikulov (567701), Modlany (567710), Moldava (567728), Novosedlice (567752), Ohníč (567761), Osek (567779), Proboštov (567787), Rtyně nad Bílinou (567809), Srbice (567833), Světec (567841), Újezdeček (567850), Zabrušany (567868), Žalany (567876), Žim (567884), Dolní Zálezly (567931), Habrovany (567957), Homole u Panny (567973), Chabařovice (568007), Chlumec (568015), Chuderov (568023), Libouchec (568058), Malé Březno (568091), Malečov (568104), Petrovice (568147), Povrly (568155), Řehlovice (568201), Tašov (568287), Telnice (568295), Tisá (568309), Velké Březno (568350), Zubrnice (568384)

**Skupiny s nízkou důvěrou:** Žádné.

**Obce v těchto skupinách:** Žádné.

### Pouze průzkumné pořadí zamítnutých kandidátů

Žádná skupina nebyla ponechána. Následující nejsilnější a nejslabší položky jsou relativním pořadím zamítnutých kandidátů; nejsou úspěšně ověřenými klastry.

### Nejsilnější zamítnuté průzkumné kandidáty podle blokové stability a podobnosti

- **IMM-002**: 2 obcí, stabilita párů 65.6 %, podobnost 0.869; medoid Janská (530395). Nejsilnější členové: Janská (530395), Malšovice (562718). Nejslabší členové: Malšovice (562718), Janská (530395).

- **IMM-103**: 2 obcí, stabilita párů 59.4 %, podobnost 0.829; medoid Holedeč (566187). Nejsilnější členové: Holedeč (566187), Kladruby (567604). Nejslabší členové: Kladruby (567604), Holedeč (566187).

- **IMM-021**: 2 obcí, stabilita párů 46.9 %, podobnost 0.805; medoid Nová Ves (542636). Nejsilnější členové: Nová Ves (542636), Heřmanov (562483). Nejslabší členové: Heřmanov (562483), Nová Ves (542636).

### Nejslabší zamítnuté průzkumné kandidáty podle blokové stability a podobnosti

- **IMM-084**: 2 obcí, stabilita párů 3.1 %, podobnost 0.724; medoid Bříza (564648). Nejsilnější členové: Bříza (564648), Levín (565105). Nejslabší členové: Levín (565105), Bříza (564648).

- **IMM-049**: 2 obcí, stabilita párů 6.2 %, podobnost 0.734; medoid Lukov (546909). Nejsilnější členové: Lukov (546909), Klapý (565024). Nejslabší členové: Klapý (565024), Lukov (546909).

- **IMM-107**: 3 obcí, stabilita párů 8.3 %, podobnost 0.728; medoid Patokryje (567345). Nejsilnější členové: Patokryje (567345), Braňany (567060), Žiželice (567019). Nejslabší členové: Žiželice (567019), Braňany (567060), Patokryje (567345).

### Skutečné časové vzorce

Roky s největší početní převahou jednoho směru v celé sadě obcí (nejde o odhad příčin):

| Rok | Růst | Pokles | Nerozhodnutelné nebo chybějící |
| --- | --- | --- | --- |
| 2007 | 242 | 111 | 1 |
| 2009 | 111 | 242 | 1 |
| 2023 | 118 | 235 | 1 |
| 2022 | 226 | 127 | 1 |

Průzkumný zamítnutý kandidát: **IMM-002**, exportované synchronní roky: 2001: GROWING (2↑/0↓; synchronizace 100.0 %); 2002: DECLINING (0↑/2↓; synchronizace 100.0 %); 2003: DECLINING (0↑/2↓; synchronizace 100.0 %); 2004: GROWING (2↑/0↓; synchronizace 100.0 %); 2005: DECLINING (0↑/2↓; synchronizace 100.0 %); 2006: GROWING (2↑/0↓; synchronizace 100.0 %); 2007: DECLINING (0↑/2↓; synchronizace 100.0 %); 2009: DECLINING (0↑/2↓; synchronizace 100.0 %); 2010: GROWING (2↑/0↓; synchronizace 100.0 %); 2011: DECLINING (0↑/2↓; synchronizace 100.0 %); 2012: DECLINING (0↑/2↓; synchronizace 100.0 %); 2013: GROWING (2↑/0↓; synchronizace 100.0 %); 2014: DECLINING (0↑/2↓; synchronizace 100.0 %); 2015: DECLINING (0↑/2↓; synchronizace 100.0 %); 2016: GROWING (2↑/0↓; synchronizace 100.0 %); 2018: GROWING (2↑/0↓; synchronizace 100.0 %); 2019: DECLINING (0↑/2↓; synchronizace 100.0 %); 2021: DECLINING (0↑/2↓; synchronizace 100.0 %); 2022: GROWING (2↑/0↓; synchronizace 100.0 %); 2023: DECLINING (0↑/2↓; synchronizace 100.0 %); 2024: GROWING (2↑/0↓; synchronizace 100.0 %); 2025: DECLINING (0↑/2↓; synchronizace 100.0 %).

Průzkumný zamítnutý kandidát: **IMM-103**, exportované synchronní roky: 2001: GROWING (2↑/0↓; synchronizace 100.0 %); 2003: GROWING (2↑/0↓; synchronizace 100.0 %); 2004: DECLINING (0↑/2↓; synchronizace 100.0 %); 2005: GROWING (2↑/0↓; synchronizace 100.0 %); 2006: GROWING (2↑/0↓; synchronizace 100.0 %); 2007: DECLINING (0↑/2↓; synchronizace 100.0 %); 2009: GROWING (2↑/0↓; synchronizace 100.0 %); 2010: DECLINING (0↑/2↓; synchronizace 100.0 %); 2011: DECLINING (0↑/2↓; synchronizace 100.0 %); 2012: DECLINING (0↑/2↓; synchronizace 100.0 %); 2013: GROWING (2↑/0↓; synchronizace 100.0 %); 2014: DECLINING (0↑/2↓; synchronizace 100.0 %); 2016: GROWING (2↑/0↓; synchronizace 100.0 %); 2017: GROWING (2↑/0↓; synchronizace 100.0 %); 2019: GROWING (2↑/0↓; synchronizace 100.0 %); 2020: DECLINING (0↑/2↓; synchronizace 100.0 %); 2022: DECLINING (0↑/2↓; synchronizace 100.0 %); 2023: GROWING (2↑/0↓; synchronizace 100.0 %); 2024: GROWING (2↑/0↓; synchronizace 100.0 %); 2025: GROWING (2↑/0↓; synchronizace 100.0 %).

Průzkumný zamítnutý kandidát: **IMM-021**, exportované synchronní roky: 2003: GROWING (2↑/0↓; synchronizace 100.0 %); 2004: DECLINING (0↑/2↓; synchronizace 100.0 %); 2005: DECLINING (0↑/2↓; synchronizace 100.0 %); 2006: DECLINING (0↑/2↓; synchronizace 100.0 %); 2007: GROWING (2↑/0↓; synchronizace 100.0 %); 2010: GROWING (2↑/0↓; synchronizace 100.0 %); 2011: DECLINING (0↑/2↓; synchronizace 100.0 %); 2013: GROWING (2↑/0↓; synchronizace 100.0 %); 2014: DECLINING (0↑/2↓; synchronizace 100.0 %); 2015: DECLINING (0↑/2↓; synchronizace 100.0 %); 2016: DECLINING (0↑/2↓; synchronizace 100.0 %); 2017: GROWING (2↑/0↓; synchronizace 100.0 %); 2018: DECLINING (0↑/2↓; synchronizace 100.0 %); 2019: DECLINING (0↑/2↓; synchronizace 100.0 %); 2020: DECLINING (0↑/2↓; synchronizace 100.0 %); 2021: DECLINING (0↑/2↓; synchronizace 100.0 %); 2022: GROWING (2↑/0↓; synchronizace 100.0 %); 2023: DECLINING (0↑/2↓; synchronizace 100.0 %); 2025: GROWING (2↑/0↓; synchronizace 100.0 %).

Regionální baseline kandidátního modelu před filtrem: shoda směru s regionem 55.7 %; shoda původních skupin po odečtení regionální změny 70.0 %; ARI nového reziduálního shlukování 0.176. Jde o citlivostní kontrolu, nikoli důkaz nezávislých lokálních mechanismů.

### Citlivost kandidátního modelu před filtrem

Zásah `variance_inflation_2` mění modelovou nejistotu a směrové štítky reliability varianty. U baseline nebo shrinkage, jejichž vzdálenosti tuto nejistotu nepoužívají, je tento zásah neaktivní: ARI = 1 je očekávané a není důkazem robustnosti vůči nadměrnému rozptylu.

| Zásah | ARI | K | Pokrytí |
| --- | --- | --- | --- |
| constant_population_denominator | 0.383 | 107 | 94.1 % |
| variance_inflation_2 | 1.000 | 110 | 96.6 % |
| remove_largest_rate_event | 0.319 | 108 | 97.5 % |

## Odstěhovalectví

Zvolený model: **baseline**, linkage **average**, váha směru **0.85**, výška řezu **0.309**. Automaticky vzniklo **0 mikroklastrů**, 0 makroklastrů; přiřazeno **0** obcí (0.0 %), nepřiřazeno **354**.

| Metrika | Hodnota |
| --- | --- |
| agreement | 0.000 |
| opposite | 0.000 |
| within_similarity | 0.000 |
| separation | 0.000 |
| informative_coverage | 0.000 |
| chance_agreement | 0.500 |
| evidence_statistic | 0.000 |
| silhouette | — |
| fragmentation | 0.000 |
| minimum_group | 0.000 |
| maximum_group | 0.000 |

Kandidátní rozdělení před filtrem: blokové ARI 0.144 (SD 0.035); zachování vnitroklastrových párů 21.4 %; replikací 32. Parametrická Poissonova perturbace: ARI 0.026, zachování párů 3.5 %.

Globální přibližný null tail **1.000**, 39 surrogátů, rozlišení 0.025; pozorovaná evidence 0.248. V každém surrogátu se maximalizuje evidence přes celou rodinu variant, vah, linkage a výšek mřížky řezů; proti tomuto maximu se porovnává evidence skutečně zvoleného modelu. Nejde o test významnosti jednotlivých klastrů.

Uložené konfigurace (kandidátní úroveň je výslovně průzkumná):

| Konfigurace | Ponechané mikro K | Makro K | Přiřazeno | Kandidátní mikro K | Kandidátní makro K | Výška mikro | Výška makro |
| --- | --- | --- | --- | --- | --- | --- | --- |
| loose | 0 | 0 | 0 | 109 | 40 | 0.307 | 0.399 |
| balanced | 0 | 0 | 0 | 107 | 39 | 0.309 | 0.402 |
| strict | 0 | 0 | 0 | 99 | 69 | 0.245 | 0.325 |

Parametry konstantního prioru (alpha shape, beta rate/expozice; mu v událostech na osoborok):

| Parametr | Hodnota |
| --- | --- |
| alpha | 8.665715 |
| beta | 296.459144 |
| mu | 0.029231 |
| between_municipality_variance | 0.000099 |
| exposure_unit | person-year; rates per 1000 residents |
| variance_inflation | 1.000000 |

Před filtrem: 107 kandidátních skupin a 340 přiřazených obcí. Vyřazeno 107 skupin (340 obcí). Skupina se ponechá pouze při zachování párů alespoň 0,50 v blokové i Poissonově perturbaci a mediánu alespoň 8 informativních roků. Členové vyřazených skupin jsou UNASSIGNED. Toto je transparentní filtr robustnosti, nikoli test významnosti. Stejné replikace slouží k filtrování i vykázání stability, takže stabilita ponechaných skupin není nezávislým validačním odhadem. Globální ARI a tail výše hodnotí kandidátní model před filtrem; tabulka skupin níže uvádí ponechané skupiny.

### Porovnání všech kandidátů před filtrem

| Varianta | Váha | Linkage | K | Přiřazeno | Shoda | Opačné | ARI výběru | Blokové páry výběru | Poissonovy páry výběru | Skóre | Vybrán |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | 0.6 | average | 111 | 318 | 0.765 | 0.235 | 0.197 | 0.308 | 0.041 | 0.696 |  |
| baseline | 0.6 | complete | 141 | 317 | 0.790 | 0.210 | 0.192 | 0.313 | 0.025 | 0.694 |  |
| baseline | 0.7 | average | 107 | 324 | 0.761 | 0.239 | 0.199 | 0.265 | 0.037 | 0.691 |  |
| baseline | 0.7 | complete | 140 | 320 | 0.791 | 0.209 | 0.208 | 0.304 | 0.029 | 0.700 |  |
| baseline | 0.85 | average | 107 | 340 | 0.760 | 0.240 | 0.214 | 0.264 | 0.036 | 0.709 | ano |
| baseline | 0.85 | complete | 143 | 324 | 0.793 | 0.207 | 0.194 | 0.294 | 0.028 | 0.701 |  |
| shrinkage | 0.6 | average | 113 | 322 | 0.765 | 0.235 | 0.206 | 0.304 | 0.053 | 0.703 |  |
| shrinkage | 0.6 | complete | 139 | 314 | 0.788 | 0.212 | 0.196 | 0.298 | 0.026 | 0.688 |  |
| shrinkage | 0.7 | average | 112 | 326 | 0.766 | 0.234 | 0.211 | 0.279 | 0.038 | 0.701 |  |
| shrinkage | 0.7 | complete | 141 | 321 | 0.790 | 0.210 | 0.204 | 0.300 | 0.033 | 0.700 |  |
| shrinkage | 0.85 | average | 110 | 335 | 0.763 | 0.237 | 0.217 | 0.273 | 0.034 | 0.708 |  |
| shrinkage | 0.85 | complete | 143 | 323 | 0.793 | 0.207 | 0.195 | 0.293 | 0.029 | 0.701 |  |
| reliability | 0.6 | average | 10 | 21 | 0.989 | 0.011 | 0.234 | 0.396 | 0.042 | 0.595 |  |
| reliability | 0.6 | complete | 11 | 22 | 0.994 | 0.006 | 0.187 | 0.307 | 0.091 | 0.574 |  |
| reliability | 0.7 | average | 10 | 20 | 1.000 | 0.000 | 0.202 | 0.363 | 0.050 | 0.594 |  |
| reliability | 0.7 | complete | 10 | 20 | 1.000 | 0.000 | 0.200 | 0.350 | 0.050 | 0.591 |  |
| reliability | 0.85 | average | 10 | 20 | 1.000 | 0.000 | 0.213 | 0.400 | 0.050 | 0.613 |  |
| reliability | 0.85 | complete | 10 | 20 | 1.000 | 0.000 | 0.197 | 0.350 | 0.050 | 0.600 |  |

Kompletní zkoušené výšky řezů: `cut_search_emigration.csv`.

### Všechny skupiny a jejich kvalita

| ID | Obcí | Shoda | Opačné | Podobnost | Informativní roky (medián) | Blokové páry | Poissonovy páry | Nízká důvěra |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

**Záporný výsledek pro odstěhovalectví: 0 ponechaných skupin.** Kandidátní rozdělení nesplnilo požadavek robustnosti; maximální Poissonovo zachování párů mezi vyřazenými skupinami je 0.250 proti prahu 0,500. Vyřazené skupiny jsou pouze průzkumné kandidáty.

Rozsah maximálních null statistik: 0.261830–0.276185; pozorovaná kandidátní evidence 0.248174. Pozorovaná evidence není výjimečně vysoká vůči zvolenému globálnímu surrogate null; výsledek nepodporuje tvrzení statistického objevu.

### Vyřazené kandidátní skupiny — nejsou potvrzeným objevem

Níže jsou přímo uvedeny blokové i Poissonovy míry zachování párů. Každá skupina selhala alespoň v jednom filtru.

| ID kandidáta | Obcí | Blokové páry | Poissonovy páry | Informativní roky | Obce |
| --- | --- | --- | --- | --- | --- |
| EMI-001 | 3 | 0.104 | 0.050 | 25.0 | Jenčice (505528), Verneřice (562921), Bílence (562980) |
| EMI-002 | 2 | 0.125 | 0.100 | 24.5 | Janská (530395), Starý Šachov (545538) |
| EMI-003 | 2 | 0.062 | 0.000 | 25.0 | Doubice (530417), Lišnice (567248) |
| EMI-004 | 3 | 0.167 | 0.050 | 25.0 | Miřejovice (530506), Mikulášovice (562751), Třebívlice (565776) |
| EMI-005 | 5 | 0.262 | 0.030 | 25.0 | Kozly (530557), Otvice (563277), Rokle (563331), Krupka (567639), Řehlovice (568201) |
| EMI-006 | 5 | 0.231 | 0.025 | 25.0 | Želkovice (530565), Staré Křečany (562823), Droužkovice (563056), Deštnice (566128), Proboštov (567787) |
| EMI-007 | 4 | 0.323 | 0.050 | 25.0 | Čeradice (530581), Horní Habartice (545929), Velký Šenov (562912), Libouchec (568058) |
| EMI-008 | 3 | 0.219 | 0.033 | 25.0 | Libočany (530590), Žerotín (543012), Hrobce (564893) |
| EMI-009 | 2 | 0.281 | 0.000 | 25.0 | Zálužice (530603), Měrunice (567698) |
| EMI-010 | 4 | 0.193 | 0.025 | 25.0 | Přestanov (530620), Prackovice nad Labem (565458), Bečov (567043), Jeníkov (567582) |
| EMI-011 | 2 | 0.125 | 0.000 | 25.0 | Trnovany (542407), Straškov-Vodochody (565679) |
| EMI-012 | 3 | 0.167 | 0.050 | 25.0 | Černouček (542423), Ryjice (546186), Dolní Podluží (562432) |
| EMI-013 | 4 | 0.208 | 0.033 | 25.0 | Oleško (542440), Hřensko (562513), Chotiněves (564966), Meziboří (567311) |
| EMI-014 | 6 | 0.160 | 0.037 | 25.0 | Záluží (542482), Rumburk (562777), Šluknov (562858), Litoměřice (564567), Terezín (565717), Osek (567779) |
| EMI-015 | 3 | 0.396 | 0.050 | 25.0 | Malíč (542491), Křesín (565075), Žim (567884) |
| EMI-016 | 5 | 0.263 | 0.005 | 25.0 | Michalovice (542521), Varnsdorf (562882), Dlažkovice (564737), Holedeč (566187), Peruc (566551) |
| EMI-017 | 4 | 0.141 | 0.017 | 25.0 | Píšťany (542539), Bynovec (544647), Havraň (567141), Mariánské Radčice (567302) |
| EMI-018 | 2 | 0.375 | 0.050 | 25.0 | Blšany u Loun (542547), Žatec (566985) |
| EMI-019 | 3 | 0.250 | 0.033 | 25.0 | Opočno (542555), Lukavec (565237), Chlumec (568015) |
| EMI-020 | 4 | 0.125 | 0.008 | 25.0 | Cítoliby (542571), Valkeřice (562874), Chotěšov (564940), Blatno (566004) |
| EMI-021 | 3 | 0.208 | 0.050 | 25.0 | Obora (542580), Keblice (565016), Liběšice (565121) |
| EMI-022 | 3 | 0.167 | 0.050 | 25.0 | Černčice (542628), Žitenice (565962), Mikulov (567701) |
| EMI-023 | 5 | 0.134 | 0.035 | 25.0 | Nová Ves (542636), Lobendava (545708), Dobrná (545783), Travčice (565741), Chlumčany (566233) |
| EMI-024 | 4 | 0.380 | 0.025 | 25.0 | Staňkovice (543128), Hora Svatého Šebestiána (563064), Křimov (563161), Vrbice (565890) |
| EMI-025 | 2 | 0.250 | 0.000 | 25.0 | Janov (544680), Klapý (565024) |
| EMI-026 | 4 | 0.198 | 0.025 | 25.0 | Labská Stráň (544701), Blažim (566012), Chožov (566241), Lahošť (567647) |
| EMI-027 | 2 | 0.281 | 0.000 | 25.0 | Markvartice (545678), Veliká Ves (563412) |
| EMI-028 | 2 | 0.406 | 0.050 | 25.0 | Merboltice (545791), Zbrašín (566977) |
| EMI-029 | 4 | 0.109 | 0.033 | 25.0 | Dolní Habartice (545856), Stebno (546925), Blšany (566021), Újezdeček (567850) |
| EMI-030 | 3 | 0.135 | 0.000 | 25.0 | Jimlín (546011), Libochovany (565156), Chuderov (568023) |
| EMI-031 | 3 | 0.188 | 0.017 | 25.0 | Pesvice (546062), Brzánky (546755), Vlastislav (565873) |
| EMI-032 | 2 | 0.500 | 0.000 | 24.5 | Račetice (546071), Vršovice (546887) |
| EMI-033 | 3 | 0.177 | 0.017 | 25.0 | Nezabylice (546160), Býčkovice (546780), Bechlín (564575) |
| EMI-034 | 4 | 0.193 | 0.017 | 25.0 | Úherce (546178), Pětipsy (563293), Pnětluky (566578), Bořislav (567469) |
| EMI-035 | 2 | 0.438 | 0.050 | 25.0 | Kunratice (546330), Zabrušany (567868) |
| EMI-036 | 3 | 0.354 | 0.033 | 25.0 | Srbská Kamenice (546348), Kámen (546453), Vědomice (565831) |
| EMI-037 | 2 | 0.281 | 0.000 | 25.0 | Chraberce (546429), Domašín (563048) |
| EMI-038 | 4 | 0.240 | 0.025 | 24.5 | Volevčice (546437), Budyně nad Ohří (564656), Chodovlice (564931), Račice (565482) |
| EMI-039 | 3 | 0.250 | 0.033 | 25.0 | Ludvíkovice (546496), Hrušovany (563072), Kostomlaty pod Milešovkou (567612) |
| EMI-040 | 5 | 0.197 | 0.030 | 25.0 | Loučná pod Klínovcem (546518), Dobříň (564745), Mnetěš (565300), Brandov (567078), Zubrnice (568384) |
| EMI-041 | 6 | 0.283 | 0.047 | 25.0 | Lkáň (546691), Velká Bukovina (562891), Černiv (564699), Třebušín (565792), Velemyšleves (566870), Nová Ves v Horách (567329) |
| EMI-042 | 2 | 0.438 | 0.000 | 24.5 | Sedlec (546721), Vinařice (566918) |
| EMI-043 | 3 | 0.167 | 0.033 | 25.0 | Horní Řepčice (546763), Ctiněves (564672), Podbořanský Rohozec (566608) |
| EMI-044 | 2 | 0.188 | 0.000 | 25.0 | Kamýk (546771), Dolní Zálezly (567931) |
| EMI-045 | 3 | 0.281 | 0.017 | 25.0 | Chudoslavice (546810), Kytlice (562645), Bohušovice nad Ohří (564591) |
| EMI-046 | 5 | 0.184 | 0.035 | 25.0 | Staňkovice (546828), Krásná Lípa (562611), Malá Veleň (562700), Růžová (566900), Kladruby (567604) |
| EMI-047 | 3 | 0.104 | 0.033 | 25.0 | Černěves (546852), Výsluní (563498), Hrob (567558) |
| EMI-048 | 4 | 0.208 | 0.033 | 25.0 | Dobroměřice (546861), Evaň (564834), Želenice (567426), Telnice (568295) |
| EMI-049 | 2 | 0.406 | 0.000 | 24.5 | Brodec (546895), Lovečkovice (565211) |
| EMI-050 | 6 | 0.202 | 0.020 | 25.0 | Lukov (546909), Chodouny (564923), Kostomlaty pod Řípem (565059), Třebenice (565768), Očihov (566527), Malé Březno (568091) |
| EMI-051 | 4 | 0.172 | 0.017 | 25.0 | Dolánky nad Ohří (553646), Kovářská (563137), Hříškov (566195), Tašov (568287) |
| EMI-052 | 4 | 0.141 | 0.042 | 25.0 | Trmice (553697), Těchlovice (555193), Bříza (564648), Roudnice nad Labem (565555) |
| EMI-053 | 3 | 0.219 | 0.200 | 25.0 | Ústí nad Labem (554804), Strupčice (563358), Litvínov (567256) |
| EMI-054 | 2 | 0.094 | 0.000 | 25.0 | Velké Chvojno (555223), Martiněves (565253) |
| EMI-055 | 4 | 0.120 | 0.000 | 25.0 | Děčín (562335), Přestavlky (565474), Louka u Litvínova (567272), Skršín (567361) |
| EMI-056 | 2 | 0.062 | 0.000 | 24.5 | Arnoltice (562343), Malečov (568104) |
| EMI-057 | 2 | 0.125 | 0.100 | 25.0 | Benešov nad Ploučnicí (562351), Louny (565971) |
| EMI-058 | 4 | 0.198 | 0.042 | 25.0 | Česká Kamenice (562394), Lhotka nad Labem (565113), Siřejovice (565598), Štětí (565709) |
| EMI-059 | 5 | 0.172 | 0.050 | 25.0 | Dobkovice (562408), Mašťov (563218), Krabčice (565067), Libčeves (566349), Tuchořice (566853) |
| EMI-060 | 3 | 0.219 | 0.017 | 25.0 | Dolní Poustevna (562441), Radonice (563323), Nové Dvory (565342) |
| EMI-061 | 4 | 0.187 | 0.075 | 25.0 | Heřmanov (562483), Doksany (564753), Křešice (565083), Most (567027) |
| EMI-062 | 2 | 0.344 | 0.050 | 25.0 | Horní Podluží (562505), Panenský Týnec (566535) |
| EMI-063 | 3 | 0.427 | 0.100 | 25.0 | Chřibská (562530), Hostomice (567531), Světec (567841) |
| EMI-064 | 4 | 0.286 | 0.008 | 25.0 | Jetřichovice (562556), Čížkovice (564711), Vražkov (565881), Libořice (566381) |
| EMI-065 | 2 | 0.531 | 0.000 | 25.0 | Jílové (562564), Bělušice (567051) |
| EMI-066 | 3 | 0.260 | 0.067 | 25.0 | Jiřetín pod Jedlovou (562572), Perštejn (563285), Vejprty (563404) |
| EMI-067 | 2 | 0.188 | 0.050 | 25.0 | Jiříkov (562581), Libochovice (565164) |
| EMI-068 | 5 | 0.222 | 0.040 | 25.0 | Lipová (562661), Kryštofovy Hamry (563315), Vilémov (563439), Lubenec (566438), Žiželice (567019) |
| EMI-069 | 6 | 0.129 | 0.013 | 25.0 | Malšovice (562718), Měděnec (563226), Snědovice (565610), Úpohlavy (565806), Vrbičany (565903), Počedělice (566586) |
| EMI-070 | 2 | 0.531 | 0.250 | 25.0 | Rybniště (562793), Klášterec nad Ohří (563129) |
| EMI-071 | 3 | 0.125 | 0.050 | 25.0 | Veselé (562939), Lovosice (565229), Žalany (567876) |
| EMI-072 | 5 | 0.238 | 0.020 | 25.0 | Vilémov (562947), Hlinná (564842), Libotenice (565172), Podsedice (565415), Vrutice (565911) |
| EMI-073 | 5 | 0.209 | 0.070 | 25.0 | Chomutov (562971), Jirkov (563099), Kadaň (563102), Bitozeves (565997), Srbice (567833) |
| EMI-074 | 5 | 0.222 | 0.065 | 25.0 | Blatno (562998), Okounov (563269), Veltěže (566896), Hora Svaté Kateřiny (567167), Horní Jiřetín (567175) |
| EMI-075 | 2 | 0.125 | 0.050 | 25.0 | Boleboř (563005), Velké Březno (568350) |
| EMI-076 | 2 | 0.250 | 0.000 | 25.0 | Březno (563013), Habrovany (567957) |
| EMI-077 | 4 | 0.156 | 0.025 | 25.0 | Černovice (563021), Děčany (564729), Vroutek (566934), Novosedlice (567752) |
| EMI-078 | 2 | 0.344 | 0.200 | 25.0 | Chbany (563081), Ročov (566667) |
| EMI-079 | 4 | 0.156 | 0.017 | 25.0 | Kalek (563111), Vchynice (565865), Výškov (566951), Rtyně nad Bílinou (567809) |
| EMI-080 | 5 | 0.269 | 0.040 | 25.0 | Libědice (563188), Slatina (565601), Měcholupy (566454), Patokryje (567345), Ledvice (567655) |
| EMI-081 | 4 | 0.151 | 0.033 | 25.0 | Místo (563242), Mlékojedy (565296), Lenešice (566322), Modlany (567710) |
| EMI-082 | 2 | 0.188 | 0.000 | 25.0 | Spořice (563340), Povrly (568155) |
| EMI-083 | 3 | 0.240 | 0.017 | 25.0 | Údlice (563382), Lišany (566411), Vrbno nad Lesy (566926) |
| EMI-084 | 3 | 0.427 | 0.033 | 25.0 | Vrskmaň (563463), Úštěk (565814), Domoušice (566152) |
| EMI-085 | 2 | 0.344 | 0.000 | 25.0 | Všehrdy (563471), Drahobuz (564770) |
| EMI-086 | 4 | 0.292 | 0.017 | 25.0 | Všestudy (563480), Hoštka (564877), Lipno (566403), Lužice (567281) |
| EMI-087 | 2 | 0.281 | 0.000 | 25.0 | Vysoká Pec (563501), Obrnice (567337) |
| EMI-088 | 3 | 0.271 | 0.033 | 25.0 | Brňany (564613), Koštice (566284), Podbořany (566616) |
| EMI-089 | 2 | 0.156 | 0.050 | 25.0 | Brozany nad Ohří (564621), Mšené-lázně (565318) |
| EMI-090 | 3 | 0.260 | 0.067 | 25.0 | Horní Beřkovice (564851), Malé Žernoseky (565245), Lom (567264) |
| EMI-091 | 3 | 0.344 | 0.017 | 25.0 | Chotiměř (564958), Račiněves (565491), Krásný Dvůr (566306) |
| EMI-092 | 2 | 0.000 | 0.000 | 24.5 | Kleneč (565032), Sulejovice (565695) |
| EMI-093 | 3 | 0.344 | 0.100 | 25.0 | Levín (565105), Bílina (567451), Duchcov (567515) |
| EMI-094 | 3 | 0.177 | 0.000 | 24.0 | Ploskovice (565393), Slavětín (566713), Moldava (567728) |
| EMI-095 | 3 | 0.208 | 0.050 | 25.0 | Polepy (565431), Liběšice (566357), Polerady (567353) |
| EMI-096 | 2 | 0.062 | 0.050 | 25.0 | Radovesice (565521), Homole u Panny (567973) |
| EMI-097 | 2 | 0.125 | 0.050 | 25.0 | Rochov (565547), Židovice (565954) |
| EMI-098 | 2 | 0.094 | 0.000 | 25.0 | Velemín (565849), Malé Březno (567299) |
| EMI-099 | 4 | 0.156 | 0.033 | 25.0 | Velké Žernoseky (565857), Břvany (566063), Kryry (566314), Háj u Duchcova (567523) |
| EMI-100 | 2 | 0.281 | 0.000 | 25.0 | Žalhostice (565946), Klíny (567191) |
| EMI-101 | 2 | 0.125 | 0.000 | 24.5 | Hřivice (566217), Nepomyšl (566501) |
| EMI-102 | 2 | 0.125 | 0.000 | 25.0 | Nové Sedlo (566519), Braňany (567060) |
| EMI-103 | 3 | 0.260 | 0.117 | 25.0 | Postoloprty (566624), Teplice (567442), Dubí (567507) |
| EMI-104 | 2 | 0.062 | 0.050 | 25.0 | Raná (566659), Korozluky (567221) |
| EMI-105 | 2 | 0.125 | 0.100 | 24.5 | Český Jiřetín (567108), Bystřany (567477) |
| EMI-106 | 2 | 0.406 | 0.000 | 25.0 | Hrobčice (567566), Košťany (567621) |
| EMI-107 | 2 | 0.094 | 0.100 | 25.0 | Ohníč (567761), Petrovice (568147) |

### Nepřiřazené a méně spolehlivé obce

**UNASSIGNED:** Jenčice (505528), Janská (530395), Doubice (530417), Miřejovice (530506), Kozly (530557), Želkovice (530565), Čeradice (530581), Libočany (530590), Zálužice (530603), Přestanov (530620), Trnovany (542407), Černouček (542423), Oleško (542440), Záluží (542482), Malíč (542491), Michalovice (542521), Píšťany (542539), Blšany u Loun (542547), Opočno (542555), Cítoliby (542571), Obora (542580), Černčice (542628), Nová Ves (542636), Žerotín (543012), Staňkovice (543128), Bynovec (544647), Janov (544680), Labská Stráň (544701), Starý Šachov (545538), Markvartice (545678), Lobendava (545708), Dobrná (545783), Merboltice (545791), Dolní Habartice (545856), Františkov nad Ploučnicí (545899), Horní Habartice (545929), Jimlín (546011), Pesvice (546062), Račetice (546071), Nezabylice (546160), Úherce (546178), Ryjice (546186), Kunratice (546330), Srbská Kamenice (546348), Chraberce (546429), Volevčice (546437), Kámen (546453), Ludvíkovice (546496), Loučná pod Klínovcem (546518), Lkáň (546691), Sedlec (546721), Brzánky (546755), Horní Řepčice (546763), Kamýk (546771), Býčkovice (546780), Chudoslavice (546810), Staňkovice (546828), Černěves (546852), Dobroměřice (546861), Líšťany (546879), Vršovice (546887), Brodec (546895), Lukov (546909), Stebno (546925), Dolánky nad Ohří (553646), Trmice (553697), Ústí nad Labem (554804), Těchlovice (555193), Velké Chvojno (555223), Děčín (562335), Arnoltice (562343), Benešov nad Ploučnicí (562351), Česká Kamenice (562394), Dobkovice (562408), Dolní Podluží (562432), Dolní Poustevna (562441), Heřmanov (562483), Horní Podluží (562505), Hřensko (562513), Huntířov (562521), Chřibská (562530), Jetřichovice (562556), Jílové (562564), Jiřetín pod Jedlovou (562572), Jiříkov (562581), Krásná Lípa (562611), Kytlice (562645), Lipová (562661), Malá Veleň (562700), Malšovice (562718), Mikulášovice (562751), Rumburk (562777), Rybniště (562793), Staré Křečany (562823), Šluknov (562858), Valkeřice (562874), Varnsdorf (562882), Velká Bukovina (562891), Velký Šenov (562912), Verneřice (562921), Veselé (562939), Vilémov (562947), Chomutov (562971), Bílence (562980), Blatno (562998), Boleboř (563005), Březno (563013), Černovice (563021), Domašín (563048), Droužkovice (563056), Hora Svatého Šebestiána (563064), Hrušovany (563072), Chbany (563081), Jirkov (563099), Kadaň (563102), Kalek (563111), Klášterec nad Ohří (563129), Kovářská (563137), Křimov (563161), Libědice (563188), Málkov (563200), Mašťov (563218), Měděnec (563226), Místo (563242), Okounov (563269), Otvice (563277), Perštejn (563285), Pětipsy (563293), Kryštofovy Hamry (563315), Radonice (563323), Rokle (563331), Spořice (563340), Strupčice (563358), Údlice (563382), Vejprty (563404), Veliká Ves (563412), Vilémov (563439), Vrskmaň (563463), Všehrdy (563471), Všestudy (563480), Výsluní (563498), Vysoká Pec (563501), Litoměřice (564567), Bechlín (564575), Bohušovice nad Ohří (564591), Brňany (564613), Brozany nad Ohří (564621), Bříza (564648), Budyně nad Ohří (564656), Ctiněves (564672), Černiv (564699), Čížkovice (564711), Děčany (564729), Dlažkovice (564737), Dobříň (564745), Doksany (564753), Drahobuz (564770), Dušníky (564818), Evaň (564834), Hlinná (564842), Horní Beřkovice (564851), Hoštka (564877), Hrobce (564893), Chodouny (564923), Chodovlice (564931), Chotěšov (564940), Chotiměř (564958), Chotiněves (564966), Keblice (565016), Klapý (565024), Kleneč (565032), Kostomlaty pod Řípem (565059), Krabčice (565067), Křesín (565075), Křešice (565083), Kyškovice (565091), Levín (565105), Lhotka nad Labem (565113), Liběšice (565121), Libkovice pod Řípem (565148), Libochovany (565156), Libochovice (565164), Libotenice (565172), Lovečkovice (565211), Lovosice (565229), Lukavec (565237), Malé Žernoseky (565245), Martiněves (565253), Mlékojedy (565296), Mnetěš (565300), Mšené-lázně (565318), Nové Dvory (565342), Ploskovice (565393), Podsedice (565415), Polepy (565431), Prackovice nad Labem (565458), Přestavlky (565474), Račice (565482), Račiněves (565491), Radovesice (565521), Rochov (565547), Roudnice nad Labem (565555), Siřejovice (565598), Slatina (565601), Snědovice (565610), Straškov-Vodochody (565679), Sulejovice (565695), Štětí (565709), Terezín (565717), Travčice (565741), Třebenice (565768), Třebívlice (565776), Třebušín (565792), Úpohlavy (565806), Úštěk (565814), Vědomice (565831), Velemín (565849), Velké Žernoseky (565857), Vchynice (565865), Vlastislav (565873), Vražkov (565881), Vrbice (565890), Vrbičany (565903), Vrutice (565911), Žabovřesky nad Ohří (565938), Žalhostice (565946), Židovice (565954), Žitenice (565962), Louny (565971), Bitozeves (565997), Blatno (566004), Blažim (566012), Blšany (566021), Břvany (566063), Deštnice (566128), Domoušice (566152), Holedeč (566187), Hříškov (566195), Hřivice (566217), Chlumčany (566233), Chožov (566241), Koštice (566284), Krásný Dvůr (566306), Kryry (566314), Lenešice (566322), Libčeves (566349), Liběšice (566357), Libořice (566381), Lipno (566403), Lišany (566411), Lubenec (566438), Měcholupy (566454), Nepomyšl (566501), Nové Sedlo (566519), Očihov (566527), Panenský Týnec (566535), Peruc (566551), Petrohrad (566560), Pnětluky (566578), Počedělice (566586), Podbořanský Rohozec (566608), Podbořany (566616), Postoloprty (566624), Raná (566659), Ročov (566667), Slavětín (566713), Smolnice (566721), Toužetín (566829), Tuchořice (566853), Velemyšleves (566870), Veltěže (566896), Růžová (566900), Vinařice (566918), Vrbno nad Lesy (566926), Vroutek (566934), Výškov (566951), Zbrašín (566977), Žatec (566985), Žiželice (567019), Most (567027), Bečov (567043), Bělušice (567051), Braňany (567060), Brandov (567078), Český Jiřetín (567108), Havraň (567141), Hora Svaté Kateřiny (567167), Horní Jiřetín (567175), Klíny (567191), Korozluky (567221), Lišnice (567248), Litvínov (567256), Lom (567264), Louka u Litvínova (567272), Lužice (567281), Malé Březno (567299), Mariánské Radčice (567302), Meziboří (567311), Nová Ves v Horách (567329), Obrnice (567337), Patokryje (567345), Polerady (567353), Skršín (567361), Želenice (567426), Teplice (567442), Bílina (567451), Bořislav (567469), Bystřany (567477), Bžany (567485), Dubí (567507), Duchcov (567515), Háj u Duchcova (567523), Hostomice (567531), Hrob (567558), Hrobčice (567566), Jeníkov (567582), Kladruby (567604), Kostomlaty pod Milešovkou (567612), Košťany (567621), Krupka (567639), Lahošť (567647), Ledvice (567655), Měrunice (567698), Mikulov (567701), Modlany (567710), Moldava (567728), Novosedlice (567752), Ohníč (567761), Osek (567779), Proboštov (567787), Rtyně nad Bílinou (567809), Srbice (567833), Světec (567841), Újezdeček (567850), Zabrušany (567868), Žalany (567876), Žim (567884), Dolní Zálezly (567931), Habrovany (567957), Homole u Panny (567973), Chabařovice (568007), Chlumec (568015), Chuderov (568023), Libouchec (568058), Malé Březno (568091), Malečov (568104), Petrovice (568147), Povrly (568155), Řehlovice (568201), Tašov (568287), Telnice (568295), Tisá (568309), Velké Březno (568350), Zubrnice (568384)

**Skupiny s nízkou důvěrou:** Žádné.

**Obce v těchto skupinách:** Žádné.

### Pouze průzkumné pořadí zamítnutých kandidátů

Žádná skupina nebyla ponechána. Následující nejsilnější a nejslabší položky jsou relativním pořadím zamítnutých kandidátů; nejsou úspěšně ověřenými klastry.

### Nejsilnější zamítnuté průzkumné kandidáty podle blokové stability a podobnosti

- **EMI-070**: 2 obcí, stabilita párů 53.1 %, podobnost 0.837; medoid Rybniště (562793). Nejsilnější členové: Rybniště (562793), Klášterec nad Ohří (563129). Nejslabší členové: Klášterec nad Ohří (563129), Rybniště (562793).

- **EMI-065**: 2 obcí, stabilita párů 53.1 %, podobnost 0.825; medoid Jílové (562564). Nejsilnější členové: Jílové (562564), Bělušice (567051). Nejslabší členové: Bělušice (567051), Jílové (562564).

- **EMI-032**: 2 obcí, stabilita párů 50.0 %, podobnost 0.804; medoid Račetice (546071). Nejsilnější členové: Račetice (546071), Vršovice (546887). Nejslabší členové: Vršovice (546887), Račetice (546071).

### Nejslabší zamítnuté průzkumné kandidáty podle blokové stability a podobnosti

- **EMI-092**: 2 obcí, stabilita párů 0.0 %, podobnost 0.704; medoid Kleneč (565032). Nejsilnější členové: Kleneč (565032), Sulejovice (565695). Nejslabší členové: Sulejovice (565695), Kleneč (565032).

- **EMI-104**: 2 obcí, stabilita párů 6.2 %, podobnost 0.720; medoid Raná (566659). Nejsilnější členové: Raná (566659), Korozluky (567221). Nejslabší členové: Korozluky (567221), Raná (566659).

- **EMI-096**: 2 obcí, stabilita párů 6.2 %, podobnost 0.725; medoid Radovesice (565521). Nejsilnější členové: Radovesice (565521), Homole u Panny (567973). Nejslabší členové: Homole u Panny (567973), Radovesice (565521).

### Skutečné časové vzorce

Roky s největší početní převahou jednoho směru v celé sadě obcí (nejde o odhad příčin):

| Rok | Růst | Pokles | Nerozhodnutelné nebo chybějící |
| --- | --- | --- | --- |
| 2023 | 211 | 142 | 1 |
| 2008 | 143 | 211 | 0 |
| 2019 | 144 | 209 | 1 |
| 2017 | 146 | 208 | 0 |

Průzkumný zamítnutý kandidát: **EMI-070**, exportované synchronní roky: 2001: GROWING (2↑/0↓; synchronizace 100.0 %); 2002: GROWING (2↑/0↓; synchronizace 100.0 %); 2003: DECLINING (0↑/2↓; synchronizace 100.0 %); 2004: DECLINING (0↑/2↓; synchronizace 100.0 %); 2005: GROWING (2↑/0↓; synchronizace 100.0 %); 2006: DECLINING (0↑/2↓; synchronizace 100.0 %); 2007: GROWING (2↑/0↓; synchronizace 100.0 %); 2008: DECLINING (0↑/2↓; synchronizace 100.0 %); 2009: GROWING (2↑/0↓; synchronizace 100.0 %); 2010: GROWING (2↑/0↓; synchronizace 100.0 %); 2011: GROWING (2↑/0↓; synchronizace 100.0 %); 2012: DECLINING (0↑/2↓; synchronizace 100.0 %); 2014: DECLINING (0↑/2↓; synchronizace 100.0 %); 2015: GROWING (2↑/0↓; synchronizace 100.0 %); 2017: DECLINING (0↑/2↓; synchronizace 100.0 %); 2018: DECLINING (0↑/2↓; synchronizace 100.0 %); 2020: GROWING (2↑/0↓; synchronizace 100.0 %); 2021: DECLINING (0↑/2↓; synchronizace 100.0 %); 2022: DECLINING (0↑/2↓; synchronizace 100.0 %); 2023: GROWING (2↑/0↓; synchronizace 100.0 %); 2024: GROWING (2↑/0↓; synchronizace 100.0 %).

Průzkumný zamítnutý kandidát: **EMI-065**, exportované synchronní roky: 2001: GROWING (2↑/0↓; synchronizace 100.0 %); 2002: DECLINING (0↑/2↓; synchronizace 100.0 %); 2003: DECLINING (0↑/2↓; synchronizace 100.0 %); 2004: GROWING (2↑/0↓; synchronizace 100.0 %); 2005: DECLINING (0↑/2↓; synchronizace 100.0 %); 2006: GROWING (2↑/0↓; synchronizace 100.0 %); 2007: DECLINING (0↑/2↓; synchronizace 100.0 %); 2008: GROWING (2↑/0↓; synchronizace 100.0 %); 2009: DECLINING (0↑/2↓; synchronizace 100.0 %); 2010: GROWING (2↑/0↓; synchronizace 100.0 %); 2011: DECLINING (0↑/2↓; synchronizace 100.0 %); 2012: GROWING (2↑/0↓; synchronizace 100.0 %); 2013: GROWING (2↑/0↓; synchronizace 100.0 %); 2014: DECLINING (0↑/2↓; synchronizace 100.0 %); 2015: GROWING (2↑/0↓; synchronizace 100.0 %); 2018: GROWING (2↑/0↓; synchronizace 100.0 %); 2019: DECLINING (0↑/2↓; synchronizace 100.0 %); 2021: GROWING (2↑/0↓; synchronizace 100.0 %); 2023: DECLINING (0↑/2↓; synchronizace 100.0 %); 2024: DECLINING (0↑/2↓; synchronizace 100.0 %); 2025: GROWING (2↑/0↓; synchronizace 100.0 %).

Průzkumný zamítnutý kandidát: **EMI-032**, exportované synchronní roky: 2001: DECLINING (0↑/2↓; synchronizace 100.0 %); 2002: GROWING (2↑/0↓; synchronizace 100.0 %); 2004: GROWING (2↑/0↓; synchronizace 100.0 %); 2005: DECLINING (0↑/2↓; synchronizace 100.0 %); 2006: DECLINING (0↑/2↓; synchronizace 100.0 %); 2008: GROWING (2↑/0↓; synchronizace 100.0 %); 2009: DECLINING (0↑/2↓; synchronizace 100.0 %); 2010: DECLINING (0↑/2↓; synchronizace 100.0 %); 2011: GROWING (2↑/0↓; synchronizace 100.0 %); 2012: DECLINING (0↑/2↓; synchronizace 100.0 %); 2013: GROWING (2↑/0↓; synchronizace 100.0 %); 2014: GROWING (2↑/0↓; synchronizace 100.0 %); 2015: GROWING (2↑/0↓; synchronizace 100.0 %); 2016: DECLINING (0↑/2↓; synchronizace 100.0 %); 2017: DECLINING (0↑/2↓; synchronizace 100.0 %); 2018: GROWING (2↑/0↓; synchronizace 100.0 %); 2019: DECLINING (0↑/2↓; synchronizace 100.0 %); 2021: DECLINING (0↑/2↓; synchronizace 100.0 %); 2024: GROWING (2↑/0↓; synchronizace 100.0 %); 2025: DECLINING (0↑/2↓; synchronizace 100.0 %).

Regionální baseline kandidátního modelu před filtrem: shoda směru s regionem 54.5 %; shoda původních skupin po odečtení regionální změny 72.0 %; ARI nového reziduálního shlukování 0.252. Jde o citlivostní kontrolu, nikoli důkaz nezávislých lokálních mechanismů.

### Citlivost kandidátního modelu před filtrem

Zásah `variance_inflation_2` mění modelovou nejistotu a směrové štítky reliability varianty. U baseline nebo shrinkage, jejichž vzdálenosti tuto nejistotu nepoužívají, je tento zásah neaktivní: ARI = 1 je očekávané a není důkazem robustnosti vůči nadměrnému rozptylu.

| Zásah | ARI | K | Pokrytí |
| --- | --- | --- | --- |
| constant_population_denominator | 0.379 | 101 | 95.8 % |
| variance_inflation_2 | 1.000 | 107 | 96.0 % |
| remove_largest_rate_event | 0.327 | 112 | 96.3 % |

## Primární metodické zdroje

[Dokumentace SciPy: linkage a požadavky na vzdálenosti](https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.hierarchy.linkage.html); [Berkeley: Gamma–Poisson empirical Bayes](https://stat210a.berkeley.edu/fall-2025/homework/homework6.pdf); [Politis a Romano: původní stationary bootstrap](https://statistics.stanford.edu/technical-reports/stationary-bootstrap); [Hemerik a Goeman: přesné testování náhodnými permutacemi a jeho předpoklady](https://pmc.ncbi.nlm.nih.gov/articles/PMC6405018/); [Gao, Bien a Witten: inference po hierarchickém shlukování](https://arxiv.org/abs/2012.02936). Tyto zdroje odůvodňují použité stavební prvky a jejich omezení; nedávají automatickou platnost tomuto vlastnímu hybridnímu časovému modelu ani jeho surrogate null.

## Přesné parametry běhu

```json
{
  "seed": 20261023,
  "variants": [
    "baseline",
    "shrinkage",
    "reliability"
  ],
  "directional_weights": [
    0.6,
    0.7,
    0.85
  ],
  "linkage": [
    "average",
    "complete"
  ],
  "strictness": {
    "loose": {
      "max_distance": 0.46,
      "min_agreement": 0.62,
      "max_opposite": 0.38
    },
    "balanced": {
      "max_distance": 0.36,
      "min_agreement": 0.7,
      "max_opposite": 0.3
    },
    "strict": {
      "max_distance": 0.27,
      "min_agreement": 0.78,
      "max_opposite": 0.22
    }
  },
  "min_pair_informative": 8,
  "min_pair_available": 8,
  "z_threshold": 1.28,
  "bootstraps": 32,
  "null_repetitions": 39,
  "cut_lattice": "Up to 32 ordered data-derived merge heights plus similarity ceiling; K unrestricted",
  "minimum_group_block_retention": 0.5,
  "minimum_group_poisson_retention": 0.5,
  "poisson_repetitions": 20,
  "block_length": 3,
  "selection_bootstraps": 8,
  "selection_poisson_repetitions": 4,
  "resampling_cut": "Reselect automatic cut at fixed variant, weight, linkage and strictness"
}
```

## Audit dat a omezení

```json
{
  "source_rows": 9204,
  "unique_rows": 9204,
  "duplicate_rows_removed": 0,
  "missing_cells": {
    "population": 0,
    "immigration": 0,
    "emigration": 0
  },
  "preprocessing_log": [],
  "population_jumps_over_20_percent": [
    {
      "code": "542440",
      "year": 2001,
      "relative_population_jump": 0.20833333333333326
    },
    {
      "code": "542521",
      "year": 2001,
      "relative_population_jump": 0.26956521739130435
    },
    {
      "code": "542521",
      "year": 2008,
      "relative_population_jump": 0.21599999999999997
    },
    {
      "code": "544680",
      "year": 2004,
      "relative_population_jump": 0.2474747474747474
    },
    {
      "code": "545538",
      "year": 2001,
      "relative_population_jump": 0.33333333333333326
    },
    {
      "code": "546062",
      "year": 2007,
      "relative_population_jump": 0.20430107526881724
    },
    {
      "code": "546062",
      "year": 2011,
      "relative_population_jump": 0.2524271844660195
    },
    {
      "code": "546071",
      "year": 2005,
      "relative_population_jump": 0.3017241379310345
    },
    {
      "code": "546429",
      "year": 2001,
      "relative_population_jump": 0.4375
    },
    {
      "code": "546437",
      "year": 2001,
      "relative_population_jump": 0.20512820512820507
    },
    {
      "code": "546518",
      "year": 2001,
      "relative_population_jump": 0.35185185185185186
    },
    {
      "code": "546518",
      "year": 2022,
      "relative_population_jump": 0.20634920634920628
    },
    {
      "code": "546518",
      "year": 2023,
      "relative_population_jump": 0.23684210526315796
    },
    {
      "code": "546780",
      "year": 2001,
      "relative_population_jump": 0.23913043478260865
    },
    {
      "code": "546810",
      "year": 2001,
      "relative_population_jump": 0.27522935779816504
    },
    {
      "code": "546828",
      "year": 2001,
      "relative_population_jump": 0.25
    },
    {
      "code": "546828",
      "year": 2011,
      "relative_population_jump": 0.8888888888888888
    },
    {
      "code": "546828",
      "year": 2012,
      "relative_population_jump": 0.23529411764705888
    },
    {
      "code": "546909",
      "year": 2001,
      "relative_population_jump": 0.32352941176470584
    },
    {
      "code": "563048",
      "year": 2001,
      "relative_population_jump": 1.1690140845070425
    },
    {
      "code": "563048",
      "year": 2011,
      "relative_population_jump": 0.45378151260504196
    },
    {
      "code": "563072",
      "year": 2006,
      "relative_population_jump": 0.25552050473186116
    },
    {
      "code": "563111",
      "year": 2001,
      "relative_population_jump": 0.20895522388059695
    },
    {
      "code": "563161",
      "year": 2001,
      "relative_population_jump": 1.3676470588235294
    },
    {
      "code": "563161",
      "year": 2007,
      "relative_population_jump": 0.4761904761904763
    },
    {
      "code": "563242",
      "year": 2011,
      "relative_population_jump": 0.21367521367521358
    },
    {
      "code": "563315",
      "year": 2011,
      "relative_population_jump": 0.49275362318840576
    },
    {
      "code": "563315",
      "year": 2020,
      "relative_population_jump": 0.22222222222222232
    },
    {
      "code": "563331",
      "year": 2001,
      "relative_population_jump": 0.38853503184713367
    },
    {
      "code": "563471",
      "year": 2011,
      "relative_population_jump": 0.25742574257425743
    },
    {
      "code": "563498",
      "year": 2011,
      "relative_population_jump": 0.29681978798586584
    },
    {
      "code": "563498",
      "year": 2021,
      "relative_population_jump": -0.2987341772151899
    },
    {
      "code": "564613",
      "year": 2001,
      "relative_population_jump": 0.2911392405063291
    },
    {
      "code": "565105",
      "year": 2001,
      "relative_population_jump": 0.2168674698795181
    },
    {
      "code": "565113",
      "year": 2011,
      "relative_population_jump": 0.5748987854251013
    },
    {
      "code": "565831",
      "year": 2007,
      "relative_population_jump": 0.25994694960212206
    },
    {
      "code": "566012",
      "year": 2001,
      "relative_population_jump": 0.34013605442176864
    },
    {
      "code": "566381",
      "year": 2001,
      "relative_population_jump": 0.2226027397260273
    },
    {
      "code": "566608",
      "year": 2001,
      "relative_population_jump": 0.2571428571428571
    },
    {
      "code": "566977",
      "year": 2001,
      "relative_population_jump": 0.2857142857142858
    },
    {
      "code": "567141",
      "year": 2013,
      "relative_population_jump": 0.22361359570661898
    },
    {
      "code": "567345",
      "year": 2001,
      "relative_population_jump": 0.23100303951367773
    },
    {
      "code": "567566",
      "year": 2021,
      "relative_population_jump": -0.2195121951219512
    },
    {
      "code": "567701",
      "year": 2011,
      "relative_population_jump": 0.2752808988764044
    },
    {
      "code": "567728",
      "year": 2001,
      "relative_population_jump": 0.22881355932203395
    },
    {
      "code": "567728",
      "year": 2005,
      "relative_population_jump": 0.37058823529411766
    },
    {
      "code": "567728",
      "year": 2007,
      "relative_population_jump": 0.2543103448275863
    },
    {
      "code": "567809",
      "year": 2001,
      "relative_population_jump": 0.2196836555360282
    },
    {
      "code": "568287",
      "year": 2008,
      "relative_population_jump": 0.30232558139534893
    },
    {
      "code": "568384",
      "year": 2001,
      "relative_population_jump": 0.22222222222222232
    }
  ],
  "geometry_matches": 354,
  "aggregation": "Use totals once; age bands validate totals and are never added to totals",
  "temporal_geography": "Static supplied boundaries; historical boundary/code harmonization not independently established"
}
```

Resampling je **podmíněný pevně zvolenou konfigurací**: délka společných bloků změn je 3, v replikacích se přepočítají vzdálenosti a strom a znovu automaticky vybere výška řezu při pevné variantě, váze, linkage a přísnosti. Neopakuje se výběr mezi variantami a modely; stabilita proto není nejistotou celé selekce. Společné indexy zachovávají současné vztahy obcí. Existující diference se nikdy znovu nediferencují přes hranice bloků. Nepřiřazené obce se v ARI kódují jednotlivě, takže netvoří uměle stabilní společný klastr.

Null nezávisle kruhově posouvá již vypočtené změny obcí. Nevytváří změny přes slepené úrovně, ale předpokládá přibližnou kruhovou stacionaritu změn. Krátké roční řady, zlomy a společné šoky tuto aproximaci omezují. Maximum evidence přes celou hledanou rodinu omezuje optimismus po hledání; surrogate tail přesto není exaktní p-hodnota ani důkaz jednotlivých skupin. Rozlišení je omezeno počtem replikací.

Poissonův model může podcenit nejistotu při společném stěhování rodin, nadměrném rozptylu nebo závislosti let. Parametrická perturbace je modelová citlivost, nikoli nezávislé potvrzení. Nula v reliability variantě znamená nedostatečně přesvědčivou nebo zanedbatelnou změnu. Statické hranice neprokazují historickou územní shodu; nevyřešené změny hranic a kódů omezují časovou interpretaci. Roční regionální rezidua jsou pouze diagnostikou. Výrazný rok neopravňuje k pojmenování historické příčiny bez dalších dat.

## Implementace a reprodukce

Implementováno: audit a agregace, samostatné migrační směry, míry a shrinkage, směry a spolehlivost, hybridní vzdálenosti, automatický řez, tři granularitní konfigurace a vnořená makroúroveň, porovnání modelů, stabilita a surrogate null, citlivostní kontroly a exporty. Offline dashboard čte hotový JSON; členství se s rokem nemění. Stav automatických testů uvádí samostatný výstup testovacího běhu; tento generátor testy nespouští a netvrdí jejich úspěch.

Stav testů doložený při generování tohoto reportu: 32 automatických unittest testů prošlo v potvrzeném finálním běhu; generátor samotný testy znovu nespouští.

Z kořene projektu:

```sh
python3 ustek_analytics/temporal_pipeline.py
python3 ustek_analytics/temporal_report.py
python3 -m unittest discover -s ustek_analytics/tests
python3 ustek_analytics/serve.py
```

Dashboard: `ustek_analytics/temporal.html`. Výchozí adresa: `http://127.0.0.1:8765/ustek_analytics/temporal.html`; port lze změnit argumentem `--port`. Zdrojové a implementační SHA-256, seed, parametry a verze jsou v `analysis_manifest.json`. Výstupy v `results/` zahrnují členství, roční trendy a souhrny, srovnání modelů, řezy a párové matice. Historická harmonizace hranic a formální významnost jednotlivých klastrů nejsou tímto systémem doloženy.
