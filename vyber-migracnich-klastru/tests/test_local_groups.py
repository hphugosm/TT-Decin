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
from local_migration_groups import search_groups, admissible, label_groups, pair_retention, shifted_features, PARAMETERS, PROFILES

class FeatureCounterexamples(unittest.TestCase):
    def test_same_shapes_different_magnitudes_opposites_and_lags(self):
        wave = np.array([1, 4, 2, 7, 3, 9, 2, 8, 5, 1, 6, 3, 8, 2, 9, 4, 1, 8, 3, 7, 2, 6, 1, 9, 5, 2.])
        values = np.array([wave, wave*11+15, 12-wave, np.roll(wave,1)])
        features = extract_features(values, years=np.arange(2000,2026))
        pair = distance_matrix(features, min_informative=12)
        self.assertAlmostEqual(pair['pearson'][0,1],1,places=10)
        self.assertAlmostEqual(pair['spearman'][0,1],1,places=10)
        self.assertEqual(pair['agreement'][0,1],1)
        self.assertLess(pair['pearson'][0,2],-.99)
        self.assertEqual(pair['agreement'][0,2],0)
        self.assertLess(pair['pearson'][0,3],.4,'Calendar lag must not be aligned away')

    def test_no_information_and_gaps_do_not_create_similarity(self):
        features = extract_features([[4]*14,[8]*14], years=np.arange(2000,2014))
        pair = distance_matrix(features,min_informative=12)
        self.assertFalse(pair['reliable_pair'][0,1])
        self.assertTrue(np.isnan(pair['agreement'][0,1]))
        features = extract_features([[10,20,40,30,50,60],[20,40,80,60,100,120]], years=[2000,2001,2003,2004,2005,2006])
        self.assertTrue(np.isnan(features['delta'][:,2]).all())
        pair = distance_matrix(features,min_informative=4,min_overlap=4)
        self.assertEqual(pair['informative_overlap'][0,1],4)
        self.assertTrue(np.isnan(features['delta'][:,0]).all())

def synthetic_pairs(n, good_pairs):
    ok=np.eye(n,dtype=bool)
    for a,b in good_pairs:ok[a,b]=ok[b,a]=True
    return dict(agreement=np.where(ok,.9,.2),pearson=np.where(ok,.8,-.2),spearman=np.where(ok,.8,-.2),informative_overlap=np.full((n,n),25),reliable_pair=np.ones((n,n),bool),distance=np.where(ok,.1,.9))

def slow_search_oracle(p, edges, parameters):
    """Direct original rook merge enumeration, independent of optimized prefilter."""
    n=len(p['agreement']);groups=[(i,) for i in range(n)]
    q=parameters
    good=np.asarray(p['reliable_pair'],bool)&(p['informative_overlap']>=q['min_informative'])&(p['agreement']>=q['min_agreement'])&(p['pearson']>=q['min_pearson'])&(p['spearman']>=q['min_spearman'])
    distance=p.get('distance',p.get('temporal_distance'))
    edge_set={tuple(sorted(e)) for e in edges}
    while True:
        candidates=[]
        for i,a in enumerate(groups):
            for j,b in enumerate(groups[i+1:],i+1):
                if not any(tuple(sorted((x,y))) in edge_set for x in a for y in b):continue
                ix=np.ix_(a,b)
                if good[ix].all():candidates.append((float(distance[ix].max()),tuple(sorted(a+b)),i,j))
        if not candidates:break
        _,merged,i,j=min(candidates)
        groups=[g for k,g in enumerate(groups) if k not in (i,j)]+[merged]
        groups.sort()
    return sorted(g for g in groups if len(g)>1)

class SearchCounterexamples(unittest.TestCase):
    def test_disconnected_similar_towns_never_merge(self):
        self.assertEqual(search_groups(synthetic_pairs(3,[(0,2)]),[(0,1),(1,2)]),[])

    def test_weak_bridge_does_not_collapse_incompatible_endpoints(self):
        pairs=synthetic_pairs(3,[(0,1),(1,2)])
        self.assertEqual(search_groups(pairs,[(0,1),(1,2)]),[(0,1)])

    def test_connected_three_way_requires_all_pairs_not_direct_all_neighbors(self):
        self.assertEqual(search_groups(synthetic_pairs(3,[(0,1),(1,2),(0,2)]),[(0,1),(1,2)]),[(0,1,2)])

    def test_thresholds_each_have_effect_and_nan_cannot_pass(self):
        for key,value in [('agreement',.6999),('pearson',.3999),('spearman',.3999),('informative_overlap',11),('reliable_pair',False),('pearson',np.nan)]:
            with self.subTest(key=key,value=value):
                p=synthetic_pairs(2,[(0,1)]);p[key][0,1]=p[key][1,0]=value
                self.assertEqual(search_groups(p,[(0,1)]),[])
        p=synthetic_pairs(2,[(0,1)])
        p['agreement'][:]=.7;p['pearson'][:]=.4;p['spearman'][:]=.4;p['informative_overlap'][:]=12
        self.assertEqual(search_groups(p,[(0,1)]),[(0,1)])

    def test_edge_order_and_tie_resolution_are_deterministic(self):
        p=synthetic_pairs(4,[(0,1),(1,2),(2,3)])
        self.assertEqual(search_groups(p,[(2,3),(1,2),(0,1)]),[(0,1),(2,3)])
        self.assertEqual(search_groups(p,[(1,0),(2,1),(3,2)]),[(0,1),(2,3)])

    def test_no_target_k_or_thirty_group_cap(self):
        good=[(i,i+1) for i in range(0,82,2)]
        self.assertEqual(search_groups(synthetic_pairs(83,good),good),good)

    def test_independent_circular_null_preserves_joint_feature_masks(self):
        n,width=7,26
        origin=np.arange(n*width,dtype=float).reshape(n,width);origin[:,0]=np.nan;origin[2,5]=np.nan
        features={k:origin.copy() for k in ('direction','reliability','delta','scaled_delta','z')}
        features['informative']=np.isfinite(origin);before={k:v.copy() for k,v in features.items()}
        expected_rng=np.random.default_rng(12);shifts=expected_rng.integers(0,width-1,size=n)
        shifted=shifted_features(features,np.random.default_rng(12))
        self.assertGreater(len(set(shifts)),1)
        for key in features:
            np.testing.assert_array_equal(features[key],before[key])
            for i,shift in enumerate(shifts):
                np.testing.assert_array_equal(shifted[key][i,1:],np.roll(features[key][i,1:],shift))
                np.testing.assert_array_equal(shifted[key][i,:1],features[key][i,:1])

    def test_pair_retention_and_unique_unassigned_labels(self):
        ref=[(0,1,2),(3,4)];samples=[label_groups(ref,6),label_groups([(0,1),(3,4)],6)]
        np.testing.assert_allclose(pair_retention(ref,samples,6),[2/3,1])
        labels=label_groups([],6);self.assertEqual(len(set(labels)),6)

class ProfileCounterexamples(unittest.TestCase):
    def test_extended_six_members_need_every_pair_not_just_connecting_neighbors(self):
        p=synthetic_pairs(6,[(a,b) for a in range(6) for b in range(a+1,6)])
        p['agreement'][:]=.60;p['pearson'][:]=.15;p['spearman'][:]=.15;edges=[(i,i+1) for i in range(5)]
        self.assertEqual(search_groups(p,edges,PROFILES['extended']),[(0,1,2,3,4,5)])
        self.assertEqual(search_groups(p,edges,PROFILES['loose']),[])
        for key,value in [('agreement',.5999),('pearson',.1499),('spearman',.1499),('informative_overlap',11),('reliable_pair',False)]:
            q={k:v.copy() for k,v in p.items()};q[key][0,5]=q[key][5,0]=value
            result=search_groups(q,edges,PROFILES['extended'])
            self.assertFalse(any(0 in g and 5 in g for g in result),'Distant endpoints still must pass all unchanged guards: '+key)

    def test_safe_edge_optimization_matches_unfiltered_oracle_on_random_graphs_and_ties(self):
        rng=np.random.default_rng(2426)
        for rep in range(80):
            n=int(rng.integers(3,13));a=rng.choice([.1,.2,.3,.4,.6,.7,.8,.9],(n,n));a=(a+a.T)/2
            p=dict(agreement=a,pearson=a,spearman=a,informative_overlap=np.full((n,n),25),reliable_pair=np.ones((n,n),bool),distance=np.round(1-a,1))
            edges=[(i,j) for i in range(n) for j in range(i+1,n) if rng.random()<.35]
            for profile in PROFILES:
                self.assertEqual(search_groups(p,edges,PROFILES[profile]),slow_search_oracle(p,edges,PROFILES[profile]),(rep,profile))

    def test_loose_still_checks_every_endpoint_and_calendar_coverage(self):
        p=synthetic_pairs(4,[(a,b) for a in range(4) for b in range(a+1,4)])
        p['agreement'][:]=.60;p['pearson'][:]=.20;p['spearman'][:]=.20;edges=[(0,1),(1,2),(2,3)]
        self.assertEqual(search_groups(p,edges,PROFILES['loose']),[(0,1,2,3)])
        self.assertEqual(search_groups(p,edges,PROFILES['relaxed']),[])
        for key,value in [('agreement',.5999),('pearson',.1999),('spearman',.1999),('informative_overlap',11),('reliable_pair',False)]:
            q={k:v.copy() for k,v in p.items()};q[key][0,3]=q[key][3,0]=value
            result=search_groups(q,edges,PROFILES['loose'])
            self.assertFalse(any(0 in g and 3 in g for g in result),'Weak endpoints cannot coexist, even behind two bridging neighbors: '+key)

    def test_relaxed_thresholds_accept_only_explicitly_relaxed_pairs(self):
        p=synthetic_pairs(3,[(0,1),(1,2),(0,2)])
        p['agreement'][:]=.65;p['pearson'][:]=.30;p['spearman'][:]=.30
        edges=[(0,1),(1,2)]
        self.assertEqual(search_groups(p,edges,PROFILES['balanced']),[])
        self.assertEqual(search_groups(p,edges,PROFILES['relaxed']),[(0,1,2)])
        for key,value in [('agreement',.6499),('pearson',.2999),('spearman',.2999),('informative_overlap',11),('reliable_pair',False)]:
            q={k:v.copy() for k,v in p.items()};q[key][0,2]=q[key][2,0]=value
            self.assertEqual(search_groups(q,edges,PROFILES['relaxed']),[(0,1)],'Relaxation does not permit a weak endpoint or ignore coverage: '+key)
