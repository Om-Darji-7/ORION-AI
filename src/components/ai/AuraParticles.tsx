import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function AuraParticles() {
  const points = useRef<THREE.Points>(null!);

  const positions = useMemo(() => {
    const count = 2500;
    const arr = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 2 + Math.random() * 1.5;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      arr[i * 3] =
        radius * Math.sin(phi) * Math.cos(theta);

      arr[i * 3 + 1] =
        radius * Math.cos(phi);

      arr[i * 3 + 2] =
        radius * Math.sin(phi) * Math.sin(theta);
    }

    return arr;
  }, []);

  useFrame(({ clock }) => {
    points.current.rotation.y =
      clock.elapsedTime * 0.08;

    points.current.rotation.x =
      Math.sin(clock.elapsedTime * 0.2) * 0.2;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#00ffff"
        size={0.025}
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </points>
  );
}