/** Scale + tick helpers shared by the SVG charts. */

/** Round a max value up to a clean axis maximum and return evenly spaced ticks. */
export function niceTicks(max, count = 4) {
  if (!max || max <= 0) return { max: 1, ticks: [0, 1] };
  const rough = max / count;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const niceMax = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= niceMax + step / 2; v += step) ticks.push(v);
  return { max: niceMax, ticks };
}

export function linear(domainMax, rangeStart, rangeEnd) {
  return (v) => rangeStart + (v / domainMax) * (rangeEnd - rangeStart);
}

/** Pick ~n evenly spaced indices, always including first and last. */
export function sampleIndices(length, n) {
  if (length <= n) return [...Array(length).keys()];
  const out = new Set([0, length - 1]);
  const step = (length - 1) / (n - 1);
  for (let i = 1; i < n - 1; i++) out.add(Math.round(i * step));
  return [...out].sort((a, b) => a - b);
}

/** Re-render on container resize (debounced to animation frames). */
export function observeWidth(el, render) {
  let last = 0;
  let raf = 0;
  const ro = new ResizeObserver((entries) => {
    const w = Math.floor(entries[0].contentRect.width);
    if (w === last || w === 0) return;
    last = w;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => render(w));
  });
  ro.observe(el);
  return () => ro.disconnect();
}
