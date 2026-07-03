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

### Rotatory collusion

Cliques are *declared* — you pick the members. **Collusions are *emergent***: they form on their own when independent rotations land on the same lens.

On every tick, the engine groups cells whose current ensemble shares the same `elementId` (i.e. they happen to be attending through the same qualifier at the same depth). Any group of at least `collusionMinSize` (default 2) becomes a **collusion**:

- A live counter-rotating ring appears at the group's center of mass, color-coded by depth (teal surface / yellow memory / violet deep)
- Translucent lines connect every pair of members, forming a triangulated attention mesh
- Each member gains a small halo above its voxel so you can spot colluding cells at a glance
- Cells in the collusion receive a `collusionSalienceBoost` (default 1.25×) on their next utterance response — colluding cells resonate louder
- When members rotate apart the collusion doesn't snap away instantly — it lingers for `collusionLingerTicks` (default 3) ticks so the dissolution is visible

The collusion carries its own ephemeral `focusPrompt` built from the union of member ensembles. When a colluding cell responds, its runtime prompt gains a `[ROTATORY COLLUSION]` block noting the shared qualifier, depth, and ally count, telling the LLM to honor that collective referential frame.

Collusions are detected fresh every tick — no manual declaration, no persistence. They are the system's way of saying: *these cells, by spinning at the right moment, are looking at the same thing.*

| Parameter | Default | Effect |
|-----------|---------|--------|
| Collusion min size | 2 | Minimum aligned cells to form a collusion |
| Collusion salience boost | 1.25× | Salience multiplier on colluding cells |
| Collusion linger (ticks) | 3 | How long a dissolved collusion stays visible |

### The isometric platform

The voxel world lives on an orthographic isometric stage so rotation is intuitive and visible at a glance.

- **Hex-tile platform** under the grid grounds each cell — the surface fades into a darker plane beyond the populated area
- **Three orbital rings** wrap every cell at different heights and radii:
  - **Surface ring** — tight, teal, low — fastest rotation; circles the cell at the trait/verb/noun tier
  - **Memory ring** — mid, yellow — counter-rotates; mid-history tier
  - **Deep ring** — wide, violet, high — slowest rotation; oldest history. Glows brighter during deep listening.
- **Active element orbs** ride on each ring — a glowing sphere at the current angular position marks the qualifier that ring is currently attending to. Watch the orbs slide around their rings as the simulation ticks — that's rotatory attention in motion.
- **Vertical beam** rises through the cell, tinted by the base color, intensifying during reactions and deep listening

The view controls (top-right overlay) let you rotate the platform 45° at a time (8 cardinal isometric views), tilt the camera, zoom in/out, and reset. The view persists across reloads.

---

### Inspecting a cell

Select any cell in the 3D view. The Persona panel shows:

- The live **ensemble** chips (one per active ring)
- **Rotation phase bars** for surface, memory, and deep
- The composed **focus prompt** — what the cell is attending to right now
- If the cell is currently in a **collusion**, the collusion block shows the shared qualifier, depth, member chips, and collective focus prompt
- Which **memory layers** are active at each depth
- The **runtime prompt** after an utterance, filtered through the current ensemble (and tagged with any active collusion)

---

*This project is actively being built. Expect breaking changes, incomplete features, and rough edges.*
