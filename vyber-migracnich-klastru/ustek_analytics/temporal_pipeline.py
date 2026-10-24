#!/usr/bin/env python3
"""Offline temporal migration analysis. The browser only reads these exports.

Run: python3 ustek_analytics/temporal_pipeline.py
No fixed K, no DTW, no annual refit, no geographic or population-size features.
"""
from __future__ import annotations
import os
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
os.environ.setdefault('OMP_NUM_THREADS', '1')
import argparse
import csv
import hashlib
import inspect
import json
from pathlib import Path
import warnings
import numpy as np
from temporal_features import extract_features, distance_matrix
from temporal_cluster import (STRICTNESS, tree_for, select_cut, eligible_labels, cut_tree,
    diagnostics, nested_macro, shared_block_indices, resample_features, stability, fixed_universe_ari)

BASE = Path(__file__).resolve().parent
PROJECT = BASE.parent
SOURCE = PROJECT/'audit_dcuk1_2026-10-23/sources'
DEFAULT_OUT = PROJECT/'results'
SEED = 20261023
VARIANTS = ('baseline', 'shrinkage', 'reliability')
WEIGHTS = (.60, .70, .85)
METHODS = ('average', 'complete')


def clean(value):
    if isinstance(value, dict): return {str(k): clean(v) for k,v in value.items()}
    if isinstance(value, (list, tuple)): return [clean(v) for v in value]
    if isinstance(value, np.ndarray): return clean(value.tolist())
    if isinstance(value, (np.integer,)): return int(value)
    if isinstance(value, (float, np.floating)): return float(value) if np.isfinite(value) else None
    if isinstance(value, np.bool_): return bool(value)
    return value


def dump(path, value):
    path.write_text(json.dumps(clean(value), ensure_ascii=False, allow_nan=False, separators=(',', ':')), encoding='utf-8')


def write_csv(path, records):
    records = [clean(r) for r in records]
    fields = list(dict.fromkeys(k for r in records for k in r))
    with path.open('w', encoding='utf-8-sig', newline='') as f:
        writer = csv.DictWriter(f, fields)
        writer.writeheader()
        writer.writerows({k: json.dumps(v, ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in r.items()} for r in records)


def number(value):
    try:
        n = float(value)
        return n if np.isfinite(n) else np.nan
    except (ValueError, TypeError): return np.nan


def load_panel(source=SOURCE):
    """Validate totals, duplicates and exposure without imputing any observations."""
    with (source/'migrace_vek_obce_rok.csv').open(encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))
    with (source/'uloha1_obce_rok_final.csv').open(encoding='utf-8-sig', newline='') as f:
        main = list(csv.DictReader(f))
    unique, duplicate_count = {}, 0
    for row in rows:
        key = row['kod_obce'], int(row['rok'])
        if key in unique:
            if row != unique[key]: raise ValueError(f'Conflicting duplicate migration key {key}')
            duplicate_count += 1
        unique[key] = row
    exposure_rows = {}
    for row in main:
        key = row['kod_obce'], int(row['rok'])
        if key in exposure_rows and row != exposure_rows[key]: raise ValueError(f'Conflicting population key {key}')
        exposure_rows[key] = row
    ids = sorted({key[0] for key in unique})
    years = list(range(min(key[1] for key in unique), max(key[1] for key in unique)+1))
    shape = len(ids), len(years)
    pop, imm, emi = (np.full(shape, np.nan) for _ in range(3))
    municipalities, adjustments, extremes = [], [], []
    for i, code in enumerate(ids):
        observed = [unique[code,y] for y in years if (code,y) in unique]
        names = sorted({r['nazev_obce'] for r in observed})
        if len(names) > 1: adjustments.append(dict(code=code, issue='name_changes', values=names))
        latest = observed[-1]
        municipalities.append(dict(id=code,name=latest['nazev_obce'],district=latest['nazev_okresu'],orp=latest['nazev_orp']))
        for j, year in enumerate(years):
            row, primary = unique.get((code,year)), exposure_rows.get((code,year))
            if row is None:
                adjustments.append(dict(code=code, year=year, issue='missing_migration_year', action='retain missing'))
                continue
            if row['kod_kraje'] != 'CZ042': raise ValueError(f'Unexpected region {code}/{year}')
            for mode, column, age_prefix, target in [('immigration','pristehovali_celkem','pristehovali',imm), ('emigration','vystehovali_celkem','vystehovali',emi)]:
                total = number(row[column])
                age = [number(row[f'{age_prefix}_{suffix}']) for suffix in ('0_14','15_64','65_plus')]
                if np.isfinite(total):
                    if total < 0 or total != int(total): raise ValueError(f'Invalid migrant count {code}/{year}/{mode}')
                    if np.isfinite(age).all() and total != sum(age): raise ValueError(f'Age total mismatch {code}/{year}/{mode}')
                    if primary is not None and number(primary[age_prefix]) != total: raise ValueError(f'Cross-source mismatch {code}/{year}/{mode}')
                else: adjustments.append(dict(code=code,year=year,issue=f'missing_{mode}',action='retain missing'))
                target[i,j] = total
            p = number(primary.get('pocet_obyvatel_1_7')) if primary else np.nan
            if p > 0: pop[i,j] = p
            else: adjustments.append(dict(code=code,year=year,issue='missing_or_nonpositive_population',action='retain missing rate'))
            if j and np.isfinite(pop[i,j-1]) and np.isfinite(pop[i,j]) and abs(pop[i,j]/pop[i,j-1]-1) > .20:
                extremes.append(dict(code=code,year=year,relative_population_jump=pop[i,j]/pop[i,j-1]-1))
    geometry = json.loads((BASE/'data/geometry.json').read_text())
    geo_ids = [str(f.get('id',f['properties'].get('id'))) for f in geometry['features']]
    if len(geo_ids) != len(set(geo_ids)) or set(geo_ids) != set(ids): raise ValueError('Geographic code join is not one-to-one')
    return dict(ids=ids,years=years,population=pop,immigration=imm,emigration=emi,municipalities=municipalities,
                audit=dict(source_rows=len(rows),unique_rows=len(unique),duplicate_rows_removed=duplicate_count,
                    missing_cells={k:int(np.isnan(v).sum()) for k,v in [('population',pop),('immigration',imm),('emigration',emi)]},
                    preprocessing_log=adjustments,population_jumps_over_20_percent=extremes,geometry_matches=len(geo_ids),
                    aggregation='Use totals once; age bands validate totals and are never added to totals',
                    temporal_geography='Static supplied boundaries; historical boundary/code harmonization not independently established'))


def pairs_with_weight(pairs, weight):
    out = dict(pairs)
    corr = (np.where(np.isfinite(pairs['pearson']),(1-pairs['pearson'])/2,1) + np.where(np.isfinite(pairs['spearman']),(1-pairs['spearman'])/2,1))/2
    d = weight*(1-np.nan_to_num(pairs['agreement'])) + (1-weight)*corr
    out['distance'] = np.where(pairs['reliable_pair'], d, 1.)
    np.fill_diagonal(out['distance'], 0.)
    return out


def evaluate_search(features_by_variant, strictness='balanced', include_stability=True, rng=None):
    records, fitted = [], []
    for variant, feat in features_by_variant.items():
        initial = distance_matrix(feat)
        for weight in WEIGHTS:
            pairs = pairs_with_weight(initial, weight)
            for method in METHODS:
                fit = select_cut(feat,pairs,strictness,method)
                record = dict(variant=variant,directional_weight=weight,linkage=method,**fit['metrics'])
                fit.update(features=feat,pairs=pairs,variant=variant,weight=weight,record=record)
                records.append(record)
                fitted.append(fit)
    if include_stability:
        # Compare *all* 18 models with paired blocks, not only a silhouette winner.
        columns = [np.r_[0, 1+shared_block_indices(features_by_variant['baseline']['direction'].shape[1]-1,rng,3)] for _ in range(8)]
        common=features_by_variant['baseline']
        # Shared perturbations let the variants compete on count-noise
        # resilience as well as block stability, before any winner is selected.
        expected=np.nan_to_num(common['posterior'])/common['multiplier']*np.nan_to_num(common['exposure'])
        noise_features=[]
        for _ in range(4):
            noisy=rng.poisson(np.maximum(0,expected)).astype(float)
            noisy[~np.isfinite(common['raw'])]=np.nan
            population=common['exposure'] if common['multiplier']==1000 else None
            noise_features.append({v:extract_features(noisy,population,common['years'],v) for v in VARIANTS})
        for fit in fitted:
            ordered=sorted(fit['candidates'],key=lambda r:r['height'])
            # Compare strong cuts across the whole resolution range, so a
            # fragile fine partition cannot win before stability is assessed.
            alternatives=[]
            for stratum in np.array_split(np.arange(len(ordered)),min(4,len(ordered))):
                alternatives.append(max((ordered[int(i)] for i in stratum),key=lambda r:r['base_score']))
            sample_sets=[[] for _ in alternatives]
            noise_samples=[]
            for cols in columns:
                feat=resample_features(fit['features'], cols)
                pair=distance_matrix(feat,fit['weight'])
                resampled=select_cut(feat,pair,strictness,fit['method'])
                for j,alternative in enumerate(alternatives):
                    sample_sets[j].append(resampled['labels'])
            for simulated in noise_features:
                nf=simulated[fit['variant']]
                npair=distance_matrix(nf,fit['weight'])
                noise_samples.append(select_cut(nf,npair,strictness,fit['method'])['labels'])
            choices=[]
            for alternative,samples in zip(alternatives,sample_sets):
                labels=eligible_labels(cut_tree(fit['tree'],len(fit['labels']),alternative['height']),fit['pairs'],fit['features'],strictness)
                stat=stability(labels,samples)
                noise=stability(labels,noise_samples)
                score=alternative['base_score'] + .20*stat['ari_mean'] + .20*stat['pair_consistency'] + .20*noise['pair_consistency']
                choices.append((score,alternative,labels,stat,noise))
            score,alternative,labels,stat,noise=max(choices,key=lambda c:c[0])
            fit['labels']=labels
            fit['metrics']=dict(alternative,**diagnostics(labels,fit['pairs'],fit['features'],True))
            fit['record'].update(fit['metrics'],selection_block_ari=stat['ari_mean'],
                selection_pair_consistency=stat['pair_consistency'],selection_poisson_pair_consistency=noise['pair_consistency'],selection_score=score)
    for fit in fitted:
        fit['record'].setdefault('selection_score',fit['metrics']['base_score'])
    selected=max(fitted,key=lambda f:(f['record']['selection_score'],f['metrics']['coverage'],-f['weight']))
    for fit in fitted: fit['record']['selected']=fit is selected
    return selected,records,fitted


def shifted_features(feat, shifts):
    out = dict(feat)
    # Shift existing adjacent-year change vectors, never re-difference sampled
    # levels. This approximate stationary circular null preserves each row's
    # marginal changes/autocorrelation (apart from the circular seam).
    for key in ('direction','reliability','delta','scaled_delta','z','informative'):
        a=feat[key].copy()
        for i, shift in enumerate(shifts): a[i,1:]=np.roll(a[i,1:],int(shift))
        out[key]=a
    return out


def validate_selected(selected, features_by_variant, counts, pop, years, rng, bootstraps=32, null_reps=39):
    f,p,fit=selected['features'],selected['pairs'],selected
    config_refs={s:(selected if s=='balanced' else select_cut(f,p,s,fit['method'],fit['tree'])) for s in STRICTNESS}
    block_config_samples={s:[] for s in STRICTNESS}
    poisson_config_samples={s:[] for s in STRICTNESS}
    block_samples=[]
    for _ in range(bootstraps):
        cols=np.r_[0,1+shared_block_indices(len(years)-1,rng,3)]
        sampled=resample_features(f,cols)
        pair=distance_matrix(sampled,fit['weight'])
        for s,ref in config_refs.items():
            labels=select_cut(sampled,pair,s,fit['method'])['labels']
            block_config_samples[s].append(labels)
        block_samples.append(block_config_samples['balanced'][-1])
    block=stability(fit['labels'],block_samples)
    poisson_samples=[]
    for _ in range(20):
        lam=np.where(np.isfinite(f['posterior'])&np.isfinite(pop),np.maximum(0,np.nan_to_num(f['posterior'])*np.nan_to_num(pop)/1000),0.)
        perturb=rng.poisson(lam).astype(float)
        perturb[~np.isfinite(counts)]=np.nan
        ff=extract_features(perturb,pop,years,f['variant'])
        pp=distance_matrix(ff,fit['weight'])
        for s,ref in config_refs.items():
            labels=select_cut(ff,pp,s,fit['method'])['labels']
            poisson_config_samples[s].append(labels)
        poisson_samples.append(poisson_config_samples['balanced'][-1])
    poisson=stability(fit['labels'],poisson_samples)
    # Global maximum over the full variant/weight/linkage/height search family:
    # compare selected observed evidence against each null replicate's *maximum*.
    # This protects against declaring discovery solely after a lucky grid search.
    null=[]
    for rep in range(null_reps):
        shifts=rng.integers(0,len(years)-1,size=len(counts))
        maximum=0.
        for variant, feat in features_by_variant.items():
            ff=shifted_features(feat,shifts)
            first=distance_matrix(ff)
            for weight in WEIGHTS:
                pp=pairs_with_weight(first,weight)
                for method in METHODS:
                    res=select_cut(ff,pp,'balanced',method)
                    maximum=max(maximum,res['maximum_evidence'])
        null.append(float(maximum))
        if (rep+1)%10==0: print(f'  null max-search {rep+1}/{null_reps}',flush=True)
    observed=fit['metrics']['evidence_statistic']
    tail=(1+sum(v>=observed-1e-12 for v in null))/(1+len(null))
    region=np.nansum(counts,axis=0)/np.nansum(pop,axis=0)*1000
    regional_delta=np.r_[np.nan,np.diff(region)]
    regional_sign=np.sign(regional_delta)
    valid=np.isfinite(f['direction'])&(f['direction']!=0)&np.isfinite(regional_sign)
    regional_agreement=float(np.sum((f['direction']==regional_sign)&valid)/max(1,valid.sum()))
    # Residualize aligned deltas by subtracting the same calendar-year regional
    # change; this sensitivity asks whether structure extends beyond that shock.
    residual=dict(f)
    residual['delta']=f['delta']-regional_delta
    residual['scaled_delta']=residual['delta'].copy()
    for i,row in enumerate(residual['scaled_delta']):
        obs=np.isfinite(row)
        if obs.any():
            med=np.median(row[obs]);mad=np.median(abs(row[obs]-med))
            residual['scaled_delta'][i,obs]=np.clip((row[obs]-med)/max(1.4826*mad,1e-9),-3.5,3.5)
    residual['direction']=np.where(np.isfinite(f['direction']),np.where(f['direction']==0,0,np.sign(residual['delta'])),np.nan)
    rp=distance_matrix(residual,fit['weight'])
    rr=select_cut(residual,rp,'balanced',fit['method'])
    residual_metrics=diagnostics(fit['labels'],rp,residual,True)
    sensitivities=[]
    sensitivity_inputs=[]
    constant_population=np.repeat(np.nanmedian(pop,axis=1)[:,None],len(years),axis=1)
    sensitivity_inputs.append(('constant_population_denominator',counts,constant_population,1.))
    sensitivity_inputs.append(('variance_inflation_2',counts,pop,2.))
    # Remove the largest observed rate event per municipality, retain a missing
    # year rather than inventing an interpolated count or an apparent decrease.
    masked=counts.copy()
    maxidx=np.argmax(np.where(np.isfinite(f['rates']),f['rates'],-np.inf),axis=1)
    masked[np.arange(len(counts)),maxidx]=np.nan
    sensitivity_inputs.append(('remove_largest_rate_event',masked,pop,1.))
    for name,cc,pp,overdispersion in sensitivity_inputs:
        ff=extract_features(cc,pp,years,f['variant'],variance_inflation=overdispersion)
        pair=distance_matrix(ff,fit['weight'])
        rr2=select_cut(ff,pair,'balanced',fit['method'])
        met=diagnostics(rr2['labels'],pair,ff)
        sensitivities.append(dict(name=name,ari=fixed_universe_ari(fit['labels'],rr2['labels']),clusters=met['clusters'],coverage=met['coverage']))
    return dict(block_bootstrap=block,parametric_poisson=poisson,
        configuration_stability={s:dict(block=stability(ref['labels'],block_config_samples[s]),
            poisson=stability(ref['labels'],poisson_config_samples[s])) for s,ref in config_refs.items()},
        null_model=dict(repetitions=null_reps,observed_evidence=observed,max_search_null_statistics=null,
            approximate_global_tail=tail,resolution=1/(null_reps+1),
            search_family='All 3 feature variants × 3 directional weights × 2 linkage methods × all balanced cut heights; statistic maximized in every surrogate',
            interpretation='Approximate exploratory surrogate tail, not an exact p-value and not per-cluster significance; assumes circularly stationary changes'),
        regional_baseline=dict(directional_agreement=regional_agreement,regional_rates=region,
            original_groups_residual_agreement=residual_metrics['agreement'],
            residual_recluster_ari=fixed_universe_ari(fit['labels'],rr['labels']),
            residual_clusters=rr['metrics']['clusters'],interpretation='Sensitivity only; not proof of independent local mechanisms'),
        sensitivities=sensitivities)


def cluster_id(prefix, label, level):
    return 'UNASSIGNED' if label < 0 else f'{prefix}-'+('M' if level=='macro' else '')+f'{label+1:03d}'


def safe_median(values):
    a=np.asarray(values,dtype=float)
    finite=a[np.isfinite(a)]
    return float(np.median(finite)) if len(finite) else None


def cluster_exports(labels,pairs,features,panel,prefix,level,validation=None):
    clusters=[]
    baseline=features['rates']
    typical=np.nanmedian(baseline,axis=1)
    relative=np.divide(baseline,typical[:,None],out=np.full_like(baseline,np.nan),where=typical[:,None]>0)*100-100
    for label in np.unique(labels[labels>=0]):
        idx=np.flatnonzero(labels==label)
        a,b=np.triu_indices(len(idx),1)
        ii,jj=idx[a],idx[b]
        reliable=pairs['reliable_pair'][ii,jj]
        d=pairs['distance'][np.ix_(idx,idx)]
        medoid=int(idx[np.argmin(d.mean(axis=1))])
        member_scores=np.mean(1-d,axis=1)
        ranks=np.argsort(-member_scores,kind='stable')
        directions=features['direction'][idx]
        yearly=[]
        for j,year in enumerate(panel['years']):
            sign=directions[:,j]
            growing=int(np.sum(sign>0));declining=int(np.sum(sign<0));stable=int(np.sum(sign==0));missing=int(np.sum(~np.isfinite(sign)))
            info=growing+declining
            sync=max(growing,declining)/info if info else None
            enough=info>=max(2,int(np.ceil(len(idx)*.25)))
            if missing>len(idx)/2 or (not enough and stable<len(idx)/2): state='INSUFFICIENT_DATA'
            elif stable>=len(idx)*.75: state='STABLE'
            elif not enough: state='INSUFFICIENT_DATA'
            elif sync>=.70: state='GROWING' if growing>declining else 'DECLINING'
            else: state='MIXED'
            yearly.append(dict(year=year,growing=growing,declining=declining,stable=stable,missing=missing,
                synchrony=sync,state=state,representative_direction=1 if state=='GROWING' else -1 if state=='DECLINING' else 0 if state=='STABLE' else None,
                median_rate=safe_median(features['rates'][idx,j]),median_raw=safe_median(features['raw'][idx,j]),
                median_modeled=safe_median(features['modeled'][idx,j]),median_relative=safe_median(relative[idx,j]),
                median_delta=safe_median(features['delta'][idx,j]),
                lower_rate=float(np.nanquantile(features['rates'][idx,j],.25)) if np.isfinite(features['rates'][idx,j]).any() else None,
                upper_rate=float(np.nanquantile(features['rates'][idx,j],.75)) if np.isfinite(features['rates'][idx,j]).any() else None))
        consistency=None;poisson_consistency=None
        if validation is not None and level=='micro':
            block_values=validation['block']['cluster_consistency']
            poisson_values=validation['poisson']['cluster_consistency']
            consistency=block_values.get(int(label),block_values.get(str(int(label))))
            poisson_consistency=poisson_values.get(int(label),poisson_values.get(str(int(label))))
        info_count=np.sum(np.abs(np.nan_to_num(directions))>0,axis=1)
        quality=dict(count=len(idx),mean_similarity=float(np.mean(1-pairs['distance'][ii,jj])),median_similarity=float(np.median(1-pairs['distance'][ii,jj])),
            directional_agreement=safe_median(pairs['agreement'][ii[reliable],jj[reliable]]) if not reliable.any() else float(np.mean(pairs['agreement'][ii[reliable],jj[reliable]])),
            opposite_share=float(np.mean(pairs['opposite'][ii[reliable],jj[reliable]])) if reliable.any() else None,
            median_informative_years=float(np.median(info_count)),minimum_shared_informative_years=int(pairs['informative_overlap'][ii,jj].min()),
            undecidable_share=float(np.sum(directions[:,1:]==0)/max(1,np.isfinite(directions[:,1:]).sum())),
            block_pair_stability=consistency,poisson_pair_stability=poisson_consistency,
            low_confidence=bool((consistency is not None and consistency<.5) or (poisson_consistency is not None and poisson_consistency<.5) or np.median(info_count)<8),
            statistical_status='exploratory temporal group; no individual cluster significance claim',
            strongest_ids=[panel['ids'][idx[r]] for r in ranks[:3]],weakest_ids=[panel['ids'][idx[r]] for r in ranks[-3:][::-1]])
        clusters.append(dict(id=cluster_id(prefix,int(label),level),member_ids=[panel['ids'][i] for i in idx],medoid_id=panel['ids'][medoid],
            quality=quality,member_ranking=[dict(id=panel['ids'][idx[r]],rank=int(j+1),mean_similarity=float(member_scores[r]),medoid_similarity=float(1-pairs['distance'][idx[r],medoid])) for j,r in enumerate(ranks)],yearly=yearly))
    return clusters


def run(out=DEFAULT_OUT, bootstraps=32, null_reps=39):
    out.mkdir(parents=True,exist_ok=True)
    panel=load_panel()
    rng=np.random.default_rng(SEED)
    source_names=['migrace_vek_obce_rok.csv','uloha1_obce_rok_final.csv','obce_ustecky_kraj.geojson','obce_ciselnik.csv']
    hashes={name:hashlib.sha256((SOURCE/name).read_bytes()).hexdigest() for name in source_names}
    code_hashes={name:hashlib.sha256((BASE/name).read_bytes()).hexdigest() for name in ['temporal_features.py','temporal_cluster.py','temporal_pipeline.py']}
    parameters=dict(seed=SEED,variants=VARIANTS,directional_weights=WEIGHTS,linkage=METHODS,strictness=STRICTNESS,
                    min_pair_informative=8,min_pair_available=8,z_threshold=1.28,bootstraps=bootstraps,null_repetitions=null_reps,
                    cut_lattice='Up to 32 ordered data-derived merge heights plus similarity ceiling; K unrestricted',
                    minimum_group_block_retention=.5,minimum_group_poisson_retention=.5,
                    poisson_repetitions=20,block_length=3,selection_bootstraps=8,selection_poisson_repetitions=4,
                    resampling_cut='Reselect automatic cut at fixed variant, weight, linkage and strictness')
    version=hashlib.sha256(json.dumps(dict(sources=hashes,code=code_hashes,parameters=parameters),sort_keys=True).encode()).hexdigest()[:16]
    dashboard=dict(meta=dict(analysis_id=version,years=panel['years'],municipalities=len(panel['ids']),seed=SEED,method='Hierarchical agglomerative clustering of aligned first differences',exploratory=True),
        years=panel['years'],municipalities=[dict(m,population=panel['population'][i]) for i,m in enumerate(panel['municipalities'])],analyses={})
    comparisons=[];memberships=[];trends=[];cluster_years=[]
    for mode,prefix in [('immigration','IMM'),('emigration','EMI')]:
        print(f'{mode}: compare 18 models, {len(panel[mode])} municipalities',flush=True)
        ff={v:extract_features(panel[mode],panel['population'],panel['years'],v) for v in VARIANTS}
        selected,comparison,fitted=evaluate_search(ff,rng=rng)
        write_csv(out/f'model_comparison_{mode}.csv',comparison)
        print(' selected '+json.dumps(clean(selected['record'])),flush=True)
        # Checkpoint costly validation with a scientific-code/data/config hash.
        # Restore post-validation RNG state so using a cache changes no results.
        signature=hashlib.sha256(json.dumps(clean(dict(mode=mode,sources=hashes,
            features_code=code_hashes['temporal_features.py'],cluster_code=code_hashes['temporal_cluster.py'],
            pipeline_code=code_hashes['temporal_pipeline.py'],
            validation_code=inspect.getsource(validate_selected),selection=selected['record'],
            rng_before=rng.bit_generator.state,bootstraps=bootstraps,null_reps=null_reps)),sort_keys=True).encode()).hexdigest()
        cache_path=out/f'validation_cache_{mode}.json'
        cache=json.loads(cache_path.read_text()) if cache_path.exists() else {}
        if cache.get('signature')==signature:
            validation=cache['validation']
            rng.bit_generator.state=cache['rng_after']
            print('  reuse verified validation checkpoint',flush=True)
        else:
            validation=validate_selected(selected,ff,panel[mode],panel['population'],panel['years'],rng,bootstraps,null_reps)
            dump(cache_path,dict(signature=signature,validation=validation,rng_after=rng.bit_generator.state))
        features,pairs=selected['features'],selected['pairs']
        configs={}
        for strictness in STRICTNESS:
            micro=selected if strictness=='balanced' else select_cut(features,pairs,strictness,selected['method'],selected['tree'])
            candidate_metrics=dict(micro['metrics'])
            candidate_clusters=cluster_exports(micro['labels'],pairs,features,panel,prefix,'micro',validation['configuration_stability'][strictness])
            candidate_macro=nested_macro(micro,micro['tree'],pairs,features,strictness)
            rejected=[c for c in candidate_clusters if c['quality']['low_confidence']]
            accepted_ids={c['id'] for c in candidate_clusters if not c['quality']['low_confidence']}
            micro=dict(micro,labels=micro['labels'].copy())
            for i,label in enumerate(micro['labels']):
                if cluster_id(prefix,int(label),'micro') not in accepted_ids: micro['labels'][i]=-1
            micro['metrics']=dict(height=candidate_metrics['height'],**diagnostics(micro['labels'],pairs,features,True))
            macro=nested_macro(micro,micro['tree'],pairs,features,strictness)
            config_id=f'{version}-{prefix}-{strictness}'
            configs[strictness]=dict(id=config_id,metrics=micro['metrics'],candidate_metrics=candidate_metrics,
                rejected_groups=rejected,stability=validation['configuration_stability'][strictness],
                candidate_macro=cluster_exports(candidate_macro['labels'],pairs,features,panel,prefix,'macro'),
                micro_height=micro['metrics']['height'],macro_height=macro['height'],
                micro=cluster_exports(micro['labels'],pairs,features,panel,prefix,'micro',validation['configuration_stability'][strictness]),
                macro=cluster_exports(macro['labels'],pairs,features,panel,prefix,'macro'))
            for i,municipality in enumerate(dashboard['municipalities']):
                if mode not in municipality:
                    municipality[mode]={key:features[src][i] for key,src in [('raw','raw'),('rate','rates'),('modeled','modeled'),('delta','delta'),('scaled_delta','scaled_delta'),('direction','direction'),('reliability','reliability')]}
                    municipality[mode]['memberships']={}
                municipality[mode]['memberships'][strictness]={level:cluster_id(prefix,int(obj['labels'][i]),level) for level,obj in [('micro',micro),('macro',macro)]}
                municipality[mode].setdefault('candidate_memberships',{})[strictness]={
                    'micro':next((c['id'] for c in candidate_clusters if municipality['id'] in c['member_ids']),'UNASSIGNED'),
                    'macro':cluster_id(prefix,int(candidate_macro['labels'][i]),'macro')}
                for level,obj in [('micro',micro),('macro',macro)]:
                    memberships.append(dict(analysis_id=version,municipality_id=municipality['id'],name=municipality['name'],mode=mode,configuration=strictness,configuration_id=config_id,level=level,cluster_id=cluster_id(prefix,int(obj['labels'][i]),level)))
            for level in ['micro','macro']:
                for cluster in configs[strictness][level]:
                    for annual in cluster['yearly']: cluster_years.append(dict(mode=mode,configuration=strictness,level=level,cluster_id=cluster['id'],**annual))
        for i,municipality in enumerate(dashboard['municipalities']):
            for j,year in enumerate(panel['years']):
                trends.append(dict(analysis_id=version,municipality_id=municipality['id'],name=municipality['name'],mode=mode,year=year,population=panel['population'][i,j],
                    **{key:municipality[mode][key][j] for key in ['raw','rate','modeled','delta','scaled_delta','direction','reliability']}))
        for record in comparison: comparisons.append(dict(mode=mode,**record))
        dashboard['analyses'][mode]=dict(selected=dict(selected['record']),
            configs=configs,comparison=comparison,validation=validation,shrinkage=features['metadata'])
        # Store every considered dendrogram height, not only selected model scores.
        write_csv(out/f'cut_search_{mode}.csv',[dict(variant=f['variant'],directional_weight=f['weight'],linkage=f['method'],**r) for f in fitted for r in f['candidates']])
        write_csv(out/f'clusters_{mode}.csv',[dict(municipality_id=m['id'],name=m['name'],**m[mode]['memberships']['balanced']) for m in dashboard['municipalities']])
        np.savez_compressed(out/f'pairwise_{mode}.npz',ids=panel['ids'],**pairs)
        print(f"  final: {configs['balanced']['metrics']['clusters']} micro, {configs['balanced']['metrics']['assigned']} assigned, null tail {validation['null_model']['approximate_global_tail']:.3f}",flush=True)
    manifest=dict(analysis_id=version,source_sha256=hashes,implementation_sha256=code_hashes,parameters=parameters,years=panel['years'],source_directory=str(SOURCE.relative_to(PROJECT)),
        population='pocet_obyvatel_1_7, per1000 person-year exposure',preprocessing=panel['audit'],selection_objective='base_score + .20 block ARI + .20 block pair retention + .20 Poisson pair retention; 4 cut strata per each of 18 models; no fixed K; reject groups below .5 block or Poisson pair retention',
        null_interpretation='Approximate circular-change max-search surrogate; not individual cluster significance',
        macro_interpretation='Coarser cut of same selected dendrogram; descriptive families, not individually validated discoveries',
        outputs=['temporal_dashboard.json','clusters_immigration.csv','clusters_emigration.csv','municipality_year_trends.csv','cluster_year_summary.csv','model_comparison.csv','cluster_membership.csv','analysis_report.md'])
    dump(out/'temporal_dashboard.json',dashboard)
    dump(out/'analysis_manifest.json',manifest)
    write_csv(out/'municipality_year_trends.csv',trends)
    write_csv(out/'cluster_year_summary.csv',cluster_years)
    write_csv(out/'model_comparison.csv',comparisons)
    write_csv(out/'cluster_membership.csv',memberships)
    dump(out/'data_audit.json',panel['audit'])
    print(f'Export verified: {out}; version {version}',flush=True)
    return dashboard,manifest


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,default=DEFAULT_OUT)
    parser.add_argument('--bootstraps',type=int,default=32)
    parser.add_argument('--null-reps',type=int,default=39)
    args=parser.parse_args()
    if args.bootstraps<8 or args.null_reps<19: parser.error('At least 8 block replicates and 19 null surrogates required')
    run(args.out,args.bootstraps,args.null_reps)
