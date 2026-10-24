#!/usr/bin/env python3
"""Build the atlas's audited static data directly from the delivery ZIP.

Uses only the standard library. Reads allowlisted entries; never extracts or
executes archive code. Original analytical JSON values are not rounded/refit.
"""
import argparse
import hashlib
import io
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ZIP = ROOT / 'delivery/Migrace_Ustecky_kraj_KOMPLET_2026-10-24.zip'
PROFILES = {
    'balanced': 'results/local_migration_groups.json',
    'relaxed': 'results/local_migration_relaxed_groups.json',
    'loose': 'results/local_migration_loose_groups.json',
    'extended': 'results/local_migration_extended_groups.json',
}
MODES = ('immigration', 'emigration')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f'Duplicate JSON key: {key}')
        result[key] = value
    return result


def digest(value):
    return hashlib.sha256(value).hexdigest()


def numeric_array(values, length, label):
    require(isinstance(values, list) and len(values) == length, f'Misaligned {label}')
    require(all(v is None or (type(v) in (int, float) and math.isfinite(v))
                for v in values), f'Nonfinite/nonnumeric {label}')


def build(archive):
    hashes = {}
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        candidates = [n[:-len('results/temporal_dashboard.json')] for n in names
                      if n.endswith('results/temporal_dashboard.json')]
        require(len(candidates) == 1, 'Expected exactly one temporal dashboard')
        prefix = candidates[0]

        def read(relative):
            entry = prefix + relative
            require(names.count(entry) == 1, f'Missing/duplicate ZIP entry: {entry}')
            raw = z.read(entry)
            hashes[entry] = {'sha256': digest(raw), 'bytes': len(raw)}
            return raw

        def load(relative):
            return json.loads(read(relative), object_pairs_hook=unique_object,
                              parse_constant=lambda value: (_ for _ in ()).throw(
                                  ValueError(f'Invalid JSON constant {value}')))

        temporal = load('results/temporal_dashboard.json')
        profiles = {key: load(path) for key, path in PROFILES.items()}
        geography = load('ustek_analytics/data/radar-geography.json')
        manifest = load('results/analysis_manifest.json')
        source_doc = 'audit_dcuk1_2026-10-23/sources/dokumentace_uloha1_hlavni_dataset.docx'
        with zipfile.ZipFile(io.BytesIO(read(source_doc))) as doc:
            xml = ET.fromstring(doc.read('word/document.xml'))
            doc_text = ' '.join(node.text for node in xml.iter()
                                if node.tag.endswith('}t') and node.text)

    years = temporal['years']
    require(years == list(range(2000, 2026)), 'Expected 26 aligned years 2000–2025')
    municipalities = temporal['municipalities']
    ids = [m['id'] for m in municipalities]
    known = set(ids)
    require(len(ids) == len(known) == 354, 'Expected 354 unique municipality IDs')
    base = temporal['meta']['analysis_id']
    series = {'meta': temporal['meta'], 'years': years, 'municipalities': []}
    for m in municipalities:
        row = {k: m[k] for k in ('id', 'name', 'district', 'orp', 'population')}
        numeric_array(m['population'], 26, f"{m['id']}.population")
        for mode in MODES:
            row[mode] = {k: m[mode][k] for k in ('raw', 'rate', 'modeled', 'delta')}
            for key, values in row[mode].items():
                numeric_array(values, 26, f"{m['id']}.{mode}.{key}")
        series['municipalities'].append(row)
    summaries = {}
    for profile, data in profiles.items():
        require(data['years'] == years, f'Years differ: {profile}')
        require(data['meta']['base_analysis_id'] == base, f'Base differs: {profile}')
        require(data['meta']['profile'] == profile, f'Profile differs: {profile}')
        local_ids = [m['id'] for m in data['municipalities']]
        require(len(local_ids) == 354 and set(local_ids) == known, f'IDs differ: {profile}')
        summaries[profile] = {}
        for mode in MODES:
            model = data['modes'][mode]
            require(model['parameters']['variant'] == temporal['analyses'][mode]['selected']['variant'],
                    f'Model variant differs: {profile}/{mode}')
            membership = model['memberships']
            require(set(membership) == known, f'Membership IDs differ: {profile}/{mode}')
            expected = {code: 'UNASSIGNED' for code in ids}
            group_ids = set()
            for group in model['groups']:
                gid, members = group['id'], group['member_ids']
                require(gid != 'UNASSIGNED' and gid not in group_ids, f'Duplicate group: {gid}')
                group_ids.add(gid)
                require(len(members) >= 2 and len(members) == len(set(members)), f'Invalid members: {gid}')
                require(set(members) <= known, f'Unknown group member: {gid}')
                require(group['quality']['count'] == len(members), f'Group count differs: {gid}')
                for code in members:
                    require(expected[code] == 'UNASSIGNED', f'Multiple groups for {code}')
                    expected[code] = gid
            require(membership == expected, f'Group/member map differs: {profile}/{mode}')
            assigned = sum(gid != 'UNASSIGNED' for gid in membership.values())
            require(model['summary']['assigned'] == assigned and
                    model['summary']['unassigned'] == 354 - assigned and
                    model['summary']['groups'] == len(group_ids), f'Summary differs: {profile}/{mode}')
            summaries[profile][mode] = model['summary']
    require(geography['type'] == 'FeatureCollection', 'Expected GeoJSON FeatureCollection')
    geo_ids = [f['properties']['code'] for f in geography['features']]
    require(len(geo_ids) == 354 and set(geo_ids) == known, 'Geometry IDs differ')
    require(all('name' in f['properties'] for f in geography['features']), 'Missing geometry names')

    try:
        archive_path = str(archive.relative_to(ROOT))
    except ValueError:
        archive_path = str(archive)
    provenance = {
        'source_zip': {'path': archive_path, 'sha256': digest(archive.read_bytes())},
        'entries': hashes,
        'analysis_ids': {'base': base, 'profiles': {k: v['meta']['analysis_id'] for k, v in profiles.items()},
                         'spatial': profiles['balanced']['meta']['spatial_analysis_id']},
        'coverage': {'municipalities': 354, 'years': years},
        'dates': {'package_date': '2026-10-24', 'source_audit_directory_date': '2026-10-23',
                  'source_publication_or_download_date': None,
                  'note': 'Package/audit dates are filename labels, not confirmed source publication dates.'},
        'units': {'raw': 'persons per calendar year', 'rate': 'persons per 1,000 population',
                  'population': 'persons; pocet_obyvatel_1_7 (1 July), exposure for per-1,000 rates',
                  'modeled': {'immigration': 'empirical-Bayes shrunk rate per 1,000 population',
                              'emigration': 'unshrunk baseline rate per 1,000 population'},
                  'delta': 'calendar-aligned first difference of modeled rate; first year null'},
        'documentation': {'population_field_present': 'pocet_obyvatel_1_7' in doc_text,
                          'population_manifest_description': manifest.get('population'),
                          'source_document_entry': prefix + source_doc,
                          'source': 'ČSÚ OBY01B01, according to bundled source documentation'},
        'transformation': 'Allowlisted ZIP JSON copied without rounding, refitting, imputation or script execution; annual series projected to requested fields.',
        'validation': {'passed': True, 'unique_ids': 354, 'aligned_years': 26,
                       'group_membership_consistent': True, 'finite_or_null_series': True,
                       'model_base_consistent': True},
        'summaries': summaries,
    }
    return {'clusters.json': {'profiles': profiles}, 'series.json': series,
            'geography.json': geography, 'provenance.json': provenance}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--zip', type=Path, default=DEFAULT_ZIP, help='Delivery ZIP (default: project delivery folder)')
    args = parser.parse_args()
    outputs = build(args.zip.resolve())
    destination = Path(__file__).resolve().parent / 'data'
    destination.mkdir(parents=True, exist_ok=True)
    for name, data in outputs.items():
        raw = json.dumps(data, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode('utf-8')
        (destination / name).write_bytes(raw)
        print(f'{name}: {len(raw):,} bytes; SHA256 {digest(raw)}')
    print('Validation passed: 354 unique IDs, 26 aligned years, four profiles, both modes, consistent membership/model base, finite-or-null series.')


if __name__ == '__main__':
    main()
