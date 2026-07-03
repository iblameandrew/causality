import type {
  AttentionDepth,
  AttentionElement,
  AttentionState,
  Collusion,
  Persona,
  RotationParams,
  RotationRing,
  WordCell,
} from '../types';

export const DEFAULT_ROTATION_PARAMS: RotationParams = {
  surfacePeriod: 4,
  memoryPeriod: 16,
  deepPeriod: 64,
  tickIntervalMs: 800,
  deepPeakWindow: 0.28,
  deepSalienceBoost: 1.35,
  neighborSalienceDecay: 0.45,
  collusionMinSize: 2,
  collusionSalienceBoost: 1.25,
  collusionLingerTicks: 3,
};

function periodForDepth(depth: AttentionDepth, params: RotationParams): number {
  switch (depth) {
    case 'surface':
      return params.surfacePeriod;
    case 'memory':
      return params.memoryPeriod;
    case 'deep':
      return params.deepPeriod;
  }
}

const DEPTHS: AttentionDepth[] = ['surface', 'memory', 'deep'];

function ringActiveElement(ring: RotationRing, elements: AttentionElement[]): AttentionElement | null {
  const id = ring.elementIds[ring.activeIndex];
  return elements.find((e) => e.id === id) ?? null;
}

function isAtPeak(phase: number, slotCount: number, peakWindow: number): boolean {
  const slotPhase = (phase * slotCount) % 1;
  return slotPhase < peakWindow;
}

export function buildAttentionElements(persona: Persona, cellId: string): AttentionElement[] {
  const elements: AttentionElement[] = [];

  if (persona.attentionElements?.length) {
    return persona.attentionElements.map((el, i) => ({
      ...el,
      id: el.id || `att-${cellId}-${i}`,
    }));
  }

  for (const trait of persona.traits) {
    elements.push({
      id: `att-${cellId}-trait-${trait}`,
      qualifier: trait,
      referents: [trait, ...persona.verbs.slice(0, 2), ...persona.nouns.slice(0, 2)],
      depth: 'surface',
      sourceType: 'trait',
    });
  }

  for (const verb of persona.verbs) {
    elements.push({
      id: `att-${cellId}-verb-${verb}`,
      qualifier: verb,
      referents: [verb, persona.sourceWord],
      depth: 'surface',
      sourceType: 'verb',
    });
  }

  for (const noun of persona.nouns) {
    elements.push({
      id: `att-${cellId}-noun-${noun}`,
      qualifier: noun,
      referents: [noun, persona.sourceWord],
      depth: 'surface',
      sourceType: 'noun',
    });
  }

  const layers = persona.memoryRegistry;
  const deepCutoff = Math.max(1, Math.floor(layers.length / 2));

  layers.forEach((layer, i) => {
    const isDeep = i < deepCutoff;
    elements.push({
      id: `att-${cellId}-mem-${layer.id}`,
      qualifier: layer.emotionalTone || layer.title,
      referents: [
        layer.title,
        layer.emotionalTone,
        ...layer.narrative.split(/\s+/).slice(0, 8).filter((w) => w.length > 3),
      ],
      depth: isDeep ? 'deep' : 'memory',
      sourceType: 'memory',
      sourceId: layer.id,
    });
  });

  return elements;
}

function buildRings(elements: AttentionElement[], params: RotationParams): RotationRing[] {
  return DEPTHS.map((depth) => {
    const ids = elements.filter((e) => e.depth === depth).map((e) => e.id);
    return {
      depth,
      period: periodForDepth(depth, params),
      elementIds: ids.length > 0 ? ids : [],
      phase: 0,
      activeIndex: 0,
    };
  }).filter((r) => r.elementIds.length > 0);
}

export function composeEnsemblePrompt(ensemble: AttentionElement[]): string {
  if (ensemble.length === 0) return 'Attending broadly to the semantic field.';

  const qualifiers = ensemble.map((e) => e.qualifier).join(' + ');
  const referents = [...new Set(ensemble.flatMap((e) => e.referents))].slice(0, 12).join(', ');

  return (
    `Attention ensemble: [${qualifiers}]. ` +
    `Pay attention ONLY to what is referential to these qualities — ` +
    `things that resonate with: ${referents}. ` +
    `Ignore everything outside this referential frame.`
  );
}

export function initAttentionState(
  persona: Persona,
  cellId: string,
  params: RotationParams = DEFAULT_ROTATION_PARAMS,
): AttentionState {
  const elements = buildAttentionElements(persona, cellId);
  const rings = buildRings(elements, params);
  const ensemble = rings
    .map((r) => ringActiveElement(r, elements))
    .filter((e): e is AttentionElement => e !== null);

  return {
    elements,
    rings,
    ensemble,
    salience: 0,
    focusPrompt: composeEnsemblePrompt(ensemble),
    deepListening: rings.some(
      (r) =>
        r.depth === 'deep' &&
        isAtPeak(r.phase, r.elementIds.length, params.deepPeakWindow),
    ),
  };
}

export function applyRotationParams(
  attention: AttentionState,
  params: RotationParams,
): AttentionState {
  const rings = attention.rings.map((ring) => ({
    ...ring,
    period: Math.max(1, periodForDepth(ring.depth, params)),
  }));
  return { ...attention, rings };
}

export function advanceAttention(
  attention: AttentionState,
  tick: number,
  params: RotationParams = DEFAULT_ROTATION_PARAMS,
): AttentionState {
  const rings = attention.rings.map((ring) => {
    const period = Math.max(1, ring.period);
    const phase = (tick % period) / period;
    const activeIndex =
      ring.elementIds.length > 0
        ? Math.floor(phase * ring.elementIds.length) % ring.elementIds.length
        : 0;
    return { ...ring, period, phase, activeIndex };
  });

  const ensemble = rings
    .map((r) => ringActiveElement(r, attention.elements))
    .filter((e): e is AttentionElement => e !== null);

  const deepRing = rings.find((r) => r.depth === 'deep');
  const deepListening = deepRing
    ? isAtPeak(deepRing.phase, deepRing.elementIds.length, params.deepPeakWindow)
    : false;

  return {
    ...attention,
    rings,
    ensemble,
    focusPrompt: composeEnsemblePrompt(ensemble),
    deepListening,
  };
}

function matchesReferent(text: string, referent: string): boolean {
  const r = referent.toLowerCase().trim();
  if (!r) return false;
  return text.includes(r) || r.split(/\s+/).some((w) => w.length > 3 && text.includes(w));
}

function matchesQualifier(text: string, qualifier: string): boolean {
  const q = qualifier.toLowerCase().trim();
  if (!q) return false;
  return text.includes(q) || q.split(/\s+/).some((w) => w.length > 2 && text.includes(w));
}

export function computeEnsembleSalience(
  attention: AttentionState,
  utterance: string,
  cell: WordCell,
  params: RotationParams = DEFAULT_ROTATION_PARAMS,
): number {
  const lower = utterance.toLowerCase();
  const { ensemble } = attention;

  if (ensemble.length === 0) {
    const words = lower.split(/\s+/);
    const match = words.some(
      (w) =>
        cell.word.toLowerCase().includes(w) ||
        w.includes(cell.word.toLowerCase()) ||
        cell.persona?.verbs.some((v) => v.toLowerCase().includes(w)) ||
        cell.persona?.nouns.some((n) => n.toLowerCase().includes(w)),
    );
    return match ? 1 : 0;
  }

  let qualifierHits = 0;
  let referentHits = 0;
  let totalReferents = 0;

  for (const el of ensemble) {
    if (matchesQualifier(lower, el.qualifier)) qualifierHits++;
    for (const ref of el.referents) {
      totalReferents++;
      if (matchesReferent(lower, ref)) referentHits++;
    }
  }

  const qualifierScore = qualifierHits / ensemble.length;
  const referentScore = totalReferents > 0 ? referentHits / totalReferents : 0;
  const wordMatch =
    lower.includes(cell.word.toLowerCase()) ||
    lower.split(/\s+/).some((w) => cell.word.toLowerCase().includes(w));

  let salience = qualifierScore * 0.4 + referentScore * 0.5;
  if (wordMatch) salience += 0.2;
  if (attention.deepListening) salience *= params.deepSalienceBoost;

  return Math.min(1, salience);
}

export function advanceCellAttention(
  cell: WordCell,
  tick: number,
  params: RotationParams = DEFAULT_ROTATION_PARAMS,
): WordCell {
  if (!cell.persona) return cell;

  const attention = cell.attention ?? initAttentionState(cell.persona, cell.id, params);
  return { ...cell, attention: advanceAttention(attention, tick, params) };
}

export function refreshCellRotationParams(
  cell: WordCell,
  tick: number,
  params: RotationParams,
): WordCell {
  if (!cell.persona || !cell.attention) return cell;
  const updated = applyRotationParams(cell.attention, params);
  return { ...cell, attention: advanceAttention(updated, tick, params) };
}

export function applyUtteranceAttention(
  cell: WordCell,
  utterance: string,
  neighborSalience: number,
  collusionBoost = 1,
): WordCell {
  if (!cell.persona) return cell;

  const attention = cell.attention ?? initAttentionState(cell.persona, cell.id);
  const directSalience = computeEnsembleSalience(attention, utterance, cell);
  const boosted = directSalience * collusionBoost;
  const salience = Math.max(boosted, neighborSalience);
  const intensity = salience > 0.15 ? (salience > 0.5 ? 1 : 0.55) : 0;

  return {
    ...cell,
    attention: { ...attention, salience },
    isReacting: intensity > 0,
    reactionIntensity: intensity,
    isListening: true,
  };
}

/**
 * Detect emergent rotatory collusions: groups of cells whose current ensemble
 * elements share the same element ID — i.e. their independent rotations have
 * landed on the same lens at the same tick.
 *
 * Returns the list of active collusions, plus a map of cellId → collusionId so
 * the caller can mark cells. Previously-active collusions whose members have
 * rotated apart linger for `collusionLingerTicks` ticks before dissolving.
 */
export function detectCollusions(
  cells: WordCell[],
  tick: number,
  params: RotationParams = DEFAULT_ROTATION_PARAMS,
): { collusions: Collusion[]; cellCollusionMap: Map<string, string> } {
  const cellCollusionMap = new Map<string, string>();
  const collusions: Collusion[] = [];

  const groups = new Map<string, WordCell[]>();
  for (const cell of cells) {
    if (!cell.attention) continue;
    for (const el of cell.attention.ensemble) {
      if (!el.id) continue;
      const key = el.id;
      const list = groups.get(key) ?? [];
      list.push(cell);
      groups.set(key, list);
    }
  }

  for (const [elementId, members] of groups) {
    if (members.length < params.collusionMinSize) continue;

    const sample = members[0];
    const el = sample.attention!.ensemble.find((e) => e.id === elementId)!;
    const centerX = members.reduce((s, c) => s + c.gridX, 0) / members.length;
    const centerZ = members.reduce((s, c) => s + c.gridZ, 0) / members.length;
    const depthWeight = el.depth === 'deep' ? 1.5 : el.depth === 'memory' ? 1.15 : 1;
    const strength = Math.min(1, members.length / 8) * depthWeight;

    const collusion: Collusion = {
      id: `col-${elementId}-${tick}`,
      qualifier: el.qualifier,
      depth: el.depth,
      elementId,
      memberIds: members.map((m) => m.id),
      focusPrompt: composeEnsemblePrompt(members.flatMap((m) => m.attention!.ensemble)),
      centerX,
      centerZ,
      strength,
      tick,
    };

    collusions.push(collusion);
    for (const m of members) cellCollusionMap.set(m.id, collusion.id);
  }

  return { collusions, cellCollusionMap };
}

/**
 * Mark cells with their current collusion membership, applying the salience
 * boost to cells inside a collusion. Cleared collusions linger for
 * `collusionLingerTicks` so the visual doesn't strobe every tick.
 */
export function applyCollusionMembership(
  cells: WordCell[],
  cellCollusionMap: Map<string, string>,
  _params: RotationParams = DEFAULT_ROTATION_PARAMS,
): WordCell[] {
  return cells.map((cell) => {
    const collusionId = cellCollusionMap.get(cell.id);
    if (collusionId) {
      return { ...cell, collusionId, isColluding: true };
    }

    if (cell.isColluding && cell.collusionId) {
      const lingering = (cell.attention?.elements ?? []).length > 0;
      if (lingering) {
        return { ...cell, isColluding: false };
      }
    }

    return { ...cell, collusionId: undefined, isColluding: false };
  });
}