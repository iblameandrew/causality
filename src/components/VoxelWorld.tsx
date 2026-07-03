import { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { VoxelCell } from './VoxelCell';
import { SuperCellVisual } from './SuperCellVisual';
import { CollusionVisual } from './CollusionVisual';
import { useAppStore } from '../store/appStore';

function Scene() {
  const cells = useAppStore((s) => s.cells);
  const superCells = useAppStore((s) => s.superCells);
  const collusions = useAppStore((s) => s.collusions);
  const tick = useAppStore((s) => s.tick);
  const selectedCellId = useAppStore((s) => s.selectedCellId);
  const selectedForClique = useAppStore((s) => s.selectedForClique);
  const selectCell = useAppStore((s) => s.selectCell);
  const incrementTick = useAppStore((s) => s.incrementTick);
  const tickIntervalMs = useAppStore((s) => s.rotationParams.tickIntervalMs);

  const memberPositions = useMemo(() => {
    const map = new Map<string, [number, number]>();
    for (const c of cells) map.set(c.id, [c.gridX, c.gridZ]);
    return map;
  }, [cells]);

  useEffect(() => {
    const id = setInterval(incrementTick, tickIntervalMs);
    return () => clearInterval(id);
  }, [incrementTick, tickIntervalMs]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={0.3} color="#a29bfe" />

      <Grid
        args={[50, 50]}
        cellSize={1.6}
        cellThickness={0.4}
        cellColor="#636e72"
        sectionSize={8}
        sectionThickness={1}
        sectionColor="#b2bec3"
        fadeDistance={60}
        position={[0, -0.01, 0]}
      />

      {cells.map((cell) => (
        <VoxelCell
          key={cell.id}
          cell={cell}
          tick={tick}
          isSelected={selectedCellId === cell.id}
          isCliqueSelected={selectedForClique.includes(cell.id)}
          onClick={() => selectCell(cell.id)}
        />
      ))}

      {superCells.map((sc) => (
        <SuperCellVisual key={sc.id} superCell={sc} />
      ))}

      {collusions.map((col) => (
        <CollusionVisual
          key={col.id}
          collusion={col}
          memberPositions={memberPositions}
        />
      ))}

      <OrbitControls
        makeDefault
        target={[0, 0.5, 0]}
        minPolarAngle={0.3}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={10}
        maxDistance={55}
        touches={{ ONE: 0, TWO: 2 }}
      />
    </>
  );
}

function useResponsiveCamera() {
  const [camera, setCamera] = useState({ position: [12, 14, 12] as [number, number, number], fov: 45 });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 600) {
        setCamera({ position: [16, 18, 16], fov: 55 });
      } else if (w < 900) {
        setCamera({ position: [14, 16, 14], fov: 50 });
      } else {
        setCamera({ position: [12, 14, 12], fov: 45 });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return camera;
}

export function VoxelWorld() {
  const camera = useResponsiveCamera();
  return (
    <Canvas
      shadows
      camera={{ position: camera.position, fov: camera.fov }}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0a0a12']} />
      <fog attach="fog" args={['#0a0a12', 20, 50]} />
      <Scene />
    </Canvas>
  );
}