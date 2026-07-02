import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { gridToWorld, conwayNeighborPattern } from '../lib/gridLayout';
import type { WordCell } from '../types';

interface Props {
  cell: WordCell;
  tick: number;
  isSelected: boolean;
  isCliqueSelected: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

const RELATED_VERB = '#4ecdc4';
const RELATED_NOUN = '#45b7d1';
const ANTONYM_VERB = '#ff6b6b';
const ANTONYM_NOUN = '#feca57';

export function VoxelCell({
  cell,
  tick,
  isSelected,
  isCliqueSelected,
  onClick,
  onDoubleClick,
}: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [wx, , wz] = gridToWorld(cell.gridX, cell.gridZ);

  const baseColor = useMemo(() => {
    if (cell.polarity === 'related') {
      return cell.type === 'verb' ? RELATED_VERB : RELATED_NOUN;
    }
    return cell.type === 'verb' ? ANTONYM_VERB : ANTONYM_NOUN;
  }, [cell.polarity, cell.type]);

  const conwayOffset = conwayNeighborPattern(cell.gridX, cell.gridZ, tick);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    const listenPulse = cell.isListening
      ? Math.sin(t * 3 + cell.gridX) * 0.04 + 0.04
      : 0;
    const reactBounce = cell.isReacting
      ? Math.sin(t * 12) * 0.15 * cell.reactionIntensity
      : 0;
    const breathe = Math.sin(t * 1.5 + cell.gridZ * 0.5) * 0.02;

    meshRef.current.position.y = 0.3 + listenPulse + reactBounce + breathe + conwayOffset;
    meshRef.current.rotation.y = Math.sin(t * 0.5 + cell.gridX) * 0.08;

    if (glowRef.current) {
      const glowScale = cell.isReacting
        ? 1.3 + Math.sin(t * 10) * 0.2
        : cell.isListening
          ? 1.1 + Math.sin(t * 2) * 0.05
          : 1;
      glowRef.current.scale.setScalar(glowScale);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = cell.isReacting
        ? 0.5 * cell.reactionIntensity
        : cell.isListening
          ? 0.15 + Math.sin(t * 2) * 0.08
          : 0.05;
    }
  });

  const emissiveIntensity = cell.isReacting
    ? 0.8 * cell.reactionIntensity
    : isSelected
      ? 0.5
      : isCliqueSelected
        ? 0.4
        : 0.15;

  return (
    <group position={[wx, 0, wz]}>
      <mesh ref={glowRef} position={[0, 0.3, 0]}>
        <boxGeometry args={[1.3, 1.3, 1.3]} />
        <meshBasicMaterial
          color={baseColor}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh
        ref={meshRef}
        position={[0, 0.3, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          onDoubleClick();
        }}
        castShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[1.1, 0.1, 1.1]} />
        <meshStandardMaterial color="#2d3436" roughness={0.9} />
      </mesh>

      <Text
        position={[0, 1.1, 0]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.4}
        textAlign="center"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {cell.word}
      </Text>

      <Text
        position={[0, 0.3, 0.51]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {cell.type === 'verb' ? 'V' : 'N'}
      </Text>

      {cell.persona && (
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color="#a29bfe"
            emissive="#a29bfe"
            emissiveIntensity={0.6}
          />
        </mesh>
      )}

      {cell.cliqueId && (
        <mesh position={[0, 1.7, 0]}>
          <octahedronGeometry args={[0.1]} />
          <meshStandardMaterial
            color="#fd79a8"
            emissive="#fd79a8"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}