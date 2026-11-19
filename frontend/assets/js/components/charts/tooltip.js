/** One shared tooltip element for every chart. Content is built with textContent only. */
import { h, clear } from "../../utils/dom.js";

let el;
function get() {
  if (!el) {
    el = h("div", { class: "tooltip", role: "presentation", "aria-hidden": "true" });
    document.body.append(el);
  }
  return el;
}

/**
 * @param {{title?: string, rows: {label: string, value: string, color?: string, kind?: "line"|"swatch"}[]}} content
 * @param {{x: number, y: number}} at viewport coordinates to anchor near
 */
export function showTooltip({ title, rows }, at) {
  const tip = get();
  clear(tip);
  if (title) tip.append(h("div", { class: "tooltip-title" }, title));
  for (const r of rows) {
    tip.append(
      h(
        "div",
        { class: "tooltip-row" },
        r.color ? h("i", { class: r.kind === "swatch" ? "sw" : "", style: { background: r.color } }) : null,
        h("strong", {}, r.value),
        h("span", {}, r.label)
      )
    );
  }
  tip.classList.add("is-visible");

  const pad = 14;
  const { width, height } = tip.getBoundingClientRect();
  let left = at.x + pad;
  let top = at.y - height - pad;
  if (left + width > window.innerWidth - 8) left = at.x - width - pad;
  if (top < 8) top = at.y + pad;
  tip.style.left = Math.max(8, left) + "px";
  tip.style.top = top + "px";
}

export function hideTooltip() {
  get().classList.remove("is-visible");
}
