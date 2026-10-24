const NS = 'http://www.w3.org/2000/svg';
const make = (tag, attrs = {}) => {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  return element;
};

/** Independent categorical municipality map; selection and fitting belong to the caller. */
export function createClusterMap(svg, geometry, {onSelect = () => {}} = {}) {
  const layer = make('g', {class: 'cluster-map-shapes'});
  const outlines = make('g', {'pointer-events': 'none', 'aria-hidden': 'true'});
  const paths = new Map(), bounds = new Map(), listeners = [];
  const previousTouchAction = svg.style.touchAction;
  svg.style.touchAction = 'none';
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.append(layer, outlines);
  let state = {memberships: new Map(), colors: new Map(), visibleIds: null,
    selectedGroup: null, selectedCode: null, names: new Map()};
  let width = 1000, height = 600, camera, base, animation = 0, destroyed = false;
  let drag = null, suppressClick = false, focusedCode = null, fittedCodes = null;
  const listen = (node, type, handler, options) => {
    node.addEventListener(type, handler, options);
    listeners.push(() => node.removeEventListener(type, handler, options));
  };
  const features = (geometry.features || []).filter(f => ['Polygon', 'MultiPolygon'].includes(f.geometry?.type));
  const cosine = Math.cos(50.5 * Math.PI / 180);
  const point = ([x, y]) => [x * cosine * 1000, -y * 1000];
  for (const feature of features) {
    const code = String(feature.properties?.code ?? feature.id);
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    const b = {x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity};
    const d = polygons.flatMap(polygon => polygon.map(ring => ring.map((coordinate, index) => {
      const [x, y] = point(coordinate);
      b.x0 = Math.min(b.x0, x); b.x1 = Math.max(b.x1, x);
      b.y0 = Math.min(b.y0, y); b.y1 = Math.max(b.y1, y);
      return `${index ? 'L' : 'M'}${x.toFixed(4)},${y.toFixed(4)}`;
    }).join('') + 'Z')).join('');
    if (!Number.isFinite(b.x0)) continue;
    const path = make('path', {d, 'data-code': code, class: 'cluster-map-municipality',
      'fill-rule': 'evenodd', tabindex: 0, role: 'button', 'vector-effect': 'non-scaling-stroke',
      'stroke-linejoin': 'round', 'stroke-linecap': 'round'});
    path.dataset.name = feature.properties?.name ?? code;
    path.style.outline = 'none';
    path.style.cursor = 'pointer';
    paths.set(code, path); bounds.set(code, b); layer.append(path);
    listen(path, 'click', event => { if (suppressClick) { event.preventDefault(); return; } onSelect(code); });
    listen(path, 'keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onSelect(code); }
    });
    listen(path, 'focus', () => { focusedCode = code; paint(); });
    listen(path, 'blur', () => { focusedCode = null; paint(); });
  }
  function combined(codes) {
    const items = codes.map(code => bounds.get(String(code))).filter(Boolean);
    if (!items.length) return {x0: 0, y0: 0, x1: 1, y1: 1};
    return {x0: Math.min(...items.map(b => b.x0)), y0: Math.min(...items.map(b => b.y0)),
      x1: Math.max(...items.map(b => b.x1)), y1: Math.max(...items.map(b => b.y1))};
  }
  const allBounds = combined([...bounds.keys()]);
  function target(b) {
    const side = Math.min(28, width * .06), vertical = Math.min(65, height * .2);
    return {cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2,
      k: Math.min(Math.max(1, width - side * 2) / Math.max(.01, b.x1 - b.x0),
        Math.max(1, height - vertical * 2) / Math.max(.01, b.y1 - b.y0))};
  }
  function apply() {
    const transform = `translate(${width / 2} ${height / 2}) scale(${camera.k}) translate(${-camera.cx} ${-camera.cy})`;
    layer.setAttribute('transform', transform); outlines.setAttribute('transform', transform);
  }
  function move(next, smooth = true) {
    cancelAnimationFrame(animation);
    if (!camera || !smooth || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      camera = next; apply(); return;
    }
    const start = {...camera}, time = performance.now();
    const tick = now => {
      if (destroyed) return;
      const t = Math.min(1, (now - time) / 320), ease = 1 - (1 - t) ** 3;
      camera = Object.fromEntries(['cx', 'cy', 'k'].map(key => [key, start[key] + (next[key] - start[key]) * ease]));
      apply(); if (t < 1) animation = requestAnimationFrame(tick);
    };
    animation = requestAnimationFrame(tick);
  }
  function paint() {
    outlines.replaceChildren();
    for (const [code, path] of paths) {
      const group = state.memberships.get(code);
      const visible = !state.visibleIds || state.visibleIds.has(group);
      const assigned = visible && group != null && group !== 'UNASSIGNED';
      const selected = assigned && state.selectedGroup != null && group === state.selectedGroup;
      path.setAttribute('fill', assigned ? (state.colors.get(group) || '#9ca3af') : '#d7dce2');
      path.setAttribute('opacity', assigned && state.selectedGroup != null && !selected ? '.22' : '1');
      path.setAttribute('stroke', '#ffffff'); path.setAttribute('stroke-width', '.65');
      path.setAttribute('aria-pressed', String(code === state.selectedCode || selected));
      path.setAttribute('aria-label', `${state.names.get(code) ?? path.dataset.name} (${code})${assigned ? ` · ${group}` : ' · Bez skupiny'}`);
      path.classList.toggle('selected', selected);
      path.classList.toggle('filtered', !visible);
      if (selected || code === state.selectedCode || code === focusedCode) {
        outlines.append(make('path', {d: path.getAttribute('d'), fill: 'none',
          stroke: code === state.selectedCode ? '#111827' : code === focusedCode ? '#111827' : '#334155',
          'stroke-width': code === state.selectedCode ? 3.2 : code === focusedCode ? 2.8 : 1.5,
          'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round'}));
      }
    }
  }
  function resize() {
    const rect = svg.getBoundingClientRect();
    width = rect.width || 1000; height = rect.height || 600;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const oldBase = base; base = target(allBounds);
    if (fittedCodes) move(target(combined(fittedCodes)), false);
    else if (camera && oldBase) move({...camera, k: camera.k * base.k / oldBase.k}, false);
    else move({...base}, false);
  }
  listen(svg, 'pointerdown', event => {
    if (event.button !== 0) return;
    cancelAnimationFrame(animation); suppressClick = false;
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, camera: {...camera}};
  });
  listen(window, 'pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) suppressClick = true;
    if (suppressClick) {
      fittedCodes = null;
      move({...camera, cx: drag.camera.cx - dx / camera.k, cy: drag.camera.cy - dy / camera.k}, false);
    }
  });
  const endDrag = () => { drag = null; };
  listen(window, 'pointerup', endDrag); listen(window, 'pointercancel', endDrag);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
  observer?.observe(svg); if (!observer) listen(window, 'resize', resize);
  resize(); paint();
  return {
    update(next) { state = {...state, ...next}; paint(); },
    fit(codes) {
      fittedCodes = [...new Set(codes.map(String))].filter(code => bounds.has(code));
      if (!fittedCodes.length) fittedCodes = null;
      move(target(fittedCodes ? combined(fittedCodes) : allBounds));
    },
    reset() { fittedCodes = null; move({...base}); },
    zoomBy(factor) {
      if (!Number.isFinite(factor) || factor <= 0) return;
      fittedCodes = null;
      move({...camera, k: Math.max(base.k * .5, Math.min(base.k * 100, camera.k * factor))});
    },
    destroy() {
      destroyed = true; cancelAnimationFrame(animation); observer?.disconnect();
      listeners.forEach(remove => remove()); layer.remove(); outlines.remove();
      svg.style.touchAction = previousTouchAction;
    }
  };
}
