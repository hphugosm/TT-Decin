#!/usr/bin/env python3
"""Exploratory spatially connected, pairwise homogeneous migration groups.

Search crosses frozen temporal cluster boundaries; it does not modify them.
"""
from __future__ import annotations
import os
for _key in ('OPENBLAS_NUM_THREADS','OMP_NUM_THREADS','MKL_NUM_THREADS'): os.environ[_key]='1'
import argparse, hashlib, json, platform
from pathlib import Path
import numpy as np
import scipy
from temporal_features import extract_features, distance_matrix
from temporal_cluster import shared_block_indices, resample_features
from spatial_sectors import clean, dump, write_csv, digest
BASE=Path(__file__).resolve().parent; OUT=BASE.parent/'results'
PARAMETERS=dict(min_informative=12,min_agreement=.70,min_pearson=.40,min_spearman=.40,directional_weight=.85,block_length=3,minimum_pair_stability=.5)

PROFILES={'balanced':PARAMETERS,'relaxed':dict(PARAMETERS,min_agreement=.65,min_pearson=.30,min_spearman=.30),'loose':dict(PARAMETERS,min_agreement=.60,min_pearson=.20,min_spearman=.20),'extended':dict(PARAMETERS,min_agreement=.60,min_pearson=.15,min_spearman=.15)}
PROFILE_STEMS={'balanced':'local_migration_','relaxed':'local_migration_relaxed_','loose':'local_migration_loose_','extended':'local_migration_extended_'}
PROFILE_LABELS={'balanced':'Vyvážené','relaxed':'Uvolněné · průzkumná citlivost','loose':'Volnější · průzkumná citlivost','extended':'Rozšířený · průzkumná citlivost'}
PROFILE_PREFIXES={'balanced':('LIMM','LEMI'),'relaxed':('RIMM','REMI'),'loose':('VIMM','VEMI'),'extended':('XIMM','XEMI')}

def admissible(p, parameters=None):
    q=parameters or PARAMETERS
    return (p['reliable_pair'] & (p['informative_overlap']>=q['min_informative']) & (p['agreement']>=q['min_agreement']) & (p['pearson']>=q['min_pearson']) & (p['spearman']>=q['min_spearman']))


def search_groups(p, edges, parameters=None):
    """Connected complete linkage. Every within-group pair must pass thresholds.

    Among admissible merges choose smallest maximum cross-pair hybrid distance;
    ties resolve lexicographically on sorted row IDs. No target K or size cap.
    """
    n=len(p['agreement']); ok=admissible(p,parameters); distance=p.get('distance',p.get('temporal_distance'))
    # A fully admissible merge must cross at least one eligible rook edge.
    # Removing ineligible boundary pairs cannot remove an admissible merge.
    edges=[(a,b) for a,b in edges if ok[a,b]]
    groups={i:(i,) for i in range(n)}; owner=np.arange(n)
    while True:
        candidates={tuple(sorted((int(owner[a]),int(owner[b])))) for a,b in edges if owner[a]!=owner[b]}
        best=None
        for a,b in candidates:
            aa,bb=groups[a],groups[b];ix=np.ix_(aa,bb)
            if not ok[ix].all():continue
            merged=tuple(sorted(aa+bb)); score=(float(distance[ix].max()),merged,a,b)
            if best is None or score<best:best=score
        if best is None:break
        _,merged,a,b=best;groups[a]=merged;del groups[b];owner[list(merged)]=a
    return sorted((v for v in groups.values() if len(v)>1),key=lambda x:x)


def label_groups(groups,n):
    labels=np.arange(n)+n
    for i,g in enumerate(groups):labels[list(g)]=i
    return labels


def pair_retention(reference,samples,n):
    result=[]
    for g in reference:
        a,b=np.triu_indices(len(g),1);ii=np.array(g)[a];jj=np.array(g)[b]
        result.append(float(np.mean([np.mean(s[ii]==s[jj]) for s in samples])) if samples else None)
    return result


def shifted_features(features,rng):
    out=dict(features); width=features['direction'].shape[1]-1
    shifts=rng.integers(0,width,size=len(features['direction']))
    for key in ('direction','reliability','delta','scaled_delta','z','informative'):
        if key in features:
            out[key]=features[key].copy()
            for i,shift in enumerate(shifts):out[key][i,1:]=np.roll(features[key][i,1:],shift)
    return out


def build(output=OUT,repetitions=59,null_repetitions=199,profile='balanced'):
    parameters=PROFILES[profile]
    stem=PROFILE_STEMS[profile]
    output=Path(output);output.mkdir(parents=True,exist_ok=True)
    dashboard=json.loads((OUT/'temporal_dashboard.json').read_text()); spatial=json.loads((OUT/'spatial_sectors.json').read_text())
    ids=spatial['pairwise']['ids'];index={c:i for i,c in enumerate(ids)}
    towns={m['id']:m for m in dashboard['municipalities']};years=dashboard['years'];n=len(ids)
    edge_codes=spatial['geography']['edges'];edges=[(index[a],index[b]) for a,b in edge_codes];edge_set={tuple(sorted(e)) for e in edges}
    dist=np.array(spatial['pairwise']['distance_km']);pop=np.array([towns[c]['population'] for c in ids],float)
    sources={str(p.relative_to(BASE.parent)):digest(p) for p in (BASE/'local_migration_groups.py',BASE/'temporal_features.py',BASE/'temporal_cluster.py',BASE/'spatial_sectors.py',OUT/'temporal_dashboard.json',OUT/'spatial_sectors.json')}
    fingerprint=dict(sources=sources,parameters=parameters,profile=profile,repetitions=repetitions,null_repetitions=null_repetitions,seed=20261024)
    analysis_id=hashlib.sha256(json.dumps(fingerprint,sort_keys=True).encode()).hexdigest()[:16]
    result=dict(meta=dict(analysis_id=analysis_id,base_analysis_id=dashboard['meta']['analysis_id'],spatial_analysis_id=spatial['meta']['analysis_id'],method='Rook-constrained complete linkage with all-pairs homogeneity thresholds',all_groups_exploratory=True,temporal_refit=False,parameters_prespecified=profile=='balanced',profile=profile,profilelabel=PROFILE_LABELS[profile],non_nested_profiles=True,profile_selection_adjusted=False,whole_group_stability_interpretation='Fraction of full-search repetitions where all reference members remain together, possibly in a larger group; distinct from mean pair retention.'),years=years,municipalities=[{k:towns[c][k] for k in ('id','name','district','orp')} for c in ids],modes={})
    csv_members=[];csv_pairs=[];rng=np.random.default_rng(20261024)
    for mode,prefix in zip(('immigration','emigration'),PROFILE_PREFIXES[profile]):
        print(f'{mode}: point estimate',flush=True)
        variant=dashboard['analyses'][mode]['selected']['variant'];weight=dashboard['analyses'][mode]['selected']['directional_weight']
        raw=np.array([towns[c][mode]['raw'] for c in ids],float);features=extract_features(raw,pop,years,variant)
        pairs=distance_matrix(features,weight)
        # Assert that the new search uses exactly the saved base point estimates.
        for key in ('pearson','spearman','agreement','informative_overlap','reliable_pair'):
            np.testing.assert_allclose(pairs[key],np.array(spatial['pairwise'][mode][key],float),rtol=1e-9,atol=1e-9,equal_nan=True)
        groups=search_groups(pairs,edges,parameters);samples={'block':[],'poisson':[]}
        lam=np.where(np.isfinite(features['posterior'])&np.isfinite(pop),np.maximum(0,np.nan_to_num(features['posterior'])*np.nan_to_num(pop)/1000),0)
        for kind in samples:
            for rep in range(repetitions):
                if kind=='block':
                    columns=np.r_[0,1+shared_block_indices(len(years)-1,rng,3)];f=resample_features(features,columns)
                else:
                    counts=rng.poisson(lam).astype(float);counts[~np.isfinite(raw)]=np.nan;f=extract_features(counts,pop,years,variant)
                samples[kind].append(label_groups(search_groups(distance_matrix(f,weight),edges,parameters),n))
                if (rep+1)%20==0:print(f'{mode} {kind} {rep+1}/{repetitions}',flush=True)
        retention={k:pair_retention(groups,v,n) for k,v in samples.items()}
        null_counts=[];null_coverage=[];null_counts_3plus=[];null_counts_4plus=[];null_counts_5plus=[]
        for rep in range(null_repetitions):
            null=search_groups(distance_matrix(shifted_features(features,rng),weight),edges,parameters)
            null_counts.append(len(null));null_coverage.append(sum(map(len,null)));null_counts_3plus.append(sum(len(g)>=3 for g in null));null_counts_4plus.append(sum(len(g)>=4 for g in null));null_counts_5plus.append(sum(len(g)>=5 for g in null))
            if (rep+1)%40==0:print(f'{mode} null {rep+1}/{null_repetitions}',flush=True)
        exported=[];memberships={c:'UNASSIGNED' for c in ids}
        for gidx,g in enumerate(groups):
            gid=f'{prefix}-{gidx+1:03d}';aa,bb=np.triu_indices(len(g),1);ii=np.array(g)[aa];jj=np.array(g)[bb]
            stable=all(retention[k][gidx] is not None and retention[k][gidx]>=.5 for k in retention)
            quality={k:float(pairs[k][ii,jj].mean()) for k in ('agreement','pearson','spearman')}
            quality.update({f'min_{k}':float(pairs[k][ii,jj].min()) for k in ('agreement','pearson','spearman')})
            quality.update(block_group_stability=float(np.mean([np.all(labels[list(g)]==labels[g[0]]) for labels in samples['block']])),poisson_group_stability=float(np.mean([np.all(labels[list(g)]==labels[g[0]]) for labels in samples['poisson']])),block_pair_stability=retention['block'][gidx],poisson_pair_stability=retention['poisson'][gidx],diameter_km=float(dist[ii,jj].max()),minimum_shared_years=int(pairs['informative_overlap'][ii,jj].min()),count=len(g),pair_count=len(ii),shared_pattern_claim=False)
            records=[]
            for a,b in zip(ii,jj):
                row=dict(id_a=ids[a],id_b=ids[b],name_a=towns[ids[a]]['name'],name_b=towns[ids[b]]['name'],adjacent=(min(a,b),max(a,b)) in edge_set,agreement=float(pairs['agreement'][a,b]),pearson=float(pairs['pearson'][a,b]),spearman=float(pairs['spearman'][a,b]),distance_km=float(dist[a,b]),informative_years=int(pairs['informative_overlap'][a,b]))
                records.append(row);csv_pairs.append(dict(mode=mode,group_id=gid,**row))
            for i in g:memberships[ids[i]]=gid
            exported.append(dict(id=gid,member_ids=[ids[i] for i in g],name=' – '.join(towns[ids[i]]['name'] for i in g),quality=quality,stable=stable,status='stable_exploratory' if stable else 'exploratory',pairs=records))
        assigned=sum(len(g) for g in groups)
        result['modes'][mode]=dict(groups=exported,memberships=memberships,summary=dict(groups=len(groups),groups_5plus=sum(len(g)>=5 for g in groups),assigned_5plus=sum(len(g) for g in groups if len(g)>=5),groups_4plus=sum(len(g)>=4 for g in groups),assigned_4plus=sum(len(g) for g in groups if len(g)>=4),groups_3plus=sum(len(g)>=3 for g in groups),assigned_3plus=sum(len(g) for g in groups if len(g)>=3),max_group_size=max(map(len,groups),default=0),assigned=assigned,unassigned=n-assigned,stable_groups=sum(g['stable'] for g in exported),stable_assigned=sum(len(g['member_ids']) for g in exported if g['stable'])),parameters=dict(**parameters,variant=variant,stability_repetitions=repetitions,seed=20261024),null_model=dict(method='Independent circular shifts of existing calendar-aligned changes per municipality; complete search repeated on all municipalities',statistic='group_count',observed_group_count=len(groups),observed_coverage=assigned,observed_groups_5plus=sum(len(g)>=5 for g in groups),null_groups_5plus=null_counts_5plus,groups_5plus_tail=(1+sum(x>=sum(len(g)>=5 for g in groups) for x in null_counts_5plus))/(null_repetitions+1),groups_5plus_interpretation='Supplementary exploratory diagnostic; no adjustment for inspecting thresholds or selecting a profile from the profile family.',observed_groups_4plus=sum(len(g)>=4 for g in groups),null_groups_4plus=null_counts_4plus,groups_4plus_tail=(1+sum(x>=sum(len(g)>=4 for g in groups) for x in null_counts_4plus))/(null_repetitions+1),groups_4plus_interpretation='Supplementary exploratory diagnostic; no adjustment for inspecting thresholds or selecting a profile from the profile family.',observed_groups_3plus=sum(len(g)>=3 for g in groups),null_groups_3plus=null_counts_3plus,groups_3plus_tail=(1+sum(x>=sum(len(g)>=3 for g in groups) for x in null_counts_3plus))/(null_repetitions+1),groups_3plus_interpretation=(f'Supplementary exploratory diagnostic; {profile} profile chosen after inspecting data, no adjustment for profile selection.' if profile!='balanced' else 'Supplementary exploratory diagnostic; primary statistic remains total group count.'),null_group_counts=null_counts,null_coverage=null_coverage,repetitions=null_repetitions,tail=(1+sum(x>=len(groups) for x in null_counts))/(null_repetitions+1),interpretation='Exploratory global search diagnostic, not a p-value for an individual selected group; common regional dynamics and serial dependence limit null exchangeability.'))
        csv_members.extend(dict(mode=mode,id=c,name=towns[c]['name'],group_id=memberships[c]) for c in ids)
        print(mode,result['modes'][mode]['summary'],flush=True)
    dump(output/(stem+'groups.json'),result);write_csv(output/(stem+'membership.csv'),csv_members);write_csv(output/(stem+'pairs.csv'),csv_pairs)
    report=['# Sousedící migračně podobné mikroskupiny','',f'Analýza `{analysis_id}`; původní časové klastry se nemění.','', f"Profil {profile}. Vyhledávání proběhlo v celém kraji, nezávisle na původních klastrech. Skupina musí být souvislá přes společnou hranici a každá její dvojice musí splnit alespoň {parameters['min_informative']} informativních změn, shodu směru {parameters['min_agreement']:.0%}, Pearson ≥ {parameters['min_pearson']:.2f} a Spearman ≥ {parameters['min_spearman']:.2f}. Korelace používají uložené robustně škálované změny vybraného základního modelu.",'',('Tento profil je adaptivní citlivostní průzkum: prahy byly zvoleny po prohlédnutí dat. Globální diagnostiky nekorigují výběr profilu a nepotvrzují jednotlivé skupiny.' if profile!='balanced' else 'Původní vyvážený profil.'),'', 'Profily nejsou vnořené: změna prahů může změnit pořadí chamtivého slučování a tím celé členství. Volnější profil není statisticky optimální ani matematicky nejpřísnější možnost vedoucí k větším skupinám. Nulové diagnostiky nekorigují prohlížení rodiny profilů ani jejich adaptivní výběr.','', 'Spojuje se přípustná dvojice skupin s nejmenší maximální meziskupinovou časovou vzdáleností. Počet skupin ani jejich velikost se nepředepisuje. Samostatné obce jsou UNASSIGNED.','',f'Stabilita: {repetitions} společných tříletých blokových převzorkování existujících změn a {repetitions} Poissonových perturbací počtů. V každém opakování se znovu prohledá celý kraj. Označení stabilnější vyžaduje průměrné zachování všech párových vztahů alespoň 50 % v obou zkouškách; nejde o potvrzení významnosti.','','Celoskupinová stabilita udává podíl opakování, kdy všichni původní členové zůstávají pohromadě, případně ve větší skupině. Je odlišná od průměrného zachování párů.','', 'Poissonova intenzita je EB posteriorní míra × populace / 1000 také pro základní variantu vystěhování. V každé perturbaci se znovu odhadne EB prior a vytvoří příznaky vybrané varianty. Chybějící počty a expozice zůstávají chybějící.','',f'Globální diagnostika: {null_repetitions} nezávislých kruhových posunů obecních změn a úplné opakování hledání; předem zvolená statistika je počet skupin, pravý chvost s korekcí +1. Žádné individuální p-hodnoty vybraných skupin.','']
    for mode,m in result['modes'].items():
        report += [f'## {mode}',str(m['summary']),f"Globální nulový chvost: {m['null_model']['tail']:.3f}; doplňkový chvost počtu skupin 3+: {m['null_model']['groups_3plus_tail']:.3f}; 4+: {m['null_model']['groups_4plus_tail']:.3f}; 5+: {m['null_model']['groups_5plus_tail']:.3f} (bez korekce výběru profilu).",'']
        for g in m['groups']:report.append(f"- **{g['id']}** {g['name']}: shoda {g['quality']['agreement']:.3f}, min. Pearson {g['quality']['min_pearson']:.3f}, min. Spearman {g['quality']['min_spearman']:.3f}, blok {g['quality']['block_pair_stability']}, Poisson {g['quality']['poisson_pair_stability']}; celá skupina blok {g['quality']['block_group_stability']}, Poisson {g['quality']['poisson_group_stability']}; {g['status']}.")
    (output/(stem+'report.md')).write_text('\n'.join(report)+'\n')
    manifest=dict(**fingerprint,analysis_id=analysis_id,base_analysis_id=result['meta']['base_analysis_id'],spatial_analysis_id=result['meta']['spatial_analysis_id'],runtime=dict(python=platform.python_version(),numpy=np.__version__,scipy=scipy.__version__),outputs={stem+suffix:digest(output/(stem+suffix)) for suffix in ('groups.json','membership.csv','pairs.csv','report.md')})
    dump(output/(stem+'manifest.json'),manifest)
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',type=Path,default=OUT);parser.add_argument('--repetitions',type=int,default=59);parser.add_argument('--null-repetitions',type=int,default=199);parser.add_argument('--profile',choices=['balanced','relaxed','loose','extended','all'],default='balanced');args=parser.parse_args()
    if args.repetitions<1 or args.null_repetitions<1:parser.error('Repetition counts must be positive')
    for profile in (list(PROFILES) if args.profile=='all' else [args.profile]):
        build(args.out,args.repetitions,args.null_repetitions,profile)
