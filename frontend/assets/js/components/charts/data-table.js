/**
 * "View as table" toggle for charts, so every value is reachable without
 * hovering and without relying on colour.
 */
import { h } from "../../utils/dom.js";
import { icon } from "../icons.js";

/**
 * @param {{columns: {label: string, align?: "r"}[], rows: (string|number)[][]}} table
 * @returns {{button: HTMLElement, panel: HTMLElement}}
 */
export function tableToggle({ columns, rows, caption }) {
  const panel = h(
    "div",
    { class: "chart-table", hidden: true },
    h(
      "table",
      { class: "table" },
      h("caption", { class: "sr-only" }, caption),
      h("thead", {}, h("tr", {}, columns.map((c) => h("th", { class: c.align ?? "", scope: "col" }, c.label)))),
      h("tbody", {}, rows.map((r) => h("tr", {}, r.map((cell, i) => h("td", { class: columns[i].align ?? "" }, cell)))))
    )
  );
  const button = h("button", { class: "circle-btn", type: "button", "aria-label": `Show ${caption} as a table`, "aria-pressed": "false", title: "View as table" }, icon("table"));
  button.addEventListener("click", () => {
    panel.hidden = !panel.hidden;
    button.setAttribute("aria-pressed", String(!panel.hidden));
  });
  return { button, panel };
}
