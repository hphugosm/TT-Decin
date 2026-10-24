/* Presentation skeleton. Content and graph slots are intentionally kept editable. */
const $ = (selector) => document.querySelector(selector);
const views = { home: $('#home'), presentation: $('#presentation'), guide: $('#guide') };
const presentationTitle = 'Stěhování obcí Ústeckého kraje';
const notes = [
  'Sedm témat může jemně naběhnout po řádcích. Věkové ukazatele a věková struktura jsou sloučené do tématu Věk obyvatel. Jedna hodnota za rok je záměrně uvedena jen jednou.',
  'Nejprve se objeví délky jednotlivých řad. Potom se přes všechny řádky zvýrazní červený průnik 2018–2024. Sedm políček pod grafem překládá průnik na sedm ročních pozorování.',
  'Graf, jeho měřítko i červený průnik zůstávají na místě. Přes roky 2022–2024 přibude vínově šrafovaný pás. Poslední tři políčka změní barvu, sedmička se změní na čtyřku. Zůstávají roky 2018–2021 před tímto zlomem.'
];
let currentView = 'home';
let currentSlide = 0;
// Pokrytí přepsané z dodaného grafu. Jde o dostupnost, nikoli hodnoty ukazatelů.
// Oba původní věkové řádky mají stejný rozsah a jsou sloučeny do jednoho tématu.
const coverage = [
  { label: 'Sociální situace', original: 'Sociální vyloučení', start: 2016, end: 2024 },
  { label: 'Stěhování lidí', original: 'Migrace podle věku', start: 2000, end: 2025, migration: true },
  { label: 'Firmy a podnikatelé', original: 'Ekonomické subjekty', start: 2013, end: 2025 },
  { label: 'Území a rozvoj', original: 'REGUAP', start: 2018, end: 2025 },
  { label: 'Lidé bez práce', original: 'Nezaměstnanost', start: 2015, end: 2024 },
  { label: 'Věk obyvatel', original: 'Věkové ukazatele + věková struktura', start: 2000, end: 2025 },
  { label: 'Obyvatelstvo', original: 'Základní demografie', start: 2000, end: 2025 }
];
for (const [i, row] of coverage.entries()) {
  const element = document.createElement('div');
  element.className = 'coverage-row' + (row.migration ? ' migration-row' : '');
  element.setAttribute('role', 'listitem');
  element.setAttribute('aria-label', `${row.label}: ${row.start} až ${row.end}`);
  element.title = `${row.original} · ${row.start}–${row.end}`;
  element.innerHTML = `<span class="coverage-name">${row.label}</span><div class="coverage-track"><span class="coverage-bar" style="--start:${(row.start - 2000) / 26 * 100}%;--width:${(row.end - row.start + 1) / 26 * 100}%;--i:${i}"></span></div>`;
  $('#coverage-rows').append(element);
}
for (let year = 2018; year <= 2024; year++) {
  const element = document.createElement('span');
  element.className = 'year-chip' + (year >= 2022 ? ' affected' : '');
  element.textContent = String(year);
  $('#overlap-years').append(element);
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
    $('#timeline-eyebrow').textContent = event ? '03 / Zlom v datech' : '02 / Společné období';
    $('#timeline-title').innerHTML = event ? 'Pak přišel <em>rok 2022.</em>' : 'Hodně dat. <em>Krátký průnik.</em>';
    $('#timeline-description').innerHTML = event ? 'Příchod lidí z Ukrajiny<br>mění kontext posledních tří let.' : 'Každá datová sada sahá jinam.<br>Všechny se potkají jen tady.';
    $('#year-count').textContent = event ? '4' : '7';
    $('#year-label').innerHTML = event ? 'roky před zlomem<span>2018–2021</span>' : 'společných let<span>2018–2024</span>';
    $('#context-period').textContent = event ? '2022–2024 · 3 ze 7 let' : '1 hodnota ročně';
    $('#context-description').textContent = event ? 'Zásadní migrační vlna uvnitř už tak krátkého průniku.' : 'Pro společnou analýzu máme jen sedm časových bodů.';
    $('#timeline-takeaway').textContent = event ? 'Ze sedmi společných let zůstávají čtyři před zlomem.' : 'Dlouhé řady jednotlivě. Jen sedm let dohromady.';
    $('#previous').disabled = currentSlide === 0;
    $('#next').disabled = currentSlide === 2;
    $('#slide-counter').innerHTML = `0${currentSlide + 1} <span>/ 03</span>`;
    document.querySelectorAll('[data-slide]').forEach((button, i) => {
      if (i === currentSlide) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    $('#animation-note').textContent = notes[currentSlide];
    // Keep the shared graph mounted between slides 2 and 3.
    if (previousView !== currentView || currentSlide === 0 || previousSlide === 0) {
      animate(currentSlide === 0 ? $('#slide-one') : $('#timeline-slide'), 'entering');
    } else if (previousSlide !== currentSlide) {
      animate($('.timeline-copy'));
      animate($('#timeline-takeaway'));
    }
    // Commit initial geometry before revealing the event strip on direct entry.
    void $('#timeline-slide').offsetWidth;
    document.body.dataset.step = String(currentSlide);
    const titles = ['Data o obcích Ústeckého kraje', 'Společný průnik 2018–2024: sedm let.', 'Roky 2022–2024 mění kontext. Před zlomem zbývají čtyři roky.'];
    document.title = `${currentSlide + 1} / 3 · ${titles[currentSlide]} · ${presentationTitle}`;
    $('#slide-announcement').textContent = `Snímek ${currentSlide + 1} ze 3. ${titles[currentSlide]}`;
  } else {
    document.body.dataset.step = '0';
    document.title = currentView === 'guide' ? `Vedená prohlídka · ${presentationTitle}` : presentationTitle;
    $('#slide-announcement').textContent = '';
    if (previousView !== currentView) animate(views[currentView], 'entering');
  }
  if (focus) {
    const heading = currentView === 'home' ? $('#home-title') : currentView === 'guide' ? $('#guide-title') : currentSlide === 0 ? $('#intro-title') : $('#timeline-title');
    heading.focus({ preventScroll: true });
    if (previousView !== currentView || window.innerWidth <= 600) window.scrollTo({ top: 0, behavior: 'instant' });
  }
}

function goToSlide(index) {
  if (index >= 0 && index < 3) window.location.hash = `prezentace/${index + 1}`;
}
$('#previous').addEventListener('click', () => goToSlide(currentSlide - 1));
$('#next').addEventListener('click', () => goToSlide(currentSlide + 1));
$('#home-button').addEventListener('click', () => { window.location.hash = ''; });
document.querySelectorAll('[data-slide]').forEach(button => button.addEventListener('click', () => goToSlide(Number(button.dataset.slide))));
$('#notes-button').addEventListener('click', () => $('#notes-dialog').showModal());
$('#close-notes').addEventListener('click', () => $('#notes-dialog').close());
$('#notes-dialog').addEventListener('click', event => { if (event.target === $('#notes-dialog')) { const bounds = event.target.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.target.close(); } });

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
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat || $('#notes-dialog').open || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (currentView === 'presentation') {
    if (['ArrowRight', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.target.closest('button, a'))) { event.preventDefault(); goToSlide(currentSlide + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); goToSlide(currentSlide - 1); }
    else if (event.key === 'Home') { event.preventDefault(); goToSlide(0); }
    else if (event.key === 'End') { event.preventDefault(); goToSlide(2); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
    else if (event.key.toLowerCase() === 'n') { event.preventDefault(); $('#notes-dialog').showModal(); }
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

// Store the start instant, so slide changes, inactive tabs and reloads never pause it.
const timerStorageKey = 'tt-decin-presentation-started-at';
const timerButton = $('#presentation-timer');
let timerStartedAt = null;
try {
  const savedStart = Number(localStorage.getItem(timerStorageKey));
  if (Number.isFinite(savedStart) && savedStart > 0) timerStartedAt = savedStart;
} catch { /* The timer also works in memory when browser storage is unavailable. */ }

function updatePresentationTimer() {
  if (timerStartedAt === null) return;
  const seconds = Math.max(0, Math.floor((Date.now() - timerStartedAt) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const pad = value => String(value).padStart(2, '0');
  $('#timer-value').textContent = (hours ? `${pad(hours)}:` : '') + `${pad(minutes)}:${pad(seconds % 60)}`;
  timerButton.disabled = true;
  timerButton.dataset.running = 'true';
  timerButton.setAttribute('aria-label', 'Časovač prezentace běží');
  timerButton.title = 'Čas od spuštění prezentace';
  $('.timer-indicator').textContent = '●';
  $('#timer-label').hidden = true;
}

timerButton.addEventListener('click', () => {
  if (timerStartedAt !== null) return;
  timerStartedAt = Date.now();
  try { localStorage.setItem(timerStorageKey, String(timerStartedAt)); } catch { /* Keep running. */ }
  updatePresentationTimer();
});
setInterval(updatePresentationTimer, 250);
document.addEventListener('visibilitychange', updatePresentationTimer);
updatePresentationTimer();
