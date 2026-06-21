import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function EnergyPulse() {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (!mesh.current) return;

    mesh.current.rotation.y += 0.2;
    mesh.current.rotation.x += 0;
    mesh.current.rotation.z += 0;
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1.8, 32, 32]} />

      <meshBasicMaterial
        color="#00ffff"
        transparent
        opacity={0.2}
        wireframe
      />
    </mesh>
  );
}