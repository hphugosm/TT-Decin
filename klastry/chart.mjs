const NS = 'http://www.w3.org/2000/svg';
const numberFormat = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });

function node(tag, attributes = {}, text) {
  const element = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}

function tickStep(span) {
  const raw = span / 5;
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  return (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * power;
}

/** Render a categorical, unconnected time-series dot chart. Values align with years. */
export function renderClusterChart(svg, { years = [], year, series = [], unit = '', selectedCode = null, onYear } = {}) {
  const active = svg.ownerDocument.activeElement;
  const focusedYear = active && svg.contains(active) && active.parentElement?.getAttribute('data-layer') === 'year-targets'
    ? active.dataset.year : null;
  svg.replaceChildren();
  const width = Math.max(240, svg.clientWidth || 900);
  const height = Math.max(120, svg.clientHeight || 360);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'group');
  svg.setAttribute('aria-label', `Vývoj hodnot v čase${unit ? ` (${unit})` : ''}`);
  svg.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  svg.style.overflow = 'visible';

  const validYears = years.map(Number);
  const values = series.flatMap(item => item.values || []).filter(value => typeof value === 'number' && Number.isFinite(value));
  if (!validYears.length || !values.length || validYears.some(value => !Number.isFinite(value))) {
    svg.append(node('text', { x: width / 2, y: height / 2, 'text-anchor': 'middle', fill: '#65738A', 'font-size': 14, 'data-empty': 'true' }, 'Pro tento výběr nejsou dostupná data.'));
    return;
  }

  let low = Math.min(0, ...values);
  let high = Math.max(0, ...values);
  if (low === high) high = low + 1;
  const step = tickStep(high - low);
  low = Math.floor(low / step) * step;
  high = Math.ceil(high / step) * step;
  const ticks = [];
  for (let value = low; value <= high + step * 0.01; value += step) ticks.push(Math.abs(value) < step * 1e-8 ? 0 : value);
  const labelWidth = Math.max(...ticks.map(value => numberFormat.format(value).length)) * 7;
  const margin = { top: 20, right: 16, bottom: 34, left: Math.min(width * 0.35, Math.max(48, labelWidth + 14)) };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const minYear = Math.min(...validYears);
  const maxYear = Math.max(...validYears);
  const x = value => margin.left + (maxYear === minYear ? plotWidth / 2 : (value - minYear) / (maxYear - minYear) * plotWidth);
  const y = value => margin.top + (high - value) / (high - low) * plotHeight;

  const grid = node('g', { 'data-layer': 'grid' });
  for (const value of ticks) {
    grid.append(node('line', { x1: margin.left, x2: width - margin.right, y1: y(value), y2: y(value), stroke: '#DCE2ED', 'stroke-width': 1 }));
    grid.append(node('text', { x: margin.left - 10, y: y(value), dy: '0.35em', 'text-anchor': 'end', fill: '#65738A', 'font-size': 11 }, numberFormat.format(value)));
  }
  const labelEvery = plotWidth < 380 ? 10 : 5;
  for (const value of validYears) {
    if (value % labelEvery !== 0 && value !== minYear && value !== maxYear) continue;
    grid.append(node('text', { x: x(value), y: height - 11, 'text-anchor': 'middle', fill: '#65738A', 'font-size': 11 }, String(value)));
  }
  svg.append(grid);

  const activateYear = value => { if (typeof onYear === 'function') onYear(value); };
  const targets = node('g', { 'data-layer': 'year-targets' });
  const sorted = [...new Set(validYears)].sort((a, b) => a - b);
  sorted.forEach((value, index) => {
    const left = index ? (x(sorted[index - 1]) + x(value)) / 2 : margin.left;
    const right = index < sorted.length - 1 ? (x(value) + x(sorted[index + 1])) / 2 : width - margin.right;
    const target = node('rect', { x: left, y: margin.top, width: Math.max(1, right - left), height: plotHeight, fill: 'transparent', stroke: 'none', tabindex: 0, role: 'button', 'aria-label': `Vybrat rok ${value}`, 'aria-pressed': String(value === Number(year)), 'data-year': value, style: 'outline:none;cursor:pointer' });
    target.addEventListener('click', () => activateYear(value));
    target.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activateYear(value); }
    });
    target.addEventListener('focus', () => { target.setAttribute('fill', '#65738A'); target.setAttribute('fill-opacity', '0.08'); });
    target.addEventListener('blur', () => { target.setAttribute('fill', 'transparent'); target.removeAttribute('fill-opacity'); });
    targets.append(target);
  });
  svg.append(targets);

  if (validYears.includes(Number(year))) {
    svg.append(node('line', { x1: x(Number(year)), x2: x(Number(year)), y1: margin.top, y2: margin.top + plotHeight, stroke: '#65738A', 'stroke-width': 1.3, 'stroke-dasharray': '4 5', 'pointer-events': 'none', 'data-layer': 'year-cursor', 'data-year': year }));
  }
  const dots = node('g', { 'data-layer': 'points' });
  // Draw the selected municipality last so its dots remain visible in overlaps.
  const ordered = [...series].sort((a, b) => Number(String(a.id) === String(selectedCode)) - Number(String(b.id) === String(selectedCode)));
  for (const item of ordered) {
    validYears.forEach((value, index) => {
      const measurement = item.values?.[index];
      if (typeof measurement !== 'number' || !Number.isFinite(measurement)) return;
      const current = value === Number(year);
      const selected = selectedCode !== null && String(item.id) === String(selectedCode);
      const point = node('circle', { cx: x(value), cy: y(measurement), r: selected ? (current ? 6 : 4.5) : (current ? 4.5 : 3), fill: item.color || '#65738A', stroke: current ? '#FFFFFF' : 'none', 'stroke-width': current ? 1.5 : 0, 'data-series': item.id, 'data-year': value, 'data-value': measurement, 'data-selected': selected, style: 'cursor:pointer' });
      point.append(node('title', {}, `${item.name}: ${value} — ${numberFormat.format(measurement)}${unit ? ` ${unit}` : ''}`));
      point.addEventListener('click', () => activateYear(value));
      dots.append(point);
    });
  }
  svg.append(dots);
  if (focusedYear !== null) {
    const target = [...targets.children].find(element => element.dataset.year === focusedYear);
    target?.focus({ preventScroll: true });
  }
}
