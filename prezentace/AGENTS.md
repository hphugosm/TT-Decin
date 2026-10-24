# Pravidla prezentace

- Každý další snímek má výrazný obsahový nadpis ve volném prostoru nad grafem, vlevo od názvu projektu, ve stejné velikostní škále jako předchozí snímky. Používej společnou proměnnou `--slide-heading-size`.
- Nepřidávej drobné horní popisky ani názvy sekcí typu „01 / Výchozí bod“, „02 / Společné období“ nebo „03 / Zlom v datech“.
- Nepřidávej spodní shrnující řádek. Zachovej šipky, klávesové ovládání a časovač. Již schválené malé legendy a popisky os grafu mohou zůstat.
- Nové snímky vizuálně navazují na předchozí. Mezi snímky 2 a 3 zůstává graf i jeho měřítko na stejném místě.
- Období 2022–2024 označuj jemnou jednolitou šedou plochou bez šrafování a bez výrazného vínového obrysu. Červený společný průnik 2018–2024 zůstává zachovaný.

- Název projektu je na prvním slajdu vlevo na jednom řádku; od druhého je vpravo ve dvou řádcích („Stěhování obcí“ / „Ústeckého kraje.“). Při přechodu mezi prvním a druhým se plynule přesune a přeskupí. Používej společný prvek `#deck-brand`, ne duplikované názvy na jednotlivých slajdech.
- Čtyři popisky vedle společné velké jedničky začínají velkým písmenem: Ukazatel, Hodnota, Obec, Rok.

- Obsahové nadpisy od druhého slajdu zarovnávej doleva ke společnému levému okraji obsahu a grafu. Zachovej jejich svislou polohu ve volném prostoru nad grafem, vlevo od názvu projektu. Název projektu drž ve stejné vzdálenosti od horní hrany; kvůli posunu nadpisu jej neposouvej.
- Na slajdech nezobrazuj tlačítka „Rozcestník“ a „Nápady k animaci“ ani jejich společný panel. Poznámkový dialog a klávesová zkratka N byly odstraněny.

- Pátý snímek je živá mapa z `../mapa/?unit=absolute` s absolutními počty lidí. Šestý snímek je samostatný zachovaný iframe stejné mapy z `../mapa/?unit=rate`, s migrací v poměru k obyvatelům obce. Jde o výchozí jednotky, další nastavení každé mapy zachovej nezávisle. Prostor mapy vyplňuje snímek bez dalšího nadpisu a wordmarku; pod mapou zůstává navigace a časovač. Klávesové šipky přepínají snímky i při zaměření mapy, ale neruší formulářová pole a dialogy.

- Pořadí závěru: 5 mapa – počty, 6 mapa – podíl obyvatel, 7 web `../klastry/`, 8 hypotéza, 9 realita, 10 znovu relativní mapa, 11 závěr. Snímky 6 a 10 sdílejí tentýž zachovaný mapový iframe; absolutní mapa a klastry mají vlastní.

- Mezi mapovými jednotkami (5 ↔ 6) a relativní mapou a klastry (6 ↔ 7) se stránky neposouvají do stran: dočasná SVG vrstva zachová obrysy všech obcí a plynule přebarví jejich výplně, s jemným dorovnáním kamery. Ostatní panely se postupně prolnou. Živé iframe zůstávají na místě; přerušení animace obnoví jejich viditelnost.

- Poslední, jedenáctý snímek „Závěr našeho výzkumu“ obsahuje hlavní větu „Budoucnost nelze předvídat dokonale. Její odchylky ale můžeme měřit.“ a tři bloky: Kraj — Stabilnější trend; Obec — Větší vliv náhody; Krize — Zlom historického trendu. Původní mapa zůstává na desátém snímku.

- Druhá volba hlavního rozcestníku se jmenuje „Prohlídka dat“. Na `#prohlidka` jsou čtyři funkční odkazy: GitHub `hphugosm/TT-Decin`, `../mapa/`, `../klastry/` a `#prezentace/1`. Nezobrazuj zde „Připravujeme“ ani označení „Vedená prohlídka“.
