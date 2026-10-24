"""Generate Czech reports exclusively from the saved temporal analysis exports."""
from pathlib import Path
import json
import argparse

PROJECT = Path(__file__).resolve().parent.parent


def number(value, digits=3):
    return '—' if value is None else f'{value:.{digits}f}' if isinstance(value, (int, float)) else str(value)


def percent(value):
    return '—' if value is None else f'{100*value:.1f} %'


def table(headers, rows):
    def cell(v):
        return str(v).replace('|', '\\|').replace('\n', ' ')
    return '\n'.join(['| '+' | '.join(headers)+' |', '| '+' | '.join(['---']*len(headers))+' |'] + ['| '+' | '.join(cell(v) for v in row)+' |' for row in rows])


def generate(out, test_status=None):
    data = json.loads((out/'temporal_dashboard.json').read_text(encoding='utf-8'))
    manifest = json.loads((out/'analysis_manifest.json').read_text(encoding='utf-8'))
    if manifest.get('analysis_id') != data['meta']['analysis_id']:
        raise ValueError('Dashboard and manifest analysis_id differ; regenerate complete analysis exports first.')
    municipalities = {str(m['id']): m for m in data['municipalities']}
    def names(ids):
        return ', '.join(f"{municipalities[str(i)]['name']} ({i})" for i in ids) or 'Žádné.'
    years = data['years']
    report = [f"# Časové migrační vzorce obcí Ústeckého kraje\n\nAnalýza `{data['meta']['analysis_id']}`; období {years[0]}–{years[-1]}, {len(years)} pozorovaných roků, nejvýše {len(years)-1} změn; {len(municipalities)} obcí.",
        '## Co výsledek znamená\n\nKlastry popisují synchronizaci změn ve stejných kalendářních letech. Přistěhovalí a odstěhovalí mají samostatné modely a členství. Nejde o skupiny podle absolutního objemu ani o analýzu migračního salda. Jedna obec má v dané verzi a konfiguraci stejné ID ve všech letech; slider pouze čte uložené výsledky. Výsledky jsou průzkumné a synchronizace není důkaz kauzality.',
        '## Metoda a automatická granularita\n\nHierarchické aglomerativní shlukování používá předem vypočtenou symetrickou vzdálenost mezi kalendářně zarovnanými prvními diferencemi míry migrace na 1 000 obyvatel. Směrová složka porovnává informativní růsty a poklesy; nejistá nula není shoda. Korelační složka kombinuje Pearsonovu a Spearmanovu korelaci robustně škálovaných změn, s převodem `(1-r)/2`; záporná korelace proto zvyšuje vzdálenost. Nedostatečně doložené dvojice mají vzdálenost 1. DTW ani posun kalendáře při shlukování se nepoužívá.',
        'Pro každý směr se porovnává všech 18 kombinací: baseline, EB, reliability × tři váhy směrové složky × average/complete linkage. Každá kombinace hledá řez dendrogramu na nejvýše 32 datově odvozených výškách bez pevného K a bez omezení počtu klastrů. Základní skóre zahrnuje shodu, pokrytí obcí i let, podobnost, oddělení a důkaz nad náhodnou směrovou shodou; penalizuje protichůdné změny a fragmentaci. U každého modelu se posuzují čtyři silné kandidátní řezy pokrývající různé úrovně rozlišení; výběrové skóre přidává `0,20 × blokové ARI + 0,20 × blokové zachování párů + 0,20 × Poissonovo zachování párů`. Osm společných blokových replikací a čtyři společné Poissonovy perturbace počtů porovnávají všech 18 modelů za stejných náhodných změn. Zohlednění obou zdrojů nestability už při výběru omezuje volbu hezky odděleného, ale na drobný početní šum citlivého rozdělení. Zvolený počet je výsledek transparentního cíle, nikoli důkaz jediné přirozené granularity. Loose/balanced/strict jsou uložené konfigurace; makroúroveň je hrubší řez téhož dendrogramu.',
        '## Shrinkage a nejistota\n\nPoisson–Gamma EB používá časově konstantní sdílený prior samostatně pro každý směr. Pro počet Y a expozici E je posterior `Gamma(alpha+Y, beta+E)` ve tvaru shape/rate. Parametry jsou odvozeny momentovou aproximací z meziobecní variability dlouhodobě sdružených sazeb po odečtení odhadovaného Poissonova šumu; beta je omezena na 10–5 000 osoboroků, alpha = mu × beta. Parametry jsou exportovány níže; nejde o ročně měněný regionální prior. Reliability varianta navíc používá ternární směry s prahem modelové nejistoty. Zvolená varianta vyhrála zveřejněné vícekriteriální srovnání, nikoli obecný test nadřazenosti EB.']
    negative=[]
    null_nonconfirmation=[]
    for mode,title in [('immigration','Přistěhovalectví'),('emigration','Odstěhovalectví')]:
        cfg=data['analyses'][mode]['configs']['balanced']
        null_info=data['analyses'][mode]['validation']['null_model']
        if null_info['approximate_global_tail']>=.05:
            null_nonconfirmation.append(f"**{title}: globální surrogate tail {number(null_info['approximate_global_tail'])}; evidence není výjimečná vůči zvolenému globálnímu null modelu. Statistický objev se tímto testem nepotvrdil.**")
        if not cfg['metrics']['clusters']:
            negative.append(f"**{title}: nebyla nalezena žádná skupina splňující předem stanovený filtr robustnosti. Všech {len(municipalities)} obcí má ve výsledné konfiguraci UNASSIGNED.**")
    if negative:
        report.insert(1,'## Hlavní zjištění: robustní objev se nepotvrdil\n\n'+'\n\n'.join(negative)+'\n\nJde o záporný analytický výsledek, nikoli selhání softwaru. Hledání může vytvořit mnoho podobných kandidátních skupin, ale jejich nestabilita neopravňuje k tvrzení společného dlouhodobého vzorce. Prahy jsme nesnížili kvůli vytvoření skupin. Zamítnuté kandidáty lze na mapě prozkoumat pouze jako výslovně označenou průzkumnou vrstvu; nejsou konečnými ověřenými klastry. Nepotvrzení není důkazem, že synchronizované obce neexistují: s dostupnou délkou řad a tímto modelem pro ně nebyla doložena dostatečná robustnost.')
    if null_nonconfirmation:
        report.insert(1,'## Globální evidence nepotvrdila statistický objev\n\n'+'\n\n'.join(null_nonconfirmation)+'\n\nSkupiny ponechané filtrem robustnosti jsou průzkumné popisy synchronizace. Stabilita sama není statistická významnost. Žádný jednotlivý klastr nemá tímto postupem potvrzenou významnost; globální surrogate tail je navíc aproximativní diagnostikou s omezením použitého null modelu.')
    presentation = [f'# Sedmiminutová prezentace\n\nVerze {data["meta"]["analysis_id"]}; skutečné období {years[0]}–{years[-1]}.',
        '## 0:00–1:00 — Otázka\n\nHledáme obce, kde se přistěhovalectví nebo odstěhovalectví mění ve stejných letech stejným směrem. Velikost obce ani samotné saldo nejsou cílem. Každý migrační směr modelujeme zvlášť.',
        '## 1:00–2:00 — Data\n\nPoužíváme skutečné počty, populační expozice a identifikátory obcí. Souhrny věkových skupin nezapočítáváme podruhé. Chybějící rok není nula a první rok nemá vymyšlenou změnu.',
        '## 2:00–3:00 — Algoritmus\n\nZ měr na tisíc obyvatel vytvoříme meziroční změny. Porovnáme směrovou shodu i korelace změn. Osmnáct modelů soutěží o vhodnou granularitu; počet skupin předem neurčujeme. Shrinkage mírní nejisté odhady malých obcí.']
    summaries=[]
    for mode, title in [('immigration', 'Přistěhovalectví'), ('emigration', 'Odstěhovalectví')]:
        analysis=data['analyses'][mode]; selected=analysis['selected']; config=analysis['configs']['balanced']; metrics=config['metrics']; groups=config['micro']; validation=analysis['validation']; block=config.get('stability',{}).get('block',validation['block_bootstrap']); poisson=config.get('stability',{}).get('poisson',validation['parametric_poisson']); null=validation['null_model']; rejected=config.get('rejected_groups',[]); candidate=config.get('candidate_metrics',selected)
        report += [f'## {title}', f"Zvolený model: **{selected['variant']}**, linkage **{selected['linkage']}**, váha směru **{selected['directional_weight']}**, výška řezu **{number(config['micro_height'])}**. Automaticky vzniklo **{metrics['clusters']} mikroklastrů**, {len(config['macro'])} makroklastrů; přiřazeno **{metrics['assigned']}** obcí ({percent(metrics['coverage'])}), nepřiřazeno **{metrics['unassigned']}**.",
            table(['Metrika','Hodnota'],[(k,number(metrics.get(k))) for k in ['agreement','opposite','within_similarity','separation','informative_coverage','chance_agreement','evidence_statistic','silhouette','fragmentation','minimum_group','maximum_group']]),
            f"Kandidátní rozdělení před filtrem: blokové ARI {number(block['ari_mean'])} (SD {number(block['ari_std'])}); zachování vnitroklastrových párů {percent(block['pair_consistency'])}; replikací {block['repetitions']}. Parametrická Poissonova perturbace: ARI {number(poisson['ari_mean'])}, zachování párů {percent(poisson['pair_consistency'])}.",
            f"Globální přibližný null tail **{number(null['approximate_global_tail'])}**, {null['repetitions']} surrogátů, rozlišení {number(null['resolution'])}; pozorovaná evidence {number(null['observed_evidence'])}. V každém surrogátu se maximalizuje evidence přes celou rodinu variant, vah, linkage a výšek mřížky řezů; proti tomuto maximu se porovnává evidence skutečně zvoleného modelu. Nejde o test významnosti jednotlivých klastrů.",
            'Uložené konfigurace (kandidátní úroveň je výslovně průzkumná):\n\n'+table(['Konfigurace','Ponechané mikro K','Makro K','Přiřazeno','Kandidátní mikro K','Kandidátní makro K','Výška mikro','Výška makro'],[(name,c['metrics']['clusters'],len(c['macro']),c['metrics']['assigned'],c.get('candidate_metrics',c['metrics'])['clusters'],len(c.get('candidate_macro',[])),number(c['micro_height']),number(c['macro_height'])) for name,c in analysis['configs'].items()]),
            'Parametry konstantního prioru (alpha shape, beta rate/expozice; mu v událostech na osoborok):\n\n'+table(['Parametr','Hodnota'],[(k,number(v,6)) for k,v in analysis['shrinkage'].items()]),
            f"Před filtrem: {candidate['clusters']} kandidátních skupin a {candidate['assigned']} přiřazených obcí. Vyřazeno {len(rejected)} skupin ({sum(len(g['member_ids']) for g in rejected)} obcí). Skupina se ponechá pouze při zachování párů alespoň 0,50 v blokové i Poissonově perturbaci a mediánu alespoň 8 informativních roků. Členové vyřazených skupin jsou UNASSIGNED. Toto je transparentní filtr robustnosti, nikoli test významnosti. Stejné replikace slouží k filtrování i vykázání stability, takže stabilita ponechaných skupin není nezávislým validačním odhadem. Globální ARI a tail výše hodnotí kandidátní model před filtrem; tabulka skupin níže uvádí ponechané skupiny.",
            '### Porovnání všech kandidátů před filtrem\n\n'+table(['Varianta','Váha','Linkage','K','Přiřazeno','Shoda','Opačné','ARI výběru','Blokové páry výběru','Poissonovy páry výběru','Skóre','Vybrán'],[(r['variant'],r['directional_weight'],r['linkage'],r['clusters'],r['assigned'],number(r['agreement']),number(r['opposite']),number(r.get('selection_block_ari')),number(r.get('selection_pair_consistency')),number(r.get('selection_poisson_pair_consistency')),number(r['selection_score']),'ano' if r.get('selected') else '') for r in analysis['comparison']]),
            f"Kompletní zkoušené výšky řezů: `cut_search_{mode}.csv`.",
            '### Všechny skupiny a jejich kvalita\n\n'+table(['ID','Obcí','Shoda','Opačné','Podobnost','Informativní roky (medián)','Blokové páry','Poissonovy páry','Nízká důvěra'],[(g['id'],g['quality']['count'],number(g['quality']['directional_agreement']),number(g['quality']['opposite_share']),number(g['quality']['mean_similarity']),number(g['quality']['median_informative_years'],1),number(g['quality']['block_pair_stability']),number(g['quality'].get('poisson_pair_stability')),'ano' if g['quality']['low_confidence'] else '') for g in groups])]
        if not groups:
            poisson_values=[g['quality'].get('poisson_pair_stability') for g in rejected]
            poisson_values=[v for v in poisson_values if v is not None]
            report.append(f"**Záporný výsledek pro {title.lower()}: 0 ponechaných skupin.** Kandidátní rozdělení nesplnilo požadavek robustnosti; maximální Poissonovo zachování párů mezi vyřazenými skupinami je {number(max(poisson_values) if poisson_values else None)} proti prahu 0,500. Vyřazené skupiny jsou pouze průzkumné kandidáty.")
        null_values=null.get('max_search_null_statistics',[])
        if null_values:
            report.append(f"Rozsah maximálních null statistik: {number(min(null_values),6)}–{number(max(null_values),6)}; pozorovaná kandidátní evidence {number(null['observed_evidence'],6)}. "+('Pozorovaná evidence není výjimečně vysoká vůči zvolenému globálnímu surrogate null; výsledek nepodporuje tvrzení statistického objevu.' if null['approximate_global_tail']>=.05 else 'Malý globální surrogate tail je nutné interpretovat pouze v mezích tohoto aproximativního null modelu; nepotvrzuje jednotlivé klastry.'))
        low=[g for g in groups if g['quality']['low_confidence']]
        report.append('### Vyřazené kandidátní skupiny — nejsou potvrzeným objevem\n\nNíže jsou přímo uvedeny blokové i Poissonovy míry zachování párů. Každá skupina selhala alespoň v jednom filtru.\n\n'+table(['ID kandidáta','Obcí','Blokové páry','Poissonovy páry','Informativní roky','Obce'],[(g['id'],len(g['member_ids']),number(g['quality']['block_pair_stability']),number(g['quality'].get('poisson_pair_stability')),number(g['quality']['median_informative_years'],1),names(g['member_ids'])) for g in rejected]))
        unassigned=[m['id'] for m in municipalities.values() if m[mode]['memberships']['balanced']['micro']=='UNASSIGNED']
        report += ['### Nepřiřazené a méně spolehlivé obce\n\n**UNASSIGNED:** '+names(unassigned), '**Skupiny s nízkou důvěrou:** '+(', '.join(g['id'] for g in low) or 'Žádné.'), '**Obce v těchto skupinách:** '+names([i for g in low for i in g['member_ids']])]
        ranking_source=groups or rejected
        if not groups:
            report.append('### Pouze průzkumné pořadí zamítnutých kandidátů\n\nŽádná skupina nebyla ponechána. Následující nejsilnější a nejslabší položky jsou relativním pořadím zamítnutých kandidátů; nejsou úspěšně ověřenými klastry.')
        ranked=sorted(ranking_source,key=lambda g:(g['quality']['block_pair_stability'] or 0,g['quality']['mean_similarity']),reverse=True)
        for label,subset in [('Nejsilnější',ranked[:3]),('Nejslabší',ranked[-3:][::-1])]:
            report.append(f'### {label} '+('ponechané skupiny' if groups else 'zamítnuté průzkumné kandidáty')+' podle blokové stability a podobnosti')
            for g in subset:
                q=g['quality']; report.append(f"- **{g['id']}**: {q['count']} obcí, stabilita párů {percent(q['block_pair_stability'])}, podobnost {number(q['mean_similarity'])}; medoid {names([g['medoid_id']])}. Nejsilnější členové: {names(q['strongest_ids'])}. Nejslabší členové: {names(q['weakest_ids'])}.")
        annual=[]
        for j,year in enumerate(years):
            directions=[m[mode]['direction'][j] for m in municipalities.values()]; up=sum(x is not None and x>0 for x in directions); down=sum(x is not None and x<0 for x in directions)
            annual.append((year,up,down,len(directions)-up-down))
        notable=sorted(annual[1:],key=lambda x:abs(x[1]-x[2]),reverse=True)[:4]
        report += ['### Skutečné časové vzorce\n\nRoky s největší početní převahou jednoho směru v celé sadě obcí (nejde o odhad příčin):\n\n'+table(['Rok','Růst','Pokles','Nerozhodnutelné nebo chybějící'],notable)]
        for g in ranked[:3]:
            patterns=[f"{a['year']}: {a['state']} ({a['growing']}↑/{a['declining']}↓; synchronizace {percent(a['synchrony'])})" for a in g['yearly'] if a['state'] in ['GROWING','DECLINING']]
            report.append(('Průzkumný zamítnutý kandidát: ' if not groups else '')+f"**{g['id']}**, exportované synchronní roky: "+('; '.join(patterns) or 'Žádný rok nesplnil pravidlo synchronního stavu.')+'.')
        regional=validation['regional_baseline']
        report += [f"Regionální baseline kandidátního modelu před filtrem: shoda směru s regionem {percent(regional['directional_agreement'])}; shoda původních skupin po odečtení regionální změny {percent(regional['original_groups_residual_agreement'])}; ARI nového reziduálního shlukování {number(regional['residual_recluster_ari'])}. Jde o citlivostní kontrolu, nikoli důkaz nezávislých lokálních mechanismů.",
            '### Citlivost kandidátního modelu před filtrem\n\nZásah `variance_inflation_2` mění modelovou nejistotu a směrové štítky reliability varianty. U baseline nebo shrinkage, jejichž vzdálenosti tuto nejistotu nepoužívají, je tento zásah neaktivní: ARI = 1 je očekávané a není důkazem robustnosti vůči nadměrnému rozptylu.\n\n'+table(['Zásah','ARI','K','Pokrytí'],[(s['name'],number(s['ari']),s['clusters'],percent(s['coverage'])) for s in validation['sensitivities']])]
        summaries.append(('**Robustní objev se nepotvrdil; všechny obce jsou UNASSIGNED.** ' if not metrics['clusters'] else '')+('**Globální surrogate null nepotvrdil statistický objev.** ' if null['approximate_global_tail']>=.05 else '')+f"{title}: {metrics['clusters']} mikroklastrů, {metrics['assigned']} přiřazených a {metrics['unassigned']} nepřiřazených obcí; shoda {percent(metrics['agreement'])}, kandidátní blokové ARI {number(block['ari_mean'])}, globální surrogate tail {number(null['approximate_global_tail'])}.")
    report.append('## Primární metodické zdroje\n\n[Dokumentace SciPy: linkage a požadavky na vzdálenosti](https://docs.scipy.org/doc/scipy/reference/generated/scipy.cluster.hierarchy.linkage.html); [Berkeley: Gamma–Poisson empirical Bayes](https://stat210a.berkeley.edu/fall-2025/homework/homework6.pdf); [Politis a Romano: původní stationary bootstrap](https://statistics.stanford.edu/technical-reports/stationary-bootstrap); [Hemerik a Goeman: přesné testování náhodnými permutacemi a jeho předpoklady](https://pmc.ncbi.nlm.nih.gov/articles/PMC6405018/); [Gao, Bien a Witten: inference po hierarchickém shlukování](https://arxiv.org/abs/2012.02936). Tyto zdroje odůvodňují použité stavební prvky a jejich omezení; nedávají automatickou platnost tomuto vlastnímu hybridnímu časovému modelu ani jeho surrogate null.')
    report.append('## Přesné parametry běhu\n\n```json\n'+json.dumps(manifest.get('parameters',{}),ensure_ascii=False,indent=2)+'\n```')
    audit=manifest.get('preprocessing',{})
    report += ['## Audit dat a omezení\n\n'+json.dumps(audit,ensure_ascii=False,indent=2).join(['```json\n','\n```']),
        'Resampling je **podmíněný pevně zvolenou konfigurací**: délka společných bloků změn je 3, v replikacích se přepočítají vzdálenosti a strom a znovu automaticky vybere výška řezu při pevné variantě, váze, linkage a přísnosti. Neopakuje se výběr mezi variantami a modely; stabilita proto není nejistotou celé selekce. Společné indexy zachovávají současné vztahy obcí. Existující diference se nikdy znovu nediferencují přes hranice bloků. Nepřiřazené obce se v ARI kódují jednotlivě, takže netvoří uměle stabilní společný klastr.',
        'Null nezávisle kruhově posouvá již vypočtené změny obcí. Nevytváří změny přes slepené úrovně, ale předpokládá přibližnou kruhovou stacionaritu změn. Krátké roční řady, zlomy a společné šoky tuto aproximaci omezují. Maximum evidence přes celou hledanou rodinu omezuje optimismus po hledání; surrogate tail přesto není exaktní p-hodnota ani důkaz jednotlivých skupin. Rozlišení je omezeno počtem replikací.',
        'Poissonův model může podcenit nejistotu při společném stěhování rodin, nadměrném rozptylu nebo závislosti let. Parametrická perturbace je modelová citlivost, nikoli nezávislé potvrzení. Nula v reliability variantě znamená nedostatečně přesvědčivou nebo zanedbatelnou změnu. Statické hranice neprokazují historickou územní shodu; nevyřešené změny hranic a kódů omezují časovou interpretaci. Roční regionální rezidua jsou pouze diagnostikou. Výrazný rok neopravňuje k pojmenování historické příčiny bez dalších dat.',
        '## Implementace a reprodukce\n\nImplementováno: audit a agregace, samostatné migrační směry, míry a shrinkage, směry a spolehlivost, hybridní vzdálenosti, automatický řez, tři granularitní konfigurace a vnořená makroúroveň, porovnání modelů, stabilita a surrogate null, citlivostní kontroly a exporty. Offline dashboard čte hotový JSON; členství se s rokem nemění. Stav automatických testů uvádí samostatný výstup testovacího běhu; tento generátor testy nespouští a netvrdí jejich úspěch.',
        ('Stav testů doložený při generování tohoto reportu: '+test_status if test_status else 'Stav testů není tímto generátorem samostatně ověřen; použijte reprodukční příkaz níže.'),
        'Z kořene projektu:\n\n```sh\npython3 ustek_analytics/temporal_pipeline.py\npython3 ustek_analytics/temporal_report.py\npython3 -m unittest discover -s ustek_analytics/tests\npython3 ustek_analytics/serve.py\n```\n\nDashboard: `ustek_analytics/temporal.html`. Výchozí adresa: `http://127.0.0.1:8765/ustek_analytics/temporal.html`; port lze změnit argumentem `--port`. Zdrojové a implementační SHA-256, seed, parametry a verze jsou v `analysis_manifest.json`. Výstupy v `results/` zahrnují členství, roční trendy a souhrny, srovnání modelů, řezy a párové matice. Historická harmonizace hranic a formální významnost jednotlivých klastrů nejsou tímto systémem doloženy.']
    presentation += ['## 3:00–4:00 — Vypočtené výsledky\n\n'+'\n\n'.join(summaries),
        '## 4:00–5:00 — Jak ověřujeme výsledek\n\nUkážeme shodu směrů, protichůdné roky a zachování párů při společném blokovém resamplingu změn. Stabilita je podmíněná vybraným modelem; každá replikace znovu automaticky volí řez, ale nepřepíná variantu, váhu ani linkage. Globální kruhový surrogate null porovnává pozorovanou evidenci s maximem celé hledané rodiny. Nejde o významnost každého jednotlivého klastru.',
        '## 5:00–6:00 — Ukázka mapy\n\nPřepneme migrační směr, vybereme klastr a ukážeme jeho obce, reprezentativní křivku a heatmapu směrů. Posuneme rok: mění se aktuální hodnoty, nikoli členství. Pokud filtr ponechal skupiny, porovnáme silnější a slabší. Pokud žádnou neponechal, ukážeme UNASSIGNED a jasně označenou průzkumnou vrstvu zamítnutých kandidátů; nevydáváme je za objev.',
        '## 6:00–7:00 — Interpretace a limity\n\nKrátké časové řady dávají omezené důkazy. Rodinné přesuny mohou překročit Poissonův rozptyl, statické hranice vyžadují historickou kontrolu a regionální šok může vysvětlovat velkou část synchronizace. Zjištěné skupiny slouží k cílenému průzkumu; samy neurčují příčiny ani politická doporučení. Ukážeme auditovatelný export a přesný reprodukční příkaz.']
    (out/'analysis_report.md').write_text('\n\n'.join(report)+'\n',encoding='utf-8')
    (out/'presentation_7min.md').write_text('\n\n'.join(presentation)+'\n',encoding='utf-8')
    print(f'Reports written: {out / "analysis_report.md"}; {out / "presentation_7min.md"}')


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--out',type=Path,default=PROJECT/'results')
    parser.add_argument('--test-status',help='Explicit result from an independently completed test run')
    args=parser.parse_args()
    generate(args.out,args.test_status)
