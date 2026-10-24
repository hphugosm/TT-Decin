# Průběh analýzy migrace 2022

- 2026-10-24T10:43:07.006821+02:00: Zahájen audit. Výchozí commit `fe39743f00f11284d4625c4837d400c1ff0ad226`, oddělený checkout, větev `analysis/migration-2022`.
- Ověřeno 354 obcí × 26 let = 9204 řádků, bez duplicit a prázdných I/E/populací. Trénink fyzicky oddělen: 7788 řádků 2000–2021. Roky 2023–2025 nejsou vstupem modelů.
- Krajská historie a kontrolní tabulky se ověřují. Trénování zatím není dokončeno.
- 2026-10-24T10:52:18.770893+02:00: **audit_dat** — Obecní panel i skutečná krajská řada 2000–2021 ověřeny. Krajské součty obecních toků odmítnuty jako nesrovnatelný vstup.
- 2026-10-24T10:58:52.179642+02:00: **referencni_a_krajsky_benchmark** — Dokončeny dvě reference a pět trénovaných rodin. Krajské konfigurace zmrazeny po vývoji 2010–2014, historické hodnocení 2015–2021 a citlivosti dokončeny. Obecní testy navazují.
- 2026-10-24T11:09:49.546118+02:00: **obecni_benchmark_a_selektor** — Všech 354 obcí, sedm trénovaných rodin a dvě reference. Výběr pro testy 2015–2021 vždy používá jen dřívější chyby.
- 2026-10-24T11:09:49.546848+02:00: **zmrazene_predikce_2022** — Bodové predikce, společné roční scénáře a konfigurace opatřeny SHA-256 před výsledkovým porovnáním 2022.
- 2026-10-24T11:10:36.880572+02:00: **externi_srovnani** — Zmrazené predikce spojeny s konečnými údaji, předběžnými daty bez DO a odděleně s MV evidenčním stavem. Chybějící obce MV nejsou nahrazeny nulou.
