# Rotatory Attention

![Multi-faction chart-spawned RTS banner](public/banner.jpg)

Multi-faction **auto-sim RTS** where each birth chart becomes a partisan force on a shared isometric battlefield. Units are hierarchical linguistic children of chart features (planet-in-sign roots plus aspect mixtures). Factions resolve **conflict**, **affiliation**, or **neutrality** automatically.

Combat exchanges use **energization** and **local density** (allies/enemies nearby), not flat ATK stats.

## Stack

| Layer | Tech |
|---|---|
| Charts | [Kerykeion](https://github.com/g-battaglia/kerykeion) (Python, AGPL) |
| API | FastAPI |
| Agents | SpaceXAI / xAI (`XAI_API_KEY`, `grok-4.5`) with deterministic fallbacks |
| Client | Vite + React + TypeScript + React Three Fiber |

Astrology is used only as a **feature graph**. Public names and UI stay mundane (roles, styles, links).

**License note:** Kerykeion is AGPL-3.0. This project links it server-side; treat the combined work as AGPL-compatible if you distribute the service.

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Unix:
# source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # or cp on Unix
# Optional: set XAI_API_KEY for LLM agent generation
# AGENT_MODE=fallback skips LLM (default for offline dev)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the Vite proxy forwards `/api` to the backend.

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `XAI_API_KEY` | empty | SpaceXAI key for agent expansion |
| `AGENT_MODE` | `fallback` | `fallback` \| `llm` |
| `XAI_MODEL` | `grok-4.5` | Model id |
| `AGENT_CACHE_DIR` | `backend/.cache/agents` | Disk cache for expansions |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed browser origins |

## Pipeline

1. **Birth data** → Kerykeion natal points + aspects  
2. **Feature graph** → root roles/styles + mixture links  
3. **Agent trees** → LLM (or fallback) skills / attributes / memories  
4. **Relations** → pairwise conflict / affiliation / neutrality  
5. **Match manifest** → client auto-sim with energization × density combat  

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/api/charts` | Natal summary |
| POST | `/api/features` | Feature graph for one chart |
| POST | `/api/match` | Full multi-faction match bootstrap |
| GET | `/api/match/{id}` | Cached match |

## Demo

Use the built-in presets (two sample charts) or enter lat/lng/timezone yourself. Offline chart math does not require GeoNames.

## Tests

```bash
cd backend && pytest
cd frontend && npm test
```
