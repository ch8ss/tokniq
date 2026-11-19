/**
 * Bento chart set: rounded spend bars, sparkbars, heatmap, segmented gauge.
 * HTML/SVG, no dependencies. Every mark has a hover/focus tooltip, and the
 * values are also available through the card's "view as table" toggle.
 */
import { h, s } from "../../utils/dom.js";
import { niceTicks, sampleIndices } from "./scale.js";
import { showTooltip, hideTooltip } from "./tooltip.js";

function attachTip(el, content) {
  const at = (e) => (e ? { x: e.clientX, y: e.clientY } : (() => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top }; })());
  el.addEventListener("pointermove", (e) => showTooltip(content(), at(e)));
  el.addEventListener("pointerleave", hideTooltip);
  el.addEventListener("focus", () => showTooltip(content(), at()));
  el.addEventListener("blur", hideTooltip);
}

/**
 * Rounded bars: a track pill (total) with a filled part inside it.
 * @param {{points: any[], xLabel: (p:any, full?:boolean)=>string, total: (p:any)=>number, part: (p:any)=>number,
 *          partLabel: string, restLabel: string, format: (n:number)=>string, axisFormat: (n:number)=>string}} o
 */
export function spendBars({ points, xLabel, total, part, partLabel, restLabel, format, axisFormat }) {
  const { max, ticks } = niceTicks(Math.max(...points.map(total), 0), 2);
  const n = points.length;
  const gap = n > 20 ? 4 : 8;
  const radius = n > 20 ? 6 : 10;

  const plot = h(
    "div",
    { class: "bars-plot", role: "list", "aria-label": `Daily ${partLabel} and ${restLabel} spend`, style: { "--bar-gap": gap + "px", "--bar-r": radius + "px" } },
    h("div", { class: "gridlines", "aria-hidden": "true" }, ticks.map(() => h("span"))),
    points.map((p, i) => {
      const t = total(p);
      const a = part(p);
      const col = h(
        "div",
        { class: "bar-col", role: "listitem", tabindex: 0, "aria-label": `${xLabel(p, true)}: ${format(t)} total, ${partLabel} ${format(a)}` },
        h(
          "div",
          { class: "bar-track grow", style: { height: `${(t / max) * 100}%`, "--i": i } },
          h("div", { class: "bar-fill", style: { height: `${t ? (a / t) * 100 : 0}%` } })
        )
      );
      attachTip(col, () => ({
        title: xLabel(p, true),
        rows: [
          { label: "total", value: format(t) },
          { label: partLabel, value: format(a), color: "var(--mint-500)", kind: "swatch" },
          { label: restLabel, value: format(t - a), color: "var(--track-strong)", kind: "swatch" },
        ],
      }));
      return col;
    })
  );

  const shown = new Set(sampleIndices(n, n > 14 ? 5 : n));
  const x = h(
    "div",
    { class: "bars-x", "aria-hidden": "true", style: { gap: gap + "px" } },
    points.map((p, i) => h("span", { style: { flex: "1 1 0", textAlign: "center", whiteSpace: "nowrap", overflow: "visible" } }, shown.has(i) ? xLabel(p) : ""))
  );
  const y = h("div", { class: "bars-y", "aria-hidden": "true" }, [...ticks].reverse().map((t) => h("span", {}, axisFormat(t))));
  return h("div", { class: "bars" }, plot, y, x);
}

/** Pill sparkbars; the last bar (now) is the one accent. */
export function sparkbars(values, { label = "", format = String, titles = [] } = {}) {
  const max = Math.max(...values, 1);
  return h(
    "div",
    { class: "sparkbars", role: "img", "aria-label": label },
    values.map((v, i) => {
      const bar = h("span", { class: `grow ${i === values.length - 1 ? "is-now" : ""}`, style: { height: `${Math.max(8, (v / max) * 100)}%`, "--i": i } });
      attachTip(bar, () => ({ title: titles[i] ?? "", rows: [{ label, value: format(v) }] }));
      return bar;
    })
  );
}

const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const RAMP = ["var(--ramp-1)", "var(--ramp-2)", "var(--ramp-3)", "var(--ramp-4)", "var(--ramp-5)"];

/**
 * Weekday × time-block heatmap, quantised into 5 mint steps.
 * @param {{cells: {dow:number,start:number,requests:number}[], blocks: number[], format: (n:number)=>string}} o
 */
export function heatmap({ cells, blocks, format }) {
  const max = Math.max(...cells.map((c) => c.requests), 1);
  const { max: niceMax } = niceTicks(max, 5);
  const step = niceMax / 5;
  const bucket = (v) => Math.min(4, Math.floor(v / step));

  const legendEl = h(
    "div",
    { class: "heat-legend", "aria-hidden": "true" },
    RAMP.map((c, i) => h("span", {}, h("i", { style: { background: c } }), i === 0 ? `<${format(step)}` : `${format(step * i)}+`)).reverse()
  );

  const grid = h("div", { class: "heat-grid", role: "grid", "aria-label": "Requests by weekday and time of day" });
  blocks.forEach((start, bi) => {
    grid.append(h("span", { class: "lbl", "aria-hidden": "true" }, String(start).padStart(2, "0")));
    for (let d = 0; d < 7; d++) {
      const c = cells.find((x) => x.dow === d && x.start === start);
      const v = c?.requests ?? 0;
      const label = `${DOW[d]} ${String(start).padStart(2, "0")}:00–${String(start + 4).padStart(2, "0")}:00`;
      const cell = h("span", { class: "heat-cell wave", role: "gridcell", tabindex: 0, style: { background: RAMP[bucket(v)], "--i": (d + bi) * 2 }, "aria-label": `${label}: ${format(v)} requests` });
      attachTip(cell, () => ({ title: label, rows: [{ label: "requests", value: format(v), color: RAMP[bucket(v)], kind: "swatch" }] }));
      grid.append(cell);
    }
  });
  grid.append(h("span"), ...DOW.map((d) => h("span", { class: "lbl xl", "aria-hidden": "true" }, d)));
  return h("div", { class: "heat" }, legendEl, grid);
}

/**
 * 270° segmented gauge made of capsule segments.
 * @param {{value: number, segments?: number, center: Node, label: string}} o value in 0..1
 */
export function segmentedGauge({ value, segments = 24, center, label }) {
  const size = 220;
  const c = size / 2;
  const r = 84;
  const sweep = 270;
  const startAngle = 135; // degrees, 0 = 3 o'clock, clockwise
  const filled = Math.round(Math.max(0, Math.min(1, value)) * segments);
  const svg = s("svg", { viewBox: `0 0 ${size} ${size}`, role: "img", "aria-label": label });
  for (let i = 0; i < segments; i++) {
    const a = startAngle + (i * sweep) / (segments - 1);
    const rad = (a * Math.PI) / 180;
    const x = c + r * Math.cos(rad);
    const y = c + r * Math.sin(rad);
    svg.append(
      s("rect", {
        class: i < filled ? "seg seg-on" : "seg",
        x: x - 5,
        y: y - 15,
        width: 10,
        height: 30,
        rx: 5,
        fill: i < filled ? "var(--mint-500)" : "var(--track-strong)",
        transform: `rotate(${a + 90} ${x} ${y})`,
        style: `--i:${i}`,
      })
    );
  }
  return h("div", { class: "gauge" }, svg, h("div", { class: "gauge-center" }, center));
}
