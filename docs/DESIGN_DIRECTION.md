# Design direction: "Night Cockpit"

This replaces section 3 (Design Direction) of the [frontend brief](FRONTEND_BRIEF.md). Everything else in the brief still applies, especially the product rules about demo data.

The look combines two references:

- **Structure from a bento-grid dashboard:** three unequal columns, big card radii, one solid hero card, rounded charts, one accent element per card.
- **Skin from an instrument-panel landing page:** glass cards, uppercase monospace labels, a HUD telemetry strip, a split-flap status board, a crosshair "inspect" interaction, crop marks and a gradient wordmark footer.

## Decisions

| Topic | Decision | Change from the original brief |
| --- | --- | --- |
| Mode | Dark: deep indigo canvas `#110E1F` with faint mint and periwinkle glows | Background was `#0B100F` |
| Accent | Mint `#65E6C0`, one highlight per card | Unchanged |
| Surfaces | Frosted glass cards (`rgba(255,255,255,0.045)` + blur), solid `#1D1A2A` fallback | Was flat `#121A16` with borders |
| Radius | Cards 24px, pills fully round | Was 12px. The brief said to avoid excessive pills; pills are now used on purpose for nav, buttons and chips |
| Type | Geist for names and numbers; Geist Mono, uppercase and letter-spaced, for every label, unit and eyebrow; Archivo Expanded only for the wordmark | Was Inter + JetBrains Mono |
| Navigation | Top nav pill (active item is an off-white pill); Settings is a gear button | Was a left sidebar |
| Gradients | Only the canvas glows, the mint hero card and the footer wordmark | Brief said to avoid excessive gradients, so they're limited to those three places |
| Motion | See "Motion" below. All of it is off under `prefers-reduced-motion` | Brief said to avoid unnecessary animation. Motion here runs on reveal, on scroll and on data change, never on a loop, except the slow gradient drift on the statement and wordmark |

## Rules

1. **One mint element per card.** The hero card is entirely mint, so nothing inside it is mint; it uses dark ink instead. On every other card, mint marks only the thing to look at: the eyebrow, the current bar, filled gauge segments, or the main series.
2. **Two type voices.** Sans for names, titles and big numbers, at weight 500 or less. Mono uppercase for labels and values in spec grids, the HUD and axes.
3. **Demo data is always labelled.** The split-flap board reads `MODE DEMO · STATUS SAMPLE` and adds a plain-English note. The HUD shows `MODE DEMO`. Every card shows a `DEMO` chip. All of these come from `meta.source`, so they disappear automatically with real data.
4. **Chart colours.**
   - Single-series and highlight charts use mint against neutral tracks.
   - Multi-series charts use `--series-1…5` in order. These were checked against the card surface `#1D1A2A` for colour-blind separation and contrast.
   - The heatmap uses `--ramp-1…5`, a five-step mint ramp whose lightest step still clears 2:1 on the cards.
   - Status colours (good, warning, critical) always come with an icon and a label.
5. **Accessibility.** Every chart has hover and focus tooltips. The cache map and charts work with arrow keys, and Esc closes the inspect panel. Muted text is `#8A83A8`, which is 4.8:1 on the cards.

## Motion

Lives in `assets/js/components/motion.js` and `assets/css/motion.css`.

| Effect | Where |
| --- | --- |
| Scroll reveal: cards fade and rise when they enter the viewport, staggered | Every card |
| Count-up numbers (start when visible) | HUD, hero, total tokens, gauge |
| Bars grow from the baseline; heatmap and cache map ripple in as a wave | Spend, sparkbars, heatmap, cache map |
| Gauge segments light up one by one; workload rings fill; timeline blocks slide in | Gauge, workloads |
| Split-flap: `----` while loading, then letters cycle and land | Status board |
| Crosshair scales in; inspect panel pops (0.96 → 1) | Hero cache map |
| Kinetic display type: two rows of extruded wide words that slide in opposite directions with scroll | Between token flow and statement |
| Statement: "has a job" in a drifting gradient; the rest lights up word by word as you scroll | Statement |
| Chapter scrubber: right-edge ticks with a scroll-progress rail; the HUD `SECTION` readout ticks to match | Whole page (≥1100px) |
| Hover preview: a glass card that follows the cursor's height over model rows | Models list |
| Wordmark letters rise one by one; the cursor becomes a mint token over it | Footer |
| Cards brighten one step on hover (no lift) | Every card |

Skipped on purpose: the 3D isometric model and scroll-scrubbed 3D scenes. They need a 3D engine and suit a landing page better.

## Overview layout

```
HUD:   MODE · RANGE · REQUESTS · TOKENS · CACHE · AVG LATENCY · SPEND · TOP MODEL
BOARD: MODE DEMO · ORG ACME · RANGE 30D · STATUS SAMPLE   (+ plain-language note)

┌ Date range ─┐ ┌ 01 Estimated savings (HERO) ┐ ┌ 02 Total tokens ┐
│ calendar    │ │ savings split + cache map   │ ├ 04 Load heatmap ┤
│ + workloads │ ├ 03 API spend (bars)         ┤ ├ 05 Cache gauge  ┤
└─────────────┘ └─────────────────────────────┘ └─────────────────┘
06 Token flow (area chart)
"Every token has a job." statement
The five models (chapter list)
Recent API requests
TOKNIQ wordmark footer
```

Tokens live in `frontend/assets/css/tokens.css`.
