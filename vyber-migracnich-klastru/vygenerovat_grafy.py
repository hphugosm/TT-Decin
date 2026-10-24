#!/usr/bin/env python3
"""Vykreslí tři obrázky PNG+SVG z malých uložených podkladů, bez mapy.

Instalace: python -m pip install matplotlib==3.10.8 numpy
Spuštění odkudkoliv: python /cesta/vygenerovat_grafy.py
Zdrojové SHA-256 a identifikátory analýz jsou v grafy/podklady.json.
Skript znovu vykresluje uložené výsledky; neopakuje samotný clustering.
"""
from pathlib import Path
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator

ROOT=Path(__file__).resolve().parent
OUT=ROOT/'grafy'
D=json.loads((OUT/'podklady.json').read_text(encoding='utf-8'))
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'axes.spines.top':False,'axes.spines.right':False,'axes.titleweight':'bold','axes.labelcolor':'#334155','text.color':'#172b43','axes.edgecolor':'#cbd5e1','svg.fonttype':'none','savefig.facecolor':'white','figure.facecolor':'white'})
BLUE='#19728a'; ORANGE='#c16930'

def save(fig,name):
    for extension in ('png','svg'):
        fig.savefig(OUT/f'{name}.{extension}',dpi=180,bbox_inches='tight',metadata={'Title':name})
    plt.close(fig)


def comparison():
    fig,ax=plt.subplots(1,2,figsize=(13,6))
    x=np.arange(4);width=.35
    for mode,color,label,offset in [('immigration',BLUE,'Přistěhování',-.5),('emigration',ORANGE,'Vystěhování',.5)]:
        groups=[p['modes'][mode]['summary']['groups'] for p in D['profiles']]
        largest=[p['modes'][mode]['summary']['max_group_size'] for p in D['profiles']]
        for panel,values in zip(ax,(groups,largest)):
            bars=panel.bar(x+offset*width,values,width,color=color,label=label)
            panel.bar_label(bars,padding=4,fontsize=11)
    for panel,title,ylabel in zip(ax,['Kolik skupin vzniklo','Velikost největší skupiny'],['Počet skupin','Počet obcí']):
        panel.set_title(title,loc='left',pad=18);panel.set_ylabel(ylabel)
        panel.set_xticks(x,[p['label'] for p in D['profiles']]);panel.yaxis.set_major_locator(MaxNLocator(integer=True));panel.grid(axis='y',alpha=.18);panel.set_axisbelow(True);panel.margins(y=.18)
    ax[0].legend(frameon=False,loc='upper left');fig.suptitle('Volnější podmínky mění výsledek hledání',x=.07,ha='left',fontsize=18,fontweight='bold',y=.98)
    fig.text(.07,.035,'354 obcí Ústeckého kraje • skupiny mají nejméně 2 obce • žádná cílová velikost ani počet skupin\nProfily nejsou vnořené. Uvolněné, volnější a rozšířené nastavení jsou dodatečná průzkumná citlivost.',fontsize=10,color='#526173')
    fig.subplots_adjust(top=.80,bottom=.21,wspace=.25)
    save(fig,'01_porovnani_profilu')


def curves():
    s=D['six'];years=np.array(s['years']);colors=['#156e88','#db753c','#5b8e43','#8b5eab','#bc4e76','#998018']
    fig,ax=plt.subplots(2,1,figsize=(13,8),sharex=True)
    for name,rate,change,color in zip(s['names'],s['raw_rates'],s['raw_rate_changes'],colors):
        ax[0].plot(years,rate,label=name,color=color,lw=1.7)
        ax[1].plot(years[1:],change[1:],color=color,lw=1.5)
    ax[0].set_ylabel('Přistěhovalí / 1 000 obyvatel');ax[1].set_ylabel('Změna míry proti minulému roku');ax[1].set_xlabel('Kalendářní rok')
    ax[0].set_title('Původní míry přistěhování',loc='left',pad=12)
    ax[1].set_title('Původní meziroční změny',loc='left',pad=12)
    ax[0].legend(ncol=6,frameon=False,loc='upper left',bbox_to_anchor=(0,1.29),fontsize=10)
    for panel in ax:panel.grid(alpha=.18);panel.set_axisbelow(True)
    ax[1].axhline(0,color='#64748b',lw=.8);ax[1].set_xticks(np.arange(2000,2026,5));ax[1].set_xlim(2000,2025)
    fig.suptitle('Šestice v rozšířeném profilu: co je v původních datech',x=.075,ha='left',fontsize=18,fontweight='bold',y=.99)
    fig.text(.075,.025,'Most • Obrnice • Bílina • Hrob • Mikulov • Osek | 2000–2025\nZobrazené syrové míry a jejich změny nejsou robustně škálované změny použité pro skórování.\nJde o průzkumnou skupinu; podobnost neznamená společnou příčinu ani lepší migrační saldo.',fontsize=10,color='#526173')
    fig.subplots_adjust(left=.085,right=.98,top=.80,bottom=.17,hspace=.40)
    save(fig,'02_sestice_casove_rady')


def evidence():
    s=D['six'];q=s['quality'];matrix=np.array(s['robust_pearson']);n=s['replicates']
    fig=plt.figure(figsize=(13,7));gs=fig.add_gridspec(1,2,width_ratios=[1.4,1],wspace=.50)
    a=fig.add_subplot(gs[0]);b=fig.add_subplot(gs[1]);im=a.imshow(matrix,cmap='YlGnBu',vmin=0,vmax=1)
    a.set_xticks(range(6),s['names'],rotation=45,ha='right');a.set_yticks(range(6),s['names']);a.set_title('Pearson: robustně škálované změny',loc='left',pad=20)
    for i in range(6):
        for j in range(6):a.text(j,i,f'{matrix[i,j]:.2f}'.replace('.',','),ha='center',va='center',color='white' if matrix[i,j]>.6 else '#172b43',fontsize=10)
    fig.colorbar(im,ax=a,fraction=.045,pad=.03,label='Korelace r')
    labels=['Bloky: celá šestice','Poisson: celá šestice','Bloky: průměr párů','Poisson: průměr párů']
    vals=np.array([q['block_group_stability'],q['poisson_group_stability'],q['block_pair_stability'],q['poisson_pair_stability']])*100
    bars=b.barh(range(4),vals,color=[BLUE,ORANGE,BLUE,ORANGE],height=.6)
    b.set_yticks(range(4),labels);b.invert_yaxis();b.set_xlim(0,100);b.set_xlabel('Zachování při opakovaném hledání (%)');b.set_title('Podobnost nestačí ke stabilitě',loc='left',pad=20)
    for i,v in enumerate(vals):b.text(v+2,i,(f'0 / {n}' if i<2 else f'{v:.1f} %'.replace('.',',')),va='center',fontsize=11)
    b.grid(axis='x',alpha=.18);b.set_axisbelow(True)
    fig.suptitle('Šestice je souvislá, ale při perturbacích se rozpadá',x=.07,ha='left',fontsize=18,fontweight='bold',y=.98)
    fig.text(.07,.03,f"{s['id']} • rozšířený průzkumný profil • analýza {D['meta']['extended_analysis_id']}\nCelá skupina = všichni členové zůstali pohromadě, případně ve větší skupině. Pár = původní dvojice zůstala pohromadě.\nKaždá zkouška má {n} opakování celého hledání. Matice není individuální test statistické významnosti.",fontsize=10,color='#526173')
    fig.subplots_adjust(left=.095,right=.975,top=.80,bottom=.24)
    save(fig,'03_sestice_korelace_a_stabilita')

if __name__=='__main__':
    comparison();curves();evidence()
    print('Vygenerováno: 01_porovnani_profilu, 02_sestice_casove_rady, 03_sestice_korelace_a_stabilita (PNG + SVG).')
