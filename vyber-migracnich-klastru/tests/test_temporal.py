"""Synthetic counterexamples, independent of archived exports and map UI."""
import json, os, subprocess, sys, unittest
from pathlib import Path
import numpy as np
from scipy.linalg import hadamard
from scipy.stats import pearsonr, spearmanr
ROOT = Path(__file__).resolve().parents[1]
APP = ROOT/'ustek_analytics'
sys.path.insert(0,str(APP))
from temporal_features import extract_features, distance_matrix
from temporal_cluster import select_cut, nested_macro, fixed_universe_ari, shared_block_indices, resample_features
from temporal_pipeline import shifted_features, cluster_id, cluster_exports, clean, evaluate_search, validate_selected

def trajectory(changes, start=10000):
    return np.r_[start, start + np.cumsum(changes)]

class TemporalCounterexamples(unittest.TestCase):
    def features(self, counts, **kwargs):
        counts = np.asarray(counts, dtype=float)
        return extract_features(counts, years=np.arange(2000, 2000 + counts.shape[1]), **kwargs)

    def test_same_calendar_pattern_despite_hundredfold_size(self):
        x = trajectory([10, -4, 8, -12, 3, 7, -5, 11, -9, 2])
        f = self.features([x, x * 100])
        p = distance_matrix(f)
        self.assertAlmostEqual(p['agreement'][0, 1], 1)
        self.assertLess(p['distance'][0, 1], 1e-10)
        np.testing.assert_allclose(f['scaled_delta'][0], f['scaled_delta'][1], equal_nan=True)

    def test_opposites_are_distant(self):
        changes = np.array([10, -4, 8, -12, 3, 7, -5, 11, -9, 2])
        f = self.features([trajectory(changes), trajectory(-changes)])
        p = distance_matrix(f)
        self.assertAlmostEqual(p['agreement'][0, 1], 0)
        self.assertAlmostEqual(p['opposite'][0, 1], 1)
        self.assertGreater(p['distance'][0, 1], .99)

    def test_time_shift_is_not_realigned(self):
        changes = np.tile([10, -5], 8)
        p = distance_matrix(self.features([trajectory(changes), trajectory(np.roll(changes, 1))]))
        self.assertGreater(p['distance'][0, 1], .99)

    def test_one_random_extreme_does_not_define_a_cluster(self):
        quiet = np.full(26, 2.)
        spike = quiet.copy()
        spike[12] = 40
        f = self.features([spike, spike.copy(), quiet])
        p = distance_matrix(f)
        self.assertFalse(p['reliable_pair'][0, 1])
        self.assertEqual(p['distance'][0, 1], 1)
        self.assertTrue(np.all(select_cut(f, p)['labels'] == -1))

    def test_reliability_suppresses_low_count_jitter_preserves_small_signal(self):
        jitter = np.tile([1., 2.], 13)
        sustained = np.tile([0., 50.], 13)
        counts = np.array([jitter, jitter, sustained, sustained])
        population = np.full_like(counts, 60.)
        f = self.features(counts, population=population, variant='reliability')
        self.assertEqual(np.count_nonzero(np.nan_to_num(f['direction'][0])), 0)
        self.assertGreaterEqual(np.count_nonzero(np.nan_to_num(f['direction'][2])), 20)
        p = distance_matrix(f)
        self.assertFalse(p['reliable_pair'][0, 1])
        self.assertTrue(p['reliable_pair'][2, 3])
        self.assertLess(p['distance'][2, 3], 1e-9)

    def test_zeros_and_unknowns_do_not_create_similarity(self):
        f = self.features([np.zeros(26), np.zeros(26), np.full(26, np.nan)])
        p = distance_matrix(f)
        self.assertTrue(np.isnan(p['agreement'][0, 1]))
        self.assertEqual(p['distance'][0, 1], 1)
        self.assertFalse(p['reliable_pair'].any())
        self.assertTrue(np.all(select_cut(f, p)['labels'] == -1))
        self.assertTrue(np.isnan(f['direction'][2]).all())

    def test_missing_observation_and_calendar_gap_are_never_bridged(self):
        f = extract_features([[10, 20, np.nan, 35, 40, 90]], years=[2000, 2001, 2002, 2003, 2004, 2006])
        np.testing.assert_allclose(f['delta'][0], [np.nan, 10, np.nan, np.nan, 5, np.nan], equal_nan=True)
        self.assertTrue(np.isnan(f['direction'][0, 0]))

    def test_correlations_match_independent_pairwise_calendar_intersections(self):
        rng = np.random.default_rng(1978)
        counts = np.array([trajectory(rng.integers(-20, 21, 20)) for _ in range(7)], dtype=float)
        counts[0, 4] = np.nan
        counts[1, 8:10] = np.nan
        counts[2, 14] = np.nan
        f = self.features(counts)
        pairs = distance_matrix(f)
        for i in range(7):
            for j in range(i+1, 7):
                a, b = f['scaled_delta'][i], f['scaled_delta'][j]
                shared = np.isfinite(a) & np.isfinite(b)
                self.assertAlmostEqual(pairs['pearson'][i, j], pearsonr(a[shared], b[shared]).statistic, places=10)
                self.assertAlmostEqual(pairs['spearman'][i, j], spearmanr(a[shared], b[shared]).statistic, places=10)
                self.assertEqual(pairs['informative_overlap'][i, j], np.sum(shared & (f['direction'][i] != 0) & (f['direction'][j] != 0)))
        np.testing.assert_allclose(pairs['distance'], pairs['distance'].T)
        self.assertTrue(np.all((pairs['distance'] >= 0) & (pairs['distance'] <= 1)))

    def test_population_rates_have_correct_units(self):
        f = self.features([[2, 6, 9], [20, 60, 90]], population=[[100, 200, 300], [1000, 2000, 3000]])
        np.testing.assert_allclose(f['rates'], [[20, 30, 30], [20, 30, 30]])
        np.testing.assert_allclose(f['delta'][:, 1:], [[10, 0], [10, 0]])

    def test_separate_measurements_can_have_opposite_assignments(self):
        changes = np.tile([8, -5, 4, -9], 4)
        immigration = self.features([trajectory(changes), trajectory(changes), trajectory(-changes)])
        emigration = self.features([trajectory(changes), trajectory(-changes), trajectory(changes)])
        a, b = distance_matrix(immigration), distance_matrix(emigration)
        self.assertLess(a['distance'][0, 1], .01)
        self.assertGreater(b['distance'][0, 1], .99)
        self.assertGreater(a['distance'][0, 2], .99)
        self.assertLess(b['distance'][0, 2], .01)
        self.assertEqual(select_cut(immigration, a)['labels'].tolist(), [0, 0, -1])
        self.assertEqual(select_cut(emigration, b)['labels'].tolist(), [0, -1, 0])

    def test_no_fixed_k_and_more_than_twenty_distinct_groups(self):
        # Orthogonal balanced calendar sign patterns: exactly matching twins,
        # but every unrelated pair disagrees during half the observed years.
        patterns = hadamard(32)[1:]
        for size in (5, 12, 31):
            with self.subTest(groups=size):
                rows = [trajectory(row * 10) for row in patterns[:size] for _ in range(2)]
                f = self.features(rows)
                p = distance_matrix(f)
                micro = select_cut(f, p)
                labels = micro['labels']
                self.assertEqual(micro['metrics']['clusters'], size)
                self.assertTrue(np.all(labels >= 0))
                for i in range(size):
                    self.assertEqual(labels[2*i], labels[2*i+1])
                self.assertEqual(len(set(labels[::2])), size)
                macro = nested_macro(micro, micro['tree'], p, f, 'balanced')['labels']
                for group in set(labels):
                    self.assertEqual(len(set(macro[labels == group])), 1)
                self.assertTrue(np.all(macro >= 0))

    def test_deterministic_hierarchy_and_unassigned_stability(self):
        changes = np.tile([9, -5, 3, -7], 5)
        f = self.features([trajectory(changes), trajectory(changes), np.zeros(21)])
        p = distance_matrix(f)
        np.testing.assert_array_equal(select_cut(f, p)['labels'], select_cut(f, p)['labels'])
        self.assertEqual(fixed_universe_ari([-1, -1, 0, 0], [-1, -1, 0, 0]), 1)

    def test_resampling_uses_existing_changes_without_new_boundary_differences(self):
        f = self.features([trajectory([1, 7, -3, 12, -9, 4, -5, 8, -2, 6, -4, 11])])
        original = f['delta'].copy()
        shifted = shifted_features(f, [4])
        self.assertTrue(np.isnan(shifted['delta'][0, 0]))
        np.testing.assert_array_equal(np.sort(shifted['delta'][0, 1:]), np.sort(original[0, 1:]))
        np.testing.assert_allclose(shifted['delta'][0, 1:], np.roll(original[0, 1:], 4))
        np.testing.assert_allclose(f['delta'], original, equal_nan=True)
        a = shared_block_indices(12, np.random.default_rng(42), 3)
        b = shared_block_indices(12, np.random.default_rng(42), 3)
        np.testing.assert_array_equal(a, b)
        self.assertTrue(np.all((a >= 0) & (a < 12)))
        for block in a.reshape(-1, 3):
            np.testing.assert_array_equal(np.diff(block) % 12, [1, 1])
        sampled = resample_features(f, np.r_[0, 1+a])
        np.testing.assert_allclose(sampled['delta'][0, 1:], original[0, 1+a])
        self.assertTrue(np.isnan(sampled['delta'][0, 0]))
        self.assertTrue(set(sampled['delta'][0, 1:]).issubset(set(original[0, 1:])))

    def test_independent_poisson_noise_is_not_a_temporal_discovery(self):
        counts = np.random.default_rng(524).poisson(1000, size=(12, 26)).astype(float)
        population = np.full_like(counts, 10000.)
        years = np.arange(2000, 2026)
        variants = {v: extract_features(counts, population, years, v) for v in ('baseline', 'shrinkage', 'reliability')}
        fit, _, _ = evaluate_search(variants, rng=np.random.default_rng(123))
        validation = validate_selected(fit, variants, counts, population, years,
                                       np.random.default_rng(124), bootstraps=8, null_reps=19)
        self.assertGreater(validation['null_model']['approximate_global_tail'], .1)
        self.assertEqual(fit['metrics']['clusters'], 0)

    def test_high_signal_positive_control_survives_full_validation(self):
        rng = np.random.default_rng(813)
        patterns = np.array([rng.choice([1000., 3000.], 26) for _ in range(3)])
        counts = np.repeat(patterns, 2, axis=0)
        population = np.full_like(counts, 10000.)
        years = np.arange(2000, 2026)
        variants = {v: extract_features(counts, population, years, v) for v in ('baseline', 'shrinkage', 'reliability')}
        fit, _, _ = evaluate_search(variants, rng=np.random.default_rng(23))
        self.assertEqual(fit['metrics']['clusters'], 3)
        for i in range(3):
            self.assertEqual(fit['labels'][i*2], fit['labels'][i*2+1])
        validation = validate_selected(fit, variants, counts, population, years,
                                       np.random.default_rng(24), bootstraps=8, null_reps=19)
        for family in ('block', 'poisson'):
            retention = validation['configuration_stability']['balanced'][family]['cluster_consistency']
            self.assertEqual(len(retention), 3)
            for label, value in retention.items():
                self.assertGreaterEqual(value, .5, f'{family} loses high-SNR synchronized pair {label}')
        self.assertLessEqual(validation['null_model']['approximate_global_tail'], .1)

    def test_cluster_year_states_and_cached_string_consistency_keys(self):
        # Four members with shared up/down, one flat year, a mixed year, then
        # enough additional changes for valid pair diagnostics.
        rows = [trajectory([5, -5, 0, sign*3, 4, -4, 6, -6, 7, -7]) for sign in (1, 1, -1, -1)]
        f = self.features(rows)
        pairs = distance_matrix(f)
        panel = {'ids': ['a', 'b', 'c', 'd'], 'years': f['years']}
        validation = {'block': {'cluster_consistency': {0: .85}}, 'poisson': {'cluster_consistency': {0: .75}}}
        direct = cluster_exports(np.zeros(4, dtype=int), pairs, f, panel, 'IMM', 'micro', validation)
        cached = cluster_exports(np.zeros(4, dtype=int), pairs, f, panel, 'IMM', 'micro', json.loads(json.dumps(clean(validation))))
        self.assertEqual(clean(direct), clean(cached))
        group = direct[0]
        self.assertEqual(group['quality']['block_pair_stability'], .85)
        self.assertEqual(group['quality']['poisson_pair_stability'], .75)
        self.assertEqual(group['id'], 'IMM-001')
        yearly = group['yearly']
        self.assertEqual([row['state'] for row in yearly[:5]], ['INSUFFICIENT_DATA', 'GROWING', 'DECLINING', 'STABLE', 'MIXED'])
        self.assertEqual([row['representative_direction'] for row in yearly[:5]], [None, 1, -1, 0, None])
        self.assertEqual(yearly[0]['missing'], 4)
        self.assertIsNone(yearly[0]['median_delta'])
        self.assertIsNone(yearly[3]['synchrony'])
        self.assertEqual(yearly[4]['synchrony'], .5)
        self.assertTrue(all(sum(row[k] for k in ('growing', 'declining', 'stable', 'missing')) == 4 for row in yearly))

    def test_stable_export_ids_have_no_year_input(self):
        for label in (-1, 0, 8, 30, 105):
            for level in ('micro', 'macro'):
                for prefix in ('IMM', 'EMI'):
                    observed = [cluster_id(prefix, label, level) for _ in range(26)]
                    self.assertEqual(len(set(observed)), 1)
                    self.assertEqual(observed[0], 'UNASSIGNED' if label < 0 else prefix+'-'+('M' if level == 'macro' else '')+f'{label+1:03d}')
