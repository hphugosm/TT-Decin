/* Presentation skeleton. Content and graph slots are intentionally kept editable. */
const $ = (selector) => document.querySelector(selector);
const views = { home: $('#home'), presentation: $('#presentation'), guide: $('#guide') };
const presentationTitle = 'Stěhování obcí Ústeckého kraje';
const slideTitles = [
  '354 obcí: jedna hodnota jednoho ukazatele pro jednu obec za jeden rok',
  'Společný průnik 2018–2024: sedm let.',
  'Krize na Ukrajině.',
  'Jak číst migraci: přistěhovalí, vystěhovalí a migrační saldo.',
  'Interaktivní mapa migrace obcí Ústeckého kraje.',
  'Interaktivní mapa migračních klastrů obcí Ústeckého kraje.',
  'Hypotéza: poptávka firem po zaměstnancích, přistěhování lidí a poptávka po bytech.',
  'Realita: šest záměrů firem a skutečná migrace v jejich okolí.',
  'Interaktivní mapa migrace obcí Ústeckého kraje – závěr.'
];
const slideCount = slideTitles.length;
const HYPOTHESIS_SLIDE = 6;
const REALITY_SLIDE = 7;
const migrationExample = { incoming: 10, outgoing: 7 };
migrationExample.balance = migrationExample.incoming - migrationExample.outgoing;
let migrationAnimationFrame = null;

let currentView = 'home';
let currentSlide = 0;
// Pokrytí přepsané z dodaného grafu. Jde o dostupnost, nikoli hodnoty ukazatelů.
// Oba původní věkové řádky mají stejný rozsah a jsou sloučeny do jednoho tématu.
const coverage = [
  { label: 'Sociální situace', original: 'Sociální vyloučení', start: 2016, end: 2024 },
  { label: 'Migrace', original: 'Migrace podle věku', start: 2000, end: 2025, migration: true },
  { label: 'Firmy a podnikatelé', original: 'Ekonomické subjekty', start: 2013, end: 2025 },
  { label: 'Území a rozvoj', original: 'REGUAP', start: 2018, end: 2025 },
  { label: 'Nezaměstnanost', original: 'Nezaměstnanost', start: 2015, end: 2024 },
  { label: 'Věk obyvatel', original: 'Věkové ukazatele + věková struktura', start: 2000, end: 2025 },
  { label: 'Osobní informace', original: 'Základní demografie', start: 2000, end: 2025 }
];
for (const [i, row] of coverage.entries()) {
  const element = document.createElement('div');
  element.className = 'coverage-row' + (row.migration ? ' migration-row' : '');
  element.setAttribute('role', 'listitem');
  element.setAttribute('aria-label', `${row.label}: ${row.start} až ${row.end}`);
  element.title = `${row.original} · ${row.start}–${row.end}`;
  element.innerHTML = `<span class="coverage-name">${row.label}</span><div class="coverage-track"><span class="coverage-bar" style="--start:${(row.start - 2000) / 25 * 100}%;--width:${(row.end - row.start) / 25 * 100}%;--i:${i}"></span></div>`;
  $('#coverage-rows').append(element);
}
const overlapStart = Math.max(...coverage.map(row => row.start));
const overlapEnd = Math.min(...coverage.map(row => row.end));
console.assert(overlapStart === 2018 && overlapEnd === 2024 && overlapEnd - overlapStart + 1 === 7, 'Společný průnik musí odpovídat grafu.');
document.querySelectorAll('.topic-list li').forEach((item, i) => item.style.setProperty('--i', i));

function animate(element, className = 'changing') {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

// One persistent wordmark: move its two lines between the intro and later slides.
function positionDeckBrand(animateMove = false) {
  const brand = $('#deck-brand');
  const lines = [...brand.querySelectorAll('.brand-line')];
  const before = lines.map(line => line.getBoundingClientRect());
  lines.forEach(line => line.getAnimations?.().forEach(animation => animation.cancel()));
  brand.classList.toggle('is-compact', currentSlide > 0);
  if (!animateMove || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  lines.forEach((line, index) => {
    const after = line.getBoundingClientRect();
    const from = before[index];
    if (!from.width || !after.width || typeof line.animate !== 'function') return;
    line.animate([
      { transform: `translate(${from.left - after.left}px, ${from.top - after.top}px) scale(${from.width / after.width}, ${from.height / after.height})` },
      { transform: 'none' }
    ], { duration: 850, easing: 'cubic-bezier(.22,1,.36,1)' });
  });
}

// The example is illustrative, independent of the regional dataset.
function stopMigrationExample() {
  if (migrationAnimationFrame !== null) cancelAnimationFrame(migrationAnimationFrame);
  migrationAnimationFrame = null;
}
function playMigrationExample() {
  stopMigrationExample();
  const section = $('#terms-slide');
  section.classList.remove('is-playing');
  void section.offsetWidth;
  section.classList.add('is-playing');
  const counters = [
    { element: $('#example-incoming'), value: migrationExample.incoming, delay: 150, prefix: '' },
    { element: $('#example-outgoing'), value: migrationExample.outgoing, delay: 600, prefix: '' },
    { element: $('#example-balance'), value: migrationExample.balance, delay: 1150, prefix: '+' }
  ];
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach(item => { item.element.textContent = item.prefix + item.value; });
    return;
  }
  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    counters.forEach(item => {
      const progress = Math.max(0, Math.min(1, (elapsed - item.delay) / 650));
      item.element.textContent = item.prefix + Math.round(item.value * (1 - Math.pow(1 - progress, 3)));
    });
    if (elapsed < 1800) migrationAnimationFrame = requestAnimationFrame(frame);
    else migrationAnimationFrame = null;
  }
  frame(start);
}
for (const [kind, count] of Object.entries(migrationExample)) {
  const container = $(`#${kind}-people`);
  for (let index = 0; index < count; index++) {
    const person = document.createElement('span');
    person.style.setProperty('--person-index', index);
    person.innerHTML = '<svg viewBox="0 0 20 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="5" r="3"/><path d="M5 16v-3a5 5 0 0 1 10 0v3M7 14v11M13 14v11M7 19h6"/></svg>';
    container.append(person);
  }
}

// Keep both embedded apps mounted; the opening and closing map share one frame.
const embeddedSlides = new Map([
  [4, { section: $('#map-slide'), frame: $('#map-frame') }],
  [5, { section: $('#clusters-slide'), frame: $('#clusters-frame') }],
  [8, { section: $('#map-slide'), frame: $('#map-frame') }]
]);
const isEmbeddedSlide = index => embeddedSlides.has(index);
function pauseEmbeddedPlayback(index) {
  embeddedSlides.get(index)?.frame.contentDocument?.dispatchEvent(new Event('tt-decin:presentation-hidden'));
}
function prepareEmbedded(index) {
  const frame = embeddedSlides.get(index)?.frame;
  if (frame && !frame.hasAttribute('src')) frame.src = frame.dataset.src;
}
function showEmbedded(index) {
  prepareEmbedded(index);
  embeddedSlides.get(index)?.frame.contentWindow?.dispatchEvent(new Event('resize'));
}
for (const frame of new Set([...embeddedSlides.values()].map(slide => slide.frame))) {
  frame.addEventListener('load', () => {
    const frameDocument = frame.contentDocument;
    if (!frameDocument) return;
    // Capture keys before the embedded app handles its own year navigation.
    frameDocument.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', 'f', 'F'].includes(event.key)) return;
      handlePresentationKeydown(event);
      if (event.defaultPrevented) event.stopImmediatePropagation();
    }, true);
    if (currentView !== 'presentation' || embeddedSlides.get(currentSlide)?.frame !== frame) {
      frameDocument.dispatchEvent(new Event('tt-decin:presentation-hidden'));
    } else frame.contentWindow.dispatchEvent(new Event('resize'));
  });
}

// This is an expected trend, not a series of measured investment outcomes.
let hypothesisAnimationFrame = null;
function stopHypothesisAnimation() {
  if (hypothesisAnimationFrame !== null) cancelAnimationFrame(hypothesisAnimationFrame);
  hypothesisAnimationFrame = null;
}
function playHypothesisAnimation() {
  stopHypothesisAnimation();
  const slide = $('#hypothesis-slide');
  slide.classList.remove('is-playing');
  void slide.offsetWidth;
  slide.classList.add('is-playing');
  const before = $('#hypothesis-before-path');
  const after = $('#hypothesis-after-path');
  const traveler = $('#hypothesis-traveler');
  const place = (path, progress) => {
    const point = path.getPointAtLength(path.getTotalLength() * progress);
    traveler.setAttribute('cx', point.x);
    traveler.setAttribute('cy', point.y);
  };
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    place(after, 1);
    return;
  }
  const start = performance.now();
  function frame(now) {
    const elapsed = now - start;
    if (elapsed < 1100) place(before, Math.max(0, (elapsed - 200) / 900));
    else place(after, Math.max(0, Math.min(1, (elapsed - 1400) / 1700)));
    if (elapsed < 3100) hypothesisAnimationFrame = requestAnimationFrame(frame);
    else hypothesisAnimationFrame = null;
  }
  frame(start);
}

// Load the observed series once; preserve the shared unit selector between visits.
let realityController = null;
let realityLoading = null;
function prepareReality() {
  if (realityController) return Promise.resolve(realityController);
  if (!realityLoading) {
    const status = $('#reality-status');
    status.hidden = false;
    status.textContent = 'Načítám šest datových řad…';
    realityLoading = import('./reality-charts.mjs?v=reality-labels-16')
      .then(module => module.createRealityCharts($('#reality-slide')))
      .then(controller => { realityController = controller; return controller; })
      .catch(error => {
        console.error(error);
        realityLoading = null;
        status.textContent = 'Grafy se nepodařilo načíst. ';
        const retry = document.createElement('button');
        retry.textContent = 'Zkusit znovu';
        retry.addEventListener('click', showReality);
        status.append(retry);
        return null;
      });
  }
  return realityLoading;
}
function showReality() {
  prepareReality().then(controller => {
    if (controller && currentView === 'presentation' && currentSlide === REALITY_SLIDE) controller.show();
  });
}

// Snapshot only the outgoing slide into inert tiles. The persistent wordmark,
// timer and navigation stay mounted and usable throughout the transition.
let hypothesisBreakup = null;
function cancelHypothesisBreakup() {
  if (!hypothesisBreakup) return;
  const previous = hypothesisBreakup;
  hypothesisBreakup = null;
  previous.animations.forEach(animation => animation.cancel());
  previous.layer.remove();
  $('#reality-slide').classList.remove('reality-arriving');
}
function captureHypothesisBreakup() {
  const source = $('#hypothesis-slide');
  const rect = source.getBoundingClientRect();
  const layer = document.createElement('div');
  layer.className = 'hypothesis-breakup-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.inert = true;
  layer.style.bottom = `${Math.max(0, window.innerHeight - $('.presentation-footer').getBoundingClientRect().top)}px`;
  const pieces = [];
  const columns = 5, rows = 4;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const width = rect.width / columns, height = rect.height / rows;
      const tile = document.createElement('div');
      tile.className = 'hypothesis-fragment';
      Object.assign(tile.style, { left: `${rect.left + column * width}px`, top: `${rect.top + row * height}px`, width: `${width + .5}px`, height: `${height + .5}px` });
      const copy = source.cloneNode(true);
      copy.removeAttribute('id');
      copy.removeAttribute('aria-labelledby');
      copy.classList.remove('entering', 'changing');
      copy.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
      // Avoid duplicated SVG paint-server IDs in the transient snapshots.
      copy.querySelector('.hypothesis-area').setAttribute('fill', '#173DA512');
      copy.querySelector('defs').remove();
      Object.assign(copy.style, { position: 'absolute', left: `${-column * width}px`, top: `${-row * height}px`, width: `${rect.width}px`, height: `${rect.height}px`, flex: 'none', margin: '0' });
      tile.append(copy); layer.append(tile);
      pieces.push({ tile, row, column });
    }
  }
  $('#presentation').append(layer);
  return { layer, pieces, animations: [] };
}
function playHypothesisBreakup(transition) {
  hypothesisBreakup = transition;
  const incoming = $('#reality-slide');
  incoming.classList.remove('entering');
  incoming.classList.add('reality-arriving');
  transition.pieces.forEach(({ tile, row, column }) => {
    const drift = (column - 2) * 24 + (row % 2 ? 16 : -16);
    const rotation = (column % 2 ? 1 : -1) * (6 + row * 3);
    transition.animations.push(tile.animate([
      { transform: 'translate3d(0,0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate3d(${drift * .2}px,28px,0) rotate(${rotation * .2}deg)`, opacity: .95, offset: .25 },
      { transform: `translate3d(${drift}px,${Math.max(400, window.innerHeight * .75)}px,0) rotate(${rotation}deg)`, opacity: 0 }
    ], { duration: 760, delay: (3 - row) * 36 + column * 20, easing: 'cubic-bezier(.45,0,.8,.45)', fill: 'both' }));
  });
  transition.animations.push(incoming.animate([
    { opacity: 0, transform: 'translateY(36px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 650, delay: 380, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }));
  Promise.allSettled(transition.animations.map(animation => animation.finished)).then(() => {
    if (hypothesisBreakup === transition) cancelHypothesisBreakup();
  });
}
window.addEventListener('resize', cancelHypothesisBreakup);
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
  if (event.matches) cancelHypothesisBreakup();
});

// Animate the existing iframe in place: moving or cloning it would reload the
// embedded app and lose the selected municipality, year and camera position.
let mapTransition = null;
const mapNeighborSlides = { 3: '#terms-slide', 4: '#map-slide', 5: '#clusters-slide', 6: '#hypothesis-slide', 7: '#reality-slide', 8: '#map-slide' };
// Paint the same municipality outlines while their colors and camera interpolate.
// Only this temporary SVG is copied; both interactive iframes stay mounted.
function mapPaintSnapshot(index) {
  const frame = embeddedSlides.get(index)?.frame;
  const svg = frame?.contentDocument?.querySelector('#map');
  const shapes = svg?.querySelector('.municipality-shapes, .cluster-map-shapes');
  const paths = shapes && [...shapes.querySelectorAll('path[data-code]')];
  if (!paths?.length) return null;
  const bounds = shapes.getBBox();
  const matrix = shapes.getScreenCTM();
  const rect = svg.getBoundingClientRect();
  if (!matrix || !bounds.width || !bounds.height || !rect.width || !rect.height) return null;
  const frameRect = frame.getBoundingClientRect();
  const screen = new DOMMatrix([matrix.a, matrix.b, matrix.c, matrix.d, matrix.e + frameRect.left, matrix.f + frameRect.top]);
  const fills = new Map(paths.map(path => {
    const fill = frame.contentWindow.getComputedStyle(path).fill;
    return [path.dataset.code, fill.startsWith('url(') ? '#E3E7ED' : fill];
  }));
  return { svg, bounds, matrix: screen, paths, fills, rect: {
    top: rect.top + frameRect.top, left: rect.left + frameRect.left,
    right: rect.right + frameRect.left, bottom: rect.bottom + frameRect.top
  }};
}
function playMapRecolor(transition) {
  const { outgoing, incoming } = transition;
  incoming.classList.add('map-morph-waiting');
  // Allow the destination's ResizeObserver to fit its visible map first.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (mapTransition !== transition) return;
    const source = transition.mapPaint;
    const target = mapPaintSnapshot(transition.to);
    const duration = 1400;
    const ease = 'cubic-bezier(.22,1,.36,1)';
    if (source && target) {
      const ns = 'http://www.w3.org/2000/svg';
      const overlay = document.createElementNS(ns, 'svg');
      overlay.classList.add('map-recolor-overlay');
      overlay.setAttribute('viewBox', `0 0 ${innerWidth} ${innerHeight}`);
      overlay.setAttribute('aria-hidden', 'true');
      const group = document.createElementNS(ns, 'g');
      // Both maps project identical geographic boundaries with an affine scale.
      const a = source.bounds, b = target.bounds;
      const targetMatrix = target.matrix.translate(b.x, b.y)
        .scale(b.width / a.width, b.height / a.height).translate(-a.x, -a.y);
      for (const path of source.paths) {
        const shape = document.createElementNS(ns, 'path');
        shape.setAttribute('d', path.getAttribute('d'));
        shape.setAttribute('fill-rule', 'evenodd');
        shape.setAttribute('stroke', '#C5CFDA');
        shape.setAttribute('stroke-width', '.55');
        shape.setAttribute('vector-effect', 'non-scaling-stroke');
        const color = source.fills.get(path.dataset.code);
        shape.setAttribute('fill', color);
        group.append(shape);
        transition.animations.push(shape.animate([
          { fill: color }, { fill: target.fills.get(path.dataset.code) || color }
        ], { duration: 1100, delay: 100, easing: ease, fill: 'both' }));
      }
      overlay.append(group);
      document.body.append(overlay);
      transition.overlay = overlay;
      transition.mapVisibility = [source.svg, target.svg].map(svg => ({ svg, value: svg.style.visibility }));
      transition.mapVisibility.forEach(({ svg }) => { svg.style.visibility = 'hidden'; });
      const clip = rect => `inset(${rect.top}px ${innerWidth - rect.right}px ${innerHeight - rect.bottom}px ${rect.left}px)`;
      transition.animations.push(group.animate([
        { transform: source.matrix.toString() }, { transform: targetMatrix.toString() }
      ], { duration, easing: ease, fill: 'both' }));
      transition.animations.push(overlay.animate([
        { clipPath: clip(source.rect) }, { clipPath: clip(target.rect) }
      ], { duration, easing: ease, fill: 'both' }));
    }
    incoming.classList.remove('map-morph-waiting');
    // The surrounding interface dissolves without moving either page sideways.
    transition.animations.push(outgoing.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, easing: 'ease-out', fill: 'both' }));
    transition.animations.push(incoming.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 650, delay: 250, easing: ease, fill: 'both' }));
    Promise.allSettled(transition.animations.map(animation => animation.finished)).then(() => {
      if (mapTransition === transition) finishMapTransition(true);
    });
  }));
}
function finishMapTransition(startContent = false) {
  if (!mapTransition) return;
  const transition = mapTransition;
  mapTransition = null;
  transition.animations.forEach(animation => animation.cancel());
  transition.mapVisibility?.forEach(({ svg, value }) => { svg.style.visibility = value; });
  transition.overlay?.remove();
  const { outgoing, incoming } = transition;
  outgoing.classList.remove('map-transition-outgoing');
  outgoing.style.cssText = transition.outgoingStyle;
  outgoing.inert = transition.outgoingInert;
  if (transition.outgoingAria === null) outgoing.removeAttribute('aria-hidden');
  else outgoing.setAttribute('aria-hidden', transition.outgoingAria);
  outgoing.hidden = currentView !== 'presentation' || currentSlide !== transition.from;
  incoming.classList.remove('map-transition-incoming', 'map-transition-pending', 'map-morph-waiting');
  incoming.inert = transition.incomingInert;
  document.body.classList.remove('map-transition-running');
  $('#deck-brand').hidden = currentView === 'presentation' && isEmbeddedSlide(currentSlide);
  if (currentView === 'presentation' && currentSlide === transition.to) {
    if (isEmbeddedSlide(transition.to)) showEmbedded(transition.to);
    if (transition.to === HYPOTHESIS_SLIDE && startContent) playHypothesisAnimation();
  }
}
function captureMapTransition(from, to) {
  const outgoing = $(mapNeighborSlides[from]);
  const incoming = $(mapNeighborSlides[to]);
  const rect = outgoing.getBoundingClientRect();
  const computed = getComputedStyle(outgoing);
  const transition = {
    from, to, outgoing, incoming, animations: [],
    recolor: (from === 4 && to === 5) || (from === 5 && to === 4),
    mapPaint: ((from === 4 && to === 5) || (from === 5 && to === 4)) ? mapPaintSnapshot(from) : null,
    outgoingStyle: outgoing.style.cssText,
    outgoingInert: outgoing.inert,
    outgoingAria: outgoing.getAttribute('aria-hidden'),
    incomingInert: incoming.inert
  };
  // Freeze geometry before the map changes the presentation's outer gutters.
  Object.assign(outgoing.style, {
    left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`,
    padding: `${computed.paddingTop} ${computed.paddingRight} ${computed.paddingBottom} ${computed.paddingLeft}`
  });
  outgoing.classList.remove('entering');
  outgoing.classList.add('map-transition-outgoing');
  outgoing.inert = true;
  outgoing.setAttribute('aria-hidden', 'true');
  return transition;
}
function playMapTransition(transition) {
  mapTransition = transition;
  const { outgoing, incoming, from, to } = transition;
  const direction = to > from ? 1 : -1;
  const enteringMap = isEmbeddedSlide(to);
  const ease = 'cubic-bezier(.22,1,.36,1)';
  document.body.classList.add('map-transition-running');
  outgoing.hidden = false;
  incoming.classList.remove('entering');
  incoming.classList.add('map-transition-incoming');
  // Keep keyboard focus on the destination while pointer interactions wait.
  if (to === HYPOTHESIS_SLIDE) {
    // Start the hypothesis drawing after it is fully revealed, not behind the map.
    incoming.classList.remove('is-playing');
    incoming.classList.add('map-transition-pending');
  }
  const brand = $('#deck-brand');
  brand.hidden = isEmbeddedSlide(from) && isEmbeddedSlide(to);
  if (transition.recolor) {
    playMapRecolor(transition);
    return;
  }
  transition.animations.push(outgoing.animate(enteringMap ? [
    { opacity: 1, transform: 'translateX(0) scale(1)' },
    { opacity: 0, transform: `translateX(${-direction * 64}px) scale(.97)` }
  ] : [
    { opacity: 1, transform: 'translateX(0) scale(1)', clipPath: 'inset(0% 0% 0% 0% round 0px)' },
    { opacity: 0, transform: `translateX(${-direction * 90}px) scale(.95)`, clipPath: 'inset(5% 4% 5% 4% round 22px)' }
  ], { duration: enteringMap ? 560 : 720, easing: ease, fill: 'both' }));
  transition.animations.push(incoming.animate(enteringMap ? [
    { opacity: 0, transform: `translateX(${direction * 60}px) scale(.96)`, clipPath: 'inset(8% 6% 8% 6% round 24px)' },
    { opacity: 1, transform: 'translateX(0) scale(1)', clipPath: 'inset(0% 0% 0% 0% round 0px)' }
  ] : [
    { opacity: 0, transform: `translateX(${direction * 64}px)` },
    { opacity: 1, transform: 'translateX(0)' }
  ], { duration: enteringMap ? 900 : 760, delay: enteringMap ? 80 : 160, easing: ease, fill: 'both' }));
  transition.animations.push(brand.animate(enteringMap ? [
    { opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-8px)' }
  ] : [
    { opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }
  ], { duration: enteringMap ? 320 : 600, delay: enteringMap ? 0 : 250, easing: ease, fill: 'both' }));
  Promise.allSettled(transition.animations.map(animation => animation.finished)).then(() => {
    if (mapTransition === transition) finishMapTransition(true);
  });
}
window.addEventListener('resize', () => finishMapTransition(true));
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
  if (event.matches) finishMapTransition(true);
});

function renderRoute({ focus = false } = {}) {
  const hash = window.location.hash;
  const presentationMatch = /^#prezentace\/(\d+)$/.exec(hash);
  const validPresentation = presentationMatch && Number(presentationMatch[1]) >= 1 && Number(presentationMatch[1]) <= slideCount;
  const previousView = currentView;
  const previousSlide = currentSlide;
  cancelHypothesisBreakup();
  finishMapTransition();
  const destination = validPresentation ? Number(presentationMatch[1]) - 1 : null;
  const mapScene = previousView === 'presentation' && destination !== null && Math.abs(destination - previousSlide) === 1 && (isEmbeddedSlide(previousSlide) || isEmbeddedSlide(destination)) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? captureMapTransition(previousSlide, destination) : null;
  const breakup = previousView === 'presentation' && previousSlide === HYPOTHESIS_SLIDE && validPresentation && destination === REALITY_SLIDE && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? captureHypothesisBreakup() : null;
  currentView = validPresentation ? 'presentation' : hash === '#prohlidka' ? 'guide' : 'home';
  currentSlide = validPresentation ? Number(presentationMatch[1]) - 1 : 0;
  Object.entries(views).forEach(([key, element]) => { element.hidden = key !== currentView; });
  document.body.dataset.view = currentView;
  const mapActive = currentView === 'presentation' && isEmbeddedSlide(currentSlide);
  document.body.classList.toggle('map-slide-active', mapActive);
  $('#deck-brand').hidden = mapActive;
  $('#map-slide').hidden = !mapActive || currentSlide === 5;
  $('#clusters-slide').hidden = !mapActive || currentSlide !== 5;
  $('#hypothesis-slide').hidden = currentView !== 'presentation' || currentSlide !== HYPOTHESIS_SLIDE;
  const realityActive = currentView === 'presentation' && currentSlide === REALITY_SLIDE;
  $('#reality-slide').hidden = !realityActive;
  if (realityActive) showReality();
  else realityController?.hide();
  if (currentView === 'presentation' && currentSlide === HYPOTHESIS_SLIDE) prepareReality();
  if (currentView !== 'presentation' || currentSlide !== HYPOTHESIS_SLIDE) stopHypothesisAnimation();
  if (currentView === 'presentation') {
    if (currentSlide === 3 || currentSlide === REALITY_SLIDE) prepareEmbedded(4);
    if (currentSlide === 4) prepareEmbedded(5);
  }
  if (mapActive) showEmbedded(currentSlide);
  if (previousView === 'presentation' && isEmbeddedSlide(previousSlide) && (currentView !== 'presentation' || embeddedSlides.get(previousSlide)?.frame !== embeddedSlides.get(currentSlide)?.frame)) pauseEmbeddedPlayback(previousSlide);

  if (currentView === 'presentation') {
    $('#slide-one').hidden = currentSlide !== 0;
    $('#timeline-slide').hidden = currentSlide !== 1 && currentSlide !== 2;
    $('#terms-slide').hidden = currentSlide !== 3;
    if (currentSlide !== 3) stopMigrationExample();
    const event = currentSlide === 2;
    $('#timeline-title').innerHTML = event ? '<em>Krize na Ukrajině.</em>' : 'Málo dat. <em>Krátký průnik.</em>';
    $('#timeline-description').innerHTML = event ? 'Příchod lidí z Ukrajiny<br>mění kontext posledních tří let.' : 'Každá datová sada sahá jinam.<br>Všechny se potkají jen tady.';
    $('#year-count').textContent = event ? '4' : '7';
    $('#year-label').innerHTML = event ? 'roky před zlomem<span>2018–2021</span>' : 'společných let<span>2018–2024</span>';
    $('#context-period').textContent = event ? '2022–2024 · 3 ze 7 let' : '1 hodnota ročně';
    $('#context-description').textContent = event ? 'Zásadní migrační vlna uvnitř už tak krátkého průniku.' : 'Pro společnou analýzu máme jen sedm časových bodů.';
    $('#previous').disabled = currentSlide === 0;
    $('#next').disabled = currentSlide === slideCount - 1;
    $('#slide-counter').innerHTML = `${String(currentSlide + 1).padStart(2, '0')} <span>/ ${String(slideCount).padStart(2, '0')}</span>`;
    document.querySelectorAll('[data-slide]').forEach((button, i) => {
      if (i === currentSlide) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    // Keep the shared graph mounted between slides 2 and 3.
    if (previousView !== currentView || currentSlide === 0 || previousSlide === 0 || currentSlide >= 3 || previousSlide >= 3) {
      animate(currentSlide === 0 ? $('#slide-one') : currentSlide === 3 ? $('#terms-slide') : isEmbeddedSlide(currentSlide) ? embeddedSlides.get(currentSlide).section : currentSlide === HYPOTHESIS_SLIDE ? $('#hypothesis-slide') : currentSlide === REALITY_SLIDE ? $('#reality-slide') : $('#timeline-slide'), 'entering');
      if (currentSlide === 0) {
        document.querySelectorAll('.unit-row').forEach(item => animate(item, 'unit-enter'));
      }
    } else if (previousSlide !== currentSlide) {
      animate($('.timeline-copy'));
    }
    if (currentSlide === 3 && (previousView !== 'presentation' || previousSlide !== 3)) playMigrationExample();
    if (currentSlide === HYPOTHESIS_SLIDE && !mapScene && (previousView !== 'presentation' || previousSlide !== HYPOTHESIS_SLIDE)) playHypothesisAnimation();
    // Commit initial geometry before revealing the event strip on direct entry.
    void $('#timeline-slide').offsetWidth;
    document.body.dataset.step = String(currentSlide);
    positionDeckBrand(previousView === 'presentation' && (previousSlide === 0) !== (currentSlide === 0));
    document.title = `${currentSlide + 1} / ${slideCount} · ${slideTitles[currentSlide]} · ${presentationTitle}`;
    $('#slide-announcement').textContent = `Snímek ${currentSlide + 1} ze ${slideCount}. ${slideTitles[currentSlide]}`;
    if (breakup) playHypothesisBreakup(breakup);
    if (mapScene) playMapTransition(mapScene);
  } else {
    stopMigrationExample();
    document.body.dataset.step = '0';
    document.title = currentView === 'guide' ? `Vedená prohlídka · ${presentationTitle}` : presentationTitle;
    $('#slide-announcement').textContent = '';
    if (previousView !== currentView) animate(views[currentView], 'entering');
  }
  if (focus) {
    const heading = currentView === 'home' ? $('#home-title') : currentView === 'guide' ? $('#guide-title') : currentSlide === 0 ? $('#deck-brand') : currentSlide === 3 ? $('#terms-title') : isEmbeddedSlide(currentSlide) ? embeddedSlides.get(currentSlide).section : currentSlide === HYPOTHESIS_SLIDE ? $('#hypothesis-title') : currentSlide === REALITY_SLIDE ? $('#reality-title') : $('#timeline-title');
    heading.focus({ preventScroll: true });
    if (previousView !== currentView || window.innerWidth <= 600) window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function goToSlide(index) {
  if (index >= 0 && index < slideCount) window.location.hash = `prezentace/${index + 1}`;
}
$('#previous').addEventListener('click', () => goToSlide(currentSlide - 1));
$('#next').addEventListener('click', () => goToSlide(currentSlide + 1));
document.querySelectorAll('[data-slide]').forEach(button => button.addEventListener('click', () => goToSlide(Number(button.dataset.slide))));

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  } catch { $('#slide-announcement').textContent = 'Režim celé obrazovky není v tomto okně dostupný. Prezentace zůstává roztažená přes celé okno.'; }
}
$('#fullscreen').addEventListener('click', toggleFullscreen);
if (!document.documentElement.requestFullscreen) $('#fullscreen').hidden = true;
document.addEventListener('fullscreenchange', () => { const active = Boolean(document.fullscreenElement); $('#fullscreen').setAttribute('aria-label', active ? 'Opustit celou obrazovku' : 'Celá obrazovka'); });
function handlePresentationKeydown(event) {
  const eventDocument = event.target.ownerDocument || document;
  if (event.defaultPrevented || eventDocument.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (currentView === 'presentation') {
    if (['ArrowRight', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.target.closest('button, a'))) { event.preventDefault(); goToSlide(currentSlide + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); goToSlide(currentSlide - 1); }
    else if (event.key === 'Home') { event.preventDefault(); goToSlide(0); }
    else if (event.key === 'End') { event.preventDefault(); goToSlide(slideCount - 1); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
    else if (event.key === 'Escape' && !document.fullscreenElement) window.location.hash = '';
  } else if (currentView === 'guide' && event.key === 'Escape') window.location.hash = '';
}
document.addEventListener('keydown', handlePresentationKeydown);
let touchStart = null;
$('#presentation').addEventListener('touchstart', event => { const touch = event.changedTouches[0]; touchStart = { x: touch.clientX, y: touch.clientY }; }, { passive: true });
$('#presentation').addEventListener('touchend', event => {
  if (!touchStart || event.target.closest('button, a')) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) goToSlide(currentSlide + (dx < 0 ? 1 : -1));
  touchStart = null;
}, { passive: true });
window.addEventListener('hashchange', () => renderRoute({ focus: true }));
renderRoute();

// Persist accumulated time and the current running segment across slide changes/reloads.
const timerStorageKey = 'tt-decin-presentation-timer-v2';
const timerButton = $('#presentation-timer');
let timerState = { elapsedMs: 0, runningSince: null, started: false };
try {
  const saved = JSON.parse(localStorage.getItem(timerStorageKey));
  if (saved && Number.isFinite(saved.elapsedMs) && saved.elapsedMs >= 0 &&
      (saved.runningSince === null || (Number.isFinite(saved.runningSince) && saved.runningSince > 0)) &&
      typeof saved.started === 'boolean') {
    timerState = saved;
  } else {
    // Keep the elapsed time of the previous click-to-start timer when upgrading.
    const previousStart = Number(localStorage.getItem('tt-decin-presentation-started-at'));
    if (Number.isFinite(previousStart) && previousStart > 0) {
      timerState = { elapsedMs: 0, runningSince: previousStart, started: true };
      localStorage.setItem(timerStorageKey, JSON.stringify(timerState));
    }
  }
} catch { /* The controls also work in memory if browser storage is unavailable. */ }

function getPresentationElapsedMs() {
  return timerState.elapsedMs + (timerState.runningSince === null ? 0 : Math.max(0, Date.now() - timerState.runningSince));
}

function updatePresentationTimer() {
  const seconds = Math.floor(getPresentationElapsedMs() / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const pad = value => String(value).padStart(2, '0');
  $('#timer-value').textContent = (hours ? `${pad(hours)}:` : '') + `${pad(minutes)}:${pad(seconds % 60)}`;
  const running = timerState.runningSince !== null;
  const action = running ? 'Pozastavit časovač' : timerState.started ? 'Pokračovat v měření času' : 'Spustit časovač';
  timerButton.dataset.state = running ? 'running' : timerState.started ? 'paused' : 'idle';
  timerButton.setAttribute('aria-label', action);
  timerButton.setAttribute('aria-pressed', String(running));
  timerButton.title = action;
  $('.timer-indicator').textContent = running ? 'Ⅱ' : '▶';
  $('#timer-label').textContent = running ? 'Běží' : timerState.started ? 'Pozastaveno' : 'Připraveno';
}

timerButton.addEventListener('click', () => {
  if (timerState.runningSince !== null) {
    timerState.elapsedMs = getPresentationElapsedMs();
    timerState.runningSince = null;
  } else {
    timerState.runningSince = Date.now();
    timerState.started = true;
  }
  try { localStorage.setItem(timerStorageKey, JSON.stringify(timerState)); } catch { /* Keep working in memory. */ }
  updatePresentationTimer();
});
setInterval(updatePresentationTimer, 250);
document.addEventListener('visibilitychange', updatePresentationTimer);
updatePresentationTimer();
