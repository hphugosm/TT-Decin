"""Deterministický export skutečných obecních dat pro Migrační radar; Shapely 2.2+ pro společné hranice.
Spuštění z libovolné složky: python3 ustek_analytics/prepare_radar.py
Původní data se nikdy nemění; prázdná měření zůstávají null.
"""
from pathlib import Path
import csv
import hashlib
import json
import math
import shapely
from shapely.geometry import shape, mapping

ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent
SOURCE = PROJECT / 'outputs/ustecky_kraj_ml_data'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def number(value):
    if value == '':
        return None
    n = float(value)
    if not math.isfinite(n) or n < 0 or not n.is_integer():
        raise ValueError(f'Neplatný počet: {value!r}')
    return int(n)


def main():
    geometry_path = SOURCE / 'municipality_boundaries_current.geojson'
    panel_path = SOURCE / 'municipality_year_panel.csv'
    geometry = json.loads(geometry_path.read_text())
    codes, names = set(), {}
    for feature in geometry['features']:
        props = feature['properties']
        code, name = str(props['kod_obce']), props['nazev_obce']
        assert len(code) == 6 and code.isdigit() and code not in codes
        assert feature['geometry']['type'] in ('Polygon', 'MultiPolygon')
        codes.add(code)
        names[code] = name
        feature['id'] = code
        feature['properties'] = {'code': code, 'name': name}
    shapes = [shape(f['geometry']) for f in geometry['features']]
    assert shapely.coverage_is_valid(shapes), 'Původní hranice nejsou validní coverage'
    simplified = shapely.coverage_simplify(shapes, tolerance=0.0015)
    assert shapely.coverage_is_valid(simplified), 'Zjednodušení porušilo společné hranice'
    assert all(g.is_valid and not g.is_empty and g.area > 0 for g in simplified)
    for feature, polygon in zip(geometry['features'], simplified):
        feature['geometry'] = mapping(polygon)
    geometry_validation = dict(sourceCoverageValid=True, simplifiedCoverageValid=True,
                               allGeometriesValid=True, features=len(shapes),
                               shapelyVersion=shapely.__version__)
    records, keys = [], set()
    with panel_path.open(encoding='utf-8-sig', newline='') as stream:
        for row in csv.DictReader(stream):
            code, year = row['kod_obce'], int(row['rok'])
            assert code in codes and (code, year) not in keys
            keys.add((code, year))
            record = dict(code=code, name=names[code], year=year,
                          incoming=number(row['pristehovali']),
                          outgoing=number(row['vystehovali']),
                          population=number(row['populace_1_1']))
            if record['incoming'] is not None and record['outgoing'] is not None and row['prirustek_migracni'] != '':
                assert record['incoming'] - record['outgoing'] == float(row['prirustek_migracni'])
            records.append(record)
    records.sort(key=lambda r: (r['year'], r['code']))
    years = sorted({r['year'] for r in records})
    coverage = []
    for year in years:
        selected = [r for r in records if r['year'] == year]
        covered = {r['code'] for r in selected}
        coverage.append(dict(year=year, municipalities=len(covered), expected=len(codes),
                             incoming=sum(r['incoming'] is not None for r in selected),
                             outgoing=sum(r['outgoing'] is not None for r in selected),
                             population=sum(r['population'] is not None and r['population'] > 0 for r in selected),
                             complete=covered == codes and all(r[k] is not None for r in selected for k in ('incoming','outgoing','population'))))
    limitations = [
        'Populace je stav k 1. lednu daného roku. Míry jsou vlastní přepočty na tento stav, nikoli standardní demografické míry na střední stav.',
        'Hranice jsou aktuální snapshot ČÚZK/RÚIAN stažený 24. 10. 2026 místního času; nejsou ověřenými historickými hranicemi let 2000–2025.',
        'ČSÚ zpětně používá poslední platné kódy obcí a aktuální okresy; historické počty nejsou přepočteny na neměnné hranice.',
        'Součty přistěhování/vystěhování do/z obcí zahrnují vnitrokrajské přesuny; nejsou přeshraničními toky kraje.',
        'Sčítání 2001, 2011 a 2021 mění návaznost populačních stavů; od 2022 je změněno vymezení populace včetně osob s dočasnou ochranou.',
        'Územní korekce nejsou migrace. Převod části Hradiště účinný 1. 1. 2016 je ve zdroji zachycen v řádku 2015.',
        'Úplnost znamená dostupnost kanálů pro všechny obce aktuálního číselníku; neprokazuje neměnnost území v historii.'
    ]
    meta = dict(name='ČSÚ · migrace obcí Ústeckého kraje 2000–2025',
                source='Český statistický úřad, Databáze demografických údajů za obce ČR; normalizovaný výběr z původního místního panelu.',
                populationBasis='Stav k 1. lednu daného roku', populationDate='01-01',
                sourceUrl='https://csu.gov.cz/databaze-demografickych-udaju-za-obce-cr',
                methodologyUrl='https://csu.gov.cz/vysvetlivky-k-databazi',
                license='CC BY 4.0', licenseUrl='https://csu.gov.cz/podminky_pro_vyuzivani_a_dalsi_zverejnovani_statistickych_udaju_csu',
                vintage='2026-10-24', years=years, municipalityCount=len(codes), recordCount=len(records),
                expectedMunicipalityCodes=sorted(codes), coverage=coverage,
                latestCompleteYear=max((c['year'] for c in coverage if c['complete']),default=None),
                geography=dict(source='ČÚZK/RÚIAN, INSPIRE Administrative Units WFS',
                               url='https://services.cuzk.gov.cz/wfs/inspire-au-wfs.asp',
                               retrievedAtUtc='2026-10-23T23:14:00Z', reference='Aktuální stav služby při stažení, nikoli hranice k 1. 1. 2026',
                               crs='EPSG:4326', license='Veřejná bezúplatná služba; standardní CC licence neověřena',
                               licenseUrl='https://www.cuzk.cz/Predpisy/Podminky-poskytovani-prostor-dat-a-sitovych-sluzeb.aspx',
                               preparation='Topologické zjednodušení sdílených hranic shapely.coverage_simplify; tolerance 0.0015 stupně; EPSG:4326.', validation=geometry_validation),
                limitations=limitations,
                inputs=[dict(path=str(p.relative_to(PROJECT)),sha256=digest(p)) for p in (panel_path,geometry_path)])
    for path, value in ((ROOT/'data/radar-data.json',dict(meta=meta,records=records)),
                        (ROOT/'data/radar-geography.json',geometry)):
        path.write_text(json.dumps(value,ensure_ascii=False,separators=(',', ':'),allow_nan=False),encoding='utf-8')
    print(json.dumps(dict(records=len(records),municipalities=len(codes),years=years,coverage=coverage),ensure_ascii=False))

if __name__ == '__main__':
    main()
