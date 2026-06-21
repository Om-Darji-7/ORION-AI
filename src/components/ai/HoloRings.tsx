import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function HoloRings() {
  const group = useRef<THREE.Group>(null!);

  useFrame(() => {
    group.current.rotation.y += 0.004;
  });

  return (
    <group ref={group}>
      {[0,1,2,3].map((i) => (
        <mesh
          key={i}
          rotation={[
            Math.PI / 2,
            i * 0.6,
            0
          ]}
        >
          <torusGeometry
            args={[2.8 + i * 0.25, 0.01, 16, 128]}
          />

          <meshBasicMaterial
            color="#00ffff"
            transparent
            opacity={0.18}
          />
        </mesh>
      ))}
    </group>
  );
}