/**
 * Overview page ("Night Cockpit" bento).
 * All data comes from api/services.js; this file only presents it.
 *
 *  ┌ calendar  ┐ ┌ HERO: savings + cache map ┐ ┌ total tokens  ┐
 *  │ + today's │ │                           │ ├ request heat  ┤
 *  │ workloads │ ├ API spend (rounded bars)  ┤ ├ cache gauge   ┤
 *  └───────────┘ └───────────────────────────┘ └───────────────┘
 *  token flow · statement · models · recent requests
 */
import { h } from "../utils/dom.js";
import { mountShell } from "../components/shell.js";
import { getOverview, getRecentRequests, getCacheActivity, getRequestHeatmap, getWorkloads } from "../api/services.js";
import { getRange, onRangeChange, rangeLabel, withRange } from "../state.js";
import { compact, usd, pct, ms, int, dateLabel, dateTime, relativeTime } from "../utils/format.js";
import { card, circleBtn, sourceChip, statusBadge, specGrid, delta, skeleton, emptyState, errorState, legend, countUp } from "../components/ui.js";
import { flapBoard } from "../components/flap-board.js";
import { calendar } from "../components/calendar.js";
import { timeline } from "../components/timeline.js";
import { flowChart } from "../components/charts/line-chart.js";
import { spendBars, sparkbars, heatmap, segmentedGauge } from "../components/charts/bento-charts.js";
import { cacheMap } from "../components/charts/cache-map.js";
import { tableToggle } from "../components/charts/data-table.js";
import { modelColor } from "../components/model-colors.js";
import { icon } from "../components/icons.js";
import { CONFIG } from "../config.js";
import { kinetic, scrubber, scrollWords, hoverPreview, reveal } from "../components/motion.js";

const { content, hud } = mountShell({ page: "overview" });

/* ---------- Frame ---------- */
const board = flapBoard();
const slots = {
  cal: h("div", { class: "a-cal", style: { display: "grid" } }),
  hero: h("div", { class: "a-hero", style: { display: "grid" } }),
  tokens: h("div", { class: "a-tokens", style: { display: "grid" } }),
  heat: h("div", { class: "a-heat", style: { display: "grid" } }),
  spend: h("div", { class: "a-spend", style: { display: "grid" } }),
  gauge: h("div", { class: "a-gauge", style: { display: "grid" } }),
};
const bento = h("div", { class: "bento" }, Object.values(slots));
const flowSlot = h("div", { style: { display: "grid" } });
const statementSlot = h("div");
const modelsSlot = h("div", { style: { display: "grid" } });
const recentSlot = h("div", { style: { display: "grid" } });
const kineticBand = kinetic([
  { words: [{ text: "CACHE" }, { text: "COMPRESS", accent: true }, { text: "ROUTE" }, { text: "MEASURE", outline: true }] },
  { words: [{ text: "EVERY TOKEN", outline: true }, { text: "COUNTS" }, { text: "·", outline: true }] },
]);
content.append(board.el, bento, flowSlot, kineticBand, statementSlot, modelsSlot, recentSlot);

// HUD readout for the section in view; updated by the scrubber
const hudSection = h("span", { class: "mono-value" }, "01 OVERVIEW");
const hudSectionItem = h("div", { class: "hud-item" }, h("span", { class: "mono-label" }, "Section"), hudSection);
const SECTIONS = [
  { label: "Overview", el: bento },
  { label: "Token flow", el: flowSlot },
  { label: "Statement", el: statementSlot },
  { label: "Models", el: modelsSlot },
  { label: "Requests", el: recentSlot },
];
document.body.append(
  scrubber(SECTIONS, (i, s) => {
    hudSection.textContent = `${String(i + 1).padStart(2, "0")} ${s.label.toUpperCase()}`;
    hudSection.classList.remove("tick-flash");
    void hudSection.offsetWidth;
    hudSection.classList.add("tick-flash");
  })
);

const RANGE_CODE = (r) => (typeof r === "string" ? r.toUpperCase() : "CUSTOM");

/* ---------- Range-independent data (load once) ---------- */
const cacheActivity = getCacheActivity();
cacheActivity.catch(() => {}); // handled where it's rendered
renderCalendar();

/* ---------- Range-dependent cards ---------- */
let firstLoad = true;
let loadToken = 0;

async function load() {
  const range = getRange();
  const token = ++loadToken;

  if (firstLoad) renderSkeletons();
  else document.querySelectorAll(".js-range-card").forEach((c) => c.classList.add("is-refreshing"));

  const [overview, heat, recent] = await Promise.allSettled([getOverview({ range }), getRequestHeatmap({ range }), getRecentRequests({ limit: 6 })]);
  if (token !== loadToken) return;
  firstLoad = false;

  if (overview.status === "fulfilled") renderOverview(overview.value, range);
  else renderOverviewError(overview.reason);

  slots.heat.replaceChildren(heat.status === "fulfilled" ? heatCard(heat.value) : card({ eyebrow: "Load", title: "Requests by time", body: errorState({ error: heat.reason, onRetry: load }), i: 4 }));
  recentSlot.replaceChildren(recent.status === "fulfilled" ? recentCard(recent.value) : card({ eyebrow: "Latest", title: "Recent API requests", body: errorState({ error: recent.reason, onRetry: load }) }));
}

function renderSkeletons() {
  board.set([
    { label: "Mode", value: "----", key: true, loading: true },
    { label: "Org", value: "----", loading: true },
    { label: "Range", value: "---", loading: true },
    { label: "Status", value: "------", loading: true },
  ]);
  const sk = (cls = "sk-block") => [skeleton("sk-line"), skeleton("sk-stat"), skeleton(cls)];
  slots.hero.replaceChildren(card({ hero: true, eyebrow: "01 · Savings", body: sk(), i: 1 }));
  slots.tokens.replaceChildren(card({ eyebrow: "Total tokens", body: sk(), i: 2 }));
  slots.spend.replaceChildren(card({ eyebrow: "API spend", body: sk(), i: 3 }));
  slots.heat.replaceChildren(card({ eyebrow: "Load", body: sk(), i: 4 }));
  slots.gauge.replaceChildren(card({ eyebrow: "Cache hit rate", body: sk(), i: 5 }));
  flowSlot.replaceChildren(card({ eyebrow: "Token flow", body: sk() }));
}

function renderOverviewError(error) {
  board.set([{ label: "Mode", value: CONFIG.USE_MOCK_DATA ? "Demo" : "Live", key: true }, { label: "Status", value: "Error" }], "The overview data couldn't be loaded.");
  const err = (eyebrow, i) => card({ eyebrow, body: errorState({ error, onRetry: load }), i });
  slots.hero.replaceChildren(err("01 · Savings", 1));
  slots.tokens.replaceChildren(err("Total tokens", 2));
  slots.spend.replaceChildren(err("API spend", 3));
  slots.gauge.replaceChildren(err("Cache hit rate", 5));
  flowSlot.replaceChildren(err("Token flow"));
  modelsSlot.replaceChildren();
  statementSlot.replaceChildren();
  hud.replaceChildren();
}

function renderOverview(data, range) {
  const { metrics: m, previous: p, timeseries, meta } = data;
  const isMock = meta.source === "mock";

  renderHud(data, range);
  board.set(
    [
      { label: "Mode", value: isMock ? "Demo" : "Live", key: true },
      { label: "Org", value: CONFIG.WORKSPACE_NAME.split(" ")[0] },
      { label: "Range", value: RANGE_CODE(range) },
      { label: "Status", value: isMock ? "Sample" : "Live" },
    ],
    isMock ? "Sample numbers for building the interface. They are not real usage, costs, savings or cache results." : null
  );

  const gran = meta.granularity;
  const xLabel = (d, full) => (full ? (gran === "hour" ? dateTime(d.t).slice(0, -3) : dateLabel(d.t) + ", " + new Date(d.t).getFullYear()) : dateLabel(d.t, gran));

  slots.hero.replaceChildren(heroCard(data));
  slots.tokens.replaceChildren(tokensCard(data, xLabel));
  slots.spend.replaceChildren(spendCard(data, xLabel));
  slots.gauge.replaceChildren(gaugeCard(data));
  flowSlot.replaceChildren(flowCard(data, xLabel));
  statementSlot.replaceChildren(statement(m, isMock));
  modelsSlot.replaceChildren(modelsCard(data));
}

/* ---------- HUD telemetry ---------- */
function renderHud({ metrics: m, meta, topModel }, range) {
  const items = [
    { label: "Mode", value: meta.source === "mock" ? "DEMO" : "LIVE", key: true },
    { label: "Range", value: typeof range === "string" ? range.toUpperCase() : rangeLabel(range).toUpperCase() },
    { label: "Requests", n: m.requestCount, f: compact },
    { label: "Tokens", n: m.totalTokens, f: compact },
    { label: "Cache", n: m.cacheHitRate, f: (v) => pct(v) },
    { label: "Avg latency", n: m.avgLatencyMs, f: ms },
    { label: "Spend", n: m.estimatedCost, f: usd },
    { label: "Top model", value: topModel?.toUpperCase() ?? "—" },
  ];
  hud.replaceChildren(
    ...items.map((it) => {
      const v = h("span", { class: "mono-value" }, it.value ?? "");
      if (it.n !== undefined) countUp(v, it.n, it.f);
      return h("div", { class: `hud-item ${it.key ? "is-key" : ""}` }, h("span", { class: "mono-label" }, it.label), v);
    }),
    hudSectionItem
  );
}

/* ---------- Left column: calendar + workloads ---------- */
function renderCalendar() {
  const tlSlot = h("div", { style: { display: "grid", gap: "14px" } }, h("span", { class: "eyebrow" }, "Today's workloads"), skeleton("sk-block"));
  slots.cal.replaceChildren(card({ eyebrow: "Date range", body: [calendar(), h("div", { style: { borderTop: "1px solid var(--hairline)" } }), tlSlot], i: 0, label: "Date range and today's workloads" }));
  getWorkloads()
    .then(({ meta, results }) => {
      tlSlot.replaceChildren(
        h("div", { class: "card-head" }, h("span", { class: "eyebrow" }, "Today's workloads"), sourceChip(meta)),
        results.length ? timeline(results) : emptyState({ title: "No workloads today", message: "High-volume windows show up here." })
      );
    })
    .catch((error) => tlSlot.replaceChildren(errorState({ error })));
}

/* ---------- Hero: savings + cache map ---------- */
function heroCard({ metrics: m, previous: p, optimizations = [], meta }) {
  const big = h("span", { class: "stat-big" });
  countUp(big, m.estimatedSavings, (v) => usd(v));
  const byType = Object.fromEntries(optimizations.map((o) => [o.type, o]));
  const mapSlot = h("div", {}, skeleton("sk-block"));

  cacheActivity
    .then(({ days }) => mapSlot.replaceChildren(h("div", { class: "card-head", style: { marginBottom: "12px" } }, h("span", { class: "mono-label" }, "Cache hit rate by hour · last 7 days"), h("span", { class: "mono-label hide-sm" }, "Click a square to inspect")), cacheMap({ days })))
    .catch((error) => mapSlot.replaceChildren(errorState({ error })));

  return card({
    hero: true,
    area: "js-range-card",
    eyebrow: "01 · Estimated savings",
    title: "What optimization avoided",
    actions: [sourceChip(meta), circleBtn({ iconName: "arrowUpRight", label: "Open optimization", href: withRange("pages/optimization.html"), filled: true })],
    i: 1,
    body: [
      h(
        "div",
        { style: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" } },
        h("div", { style: { display: "grid", gap: "8px" } }, m.estimatedSavings == null ? h("span", { class: "stat-mid" }, "Not calculated yet") : big, h("span", { class: "mono-label" }, `${rangeLabel(getRange())} · ${p?.estimatedSavings ? deltaText(m.estimatedSavings, p.estimatedSavings) : ""}`)),
        h(
          "div",
          { style: { flex: "1 1 280px", maxWidth: "380px" } },
          specGrid([
            { label: "Semantic cache", value: usd(byType.semantic_cache?.costAvoided) },
            { label: "Compression", value: usd(byType.context_compression?.costAvoided) },
            { label: "Routing", value: usd(byType.model_routing?.costAvoided) },
            { label: "Tokens saved", value: compact(optimizations.reduce((s, o) => s + o.tokensSaved, 0)) },
          ])
        )
      ),
      savingsSplit(optimizations),
      mapSlot,
    ],
  });
}

/** Tall segmented bar: share of estimated savings by technique. */
function savingsSplit(optimizations) {
  const total = optimizations.reduce((s, o) => s + (o.costAvoided ?? 0), 0);
  if (!total) return null;
  const SHORT = { semantic_cache: "Cache", context_compression: "Compression", model_routing: "Routing" };
  const fills = ["rgba(20,17,31,0.88)", "rgba(20,17,31,0.55)", "rgba(20,17,31,0.28)"];
  const inks = ["#65E6C0", "#F2EEFF", "#14111F"];
  return h(
    "div",
    { style: { display: "grid", gap: "10px" } },
    h("span", { class: "mono-label" }, "Share of savings by technique"),
    h(
      "div",
      { class: "split", role: "img", "aria-label": optimizations.map((o) => `${o.label} ${pct(o.costAvoided / total, 0)}`).join(", ") },
      optimizations.map((o, i) => {
        const share = o.costAvoided / total;
        return h("div", { class: "split-part", title: `${o.label}: ${usd(o.costAvoided)} (${pct(share, 0)})`, style: { flex: `${share} 1 0`, background: fills[i], color: inks[i] } }, share > 0.16 ? `${SHORT[o.type] ?? o.label} ${pct(share, 0)}` : "");
      })
    )
  );
}

function deltaText(v, prev) {
  const c = (v - prev) / prev;
  return `${c >= 0 ? "↑" : "↓"} ${Math.abs(c * 100).toFixed(1)}% vs prior`;
}

/* ---------- Total tokens ---------- */
function tokensCard({ metrics: m, previous: p, timeseries, meta }, xLabel) {
  const big = h("span", { class: "stat-big" });
  countUp(big, m.totalTokens, compact);
  return card({
    area: "js-range-card",
    eyebrow: "02 · Total tokens",
    actions: [sourceChip(meta), circleBtn({ iconName: "arrowUpRight", label: "Open token analytics", href: withRange("pages/token-analytics.html"), filled: true })],
    i: 2,
    body: [
      h("div", { style: { display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" } }, big, h("span", { class: "unit" }, "tokens"), delta(m.totalTokens, p?.totalTokens)),
      sparkbars(timeseries.slice(-30).map((d) => d.inputTokens + d.outputTokens), { label: "tokens", format: compact, titles: timeseries.slice(-30).map((d) => xLabel(d, true)) }),
      specGrid([
        { label: "Input", value: compact(m.inputTokens) },
        { label: "Output", value: compact(m.outputTokens) },
        { label: "Requests", value: compact(m.requestCount), extra: delta(m.requestCount, p?.requestCount) },
        { label: "Avg latency", value: ms(m.avgLatencyMs), extra: delta(m.avgLatencyMs, p?.avgLatencyMs, "down") },
      ]),
    ],
  });
}

/* ---------- API spend ---------- */
function spendCard({ metrics: m, previous: p, timeseries, meta, topModel }, xLabel) {
  const topTotal = timeseries.reduce((s, d) => s + d.topModelCost, 0);
  const table = tableToggle({
    caption: "API spend per period",
    columns: [{ label: "Date" }, { label: "Total", align: "r" }, { label: topModel, align: "r" }, { label: "Other", align: "r" }],
    rows: timeseries.map((d) => [xLabel(d, true), usd(d.cost), usd(d.topModelCost), usd(d.cost - d.topModelCost)]),
  });
  const stat = (label, value, color) =>
    h("div", { style: { display: "grid", gap: "6px" } }, h("span", { class: "stat-mid" }, value), h("span", { class: "mono-label" }, color ? h("i", { class: "dot-key", style: { background: color } }) : null, label));

  return card({
    area: "js-range-card",
    eyebrow: "03 · API spend",
    title: "Estimated cost",
    actions: [sourceChip(meta), table.button],
    i: 3,
    body: [
      h(
        "div",
        { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))", gap: "12px" } },
        stat(h("span", {}, "Total ", delta(m.estimatedCost, p?.estimatedCost, "down")), usd(m.estimatedCost)),
        stat(topModel, usd(topTotal), "var(--mint-500)"),
        stat("Other models", usd(m.estimatedCost - topTotal), "var(--track-strong)")
      ),
      timeseries.length
        ? spendBars({ points: timeseries, xLabel, total: (d) => d.cost, part: (d) => d.topModelCost, partLabel: topModel, restLabel: "other models", format: (v) => usd(v), axisFormat: (v) => "$" + compact(v) })
        : emptyState({ message: "No spend in this range." }),
      table.panel,
    ],
  });
}

/* ---------- Heatmap ---------- */
function heatCard({ meta, blocks, cells }) {
  return card({
    area: "js-range-card",
    eyebrow: "04 · Load",
    title: "Requests by time",
    actions: [sourceChip(meta)],
    i: 4,
    body: cells.length ? heatmap({ cells, blocks, format: (v) => new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v) }) : emptyState({ message: "No requests in this range." }),
  });
}

/* ---------- Gauge ---------- */
function gaugeCard({ metrics: m, previous: p, meta }) {
  if (m.cacheHitRate == null) {
    return card({ eyebrow: "05 · Cache hit rate", body: emptyState({ title: "No cache data yet", message: "Appears once the semantic cache reports hits." }), i: 5 });
  }
  const val = h("span", { class: "stat-big" });
  countUp(val, m.cacheHitRate, (v) => pct(v));
  const served = Math.round(m.requestCount * m.cacheHitRate);
  return card({
    area: "js-range-card",
    eyebrow: "05 · Cache hit rate",
    actions: [sourceChip(meta)],
    i: 5,
    body: [
      segmentedGauge({ value: m.cacheHitRate, label: `Cache hit rate ${pct(m.cacheHitRate)}`, center: [h("span", { class: "mono-label" }, "Cache hit"), val, delta(m.cacheHitRate, p?.cacheHitRate, "up")] }),
      specGrid([
        { label: "Served from cache", value: compact(served) },
        { label: "Misses", value: compact(m.requestCount - served) },
      ]),
    ],
  });
}

/* ---------- Token flow ---------- */
function flowCard({ timeseries, meta }, xLabel) {
  const table = tableToggle({
    caption: "Token usage over time",
    columns: [{ label: "Date" }, { label: "Input", align: "r" }, { label: "Output", align: "r" }],
    rows: timeseries.map((d) => [xLabel(d, true), int(d.inputTokens), int(d.outputTokens)]),
  });
  return card({
    area: "js-range-card",
    eyebrow: "06 · Token flow",
    title: `Input and output tokens per ${meta.granularity}`,
    actions: [sourceChip(meta), table.button],
    body: timeseries.length
      ? [
          legend([{ label: "Input tokens", color: "#65E6C0" }, { label: "Output tokens", color: "rgba(201,194,230,0.6)" }]),
          flowChart({ data: timeseries, xLabel, primary: { key: "inputTokens", label: "Input" }, secondary: { key: "outputTokens", label: "Output" }, format: int, axisFormat: compact, ariaLabel: "Token usage over time" }),
          table.panel,
        ]
      : emptyState({ message: "No requests in this range." }),
  });
}

/* ---------- Statement ---------- */
function statement(m, isMock) {
  const rest = `${compact(m.totalTokens)} processed, ${m.cacheHitRate == null ? "cache not reporting yet" : pct(m.cacheHitRate, 0) + " served from cache"}, ${m.estimatedSavings == null ? "savings not calculated yet" : usd(m.estimatedSavings) + " estimated savings"}.${isMock ? " (Demo figures.)" : ""}`;
  const el = h(
    "p",
    { class: "statement rise" },
    "Every token ",
    h("span", { class: "grad" }, "has a job"),
    h("span", { class: "dot" }, "."),
    " ",
    rest.split(" ").map((w) => [h("span", { class: "w" }, w), " "])
  );
  reveal(el);
  requestAnimationFrame(() => scrollWords(el));
  return el;
}

/* ---------- Models (chapter list) ---------- */
const NUM_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];

function modelsCard({ models = [], metrics: m, meta }) {
  return card({
    area: "js-range-card",
    eyebrow: `The ${NUM_WORDS[models.length] ?? models.length} models`,
    title: "Usage by model",
    actions: [sourceChip(meta), circleBtn({ iconName: "arrowUpRight", label: "Open token analytics", href: withRange("pages/token-analytics.html"), filled: true })],
    body: models.length ? modelList(models, m) : emptyState({ message: "No model usage in this range." }),
  });
}

function modelList(models, m) {
  const maxTok = Math.max(...models.map((x) => x.tokens), 1);
  const totalTok = models.reduce((s, x) => s + x.tokens, 0) || 1;
  const rows = models.map((x, i) =>
    h(
      "div",
      { class: "chapter slide-in", role: "listitem", style: { "--i": i } },
      h("span", { class: "idx" }, String(i).padStart(2, "0")),
      h("span", { class: "name" }, h("span", { class: "model-dot", style: { background: modelColor(x.model) }, "aria-hidden": "true" }), x.model),
      h("span", { class: "mono-label role" }, `${pct(x.requests / Math.max(1, m.requestCount), 0)} of requests`),
      h("span", { class: "bar", "aria-hidden": "true" }, h("span", { style: { width: `${(x.tokens / maxTok) * 100}%` } })),
      h("span", { class: "facts mono-value" }, `${compact(x.tokens)} tok · ${usd(x.cost)}`)
    )
  );
  const list = h("div", { class: "chapters", role: "list" }, rows);
  hoverPreview(list, rows, (i) => {
    const x = models[i];
    return [
      h("span", { class: "eyebrow" }, `Model ${String(i).padStart(2, "0")}`),
      h("h4", {}, h("span", { class: "model-dot", style: { background: modelColor(x.model) } }), x.model),
      h("div", { class: "share" }, h("span", { style: { width: `${(x.tokens / totalTok) * 100}%` } })),
      specGrid([
        { label: "Token share", value: pct(x.tokens / totalTok) },
        { label: "Requests", value: compact(x.requests) },
        { label: "Est. cost", value: usd(x.cost) },
        { label: "Per 1M tok", value: usd((x.cost / Math.max(1, x.tokens)) * 1e6) },
      ]),
    ];
  });
  return list;
}

/* ---------- Recent requests ---------- */
function recentCard({ meta, results }) {
  const body = results.length
    ? h(
        "div",
        { class: "table-wrap" },
        h(
          "table",
          { class: "table" },
          h("caption", { class: "sr-only" }, "Most recent API requests"),
          h("thead", {}, h("tr", {}, ["Request ID", "Time", "Model", "Input", "Output", "Latency", "Cost", "Optimization"].map((c, i) => h("th", { scope: "col", class: i >= 3 && i <= 6 ? "r" : "" }, c)))),
          h(
            "tbody",
            {},
            results.map((r) =>
              h(
                "tr",
                {},
                h("td", { class: "mono" }, r.id),
                h("td", { class: "muted", title: dateTime(r.timestamp) }, relativeTime(r.timestamp)),
                h("td", {}, h("span", { class: "model-cell" }, h("span", { class: "model-dot", style: { background: modelColor(r.model) }, "aria-hidden": "true" }), r.model)),
                h("td", { class: "r" }, int(r.inputTokens)),
                h("td", { class: "r" }, int(r.outputTokens)),
                h("td", { class: "r" }, ms(r.latencyMs)),
                h("td", { class: "r" }, usd(r.cost, { precise: true })),
                h("td", {}, statusBadge(r.optimization.status))
              )
            )
          )
        )
      )
    : emptyState({ title: "No requests yet", message: "Requests appear here once your app sends traffic through ToknIQ.", iconName: "requests" });

  return card({
    eyebrow: "Latest",
    title: "Recent API requests",
    actions: [sourceChip(meta), h("a", { class: "pill-btn sm", href: withRange("pages/api-requests.html") }, "View all", icon("arrowUpRight"))],
    body,
  });
}

onRangeChange(load);
load();
