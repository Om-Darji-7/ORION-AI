import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export default function ScannerSweep() {
  // Attach the ref to the Group instead of the Mesh
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    groupRef.current.rotation.z = clock.elapsedTime * 1.5;
  });

  useFrame(({ clock }) => {
  const speed = 3.0; // Higher number = faster rotation
  groupRef.current.rotation.z = clock.elapsedTime * speed;
});


  return (
    <group ref={groupRef}>
      {/* First Arc */}
      <mesh>
        <ringGeometry args={[3.5, 3.65, 128, 1, 0, Math.PI / 4]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* Second Arc (Shifted by 180 degrees / Math.PI) */}
      <mesh>
        <ringGeometry args={[3.5, 3.65, 128, 1, Math.PI, Math.PI / 4]} />
        <meshBasicMaterial color="#00ffff" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
