/** Temporary page for sections that haven't been built yet. Keeps navigation working. */
import { h } from "../utils/dom.js";
import { mountShell, NAV } from "../components/shell.js";
import { withRange } from "../state.js";
import { emptyState } from "../components/ui.js";
import { icon } from "../components/icons.js";

const page = document.body.dataset.page;
const nav = NAV.find((n) => n.id === page);
const { content } = mountShell({ page, base: "../", showRange: page === "analytics" || page === "requests" || page === "optimization" });

content.append(
  h("div", { style: { display: "grid", gap: "10px", padding: "24px 4px 4px" } }, h("span", { class: "eyebrow" }, "Coming soon"), h("h1", {}, nav.label), h("p", { class: "muted" }, "This section is next on the build list.")),
  h(
    "div",
    { class: "placeholder" },
    emptyState({
      title: `${nav.label} is coming soon`,
      message: "The layout and components for this page are being built. The Overview page shows the design system in use.",
      iconName: nav.icon,
      action: h("a", { class: "pill-btn sm", href: withRange("../index.html") }, icon("overview"), "Back to Overview"),
    })
  )
);
