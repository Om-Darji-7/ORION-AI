import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

export default function OrbitRings() {
  const g = useRef<THREE.Group>(null!);

  const rings = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      radius: 1.6 + (i * (1.3 / 19)), 
      tube: 0.004 + Math.random() * 0.006,
      rotX: Math.random() * Math.PI * 2,
      rotY: Math.random() * Math.PI * 2,
      speedX: (Math.random() - 0.5) * 0.012,
      speedY: (Math.random() - 0.5) * 0.012,
      color: i % 2 === 0 ? "#00ffff" : "#4fd8ff",
      opacity: 0.4 + Math.random() * 0.5,
    }));
  }, []);

  // Removed (state, delta) since they are not needed here
  useFrame(() => {
    if (!g.current) return;
    g.current.rotation.y += 0.002;
    
    g.current.children.forEach((child, idx) => {
      const data = rings[idx];
      if (data) {
        child.rotation.x += data.speedX;
        child.rotation.y += data.speedY;
      }
    });
  });

  return (
    <group ref={g}>
      {rings.map((ring, idx) => (
        <mesh key={idx} rotation={[ring.rotX, ring.rotY, 0]}>
          <torusGeometry args={[ring.radius, ring.tube, 8, 100]} />
          <meshBasicMaterial
            color={ring.color}
            transparent
            opacity={ring.opacity}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}
