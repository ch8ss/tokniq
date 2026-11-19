/**
 * Reusable UI building blocks. Each returns a DOM node.
 */
import { h } from "../utils/dom.js";
import { icon } from "./icons.js";
import { reveal, whenVisible } from "./motion.js";

/**
 * Bento card: eyebrow + title on the left, circular buttons on the right.
 * @param {{eyebrow?: string, title?: string, actions?: Node[], body: any, hero?: boolean, area?: string, i?: number, label?: string}} o
 */
export function card({ eyebrow, title, actions = [], body, hero = false, area = "", i = 0, label }) {
  const bodyEl = h("div", { style: { display: "contents" } }, body);
  const el = h(
    "section",
    { class: `card rise ${hero ? "card-hero" : ""} ${area}`, style: { "--i": i }, "aria-label": label ?? title ?? eyebrow },
    eyebrow || title || actions.length
      ? h(
          "div",
          { class: "card-head" },
          h("div", { class: "titles" }, eyebrow ? h("span", { class: "eyebrow" }, eyebrow) : null, title ? h("h2", {}, title) : null),
          actions.filter(Boolean).length ? h("div", { class: "card-actions" }, actions.filter(Boolean)) : null
        )
      : null,
    bodyEl
  );
  return reveal(el);
}

export function circleBtn({ iconName, label, href, onClick, filled = false, pressed }) {
  const attrs = { class: `circle-btn ${filled ? "filled" : ""}`, "aria-label": label, title: label };
  if (pressed !== undefined) attrs["aria-pressed"] = String(pressed);
  if (href) return h("a", { ...attrs, href }, icon(iconName));
  return h("button", { ...attrs, type: "button", onclick: onClick }, icon(iconName));
}

/** Muted outline chip shown only when the data came from the mock layer. */
export function sourceChip(meta) {
  if (meta?.source !== "mock") return null;
  return h("span", { class: "chip", title: "Sample data for development. Not real platform results." }, icon("flask"), "Demo");
}

const STATUS = {
  optimized: { cls: "badge-good", icon: "circleCheck", label: "Optimized" },
  cached: { cls: "badge-info", icon: "refresh", label: "Cache hit" },
  skipped: { cls: "badge-neutral", icon: "circleMinus", label: "Not optimized" },
  failed: { cls: "badge-critical", icon: "circleX", label: "Failed" },
};

/** Optimization status badge: always icon + label, never colour alone. */
export function statusBadge(status) {
  const s = STATUS[status] ?? STATUS.skipped;
  return h("span", { class: `badge ${s.cls}` }, icon(s.icon), s.label);
}

/** 2-column mono spec grid. items: [{label, value, extra?: Node}] */
export function specGrid(items) {
  return h(
    "div",
    { class: "spec" },
    items.map((it) =>
      h("div", {}, h("span", { class: "mono-label" }, it.label), h("div", { class: "row" }, h("span", { class: "mono-value" }, it.value), it.extra ?? null))
    )
  );
}

/** Signed % change, coloured by whether the direction is good. */
export function delta(value, previous, goodDirection = "neutral") {
  if (value == null || !previous) return null;
  const change = (value - previous) / previous;
  const dir = Math.abs(change) < 0.005 ? "flat" : change > 0 ? "up" : "down";
  const tone = dir === "flat" || goodDirection === "neutral" ? "flat" : dir === goodDirection ? "good" : "bad";
  const arrow = dir === "up" ? "↑" : dir === "down" ? "↓" : "→";
  return h("span", { class: `delta ${tone}`, title: "vs previous period" }, `${arrow} ${Math.abs(change * 100).toFixed(1)}%`);
}

export function skeleton(cls) {
  return h("div", { class: `skeleton ${cls}`, "aria-hidden": "true" });
}

export function emptyState({ title = "No data yet", message, iconName = "inbox", action }) {
  return h("div", { class: "state" }, h("div", { class: "state-icon" }, icon(iconName)), h("strong", {}, title), message && h("p", {}, message), action);
}

export function errorState({ title = "Couldn't load this", error, onRetry }) {
  return h(
    "div",
    { class: "state is-error", role: "alert" },
    h("div", { class: "state-icon" }, icon("alert")),
    h("strong", {}, title),
    h("p", {}, error?.message ?? "Something went wrong."),
    onRetry && h("button", { class: "pill-btn sm", type: "button", onclick: onRetry }, icon("refresh"), "Try again")
  );
}

/** Legend. kind: "line" for lines, "swatch" for bars and areas. */
export function legend(items, kind = "line") {
  return h("div", { class: "legend" }, items.map((it) => h("span", {}, h("i", { class: kind === "swatch" ? "sw" : "", style: { background: it.color } }), it.label)));
}

/**
 * Animate a number from 0 to its value once the element is on screen.
 * format(n) renders the text.
 */
export function countUp(el, value, format, duration = 900) {
  if (value == null || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = format(value);
    return;
  }
  el.textContent = format(0);
  whenVisible(el, () => {
    let start = null;
    function frame(now) {
      start ??= now;
      const p = Math.min(1, (now - start) / duration);
      el.textContent = format(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = format(value);
    }
    requestAnimationFrame(frame);
  });
}
