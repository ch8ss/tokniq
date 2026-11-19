/**
 * Split-flap status board. Replaces the old warning banner: it states the
 * data mode (DEMO / LIVE) up front, plus a plain-language note.
 *
 * const board = flapBoard();
 * board.set([{label: "Mode", value: "DEMO", key: true}, ...], "note text");
 */
import { h, clear } from "../utils/dom.js";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function flaps(value, isKey, loading) {
  const wrap = h("span", { class: `flaps ${isKey ? "is-key" : ""} ${loading ? "is-loading" : ""}`, "aria-hidden": "true" });
  [...value].forEach((ch, i) => {
    const el = h("span", { class: "flap" }, ch === " " ? " " : ch);
    wrap.append(el);
    if (reduced() || ch === " " || loading) return;
    // cycle through a few random characters, then land on the real one
    let n = 0;
    const steps = 2 + (i % 3);
    setTimeout(function tick() {
      el.classList.remove("is-flipping");
      void el.offsetWidth;
      el.classList.add("is-flipping");
      el.textContent = n < steps ? CHARS[Math.floor(Math.random() * CHARS.length)] : ch;
      if (n++ < steps) setTimeout(tick, 70);
    }, i * 35);
  });
  return wrap;
}

export function flapBoard() {
  const el = h("div", { class: "board rise", role: "status" });
  return {
    el,
    set(fields, note) {
      clear(el);
      for (const f of fields) {
        el.append(
          h(
            "div",
            { class: "board-field" },
            h("span", { class: "mono-label" }, f.label),
            flaps(String(f.value).toUpperCase(), f.key, f.loading),
            h("span", { class: "sr-only" }, `${f.label}: ${f.value}`)
          )
        );
      }
      if (note) el.append(h("p", { class: "board-note" }, note));
    },
  };
}
