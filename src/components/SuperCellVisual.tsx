import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { gridToWorld } from '../lib/gridLayout';
import type { SuperCell } from '../types';

interface Props {
  superCell: SuperCell;
}

export function SuperCellVisual({ superCell }: Props) {
  const ringRef = useRef<THREE.Mesh>(null);
  const [wx, , wz] = gridToWorld(superCell.centerX, superCell.centerZ);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    ringRef.current.position.y = 2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });

  return (
    <group position={[wx, 0, wz]}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.04, 8, 32]} />
        <meshStandardMaterial
          color="#fd79a8"
          emissive="#fd79a8"
          emissiveIntensity={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>

      <Text
        position={[0, 2.5, 0]}
        fontSize={0.2}
        color="#fd79a8"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {superCell.name.slice(0, 30)}
      </Text>
    </group>
  );
}