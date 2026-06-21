import { useFrame } from "@react-three/fiber";
import { MeshDistortMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

export default function AICore() {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!mesh.current) return;

    mesh.current.rotation.y += 0.01;

    mesh.current.rotation.x =
      Math.sin(clock.elapsedTime * 0.3) * 0.15;

    mesh.current.position.y =
      Math.sin(clock.elapsedTime) * 0.15;

    const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.08;

    mesh.current.scale.set(s, s, s);
  });

  return (
    // Wrapped in a group to satisfy React's single root element rule
    <group> 
      {/* Outer distorted shape */}
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1, 32]} />

        <MeshDistortMaterial
          color="#00d9ff"
          emissive="#00d9ff"
          emissiveIntensity={10}
          distort={0.35}
          speed={1.5}
          roughness={5}
          metalness={1}
        />
      </mesh>
      
    </group>
  );
}
