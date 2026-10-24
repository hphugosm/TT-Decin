# Brand Bible · Migrační radar

Vizuální styl mapy a dashboardu Ústeckého kraje. Podklad pro další úpravy aplikace i tvorbu prezentací.

**Verze:** 24. 10. 2026 · **Projekt:** TT – Děčín · [Živá aplikace](https://hphugosm.github.io/TT-Decin/)

## 1. Vizuální charakter

Světlý, klidný a věcný datový dashboard. Hlavní prostor patří mapě, výrazným číslům a názvu území. Bílé karty, jemné šedomodré okraje, zaoblené rohy a minimum stínů. Barvy mají stálý význam; dekorace nesmí soupeřit s daty.

Aktuální rozložení nemá horní lištu s logem. Identitu vytváří typografie, modrá barva ovládání a jednotné zpracování mapy, grafu a statistik.

## 2. Barevná paleta

### Základ rozhraní

| Použití | HEX | Pravidlo |
| --- | --- | --- |
| Hlavní modrá | `#173DA5` | Primární tlačítka, odkazy, časová osa a přistěhování |
| Hlavní text | `#1D2940` | Nadpisy, názvy území a hlavní údaje |
| Vedlejší text | `#65738A` | Doplňující popisky, jednotky a zdroje |
| Pozadí stránky | `#F7F9FC` | Velké klidné plochy |
| Karty a panely | `#FFFFFF` | Pozadí přehledu a grafu |
| Jemné okraje | `#DFE5EE` | Oddělení panelů a ovladačů |

### Datové barvy

| Význam | HEX | Použití |
| --- | --- | --- |
| Přistěhování | `#173DA5` | Modré body, čísla a modrá mapová škála |
| Vystěhování | `#DE7524` | Oranžové body, čísla a oranžová mapová škála |
| Migrační saldo v grafu | `#D3A600` | Žluté/zlaté body a zvýraznění aktivní karty |
| Migrační saldo – text | `#997900` | Tmavší zlatá pro čitelné hodnoty v kartě |
| Krajská reference | `#8798AD` | Tlumené šedomodré body; značka v legendě používá `#98A3B2` |
| Neutrální hodnota mapy | `#F2F1ED` | Střed barevné škály a neutrální pásmo |

**Mapa salda používá oranžovou → neutrální → modrou:** záporné saldo je oranžové, kladné modré. Žlutá označuje samostatnou řadu salda v grafu a jeho kartu. Tyto dva způsoby zobrazení zachovávat i v prezentaci.

Intenzita mapové výplně vyjadřuje velikost hodnoty. U přistěhování a vystěhování zůstává zachovaná jejich barevná rodina i při zobrazení změn: záporné hodnoty používají světlejší koncový odstín `#6E97DA`, respektive `#EFB27A`. Barevný rozsah je pro dané analytické nastavení pevný v čase; výběr obce jej nemění.

### Události

| Rozsah | Barva obrysu a šrafování | Barva textu | Rozlišení |
| --- | --- | --- | --- |
| Globální událost | `#8F1838` | `#8F1838` | Tmavá vínová, diagonální šrafování |
| Lokální událost | `#E2666B` | `#BD3C43` | Světlejší korálová červená, opačný směr šrafování |

Červené odstíny patří událostem. V mapě se obtahuje kraj nebo dotčená obec. V grafu událost vymezuje šrafovaný obdélník přes příslušné roky; datové body zůstávají viditelné nad ním. Odlišení doplňuje text „Globální“ / „Lokální“ a směr šrafování.

Příklad: Litoměřice **2005–2006** tvoří jeden korálový lokální blok; Schengen **2007** je samostatný vínový globální blok. Krajský graf ukazuje globální události, obecní graf navíc události příslušné obce.

## 3. Písmo a typografie

**Preferované písmo: Inter.** Současná aplikace jej nestahuje ani nepřibaluje: pokud není dostupné v zařízení, použije systémové písmo. Přesná CSS posloupnost je:

```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Text v SVG grafech používá `system-ui, sans-serif`. Pro jednotný vzhled prezentace použít Inter napříč všemi snímky, případně všude Segoe UI. Běžný text Regular, popisky Medium, důležité údaje Semibold/Bold. Nadpisy psát běžně, bez verzálek.

### Hierarchie v aplikaci

| Prvek | Velikost v běžném rozložení | Styl |
| --- | --- | --- |
| Název kraje / obce v přehledu | 30–46 px | Výrazný, na střed |
| Rok v přehledu | 24–32 px | Vedle počtu obyvatel, váha 650 |
| Počet obyvatel | 22–30 px | Výrazný, váha 650 |
| Absolutní počet v kartě | 23 px | Váha 650, barva příslušné veličiny |
| Procento v kartě | 16 px | Váha 650 |
| Ovládání a hledání | 13–14 px | Kompaktní a čitelné |
| Název území a rok přímo v mapě | Oba 28–48 px | Stejná velikost, váha 750, krytí 16 % |

Velikosti jsou responzivní; na telefonu se zmenšují a při roztažení panelu zvětšují. Průsvitný název a rok jsou doprovodný motiv, hlavní údaje zůstávají plně čitelné v přehledu.

Čísla zapisovat česky: **808 356 obyvatel**, **3,13 %**, **2005–2006**. Tisíce oddělovat mezerou, desetinná místa čárkou. Rok bez mezery. Rozdíly procentních měr označovat jako procentní body.

## 4. Mapa, grafy a komponenty

- **Kompozice:** velká mapa vlevo, užší sloupec s ovládáním, přehledem a grafem vpravo. Na desktopu přibližně 62 : 38, mezera 16 px. Název území v přehledu je na střed, pod ním rok a počet obyvatel, dále tři karty metrik.
- **Mapa:** název a rok vlevo nahoře jako průsvitný text `#1D2940` s krytím 16 %. Ovladače vpravo nahoře a legenda dole mají průhledné pozadí. Časová osa patří k mapovému bloku a zůstává pod mapou i při zvětšení na celé okno.
- **Hranice:** běžné obce `#B7C2D1`, 0,5 px; vybraná obec `#35445D`, 1,8 px. Chybějící hodnoty mají šedé šrafování (`#E3E7ED` / `#A1AAB7`), skutečná nula neutrální výplň.
- **Událost v mapě:** rámeček uvnitř mapy vpravo dole, pozadí `#FFF8F7` s krytím 72 %, plně čitelný text. Panel nezkracuje mapu. Výplň šrafovaných pásů v grafu má krytí 8 %, šrafy 50 %.
- **Časový graf:** jednotlivé body bez datových spojnic. Jemná mřížka `#DCE2ED`, nula `#A4AFC0`. Legenda vysvětluje barvy řad a případně událostí, bez dlouhého metodického textu.
- **Tvary:** panely mají rohy 12 px, karty 11 px, tlačítka 8 px. Okraje obvykle 1 px. Rozestupy vycházejí z 8, 12, 16 a 24 px. Stíny jen velmi jemné.
- **Ikony:** jednoduché obrysové symboly; lupa tmavá, ovladače mapy bez barevných výplní. Aktivní kartu odlišuje barva, rámeček i zatržítko.

## 5. Použití v prezentaci

Následující velikosti jsou **doporučení pro snímky 16 : 9**, nikoli rozměry webového rozhraní.

| Prvek snímku | Doporučená velikost |
| --- | --- |
| Nadpis | 32–44 pt, Semibold/Bold |
| Hlavní číslo | 40–64 pt, Semibold/Bold |
| Běžný text | 20–24 pt, Regular |
| Osy a legenda | 16–18 pt, Medium |
| Zdroj / poznámka | 12–14 pt, Regular |

Použít pozadí `#F7F9FC`, text `#1D2940` a bílou plochu pro data. Mapě dát přibližně dvě třetiny snímku; vedle ní název území, rok a několik klíčových údajů. Zachovat modrou pro přistěhování, oranžovou pro vystěhování, zlatou pro saldo v grafu a oba červené odstíny pro události.

Jeden snímek má sdělovat jednu hlavní myšlenku. Při převodu dashboardu do prezentace zvětšit popisky a legendu, zachovat jednotky a zdroj dat. Světlé průsvitné texty používat pouze jako doprovodný motiv. Vyhnout se 3D efektům, výrazným stínům a dekorativním přechodům; barevné přechody patří datové škále mapy.

**Krátké zadání pro autora prezentace:** „Světlý datový styl Migračního radaru. Inter, tmavý text, bílé zaoblené panely a dominantní mapa. Modrá `#173DA5` pro přistěhování, oranžová `#DE7524` pro vystěhování, zlatá `#D3A600` pro saldo v grafu. Globální události vínově `#8F1838`, lokální korálově `#E2666B`. Bodové grafy bez spojnic, stručné legendy, velká čísla a dostatek volného místa.“

## Zdroj vizuálních pravidel

Soubor zachycuje aktuální podobu aplikace. Barvy a rozměry vycházejí z [radar.css](radar.css), mapové škály z [radar-engine.mjs](radar-engine.mjs), hranice z [radar-map.mjs](radar-map.mjs), grafy z [radar-charts.mjs](radar-charts.mjs) a události z [radar-events.mjs](radar-events.mjs). Při změně vizuálního stylu aktualizovat i tento dokument.
