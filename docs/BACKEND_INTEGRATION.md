# Connecting the frontend to the Django backend

The frontend is built so the backend can be plugged in without touching any page code. This doc covers what has to be agreed and what has to change.

## 1. Agree the contract first

No endpoints are assumed. Before wiring anything up, frontend and backend agree on:

- the URL for each service below
- field names (the frontend can adapt, see step 3)
- the date-range query format
- pagination format (DRF's default `{count, next, previous, results}` is fine)

The shapes the UI expects are documented as JSDoc types at the top of `frontend/assets/js/api/services.js`.

| Frontend service | Used by | Data needed |
| --- | --- | --- |
| `getOverview({ range })` | Overview | metrics for the range and the previous range, a time series (tokens in/out, cost, requests per hour or day), per-model totals, per-technique optimization totals |
| `getRecentRequests({ limit })` | Overview | latest request records |
| `getCacheActivity()` | Overview hero | cache hit rate, request count and cost avoided per hour for the last 7 days |
| `getRequestHeatmap({ range })` | Overview | request counts by weekday × 4-hour block |
| `getWorkloads()` | Overview | today's high-volume windows. **Proposed:** needs requests to carry a workload/tag label; drop the card if the backend won't track that |

More services will be added as each page is built.

### Values the backend owns

These must be calculated server-side. The frontend only displays them:

- token counts
- costs and **savings** (`estimatedSavings`)
- cache hit rate (`cacheHitRate`) and hourly cache buckets
- optimization results and quality evaluations

If the backend can't calculate a value yet, return `null`. The UI shows "Not calculated yet" rather than a made-up number.

## 2. Serve the frontend

**Option A: Django serves it (simplest, recommended).**
Copy `frontend/assets/` into a Django static directory and render the HTML pages as templates. Because the API is then same-origin, the session cookie and CSRF token just work and you don't need CORS.

```python
# settings.py
STATICFILES_DIRS = [BASE_DIR / "frontend"]
```

In the HTML, replace `assets/...` paths with `{% static 'assets/...' %}`. Add `{% csrf_token %}` or make sure the `csrftoken` cookie is set. `api/client.js` reads it automatically and sends `X-CSRFToken` on writes.

**Option B: serve the frontend separately.** Set `API_BASE_URL` in `config.js` to the full backend URL, then configure `django-cors-headers`, `CSRF_TRUSTED_ORIGINS` and `SESSION_COOKIE_SAMESITE` on the backend.

## 3. Switch a service from mock to real

In `frontend/assets/js/api/services.js`, each service looks like this:

```js
export async function getOverview(params) {
  if (CONFIG.USE_MOCK_DATA) return mock.getOverview(params);
  // TODO(backend): confirm endpoint + field names
  throw new ApiNotConfiguredError("getOverview");
}
```

Replace the `throw` with the real call and map the response in an adapter:

```js
const raw = await request("/dashboard/overview/", { params: rangeToParams(params.range) }); // agreed path
return adaptOverview(raw); // rename snake_case fields etc. here
```

Make sure the adapter sets `meta.source = "api"`. That's what removes the demo labels.

Then set `USE_MOCK_DATA: false` in `config.js`. Any service that hasn't been wired up yet throws `ApiNotConfiguredError`, and its card shows an error state with a clear message instead of silently showing fake data.

## 4. Security

- Provider API keys are entered in Settings and sent to Django once. They are never stored in JS, `localStorage` or cookies readable by JS, and never returned to the browser.
- Authentication uses Django sessions (httpOnly cookie). The frontend never handles tokens.
