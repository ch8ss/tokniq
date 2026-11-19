/**
 * Motion layer. Everything here is decoration on top of working content and
 * switches off under `prefers-reduced-motion`.
 *
 * - reveal():        cards and their charts animate when scrolled into view
 * - kinetic():       big wide display words that slide with scroll
 * - scrubber():      right-edge chapter ticks that track scroll position
 * - scrollWords():   statement words light up as it scrolls through view
 * - hoverPreview():  glass card that follows the cursor's Y over list rows
 * - letters():       wordmark letters rise in one by one
 */
import { h } from "../utils/dom.js";

export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Scroll reveal ---------- */
let io;
const onReveal = new WeakMap();

function getObserver() {
  if (io) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        onReveal.get(e.target)?.forEach((fn) => fn());
        onReveal.delete(e.target);
        io.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
  );
  return io;
}

/**
 * Mark an element to animate when it enters the viewport.
 * Optional callback runs at that moment (used for count-ups).
 */
export function reveal(el, fn) {
  if (reducedMotion() || !("IntersectionObserver" in window)) {
    el.classList.add("is-in");
    fn?.();
    return el;
  }
  if (fn) onReveal.set(el, [...(onReveal.get(el) ?? []), fn]);
  el.setAttribute("data-reveal", "");
  getObserver().observe(el);
  return el;
}

/** Run fn when el is first visible. */
export function whenVisible(el, fn) {
  if (reducedMotion() || !("IntersectionObserver" in window)) return fn();
  const obs = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      obs.disconnect();
      fn();
    }
  });
  // element may not be in the DOM yet
  requestAnimationFrame(() => obs.observe(el));
}

/* ---------- Scroll progress helper ---------- */
const scrollers = new Set();
let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    scrollers.forEach((fn) => fn());
  });
}
function onScrollFrame(fn) {
  if (!scrollers.size) {
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
  }
  scrollers.add(fn);
  fn();
}
/** 0 when el's top hits the viewport bottom, 1 when its bottom leaves the top. */
function progress(el) {
  const r = el.getBoundingClientRect();
  const total = innerHeight + r.height;
  return Math.max(0, Math.min(1, (innerHeight - r.top) / total));
}

/* ---------- Kinetic display type ---------- */
export function kinetic(rows) {
  const lines = rows.map((r, i) =>
    h(
      "div",
      { class: `kinetic-line ${i % 2 ? "rev" : ""}` },
      // repeat so the line is always wider than the screen
      Array.from({ length: 4 }, () => r.words.map((w) => h("span", { class: `kw ${w.accent ? "accent" : ""} ${w.outline ? "outline" : ""}` }, w.text)))
    )
  );
  const el = h("section", { class: "kinetic", "aria-hidden": "true" }, lines);
  if (!reducedMotion()) {
    onScrollFrame(() => {
      const p = progress(el);
      lines.forEach((line, i) => {
        const dir = i % 2 ? 1 : -1;
        line.style.transform = `translate3d(${dir * (p * 38 - (dir > 0 ? 38 : 0))}%, 0, 0)`;
      });
    });
  }
  return el;
}

/* ---------- Chapter scrubber ---------- */
export function scrubber(sections, onChange) {
  const items = sections.map((s, i) => {
    const btn = h(
      "button",
      { type: "button", class: "scrub-item", "aria-label": `Jump to ${s.label}` },
      h("span", { class: "scrub-idx" }, String(i + 1).padStart(2, "0")),
      h("span", { class: "scrub-label" }, s.label),
      h("span", { class: "scrub-tick" })
    );
    btn.addEventListener("click", () => s.el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" }));
    return btn;
  });
  const fill = h("span", { class: "scrub-fill" });
  const el = h("nav", { class: "scrubber", "aria-label": "Page sections" }, h("span", { class: "scrub-rail" }, fill), items);

  let active = -1;
  onScrollFrame(() => {
    const mid = innerHeight * 0.35;
    let idx = 0;
    sections.forEach((s, i) => { if (s.el.getBoundingClientRect().top < mid) idx = i; });
    const max = document.documentElement.scrollHeight - innerHeight;
    fill.style.transform = `scaleY(${max > 0 ? scrollY / max : 0})`;
    if (idx !== active) {
      active = idx;
      items.forEach((b, i) => b.classList.toggle("is-active", i === idx));
      onChange?.(idx, sections[idx]);
    }
  });
  return el;
}

/* ---------- Statement words light up with scroll ---------- */
export function scrollWords(container) {
  const words = [...container.querySelectorAll(".w")];
  if (reducedMotion()) { words.forEach((w) => w.classList.add("lit")); return; }
  onScrollFrame(() => {
    const r = container.getBoundingClientRect();
    // fully lit by the time the statement reaches the upper third
    const p = Math.max(0, Math.min(1, (innerHeight * 0.92 - r.top) / (innerHeight * 0.55)));
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle("lit", i < n));
  });
}

/* ---------- Floating preview that follows the cursor's Y ---------- */
export function hoverPreview(listEl, rows, render) {
  const card = h("div", { class: "preview", "aria-hidden": "true" });
  listEl.append(card);
  let targetY = 0, y = 0, raf = 0, shown = false;

  function loop() {
    y += (targetY - y) * (reducedMotion() ? 1 : 0.18);
    card.style.transform = `translate3d(0, ${y}px, 0)`;
    if (Math.abs(targetY - y) > 0.5) raf = requestAnimationFrame(loop);
    else raf = 0;
  }
  rows.forEach((row, i) => {
    row.addEventListener("pointerenter", () => {
      card.replaceChildren(...[render(i)].flat());
      if (!shown) { y = row.offsetTop; shown = true; }
      card.classList.add("is-on");
    });
    row.addEventListener("pointermove", (e) => {
      const r = listEl.getBoundingClientRect();
      targetY = Math.max(0, Math.min(listEl.clientHeight - card.offsetHeight, e.clientY - r.top - card.offsetHeight / 2));
      if (!raf) raf = requestAnimationFrame(loop);
    });
  });
  listEl.addEventListener("pointerleave", () => { card.classList.remove("is-on"); shown = false; });
  return card;
}

/* ---------- Letter-by-letter rise ---------- */
export function letters(el, text) {
  el.replaceChildren(...[...text].map((ch, i) => h("span", { class: "ltr", style: { "--i": i } }, ch)));
  return el;
}
