import {colorFor} from './radar-engine.mjs';
const NS='http://www.w3.org/2000/svg';
let sequence=0;
const make=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;};

/** Persistent SVG choropleth. Values and camera state are independent of geometry. */
export function createMunicipalityMap(svgElement,geometry,{onSelect=()=>{},onHover=()=>{},onExplain=()=>{}}={}){
  const width=1000,height=390,padding=16,paths=new Map(),bounds=new Map(),listeners=[];
  let contentWidth=width;
  const viewport=()=>({x:(width-contentWidth)/2,width:contentWidth});
  const resize=()=>{const v=viewport();svgElement.setAttribute('viewBox',`${v.x} 0 ${v.width} ${height}`);};
  const patternId=`radar-missing-${++sequence}`;
  const defs=make('defs'),pattern=make('pattern',{id:patternId,width:6,height:6,patternUnits:'userSpaceOnUse'});
  pattern.append(make('rect',{width:6,height:6,fill:'#e3e7ed'}),make('path',{d:'M-1,1L1,-1M0,6L6,0M5,7L7,5',stroke:'#a1aab7','stroke-width':1}));defs.append(pattern);
  const group=make('g',{'class':'municipality-shapes'});
  svgElement.setAttribute('viewBox',`0 0 ${width} ${height}`);svgElement.setAttribute('preserveAspectRatio','xMidYMid meet');
  svgElement.append(defs,group);svgElement.style.touchAction='none';
  const features=(geometry.features||[]).filter(f=>['Polygon','MultiPolygon'].includes(f.geometry?.type));
  const coords=[];const collect=a=>{if(typeof a[0]==='number')coords.push(a);else a.forEach(collect);};
  features.forEach(f=>collect(f.geometry.coordinates));
  const cos=Math.cos(50.5*Math.PI/180);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const [x,y] of coords){minX=Math.min(minX,x*cos);maxX=Math.max(maxX,x*cos);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  const scale=Math.min((width-2*padding)/(maxX-minX||1),(height-2*padding)/(maxY-minY||1));
  const offsetX=(width-(maxX-minX)*scale)/2,offsetY=(height-(maxY-minY)*scale)/2;
  contentWidth=(maxX-minX)*scale+2*padding;
  const point=([x,y])=>[offsetX+(x*cos-minX)*scale,offsetY+(maxY-y)*scale];
  let state={values:new Map(),domain:{min:0,max:1,signed:false},neutral:0,contrast:1,year:'',unitLabel:'',selectedCode:null,hoverCode:null};
  let camera={z:1,x:0,y:0},animation=0,drag=null,didDrag=false,destroyed=false;
  const listen=(el,type,fn)=>{el.addEventListener(type,fn);listeners.push(()=>el.removeEventListener(type,fn));};
  const apply=()=>group.setAttribute('transform',`translate(${camera.x} ${camera.y}) scale(${camera.z})`);
  const move=(next,smooth=false)=>{
    cancelAnimationFrame(animation);
    if(!smooth||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches){camera=next;apply();return;}
    const start={...camera},time=performance.now();
    const tick=now=>{if(destroyed)return;const t=Math.min(1,(now-time)/280),ease=1-(1-t)**3;camera={z:start.z+(next.z-start.z)*ease,x:start.x+(next.x-start.x)*ease,y:start.y+(next.y-start.y)*ease};apply();if(t<1)animation=requestAnimationFrame(tick);};animation=requestAnimationFrame(tick);
  };
  const paintStrokes=()=>{for(const [code,path] of paths){const selected=code===state.selectedCode,hovered=code===state.hoverCode;path.classList.toggle('selected',selected);path.classList.toggle('hovered',hovered);path.setAttribute('stroke',selected?'#101827':hovered?'#873b06':'#b7c2d1');path.setAttribute('stroke-width',selected?'2.7':hovered?'2.2':'.5');path.setAttribute('aria-pressed',String(selected));}for(const code of [state.hoverCode,state.selectedCode])if(paths.has(code))group.append(paths.get(code));};
  const select=code=>{code=code==null?null:String(code);if(code===state.selectedCode)return;state.selectedCode=code;paintStrokes();if(code&&bounds.has(code)){const b=bounds.get(code),z=Math.max(1,Math.min(8,Math.min(viewport().width/(b.w+90),height/(b.h+70))));move({z,x:width/2-b.cx*z,y:height/2-b.cy*z},true);}};
  for(const f of features){
    const code=String(f.properties?.code??f.id),name=f.properties?.name??code;let bx=Infinity,by=Infinity,ex=-Infinity,ey=-Infinity;
    const polygons=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
    const d=polygons.flatMap(p=>p.map(r=>r.map((c,i)=>{const [x,y]=point(c);bx=Math.min(bx,x);by=Math.min(by,y);ex=Math.max(ex,x);ey=Math.max(ey,y);return `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;}).join('')+'Z')).join('');
    const path=make('path',{d,id:`radar-municipality-${sequence}-${code}`,'data-code':code,class:'municipality','fill-rule':'evenodd',tabindex:0,role:'button','aria-label':`${name} (${code})`,'vector-effect':'non-scaling-stroke'});path.dataset.name=name;paths.set(code,path);bounds.set(code,{w:ex-bx,h:ey-by,cx:(bx+ex)/2,cy:(by+ey)/2});group.append(path);
    const activate=()=>{select(code);onSelect(code);};
    listen(path,'click',e=>{if(didDrag){e.preventDefault();return;}activate();});
    listen(path,'keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}else if(e.key==='F1'){e.preventDefault();onExplain(code);}});
    // Obec a její statistiky se vybírají jen kliknutím nebo Enter/mezerníkem.
    // Žádný hover tooltip ani přesouvání detailu při přejezdu mapy.
  }
  const update=next=>{
    resize();
    const hasSelected=Object.prototype.hasOwnProperty.call(next,'selectedCode'),selected=hasSelected?next.selectedCode:state.selectedCode;
    const previousSelected=state.selectedCode;state={...state,...next,selectedCode:previousSelected};
    if(state.hoverCode!=null)state.hoverCode=String(state.hoverCode);
    for(const [code,path] of paths){if(state.names?.has(code))path.dataset.name=state.names.get(code);const value=state.values?.get(code),valid=typeof value==='number'&&Number.isFinite(value);path.setAttribute('fill',valid?colorFor(value,state.domain,state.neutral,state.contrast,state.metric):`url(#${patternId})`);path.classList.toggle('missing',!valid);const label=`${path.dataset.name} (${code}) · ${state.year} · ${valid?new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:Math.abs(value)<0.01?6:3}).format(value):'Data nejsou dostupná'}${valid&&state.unitLabel?' '+state.unitLabel:''}`;path.setAttribute('aria-label',label);}
    select(selected);paintStrokes();
  };
  const position=e=>{const p=svgElement.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const matrix=svgElement.getScreenCTM();return matrix?p.matrixTransform(matrix.inverse()):p;};
  listen(svgElement,'pointerdown',e=>{if(e.button!==0)return;cancelAnimationFrame(animation);const p=position(e);drag={id:e.pointerId,x:p.x,y:p.y,camera:{...camera}};didDrag=false;});
  listen(svgElement,'pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const p=position(e),dx=p.x-drag.x,dy=p.y-drag.y;if(Math.hypot(dx,dy)>4)didDrag=true;if(didDrag){camera={...camera,x:drag.camera.x+dx,y:drag.camera.y+dy};apply();}});
  const endDrag=()=>{drag=null;};listen(window,'pointerup',endDrag);listen(window,'pointercancel',endDrag);
  const resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;resizeObserver?.observe(svgElement);
  update({});
  return {update,select,zoomBy(factor){if(!Number.isFinite(factor)||factor<=0)return;const z=Math.max(1,Math.min(8,camera.z*factor)),ratio=z/camera.z;move({z,x:width/2-(width/2-camera.x)*ratio,y:height/2-(height/2-camera.y)*ratio},true);},reset(){move({z:1,x:0,y:0},true);},destroy(){destroyed=true;resizeObserver?.disconnect();cancelAnimationFrame(animation);listeners.forEach(fn=>fn());defs.remove();group.remove();}};
}
