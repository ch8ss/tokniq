/**
 * App shell: crop marks, top bar (wordmark, nav pill, actions), HUD strip,
 * content area and wordmark footer.
 *
 * Django note: this markup maps onto templates/partials/topbar.html and
 * footer.html; the behaviour below (menus, date range) keeps working.
 */
import { h, dismissable } from "../utils/dom.js";
import { icon, logo } from "./icons.js";
import { CONFIG } from "../config.js";
import { getRange, setRange, onRangeChange, rangeLabel, RANGE_LABELS, withRange } from "../state.js";
import { toast } from "./toast.js";
import { reveal, letters } from "./motion.js";

// Paths are relative to /frontend/. Pages in /pages/ use `base: "../"`.
export const NAV = [
  { id: "overview", label: "Overview", icon: "overview", href: "index.html" },
  { id: "analytics", label: "Token Analytics", icon: "analytics", href: "pages/token-analytics.html" },
  { id: "optimization", label: "Optimization", icon: "optimization", href: "pages/optimization.html" },
  { id: "requests", label: "API Requests", icon: "requests", href: "pages/api-requests.html" },
  { id: "playground", label: "Playground", icon: "playground", href: "pages/playground.html" },
  { id: "settings", label: "Settings", icon: "settings", href: "pages/settings.html" },
];

/**
 * @param {{page: string, base?: string, showRange?: boolean}} opts
 * @returns {{content: HTMLElement, hud: HTMLElement}}
 */
export function mountShell({ page, base = "", showRange = true }) {
  const current = NAV.find((n) => n.id === page);
  const root = document.getElementById("app");

  const crops = ["tl", "tr", "bl", "br"].map((c) => h("span", { class: `crop ${c}`, "aria-hidden": "true" }));

  const meta = h(
    "span",
    { class: "mono-label brand-meta hide-sm" },
    h("button", { type: "button", onclick: () => toast({ title: "Workspace switching", message: "Multiple workspaces arrive once the backend supports them." }) }, CONFIG.WORKSPACE_NAME)
  );

  const brand = h(
    "div",
    { class: "brand-lockup" },
    h("a", { class: "wordmark", href: withRange(base + "index.html"), "aria-label": "ToknIQ home" }, logo(), h("span", {}, "TOKN", h("span", { class: "q" }, "IQ"))),
    meta
  );

  const navEl = (cls) =>
    h(
      "nav",
      { class: `nav ${cls}`, "aria-label": "Primary" },
      NAV.filter((n) => n.id !== "settings").map((n) =>
        h("a", { class: "nav-link", href: withRange(base + n.href), "aria-current": n.id === page ? "page" : null }, n.id === page ? icon(n.icon) : null, n.label)
      )
    );

  const actions = h(
    "div",
    { class: "top-actions" },
    showRange ? dateRangePicker() : null,
    notifications(),
    h("a", { class: "circle-btn hide-sm", href: withRange(base + "pages/settings.html"), "aria-label": "Settings", "aria-current": page === "settings" ? "page" : null }, icon("settings")),
    h("a", { class: "pill-btn primary hide-md", href: withRange(base + "pages/playground.html") }, icon("play"), "Run playground"),
    profileMenu(base)
  );

  const hud = h("div", { class: "hud", "aria-label": "Telemetry" });
  const content = h("main", { class: "content", id: "main", tabindex: "-1" });

  const footer = h(
    "footer",
    { class: "footer" },
    letters(h("span", { class: "footer-word", "aria-hidden": "true" }), "TOKNIQ"),
    h(
      "div",
      { class: "footer-meta" },
      h("span", { class: "mono-label" }, "ToknIQ"),
      h("span", { class: "mono-label" }, "Every token, intelligently used"),
      h("span", { class: "mono-label" }, CONFIG.USE_MOCK_DATA ? "Demo mode" : "Live mode"),
      h("span", { class: "mono-label" }, "v0.1")
    )
  );

  const frame = h("div", { class: "frame" }, h("header", { class: "topbar" }, brand, navEl(""), actions), navEl("mobile-nav"), hud, content, footer);
  root.replaceChildren(...crops, frame);
  reveal(footer);

  document.title = `${current?.label ?? "ToknIQ"} · ToknIQ`;
  return { content, hud };
}

/* ---------------- Date range picker ---------------- */
function dateRangePicker() {
  const label = h("span", {}, rangeLabel(getRange()));
  const trigger = h("button", { class: "pill-btn", type: "button", "aria-haspopup": "true", "aria-expanded": "false" }, icon("calendar"), label, icon("chevronDown"));
  const items = Object.entries(RANGE_LABELS).map(([value, text]) =>
    h("button", { class: "menu-item", role: "menuitemradio", type: "button", "data-value": value }, text, icon("check", "check"))
  );
  const panel = h(
    "div",
    { class: "menu", role: "menu", hidden: true },
    items,
    h("div", { class: "menu-sep" }),
    h("p", { class: "mono-label", style: { padding: "8px 12px" } }, "Custom range: pick dates on the calendar")
  );

  function sync(range) {
    label.textContent = rangeLabel(range);
    items.forEach((it) => it.setAttribute("aria-checked", String(it.dataset.value === range)));
  }
  sync(getRange());
  onRangeChange(sync);

  const ctl = dismissable(trigger, panel);
  items.forEach((it) => it.addEventListener("click", () => { setRange(it.dataset.value); ctl.close(); }));
  return h("div", { class: "dropdown hide-sm" }, trigger, panel);
}

/* ---------------- Notifications ---------------- */
function notifications() {
  const trigger = h("button", { class: "circle-btn", type: "button", "aria-label": "Notifications", "aria-haspopup": "true", "aria-expanded": "false" }, icon("bell"));
  const panel = h(
    "div",
    { class: "menu", hidden: true, style: { width: "300px" } },
    h("div", { class: "menu-head" }, h("span", { class: "eyebrow" }, "Notifications")),
    h(
      "div",
      { class: "state", style: { minHeight: "140px", padding: "18px" } },
      h("div", { class: "state-icon" }, icon("inbox")),
      h("strong", {}, "You're all caught up"),
      h("p", {}, "Cost alerts and usage warnings will appear here once the backend sends them.")
    )
  );
  dismissable(trigger, panel);
  return h("div", { class: "dropdown" }, trigger, panel);
}

/* ---------------- Profile ---------------- */
function profileMenu(base) {
  const trigger = h("button", { class: "avatar", type: "button", "aria-label": "Account menu", "aria-haspopup": "true", "aria-expanded": "false" }, "DU");
  const panel = h(
    "div",
    { class: "menu", role: "menu", hidden: true },
    h("div", { class: "menu-head" }, h("strong", {}, "Demo user"), h("span", { class: "mono-label" }, "Not signed in")),
    h("a", { class: "menu-item", role: "menuitem", href: withRange(base + "pages/settings.html") }, icon("settings"), "Settings"),
    h("a", { class: "menu-item", role: "menuitem", href: "https://github.com/ch8ss/tokniq", target: "_blank", rel: "noopener" }, icon("book"), "Documentation"),
    h("div", { class: "menu-sep" }),
    h("button", { class: "menu-item", role: "menuitem", type: "button", disabled: true }, icon("logout"), "Sign out")
  );
  dismissable(trigger, panel);
  return h("div", { class: "dropdown" }, trigger, panel);
}
