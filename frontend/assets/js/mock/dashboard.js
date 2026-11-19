/**
 * DEMO DATA ONLY.
 *
 * Generates plausible-looking numbers so the UI can be built before the
 * backend exists. Nothing here is a real measurement, and nothing here is a
 * real cost or savings calculation. Every response is tagged
 * meta.source = "mock" so the UI labels it as demo data.
 *
 * Seeded, so the same range always produces the same numbers.
 */
import { CONFIG } from "../config.js";

export const DEMO_MODELS = [
  // illustrative per-1M-token prices for generating demo costs only
  { model: "gpt-4o", inPrice: 2.5, outPrice: 10, share: 0.31, latency: 1450 },
  { model: "gpt-4o-mini", inPrice: 0.15, outPrice: 0.6, share: 0.27, latency: 620 },
  { model: "claude-sonnet", inPrice: 3, outPrice: 15, share: 0.22, latency: 1680 },
  { model: "claude-haiku", inPrice: 0.8, outPrice: 4, share: 0.12, latency: 540 },
  { model: "gemini-flash", inPrice: 0.3, outPrice: 2.5, share: 0.08, latency: 480 },
];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function delay(value) {
  return new Promise((resolve) => setTimeout(() => resolve(value), CONFIG.MOCK_LATENCY_MS));
}

function resolveRange(range) {
  const now = new Date();
  if (range === "24h") return { points: 24, stepMs: 3600e3, end: now, granularity: "hour" };
  if (range === "7d") return { points: 7, stepMs: 86400e3, end: now, granularity: "day" };
  if (range === "30d" || !range) return { points: 30, stepMs: 86400e3, end: now, granularity: "day" };
  const from = new Date(range.from);
  const to = new Date(range.to);
  const days = Math.max(1, Math.round((to - from) / 86400e3) + 1);
  return { points: Math.min(days, 180), stepMs: 86400e3, end: to, granularity: "day" };
}

function buildSeries(range, seedOffset = 0) {
  const key = typeof range === "string" ? range : `${range.from}_${range.to}`;
  const rand = rng(hashString(key) + seedOffset);
  const { points, stepMs, end, granularity } = resolveRange(range);
  const series = [];
  const baseReq = granularity === "hour" ? 520 : 12400;

  for (let i = 0; i < points; i++) {
    const t = new Date(end.getTime() - (points - 1 - i) * stepMs);
    let season = 1;
    if (granularity === "hour") {
      const hr = t.getHours();
      season = 0.45 + 0.75 * Math.exp(-((hr - 14) ** 2) / 30);
    } else {
      const dow = t.getDay();
      season = dow === 0 || dow === 6 ? 0.62 : 1;
    }
    const trend = 0.85 + 0.3 * (i / Math.max(1, points - 1));
    const noise = 0.88 + rand() * 0.24;
    const requests = Math.round(baseReq * season * trend * noise);
    const inputTokens = Math.round(requests * (1150 + rand() * 260));
    const outputTokens = Math.round(requests * (340 + rand() * 90));
    const blendedIn = DEMO_MODELS.reduce((s, m) => s + m.inPrice * m.share, 0);
    const blendedOut = DEMO_MODELS.reduce((s, m) => s + m.outPrice * m.share, 0);
    const cost = (inputTokens * blendedIn + outputTokens * blendedOut) / 1e6;
    const topModelCost = cost * (0.42 + rand() * 0.14);
    series.push({ t: t.toISOString(), inputTokens, outputTokens, cost, requests, topModelCost });
  }
  return { series, granularity };
}

function summarize(series, rand) {
  const sum = (k) => series.reduce((s, p) => s + p[k], 0);
  const inputTokens = sum("inputTokens");
  const outputTokens = sum("outputTokens");
  const estimatedCost = sum("cost");
  return {
    totalTokens: inputTokens + outputTokens,
    inputTokens,
    outputTokens,
    requestCount: sum("requests"),
    estimatedCost,
    estimatedSavings: estimatedCost * (0.17 + rand() * 0.06),
    cacheHitRate: 0.24 + rand() * 0.08,
    avgLatencyMs: 880 + rand() * 260,
  };
}

export function getOverview({ range = "30d" } = {}) {
  const { series, granularity } = buildSeries(range);
  const { series: prevSeries } = buildSeries(range, 977);
  const key = typeof range === "string" ? range : `${range.from}_${range.to}`;
  const rand = rng(hashString(key) + 31);

  const metrics = summarize(series, rand);
  const previous = summarize(prevSeries.map((p) => ({ ...p, requests: p.requests * 0.9 })), rand);

  const models = DEMO_MODELS.map((m) => {
    const requests = Math.round(metrics.requestCount * m.share);
    const tokens = Math.round(metrics.totalTokens * m.share * (0.9 + rand() * 0.2));
    const cost = (tokens * 0.76 * m.inPrice + tokens * 0.24 * m.outPrice) / 1e6;
    return { model: m.model, requests, tokens, cost };
  }).sort((a, b) => b.tokens - a.tokens);

  const saved = metrics.totalTokens * 0.2;
  const optimizations = [
    { type: "semantic_cache", label: "Semantic caching", share: 0.46 },
    { type: "context_compression", label: "Context compression", share: 0.34 },
    { type: "model_routing", label: "Model routing", share: 0.2 },
  ].map((o) => ({
    type: o.type,
    label: o.label,
    tokensSaved: Math.round(saved * o.share),
    costAvoided: (metrics.estimatedSavings ?? 0) * o.share,
  }));

  return delay({
    meta: { source: "mock", range, granularity },
    topModel: models.slice().sort((a, b) => b.cost - a.cost)[0].model,
    metrics,
    previous,
    timeseries: series,
    models,
    optimizations,
  });
}

const STATUSES = [
  { status: "optimized", type: "context_compression", w: 0.34 },
  { status: "cached", type: "semantic_cache", w: 0.27 },
  { status: "optimized", type: "model_routing", w: 0.12 },
  { status: "skipped", type: null, w: 0.23 },
  { status: "failed", type: "context_compression", w: 0.04 },
];

function pick(rand, items, weightKey) {
  const total = items.reduce((s, it) => s + it[weightKey], 0);
  let r = rand() * total;
  for (const it of items) {
    r -= it[weightKey];
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export function generateRequests(count, seed = 42) {
  const rand = rng(seed);
  const out = [];
  let t = Date.now() - 4000;
  for (let i = 0; i < count; i++) {
    const m = pick(rand, DEMO_MODELS, "share");
    const st = pick(rand, STATUSES, "w");
    const inputTokens = Math.round(200 + rand() * 3800);
    const outputTokens = st.status === "cached" ? 0 : Math.round(60 + rand() * 900);
    const latencyMs = st.status === "cached" ? 18 + rand() * 40 : m.latency * (0.7 + rand() * 0.7);
    const cost = st.status === "cached" ? 0 : (inputTokens * m.inPrice + outputTokens * m.outPrice) / 1e6;
    const tokensSaved = st.status === "optimized" || st.status === "cached" ? Math.round(inputTokens * (0.15 + rand() * 0.35)) : 0;
    out.push({
      id: "req_" + Math.floor(rand() * 0xffffffff).toString(16).padStart(8, "0") + Math.floor(rand() * 0xffff).toString(16).padStart(4, "0"),
      timestamp: new Date(t).toISOString(),
      model: m.model,
      inputTokens,
      outputTokens,
      latencyMs,
      cost,
      optimization: { status: st.status, type: st.type, tokensSaved },
    });
    t -= 2000 + rand() * 40000;
  }
  return out;
}

export function getRecentRequests({ limit = 8 } = {}) {
  return delay({ meta: { source: "mock" }, results: generateRequests(limit) });
}

/* ---------- Cache activity: hit rate per hour, last 7 days (hero cache map) ---------- */
export function getCacheActivity() {
  const rand = rng(7331);
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const days = [];
  for (let d = 6; d >= 0; d--) {
    const day = new Date(now.getTime() - d * 86400e3);
    const hours = [];
    for (let hr = 0; hr < 24; hr++) {
      const t = new Date(day);
      t.setHours(hr);
      if (t > now) { hours.push({ t: t.toISOString(), requests: null, hitRate: null, costAvoided: null }); continue; }
      const weekend = t.getDay() === 0 || t.getDay() === 6;
      const load = (0.12 + 0.88 * Math.exp(-((hr - 14) ** 2) / 26)) * (weekend ? 0.55 : 1);
      const requests = rand() < 0.04 ? 0 : Math.round(900 * load * (0.8 + rand() * 0.4));
      // repeated questions cluster in busy hours, so hit rate rises with load
      const hitRate = requests === 0 ? null : Math.min(0.62, 0.08 + load * 0.34 + (rand() - 0.5) * 0.16);
      hours.push({ t: t.toISOString(), requests, hitRate, costAvoided: requests * (hitRate ?? 0) * 0.0042 });
    }
    days.push({ date: day.toISOString().slice(0, 10), hours });
  }
  return delay({ meta: { source: "mock" }, days });
}

/* ---------- Request heatmap: weekday x 4-hour block ---------- */
export function getRequestHeatmap({ range = "30d" } = {}) {
  const key = typeof range === "string" ? range : `${range.from}_${range.to}`;
  const rand = rng(hashString(key) + 404);
  const blocks = [0, 4, 8, 12, 16, 20];
  const scale = range === "24h" ? 0.05 : range === "7d" ? 0.25 : 1;
  const cells = [];
  for (let dow = 0; dow < 7; dow++) {
    for (const start of blocks) {
      const weekend = dow === 0 || dow === 6;
      const mid = start + 2;
      const load = (0.08 + Math.exp(-((mid - 14) ** 2) / 22)) * (weekend ? 0.5 : 1);
      cells.push({ dow, start, requests: Math.round(19000 * load * scale * (0.85 + rand() * 0.3)) });
    }
  }
  return delay({ meta: { source: "mock" }, blocks, cells });
}

/* ---------- Workloads: high-volume windows today (left column timeline) ---------- */
export function getWorkloads() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const at = (h, m = 0) => new Date(today.getTime() + (h * 60 + m) * 60e3).toISOString();
  return delay({
    meta: { source: "mock" },
    results: [
      { id: "wl_1", name: "Embeddings sync", start: at(8), end: at(9, 30), model: "gpt-4o-mini", requests: 18420, cacheHitRate: 0.8, status: "ok" },
      { id: "wl_2", name: "Support chat", start: at(10), end: at(11, 45), model: "claude-sonnet", requests: 6210, cacheHitRate: 0.5, status: "ok" },
      { id: "wl_3", name: "Code review bot", start: at(12), end: at(13), model: "gpt-4o", requests: 2380, cacheHitRate: null, status: "rate_limited" },
      { id: "wl_4", name: "Doc summarizer", start: at(13, 30), end: at(15), model: "claude-haiku", requests: 9050, cacheHitRate: 0.38, status: "ok" },
      { id: "wl_5", name: "Nightly evals", start: at(15, 30), end: at(17), model: "gpt-4o", requests: 1200, cacheHitRate: 0.12, status: "ok" },
    ],
  });
}
