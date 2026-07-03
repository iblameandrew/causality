import { composeEnsemblePrompt } from './attentionEngine';
import { semanticDistance } from './semanticLayout';
import type { SuperCell, WordCell } from '../types';

export function createSuperCell(
  cells: WordCell[],
  name?: string,
): SuperCell {
  const memberIds = cells.map((c) => c.id);
  const centerX = cells.reduce((s, c) => s + c.gridX, 0) / cells.length;
  const centerZ = cells.reduce((s, c) => s + c.gridZ, 0) / cells.length;

  const words = cells.map((c) => c.word).join(' · ');
  const prompts = cells
    .filter((c) => c.persona)
    .map((c) => {
      const focus = c.attention?.focusPrompt ?? '';
      return `${c.persona!.systemPrompt.slice(0, 80)}\n[${focus.slice(0, 80)}]`;
    })
    .join('\n---\n');

  const allEnsemble = cells.flatMap((c) => c.attention?.ensemble ?? []);
  const deepListening = cells.some((c) => c.attention?.deepListening);

  return {
    id: `super-${Date.now()}`,
    memberIds,
    name: name ?? `Clique: ${words.slice(0, 40)}`,
    combinedPrompt: prompts || `A collective consciousness formed from: ${words}`,
    centerX,
    centerZ,
    ensemblePrompt: composeEnsemblePrompt(allEnsemble),
    deepListening,
  };
}

export function findResonantNeighbors(
  cell: WordCell,
  allCells: WordCell[],
  radius = 2.5,
): WordCell[] {
  return allCells.filter((other) => {
    if (other.id === cell.id) return false;
    const dist = semanticDistance(cell.gridX, cell.gridZ, other.gridX, other.gridZ);
    return dist <= radius;
  });
}