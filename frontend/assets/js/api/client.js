/**
 * HTTP client for the Django backend.
 *
 * - Sends the session cookie (same-origin) and Django's CSRF token on writes.
 * - Never attaches provider API keys: those live only on the server.
 * - Throws ApiError with status + parsed body so the UI can show an error state.
 */
import { CONFIG } from "../config.js";

export class ApiError extends Error {
  constructor(message, { status = 0, body = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/** Raised while a service has no confirmed backend endpoint yet. */
export class ApiNotConfiguredError extends ApiError {
  constructor(serviceName) {
    super(
      `${serviceName}: no backend endpoint is configured yet. ` +
        "Agree the URL and fields with the backend developer, then fill in api/services.js."
    );
    this.name = "ApiNotConfiguredError";
  }
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function request(path, { method = "GET", params, body, signal } = {}) {
  const url = new URL(CONFIG.API_BASE_URL.replace(/\/$/, "") + path, window.location.origin);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== "") url.searchParams.set(k, v);
    }
  }

  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET") {
    const csrf = getCookie("csrftoken");
    if (csrf) headers["X-CSRFToken"] = csrf;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "same-origin",
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError("Network error: could not reach the server.");
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const detail = data && (data.detail || data.message);
    throw new ApiError(detail || `Request failed (${res.status})`, { status: res.status, body: data });
  }
  return data;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}
