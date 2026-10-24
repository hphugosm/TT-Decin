"""Check archived migration aggregates; uses only Python's standard library."""
import csv
import json
import math
import re
from collections import defaultdict
from pathlib import Path

BASE = Path(__file__).resolve().parent

def read_csv(name):
    with (BASE / 'data' / name).open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))

def close(a, b, tol=1e-8):
    assert math.isclose(float(a), float(b), rel_tol=0, abs_tol=tol), (a, b)

firms = {c['id']: c for c in json.loads((BASE / 'data/firmy.json').read_text())}
assert len(firms) == 6
reference = {int(r['rok']): r for r in read_csv('kraj-rocni-reference.csv')}
assert set(reference) == set(range(2000, 2026))
for r in reference.values():
    close(r['migracni_mira_kraje_pct'], 100 * int(r['migracni_prirustek_kraj']) / int(r['pocet_obyvatel_kraj_31_12']))
original = {(r['firma_id'], int(r['rok'])): r for r in read_csv('50km-puvodni.csv')}
assert len(original) == 156
for r in original.values():
    close(r['saldo_pct_populace'], 100 * int(r['migracni_saldo']) / int(r['populace_31_12']))

memberships = {}
series = {}
for radius in (15, 20, 50):
    groups = defaultdict(list)
    for r in read_csv(f'{radius}km-obce.csv'):
        groups[r['firma_id']].append(r)
    assert set(groups) == set(firms)
    memberships[radius] = {}
    for id, rows in groups.items():
        ids = {r['kod_obce'] for r in rows}
        assert len(ids) == len(rows)
        assert firms[id]['municipalityId'] in ids
        assert sum(r['hostitelska_obec'] == 'True' for r in rows) == 1
        assert all(0 <= float(r['vzdalenost_km']) <= radius + 1e-8 for r in rows)
        memberships[radius][id] = ids
    rows = read_csv(f'{radius}km-odchylka.csv')
    keyed = {(r['firma_id'], int(r['rok'])): r for r in rows}
    assert len(rows) == len(keyed) == 156
    assert set(keyed) == {(id, y) for id in firms for y in range(2000, 2026)}
    series[radius] = keyed
    for (id, year), r in keyed.items():
        n = int(r['populace_31_12'])
        assert n > 0 and int(r['pocet_obci']) == len(memberships[radius][id])
        close(r['migracni_mira_kraje_pct'], reference[year]['migracni_mira_kraje_pct'])
        close(r['migracni_mira_okruhu_pct'], 100 * int(r['migracni_saldo_puvodni']) / n)
        close(r['odchylka_od_kraje_pb'], float(r['migracni_mira_okruhu_pct']) - float(r['migracni_mira_kraje_pct']))
        close(r['saldo_nad_krajsky_trend'], int(r['migracni_saldo_puvodni']) - n * float(r['migracni_mira_kraje_pct']) / 100)
        close(r['odchylka_od_kraje_pb'], 100 * float(r['saldo_nad_krajsky_trend']) / n)
        if radius == 50:
            assert int(r['migracni_saldo_puvodni']) == int(original[id, year]['migracni_saldo'])
            assert n == int(original[id, year]['populace_31_12'])
for id in firms:
    assert memberships[15][id] <= memberships[20][id] <= memberships[50][id]
summary = read_csv('srovnani-polomeru-2020-2025.csv')
assert len(summary) == 18
for r in summary:
    radius = int(r['polomer_km']); id = r['firma_id']
    close(r['prumer_rocni_odchylky_pb'], sum(float(series[radius][id, y]['odchylka_od_kraje_pb']) for y in range(2020, 2026)) / 6)
    assert int(r['pocet_obci']) == len(memberships[radius][id])
readme = (BASE / 'README.md').read_text()
for target in re.findall(r'\]\(([^)]+)\)', readme):
    if not target.startswith(('https://', 'http://', '#')):
        assert (BASE / target.split('#')[0]).is_file(), target
for html in (BASE / 'grafy').glob('*.html'):
    text = html.read_text()
    assert '<html' in text and '/Users/' not in text and 'file://' not in text
assert len(list((BASE / 'grafy').glob('*.html'))) == 4
assert len(list((BASE / 'grafy').glob('*.png'))) == 4
print('Ověřeno: 4 × 156 firma–rok, 3 výběry obcí, krajská reference, souhrn a místní odkazy.')
