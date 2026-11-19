/**
 * Schedule-style timeline of today's workloads.
 * Block height = duration. Right side: cache-hit progress ring, or a
 * RATE-LIMITED badge.
 */
import { h, s } from "../utils/dom.js";
import { int, pct } from "../utils/format.js";

const HOUR_PX = 56;

function ring(value, i = 0) {
  const r = 17;
  const c = 2 * Math.PI * r;
  return s(
    "svg",
    { class: "ring", viewBox: "0 0 42 42", role: "img", "aria-label": `${pct(value, 0)} cache hit` },
    s("circle", { cx: 21, cy: 21, r, fill: "none", stroke: "var(--track-strong)", "stroke-width": 3 }),
    s("circle", { cx: 21, cy: 21, r, fill: "none", stroke: "var(--mint-500)", "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": c, "stroke-dashoffset": c * (1 - value), transform: "rotate(-90 21 21)", class: "ring-arc", style: `--c:${c};--i:${i}` }),
    s("text", { x: 21, y: 21, "text-anchor": "middle", "dominant-baseline": "central" }, Math.round(value * 100) + "%")
  );
}

export function timeline(workloads) {
  const hours = (iso) => { const d = new Date(iso); return d.getHours() + d.getMinutes() / 60; };
  const first = Math.floor(Math.min(...workloads.map((w) => hours(w.start)), 8));
  const last = Math.ceil(Math.max(...workloads.map((w) => hours(w.end)), first + 8));
  const wrap = h("div", { class: "timeline", tabindex: 0, "aria-label": "Today's workloads" });
  const inner = h("div", { style: { position: "relative" } });
  for (let hr = first; hr <= last; hr++) inner.append(h("div", { class: "tl-hour" }, h("span", { class: "mono-label" }, `${hr}:00`)));

  const fmt = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  workloads.forEach((w, i) => {
    const top = (hours(w.start) - first) * HOUR_PX + 14;
    const height = Math.max(46, (hours(w.end) - hours(w.start)) * HOUR_PX - 8);
    const limited = w.status === "rate_limited";
    inner.append(
      h(
        "article",
        { class: "tl-block slide-in", style: { top: top + "px", height: height + "px", "--i": i }, "aria-label": `${w.name}, ${fmt(w.start)} to ${fmt(w.end)}, ${w.model}, ${int(w.requests)} requests` },
        h("div", { style: { minWidth: 0 } }, h("div", { class: "t" }, w.name), h("div", { class: "m" }, `${fmt(w.start)}–${fmt(w.end)} · ${w.model}`), height > 70 ? h("div", { class: "m" }, `${int(w.requests)} req`) : null),
        limited ? h("span", { class: "badge-round", role: "img", "aria-label": "Rate limited" }, "Rate", h("br"), "limited") : w.cacheHitRate != null ? ring(w.cacheHitRate, i) : null
      )
    );
  });
  wrap.append(inner);
  return wrap;
}
