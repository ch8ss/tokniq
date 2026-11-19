/**
 * Shared UI state: just the selected date range for now.
 * The range is kept in the URL (?range=7d or ?from=YYYY-MM-DD&to=YYYY-MM-DD)
 * so it survives reloads, can be shared as a link, and carries across pages.
 */
const listeners = new Set();
const PRESETS = ["24h", "7d", "30d"];

export const RANGE_LABELS = { "24h": "Last 24 hours", "7d": "Last 7 days", "30d": "Last 30 days" };

export function getRange() {
  const p = new URLSearchParams(window.location.search);
  const from = p.get("from");
  const to = p.get("to");
  if (from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to) && from <= to) {
    return { from, to };
  }
  const r = p.get("range");
  return PRESETS.includes(r) ? r : "30d";
}

export function setRange(range) {
  const url = new URL(window.location.href);
  url.searchParams.delete("range");
  url.searchParams.delete("from");
  url.searchParams.delete("to");
  if (typeof range === "string") url.searchParams.set("range", range);
  else { url.searchParams.set("from", range.from); url.searchParams.set("to", range.to); }
  history.replaceState(null, "", url);
  listeners.forEach((fn) => fn(range));
}

export function onRangeChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function rangeLabel(range) {
  if (typeof range === "string") return RANGE_LABELS[range];
  const f = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${f(range.from)} – ${f(range.to)}`;
}

/** Previous-period wording for metric deltas. */
export function comparisonLabel(range) {
  if (range === "24h") return "vs prior 24h";
  if (range === "7d") return "vs prior 7d";
  if (range === "30d") return "vs prior 30d";
  return "vs prior period";
}

/** Append the current range to an internal link so it carries across pages. */
export function withRange(href) {
  const p = new URLSearchParams(window.location.search);
  const keep = new URLSearchParams();
  for (const k of ["range", "from", "to"]) if (p.get(k)) keep.set(k, p.get(k));
  const qs = keep.toString();
  return qs ? `${href}?${qs}` : href;
}
