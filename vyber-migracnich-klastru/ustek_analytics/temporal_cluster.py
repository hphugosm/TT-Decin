"""Hierarchical, calendar-aligned clustering with no requested number of groups.

All cut heights derive from the distance dendrogram. Unknown pairwise evidence
is distance one; isolated municipalities remain unassigned. Micro and macro
cuts always share a dendrogram and thus form a nested hierarchy.
"""
from __future__ import annotations
import numpy as np
from scipy.cluster.hierarchy import linkage, fcluster
from scipy.spatial.distance import squareform
from sklearn.metrics import adjusted_rand_score, silhouette_score

STRICTNESS = {
    'loose': {'max_distance': .46, 'min_agreement': .62, 'max_opposite': .38},
    'balanced': {'max_distance': .36, 'min_agreement': .70, 'max_opposite': .30},
    'strict': {'max_distance': .27, 'min_agreement': .78, 'max_opposite': .22},
}


def tree_for(distance, method='average'):
    d = np.asarray(distance, dtype=float).copy()
    if d.shape[0] < 2:
        return np.empty((0, 4))
    if not np.isfinite(d).all() or not np.allclose(d, d.T) or np.min(d) < 0:
        raise ValueError('Distance must be finite, symmetric and nonnegative')
    np.fill_diagonal(d, 0)
    return linkage(squareform(d, checks=False), method=method, optimal_ordering=False)


def candidate_heights(tree, strictness='balanced'):
    """Data-derived cut lattice spanning the dendrogram, never a cap on K."""
    ceiling = STRICTNESS[strictness]['max_distance']
    values = np.unique(tree[:, 2]) if len(tree) else np.array([])
    values = values[values <= ceiling]
    # At most 32 order-statistic heights keep repeated null searches tractable.
    # The finest and coarsest available cuts are included; K is unrestricted.
    if len(values) > 32:
        values = values[np.unique(np.rint(np.linspace(0, len(values)-1, 32)).astype(int))]
    return np.unique(np.r_[values + 1e-10, ceiling])


def cut_tree(tree, n, height):
    return fcluster(tree, t=height, criterion='distance') if len(tree) else np.ones(n, dtype=int)


def eligible_labels(labels, pairs, features, strictness='balanced', min_informative=8):
    out = np.asarray(labels, dtype=int).copy()
    settings = STRICTNESS[strictness]
    enough = np.sum(np.abs(np.nan_to_num(features['direction'])) > 0, axis=1) >= min_informative
    out[~enough] = -1
    for group in np.unique(out[out >= 0]):
        ids = np.where(out == group)[0]
        if len(ids) < 2:
            out[ids] = -1
            continue
        a, b = np.triu_indices(len(ids), 1)
        ii, jj = ids[a], ids[b]
        reliable = pairs['reliable_pair'][ii, jj]
        if (np.mean(reliable) < .8
            or np.nanmean(pairs['agreement'][ii[reliable], jj[reliable]]) < settings['min_agreement']
            or np.nanmean(pairs['opposite'][ii[reliable], jj[reliable]]) > settings['max_opposite']):
            out[ids] = -1
    # Stable labels determined by first municipality in sorted source code order.
    groups = sorted((np.where(out == g)[0] for g in np.unique(out[out >= 0])), key=lambda x: x[0])
    result = np.full(len(out), -1, dtype=int)
    for j, idx in enumerate(groups):
        result[idx] = j
    return result


def pair_indices(labels):
    ii, jj = np.triu_indices(len(labels), 1)
    within = (labels[ii] >= 0) & (labels[ii] == labels[jj])
    return ii, jj, within


def diagnostics(labels, pairs, features, with_silhouette=False):
    labels = np.asarray(labels)
    ii, jj, within = pair_indices(labels)
    known = within & pairs['reliable_pair'][ii, jj]
    assigned = labels >= 0
    groups, sizes = np.unique(labels[assigned], return_counts=True)
    n = len(labels)
    agreement = float(np.nanmean(pairs['agreement'][ii[known], jj[known]])) if known.any() else 0.
    opposite = float(np.nanmean(pairs['opposite'][ii[known], jj[known]])) if known.any() else 0.
    coverage = float(assigned.mean())
    informative = float(np.mean(pairs['informative_overlap'][ii[known], jj[known]]) / max(1, features['direction'].shape[1]-1)) if known.any() else 0.
    within_similarity = float(np.mean(1-pairs['distance'][ii[known], jj[known]])) if known.any() else 0.
    between = (labels[ii] >= 0) & (labels[jj] >= 0) & (labels[ii] != labels[jj])
    separation = float(np.mean(pairs['distance'][ii[between], jj[between]]) - np.mean(pairs['distance'][ii[known], jj[known]])) if known.any() and between.any() else 0.
    signs = features['direction']
    informative_count = np.sum(np.abs(np.nan_to_num(signs)) > 0, axis=1)
    positive = np.divide(np.sum(signs > 0, axis=1), informative_count, out=np.full(n, .5), where=informative_count > 0)
    expected = positive[ii]*(positive[jj]) + (1-positive[ii])*(1-positive[jj])
    chance = float(np.mean(expected[known])) if known.any() else .5
    # Coverage prevents an isolated perfect pair dominating the global evidence.
    evidence = coverage * max(0., agreement-chance)
    sil = None
    if with_silhouette and 1 < len(groups) < assigned.sum():
        sil = float(silhouette_score(pairs['distance'][np.ix_(assigned, assigned)], labels[assigned], metric='precomputed'))
    fragmentation = len(groups)/max(1, assigned.sum()/2)
    score = (.26*agreement + .24*coverage + .12*informative + .14*within_similarity
             + .16*separation + .12*evidence - .22*opposite - .10*fragmentation)
    return dict(clusters=len(groups), assigned=int(assigned.sum()), unassigned=int((~assigned).sum()),
                coverage=coverage, agreement=agreement, opposite=opposite,
                informative_coverage=informative, within_similarity=within_similarity,
                separation=separation, chance_agreement=chance, evidence_statistic=evidence,
                fragmentation=fragmentation, silhouette=sil, base_score=float(score),
                minimum_group=int(sizes.min()) if len(sizes) else 0,
                maximum_group=int(sizes.max()) if len(sizes) else 0)


def select_cut(features, pairs, strictness='balanced', method='average', tree=None):
    """Evaluate all data-derived cuts, choose a composite objective, no fixed K."""
    n = len(pairs['distance'])
    if tree is None:
        tree = tree_for(pairs['distance'], method)
    best, candidates = None, []
    for height in candidate_heights(tree, strictness):
        labels = eligible_labels(cut_tree(tree, n, height), pairs, features, strictness)
        metrics = diagnostics(labels, pairs, features)
        record = dict(height=float(height), **metrics)
        candidates.append(record)
        # Prefer broader coverage and lower cut on exact score ties.
        key = (record['base_score'], record['coverage'], -height)
        if best is None or key > best[0]:
            best = (key, labels, record)
    _, labels, record = best
    record.update(diagnostics(labels, pairs, features, with_silhouette=True))
    return dict(labels=labels, metrics=record, candidates=candidates, tree=tree, method=method,
                strictness=strictness, maximum_evidence=max(r['evidence_statistic'] for r in candidates))


def nested_macro(micro, tree, pairs, features, strictness):
    """One coarser cut of the same tree, preserve every assigned micro group.

    Macro groups are descriptive broad families, not separately tested discoveries.
    Unassigned micro members stay unassigned to avoid fabricating weak evidence.
    """
    height = min(.60, max(micro['metrics']['height']+.08, micro['metrics']['height']*1.30))
    labels = cut_tree(tree, len(micro['labels']), height)
    labels[micro['labels'] < 0] = -1
    ordered = sorted((np.where(labels == g)[0] for g in np.unique(labels[labels >= 0])), key=lambda x: x[0])
    result = np.full(len(labels), -1, dtype=int)
    for j, ids in enumerate(ordered):
        result[ids] = j
    return dict(labels=result, height=float(height), metrics=diagnostics(result, pairs, features, True))


def shared_block_indices(length, rng, block=3):
    """Circular moving blocks of existing changes, paired across municipalities."""
    starts = rng.integers(0, length, size=int(np.ceil(length/block)))
    return np.concatenate([(s+np.arange(block)) % length for s in starts])[:length]


def resample_features(features, columns):
    out = dict(features)
    shape = features['direction'].shape
    for key in ('direction', 'reliability', 'delta', 'scaled_delta', 'z', 'informative'):
        if key in out and isinstance(out[key], np.ndarray) and out[key].shape == shape:
            out[key] = out[key][:, columns]
    return out


def fixed_universe_ari(reference, alternative):
    """Unassigned municipalities are unique singletons, not one giant cluster."""
    def encode(labels):
        x = np.asarray(labels).copy()
        largest = max(0, x.max()+1)
        for i in np.where(x < 0)[0]:
            x[i] = largest+i
        return x
    return float(adjusted_rand_score(encode(reference), encode(alternative)))


def stability(reference, repetitions):
    ref = np.asarray(reference)
    ii, jj, within = pair_indices(ref)
    aris, consistency = [], []
    cluster_values = {int(g): [] for g in np.unique(ref[ref >= 0])}
    for labels in repetitions:
        labels = np.asarray(labels)
        aris.append(fixed_universe_ari(ref, labels))
        together = (labels[ii] >= 0) & (labels[ii] == labels[jj])
        consistency.append(float(together[within].mean()) if within.any() else 0.)
        for group in cluster_values:
            mask = within & (ref[ii] == group)
            cluster_values[group].append(float(together[mask].mean()))
    return dict(ari_mean=float(np.mean(aris)) if aris else None,
                ari_std=float(np.std(aris)) if aris else None,
                pair_consistency=float(np.mean(consistency)) if consistency else None,
                cluster_consistency={g: float(np.mean(v)) for g,v in cluster_values.items()},
                repetitions=len(repetitions), ari_values=aris)
