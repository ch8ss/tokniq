/**
 * Calendar date-range picker (left bento column).
 * Presets (24H / 7D / 30D) or click a start date then an end date.
 * Reads and writes the shared range in state.js, so the top-bar picker
 * and every card stay in sync.
 */
import { h, clear } from "../utils/dom.js";
import { icon } from "./icons.js";
import { getRange, setRange, onRangeChange } from "../state.js";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

function rangeDates(range) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (range === "24h") return [iso(addDays(today, -1)), iso(today)];
  if (range === "7d") return [iso(addDays(today, -6)), iso(today)];
  if (range === "30d") return [iso(addDays(today, -29)), iso(today)];
  return [range.from, range.to];
}

export function calendar() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = iso(today);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let pendingStart = null;

  const title = h("div", { class: "cal-title", "aria-live": "polite" });
  const prev = h("button", { class: "circle-btn", type: "button", "aria-label": "Previous month" }, icon("chevronLeft"));
  const next = h("button", { class: "circle-btn", type: "button", "aria-label": "Next month" }, icon("chevronRight"));
  const grid = h("div", { class: "cal-grid", role: "grid" });
  const hint = h("p", { class: "cal-hint" });

  const presetBtns = ["24h", "7d", "30d"].map((r) => h("button", { type: "button", "data-r": r, "aria-pressed": "false" }, r));
  const presets = h("div", { class: "presets", role: "group", "aria-label": "Quick ranges" }, presetBtns);
  presetBtns.forEach((b) => b.addEventListener("click", () => { pendingStart = null; setRange(b.dataset.r); }));

  prev.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
  next.addEventListener("click", () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });

  function render() {
    const range = getRange();
    const [from, to] = pendingStart ? [pendingStart, pendingStart] : rangeDates(range);
    presetBtns.forEach((b) => b.setAttribute("aria-pressed", String(!pendingStart && b.dataset.r === range)));

    const isThisMonth = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
    clear(title).append(
      isThisMonth ? `${today.toLocaleDateString("en-US", { month: "short" })}, ${today.getDate()} ` : view.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      isThisMonth ? h("span", {}, "Today") : ""
    );
    next.disabled = isThisMonth;
    next.style.opacity = isThisMonth ? 0.35 : 1;

    clear(grid);
    DOW.forEach((d) => grid.append(h("span", { class: "cal-dow", "aria-hidden": "true" }, d.slice(0, 3))));
    const start = addDays(view, -view.getDay());
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      const id = iso(d);
      const out = d.getMonth() !== view.getMonth();
      if (out && i >= 35) break; // drop an all-next-month last row
      const future = d > today;
      const cls = ["cal-day"];
      if (out) cls.push("out");
      if (id === todayIso) cls.push("is-today");
      if (id >= from && id <= to) cls.push("in-range");
      if (id === from) cls.push("range-start");
      if (id === to) cls.push("range-end");
      const btn = h(
        "button",
        { class: cls.join(" "), type: "button", role: "gridcell", disabled: future, "aria-label": d.toDateString(), "aria-selected": String(id >= from && id <= to) },
        h("span", {}, d.getDate())
      );
      btn.addEventListener("click", () => pick(id));
      grid.append(btn);
    }
    hint.textContent = pendingStart ? "Now pick an end date." : "Pick a start and end date for a custom range.";
  }

  function pick(id) {
    if (!pendingStart) {
      pendingStart = id;
      render();
      return;
    }
    const [a, b] = id < pendingStart ? [id, pendingStart] : [pendingStart, id];
    pendingStart = null;
    setRange({ from: a, to: b });
  }

  onRangeChange(render);
  render();

  return h(
    "div",
    { style: { display: "grid", gap: "16px" } },
    h("div", { class: "cal-head" }, title, h("div", { class: "cal-nav" }, prev, next)),
    presets,
    grid,
    hint
  );
}
