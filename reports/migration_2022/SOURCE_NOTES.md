# Evaluation inputs: sources and definitions

Prepared independently of model training. None of these outcomes may guide model tuning, feature construction, selector configuration, or uncertainty calibration. Read evaluation CSVs only after prediction/configuration freeze hashes exist.

## Final regional counts

Original `csu_2022_final_regional_migration_tables.xlsx`: `Tab 6.4!B9,I9` gives foreign immigration/emigration, `C9,J9` Ukrainian citizenship. `Tab 6.2!B9` gives interregional outgoing; sum `H4:H17` excluding diagonal `H9` gives interregional incoming. Total across region boundary is foreign plus interregional, independently checked against net `Tab 6.1!H10`. Domestic movements within region are absent from this regional series. All imported control totals pass exact equality checks. Country of citizenship differs from country of former residence and temporary-protection category.

Source: https://csu.gov.cz/produkty/vyvoj-obyvatelstva-ceske-republiky-2022 ; original https://csu.gov.cz/docs/107508/caa55c45-ad71-b34f-4cec-0f5688ec0344/13006923p06.xlsx?version=1.0

## Preliminary benchmark without temporary protection

`csu_2022_preliminary_D6.xlsx`, `D.6!H6,F20,H20`: region incoming, outgoing, net. Explicit exclusion at `A30`. `csu_2022_preliminary_ORP.xlsx`, sheet `A`, rows 79–94, columns H:I:J give 16 administrative ORP territories; exclusion at A228, publication 21 March 2023. Verified I−E=S per ORP and regional net equality. ORP incoming/outgoing sums include moves between ORPs; therefore these sums do not equal region-border incoming/outgoing. Municipality flows also cannot simply be summed into ORP flows. Only aligned complete net balances support this aggregation.

The benchmark excludes temporary protection but contains other Ukrainian migration and possible indirect war effects; final/preliminary revisions differ. It is descriptive, not verified migration in a world without war. No ORP benchmark is assigned to the city of the same name.

Originals: https://csu.gov.cz/docs/107508/c2193383-7b95-f0be-99a3-c23d50b05691/33008622q4d6.xlsx?version=1.0 ; https://csu.gov.cz/docs/107508/7d76b7c4-245e-d767-09a9-7931ac319b34/13006222q4111.xlsx?version=1.0

## MV evidence snapshot

`mv_temporary_protection_snapshot_2022-12-31.xlsx`, sheet `statistika_obce_suk_vek_vse_30.`. Columns A/D/F identify region, municipality code, total evidence stock. All Ústecký kraj rows aggregated by code, including all four Ústí nad Labem city parts. 276 original rows produce 273 observed municipality codes; remaining 81 of the required 354 have empty stock and `absent_in_source_not_zero`. File metadata created `2022-12-31 05:37:20`; internal sheet name says 30. Use publication snapshot date 31 December 2022, without claiming end-of-day coverage. This is stock of relevant authorizations, not annual immigration flow and not exclusively Ukrainian citizenship. Never subtract from ČSÚ flow.

Source: https://archiv.mv.gov.cz/clanek/statistika-v-souvislosti-s-valkou-na-ukrajine-archiv-2022.aspx ; original https://archiv.mv.gov.cz/soubor/statistika-ukr-31-12-2022-xlsx.aspx

## Statistical methodology

Read all relevant extracted pages from `csu_2022_migration_methodology.pdf`; PDF page 1 is printed page 67 and PDF page 2 is printed page 68. Precise short quotes, 25 words total:

- Printed p.67: „ke konci roku 2022 platnou dočasnou ochranu“.
- Printed p.67: „do konce března 2023 požádali o její prodloužení“.
- Printed p.68, footnote 49: „nebyly do vystěhovalých zahrnuty“.

The first two conditions belong jointly to the usual-residence rule used for inclusion of temporary-protection holders. Footnote 49 explains that people whose protection expired in 2022 or who did not request extension by March 2023 were included neither among immigrants nor emigrants. Thus MV snapshot and annual statistical movements differ in population and time definition. Footnotes 43 and 50 identify administrative information systems and administrative termination effects. This source does not validate municipal Ukrainian/temporary-protection annual flows.

Source: https://csu.gov.cz/docs/107508/c996764c-e9bd-94f8-e2c4-bc25830d1acd/1300692306.pdf?version=1.0

## Verified territorial conversion for 2022

Found existing official historical `outputs/ustecky_kraj_ml_data/sources/geography/raw/struktura_uzemi_cr.xlsx`. Official index explicitly provides annual structures beginning 1 January 2013: https://csu.gov.cz/i_zakladni_uzemni_ciselniky_na_uzemi_cr_a_klasifikace_cz_nuts . Exact workbook link resolved from that page: https://csu.gov.cz/docs/107516/3f36d27f-7eb1-b14c-0029-af89997bf192/struktura_uzemi_cr.xlsx?version=1.2 . Browser cannot parse XLSX MIME type, so inspected original local workbook using openpyxl; all file hashes recorded.

Crosswalk uses explicit `1.1.2022` sheet, A municipality code / B name / F ORP ČSÚ code / G ORP name. Every expected municipality code from radar-data.json is present once: 354 of 354, forming 16 ORPs. All pairs agree with `1.1.2023` sheet. Official changes workbook `Změny 1.1.2022-31.12.2022` lists only municipal status changes elsewhere. Thus boundary mapping is suitable for 2022; no current-2026 mapping assumption required. Crosswalk retains source rows. It uses ČSÚ ORP codes (e.g. 4202), not RÚIAN ORP codes; preserve namespace in joins.

This crosswalk validates the 2022 aggregation only. It does not reconstruct earlier boundaries, resolve historical municipal reassignment in the source panel, or justify adding gross flows through different territorial borders. Radar panel uses current codes; report that limitation for longitudinal results.
