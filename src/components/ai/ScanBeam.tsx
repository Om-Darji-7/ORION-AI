import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function ScanBeam() {
  const beam = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    beam.current.position.y =
      Math.sin(clock.elapsedTime * 1.5) * 2;
  });

  return (
    <mesh ref={beam}>
      <cylinderGeometry args={[1.5, 1.5, 0.05, 64]} />
      <meshBasicMaterial
        color="#00ffff"
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}