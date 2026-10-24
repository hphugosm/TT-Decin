import { migrationSeries, sharedScale } from './reality-engine.mjs';

const ns = 'http://www.w3.org/2000/svg';
const number = (value, digits = 0, signed = false) => new Intl.NumberFormat('cs-CZ', {
  maximumFractionDigits: digits, minimumFractionDigits: digits, signDisplay: signed ? 'exceptZero' : 'auto'
}).format(value);
const svgNode = (tag, attributes, text) => {
  const node = document.createElementNS(ns, tag);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  if (text !== undefined) node.textContent = text;
  return node;
};

export async function createRealityCharts(section) {
  const response = await fetch(new URL('./data/company-migration.json', import.meta.url));
  if (!response.ok) throw new Error('Data grafů se nepodařilo načíst.');
  const series = migrationSeries(await response.json());
  const grid = section.querySelector('#reality-grid');
  const tooltip = section.querySelector('#reality-tooltip');
  const units = section.querySelector('#reality-units');
  let metric = 'pp', pinned = null;
  const cards = [];

  function dismiss() {
    pinned = null;
    tooltip.hidden = true;
    section.querySelectorAll('.reality-point.is-selected').forEach(node => node.classList.remove('is-selected'));
  }

  function showPoint(company, point, target, pin = false) {
    if (pinned && !pin) return;
    dismiss();
    target.classList.add('is-selected');
    if (pin) pinned = target;
    tooltip.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = `${company.obec} a okolí · ${point.year}${point.event ? ' · rok záměru' : ''}`;
    const list = document.createElement('dl');
    const rows = [
      ['Obyvatelé k 31. 12.', number(point.population)],
      ['Původní migrační saldo', `${number(point.balance, 0, true)} osob`],
      ['Míra migrace v okruhu', `${number(point.rate, 3, true)} %`],
      ['Míra migrace v kraji', `${number(point.regionRate, 3, true)} %`],
      ['Odchylka od kraje', `${number(point.pp, 3, true)} p. b.`],
      ['Odchylka v osobách', `${number(point.persons, 1, true)} osob`]
    ];
    rows.forEach(([label, value]) => {
      const term = document.createElement('dt'), description = document.createElement('dd');
      term.textContent = label; description.textContent = value;
      list.append(term, description);
    });
    const hint = document.createElement('span');
    hint.className = 'reality-tooltip-hint';
    hint.textContent = pin ? 'Detail připnutý · klikněte mimo bod nebo stiskněte Esc' : 'Kliknutím připnete detail · Esc jej zavře';
    tooltip.append(title, list, hint);
    tooltip.hidden = false;
    const rect = target.getBoundingClientRect();
    const box = tooltip.getBoundingClientRect();
    const left = Math.max(10, Math.min(window.innerWidth - box.width - 10, rect.left - box.width / 2));
    const preferredTop = rect.top - box.height - 14;
    const top = preferredTop >= 10 ? preferredTop : Math.min(window.innerHeight - box.height - 10, rect.bottom + 14);
    tooltip.style.left = `${left}px`; tooltip.style.top = `${Math.max(10, top)}px`;
  }

  function draw(card, scale) {
    const { company, plot } = card;
    const width = plot.clientWidth, height = plot.clientHeight;
    if (width < 1 || height < 1) return;
    const margin = { left: metric === 'pp' ? 43 : 53, right: 14, top: 12, bottom: 24 };
    const x = year => margin.left + (year - 2000) / 25 * (width - margin.left - margin.right);
    const y = value => margin.top + (scale.max - value) / (scale.max - scale.min) * (height - margin.top - margin.bottom);
    const svg = svgNode('svg', { viewBox: `0 0 ${width} ${height}`, role: 'group', 'aria-label': `${company.firma}: migrace 2000 až 2025, ${metric === 'pp' ? 'odchylka v procentních bodech' : 'odchylka v osobách'}` });
    const axes = svgNode('g', { 'aria-hidden': 'true', class: 'reality-axes' });
    scale.ticks.forEach(value => {
      axes.append(svgNode('line', { x1: x(2000), x2: x(2025), y1: y(value), y2: y(value), class: value === 0 ? 'reality-zero' : 'reality-gridline' }));
      axes.append(svgNode('text', { x: margin.left - 9, y: y(value) + 3.5, 'text-anchor': 'end' }, number(value, metric === 'pp' ? 1 : 0, true)));
    });
    [2000, 2005, 2010, 2015, 2020, 2025].forEach(year => {
      axes.append(svgNode('text', { x: x(year), y: height - 5, 'text-anchor': 'middle' }, year));
    });
    svg.append(axes);
    // The event year is rendered once, as the larger red point at its actual value.
    const ordered = [...company.points.filter(point => !point.event), ...company.points.filter(point => point.event)];
    ordered.forEach(point => {
      const group = svgNode('g', { class: `reality-point${point.event ? ' is-event' : ''}`, role: 'button', tabindex: point.event ? '0' : '-1', 'aria-label': `${point.year}${point.event ? ', záměr' : ''}: ${number(point[metric], metric === 'pp' ? 3 : 1, true)} ${metric === 'pp' ? 'procentního bodu' : 'osob'}, zobrazit detail`, 'aria-describedby': 'reality-tooltip', 'data-year': point.year });
      group.append(svgNode('circle', { cx: x(point.year), cy: y(point[metric]), r: 9, fill: 'transparent', class: 'reality-hit' }));
      group.append(svgNode('circle', { cx: x(point.year), cy: y(point[metric]), r: point.event ? 5.8 : 3.3, class: 'reality-dot' }));
      group.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') showPoint(company, point, group); });
      group.addEventListener('pointerleave', () => { if (!pinned && document.activeElement !== group) dismiss(); });
      group.addEventListener('focus', () => showPoint(company, point, group));
      group.addEventListener('blur', () => { if (!pinned) dismiss(); });
      group.addEventListener('click', () => pinned === group ? dismiss() : showPoint(company, point, group, true));
      group.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); event.stopPropagation();
          pinned === group ? dismiss() : showPoint(company, point, group, true);
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          // Up/down explore years; left/right always navigate the presentation.
          event.preventDefault(); event.stopPropagation();
          const nextYear = Math.max(2000, Math.min(2025, point.year + (event.key === 'ArrowUp' ? 1 : -1)));
          dismiss();
          svg.querySelectorAll('.reality-point').forEach(node => node.setAttribute('tabindex', '-1'));
          const next = svg.querySelector(`[data-year="${nextYear}"]`);
          next.setAttribute('tabindex', '0'); next.focus({ preventScroll: true });
        }
      });
      svg.append(group);
    });
    const event = company.points.find(point => point.event);
    const pointY = y(event[metric]);
    svg.append(svgNode('text', { x: x(event.year) + 10, y: pointY < 30 ? pointY + 20 : pointY - 12, class: 'reality-event-label', 'aria-hidden': 'true' }, `Záměr ${event.year}`));
    plot.replaceChildren(svg);
  }

  function redraw() {
    dismiss();
    const scale = sharedScale(series, metric);
    units.textContent = metric === 'pp' ? 'Odchylka od kraje · procentní body' : 'Odchylka od kraje · osoby';
    cards.forEach(card => draw(card, scale));
  }

  grid.replaceChildren();
  series.forEach((company, index) => {
    const card = document.createElement('figure');
    card.className = 'reality-chart';
    card.style.setProperty('--chart-index', index);
    const caption = document.createElement('figcaption');
    const heading = document.createElement('h2');
    heading.textContent = company.firma;
    const jobs = document.createElement('span');
    jobs.className = 'reality-jobs';
    jobs.textContent = `Plán ${company.plan_je_maximum ? 'až ' : ''}${number(company.plan_mist)} míst`;
    const meta = document.createElement('p');
    meta.textContent = `${company.obec} · ${company.pocet_obci} obcí do 50 km`;
    caption.append(heading, jobs, meta);
    const plot = document.createElement('div');
    plot.className = 'reality-plot';
    card.append(caption, plot); grid.append(card);
    cards.push({ company, plot });
  });
  section.querySelectorAll('[data-reality-metric]').forEach(button => button.addEventListener('click', () => {
    metric = button.dataset.realityMetric;
    section.querySelectorAll('[data-reality-metric]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    redraw();
  }));
  const observer = new ResizeObserver(() => { if (!section.hidden) redraw(); });
  cards.forEach(card => observer.observe(card.plot));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !tooltip.hidden) {
      event.preventDefault(); event.stopImmediatePropagation(); dismiss();
    }
  }, true);
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('.reality-point, #reality-tooltip')) dismiss();
  });
  window.addEventListener('scroll', dismiss, true);
  const method = section.querySelector('#reality-method');
  section.querySelector('#reality-method-open').addEventListener('click', () => method.showModal());
  method.querySelector('button').addEventListener('click', () => method.close());
  section.querySelector('#reality-status').hidden = true;
  section.querySelectorAll('[data-reality-metric]').forEach(button => { button.disabled = false; });
  return {
    show() {
      redraw();
      grid.classList.remove('is-revealing');
      void grid.offsetWidth;
      grid.classList.add('is-revealing');
    },
    hide() { dismiss(); method.close(); grid.classList.remove('is-revealing'); }
  };
}
