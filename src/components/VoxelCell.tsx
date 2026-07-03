import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { gridToWorld } from '../lib/gridLayout';
import type { AttentionElement, RotationRing, WordCell } from '../types';

interface Props {
  cell: WordCell;
  tick: number;
  isSelected: boolean;
  isCliqueSelected: boolean;
  onClick: () => void;
}

const RELATED_VERB = '#4ecdc4';
const RELATED_NOUN = '#45b7d1';
const ANTONYM_VERB = '#ff6b6b';
const ANTONYM_NOUN = '#feca57';

const DEPTH_COLOR: Record<string, string> = {
  surface: '#4ecdc4',
  memory: '#ffeaa7',
  deep: '#6c5ce7',
};

const DEPTH_RADIUS: Record<string, number> = {
  surface: 0.95,
  memory: 1.35,
  deep: 1.8,
};

const DEPTH_HEIGHT: Record<string, number> = {
  surface: 0.95,
  memory: 1.6,
  deep: 2.3,
};

const DEPTH_OPACITY: Record<string, number> = {
  surface: 0.45,
  memory: 0.35,
  deep: 0.25,
};

export function VoxelCell({
  cell,
  tick,
  isSelected,
  isCliqueSelected,
  onClick,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const orbsRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const [wx, , wz] = gridToWorld(cell.gridX, cell.gridZ);

  const baseColor = useMemo(() => {
    if (cell.polarity === 'related') {
      return cell.type === 'verb' ? RELATED_VERB : RELATED_NOUN;
    }
    return cell.type === 'verb' ? ANTONYM_VERB : ANTONYM_NOUN;
  }, [cell.polarity, cell.type]);

  const attention = cell.attention;
  const rings = attention?.rings ?? [];
  const elements = attention?.elements ?? [];
  const elementsById = useMemo(() => {
    const map = new Map<string, AttentionElement>();
    for (const e of elements) map.set(e.id, e);
    return map;
  }, [elements]);

  const activeElementForRing = (ring: RotationRing): AttentionElement | null => {
    const id = ring.elementIds[ring.activeIndex];
    return id ? elementsById.get(id) ?? null : null;
  };

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const deepListening = attention?.deepListening ?? false;
    const surfacePhase = rings.find((r) => r.depth === 'surface')?.phase ?? 0;

    if (groupRef.current) {
      const breathe = Math.sin(t * 1.2 + cell.gridX * 0.3) * 0.04;
      const reactBounce = cell.isReacting ? Math.sin(t * 12) * 0.15 * cell.reactionIntensity : 0;
      const deepPulse = deepListening ? Math.sin(t * 0.8) * 0.08 : 0;
      groupRef.current.position.y = breathe + reactBounce + deepPulse;
    }

    if (meshRef.current) {
      const rotSpeed = deepListening ? 0.12 : 0.5 + surfacePhase * 0.3;
      meshRef.current.rotation.y = Math.sin(t * rotSpeed + cell.gridX) * (deepListening ? 0.18 : 0.08);
      meshRef.current.rotation.x = Math.sin(t * 0.3 + cell.gridZ) * 0.04;
    }

    if (glowRef.current) {
      const salience = attention?.salience ?? 0;
      const glowScale = cell.isReacting
        ? 1.4 + Math.sin(t * 10) * 0.25
        : deepListening
          ? 1.3 + Math.sin(t * 0.6) * 0.15
          : !cell.persona
            ? 1.2 + Math.sin(t * 4) * 0.1
            : 1 + salience * 0.4;
      glowRef.current.scale.setScalar(glowScale);
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = cell.isReacting
        ? 0.5 * cell.reactionIntensity + salience * 0.25
        : deepListening
          ? 0.4 + Math.sin(t * 0.6) * 0.12
          : !cell.persona
            ? 0.25 + Math.sin(t * 4) * 0.12
            : 0.12 + salience * 0.25;
    }

    if (ringsRef.current) {
      ringsRef.current.children.forEach((ringMesh, i) => {
        const ring = rings[i];
        if (!ring) return;
        const dir = ring.depth === 'memory' ? -1 : 1;
        const speed = ring.depth === 'deep' ? 0.05 : ring.depth === 'memory' ? 0.12 : 0.22;
        (ringMesh as THREE.Mesh).rotation.y += 0.003 * dir * (1 + speed * 4);
      });
    }

    if (orbsRef.current) {
      orbsRef.current.children.forEach((orbGroup, i) => {
        const ring = rings[i];
        if (!ring) return;
        const el = activeElementForRing(ring);
        const orb = orbGroup.children[0] as THREE.Mesh | undefined;
        const ringMesh = ringsRef.current?.children[i] as THREE.Mesh | undefined;
        if (!orb || !ringMesh) return;

        const count = ring.elementIds.length;
        if (count === 0) {
          orb.visible = false;
          return;
        }
        orb.visible = true;

        const ringWorldY = DEPTH_HEIGHT[ring.depth];
        const ringRadius = DEPTH_RADIUS[ring.depth];
        const phase = ring.phase * Math.PI * 2;
        const dir = ring.depth === 'memory' ? -1 : 1;
        const baseAngle = phase * dir + ringMesh.rotation.y;
        orb.position.x = Math.cos(baseAngle) * ringRadius;
        orb.position.z = Math.sin(baseAngle) * ringRadius;
        orb.position.y = ringWorldY;

        const isActive = el != null;
        const orbScale = isActive
          ? (ring.depth === 'deep' ? 0.18 : ring.depth === 'memory' ? 0.16 : 0.14)
          : 0.08;
        orb.scale.setScalar(orbScale * (isActive ? 1 + Math.sin(t * 4) * 0.15 : 1));
        const mat = orb.material as THREE.MeshStandardMaterial;
        const color = DEPTH_COLOR[ring.depth] ?? '#ffffff';
        mat.color.set(color);
        mat.emissive.set(color);
        mat.emissiveIntensity = isActive ? 1.2 : 0.3;
      });
    }

    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      const opacity = deepListening
        ? 0.5 + Math.sin(t * 1.2) * 0.2
        : cell.isReacting
          ? 0.4 + cell.reactionIntensity * 0.4
          : 0.18;
      mat.opacity = opacity;
      const scaleY = deepListening ? 1.4 : 1;
      beamRef.current.scale.y = scaleY;
    }
  });

  const attentionSalience = attention?.salience ?? 0;
  const deepListening = attention?.deepListening ?? false;

  const emissiveIntensity = cell.isReacting
    ? 0.8 * cell.reactionIntensity + attentionSalience * 0.3
    : deepListening
      ? 0.55 + Math.sin(tick * 0.15) * 0.15
      : isSelected
        ? 0.5
        : isCliqueSelected
          ? 0.4
          : !cell.persona
            ? 0.35 + Math.sin(tick * 0.5) * 0.1
            : 0.18 + attentionSalience * 0.25;

  return (
    <group position={[wx, 0, wz]}>
      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          position={[0, 0.4, 0]}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          castShadow
        >
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={emissiveIntensity}
            roughness={0.5}
            metalness={0.15}
          />
        </mesh>

        <mesh ref={glowRef} position={[0, 0.4, 0]}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.1}
            side={THREE.BackSide}
          />
        </mesh>

        <mesh position={[0, 0.05, 0]} receiveShadow>
          <cylinderGeometry args={[0.55, 0.6, 0.1, 6]} />
          <meshStandardMaterial color="#2d3436" roughness={0.9} metalness={0.2} />
        </mesh>

        <mesh ref={beamRef} position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.12, 2.4, 8, 1, true]} />
          <meshBasicMaterial
            color={deepListening ? '#6c5ce7' : baseColor}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        <group ref={ringsRef}>
          {rings.map((ring) => {
            const r = DEPTH_RADIUS[ring.depth] ?? 1;
            const tube = ring.depth === 'deep' ? 0.04 : ring.depth === 'memory' ? 0.035 : 0.03;
            const color = DEPTH_COLOR[ring.depth] ?? '#ffffff';
            const opacity = DEPTH_OPACITY[ring.depth] ?? 0.3;
            return (
              <mesh
                key={ring.depth}
                position={[0, DEPTH_HEIGHT[ring.depth] ?? 1, 0]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <torusGeometry args={[r, tube, 8, 48]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={deepListening && ring.depth === 'deep' ? 1.2 : 0.6}
                  transparent
                  opacity={opacity}
                />
              </mesh>
            );
          })}
        </group>

        <group ref={orbsRef}>
          {rings.map((ring) => {
            const color = DEPTH_COLOR[ring.depth] ?? '#ffffff';
            return (
              <group key={ring.depth}>
                <mesh>
                  <sphereGeometry args={[1, 12, 12]} />
                  <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={1.2}
                    transparent
                    opacity={0.95}
                  />
                </mesh>
              </group>
            );
          })}
        </group>

        <Text
          position={[0, 1.05, 0]}
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
          position={[0, 0.4, 0.41]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {cell.type === 'verb' ? 'V' : 'N'}
        </Text>

        {cell.persona ? (
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[deepListening ? 0.12 : 0.09, 10, 10]} />
            <meshStandardMaterial
              color={deepListening ? '#6c5ce7' : '#a29bfe'}
              emissive={deepListening ? '#6c5ce7' : '#a29bfe'}
              emissiveIntensity={deepListening ? 1.1 : 0.7}
            />
          </mesh>
        ) : (
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial
              color="#ffeaa7"
              emissive="#ffeaa7"
              emissiveIntensity={0.8}
              transparent
              opacity={0.7}
            />
          </mesh>
        )}

        {cell.cliqueId && (
          <mesh position={[0, 1.7, 0]}>
            <octahedronGeometry args={[0.1]} />
            <meshStandardMaterial
              color="#fd79a8"
              emissive="#fd79a8"
              emissiveIntensity={0.6}
            />
          </mesh>
        )}

        {cell.isColluding && (
          <mesh position={[0, 2.0, 0]}>
            <torusGeometry args={[0.18, 0.025, 6, 16]} />
            <meshStandardMaterial
              color="#ffeaa7"
              emissive="#ffeaa7"
              emissiveIntensity={0.9}
              transparent
              opacity={0.85}
            />
          </mesh>
        )}
      </group>
    </group>
  );
}