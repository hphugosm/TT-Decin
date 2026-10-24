"""Synthetic counterexamples, independent of archived exports and map UI."""
import json, os, subprocess, sys, unittest
from pathlib import Path
import numpy as np
from scipy.linalg import hadamard
from scipy.stats import pearsonr, spearmanr
ROOT = Path(__file__).resolve().parents[1]
APP = ROOT/'ustek_analytics'
sys.path.insert(0,str(APP))
from spatial_sectors import adjacent_delta, components, correlations, haversine, rank_correlations

class SpatialCounterexamples(unittest.TestCase):
    def test_induced_components_never_bridge_through_another_parent(self):
        graph = {'a': {'b'}, 'b': {'a', 'c'}, 'c': {'b'}, 'd': set()}
        self.assertEqual(components(['c', 'a'], graph), [['a'], ['c']])
        self.assertEqual(components(['c', 'b', 'a'], graph), [['a', 'b', 'c']])
        self.assertEqual(components(['d', 'c', 'a', 'b'], graph), components(['b', 'a', 'c', 'd'], graph))

    def test_radius_components_allow_chaining_without_claiming_small_diameter(self):
        coordinates = [[0, 0], [.08, 0], [.16, 0], [1, 0]]
        distance = haversine(coordinates)
        codes = ['a', 'b', 'c', 'd']
        graph = {code: {codes[j] for j in range(4) if j != i and distance[i, j] <= 10} for i, code in enumerate(codes)}
        self.assertEqual(components(codes, graph), [['a', 'b', 'c'], ['d']])
        self.assertGreater(distance[0, 2], 10)
        self.assertLess(distance[0, 1], 10)
        self.assertLess(distance[1, 2], 10)

    def test_rook_adjacency_excludes_corner_and_gap_but_accepts_segment_contact(self):
        code = """import json
from shapely.geometry import box, Polygon
from spatial_sectors import rook_edges
shapes = {'a':box(0,0,1,1), 'b':box(1,0,2,1), 'c':box(2,1,3,2), 'd':box(3.01,1,4,2), 'e':Polygon([(0,1),(0.5,1),(1,1),(1,2),(0,2)])}
print(json.dumps(rook_edges(shapes)))"""
        env = dict(os.environ)
        env['PYTHONPATH'] = str(APP)+os.pathsep+env.get('PYTHONPATH', '')
        runtime = os.environ.get('SPATIAL_GEOMETRY_PYTHON', sys.executable)
        result = subprocess.run([runtime, '-c', code], check=True, capture_output=True, text=True, env=env)
        self.assertEqual(json.loads(result.stdout), [['a', 'b'], ['a', 'e']])

    def test_spearman_reranks_shared_calendar_intersection_with_ties(self):
        a = np.array([0, 3, 3, np.nan, 8, 2, 7, 1, 4, 0, 2, 8, 1], dtype=float)
        b = np.array([9, 2, 1, 1, 7, np.nan, 6, 4, 3, 0, 1, 5, 6], dtype=float)
        result = rank_correlations([a, b])
        shared = np.isfinite(a) & np.isfinite(b)
        self.assertAlmostEqual(result[0, 1], spearmanr(a[shared], b[shared]).statistic, places=10)
        self.assertEqual(result[0, 1], result[1, 0])

    def test_haversine_known_distance_and_duplicate_location(self):
        distance = haversine([[0, 0], [1, 0], [0, 0]])
        self.assertAlmostEqual(distance[0, 1], 111.1950802335329, places=8)
        self.assertEqual(distance[0, 2], 0)
        np.testing.assert_allclose(distance, distance.T)
        np.testing.assert_allclose(np.diag(distance), 0)

    def test_missing_calendar_years_are_not_compressed_or_interpolated(self):
        values = [[10, 30, 40, np.nan, 70, 90]]
        delta = adjacent_delta(values, [2000, 2001, 2003, 2004, 2005, 2006])
        np.testing.assert_allclose(delta, [[np.nan, 20, np.nan, np.nan, np.nan, 20]], equal_nan=True)

    def test_pair_correlations_rerestrict_to_common_finite_years(self):
        rng = np.random.default_rng(264)
        values = rng.normal(size=(5, 26))
        values[0, 3:6] = np.nan
        values[1, 7:11] = np.nan
        values[3] = 7
        values[4, :20] = np.nan
        result = correlations(values)
        for a, b in [(0, 1), (0, 2), (1, 2)]:
            shared = np.isfinite(values[a]) & np.isfinite(values[b])
            self.assertAlmostEqual(result[a, b], pearsonr(values[a, shared], values[b, shared]).statistic, places=10)
        self.assertTrue(np.isnan(result[3]).all())
        self.assertTrue(np.isnan(result[4]).all())
