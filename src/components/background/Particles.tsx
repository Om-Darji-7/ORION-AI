import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function Particles() {
  const points = useRef<THREE.Points>(null!);
  const { mouse } = useThree();

  const positions = useMemo(() => {
    const arr = new Float32Array(22000 * 3);

    for (let i = 0; i < 22000; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }

    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!points.current) return;

    // Slow floating animation
    points.current.rotation.y = clock.elapsedTime * 0.03;
    points.current.rotation.x =
      Math.sin(clock.elapsedTime * 0.2) * 0.08;

    // Mouse interaction
    points.current.rotation.y += mouse.x * 0.002;
    points.current.rotation.x += mouse.y * 0.002;

    points.current.position.x = mouse.x * 0.5;
    points.current.position.y = mouse.y * 0.5;
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
        size={0.03}
        color="#4fd8ff"
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}