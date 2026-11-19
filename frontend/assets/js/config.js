/**
 * Frontend configuration.
 *
 * USE_MOCK_DATA
 *   true  -> every service in api/services.js returns demo data from /mock.
 *            The UI shows "Demo data" labels everywhere while this is on.
 *   false -> services call the Django backend through api/client.js.
 *            Endpoints are NOT defined yet; see docs/BACKEND_INTEGRATION.md.
 *
 * API_BASE_URL
 *   Base URL for the Django REST API. When the frontend is served by Django
 *   itself, keep this relative ("/api"). Never put secrets or API keys here.
 */
export const CONFIG = Object.freeze({
  USE_MOCK_DATA: true,
  API_BASE_URL: "/api",
  MOCK_LATENCY_MS: 450,
  WORKSPACE_NAME: "Acme Labs",
});
