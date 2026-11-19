/**
 * Fixed chart colour per model, so a model keeps its colour on every page and
 * after any filter. Colours follow the entity, never its rank.
 * Unknown models fall back to a neutral grey. Update this list once the
 * backend's model catalogue is known (max 5 categorical slots validated).
 */
const KNOWN = ["gpt-4o", "gpt-4o-mini", "claude-sonnet", "claude-haiku", "gemini-flash"];

export function modelColor(model) {
  const i = KNOWN.indexOf(model);
  return i === -1 ? "var(--text-3)" : `var(--series-${i + 1})`;
}
