/** Number / date formatting helpers. Presentation only: no business logic. */

const compactFmt = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const intFmt = new Intl.NumberFormat("en-US");

export function compact(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.abs(n) < 10000 ? intFmt.format(Math.round(n)) : compactFmt.format(n);
}

export function int(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return intFmt.format(Math.round(n));
}

export function usd(n, { precise = false } = {}) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n === 0) return "$0.00";
  if (precise) {
    const digits = Math.abs(n) < 0.01 ? 5 : Math.abs(n) < 1 ? 4 : 2;
    return "$" + n.toFixed(digits);
  }
  if (Math.abs(n) >= 10000) return "$" + compactFmt.format(n);
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pct(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return "—";
  return (n * 100).toFixed(digits) + "%";
}

export function ms(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return n >= 1000 ? (n / 1000).toFixed(2) + " s" : Math.round(n) + " ms";
}

export function dateLabel(iso, granularity = "day") {
  const d = new Date(iso);
  if (granularity === "hour") return d.toLocaleTimeString("en-US", { hour: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function dateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

export function relativeTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return Math.max(1, Math.round(diff)) + "s ago";
  if (diff < 3600) return Math.round(diff / 60) + "m ago";
  if (diff < 86400) return Math.round(diff / 3600) + "h ago";
  return Math.round(diff / 86400) + "d ago";
}
