/** Toast notifications. toast({ title, message?, tone?: "info"|"good"|"warning"|"critical", timeout? }) */
import { h } from "../utils/dom.js";
import { icon } from "./icons.js";

const TONE_ICON = { info: "info", good: "circleCheck", warning: "alert", critical: "circleX" };
let region;

function getRegion() {
  if (!region) {
    region = h("div", { class: "toast-region", role: "status", "aria-live": "polite" });
    document.body.append(region);
  }
  return region;
}

export function toast({ title, message, tone = "info", timeout = 4500 }) {
  const close = h("button", { class: "circle-btn", type: "button", "aria-label": "Dismiss" }, icon("x"));
  const el = h("div", { class: `toast ${tone}` }, icon(TONE_ICON[tone] ?? "info"), h("div", {}, h("strong", {}, title), message && h("p", {}, message)), close);
  const remove = () => el.remove();
  close.addEventListener("click", remove);
  getRegion().append(el);
  if (timeout) setTimeout(remove, timeout);
  return remove;
}
