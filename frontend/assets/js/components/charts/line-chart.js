/**
 * Flow profile: smooth area chart (SVG).
 *
 * flowChart({
 *   data, xLabel: (d, full?) => string,
 *   primary:   { key, label },          // mint line + mint→transparent fill
 *   secondary: { key, label } | null,   // ink line at reduced opacity
 *   format, axisFormat, height, ariaLabel,
 * })
 *
 * Hover/keyboard: a position dot + dotted guide follow the nearest x, and a
 * glass card shows every series' value. Arrow keys / Home / End move it.
 */
import { h, s, clear } from "../../utils/dom.js";
import { niceTicks, linear, observeWidth } from "./scale.js";

const MINT = "#65E6C0";
const INK = "#C9C2E6";

/** Monotone cubic path (no overshoot between points). */
function smoothPath(pts) {
  const n = pts.length;
  if (n < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : "";
  const dx = [], m = [], t = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = 0; t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], q = a * a + b * b;
    if (q > 9) { const k = 3 / Math.sqrt(q); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h3 = dx[i] / 3;
    d += `C${(pts[i][0] + h3).toFixed(1)},${(pts[i][1] + t[i] * h3).toFixed(1)} ${(pts[i + 1][0] - h3).toFixed(1)},${(pts[i + 1][1] - t[i + 1] * h3).toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`;
  }
  return d;
}

let gradId = 0;

export function flowChart({ data, xLabel, primary, secondary = null, format, axisFormat = format, height = 220, ariaLabel }) {
  const root = h("div", { class: "chart" });
  const m = { top: 14, right: 8, bottom: 28, left: 46 };
  const id = `flow-grad-${++gradId}`;

  function render(width) {
    clear(root);
    const iw = Math.max(10, width - m.left - m.right);
    const ih = height - m.top - m.bottom;
    const keys = [primary.key, secondary?.key].filter(Boolean);
    const { max, ticks } = niceTicks(Math.max(...data.flatMap((d) => keys.map((k) => d[k])), 0), 3);
    const y = linear(max, ih, 0);
    const x = (i) => (data.length === 1 ? iw / 2 : (i / (data.length - 1)) * iw);

    const svg = s("svg", { viewBox: `0 0 ${width} ${height}`, height, role: "img", "aria-label": ariaLabel });
    svg.append(
      s("defs", {}, s("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, s("stop", { offset: "0%", "stop-color": MINT, "stop-opacity": 0.28 }), s("stop", { offset: "100%", "stop-color": MINT, "stop-opacity": 0 })))
    );
    const g = s("g", { transform: `translate(${m.left},${m.top})` });
    svg.append(g);

    for (const t of ticks) {
      const yy = Math.round(y(t)) + 0.5;
      g.append(s("line", { class: "grid-line", x1: 0, x2: iw, y1: yy, y2: yy }));
      g.append(s("text", { class: "tick", x: -12, y: yy, "text-anchor": "end", "dominant-baseline": "middle" }, axisFormat(t)));
    }
    // three x labels only: start, middle, end
    const mid = Math.floor((data.length - 1) / 2);
    [[0, "start"], [mid, "middle"], [data.length - 1, "end"]].forEach(([i, anchor]) => {
      if (data.length < 3 && i === mid) return;
      g.append(s("text", { class: "tick", x: x(i), y: ih + 20, "text-anchor": anchor }, xLabel(data[i])));
    });

    const pPts = data.map((d, i) => [x(i), y(d[primary.key])]);
    const pPath = smoothPath(pPts);
    g.append(s("path", { d: `${pPath}L${x(data.length - 1)},${ih}L0,${ih}Z`, fill: `url(#${id})` }));
    if (secondary) {
      g.append(s("path", { d: smoothPath(data.map((d, i) => [x(i), y(d[secondary.key])])), fill: "none", stroke: INK, "stroke-opacity": 0.55, "stroke-width": 2, "stroke-linecap": "round" }));
    }
    g.append(s("path", { d: pPath, fill: "none", stroke: MINT, "stroke-width": 2, "stroke-linecap": "round" }));

    // hover layer
    const guide = s("line", { class: "guide", y1: 0, y2: ih, visibility: "hidden" });
    const dotP = s("circle", { class: "pos-dot", r: 5, fill: MINT, visibility: "hidden" });
    const dotS = secondary ? s("circle", { class: "pos-dot", r: 4, fill: INK, visibility: "hidden" }) : null;
    g.append(guide, dotS, dotP);
    const hit = s("rect", { class: "hit", x: 0, y: 0, width: iw, height: ih, tabindex: 0, "aria-label": `${ariaLabel}. Use left and right arrow keys to read values.` });
    g.append(hit);

    const card = h("div", { class: "flow-card", hidden: true, "aria-live": "polite" });
    root.append(svg, card);

    let idx = -1;
    function show(i) {
      idx = Math.max(0, Math.min(data.length - 1, i));
      const d = data[idx];
      const xx = x(idx);
      guide.setAttribute("x1", xx);
      guide.setAttribute("x2", xx);
      guide.setAttribute("visibility", "visible");
      dotP.setAttribute("cx", xx);
      dotP.setAttribute("cy", y(d[primary.key]));
      dotP.setAttribute("visibility", "visible");
      if (dotS) { dotS.setAttribute("cx", xx); dotS.setAttribute("cy", y(d[secondary.key])); dotS.setAttribute("visibility", "visible"); }

      card.replaceChildren(
        h("span", { class: "mono-label" }, xLabel(d, true)),
        row(primary.label, format(d[primary.key]), MINT),
        secondary ? row(secondary.label, format(d[secondary.key]), INK) : null
      );
      card.hidden = false;
      const scale = root.clientWidth / width;
      const px = (m.left + xx) * scale;
      const cw = card.offsetWidth;
      card.style.left = (px + 16 + cw < root.clientWidth ? px + 16 : px - 16 - cw) + "px";
    }
    function hide() {
      guide.setAttribute("visibility", "hidden");
      dotP.setAttribute("visibility", "hidden");
      dotS?.setAttribute("visibility", "hidden");
      card.hidden = true;
    }
    hit.addEventListener("pointermove", (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * width - m.left;
      show(Math.round((px / iw) * (data.length - 1)));
    });
    hit.addEventListener("pointerleave", hide);
    hit.addEventListener("blur", hide);
    hit.addEventListener("focus", () => show(idx < 0 ? data.length - 1 : idx));
    hit.addEventListener("keydown", (e) => {
      const map = { ArrowLeft: idx - 1, ArrowRight: idx + 1, Home: 0, End: data.length - 1 };
      if (e.key in map) { e.preventDefault(); show(map[e.key]); }
    });
  }

  function row(label, value, color) {
    return h("div", { class: "row" }, h("span", { class: "muted", style: { fontSize: "12px" } }, h("i", { style: { background: color } }), label), h("span", { class: "mono-value", style: { fontSize: "13px" } }, value));
  }

  observeWidth(root, render);
  return root;
}
