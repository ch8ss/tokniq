# ToknIQ — Complete Frontend Development Brief

## 1. Project Overview

**Project Name:** ToknIQ
**Tagline:** Every token, intelligently used.

ToknIQ is an intelligent LLM API token and cost optimization platform designed to help developers, startups, and businesses monitor, analyze, and optimize their AI API usage.

The platform aims to reduce unnecessary token consumption and API expenditure through:

- Semantic caching
- Context compression
- Intelligent model routing
- Token waste detection
- Quality-aware optimization
- API usage analytics
- Cost and savings attribution

The goal is to create a professional, developer-focused SaaS dashboard that makes AI API usage more efficient, transparent, and measurable.

## 2. Your Responsibility

You are responsible for developing the complete frontend of ToknIQ.

Another team member is independently developing the backend using:

- Python
- Django
- Django REST Framework (planned)
- PostgreSQL (planned)

Your responsibility is strictly the frontend. Do not rewrite, replace, or interfere with the existing Django backend. Build the frontend in a modular way so that it can later be integrated with Django APIs.

## 3. Design Direction

Create a premium, modern developer-tool interface.

Visual identity:

| Role | Color |
| --- | --- |
| Primary background (almost-black) | `#0B100F` |
| Secondary background (dark charcoal) | `#121A16` |
| Accent (neon mint green) | `#65E6C0` |
| Primary text (off-white) | `#EDF5F0` |
| Secondary text (muted grey-green) | `#84958B` |
| Borders (subtle dark green-grey) | `#25342D` |

Design characteristics:

- Dark-first interface
- Minimalistic and sophisticated
- Subtle neon-mint highlights
- Clean typography
- Rounded cards and panels
- Thin borders
- Subtle hover transitions
- Professional charts and analytics
- Consistent spacing and alignment
- Responsive layouts

Avoid:

- Excessive gradients
- Overly bright colors
- Unnecessary animations
- Generic AI-themed illustrations
- Cluttered dashboards
- Excessive rounded pill-shaped components
- An overly playful appearance

The interface should feel like a serious developer SaaS product. Take visual inspiration from modern developer platforms such as Vercel, Linear, Stripe, and PostHog, without copying their interfaces.

## 4. Application Structure

### A. Main Dashboard / Overview

The primary landing page after login.

**Sidebar navigation:** ToknIQ logo, Overview, Token Analytics, Optimization, API Requests, Playground, Settings

**Top navigation:** Current workspace, Breadcrumbs, Date-range selector, Notifications icon, Profile menu

**Dashboard metric cards:**

1. Total Tokens Processed
2. Total API Requests
3. Estimated API Cost
4. Estimated Cost Savings
5. Cache Hit Rate
6. Average Latency

**Analytics sections:**

- Token usage over time
- API expenditure over time
- Input versus output token distribution
- Optimization performance
- Model-wise usage breakdown
- Recent API requests

Use realistic-looking sample data during frontend development, but clearly identify it as demo data.

### B. Token Analytics

- Total input tokens
- Total output tokens
- Combined token consumption
- Daily and weekly token usage
- Token usage trends
- Model-wise token consumption
- Input/output distribution
- Usage comparison across models

Date filters: Last 24 hours, Last 7 days, Last 30 days, Custom date range.

Use interactive charts with tooltips and legends.

### C. Optimization Dashboard

One of ToknIQ's most important sections. Create individual optimization cards or sections for:

1. **Semantic Caching** — cache hit rate, cache misses, number of requests served from cache, estimated tokens saved, estimated cost avoided
2. **Context Compression** — original context size, compressed context size, tokens reduced, compression percentage, quality preservation indicator
3. **Intelligent Model Routing** — models used, request distribution, model selection breakdown, estimated cost differences, routing decisions
4. **Token Waste Detection** — repeated prompts, unnecessary context, redundant instructions, potentially excessive output, optimization opportunities
5. **Quality Guardrails** — response quality indicators, optimization status, failed optimization attempts, quality warnings

Do not claim that these optimizations are working until connected to the backend.

### D. API Requests

A request monitoring interface with a searchable and filterable table:

- Request ID
- Timestamp
- Model name
- Input tokens
- Output tokens
- Total tokens
- Latency
- Cost
- Optimization status

Features: search requests, filter by model, filter by optimization status, filter by date, sort columns, pagination, request detail view.

Clicking a request should open a detailed panel showing its usage information and optimization information.

### E. Playground

An interactive developer playground to experiment with prompts and understand the potential impact of optimization.

- Prompt input area
- Model selector
- Temperature setting
- Maximum output tokens
- Run button
- Original prompt preview
- Optimized prompt preview
- Token comparison
- Estimated cost comparison
- Response quality indicator

For now, build the interface and interaction states using mock data. Do not expose API keys in frontend code.

### F. Settings

- **Workspace settings:** workspace name, workspace information, account preferences
- **API configuration:** API provider information, API key configuration interface, model configuration
- **Optimization preferences:** enable/disable caching, enable/disable context compression, enable/disable intelligent routing, quality threshold preferences
- **Usage preferences:** usage notifications, cost alerts, usage limits

Sensitive credentials must never be stored in browser-side JavaScript or local storage. The backend will handle secure credential storage.

## 5. Important UI Components

Create reusable components for:

- Sidebar
- Top navigation
- Metric cards
- Chart cards
- Data tables
- Search bars
- Filter dropdowns
- Date pickers
- Modal dialogs
- Slide-out detail panels
- Status badges
- Loading skeletons
- Empty states
- Error states
- Toast notifications
- Confirmation dialogs

Maintain a consistent component design across all pages.

## 6. Technical Requirements

The backend is being developed with Django. Prefer frontend technologies that integrate cleanly with Django:

- HTML
- CSS
- JavaScript
- Django-compatible templates

If using React or another frontend framework, keep it as a separate frontend application with a clearly documented API integration strategy.

Requirements:

- Responsive design for desktop, tablet, and mobile
- Modular and reusable components
- Organized file structure
- Maintainable CSS
- No hardcoded secrets
- Accessible controls and semantic HTML
- Proper loading, error, and empty states
- Functional navigation
- Functional filters and dropdowns
- Interactive charts
- Consistent design system

## 7. Backend Integration Requirements

The backend developer is independently implementing Django models and APIs. Design the frontend so that API integration can happen without rebuilding the interface.

- Use a centralized API service layer.
- Do not invent API endpoints and assume they already exist.
- Keep mock data separate from actual API integration.
- Use clear placeholder functions for future API calls.

Expected backend data concepts:

**Dashboard metrics:** total tokens, input tokens, output tokens, API request count, estimated cost, estimated savings, cache hit rate, average latency

**API request records:** request ID, model name, input tokens, output tokens, latency, cost, timestamp, optimization information

**Optimization records:** optimization type, original token count, optimized token count, tokens saved, estimated cost avoided, quality evaluation

Coordinate the actual API field names and endpoint URLs with the backend developer before integration.

## 8. Important Product Rules

1. Never display fabricated metrics as real platform results.
2. Clearly label all sample information as demo data.
3. Do not claim cost savings without backend calculations.
4. Do not display fake cache hits as actual cache performance.
5. Do not simulate successful API calls as real provider responses.
6. Keep API credentials secure.
7. Separate frontend presentation logic from backend business logic.
8. Do not implement token counting, actual optimization algorithms, database operations, or API provider integrations in the frontend.

## 9. Expected Deliverables

1. Complete frontend source code
2. Responsive dashboard
3. All six application pages
4. Reusable UI components
5. Functional frontend interactions
6. Organized assets and stylesheets
7. Mock data for development
8. API integration service layer
9. Setup and execution instructions
10. Documentation explaining how to connect the frontend to the Django backend

## 10. Final Quality Expectations

The finished product should look and feel like a real, production-oriented SaaS application rather than a basic college project dashboard.

Prioritize:

- Visual quality
- Developer experience
- Ease of navigation
- Data visualization
- Consistent design
- Clean architecture
- Backend integration readiness

The final interface should communicate one central idea: **ToknIQ makes every AI token count.**

Build the frontend as a complete, polished application while keeping the backend integration clean and independent.
