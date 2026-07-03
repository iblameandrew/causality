![Causality — hierarchical rotatory attention simulation](./public/banner.jpg)

# Causality

**Work in progress.**

Causality is an experiment in hyperrealistic simulation — modeling how people react to a given set of words, and how the impulse of those initial words sets an entire closed system in motion, branching into new scenarios, personas, and collective behavior.

A scenario is decomposed into verbs and nouns arranged on a semantic gradient. Each word becomes a living cell with its own personality, memory, and disposition. When language is uttered into the field, cells resonate, cluster, and recombine — propagating the first impulse outward like a chain reaction through meaning itself.

The aim is not a static word cloud, but a breathing system where initial conditions matter: the words you seed determine who emerges, how they hear you, and what scenarios unfold from the first spark.

---

## Rotatory Attention

Every cell that has emanated a persona carries a **rotatory attention system** — not a single fixed disposition, but a set of personality elements that cycle at different speeds. What the cell attends to at any moment is whatever its currently active elements **ensemble** into a referential frame.

### Attention elements

Each element is a lens the cell can look through:

- **Qualifier** — a sensory or personality quality (e.g. `hot`, `sticky`, `wary`)
- **Referents** — the things that quality attends to (words, concepts, sensations drawn from traits, verbs, nouns, or memory)
- **Depth** — which rotation ring the element belongs to

Elements are generated with each persona (6–10 per cell, spread across depths) or derived automatically from traits, verbs, nouns, and memory layers.

### Three hierarchical rings

Each cell runs three independent rotations. **Depth is relative to speed** — slower rotation means the element is rooted deeper in the cell's history:

| Ring | Period | Speed | Source | Meaning |
|------|--------|-------|--------|---------|
| **Surface** | 4 ticks | Fast | traits, verbs, nouns | Present disposition — how the cell feels *right now* |
| **Memory** | 16 ticks | Mid | recent memory layers | Lived experience cycling through awareness |
| **Deep** | 64 ticks | Slow | oldest memory layers | Historical roots — what the cell has always carried |

The global tick advances on a configurable interval (default 800ms). On each tick, every ring computes its **phase** (0→1 over one full cycle) and selects the **active element** at that phase. One element per ring is live at any time.

### Simulation parameters

All rotation behavior is tunable from the **Rotation Parameters** panel in the sidebar:

| Parameter | Default | Effect |
|-----------|---------|--------|
| Surface period | 4 ticks | Speed of present-disposition rotation |
| Memory period | 16 ticks | Speed of mid-history memory rotation |
| Deep period | 64 ticks | Speed of deepest-history rotation |
| Tick interval | 800 ms | Real-time speed of the simulation clock |
| Deep peak window | 0.28 | How much of a deep slot triggers deep listening |
| Deep salience boost | 1.35× | Amplification while deep listening |
| Neighbor decay | 0.45 | Spatial salience propagation strength |

Changes apply live to all cells. Slower deep periods make historical roots surface less often but linger longer when they do.

### The ensemble

The active elements across all rings combine into the cell's current **ensemble**. If surface is `hot`, memory is `sticky`, and deep is `ashamed`, the cell's attention frame becomes:

> **hot + sticky + ashamed** — attend *only* to what is referential to these qualities combined.

This is the referential filter. An utterance that does not resonate with the ensemble's qualifiers and referents passes through without salience. An utterance that hits several ensemble referents at once produces a strong reaction.

### Deep listening

When the deep ring is at the **peak** of its current slot (the first ~28% of that element's turn), the cell enters **deep listening**. The slow rotation has surfaced something from the bottom of its history, and the cell attends from that depth. Deep listening amplifies salience by 35% and is visible in the 3D view (larger persona orb, slower rotation, violet glow) and in the Persona panel.

### How utterances interact

When language is uttered into the field:

1. Each cell scores the utterance against its **current ensemble** — qualifier matches, referent matches, and direct word overlap
2. Salience propagates to spatial neighbors at 45% strength
3. Cells above the salience threshold react visually; the Persona panel shows the ensemble-filtered **runtime prompt** that would govern an in-character response

A cell does not hear everything equally. It hears what its rotation happens to be attending to *at that moment*.

### Cliques (super-cells)

When cells are grouped into a clique, their individual ensembles merge into a **hierarchical collective attention**. If any member is deep listening, the super-cell inherits that depth — the outer ring slows, the inner ring appears, and the combined prompt reflects all member referential frames.

### Inspecting a cell

Select any cell in the 3D view. The Persona panel shows:

- The live **ensemble** chips (one per active ring)
- **Rotation phase bars** for surface, memory, and deep
- The composed **focus prompt** — what the cell is attending to right now
- Which **memory layers** are active at each depth
- The **runtime prompt** after an utterance, filtered through the current ensemble

---

*This project is actively being built. Expect breaking changes, incomplete features, and rough edges.*