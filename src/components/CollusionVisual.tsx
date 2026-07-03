import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gridToWorld } from '../lib/gridLayout';
import type { Collusion } from '../types';

interface Props {
  collusion: Collusion;
  memberPositions: Map<string, [number, number]>;
}

export function CollusionVisual({ collusion, memberPositions }: Props) {
  const ringRef = useRef<THREE.Mesh>(null);
  const lineRef = useRef<THREE.LineSegments>(null);

  const [cx, , cz] = gridToWorld(collusion.centerX, collusion.centerZ);

  const color = useMemo(() => {
    switch (collusion.depth) {
      case 'deep':
        return '#6c5ce7';
      case 'memory':
        return '#ffeaa7';
      default:
        return '#4ecdc4';
    }
  }, [collusion.depth]);

  const geometry = useMemo(() => {
    const positions: number[] = [];
    const points = collusion.memberIds
      .map((id) => memberPositions.get(id))
      .filter((p): p is [number, number] => p !== undefined)
      .map(([x, z]) => {
        const [wx, , wz] = gridToWorld(x, z);
        return new THREE.Vector3(wx, 0.4, wz);
      });

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        positions.push(points[i].x, points[i].y, points[i].z);
        positions.push(points[j].x, points[j].y, points[j].z);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geom;
  }, [collusion.memberIds, memberPositions]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.6;
      ringRef.current.position.y = 1.6 + Math.sin(t * 1.4) * 0.08;
    }
    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = 0.35 + Math.sin(t * 2) * 0.15;
    }
  });

  return (
    <group>
      <lineSegments ref={lineRef} geometry={geometry}>
        <lineBasicMaterial color={color} transparent opacity={0.4} />
      </lineSegments>
      <mesh ref={ringRef} position={[cx, 1.6, cz]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6 + collusion.strength * 0.6, 0.03, 6, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}