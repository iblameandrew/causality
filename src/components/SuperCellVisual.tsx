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
  const innerRingRef = useRef<THREE.Mesh>(null);
  const [wx, , wz] = gridToWorld(superCell.centerX, superCell.centerZ);
  const deepListening = superCell.deepListening ?? false;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      ringRef.current.rotation.z = t * (deepListening ? 0.08 : 0.3);
      ringRef.current.position.y = 2 + Math.sin(t * (deepListening ? 0.5 : 2)) * 0.1;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = -t * (deepListening ? 0.04 : 0.15);
    }
  });

  return (
    <group position={[wx, 0, wz]}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2, 0.04, 8, 32]} />
        <meshStandardMaterial
          color={deepListening ? '#6c5ce7' : '#fd79a8'}
          emissive={deepListening ? '#6c5ce7' : '#fd79a8'}
          emissiveIntensity={deepListening ? 0.65 : 0.4}
          transparent
          opacity={0.7}
        />
      </mesh>

      <mesh ref={innerRingRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.4, 0.025, 6, 24]} />
        <meshStandardMaterial
          color="#a29bfe"
          emissive="#a29bfe"
          emissiveIntensity={deepListening ? 0.5 : 0.25}
          transparent
          opacity={0.5}
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