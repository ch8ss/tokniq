/**
 * Hero cache map: 7 days × 24 hours of semantic-cache hit rate.
 * Click (or Enter) a bucket to drop a crosshair on it and open an inspect
 * panel. Arrow keys move between buckets; Esc closes.
 */
import { h, s } from "../../utils/dom.js";
import { pct, int, usd } from "../../utils/format.js";
import { specGrid } from "../ui.js";

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function tone(hitRate) {
  if (hitRate == null) return "cm-none";
  if (hitRate >= 0.35) return "cm-high";
  if (hitRate >= 0.2) return "cm-mid";
  return "cm-low";
}

export function cacheMap({ days }) {
  const root = h("div", { class: "cachemap" });
  const grid = h("div", { class: "cachemap-grid", role: "grid", "aria-label": "Cache hit rate by hour, last 7 days. Use arrow keys to move and Enter to inspect." });
  const cells = []; // [row][col]
  let overlay = null;
  let selected = null;

  days.forEach((d, row) => {
    const date = new Date(d.date + "T00:00:00");
    grid.append(h("span", { class: "lbl", "aria-hidden": "true" }, `${DOW[date.getDay()]} ${date.getDate()}`));
    cells[row] = d.hours.map((b, col) => {
      const hour = String(col).padStart(2, "0") + ":00";
      const label = b.requests == null ? `${DOW[date.getDay()]} ${hour}: no data yet` : b.requests === 0 ? `${DOW[date.getDay()]} ${hour}: no traffic` : `${DOW[date.getDay()]} ${hour}: ${pct(b.hitRate)} hit rate, ${int(b.requests)} requests`;
      const cell = h("button", {
        class: `cm-cell wave ${tone(b.hitRate)}`,
        type: "button",
        role: "gridcell",
        tabindex: row === days.length - 1 && col === 0 ? 0 : -1,
        "aria-label": label,
        style: { "--i": row * 2 + col },
      });
      cell.addEventListener("click", () => inspect(row, col));
      cell.addEventListener("keydown", (e) => onKey(e, row, col));
      grid.append(cell);
      return cell;
    });
  });

  grid.append(h("span"));
  for (let col = 0; col < 24; col++) grid.append(h("span", { class: "lbl xl", "aria-hidden": "true" }, col % 6 === 0 ? String(col).padStart(2, "0") : ""));

  const legendEl = h(
    "div",
    { class: "cm-legend", "aria-hidden": "true" },
    [["cm-high", "Hit rate 35%+"], ["cm-mid", "20–35%"], ["cm-low", "Under 20%"], ["cm-none", "No traffic"]].map(([c, t]) => h("span", {}, h("i", { class: c }), t))
  );

  root.append(grid, legendEl);

  function focusCell(row, col) {
    const r = Math.max(0, Math.min(days.length - 1, row));
    const c = Math.max(0, Math.min(23, col));
    cells.flat().forEach((el) => el.setAttribute("tabindex", "-1"));
    cells[r][c].setAttribute("tabindex", "0");
    cells[r][c].focus();
    if (overlay) inspect(r, c, false);
  }

  function onKey(e, row, col) {
    const moves = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    if (moves[e.key]) {
      e.preventDefault();
      focusCell(row + moves[e.key][0], col + moves[e.key][1]);
    } else if (e.key === "Escape" && overlay) {
      e.preventDefault();
      close();
    }
  }

  function close() {
    overlay?.forEach((n) => n.remove());
    overlay = null;
    selected?.classList.remove("is-selected");
    selected?.focus();
    selected = null;
  }

  function inspect(row, col, moveFocus = true) {
    overlay?.forEach((n) => n.remove());
    selected?.classList.remove("is-selected");
    const cell = cells[row][col];
    const b = days[row].hours[col];
    const date = new Date(days[row].date + "T00:00:00");
    const hour = String(col).padStart(2, "0") + ":00";
    selected = cell;
    cell.classList.add("is-selected");

    const rootBox = root.getBoundingClientRect();
    const box = cell.getBoundingClientRect();
    const cx = box.left - rootBox.left + box.width / 2;
    const cy = box.top - rootBox.top + box.height / 2;
    const size = 46;

    const cross = h(
      "div",
      { class: "crosshair", style: { left: cx - size / 2 + "px", top: cy - size / 2 + "px" }, "aria-hidden": "true" },
      s(
        "svg",
        { width: size, height: size, viewBox: "0 0 46 46" },
        s("circle", { cx: 23, cy: 23, r: 17, fill: "none", stroke: "#14111F", "stroke-width": 1.5 }),
        s("path", { d: "M23 0v8M23 38v8M0 23h8M38 23h8", stroke: "#14111F", "stroke-width": 1.5 })
      ),
      h("span", { class: "tag" }, `${DOW[date.getDay()]} ${hour}`)
    );

    const closeBtn = h("button", { class: "close", type: "button" }, "Esc ×");
    closeBtn.addEventListener("click", close);
    const served = b.requests && b.hitRate != null ? Math.round(b.requests * b.hitRate) : null;
    const panel = h(
      "div",
      { class: "inspect", role: "dialog", "aria-label": "Cache bucket details" },
      h("div", { class: "head" }, h("span", { class: "eyebrow" }, "Inspect"), closeBtn),
      h("h3", {}, "Cache bucket"),
      h("p", { class: "muted", style: { fontSize: "13px" } }, `${date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}, ${hour}–${String(col + 1).padStart(2, "0")}:00`),
      b.requests == null
        ? h("p", { class: "muted" }, "This hour hasn't happened yet.")
        : specGrid([
            { label: "Requests", value: int(b.requests) },
            { label: "Hit rate", value: b.hitRate == null ? "—" : pct(b.hitRate) },
            { label: "From cache", value: served == null ? "—" : int(served) },
            { label: "Cost avoided", value: b.costAvoided == null ? "—" : usd(b.costAvoided) },
          ]),
      h("span", { class: "hint" }, "Arrows to move · Esc to return")
    );
    panel.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });

    root.append(cross, panel);
    const pw = 260;
    const left = cx + 34 + pw < root.clientWidth ? cx + 34 : Math.max(0, cx - 34 - pw);
    const top = Math.max(-10, Math.min(cy - 60, root.clientHeight - panel.offsetHeight));
    panel.style.left = left + "px";
    panel.style.top = top + "px";
    overlay = [cross, panel];
    if (moveFocus) cell.focus();
  }

  document.addEventListener("pointerdown", (e) => {
    if (overlay && !root.contains(e.target)) close();
  });

  return root;
}
