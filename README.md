<p align="center">
  <img
    src="https://raw.githubusercontent.com/iblameandrew/causality/main/public/banner-tree-rings.jpg"
    alt="Causality — organic tree with hierarchical rotating attention rings"
    width="100%"
  />
</p>

# Causality

**Work in progress.**

Causality is an experiment in hyperrealistic simulation — modeling how people react to a given set of words, and how the impulse of those initial words sets an entire closed system in motion, branching into new scenarios, personas, and collective behavior.

Think of each cell not as a static node, but as a **living tree**: an organic form rooted in history, with branches that reach into the present, and **rings that rotate** around it at different speeds. Fast rings at the canopy catch what is immediate. Slower rings along the branches cycle through lived memory. The deepest ring at the roots turns almost imperceptibly — surfacing what the cell has always carried.

A scenario is decomposed into verbs and nouns arranged on a semantic gradient. Each word becomes one of these trees — a cell with its own personality, memory, and disposition. When language is uttered into the field, cells resonate through their current rings, cluster, and recombine — propagating the first impulse outward like growth through meaning itself.

The aim is not a static word cloud, but a breathing forest where initial conditions matter: the words you seed determine who emerges, how they hear you, and what scenarios unfold from the first spark.

---

## Rotatory Attention

Every cell that has emanated a persona carries a **rotatory attention system** — the tree and its rings. Personality is not a single fixed disposition; it is a set of elements that cycle at hierarchical speeds. What the cell attends to at any moment is whatever its currently active elements **ensemble** into a referential frame, like rings aligning around the same trunk at once.

### Attention elements

Each element is a lens the cell can look through:

- **Qualifier** — a sensory or personality quality (e.g. `hot`, `sticky`, `wary`)
- **Referents** — the things that quality attends to (words, concepts, sensations drawn from traits, verbs, nouns, or memory)
- **Depth** — which rotation ring the element belongs to

Elements are generated with each persona (6–10 per cell, spread across depths) or derived automatically from traits, verbs, nouns, and memory layers.

### Three hierarchical rings

Each cell is wrapped in three independent rings, like the banner above — organic tree, rotating halos. **Depth is relative to speed**: the slower the ring, the deeper it sits in the cell's history.

| Ring | Period | Speed | Tree | Source | Meaning |
|------|--------|-------|------|--------|---------|
| **Surface** | 4 ticks | Fast | Canopy | traits, verbs, nouns | Present disposition — what the cell feels *right now* |
| **Memory** | 16 ticks | Mid | Branches | recent memory layers | Lived experience cycling through awareness |
| **Deep** | 64 ticks | Slow | Roots | oldest memory layers | Historical roots — what the cell has always carried |

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

When the deep ring — the one at the roots — reaches the **peak** of its current slot (the first ~28% of that element's turn), the cell enters **deep listening**. The slowest rotation has aligned; something from the bottom of its history rises through the trunk. The tree listens from its roots. Deep listening amplifies salience by 35% and is visible in the 3D view (larger persona orb, slower rotation, violet glow) and in the Persona panel.

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