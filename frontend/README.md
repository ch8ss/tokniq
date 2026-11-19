# ToknIQ frontend

A dark "Night Cockpit" dashboard built with plain HTML, CSS and JavaScript (ES modules). There's no build step and nothing to install. The design rules are in [docs/DESIGN_DIRECTION.md](../docs/DESIGN_DIRECTION.md).

## Run it

ES modules don't load from `file://`, so serve the folder:

```bash
cd frontend
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Status

| Page | Status |
| --- | --- |
| Overview | Built |
| Token Analytics | Placeholder |
| Optimization | Placeholder |
| API Requests | Placeholder |
| Playground | Placeholder |
| Settings | Placeholder |

All data is **demo data** from `assets/js/mock/`. The UI says so in the HUD, on the split-flap status board and on a `DEMO` chip on every card.

## Structure

```
frontend/
├── index.html                  Overview page
├── pages/                      One HTML file per other page
└── assets/
    ├── css/
    │   ├── tokens.css          Colours, spacing, type: the design system
    │   ├── base.css            Reset and element defaults
    │   ├── layout.css          App shell, grids, responsive breakpoints
    │   ├── components.css      Buttons, cards, badges, tables, menus, toasts, states
    │   └── charts.css          Chart chrome and tooltip
    └── js/
        ├── config.js           USE_MOCK_DATA switch and API base URL
        ├── state.js            Selected date range (kept in the URL)
        ├── api/
        │   ├── client.js       fetch wrapper: CSRF, session cookie, errors
        │   └── services.js     The ONLY data entry point for pages
        ├── mock/               Demo data generators (development only)
        ├── components/         Shell (top nav, HUD, footer), UI bits, split-flap board,
        │   │                   calendar, workload timeline, icons, toast
        │   └── charts/         Flow (area) chart, rounded spend bars, sparkbars, heatmap,
        │                       segmented gauge, cache map + inspect, tooltip, table view
        ├── pages/              One script per page
        └── utils/              DOM and formatting helpers
```

## Rules this code follows

- Pages never import from `mock/`. They call `api/services.js`, which picks mock or real data based on `CONFIG.USE_MOCK_DATA`.
- Every service response has `meta.source` (`"mock"` or `"api"`). The demo labels key off it, so mock numbers can't be shown as real.
- No API keys, tokens or secrets live in the frontend. The browser talks only to Django.
- Data from the API is inserted with `textContent` (via the `h()` helper), never `innerHTML`.
- One mint element per card. Chart colours come from `tokens.css`: mint for the highlighted series, `--series-1…5` for multi-series (in order, no new hues), `--ramp-1…5` for the heatmap. Each model keeps a fixed colour (`components/model-colors.js`).
- Every chart has hover and focus tooltips and keyboard access. Line and bar charts also have a "view as table" toggle.
- All motion respects `prefers-reduced-motion`.

## Adding a page

1. Copy `pages/settings.html` and point its `<script>` at a new `assets/js/pages/<name>.js`.
2. In that script: `const { content, hud } = mountShell({ page: "<nav id>", base: "../" });`, then append cards built with `card({ eyebrow, title, actions, body })` from `components/ui.js`.
3. Get data through a new function in `api/services.js`, with a matching mock in `mock/`.

See [docs/BACKEND_INTEGRATION.md](../docs/BACKEND_INTEGRATION.md) for connecting to Django.
