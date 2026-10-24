"""Calendar-aligned migration changes and conservative pairwise distances.

Missing observations are never interpolated. Empirical Bayes hyperparameters are
estimated once from municipality-level pooled observations, not annually.
Count-only inputs use one municipality-year as a fixed exposure unit; consequently
these describe count changes, not population-normalized migration rates.
"""
from __future__ import annotations

import numpy as np
from scipy.special import ndtr
from scipy.stats import rankdata


def _eb_parameters(counts, exposure):
    valid = np.isfinite(counts) & np.isfinite(exposure)
    n = np.where(valid, counts, 0).sum(axis=1)
    e = np.where(valid, exposure, 0).sum(axis=1)
    keep = e > 0
    if not keep.any():
        return 0.0, 10.0, 0.0, 0.0
    mu = float(n[keep].sum() / e[keep].sum())
    municipal_rates = n[keep] / e[keep]
    # The spread of pooled municipality rates includes Poisson sampling noise.
    variance = max(0.0, float(np.var(municipal_rates) - np.mean(mu / e[keep])))
    beta = float(np.clip(mu / variance if variance > 0 else 5000.0, 10, 5000))
    return mu * beta, beta, mu, variance


def extract_features(counts, population=None, years=None, variant='baseline', z_threshold=1.28, variance_inflation=1.0):
    """Return row-wise changes, directions, posterior uncertainty and metadata.

    ``reliability`` is 2*Phi(abs(z))-1: posterior normal-approximation confidence
    in the sign of an independent Gamma posterior difference, mapped to [0,1].
    It is available for all variants, but only reliability distances weight by it.
    Constant rows have zero scaled changes; missing transitions stay NaN.
    """
    if variant not in {'baseline', 'shrinkage', 'reliability'}:
        raise ValueError('Unknown feature variant')
    if not np.isfinite(z_threshold) or z_threshold < 0:
        raise ValueError('z_threshold must be finite and nonnegative')
    if not np.isfinite(variance_inflation) or variance_inflation <= 0:
        raise ValueError('variance_inflation must be finite and positive')
    counts = np.asarray(counts, dtype=float)
    if counts.ndim != 2:
        raise ValueError('counts must have shape [municipality, year]')
    years = np.asarray(years)
    if years.ndim != 1 or len(years) != counts.shape[1]:
        raise ValueError('years must match the columns of counts')
    numeric_years = np.asarray(years, dtype=float)
    if (not np.all(np.isfinite(numeric_years)) or
            np.any(numeric_years != np.floor(numeric_years)) or
            np.any(np.diff(numeric_years) <= 0)):
        raise ValueError('years must be unique increasing calendar years')
    raw = np.where(np.isfinite(counts) & (counts >= 0), counts, np.nan)
    if population is None:
        exposure = np.ones_like(raw)
        multiplier = 1.0
        exposure_unit = 'municipality-year (fixed exposure 1; counts, not per capita)'
    else:
        exposure = np.asarray(population, dtype=float)
        if exposure.shape != raw.shape:
            raise ValueError('population must match counts shape')
        exposure = np.where(np.isfinite(exposure) & (exposure > 0), exposure, np.nan)
        multiplier = 1000.0
        exposure_unit = 'person-year; rates per 1000 residents'
    valid = np.isfinite(raw) & np.isfinite(exposure)
    usable = np.where(valid, raw, np.nan)
    rates = usable / exposure * multiplier
    alpha, beta, mu, variance = _eb_parameters(usable, exposure)
    posterior = (usable + alpha) / (exposure + beta) * multiplier
    posterior_variance = (usable + alpha) / (exposure + beta)**2 * multiplier**2
    modeled = rates.copy() if variant == 'baseline' else posterior.copy()
    delta = np.full_like(raw, np.nan)
    z = np.full_like(raw, np.nan)
    if raw.shape[1] > 1:
        adjacent = np.diff(numeric_years) == 1
        transitions = valid[:, 1:] & valid[:, :-1] & adjacent[None, :]
        delta[:, 1:] = np.where(transitions, np.diff(modeled, axis=1), np.nan)
        post_delta = np.diff(posterior, axis=1)
        sd = np.sqrt(variance_inflation * (posterior_variance[:, 1:] + posterior_variance[:, :-1]))
        standardized = np.divide(post_delta, sd, out=np.zeros_like(sd), where=sd > 0)
        z[:, 1:] = np.where(transitions, standardized, np.nan)
    reliability = np.clip(2 * ndtr(np.abs(z)) - 1, 0, 1)
    scaled_delta = np.full_like(delta, np.nan)
    # Explicit finite selection avoids warnings from entirely missing rows.
    for i, row in enumerate(delta):
        observed = np.isfinite(row)
        if not observed.any():
            continue
        median = np.median(row[observed])
        mad = np.median(np.abs(row[observed] - median))
        if mad > 1e-12:
            scaled_delta[i, observed] = np.clip((row[observed] - median) / (1.4826 * mad), -3.5, 3.5)
        else:
            # MAD can vanish in sparse rows: preserve nonconstant outliers.
            centered = row[observed] - median
            scaled_delta[i, observed] = np.where(np.abs(centered) > 1e-12, np.sign(centered) * 3.5, 0)
    direction = np.where(np.isfinite(delta), np.where(np.abs(delta) > 1e-10, np.sign(delta), 0), np.nan)
    if variant == 'reliability':
        direction = np.where(np.isfinite(delta), np.where(np.abs(z) >= z_threshold, direction, 0), np.nan)
    informative = np.isfinite(direction) & (direction != 0)
    return dict(raw=raw, rates=rates, modeled=modeled, delta=delta,
                exposure=exposure, multiplier=multiplier,
                scaled_delta=scaled_delta, direction=direction, reliability=reliability,
                z=z, informative=informative, posterior=posterior,
                posterior_variance=posterior_variance, years=numeric_years.astype(int),
                variant=variant, alpha=alpha, beta=beta, mu=mu,
                between_municipality_variance=variance, exposure_unit=exposure_unit,
                z_threshold=float(z_threshold), variance_inflation=float(variance_inflation),
                metadata=dict(alpha=alpha, beta=beta, mu=mu,
                              between_municipality_variance=variance, exposure_unit=exposure_unit,
                              variance_inflation=float(variance_inflation)))


def distance_matrix(features, directional_weight=.7, min_informative=8, min_overlap=8):
    """Compute conservative symmetric hybrid distances over shared calendar slots.

    Coverage is shared available transitions / union of available transitions.
    Agreement and opposite fractions condition on *both* nonzero directions;
    their NaN means no weighted informative evidence. Undefined correlations stay
    NaN and contribute maximum distance. A pair must satisfy both overlap minima
    and have positive informative weight to be marked reliable.
    """
    if not 0 <= directional_weight <= 1:
        raise ValueError('directional_weight must lie in [0, 1]')
    if min_informative < 1 or min_overlap < 1:
        raise ValueError('overlap minima must be positive')
    direction = np.asarray(features['direction'], dtype=float)
    changes = np.asarray(features['scaled_delta'], dtype=float)
    confidence = np.asarray(features['reliability'], dtype=float)
    if direction.ndim != 2 or changes.shape != direction.shape or confidence.shape != direction.shape:
        raise ValueError('feature arrays must have matching two-dimensional shapes')
    available = np.isfinite(direction) & np.isfinite(changes)
    overlap = available[:, None, :] & available[None, :, :]
    informative = available & (direction != 0)
    info = informative[:, None, :] & informative[None, :, :]
    informative_overlap = info.sum(axis=2)
    overlap_count = overlap.sum(axis=2)
    informative_coverage = np.divide(informative_overlap, overlap_count, out=np.zeros_like(overlap_count, dtype=float), where=overlap_count > 0)
    one_zero_count = (overlap & ((direction[:, None, :] == 0) ^ (direction[None, :, :] == 0))).sum(axis=2)
    both_zero_count = (overlap & (direction[:, None, :] == 0) & (direction[None, :, :] == 0)).sum(axis=2)
    one_zero_fraction = np.divide(one_zero_count, overlap_count, out=np.zeros_like(overlap_count, dtype=float), where=overlap_count > 0)
    both_zero_fraction = np.divide(both_zero_count, overlap_count, out=np.zeros_like(overlap_count, dtype=float), where=overlap_count > 0)
    union_count = (available[:, None, :] | available[None, :, :]).sum(axis=2)
    coverage = np.divide(overlap_count, union_count, out=np.zeros_like(overlap_count, dtype=float), where=union_count > 0)
    if features.get('variant') == 'reliability':
        weights = np.sqrt(np.nan_to_num(confidence[:, None, :]) * np.nan_to_num(confidence[None, :, :])) * info
    else:
        weights = info.astype(float)
    weight_sum = weights.sum(axis=2)
    same = direction[:, None, :] == direction[None, :, :]
    agreement = np.divide((weights * same).sum(axis=2), weight_sum,
                          out=np.full(weight_sum.shape, np.nan), where=weight_sum > 0)
    opposite = np.where(weight_sum > 0, 1-agreement, np.nan)

    def pairwise_pearson(values):
        # Matrix products compute pair-specific means and variances with missingness.
        mask = np.isfinite(values).astype(float)
        x = np.nan_to_num(values)
        count = mask @ mask.T
        sums = x @ mask.T
        squares = x*x @ mask.T
        cross = x @ x.T
        denominator_count = np.maximum(count, 1)
        covariance = cross - sums*sums.T/denominator_count
        variance = np.maximum(0, squares - sums*sums/denominator_count)
        denominator = np.sqrt(variance*variance.T)
        return np.clip(np.divide(covariance, denominator,
            out=np.full(count.shape, np.nan), where=(count >= 2) & (denominator > 1e-12)), -1, 1)

    values = np.where(available, changes, np.nan)
    pearson = pairwise_pearson(values)
    # Shared missing-column patterns allow exact ranks and one matrix operation.
    # Arbitrary missingness requires reranking within each pair's intersection.
    patterns, group_ids = np.unique(available, axis=0, return_inverse=True)
    n = len(direction)
    spearman = np.full((n, n), np.nan)
    for group_a, pattern_a in enumerate(patterns):
        rows_a = np.flatnonzero(group_ids == group_a)
        for group_b in range(group_a, len(patterns)):
            rows_b = np.flatnonzero(group_ids == group_b)
            shared = pattern_a & patterns[group_b]
            if shared.sum() < 2:
                continue
            ranks_a = rankdata(changes[rows_a][:, shared], axis=1)
            ranks_b = rankdata(changes[rows_b][:, shared], axis=1)
            ranks_a -= ranks_a.mean(axis=1, keepdims=True)
            ranks_b -= ranks_b.mean(axis=1, keepdims=True)
            denominator = np.sqrt((ranks_a*ranks_a).sum(axis=1)[:,None] * (ranks_b*ranks_b).sum(axis=1)[None,:])
            correlations = np.divide(ranks_a @ ranks_b.T, denominator,
                out=np.full(denominator.shape, np.nan), where=denominator > 1e-12)
            spearman[np.ix_(rows_a, rows_b)] = correlations
            spearman[np.ix_(rows_b, rows_a)] = correlations.T
    reliable_pair = (informative_overlap >= min_informative) & (overlap_count >= min_overlap) & (weight_sum >= min_informative * .5)
    corr_distance = ((np.where(np.isfinite(pearson), (1-pearson)/2, 1)) +
                     (np.where(np.isfinite(spearman), (1-spearman)/2, 1))) / 2
    hybrid = directional_weight * (1-np.nan_to_num(agreement)) + (1-directional_weight) * corr_distance
    distance = np.where(reliable_pair, hybrid, 1.0)
    np.fill_diagonal(distance, 0.0)
    return dict(distance=distance, agreement=agreement, opposite=opposite,
                informative_overlap=informative_overlap, coverage=coverage,
                informative_coverage=informative_coverage, one_zero_fraction=one_zero_fraction,
                both_zero_fraction=both_zero_fraction, effective_informative_weight=weight_sum,
                pearson=pearson, spearman=spearman, reliable_pair=reliable_pair)
