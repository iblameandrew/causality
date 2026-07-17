# Mythology

![Mythology — social simulacra of agentic thoughts](public/banner.jpg)

**Mythology** is a system for social simulacra in which a person is not a single agent, but a **field of thoughts that each carry their own agency** — a living personal mythology that can walk onto a shared field with other people.

Every durable pattern in a psyche—drive, feeling, mind, bond, force, bound, dream—can spawn linguistic children: skills, memories, hybrid mixtures. Those figures are the cast of a mind’s myth. When several people are present, their mythologies **collide, affiliate, or pass each other by**. The battlefield is not metaphor alone; it is an auto-sim where energization, density, and relation decide what wins the moment.

## Idea

People do not think as monoliths. A single chart of temperament is a **root constellation** — the pantheon seeds of one mythology. From each root, a hierarchy unfolds:

- **Root features** — primary modes of being (role × style), the recurring figures of the myth  
- **Mixture features** — hybrid figures that only exist because two modes stand in relation (support, tension, fusion, challenge)  
- **Hierarchical agents** — each feature expands into a named unit with attributes, skills, memories, and a **voice** you can speak with  

Put two or more people on the same field and you get **partisan mythologies**. One person’s structured technique may *need* another’s absorptive comprehension; elsewhere, force-figures grind against bound-figures. The system records that as **affiliation**, **conflict**, or **neutrality**, then lets the units resolve it in motion.

This is social simulacra: not a dialogue of avatars saying lines, but a **swarm of semi-autonomous mental figures** — a mythology that can be watched, inspected, and talked to.

## What runs under the hood

Temperament graphs are computed from birth data via [Kerykeion](https://github.com/g-battaglia/kerykeion) (offline lat/lng/timezone). Implementation language stays **mundane**—roles, styles, links—not horoscope prose. Astrology is only a **feature source** for the mythology.

| Layer | Role in Mythology |
|---|---|
| Kerykeion + FastAPI | Turn a person into a feature graph and a multi-person relation matrix |
| Agent expander (SpaceXAI or fallback) | Name each figure: skills, attributes, memories, conversational voice |
| React + Three.js auto-sim | Drop many people’s myth-units onto one isometric field and let them act |

Combat is social pressure made mechanical: **energization** of a figure, plus **how many other figures stand nearby** (cohesion, overcrowding, focus fire). A lonely idea fights differently from one surrounded by its own lineage.

**License note:** Kerykeion is AGPL-3.0. The library is used server-side; treat distributed combinations as AGPL-compatible if you ship the service.

## Pipeline

1. **Person** — birth data in; a constellation of root figures out  
2. **Emanation** — aspects become mixture figures; LLM/fallback expands hierarchies of agency  
3. **Society** — pairwise stances between mythologies (conflict / affiliation / neutrality)  
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
# Optional: XAI_API_KEY + AGENT_MODE=llm for richer figure names and memories
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

Add **any number of people** (no faction cap — use + chart, +5, or bulk Add N). Set **Units per planet** (simulation parameter: how many units spawn from each planet/root feature). Presets seed a few charts; bulk-add fills diversified birth data. **Generate match** and watch their myth-agents take the field. Inspect any unit for lineage, memories, energization, dialogue, and how crowded its aura is.

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
| POST | `/api/match` | Full multi-person mythology bootstrap |
| GET | `/api/match/{id}` | Cached match |
| POST | `/api/dialogue` | Talk to a unit via its `voice_prompt` |

Each roster unit carries a **`voice_prompt`** — a conversational system prompt so that figure of the mythology can be spoken with. Select a unit in the inspector to open dialogue (LLM if `XAI_API_KEY` is set, otherwise persona fallback).

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
