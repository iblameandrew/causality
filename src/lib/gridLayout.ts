const GRID_COLS = 10;

export function computeGridPositions(count: number): { x: number; z: number }[] {
  const positions: { x: number; z: number }[] = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      x: i % GRID_COLS,
      z: Math.floor(i / GRID_COLS),
    });
  }
  return positions;
}

export function gridToWorld(gx: number, gz: number): [number, number, number] {
  const spacing = 1.6;
  const offsetX = ((GRID_COLS - 1) * spacing) / 2;
  const offsetZ = 4;
  return [gx * spacing - offsetX, 0, gz * spacing - offsetZ];
}

export function conwayNeighborPattern(gx: number, gz: number, tick: number): number {
  const hash = ((gx * 7 + gz * 13 + tick) % 9);
  return hash < 3 ? 0.15 : hash < 6 ? 0.08 : 0;
}