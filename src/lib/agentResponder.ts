import type { AttentionState, Persona, SuperCell, WordCell } from '../types';

function activeMemoryLayer(persona: Persona, attention?: AttentionState) {
  const deepEl = attention?.ensemble.find((e) => e.depth === 'deep' && e.sourceId);
  if (deepEl?.sourceId) {
    return persona.memoryRegistry.find((m) => m.id === deepEl.sourceId);
  }

  const memEl = attention?.ensemble.find((e) => e.depth === 'memory' && e.sourceId);
  if (memEl?.sourceId) {
    return persona.memoryRegistry.find((m) => m.id === memEl.sourceId);
  }

  return persona.memoryRegistry[0];
}

export function buildRuntimePrompt(
  cell: WordCell,
  utterance: string,
): { system: string; user: string } | null {
  if (!cell.persona) return null;

  const { persona, attention } = cell;
  const layer = activeMemoryLayer(persona, attention);
  const focus = attention?.focusPrompt ?? 'Attending broadly.';

  const depthNote = attention?.deepListening
    ? 'A deep, slow rotation has surfaced — you are listening from the roots of your history.'
    : 'Surface and memory rotations are cycling through your present awareness.';

  return {
    system: `${persona.systemPrompt}\n\n[ROTATORY ATTENTION]\n${focus}\n${depthNote}`,
    user: layer
      ? `[Active memory (${layer.title}): ${layer.narrative} — felt as ${layer.emotionalTone}]\nUtterance: "${utterance}"\nRespond only through the referential frame of your current attention ensemble.`
      : `Utterance: "${utterance}"\nRespond only through the referential frame of your current attention ensemble.`,
  };
}

export function buildSuperCellPrompt(
  superCell: SuperCell,
  members: WordCell[],
  utterance: string,
): { system: string; user: string } {
  const deepMembers = members.filter((m) => m.attention?.deepListening);
  const spokes = deepMembers.length > 0 ? deepMembers : members.filter((m) => m.attention?.salience);

  const memberContexts = spokes
    .slice(0, 4)
    .map((m) => {
      const ens = m.attention?.ensemble.map((e) => e.qualifier).join(' + ') ?? m.word;
      return `${m.persona?.name ?? m.word}: [${ens}]`;
    })
    .join('\n');

  const depthNote = superCell.deepListening
    ? 'The collective is attuned to deep historical roots — slow rotations have aligned.'
    : 'The collective rotates through member attentions.';

  return {
    system: `${superCell.combinedPrompt}\n\n[HIERARCHICAL ENSEMBLE]\n${superCell.ensemblePrompt ?? ''}\n${depthNote}`,
    user: `Member rotations:\n${memberContexts}\n\nUtterance: "${utterance}"\nRespond as the collective, honoring each member's referential frame.`,
  };
}