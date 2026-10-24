#!/usr/bin/env python3
"""Synthetic tests, optionally followed by raw-data reproduction of all eight local searches."""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parent
APP = ROOT/'ustek_analytics'
sys.path.insert(0, str(APP))


def real_data_check():
    """Recompute point estimates; do not imply reproduction of resampling stability."""
    import numpy as np
    from run_analysis import check_inputs
    from temporal_pipeline import load_panel
    from temporal_features import extract_features, distance_matrix
    from spatial_sectors import get_geometry
    from local_migration_groups import PROFILES, PROFILE_STEMS, search_groups
    check_inputs()
    panel = load_panel()
    ids = panel['ids']
    index = {code:i for i, code in enumerate(ids)}
    geometry = get_geometry()  # Original polygons -> positive shared line; no saved edge fixture.
    if len(geometry['edges']) != 977:
        raise AssertionError(f'Expected 977 original-polygon rook edges, got {len(geometry["edges"])}')
    if geometry['crossvalidation']['original_only'] or geometry['crossvalidation']['display_only']:
        raise AssertionError('Original and coverage-preserving display geometry disagree on adjacency.')
    edges = [(index[a], index[b]) for a,b in geometry['edges']]
    saved = {}
    for profile, stem in PROFILE_STEMS.items():
        path = ROOT/'results'/(stem+'groups.json')
        if not path.is_file():
            raise FileNotFoundError('Chybí lehký referenční export: '+str(path))
        saved[profile] = json.loads(path.read_text(encoding='utf-8'))
        if saved[profile]['meta']['profile'] != profile:
            raise AssertionError('Incorrect profile metadata: '+profile)
    # Independent brute-force merge enumeration (no production edge prefilter).
    sys.path.insert(0, str(ROOT/'tests'))
    from test_local_groups import slow_search_oracle
    checks = []
    for mode, variant in [('immigration', 'shrinkage'), ('emigration', 'baseline')]:
        features = extract_features(panel[mode], panel['population'], panel['years'], variant)
        pairs = distance_matrix(features, .85)
        for profile, parameters in PROFILES.items():
            source = saved[profile]['modes'][mode]
            for key, value in parameters.items():
                if source['parameters'][key] != value:
                    raise AssertionError(f'Saved parameter mismatch: {profile}/{mode}/{key}')
            if source['parameters']['variant'] != variant:
                raise AssertionError('Saved model variant differs from documented selected model.')
            groups = search_groups(pairs, edges, parameters)
            if groups != slow_search_oracle(pairs, edges, parameters):
                raise AssertionError('Optimized search differs from independent full-merge oracle.')
            expected = {tuple(sorted(g['member_ids'])) for g in source['groups']}
            actual = {tuple(ids[i] for i in group) for group in groups}
            if actual != expected:
                raise AssertionError(f'Point-estimate memberships differ: {profile}/{mode}')
            for group in source['groups']:
                members = [index[c] for c in group['member_ids']]
                ii,jj = np.triu_indices(len(members), 1)
                aa,bb = np.array(members)[ii],np.array(members)[jj]
                for key in ('agreement', 'pearson', 'spearman'):
                    np.testing.assert_allclose(group['quality'][key], pairs[key][aa,bb].mean(), rtol=1e-10, atol=1e-10)
                    np.testing.assert_allclose(group['quality']['min_'+key], pairs[key][aa,bb].min(), rtol=1e-10, atol=1e-10)
                for pair in group['pairs']:
                    a,b = index[pair['id_a']],index[pair['id_b']]
                    for key in ('agreement', 'pearson', 'spearman'):
                        np.testing.assert_allclose(pair[key], pairs[key][a,b], rtol=1e-10, atol=1e-10)
                    if pair['informative_years'] != int(pairs['informative_overlap'][a,b]):
                        raise AssertionError('Informative calendar overlap differs.')
            checks.append({'profile':profile, 'mode':mode, 'variant':variant, 'groups':len(groups),
                           'max_group_size':max(map(len,groups),default=0), 'memberships_and_pair_metrics':'PASS',
                           'independent_merge_oracle':'PASS'})
    return {'rook_edges':len(edges), 'contexts':checks,
            'scope':'Point estimates and pair metrics recomputed from raw inputs. Stability/null repetitions require full run_analysis.py.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--real-data', action='store_true',
                        help='Navíc znovu spočítat 977 sousedství a všech 8 bodových lokálních hledání z původních vstupů.')
    args = parser.parse_args()
    suite = unittest.defaultTestLoader.discover(str(ROOT/'tests'), pattern='test_*.py')
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful():
        return 1
    if args.real_data:
        print(json.dumps(real_data_check(), ensure_ascii=False, indent=2), flush=True)
    return 0


if __name__ == '__main__':
    os.environ['PYTHONUTF8'] = '1'
    if not sys.flags.utf8_mode:
        os.execv(sys.executable, [sys.executable, '-X', 'utf8', *sys.argv])
    sys.exit(main())
