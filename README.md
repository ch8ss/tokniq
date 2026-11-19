# ToknIQ

**Every token, intelligently used.**

ToknIQ is an LLM API token and cost optimization platform. It helps developers, startups and businesses monitor, analyze and optimize their AI API usage through semantic caching, context compression, intelligent model routing, token waste detection, quality-aware optimization, usage analytics and cost/savings attribution.

## Team

- **Frontend:** Sowmya. See [docs/FRONTEND_BRIEF.md](docs/FRONTEND_BRIEF.md)
- **Backend:** Python / Django / Django REST Framework / PostgreSQL

## Structure

```
frontend/   # dashboard UI (plain HTML/CSS/JS, no build step) — see frontend/README.md
backend/    # Django project (in progress)
docs/       # brief + backend integration guide
```

## Run the frontend

```bash
cd frontend && python3 -m http.server 8000
# open http://localhost:8000
```
