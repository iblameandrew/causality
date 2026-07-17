# Rotatory Attention

![Social simulacra — thoughts with agency on a shared field](public/banner.jpg)

**A system for social simulacra** in which a person is not a single agent, but a **field of thoughts that each carry their own agency**.

Every durable pattern in a psyche—drive, feeling, mind, bond, force, bound, dream—can spawn linguistic children: skills, memories, hybrid mixtures. Those children walk a shared world. When several people are present, their thoughts **collide, affiliate, or pass each other by**. The battlefield is not metaphor alone; it is an auto-sim where attention, density, and energization decide what wins the moment.

## Idea

People do not think as monoliths. A single chart of temperament is a **root constellation**. From each root, a hierarchy unfolds:

- **Root features** — primary modes of being (role × style), the main lines of thought that keep reappearing  
- **Mixture features** — thoughts that only exist because two modes stand in relation (support, tension, fusion, challenge)  
- **Hierarchical agents** — each feature expands into a named unit with attributes, skills, and memories: a thought that can act  

Put two or more people on the same field and you get **partisan thought-ecologies**. One person’s structured technique may *need* another’s absorptive comprehension; elsewhere, force-thoughts grind against bound-thoughts. The system records that as **affiliation**, **conflict**, or **neutrality**, then lets the units resolve it in motion.

This is social simulacra: not a dialogue of avatars saying lines, but a **swarm of semi-autonomous mental figures** whose local energy and company change how hard they hit, how long they last, and whether they bolster their kin.

## What runs under the hood

Temperament graphs are computed from birth data via [Kerykeion](https://github.com/g-battaglia/kerykeion) (offline lat/lng/timezone). Implementation language stays **mundane**—roles, styles, links—not horoscope prose. Astrology is only a **feature source** for the simulacra.

| Layer | Role in the simulacra |
|---|---|
| Kerykeion + FastAPI | Turn a person into a feature graph and a multi-person relation matrix |
| Agent expander (SpaceXAI or fallback) | Give each thought a name, skills, attributes, memories, and child thoughts |
| React + Three.js auto-sim | Drop many people’s thought-units onto one isometric field and let them act |

Combat is social pressure made mechanical: **energization** of a thought, plus **how many other thoughts stand nearby** (cohesion, overcrowding, focus fire). A lonely idea fights differently from one surrounded by its own lineage.

**License note:** Kerykeion is AGPL-3.0. The library is used server-side; treat distributed combinations as AGPL-compatible if you ship the service.

## Pipeline

1. **Person** — birth data in; a constellation of root features out  
2. **Emanation** — aspects become mixture thoughts; LLM/fallback expands hierarchies of agency  
3. **Society** — pairwise stances between people (conflict / affiliation / neutrality)  
4. **Simulacrum** — match manifest loads; units auto-seek, support, or contest  
5. **Resolution** — each exchange weighs energy × local density, not flat stats  

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
# Optional: XAI_API_KEY + AGENT_MODE=llm for richer thought names and memories
# AGENT_MODE=fallback (default) works fully offline
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the Vite proxy forwards `/api` to the backend.

Add **any number of people** (no faction cap — use + chart, +5, or bulk Add N). Presets seed a few charts; bulk-add fills diversified birth data. **Generate match** and watch their thought-agents take the field. Inspect any unit for lineage, memories, energization, and how crowded its aura is. Map size and units-per-faction scale so large multi-chart matches stay playable.

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `XAI_API_KEY` | empty | SpaceXAI key for agent expansion |
| `AGENT_MODE` | `fallback` | `fallback` \| `llm` |
| `XAI_MODEL` | `grok-4.5` | Model id |
| `AGENT_CACHE_DIR` | `backend/.cache/agents` | Disk cache for expansions |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed browser origins |

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness |
| POST | `/api/charts` | Person → natal feature points |
| POST | `/api/features` | Feature graph (roots + mixtures) for one person |
| POST | `/api/match` | Full multi-person simulacra bootstrap |
| GET | `/api/match/{id}` | Cached match |
| POST | `/api/dialogue` | Talk to a unit via its `voice_prompt` |

Each roster unit carries a **`voice_prompt`** — a conversational system prompt so that thought can be spoken with. Select a unit in the inspector to open dialogue (LLM if `XAI_API_KEY` is set, otherwise persona fallback).

## Stack

| Layer | Tech |
|---|---|
| Charts | Kerykeion (Python, AGPL) |
| API | FastAPI |
| Agents | SpaceXAI / xAI (`XAI_API_KEY`, `grok-4.5`) with deterministic fallbacks |
| Client | Vite + React + TypeScript + React Three Fiber |

## Tests

```bash
cd backend && pytest
cd frontend && npm test
```
