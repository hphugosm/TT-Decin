#!/usr/bin/env python3
"""Frozen geographic overlays of existing temporal groups; never temporal refits."""
from __future__ import annotations
import argparse,csv,hashlib,json,math,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
PROJECT=BASE.parent
OUT=PROJECT/'results'
ORIGINAL=PROJECT/'audit_dcuk1_2026-10-23/sources/obce_ustecky_kraj.geojson'
DISPLAY=BASE/'data/geometry.json'
EXAMPLE=['562998','563111','563005','567167']

def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def rook_edges(shapes):
    """Positive-length shared boundaries; point-only corner contacts excluded."""
    codes=sorted(shapes);edges=[]
    bounds={code:shapes[code].bounds for code in codes}
    for i,a in enumerate(codes):
        aa=bounds[a]
        for b in codes[i+1:]:
            bb=bounds[b]
            if aa[2]<bb[0] or bb[2]<aa[0] or aa[3]<bb[1] or bb[3]<aa[1]:continue
            # Positive line length excludes point-only corner contacts.
            if shapes[a].boundary.intersection(shapes[b].boundary).length>0:edges.append([a,b])
    return edges

def geometry_worker():
    from shapely.geometry import shape
    from shapely.ops import transform
    source=json.loads(ORIGINAL.read_text())
    shapes={str(f['properties']['kod_obce']):shape(f['geometry']) for f in source['features']}
    codes=sorted(shapes);edges=[];centers={}
    # Constant local equirectangular metric projection, area-weighted centroid.
    scale=math.cos(math.radians(50.5))
    for code,g in shapes.items():
        local=transform(lambda x,y,z=None:(x*scale,y),g)
        c=local.centroid;centers[code]=[c.x/scale,c.y]
    edges=rook_edges(shapes)
    print(json.dumps(dict(edges=edges,coordinates=centers,shapely_version=__import__('shapely').__version__,invalid_codes=[c for c,g in shapes.items() if not g.is_valid])))

def display_edges():
    features=json.loads(DISPLAY.read_text())['features']; owners={}
    for f in features:
        code=str(f['id']);g=f['geometry']; polys=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
        for poly in polys:
            for ring in poly:
                for a,b in zip(ring,ring[1:]):
                    a,b=tuple(a),tuple(b)
                    if a==b:continue
                    edge=tuple(sorted((a,b)));owners.setdefault(edge,set()).add(code)
    return {tuple(sorted((a,b))) for own in owners.values() for a in own for b in own if a<b}

def get_geometry():
    candidates=[os.environ.get('SPATIAL_GEOMETRY_PYTHON'),sys.executable,
                '/Users/hugo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3']
    errors=[];result=None
    for executable in dict.fromkeys(x for x in candidates if x):
        # Prefer this interpreter's installed packages. The optional archived
        # wheel is ABI-specific and must never shadow a working installation.
        for use_vendor in (False,True):
            env=dict(os.environ)
            if use_vendor:
                env['PYTHONPATH']=str(PROJECT/'audit_dcuk1_2026-10-23/vendor')+os.pathsep+env.get('PYTHONPATH','')
            try:
                proc=subprocess.run([executable,str(Path(__file__).resolve()),'--geometry-worker'],capture_output=True,text=True,env=env)
            except OSError as exc:
                errors.append(f'{executable}: {exc}')
                break
            if proc.returncode==0:
                result=json.loads(proc.stdout);result['worker_python']=executable
                result['worker_vendor_fallback']=use_vendor
                break
            errors.append(f'{executable} vendor={use_vendor}: '+proc.stderr[-400:])
        if result is not None:break
    if result is None:raise RuntimeError('No Shapely geometry runtime: '+str(errors))
    original={tuple(e) for e in result['edges']};display=display_edges()
    result['crossvalidation']=dict(original_rook_edges=len(original),display_exact_shared_edges=len(display),
        both=len(original&display),original_only=[list(e) for e in sorted(original-display)],
        display_only=[list(e) for e in sorted(display-original)],
        interpretation='Display simplification is checked by exact common edge endpoints; original positive-length boundary intersections remain authoritative. Segment splitting may explain display-only differences.')
    return result

def clean(x):
    import numpy as np
    if isinstance(x,dict):return {str(k):clean(v) for k,v in x.items()}
    if isinstance(x,(tuple,list)):return [clean(v) for v in x]
    if isinstance(x,np.ndarray):return clean(x.tolist())
    if isinstance(x,(float,np.floating)):return float(x) if np.isfinite(x) else None
    if isinstance(x,np.integer):return int(x)
    if isinstance(x,np.bool_):return bool(x)
    return x

def dump(path,value):path.write_text(json.dumps(clean(value),ensure_ascii=False,separators=(',',':'),allow_nan=False))
def write_csv(path,rows):
    fields=list(dict.fromkeys(k for r in rows for k in r))
    with path.open('w',encoding='utf-8-sig',newline='') as f:
        writer=csv.DictWriter(f,fields);writer.writeheader();writer.writerows(rows)

def haversine(coordinates):
    import numpy as np
    a=np.radians(np.asarray(coordinates));lon=a[:,0];lat=a[:,1]
    h=np.sin((lat[:,None]-lat[None,:])/2)**2+np.cos(lat[:,None])*np.cos(lat[None,:])*np.sin((lon[:,None]-lon[None,:])/2)**2
    return 6371.0088*2*np.arcsin(np.sqrt(np.clip(h,0,1)))

def correlations(values):
    import numpy as np
    v=np.asarray(values,dtype=float);m=np.isfinite(v).astype(float);x=np.nan_to_num(v);n=m@m.T;s=x@m.T;ss=(x*x)@m.T
    cov=x@x.T-s*s.T/np.maximum(n,1);var=np.maximum(0,ss-s*s/np.maximum(n,1));den=np.sqrt(var*var.T)
    return np.clip(np.divide(cov,den,out=np.full(n.shape,np.nan),where=(n>=8)&(den>1e-12)),-1,1)

def rank_correlations(values):
    import numpy as np
    from scipy.stats import rankdata
    values=np.asarray(values,dtype=float);n=len(values);out=np.full((n,n),np.nan)
    masks=np.isfinite(values);patterns,group_ids=np.unique(masks,axis=0,return_inverse=True)
    for ga,pattern in enumerate(patterns):
        ia=np.flatnonzero(group_ids==ga)
        for gb in range(ga,len(patterns)):
            ib=np.flatnonzero(group_ids==gb);shared=pattern&patterns[gb]
            if shared.sum()<8:continue
            a=rankdata(values[ia][:,shared],axis=1);b=rankdata(values[ib][:,shared],axis=1)
            a-=a.mean(axis=1,keepdims=True);b-=b.mean(axis=1,keepdims=True)
            den=np.sqrt((a*a).sum(axis=1)[:,None]*(b*b).sum(axis=1)[None,:])
            r=np.divide(a@b.T,den,out=np.full(den.shape,np.nan),where=den>1e-12)
            out[np.ix_(ia,ib)]=r;out[np.ix_(ib,ia)]=r.T
    return out

def adjacent_delta(values,years):
    import numpy as np
    a=np.asarray(values,dtype=float);out=np.full(a.shape,np.nan);out[:,1:]=np.where(np.diff(years)==1,np.diff(a,axis=1),np.nan);return out

def components(ids,graph):
    remaining=set(ids);out=[]
    while remaining:
        start=min(remaining);remaining.remove(start);component=[start];stack=[start]
        while stack:
            u=stack.pop()
            add=remaining.intersection(graph[u]);remaining.difference_update(add);stack.extend(sorted(add));component.extend(add)
        out.append(sorted(component))
    return sorted(out,key=lambda g:g[0])

def run():
    import numpy as np
    from scipy.stats import spearmanr
    dashboard=json.loads((OUT/'temporal_dashboard.json').read_text());ids=[m['id'] for m in dashboard['municipalities']];index={c:i for i,c in enumerate(ids)}
    geo=get_geometry();centers=geo['coordinates'];distance=haversine([centers[c] for c in ids]);neighbors={c:set() for c in ids}
    for a,b in geo['edges']:neighbors[a].add(b);neighbors[b].add(a)
    graphs={'adjacency':neighbors}
    for radius in (10,20,30):graphs[f'radius{radius}']={c:{ids[j] for j in np.flatnonzero((distance[i]<=radius)&(np.arange(len(ids))!=i))} for i,c in enumerate(ids)}
    pairs={};residual_info={}
    for mode in ('immigration','emigration'):
        saved=np.load(OUT/f'pairwise_{mode}.npz');order=[list(saved['ids']).index(c) for c in ids]
        pairs[mode]={k:saved[k][np.ix_(order,order)] for k in ('pearson','spearman','agreement','informative_overlap','reliable_pair')}
        pairs[mode]['opposition']=saved['opposite'][np.ix_(order,order)]
        raw=np.array([m[mode]['raw'] for m in dashboard['municipalities']],float);rates=np.array([m[mode]['rate'] for m in dashboard['municipalities']],float)
        pop=np.array([m['population'] for m in dashboard['municipalities']],float);delta=np.array([m[mode]['delta'] for m in dashboard['municipalities']],float)
        region=np.nansum(raw,axis=0)/np.nansum(pop,axis=0)*1000;regional_delta=adjacent_delta(region[None,:],dashboard['years'])[0]
        pairs[mode]['raw_delta_pearson']=correlations(adjacent_delta(raw,dashboard['years']))
        pairs[mode]['rate_delta_pearson']=correlations(adjacent_delta(rates,dashboard['years']))
        pairs[mode]['raw_delta_spearman']=rank_correlations(adjacent_delta(raw,dashboard['years']))
        pairs[mode]['rate_delta_spearman']=rank_correlations(adjacent_delta(rates,dashboard['years']))
        pairs[mode]['temporal_distance']=saved['distance'][np.ix_(order,order)]
        pairs[mode]['residual_pearson']=correlations(delta-regional_delta)
        residual_info[mode]=dict(regional_rate=region,regional_delta=regional_delta)
    def mean(a):
        finite=np.asarray(a)[np.isfinite(a)];return float(finite.mean()) if len(finite) else None
    def quality(members,mode):
        idx=[index[c] for c in members];a,b=np.triu_indices(len(idx),1);ii,jj=np.asarray(idx)[a],np.asarray(idx)[b];p=pairs[mode]
        single=len(idx)==1
        return dict(count=len(idx),pair_count=len(ii),mean_pearson=mean(p['pearson'][ii,jj]),mean_spearman=mean(p['spearman'][ii,jj]),
            agreement=mean(p['agreement'][ii,jj]),opposition=mean(p['opposition'][ii,jj]),shared_years=mean(p['informative_overlap'][ii,jj]),
            minimum_shared_years=int(p['informative_overlap'][ii,jj].min()) if len(ii) else None,
            reliable_pair_fraction=mean(p['reliable_pair'][ii,jj]),mean_distance_km=mean(distance[ii,jj]),diameter_km=float(distance[ii,jj].max()) if len(ii) else 0.,
            raw_delta_pearson=mean(p['raw_delta_pearson'][ii,jj]),rate_delta_pearson=mean(p['rate_delta_pearson'][ii,jj]),residual_pearson=mean(p['residual_pearson'][ii,jj]),
            singleton=single,shared_pattern_claim=False,status='exploratory geographic overlay; singleton has no shared temporal pattern' if single else 'exploratory geographic overlay of frozen temporal group')
    global_association={}
    permutation_seed=20261024;reps=199;rng=np.random.default_rng(permutation_seed)
    tri=np.triu_indices(len(ids),1)
    for mode,p in pairs.items():
        geo_dist=distance[tri];temporal=p['temporal_distance'];reliable=p['reliable_pair']
        mask=reliable[tri]&np.isfinite(temporal[tri]);observed=float(spearmanr(geo_dist[mask],temporal[tri][mask]).statistic)
        null=[]
        for _ in range(reps):
            perm=rng.permutation(len(ids));tp=temporal[np.ix_(perm,perm)][tri];known=reliable[np.ix_(perm,perm)][tri]&np.isfinite(tp)
            null.append(float(spearmanr(geo_dist[known],tp[known]).statistic))
        global_association[mode]=dict(rho=observed,n_pairs=int(mask.sum()),permutation_tail=(1+sum(abs(x)>=abs(observed) for x in null))/(reps+1),
            reps=reps,seed=permutation_seed,null_rho=null,tail='two-sided absolute rho, +1 adjustment',
            interpretation='Positive rho: farther municipalities have more dissimilar temporal changes. Descriptive approximate municipality-label permutation jointly permutes distance and reliability matrices; assumes exchangeability of municipality labels under no spatial association, not independent pair observations.')
    contexts={};membership_rows=[]
    for mode in ('immigration','emigration'):
        for config,conf in dashboard['analyses'][mode]['configs'].items():
            for level in ('micro','macro'):
                for view in ('robust','candidate'):
                    parents=conf[level] if view=='robust' else (conf['micro']+conf['rejected_groups'] if level=='micro' else conf['candidate_macro'])
                    key='|'.join((mode,config,level,view));contexts[key]={'graphs':{},'unassigned_ids':sorted(set(ids)-{c for p in parents for c in p['member_ids']})}
                    for graph_name,graph in graphs.items():
                        sectors=[];memberships={}
                        for parent in sorted(parents,key=lambda p:p['id']):
                            for serial,members in enumerate(components(parent['member_ids'],graph),1):
                                sector_id=parent['id']+f'-S{serial:03d}';q=quality(members,mode);q['connected']=True
                                sector=dict(id=sector_id,parent_cluster_id=parent['id'],member_ids=members,name=' – '.join(next(m['name'] for m in dashboard['municipalities'] if m['id']==c) for c in members[:3])+(' …' if len(members)>3 else ''),quality=q,
                                    graph=graph_name,radius_km=None if graph_name=='adjacency' else int(graph_name[6:]),
                                    chaining=graph_name!='adjacency' and q['diameter_km']>int(graph_name[6:]),validated=False)
                                sectors.append(sector)
                                for c in members:
                                    memberships[c]=sector_id;membership_rows.append(dict(mode=mode,configuration=config,level=level,view=view,graph=graph_name,municipality_id=c,parent_cluster_id=parent['id'],sector_id=sector_id,singleton=q['singleton']))
                        contexts[key]['graphs'][graph_name]=dict(sectors=sectors,memberships=memberships)
    example=dict(name='Krušnohoří: Blatno–Kalek–Boleboř–Hora Svaté Kateřiny',member_ids=EXAMPLE,modes={},geography={})
    for graph_name,graph in graphs.items():example['geography'][graph_name]=dict(components=components(EXAMPLE,graph),connected=len(components(EXAMPLE,graph))==1)
    for mode in pairs:
        records=[]
        for a in range(4):
            for b in range(a+1,4):
                ca,cb=EXAMPLE[a],EXAMPLE[b];i,j=index[ca],index[cb]
                records.append(dict(id_a=ca,id_b=cb,distance_km=distance[i,j],rook_adjacent=cb in neighbors[ca],**{k:pairs[mode][k][i,j] for k in pairs[mode]}))
        example['modes'][mode]=dict(quality=quality(EXAMPLE,mode),pairs=records,
            base_memberships={c:next(m for m in dashboard['municipalities'] if m['id']==c)[mode]['candidate_memberships'] for c in EXAMPLE})
    hashes=dict(base_dashboard=digest(OUT/'temporal_dashboard.json'),original_geometry=digest(ORIGINAL),display_geometry=digest(DISPLAY),spatial_source=digest(__file__),
                pairwise_immigration=digest(OUT/'pairwise_immigration.npz'),pairwise_emigration=digest(OUT/'pairwise_emigration.npz'))
    analysis_id=hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest()[:16]
    meta=dict(analysis_id=analysis_id,base_analysis_id=dashboard['meta']['analysis_id'],geometry_method='Original WGS84 polygon boundary intersections with positive length (rook); area-weighted local projected polygon centroids; haversine spherical great-circle centroid distances',
        distance_units='km; straight-line centroid distances, not travel distances',centroid_projection='local constant cos(50.5 degrees) longitude scaling; centroid transformed back to WGS84',
        membership_time_independent=True,temporal_refit=False,minimum_joint_years=8,all_sectors_exploratory=True,
        graph_interpretation='Connected components induced within existing parent clusters. Radius graphs permit chaining; diameter reports the largest pair distance. UNASSIGNED is excluded, never grouped together.',
        correlation_interpretation='pearson/spearman use saved robust clipped first differences; raw_delta_pearson uses count first differences; rate_delta_pearson uses unshrunk per1000 first differences; residual_pearson uses modeled first differences minus regional unshrunk rate first difference.',
        geometry_crossvalidation=geo['crossvalidation'])
    result=dict(meta=meta,years=dashboard['years'],municipalities=[dict(id=m['id'],name=m['name'],lon=centers[m['id']][0],lat=centers[m['id']][1],neighbors=sorted(neighbors[m['id']])) for m in dashboard['municipalities']],
        coordinates=centers,geography=dict(edges=geo['edges'],ids=ids),global_association=global_association,contexts=contexts,pairwise=dict(ids=ids,distance_km=distance,**pairs),example=example,regional_baseline=residual_info)
    dump(OUT/'spatial_sectors.json',result);write_csv(OUT/'spatial_sector_membership.csv',membership_rows)
    pairrows=[]
    for mode,p in pairs.items():
        for i in range(len(ids)):
            for j in range(i+1,len(ids)):pairrows.append(clean(dict(mode=mode,id_a=ids[i],id_b=ids[j],distance_km=distance[i,j],rook_adjacent=ids[j] in neighbors[ids[i]],**{k:v[i,j] for k,v in p.items()})))
    write_csv(OUT/'spatial_pairs.csv',pairrows)
    manifest=dict(meta=meta,input_sha256=hashes,geometry_runtime=geo['worker_python'],geometry_vendor_fallback=geo['worker_vendor_fallback'],shapely_version=geo['shapely_version'],invalid_original_geometry_codes=geo['invalid_codes'],outputs=['spatial_sectors.json','spatial_sector_membership.csv','spatial_pairs.csv','spatial_sector_report.md','spatial_manifest.json'])
    dump(OUT/'spatial_manifest.json',manifest)
    lines=['# Geographic sectors of frozen temporal groups','',f"Base analysis `{meta['base_analysis_id']}`; spatial overlay `{analysis_id}`.",'',
           'Geography only divides existing temporal groups into static connected portions. It does not change their memberships, refit migration clusters, or establish migration similarity from proximity. All sectors are exploratory: the base analysis accepted no robust groups after its stability screens. Singletons have no shared-pattern claim.','',
           f"Original-boundary rook graph: {len(geo['edges'])} edges. Exact shared-edge display crosscheck: {geo['crossvalidation']['both']} common, {len(geo['crossvalidation']['original_only'])} original-only, {len(geo['crossvalidation']['display_only'])} display-only. Original geometry is authoritative.",'',
           'Radius 10/20/30 km graphs connect centroid pairs within their threshold and take induced components inside each parent. Chaining can produce a component whose full diameter exceeds its threshold; every sector exports this diameter and a chaining flag. Distances are straight-line great-circle centroid distances, not routes.','',
           'Pair summaries use each unique unordered pair once. No singleton receives a perfect correlation. Undefined correlations stay missing. Raw-count and unshrunk-rate Pearson changes are separate from the saved clipped modeled-change correlations. At least eight jointly observed transitions are required for the additional correlations. Regional residuals subtract the common calendar-year regional rate change; they are descriptive sensitivity measures.','',
           '## Manual four-municipality area','',example['name'], '',f"Rook components: {example['geography']['adjacency']['components']}",'']
    lines.extend(['## Global descriptive geographic association',''])
    for mode,stat in global_association.items():
        lines.append(f"{mode}: Spearman geographic distance versus temporal dissimilarity = {stat['rho']:.4f}, {stat['n_pairs']} reliable unique pairs; two-sided municipality-label permutation tail {stat['permutation_tail']:.3f} ({reps} repetitions, seed {permutation_seed}, +1 adjustment).")
    lines.extend(['','The permutation moves municipality labels jointly along rows and columns, including the reliability mask. It assumes label exchangeability under no geographic association and preserves dependence among pairs; this is descriptive approximate evidence, not an iid-pair significance test.',''])
    for mode in pairs:
        q=example['modes'][mode]['quality'];lines.extend([f"### {mode}",'',f"Mean clipped Pearson {q['mean_pearson']:.3f}; Spearman {q['mean_spearman']:.3f}; informative directional agreement {q['agreement']:.3f}; opposition {q['opposition']:.3f}; mean shared informative years {q['shared_years']:.1f}; mean regional-residual Pearson {q['residual_pearson']:.3f}. Full geographic diameter {q['diameter_km']:.2f} km.",'','| Municipality pair | km | Rook | Clipped Pearson | Rate Pearson | Residual Pearson | Agreement | Shared years |','|---|---:|---|---:|---:|---:|---:|---:|'])
        for r in example['modes'][mode]['pairs']:
            fmt=lambda x:f'{x:.3f}' if x is not None and np.isfinite(x) else 'undefined'
            lines.append(f"| {r['id_a']} – {r['id_b']} | {r['distance_km']:.2f} | {r['rook_adjacent']} | {fmt(r['pearson'])} | {fmt(r['rate_delta_pearson'])} | {fmt(r['residual_pearson'])} | {fmt(r['agreement'])} | {r['informative_overlap']} |")
        lines.append('')
    lines.extend(['## Context inventory','','| Mode/configuration/level/view | Rook sectors | Radius 10 | Radius 20 | Radius 30 |','|---|---:|---:|---:|---:|'])
    for key,c in contexts.items():lines.append('| '+key+' | '+' | '.join(str(len(c['graphs'][g]['sectors'])) for g in graphs)+' |')
    (OUT/'spatial_sector_report.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps(dict(analysis_id=analysis_id,edges=len(geo['edges']),contexts=len(contexts),membership_rows=len(membership_rows),manual_quality={m:example['modes'][m]['quality'] for m in pairs}),default=clean))

if __name__=='__main__':
    if '--geometry-worker' in sys.argv:geometry_worker()
    else:run()
