#!/usr/bin/env python3
"""Reproduce the complete analytical chain without a browser or map UI."""
from __future__ import annotations
import argparse
import csv
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
APP = ROOT/'ustek_analytics'
SOURCE = ROOT/'audit_dcuk1_2026-10-23/sources'
INPUTS = [SOURCE/name for name in ('migrace_vek_obce_rok.csv', 'uloha1_obce_rok_final.csv',
                                  'obce_ustecky_kraj.geojson', 'obce_ciselnik.csv')]
INPUTS.append(APP/'data/geometry.json')


def check_inputs():
    """Read-only stdlib integrity/join check; analytical validation also runs on build."""
    for path in INPUTS:
        if not path.is_file():
            raise FileNotFoundError(f'Chybí vstup: {path.relative_to(ROOT)}')
    with INPUTS[0].open(encoding='utf-8-sig', newline='') as stream:
        rows = list(csv.DictReader(stream))
    ids = {row['kod_obce'] for row in rows}
    years = sorted({int(row['rok']) for row in rows})
    original = json.loads(INPUTS[2].read_text(encoding='utf-8'))
    original_ids = [str(f['properties']['kod_obce']) for f in original['features']]
    display = json.loads(INPUTS[4].read_text(encoding='utf-8'))
    display_ids = [str(f['id']) for f in display['features']]
    if len(original_ids) != len(set(original_ids)) or len(display_ids) != len(set(display_ids)):
        raise ValueError('Duplicitní geografický kód obce.')
    if ids != set(original_ids) or ids != set(display_ids):
        raise ValueError('Kódy obcí v panelu a obou geometriích se liší.')
    if len(ids) != 354 or years != list(range(2000, 2026)):
        raise ValueError('Balíček očekává 354 obcí a roky 2000–2025.')
    return {'municipalities': len(ids), 'years': years, 'inputs_sha256': {
        path.relative_to(ROOT).as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
        for path in INPUTS}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-inputs', action='store_true',
                        help='Pouze ověřit vstupy a vypsat SHA-256; bez přepočtu a bez zápisu.')
    args = parser.parse_args()
    result = check_inputs()
    print(json.dumps(result, ensure_ascii=False, indent=2), flush=True)
    if args.check_inputs:
        return
    print('Úplný přepočet může trvat dlouho: hledání modelů, opakované kontroly stability '
          'a čtyři lokální profily. Výstupy se zapisují do results/ a mohou přepsat '
          'stejnojmenné exporty. Žádné mapové UI se nespouští.', flush=True)
    for name, arguments in [('temporal_pipeline.py', []), ('temporal_report.py', []),
                            ('spatial_sectors.py', []),
                            ('local_migration_groups.py', ['--profile', 'all'])]:
        print(f'\nVýpočet: {name} {" ".join(arguments)}', flush=True)
        subprocess.run([sys.executable, '-X', 'utf8', str(APP/name), *arguments], cwd=ROOT, check=True)
    print('Hotovo. Výsledky: '+str(ROOT/'results'), flush=True)


if __name__ == '__main__':
    # The archived modules read Czech JSON with Python's default encoding.
    # Force UTF-8 in this process and every child, including Windows locales.
    os.environ['PYTHONUTF8'] = '1'
    if not sys.flags.utf8_mode:
        os.execv(sys.executable, [sys.executable, '-X', 'utf8', *sys.argv])
    main()
