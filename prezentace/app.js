/* Presentation skeleton. Content and graph slots are intentionally kept editable. */
const $ = (selector) => document.querySelector(selector);
const views = { home: $('#home'), presentation: $('#presentation'), guide: $('#guide') };
const presentationTitle = 'Stěhování obcí Ústeckého kraje';
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

function renderRoute({ focus = false } = {}) {
  const hash = window.location.hash;
  const presentationMatch = /^#prezentace\/([1-3])$/.exec(hash);
  const previousView = currentView;
  const previousSlide = currentSlide;
  currentView = presentationMatch ? 'presentation' : hash === '#prohlidka' ? 'guide' : 'home';
  currentSlide = presentationMatch ? Number(presentationMatch[1]) - 1 : 0;
  Object.entries(views).forEach(([key, element]) => { element.hidden = key !== currentView; });
  document.body.dataset.view = currentView;

  if (currentView === 'presentation') {
    $('#slide-one').hidden = currentSlide !== 0;
    $('#timeline-slide').hidden = currentSlide === 0;
    const event = currentSlide === 2;
    $('#timeline-title').innerHTML = event ? '<em>Krize na Ukrajině.</em>' : 'Málo dat. <em>Krátký průnik.</em>';
    $('#timeline-description').innerHTML = event ? 'Příchod lidí z Ukrajiny<br>mění kontext posledních tří let.' : 'Každá datová sada sahá jinam.<br>Všechny se potkají jen tady.';
    $('#year-count').textContent = event ? '4' : '7';
    $('#year-label').innerHTML = event ? 'roky před zlomem<span>2018–2021</span>' : 'společných let<span>2018–2024</span>';
    $('#context-period').textContent = event ? '2022–2024 · 3 ze 7 let' : '1 hodnota ročně';
    $('#context-description').textContent = event ? 'Zásadní migrační vlna uvnitř už tak krátkého průniku.' : 'Pro společnou analýzu máme jen sedm časových bodů.';
    $('#previous').disabled = currentSlide === 0;
    $('#next').disabled = currentSlide === 2;
    $('#slide-counter').innerHTML = `0${currentSlide + 1} <span>/ 03</span>`;
    document.querySelectorAll('[data-slide]').forEach((button, i) => {
      if (i === currentSlide) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    // Keep the shared graph mounted between slides 2 and 3.
    if (previousView !== currentView || currentSlide === 0 || previousSlide === 0) {
      animate(currentSlide === 0 ? $('#slide-one') : $('#timeline-slide'), 'entering');
      if (currentSlide === 0) {
        document.querySelectorAll('.unit-row').forEach(item => animate(item, 'unit-enter'));
      }
    } else if (previousSlide !== currentSlide) {
      animate($('.timeline-copy'));
    }
    // Commit initial geometry before revealing the event strip on direct entry.
    void $('#timeline-slide').offsetWidth;
    document.body.dataset.step = String(currentSlide);
    positionDeckBrand(previousView === 'presentation' && (previousSlide === 0) !== (currentSlide === 0));
    const titles = ['354 obcí: jedna hodnota jednoho ukazatele pro jednu obec za jeden rok', 'Společný průnik 2018–2024: sedm let.', 'Krize na Ukrajině.'];
    document.title = `${currentSlide + 1} / 3 · ${titles[currentSlide]} · ${presentationTitle}`;
    $('#slide-announcement').textContent = `Snímek ${currentSlide + 1} ze 3. ${titles[currentSlide]}`;
  } else {
    document.body.dataset.step = '0';
    document.title = currentView === 'guide' ? `Vedená prohlídka · ${presentationTitle}` : presentationTitle;
    $('#slide-announcement').textContent = '';
    if (previousView !== currentView) animate(views[currentView], 'entering');
  }
  if (focus) {
    const heading = currentView === 'home' ? $('#home-title') : currentView === 'guide' ? $('#guide-title') : currentSlide === 0 ? $('#deck-brand') : $('#timeline-title');
    heading.focus({ preventScroll: true });
    if (previousView !== currentView || window.innerWidth <= 600) window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function goToSlide(index) {
  if (index >= 0 && index < 3) window.location.hash = `prezentace/${index + 1}`;
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
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (currentView === 'presentation') {
    if (['ArrowRight', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.target.closest('button, a'))) { event.preventDefault(); goToSlide(currentSlide + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); goToSlide(currentSlide - 1); }
    else if (event.key === 'Home') { event.preventDefault(); goToSlide(0); }
    else if (event.key === 'End') { event.preventDefault(); goToSlide(2); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
    else if (event.key === 'Escape' && !document.fullscreenElement) window.location.hash = '';
  } else if (currentView === 'guide' && event.key === 'Escape') window.location.hash = '';
});
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
