# Ověření zdrojového balíčku

- **38 samostatných syntetických testů prošlo.** Kontrolují kalendář, chybějící hodnoty, opačné a posunuté křivky, všechny párové podmínky a geografickou souvislost.
- **320 náhodných porovnání** optimalizovaného hledání s nezávislým úplným výčtem přípustných sloučení prošlo.
- Z původní geometrie bylo znovu vytvořeno **977 sousedních hran** a porovnáno s kontrolní geometrií.
- Z původních CSV bylo znovu vypočteno **všech osm bodových lokálních hledání** (čtyři profily × dva migrační směry). Členství, průměry, minima a všechny jednotlivé párové metriky přesně souhlasí s uloženými exporty; každé hledání souhlasí i s nezávislým slučovacím algoritmem.
- Šest analytických modulů je po bajtech shodných s původní implementací. Otisky vstupů a kódu jsou v `../PROVENIENCE.json`.
- Spouštěče vynucují UTF-8 v hlavním i dětských procesech, aby původní moduly správně četly české JSON také ve Windows. Přepnutí bylo ověřeno i při výslovně vypnutém výchozím UTF-8 režimu.
- Tři grafy byly vytvořené ze skutečných uložených výsledků a vizuálně zkontrolované. Malé vykreslovací podklady mají otisky pěti zdrojových JSON.

Přesný protokol: [overeni-zdroju.txt](overeni-zdroju.txt). Zopakování: `python overit.py --real-data` z kořene analytické složky.

Tato čerstvá kontrola neopakuje celé vyhledávání časových modelů, všech 59/59/199 lokálních replikací ani odhad stability. Tyto hodnoty přejímá z původního referenčního běhu; úplný výpočet spustí `python run_analysis.py`. Záporný výsledek robustnosti i průzkumný charakter nálezů jsou zachované.
