/**
 * Tiny DOM helpers.
 *
 * h("div", { class: "card", onclick: fn }, child, "text", [moreChildren])
 * Strings become text nodes, so data from the API is never parsed as HTML.
 * Use `html` only for trusted, hard-coded markup such as icons.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "html") {
      el.innerHTML = value; // trusted static markup only
    } else if (key === "style" && typeof value === "object") {
      for (const [prop, v] of Object.entries(value)) {
        if (v == null) continue;
        // custom properties (--i, --c …) need setProperty; plain assignment drops them
        if (prop.startsWith("--")) el.style.setProperty(prop, String(v));
        else el.style[prop] = v;
      }
    } else if (value === true) {
      el.setAttribute(key, "");
    } else {
      el.setAttribute(key, value);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

const SVG_NS = "http://www.w3.org/2000/svg";
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** Parse a trusted, hard-coded SVG/HTML string into a node. */
export function html(markup) {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

/** Close an open popover when clicking outside it or pressing Escape. */
export function dismissable(trigger, panel, onClose) {
  function onDoc(e) {
    if (!panel.contains(e.target) && !trigger.contains(e.target)) close();
  }
  function onKey(e) {
    if (e.key === "Escape") { close(); trigger.focus(); }
  }
  function close() {
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", onDoc);
    document.removeEventListener("keydown", onKey);
    onClose?.();
  }
  function open() {
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
  }
  trigger.addEventListener("click", () => (panel.hidden ? open() : close()));
  return { open, close };
}
