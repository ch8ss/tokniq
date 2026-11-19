/**
 * Service layer: the ONLY place pages get data from.
 *
 * Every function returns the same UI-facing shape whether it is backed by
 * mock data or the Django API, so pages never change during integration.
 *
 * Every response carries `meta.source` = "mock" | "api". Components use it
 * to show the "Demo data" label, so mock numbers are never presented as real.
 *
 * Backend endpoints are intentionally NOT invented here. When the backend
 * developer confirms a URL and its fields, replace the matching
 * `throw new ApiNotConfiguredError(...)` with a `request(...)` call and map the
 * response in the adapter below it. See docs/BACKEND_INTEGRATION.md.
 */
import { CONFIG } from "../config.js";
import { ApiNotConfiguredError /*, request */ } from "./client.js";
import * as mock from "../mock/dashboard.js";

/**
 * @typedef {"24h"|"7d"|"30d"|{from: string, to: string}} DateRange
 *
 * @typedef {Object} Metrics
 * @property {number} totalTokens
 * @property {number} inputTokens
 * @property {number} outputTokens
 * @property {number} requestCount
 * @property {number} estimatedCost      USD
 * @property {number|null} estimatedSavings USD; null until the backend calculates it
 * @property {number|null} cacheHitRate  0..1; null until the backend reports it
 * @property {number} avgLatencyMs
 *
 * @typedef {Object} Overview
 * @property {{source: "mock"|"api", range: DateRange, granularity: "hour"|"day"}} meta
 * @property {Metrics} metrics
 * @property {Metrics} previous          same metrics for the preceding period (for deltas)
 * @property {string} topModel           model with the highest estimated spend in the range
 * @property {{t: string, inputTokens: number, outputTokens: number, cost: number, requests: number, topModelCost: number}[]} timeseries
 * @property {{model: string, requests: number, tokens: number, cost: number}[]} models
 * @property {{type: string, label: string, tokensSaved: number, costAvoided: number}[]} optimizations
 *
 * @typedef {Object} ApiRequestRecord
 * @property {string} id
 * @property {string} timestamp           ISO 8601
 * @property {string} model
 * @property {number} inputTokens
 * @property {number} outputTokens
 * @property {number} latencyMs
 * @property {number} cost                USD
 * @property {{status: "optimized"|"cached"|"skipped"|"failed", type: string|null, tokensSaved: number}} optimization
 */

/** @param {{range: DateRange}} params @returns {Promise<Overview>} */
export async function getOverview(params) {
  if (CONFIG.USE_MOCK_DATA) return mock.getOverview(params);

  // TODO(backend): confirm endpoint + field names, e.g.
  //   const raw = await request("/<confirmed-path>/", { params: rangeToParams(params.range) });
  //   return adaptOverview(raw);
  throw new ApiNotConfiguredError("getOverview");
}

/** @param {{limit?: number}} params @returns {Promise<{meta: object, results: ApiRequestRecord[]}>} */
export async function getRecentRequests(params = {}) {
  if (CONFIG.USE_MOCK_DATA) return mock.getRecentRequests(params);

  // TODO(backend): confirm endpoint + pagination format (DRF default is {count, next, previous, results}).
  throw new ApiNotConfiguredError("getRecentRequests");
}

/**
 * Cache hit rate per hour for the last 7 days (hero cache map).
 * @returns {Promise<{meta: object, days: {date: string, hours: {t: string, requests: number|null, hitRate: number|null, costAvoided: number|null}[]}[]}>}
 */
export async function getCacheActivity() {
  if (CONFIG.USE_MOCK_DATA) return mock.getCacheActivity();
  // TODO(backend): confirm endpoint. Needs hourly buckets from the semantic cache.
  throw new ApiNotConfiguredError("getCacheActivity");
}

/**
 * Request volume by weekday (0 = Sun) and 4-hour block.
 * @param {{range: DateRange}} params
 * @returns {Promise<{meta: object, blocks: number[], cells: {dow: number, start: number, requests: number}[]}>}
 */
export async function getRequestHeatmap(params) {
  if (CONFIG.USE_MOCK_DATA) return mock.getRequestHeatmap(params);
  // TODO(backend): confirm endpoint (aggregate of request records).
  throw new ApiNotConfiguredError("getRequestHeatmap");
}

/**
 * Today's high-volume workloads (requests grouped by an app/tag label).
 * PROPOSED concept: needs the backend to record a workload/tag per request.
 * @returns {Promise<{meta: object, results: {id: string, name: string, start: string, end: string, model: string, requests: number, cacheHitRate: number|null, status: "ok"|"rate_limited"}[]}>}
 */
export async function getWorkloads() {
  if (CONFIG.USE_MOCK_DATA) return mock.getWorkloads();
  // TODO(backend): discuss whether requests carry a workload/tag field.
  throw new ApiNotConfiguredError("getWorkloads");
}

/* ------------------------------------------------------------------------ */
/* Adapters: map backend JSON -> UI shape. Fill in once fields are agreed.   */
/* ------------------------------------------------------------------------ */

// eslint-disable-next-line no-unused-vars
function adaptOverview(raw) {
  return {
    meta: { source: "api", range: raw.range, granularity: raw.granularity },
    metrics: raw.metrics,
    previous: raw.previous,
    timeseries: raw.timeseries,
    models: raw.models,
    optimizations: raw.optimizations,
  };
}

// eslint-disable-next-line no-unused-vars
function rangeToParams(range) {
  return typeof range === "string" ? { range } : { from: range.from, to: range.to };
}
