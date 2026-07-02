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
    .map((c) => c.persona!.systemPrompt.slice(0, 120))
    .join('\n---\n');

  return {
    id: `super-${Date.now()}`,
    memberIds,
    name: name ?? `Clique: ${words.slice(0, 40)}`,
    combinedPrompt: prompts || `A collective consciousness formed from: ${words}`,
    centerX,
    centerZ,
  };
}

export function findResonantNeighbors(
  cell: WordCell,
  allCells: WordCell[],
  radius = 2,
): WordCell[] {
  return allCells.filter((other) => {
    if (other.id === cell.id) return false;
    const dx = Math.abs(other.gridX - cell.gridX);
    const dz = Math.abs(other.gridZ - cell.gridZ);
    return dx <= radius && dz <= radius && other.polarity === cell.polarity;
  });
}