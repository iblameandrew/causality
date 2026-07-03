import { useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid } from '@react-three/drei';
import * as THREE from 'three';
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
  const viewYaw = useAppStore((s) => s.viewYaw);
  const viewTilt = useAppStore((s) => s.viewTilt);
  const viewZoom = useAppStore((s) => s.viewZoom);

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
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 8, -5]} intensity={0.3} color="#a29bfe" />

      <IsometricPlatform cells={cells} />

      <Grid
        args={[60, 60]}
        cellSize={1.6}
        cellThickness={0.4}
        cellColor="#3a3a52"
        sectionSize={8}
        sectionThickness={1}
        sectionColor="#5a5a78"
        fadeDistance={80}
        position={[0, -0.02, 0]}
        infiniteGrid={false}
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

      <IsometricCamera yaw={viewYaw} tilt={viewTilt} zoom={viewZoom} />
    </>
  );
}

function IsometricPlatform({ cells }: { cells: { gridX: number; gridZ: number }[] }) {
  const tiles = useMemo(() => {
    if (cells.length === 0) return [];
    const xs = cells.map((c) => c.gridX);
    const zs = cells.map((c) => c.gridZ);
    const minX = Math.floor(Math.min(...xs)) - 2;
    const maxX = Math.ceil(Math.max(...xs)) + 2;
    const minZ = Math.floor(Math.min(...zs)) - 2;
    const maxZ = Math.ceil(Math.max(...zs)) + 2;
    const spacing = 1.6;
    const out: { x: number; z: number; key: string }[] = [];
    for (let gx = minX; gx <= maxX; gx++) {
      for (let gz = minZ; gz <= maxZ; gz++) {
        out.push({ x: gx * spacing, z: gz * spacing, key: `${gx}:${gz}` });
      }
    }
    return out;
  }, [cells]);

  return (
    <group position={[0, -0.08, 0]}>
      {tiles.map(({ x, z, key }) => (
        <mesh key={key} position={[x, 0, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[0.78, 6]} />
          <meshStandardMaterial
            color="#1a1a2e"
            emissive="#0d0d1a"
            emissiveIntensity={0.5}
            roughness={0.85}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function IsometricCamera({
  yaw,
  tilt,
  zoom,
}: {
  yaw: number;
  tilt: number;
  zoom: number;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.up.set(0, 1, 0);
  }, [camera]);

  useFrame(() => {
    const radius = 30 / Math.max(0.4, zoom);
    const tiltRad = tilt;
    const x = Math.sin(yaw) * Math.cos(tiltRad) * radius;
    const z = Math.cos(yaw) * Math.cos(tiltRad) * radius;
    const y = Math.sin(tiltRad) * radius;
    camera.position.set(x, y, z);
    camera.lookAt(0, 1.5, 0);
  });

  return null;
}

function useResponsiveZoom(): number {
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 600) setZoom(0.75);
      else if (w < 900) setZoom(0.88);
      else setZoom(1);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return zoom;
}

export function VoxelWorld() {
  const responsiveZoom = useResponsiveZoom();
  const viewZoom = useAppStore((s) => s.viewZoom);
  const setViewZoom = useAppStore((s) => s.setViewZoom);

  useEffect(() => {
    if (viewZoom === 1) setViewZoom(responsiveZoom);
  }, [responsiveZoom, viewZoom, setViewZoom]);

  return (
    <Canvas
      shadows
      orthographic
      camera={{
        position: [22, 22, 22],
        zoom: 4,
        near: 0.1,
        far: 200,
      }}
      style={{ width: '100%', height: '100%', touchAction: 'none' }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0a0a12']} />
      <Scene />
    </Canvas>
  );
}